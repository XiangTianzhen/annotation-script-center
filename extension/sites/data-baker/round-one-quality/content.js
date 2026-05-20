(function () {
  const CHECK_INTERVAL_MS = 1000;
  const PAGE_SIZE_OPTIONS = ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"];
  const SHORTCUT_KEYS = [
    "aiRecommendCurrentItem",
    "autoFillQualifiedItem",
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
  const DATABAKER_LISTEN_MODEL_OPTIONS = Array.isArray(CONSTANTS.DATABAKER_AI_LISTEN_MODEL_OPTIONS)
    ? CONSTANTS.DATABAKER_AI_LISTEN_MODEL_OPTIONS
        .map(function (item) {
          return String(item && typeof item === "object" ? item.value : item || "").trim();
        })
        .filter(Boolean)
    : ["fun-asr", "qwen3.5-omni-plus", "qwen3.5-omni-flash"];
  const DATABAKER_COMPARE_MODEL_OPTIONS = Array.isArray(CONSTANTS.DATABAKER_AI_COMPARE_MODEL_OPTIONS)
    ? CONSTANTS.DATABAKER_AI_COMPARE_MODEL_OPTIONS
        .map(function (item) {
          return String(item && typeof item === "object" ? item.value : item || "").trim();
        })
        .filter(Boolean)
    : ["qwen3.6-plus", "qwen3.5-plus", "qwen3.6-flash", "qwen3.5-flash"];
  const DATABAKER_SINGLE_MODEL_OPTIONS = Array.isArray(CONSTANTS.DATABAKER_AI_SINGLE_MODEL_OPTIONS)
    ? CONSTANTS.DATABAKER_AI_SINGLE_MODEL_OPTIONS
        .map(function (item) {
          return String(item && typeof item === "object" ? item.value : item || "").trim();
        })
        .filter(Boolean)
    : ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];

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

  function normalizeAutofillConcurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return 5;
    }
    return Math.max(1, Math.min(10, Math.round(number)));
  }

  function normalizePipelineMode(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "two_stage" || text === "omni_single") {
      return text;
    }
    if (text === "fun_asr_compare" || text === "qwen_omni_compare" || text === "qwen_omni_two_stage") {
      return "two_stage";
    }
    if (text === "listen_only") {
      return "omni_single";
    }
    return "two_stage";
  }

  function normalizeAutofillWaitAll(value) {
    return value === true;
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

  function getDataBakerModelText(value) {
    if (value && typeof value === "object") {
      if (typeof value.value === "string") {
        return String(value.value || "").trim();
      }
      if (typeof value.label === "string") {
        return String(value.label || "").trim();
      }
      return "";
    }
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    return text === "[object Object]" ? "" : text;
  }

  function normalizeDataBakerListenModel(value, fallback) {
    const normalizedValue = getDataBakerModelText(value);
    if (DATABAKER_LISTEN_MODEL_OPTIONS.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    const normalizedFallback = getDataBakerModelText(fallback || "qwen3.5-omni-flash");
    if (DATABAKER_LISTEN_MODEL_OPTIONS.indexOf(normalizedFallback) >= 0) {
      return normalizedFallback;
    }
    return "qwen3.5-omni-flash";
  }

  function normalizeDataBakerCompareModel(value) {
    const normalizedValue = getDataBakerModelText(value);
    if (DATABAKER_COMPARE_MODEL_OPTIONS.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    return "qwen3.5-plus";
  }

  function normalizeDataBakerSingleModel(value, fallback) {
    const normalizedValue = getDataBakerModelText(value);
    if (DATABAKER_SINGLE_MODEL_OPTIONS.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    const normalizedFallback = getDataBakerModelText(fallback || "qwen3.5-omni-flash");
    if (DATABAKER_SINGLE_MODEL_OPTIONS.indexOf(normalizedFallback) >= 0) {
      return normalizedFallback;
    }
    return "qwen3.5-omni-flash";
  }

  function derivePipelineMode(recognitionMode, model) {
    if (normalizePipelineMode(recognitionMode) === "omni_single") {
      return "omni_single";
    }
    return getDataBakerModelText(model) === "fun-asr" ? "fun_asr_compare" : "qwen_omni_compare";
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
        aiRecommendPipelineMode: "two_stage",
        aiQualifiedAutofillConcurrency: 5,
        aiQualifiedAutofillWaitAllBeforeFill: false,
        aiRecommendListenModel: "qwen3.5-omni-flash",
        aiRecommendCompareModel: "qwen3.5-plus",
        aiRecommendSingleModel: "qwen3.5-omni-flash",
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
    const recognitionMode = normalizePipelineMode(script.aiRecommendPipelineMode);
    const listenModel = normalizeDataBakerListenModel(
      script.aiRecommendListenModel,
      recognitionMode === "two_stage" &&
        getDataBakerModelText(script.aiRecommendListenModel) === "fun-asr"
        ? "fun-asr"
        : "qwen3.5-omni-flash"
    );
    const singleModel = normalizeDataBakerSingleModel(
      script.aiRecommendSingleModel ||
        (recognitionMode === "omni_single" ? script.aiRecommendListenModel : ""),
      "qwen3.5-omni-flash"
    );
    const pipelineMode = derivePipelineMode(
      recognitionMode,
      recognitionMode === "omni_single" ? singleModel : listenModel
    );
    const aiQualifiedAutofillConcurrency = normalizeAutofillConcurrency(
      script.aiQualifiedAutofillConcurrency
    );
    const aiQualifiedAutofillWaitAllBeforeFill = normalizeAutofillWaitAll(
      script.aiQualifiedAutofillWaitAllBeforeFill
    );
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
    const compareModel =
      recognitionMode === "two_stage"
        ? normalizeDataBakerCompareModel(script.aiRecommendCompareModel)
        : "";
    aiOptions.listenModel = recognitionMode === "omni_single" ? singleModel : listenModel;
    aiOptions.compareModel = compareModel;
    aiOptions.singleModel = singleModel;
    aiOptions.omniModel = singleModel;
    aiOptions.enable_thinking = script.aiRecommendEnableThinking === true;

    return {
      scriptEnabled: platform.enabled !== false && script.enabled !== false,
      aiRecommendEnabled: script.aiRecommendEnabled !== false,
      autoPageSizeEnabled: script.autoPageSizeEnabled !== false,
      defaultPageSize,
      shortcuts,
      endpoint,
      timeoutMs,
      recognitionMode,
      pipelineMode,
      aiQualifiedAutofillConcurrency,
      aiQualifiedAutofillWaitAllBeforeFill,
      listenModel: recognitionMode === "omni_single" ? singleModel : listenModel,
      compareModel,
      singleModel: singleModel,
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
        recognitionMode,
        pipelineMode,
        String(aiQualifiedAutofillConcurrency),
        aiQualifiedAutofillWaitAllBeforeFill ? "1" : "0",
        listenModel,
        normalizeDataBakerCompareModel(script.aiRecommendCompareModel),
        singleModel,
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
      recognitionMode: config.recognitionMode,
      pipelineMode: config.pipelineMode,
      listenModel: config.listenModel,
      compareModel: config.compareModel,
      singleModel: config.singleModel,
      enableThinking: config.enableThinking === true,
      aiOptions: config.aiOptions || {},
    });
    const processedQualifiedItemIds = new Set();
    let batchQualifiedAutofillRunning = false;
    let batchQualifiedAutofillCancelRequested = false;
    let batchAutofillPhase = "idle";
    let currentBatchFailures = [];
    let currentRetryableFillFailures = [];
    let lastBatchSummary = null;

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

    function waitBetweenBatchItems() {
      const delayMs = 300 + Math.floor(Math.random() * 500);
      return new Promise(function (resolve) {
        window.setTimeout(resolve, delayMs);
      });
    }

    function setBatchButtonState(isRunning, isStopping) {
      if (typeof ui.setBatchAutofillPhase === "function") {
        ui.setBatchAutofillPhase(batchAutofillPhase);
      }
      if (typeof ui.setBatchAutofillRunning === "function") {
        ui.setBatchAutofillRunning(isRunning === true);
      }
      if (typeof ui.setBatchAutofillStopping === "function") {
        ui.setBatchAutofillStopping(isStopping === true);
      }
    }

    function buildFloatingSnapshot(extra) {
      const summary = Object.assign(
        {
          phase: batchAutofillPhase || "idle",
          running: batchQualifiedAutofillRunning,
          stopping: batchQualifiedAutofillCancelRequested,
          frontConcurrency: 0,
          totalCount: 0,
          launchedCount: 0,
          activeAiCount: 0,
          completedAiCount: 0,
          analysisSuccessCount: 0,
          analysisFailCount: 0,
          queueCount: 0,
          fillStartedCount: 0,
          fillSuccessCount: 0,
          fillFailCount: 0,
          fillSkipCount: 0,
          currentDisplayName: "",
          failures: currentBatchFailures.slice(),
          retryableFailuresCount: currentRetryableFillFailures.length,
        },
        lastBatchSummary || {},
        extra || {}
      );
      lastBatchSummary = summary;
      return summary;
    }

    function updateFloatingProgress(extra) {
      if (typeof ui.updateBatchFloatingProgress !== "function") {
        return;
      }
      ui.updateBatchFloatingProgress(buildFloatingSnapshot(extra));
    }

    function finishFloatingProgress(extra) {
      if (typeof ui.finishBatchFloatingProgress !== "function") {
        return;
      }
      const finalSummary = buildFloatingSnapshot(
        Object.assign({ running: false, autoHideMs: 30000 }, extra || {})
      );
      ui.finishBatchFloatingProgress(finalSummary);
    }

    function pushBatchFailure(entry) {
      const failure = Object.assign(
        {
          type: "unknown",
          retryable: false,
          displayName: "未命名条目",
          errorMessage: "",
          result: null,
        },
        entry || {}
      );
      currentBatchFailures.push(failure);
      if (failure.retryable && failure.type === "fill_failed" && failure.result?.recommendation) {
        currentRetryableFillFailures.push(failure);
      }
    }

    async function stopBatchQualifiedAutofill() {
      if (!batchQualifiedAutofillRunning) {
        ui.setStatus("当前没有正在运行的连续填入任务。", "info");
        return { ok: false, message: "not-running" };
      }
      batchQualifiedAutofillCancelRequested = true;
      setBatchButtonState(true, true);
      ui.setStatus("连续填入停止中，详情见顶部统计悬浮窗。", "info");
      updateFloatingProgress({
        stopping: true,
        running: true,
      });
      return { ok: true, message: "stop-requested" };
    }

    async function fillOneAnalyzedResult(result, fillIndex, totalCount) {
      const record = result?.record || null;
      const displayName = String(result?.displayName || "未命名条目");

      if (typeof dataApi.isRecordQualified === "function" && !dataApi.isRecordQualified(record)) {
        return {
          outcome: "skip",
          failureType: "skipped",
          errorMessage: "当前状态不是质检合格。",
          retryable: false,
          result: result,
          displayName,
        };
      }

      const selected = await dataApi.selectRecord(record);
      if (!selected?.ok) {
        return {
          outcome: "fail",
          failureType: "fill_failed",
          errorMessage: "选中失败：" + (selected?.message || "未知错误"),
          retryable: true,
          result: result,
          displayName,
        };
      }

      const ready = await dataApi.waitForPageTextReady(record, 3000);
      if (!ready?.ok) {
        return {
          outcome: "fail",
          failureType: "fill_failed",
          errorMessage: "页面文本同步失败：" + (ready?.message || "超时"),
          retryable: true,
          result: result,
          displayName,
        };
      }

      const recommendation =
        result?.recommendation && typeof result.recommendation === "object"
          ? result.recommendation
          : null;
      const recommendedText = String(recommendation?.recommendedText || "").trim();
      if (!recommendedText) {
        return {
          outcome: "fail",
          failureType: "fill_failed",
          errorMessage: "推荐文本为空。",
          retryable: true,
          result: result,
          displayName,
        };
      }

      ui.renderResult(recommendation);
      const fillResult = dataApi.fillPageText(recommendedText);
      if (fillResult?.ok === false) {
        return {
          outcome: "fail",
          failureType: "fill_failed",
          errorMessage: "填入失败：" + (fillResult?.message || "未知错误"),
          retryable: true,
          result: result,
          displayName,
        };
      }

      const processKey = String(result?.processKey || "");
      if (processKey) {
        processedQualifiedItemIds.add(processKey);
      }
      return {
        outcome: "success",
        failureType: "",
        errorMessage: "",
        retryable: false,
        result: result,
        displayName,
      };
    }

    async function runConcurrentAiAndSequentialFill(tasks, concurrency) {
      const sourceTasks = Array.isArray(tasks) ? tasks : [];
      const totalCount = sourceTasks.length;
      const maxConcurrency = Math.max(1, Math.min(10, Number(concurrency) || 1));
      const completedQueue = [];
      const queuedResultIds = new Set();
      let nextLaunchIndex = 0;
      let launchedCount = 0;
      let activeAiCount = 0;
      let completedAiCount = 0;
      let analysisSuccessCount = 0;
      let analysisFailCount = 0;
      let fillStartedCount = 0;
      let fillSuccessCount = 0;
      let fillFailCount = 0;
      let fillSkipCount = 0;
      let producersDone = false;
      let signalResolver = null;
      let producerDoneResolver = null;

      const producerDonePromise = new Promise(function (resolve) {
        producerDoneResolver = resolve;
      });

      function notifySignal() {
        if (typeof signalResolver === "function") {
          const resolve = signalResolver;
          signalResolver = null;
          resolve();
        }
      }

      function setProducersDone() {
        if (producersDone) {
          return;
        }
        producersDone = true;
        if (typeof producerDoneResolver === "function") {
          producerDoneResolver();
          producerDoneResolver = null;
        }
        notifySignal();
      }

      if (totalCount <= 0) {
        setProducersDone();
      }

      function updateProgressStatus(currentDisplayName) {
        updateFloatingProgress({
          phase: batchAutofillPhase,
          running: true,
          stopping: batchQualifiedAutofillCancelRequested === true,
          frontConcurrency: maxConcurrency,
          totalCount,
          launchedCount,
          activeAiCount,
          completedAiCount,
          analysisSuccessCount,
          analysisFailCount,
          queueCount: completedQueue.length,
          fillStartedCount,
          fillSuccessCount,
          fillFailCount,
          fillSkipCount,
          currentDisplayName: String(currentDisplayName || ""),
          failures: currentBatchFailures.slice(),
          retryableFailuresCount: currentRetryableFillFailures.length,
        });
      }

      function launchNextAiRequests() {
        while (
          activeAiCount < maxConcurrency &&
          nextLaunchIndex < totalCount &&
          batchQualifiedAutofillCancelRequested !== true
        ) {
          const index = nextLaunchIndex;
          const task = sourceTasks[index];
          nextLaunchIndex += 1;
          launchedCount += 1;
          activeAiCount += 1;
          if (typeof console !== "undefined" && typeof console.info === "function") {
            console.info("[DataBaker][batch] launch ai request", {
              index,
              displayName: String(task?.displayName || ""),
              activeAiCount,
              frontConcurrency: maxConcurrency,
              listenModel: String(config.listenModel || ""),
              compareModel: String(config.compareModel || ""),
              recognitionMode: String(config.recognitionMode || ""),
            });
          }
          updateProgressStatus("");

          Promise.resolve()
            .then(function () {
              return ai.recommend(task.item);
            })
            .then(function (recommendation) {
              analysisSuccessCount += 1;
              completedQueue.push({
                ok: true,
                index,
                record: task.record,
                item: task.item,
                recommendation: recommendation,
                processKey: task.processKey,
                displayName: task.displayName,
                completedAt: Date.now(),
              });
              queuedResultIds.add(String(task.processKey || "index:" + String(index)));
            })
            .catch(function (error) {
              analysisFailCount += 1;
              completedQueue.push({
                ok: false,
                index,
                record: task.record,
                item: task.item,
                processKey: task.processKey,
                displayName: task.displayName,
                errorMessage: error?.message || String(error),
                completedAt: Date.now(),
              });
              queuedResultIds.add(String(task.processKey || "index:" + String(index)));
            })
            .finally(function () {
              activeAiCount -= 1;
              completedAiCount += 1;
              updateProgressStatus("");
              notifySignal();

              if (batchQualifiedAutofillCancelRequested !== true) {
                launchNextAiRequests();
              }

              if (
                (batchQualifiedAutofillCancelRequested === true ||
                  nextLaunchIndex >= totalCount) &&
                activeAiCount <= 0
              ) {
                setProducersDone();
              }
            });
        }

        if (
          (batchQualifiedAutofillCancelRequested === true || nextLaunchIndex >= totalCount) &&
          activeAiCount <= 0
        ) {
          setProducersDone();
        }
      }

      async function fillLoop() {
        while (true) {
          if (batchQualifiedAutofillCancelRequested === true) {
            break;
          }

          if (completedQueue.length <= 0) {
            if (producersDone) {
              if (activeAiCount <= 0) {
                break;
              }
            } else {
              await new Promise(function (resolve) {
                signalResolver = resolve;
              });
            }
            continue;
          }

          const result = completedQueue.shift();
          if (result) {
            queuedResultIds.delete(String(result.processKey || "index:" + String(result.index || 0)));
          }

          if (batchQualifiedAutofillCancelRequested === true) {
            break;
          }

          batchAutofillPhase = "fill";
          setBatchButtonState(true, batchQualifiedAutofillCancelRequested === true);
          if (!result?.ok) {
            pushBatchFailure({
              type: "ai_failed",
              retryable: false,
              displayName: String(result?.displayName || "未命名条目"),
              errorMessage: String(result?.errorMessage || "AI 推荐失败"),
              result: null,
            });
          } else {
            fillStartedCount += 1;
            updateProgressStatus(String(result?.displayName || ""));
            const fillOutcome = await fillOneAnalyzedResult(
              result,
              fillStartedCount - 1,
              totalCount
            );
            if (fillOutcome.outcome === "success") {
              fillSuccessCount += 1;
            } else if (fillOutcome.outcome === "skip") {
              fillSkipCount += 1;
              pushBatchFailure({
                type: "skipped",
                retryable: false,
                displayName: fillOutcome.displayName,
                errorMessage: fillOutcome.errorMessage,
                result: null,
              });
            } else {
              fillFailCount += 1;
              pushBatchFailure({
                type: fillOutcome.failureType || "fill_failed",
                retryable: fillOutcome.retryable === true,
                displayName: fillOutcome.displayName,
                errorMessage: fillOutcome.errorMessage,
                result: fillOutcome.result || null,
              });
            }
          }

          updateProgressStatus(String(result?.displayName || ""));
          if (!producersDone || completedQueue.length > 0) {
            await waitBetweenBatchItems();
          }
        }
      }

      launchNextAiRequests();
      await fillLoop();
      await producerDonePromise;

      return {
        totalCount,
        launchedCount,
        activeAiCount,
        completedAiCount,
        analysisSuccessCount,
        analysisFailCount,
        fillStartedCount,
        fillSuccessCount,
        fillFailCount,
        fillSkipCount,
        bufferedCount: completedQueue.length,
        queuedResultCount: queuedResultIds.size,
        failures: currentBatchFailures.slice(),
        retryableFailuresCount: currentRetryableFillFailures.length,
        stopped: batchQualifiedAutofillCancelRequested === true,
      };
    }

    async function retryFailedFillResults() {
      if (batchQualifiedAutofillRunning) {
        ui.setStatus("连续填入运行中，请先停止或等待完成后再重试失败项。", "info");
        return { ok: false, message: "batch-running" };
      }
      const retryTargets = currentRetryableFillFailures.slice();
      if (retryTargets.length <= 0) {
        ui.setStatus("当前没有可重试的填入失败项。", "info");
        return { ok: false, message: "no-retry-target" };
      }

      batchAutofillPhase = "retry";
      batchQualifiedAutofillRunning = true;
      batchQualifiedAutofillCancelRequested = false;
      setBatchButtonState(true, false);
      ui.setStatus("正在重试填写失败内容，详情见顶部统计悬浮窗。", "info");
      updateFloatingProgress({
        phase: "retry",
        running: true,
        stopping: false,
      });

      let retrySuccessCount = 0;
      let retryFailCount = 0;
      const nextRetryableFailures = [];
      try {
        for (let index = 0; index < retryTargets.length; index += 1) {
          if (batchQualifiedAutofillCancelRequested === true) {
            nextRetryableFailures.push.apply(nextRetryableFailures, retryTargets.slice(index));
            break;
          }
          const failure = retryTargets[index];
          const result = failure?.result || null;
          if (!result?.recommendation) {
            retryFailCount += 1;
            nextRetryableFailures.push(failure);
            continue;
          }
          updateFloatingProgress({
            phase: "retry",
            currentDisplayName: String(failure.displayName || ""),
            queueCount: 0,
          });
          const retryOutcome = await fillOneAnalyzedResult(result, index, retryTargets.length);
          if (retryOutcome.outcome === "success") {
            retrySuccessCount += 1;
          } else {
            retryFailCount += 1;
            nextRetryableFailures.push({
              type: "fill_failed",
              retryable: true,
              displayName: retryOutcome.displayName || failure.displayName,
              errorMessage: retryOutcome.errorMessage || "重试填入失败",
              result: result,
            });
          }
          if (index < retryTargets.length - 1) {
            await waitBetweenBatchItems();
          }
        }

        currentRetryableFillFailures = nextRetryableFailures;
        currentBatchFailures = currentBatchFailures.filter(function (failure) {
          return !(failure.type === "fill_failed" && failure.retryable === true);
        });
        currentBatchFailures.push.apply(currentBatchFailures, nextRetryableFailures);
        ui.setStatus(
          "失败项重试完成：成功 " +
            String(retrySuccessCount) +
            " 条，失败 " +
            String(retryFailCount) +
            " 条。",
          retryFailCount > 0 ? "info" : "success"
        );
        finishFloatingProgress({
          phase: batchQualifiedAutofillCancelRequested ? "stopped" : "completed",
          failures: currentBatchFailures.slice(),
          retryableFailuresCount: currentRetryableFillFailures.length,
        });
        return { ok: true };
      } finally {
        batchQualifiedAutofillRunning = false;
        batchQualifiedAutofillCancelRequested = false;
        batchAutofillPhase = "idle";
        setBatchButtonState(false, false);
      }
    }

    async function autoFillQualifiedItemsBatch() {
      if (config.aiRecommendEnabled === false) {
        ui.setStatus("AI 推荐已在 DataBaker 设置中关闭。", "error");
        return { ok: false, message: "ai-disabled" };
      }
      if (batchQualifiedAutofillRunning) {
        return stopBatchQualifiedAutofill();
      }

      batchAutofillPhase = "analysis";
      batchQualifiedAutofillRunning = true;
      batchQualifiedAutofillCancelRequested = false;
      currentBatchFailures = [];
      currentRetryableFillFailures = [];
      lastBatchSummary = null;
      setBatchButtonState(true, false);

      try {
        ui.ensureMounted();
        ui.showBatchFloatingPanel?.();
        ui.setStatus("连续填入运行中，统一后端可能正在 AI 排队或限流重试，详情见顶部统计悬浮窗。", "info");
        updateFloatingProgress({
          phase: "fetching",
          running: true,
          stopping: false,
        });
        const refreshed = await dataApi.refreshCurrentPageData({
          pageSize: 50,
          forcePageSize: true,
        });
        if (!refreshed?.ok) {
          const message = refreshed?.message || "刷新当前页列表失败。";
          ui.setStatus(message, "error");
          currentBatchFailures.push({
            type: "refresh_failed",
            retryable: false,
            displayName: "列表刷新",
            errorMessage: message,
            result: null,
          });
          finishFloatingProgress({
            phase: "stopped",
            running: false,
            failures: currentBatchFailures.slice(),
            retryableFailuresCount: 0,
          });
          return { ok: false, message: "refresh-failed" };
        }

        const qualifiedRecords = dataApi.getQualifiedRecords(refreshed.entry).filter(function (record) {
          const key = getRecordProcessKey(record);
          if (!key) {
            return true;
          }
          return !processedQualifiedItemIds.has(key);
        });
        if (qualifiedRecords.length <= 0) {
          ui.setStatus("当前页没有可处理的质检合格数据。", "info");
          finishFloatingProgress({
            phase: "completed",
            running: false,
            totalCount: 0,
            failures: [],
            retryableFailuresCount: 0,
          });
          return { ok: true, message: "no-qualified" };
        }

        const tasks = dataApi.createItemsFromQualifiedRecords(qualifiedRecords, refreshed.entry);
        const concurrency = normalizeAutofillConcurrency(config.aiQualifiedAutofillConcurrency);
        if (typeof console !== "undefined" && typeof console.info === "function") {
          console.info("[DataBaker][batch] start", {
            frontConcurrency: concurrency,
            listenModel: String(config.listenModel || ""),
            compareModel: String(config.compareModel || ""),
            recognitionMode: String(config.recognitionMode || ""),
          });
        }
        updateFloatingProgress({
          phase: "analysis",
          totalCount: tasks.length,
          running: true,
          stopping: false,
          frontConcurrency: concurrency,
          launchedCount: 0,
          activeAiCount: 0,
          completedAiCount: 0,
        });
        const streamSummary = await runConcurrentAiAndSequentialFill(tasks, concurrency);
        if (streamSummary.stopped) {
          ui.setStatus(
            "已停止：AI 已完成 " +
              String(streamSummary.completedAiCount) +
              "/" +
              String(streamSummary.totalCount) +
              "，已填入 " +
              String(streamSummary.fillSuccessCount) +
              " 条，填入失败 " +
              String(streamSummary.fillFailCount) +
              " 条，跳过 " +
              String(streamSummary.fillSkipCount) +
              " 条，缓冲区剩余 " +
              String(streamSummary.bufferedCount) +
              " 条未填。",
            "info"
          );
          finishFloatingProgress({
            phase: "stopped",
            running: false,
            totalCount: streamSummary.totalCount,
            frontConcurrency: concurrency,
            launchedCount: streamSummary.launchedCount,
            activeAiCount: streamSummary.activeAiCount,
            completedAiCount: streamSummary.completedAiCount,
            analysisSuccessCount: streamSummary.analysisSuccessCount,
            analysisFailCount: streamSummary.analysisFailCount,
            queueCount: streamSummary.bufferedCount,
            fillStartedCount: streamSummary.fillStartedCount,
            fillSuccessCount: streamSummary.fillSuccessCount,
            fillFailCount: streamSummary.fillFailCount,
            fillSkipCount: streamSummary.fillSkipCount,
            failures: currentBatchFailures.slice(),
            retryableFailuresCount: currentRetryableFillFailures.length,
          });
          return { ok: true, message: "stopped" };
        }

        ui.setStatus(
          "当前页合格项处理完成：AI 成功 " +
            String(streamSummary.analysisSuccessCount) +
            " 条，AI 失败 " +
            String(streamSummary.analysisFailCount) +
            " 条；填入成功 " +
            String(streamSummary.fillSuccessCount) +
            " 条，填入失败 " +
            String(streamSummary.fillFailCount) +
            " 条，跳过 " +
            String(streamSummary.fillSkipCount) +
            " 条。请人工复核后保存。",
          "success"
        );
        finishFloatingProgress({
          phase: "completed",
          running: false,
          totalCount: streamSummary.totalCount,
          frontConcurrency: concurrency,
          launchedCount: streamSummary.launchedCount,
          activeAiCount: streamSummary.activeAiCount,
          completedAiCount: streamSummary.completedAiCount,
          analysisSuccessCount: streamSummary.analysisSuccessCount,
          analysisFailCount: streamSummary.analysisFailCount,
          queueCount: streamSummary.bufferedCount,
          fillStartedCount: streamSummary.fillStartedCount,
          fillSuccessCount: streamSummary.fillSuccessCount,
          fillFailCount: streamSummary.fillFailCount,
          fillSkipCount: streamSummary.fillSkipCount,
          failures: currentBatchFailures.slice(),
          retryableFailuresCount: currentRetryableFillFailures.length,
        });
        return { ok: true, message: "completed" };
      } catch (error) {
        const message = "连续处理失败：" + (error?.message || String(error));
        ui.setStatus(message, "error");
        currentBatchFailures.push({
          type: "runtime_failed",
          retryable: false,
          displayName: "连续处理",
          errorMessage: message,
          result: null,
        });
        finishFloatingProgress({
          phase: "stopped",
          running: false,
          failures: currentBatchFailures.slice(),
          retryableFailuresCount: currentRetryableFillFailures.length,
        });
        return { ok: false, message: "batch-failed" };
      } finally {
        batchQualifiedAutofillRunning = false;
        batchQualifiedAutofillCancelRequested = false;
        batchAutofillPhase = "idle";
        setBatchButtonState(false, false);
      }
    }

    const ui = uiFactory.createRuntime({
      canFillPageText: dataApi.canFillPageText,
      fillPageText: dataApi.fillPageText,
      onAutoFillQualifiedItemsBatch: autoFillQualifiedItemsBatch,
      onStopAutoFillQualifiedItemsBatch: stopBatchQualifiedAutofill,
      onAutoFillQualifiedItem: autoFillQualifiedItemsBatch,
      onRetryFailedQualifiedFillItems: retryFailedFillResults,
      onRecommend: async function () {
        const item = await dataApi.getCurrentItem();
        ui.updateCurrentItemKey(item.key);
        return ai.recommend(item);
      },
    });
    if (typeof ui.setBatchFailureRetryHandler === "function") {
      ui.setBatchFailureRetryHandler(retryFailedFillResults);
    }
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
      autoFillQualifiedItem: function () {
        return autoFillQualifiedItemsBatch();
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
