(function () {
  const CHECK_INTERVAL_MS = 1000;

  let runtime = null;
  let pageTimer = null;
  let observer = null;

  function createRuntime() {
    const dataApiFactory = globalThis.__ASREdgeDataBakerRoundOneDataApi;
    const aiFactory = globalThis.__ASREdgeDataBakerRoundOneAiRecommendation;
    const uiFactory = globalThis.__ASREdgeDataBakerRoundOneUiPanel;

    if (!dataApiFactory || !aiFactory || !uiFactory) {
      return null;
    }

    const dataApi = dataApiFactory.createRuntime();
    const ai = aiFactory.createRuntime();
    const ui = uiFactory.createRuntime({
      canFillPageText: dataApi.canFillPageText,
      fillPageText: dataApi.fillPageText,
      onRecommend: async function () {
        const item = await dataApi.getCurrentItem();
        ui.updateCurrentItemKey(item.key);
        return ai.recommend(item);
      },
    });

    function refresh() {
      if (!dataApiFactory.isRoundOneCollectPage()) {
        return;
      }
      ui.ensureMounted();
      dataApi
        .getCurrentItem({ allowFetch: false })
        .then(function (item) {
          ui.updateCurrentItemKey(item.key);
        })
        .catch(function () {
          // Keep UI available; click handler will show actionable error.
        });
    }

    function start() {
      dataApi.start();
      ui.ensureMounted();
      observer = new MutationObserver(function () {
        window.clearTimeout(pageTimer);
        pageTimer = window.setTimeout(refresh, 150);
      });
      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
      refresh();
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
      dataApi.stop();
      ui.remove();
    }

    return {
      refresh,
      start,
      stop,
    };
  }

  function shouldRun() {
    const dataApiFactory = globalThis.__ASREdgeDataBakerRoundOneDataApi;
    return Boolean(dataApiFactory?.isRoundOneCollectPage?.());
  }

  function evaluatePage() {
    if (!shouldRun()) {
      if (runtime) {
        runtime.stop();
        runtime = null;
      }
      return;
    }

    if (!runtime) {
      runtime = createRuntime();
      if (runtime) {
        runtime.start();
      }
      return;
    }

    runtime.refresh();
  }

  function installRouteWatch() {
    window.addEventListener("hashchange", evaluatePage);
    window.addEventListener("popstate", evaluatePage);
    window.setInterval(evaluatePage, CHECK_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", evaluatePage, { once: true });
  } else {
    evaluatePage();
  }
  installRouteWatch();
})();
