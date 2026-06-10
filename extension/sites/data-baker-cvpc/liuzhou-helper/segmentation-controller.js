(function () {
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/segment/preview";
  const DEFAULT_SILENCE_THRESHOLD_DBFS = -27;
  const DEFAULT_SILENCE_THRESHOLD_UNIT = "db";
  const DEFAULT_SEGMENT_SCOPE = "existing-segments-incremental";
  const WHOLE_AUDIO_REBUILD_SCOPE = "whole-audio-rebuild-preview";
  const PREVIEW_MODE_WHOLE_AUDIO_FALLBACK = "whole-audio-fallback";
  const MIN_SILENCE_MS = 400;
  const CONTEXT_PADDING_MS = 100;
  const WINDOW_MS = 30;
  const SMOOTHING_FRAME_RADIUS = 1;
  const MAX_SPEECH_BRIDGE_MS = 180;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function rmsToDb(value) {
    if (!value || value <= 0) {
      return -100;
    }
    return 20 * Math.log10(value);
  }

  function normalizeThresholdUnit(value) {
    const normalized = normalizeText(value).toLowerCase();
    if (normalized === "ratio" || normalized === "value") {
      return normalized;
    }
    return DEFAULT_SILENCE_THRESHOLD_UNIT;
  }

  function convertDbToThresholdDisplayValue(dbfs, unit) {
    const normalizedUnit = normalizeThresholdUnit(unit);
    if (normalizedUnit === "ratio") {
      return Number((100 * Math.pow(10, dbfs / 20)).toFixed(2));
    }
    if (normalizedUnit === "value") {
      return Math.max(1, Math.round(32768 * Math.pow(10, dbfs / 20)));
    }
    return Math.round(Number(dbfs) || DEFAULT_SILENCE_THRESHOLD_DBFS);
  }

  function buildPreviewRequestBody(source, silentRanges, silenceThresholdDbfs, segmentScope) {
    return {
      audioUrl: source.audioUrl,
      audioDurationMs: source.audioDurationMs,
      editorContext: source.editorContext || {},
      existingSegments: source.currentSegments || [],
      silentRanges: silentRanges,
      rules: {
        silenceThresholdDbfs: silenceThresholdDbfs,
        minSilenceMs: MIN_SILENCE_MS,
        contextPaddingMs: CONTEXT_PADDING_MS,
      },
      segmentScope: normalizeText(segmentScope) || DEFAULT_SEGMENT_SCOPE,
    };
  }

  async function requestPreview(endpoint, payload) {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const responsePayload = await response.json().catch(function () {
      return null;
    });
    if (!response.ok || !responsePayload || responsePayload.success !== true) {
      throw new Error(responsePayload?.message || "画段建议生成失败。");
    }
    return responsePayload;
  }

  function finalizePreviewPayload(payload, context) {
    const source = context && typeof context === "object" ? context : {};
    const responsePayload = payload && typeof payload === "object" ? payload : {};
    return {
      proposedSegments: Array.isArray(responsePayload?.data?.proposedSegments)
        ? responsePayload.data.proposedSegments
        : [],
      changes: Array.isArray(responsePayload?.data?.changes) ? responsePayload.data.changes : [],
      meta:
        responsePayload?.meta && typeof responsePayload.meta === "object"
          ? Object.assign({}, responsePayload.meta)
          : {},
      analysisError: normalizeText(source.analysisError),
      analysisMeta:
        source.analysisMeta && typeof source.analysisMeta === "object"
          ? Object.assign({}, source.analysisMeta)
          : null,
      selectionKey: normalizeText(source.selectionKey),
      selectedEntryName: normalizeText(
        source.selectedEntry?.name || source.editorContext?.selectedEntry?.name
      ),
      sourceSegments: Array.isArray(source.currentSegments)
        ? source.currentSegments.map(function (item) {
            return Object.assign({}, item);
          })
        : [],
    };
  }

  function getAudioChannels(buffer) {
    const channelCount = Math.max(1, Math.round(Number(buffer?.numberOfChannels || 1)) || 1);
    const channels = [];
    for (let index = 0; index < channelCount; index += 1) {
      try {
        const channel = buffer.getChannelData(index);
        if (channel && Number(channel.length) > 0) {
          channels.push(channel);
        }
      } catch (_error) {
        if (index === 0) {
          throw _error;
        }
      }
    }
    if (channels.length > 0) {
      return channels;
    }
    return [buffer.getChannelData(0)];
  }

  function smoothFrameEnergy(frameEnergies, radius) {
    const source = Array.isArray(frameEnergies) ? frameEnergies : [];
    const smoothingRadius = Math.max(0, Math.round(Number(radius || 0)) || 0);
    if (source.length === 0 || smoothingRadius <= 0) {
      return source.slice();
    }
    return source.map(function (_value, index) {
      let total = 0;
      let count = 0;
      const start = Math.max(0, index - smoothingRadius);
      const end = Math.min(source.length - 1, index + smoothingRadius);
      for (let frameIndex = start; frameIndex <= end; frameIndex += 1) {
        total += Number(source[frameIndex] || 0);
        count += 1;
      }
      return count > 0 ? total / count : 0;
    });
  }

  function finalizeSilentRange(frames, startIndex, endExclusiveIndex) {
    const source = Array.isArray(frames) ? frames : [];
    const normalizedStart = Math.max(0, Math.round(Number(startIndex || 0)) || 0);
    const normalizedEnd = Math.max(
      normalizedStart,
      Math.round(Number(endExclusiveIndex || 0)) || 0
    );
    if (source.length === 0 || normalizedEnd <= normalizedStart || normalizedStart >= source.length) {
      return null;
    }
    const lastFrame = source[Math.min(source.length - 1, normalizedEnd - 1)];
    const nextFrame = normalizedEnd < source.length ? source[normalizedEnd] : null;
    const startFrame = source[normalizedStart];
    const endMs = nextFrame ? nextFrame.startMs : lastFrame?.endMs;
    if (!startFrame || !Number.isFinite(endMs) || endMs <= startFrame.startMs) {
      return null;
    }
    return {
      startMs: startFrame.startMs,
      endMs: endMs,
      startIndex: normalizedStart,
      endExclusiveIndex: normalizedEnd,
    };
  }

  function stripSilentRangeIndexes(range) {
    return {
      startMs: range.startMs,
      endMs: range.endMs,
    };
  }

  function expandSilentRangeToRawFrames(range, frames, silenceThresholdDbfs) {
    const source = Array.isArray(frames) ? frames : [];
    const current = range && typeof range === "object" ? range : null;
    if (!current || source.length === 0) {
      return null;
    }
    let startIndex = Math.max(0, Math.round(Number(current.startIndex || 0)) || 0);
    let endExclusiveIndex = Math.max(
      startIndex,
      Math.round(Number(current.endExclusiveIndex || 0)) || 0
    );
    while (
      startIndex > 0 &&
      Number(source[startIndex - 1]?.rawDbfs || 0) < silenceThresholdDbfs
    ) {
      startIndex -= 1;
    }
    while (
      endExclusiveIndex < source.length &&
      Number(source[endExclusiveIndex]?.rawDbfs || 0) < silenceThresholdDbfs
    ) {
      endExclusiveIndex += 1;
    }
    return finalizeSilentRange(source, startIndex, endExclusiveIndex);
  }

  function collectSilentRanges(frames, silenceThresholdDbfs) {
    const source = Array.isArray(frames) ? frames : [];
    const silentRanges = [];
    const rawSilentRanges = [];
    let currentStartIndex = null;
    let bridgeStartIndex = null;
    let rawStartIndex = null;

    source.forEach(function (frame, index) {
      const isSilentFrame = Number(frame?.dbfs || 0) < silenceThresholdDbfs;
      if (isSilentFrame) {
        if (rawStartIndex === null) {
          rawStartIndex = index;
        }
        if (currentStartIndex === null) {
          currentStartIndex = index;
        }
        bridgeStartIndex = null;
        return;
      }

      if (rawStartIndex !== null) {
        const rawRange = finalizeSilentRange(source, rawStartIndex, index);
        if (rawRange) {
          rawSilentRanges.push(rawRange);
        }
        rawStartIndex = null;
      }

      if (currentStartIndex === null) {
        return;
      }
      if (bridgeStartIndex === null) {
        bridgeStartIndex = index;
        return;
      }
      const bridgeDurationMs = source[index].endMs - source[bridgeStartIndex].startMs;
      if (bridgeDurationMs <= MAX_SPEECH_BRIDGE_MS) {
        return;
      }
      const silentRange = finalizeSilentRange(source, currentStartIndex, bridgeStartIndex);
      if (silentRange) {
        silentRanges.push(silentRange);
      }
      currentStartIndex = null;
      bridgeStartIndex = null;
    });

    if (rawStartIndex !== null) {
      const rawRange = finalizeSilentRange(source, rawStartIndex, source.length);
      if (rawRange) {
        rawSilentRanges.push(rawRange);
      }
    }
    if (currentStartIndex !== null) {
      const silentRange = finalizeSilentRange(
        source,
        currentStartIndex,
        bridgeStartIndex === null ? source.length : bridgeStartIndex
      );
      if (silentRange) {
        silentRanges.push(silentRange);
      }
    }

    return {
      silentRanges: silentRanges
        .map(function (range) {
          return expandSilentRangeToRawFrames(range, source, silenceThresholdDbfs);
        })
        .filter(function (range) {
          return range && range.endMs - range.startMs >= MIN_SILENCE_MS;
        })
        .map(stripSilentRangeIndexes),
      rawSilentRanges: rawSilentRanges
        .filter(function (range) {
          return range.endMs > range.startMs;
        })
        .map(stripSilentRangeIndexes),
    };
  }

  async function analyzeSilenceRanges(audioUrl, silenceThresholdDbfs) {
    if (!normalizeText(audioUrl)) {
      return {
        silentRanges: [],
        analysisMeta: {
          frameCount: 0,
          rawSilentRangeCount: 0,
          silentRangeCount: 0,
          windowMs: WINDOW_MS,
          smoothingFrameRadius: SMOOTHING_FRAME_RADIUS,
          maxSpeechBridgeMs: MAX_SPEECH_BRIDGE_MS,
          channelCount: 0,
        },
      };
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioContextClass !== "function") {
      return {
        silentRanges: [],
        analysisMeta: {
          frameCount: 0,
          rawSilentRangeCount: 0,
          silentRangeCount: 0,
          windowMs: WINDOW_MS,
          smoothingFrameRadius: SMOOTHING_FRAME_RADIUS,
          maxSpeechBridgeMs: MAX_SPEECH_BRIDGE_MS,
          channelCount: 0,
        },
      };
    }
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error("音频下载失败，无法分析静音段。");
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContextClass();
    try {
      const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const channels = getAudioChannels(buffer);
      const sampleRate = buffer.sampleRate || 16000;
      const frameSize = Math.max(1, Math.round((sampleRate * WINDOW_MS) / 1000));
      const totalSamples = Math.max(
        0,
        channels.reduce(function (max, channel) {
          return Math.max(max, Number(channel?.length || 0) || 0);
        }, 0)
      );
      const frameEnergies = [];
      const frames = [];
      for (let offset = 0; offset < totalSamples; offset += frameSize) {
        let energy = 0;
        let sampleCount = 0;
        const end = Math.min(totalSamples, offset + frameSize);
        for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
          const channel = channels[channelIndex];
          const channelEnd = Math.min(end, Number(channel?.length || 0) || 0);
          for (let index = offset; index < channelEnd; index += 1) {
            energy += channel[index] * channel[index];
            sampleCount += 1;
          }
        }
        frameEnergies.push(sampleCount > 0 ? energy / sampleCount : 0);
        frames.push({
          startMs: Math.round((offset / sampleRate) * 1000),
          endMs: Math.round((end / sampleRate) * 1000),
          rawDbfs: rmsToDb(Math.sqrt(sampleCount > 0 ? energy / sampleCount : 0)),
          dbfs: 0,
        });
      }
      const smoothedFrameEnergies = smoothFrameEnergy(frameEnergies, SMOOTHING_FRAME_RADIUS);
      smoothedFrameEnergies.forEach(function (value, index) {
        if (!frames[index]) {
          return;
        }
        frames[index].dbfs = rmsToDb(Math.sqrt(Math.max(0, Number(value) || 0)));
      });
      const detection = collectSilentRanges(frames, silenceThresholdDbfs);
      return {
        silentRanges: detection.silentRanges,
        analysisMeta: {
          frameCount: frames.length,
          rawSilentRangeCount: detection.rawSilentRanges.length,
          silentRangeCount: detection.silentRanges.length,
          windowMs: WINDOW_MS,
          smoothingFrameRadius: SMOOTHING_FRAME_RADIUS,
          maxSpeechBridgeMs: MAX_SPEECH_BRIDGE_MS,
          channelCount: channels.length,
          audioDurationMs: Math.round((totalSamples / sampleRate) * 1000),
          thresholdDbfs: silenceThresholdDbfs,
        },
      };
    } finally {
      if (typeof audioContext.close === "function") {
        audioContext.close().catch(function () {
          return null;
        });
      }
    }
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    let lastPreview = null;

    async function preview(context) {
      const source = context && typeof context === "object" ? context : {};
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const silenceThresholdDbfs = Number.isFinite(Number(config.silenceThresholdDbfs))
        ? Math.round(Number(config.silenceThresholdDbfs))
        : DEFAULT_SILENCE_THRESHOLD_DBFS;
      const silenceThresholdUnit = normalizeThresholdUnit(config.silenceThresholdUnit);
      let silentRanges = [];
      let analysisMeta = null;
      let analysisError = "";
      try {
        const analysisResult = await analyzeSilenceRanges(source.audioUrl, silenceThresholdDbfs);
        silentRanges = Array.isArray(analysisResult?.silentRanges) ? analysisResult.silentRanges : [];
        analysisMeta =
          analysisResult?.analysisMeta && typeof analysisResult.analysisMeta === "object"
            ? Object.assign({}, analysisResult.analysisMeta)
            : null;
      } catch (error) {
        analysisError = error && error.message ? error.message : String(error);
      }
      const incrementalRequestBody = buildPreviewRequestBody(
        source,
        silentRanges,
        silenceThresholdDbfs,
        DEFAULT_SEGMENT_SCOPE
      );
      const incrementalPayload = await requestPreview(endpoint, incrementalRequestBody);
      const shouldTriggerWholeAudioFallback =
        Array.isArray(source.currentSegments) &&
        source.currentSegments.length > 0 &&
        Array.isArray(incrementalPayload?.data?.changes) &&
        incrementalPayload.data.changes.length === 0 &&
        Number(analysisMeta?.silentRangeCount || 0) > 0;
      let payload = incrementalPayload;
      if (shouldTriggerWholeAudioFallback) {
        const fallbackPayload = await requestPreview(
          endpoint,
          buildPreviewRequestBody(
            source,
            silentRanges,
            silenceThresholdDbfs,
            WHOLE_AUDIO_REBUILD_SCOPE
          )
        );
        payload = Object.assign({}, fallbackPayload, {
          meta: Object.assign({}, fallbackPayload?.meta || {}, {
            fallbackTriggered: true,
            incrementalEmptyReason: normalizeText(incrementalPayload?.meta?.emptyReason),
          }),
        });
      }
      const meta = payload.meta && typeof payload.meta === "object" ? Object.assign({}, payload.meta) : {};
      const rules = meta.rules && typeof meta.rules === "object" ? Object.assign({}, meta.rules) : {};
      rules.silenceThresholdDbfs = silenceThresholdDbfs;
      rules.silenceThresholdUnit = silenceThresholdUnit;
      rules.silenceThresholdValue = convertDbToThresholdDisplayValue(
        silenceThresholdDbfs,
        silenceThresholdUnit
      );
      meta.rules = rules;
      lastPreview = finalizePreviewPayload(
        {
          data: payload.data,
          meta: meta,
        },
        Object.assign({}, source, {
          analysisError: analysisError,
          analysisMeta: analysisMeta,
        })
      );
      if (
        normalizeText(lastPreview?.meta?.previewMode) === PREVIEW_MODE_WHOLE_AUDIO_FALLBACK &&
        lastPreview?.meta
      ) {
        lastPreview.meta.applyAllowed = false;
      }
      return lastPreview;
    }

    function getLastPreview() {
      return lastPreview;
    }

    function clearPreview() {
      lastPreview = null;
    }

    return {
      preview,
      getLastPreview,
      clearPreview,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouSegmentation = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
