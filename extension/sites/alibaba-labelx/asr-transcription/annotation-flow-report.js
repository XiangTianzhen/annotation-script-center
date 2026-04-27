(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-flow-report]";

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function looksLikePhase(value) {
    if (!isObject(value)) {
      return false;
    }

    return hasOwn(value, "ran") && hasOwn(value, "succeeded") && hasOwn(value, "skipped");
  }

  function looksLikePageFlowResult(value) {
    if (!isObject(value)) {
      return false;
    }

    return (
      looksLikePhase(value.applyPhase) &&
      looksLikePhase(value.savePhase) &&
      looksLikePhase(value.submitPhase) &&
      hasOwn(value, "completed") &&
      hasOwn(value, "reason")
    );
  }

  function normalizeMeta(flowResult) {
    if (!isObject(flowResult)) {
      return {
        pageType: "unknown",
        routeKey: "non-target",
        taskId: null,
        matched: false,
        completed: false,
        reason: "flow-error",
      };
    }

    return {
      pageType: typeof flowResult.pageType === "string" ? flowResult.pageType : "unknown",
      routeKey: typeof flowResult.routeKey === "string" ? flowResult.routeKey : "non-target",
      taskId: typeof flowResult.taskId === "string" ? flowResult.taskId : null,
      matched: typeof flowResult.matched === "boolean" ? flowResult.matched : false,
      completed: typeof flowResult.completed === "boolean" ? flowResult.completed : false,
      reason: typeof flowResult.reason === "string" ? flowResult.reason : "flow-error",
    };
  }

  function normalizePhase(phaseInput) {
    if (!looksLikePhase(phaseInput)) {
      return {
        ran: false,
        succeeded: false,
        skipped: false,
        reason: "unknown",
      };
    }

    return {
      ran: phaseInput.ran === true,
      succeeded: phaseInput.succeeded === true,
      skipped: phaseInput.skipped === true,
      reason: typeof phaseInput.reason === "string" ? phaseInput.reason : "unknown",
    };
  }

  function createBaseReport(meta) {
    return {
      pageType: meta.pageType,
      routeKey: meta.routeKey,
      taskId: meta.taskId,
      matched: meta.matched,
      completed: meta.completed,
      reason: meta.reason,
      phaseSummary: {
        applyPhase: normalizePhase(null),
        savePhase: normalizePhase(null),
        submitPhase: normalizePhase(null),
      },
      summaryText: "",
      lines: [],
      warnings: [],
    };
  }

  function getApplyCounts(flowResult) {
    const applyPhase = isObject(flowResult) && isObject(flowResult.applyPhase) ? flowResult.applyPhase : {};
    const applyResult = isObject(flowResult) && isObject(flowResult.applyResult) ? flowResult.applyResult : {};

    const plannedCount =
      typeof applyPhase.plannedCount === "number"
        ? applyPhase.plannedCount
        : typeof applyResult.plannedCount === "number"
          ? applyResult.plannedCount
          : 0;
    const appliedCount =
      typeof applyPhase.appliedCount === "number"
        ? applyPhase.appliedCount
        : typeof applyResult.successCount === "number"
          ? applyResult.successCount
          : 0;

    return {
      plannedCount: plannedCount,
      appliedCount: appliedCount,
    };
  }

  function formatApplyLine(flowResult, phaseSummary) {
    const counts = getApplyCounts(flowResult);

    if (!phaseSummary.applyPhase.ran) {
      return "Apply phase did not run.";
    }

    if (phaseSummary.applyPhase.reason === "apply-not-needed") {
      return "Apply phase ran, found no extra auto-apply items, and handed control to save/submit.";
    }

    if (phaseSummary.applyPhase.succeeded) {
      return (
        "Apply phase ran and met the local success condition (applied " +
        counts.appliedCount +
        " of planned " +
        counts.plannedCount +
        " items)."
      );
    }

    if (phaseSummary.applyPhase.reason === "apply-not-needed") {
      return "Apply phase ran, found no actionable execution items, and stopped before save.";
    }

    return "Apply phase ended without local success (reason=" + phaseSummary.applyPhase.reason + ").";
  }

  function formatSaveLine(flowResult, phaseSummary) {
    const saveResult = isObject(flowResult) && isObject(flowResult.saveResult) ? flowResult.saveResult : null;

    if (!phaseSummary.savePhase.ran) {
      return "Save phase did not run.";
    }

    if (phaseSummary.savePhase.succeeded) {
      const saveReason = saveResult && typeof saveResult.reason === "string" ? saveResult.reason : "unknown";
      return "Save phase ran and reached a confirmed save result (reason=" + saveReason + ").";
    }

    if (phaseSummary.savePhase.skipped) {
      const saveReason = saveResult && typeof saveResult.reason === "string" ? saveResult.reason : phaseSummary.savePhase.reason;
      return "Save phase was stopped by local gating or local state (reason=" + saveReason + ").";
    }

    return "Save phase ran but did not reach a local continuation result (reason=" + phaseSummary.savePhase.reason + ").";
  }

  function formatSubmitLine(flowResult, phaseSummary) {
    const submitResult =
      isObject(flowResult) && isObject(flowResult.submitResult) ? flowResult.submitResult : null;

    if (!phaseSummary.submitPhase.ran) {
      return "Submit phase did not run.";
    }

    if (phaseSummary.submitPhase.succeeded) {
      const submitReason =
        submitResult && typeof submitResult.reason === "string" ? submitResult.reason : "unknown";
      return "Submit phase ran and dispatched one local submit attempt (reason=" + submitReason + ").";
    }

    if (phaseSummary.submitPhase.skipped) {
      const submitReason =
        submitResult && typeof submitResult.reason === "string"
          ? submitResult.reason
          : phaseSummary.submitPhase.reason;
      return "Submit phase was stopped by local gating or local state (reason=" + submitReason + ").";
    }

    return "Submit phase ran but did not reach a local success result (reason=" + phaseSummary.submitPhase.reason + ").";
  }

  function createSummaryText(report, flowResult) {
    if (!looksLikePageFlowResult(flowResult)) {
      return "当前没有可消费的 page flow 真实结果对象，流程验收报告返回空摘要。";
    }

    if (!report.matched || report.reason === "non-target" || report.routeKey === "non-target") {
      return "当前结果未命中目标站点或目标页面，流程验收报告未进入单页完整受控流程。";
    }

    if (report.reason === "non-task-detail") {
      return "当前页面不是 task-detail，流程在 apply 前置检查后结束。";
    }

    if (report.reason === "apply-not-needed") {
      return "当前 task-detail 页面没有额外需要执行的 apply 项，流程已转入后续 save / submit。";
    }

    if (report.reason === "apply-failed") {
      return "当前流程在 apply 阶段结束；这只说明本地 apply 没有达到继续进入 save 的条件。";
    }

    if (report.reason === "save-skipped" || report.reason === "save-failed") {
      return "当前流程在 save 阶段结束；这只说明本地 save 继续条件未满足或本地 save 结果不足以继续。";
    }

    if (report.reason === "submit-skipped" || report.reason === "submit-failed") {
      return "当前流程在 submit 阶段结束；这只说明本地 submit 继续条件未满足或本地 submit 结果不足以形成本地成功。";
    }

    if (report.reason === "ok") {
      return "当前单页 apply -> save -> submit 三阶段都满足本地受控流程的成功语义，但这仍不是服务端最终成功确认。";
    }

    if (report.reason === "flow-error") {
      return "当前流程在报告输入或运行结果层面发生异常，验收结论只能停留在本地错误。";
    }

    return "当前流程已经结束，并返回了可人工核对的本地阶段结果。";
  }

  function pushWarning(warnings, text) {
    if (typeof text !== "string" || text.length === 0) {
      return;
    }

    if (!warnings.includes(text)) {
      warnings.push(text);
    }
  }

  function deriveWarnings(flowResult, report) {
    const warnings = [];
    const saveResult = isObject(flowResult) && isObject(flowResult.saveResult) ? flowResult.saveResult : null;
    const submitResult =
      isObject(flowResult) && isObject(flowResult.submitResult) ? flowResult.submitResult : null;
    const applyCounts = getApplyCounts(flowResult);

    if (report.phaseSummary.applyPhase.succeeded || applyCounts.appliedCount > 0) {
      pushWarning(
        warnings,
        "Any applied/apply-success signal in this flow only means the local apply stage finished its own local readback; it does not mean save, submit, or server completion."
      );
    }

    if (saveResult && saveResult.clicked === true) {
      pushWarning(
        warnings,
        "saveResult.clicked=true only means one local save click was dispatched; it does not prove server-side save completion."
      );
    }

    if (submitResult && submitResult.clicked === true) {
      pushWarning(
        warnings,
        "submitResult.clicked=true only means one local submit click was dispatched; it does not prove server-side submit completion."
      );
    }

    if (report.completed === true) {
      pushWarning(
        warnings,
        "completed=true only means the local controlled flow reached a clear stopping point with explicit phase results; it is not a server-final success signal."
      );
    }

    if (report.reason === "ok") {
      pushWarning(
        warnings,
        "Top-level reason=ok only means the local flow met its own phase success rules. It must not be read as server-final success."
      );
    }

    if (
      saveResult &&
      (saveResult.reason === "click-dispatched" || saveResult.reason === "local-click-dispatched")
    ) {
      pushWarning(
        warnings,
        "A local save-dispatch reason only proves the local click path ran; it is weaker than server confirmation."
      );
    }

    if (
      submitResult &&
      (submitResult.reason === "click-dispatched" || submitResult.reason === "submit-dispatched")
    ) {
      pushWarning(
        warnings,
        "A local submit-dispatch reason only proves the local click path ran; it is weaker than server confirmation."
      );
    }

    return warnings;
  }

  function createFlowReport(flowReportInput) {
    const meta = normalizeMeta(flowReportInput);
    const report = createBaseReport(meta);

    try {
      if (!looksLikePageFlowResult(flowReportInput)) {
        report.summaryText = createSummaryText(report, null);
        report.lines = [
          "Flow report input is not a recognized page flow result object.",
          "No local phase summary was generated.",
        ];
        report.warnings = [
          "The acceptance report can only explain a real annotation-page-flow-runner result object.",
        ];
        return report;
      }

      report.phaseSummary = {
        applyPhase: normalizePhase(flowReportInput.applyPhase),
        savePhase: normalizePhase(flowReportInput.savePhase),
        submitPhase: normalizePhase(flowReportInput.submitPhase),
      };
      report.summaryText = createSummaryText(report, flowReportInput);
      report.lines = [
        formatApplyLine(flowReportInput, report.phaseSummary),
        formatSaveLine(flowReportInput, report.phaseSummary),
        formatSubmitLine(flowReportInput, report.phaseSummary),
      ];

      if (
        isObject(flowReportInput.pageReportAfterApply) &&
        typeof flowReportInput.pageReportAfterApply.summaryText === "string"
      ) {
        report.lines.splice(1, 0, "Apply readback summary: " + flowReportInput.pageReportAfterApply.summaryText);
      }

      report.warnings = deriveWarnings(flowReportInput, report);
      return report;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to create flow report:", error);
      report.summaryText = "流程验收报告生成失败。";
      report.lines = ["Flow report creation failed due to a local reporting error."];
      report.warnings = [
        "The reporting layer failed locally. Do not infer any save or submit result from this failure.",
      ];
      report.reason = "flow-error";
      return report;
    }
  }

  function logFlowReport(flowReportResult) {
    const logMethod = flowReportResult.reason === "ok" ? console.info : console.warn;

    logMethod(LOG_PREFIX, flowReportResult.summaryText, {
      pageType: flowReportResult.pageType,
      routeKey: flowReportResult.routeKey,
      taskId: flowReportResult.taskId,
      matched: flowReportResult.matched,
      completed: flowReportResult.completed,
      reason: flowReportResult.reason,
      phaseSummary: flowReportResult.phaseSummary,
      lines: flowReportResult.lines,
      warnings: flowReportResult.warnings,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationFlowReport = {
    report: createFlowReport,
    log: logFlowReport,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
