(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-submit-runner]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const pageStateCollector = window.__ASREdgePageStateCollector;
  const domAdapter = window.__ASREdgeAlibabaLabelxDomAdapter;
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;
  const annotationFeedback = window.__ASREdgeAlibabaLabelxAnnotationFeedback;
  const annotationSaveRunner = window.__ASREdgeAlibabaLabelxAnnotationSaveRunner;
  const legacyUserContext = window.__ASREdgeAlibabaLabelxLegacyUserContext;
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;

  if (
    !siteContract ||
    !pageStateCollector ||
    !domAdapter ||
    !annotationItemValidator ||
    !annotationFeedback
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeRequest(submitRequest) {
    const request = submitRequest && typeof submitRequest === "object" ? submitRequest : {};

    return {
      forceClick: request.forceClick === true,
      requireSafeSave: request.requireSafeSave !== false,
      uploadStats: request.uploadStats !== false,
      preferSubmitTask: request.preferSubmitTask === true,
    };
  }

  async function getSafetySettings() {
    const settings = runtimeGate && typeof runtimeGate.getSettings === "function"
      ? await runtimeGate.getSettings()
      : {};
    return settings?.platforms?.alibabaLabelx?.safety || {};
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
      matched: Boolean(pageState && pageState.isTargetSite && pageState.pageType === "task-detail"),
      clickable: false,
      clicked: false,
      submitted: false,
      reason: pageState && pageState.isTargetSite ? "non-task-detail" : "non-target",
      controlBefore: null,
      controlAfter: null,
      validationBefore: null,
      feedbackBefore: null,
      safeSaveResult: null,
      statsUploadResult: null,
      submitAction: null,
    };
  }

  function normalizeText(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : null;
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

  function resolveControlRoot(pageState) {
    const selectors = siteContract.SUBMIT_CONTROL_SELECTORS.taskDetail;
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
    if (!element) {
      return null;
    }

    const directText = normalizeText(element.innerText || element.textContent || "");
    if (directText) {
      return directText;
    }

    const titleText = normalizeText(element.getAttribute("title") || "");
    if (titleText) {
      return titleText;
    }

    const ariaLabelText = normalizeText(element.getAttribute("aria-label") || "");
    if (ariaLabelText) {
      return ariaLabelText;
    }

    const group =
      element.closest(".ant-v5-dropdown-button, .ant-dropdown-button") || element.parentElement;
    return normalizeText((group && (group.innerText || group.textContent)) || "");
  }

  function readControlState(element, kind) {
    if (!element) {
      return {
        found: false,
        kind: kind || null,
        text: null,
        title: null,
        tagName: null,
        disabled: false,
        ariaDisabled: false,
        ariaExpanded: null,
        loading: false,
        className: null,
      };
    }

    const disabled = Boolean(element.disabled);
    const ariaDisabled = element.getAttribute("aria-disabled") === "true";
    const ariaExpandedValue = element.getAttribute("aria-expanded");
    const className = typeof element.className === "string" ? element.className : null;
    const loading =
      elementHasDisabledClass(
        element,
        siteContract.SUBMIT_CONTROL_SELECTORS.taskDetail.disabledClasses
      ) && className !== null && className.includes("loading");

    return {
      found: true,
      kind: kind || null,
      text: readControlText(element),
      title: normalizeText(element.getAttribute("title") || ""),
      tagName: element.tagName ? element.tagName.toLowerCase() : null,
      disabled: disabled,
      ariaDisabled: ariaDisabled,
      ariaExpanded:
        ariaExpandedValue === "true" || ariaExpandedValue === "false" ? ariaExpandedValue : null,
      loading: loading,
      className: className,
    };
  }

  function locateSubmitControl(pageState) {
    const selectors = siteContract.SUBMIT_CONTROL_SELECTORS.taskDetail;
    const root = resolveControlRoot(pageState);
    const triggerCandidates =
      typeof domAdapter.queryAll === "function"
        ? domAdapter.queryAll(selectors.triggerCandidates, root)
        : [];

    for (const candidate of triggerCandidates) {
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
        state: readControlState(candidate, "trigger"),
      };
    }

    const buttonCandidates =
      typeof domAdapter.queryAll === "function"
        ? domAdapter.queryAll(selectors.buttonCandidates, root)
        : [];

    for (const candidate of buttonCandidates) {
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
        state: readControlState(candidate, "button"),
      };
    }

    return {
      element: null,
      state: readControlState(null, null),
    };
  }

  function isControlDisabled(controlState) {
    if (!controlState || !controlState.found) {
      return true;
    }

    return Boolean(controlState.disabled || controlState.ariaDisabled || controlState.loading);
  }

  function isValidationBlocked(validationBefore, feedbackBefore, forceClick) {
    if (forceClick) {
      return false;
    }

    return Boolean(
      validationBefore &&
        validationBefore.pageType === "task-detail" &&
        validationBefore.issueCount > 0 &&
        feedbackBefore &&
        feedbackBefore.status === "has-issues"
    );
  }

  function isControlClickable(controlState, validationBefore, feedbackBefore, forceClick) {
    if (!controlState || !controlState.found) {
      return false;
    }

    if (forceClick) {
      return true;
    }

    if (isControlDisabled(controlState)) {
      return false;
    }

    return !isValidationBlocked(validationBefore, feedbackBefore, false);
  }

  function dispatchMouseClick(element) {
    if (!element) {
      return false;
    }

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
    };
    element.dispatchEvent(new MouseEvent("mouseenter", eventOptions));
    element.dispatchEvent(new MouseEvent("mouseover", eventOptions));
    element.dispatchEvent(new MouseEvent("mousedown", eventOptions));
    if (typeof element.click === "function") {
      element.click();
      return true;
    }

    return element.dispatchEvent(new MouseEvent("click", eventOptions));
  }

  async function clickDropdownSubmitMenu(triggerElement, preferSubmitTask) {
    if (!dispatchMouseClick(triggerElement)) {
      return {
        success: false,
        action: "trigger-click-failed",
      };
    }

    const targetTexts = preferSubmitTask
      ? ["提交任务", "提交并领取", "提交"]
      : ["提交并结束", "提交"];

    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 50);
      });

      const menuTextNodes = Array.from(
        document.querySelectorAll(
          ".ant-v5-dropdown-menu-title-content, .ant-dropdown-menu-title-content"
        )
      );
      const targetNode = menuTextNodes.find(function (node) {
        const text = normalizeText(node.textContent || "");
        return text && targetTexts.includes(text);
      });

      if (!targetNode) {
        continue;
      }

      const menuItem =
        targetNode.closest(".ant-v5-dropdown-menu-item, .ant-dropdown-menu-item") || targetNode;
      dispatchMouseClick(menuItem);
      return {
        success: true,
        action: normalizeText(targetNode.textContent || "") || "dropdown-submit",
      };
    }

    return {
      success: false,
      action: "dropdown-menu-timeout",
    };
  }

  async function dispatchSubmit(locatedBefore, request) {
    if (!locatedBefore || !locatedBefore.element) {
      return {
        success: false,
        action: "submit-control-missing",
      };
    }

    if (locatedBefore.state.kind === "trigger") {
      return clickDropdownSubmitMenu(locatedBefore.element, request.preferSubmitTask);
    }

    return {
      success: dispatchMouseClick(locatedBefore.element),
      action: normalizeText(readControlText(locatedBefore.element) || "") || "submit",
    };
  }

  async function maybeRunSafeSave(request, result) {
    const safetySettings = await getSafetySettings();
    const shouldRunSafeSave =
      request.requireSafeSave === true && safetySettings.submitRequiresManualSave !== false;

    if (!shouldRunSafeSave) {
      return null;
    }

    if (!annotationSaveRunner || typeof annotationSaveRunner.run !== "function") {
      const missingResult = {
        matched: false,
        clickable: false,
        clicked: false,
        dispatched: false,
        saved: false,
        persisted: false,
        manualSaveSupported: false,
        reason: "safe-save-runner-missing",
      };
      result.safeSaveResult = missingResult;
      return missingResult;
    }

    const saveResult = await annotationSaveRunner.run({
      blurFirst: true,
      reloadAfter: false,
      buildPayload: true,
    });
    result.safeSaveResult = saveResult;
    return saveResult;
  }

  function isConfirmedSafeSaveResult(saveResult) {
    if (!saveResult || typeof saveResult !== "object") {
      return false;
    }

    return saveResult.persisted === true || saveResult.saved === true;
  }

  function deriveSafeSaveBlockReason(saveResult) {
    if (!saveResult || typeof saveResult !== "object") {
      return "submit-blocked-by-safe-save";
    }

    if (saveResult.reason === "safe-save-runner-missing") {
      return "submit-blocked-by-safe-save-missing";
    }

    if (saveResult.reason === "local-click-dispatched" || saveResult.dispatched === true) {
      return "submit-blocked-by-unconfirmed-save";
    }

    return "submit-blocked-by-safe-save";
  }

  async function maybeUploadStats(request) {
    const safetySettings = await getSafetySettings();
    if (request.uploadStats !== true || safetySettings.uploadStatsBeforeSubmit === false) {
      return {
        success: true,
        skipped: true,
        reason: "stats-upload-skipped",
      };
    }

    if (!legacyUserContext || typeof legacyUserContext.uploadCurrentTaskStats !== "function") {
      return {
        success: false,
        skipped: true,
        reason: "legacy-user-context-missing",
      };
    }

    try {
      return await legacyUserContext.uploadCurrentTaskStats();
    } catch (error) {
      return {
        success: false,
        reason: "stats-upload-failed",
        error: error && error.message ? error.message : String(error),
      };
    }
  }

  async function triggerSubmit(submitRequest, pageStateInput) {
    const request = normalizeRequest(submitRequest);
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

      result.validationBefore =
        typeof annotationItemValidator.validate === "function"
          ? annotationItemValidator.validate(pageState)
          : null;
      result.feedbackBefore =
        typeof annotationFeedback.summarize === "function"
          ? annotationFeedback.summarize(result.validationBefore)
          : null;

      const locatedBefore = locateSubmitControl(pageState);
      result.controlBefore = locatedBefore.state;

      if (!locatedBefore.element) {
        result.reason = "submit-control-not-found";
        result.controlAfter = readControlState(null, null);
        return result;
      }

      result.clickable = isControlClickable(
        locatedBefore.state,
        result.validationBefore,
        result.feedbackBefore,
        request.forceClick
      );

      if (
        !request.forceClick &&
        isValidationBlocked(result.validationBefore, result.feedbackBefore, false)
      ) {
        result.reason = "submit-blocked-by-validation";
        result.controlAfter = readControlState(locatedBefore.element, locatedBefore.state.kind);
        return result;
      }

      if (!result.clickable) {
        result.reason = "submit-control-disabled";
        result.controlAfter = readControlState(locatedBefore.element, locatedBefore.state.kind);
        return result;
      }

      const safeSaveResult = await maybeRunSafeSave(request, result);
      if (request.requireSafeSave === true && !isConfirmedSafeSaveResult(safeSaveResult)) {
        result.reason = deriveSafeSaveBlockReason(safeSaveResult);
        result.controlAfter = readControlState(locatedBefore.element, locatedBefore.state.kind);
        return result;
      }

      result.statsUploadResult = await maybeUploadStats(request);
      const submitDispatchResult = await dispatchSubmit(locatedBefore, request);
      result.submitAction = submitDispatchResult.action;
      result.clicked = submitDispatchResult.success === true;
      result.submitted = result.clicked;
      result.controlAfter = readControlState(locatedBefore.element, locatedBefore.state.kind);
      result.reason = result.clicked ? "submit-dispatched" : "submit-dispatch-failed";
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to trigger submit control:", error);
      result.reason = "submit-error";
      result.controlAfter = result.controlAfter || readControlState(null, null);
      return result;
    }
  }

  function logSubmitResult(submitResult) {
    const logMethod = submitResult.submitted ? console.info : console.warn;
    logMethod(LOG_PREFIX, "Annotation submit trigger result:", submitResult);
  }

  window.__ASREdgeAlibabaLabelxAnnotationSubmitRunner = {
    run: triggerSubmit,
    log: logSubmitResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
