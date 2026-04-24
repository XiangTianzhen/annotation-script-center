(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-item-collector]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;
  const pageStateCollector = window.__ASREdgePageStateCollector;

  if (!siteContract) {
    console.warn(LOG_PREFIX, "Site contract is not loaded.");
    return;
  }

  function normalizeSelectors(selectors) {
    if (Array.isArray(selectors)) {
      return selectors.filter(function (selector) {
        return typeof selector === "string" && selector.length > 0;
      });
    }

    return typeof selectors === "string" && selectors.length > 0 ? [selectors] : [];
  }

  function resolveQueryRoot(root) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function queryFirst(selectors, root) {
    const selectorList = normalizeSelectors(selectors);
    const queryRoot = resolveQueryRoot(root);

    for (const selector of selectorList) {
      try {
        const element = queryRoot.querySelector(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  function queryAll(selectors, root) {
    const selectorList = normalizeSelectors(selectors);
    const queryRoot = resolveQueryRoot(root);
    const results = [];
    const seen = new Set();

    for (const selector of selectorList) {
      try {
        const elements = queryRoot.querySelectorAll(selector);
        Array.from(elements).forEach(function (element) {
          if (seen.has(element)) {
            return;
          }

          seen.add(element);
          results.push(element);
        });
      } catch (error) {
        continue;
      }
    }

    return results;
  }

  function normalizeTextValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : null;
  }

  function normalizeTextareaValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    return value.replace(/[\u200B-\u200D\uFEFF]/g, "");
  }

  function readText(element) {
    if (!element) {
      return null;
    }

    return normalizeTextValue(element.textContent || "");
  }

  function resolvePageState(pageStateInput) {
    if (pageStateInput && typeof pageStateInput === "object") {
      return pageStateInput;
    }

    if (pageStateCollector && typeof pageStateCollector.collectPageState === "function") {
      return pageStateCollector.collectPageState();
    }

    return siteContract.createBasePageState({
      hostname: location.hostname,
      pathname: location.pathname,
      pageTitle: document.title || "",
    });
  }

  function createBaseSnapshotResult(pageState) {
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
      itemCount: 0,
      items: [],
    };
  }

  function resolveTaskDetailRoot(pageState) {
    if (
      pageStateCollector &&
      typeof pageStateCollector.collectDomAdapterResult === "function"
    ) {
      const domAdapterResult = pageStateCollector.collectDomAdapterResult(pageState);
      return (
        domAdapterResult.elements.primaryRegion ||
        domAdapterResult.elements.pageContainer ||
        domAdapterResult.elements.mainContent ||
        document
      );
    }

    return document;
  }

  function includesKeyword(text, keywords) {
    const normalizedText = typeof text === "string" ? text : "";

    return keywords.some(function (keyword) {
      return normalizedText.includes(keyword);
    });
  }

  function getSourceText(item, selectors) {
    const titleElements = queryAll(selectors.sourceFieldTitles, item);
    const keywords = siteContract.ANNOTATION_ITEM_SELECTORS.sourceFieldKeywords;

    for (const titleElement of titleElements) {
      const titleText = titleElement.textContent || "";
      if (!includesKeyword(titleText, keywords)) {
        continue;
      }

      let container = titleElement.nextElementSibling;
      if (!container && titleElement.parentElement) {
        container = titleElement.parentElement.nextElementSibling;
      }

      if (!container) {
        continue;
      }

      const textContainer =
        queryFirst(selectors.sourceTextContainer, container) || queryFirst("div", container);
      const sourceText = readText(textContainer);
      if (sourceText) {
        return sourceText;
      }
    }

    const fallbackTextContainers = queryAll(selectors.sourceTextContainer, item);
    if (fallbackTextContainers.length > 0) {
      return readText(fallbackTextContainers[0]);
    }

    return null;
  }

  function getTargetTextarea(item, selectors) {
    const directTextarea = queryFirst(selectors.targetTextareaByLabel, item);
    if (directTextarea) {
      return directTextarea;
    }

    const wraps = queryAll(selectors.targetAnswerWrap, item);
    const targetKeywords = siteContract.ANNOTATION_ITEM_SELECTORS.targetFieldKeywords;

    for (const wrap of wraps) {
      const title = queryFirst(selectors.targetAnswerTitle, wrap);
      if (!title || !includesKeyword(title.textContent || "", targetKeywords)) {
        continue;
      }

      const textarea = queryFirst(selectors.targetTextareaFallback, wrap);
      if (textarea) {
        return textarea;
      }
    }

    return queryFirst(selectors.targetTextareaFallback, item);
  }

  function getSelectedValidity(item, selectors) {
    const checkedRadio = queryFirst(selectors.checkedValidityInput, item);
    if (!checkedRadio) {
      return null;
    }

    const validityOptions = siteContract.ANNOTATION_ITEM_SELECTORS.validityOptions;
    const directValue = normalizeTextValue(checkedRadio.value);

    if (directValue && validityOptions.includes(directValue)) {
      return directValue;
    }

    const wrapper = checkedRadio.closest(".ant-v5-radio-wrapper, label");
    const wrapperText = readText(wrapper);
    if (!wrapperText) {
      return null;
    }

    for (const option of validityOptions) {
      if (wrapperText.includes(option)) {
        return option;
      }
    }

    return null;
  }

  function normalizeValidityValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return siteContract.ANNOTATION_ITEM_SELECTORS.validityOptions.includes(normalized)
      ? normalized
      : null;
  }

  function readValidityValue(element) {
    if (!element) {
      return null;
    }

    const directValue = normalizeValidityValue(element.value);
    if (directValue) {
      return directValue;
    }

    const textValue = readText(element);
    if (!textValue) {
      return null;
    }

    for (const option of siteContract.ANNOTATION_ITEM_SELECTORS.validityOptions) {
      if (textValue.includes(option)) {
        return option;
      }
    }

    return null;
  }

  function createEmptyValidityControl(value) {
    return {
      value: value,
      matched: false,
      checked: false,
      input: null,
      label: null,
    };
  }

  function createValidityControlsMap() {
    return siteContract.ANNOTATION_ITEM_SELECTORS.validityOptions.reduce(function (
      controls,
      option
    ) {
      controls[option] = createEmptyValidityControl(option);
      return controls;
    },
    {});
  }

  function mergeValidityControl(control, input, label) {
    if (!control) {
      return;
    }

    if (input && !control.input) {
      control.input = input;
    }

    if (label && !control.label) {
      control.label = label;
    }

    control.matched = Boolean(control.input || control.label);

    if (control.input) {
      control.checked = Boolean(control.input.checked);
    } else if (control.label) {
      control.checked = control.label.classList.contains("ant-v5-radio-wrapper-checked");
    }
  }

  function collectValidityControls(item) {
    const controls = createValidityControlsMap();
    const selectors = siteContract.ANNOTATION_ITEM_SELECTORS;
    const labels = queryAll(selectors.validityOptionLabels, item);
    const inputs = queryAll(selectors.validityOptionInputs, item);

    labels.forEach(function (label) {
      const optionValue = readValidityValue(label);
      if (!optionValue || !controls[optionValue]) {
        return;
      }

      mergeValidityControl(controls[optionValue], queryFirst('input[type="radio"]', label), label);
    });

    inputs.forEach(function (input) {
      const optionValue = readValidityValue(input);
      if (!optionValue || !controls[optionValue]) {
        return;
      }

      let label = null;
      try {
        label = input.closest(".ant-v5-radio-wrapper, label");
      } catch (error) {
        label = null;
      }

      mergeValidityControl(controls[optionValue], input, label);
    });

    return controls;
  }

  function collectAnnotationItemSnapshot(item, index, selectors) {
    const targetTextarea = getTargetTextarea(item, selectors);

    return {
      index: index,
      sourceText: getSourceText(item, selectors),
      hasTargetTextarea: Boolean(targetTextarea),
      targetText: targetTextarea ? normalizeTextareaValue(targetTextarea.value || "") : null,
      selectedValidity: getSelectedValidity(item, selectors),
    };
  }

  function createBaseLocateResult(pageState, itemIndex) {
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
      itemIndex: itemIndex,
      matched: false,
      item: null,
      targetTextarea: null,
      validityControls: createValidityControlsMap(),
      snapshot: null,
    };
  }

  function locateAnnotationItem(itemIndex, pageStateInput) {
    const safeItemIndex = Number.isInteger(itemIndex) ? itemIndex : -1;
    const pageState = resolvePageState(pageStateInput);
    const result = createBaseLocateResult(pageState, safeItemIndex);

    if (!pageState.isTargetSite || pageState.pageType !== "task-detail") {
      return result;
    }

    const selectors = siteContract.ANNOTATION_ITEM_SELECTORS.taskDetail;
    const root = resolveTaskDetailRoot(pageState);
    const items = queryAll(selectors.itemContainer, root);

    if (safeItemIndex < 0 || safeItemIndex >= items.length) {
      return result;
    }

    const item = items[safeItemIndex];
    const targetTextarea = getTargetTextarea(item, selectors);
    const validityControls = collectValidityControls(item);

    result.matched = true;
    result.item = item;
    result.targetTextarea = targetTextarea;
    result.validityControls = validityControls;
    result.snapshot = collectAnnotationItemSnapshot(item, safeItemIndex, selectors);

    return result;
  }

  function createBaseLocateValidityResult(locateResult, itemIndex, targetValidity) {
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
      targetValidity: targetValidity,
      matched: Boolean(locateResult && locateResult.matched && locateResult.item),
      item: locateResult && locateResult.item ? locateResult.item : null,
      snapshot: locateResult && locateResult.snapshot ? locateResult.snapshot : null,
      validityControls:
        locateResult && locateResult.validityControls
          ? locateResult.validityControls
          : createValidityControlsMap(),
      targetControl: null,
    };
  }

  function locateAnnotationValidityOption(itemIndex, targetValidity, pageStateInput) {
    const normalizedTargetValidity = normalizeValidityValue(targetValidity);
    const locateResult = locateAnnotationItem(itemIndex, pageStateInput);
    const result = createBaseLocateValidityResult(
      locateResult,
      Number.isInteger(itemIndex) ? itemIndex : -1,
      normalizedTargetValidity
    );

    if (!normalizedTargetValidity || !result.validityControls[normalizedTargetValidity]) {
      return result;
    }

    result.targetControl = result.validityControls[normalizedTargetValidity];
    return result;
  }

  function collectAnnotationItemSnapshots(pageStateInput) {
    const pageState = resolvePageState(pageStateInput);
    const result = createBaseSnapshotResult(pageState);

    if (!pageState.isTargetSite || pageState.pageType !== "task-detail") {
      return result;
    }

    const selectors = siteContract.ANNOTATION_ITEM_SELECTORS.taskDetail;
    const root = resolveTaskDetailRoot(pageState);
    const items = queryAll(selectors.itemContainer, root);

    result.items = items.map(function (item, index) {
      return collectAnnotationItemSnapshot(item, index, selectors);
    });
    result.itemCount = result.items.length;
    result.matched = result.itemCount > 0;

    return result;
  }

  function logSnapshotResult(snapshotResult) {
    console.debug(LOG_PREFIX, "Annotation item snapshots:", {
      pageType: snapshotResult.pageType,
      routeKey: snapshotResult.routeKey,
      taskId: snapshotResult.taskId,
      matched: snapshotResult.matched,
      itemCount: snapshotResult.itemCount,
      items: snapshotResult.items,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationItemCollector = {
    collect: collectAnnotationItemSnapshots,
    locate: locateAnnotationItem,
    locateValidityOption: locateAnnotationValidityOption,
    log: logSnapshotResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
