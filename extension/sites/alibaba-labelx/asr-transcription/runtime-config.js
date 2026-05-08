(function () {
  const STORAGE_KEY =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.STORAGE_KEY) || "asrEdgeSettings";
  const PROJECT_ID =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.TRANSCRIPTION_PROJECT_ID) ||
    "transcription";

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
    return {
      settings: settings,
      activeProjectId: getActiveProjectId(settings),
      enabledBySettings: isProjectEnabled(settings),
      config: normalizeRuntimeConfig(FIXED_DEFAULTS),
      storageKey: STORAGE_KEY,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig = {
    PROJECT_ID: PROJECT_ID,
    FIXED_DEFAULTS: clone(FIXED_DEFAULTS),
    normalizeRuntimeConfig: normalizeRuntimeConfig,
    loadConfig: loadConfig,
  };
})();
