(function () {
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/segment/preview";
  const DEFAULT_SILENCE_THRESHOLD_DBFS = -27;
  const DEFAULT_SILENCE_THRESHOLD_UNIT = "db";
  const MIN_SILENCE_MS = 400;
  const DEFAULT_CONTEXT_PADDING_MS = 200;
  const PREVIEW_MODE_WHOLE_AUDIO_FALLBACK = "whole-audio-fallback";

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
    return Math.max(0, Math.min(1500, Math.round(numeric)));
  }

  function buildPreviewRequestBody(source, silenceThresholdDbfs, contextPaddingMs) {
    return {
      audioUrl: source.audioUrl,
      rules: {
        silenceThresholdDbfs: silenceThresholdDbfs,
        minSilenceMs: MIN_SILENCE_MS,
        contextPaddingMs: contextPaddingMs,
      },
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
    const meta =
      responsePayload?.meta && typeof responsePayload.meta === "object"
        ? Object.assign({}, responsePayload.meta)
        : {};
    return {
      proposedSegments: Array.isArray(responsePayload?.data?.proposedSegments)
        ? responsePayload.data.proposedSegments
        : [],
      changes: Array.isArray(responsePayload?.data?.changes) ? responsePayload.data.changes : [],
      meta: meta,
      analysisError: normalizeText(source.analysisError),
      analysisMeta:
        source.analysisMeta && typeof source.analysisMeta === "object"
          ? Object.assign({}, source.analysisMeta)
          : meta.analysisMeta && typeof meta.analysisMeta === "object"
            ? Object.assign({}, meta.analysisMeta)
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
      const contextPaddingMs = normalizeContextPaddingMs(config.contextPaddingMs);
      const payload = await requestPreview(
        endpoint,
        buildPreviewRequestBody(source, silenceThresholdDbfs, contextPaddingMs)
      );
      const meta = payload.meta && typeof payload.meta === "object" ? Object.assign({}, payload.meta) : {};
      const rules = meta.rules && typeof meta.rules === "object" ? Object.assign({}, meta.rules) : {};
      rules.silenceThresholdDbfs = silenceThresholdDbfs;
      rules.silenceThresholdUnit = silenceThresholdUnit;
      rules.silenceThresholdValue = convertDbToThresholdDisplayValue(
        silenceThresholdDbfs,
        silenceThresholdUnit
      );
      rules.contextPaddingMs = contextPaddingMs;
      meta.rules = rules;
      lastPreview = finalizePreviewPayload(
        {
          data: payload.data,
          meta: meta,
        },
        source
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
