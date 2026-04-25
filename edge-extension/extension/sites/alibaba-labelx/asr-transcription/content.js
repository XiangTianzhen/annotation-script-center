(function () {
  const LOG_PREFIX = "[ASR Edge][content]";
  const runtimeContract =
    globalThis.__ASREdgeAlibabaLabelxRuntimeContract ||
    window.__ASREdgeAlibabaLabelxRuntimeContract ||
    null;
  let runtimeHandles = null;
  let runtimeStartPromise = null;
  let pendingDomReadyRefresh = false;
  let settingsPanelHandle = null;
  let settingsMessageBridgeBound = false;
  let settingsSavedBridgeBound = false;
  let legacyBridgeReadyBound = false;
  let transcriptionRuntimeAllowed = false;

  if (!runtimeContract) {
    console.warn(LOG_PREFIX, "Runtime contract is not loaded.");
    return;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isTopLevelContext() {
    return window.top === window.self;
  }

  function getLegacyBridge() {
    return window.__ASREdgeAlibabaLabelxLegacyBridge || null;
  }

  function getPlatformSettings(settings) {
    return settings?.platforms?.alibabaLabelx || {};
  }

  function isPlatformEnabled(settings) {
    return getPlatformSettings(settings).enabled !== false;
  }

  function shouldInterceptPlatformAutosave(settings) {
    const safety = getPlatformSettings(settings).safety || {};
    return isPlatformEnabled(settings) && safety.interceptPlatformAutosave !== false;
  }

  function createPageBridgeHandle(contract) {
    const bridgeConfig =
      contract && contract.PAGE_WORLD_BRIDGE ? contract.PAGE_WORLD_BRIDGE : null;
    if (!bridgeConfig) {
      return null;
    }

    let lastReadyDetail = null;
    let lastResponseDetail = null;
    let nextRequestNumber = 1;

    function cloneDetail(detail) {
      if (!detail || typeof detail !== "object") {
        return null;
      }

      return JSON.parse(JSON.stringify(detail));
    }

    function getAttributeStatus() {
      if (!document.documentElement) {
        return null;
      }

      return document.documentElement.getAttribute(bridgeConfig.statusAttribute);
    }

    function request(type, payload) {
      const requestId = "content-" + String(nextRequestNumber++);
      window.dispatchEvent(
        new CustomEvent(bridgeConfig.requestEvent, {
          detail: {
            channel: bridgeConfig.channel,
            requestId: requestId,
            type: type,
            payload: payload || null,
          },
        })
      );

      return requestId;
    }

    window.addEventListener(bridgeConfig.readyEvent, function (event) {
      const detail = event && event.detail && typeof event.detail === "object" ? event.detail : null;
      if (!detail || detail.channel !== bridgeConfig.channel) {
        return;
      }

      lastReadyDetail = cloneDetail(detail);
      console.info(LOG_PREFIX, "Page-world bridge is ready.", detail.bridge || detail);

      if (runtimeHandles) {
        refreshRuntime("page-bridge-ready");
      }
    });

    window.addEventListener(bridgeConfig.responseEvent, function (event) {
      const detail = event && event.detail && typeof event.detail === "object" ? event.detail : null;
      if (!detail || detail.channel !== bridgeConfig.channel) {
        return;
      }

      lastResponseDetail = cloneDetail(detail);
    });

    return {
      config: bridgeConfig,
      request: request,
      ping: function () {
        return request("ping");
      },
      getState: function () {
        return request("get-state");
      },
      getStatus: function () {
        const status = getAttributeStatus() || (lastReadyDetail ? "ready" : "missing");
        return {
          channel: bridgeConfig.channel,
          version: bridgeConfig.version,
          status: status,
          ready: status === "ready",
          lastReadyDetail: lastReadyDetail,
          lastResponseDetail: lastResponseDetail,
        };
      },
    };
  }

  const pageBridgeHandle = createPageBridgeHandle(runtimeContract);

  function resolveRuntimeModules() {
    return runtimeContract.RUNTIME_MODULES.reduce(function (modules, moduleDescriptor) {
      modules[moduleDescriptor.id] =
        globalThis[moduleDescriptor.globalKey] ||
        window[moduleDescriptor.globalKey] ||
        null;
      return modules;
    }, {});
  }

  function listMissingModules(modules) {
    return runtimeContract.RUNTIME_MODULES.filter(function (moduleDescriptor) {
      return moduleDescriptor.required !== false && !modules[moduleDescriptor.id];
    }).map(function (moduleDescriptor) {
      return moduleDescriptor.id;
    });
  }

  function createStateCollector(pageStateCollector) {
    return pageStateCollector.createPageStateCollector(function (pageState, trigger) {
      console.debug(
        LOG_PREFIX,
        "Page state collector callback received:",
        pageState.pageType,
        "(triggered by",
        trigger + ")"
      );
    });
  }

  function createRouteObserver(routeObserver, stateCollector) {
    return routeObserver.createRouteObserver(function (routeInfo, trigger) {
      console.debug(
        LOG_PREFIX,
        "Route callback received:",
        routeInfo.routeKey,
        "(triggered by",
        trigger + ")"
      );

      stateCollector.collect(trigger);
    });
  }

  function getActiveProjectId(settings) {
    const constants = globalThis.ASREdgeConstants || {};
    return (
      settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId ||
      constants.TRANSCRIPTION_PROJECT_ID ||
      "transcription"
    );
  }

  function isTranscriptionProjectActive(settings) {
    const constants = globalThis.ASREdgeConstants || {};
    return getActiveProjectId(settings) === (constants.TRANSCRIPTION_PROJECT_ID || "transcription");
  }

  function mountSettingsPanel(modules) {
    if (
      settingsPanelHandle ||
      !modules.settingsPanel ||
      typeof modules.settingsPanel.mount !== "function"
    ) {
      return settingsPanelHandle;
    }

    settingsPanelHandle = modules.settingsPanel.mount({
      mode: "overlay",
    });

    return settingsPanelHandle;
  }

  function getSettingsPanelMessageTypes() {
    const constants = globalThis.ASREdgeConstants || {};
    return constants.MESSAGE_TYPES || {};
  }

  function createSettingsPanelPayload() {
    return settingsPanelHandle && typeof settingsPanelHandle.getState === "function"
      ? {
          ok: true,
          available: true,
          state: settingsPanelHandle.getState(),
        }
      : {
          ok: false,
          available: false,
        };
  }

  function bindSettingsPanelMessageBridge() {
    if (settingsMessageBridgeBound || !chrome.runtime || !chrome.runtime.onMessage) {
      return;
    }

    const messageTypes = getSettingsPanelMessageTypes();

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || typeof message !== "object") {
        return undefined;
      }

      if (
        (message.type === messageTypes.PANEL_PING ||
          message.type === messageTypes.OPEN_SETTINGS_PANEL ||
          message.type === messageTypes.TOGGLE_SETTINGS_PANEL) &&
        !transcriptionRuntimeAllowed
      ) {
        return undefined;
      }

      if (message.type === messageTypes.PANEL_PING) {
        sendResponse(createSettingsPanelPayload());
        return false;
      }

      if (
        message.type !== messageTypes.OPEN_SETTINGS_PANEL &&
        message.type !== messageTypes.TOGGLE_SETTINGS_PANEL
      ) {
        return undefined;
      }

      if (!settingsPanelHandle) {
        sendResponse({
          ok: false,
          available: false,
          reason: "settings-panel-missing",
        });
        return false;
      }

      const action =
        message.type === messageTypes.OPEN_SETTINGS_PANEL ? settingsPanelHandle.show : settingsPanelHandle.toggle;

      Promise.resolve(action.call(settingsPanelHandle))
        .then(function () {
          sendResponse(createSettingsPanelPayload());
        })
        .catch(function (error) {
          sendResponse({
            ok: false,
            available: true,
            message: error && error.message ? error.message : String(error),
          });
        });

      return true;
    });

    settingsMessageBridgeBound = true;
  }

  function getLegacyActionRunner(modules, controlPanel, actionKey) {
    if (controlPanel && typeof controlPanel.runAction === "function") {
      return function () {
        return controlPanel.runAction(actionKey);
      };
    }

    if (actionKey === "checkUpdate") {
      return modules.legacyVersionCheck && typeof modules.legacyVersionCheck.checkNow === "function"
        ? function () {
            return modules.legacyVersionCheck.checkNow();
          }
        : null;
    }

    if (actionKey === "aiPunctuation") {
      return modules.legacyAiPunctuation && typeof modules.legacyAiPunctuation.run === "function"
        ? function () {
            return modules.legacyAiPunctuation.run({
              saveAfter: true,
              reloadAfter: true,
            });
          }
        : null;
    }

    if (actionKey === "syncDictionary") {
      return modules.legacyDictionarySync && typeof modules.legacyDictionarySync.syncFromServer === "function"
        ? function () {
            return modules.legacyDictionarySync.syncFromServer();
          }
        : null;
    }

    if (actionKey === "uploadDictionary") {
      return modules.legacyDictionarySync && typeof modules.legacyDictionarySync.uploadPendingReview === "function"
        ? function () {
            return modules.legacyDictionarySync.uploadPendingReview();
          }
        : null;
    }

    if (actionKey === "exportTasks") {
      return modules.legacyExport && typeof modules.legacyExport.exportTasks === "function"
        ? function () {
            return modules.legacyExport.exportTasks({
              uploadToServer: true,
            });
          }
        : null;
    }

    if (actionKey === "leaderboard") {
      return modules.legacyLeaderboard && typeof modules.legacyLeaderboard.toggle === "function"
        ? function () {
            return modules.legacyLeaderboard.toggle();
          }
        : null;
    }

    if (actionKey === "manualAssign") {
      return modules.legacyAutoAssign && typeof modules.legacyAutoAssign.execute === "function"
        ? function () {
            return modules.legacyAutoAssign.execute({
              manual: true,
            });
          }
        : null;
    }

    return null;
  }

  function mapLegacyReason(actionKey, reason) {
    if (!reason) {
      return null;
    }

    if (actionKey === "manualAssign") {
      if (reason === "not-check-task-list") {
        return "当前页面不是审核任务列表，无法执行自动抢单。";
      }
      if (reason === "target-users-missing") {
        return "自动抢单目标人员为空，请先在设置中填写目标人员。";
      }
      if (reason === "task-keywords-missing") {
        return "自动抢单关键词为空，请先配置关键词或开启全部任务。";
      }
      if (reason === "auto-assign-already-running") {
        return "自动抢单正在执行中，请稍后重试。";
      }
    }

    if (actionKey === "checkUpdate" && reason === "version-check-missing") {
      return "更新检查模块未接入。";
    }

    if (actionKey === "leaderboard" && reason === "leaderboard-missing") {
      return "排行榜模块未接入。";
    }

    return "reason=" + reason;
  }

  function buildLegacyActionStatus(actionKey, result) {
    if (typeof result?.summaryText === "string" && result.summaryText) {
      return result.summaryText;
    }

    if (actionKey === "syncDictionary") {
      return "已同步 " + (Number.isFinite(result?.count) ? result.count : 0) + " 条云端词库规则。";
    }

    if (actionKey === "uploadDictionary") {
      if (result?.success === false && result?.message) {
        return result.message;
      }
      return "已上传 " + (Number.isFinite(result?.count) ? result.count : 0) + " 条词库待审记录。";
    }

    if (actionKey === "exportTasks") {
      const exportedCount = Number.isFinite(result?.count) ? result.count : 0;
      if (result?.uploadResult && result.uploadResult.success === false) {
        return "已导出 " + exportedCount + " 条任务，但统计上传失败。";
      }
      const uploaded = result?.uploadResult?.success === true ? " 并上传统计。" : "。";
      return "已导出 " + exportedCount + " 条任务" + uploaded;
    }

    if (actionKey === "leaderboard") {
      if (result?.success === false) {
        return result?.error || "排行榜加载失败。";
      }
      if (result?.hidden) {
        return "排行榜面板已关闭。";
      }
      return "排行榜已加载 " + (Number.isFinite(result?.count) ? result.count : 0) + " 条记录。";
    }

    if (actionKey === "manualAssign") {
      return mapLegacyReason(actionKey, result?.reason) || "自动抢单已执行。";
    }

    if (actionKey === "checkUpdate") {
      return "更新检查已完成。";
    }

    if (actionKey === "aiPunctuation") {
      return "AI 标点修复已执行。";
    }

    return result?.message || mapLegacyReason(actionKey, result?.reason) || "动作已执行。";
  }

  function buildLegacyActionResponse(actionKey, result) {
    const isError =
      result?.success === false ||
      (actionKey === "exportTasks" && result?.uploadResult && result.uploadResult.success === false);

    return {
      statusText: buildLegacyActionStatus(actionKey, result),
      tone: isError ? "error" : "success",
      reloadSettings: actionKey === "syncDictionary" || actionKey === "uploadDictionary",
    };
  }

  function registerSettingsPanelActions(modules, settingsPanel, controlPanel) {
    if (!settingsPanel || typeof settingsPanel.registerActionHandler !== "function") {
      return;
    }

    [
      "checkUpdate",
      "aiPunctuation",
      "syncDictionary",
      "uploadDictionary",
      "exportTasks",
      "leaderboard",
      "manualAssign",
    ].forEach(function (actionKey) {
      const runner = getLegacyActionRunner(modules, controlPanel, actionKey);
      if (!runner) {
        settingsPanel.registerActionHandler(actionKey, null);
        return;
      }

      settingsPanel.registerActionHandler(actionKey, async function () {
        const result = await runner();
        return buildLegacyActionResponse(actionKey, result);
      });
    });
  }

  async function syncLegacyRuntimeSettings(modules, settingsOverride, trigger) {
    if (!modules || !modules.runtimeGate || typeof modules.runtimeGate.getSettings !== "function") {
      return null;
    }

    const settings = isPlainObject(settingsOverride)
      ? settingsOverride
      : await modules.runtimeGate.getSettings();
    const platformEnabled = isPlatformEnabled(settings);
    const autosaveInterceptionEnabled = shouldInterceptPlatformAutosave(settings);
    const legacyBridge = getLegacyBridge();

    if (legacyBridge && typeof legacyBridge.setAutosaveInterceptionEnabled === "function") {
      legacyBridge.setAutosaveInterceptionEnabled(autosaveInterceptionEnabled);
    }

    if (!platformEnabled) {
      if (modules.legacyAutoAssign && typeof modules.legacyAutoAssign.stopPolling === "function") {
        modules.legacyAutoAssign.stopPolling();
      }
      if (modules.legacyBatchFlow && typeof modules.legacyBatchFlow.stop === "function") {
        modules.legacyBatchFlow.stop();
      }

      console.info(LOG_PREFIX, "Legacy runtime sync skipped because platform is disabled.", {
        trigger: trigger || "manual",
      });
      return {
        enabled: false,
        autosaveInterceptionEnabled: autosaveInterceptionEnabled,
      };
    }

    if (modules.legacyAutoAssign && typeof modules.legacyAutoAssign.startPolling === "function") {
      try {
        const pollingResult = await modules.legacyAutoAssign.startPolling();
        console.info(LOG_PREFIX, "Legacy auto-assign polling sync result:", pollingResult);
      } catch (error) {
        console.warn(LOG_PREFIX, "Failed to sync legacy auto-assign polling:", error);
      }
    }

    if (modules.legacyBatchFlow && typeof modules.legacyBatchFlow.start === "function") {
      try {
        await modules.legacyBatchFlow.start();
      } catch (error) {
        console.warn(LOG_PREFIX, "Failed to sync legacy batch flow:", error);
      }
    }

    console.info(LOG_PREFIX, "Legacy runtime settings synced.", {
      trigger: trigger || "manual",
      autosaveInterceptionEnabled: autosaveInterceptionEnabled,
    });

    return {
      enabled: true,
      autosaveInterceptionEnabled: autosaveInterceptionEnabled,
    };
  }

  function bindLegacyBridgeReadyBridge() {
    if (legacyBridgeReadyBound) {
      return;
    }

    const legacyBridge = getLegacyBridge();
    if (!legacyBridge || typeof legacyBridge.subscribe !== "function") {
      return;
    }

    legacyBridge.subscribe(function (detail) {
      if (detail?.type === "bridge-ready") {
        void syncLegacyRuntimeSettings(resolveRuntimeModules(), null, "legacy-bridge-ready");
        return;
      }

      if (
        runtimeHandles &&
        (detail?.type === "data-loaded" || detail?.type === "current-page-tasks-ready")
      ) {
        refreshRuntime("legacy-" + detail.type);
      }
    });

    legacyBridgeReadyBound = true;
  }

  function bindSettingsSavedBridge() {
    if (settingsSavedBridgeBound) {
      return;
    }

    window.addEventListener("ASR_EDGE_SETTINGS_SAVED", function (event) {
      const detailSettings = isPlainObject(event?.detail?.settings) ? event.detail.settings : null;
      const modules = resolveRuntimeModules();

      if (
        modules.annotationRuntimeConfig &&
        typeof modules.annotationRuntimeConfig.refresh === "function"
      ) {
        void modules.annotationRuntimeConfig.refresh("settings-saved").catch(function (error) {
          console.warn(LOG_PREFIX, "Failed to refresh annotation runtime config:", error);
        });
      }

      registerSettingsPanelActions(
        modules,
        settingsPanelHandle,
        runtimeHandles ? runtimeHandles.controlPanel : null
      );
      void syncLegacyRuntimeSettings(modules, detailSettings, "settings-saved");

      if (runtimeHandles) {
        refreshRuntime("settings-saved");
      } else if (settingsPanelHandle && typeof settingsPanelHandle.refresh === "function") {
        void settingsPanelHandle.refresh();
      }
    });

    settingsSavedBridgeBound = true;
  }

  function exposeRuntime(modules, observer, stateCollector, controlPanel, settingsPanel) {
    modules.runtimeDebug.injectDebugBadge();
    modules.runtimeDebug.exposeRuntime({
      contract: runtimeContract,
      pageBridge: pageBridgeHandle,
      legacyBridge: getLegacyBridge(),
      observer: observer,
      stateCollector: stateCollector,
      annotationRuntimeConfig: modules.annotationRuntimeConfig,
      annotationActiveItem: modules.annotationActiveItem,
      annotationDurationController: modules.annotationDurationController,
      annotationAudioController: modules.annotationAudioController,
      annotationInteractionRunner: modules.annotationInteractionRunner,
      annotationToolbar: modules.annotationToolbar,
      annotationShortcutBus: modules.annotationShortcutBus,
      legacyApiClient: modules.legacyApiClient,
      legacyUserContext: modules.legacyUserContext,
      legacyDictionarySync: modules.legacyDictionarySync,
      legacySaveCoordinator: modules.legacySaveCoordinator,
      legacyAiPunctuation: modules.legacyAiPunctuation,
      legacyExport: modules.legacyExport,
      legacyLeaderboard: modules.legacyLeaderboard,
      legacyVersionCheck: modules.legacyVersionCheck,
      legacyAutoAssign: modules.legacyAutoAssign,
      legacyBatchFlow: modules.legacyBatchFlow,
      annotationItemCollector: modules.annotationItemCollector,
      annotationItemValidator: modules.annotationItemValidator,
      annotationFeedback: modules.annotationFeedback,
      annotationItemWriter: modules.annotationItemWriter,
      annotationValidityWriter: modules.annotationValidityWriter,
      annotationQuickfillRunner: modules.annotationQuickfillRunner,
      annotationApplyRunner: modules.annotationApplyRunner,
      annotationApplyPolicy: modules.annotationApplyPolicy,
      annotationPolicyExecutor: modules.annotationPolicyExecutor,
      annotationPagePlanPreview: modules.annotationPagePlanPreview,
      annotationPageReport: modules.annotationPageReport,
      annotationPageApplyRunner: modules.annotationPageApplyRunner,
      annotationSaveRunner: modules.annotationSaveRunner,
      annotationSubmitRunner: modules.annotationSubmitRunner,
      annotationPageFlowRunner: modules.annotationPageFlowRunner,
      annotationFlowReport: modules.annotationFlowReport,
      annotationControlPanel: controlPanel,
      settingsPanel: settingsPanel,
    });
  }

  async function startRuntime(modules, settingsPanel, initialSettings) {
    const constants = globalThis.ASREdgeConstants || {};
    const activeProjectId = getActiveProjectId(initialSettings);
    const fullRuntimeEnabled = activeProjectId !== (constants.JUDGEMENT_PROJECT_ID || "judgement");

    if (modules.annotationRuntimeConfig && typeof modules.annotationRuntimeConfig.start === "function") {
      await modules.annotationRuntimeConfig.start();
    }

    const stateCollector = createStateCollector(modules.pageStateCollector);
    const observer = createRouteObserver(modules.routeObserver, stateCollector);
    let controlPanel = null;

    if (pageBridgeHandle && typeof pageBridgeHandle.getState === "function") {
      pageBridgeHandle.getState();
    }

    observer.triggerInitial();
    stateCollector.collectInitial();

    if (modules.annotationActiveItem && typeof modules.annotationActiveItem.start === "function") {
      modules.annotationActiveItem.start();
    }

    if (
      modules.annotationDurationController &&
      typeof modules.annotationDurationController.start === "function"
    ) {
      modules.annotationDurationController.start();
    }

    if (modules.annotationAudioController && typeof modules.annotationAudioController.start === "function") {
      modules.annotationAudioController.start();
    }

    if (
      fullRuntimeEnabled &&
      modules.annotationInteractionRunner &&
      typeof modules.annotationInteractionRunner.start === "function"
    ) {
      modules.annotationInteractionRunner.start();
    }

    if (
      fullRuntimeEnabled &&
      modules.annotationControlPanel &&
      typeof modules.annotationControlPanel.mount === "function"
    ) {
      controlPanel = modules.annotationControlPanel.mount({
        stateCollector: stateCollector,
        pageStateCollector: modules.pageStateCollector,
        annotationRuntimeConfig: modules.annotationRuntimeConfig,
        annotationAudioController: modules.annotationAudioController,
        annotationDurationController: modules.annotationDurationController,
        annotationInteractionRunner: modules.annotationInteractionRunner,
        annotationPagePlanPreview: modules.annotationPagePlanPreview,
        annotationPageApplyRunner: modules.annotationPageApplyRunner,
        annotationPageReport: modules.annotationPageReport,
        annotationSaveRunner: modules.annotationSaveRunner,
        annotationSubmitRunner: modules.annotationSubmitRunner,
        annotationPageFlowRunner: modules.annotationPageFlowRunner,
        annotationFlowReport: modules.annotationFlowReport,
        legacyApiClient: modules.legacyApiClient,
        legacyUserContext: modules.legacyUserContext,
        legacyDictionarySync: modules.legacyDictionarySync,
        legacySaveCoordinator: modules.legacySaveCoordinator,
        legacyAiPunctuation: modules.legacyAiPunctuation,
        legacyExport: modules.legacyExport,
        legacyLeaderboard: modules.legacyLeaderboard,
        legacyVersionCheck: modules.legacyVersionCheck,
        legacyAutoAssign: modules.legacyAutoAssign,
        legacyBatchFlow: modules.legacyBatchFlow,
      });
    }

    window.__ASREdgeAlibabaLabelxAnnotationControlPanelApi = controlPanel;
    registerSettingsPanelActions(modules, settingsPanel, controlPanel);

    if (
      fullRuntimeEnabled &&
      modules.annotationToolbar &&
      typeof modules.annotationToolbar.start === "function"
    ) {
      modules.annotationToolbar.start();
    }

    if (
      fullRuntimeEnabled &&
      modules.annotationShortcutBus &&
      typeof modules.annotationShortcutBus.start === "function"
    ) {
      modules.annotationShortcutBus.start();
    }

    exposeRuntime(modules, observer, stateCollector, controlPanel, settingsPanel);
    await syncLegacyRuntimeSettings(modules, initialSettings || null, "runtime-start");

    return {
      observer: observer,
      stateCollector: stateCollector,
      controlPanel: controlPanel,
      toolbar: fullRuntimeEnabled ? modules.annotationToolbar || null : null,
      activeProjectId: activeProjectId,
    };
  }

  function refreshRuntime(trigger) {
    if (!runtimeHandles) {
      return;
    }

    if (
      runtimeHandles.stateCollector &&
      typeof runtimeHandles.stateCollector.collectForced === "function"
    ) {
      runtimeHandles.stateCollector.collectForced(trigger || "manual-refresh");
    }

    if (runtimeHandles.controlPanel && typeof runtimeHandles.controlPanel.refresh === "function") {
      runtimeHandles.controlPanel.refresh();
    }

    if (runtimeHandles.toolbar && typeof runtimeHandles.toolbar.refresh === "function") {
      runtimeHandles.toolbar.refresh();
    }

    if (settingsPanelHandle && typeof settingsPanelHandle.refresh === "function") {
      void settingsPanelHandle.refresh();
    }
  }

  function assemble(trigger) {
    if (!isTopLevelContext()) {
      console.info(LOG_PREFIX, "Iframe context, skipping initialization.");
      return;
    }

    const modules = resolveRuntimeModules();
    const missingModules = listMissingModules(modules);

    if (missingModules.length > 0) {
      console.warn(LOG_PREFIX, "Required modules not loaded:", missingModules.join(", "));
      return;
    }

    const initialPage = modules.pageDetector.detectPage();
    if (!initialPage.isTargetSite) {
      console.info(LOG_PREFIX, "Non-target site:", location.hostname);
      return;
    }

    if (pageBridgeHandle) {
      const bridgeStatus = pageBridgeHandle.getStatus();
      if (!bridgeStatus.ready) {
        console.warn(LOG_PREFIX, "Page-world bridge not ready yet.", bridgeStatus);
        pageBridgeHandle.ping();
      }
    }

    settingsPanelHandle = mountSettingsPanel(modules);
    bindSettingsPanelMessageBridge();
    bindSettingsSavedBridge();
    bindLegacyBridgeReadyBridge();
    registerSettingsPanelActions(
      modules,
      settingsPanelHandle,
      runtimeHandles ? runtimeHandles.controlPanel : null
    );

    if (runtimeHandles) {
      if (trigger === "dom-content-loaded") {
        refreshRuntime(trigger);
      }
      return;
    }

    if (runtimeStartPromise) {
      if (trigger === "dom-content-loaded") {
        pendingDomReadyRefresh = true;
      }
      return;
    }

    runtimeStartPromise = modules.runtimeGate.guardPlatformEnabled().then(async function (gateResult) {
      if (!gateResult.enabled || !isTranscriptionProjectActive(gateResult.settings)) {
        transcriptionRuntimeAllowed = false;
        if (settingsPanelHandle && typeof settingsPanelHandle.destroy === "function") {
          settingsPanelHandle.destroy();
          settingsPanelHandle = null;
        }

        if (!gateResult.enabled) {
          await syncLegacyRuntimeSettings(modules, gateResult.settings, "platform-disabled");
        } else {
          console.info(LOG_PREFIX, "Transcription runtime skipped because active project is", getActiveProjectId(gateResult.settings));
        }

        if (settingsPanelHandle && typeof settingsPanelHandle.refresh === "function") {
          void settingsPanelHandle.refresh();
        }
        return null;
      }

      transcriptionRuntimeAllowed = true;
      runtimeHandles = await startRuntime(modules, settingsPanelHandle, gateResult.settings);

      if (pendingDomReadyRefresh) {
        refreshRuntime("dom-content-loaded");
        pendingDomReadyRefresh = false;
      }

      return runtimeHandles;
    }).finally(function () {
      runtimeStartPromise = null;
    });
  }

  void assemble("script-load");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function onDomContentLoaded() {
      pendingDomReadyRefresh = true;
      void assemble("dom-content-loaded");
    }, { once: true });
  }
})();
