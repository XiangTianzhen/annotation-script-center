(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-apply-runner]";
  const VALIDITY_OPTIONS = ["有效", "无效", "特殊"];
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemWriter = window.__ASREdgeAlibabaLabelxAnnotationItemWriter;
  const annotationQuickfillRunner = window.__ASREdgeAlibabaLabelxAnnotationQuickfillRunner;
  const annotationValidityWriter = window.__ASREdgeAlibabaLabelxAnnotationValidityWriter;
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;
  const annotationFeedback = window.__ASREdgeAlibabaLabelxAnnotationFeedback;

  if (
    !annotationItemCollector ||
    !annotationItemWriter ||
    !annotationQuickfillRunner ||
    !annotationValidityWriter ||
    !annotationItemValidator ||
    !annotationFeedback
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeValidity(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return VALIDITY_OPTIONS.includes(normalized) ? normalized : null;
  }

  function normalizeRequest(applyRequest) {
    const request = applyRequest && typeof applyRequest === "object" ? applyRequest : {};
    let textAction = "none";

    if (typeof request.textAction === "string") {
      if (request.textAction === "quickfill" || request.textAction === "clear" || request.textAction === "set-text") {
        textAction = request.textAction;
      }
    } else if (request.doQuickfill === true) {
      textAction = "quickfill";
    } else if (request.clearTargetText === true) {
      textAction = "clear";
    } else if (typeof request.targetText === "string") {
      textAction = "set-text";
    }

    return {
      itemIndex: Number.isInteger(request.itemIndex) ? request.itemIndex : -1,
      textAction: textAction,
      targetText: typeof request.targetText === "string" ? request.targetText : null,
      targetValidity: normalizeValidity(request.targetValidity),
    };
  }

  function createBaseApplyResult(locateResult, itemIndex) {
    return {
      pageType:
        locateResult && typeof locateResult.pageType === "string"
          ? locateResult.pageType
          : "unknown",
      routeKey:
        locateResult && typeof locateResult.routeKey === "string"
          ? locateResult.routeKey
          : "non-target",
      taskId:
        locateResult && typeof locateResult.taskId === "string" ? locateResult.taskId : null,
      itemIndex: itemIndex,
      matched: false,
      applied: false,
      reason:
        locateResult && locateResult.routeKey !== "non-target" ? "item-not-found" : "non-target",
      textAction: "none",
      textWriteResult: null,
      quickfillResult: null,
      validityResult: null,
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

  function applyAnnotation(applyRequest, pageStateInput) {
    const request = normalizeRequest(applyRequest);
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(request.itemIndex, pageStateInput)
        : null;
    const result = createBaseApplyResult(locateResult, request.itemIndex);

    try {
      if (!locateResult || locateResult.routeKey === "non-target") {
        result.reason = "non-target";
        return attachReadback(result, request.itemIndex, pageStateInput);
      }

      if (locateResult.pageType !== "task-detail") {
        result.reason = "non-task-detail";
        return attachReadback(result, request.itemIndex, pageStateInput);
      }

      if (!locateResult.matched || !locateResult.item || !locateResult.snapshot) {
        result.reason = "item-not-found";
        return attachReadback(result, request.itemIndex, pageStateInput);
      }

      result.matched = true;
      result.textAction = request.textAction;

      if (request.textAction === "none" && request.targetValidity === null) {
        result.reason = "nothing-requested";
        return attachReadback(result, request.itemIndex, pageStateInput);
      }

      if (request.textAction === "quickfill") {
        result.quickfillResult =
          typeof annotationQuickfillRunner.run === "function"
            ? annotationQuickfillRunner.run(
                {
                  itemIndex: request.itemIndex,
                },
                pageStateInput
              )
            : null;

        if (!result.quickfillResult || !result.quickfillResult.filled) {
          result.reason = "quickfill-failed";
          return attachReadback(result, request.itemIndex, pageStateInput);
        }
      } else if (request.textAction === "clear" || request.textAction === "set-text") {
        result.textWriteResult =
          typeof annotationItemWriter.write === "function"
            ? annotationItemWriter.write(
                {
                  itemIndex: request.itemIndex,
                  targetText: request.textAction === "clear" ? "" : request.targetText || "",
                },
                pageStateInput
              )
            : null;

        if (!result.textWriteResult || !result.textWriteResult.wrote) {
          result.reason = "text-write-failed";
          return attachReadback(result, request.itemIndex, pageStateInput);
        }
      }

      if (request.targetValidity !== null) {
        result.validityResult =
          typeof annotationValidityWriter.toggle === "function"
            ? annotationValidityWriter.toggle(
                {
                  itemIndex: request.itemIndex,
                  targetValidity: request.targetValidity,
                },
                pageStateInput
              )
            : null;

        if (!result.validityResult || !result.validityResult.toggled) {
          result.reason = "validity-failed";
          return attachReadback(result, request.itemIndex, pageStateInput);
        }
      }

      attachReadback(result, request.itemIndex, pageStateInput);
      result.applied = true;
      result.reason = "ok";
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to apply annotation actions:", error);

      try {
        attachReadback(result, request.itemIndex, pageStateInput);
      } catch (readbackError) {
        console.warn(LOG_PREFIX, "Failed to collect apply readback:", readbackError);
      }

      result.reason = "apply-error";
      return result;
    }
  }

  function logApplyResult(applyResult) {
    const logMethod = applyResult.applied ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation apply result:", {
      pageType: applyResult.pageType,
      routeKey: applyResult.routeKey,
      taskId: applyResult.taskId,
      itemIndex: applyResult.itemIndex,
      matched: applyResult.matched,
      applied: applyResult.applied,
      reason: applyResult.reason,
      textAction: applyResult.textAction,
      textWriteResult: applyResult.textWriteResult,
      quickfillResult: applyResult.quickfillResult,
      validityResult: applyResult.validityResult,
      snapshotAfter: applyResult.snapshotAfter,
      validationAfter: applyResult.validationAfter,
      feedbackAfter: applyResult.feedbackAfter,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationApplyRunner = {
    run: applyAnnotation,
    log: logApplyResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
