(function () {
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/segment/preview";
  const DEFAULT_SILENCE_THRESHOLD_DBFS = -40;
  const MIN_SILENCE_MS = 400;
  const CONTEXT_PADDING_MS = 100;
  const WINDOW_MS = 30;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function rmsToDb(value) {
    if (!value || value <= 0) {
      return -100;
    }
    return 20 * Math.log10(value);
  }

  async function analyzeSilenceRanges(audioUrl, silenceThresholdDbfs) {
    if (!normalizeText(audioUrl)) {
      return [];
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioContextClass !== "function") {
      return [];
    }
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error("音频下载失败，无法分析静音段。");
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContextClass();
    try {
      const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const channel = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate || 16000;
      const frameSize = Math.max(1, Math.round((sampleRate * WINDOW_MS) / 1000));
      const ranges = [];
      let currentStart = null;
      for (let offset = 0; offset < channel.length; offset += frameSize) {
        let energy = 0;
        const end = Math.min(channel.length, offset + frameSize);
        for (let index = offset; index < end; index += 1) {
          energy += channel[index] * channel[index];
        }
        const rms = Math.sqrt(energy / Math.max(1, end - offset));
        const db = rmsToDb(rms);
        const frameStartMs = Math.round((offset / sampleRate) * 1000);
        const frameEndMs = Math.round((end / sampleRate) * 1000);
        if (db < silenceThresholdDbfs) {
          if (currentStart === null) {
            currentStart = frameStartMs;
          }
        } else if (currentStart !== null) {
          ranges.push({
            startMs: currentStart,
            endMs: frameStartMs,
          });
          currentStart = null;
        }
      }
      if (currentStart !== null) {
        ranges.push({
          startMs: currentStart,
          endMs: Math.round((channel.length / sampleRate) * 1000),
        });
      }
      return ranges;
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
      let silentRanges = [];
      let analysisError = "";
      try {
        silentRanges = await analyzeSilenceRanges(source.audioUrl, silenceThresholdDbfs);
      } catch (error) {
        analysisError = error && error.message ? error.message : String(error);
      }
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          segmentScope: "existing-segments-incremental",
        }),
      });
      const payload = await response.json().catch(function () {
        return null;
      });
      if (!response.ok || !payload || payload.success !== true) {
        throw new Error(payload?.message || "画段建议生成失败。");
      }
      lastPreview = {
        proposedSegments: Array.isArray(payload?.data?.proposedSegments)
          ? payload.data.proposedSegments
          : [],
        changes: Array.isArray(payload?.data?.changes) ? payload.data.changes : [],
        meta: payload.meta || {},
        analysisError: analysisError,
        selectionKey: normalizeText(source.selectionKey),
        selectedEntryName: normalizeText(source.selectedEntry?.name || source.editorContext?.selectedEntry?.name),
        sourceSegments: Array.isArray(source.currentSegments)
          ? source.currentSegments.map(function (item) {
              return Object.assign({}, item);
            })
          : [],
      };
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
