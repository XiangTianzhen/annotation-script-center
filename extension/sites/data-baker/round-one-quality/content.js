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
  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const BACKEND_MODE_LOCAL = CONSTANTS.BACKEND_ENDPOINT_MODE_LOCAL || "local";
  const DATABAKER_AI_RECOMMEND_PATH =
    CONSTANTS.DATABAKER_AI_RECOMMEND_PATH || "/api/data-baker/round-one-quality/ai/recommend";

  let runtime = null;
  let runtimeConfigKey = "";
  let pageTimer = null;
  let observer = null;
  let evaluating = false;
  let pendingEvaluate = false;

  function normalizeEndpoint(value, fallback) {
    const normalized = normalizeEndpointUrl(value);
    if (normalized) {
      return normalized;
    }
    return normalizeEndpointUrl(fallback) || "";
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

  function normalizePromptText(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
  }

  function normalizeOptionalNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
      return null;
    }
    return number;
  }

  function normalizeOptionalInteger(value, min, max) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number) || number < min || number > max) {
      return null;
    }
    return number;
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
    return (
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.dataBaker?.scripts?.roundOneQuality || {
        id: CONSTANTS.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID || "dataBakerRoundOneQuality",
        enabled: true,
        aiRecommendEnabled: true,
        aiRecommendRequestTimeoutMs: 120000,
        autoPageSizeEnabled: true,
        defaultPageSize: "50条/页",
        shortcuts: {},
      }
    );
  }

  async function loadRuntimeConfig() {
    const storage = globalThis.ASREdgeStorage || null;
    const defaultPlatform =
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.dataBaker || {
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
    const backendMode =
      typeof CONSTANTS.getBackendEndpointModeFromSettings === "function"
        ? CONSTANTS.getBackendEndpointModeFromSettings(settings || {})
        : String(settings?.meta?.backendEndpointMode || "").trim().toLowerCase() === BACKEND_MODE_LOCAL
          ? BACKEND_MODE_LOCAL
          : "server";
    const endpoint = normalizeEndpoint(
      typeof CONSTANTS.buildBackendUrl === "function"
        ? CONSTANTS.buildBackendUrl(DATABAKER_AI_RECOMMEND_PATH, backendMode)
        : (backendMode === BACKEND_MODE_LOCAL
            ? "http://127.0.0.1:3333"
            : "https://script.xiangtianzhen.store") + DATABAKER_AI_RECOMMEND_PATH,
      "https://script.xiangtianzhen.store" + DATABAKER_AI_RECOMMEND_PATH
    );
    const timeoutMs = normalizeTimeout(script.aiRecommendRequestTimeoutMs);
    const defaultPageSize = normalizePageSize(script.defaultPageSize);
    const shortcuts = normalizeShortcuts(script.shortcuts);

    const aiOptions = {};
    const listenPrompt = normalizePromptText(script.aiRecommendListenPrompt || "");
    const comparePrompt = normalizePromptText(script.aiRecommendComparePrompt || "");
    if (listenPrompt) {
      aiOptions.listenPrompt = listenPrompt;
    }
    if (comparePrompt) {
      aiOptions.comparePrompt = comparePrompt;
    }
    const temperature = normalizeOptionalNumber(script.aiRecommendTemperature, 0, 2);
    if (Number.isFinite(temperature)) {
      aiOptions.temperature = temperature;
    }
    const topP = normalizeOptionalNumber(script.aiRecommendTopP, 0, 1);
    if (Number.isFinite(topP)) {
      aiOptions.top_p = topP;
    }
    const maxTokens = normalizeOptionalInteger(script.aiRecommendMaxTokens, 1, 8192);
    if (Number.isFinite(maxTokens)) {
      aiOptions.max_tokens = maxTokens;
    }
    const maxCompletionTokens = normalizeOptionalInteger(
      script.aiRecommendMaxCompletionTokens,
      1,
      8192
    );
    if (Number.isFinite(maxCompletionTokens)) {
      aiOptions.max_completion_tokens = maxCompletionTokens;
    }
    const presencePenalty = normalizeOptionalNumber(script.aiRecommendPresencePenalty, -2, 2);
    if (Number.isFinite(presencePenalty)) {
      aiOptions.presence_penalty = presencePenalty;
    }
    const frequencyPenalty = normalizeOptionalNumber(script.aiRecommendFrequencyPenalty, -2, 2);
    if (Number.isFinite(frequencyPenalty)) {
      aiOptions.frequency_penalty = frequencyPenalty;
    }
    const seed = normalizeOptionalInteger(script.aiRecommendSeed, 0, 2147483647);
    if (Number.isFinite(seed)) {
      aiOptions.seed = seed;
    }
    const stop = String(script.aiRecommendStopSequences || "")
      .split(/\r?\n/)
      .map(function (item) {
        return String(item || "").trim().slice(0, 80);
      })
      .filter(Boolean)
      .slice(0, 8);
    if (stop.length > 0) {
      aiOptions.stop = stop;
    }
    aiOptions.listenModel = String(script.aiRecommendListenModel || "").trim();
    aiOptions.compareModel = String(script.aiRecommendCompareModel || "").trim();
    aiOptions.enable_thinking = script.aiRecommendEnableThinking === true;

    return {
      scriptEnabled: platform.enabled !== false && script.enabled !== false,
      aiRecommendEnabled: script.aiRecommendEnabled !== false,
      autoPageSizeEnabled: script.autoPageSizeEnabled !== false,
      defaultPageSize,
      shortcuts,
      endpoint,
      timeoutMs,
      listenModel: String(script.aiRecommendListenModel || "").trim(),
      compareModel: String(script.aiRecommendCompareModel || "").trim(),
      enableThinking: script.aiRecommendEnableThinking === true,
      aiOptions,
      key: [
        platform.enabled !== false ? "1" : "0",
        script.enabled !== false ? "1" : "0",
        script.aiRecommendEnabled !== false ? "1" : "0",
        script.autoPageSizeEnabled !== false ? "1" : "0",
        defaultPageSize,
        endpoint,
        String(timeoutMs),
        String(script.aiRecommendListenModel || ""),
        String(script.aiRecommendCompareModel || ""),
        script.aiRecommendEnableThinking === true ? "1" : "0",
        JSON.stringify(aiOptions),
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
      listenModel: config.listenModel,
      compareModel: config.compareModel,
      enableThinking: config.enableThinking === true,
      aiOptions: config.aiOptions || {},
    });
    const processedQualifiedItemIds = new Set();
    let autoFillRunning = false;

    function getRecordProcessKey(record) {
      const id = String(record?.id || "").trim();
      if (id) {
        return "id:" + id;
      }
      const sentenceNumber = Number(record?.sentenceNumber);
      if (Number.isFinite(sentenceNumber)) {
        return "sentence:" + String(sentenceNumber);
      }
      const index = Number(record?.__index);
      if (Number.isFinite(index)) {
        return "index:" + String(index);
      }
      return "";
    }

    async function autoFillNextQualifiedItem() {
      if (config.aiRecommendEnabled === false) {
        ui.setStatus("AI 推荐已在 DataBaker 设置中关闭。", "error");
        return { ok: false, message: "ai-disabled" };
      }
      if (autoFillRunning) {
        ui.setStatus("正在处理上一条质检合格数据，请稍候。", "info");
        return { ok: false, message: "busy" };
      }

      autoFillRunning = true;
      try {
        ui.ensureMounted();
        ui.setStatus("正在刷新当前列表...", "info");
        const refreshed = await dataApi.refreshCurrentPageData({
          pageSize: 50,
          forcePageSize: true,
        });
        if (!refreshed?.ok) {
          ui.setStatus(refreshed?.message || "刷新当前列表失败。", "error");
          return { ok: false, message: "refresh-failed" };
        }

        const qualifiedRecords = dataApi.getQualifiedRecords(refreshed.entry);
        const targetRecord = qualifiedRecords.find(function (record) {
          const key = getRecordProcessKey(record);
          if (!key) {
            return true;
          }
          return !processedQualifiedItemIds.has(key);
        });

        if (!targetRecord) {
          ui.setStatus("当前页没有可处理的质检合格数据。", "info");
          return { ok: true, message: "no-qualified" };
        }

        const selected = await dataApi.selectRecord(targetRecord);
        if (!selected?.ok) {
          ui.setStatus(selected?.message || "找不到对应 DOM 条目。", "error");
          return { ok: false, message: "select-failed" };
        }

        const sentenceNumber = Number(targetRecord?.sentenceNumber);
        const sentenceText = Number.isFinite(sentenceNumber)
          ? "第 " + String(sentenceNumber) + " 条"
          : "目标条目";
        ui.setStatus(sentenceText + "质检合格数据已选中，正在生成 AI 推荐...", "info");

        const item = await dataApi.getCurrentItem({ allowFetch: false });
        ui.updateCurrentItemKey(item.key);
        const recommendation = await ai.recommend(item);
        ui.renderResult(recommendation);

        const fillResult = ui.fillRecommendedText();
        if (fillResult?.ok === false) {
          ui.setStatus(fillResult.message || "推荐文本填入失败。", "error");
          return { ok: false, message: "fill-failed" };
        }

        const processedKey = getRecordProcessKey(targetRecord);
        if (processedKey) {
          processedQualifiedItemIds.add(processedKey);
        }
        ui.setStatus("AI 推荐已填入，请人工复核后保存。", "success");
        return { ok: true, message: "filled" };
      } catch (error) {
        ui.setStatus("AI 推荐失败：" + (error?.message || String(error)), "error");
        return { ok: false, message: "recommend-failed" };
      } finally {
        autoFillRunning = false;
      }
    }

    const ui = uiFactory.createRuntime({
      canFillPageText: dataApi.canFillPageText,
      fillPageText: dataApi.fillPageText,
      onAutoFillQualifiedItem: autoFillNextQualifiedItem,
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
