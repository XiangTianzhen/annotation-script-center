(function () {
  if (globalThis.__ASREdgeAishellTechMinnanDiagnosticsInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanDiagnosticsInstalled = true;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function createStageLabel(stage) {
    if (stage === "ai_request") {
      return "AI请求";
    }
    if (stage === "select_task") {
      return "切换条目";
    }
    if (stage === "save_current") {
      return "保存当前条";
    }
    return "未知阶段";
  }

  function formatDurationMs(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "-";
    }
    if (numeric >= 1000) {
      return (numeric / 1000).toFixed(1).replace(/\.0$/, "") + "s";
    }
    return Math.round(numeric) + "ms";
  }

  function formatTimingSummary(timing) {
    const source = timing && typeof timing === "object" ? timing : {};
    const total = Number(source.totalDurationMs || 0);
    const listen = Number(source.listenDurationMs || 0);
    const compare = Number(source.compareDurationMs || 0);
    if (total <= 0 && listen <= 0 && compare <= 0) {
      return "-";
    }
    const detailParts = [];
    if (listen > 0) {
      detailParts.push("听音 " + formatDurationMs(listen));
    }
    if (compare > 0) {
      detailParts.push("比较 " + formatDurationMs(compare));
    }
    if (total > 0 && detailParts.length > 0) {
      return formatDurationMs(total) + "（" + detailParts.join(" / ") + "）";
    }
    if (total > 0) {
      return formatDurationMs(total);
    }
    return detailParts.join(" / ");
  }

  function formatModelSelection(models) {
    const source = models && typeof models === "object" ? models : {};
    const parts = [];
    if (normalizeText(source.singleModel)) {
      parts.push("单模型 " + normalizeText(source.singleModel));
    } else {
      if (normalizeText(source.listenModel)) {
        parts.push("听音 " + normalizeText(source.listenModel));
      }
      if (normalizeText(source.compareModel)) {
        parts.push("比较 " + normalizeText(source.compareModel));
      }
    }
    return parts.length > 0 ? parts.join(" / ") : "-";
  }

  function formatModeSummary(models) {
    const source = models && typeof models === "object" ? models : {};
    const parts = [normalizeText(source.modelMode), normalizeText(source.recognitionStrategy)].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "-";
  }

  function formatConcurrency(debug, fallbackFrontConcurrency) {
    const source = debug && typeof debug === "object" ? debug : {};
    const normalized = Number(source.frontConcurrencyNormalized || 0);
    const original = Number(source.frontConcurrencyOriginal || 0);
    const fallback = Number(fallbackFrontConcurrency || 0);
    if (normalized > 0 && original > 0 && normalized !== original) {
      return "原始 " + String(original) + " / 生效 " + String(normalized);
    }
    if (normalized > 0) {
      return String(normalized);
    }
    if (original > 0) {
      return String(original);
    }
    if (fallback > 0) {
      return String(fallback);
    }
    return "-";
  }

  function formatTokenSummary(usage) {
    const source = usage && typeof usage === "object" ? usage : {};
    const promptTokens = Number(source.promptTokens || 0);
    const completionTokens = Number(source.completionTokens || 0);
    const totalTokens = Number(source.totalTokens || 0);
    if (promptTokens <= 0 && completionTokens <= 0 && totalTokens <= 0) {
      return "-";
    }
    return [
      "输入 " + String(promptTokens || 0),
      "输出 " + String(completionTokens || 0),
      "合计 " + String(totalTokens || 0),
    ].join(" / ");
  }

  function buildCurrentResultDiagnostics(result, options) {
    const source = result && typeof result === "object" ? result : {};
    const sourceOptions = options && typeof options === "object" ? options : {};
    const models = source.models && typeof source.models === "object" ? source.models : {};
    const usage = source.usage && typeof source.usage === "object" ? source.usage : {};
    const timing = source.timing && typeof source.timing === "object" ? source.timing : {};
    const debug = source.debug && typeof source.debug === "object" ? source.debug : {};
    const rows = [
      ["识别策略", formatModeSummary(models)],
      ["模型选择", formatModelSelection(models)],
      ["AI耗时", formatTimingSummary(timing)],
      ["前端并发", formatConcurrency(debug, sourceOptions.fallbackFrontConcurrency)],
      ["Token", formatTokenSummary(usage)],
      ["FunASR", normalizeText(models.funAsrProvider) || "-"],
      ["后端模式", normalizeText(debug.clientBackendMode) || "-"],
      ["后端地址", normalizeText(debug.clientBackendEndpoint) || "-"],
      ["自动回退", debug.clientFallbackUsed === true ? "是" : "否"],
      ["requestId", normalizeText(debug.requestId) || "-"],
      ["debugId", normalizeText(debug.debugId) || "-"],
    ];
    return {
      rows: rows,
    };
  }

  function buildRawFailureJson(input) {
    const source = input && typeof input === "object" ? input : {};
    const error = source.error && typeof source.error === "object" ? source.error : null;
    if (error?.rawResponse && typeof error.rawResponse === "object") {
      return error.rawResponse;
    }
    return {
      stage: normalizeText(source.stage),
      message: normalizeText(source.message),
      task: {
        displayName: normalizeText(source.task?.displayName),
        taskItemId: normalizeText(source.task?.taskItemId),
      },
      saveResult:
        source.saveResult && typeof source.saveResult === "object" ? source.saveResult : null,
      switchResult:
        source.switchResult && typeof source.switchResult === "object" ? source.switchResult : null,
      aiDebug:
        source.result?.debug && typeof source.result.debug === "object"
          ? source.result.debug
          : null,
    };
  }

  function buildBatchFailureEntry(input) {
    const source = input && typeof input === "object" ? input : {};
    const task = source.task && typeof source.task === "object" ? source.task : {};
    const stage = normalizeText(source.stage);
    const message = normalizeText(source.message || source.error?.message || "失败");
    const diagnostics = buildCurrentResultDiagnostics(source.result, {
      fallbackFrontConcurrency: source.batchConcurrency,
    });
    return {
      displayName: normalizeText(task.displayName) || "未知条目",
      message: message,
      stage: stage,
      stageLabel: createStageLabel(stage),
      detailRows: [
        ["失败阶段", createStageLabel(stage)],
        ["错误摘要", message || "-"],
      ].concat(diagnostics.rows),
      rawJson: buildRawFailureJson(source),
    };
  }

  const api = {
    buildBatchFailureEntry,
    buildCurrentResultDiagnostics,
    createStageLabel,
    formatConcurrency,
    formatDurationMs,
    formatModelSelection,
    formatTimingSummary,
    formatTokenSummary,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalThis.__ASREdgeAishellTechMinnanDiagnostics = api;
})();
