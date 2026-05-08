(function () {
  const STORAGE_KEY = (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.STORAGE_KEY) || "asrEdgeSettings";
  const PROJECT_ID =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.TRANSCRIPTION_PROJECT_ID) ||
    "transcription";
  const DEFAULTS =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.DEFAULT_ASR_CONFIG) ||
    {};
  const PAGE_OPTIONS =
    (globalThis.ASREdgeConstants && globalThis.ASREdgeConstants.PAGE_OPTIONS) || [
      "1 条/页",
      "2 条/页",
      "3 条/页",
      "4 条/页",
      "5 条/页",
      "10 条/页",
      "20 条/页",
      "30 条/页",
      "40 条/页",
      "50 条/页",
    ];
  const SHORTCUT_KEYS = [
    "shortcutPanel",
    "shortcutPlayPause",
    "shortcutValid",
    "shortcutInvalid",
    "shortcutFill",
    "shortcutRemoveSpaces",
    "shortcutConvertNum",
    "shortcutToggleFocus",
    "shortcutCopyDuration",
    "shortcutForward",
    "shortcutBackward",
    "shortcutSpeedUp",
    "shortcutSpeedDown",
    "shortcutResetSpeed",
    "shortcutVolUp",
    "shortcutVolDown",
    "shortcutResetVol",
  ];

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Boolean(value) && Object.prototype.toString.call(value) === "[object Object]";
  }

  function clampNumber(value, fallback, min, max, precision) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    const next = Math.max(min, Math.min(max, numeric));
    return typeof precision === "number" ? Number(next.toFixed(precision)) : next;
  }

  function normalizeShortcut(shortcut, fallback) {
    if (shortcut === null) {
      return null;
    }
    const base = isPlainObject(fallback) ? fallback : {};
    const source = isPlainObject(shortcut) ? shortcut : {};
    const key =
      typeof source.key === "string"
        ? source.key
        : typeof base.key === "string"
          ? base.key
          : null;
    const button =
      typeof source.button === "number"
        ? source.button
        : typeof base.button === "number"
          ? base.button
          : null;
    if (!key && typeof button !== "number") {
      return null;
    }
    return {
      ctrl: source.ctrl === true || base.ctrl === true,
      alt: source.alt === true || base.alt === true,
      shift: source.shift === true || base.shift === true,
      meta: source.meta === true || base.meta === true,
      key: key,
      button: button,
    };
  }

  function normalizeReplacementList(value, fallback) {
    const source = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
    return source
      .map(function (entry) {
        return {
          from: typeof entry?.from === "string" ? entry.from : "",
          to: typeof entry?.to === "string" ? entry.to : "",
        };
      })
      .filter(function (entry) {
        return entry.from.trim() || entry.to.trim();
      });
  }

  function normalizeCustomRates(value, fallback) {
    const defaults = Array.isArray(fallback) ? fallback : [];
    const source = Array.isArray(value) ? value : defaults;
    return source
      .map(function (entry, index) {
        const fallbackEntry = defaults[index] || {};
        const rate = clampNumber(
          entry?.rate,
          clampNumber(fallbackEntry?.rate, 1, 0.1, 8, 2),
          0.1,
          8,
          2
        );
        const shortcut = normalizeShortcut(entry?.shortcut, fallbackEntry?.shortcut);
        return {
          rate: rate,
          shortcut: shortcut,
        };
      })
      .filter(function (entry) {
        return Number.isFinite(entry.rate);
      });
  }

  function normalizeItemsPerPage(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (PAGE_OPTIONS.indexOf(text) >= 0) {
      return text;
    }
    const nextFallback = typeof fallback === "string" ? fallback.trim() : "";
    if (PAGE_OPTIONS.indexOf(nextFallback) >= 0) {
      return nextFallback;
    }
    return "50 条/页";
  }

  function normalizeConfig(input, fallback) {
    const base = isPlainObject(fallback) ? fallback : {};
    const source = isPlainObject(input) ? input : {};
    const next = Object.assign({}, base, source);

    next.itemsPerPage = normalizeItemsPerPage(source.itemsPerPage, base.itemsPerPage);
    next.autoPlay = source.autoPlay !== false;
    next.defaultValid = source.defaultValid === true;
    next.fillOnValid = source.fillOnValid !== false;
    next.clearOnInvalid = source.clearOnInvalid !== false;
    next.playbackRateValue = clampNumber(
      source.playbackRateValue,
      clampNumber(base.playbackRateValue, 1, 0.25, 5, 2),
      0.25,
      5,
      2
    );
    next.resetRateValue = clampNumber(
      source.resetRateValue,
      clampNumber(base.resetRateValue, next.playbackRateValue, 0.25, 5, 2),
      0.25,
      5,
      2
    );
    next.rateStepValue = clampNumber(
      source.rateStepValue,
      clampNumber(base.rateStepValue, 0.1, 0.01, 2, 2),
      0.01,
      2,
      2
    );
    next.seekStepSeconds = clampNumber(
      source.seekStepSeconds,
      clampNumber(base.seekStepSeconds, 1, 0.1, 10, 2),
      0.1,
      10,
      2
    );
    next.volumeValue = clampNumber(
      source.volumeValue,
      clampNumber(base.volumeValue, 100, 0, 1000, 0),
      0,
      1000,
      0
    );
    next.customReplacements = normalizeReplacementList(
      source.customReplacements,
      base.customReplacements
    );
    next.customRates = normalizeCustomRates(source.customRates, base.customRates);

    SHORTCUT_KEYS.forEach(function (key) {
      next[key] = normalizeShortcut(source[key], base[key]);
    });

    return next;
  }

  function getTranscriptionProjectConfig(settings) {
    const projectConfig =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[PROJECT_ID]?.asrConfig || {};
    return normalizeConfig(projectConfig, DEFAULTS);
  }

  function getActiveProjectId(settings) {
    return settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId || "";
  }

  async function loadSettings() {
    const storage = globalThis.ASREdgeStorage || null;
    if (!storage || typeof storage.getSettings !== "function") {
      return {};
    }
    return storage.getSettings();
  }

  async function loadConfig() {
    const settings = await loadSettings();
    return {
      settings: settings,
      activeProjectId: getActiveProjectId(settings),
      config: getTranscriptionProjectConfig(settings),
    };
  }

  async function saveConfigPatch(patch) {
    const storage = globalThis.ASREdgeStorage || null;
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      throw new Error("扩展存储不可用，无法保存转写设置。");
    }
    const normalizedPatch = normalizeConfig(patch, DEFAULTS);
    const settings = await storage.saveProjectSettings(PROJECT_ID, normalizedPatch);
    return {
      settings: settings,
      activeProjectId: getActiveProjectId(settings),
      config: getTranscriptionProjectConfig(settings),
    };
  }

  function subscribeStorage(listener) {
    if (!chrome?.storage?.onChanged || typeof listener !== "function") {
      return function () {};
    }
    const handler = function (changes, areaName) {
      if (areaName !== "local" || !changes || !changes[STORAGE_KEY]) {
        return;
      }
      listener(changes[STORAGE_KEY]);
    };
    chrome.storage.onChanged.addListener(handler);
    return function () {
      chrome.storage.onChanged.removeListener(handler);
    };
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig = {
    PROJECT_ID: PROJECT_ID,
    DEFAULTS: clone(DEFAULTS),
    PAGE_OPTIONS: clone(PAGE_OPTIONS),
    SHORTCUT_KEYS: SHORTCUT_KEYS.slice(),
    normalizeShortcut: normalizeShortcut,
    normalizeConfig: normalizeConfig,
    loadConfig: loadConfig,
    saveConfigPatch: saveConfigPatch,
    subscribeStorage: subscribeStorage,
  };
})();
