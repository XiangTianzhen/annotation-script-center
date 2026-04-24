(function () {
  const LOG_PREFIX = "[ASR Edge][runtime-gate]";
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const DEFAULT_SETTINGS = constants.DEFAULT_SETTINGS || {
    platforms: {
      alibabaLabelx: {
        enabled: true,
      },
    },
  };

  async function getSettings() {
    if (storage && typeof storage.getSettings === "function") {
      return storage.getSettings();
    }

    return DEFAULT_SETTINGS;
  }

  function isAlibabaLabelxEnabled(settings) {
    return Boolean(settings?.platforms?.alibabaLabelx?.enabled);
  }

  async function guardPlatformEnabled() {
    const settings = await getSettings();
    const enabled = isAlibabaLabelxEnabled(settings);

    if (!enabled) {
      console.info(LOG_PREFIX, "Alibaba LabelX module is disabled.");
    }

    return {
      enabled: enabled,
      settings: settings,
    };
  }

  window.__ASREdgeAlibabaLabelxRuntimeGate = {
    getSettings: getSettings,
    isAlibabaLabelxEnabled: isAlibabaLabelxEnabled,
    guardPlatformEnabled: guardPlatformEnabled,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
