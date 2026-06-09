(function () {
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/ai/recommend";
  const TARGET_SAMPLE_RATE = 16000;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function toFiniteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getTimerHost() {
    return typeof window !== "undefined" && window ? window : globalThis;
  }

  function normalizeAiStageParams(params) {
    const source = params && typeof params === "object" ? params : {};
    const result = {};
    Object.keys(source).forEach(function (key) {
      const value = source[key];
      if (value === "" || value === null || value === undefined) {
        return;
      }
      result[key] = value;
    });
    return result;
  }

  function normalizeAiStages(aiStages) {
    const source = aiStages && typeof aiStages === "object" ? aiStages : {};
    const result = {};
    ["listen", "refine"].forEach(function (stageKey) {
      const stage = source[stageKey] && typeof source[stageKey] === "object" ? source[stageKey] : null;
      if (!stage) {
        return;
      }
      const normalizedStage = {};
      const model = normalizeText(stage.model);
      const prompt = String(stage.prompt || "");
      const params = normalizeAiStageParams(stage.params);
      if (model) {
        normalizedStage.model = model;
      }
      if (prompt) {
        normalizedStage.prompt = prompt;
      }
      if (Object.keys(params).length > 0) {
        normalizedStage.params = params;
      }
      if (Object.keys(normalizedStage).length > 0) {
        result[stageKey] = normalizedStage;
      }
    });
    return result;
  }

  function requireSelectedRange(selectedRange, selectionKey) {
    const range = selectedRange && typeof selectedRange === "object" ? selectedRange : null;
    if (
      !normalizeText(selectionKey) ||
      !range ||
      !Number.isFinite(Number(range.startMs)) ||
      !Number.isFinite(Number(range.endMs)) ||
      Number(range.endMs) <= Number(range.startMs)
    ) {
      throw new Error("未读取到当前波形选中段的开始/结束时间，请先在左侧选中目标段后重试。");
    }
    return {
      startMs: Math.max(0, Math.round(toFiniteNumber(range.startMs, 0))),
      endMs: Math.max(0, Math.round(toFiniteNumber(range.endMs, 0))),
      durationMs: Math.max(0, Math.round(toFiniteNumber(range.durationMs, Number(range.endMs) - Number(range.startMs)))),
    };
  }

  function encodeWavBuffer(channelData, sampleRate) {
    const pcmLength = channelData.length;
    const buffer = new ArrayBuffer(44 + pcmLength * 2);
    const view = new DataView(buffer);

    function writeAscii(offset, value) {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }

    writeAscii(0, "RIFF");
    view.setUint32(4, 36 + pcmLength * 2, true);
    writeAscii(8, "WAVE");
    writeAscii(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeAscii(36, "data");
    view.setUint32(40, pcmLength * 2, true);

    for (let index = 0; index < pcmLength; index += 1) {
      const value = Math.max(-1, Math.min(1, channelData[index] || 0));
      view.setInt16(
        44 + index * 2,
        value < 0 ? Math.round(value * 0x8000) : Math.round(value * 0x7fff),
        true
      );
    }

    return new Uint8Array(buffer);
  }

  function bytesToBase64(bytes) {
    if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
      return Buffer.from(bytes).toString("base64");
    }
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize));
    }
    if (typeof btoa === "function") {
      return btoa(binary);
    }
    throw new Error("当前环境不支持 base64 编码。");
  }

  async function fetchAudioBuffer(audioUrl) {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error("原始音频下载失败，无法截取当前段。");
    }
    return response.arrayBuffer();
  }

  async function decodeAudioBuffer(arrayBuffer) {
    const AudioContextClass =
      globalThis.AudioContext ||
      globalThis.webkitAudioContext ||
      (typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null);
    if (typeof AudioContextClass !== "function") {
      throw new Error("当前浏览器不支持音频裁剪。");
    }
    const context = new AudioContextClass();
    try {
      return await context.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      if (typeof context.close === "function") {
        context.close().catch(function () {
          return null;
        });
      }
    }
  }

  async function renderSelectedClip(decodedBuffer, selectedRange) {
    const OfflineAudioContextClass =
      globalThis.OfflineAudioContext ||
      globalThis.webkitOfflineAudioContext ||
      (typeof window !== "undefined"
        ? window.OfflineAudioContext || window.webkitOfflineAudioContext
        : null);
    if (typeof OfflineAudioContextClass !== "function") {
      throw new Error("当前浏览器不支持离线音频裁剪。");
    }
    const totalDurationMs = Math.max(0, Math.round(toFiniteNumber(decodedBuffer?.duration, 0) * 1000));
    const startMs = Math.max(0, Math.min(selectedRange.startMs, totalDurationMs));
    const endMs = Math.max(startMs + 1, Math.min(selectedRange.endMs, totalDurationMs || selectedRange.endMs));
    const durationSeconds = Math.max(0.001, (endMs - startMs) / 1000);
    const frameLength = Math.max(1, Math.ceil(durationSeconds * TARGET_SAMPLE_RATE));
    const offline = new OfflineAudioContextClass(1, frameLength, TARGET_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offline.destination);
    source.start(0, startMs / 1000, durationSeconds);
    return offline.startRendering();
  }

  async function createClipBase64(audioUrl, selectedRange) {
    const arrayBuffer = await fetchAudioBuffer(audioUrl);
    const decodedBuffer = await decodeAudioBuffer(arrayBuffer);
    const rendered = await renderSelectedClip(decodedBuffer, selectedRange);
    const wavBytes = encodeWavBuffer(rendered.getChannelData(0), rendered.sampleRate || TARGET_SAMPLE_RATE);
    return bytesToBase64(wavBytes);
  }

  async function createAudioDataUrl(audioUrl, selectedRange) {
    const clipBase64 = await createClipBase64(audioUrl, selectedRange);
    return "data:audio/wav;base64," + clipBase64;
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    const timerHost = getTimerHost();

    async function recommend(context) {
      const source = context && typeof context === "object" ? context : {};
      if (!normalizeText(source.audioUrl)) {
        throw new Error("缺少当前音频 audioUrl。");
      }
      const selectedRange = requireSelectedRange(source.selectedRange, source.selectionKey);
      const audioDataUrl = await createAudioDataUrl(source.audioUrl, selectedRange);
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const body = {
        audioDataUrl: audioDataUrl,
        startMs: selectedRange.startMs,
        endMs: selectedRange.endMs,
        selectionKey: normalizeText(source.selectionKey),
        fieldContext: source.fieldContext || {},
        editorContext: source.editorContext || {},
        aiUsageOperatorName: normalizeText(config.aiUsageOperatorName),
        platformUserName: normalizeText(source.platformUserName),
        platformUserId: normalizeText(source.platformUserId),
        timeoutMs: Number(config.timeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
      };
      const aiStages = normalizeAiStages(config.aiStages);
      if (Object.keys(aiStages).length > 0) {
        body.aiStages = aiStages;
      }
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller
        ? timerHost.setTimeout(function () {
            controller.abort();
          }, body.timeoutMs)
        : null;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller ? controller.signal : undefined,
        });
        const payload = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || !payload || payload.success !== true) {
          throw new Error(payload?.message || "柳州话 AI 推荐失败。");
        }
        return Object.assign({}, payload, {
          selectionKey: body.selectionKey,
        });
      } finally {
        if (timer) {
          timerHost.clearTimeout(timer);
        }
      }
    }

    return {
      recommend,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouAiRecommendation = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
