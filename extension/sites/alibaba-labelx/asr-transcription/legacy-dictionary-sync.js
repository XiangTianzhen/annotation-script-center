(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-dictionary-sync]";
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;
  const storage = globalThis.ASREdgeStorage || null;

  let cachedRules = null;

  async function getPlatformSettings() {
    if (legacyApiClient && typeof legacyApiClient.getPlatformSettings === "function") {
      return legacyApiClient.getPlatformSettings();
    }

    return {};
  }

  async function getRules() {
    if (Array.isArray(cachedRules)) {
      return cachedRules.slice();
    }

    const platformSettings = await getPlatformSettings();
    cachedRules = Array.isArray(platformSettings?.dictionary?.customReplacements)
      ? platformSettings.dictionary.customReplacements.slice()
      : [];
    return cachedRules.slice();
  }

  function normalizeRule(rule) {
    if (!rule || typeof rule !== "object") {
      return null;
    }

    const from = typeof rule.from === "string" ? rule.from.trim() : "";
    const to = typeof rule.to === "string" ? rule.to.trim() : "";
    if (!from || !to) {
      return null;
    }

    return {
      from: from,
      to: to,
    };
  }

  async function saveRules(rules, extraPatch) {
    const normalizedRules = Array.isArray(rules)
      ? rules.map(normalizeRule).filter(Boolean)
      : [];
    cachedRules = normalizedRules.slice();

    if (!storage || typeof storage.patchSettings !== "function") {
      return normalizedRules;
    }

    await storage.patchSettings({
      platforms: {
        alibabaLabelx: {
          annotation: {
            customReplacements: normalizedRules,
          },
          dictionary: Object.assign(
            {
              customReplacements: normalizedRules,
            },
            extraPatch || {}
          ),
        },
      },
    });

    return normalizedRules;
  }

  async function syncFromServer() {
    if (!legacyApiClient || typeof legacyApiClient.getJson !== "function") {
      throw new Error("Legacy API client is unavailable.");
    }

    const remoteRules = await legacyApiClient.getJson("/asr/asr-dict.json?t=" + Date.now());
    if (!Array.isArray(remoteRules)) {
      throw new Error("Remote dictionary payload is not an array.");
    }

    const savedRules = await saveRules(remoteRules, {
      lastSyncedAt: new Date().toISOString(),
    });

    return {
      success: true,
      count: savedRules.length,
      rules: savedRules,
    };
  }

  async function uploadPendingReview(rules) {
    if (!legacyApiClient || typeof legacyApiClient.postJson !== "function") {
      throw new Error("Legacy API client is unavailable.");
    }

    const payloadRules = Array.isArray(rules) ? rules : await getRules();
    const normalizedRules = payloadRules.map(normalizeRule).filter(Boolean);
    const result = await legacyApiClient.postJson("/asr/submit-dict-review", normalizedRules);

    await saveRules(normalizedRules, {
      lastUploadedAt: new Date().toISOString(),
    });

    return {
      success: Boolean(result?.success !== false),
      message: result?.message || "OK",
      count: normalizedRules.length,
    };
  }

  async function applyReplacements(text) {
    let nextText = typeof text === "string" ? text : "";
    const rules = await getRules();

    rules.forEach(function (rule) {
      const candidates = String(rule.from)
        .split(/[,，|]/)
        .map(function (entry) {
          return entry.trim();
        })
        .filter(Boolean);

      candidates.forEach(function (candidate) {
        if (!candidate) {
          return;
        }

        nextText = nextText.split(candidate).join(rule.to);
      });
    });

    return nextText;
  }

  window.__ASREdgeAlibabaLabelxLegacyDictionarySync = {
    getRules: getRules,
    saveRules: saveRules,
    syncFromServer: syncFromServer,
    uploadPendingReview: uploadPendingReview,
    applyReplacements: applyReplacements,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
