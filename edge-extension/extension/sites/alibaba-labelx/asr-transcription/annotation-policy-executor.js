(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-policy-executor]";
  const annotationApplyPolicy = window.__ASREdgeAlibabaLabelxAnnotationApplyPolicy;
  const annotationApplyRunner = window.__ASREdgeAlibabaLabelxAnnotationApplyRunner;
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;
  const annotationFeedback = window.__ASREdgeAlibabaLabelxAnnotationFeedback;

  if (
    !annotationApplyPolicy ||
    !annotationApplyRunner ||
    !annotationItemCollector ||
    !annotationItemValidator ||
    !annotationFeedback
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(executeRequest) {
    const request = executeRequest && typeof executeRequest === "object" ? executeRequest : {};

    return {
      itemIndex: Number.isInteger(request.itemIndex) ? request.itemIndex : -1,
    };
  }

  function createBaseExecutionResult(planResult, itemIndex) {
    return {
      pageType:
        planResult && typeof planResult.pageType === "string" ? planResult.pageType : "unknown",
      routeKey:
        planResult && typeof planResult.routeKey === "string"
          ? planResult.routeKey
          : "non-target",
      taskId: planResult && typeof planResult.taskId === "string" ? planResult.taskId : null,
      itemIndex: itemIndex,
      matched: Boolean(planResult && planResult.matched),
      executable: false,
      executed: false,
      reason:
        planResult && typeof planResult.reason === "string" ? planResult.reason : "non-target",
      reasonDetails:
        planResult && typeof planResult.reasonDetails === "string"
          ? planResult.reasonDetails
          : null,
      plan: planResult || null,
      applyResult: null,
      snapshotAfter: null,
      validationAfter: null,
      feedbackAfter: null,
    };
  }

  function collectReadback(itemIndex, pageStateInput) {
    const locateAfter =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(itemIndex, pageStateInput)
        : null;
    const validationAfter =
      typeof annotationItemValidator.validate === "function"
        ? annotationItemValidator.validate(pageStateInput)
        : null;
    const feedbackAfter =
      typeof annotationFeedback.summarize === "function"
        ? annotationFeedback.summarize(validationAfter)
        : null;

    return {
      snapshotAfter: locateAfter && locateAfter.snapshot ? locateAfter.snapshot : null,
      validationAfter: validationAfter,
      feedbackAfter: feedbackAfter,
    };
  }

  function attachReadback(result, itemIndex, pageStateInput) {
    const readback = collectReadback(itemIndex, pageStateInput);
    result.snapshotAfter = readback.snapshotAfter;
    result.validationAfter = readback.validationAfter;
    result.feedbackAfter = readback.feedbackAfter;
    return result;
  }

  function resolveNonExecutableReason(planResult) {
    if (!planResult || typeof planResult.reason !== "string") {
      return "no-safe-action";
    }

    if (
      planResult.reason === "non-target" ||
      planResult.reason === "non-task-detail" ||
      planResult.reason === "item-not-found"
    ) {
      return planResult.reason;
    }

    return "no-safe-action";
  }

  function executePolicyPlan(executeRequest, pageStateInput) {
    const request = normalizeRequest(executeRequest);
    const planResult =
      typeof annotationApplyPolicy.plan === "function"
        ? annotationApplyPolicy.plan(
            {
              itemIndex: request.itemIndex,
            },
            pageStateInput
          )
        : null;
    const result = createBaseExecutionResult(planResult, request.itemIndex);

    try {
      const hasSuggestedApplyInput = Boolean(
        planResult &&
          planResult.suggestedApplyInput &&
          typeof planResult.suggestedApplyInput === "object"
      );

      result.executable = Boolean(planResult && planResult.actionable && hasSuggestedApplyInput);

      if (!result.executable) {
        result.reason = resolveNonExecutableReason(planResult);
        return result;
      }

      result.applyResult =
        typeof annotationApplyRunner.run === "function"
          ? annotationApplyRunner.run(planResult.suggestedApplyInput, pageStateInput)
          : null;

      if (!result.applyResult || !result.applyResult.applied) {
        result.reason = "apply-failed";
        if (!result.reasonDetails && result.applyResult && typeof result.applyResult.reason === "string") {
          result.reasonDetails = "apply runner returned reason: " + result.applyResult.reason;
        }
        attachReadback(result, request.itemIndex, pageStateInput);
        return result;
      }

      attachReadback(result, request.itemIndex, pageStateInput);
      result.executed = true;
      result.reason = "ok";
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to execute annotation policy plan:", error);

      try {
        attachReadback(result, request.itemIndex, pageStateInput);
      } catch (readbackError) {
        console.warn(LOG_PREFIX, "Failed to collect execution readback:", readbackError);
      }

      result.reason = "execute-error";
      if (!result.reasonDetails) {
        result.reasonDetails = "策略执行助手在执行单条计划时发生异常。";
      }
      return result;
    }
  }

  function logExecutionResult(executionResult) {
    const logMethod = executionResult.executed ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation policy execution result:", {
      pageType: executionResult.pageType,
      routeKey: executionResult.routeKey,
      taskId: executionResult.taskId,
      itemIndex: executionResult.itemIndex,
      matched: executionResult.matched,
      executable: executionResult.executable,
      executed: executionResult.executed,
      reason: executionResult.reason,
      reasonDetails: executionResult.reasonDetails,
      plan: executionResult.plan,
      applyResult: executionResult.applyResult,
      snapshotAfter: executionResult.snapshotAfter,
      validationAfter: executionResult.validationAfter,
      feedbackAfter: executionResult.feedbackAfter,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationPolicyExecutor = {
    run: executePolicyPlan,
    log: logExecutionResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
