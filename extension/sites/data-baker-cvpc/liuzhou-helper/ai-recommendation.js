(function () {
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/ai/recommend";
  const TARGET_SAMPLE_RATE = 16000;
  const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || {};
  const buildAiUsageRequestMeta =
    typeof aiUsageMeta.buildAiUsageRequestMeta === "function"
      ? aiUsageMeta.buildAiUsageRequestMeta
      : function (input) {
          const source = input && typeof input === "object" ? input : {};
          return {
            aiUsageOperatorName: normalizeText(
              source.settings?.meta?.aiUsageOperatorName || source.aiUsageOperatorName
            ).slice(0, 40),
            platformUserName: normalizeText(source.platformUserName).slice(0, 80),
            platformUserId: normalizeText(source.platformUserId).slice(0, 120),
          };
        };
  const appendAiUsageRequestMeta =
    typeof aiUsageMeta.appendAiUsageRequestMeta === "function"
      ? aiUsageMeta.appendAiUsageRequestMeta
      : function (payload, requestMeta) {
          return Object.assign({}, payload || {}, {
            aiUsageOperatorName: normalizeText(requestMeta?.aiUsageOperatorName).slice(0, 40),
            platformUserName: normalizeText(requestMeta?.platformUserName).slice(0, 80),
            platformUserId: normalizeText(requestMeta?.platformUserId).slice(0, 120),
          });
        };
  const assertAiUsageOperatorConfigured =
    typeof aiUsageMeta.assertAiUsageOperatorConfigured === "function"
      ? aiUsageMeta.assertAiUsageOperatorConfigured
      : function (requestMeta) {
          if (!normalizeText(requestMeta?.aiUsageOperatorName)) {
            const error = new Error("请先在 options 首页填写 AI 调用使用人。");
            error.code = "missing-ai-usage-operator-name";
            throw error;
          }
          return requestMeta;
        };

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

  function buildFetchFailureMessage(rawMessage) {
    const detail = normalizeText(rawMessage);
    const suffix = detail ? "原始错误：" + detail : "原始错误：未知。";
    return "连接 AI 后端失败，请检查 options 首页后端接口地址、后端服务状态或当前网络后重试。 " + suffix;
  }

  function createFetchFailureError(rawError) {
    const detail = rawError && rawError.message ? rawError.message : String(rawError || "Failed to fetch");
    const message = buildFetchFailureMessage(detail);
    const error = new Error(message);
    error.code = "ai-backend-fetch-failed";
    error.payload = {
      success: false,
      code: "ai-backend-fetch-failed",
      message: message,
      rawResponse: {
        fetchError: detail,
      },
    };
    return error;
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
      if (stage.includeLexiconReference === true || stage.includeLexiconReference === false) {
        normalizedStage.includeLexiconReference = stage.includeLexiconReference === true;
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
      throw new Error("当前音频访问已失效，通常是页面 session 已过期；请刷新页面后重试。");
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

  function normalizeSelectedRange(source) {
    if (source && typeof source === "object" && source.selectedRange && typeof source.selectedRange === "object") {
      return requireSelectedRange(source.selectedRange, source.selectionKey);
    }
    return requireSelectedRange(
      {
        startMs: source?.startMs,
        endMs: source?.endMs,
        durationMs: source?.durationMs,
      },
      source?.selectionKey || "batch-segment"
    );
  }

  function createSharedAudioSource(audioUrl) {
    const normalizedAudioUrl = normalizeText(audioUrl);
    if (!normalizedAudioUrl) {
      throw new Error("缺少当前音频 audioUrl。");
    }
    let audioBufferPromise = null;
    let decodedBufferPromise = null;
    return {
      audioUrl: normalizedAudioUrl,
      getAudioBuffer: function () {
        if (!audioBufferPromise) {
          audioBufferPromise = fetchAudioBuffer(normalizedAudioUrl);
        }
        return audioBufferPromise;
      },
      getDecodedBuffer: function () {
        if (!decodedBufferPromise) {
          decodedBufferPromise = this.getAudioBuffer().then(function (arrayBuffer) {
            return decodeAudioBuffer(arrayBuffer);
          });
        }
        return decodedBufferPromise;
      },
    };
  }

  async function createAudioDataUrlFromSharedSource(sharedAudioSource, selectedRange) {
    const decodedBuffer = await sharedAudioSource.getDecodedBuffer();
    const rendered = await renderSelectedClip(decodedBuffer, selectedRange);
    const wavBytes = encodeWavBuffer(rendered.getChannelData(0), rendered.sampleRate || TARGET_SAMPLE_RATE);
    return "data:audio/wav;base64," + bytesToBase64(wavBytes);
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    const timerHost = getTimerHost();
    let lexiconWarningChecked = false;

    function buildHealthEndpoint(endpoint) {
      const text = normalizeText(endpoint);
      if (!text) {
        return "";
      }
      return /\/health$/i.test(text) ? text : text.replace(/\/+$/, "") + "/health";
    }

    function readLexiconWarning(body) {
      const source = body && typeof body === "object" ? body : {};
      const reference = source.reference && typeof source.reference === "object" ? source.reference : {};
      if (normalizeText(reference.lexiconStatus) !== "reference_only") {
        return "";
      }
      return normalizeText(reference.lexiconWarning);
    }

    async function notifyLexiconWarning() {
      if (lexiconWarningChecked) {
        return false;
      }
      lexiconWarningChecked = true;
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const healthEndpoint = buildHealthEndpoint(endpoint);
      if (!healthEndpoint) {
        return false;
      }
      try {
        const response = await fetch(healthEndpoint, {
          method: "GET",
          credentials: "omit",
        });
        const payload = await response.json().catch(function () {
          return null;
        });
        const warningMessage = readLexiconWarning(payload);
        if (!warningMessage) {
          return false;
        }
        return globalThis.ASREdgeLexiconToast?.show?.(warningMessage, "warn", 1000) === true;
      } catch (_error) {
        return false;
      }
    }

    function buildRecommendBody(source, selectedRange, audioDataUrl) {
      const requestMeta = assertAiUsageOperatorConfigured(
        buildAiUsageRequestMeta({
          settings: config.settings || {
            meta: {
              aiUsageOperatorName: config.aiUsageOperatorName,
            },
          },
          aiUsageOperatorName: config.aiUsageOperatorName,
          platformUserName: source.platformUserName,
          platformUserId: source.platformUserId,
        })
      );
      const body = appendAiUsageRequestMeta(
        {
          audioDataUrl: audioDataUrl,
          startMs: selectedRange.startMs,
          endMs: selectedRange.endMs,
          selectionKey: normalizeText(source.selectionKey),
          fieldContext: source.fieldContext || {},
          editorContext: source.editorContext || {},
          timeoutMs: Number(config.timeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
        },
        requestMeta
      );
      const aiStages = normalizeAiStages(config.aiStages);
      if (Object.keys(aiStages).length > 0) {
        body.aiStages = aiStages;
      }
      return body;
    }

    async function postRecommendation(source, selectedRange, audioDataUrl) {
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const body = buildRecommendBody(source, selectedRange, audioDataUrl);
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller
        ? timerHost.setTimeout(function () {
            controller.abort();
          }, body.timeoutMs)
        : null;
      try {
        let response;
        try {
          response = await fetch(endpoint, {
            method: "POST",
            credentials: "omit",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: controller ? controller.signal : undefined,
          });
        } catch (fetchError) {
          throw createFetchFailureError(fetchError);
        }
        const payload = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || !payload || payload.success !== true) {
          const error = new Error(payload?.message || "柳州话 AI 推荐失败。");
          if (payload && typeof payload === "object") {
            error.payload = payload;
            if (payload.requestId) {
              error.requestId = payload.requestId;
            }
            if (payload.code) {
              error.code = payload.code;
            }
          }
          throw error;
        }
        return Object.assign({}, payload, {
          selectionKey: body.selectionKey,
          segmentNumber: Number(source.segmentNumber || 0) || undefined,
          uniqueId: normalizeText(source.uniqueId || source.unique_id),
        });
      } finally {
        if (timer) {
          timerHost.clearTimeout(timer);
        }
      }
    }

    async function recommendForSegment(context, sharedAudioSource) {
      const source = context && typeof context === "object" ? context : {};
      if (!normalizeText(source.audioUrl)) {
        throw new Error("缺少当前音频 audioUrl。");
      }
      const selectedRange = normalizeSelectedRange(source);
      const sharedSource =
        sharedAudioSource && typeof sharedAudioSource.getDecodedBuffer === "function"
          ? sharedAudioSource
          : createSharedAudioSource(source.audioUrl);
      const audioDataUrl = await createAudioDataUrlFromSharedSource(sharedSource, selectedRange);
      return postRecommendation(source, selectedRange, audioDataUrl);
    }

    async function recommend(context) {
      const source = context && typeof context === "object" ? context : {};
      if (!normalizeText(source.audioUrl)) {
        throw new Error("缺少当前音频 audioUrl。");
      }
      const selectedRange = normalizeSelectedRange(source);
      const audioDataUrl = await createAudioDataUrl(source.audioUrl, selectedRange);
      return postRecommendation(source, selectedRange, audioDataUrl);
    }

    return {
      createSharedAudioSource,
      notifyLexiconWarning,
      recommend,
      recommendForSegment,
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
