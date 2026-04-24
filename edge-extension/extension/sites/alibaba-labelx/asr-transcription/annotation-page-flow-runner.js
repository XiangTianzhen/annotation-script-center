(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-page-flow-runner]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const pageStateCollector = window.__ASREdgePageStateCollector;
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;
  const annotationPageApplyRunner = window.__ASREdgeAlibabaLabelxAnnotationPageApplyRunner;
  const annotationPageReport = window.__ASREdgeAlibabaLabelxAnnotationPageReport;
  const annotationSaveRunner = window.__ASREdgeAlibabaLabelxAnnotationSaveRunner;
  const annotationSubmitRunner = window.__ASREdgeAlibabaLabelxAnnotationSubmitRunner;

  if (
    !siteContract ||
    !pageStateCollector ||
    !annotationPageApplyRunner ||
    !annotationPageReport ||
    !annotationSaveRunner ||
    !annotationSubmitRunner
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  async function getPlatformSettings() {
    if (!runtimeGate || typeof runtimeGate.getSettings !== "function") {
      return {};
    }

    const settings = await runtimeGate.getSettings();
    return settings?.platforms?.alibabaLabelx || {};
  }

  function normalizeRequest(flowRequest) {
    const request = flowRequest && typeof flowRequest === "object" ? flowRequest : {};
    const maxItems = Number.isInteger(request.maxItems) && request.maxItems > 0 ? request.maxItems : null;

    return {
      onlyActionable: request.onlyActionable !== false,
      maxItems: maxItems,
      forceSaveClick: request.forceSaveClick === true,
      forceSubmitClick: request.forceSubmitClick === true,
      preferSubmitTask: request.preferSubmitTask === true,
    };
  }

  function resolvePageState(pageStateInput) {
    if (pageStateInput && typeof pageStateInput === "object") {
      return pageStateInput;
    }

    return typeof pageStateCollector.collectPageState === "function"
      ? pageStateCollector.collectPageState()
      : siteContract.createBasePageState({
          hostname: location.hostname,
          pathname: location.pathname,
          search: location.search,
          pageTitle: document.title || "",
        });
  }

  function extractTaskId(pageState) {
    return pageState?.contextInfo?.taskId || null;
  }

  function createPhase(reason, extra) {
    return Object.assign(
      {
        ran: false,
        succeeded: false,
        skipped: false,
        reason: reason,
      },
      extra || {}
    );
  }

  function createBaseResult(pageState) {
    return {
      pageType: pageState?.pageType || "unknown",
      routeKey: pageState?.routeKey || "non-target",
      taskId: extractTaskId(pageState),
      matched: Boolean(pageState?.isTargetSite && pageState?.pageType === "task-detail"),
      applyPhase: createPhase("flow-pending"),
      savePhase: createPhase("save-skipped", { skipped: true }),
      submitPhase: createPhase("submit-skipped", { skipped: true }),
      completed: false,
      reason: "flow-pending",
      applyResult: null,
      pageReportAfterApply: null,
      saveResult: null,
      submitResult: null,
    };
  }

  function syncMeta(result, candidate) {
    if (!candidate || typeof candidate !== "object") {
      return result;
    }

    if (typeof candidate.pageType === "string") {
      result.pageType = candidate.pageType;
    }

    if (typeof candidate.routeKey === "string") {
      result.routeKey = candidate.routeKey;
    }

    if (typeof candidate.taskId === "string") {
      result.taskId = candidate.taskId;
    }

    if (typeof candidate.matched === "boolean") {
      result.matched = candidate.matched;
    }

    return result;
  }

  function getApplyCounts(applyResult) {
    return {
      plannedCount: Number.isFinite(applyResult?.plannedCount) ? applyResult.plannedCount : 0,
      successCount: Number.isFinite(applyResult?.successCount) ? applyResult.successCount : 0,
    };
  }

  function deriveApplyPhase(applyResult) {
    const counts = getApplyCounts(applyResult);

    if (!applyResult || typeof applyResult !== "object") {
      return createPhase("apply-result-missing");
    }

    if (applyResult.routeKey === "non-target") {
      return createPhase("non-target", { ran: true });
    }

    if (applyResult.pageType !== "task-detail") {
      return createPhase("non-task-detail", { ran: true });
    }

    if (counts.successCount > 0) {
      return createPhase("ok", {
        ran: true,
        succeeded: true,
        plannedCount: counts.plannedCount,
        successCount: counts.successCount,
      });
    }

    if (counts.plannedCount === 0) {
      return createPhase("apply-not-needed", {
        ran: true,
        succeeded: true,
        plannedCount: 0,
        successCount: 0,
      });
    }

    return createPhase("apply-failed", {
      ran: true,
      plannedCount: counts.plannedCount,
      successCount: counts.successCount,
    });
  }

  function isSavePersisted(saveResult) {
    if (!saveResult || typeof saveResult !== "object") {
      return false;
    }

    return saveResult.persisted === true || saveResult.saved === true;
  }

  function deriveSavePhase(saveResult) {
    if (!saveResult || typeof saveResult !== "object") {
      return createPhase("save-result-missing");
    }

    if (isSavePersisted(saveResult)) {
      return createPhase("ok", {
        ran: true,
        succeeded: true,
        clickable: Boolean(saveResult.clickable),
        clicked: Boolean(saveResult.clicked),
        dispatched: Boolean(saveResult.dispatched),
        persisted: true,
        manualSaveSupported: saveResult.manualSaveSupported === true,
      });
    }

    if (saveResult.reason === "non-target" || saveResult.reason === "non-task-detail") {
      return createPhase(saveResult.reason, { ran: true });
    }

    return createPhase(saveResult.reason || "save-failed", {
      ran: true,
      clickable: Boolean(saveResult.clickable),
      clicked: Boolean(saveResult.clicked),
      dispatched: Boolean(saveResult.dispatched),
      persisted: false,
      manualSaveSupported: saveResult.manualSaveSupported === true,
    });
  }

  function deriveSubmitPhase(submitResult) {
    if (!submitResult || typeof submitResult !== "object") {
      return createPhase("submit-result-missing");
    }

    if (submitResult.submitted === true) {
      return createPhase("ok", {
        ran: true,
        succeeded: true,
        clickable: Boolean(submitResult.clickable),
        clicked: Boolean(submitResult.clicked),
        submitAction: submitResult.submitAction || null,
      });
    }

    return createPhase(submitResult.reason || "submit-failed", {
      ran: true,
      clickable: Boolean(submitResult.clickable),
      clicked: Boolean(submitResult.clicked),
      submitAction: submitResult.submitAction || null,
    });
  }

  async function runPageFlow(flowRequest, pageStateInput) {
    const request = normalizeRequest(flowRequest);
    const pageState = resolvePageState(pageStateInput);
    const result = createBaseResult(pageState);
    const platformSettings = await getPlatformSettings();
    const preferSubmitTask =
      request.preferSubmitTask === true || platformSettings?.automation?.autoReceiveOnSubmit === true;

    try {
      result.applyResult = annotationPageApplyRunner.run(
        {
          onlyActionable: request.onlyActionable,
          maxItems: request.maxItems,
        },
        pageState
      );
      syncMeta(result, result.applyResult);

      result.pageReportAfterApply =
        typeof annotationPageReport.report === "function"
          ? annotationPageReport.report(result.applyResult)
          : null;
      syncMeta(result, result.pageReportAfterApply);
      result.applyPhase = deriveApplyPhase(result.applyResult);

      if (result.applyPhase.reason === "non-target") {
        result.completed = true;
        result.reason = "non-target";
        return result;
      }

      if (result.applyPhase.reason === "non-task-detail") {
        result.completed = true;
        result.reason = "non-task-detail";
        return result;
      }

      if (result.applyPhase.reason === "apply-failed") {
        result.completed = true;
        result.reason = "apply-failed";
        return result;
      }

      result.saveResult = await annotationSaveRunner.run(
        {
          forceClick: request.forceSaveClick,
          blurFirst: true,
          reloadAfter: false,
          buildPayload: true,
        },
        resolvePageState(null)
      );
      syncMeta(result, result.saveResult);
      result.savePhase = deriveSavePhase(result.saveResult);

      if (!result.savePhase.succeeded) {
        result.completed = true;
        result.reason = result.savePhase.reason;
        return result;
      }

      result.submitResult = await annotationSubmitRunner.run(
        {
          forceClick: request.forceSubmitClick,
          requireSafeSave: true,
          uploadStats: true,
          preferSubmitTask: preferSubmitTask,
        },
        resolvePageState(null)
      );
      syncMeta(result, result.submitResult);
      result.submitPhase = deriveSubmitPhase(result.submitResult);

      result.completed = true;
      result.reason = result.submitPhase.succeeded ? "ok" : result.submitPhase.reason;
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to run page flow runner:", error);
      result.completed = false;
      result.reason = "flow-error";
      result.error = error && error.message ? error.message : String(error);
      return result;
    }
  }

  function logPageFlowResult(pageFlowResult) {
    const logMethod = pageFlowResult.reason === "ok" ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation page flow result:", pageFlowResult);
  }

  window.__ASREdgeAlibabaLabelxAnnotationPageFlowRunner = {
    run: runPageFlow,
    log: logPageFlowResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
