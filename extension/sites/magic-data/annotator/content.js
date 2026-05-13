(function () {
  const CHECK_INTERVAL_MS = 1000;
  const MOUNT_RETRY_MS = 220;
  const MOUNT_RETRY_LIMIT = 30;
  const DEFAULT_SETTINGS = {
    enabled: true,
    aiReviewEnabled: true,
    listenModel: "qwen3.5-omni-flash",
    reviewModel: "qwen3.5-plus",
    reviewMode: "rule_first",
    showHeardText: true,
    showEstimatedIncome: true,
    enableThinking: false,
    aiReviewListenPrompt: "",
    aiReviewComparePrompt: "",
    aiReviewTemperature: "",
    aiReviewTopP: "",
    aiReviewMaxTokens: "",
    aiReviewMaxCompletionTokens: "",
    aiReviewPresencePenalty: "",
    aiReviewFrequencyPenalty: "",
    aiReviewSeed: "",
    aiReviewStopSequences: "",
    shortcuts: {},
  };

  let runtime = null;
  let observer = null;
  let pageTimer = null;
  let evaluating = false;
  let pendingEvaluate = false;
  let contextInvalidated = false;
  let mountRetryCount = 0;
  let startLogged = false;
  let lastRouteLog = "";
  let runtimeSettings = Object.assign({}, DEFAULT_SETTINGS);

  function safeInfo(text) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info(text);
    }
  }

  function safeWarn(text) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(text);
    }
  }

  function isContextInvalidatedError(error) {
    try {
      const storage = globalThis.ASREdgeStorage || {};
      if (typeof storage.isExtensionContextInvalidatedError === "function") {
        return storage.isExtensionContextInvalidatedError(error);
      }
    } catch (ignoreError) {
      // ignore
    }
    const message = String(error?.message || "");
    return message.indexOf("Extension context invalidated") >= 0;
  }

  function isContextAvailable() {
    try {
      const storage = globalThis.ASREdgeStorage || {};
      if (typeof storage.isChromeExtensionContextAvailable === "function") {
        return storage.isChromeExtensionContextAvailable();
      }
      return Boolean(globalThis.chrome?.runtime?.id);
    } catch (error) {
      return false;
    }
  }

  function normalizeModelName(value, fallback) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return fallback;
    }
    return text.slice(0, 80);
  }

  function normalizeReviewMode(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "strict" || text === "strict_review") {
      return "strict_review";
    }
    if (text === "listen_first" || text === "listen_assisted") {
      return "listen_assisted";
    }
    return "rule_first";
  }

  function normalizePromptText(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
  }

  function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const shortcuts = source.shortcuts && typeof source.shortcuts === "object" ? source.shortcuts : {};
    return {
      enabled: source.enabled !== false,
      aiReviewEnabled: source.aiReviewEnabled !== false,
      listenModel: normalizeModelName(source.listenModel, DEFAULT_SETTINGS.listenModel),
      reviewModel: normalizeModelName(source.reviewModel, DEFAULT_SETTINGS.reviewModel),
      reviewMode: normalizeReviewMode(source.reviewMode),
      showHeardText: source.showHeardText !== false,
      showEstimatedIncome: source.showEstimatedIncome !== false,
      enableThinking: source.enableThinking === true,
      aiReviewListenPrompt: normalizePromptText(source.aiReviewListenPrompt || ""),
      aiReviewComparePrompt: normalizePromptText(source.aiReviewComparePrompt || ""),
      aiReviewTemperature: String(source.aiReviewTemperature || "").trim(),
      aiReviewTopP: String(source.aiReviewTopP || "").trim(),
      aiReviewMaxTokens: String(source.aiReviewMaxTokens || "").trim(),
      aiReviewMaxCompletionTokens: String(source.aiReviewMaxCompletionTokens || "").trim(),
      aiReviewPresencePenalty: String(source.aiReviewPresencePenalty || "").trim(),
      aiReviewFrequencyPenalty: String(source.aiReviewFrequencyPenalty || "").trim(),
      aiReviewSeed: String(source.aiReviewSeed || "").trim(),
      aiReviewStopSequences: String(source.aiReviewStopSequences || "").trim().slice(0, 960),
      shortcuts: shortcuts,
    };
  }

  async function loadMagicDataSettings() {
    const storage = globalThis.ASREdgeStorage || {};
    if (typeof storage.getSettings !== "function") {
      runtimeSettings = Object.assign({}, DEFAULT_SETTINGS);
      return runtimeSettings;
    }
    try {
      const settings = await storage.getSettings();
      const projectSettings =
        settings?.scriptCenter?.projects?.magicDataAnnotator ||
        settings?.projects?.magicDataAnnotator ||
        {};
      runtimeSettings = normalizeSettings(projectSettings);
      return runtimeSettings;
    } catch (error) {
      runtimeSettings = Object.assign({}, DEFAULT_SETTINGS);
      return runtimeSettings;
    }
  }

  function createRuntime() {
    const detector = globalThis.__ASREdgeMagicDataAnnotatorPageDetector;
    const collector = globalThis.__ASREdgeMagicDataAnnotatorDataCollector;
    const aiClient = globalThis.__ASREdgeMagicDataAnnotatorAiReviewClient;
    const panelFactory = globalThis.__ASREdgeMagicDataAnnotatorInlinePanel;
    const shortcutsFactory = globalThis.__ASREdgeMagicDataAnnotatorShortcuts;
    if (!detector || !collector || !aiClient || !panelFactory) {
      return null;
    }

    const panel = panelFactory.createRuntime({
      collectCurrentItem: collector.collectCurrentItem,
      fillDialectLine: collector.fillDialectLine,
      fillMandarinLine: collector.fillMandarinLine,
      getClientVersion: aiClient.getClientVersion,
      refreshCurrentItem: collector.refreshCurrentItem,
      reviewCurrent: aiClient.reviewCurrent,
    });

    const shortcutsRuntime = shortcutsFactory?.createRuntime
      ? shortcutsFactory.createRuntime({
          actions: {},
        })
      : null;

    let lastTaskKey = "";

    function runActionResult(result) {
      if (result && typeof result.then === "function") {
        return result
          .then(function (finalResult) {
            if (finalResult?.message) {
              panel.setMessage(finalResult.message);
            }
          })
          .catch(function (error) {
            panel.setMessage(error?.message || "快捷键执行失败。");
          });
      }
      if (result?.message) {
        panel.setMessage(result.message);
      }
      return Promise.resolve();
    }

    function wireShortcutsActions() {
      if (!shortcutsRuntime) {
        return;
      }
      shortcutsRuntime.setActions({
        age0To5: function () {
          return runActionResult(collector.selectSpeakerValue("0-5"));
        },
        age6To12: function () {
          return runActionResult(collector.selectSpeakerValue("6-12"));
        },
        age13To18: function () {
          return runActionResult(collector.selectSpeakerValue("13-18"));
        },
        age19To25: function () {
          return runActionResult(collector.selectSpeakerValue("19-25"));
        },
        age26To36: function () {
          return runActionResult(collector.selectSpeakerValue("26-36"));
        },
        age37To50: function () {
          return runActionResult(collector.selectSpeakerValue("37-50"));
        },
        age51To65: function () {
          return runActionResult(collector.selectSpeakerValue("51-65"));
        },
        age65Plus: function () {
          return runActionResult(collector.selectSpeakerValue("65以上"));
        },
        copySummary: function () {
          return runActionResult(panel.triggerCopySummary());
        },
        fillDialectLine: function () {
          return runActionResult(panel.triggerFillDialect());
        },
        fillMandarinLine: function () {
          return runActionResult(panel.triggerFillMandarin());
        },
        genderFemale: function () {
          return runActionResult(collector.selectSpeakerValue("女"));
        },
        genderMale: function () {
          return runActionResult(collector.selectSpeakerValue("男"));
        },
        onMissingAction: function (actionKey) {
          panel.setMessage("未实现的快捷键动作：" + actionKey);
        },
        reviewCurrent: function () {
          if (runtimeSettings.aiReviewEnabled === false) {
            panel.setMessage("Magic Data AI 质检已在 options 中关闭。");
            return Promise.resolve();
          }
          return runActionResult(panel.triggerReview());
        },
        save: function () {
          return runActionResult(collector.clickOperationButton("保存"));
        },
        submit: function () {
          return runActionResult(collector.clickOperationButton("提交"));
        },
      });
    }

    function refresh() {
      if (!detector.isMagicDataHost()) {
        panel.remove();
        return;
      }
      const pageType = detector.getPageType();
      if (pageType !== lastRouteLog) {
        lastRouteLog = pageType;
        safeInfo("[MagicData][AI Review] route detected: " + pageType);
      }

      if (pageType === "asrmark") {
        const mounted = panel.ensureMounted();
        if (!mounted) {
          return;
        }
        let snapshot = null;
        try {
          snapshot = collector.collectCurrentItem();
        } catch (error) {
          panel.setMessage("页面采集异常，请点击刷新采集后重试。");
        }
        snapshot = snapshot || {};
        snapshot.pageType = pageType;
        const nextTaskKey = String(snapshot.taskItemId || snapshot.samplingRecordId || "");
        if (nextTaskKey && lastTaskKey && nextTaskKey !== lastTaskKey) {
          panel.clearResult();
          panel.setMessage("当前条已变化，请重新点击 AI 质检当前条。");
        }
        lastTaskKey = nextTaskKey;
        panel.setRuntimeSettings(runtimeSettings);
        panel.refreshPageSnapshot(snapshot, null, runtimeSettings);
        if (
          snapshot.taskItemId &&
          typeof collector.getCachedDetail === "function" &&
          typeof collector.refreshCurrentItem === "function" &&
          !collector.getCachedDetail(snapshot.taskItemId)
        ) {
          collector
            .refreshCurrentItem({ taskItemId: snapshot.taskItemId })
            .then(function (latestSnapshot) {
              const nextSnapshot = latestSnapshot && typeof latestSnapshot === "object" ? latestSnapshot : snapshot;
              nextSnapshot.pageType = "asrmark";
              panel.refreshPageSnapshot(nextSnapshot, null, runtimeSettings);
            })
            .catch(function () {
              // Keep DOM snapshot when API warmup fails.
            });
        }
        return;
      }
      if (pageType === "asrmarkCheck") {
        lastTaskKey = "";
        panel.setRuntimeSettings(runtimeSettings);
        panel.showAsrmarkCheckNotice();
        return;
      }
      lastTaskKey = "";
      panel.remove();
    }

    function ensurePanelMountedWithRetry() {
      if (!detector.isMagicDataHost()) {
        return;
      }
      if (detector.getPageType() !== "asrmark") {
        return;
      }
      const mounted = panel.ensureMounted();
      if (mounted) {
        mountRetryCount = 0;
        refresh();
        return;
      }
      if (mountRetryCount >= MOUNT_RETRY_LIMIT) {
        safeWarn("[MagicData][AI Review] panel mount retry exhausted");
        return;
      }
      mountRetryCount += 1;
      window.setTimeout(function () {
        ensurePanelMountedWithRetry();
      }, MOUNT_RETRY_MS);
    }

    async function start() {
      await loadMagicDataSettings();
      panel.setRuntimeSettings(runtimeSettings);
      wireShortcutsActions();
      if (shortcutsRuntime) {
        await shortcutsRuntime.start();
      }
      refresh();
      ensurePanelMountedWithRetry();
      observer = new MutationObserver(function () {
        window.clearTimeout(pageTimer);
        pageTimer = window.setTimeout(function () {
          refresh();
        }, 180);
      });
      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
    }

    function stop() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (pageTimer) {
        window.clearTimeout(pageTimer);
        pageTimer = null;
      }
      if (shortcutsRuntime) {
        shortcutsRuntime.stop();
      }
      panel.remove();
    }

    return {
      refresh: refresh,
      start: start,
      stop: stop,
    };
  }

  function stopRuntime() {
    if (runtime) {
      runtime.stop();
      runtime = null;
    }
  }

  async function evaluatePage() {
    if (contextInvalidated) {
      return;
    }
    if (evaluating) {
      pendingEvaluate = true;
      return;
    }
    evaluating = true;
    try {
      if (!isContextAvailable()) {
        contextInvalidated = true;
        stopRuntime();
        return;
      }
      const detector = globalThis.__ASREdgeMagicDataAnnotatorPageDetector;
      if (!detector?.isMagicDataHost?.()) {
        stopRuntime();
        return;
      }
      if (!runtime) {
        runtime = createRuntime();
        if (!runtime) {
          safeWarn("[MagicData][AI Review] runtime dependencies missing");
          return;
        }
        await runtime.start();
        return;
      }
      await loadMagicDataSettings();
      runtime.refresh();
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        contextInvalidated = true;
        stopRuntime();
        return;
      }
      safeWarn("[MagicData][AI Review] runtime error: " + String(error?.message || error || "unknown"));
      if (runtime) {
        runtime.refresh();
      }
    } finally {
      evaluating = false;
      if (pendingEvaluate) {
        pendingEvaluate = false;
        window.setTimeout(function () {
          void evaluatePage();
        }, 0);
      }
    }
  }

  function scheduleEvaluatePage() {
    void evaluatePage();
  }

  function installRouteWatch() {
    window.addEventListener("hashchange", scheduleEvaluatePage);
    window.addEventListener("popstate", scheduleEvaluatePage);
    window.setInterval(scheduleEvaluatePage, CHECK_INTERVAL_MS);
  }

  if (!startLogged) {
    startLogged = true;
    safeInfo("[MagicData][AI Review] content started");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEvaluatePage, { once: true });
  } else {
    scheduleEvaluatePage();
  }
  installRouteWatch();
})();
