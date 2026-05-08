(function () {
  const STORAGE_KEY =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.STORAGE_KEY) || "asrEdgeSettings";
  const PROJECT_ID =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.TRANSCRIPTION_PROJECT_ID) ||
    "transcription";
  const STATS_SERVER_ENDPOINT =
    (globalThis.ASREdgeConstants &&
      globalThis.ASREdgeConstants.TRANSCRIPTION_STATS_SERVER_ENDPOINT) ||
    "https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload";
  const STATS_LOCAL_ENDPOINT =
    (globalThis.ASREdgeConstants &&
      globalThis.ASREdgeConstants.TRANSCRIPTION_STATS_LOCAL_ENDPOINT) ||
    "http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload";

  const FIXED_DEFAULTS = {
    autoPlay: false,
    playbackRateValue: 1,
    resetRateValue: 1,
    rateStepValue: 0.1,
    seekStepSeconds: 1,
    volumeValue: 100,
    fillOnValid: true,
    clearOnInvalid: true,
    defaultValid: false,
    customReplacements: [],
    customRates: [],
  };
  const FIXED_STATS_DEFAULTS = {
    statsUploadEnabled: true,
    statsUploadEndpoint: STATS_SERVER_ENDPOINT,
    statsUploadTimes: ["10:00", "16:00"],
    statsUploadJitterMinutes: 10,
    statsAutoUploadOnSchedule: true,
    statsUploadRequestTimeoutMs: 20000,
  };

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function toNumber(value, fallback, min, max, precision) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    const bounded = Math.max(min, Math.min(max, numeric));
    return typeof precision === "number" ? Number(bounded.toFixed(precision)) : bounded;
  }

  function normalizeRuntimeConfig(config) {
    const source = config && typeof config === "object" ? config : {};
    return {
      autoPlay: source.autoPlay === true,
      playbackRateValue: toNumber(source.playbackRateValue, 1, 0.25, 5, 2),
      resetRateValue: toNumber(source.resetRateValue, 1, 0.25, 5, 2),
      rateStepValue: toNumber(source.rateStepValue, 0.1, 0.01, 2, 2),
      seekStepSeconds: toNumber(source.seekStepSeconds, 1, 0.1, 10, 2),
      volumeValue: toNumber(source.volumeValue, 100, 0, 1000, 0),
      fillOnValid: source.fillOnValid !== false,
      clearOnInvalid: source.clearOnInvalid !== false,
      defaultValid: source.defaultValid === true,
      customReplacements: Array.isArray(source.customReplacements) ? clone(source.customReplacements) : [],
      customRates: Array.isArray(source.customRates) ? clone(source.customRates) : [],
    };
  }

  function normalizeStatsConfig(config) {
    const source = config && typeof config === "object" ? config : {};
    const endpointText = String(source.statsUploadEndpoint || "").trim();
    let endpoint = STATS_SERVER_ENDPOINT;
    if (endpointText.indexOf("127.0.0.1:3333") >= 0 || endpointText.indexOf("localhost:3333") >= 0) {
      endpoint = STATS_LOCAL_ENDPOINT;
    } else if (
      endpointText.indexOf("/api/alibaba-labelx/asr-transcription/statistics/upload") >= 0 ||
      endpointText.indexOf("/api/asr-transcription/statistics/upload") >= 0
    ) {
      endpoint = endpointText;
    }

    const timesSource = Array.isArray(source.statsUploadTimes)
      ? source.statsUploadTimes
      : FIXED_STATS_DEFAULTS.statsUploadTimes;
    const times = timesSource
      .map(function (item) {
        const text = String(item || "").trim();
        const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
        if (!match) {
          return "";
        }
        return String(Number(match[1])).padStart(2, "0") + ":" + match[2];
      })
      .filter(Boolean);

    return {
      statsUploadEnabled: source.statsUploadEnabled !== false,
      statsUploadEndpoint: endpoint,
      statsUploadTimes: times.length > 0 ? times : FIXED_STATS_DEFAULTS.statsUploadTimes.slice(),
      statsUploadJitterMinutes: toNumber(source.statsUploadJitterMinutes, 10, 0, 120, 0),
      statsAutoUploadOnSchedule: source.statsAutoUploadOnSchedule !== false,
      statsUploadRequestTimeoutMs: toNumber(
        source.statsUploadRequestTimeoutMs,
        20000,
        1000,
        120000,
        0
      ),
    };
  }

  function getActiveProjectId(settings) {
    return settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId || "";
  }

  function isProjectEnabled(settings) {
    const platformEnabled = settings?.platforms?.alibabaLabelx?.enabled === true;
    return platformEnabled && getActiveProjectId(settings) === PROJECT_ID;
  }

  async function loadSettings() {
    const storage = globalThis.ASREdgeStorage || null;
    if (!storage || typeof storage.getSettings !== "function") {
      return {};
    }

    try {
      return await storage.getSettings();
    } catch (error) {
      console.warn("[ASR Edge][transcription] load settings failed", {
        message: error && error.message ? error.message : String(error),
      });
      return {};
    }
  }

  async function loadConfig() {
    const settings = await loadSettings();
    const projectAsrConfig =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[PROJECT_ID]?.asrConfig || {};
    return {
      settings: settings,
      activeProjectId: getActiveProjectId(settings),
      enabledBySettings: isProjectEnabled(settings),
      config: normalizeRuntimeConfig(FIXED_DEFAULTS),
      statsConfig: normalizeStatsConfig(
        Object.assign({}, FIXED_STATS_DEFAULTS, projectAsrConfig)
      ),
      storageKey: STORAGE_KEY,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig = {
    PROJECT_ID: PROJECT_ID,
    FIXED_DEFAULTS: clone(FIXED_DEFAULTS),
    FIXED_STATS_DEFAULTS: clone(FIXED_STATS_DEFAULTS),
    normalizeRuntimeConfig: normalizeRuntimeConfig,
    normalizeStatsConfig: normalizeStatsConfig,
    loadConfig: loadConfig,
  };
})();
