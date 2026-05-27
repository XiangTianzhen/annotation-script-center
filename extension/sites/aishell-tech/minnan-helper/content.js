(function () {
  if (globalThis.__ASREdgeAishellTechMinnanContentInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanContentInstalled = true;

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const DEFAULT_TIMEOUT_MS = Number(CONSTANTS.DEFAULT_AI_REQUEST_TIMEOUT_MS || 120000) || 120000;
  const SCRIPT_ID =
    CONSTANTS.AISHELL_TECH_MINNAN_SCRIPT_ID || "aishellTechMinnanAssistant";
  const RECOMMEND_PATH =
    CONSTANTS.AISHELL_TECH_AI_RECOMMEND_PATH ||
    "/api/aishell-tech/minnan-helper/ai/recommend";

  let activeRuntime = null;
  let currentUrl = location.href;
  let routeTimer = null;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeRecognitionMode(value) {
    return String(value || "").trim().toLowerCase() === "omni_single"
      ? "omni_single"
      : "two_stage";
  }

  function normalizeOptionalNumber(value, min, max) {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      return "";
    }
    return numeric;
  }

  function normalizeOptionalInteger(value, min, max) {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    const numeric = Math.floor(Number(value));
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      return "";
    }
    return numeric;
  }

  function normalizeStopSequences(value) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/\r?\n/)
        : [];
    const result = [];
    source.forEach(function (item) {
      const text = String(item || "").trim().slice(0, 80);
      if (!text || result.indexOf(text) >= 0 || result.length >= 8) {
        return;
      }
      result.push(text);
    });
    return result;
  }

  function buildAiOptions(config) {
    const options = {};
    if (config.aiRecommendListenPrompt) {
      options.listenPrompt = config.aiRecommendListenPrompt;
    }
    if (config.aiRecommendComparePrompt) {
      options.comparePrompt = config.aiRecommendComparePrompt;
    }
    if (config.aiRecommendListenModel) {
      options.listenModel = config.aiRecommendListenModel;
    }
    if (config.aiRecommendCompareModel) {
      options.compareModel = config.aiRecommendCompareModel;
    }
    if (config.aiRecommendSingleModel) {
      options.singleModel = config.aiRecommendSingleModel;
    }
    if (config.aiRecommendEnableThinking === true) {
      options.enableThinking = true;
    }
    const temperature = normalizeOptionalNumber(config.aiRecommendTemperature, 0, 2);
    if (temperature !== "") {
      options.temperature = temperature;
    }
    const topP = normalizeOptionalNumber(config.aiRecommendTopP, 0, 1);
    if (topP !== "") {
      options.top_p = topP;
    }
    const maxTokens = normalizeOptionalInteger(config.aiRecommendMaxTokens, 1, 8192);
    if (maxTokens !== "") {
      options.max_tokens = maxTokens;
    }
    const maxCompletionTokens = normalizeOptionalInteger(
      config.aiRecommendMaxCompletionTokens,
      1,
      8192
    );
    if (maxCompletionTokens !== "") {
      options.max_completion_tokens = maxCompletionTokens;
    }
    const presencePenalty = normalizeOptionalNumber(
      config.aiRecommendPresencePenalty,
      -2,
      2
    );
    if (presencePenalty !== "") {
      options.presence_penalty = presencePenalty;
    }
    const frequencyPenalty = normalizeOptionalNumber(
      config.aiRecommendFrequencyPenalty,
      -2,
      2
    );
    if (frequencyPenalty !== "") {
      options.frequency_penalty = frequencyPenalty;
    }
    const seed = normalizeOptionalInteger(config.aiRecommendSeed, 0, 2147483647);
    if (seed !== "") {
      options.seed = seed;
    }
    const stop = normalizeStopSequences(config.aiRecommendStopSequences);
    if (stop.length > 0) {
      options.stop = stop;
    }
    return options;
  }

  function isMarkPage() {
    return (
      location.hostname === "mark.aishelltech.com" &&
      String(location.pathname || "").toLowerCase() === "/mytask/mark"
    );
  }

  function getDefaultConfig() {
    const defaults =
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.aishellTech?.scripts?.minnanHelper || {};
    return Object.assign(
      {
        id: SCRIPT_ID,
        enabled: true,
        aiRecommendEnabled: true,
        aiRecommendRequestTimeoutMs: DEFAULT_TIMEOUT_MS,
        aiRecommendPipelineMode: "two_stage",
        aiRecommendListenModel: "qwen3.5-omni-flash",
        aiRecommendCompareModel: "qwen3.5-plus",
        aiRecommendSingleModel: "qwen3.5-omni-flash",
        aiRecommendEnableThinking: false,
        aiRecommendListenPrompt: "",
        aiRecommendComparePrompt: "",
        aiRecommendTemperature: "",
        aiRecommendTopP: "",
        aiRecommendMaxTokens: "",
        aiRecommendMaxCompletionTokens: "",
        aiRecommendPresencePenalty: "",
        aiRecommendFrequencyPenalty: "",
        aiRecommendSeed: "",
        aiRecommendStopSequences: "",
      },
      defaults || {}
    );
  }

  async function loadRuntimeConfig() {
    const defaults = getDefaultConfig();
    const settings = STORAGE && typeof STORAGE.getSettings === "function"
      ? await STORAGE.getSettings()
      : { platforms: {}, meta: {} };
    const scriptConfig = settings?.platforms?.aishellTech?.scripts?.minnanHelper || {};
    const endpoint =
      typeof CONSTANTS.buildBackendUrl === "function"
        ? CONSTANTS.buildBackendUrl(RECOMMEND_PATH, settings)
        : "https://script.xiangtianzhen.store" + RECOMMEND_PATH;
    const merged = Object.assign({}, defaults, scriptConfig, {
      id: SCRIPT_ID,
      aiRecommendEndpoint: endpoint,
    });
    merged.aiRecommendPipelineMode = normalizeRecognitionMode(
      merged.aiRecommendPipelineMode || merged.recognitionMode
    );
    merged.aiRecommendRequestTimeoutMs = Math.max(
      1000,
      Number(merged.aiRecommendRequestTimeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
    );
    return {
      config: merged,
      enabled:
        settings?.platforms?.aishellTech?.enabled !== false &&
        merged.enabled !== false &&
        merged.aiRecommendEnabled !== false,
    };
  }

  function createRuntime(config) {
    const dataApiFactory = globalThis.__ASREdgeAishellTechMinnanDataApi;
    const aiFactory = globalThis.__ASREdgeAishellTechMinnanAiRecommendation;
    const uiFactory = globalThis.__ASREdgeAishellTechMinnanUiPanel;

    if (!dataApiFactory?.createRuntime || !aiFactory?.createRuntime || !uiFactory?.createRuntime) {
      return null;
    }

    const dataApi = dataApiFactory.createRuntime();
    const aiClient = aiFactory.createRuntime({
      endpoint: config.aiRecommendEndpoint,
      timeoutMs: config.aiRecommendRequestTimeoutMs,
      recognitionMode: config.aiRecommendPipelineMode,
      listenModel: config.aiRecommendListenModel,
      compareModel: config.aiRecommendCompareModel,
      singleModel: config.aiRecommendSingleModel,
      enableThinking: config.aiRecommendEnableThinking === true,
      aiOptions: buildAiOptions(config),
    });

    const panel = uiFactory.createRuntime({
      onRecommend: handleRecommend,
      onBatchRecommend: handleBatchRecommend,
    });

    let mountTimer = null;
    let currentBusyState = {
      single: false,
      batch: false,
    };

    function syncBusyState(nextState) {
      currentBusyState = Object.assign({}, currentBusyState, nextState || {});
      panel.setBusy(currentBusyState);
    }

    async function handleRecommend() {
      syncBusyState({ single: true });
      panel.setStatus("正在识别当前条...", "info");
      try {
        const item = await dataApi.getCurrentItem();
        if (!item) {
          throw new Error("当前页面还没有定位到选中条目。");
        }
        panel.updateCurrentItemKey(item.key);
        const result = await aiClient.recommend(item);
        panel.renderResult(result);
        panel.setStatus("当前条识别完成。", "success");
      } catch (error) {
        panel.setStatus(error?.message || String(error), "error");
      } finally {
        syncBusyState({ single: false });
      }
    }

    async function handleBatchRecommend() {
      syncBusyState({ batch: true });
      panel.setStatus("正在准备批量识别...", "info");
      try {
        const tasks = await dataApi.getBatchTasksFromCurrentSelection();
        if (!tasks.length) {
          throw new Error("从当前选中条开始没有可识别的未完成条目。");
        }
        panel.updateBatch({
          phaseText: "开始",
          total: tasks.length,
          completed: 0,
          failed: 0,
          currentText: tasks[0].displayName,
        });

        for (let index = 0; index < tasks.length; index += 1) {
          const task = tasks[index];
          panel.updateBatch({
            phaseText: "识别中",
            total: tasks.length,
            completed: index,
            failed: 0,
            currentText: task.displayName,
          });
          const item = await dataApi.getItemByIndex(task.index, {
            includeCurrentInput: false,
          });
          if (!item) {
            throw new Error("无法定位批量条目：" + task.displayName);
          }
          const result = await aiClient.recommend(item);
          panel.renderResult(result);
          panel.updateBatch({
            phaseText: "已完成当前条",
            total: tasks.length,
            completed: index + 1,
            failed: 0,
            currentText: task.displayName,
          });
        }

        panel.updateBatch({
          phaseText: "已完成",
          total: tasks.length,
          completed: tasks.length,
          failed: 0,
          currentText: "",
        });
        panel.setStatus("当前分包批量识别完成。", "success");
      } catch (error) {
        panel.setStatus(error?.message || String(error), "error");
      } finally {
        syncBusyState({ batch: false });
      }
    }

    function ensureMounted() {
      panel.ensureMounted();
      void dataApi
        .getCurrentItem()
        .then(function (item) {
          panel.updateCurrentItemKey(item?.key || "");
        })
        .catch(function () {});
    }

    function start() {
      dataApi.start();
      ensureMounted();
      mountTimer = window.setInterval(ensureMounted, 1200);
      panel.setStatus("闽南语助手已就绪。", "success");
    }

    function stop() {
      if (mountTimer) {
        window.clearInterval(mountTimer);
        mountTimer = null;
      }
      dataApi.stop();
      panel.remove();
    }

    return {
      start,
      stop,
    };
  }

  function stopRuntime() {
    if (activeRuntime) {
      activeRuntime.stop();
      activeRuntime = null;
    }
  }

  async function evaluatePage() {
    if (!isMarkPage()) {
      stopRuntime();
      return;
    }
    const runtimeConfig = await loadRuntimeConfig();
    if (!runtimeConfig.enabled) {
      stopRuntime();
      return;
    }
    if (!activeRuntime) {
      const runtime = createRuntime(runtimeConfig.config);
      if (!runtime) {
        return;
      }
      activeRuntime = runtime;
      activeRuntime.start();
    }
  }

  function startRouteWatch() {
    if (routeTimer) {
      return;
    }
    routeTimer = window.setInterval(function () {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        void evaluatePage().catch(function (error) {
          console.warn("[Aishell][minnan-helper] route evaluate failed", error?.message || error);
        });
      }
    }, 300);
  }

  function bootstrap() {
    startRouteWatch();
    void evaluatePage().catch(function (error) {
      console.warn("[Aishell][minnan-helper] bootstrap failed", error?.message || error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
