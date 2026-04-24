(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-validity-writer]";
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const VALIDITY_OPTIONS =
    siteContract && siteContract.ANNOTATION_ITEM_SELECTORS
      ? siteContract.ANNOTATION_ITEM_SELECTORS.validityOptions
      : ["有效", "无效", "特殊"];

  if (!annotationItemCollector || !siteContract) {
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

  function normalizeRequest(toggleRequest) {
    const request = toggleRequest && typeof toggleRequest === "object" ? toggleRequest : {};

    return {
      itemIndex: Number.isInteger(request.itemIndex) ? request.itemIndex : -1,
      targetValidity: normalizeValidity(request.targetValidity),
    };
  }

  function createBaseToggleResult(locateResult, itemIndex) {
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
      toggled: false,
      reason:
        locateResult && locateResult.routeKey !== "non-target" ? "item-not-found" : "non-target",
      previousValidity: null,
      nextValidity: null,
    };
  }

  function triggerValiditySelection(targetControl) {
    if (targetControl && targetControl.input && typeof targetControl.input.click === "function") {
      targetControl.input.click();
      return true;
    }

    if (targetControl && targetControl.label && typeof targetControl.label.click === "function") {
      targetControl.label.click();
      return true;
    }

    return false;
  }

  function toggleValidity(toggleRequest, pageStateInput) {
    const request = normalizeRequest(toggleRequest);
    const locateResult =
      typeof annotationItemCollector.locateValidityOption === "function"
        ? annotationItemCollector.locateValidityOption(
            request.itemIndex,
            request.targetValidity,
            pageStateInput
          )
        : null;
    const result = createBaseToggleResult(locateResult, request.itemIndex);

    if (!request.targetValidity) {
      result.reason = "option-not-found";
      return result;
    }

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
    result.previousValidity = normalizeValidity(locateResult.snapshot.selectedValidity);
    result.nextValidity = result.previousValidity;

    if (result.previousValidity === request.targetValidity) {
      result.toggled = true;
      result.reason = "already-selected";
      return result;
    }

    if (!locateResult.targetControl || !locateResult.targetControl.matched) {
      result.reason = "option-not-found";
      return result;
    }

    try {
      const clickTriggered = triggerValiditySelection(locateResult.targetControl);
      if (!clickTriggered) {
        result.reason = "option-not-found";
        return result;
      }

      const readbackResult =
        typeof annotationItemCollector.locate === "function"
          ? annotationItemCollector.locate(request.itemIndex, pageStateInput)
          : null;
      const nextValidity = normalizeValidity(readbackResult?.snapshot?.selectedValidity);

      result.nextValidity = nextValidity;
      if (nextValidity === request.targetValidity) {
        result.toggled = true;
        result.reason = "ok";
        return result;
      }

      result.reason = "toggle-readback-mismatch";
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to toggle validity:", error);
      result.reason = "toggle-error";
      return result;
    }
  }

  function logToggleResult(toggleResult) {
    const logMethod = toggleResult.toggled ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation validity toggle result:", {
      pageType: toggleResult.pageType,
      routeKey: toggleResult.routeKey,
      taskId: toggleResult.taskId,
      itemIndex: toggleResult.itemIndex,
      matched: toggleResult.matched,
      toggled: toggleResult.toggled,
      reason: toggleResult.reason,
      previousValidity: toggleResult.previousValidity,
      nextValidity: toggleResult.nextValidity,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationValidityWriter = {
    toggle: toggleValidity,
    log: logToggleResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
