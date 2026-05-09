(function () {
  const STORAGE_KEY =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.STORAGE_KEY) || "asrEdgeSettings";
  const PROJECT_ID =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.TRANSCRIPTION_PROJECT_ID) ||
    "transcription";
  const STATS_UPLOAD_PATH =
    (globalThis.ASREdgeConstants &&
      globalThis.ASREdgeConstants.TRANSCRIPTION_STATS_UPLOAD_PATH) ||
    "/api/alibaba-labelx/asr-transcription/statistics/upload";
  const BACKEND_MODE_SERVER =
    (globalThis.ASREdgeConstants &&
      globalThis.ASREdgeConstants.BACKEND_ENDPOINT_MODE_SERVER) ||
    "server";
  const BACKEND_MODE_LOCAL =
    (globalThis.ASREdgeConstants &&
      globalThis.ASREdgeConstants.BACKEND_ENDPOINT_MODE_LOCAL) ||
    "local";
  const DEFAULT_ASR_CONFIG =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.DEFAULT_ASR_CONFIG) || {};
  const SHORTCUT_COMPATIBILITY_MAP =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.SHORTCUT_COMPATIBILITY_MAP) || {};

  const SAFE_SHORTCUT_KEYS = [
    "shortcutPlayPause",
    "shortcutValid",
    "shortcutInvalid",
    "shortcutFill",
    "shortcutRemoveSpaces",
    "shortcutConvertNum",
    "shortcutToggleFocus",
    "shortcutBackward",
    "shortcutForward",
    "shortcutSpeedDown",
    "shortcutSpeedUp",
    "shortcutResetSpeed",
    "shortcutVolDown",
    "shortcutVolUp",
    "shortcutResetVol",
    "shortcutCopyDuration",
    "shortcutUploadStats",
  ];

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
    shortcutPlayPause: null,
    shortcutValid: null,
    shortcutInvalid: null,
    shortcutFill: null,
    shortcutRemoveSpaces: null,
    shortcutConvertNum: null,
    shortcutToggleFocus: null,
    shortcutBackward: null,
    shortcutForward: null,
    shortcutSpeedDown: null,
    shortcutSpeedUp: null,
    shortcutResetSpeed: null,
    shortcutVolDown: null,
    shortcutVolUp: null,
    shortcutResetVol: null,
    shortcutCopyDuration: null,
    shortcutUploadStats: null,
  };
  const FIXED_STATS_DEFAULTS = {
    statsUploadEnabled: true,
    statsUploadEndpoint: "",
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

  function normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== "object") {
      return null;
    }

    const hasKey = typeof shortcut.key === "string" && shortcut.key.length > 0;
    const hasButton = typeof shortcut.button === "number";
    if (!hasKey && !hasButton) {
      return null;
    }

    return {
      ctrl: shortcut.ctrl === true,
      alt: shortcut.alt === true,
      shift: shortcut.shift === true,
      meta: shortcut.meta === true,
      key: hasKey ? String(shortcut.key) : null,
      button: hasButton ? shortcut.button : null,
    };
  }

  function normalizeTimeList(value, fallback) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[,，\n]/)
        : Array.isArray(fallback)
          ? fallback
          : FIXED_STATS_DEFAULTS.statsUploadTimes;
    const result = [];
    source.forEach(function (item) {
      const text = String(item || "").trim();
      const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        return;
      }
      const normalized = String(Number(match[1])).padStart(2, "0") + ":" + match[2];
      if (result.indexOf(normalized) < 0) {
        result.push(normalized);
      }
    });
    return result.length > 0 ? result : FIXED_STATS_DEFAULTS.statsUploadTimes.slice();
  }

  function getShortcutFromSource(source, shortcutKey) {
    if (source && Object.prototype.hasOwnProperty.call(source, shortcutKey)) {
      return source[shortcutKey];
    }

    const compatEntry = Object.entries(SHORTCUT_COMPATIBILITY_MAP).find(function (entry) {
      return entry[1] === shortcutKey;
    });
    const compatKey = compatEntry ? compatEntry[0] : "";
    if (
      compatKey &&
      source &&
      source.shortcuts &&
      Object.prototype.hasOwnProperty.call(source.shortcuts, compatKey)
    ) {
      return source.shortcuts[compatKey];
    }

    return null;
  }

  function normalizeRuntimeConfig(config) {
    const source = config && typeof config === "object" ? config : {};
    const shortcuts = {};
    SAFE_SHORTCUT_KEYS.forEach(function (shortcutKey) {
      shortcuts[shortcutKey] = normalizeShortcut(getShortcutFromSource(source, shortcutKey));
    });

    const resetRateValue = toNumber(
      hasOwn(source, "resetRateValue") ? source.resetRateValue : source.playbackRateValue,
      1,
      0.25,
      5,
      2
    );

    return {
      autoPlay: source.autoPlay === true,
      playbackRateValue: toNumber(
        hasOwn(source, "playbackRateValue") ? source.playbackRateValue : resetRateValue,
        resetRateValue,
        0.25,
        5,
        2
      ),
      resetRateValue: resetRateValue,
      rateStepValue: toNumber(source.rateStepValue, 0.1, 0.05, 2, 2),
      seekStepSeconds: toNumber(source.seekStepSeconds, 1, 0.1, 10, 2),
      volumeValue: toNumber(source.volumeValue, 100, 0, 1000, 0),
      fillOnValid: source.fillOnValid !== false,
      clearOnInvalid: source.clearOnInvalid !== false,
      defaultValid: source.defaultValid === true,
      shortcuts: shortcuts,
      shortcutPlayPause: shortcuts.shortcutPlayPause,
      shortcutValid: shortcuts.shortcutValid,
      shortcutInvalid: shortcuts.shortcutInvalid,
      shortcutFill: shortcuts.shortcutFill,
      shortcutRemoveSpaces: shortcuts.shortcutRemoveSpaces,
      shortcutConvertNum: shortcuts.shortcutConvertNum,
      shortcutToggleFocus: shortcuts.shortcutToggleFocus,
      shortcutBackward: shortcuts.shortcutBackward,
      shortcutForward: shortcuts.shortcutForward,
      shortcutSpeedDown: shortcuts.shortcutSpeedDown,
      shortcutSpeedUp: shortcuts.shortcutSpeedUp,
      shortcutResetSpeed: shortcuts.shortcutResetSpeed,
      shortcutVolDown: shortcuts.shortcutVolDown,
      shortcutVolUp: shortcuts.shortcutVolUp,
      shortcutResetVol: shortcuts.shortcutResetVol,
      shortcutCopyDuration: shortcuts.shortcutCopyDuration,
      shortcutUploadStats: shortcuts.shortcutUploadStats,
    };
  }

  function inferModeFromEndpoint(endpointText) {
    const text = String(endpointText || "").trim().toLowerCase();
    if (text.indexOf("127.0.0.1") >= 0 || text.indexOf("localhost") >= 0) {
      return BACKEND_MODE_LOCAL;
    }
    return BACKEND_MODE_SERVER;
  }

  function normalizeStatsConfig(config, settings) {
    const constants = globalThis.ASREdgeConstants || {};
    const source = config && typeof config === "object" ? config : {};
    const modeFromSettings =
      typeof constants.getBackendEndpointModeFromSettings === "function"
        ? constants.getBackendEndpointModeFromSettings(settings || {})
        : String(settings?.meta?.backendEndpointMode || "").trim().toLowerCase() === BACKEND_MODE_LOCAL
          ? BACKEND_MODE_LOCAL
          : "";
    const endpointMode = modeFromSettings || inferModeFromEndpoint(source.statsUploadEndpoint);
    const endpoint =
      typeof constants.buildBackendUrl === "function"
        ? constants.buildBackendUrl(STATS_UPLOAD_PATH, endpointMode)
        : (endpointMode === BACKEND_MODE_LOCAL
            ? "http://127.0.0.1:3333"
            : "https://script.xiangtianzhen.store") + STATS_UPLOAD_PATH;

    return {
      statsUploadEnabled: source.statsUploadEnabled !== false,
      statsUploadEndpoint: endpoint,
      backendEndpointMode: endpointMode,
      statsUploadTimes: normalizeTimeList(
        source.statsUploadTimes,
        FIXED_STATS_DEFAULTS.statsUploadTimes
      ),
      statsUploadJitterMinutes: toNumber(source.statsUploadJitterMinutes, 10, 0, 120, 0),
      statsAutoUploadOnSchedule: source.statsAutoUploadOnSchedule !== false,
      statsUploadRequestTimeoutMs: toNumber(source.statsUploadRequestTimeoutMs, 20000, 1000, 120000, 0),
    };
  }

  function hasOwn(target, key) {
    return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
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
    const defaultRuntime = Object.assign({}, FIXED_DEFAULTS, DEFAULT_ASR_CONFIG || {});
    return {
      settings: settings,
      activeProjectId: getActiveProjectId(settings),
      enabledBySettings: isProjectEnabled(settings),
      config: normalizeRuntimeConfig(Object.assign({}, defaultRuntime, projectAsrConfig)),
      statsConfig: Object.assign(
        {
          settings: settings,
        },
        normalizeStatsConfig(
          Object.assign({}, FIXED_STATS_DEFAULTS, DEFAULT_ASR_CONFIG || {}, projectAsrConfig),
          settings
        )
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
