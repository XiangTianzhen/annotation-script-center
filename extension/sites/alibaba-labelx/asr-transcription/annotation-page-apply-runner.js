(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-page-apply-runner]";
  const annotationPagePlanPreview = window.__ASREdgeAlibabaLabelxAnnotationPagePlanPreview;
  const annotationPolicyExecutor = window.__ASREdgeAlibabaLabelxAnnotationPolicyExecutor;

  if (!annotationPagePlanPreview || !annotationPolicyExecutor) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(pageApplyRequest) {
    const request = pageApplyRequest && typeof pageApplyRequest === "object" ? pageApplyRequest : {};
    const maxItems = Number.isInteger(request.maxItems) && request.maxItems > 0 ? request.maxItems : null;

    return {
      onlyActionable: request.onlyActionable !== false,
      maxItems: maxItems,
    };
  }

  function createBasePageApplyResult(previewResult, request) {
    return {
      pageType:
        previewResult && typeof previewResult.pageType === "string"
          ? previewResult.pageType
          : "unknown",
      routeKey:
        previewResult && typeof previewResult.routeKey === "string"
          ? previewResult.routeKey
          : "non-target",
      taskId:
        previewResult && typeof previewResult.taskId === "string" ? previewResult.taskId : null,
      matched: Boolean(previewResult && previewResult.matched),
      itemCount:
        previewResult && typeof previewResult.itemCount === "number" ? previewResult.itemCount : 0,
      plannedCount: 0,
      executedCount: 0,
      successCount: 0,
      failedCount: 0,
      onlyActionable: request.onlyActionable,
      maxItems: request.maxItems,
      results: [],
      summaryText: "",
    };
  }

  function hasSuggestedApplyInput(plan) {
    return Boolean(plan && plan.suggestedApplyInput && typeof plan.suggestedApplyInput === "object");
  }

  function isExecutablePlan(plan) {
    return Boolean(plan && plan.actionable && hasSuggestedApplyInput(plan));
  }

  function selectPlannedItems(plans, request) {
    const allPlans = Array.isArray(plans) ? plans : [];
    const filteredPlans = request.onlyActionable
      ? allPlans.filter(function (plan) {
          return plan && plan.actionable;
        })
      : allPlans;

    if (typeof request.maxItems === "number") {
      return filteredPlans.slice(0, request.maxItems);
    }

    return filteredPlans;
  }

  function createResultEntry(plan, executionResult) {
    const itemIndex = typeof plan?.itemIndex === "number" ? plan.itemIndex : -1;
    const executable =
      executionResult && typeof executionResult.executable === "boolean"
        ? executionResult.executable
        : isExecutablePlan(plan);
    const executed =
      executionResult && typeof executionResult.executed === "boolean"
        ? executionResult.executed
        : false;
    const reason =
      executionResult && typeof executionResult.reason === "string"
        ? executionResult.reason
        : executable
          ? "execute-unavailable"
          : "no-safe-action";

    return {
      itemIndex: itemIndex,
      executable: executable,
      executed: executed,
      reason: reason,
      plan: plan || null,
      applyResult:
        executionResult && executionResult.applyResult && typeof executionResult.applyResult === "object"
          ? executionResult.applyResult
          : null,
      feedbackAfter:
        executionResult &&
        executionResult.feedbackAfter &&
        typeof executionResult.feedbackAfter === "object"
          ? executionResult.feedbackAfter
          : null,
    };
  }

  function summarizeResult(result) {
    if (result.routeKey === "non-target" || result.pageType === "unknown") {
      return "当前页面未命中 Alibaba LabelX task-detail 整页受控执行场景。";
    }

    if (result.pageType !== "task-detail") {
      return "当前页面不是 task-detail，未执行整页受控执行器。";
    }

    if (result.itemCount === 0) {
      return "当前 task-detail 页面未命中标注项，暂无可执行计划。";
    }

    if (result.plannedCount === 0) {
      return "当前 task-detail 页面没有命中本轮允许执行的计划。";
    }

    return (
      "当前 task-detail 页面共命中 " +
      result.itemCount +
      " 条标注项，本轮受控执行计划 " +
      result.plannedCount +
      " 条，已顺序调用执行助手 " +
      result.executedCount +
      " 条，成功 " +
      result.successCount +
      " 条，失败 " +
      result.failedCount +
      " 条。"
    );
  }

  function runPageApply(pageApplyRequest, pageStateInput) {
    const request = normalizeRequest(pageApplyRequest);
    const previewResult =
      typeof annotationPagePlanPreview.preview === "function"
        ? annotationPagePlanPreview.preview(
            {
              onlyActionable: false,
              maxItems: null,
            },
            pageStateInput
          )
        : null;
    const result = createBasePageApplyResult(previewResult, request);

    try {
      if (!previewResult || previewResult.routeKey === "non-target") {
        result.summaryText = summarizeResult(result);
        return result;
      }

      if (previewResult.pageType !== "task-detail") {
        result.summaryText = summarizeResult(result);
        return result;
      }

      const selectedPlans = selectPlannedItems(previewResult.plans, request);
      result.plannedCount = selectedPlans.length;

      for (const plan of selectedPlans) {
        const itemIndex = typeof plan?.itemIndex === "number" ? plan.itemIndex : -1;
        const executionResult =
          typeof annotationPolicyExecutor.run === "function"
            ? annotationPolicyExecutor.run(
                {
                  itemIndex: itemIndex,
                },
                pageStateInput
              )
            : null;

        result.results.push(createResultEntry(plan, executionResult));
      }

      result.executedCount = result.results.length;
      result.successCount = result.results.filter(function (entry) {
        return entry.executed;
      }).length;
      result.failedCount = result.executedCount - result.successCount;
      result.summaryText = summarizeResult(result);
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to run page apply runner:", error);
      result.summaryText = "整页受控执行器在运行时发生异常。";
      return result;
    }
  }

  function logPageApplyResult(pageApplyResult) {
    const logMethod = pageApplyResult.successCount > 0 ? console.info : console.warn;

    logMethod(LOG_PREFIX, pageApplyResult.summaryText, {
      pageType: pageApplyResult.pageType,
      routeKey: pageApplyResult.routeKey,
      taskId: pageApplyResult.taskId,
      matched: pageApplyResult.matched,
      itemCount: pageApplyResult.itemCount,
      plannedCount: pageApplyResult.plannedCount,
      executedCount: pageApplyResult.executedCount,
      successCount: pageApplyResult.successCount,
      failedCount: pageApplyResult.failedCount,
      onlyActionable: pageApplyResult.onlyActionable,
      maxItems: pageApplyResult.maxItems,
      results: pageApplyResult.results,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationPageApplyRunner = {
    run: runPageApply,
    log: logPageApplyResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
