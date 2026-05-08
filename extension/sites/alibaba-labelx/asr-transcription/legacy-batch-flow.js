(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-batch-flow]";
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;
  const pageStateCollector = window.__ASREdgePageStateCollector;
  const legacyBridge = window.__ASREdgeAlibabaLabelxLegacyBridge;
  const annotationInteractionRunner = window.__ASREdgeAlibabaLabelxAnnotationInteractionRunner;
  const annotationPageFlowRunner = window.__ASREdgeAlibabaLabelxAnnotationPageFlowRunner;
  const annotationFlowReport = window.__ASREdgeAlibabaLabelxAnnotationFlowReport;

  let scheduledTimer = null;
  let bridgeUnsubscribe = null;
  let runLock = false;

  if (!runtimeGate || !pageStateCollector || !annotationPageFlowRunner) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function getPageState() {
    return typeof pageStateCollector.collectPageState === "function"
      ? pageStateCollector.collectPageState()
      : {
          isTargetSite: location.hostname.indexOf("labelx.alibaba-inc.com") >= 0,
          pageType: "unknown",
          routeKey: "unknown",
          contextInfo: {},
        };
  }

  async function getPlatformSettings() {
    const settings = await runtimeGate.getSettings();
    return settings?.platforms?.alibabaLabelx || {};
  }

  function clearScheduledTimer() {
    if (!scheduledTimer) {
      return;
    }

    window.clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  function getProjectId(pageState) {
    const contextProjectId = pageState?.contextInfo?.projectId;
    if (contextProjectId) {
      return contextProjectId;
    }

    const search = new URLSearchParams(location.search);
    return search.get("projectId") || search.get("appId") || "1023";
  }

  function getMissionType(pageState) {
    const contextMissionType = pageState?.contextInfo?.missionType;
    if (contextMissionType) {
      return contextMissionType;
    }

    const search = new URLSearchParams(location.search);
    if (search.get("missionType")) {
      return search.get("missionType");
    }

    return location.pathname.toLowerCase().includes("checktask") ? "check" : "label";
  }

  function normalizeTaskRows(rows) {
    return Array.isArray(rows) ? rows.filter(Boolean) : [];
  }

  async function fetchCurrentTaskRows(pageState) {
    const cachedRows =
      legacyBridge && typeof legacyBridge.getCurrentPageTasks === "function"
        ? legacyBridge.getCurrentPageTasks()
        : [];
    if (Array.isArray(cachedRows) && cachedRows.length > 0) {
      return cachedRows;
    }

    const missionType = getMissionType(pageState);
    const projectId = getProjectId(pageState);
    const response = await fetch(
      "/api/v1/label/center/subTasks?type=" +
        encodeURIComponent(missionType) +
        "&keyword=&appId=" +
        encodeURIComponent(projectId) +
        "&finished=false&page=1&pageSize=100&_=" +
        Date.now(),
      { cache: "no-store" }
    );
    const json = response.ok ? await response.json() : null;
    return normalizeTaskRows(json?.data?.data);
  }

  function pickNextTask(rows) {
    return rows.find(function (task) {
      return task?.id && task?.rejectReason == null;
    }) || rows.find(function (task) {
      return task?.id;
    }) || null;
  }

  async function navigateToNextTask(request) {
    const options = request && typeof request === "object" ? request : {};
    const pageState = options.pageState || getPageState();
    const rows = await fetchCurrentTaskRows(pageState);
    const nextTask = pickNextTask(rows);

    if (!nextTask?.id) {
      return {
        success: false,
        reason: "next-task-not-found",
        count: rows.length,
        summaryText: "当前没有可自动流转的下一任务。",
      };
    }

    const missionType = getMissionType(pageState);
    const projectId = getProjectId(pageState);
    const targetUrl =
      "/corpora/labeling/sdk?missionType=" +
      encodeURIComponent(missionType) +
      "&projectId=" +
      encodeURIComponent(projectId) +
      "&subTaskId=" +
      encodeURIComponent(nextTask.id);

    if (options.navigate !== false) {
      const delayMs = Math.max(0, Number.parseInt(options.delayMs, 10) || 0);
      if (delayMs > 0) {
        await wait(delayMs);
      }
      location.href = targetUrl;
    }

    return {
      success: true,
      reason: "next-task-found",
      targetUrl: targetUrl,
      nextTaskId: String(nextTask.id),
      summaryText: "已定位下一任务并准备跳转。",
    };
  }

  async function runValidationIfNeeded(platformSettings) {
    const automation = platformSettings.automation || {};
    const safety = platformSettings.safety || {};
    const shouldValidate =
      automation.validateBeforeSubmit === true || safety.validateBeforeSubmit === true;

    if (!shouldValidate) {
      return {
        success: true,
        skipped: true,
        reason: "validation-skipped",
      };
    }

    if (!annotationInteractionRunner || typeof annotationInteractionRunner.execute !== "function") {
      return {
        success: false,
        skipped: false,
        reason: "interaction-runner-missing",
      };
    }

    const validationResult = await annotationInteractionRunner.execute("validate-page", {
      silentHistory: true,
      silentNotify: true,
    });

    return {
      success: validationResult?.ok === true,
      skipped: false,
      reason: validationResult?.reason || "validation-failed",
      result: validationResult,
    };
  }

  async function runNow(request) {
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      summaryText: "当前基础转写阶段已禁用批量提交和自动流转。",
    };
  }

  async function refresh(trigger) {
    clearScheduledTimer();
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      trigger: trigger || "manual",
      summaryText: "当前基础转写阶段已禁用批量提交和自动流转。",
    };
  }

  function bindBridge() {
    if (bridgeUnsubscribe || !legacyBridge || typeof legacyBridge.subscribe !== "function") {
      return;
    }

    bridgeUnsubscribe = legacyBridge.subscribe(function (detail) {
      const type = detail?.type || "";
      if (
        type === "data-loaded" ||
        type === "timer-triggered" ||
        type === "current-page-tasks-ready"
      ) {
        void refresh(type);
      }
    });
  }

  function start() {
    bindBridge();
    return refresh("start");
  }

  function stop() {
    clearScheduledTimer();
    if (bridgeUnsubscribe) {
      bridgeUnsubscribe();
      bridgeUnsubscribe = null;
    }

    return {
      success: true,
      stopped: true,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyBatchFlow = {
    start: start,
    stop: stop,
    refresh: refresh,
    runNow: runNow,
    navigateToNextTask: navigateToNextTask,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
