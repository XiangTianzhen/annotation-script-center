(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-debug-snapshot]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const pageStateCollector = window.__ASREdgePageStateCollector;
  const DEFAULT_HISTORY_LIMIT = 5;
  const COMPACT_KEYS = [
    "pageType",
    "routeKey",
    "taskId",
    "matched",
    "completed",
    "reason",
    "summaryText",
    "phaseSummary",
    "applyPhase",
    "savePhase",
    "submitPhase",
    "warnings",
    "lines",
    "clickable",
    "clicked",
    "visible",
    "lastAction",
    "lastSummary",
    "lastResult",
    "lastFlowReport",
    "contextInfo",
    "domSignals",
    "metadata",
  ];

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function compactValue(value, depth) {
    if (depth >= 3) {
      return "[Truncated]";
    }

    if (Array.isArray(value)) {
      const limited = value.slice(0, 5).map(function (entry) {
        return compactValue(entry, depth + 1);
      });

      if (value.length > 5) {
        limited.push("... +" + (value.length - 5) + " more");
      }

      return limited;
    }

    if (!isObject(value)) {
      return value;
    }

    const result = {};
    const preferredKeys = COMPACT_KEYS.filter(function (key) {
      return Object.prototype.hasOwnProperty.call(value, key);
    });
    const selectedKeys = preferredKeys.length > 0 ? preferredKeys : Object.keys(value).slice(0, 10);

    selectedKeys.forEach(function (key) {
      result[key] = compactValue(value[key], depth + 1);
    });

    const extraKeyCount = Object.keys(value).length - selectedKeys.length;
    if (extraKeyCount > 0) {
      result.__extraKeys = extraKeyCount;
    }

    return result;
  }

  function normalizeRequest(snapshotRequest) {
    const request = isObject(snapshotRequest) ? snapshotRequest : {};
    const historyLimit =
      Number.isInteger(request.historyLimit) && request.historyLimit > 0
        ? request.historyLimit
        : DEFAULT_HISTORY_LIMIT;

    return {
      historyLimit: historyLimit,
      trigger:
        typeof request.trigger === "string" && request.trigger.trim().length > 0
          ? request.trigger.trim()
          : "annotation-debug-snapshot",
      pageState: isObject(request.pageState) ? request.pageState : null,
    };
  }

  function createFallbackPageState() {
    if (siteContract && typeof siteContract.createBasePageState === "function") {
      return siteContract.createBasePageState({
        hostname: location.hostname,
        pathname: location.pathname,
        pageTitle: document.title || "",
      });
    }

    return {
      isTargetSite: false,
      hostname: location.hostname,
      pathname: location.pathname,
      pageType: "unknown",
      routeKey: "non-target",
      timestamp: Date.now(),
      pageTitle: document.title || "",
      domSignals: {},
      contextInfo: {},
    };
  }

  function resolvePageState(request, runtime) {
    if (request.pageState) {
      return request.pageState;
    }

    if (runtime && runtime.stateCollector && typeof runtime.stateCollector.collect === "function") {
      return runtime.stateCollector.collect(request.trigger);
    }

    if (pageStateCollector && typeof pageStateCollector.collectPageState === "function") {
      return pageStateCollector.collectPageState();
    }

    return createFallbackPageState();
  }

  function extractTaskId(pageState) {
    return pageState &&
      pageState.contextInfo &&
      typeof pageState.contextInfo.taskId === "string"
      ? pageState.contextInfo.taskId
      : null;
  }

  function listRuntimeEntrypoints() {
    const publicRuntime = window.__ASREdgeAlibabaLabelxRuntime;
    const names = [
      "getLegacyBridge",
      "getRouteObserver",
      "getStateCollector",
      "getLegacyApiClient",
      "getLegacyUserContext",
      "getLegacyDictionarySync",
      "getLegacySaveCoordinator",
      "getLegacyAiPunctuation",
      "getLegacyExport",
      "getLegacyLeaderboard",
      "getLegacyVersionCheck",
      "getLegacyAutoAssign",
      "getLegacyBatchFlow",
      "getAnnotationPagePlanPreview",
      "getAnnotationPageApplyRunner",
      "getAnnotationPageReport",
      "getAnnotationSaveRunner",
      "getAnnotationSubmitRunner",
      "getAnnotationPageFlowRunner",
      "getAnnotationFlowReport",
      "getAnnotationControlPanel",
      "getSettingsPanel",
      "getAnnotationActionHistory",
      "getAnnotationDebugSnapshot",
    ];
    const available = [];
    const missing = [];

    names.forEach(function (name) {
      if (publicRuntime && typeof publicRuntime[name] === "function") {
        available.push(name);
        return;
      }

      missing.push(name);
    });

    return {
      available: available,
      missing: missing,
    };
  }

  function resolveControlPanelState(runtime) {
    const panel = runtime && runtime.annotationControlPanel ? runtime.annotationControlPanel : null;
    const state = panel && typeof panel.getState === "function" ? panel.getState() : null;

    return {
      exists: Boolean(panel),
      state: state ? compactValue(state, 0) : null,
    };
  }

  function normalizeHistoryRecords(actionHistory, limit) {
    if (!actionHistory || typeof actionHistory.list !== "function") {
      return [];
    }

    return actionHistory.list().slice(0, limit).map(function (record) {
      return {
        id: record.id,
        recordedAt: record.recordedAt,
        actionName: record.actionName,
        reason: record.reason,
        summaryText: record.summaryText,
        result: compactValue(record.result, 0),
      };
    });
  }

  function deriveLatestFlowReport(panelSnapshot, historyRecords) {
    const panelState = panelSnapshot && isObject(panelSnapshot.state) ? panelSnapshot.state : null;

    if (panelState && isObject(panelState.lastFlowReport)) {
      return compactValue(panelState.lastFlowReport, 0);
    }

    for (const record of historyRecords) {
      const result = isObject(record) && isObject(record.result) ? record.result : null;
      if (!result) {
        continue;
      }

      if (isObject(result.report)) {
        return compactValue(result.report, 0);
      }

      if (
        typeof result.summaryText === "string" ||
        isObject(result.phaseSummary) ||
        Array.isArray(result.warnings)
      ) {
        return compactValue(result, 0);
      }
    }

    return null;
  }

  function createSummaryText(snapshot) {
    if (!snapshot.matched || snapshot.routeKey === "non-target") {
      return "当前快照未命中 task-detail 主线，适合先记录页面类型与 runtime 装配状态。";
    }

    if (snapshot.latestFlowReport && typeof snapshot.latestFlowReport.summaryText === "string") {
      return snapshot.latestFlowReport.summaryText;
    }

    if (snapshot.recentActionHistory.length > 0) {
      return "当前快照已包含最近动作历史，可结合页面现象继续人工复核。";
    }

    return "当前快照已记录页面状态与 runtime 入口，但还没有最近动作历史。";
  }

  function capture(snapshotRequest, runtime, actionHistory) {
    const request = normalizeRequest(snapshotRequest);
    const pageState = resolvePageState(request, runtime);
    const panelSnapshot = resolveControlPanelState(runtime);
    const historyRecords = normalizeHistoryRecords(actionHistory, request.historyLimit);
    const latestFlowReport = deriveLatestFlowReport(panelSnapshot, historyRecords);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      pageType: pageState && typeof pageState.pageType === "string" ? pageState.pageType : "unknown",
      routeKey:
        pageState && typeof pageState.routeKey === "string" ? pageState.routeKey : "non-target",
      taskId: extractTaskId(pageState),
      matched: Boolean(pageState && pageState.isTargetSite && pageState.pageType === "task-detail"),
      controlPanelPresent: panelSnapshot.exists,
      runtimeEntrypoints: listRuntimeEntrypoints(),
      recentActionHistory: historyRecords,
      latestFlowReport: latestFlowReport,
      pageStateSummary: compactValue(pageState, 0),
      controlPanelState: panelSnapshot.state,
      historyAvailable: Boolean(actionHistory && typeof actionHistory.list === "function"),
      summaryText: "",
    };

    snapshot.summaryText = createSummaryText(snapshot);
    return snapshot;
  }

  function exportText(snapshotInput) {
    const snapshot = isObject(snapshotInput) ? snapshotInput : capture(null, null, null);
    const lines = [
      "ASR Edge Live Debug Snapshot",
      "generatedAt: " + (snapshot.generatedAt || "unknown"),
      "pageType: " + (snapshot.pageType || "unknown"),
      "routeKey: " + (snapshot.routeKey || "non-target"),
      "taskId: " + (snapshot.taskId || "(none)"),
      "matched: " + String(snapshot.matched === true),
      "controlPanelPresent: " + String(snapshot.controlPanelPresent === true),
      "historyAvailable: " + String(snapshot.historyAvailable === true),
      "summaryText: " + (snapshot.summaryText || "(none)"),
      "",
      "runtimeEntrypoints.available:",
      JSON.stringify((snapshot.runtimeEntrypoints && snapshot.runtimeEntrypoints.available) || [], null, 2),
      "",
      "runtimeEntrypoints.missing:",
      JSON.stringify((snapshot.runtimeEntrypoints && snapshot.runtimeEntrypoints.missing) || [], null, 2),
      "",
      "controlPanelState:",
      JSON.stringify(snapshot.controlPanelState || null, null, 2),
      "",
      "latestFlowReport:",
      JSON.stringify(snapshot.latestFlowReport || null, null, 2),
      "",
      "recentActionHistory:",
      JSON.stringify(snapshot.recentActionHistory || [], null, 2),
      "",
      "pageStateSummary:",
      JSON.stringify(snapshot.pageStateSummary || null, null, 2),
    ];

    return lines.join("\n");
  }

  window.__ASREdgeAlibabaLabelxAnnotationDebugSnapshot = {
    capture: capture,
    exportText: exportText,
    DEFAULT_HISTORY_LIMIT: DEFAULT_HISTORY_LIMIT,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
