(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-control-panel]";
  const HOST_ID = "asr-edge-annotation-control-panel-host";
  let panelInstance = null;

  const ACTIONS = {
    preview: { label: "页面计划预览", requiresTaskDetail: true },
    apply: { label: "整页受控执行", requiresTaskDetail: true },
    report: { label: "整页结果报告", requiresTaskDetail: false },
    syncDictionary: { label: "同步词库", requiresTaskDetail: false },
    uploadDictionary: { label: "上传词库待审", requiresTaskDetail: false },
    checkUpdate: { label: "检查更新", requiresTaskDetail: false },
  };
  const BLOCKED_ACTIONS = new Set([
    "save",
    "submit",
  ]);

  const COMPACT_KEYS = [
    "pageType",
    "routeKey",
    "taskId",
    "matched",
    "completed",
    "reason",
    "summaryText",
    "itemCount",
    "plannedCount",
    "successCount",
    "failedCount",
    "count",
    "clicked",
    "saved",
    "submitted",
    "phaseSummary",
    "applyPhase",
    "savePhase",
    "submitPhase",
    "warnings",
    "lines",
  ];

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function compactValue(value, depth) {
    if (depth >= 3) {
      return "[Truncated]";
    }

    if (Array.isArray(value)) {
      const limited = value.slice(0, 4).map(function (entry) {
        return compactValue(entry, depth + 1);
      });
      if (value.length > 4) {
        limited.push("... +" + (value.length - 4) + " more");
      }
      return limited;
    }

    if (!isObject(value)) {
      return value;
    }

    const result = {};
    const preferredKeys = COMPACT_KEYS.filter(function (key) {
      return Object.prototype.hasOwnProperty.call(value, key);
    });
    const keys = preferredKeys.length > 0 ? preferredKeys : Object.keys(value).slice(0, 8);
    keys.forEach(function (key) {
      result[key] = compactValue(value[key], depth + 1);
    });
    if (Object.keys(value).length > keys.length) {
      result.__extraKeys = Object.keys(value).length - keys.length;
    }
    return result;
  }

  function toPrettyJson(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return JSON.stringify({ error: "serialize-failed" }, null, 2);
    }
  }

  function createInitialState() {
    return {
      visible: false,
      busy: false,
      lastAction: "尚未执行",
      lastSummary: "等待手动触发迁移后的能力。",
      lastResult: {
        note: "No action has been triggered yet.",
      },
      lastPageApplyResult: null,
      currentPageState: null,
    };
  }

  function getCurrentPageState(deps, trigger) {
    if (deps.stateCollector && typeof deps.stateCollector.collect === "function") {
      return deps.stateCollector.collect(trigger || "annotation-control-panel");
    }

    if (deps.pageStateCollector && typeof deps.pageStateCollector.collectPageState === "function") {
      return deps.pageStateCollector.collectPageState();
    }

    return null;
  }

  function isTaskDetailPage(pageState) {
    return Boolean(pageState && pageState.isTargetSite && pageState.pageType === "task-detail");
  }

  function resolvePageApplySource(state) {
    if (isObject(state.lastPageApplyResult)) {
      return state.lastPageApplyResult;
    }

    return null;
  }

  function summarize(actionLabel, result) {
    if (typeof result?.summaryText === "string" && result.summaryText) {
      return result.summaryText;
    }

    if (typeof result?.reason === "string") {
      return actionLabel + " 已返回结果，reason=" + result.reason + "。";
    }

    return actionLabel + " 已执行。";
  }

  function updateResultState(instance, actionLabel, summaryText, rawResult, compactResult) {
    const history =
      window.__ASREdgeAlibabaLabelxAnnotationActionHistory ||
      instance.deps.annotationActionHistory ||
      null;

    instance.state.lastAction = actionLabel;
    instance.state.lastSummary = summaryText;
    instance.state.lastResult = compactResult;
    instance.ui.lastActionValue.textContent = actionLabel;
    instance.ui.lastSummaryValue.textContent = summaryText;
    instance.ui.lastResultValue.textContent = toPrettyJson(compactResult);

    if (history && typeof history.push === "function") {
      history.push(actionLabel, compactResult);
    }

    console.info(LOG_PREFIX, actionLabel + " finished:", rawResult);
  }

  function refreshPanelContext(instance) {
    const pageState = getCurrentPageState(instance.deps, "annotation-control-panel-refresh");
    instance.state.currentPageState = pageState;
    const isTaskDetail = isTaskDetailPage(pageState);
    instance.ui.pageStatus.textContent = isTaskDetail
      ? "当前页面已命中 task-detail，可执行基础转写能力。"
      : "当前页面不是 task-detail。仅保留基础只读/词库/更新能力入口。";

    Object.keys(instance.ui.actionButtons).forEach(function (actionKey) {
      const action = ACTIONS[actionKey];
      if (!action) {
        return;
      }
      instance.ui.actionButtons[actionKey].disabled =
        instance.state.busy || (action.requiresTaskDetail && !isTaskDetail);
    });

    return pageState;
  }

  function createButtonMarkup() {
    return Object.keys(ACTIONS)
      .map(function (actionKey) {
        return (
          '<button type="button" class="action-button" data-action="' +
          actionKey +
          '">' +
          ACTIONS[actionKey].label +
          "</button>"
        );
      })
      .join("");
  }

  function ensureHost() {
    const existing = document.getElementById(HOST_ID);
    if (existing) {
      return existing;
    }

    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.right = "10px";
    host.style.bottom = "42px";
    host.style.zIndex = "2147483646";
    document.documentElement.appendChild(host);
    return host;
  }

  function bindUi(instance) {
    const shadow = instance.host.shadowRoot;
    instance.ui = {
      toggleButton: shadow.querySelector("[data-role='toggle-button']"),
      panel: shadow.querySelector("[data-role='panel']"),
      closeButton: shadow.querySelector("[data-role='close-button']"),
      pageStatus: shadow.querySelector("[data-role='page-status']"),
      lastActionValue: shadow.querySelector("[data-role='last-action-value']"),
      lastSummaryValue: shadow.querySelector("[data-role='last-summary-value']"),
      lastResultValue: shadow.querySelector("[data-role='last-result-value']"),
      actionButtons: {},
    };

    Object.keys(ACTIONS).forEach(function (actionKey) {
      instance.ui.actionButtons[actionKey] = shadow.querySelector(
        "[data-action='" + actionKey + "']"
      );
    });
  }

  function renderHost(instance) {
    const shadow = instance.host.attachShadow({ mode: "open" });
    shadow.innerHTML = [
      "<style>",
      ":host { all: initial; }",
      ".toggle-button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; min-width: 118px; height: 34px; padding: 0 12px; border-radius: 999px; background: #111827; color: #f8fafc; font: 600 12px/1.2 'Segoe UI', sans-serif; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18); cursor: pointer; }",
      ".panel { box-sizing: border-box; width: 390px; margin-top: 10px; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 14px; background: rgba(255, 255, 255, 0.98); color: #111827; font: 500 12px/1.5 'Segoe UI', sans-serif; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18); overflow: hidden; }",
      ".panel.hidden { display: none; }",
      ".panel-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px 10px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); }",
      ".panel-title { margin: 0; font: 700 13px/1.2 'Segoe UI', sans-serif; }",
      ".close-button { all: unset; cursor: pointer; padding: 2px 6px; border-radius: 6px; color: #475569; font: 700 13px/1.2 'Segoe UI', sans-serif; }",
      ".panel-body { padding: 12px 14px 14px; }",
      ".page-status { margin: 0 0 10px; padding: 8px 10px; border-radius: 10px; background: #f8fafc; color: #334155; }",
      ".actions-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }",
      ".action-button { all: unset; box-sizing: border-box; min-height: 34px; padding: 8px 10px; border-radius: 10px; background: #e2e8f0; color: #0f172a; font: 600 12px/1.3 'Segoe UI', sans-serif; text-align: center; cursor: pointer; }",
      ".action-button:disabled { opacity: 0.45; cursor: not-allowed; }",
      ".result-block { margin-top: 12px; padding: 10px; border-radius: 12px; background: #f8fafc; border: 1px solid rgba(15, 23, 42, 0.06); }",
      ".result-line { margin: 0 0 8px; }",
      ".result-label { display: block; color: #475569; font-weight: 700; margin-bottom: 2px; }",
      ".result-value { color: #0f172a; word-break: break-word; }",
      ".result-json { margin: 0; max-height: 240px; overflow: auto; padding: 10px; border-radius: 10px; background: #0f172a; color: #e2e8f0; font: 12px/1.45 Consolas, 'SFMono-Regular', monospace; white-space: pre-wrap; }",
      "</style>",
      '<button type="button" class="toggle-button" data-role="toggle-button">ASR Control</button>',
      '<section class="panel hidden" data-role="panel">',
      '  <div class="panel-header">',
      '    <h2 class="panel-title">ASR Legacy Control</h2>',
      '    <button type="button" class="close-button" data-role="close-button">Hide</button>',
      "  </div>",
      '  <div class="panel-body">',
      '    <p class="page-status" data-role="page-status">正在读取页面状态...</p>',
      '    <div class="actions-grid">',
      createButtonMarkup(),
      "    </div>",
      '    <div class="result-block">',
      '      <p class="result-line"><span class="result-label">最近一次动作</span><span class="result-value" data-role="last-action-value">尚未执行</span></p>',
      '      <p class="result-line"><span class="result-label">最近一次动作摘要</span><span class="result-value" data-role="last-summary-value">等待手动触发现有能力。</span></p>',
      '      <div class="result-line"><span class="result-label">最近一次动作精简结果</span><pre class="result-json" data-role="last-result-value">{\n  "note": "No action has been triggered yet."\n}</pre></div>',
      "    </div>",
      "  </div>",
      "</section>",
    ].join("");
  }

  function showPanel(instance) {
    instance.state.visible = true;
    instance.ui.panel.classList.remove("hidden");
    refreshPanelContext(instance);
  }

  function hidePanel(instance) {
    instance.state.visible = false;
    instance.ui.panel.classList.add("hidden");
  }

  function togglePanel(instance) {
    if (instance.state.visible) {
      hidePanel(instance);
      return;
    }

    showPanel(instance);
  }

  function createLocalResult(reason, summaryText, extra) {
    return Object.assign(
      {
        reason: reason,
        summaryText: summaryText,
      },
      extra || {}
    );
  }

  async function executeAction(instance, actionKey) {
    if (BLOCKED_ACTIONS.has(actionKey)) {
      return createLocalResult(
        "disabled-in-basic-stage",
        "当前基础转写阶段已禁用该动作入口。"
      );
    }

    const pageState = refreshPanelContext(instance);

    if (ACTIONS[actionKey]?.requiresTaskDetail && !isTaskDetailPage(pageState)) {
      return createLocalResult("non-task-detail", "当前页面不是 task-detail。", {
        pageType: pageState?.pageType || "unknown",
        routeKey: pageState?.routeKey || "non-target",
      });
    }

    if (actionKey === "preview") {
      return instance.deps.annotationPagePlanPreview.preview(
        {
          onlyActionable: true,
          maxItems: null,
        },
        pageState
      );
    }

    if (actionKey === "apply") {
      const applyResult = instance.deps.annotationPageApplyRunner.run(
        {
          onlyActionable: true,
          maxItems: null,
        },
        pageState
      );
      instance.state.lastPageApplyResult = applyResult;
      return applyResult;
    }

    if (actionKey === "report") {
      const source = resolvePageApplySource(instance.state);
      if (!source) {
        return createLocalResult(
          "page-apply-result-missing",
          "当前没有可用于结果报告的整页执行结果。"
        );
      }
      return instance.deps.annotationPageReport.report(source);
    }

    if (actionKey === "syncDictionary") {
      if (!instance.deps.legacyDictionarySync) {
        return createLocalResult("dictionary-sync-missing", "词库同步模块未接入。");
      }
      return instance.deps.legacyDictionarySync.syncFromServer();
    }

    if (actionKey === "uploadDictionary") {
      if (!instance.deps.legacyDictionarySync) {
        return createLocalResult("dictionary-upload-missing", "词库上传模块未接入。");
      }
      return instance.deps.legacyDictionarySync.uploadPendingReview();
    }

    if (actionKey === "checkUpdate") {
      if (!instance.deps.legacyVersionCheck) {
        return createLocalResult("version-check-missing", "更新检查模块未接入。");
      }
      return instance.deps.legacyVersionCheck.checkNow();
    }

    return createLocalResult("unknown-action", "未识别的动作：" + actionKey);
  }

  async function handleAction(instance, actionKey) {
    const action = ACTIONS[actionKey];
    if (!action || instance.state.busy) {
      return null;
    }

    instance.state.busy = true;
    refreshPanelContext(instance);

    try {
      const rawResult = await executeAction(instance, actionKey);
      updateResultState(
        instance,
        action.label,
        summarize(action.label, rawResult),
        rawResult,
        compactValue(rawResult, 0)
      );
      return rawResult;
    } catch (error) {
      console.warn(LOG_PREFIX, "Action failed:", actionKey, error);
      const failedResult = createLocalResult(
        "panel-action-error",
        action.label + " 发生本地异常。",
        {
          message: error && error.message ? error.message : String(error),
        }
      );
      updateResultState(
        instance,
        action.label,
        failedResult.summaryText,
        failedResult,
        compactValue(failedResult, 0)
      );
      return failedResult;
    } finally {
      instance.state.busy = false;
      refreshPanelContext(instance);
    }
  }

  function bindEvents(instance) {
    instance.ui.toggleButton.addEventListener("click", function () {
      togglePanel(instance);
    });

    instance.ui.closeButton.addEventListener("click", function () {
      hidePanel(instance);
    });

    Object.keys(instance.ui.actionButtons).forEach(function (actionKey) {
      const button = instance.ui.actionButtons[actionKey];
      if (!button) {
        return;
      }

      button.addEventListener("click", function () {
        void handleAction(instance, actionKey);
      });
    });
  }

  function validateDependencies(options) {
    const requiredKeys = [
      "stateCollector",
      "pageStateCollector",
      "annotationPagePlanPreview",
      "annotationPageApplyRunner",
      "annotationPageReport",
      "annotationFlowReport",
    ];

    return requiredKeys.filter(function (key) {
      return !options || !options[key];
    });
  }

  function mountControlPanel(options) {
    const missing = validateDependencies(options);
    if (missing.length > 0) {
      console.warn(LOG_PREFIX, "Required dependencies are missing:", missing.join(", "));
      return null;
    }

    if (panelInstance) {
      refreshPanelContext(panelInstance);
      return panelInstance.api;
    }

    const instance = {
      host: ensureHost(),
      deps: options,
      state: createInitialState(),
      ui: null,
      api: null,
    };

    renderHost(instance);
    bindUi(instance);
    bindEvents(instance);
    refreshPanelContext(instance);

    instance.api = {
      show: function () {
        showPanel(instance);
      },
      hide: function () {
        hidePanel(instance);
      },
      toggle: function () {
        togglePanel(instance);
      },
      refresh: function () {
        return refreshPanelContext(instance);
      },
      runAction: function (actionKey) {
        return handleAction(instance, actionKey);
      },
      getState: function () {
        return {
          visible: instance.state.visible,
          busy: instance.state.busy,
          lastAction: instance.state.lastAction,
          lastSummary: instance.state.lastSummary,
          lastResult: instance.state.lastResult,
        };
      },
    };

    panelInstance = instance;
    return instance.api;
  }

  function unmountControlPanel() {
    if (!panelInstance) {
      return false;
    }

    panelInstance.host.remove();
    panelInstance = null;
    return true;
  }

  window.__ASREdgeAlibabaLabelxAnnotationControlPanel = {
    mount: mountControlPanel,
    unmount: unmountControlPanel,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
