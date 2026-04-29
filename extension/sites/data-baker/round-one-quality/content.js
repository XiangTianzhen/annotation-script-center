(function () {
  const CHECK_INTERVAL_MS = 1000;
  const PAGE_SIZE_OPTIONS = ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"];
  const SHORTCUT_KEYS = [
    "aiRecommendCurrentItem",
    "copyAiHeardText",
    "copyRecommendedText",
    "fillRecommendedText",
    "ignoreAiResult",
    "sentenceQualified",
    "sentenceUnqualified",
    "taskPass",
    "taskPartialReject",
    "taskFullReject",
  ];

  let runtime = null;
  let runtimeConfigKey = "";
  let pageTimer = null;
  let observer = null;
  let evaluating = false;
  let pendingEvaluate = false;

  function normalizeEndpoint(value, fallback) {
    const serverEndpoint =
      fallback ||
      "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend";
    const localEndpoint =
      "http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend";
    const normalized = normalizeEndpointUrl(value);

    if (normalized && normalized === normalizeEndpointUrl(localEndpoint)) {
      return localEndpoint;
    }
    if (normalized && normalized === normalizeEndpointUrl(serverEndpoint)) {
      return serverEndpoint;
    }

    return serverEndpoint;
  }

  function normalizeEndpointUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }
      return url.toString();
    } catch (error) {
      return "";
    }
  }

  function normalizeTimeout(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return 120000;
    }
    return Math.min(300000, Math.max(1000, Math.round(number)));
  }

  function normalizePageSize(value) {
    const text = String(value || "").replace(/\s+/g, "");
    return PAGE_SIZE_OPTIONS.indexOf(text) >= 0 ? text : "50条/页";
  }

  function normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== "object") {
      return null;
    }
    const hasKey = typeof shortcut.key === "string" && shortcut.key.length > 0;
    const hasButton = typeof shortcut.button === "number";
    if (!hasKey && !hasButton) {
      return null;
    }
    return {
      ctrl: shortcut.ctrl === true,
      alt: shortcut.alt === true,
      shift: shortcut.shift === true,
      meta: shortcut.meta === true,
      key: hasKey ? shortcut.key : null,
      button: hasButton ? shortcut.button : null,
    };
  }

  function normalizeShortcuts(shortcuts) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const result = {};
    SHORTCUT_KEYS.forEach(function (key) {
      result[key] = normalizeShortcut(source[key]);
    });
    return result;
  }

  function getDefaultRoundOneConfig() {
    const constants = globalThis.ASREdgeConstants || {};
    return (
      constants.DEFAULT_SETTINGS?.platforms?.dataBaker?.scripts?.roundOneQuality || {
        id: constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID || "dataBakerRoundOneQuality",
        enabled: true,
        aiRecommendEnabled: true,
        aiRecommendEndpoint:
          constants.DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT ||
          "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend",
        aiRecommendRequestTimeoutMs: 120000,
        autoPageSizeEnabled: true,
        defaultPageSize: "50条/页",
        shortcuts: {},
      }
    );
  }

  async function loadRuntimeConfig() {
    const constants = globalThis.ASREdgeConstants || {};
    const storage = globalThis.ASREdgeStorage || null;
    const defaultPlatform =
      constants.DEFAULT_SETTINGS?.platforms?.dataBaker || {
        enabled: true,
        scripts: {
          roundOneQuality: getDefaultRoundOneConfig(),
        },
      };
    let settings = null;

    if (storage && typeof storage.getSettings === "function") {
      try {
        settings = await storage.getSettings();
      } catch (error) {
        settings = null;
      }
    }

    const platform = Object.assign(
      {},
      defaultPlatform,
      settings?.platforms?.dataBaker || {}
    );
    const script = Object.assign(
      {},
      getDefaultRoundOneConfig(),
      platform?.scripts?.roundOneQuality || {}
    );
    const endpoint = normalizeEndpoint(
      script.aiRecommendEndpoint,
      getDefaultRoundOneConfig().aiRecommendEndpoint
    );
    const timeoutMs = normalizeTimeout(script.aiRecommendRequestTimeoutMs);
    const defaultPageSize = normalizePageSize(script.defaultPageSize);
    const shortcuts = normalizeShortcuts(script.shortcuts);

    return {
      scriptEnabled: platform.enabled !== false && script.enabled !== false,
      aiRecommendEnabled: script.aiRecommendEnabled !== false,
      autoPageSizeEnabled: script.autoPageSizeEnabled !== false,
      defaultPageSize,
      shortcuts,
      endpoint,
      timeoutMs,
      key: [
        platform.enabled !== false ? "1" : "0",
        script.enabled !== false ? "1" : "0",
        script.aiRecommendEnabled !== false ? "1" : "0",
        script.autoPageSizeEnabled !== false ? "1" : "0",
        defaultPageSize,
        endpoint,
        String(timeoutMs),
        JSON.stringify(shortcuts),
      ].join("|"),
    };
  }

  function createRuntime(config) {
    const dataApiFactory = globalThis.__ASREdgeDataBakerRoundOneDataApi;
    const aiFactory = globalThis.__ASREdgeDataBakerRoundOneAiRecommendation;
    const uiFactory = globalThis.__ASREdgeDataBakerRoundOneUiPanel;
    const pageSizeFactory = globalThis.__ASREdgeDataBakerRoundOnePageSizeController;
    const shortcutsFactory = globalThis.__ASREdgeDataBakerRoundOneShortcuts;

    if (!dataApiFactory || !aiFactory || !uiFactory) {
      return null;
    }

    const dataApi = dataApiFactory.createRuntime();
    const ai = aiFactory.createRuntime({
      endpoint: config.endpoint,
      timeoutMs: config.timeoutMs,
    });
    const ui = uiFactory.createRuntime({
      canFillPageText: dataApi.canFillPageText,
      fillPageText: dataApi.fillPageText,
      onRecommend: async function () {
        const item = await dataApi.getCurrentItem();
        ui.updateCurrentItemKey(item.key);
        return ai.recommend(item);
      },
    });
    const pageSize = pageSizeFactory?.createRuntime?.({
      defaultPageSize: config.defaultPageSize,
    });

    function showShortcutStatus(message, tone) {
      if (config.aiRecommendEnabled !== false) {
        ui.ensureMounted();
        ui.setStatus(message, tone);
        return;
      }
      if (typeof console !== "undefined" && typeof console.debug === "function") {
        console.debug("[DataBaker][round-one-quality][shortcut] " + String(message || ""));
      }
    }

    const shortcutActions = {
      requestAiRecommend: function () {
        if (config.aiRecommendEnabled === false) {
          showShortcutStatus("AI 推荐已在 DataBaker 设置中关闭。", "error");
          return Promise.resolve({ ok: false });
        }
        return ui.requestAiRecommend();
      },
      copyHeardText: function () {
        return ui.copyHeardText();
      },
      copyRecommendedText: function () {
        return ui.copyRecommendedText();
      },
      fillRecommendedText: function () {
        return ui.fillRecommendedText();
      },
      ignoreAiResult: function () {
        return ui.ignoreAiResult();
      },
      showStatus: showShortcutStatus,
    };
    const shortcuts = shortcutsFactory?.createRuntime?.({
      shortcuts: config.shortcuts,
      actions: shortcutActions,
    });

    function refresh() {
      if (!dataApiFactory.isRoundOneCollectPage()) {
        return;
      }
      if (config.aiRecommendEnabled !== false) {
        ui.ensureMounted();
      } else {
        ui.remove();
      }
      if (config.autoPageSizeEnabled !== false) {
        pageSize?.refresh?.({
          defaultPageSize: config.defaultPageSize,
        });
      }
      shortcuts?.refresh?.({
        shortcuts: config.shortcuts,
        actions: shortcutActions,
      });
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
      if (config.aiRecommendEnabled !== false) {
        ui.ensureMounted();
      }
      if (config.autoPageSizeEnabled !== false) {
        pageSize?.start?.();
      }
      shortcuts?.start?.();
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
      pageSize?.stop?.();
      shortcuts?.stop?.();
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

  function stopRuntime() {
    if (runtime) {
      runtime.stop();
      runtime = null;
      runtimeConfigKey = "";
    }
  }

  async function evaluatePage() {
    if (evaluating) {
      pendingEvaluate = true;
      return;
    }

    evaluating = true;
    try {
      if (!shouldRun()) {
        stopRuntime();
        return;
      }

      const config = await loadRuntimeConfig();
      if (!config.scriptEnabled) {
        stopRuntime();
        return;
      }

      if (runtime && runtimeConfigKey !== config.key) {
        stopRuntime();
      }

      if (!runtime) {
        runtime = createRuntime(config);
        if (runtime) {
          runtimeConfigKey = config.key;
          runtime.start();
        }
        return;
      }

      runtime.refresh();
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEvaluatePage, { once: true });
  } else {
    scheduleEvaluatePage();
  }
  installRouteWatch();
})();
