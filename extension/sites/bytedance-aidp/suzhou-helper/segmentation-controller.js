(function () {
  const DEFAULT_PATH = "/api/bytedance-aidp/suzhou-helper/segment/preview";
  const DEFAULT_SILENCE_THRESHOLD_DBFS = -31;
  const DEFAULT_SILENCE_THRESHOLD_UNIT = "db";
  const MIN_SILENCE_MS = 400;
  const DEFAULT_CONTEXT_PADDING_MS = 300;
  const DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED = true;

  function normalizeText(value) {
    return String(value || "").trim();
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

  function normalizeContextPaddingMs(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULT_CONTEXT_PADDING_MS;
    }
    return Math.max(0, Math.min(500, Math.round(numeric)));
  }

  function normalizeSilenceThresholdDbfs(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULT_SILENCE_THRESHOLD_DBFS;
    }
    return Math.max(-80, Math.min(-5, Math.round(numeric)));
  }

  function normalizeExistingSegments(value) {
    return (Array.isArray(value) ? value : [])
      .map(function (item, index) {
        const source = item && typeof item === "object" ? item : {};
        const startMs = Math.max(0, Math.round(Number(source.startMs || 0) || 0));
        const endMs = Math.max(startMs, Math.round(Number(source.endMs || startMs) || startMs));
        return {
          uniqueId: normalizeText(source.regionId || source.uniqueId || source.id),
          sourceSegmentNumber: Math.max(
            1,
            Math.round(Number(source.segmentNumber || source.sourceSegmentNumber || index + 1) || 1)
          ),
          startMs: startMs,
          endMs: endMs,
        };
      })
      .filter(function (item) {
        return item.endMs > item.startMs;
      });
  }

  function buildPreviewRequestBody(
    source,
    silenceThresholdDbfs,
    contextPaddingMs,
    mergeContiguousSuggestedSegmentsEnabled
  ) {
    const current = source && typeof source === "object" ? source : {};
    const existingSegments = normalizeExistingSegments(
      current.currentSegments || current.existingSegments
    );
    return {
      audioUrl: normalizeText(current.audioUrl),
      audioDurationMs: Math.max(0, Math.round(Number(current.audioDurationMs || 0) || 0)),
      existingSegments: existingSegments,
      segmentScope:
        existingSegments.length > 0 ? "existing-segments-incremental" : "whole-audio-rebuild-preview",
      rules: {
        silenceThresholdDbfs: silenceThresholdDbfs,
        minSilenceMs: MIN_SILENCE_MS,
        contextPaddingMs: contextPaddingMs,
      },
      editorContext: {
        mergeContiguousSuggestedSegmentsEnabled:
          mergeContiguousSuggestedSegmentsEnabled !== false,
      },
    };
  }

  function buildPreviewFetchFailureMessage(rawMessage) {
    const detail = normalizeText(rawMessage);
    const suffix = detail ? "原始错误：" + detail : "原始错误：未知。";
    return "连接分段建议后端失败，请检查 options 首页后端接口地址、后端服务状态或当前网络后重试。 " + suffix;
  }

  async function requestPreview(fetchImpl, endpoint, payload) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      throw new Error(
        buildPreviewFetchFailureMessage(fetchError && fetchError.message ? fetchError.message : fetchError)
      );
    }
    const responsePayload = await response.json().catch(function () {
      return null;
    });
    if (!response.ok || !responsePayload || responsePayload.success !== true) {
      throw new Error(responsePayload?.message || "画段建议生成失败。");
    }
    return responsePayload;
  }

  function finalizePreviewPayload(payload, context, silenceThresholdDbfs, silenceThresholdUnit, contextPaddingMs) {
    const source = context && typeof context === "object" ? context : {};
    const responsePayload = payload && typeof payload === "object" ? payload : {};
    const meta =
      responsePayload?.meta && typeof responsePayload.meta === "object"
        ? Object.assign({}, responsePayload.meta)
        : {};
    meta.rules = Object.assign({}, meta.rules || {}, {
      silenceThresholdDbfs: silenceThresholdDbfs,
      silenceThresholdUnit: silenceThresholdUnit,
      silenceThresholdValue: convertDbToThresholdDisplayValue(
        silenceThresholdDbfs,
        silenceThresholdUnit
      ),
      contextPaddingMs: contextPaddingMs,
    });
    return {
      proposedSegments: Array.isArray(responsePayload?.data?.proposedSegments)
        ? responsePayload.data.proposedSegments
        : [],
      changes: Array.isArray(responsePayload?.data?.changes) ? responsePayload.data.changes : [],
      meta: meta,
      selectionKey: normalizeText(source.selectionKey),
      sourceSegments: Array.isArray(source.currentSegments)
        ? source.currentSegments.map(function (item) {
            return Object.assign({}, item);
          })
        : [],
    };
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    const fetchImpl = typeof config.fetch === "function" ? config.fetch : globalThis.fetch;
    let lastPreview = null;

    async function preview(context) {
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const silenceThresholdDbfs = normalizeSilenceThresholdDbfs(config.silenceThresholdDbfs);
      const silenceThresholdUnit = normalizeThresholdUnit(config.silenceThresholdUnit);
      const contextPaddingMs = normalizeContextPaddingMs(config.contextPaddingMs);
      const mergeContiguousSuggestedSegmentsEnabled =
        config.mergeContiguousSuggestedSegmentsEnabled === false
          ? false
          : DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED;
      const payload = await requestPreview(
        fetchImpl,
        endpoint,
        buildPreviewRequestBody(
          context,
          silenceThresholdDbfs,
          contextPaddingMs,
          mergeContiguousSuggestedSegmentsEnabled
        )
      );
      lastPreview = finalizePreviewPayload(
        payload,
        context,
        silenceThresholdDbfs,
        silenceThresholdUnit,
        contextPaddingMs
      );
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

  globalThis.ASREdgeBytedanceAidpSuzhouSegmentation = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
