(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-save-runner]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const pageStateCollector = window.__ASREdgePageStateCollector;
  const domAdapter = window.__ASREdgeAlibabaLabelxDomAdapter;
  const legacyBridge = window.__ASREdgeAlibabaLabelxLegacyBridge;
  const legacySaveCoordinator = window.__ASREdgeAlibabaLabelxLegacySaveCoordinator;

  if (!siteContract || !pageStateCollector || !domAdapter) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(saveRequest) {
    const request = saveRequest && typeof saveRequest === "object" ? saveRequest : {};

    return {
      forceClick: request.forceClick === true,
      reloadAfter: request.reloadAfter === true,
      blurFirst: request.blurFirst !== false,
      buildPayload: request.buildPayload !== false,
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

  function createBaseResult(pageState) {
    return {
      pageType:
        pageState && typeof pageState.pageType === "string" ? pageState.pageType : "unknown",
      routeKey:
        pageState && typeof pageState.routeKey === "string" ? pageState.routeKey : "non-target",
      taskId:
        pageState &&
        pageState.contextInfo &&
        typeof pageState.contextInfo.taskId === "string"
          ? pageState.contextInfo.taskId
          : null,
      matched: false,
      clickable: false,
      clicked: false,
      dispatched: false,
      saved: false,
      persisted: false,
      manualSaveSupported: false,
      reason: pageState && pageState.isTargetSite ? "non-task-detail" : "non-target",
      controlBefore: null,
      controlAfter: null,
      buildResult: null,
      manualSaveResult: null,
    };
  }

  function normalizeText(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : null;
  }

  function resolveControlRoot(pageState) {
    const selectors = siteContract.SAVE_CONTROL_SELECTORS.taskDetail;
    const domAdapterResult =
      typeof pageStateCollector.collectDomAdapterResult === "function"
        ? pageStateCollector.collectDomAdapterResult(pageState)
        : null;

    return (
      (domAdapterResult &&
        (domAdapterResult.elements.headerRegion ||
          domAdapterResult.elements.pageContainer ||
          domAdapterResult.elements.primaryRegion ||
          domAdapterResult.elements.mainContent)) ||
      domAdapter.queryFirst(selectors.controlRoot) ||
      document
    );
  }

  function readControlText(element) {
    return normalizeText(
      (element && (element.innerText || element.textContent)) ||
        (typeof domAdapter.readText === "function" ? domAdapter.readText(element) : null) ||
        ""
    );
  }

  function includesKeyword(text, keywords) {
    if (typeof text !== "string" || !Array.isArray(keywords)) {
      return false;
    }

    return keywords.some(function (keyword) {
      return text.includes(keyword);
    });
  }

  function elementHasDisabledClass(element, classNames) {
    if (!element || !Array.isArray(classNames)) {
      return false;
    }

    return classNames.some(function (className) {
      return element.classList && element.classList.contains(className);
    });
  }

  function readControlState(element) {
    if (!element) {
      return {
        found: false,
        text: null,
        tagName: null,
        disabled: false,
        ariaDisabled: false,
        loading: false,
        className: null,
      };
    }

    const disabled = Boolean(element.disabled);
    const ariaDisabled = element.getAttribute("aria-disabled") === "true";
    const className = typeof element.className === "string" ? element.className : null;
    const loading =
      elementHasDisabledClass(element, siteContract.SAVE_CONTROL_SELECTORS.taskDetail.disabledClasses) &&
      className !== null &&
      className.includes("loading");

    return {
      found: true,
      text: readControlText(element),
      tagName: element.tagName ? element.tagName.toLowerCase() : null,
      disabled: disabled,
      ariaDisabled: ariaDisabled,
      loading: loading,
      className: className,
    };
  }

  function locateSaveControl(pageState) {
    const selectors = siteContract.SAVE_CONTROL_SELECTORS.taskDetail;
    const root = resolveControlRoot(pageState);
    const candidates =
      typeof domAdapter.queryAll === "function"
        ? domAdapter.queryAll(selectors.buttonCandidates, root)
        : [];

    for (const candidate of candidates) {
      const text = readControlText(candidate);
      if (!text) {
        continue;
      }

      if (!includesKeyword(text, selectors.textKeywords)) {
        continue;
      }

      if (includesKeyword(text, selectors.excludedTextKeywords)) {
        continue;
      }

      return {
        element: candidate,
        state: readControlState(candidate),
      };
    }

    return {
      element: null,
      state: readControlState(null),
    };
  }

  function isControlDisabled(controlState) {
    if (!controlState || !controlState.found) {
      return true;
    }

    return Boolean(controlState.disabled || controlState.ariaDisabled || controlState.loading);
  }

  function isControlClickable(controlState, forceClick) {
    if (!controlState || !controlState.found) {
      return false;
    }

    if (forceClick) {
      return true;
    }

    return !isControlDisabled(controlState);
  }

  function dispatchLocalClick(controlElement, forceClick) {
    if (!controlElement) {
      return false;
    }

    if (!forceClick && typeof controlElement.click === "function") {
      controlElement.click();
      return true;
    }

    return controlElement.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  async function attemptManualSave(request, result) {
    const cachedDataList =
      legacyBridge && typeof legacyBridge.getCachedDataList === "function"
        ? legacyBridge.getCachedDataList()
        : [];
    if (!legacySaveCoordinator || typeof legacySaveCoordinator.performManualSave !== "function") {
      return false;
    }

    if (!Array.isArray(cachedDataList) || cachedDataList.length === 0) {
      return false;
    }

    result.manualSaveSupported = true;
    result.clickable = true;
    result.buildResult =
      request.buildPayload !== false &&
      typeof legacySaveCoordinator.buildAndInjectPayloadFromDOM === "function"
        ? legacySaveCoordinator.buildAndInjectPayloadFromDOM()
        : null;
    result.manualSaveResult = await legacySaveCoordinator.performManualSave({
      buildPayload: false,
      blurFirst: request.blurFirst,
      reloadAfter: request.reloadAfter,
      reason: "annotation-save-runner",
    });
    result.clicked = false;
    result.dispatched = Boolean(result.manualSaveResult);
    result.saved = result.manualSaveResult?.success === true;
    result.persisted = result.saved;
    result.reason = result.saved ? "manual-save-success" : "manual-save-failed";
    return true;
  }

  async function triggerSave(saveRequest, pageStateInput) {
    const request = normalizeRequest(saveRequest);
    const pageState = resolvePageState(pageStateInput);
    const result = createBaseResult(pageState);

    try {
      if (!pageState.isTargetSite || pageState.routeKey === "non-target") {
        result.reason = "non-target";
        return result;
      }

      if (pageState.pageType !== "task-detail") {
        result.reason = "non-task-detail";
        return result;
      }

      result.matched = true;
      result.reason = "disabled-in-basic-stage";
      result.manualSaveSupported = false;
      result.clickable = false;
      result.clicked = false;
      result.dispatched = false;
      result.saved = false;
      result.persisted = false;
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to trigger save control:", error);
      result.reason = "save-error";
      result.controlAfter = result.controlAfter || readControlState(null);
      return result;
    }
  }

  function logSaveResult(saveResult) {
    const logMethod = saveResult.saved ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation save trigger result:", saveResult);
  }

  window.__ASREdgeAlibabaLabelxAnnotationSaveRunner = {
    run: triggerSave,
    log: logSaveResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
