#!/usr/bin/env python3
import json
import math
import sys
import urllib.request

try:
    import miniaudio
except Exception as error:  # pragma: no cover
    miniaudio = None
    MINIAUDIO_IMPORT_ERROR = error
else:
    MINIAUDIO_IMPORT_ERROR = None


DEFAULT_THRESHOLD_DBFS = -27
DEFAULT_MIN_SILENCE_MS = 400
DEFAULT_WINDOW_MS = 30
DEFAULT_SMOOTHING_FRAME_RADIUS = 1
DEFAULT_MAX_SPEECH_BRIDGE_MS = 180


def fail(code, message, status_code=502, summary=""):
    payload = {
        "success": False,
        "code": str(code or "cvpc-segment-python-error"),
        "message": str(message or "CVPC 画段后端音频分析失败。"),
        "statusCode": int(status_code or 502),
    }
    if summary:
        payload["summary"] = str(summary)
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()
    raise SystemExit(1)


def normalize_int(value, fallback):
    try:
        return int(round(float(value)))
    except Exception:
        return int(fallback)


def normalize_float(value, fallback):
    try:
        return float(value)
    except Exception:
        return float(fallback)


def rms_to_db(value):
    if not value or value <= 0:
        return -100.0
    return 20.0 * math.log10(value)


def smooth_energies(frame_energies, radius):
    if radius <= 0 or not frame_energies:
        return list(frame_energies)
    result = []
    total_count = len(frame_energies)
    for index in range(total_count):
        start = max(0, index - radius)
        end = min(total_count - 1, index + radius)
        window = frame_energies[start : end + 1]
        result.append(sum(window) / max(1, len(window)))
    return result


def finalize_silent_range(frames, start_index, end_exclusive_index):
    normalized_start = max(0, int(start_index))
    normalized_end = max(normalized_start, int(end_exclusive_index))
    if not frames or normalized_end <= normalized_start or normalized_start >= len(frames):
        return None
    start_frame = frames[normalized_start]
    last_frame = frames[min(len(frames) - 1, normalized_end - 1)]
    next_frame = frames[normalized_end] if normalized_end < len(frames) else None
    end_ms = next_frame["startMs"] if next_frame else last_frame["endMs"]
    if end_ms <= start_frame["startMs"]:
        return None
    return {
        "startMs": int(start_frame["startMs"]),
        "endMs": int(end_ms),
        "startIndex": normalized_start,
        "endExclusiveIndex": normalized_end,
    }


def strip_indexes(range_item):
    return {
        "startMs": int(range_item["startMs"]),
        "endMs": int(range_item["endMs"]),
    }


def expand_silent_range_to_raw_frames(range_item, frames, threshold_dbfs):
    current = range_item or None
    if not current or not frames:
        return None
    start_index = max(0, normalize_int(current.get("startIndex"), 0))
    end_exclusive_index = max(
        start_index, normalize_int(current.get("endExclusiveIndex"), start_index)
    )
    while start_index > 0 and float(frames[start_index - 1].get("rawDbfs", 0.0)) < threshold_dbfs:
        start_index -= 1
    while end_exclusive_index < len(frames) and float(
        frames[end_exclusive_index].get("rawDbfs", 0.0)
    ) < threshold_dbfs:
        end_exclusive_index += 1
    return finalize_silent_range(frames, start_index, end_exclusive_index)


def collect_silent_ranges(frames, threshold_dbfs, min_silence_ms, max_speech_bridge_ms):
    silent_ranges = []
    raw_silent_ranges = []
    current_start_index = None
    bridge_start_index = None
    raw_start_index = None

    for index, frame in enumerate(frames):
        is_silent_frame = float(frame.get("dbfs", 0.0)) < threshold_dbfs
        if is_silent_frame:
            if raw_start_index is None:
                raw_start_index = index
            if current_start_index is None:
                current_start_index = index
            bridge_start_index = None
            continue

        if raw_start_index is not None:
            raw_range = finalize_silent_range(frames, raw_start_index, index)
            if raw_range:
                raw_silent_ranges.append(raw_range)
            raw_start_index = None

        if current_start_index is None:
            continue
        if bridge_start_index is None:
            bridge_start_index = index
            continue
        bridge_duration_ms = frames[index]["endMs"] - frames[bridge_start_index]["startMs"]
        if bridge_duration_ms <= max_speech_bridge_ms:
            continue
        silent_range = finalize_silent_range(frames, current_start_index, bridge_start_index)
        if silent_range:
            silent_ranges.append(silent_range)
        current_start_index = None
        bridge_start_index = None

    if raw_start_index is not None:
        raw_range = finalize_silent_range(frames, raw_start_index, len(frames))
        if raw_range:
            raw_silent_ranges.append(raw_range)

    if current_start_index is not None:
        silent_range = finalize_silent_range(
            frames,
            current_start_index,
            len(frames) if bridge_start_index is None else bridge_start_index,
        )
        if silent_range:
            silent_ranges.append(silent_range)

    normalized_silent_ranges = []
    for range_item in silent_ranges:
        expanded = expand_silent_range_to_raw_frames(range_item, frames, threshold_dbfs)
        if expanded and expanded["endMs"] - expanded["startMs"] >= min_silence_ms:
            normalized_silent_ranges.append(strip_indexes(expanded))

    normalized_raw_ranges = []
    for range_item in raw_silent_ranges:
        if range_item["endMs"] > range_item["startMs"]:
            normalized_raw_ranges.append(strip_indexes(range_item))

    return normalized_silent_ranges, normalized_raw_ranges


def decode_audio_bytes(audio_bytes):
    if miniaudio is None:
        fail(
            "cvpc-segment-python-dependency-missing",
            "缺少 miniaudio 依赖，请执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。",
            503,
            str(MINIAUDIO_IMPORT_ERROR or ""),
        )
    try:
        return miniaudio.decode(audio_bytes)
    except Exception as error:
        fail(
            "cvpc-segment-audio-decode-failed",
            "后端音频解码失败，当前音频可能已过期、不可访问或格式不受支持。",
            502,
            str(error),
        )


def build_frames(decoded, window_ms):
    sample_rate = int(decoded.sample_rate or 16000)
    channel_count = max(1, int(decoded.nchannels or 1))
    sample_width = max(1, int(decoded.sample_width or 2))
    frame_size = max(1, int(round(sample_rate * window_ms / 1000.0)))
    total_frames = max(0, int(decoded.num_frames or 0))
    total_samples = decoded.samples
    normalizer = float(1 << (sample_width * 8 - 1))

    frames = []
    frame_energies = []
    for frame_start in range(0, total_frames, frame_size):
        frame_end = min(total_frames, frame_start + frame_size)
        energy = 0.0
        sample_count = 0
        for sample_index in range(frame_start, frame_end):
            base_index = sample_index * channel_count
            for channel_index in range(channel_count):
                normalized_sample = float(total_samples[base_index + channel_index]) / normalizer
                energy += normalized_sample * normalized_sample
                sample_count += 1
        mean_energy = energy / sample_count if sample_count > 0 else 0.0
        frame_energies.append(mean_energy)
        frames.append(
            {
                "startMs": int(round(frame_start * 1000.0 / sample_rate)),
                "endMs": int(round(frame_end * 1000.0 / sample_rate)),
                "rawDbfs": rms_to_db(math.sqrt(mean_energy)),
                "dbfs": 0.0,
            }
        )

    return frames, frame_energies, sample_rate, channel_count, total_frames


def analyze_audio(payload):
    audio_url = str(payload.get("audioUrl") or "").strip()
    if not audio_url:
        fail("missing-audio-url", "缺少 audioUrl。", 400)

    silence_threshold_dbfs = normalize_int(
        payload.get("silenceThresholdDbfs"), DEFAULT_THRESHOLD_DBFS
    )
    min_silence_ms = max(
        DEFAULT_MIN_SILENCE_MS,
        normalize_int(payload.get("minSilenceMs"), DEFAULT_MIN_SILENCE_MS),
    )
    window_ms = max(10, normalize_int(payload.get("windowMs"), DEFAULT_WINDOW_MS))
    smoothing_frame_radius = max(
        0, normalize_int(payload.get("smoothingFrameRadius"), DEFAULT_SMOOTHING_FRAME_RADIUS)
    )
    max_speech_bridge_ms = max(
        0, normalize_int(payload.get("maxSpeechBridgeMs"), DEFAULT_MAX_SPEECH_BRIDGE_MS)
    )

    try:
        request = urllib.request.Request(
            audio_url,
            headers={
                "User-Agent": "annotation-script-center/segment-audio-client",
            },
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            audio_bytes = response.read()
    except Exception as error:
        fail(
            "cvpc-segment-audio-download-failed",
            "后端下载当前音频失败，请确认平台音频 URL 仍然有效。",
            502,
            str(error),
        )

    decoded = decode_audio_bytes(audio_bytes)
    frames, frame_energies, sample_rate, channel_count, total_frames = build_frames(
        decoded, window_ms
    )
    smoothed_energies = smooth_energies(frame_energies, smoothing_frame_radius)
    for index, energy in enumerate(smoothed_energies):
        frames[index]["dbfs"] = rms_to_db(math.sqrt(max(0.0, float(energy))))

    silent_ranges, raw_silent_ranges = collect_silent_ranges(
        frames,
        float(silence_threshold_dbfs),
        min_silence_ms,
        max_speech_bridge_ms,
    )
    audio_duration_ms = int(round(total_frames * 1000.0 / sample_rate)) if sample_rate > 0 else 0

    return {
        "success": True,
        "audioDurationMs": audio_duration_ms,
        "silentRanges": silent_ranges,
        "analysisMeta": {
            "frameCount": len(frames),
            "rawSilentRangeCount": len(raw_silent_ranges),
            "silentRangeCount": len(silent_ranges),
            "windowMs": window_ms,
            "smoothingFrameRadius": smoothing_frame_radius,
            "maxSpeechBridgeMs": max_speech_bridge_ms,
            "channelCount": channel_count,
            "audioDurationMs": audio_duration_ms,
            "thresholdDbfs": silence_threshold_dbfs,
            "sampleRate": sample_rate,
            "decoder": "miniaudio",
        },
    }


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except Exception as error:
        fail("invalid-json", "请求体 JSON 解析失败。", 400, str(error))

    result = analyze_audio(payload)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
