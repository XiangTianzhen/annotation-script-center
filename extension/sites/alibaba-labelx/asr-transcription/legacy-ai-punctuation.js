(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-ai-punctuation]";
  const legacyBridge = window.__ASREdgeAlibabaLabelxLegacyBridge;
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;
  const legacyUserContext = window.__ASREdgeAlibabaLabelxLegacyUserContext;
  const legacySaveCoordinator = window.__ASREdgeAlibabaLabelxLegacySaveCoordinator;
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemWriter = window.__ASREdgeAlibabaLabelxAnnotationItemWriter;

  if (
    !runtimeGate ||
    !legacyApiClient ||
    !legacyUserContext ||
    !annotationItemCollector ||
    !annotationItemWriter
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function toText(value) {
    return typeof value === "string" ? value : "";
  }

  async function getPlatformSettings() {
    const settings = await runtimeGate.getSettings();
    return settings?.platforms?.alibabaLabelx || {};
  }

  function getTaskMeta() {
    return legacyBridge && typeof legacyBridge.getSubTaskMeta === "function"
      ? legacyBridge.getSubTaskMeta() || {}
      : {};
  }

  function hasCachedTaskData() {
    const cachedData =
      legacyBridge && typeof legacyBridge.getCachedDataList === "function"
        ? legacyBridge.getCachedDataList()
        : [];
    return Array.isArray(cachedData) && cachedData.length > 0;
  }

  function setAutosaveDisabled(disabled) {
    if (!document.documentElement) {
      return;
    }

    if (disabled) {
      document.documentElement.setAttribute("data-asr-disable-autosave", "true");
      return;
    }

    document.documentElement.removeAttribute("data-asr-disable-autosave");
  }

  function collectNonEmptyTexts() {
    const snapshot = annotationItemCollector.collect();
    const items = Array.isArray(snapshot?.items) ? snapshot.items : [];

    return items
      .map(function (item) {
        return {
          itemIndex: item.index,
          text: toText(item.targetText).trim(),
        };
      })
      .filter(function (entry) {
        return entry.text.length > 0;
      });
  }

  async function buildRequestPayload(entries, options) {
    const platformSettings = await getPlatformSettings();
    const aiSettings = platformSettings.aiPunctuation || {};
    const apiKey = toText(options?.apiKey || aiSettings.apiKey).trim();
    const model = toText(options?.model || aiSettings.model || "qwen3.5-flash").trim();
    const useAdvancedRules =
      options?.useAdvancedRules === true || aiSettings.useAdvancedRules === true;

    if (!apiKey) {
      return {
        ok: false,
        reason: "missing-api-key",
        message: "请先在设置面板填写 AI API Key。",
      };
    }

    const annotator = await legacyUserContext.ensureUserName();
    const duration = legacyUserContext.calcDurationFromDOM();
    const meta = Object.assign({}, getTaskMeta(), {
      annotator: annotator || "",
    });

    return {
      ok: true,
      payload: {
        texts: entries.map(function (entry) {
          return entry.text;
        }),
        apiKey: apiKey,
        useAdvancedRules: useAdvancedRules,
        model: model,
        meta: meta,
        duration: duration,
      },
      meta: meta,
    };
  }

  async function applyResults(entries, response) {
    const results = Array.isArray(response?.results) ? response.results : [];
    let successCount = 0;
    let failCount = 0;
    const writeResults = [];

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const target = entries[result?.index];
      if (!target) {
        failCount += 1;
        continue;
      }

      if (result?.success !== true || typeof result?.text !== "string") {
        failCount += 1;
        writeResults.push({
          itemIndex: target.itemIndex,
          success: false,
          reason: result?.message || "ai-fix-failed",
        });
        continue;
      }

      const writeResult = annotationItemWriter.write({
        itemIndex: target.itemIndex,
        targetText: result.text,
      });
      if (writeResult?.wrote) {
        successCount += 1;
      } else {
        failCount += 1;
      }
      writeResults.push({
        itemIndex: target.itemIndex,
        success: writeResult?.wrote === true,
        writeResult: writeResult,
      });
    }

    return {
      successCount: successCount,
      failCount: failCount,
      writeResults: writeResults,
    };
  }

  async function run(request) {
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      summaryText: "当前基础转写阶段已禁用 AI 标点修复。",
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyAiPunctuation = {
    run: run,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
