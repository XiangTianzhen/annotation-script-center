(function () {
  const PLATFORM_HOST = "labelx.alibaba-inc.com";
  const ROUTE_PATH_PATTERNS = {
    labelingTask: /^\/corpora\/labeling\/labelingtask\/?$/i,
    checkTask: /^\/corpora\/labeling\/checktask\/?$/i,
    sdk: /^\/corpora\/labeling\/sdk\/?$/i,
  };

  const PAGE_RULES = [
    {
      routeName: "labelingTask",
      pageType: "task-list",
      missionType: "label",
      pathPattern: ROUTE_PATH_PATTERNS.labelingTask,
      buildRouteKey: function (routeContext) {
        return (
          "task-list:label:project:" + (routeContext.projectId || "unknown-project")
        );
      },
    },
    {
      routeName: "checkTask",
      pageType: "task-list",
      missionType: "check",
      pathPattern: ROUTE_PATH_PATTERNS.checkTask,
      buildRouteKey: function (routeContext) {
        return (
          "task-list:check:project:" + (routeContext.projectId || "unknown-project")
        );
      },
    },
    {
      routeName: "sdk",
      pageType: "task-detail",
      missionType: null,
      pathPattern: ROUTE_PATH_PATTERNS.sdk,
      buildRouteKey: function (routeContext) {
        return [
          "task-detail",
          routeContext.missionType || "unknown-mission",
          "project",
          routeContext.projectId || "unknown-project",
          "subtask",
          routeContext.subTaskId || "unknown-subtask",
        ].join(":");
      },
    },
  ];

  const DOM_SIGNAL_SELECTORS = {
    hasTaskListContainer:
      ".ant-v5-table-wrapper, .ant-table-wrapper, [class*='table'], [class*='pagination']",
    hasTaskDetailContainer:
      ".labelRender-item, [class*='labelRender'], [class*='mark-toolbox'], [class*='toolbox']",
    hasMainContent: "main, #root, [role='main'], [class*='layout'], [class*='app']",
  };

  const CONTEXT_INFO_EXTRACTORS = {
    taskId: {
      selectors: [
        "[data-sub-task-id]",
        "[data-subtask-id]",
        "[data-task-id]",
        "[class*='subTaskId']",
        "[class*='task-id']",
      ],
      extract: function (element) {
        if (element.dataset) {
          if (element.dataset.subTaskId) {
            return element.dataset.subTaskId;
          }

          if (element.dataset.subtaskId) {
            return element.dataset.subtaskId;
          }

          if (element.dataset.taskId) {
            return element.dataset.taskId;
          }
        }

        const text = element.textContent || "";
        const subTaskMatch = text.match(/sub[_\s-]?task[_\s-]?id[:：\s]*(\d+)/i);
        if (subTaskMatch) {
          return subTaskMatch[1];
        }

        const taskMatch = text.match(/task[_\s-]?id[:：\s]*(\d+)/i);
        return taskMatch ? taskMatch[1] : null;
      },
    },
    taskTitle: {
      selectors: [
        ".ant-v5-page-header-heading-title",
        ".ant-page-header-heading-title",
        "[class*='mark'] h1",
        "[class*='header'] h1",
        "header h1",
        "h1",
      ],
      extract: function (element) {
        const text = (element.textContent || "").trim();
        return text.length > 0 ? text : null;
      },
    },
  };

  const DOM_ADAPTER_SELECTORS = {
    shared: {
      mainContent: ["main", "#root", "[role='main']", "[class*='layout']", "[class*='app']"],
    },
    pageTypes: {
      "task-list": {
        pageContainer: ["main", "#root", "[class*='layout']", "[class*='page']", "body"],
        headerRegion: [
          ".ant-v5-page-header",
          ".ant-page-header",
          "header",
          "[class*='header']",
          "[class*='toolbar']",
        ],
        primaryRegion: [
          ".ant-v5-table-wrapper",
          ".ant-table-wrapper",
          "[class*='table']",
          "[role='table']",
        ],
        secondaryRegion: [
          ".ant-v5-pagination",
          ".ant-pagination",
          "[class*='pagination']",
          "[class*='filter']",
          "[class*='toolbar']",
        ],
        taskRows: [".ant-v5-table-row", ".ant-table-row", "tbody tr", "[role='row']"],
      },
      "task-detail": {
        pageContainer: [
          "[class*='labelRender']",
          "[class*='mark-toolbox']",
          "main",
          "#root",
          "body",
        ],
        headerRegion: [
          ".mark-toolbox-statistic",
          "[class*='mark-toolbox']",
          ".ant-v5-page-header",
          ".ant-page-header",
          "header",
          "[class*='header']",
        ],
        primaryRegion: [
          "[class*='labelRender']",
          ".labelRender-item",
          "[class*='mark-main']",
          "[class*='mark-content']",
          "main",
        ],
        secondaryRegion: [
          ".mark-toolbox-statistic",
          "[class*='mark-toolbox']",
          "[class*='toolbox']",
          "[class*='statistic']",
        ],
        metadataGroup: [
          ".mark-toolbox-statistic",
          "[class*='mark-toolbox']",
          "[class*='toolbox']",
          "[class*='statistic']",
        ],
      },
    },
  };

  const ANNOTATION_ITEM_SELECTORS = {
    taskDetail: {
      itemContainer: [".labelRender-item"],
      sourceFieldTitles: [".labelRender-item-content-title", ".labelRender-item-area-head-name"],
      sourceTextContainer: [".dt-text-container"],
      targetTextareaByLabel: ['textarea[label="转写文本"]'],
      targetAnswerWrap: [".labelRender-item-answer-wrap"],
      targetAnswerTitle: [".labelRender-item-answer-title"],
      targetTextareaFallback: ["textarea"],
      checkedValidityInput: [
        '.ant-v5-radio-wrapper-checked input[type="radio"]',
        'input[type="radio"]:checked',
      ],
    },
    sourceFieldKeywords: ["文本"],
    targetFieldKeywords: ["转写文本"],
    validityOptions: ["有效", "无效", "特殊"],
    validityOptionInputs: ['input[type="radio"]'],
    validityOptionLabels: [".ant-v5-radio-wrapper", "label"],
  };

  const SAVE_CONTROL_SELECTORS = {
    taskDetail: {
      controlRoot: [
        ".mark-toolbox-statistic",
        "[class*='mark-toolbox']",
        "[class*='labelRender']",
        "main",
        "#root",
      ],
      buttonCandidates: [
        "button.ant-v5-btn",
        ".ant-v5-btn",
        "button.ant-btn",
        ".ant-btn",
        "button",
        "[role='button']",
      ],
      textKeywords: ["保存"],
      excludedTextKeywords: ["提交", "结束", "下一条", "领取", "完成", "发布", "导出", "取消"],
      disabledClasses: [
        "ant-v5-btn-disabled",
        "ant-btn-disabled",
        "disabled",
        "is-disabled",
        "ant-v5-btn-loading",
        "ant-btn-loading",
        "loading",
      ],
    },
  };

  const SUBMIT_CONTROL_SELECTORS = {
    taskDetail: {
      controlRoot: [
        ".mark-toolbox-statistic",
        "[class*='mark-toolbox']",
        "[class*='labelRender']",
        "main",
        "#root",
      ],
      triggerCandidates: [
        "button.ant-v5-dropdown-trigger",
        ".ant-v5-dropdown-button .ant-v5-dropdown-trigger",
        "button.ant-dropdown-trigger",
        ".ant-dropdown-button .ant-dropdown-trigger",
      ],
      buttonCandidates: [
        "button.ant-v5-btn",
        ".ant-v5-btn",
        "button.ant-btn",
        ".ant-btn",
        "button",
        "[role='button']",
      ],
      textKeywords: ["提交并结束", "提交任务", "提交"],
      excludedTextKeywords: ["保存", "取消", "发布", "导出", "下一条", "领取"],
      disabledClasses: [
        "ant-v5-btn-disabled",
        "ant-btn-disabled",
        "disabled",
        "is-disabled",
        "ant-v5-btn-loading",
        "ant-btn-loading",
        "loading",
      ],
    },
  };

  function normalizePathname(pathname) {
    if (typeof pathname !== "string" || pathname.length === 0) {
      return "/";
    }

    const safePathname = pathname.split("?")[0].split("#")[0];
    const normalized = safePathname.startsWith("/") ? safePathname : "/" + safePathname;
    return normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  }

  function normalizeSearch(search) {
    if (typeof search !== "string" || search.length === 0) {
      return "";
    }

    return search.startsWith("?") ? search : "?" + search;
  }

  function normalizeHash(hash) {
    if (typeof hash !== "string" || hash.length === 0) {
      return "";
    }

    return hash.startsWith("#") ? hash : "#" + hash;
  }

  function normalizeTextValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  function normalizeMissionType(value) {
    const normalized = normalizeTextValue(value);
    if (!normalized) {
      return null;
    }

    const missionType = normalized.toLowerCase();
    return missionType === "label" || missionType === "check" ? missionType : null;
  }

  function createSearchParams(search) {
    return new URLSearchParams(normalizeSearch(search));
  }

  function isTargetSite(hostname) {
    return hostname === PLATFORM_HOST;
  }

  function getRouteContext(locationLike) {
    const hostname =
      locationLike && typeof locationLike.hostname === "string"
        ? locationLike.hostname
        : location.hostname;
    const pathname =
      locationLike && typeof locationLike.pathname === "string"
        ? normalizePathname(locationLike.pathname)
        : normalizePathname(location.pathname);
    const search =
      locationLike && typeof locationLike.search === "string"
        ? normalizeSearch(locationLike.search)
        : normalizeSearch(location.search);
    const hash =
      locationLike && typeof locationLike.hash === "string"
        ? normalizeHash(locationLike.hash)
        : normalizeHash(location.hash);
    const searchParams = createSearchParams(search);
    const routeName = resolveRouteName(pathname);
    const missionType =
      routeName === "labelingTask"
        ? "label"
        : routeName === "checkTask"
          ? "check"
          : normalizeMissionType(searchParams.get("missionType"));
    const projectId = normalizeTextValue(
      searchParams.get("projectId") || searchParams.get("appId")
    );
    const subTaskId = normalizeTextValue(searchParams.get("subTaskId"));

    return {
      hostname: hostname,
      pathname: pathname,
      search: search,
      hash: hash,
      routeName: routeName,
      missionType: missionType,
      projectId: projectId,
      subTaskId: subTaskId,
    };
  }

  function resolveRouteName(pathname) {
    const normalizedPathname = normalizePathname(pathname);
    const lowerPathname = normalizedPathname.toLowerCase();

    if (ROUTE_PATH_PATTERNS.labelingTask.test(lowerPathname)) {
      return "labelingTask";
    }

    if (ROUTE_PATH_PATTERNS.checkTask.test(lowerPathname)) {
      return "checkTask";
    }

    if (ROUTE_PATH_PATTERNS.sdk.test(lowerPathname)) {
      return "sdk";
    }

    return "unknown";
  }

  function resolvePageRule(locationLike) {
    const routeContext =
      locationLike && typeof locationLike === "object" && Object.prototype.hasOwnProperty.call(locationLike, "routeName")
        ? locationLike
        : getRouteContext(locationLike);

    for (const rule of PAGE_RULES) {
      if (!rule.pathPattern.test(routeContext.pathname)) {
        continue;
      }

      return {
        routeName: rule.routeName,
        pageType: rule.pageType,
        missionType: rule.missionType || routeContext.missionType,
        routeKey: rule.buildRouteKey(routeContext),
      };
    }

    return {
      routeName: "unknown",
      pageType: "unknown",
      missionType: routeContext.missionType,
      routeKey: "unknown:" + routeContext.pathname,
    };
  }

  function getPageInfo(locationLike) {
    const routeContext = getRouteContext(locationLike);
    const targetSite = isTargetSite(routeContext.hostname);
    const pageRule = targetSite
      ? resolvePageRule(routeContext)
      : {
          routeName: "unknown",
          pageType: "unknown",
          missionType: null,
          routeKey: "non-target",
        };

    return {
      isTargetSite: targetSite,
      hostname: routeContext.hostname,
      pathname: routeContext.pathname,
      search: routeContext.search,
      hash: routeContext.hash,
      routeName: pageRule.routeName,
      pageType: pageRule.pageType,
      routeKey: pageRule.routeKey,
      missionType: pageRule.missionType,
      projectId: routeContext.projectId,
      subTaskId: routeContext.subTaskId,
      timestamp: new Date().toISOString(),
    };
  }

  function getRouteInfo(locationLike) {
    const pageInfo = getPageInfo(locationLike);

    return {
      pathname: pageInfo.pathname,
      search: pageInfo.search,
      hash: pageInfo.hash,
      routeName: pageInfo.routeName,
      pageType: pageInfo.pageType,
      routeKey: pageInfo.routeKey,
      missionType: pageInfo.missionType,
      projectId: pageInfo.projectId,
      subTaskId: pageInfo.subTaskId,
      timestamp: pageInfo.timestamp,
    };
  }

  function createEmptyDomSignals() {
    return {
      hasTaskListContainer: false,
      hasTaskDetailContainer: false,
      hasMainContent: false,
    };
  }

  function createEmptyContextInfo() {
    return {
      taskId: null,
      subTaskId: null,
      projectId: null,
      missionType: null,
      taskTitle: null,
    };
  }

  function createEmptyDomAdapterElements() {
    return {
      mainContent: null,
      pageContainer: null,
      headerRegion: null,
      primaryRegion: null,
      secondaryRegion: null,
    };
  }

  function createEmptyDomAdapterProbes() {
    return {
      hasMainContent: false,
      hasPageContainer: false,
      hasHeaderRegion: false,
      hasPrimaryRegion: false,
      hasSecondaryRegion: false,
      hasTaskRows: false,
      hasMetadataGroup: false,
    };
  }

  function createEmptyDomAdapterMetadata() {
    return {
      taskId: null,
      taskTitle: null,
      headerText: null,
    };
  }

  function createBaseDomAdapterResult(pageState) {
    return {
      pageType:
        pageState && typeof pageState.pageType === "string" ? pageState.pageType : "unknown",
      routeKey:
        pageState && typeof pageState.routeKey === "string" ? pageState.routeKey : "non-target",
      matched: false,
      elements: createEmptyDomAdapterElements(),
      probes: createEmptyDomAdapterProbes(),
      metadata: createEmptyDomAdapterMetadata(),
    };
  }

  function createBasePageState(options) {
    const pageInfo = getPageInfo(options);

    return {
      isTargetSite: pageInfo.isTargetSite,
      hostname: pageInfo.hostname,
      pathname: pageInfo.pathname,
      search: pageInfo.search,
      hash: pageInfo.hash,
      routeName: pageInfo.routeName,
      pageType: pageInfo.pageType,
      routeKey: pageInfo.routeKey,
      missionType: pageInfo.missionType,
      projectId: pageInfo.projectId,
      subTaskId: pageInfo.subTaskId,
      timestamp: pageInfo.timestamp,
      pageTitle: options && typeof options.pageTitle === "string" ? options.pageTitle : "",
      domSignals: createEmptyDomSignals(),
      contextInfo: createEmptyContextInfo(),
    };
  }

  window.__ASREdgeAlibabaLabelxSiteContract = {
    PLATFORM_HOST,
    ROUTE_PATH_PATTERNS,
    PAGE_RULES,
    DOM_SIGNAL_SELECTORS,
    CONTEXT_INFO_EXTRACTORS,
    DOM_ADAPTER_SELECTORS,
    ANNOTATION_ITEM_SELECTORS,
    SAVE_CONTROL_SELECTORS,
    SUBMIT_CONTROL_SELECTORS,
    normalizePathname,
    normalizeSearch,
    normalizeHash,
    normalizeMissionType,
    getRouteContext,
    createSearchParams,
    isTargetSite,
    resolveRouteName,
    resolvePageRule,
    getPageInfo,
    getRouteInfo,
    createEmptyDomSignals,
    createEmptyContextInfo,
    createEmptyDomAdapterElements,
    createEmptyDomAdapterProbes,
    createEmptyDomAdapterMetadata,
    createBaseDomAdapterResult,
    createBasePageState,
  };
})();
