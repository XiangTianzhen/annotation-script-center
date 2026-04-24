(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-item-writer]";
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;

  if (!annotationItemCollector) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(writeRequest) {
    const request = writeRequest && typeof writeRequest === "object" ? writeRequest : {};
    const itemIndex = Number.isInteger(request.itemIndex) ? request.itemIndex : -1;

    return {
      itemIndex: itemIndex,
      targetText:
        typeof request.targetText === "string"
          ? request.targetText
          : String(request.targetText ?? ""),
    };
  }

  function createBaseWriteResult(locateResult, itemIndex) {
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
        locateResult && typeof locateResult.taskId === "string"
          ? locateResult.taskId
          : null,
      itemIndex: itemIndex,
      matched: false,
      wrote: false,
      reason:
        locateResult && locateResult.routeKey !== "non-target" ? "item-not-found" : "non-target",
      previousText: null,
      nextText: null,
    };
  }

  function setTextareaValue(textarea, targetText) {
    const previousText = typeof textarea.value === "string" ? textarea.value : "";
    const valueDescriptor = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    );
    const nativeSetter = valueDescriptor && typeof valueDescriptor.set === "function"
      ? valueDescriptor.set
      : null;

    textarea.focus({ preventScroll: true });

    if (nativeSetter) {
      nativeSetter.call(textarea, targetText);
    } else {
      textarea.value = targetText;
    }

    const tracker = textarea._valueTracker;
    if (tracker && typeof tracker.setValue === "function") {
      tracker.setValue(previousText);
    }

    textarea.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    return {
      previousText: previousText,
      nextText: typeof textarea.value === "string" ? textarea.value : "",
    };
  }

  function writeTargetTextarea(writeRequest, pageStateInput) {
    const request = normalizeRequest(writeRequest);
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(request.itemIndex, pageStateInput)
        : null;
    const result = createBaseWriteResult(locateResult, request.itemIndex);

    if (!locateResult || locateResult.routeKey === "non-target") {
      result.reason = "non-target";
      return result;
    }

    if (locateResult.pageType !== "task-detail") {
      result.reason = "non-task-detail";
      return result;
    }

    if (!locateResult.matched || !locateResult.item) {
      result.reason = "item-not-found";
      return result;
    }

    result.matched = true;

    const textarea = locateResult.targetTextarea;
    if (!textarea) {
      result.reason = "textarea-not-found";
      return result;
    }

    try {
      const writeResult = setTextareaValue(textarea, request.targetText);
      result.wrote = true;
      result.reason = "ok";
      result.previousText = writeResult.previousText;
      result.nextText = writeResult.nextText;
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to write target textarea:", error);
      result.reason = "write-error";
      result.previousText = typeof textarea.value === "string" ? textarea.value : "";
      result.nextText = typeof textarea.value === "string" ? textarea.value : "";
      return result;
    }
  }

  function logWriteResult(writeResult) {
    const logMethod = writeResult.wrote ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation write result:", {
      pageType: writeResult.pageType,
      routeKey: writeResult.routeKey,
      taskId: writeResult.taskId,
      itemIndex: writeResult.itemIndex,
      matched: writeResult.matched,
      wrote: writeResult.wrote,
      reason: writeResult.reason,
      previousText: writeResult.previousText,
      nextText: writeResult.nextText,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationItemWriter = {
    write: writeTargetTextarea,
    log: logWriteResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
