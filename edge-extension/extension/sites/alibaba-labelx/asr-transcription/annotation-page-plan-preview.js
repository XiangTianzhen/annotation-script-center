(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-page-plan-preview]";
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationApplyPolicy = window.__ASREdgeAlibabaLabelxAnnotationApplyPolicy;

  if (!annotationItemCollector || !annotationApplyPolicy) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(previewRequest) {
    const request = previewRequest && typeof previewRequest === "object" ? previewRequest : {};
    const maxItems = Number.isInteger(request.maxItems) && request.maxItems > 0 ? request.maxItems : null;

    return {
      onlyActionable: request.onlyActionable === true,
      maxItems: maxItems,
    };
  }

  function createBasePreviewResult(snapshotResult, request) {
    return {
      pageType:
        snapshotResult && typeof snapshotResult.pageType === "string"
          ? snapshotResult.pageType
          : "unknown",
      routeKey:
        snapshotResult && typeof snapshotResult.routeKey === "string"
          ? snapshotResult.routeKey
          : "non-target",
      taskId:
        snapshotResult && typeof snapshotResult.taskId === "string" ? snapshotResult.taskId : null,
      matched: Boolean(snapshotResult && snapshotResult.matched),
      itemCount:
        snapshotResult && typeof snapshotResult.itemCount === "number" ? snapshotResult.itemCount : 0,
      actionableCount: 0,
      previewedCount: 0,
      onlyActionable: request.onlyActionable,
      maxItems: request.maxItems,
      plans: [],
      summaryText: "",
    };
  }

  function summarizePreview(result) {
    if (result.routeKey === "non-target" || result.pageType === "unknown") {
      return "当前页面未命中 Alibaba LabelX task-detail 计划预览场景。";
    }

    if (result.pageType !== "task-detail") {
      return "当前页面不是 task-detail，未生成整页只读计划预览。";
    }

    if (result.itemCount === 0) {
      return "当前 task-detail 页面未命中标注项，暂无可预览计划。";
    }

    const filterText = result.onlyActionable ? "，仅展示可执行计划" : "";
    const limitText =
      typeof result.maxItems === "number"
        ? "，已按 maxItems 预览前 " + result.previewedCount + " 条"
        : "，已预览全部 " + result.previewedCount + " 条";

    return (
      "当前 task-detail 页面共命中 " +
      result.itemCount +
      " 条标注项，预览中发现 " +
      result.actionableCount +
      " 条可执行计划" +
      filterText +
      limitText +
      "。"
    );
  }

  function mapPlan(planResult) {
    return {
      itemIndex: typeof planResult?.itemIndex === "number" ? planResult.itemIndex : -1,
      actionable: Boolean(planResult && planResult.actionable),
      reason: typeof planResult?.reason === "string" ? planResult.reason : "non-target",
      recommendedQuickfill: Boolean(planResult && planResult.recommendedQuickfill),
      recommendedTextAction:
        typeof planResult?.suggestedApplyInput?.textAction === "string"
          ? planResult.suggestedApplyInput.textAction
          : null,
      recommendedValidity:
        typeof planResult?.recommendedValidity === "string" ? planResult.recommendedValidity : null,
      suggestedApplyInput:
        planResult && planResult.suggestedApplyInput && typeof planResult.suggestedApplyInput === "object"
          ? planResult.suggestedApplyInput
          : null,
      reasonDetails:
        typeof planResult?.reasonDetails === "string" ? planResult.reasonDetails : null,
    };
  }

  function previewPagePlans(previewRequest, pageStateInput) {
    const request = normalizeRequest(previewRequest);
    const snapshotResult =
      typeof annotationItemCollector.collect === "function"
        ? annotationItemCollector.collect(pageStateInput)
        : null;
    const result = createBasePreviewResult(snapshotResult, request);

    try {
      if (!snapshotResult || snapshotResult.routeKey === "non-target") {
        result.summaryText = summarizePreview(result);
        return result;
      }

      if (snapshotResult.pageType !== "task-detail") {
        result.summaryText = summarizePreview(result);
        return result;
      }

      const totalItems = Array.isArray(snapshotResult.items) ? snapshotResult.items.length : 0;
      const previewLimit =
        typeof request.maxItems === "number" ? Math.min(totalItems, request.maxItems) : totalItems;
      const previewedPlans = [];

      for (let itemIndex = 0; itemIndex < previewLimit; itemIndex += 1) {
        const planResult =
          typeof annotationApplyPolicy.plan === "function"
            ? annotationApplyPolicy.plan(
                {
                  itemIndex: itemIndex,
                },
                pageStateInput
              )
            : null;

        previewedPlans.push(mapPlan(planResult));
      }

      result.previewedCount = previewedPlans.length;
      result.actionableCount = previewedPlans.filter(function (plan) {
        return plan.actionable;
      }).length;
      result.plans = request.onlyActionable
        ? previewedPlans.filter(function (plan) {
            return plan.actionable;
          })
        : previewedPlans;
      result.summaryText = summarizePreview(result);
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to preview page plans:", error);
      result.summaryText = "整页只读计划预览生成失败。";
      return result;
    }
  }

  function logPreviewResult(previewResult) {
    const logMethod = previewResult.actionableCount > 0 ? console.info : console.warn;

    logMethod(LOG_PREFIX, previewResult.summaryText, {
      pageType: previewResult.pageType,
      routeKey: previewResult.routeKey,
      taskId: previewResult.taskId,
      matched: previewResult.matched,
      itemCount: previewResult.itemCount,
      actionableCount: previewResult.actionableCount,
      previewedCount: previewResult.previewedCount,
      onlyActionable: previewResult.onlyActionable,
      maxItems: previewResult.maxItems,
      plans: previewResult.plans,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationPagePlanPreview = {
    preview: previewPagePlans,
    log: logPreviewResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
