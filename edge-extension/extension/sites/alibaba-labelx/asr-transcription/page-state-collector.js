(function () {
  const LOG_PREFIX = "[ASR Edge][page-state-collector]";
  const DOM_ADAPTER_LOG_PREFIX = "[ASR Edge][dom-adapter]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;

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

  function readText(element) {
    if (!element) {
      return null;
    }

    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
  }

  function normalizeTextValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : null;
  }

  function extractTaskIdFromPath(pathname) {
    if (typeof pathname !== "string") {
      return null;
    }

    const match = pathname.match(/\/task\/(\d+)/);
    if (match) {
      return match[1];
    }

    if (/\/corpora\/labeling\/sdk(?:\/|$)/i.test(pathname)) {
      try {
        const subTaskId = new URLSearchParams(location.search || "").get("subTaskId");
        if (typeof subTaskId === "string" && subTaskId.trim().length > 0) {
          return subTaskId.trim();
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function createPageStateInput(pageState) {
    if (pageState && typeof pageState === "object") {
      return pageState;
    }

    return siteContract.createBasePageState({
      hostname: location.hostname,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      pageTitle: document.title || "",
    });
  }

  function collectContextValue(config, root) {
    if (!config || typeof config.extract !== "function") {
      return null;
    }

    for (const selector of normalizeSelectors(config.selectors)) {
      try {
        const element = queryFirst(selector, root);
        if (!element) {
          continue;
        }

        const value = config.extract(element);
        if (value) {
          return normalizeTextValue(value);
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  function updateSharedElements(result) {
    result.elements.mainContent = queryFirst(siteContract.DOM_ADAPTER_SELECTORS.shared.mainContent);
    result.probes.hasMainContent = Boolean(result.elements.mainContent);
  }

  function updateElementProbes(result) {
    result.probes.hasPageContainer = Boolean(result.elements.pageContainer);
    result.probes.hasHeaderRegion = Boolean(result.elements.headerRegion);
    result.probes.hasPrimaryRegion = Boolean(result.elements.primaryRegion);
    result.probes.hasSecondaryRegion = Boolean(result.elements.secondaryRegion);
  }

  function collectTaskListResult(pageState, result) {
    const selectors = siteContract.DOM_ADAPTER_SELECTORS.pageTypes["task-list"];
    const baseRoot = result.elements.mainContent || document;

    result.elements.pageContainer = queryFirst(selectors.pageContainer, baseRoot);
    const scopedRoot = result.elements.pageContainer || baseRoot;
    result.elements.headerRegion = queryFirst(selectors.headerRegion, scopedRoot);
    result.elements.primaryRegion = queryFirst(selectors.primaryRegion, scopedRoot);
    result.elements.secondaryRegion = queryFirst(selectors.secondaryRegion, scopedRoot);

    const taskRows = queryAll(
      selectors.taskRows,
      result.elements.primaryRegion || result.elements.pageContainer || scopedRoot
    );

    updateElementProbes(result);
    result.probes.hasTaskRows = taskRows.length > 0;
    result.metadata.headerText = normalizeTextValue(
      readText(result.elements.headerRegion) || pageState.pageTitle || null
    );
    result.matched =
      result.probes.hasPageContainer || result.probes.hasPrimaryRegion || result.probes.hasTaskRows;

    return result;
  }

  function collectTaskDetailResult(pageState, result) {
    const selectors = siteContract.DOM_ADAPTER_SELECTORS.pageTypes["task-detail"];
    const baseRoot = result.elements.mainContent || document;

    result.elements.pageContainer = queryFirst(selectors.pageContainer, baseRoot);
    const scopedRoot = result.elements.pageContainer || baseRoot;
    result.elements.headerRegion = queryFirst(selectors.headerRegion, scopedRoot);
    result.elements.primaryRegion = queryFirst(selectors.primaryRegion, scopedRoot);
    result.elements.secondaryRegion = queryFirst(selectors.secondaryRegion, scopedRoot);

    const titleConfig = siteContract.CONTEXT_INFO_EXTRACTORS.taskTitle;
    const taskIdConfig = siteContract.CONTEXT_INFO_EXTRACTORS.taskId;
    const headerRoot = result.elements.headerRegion || result.elements.pageContainer || scopedRoot;
    const metadataRoot = result.elements.secondaryRegion || result.elements.pageContainer || scopedRoot;
    const titleElement = queryFirst(titleConfig && titleConfig.selectors, headerRoot);
    const metadataGroup = queryFirst(selectors.metadataGroup, metadataRoot);

    updateElementProbes(result);
    result.probes.hasMetadataGroup = Boolean(metadataGroup);

    result.metadata.taskId = normalizeTextValue(
      collectContextValue(taskIdConfig, result.elements.pageContainer || result.elements.primaryRegion)
    );
    result.metadata.taskTitle = normalizeTextValue(
      collectContextValue(titleConfig, headerRoot) || readText(titleElement)
    );
    result.metadata.headerText = normalizeTextValue(
      readText(result.elements.headerRegion) || result.metadata.taskTitle
    );
    result.matched =
      result.probes.hasPageContainer ||
      result.probes.hasPrimaryRegion ||
      result.probes.hasMetadataGroup ||
      Boolean(result.metadata.taskTitle);

    return result;
  }

  function collectDomAdapterResult(pageStateInput) {
    const pageState = createPageStateInput(pageStateInput);
    const result = siteContract.createBaseDomAdapterResult(pageState);

    try {
      if (
        !pageState.isTargetSite ||
        (pageState.pageType !== "task-list" && pageState.pageType !== "task-detail")
      ) {
        return result;
      }

      updateSharedElements(result);

      if (pageState.pageType === "task-list") {
        return collectTaskListResult(pageState, result);
      }

      return collectTaskDetailResult(pageState, result);
    } catch (error) {
      console.warn(DOM_ADAPTER_LOG_PREFIX, "Failed to collect DOM adapter result:", error);
      return result;
    }
  }

  function resolveTaskId(pageState, domAdapterResult) {
    if (pageState.pageType !== "task-detail") {
      return null;
    }

    return (
      normalizeTextValue(domAdapterResult.metadata.taskId) ||
      normalizeTextValue(pageState.subTaskId) ||
      extractTaskIdFromPath(pageState.pathname) ||
      null
    );
  }

  function resolveTaskTitle(pageState, domAdapterResult) {
    if (pageState.pageType !== "task-detail") {
      return null;
    }

    return (
      normalizeTextValue(domAdapterResult.metadata.taskTitle) ||
      normalizeTextValue(domAdapterResult.metadata.headerText) ||
      null
    );
  }

  function createDomSignals(pageState, domAdapterResult) {
    return {
      hasTaskListContainer:
        pageState.pageType === "task-list" &&
        (domAdapterResult.probes.hasPageContainer ||
          domAdapterResult.probes.hasPrimaryRegion ||
          domAdapterResult.probes.hasTaskRows),
      hasTaskDetailContainer:
        pageState.pageType === "task-detail" &&
        (domAdapterResult.probes.hasPageContainer ||
          domAdapterResult.probes.hasPrimaryRegion ||
          domAdapterResult.probes.hasMetadataGroup),
      hasMainContent: domAdapterResult.probes.hasMainContent,
    };
  }

  function createContextInfo(pageState, domAdapterResult) {
    const baseContextInfo = siteContract.createEmptyContextInfo();
    const missionType = normalizeTextValue(pageState.missionType);
    const projectId = normalizeTextValue(pageState.projectId);
    const subTaskId = normalizeTextValue(pageState.subTaskId);

    if (pageState.pageType !== "task-detail") {
      baseContextInfo.projectId = projectId;
      baseContextInfo.missionType = missionType;
      return baseContextInfo;
    }

    return {
      taskId: resolveTaskId(pageState, domAdapterResult),
      subTaskId: subTaskId || resolveTaskId(pageState, domAdapterResult),
      projectId: projectId,
      missionType: missionType,
      taskTitle: resolveTaskTitle(pageState, domAdapterResult),
    };
  }

  function applyDomAdapterResult(pageState, domAdapterResult) {
    pageState.domSignals = createDomSignals(pageState, domAdapterResult);
    pageState.contextInfo = createContextInfo(pageState, domAdapterResult);
  }

  function collectPageStateBundle(pageStateInput) {
    const pageState = createPageStateInput(pageStateInput);
    const domAdapterResult = collectDomAdapterResult(pageState);

    applyDomAdapterResult(pageState, domAdapterResult);

    return {
      pageState,
      domAdapterResult,
    };
  }

  function collectPageState() {
    return collectPageStateBundle().pageState;
  }

  function createPageStateSignature(pageState) {
    return JSON.stringify({
      pathname: pageState.pathname,
      routeKey: pageState.routeKey,
      pageType: pageState.pageType,
      domSignals: pageState.domSignals,
      contextInfo: pageState.contextInfo,
    });
  }

  function normalizeCollectOptions(options) {
    if (options === true) {
      return { force: true };
    }

    if (options && typeof options === "object") {
      return {
        force: Boolean(options.force),
      };
    }

    return { force: false };
  }

  function logDomAdapterResult(domAdapterResult) {
    console.debug(DOM_ADAPTER_LOG_PREFIX, "DOM adapter result:", {
      pageType: domAdapterResult.pageType,
      routeKey: domAdapterResult.routeKey,
      matched: domAdapterResult.matched,
      probes: domAdapterResult.probes,
      metadata: domAdapterResult.metadata,
    });
  }

  function logPageState(pageState) {
    console.info(LOG_PREFIX, "Page state collected:", pageState);
    console.debug(LOG_PREFIX, "DOM signals:", pageState.domSignals);
    console.debug(LOG_PREFIX, "Context info:", pageState.contextInfo);
  }

  function createPageStateCollector(callback) {
    let lastPageState = null;
    let lastDomAdapterResult = null;
    let lastPageStateSignature = null;
    let lastCollectedAt = null;

    function collect(trigger, options) {
      const collectOptions = normalizeCollectOptions(options);
      const bundle = collectPageStateBundle();
      const pageState = bundle.pageState;
      const domAdapterResult = bundle.domAdapterResult;
      const pageStateSignature = createPageStateSignature(pageState);

      if (!collectOptions.force && lastPageStateSignature === pageStateSignature) {
        console.debug(LOG_PREFIX, `State unchanged (${trigger}), skipping.`);
        return lastPageState;
      }

      if (
        lastPageState &&
        lastPageState.pathname === pageState.pathname &&
        lastPageState.routeKey === pageState.routeKey &&
        lastPageStateSignature !== pageStateSignature
      ) {
        console.debug(
          LOG_PREFIX,
          `Same route context changed (${trigger}), collecting updated state.`
        );
      }

      lastPageState = pageState;
      lastDomAdapterResult = domAdapterResult;
      lastPageStateSignature = pageStateSignature;
      lastCollectedAt = Date.now();

      logDomAdapterResult(domAdapterResult);
      logPageState(pageState);

      if (typeof callback === "function") {
        callback(pageState, trigger, domAdapterResult);
      }

      return pageState;
    }

    return {
      collect: function (trigger, options) {
        return collect(trigger || "manual", options);
      },
      collectInitial: function () {
        return collect("initial");
      },
      collectForced: function (trigger) {
        return collect(trigger || "manual-force", { force: true });
      },
      getLastState: function () {
        return lastPageState;
      },
      getLastDomAdapterResult: function () {
        return lastDomAdapterResult;
      },
      getLastSignature: function () {
        return lastPageStateSignature;
      },
      getLastCollectedAt: function () {
        return lastCollectedAt;
      },
    };
  }

  const domAdapter = {
    collect: collectDomAdapterResult,
    queryFirst: queryFirst,
    queryAll: queryAll,
    readText: readText,
    LOG_PREFIX: DOM_ADAPTER_LOG_PREFIX,
  };

  window.__ASREdgeAlibabaLabelxDomAdapter = domAdapter;
  window.__ASREdgePageStateCollector = {
    createPageStateCollector,
    collectPageState,
    collectDomAdapterResult,
    createPageStateSignature,
    LOG_PREFIX,
    DOM_ADAPTER_LOG_PREFIX,
  };

  void (function initialCollection() {
    const bundle = collectPageStateBundle();
    logDomAdapterResult(bundle.domAdapterResult);
    logPageState(bundle.pageState);
  })();
})();
