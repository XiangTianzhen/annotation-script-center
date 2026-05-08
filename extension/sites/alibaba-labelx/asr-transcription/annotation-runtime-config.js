(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-runtime-config]";
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const STORAGE_KEY = constants.STORAGE_KEY || "asrEdgeSettings";
  const DEFAULT_SETTINGS = constants.DEFAULT_SETTINGS || {
    platforms: {
      alibabaLabelx: {
        enabled: true,
        annotation: {
          autoPlay: true,
          fillOnValid: true,
          clearOnInvalid: true,
          autoResetRate: false,
          autoClearInvalidValidation: false,
          autoFillOnValidValidation: false,
          resetRateValue: 1.0,
          playbackRateValue: 1.0,
          rateStepValue: 0.1,
          seekStepSeconds: 1.0,
          volumeValue: 100,
          numConvertMode: "千问",
          shortcuts: {},
          customReplacements: [],
          customRates: [],
        },
      },
    },
  };
  const listeners = [];
  let started = false;
  let currentSettings = null;
  let currentAnnotationSettings = null;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function deepMerge(base, override) {
    const source = isPlainObject(base) ? base : {};
    const patch = isPlainObject(override) ? override : {};
    const result = { ...source };

    Object.keys(patch).forEach(function (key) {
      if (isPlainObject(source[key]) && isPlainObject(patch[key])) {
        result[key] = deepMerge(source[key], patch[key]);
        return;
      }

      result[key] = clone(patch[key]);
    });

    return result;
  }

  function getDefaultAnnotationSettings() {
    return clone(DEFAULT_SETTINGS?.platforms?.alibabaLabelx?.annotation || {});
  }

  function normalizeShortcut(shortcut, fallback) {
    const base = isPlainObject(fallback) ? fallback : {};
    const input = isPlainObject(shortcut) ? shortcut : {};

    return {
      ctrl: input.ctrl === true || base.ctrl === true,
      alt: input.alt === true || base.alt === true,
      shift: input.shift === true || base.shift === true,
      meta: input.meta === true || base.meta === true,
      key:
        typeof input.key === "string"
          ? input.key
          : typeof base.key === "string"
            ? base.key
            : null,
      button:
        typeof input.button === "number"
          ? input.button
          : typeof base.button === "number"
            ? base.button
            : null,
    };
  }

  function normalizeShortcutMap(shortcuts, defaults) {
    const normalized = {};
    const defaultMap = isPlainObject(defaults) ? defaults : {};
    const shortcutMap = isPlainObject(shortcuts) ? shortcuts : {};
    const keys = Array.from(new Set(Object.keys(defaultMap).concat(Object.keys(shortcutMap))));

    keys.forEach(function (key) {
      normalized[key] = normalizeShortcut(shortcutMap[key], defaultMap[key]);
    });

    return normalized;
  }

  function normalizeCustomReplacement(rule) {
    return {
      from: typeof rule?.from === "string" ? rule.from : "",
      to: typeof rule?.to === "string" ? rule.to : "",
    };
  }

  function normalizeCustomRate(entry, fallback) {
    const base = isPlainObject(fallback) ? fallback : {};
    const rateValue =
      typeof entry?.rate === "number"
        ? entry.rate
        : typeof base.rate === "number"
          ? base.rate
          : 1.0;

    return {
      rate: rateValue,
      shortcut: entry?.shortcut === null ? null : normalizeShortcut(entry?.shortcut, base.shortcut),
    };
  }

  function normalizeCustomRates(customRates, defaults) {
    const input = Array.isArray(customRates) ? customRates : [];
    const baseRates = Array.isArray(defaults) ? defaults : [];
    const maxLength = Math.max(input.length, baseRates.length);
    const normalized = [];

    for (let index = 0; index < maxLength; index += 1) {
      const normalizedRate = normalizeCustomRate(input[index], baseRates[index]);
      if (typeof normalizedRate.rate === "number") {
        normalized.push(normalizedRate);
      }
    }

    return normalized;
  }

  function normalizeAnnotationSettings(settings) {
    const defaults = getDefaultAnnotationSettings();
    const source = settings?.platforms?.alibabaLabelx?.annotation;
    const merged = deepMerge(defaults, source);

    return {
      activeProjectId:
        settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId ||
        constants.TRANSCRIPTION_PROJECT_ID ||
        "transcription",
      autoPlay: merged.autoPlay === true,
      fillOnValid: merged.fillOnValid !== false,
      clearOnInvalid: merged.clearOnInvalid !== false,
      autoResetRate: merged.autoResetRate === true,
      autoClearInvalidValidation: merged.autoClearInvalidValidation === true,
      autoFillOnValidValidation: merged.autoFillOnValidValidation === true,
      resetRateValue:
        typeof merged.resetRateValue === "number" && merged.resetRateValue > 0
          ? merged.resetRateValue
          : 1.0,
      playbackRateValue:
        typeof merged.playbackRateValue === "number" && merged.playbackRateValue > 0
          ? merged.playbackRateValue
          : typeof merged.resetRateValue === "number" && merged.resetRateValue > 0
            ? merged.resetRateValue
            : 1.0,
      rateStepValue:
        typeof merged.rateStepValue === "number" && merged.rateStepValue > 0
          ? merged.rateStepValue
          : 0.1,
      seekStepSeconds:
        typeof merged.seekStepSeconds === "number" && merged.seekStepSeconds > 0
          ? merged.seekStepSeconds
          : 1.0,
      volumeValue:
        typeof merged.volumeValue === "number" && merged.volumeValue >= 0
          ? merged.volumeValue
          : 100,
      numConvertMode: merged.numConvertMode === "蜂鸟众包" ? "蜂鸟众包" : "千问",
      shortcuts: normalizeShortcutMap(merged.shortcuts, defaults.shortcuts),
      customReplacements: Array.isArray(merged.customReplacements)
        ? merged.customReplacements.map(normalizeCustomReplacement)
        : [],
      customRates: normalizeCustomRates(merged.customRates, defaults.customRates),
    };
  }

  function getStoredSettings() {
    if (storage && typeof storage.getSettings === "function") {
      return storage.getSettings();
    }

    return new Promise(function (resolve) {
      chrome.storage.local.get(STORAGE_KEY, function (result) {
        resolve(result?.[STORAGE_KEY] || {});
      });
    });
  }

  async function refresh(reason) {
    const storedSettings = await getStoredSettings();
    currentSettings = deepMerge(clone(DEFAULT_SETTINGS), storedSettings);
    currentAnnotationSettings = normalizeAnnotationSettings(currentSettings);
    console.info(LOG_PREFIX, "Annotation runtime config refreshed:", {
      reason: reason || "manual",
      activeProjectId: currentAnnotationSettings.activeProjectId,
      numConvertMode: currentAnnotationSettings.numConvertMode,
      autoPlay: currentAnnotationSettings.autoPlay,
      autoResetRate: currentAnnotationSettings.autoResetRate,
      fillOnValid: currentAnnotationSettings.fillOnValid,
      clearOnInvalid: currentAnnotationSettings.clearOnInvalid,
      customReplacementCount: currentAnnotationSettings.customReplacements.length,
      customRateCount: currentAnnotationSettings.customRates.length,
    });
    return getSnapshot();
  }

  function getSnapshot() {
    if (!currentAnnotationSettings) {
      currentAnnotationSettings = normalizeAnnotationSettings(DEFAULT_SETTINGS);
    }

    return clone(currentAnnotationSettings);
  }

  function getSettingsSnapshot() {
    if (!currentSettings) {
      currentSettings = deepMerge(clone(DEFAULT_SETTINGS), {});
    }

    return clone(currentSettings);
  }

  function notify(reason) {
    const snapshot = getSnapshot();
    listeners.slice().forEach(function (listener) {
      try {
        listener(snapshot, reason || "manual");
      } catch (error) {
        console.warn(LOG_PREFIX, "Config subscriber failed:", error);
      }
    });
  }

  function handleStorageChanged(changes, areaName) {
    if (areaName !== "local" || !changes || !changes[STORAGE_KEY]) {
      return;
    }

    refresh("storage-change")
      .then(function () {
        notify("storage-change");
      })
      .catch(function (error) {
        console.warn(LOG_PREFIX, "Failed to refresh config from storage change:", error);
      });
  }

  async function start() {
    if (started) {
      return getSnapshot();
    }

    started = true;
    if (chrome?.storage?.onChanged?.addListener) {
      chrome.storage.onChanged.addListener(handleStorageChanged);
    }

    await refresh("start");
    return getSnapshot();
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function () {
        return false;
      };
    }

    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
        return true;
      }

      return false;
    };
  }

  window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig = {
    start: start,
    refresh: refresh,
    getSnapshot: getSnapshot,
    getSettingsSnapshot: getSettingsSnapshot,
    normalizeShortcut: normalizeShortcut,
    subscribe: subscribe,
    STORAGE_KEY: STORAGE_KEY,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
