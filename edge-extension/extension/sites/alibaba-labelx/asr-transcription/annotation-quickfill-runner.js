(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-quickfill-runner]";
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemWriter = window.__ASREdgeAlibabaLabelxAnnotationItemWriter;
  const annotationTextPipeline = window.__ASREdgeAlibabaLabelxAnnotationTextPipeline;

  if (!annotationItemCollector || !annotationItemWriter || !annotationTextPipeline) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(quickfillRequest) {
    const request = quickfillRequest && typeof quickfillRequest === "object" ? quickfillRequest : {};

    return {
      itemIndex: Number.isInteger(request.itemIndex) ? request.itemIndex : -1,
    };
  }

  function createBaseQuickfillResult(locateResult, itemIndex) {
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
      filled: false,
      reason:
        locateResult && locateResult.routeKey !== "non-target" ? "item-not-found" : "non-target",
      sourceText: null,
      generatedText: null,
      previousText: null,
      nextText: null,
      appliedRules: [],
    };
  }

  function runQuickfill(quickfillRequest, pageStateInput) {
    const request = normalizeRequest(quickfillRequest);
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(request.itemIndex, pageStateInput)
        : null;
    const result = createBaseQuickfillResult(locateResult, request.itemIndex);

    if (!locateResult || locateResult.routeKey === "non-target") {
      result.reason = "non-target";
      return result;
    }

    if (locateResult.pageType !== "task-detail") {
      result.reason = "non-task-detail";
      return result;
    }

    if (!locateResult.matched || !locateResult.item || !locateResult.snapshot) {
      result.reason = "item-not-found";
      return result;
    }

    result.matched = true;
    result.sourceText =
      typeof locateResult.snapshot.sourceText === "string" ? locateResult.snapshot.sourceText : null;

    if (!locateResult.targetTextarea) {
      result.reason = "textarea-not-found";
      return result;
    }

    if (!result.sourceText) {
      result.reason = "missing-source-text";
      return result;
    }

    const pipelineResult =
      typeof annotationTextPipeline.run === "function"
        ? annotationTextPipeline.run(result.sourceText)
        : null;
    const generatedText =
      pipelineResult && typeof pipelineResult.generatedText === "string"
        ? pipelineResult.generatedText
        : "";

    result.generatedText = generatedText;
    result.appliedRules =
      pipelineResult && Array.isArray(pipelineResult.appliedRules)
        ? pipelineResult.appliedRules
        : [];

    if (!generatedText) {
      result.reason = "generate-empty-text";
      return result;
    }

    if (locateResult.snapshot.targetText === generatedText) {
      result.previousText = generatedText;
      result.nextText = generatedText;
      result.filled = true;
      result.reason = "already-synced";
      return result;
    }

    const writeResult =
      typeof annotationItemWriter.write === "function"
        ? annotationItemWriter.write(
            {
              itemIndex: request.itemIndex,
              targetText: generatedText,
            },
            pageStateInput
          )
        : null;

    if (!writeResult) {
      result.reason = "write-error";
      return result;
    }

    result.previousText =
      typeof writeResult.previousText === "string" ? writeResult.previousText : null;
    result.nextText = typeof writeResult.nextText === "string" ? writeResult.nextText : null;

    if (!writeResult.wrote) {
      result.reason = writeResult.reason === "textarea-not-found" ? "textarea-not-found" : "write-error";
      return result;
    }

    result.filled = true;
    result.reason = "ok";
    return result;
  }

  function logQuickfillResult(quickfillResult) {
    const logMethod = quickfillResult.filled ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation quickfill result:", {
      pageType: quickfillResult.pageType,
      routeKey: quickfillResult.routeKey,
      taskId: quickfillResult.taskId,
      itemIndex: quickfillResult.itemIndex,
      matched: quickfillResult.matched,
      filled: quickfillResult.filled,
      reason: quickfillResult.reason,
      sourceText: quickfillResult.sourceText,
      generatedText: quickfillResult.generatedText,
      previousText: quickfillResult.previousText,
      nextText: quickfillResult.nextText,
      appliedRules: quickfillResult.appliedRules,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationQuickfillRunner = {
    run: runQuickfill,
    log: logQuickfillResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
