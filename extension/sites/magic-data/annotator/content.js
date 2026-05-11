(function () {
  const CHECK_INTERVAL_MS = 1000;
  const MOUNT_RETRY_MS = 200;
  const MOUNT_RETRY_LIMIT = 30;
  let runtime = null;
  let observer = null;
  let pageTimer = null;
  let evaluating = false;
  let pendingEvaluate = false;
  let contextInvalidated = false;
  let mountRetryCount = 0;
  let startLogged = false;

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

  function createRuntime() {
    const detector = globalThis.__ASREdgeMagicDataAnnotatorPageDetector;
    const collector = globalThis.__ASREdgeMagicDataAnnotatorDataCollector;
    const aiClient = globalThis.__ASREdgeMagicDataAnnotatorAiReviewClient;
    const panelFactory = globalThis.__ASREdgeMagicDataAnnotatorUiPanel;
    if (!detector || !collector || !aiClient || !panelFactory) {
      return null;
    }

    const panel = panelFactory.createRuntime({
      collectCurrentItem: collector.collectCurrentItem,
      fillDialectLine: collector.fillDialectLine,
      fillMandarinLine: collector.fillMandarinLine,
      getClientVersion: aiClient.getClientVersion,
      resolveBackendConfig: aiClient.resolveBackendConfig,
      reviewCurrent: aiClient.reviewCurrent,
    });
    let lastTaskKey = "";

    function refresh() {
      if (!detector.isMagicDataHost()) {
        panel.remove();
        return;
      }
      const pageType = detector.getPageType();
      if (pageType === "asrmark") {
        const mounted = panel.ensureMounted();
        if (!mounted) {
          return;
        }
        const snapshot = collector.collectCurrentItem();
        snapshot.pageType = pageType;
        const nextTaskKey = String(snapshot.taskItemId || snapshot.samplingRecordId || "");
        if (nextTaskKey && lastTaskKey && nextTaskKey !== lastTaskKey) {
          panel.clearResult();
          panel.setMessage("当前条已变化，请重新点击 AI 复核当前条。");
        }
        lastTaskKey = nextTaskKey;
        panel.refreshPageSnapshot(snapshot, null);
        return;
      }
      if (pageType === "asrmarkCheck") {
        lastTaskKey = "";
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
        return;
      }
      mountRetryCount += 1;
      window.setTimeout(function () {
        ensurePanelMountedWithRetry();
      }, MOUNT_RETRY_MS);
    }

    function start() {
      refresh();
      ensurePanelMountedWithRetry();
      observer = new MutationObserver(function () {
        window.clearTimeout(pageTimer);
        pageTimer = window.setTimeout(function () {
          refresh();
        }, 160);
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
      panel.remove();
    }

    return {
      refresh,
      start,
      stop,
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
          return;
        }
        runtime.start();
        return;
      }
      runtime.refresh();
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        contextInvalidated = true;
        stopRuntime();
        return;
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

  if (!startLogged && typeof console !== "undefined" && typeof console.info === "function") {
    startLogged = true;
    console.info("[MagicData][AI Review] content started");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEvaluatePage, { once: true });
  } else {
    scheduleEvaluatePage();
  }
  installRouteWatch();
})();
