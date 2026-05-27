(function () {
  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const DEFAULT_TIMEOUT_MS = Number(CONSTANTS.DEFAULT_AI_REQUEST_TIMEOUT_MS || 120000) || 120000;
  const SCRIPT_ID =
    CONSTANTS.AISHELL_TECH_MINNAN_SCRIPT_ID || "aishellTechMinnanAssistant";
  const PLATFORM_ID = CONSTANTS.AISHELL_TECH_PLATFORM_ID || "aishellTech";
  const RECOMMEND_PATH =
    CONSTANTS.AISHELL_TECH_AI_RECOMMEND_PATH ||
    "/api/aishell-tech/minnan-helper/ai/recommend";

  let activeRuntime = null;
  let evaluateTimer = null;
  let lastUrl = location.href;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeRecognitionMode(value) {
    const text = String(value || "").trim().toLowerCase();
    return text === "omni_single" ? "omni_single" : "two_stage";
  }

  function getConcurrencyRule(config) {
    const helper =
      typeof CONSTANTS.getDataBakerAiQualifiedAutofillConcurrencyRule === "function"
        ? CONSTANTS.getDataBakerAiQualifiedAutofillConcurrencyRule
        : null;
    if (helper) {
      return helper({
        recognitionMode: config.aiRecommendPipelineMode,
        listenModel: config.aiRecommendListenModel,
        singleModel: config.aiRecommendSingleModel,
      });
    }
    return {
      min: 1,
      max: 25,
      defaultValue: 15,
      modelType: "omni",
    };
  }

  function normalizeConcurrency(value, config) {
    const helper =
      typeof CONSTANTS.normalizeDataBakerAiQualifiedAutofillConcurrency === "function"
        ? CONSTANTS.normalizeDataBakerAiQualifiedAutofillConcurrency
        : null;
    if (helper) {
      return helper(value, {
        recognitionMode: config.aiRecommendPipelineMode,
        listenModel: config.aiRecommendListenModel,
        singleModel: config.aiRecommendSingleModel,
      });
    }
    const rule = getConcurrencyRule(config);
    const numeric = Number(value);
    const base = Number.isFinite(numeric) ? Math.round(numeric) : rule.defaultValue;
    return Math.max(rule.min, Math.min(rule.max, base));
  }

  function isMarkPage() {
    return (
      location.hostname === "mark.aishelltech.com" &&
      String(location.pathname || "").toLowerCase() === "/mytask/mark"
    );
  }

  function shouldRun() {
    return isMarkPage();
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
        aiQualifiedAutofillConcurrency: 15,
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
        shortcuts: {},
      },
      defaults || {}
    );
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
    merged.aiQualifiedAutofillConcurrency = normalizeConcurrency(merged.aiQualifiedAutofillConcurrency, merged);
    merged.shortcuts = merged.shortcuts && typeof merged.shortcuts === "object" ? merged.shortcuts : {};
    return {
      settings: settings,
      config: merged,
      enabled:
        settings?.platforms?.aishellTech?.enabled !== false &&
        merged.enabled !== false &&
        merged.aiRecommendEnabled !== false,
    };
  }

  function formatElapsedMs(value) {
    const totalMs = Number(value || 0);
    const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function createBatchRunId() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      "-",
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
      "-",
      Math.random().toString(36).slice(2, 8),
    ].join("");
  }

  function createClientRequestId(batchRunId, batchItemIndex) {
    return [batchRunId, String(batchItemIndex + 1)].join("-");
  }

  function createRuntime(config) {
    const dataApiFactory = globalThis.__ASREdgeAishellTechMinnanDataApi;
    const aiFactory = globalThis.__ASREdgeAishellTechMinnanAiRecommendation;
    const uiFactory = globalThis.__ASREdgeAishellTechMinnanUiPanel;
    const shortcutsFactory = globalThis.__ASREdgeAishellTechMinnanShortcuts;

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

    let mountTimer = null;
    let trackTimer = null;
    let observer = null;
    let batchRunning = false;
    let batchStopRequested = false;
    let batchStartedAt = 0;
    let lastBatchSnapshot = null;

    function showStatus(message, tone) {
      panel.setStatus(message, tone);
    }

    function buildBatchSnapshot(extra) {
      const snapshot = Object.assign(
        {
          total: 0,
          completed: 0,
          failed: 0,
          concurrency: config.aiQualifiedAutofillConcurrency,
          currentText: "",
          failures: [],
          phaseText: "空闲",
          tone: "running",
        },
        lastBatchSnapshot || {},
        extra || {}
      );
      snapshot.elapsedText = formatElapsedMs(Date.now() - batchStartedAt);
      return snapshot;
    }

    function updateBatchSnapshot(extra) {
      lastBatchSnapshot = buildBatchSnapshot(extra);
      panel.updateBatch(lastBatchSnapshot);
    }

    function finishBatch(extra) {
      const snapshot = buildBatchSnapshot(extra);
      panel.updateBatch(snapshot);
      lastBatchSnapshot = snapshot;
    }

    async function requestAiRecommend() {
      const item = await dataApi.getCurrentItem();
      if (!item) {
        throw new Error("当前页面尚未定位到选中条目，请先点击左侧条目。");
      }
      panel.updateCurrentItemKey(item.key);
      return aiClient.recommend(item);
    }

    function createBatchItemPayload(task, batchRunId, batchItemIndex) {
      return Object.assign({}, task.item, {
        batchRunId: batchRunId,
        batchItemIndex: batchItemIndex,
        batchProcessKey: task.processKey,
        clientRequestId: createClientRequestId(batchRunId, batchItemIndex),
        frontConcurrency: config.aiQualifiedAutofillConcurrency,
      });
    }

    async function startProducer(tasks, concurrency) {
      const results = tasks.map(function () {
        let resolvePromise = null;
        let rejectPromise = null;
        const promise = new Promise(function (resolve, reject) {
          resolvePromise = resolve;
          rejectPromise = reject;
        });
        return {
          promise: promise,
          resolve: resolvePromise,
          reject: rejectPromise,
        };
      });
      let cursor = 0;

      async function worker() {
        while (cursor < tasks.length) {
          const currentIndex = cursor;
          cursor += 1;
          const task = tasks[currentIndex];
          try {
            const result = await aiClient.recommend(
              createBatchItemPayload(task, task.batchRunId, currentIndex)
            );
            results[currentIndex].resolve(result);
          } catch (error) {
            results[currentIndex].reject(error);
          }
        }
      }

      const workers = [];
      const workerCount = Math.max(1, Math.min(concurrency, tasks.length));
      for (let index = 0; index < workerCount; index += 1) {
        workers.push(worker());
      }
      return {
        results: results,
        completed: Promise.allSettled(workers),
      };
    }

    async function runBatch() {
      const tasks = dataApi.getBatchTasksFromCurrentSelection();
      if (!tasks.length) {
        throw new Error("当前分包从选中条开始没有可处理的未完成条目。");
      }
      const batchRunId = createBatchRunId();
      batchStartedAt = Date.now();
      batchStopRequested = false;
      batchRunning = true;
      panel.setBatchButtons(true, false);
      lastBatchSnapshot = {
        total: tasks.length,
        completed: 0,
        failed: 0,
        failures: [],
      };
      updateBatchSnapshot({
        total: tasks.length,
        completed: 0,
        failed: 0,
        failures: [],
        phaseText: "AI 并发分析",
        currentText: tasks[0]?.displayName || "",
        tone: "running",
      });

      tasks.forEach(function (task) {
        task.batchRunId = batchRunId;
      });
      const producer = await startProducer(tasks, config.aiQualifiedAutofillConcurrency);
      const failures = [];
      let completedCount = 0;

      for (let index = 0; index < tasks.length; index += 1) {
        const task = tasks[index];
        if (batchStopRequested) {
          break;
        }
        updateBatchSnapshot({
          completed: completedCount,
          failed: failures.length,
          failures: failures,
          phaseText: "等待 AI 结果",
          currentText: task.displayName,
        });
        let result = null;
        try {
          result = await producer.results[index].promise;
        } catch (error) {
          failures.push({
            displayName: task.displayName,
            message: error?.message || String(error),
          });
          updateBatchSnapshot({
            completed: completedCount,
            failed: failures.length,
            failures: failures,
            phaseText: "AI 失败后停止",
            currentText: task.displayName,
            tone: "error",
          });
          batchStopRequested = true;
          break;
        }

        if (batchStopRequested) {
          break;
        }

        const currentItem = await dataApi.getCurrentItem();
        if (!currentItem || normalizeText(currentItem.taskItemId) !== normalizeText(task.item.taskItemId)) {
          const selectResult = await dataApi.selectRecord(task.item.taskItemId);
          if (selectResult?.ok !== true) {
            failures.push({
              displayName: task.displayName,
              message: selectResult?.message || "切换条目失败。",
            });
            batchStopRequested = true;
            break;
          }
        }

        updateBatchSnapshot({
          completed: completedCount,
          failed: failures.length,
          failures: failures,
          phaseText: "填入并保存",
          currentText: task.displayName,
        });

        const fillResult = dataApi.fillPageText(result.recommendedText || "");
        if (fillResult?.ok === false) {
          failures.push({
            displayName: task.displayName,
            message: fillResult.message || "填入推荐文本失败。",
          });
          batchStopRequested = true;
          break;
        }

        const saveResult = await dataApi.clickSaveAndWait(task.item.taskItemId, 15000);
        if (saveResult?.ok !== true) {
          failures.push({
            displayName: task.displayName,
            message: saveResult?.message || "页面保存失败。",
          });
          batchStopRequested = true;
          break;
        }

        completedCount += 1;
        updateBatchSnapshot({
          completed: completedCount,
          failed: failures.length,
          failures: failures,
          phaseText: batchStopRequested ? "停止中" : "已保存当前条",
          currentText: task.displayName,
        });
        await delay(120);
      }

      await producer.completed;
      batchRunning = false;
      panel.setBatchButtons(false, false);

      if (failures.length > 0) {
        finishBatch({
          completed: completedCount,
          failed: failures.length,
          failures: failures,
          phaseText: batchStopRequested ? "失败后已停止" : "失败",
          currentText: "",
          tone: "error",
        });
        showStatus("批量处理已停止：" + failures[0].message, "error");
        return;
      }

      if (batchStopRequested) {
        finishBatch({
          completed: completedCount,
          failed: 0,
          failures: [],
          phaseText: "已手动停止",
          currentText: "",
          tone: "stopped",
        });
        showStatus("批量处理已停止。", "info");
        return;
      }

      finishBatch({
        completed: completedCount,
        failed: 0,
        failures: [],
        phaseText: "已完成",
        currentText: "",
        tone: "success",
      });
      showStatus("当前分包批量推荐并保存已完成。", "success");
    }

    async function handleBatchStart() {
      if (batchRunning) {
        return;
      }
      try {
        showStatus("正在准备批量任务...", "info");
        await runBatch();
      } catch (error) {
        batchRunning = false;
        panel.setBatchButtons(false, false);
        finishBatch({
          phaseText: "启动失败",
          tone: "error",
          failures: [
            {
              displayName: "",
              message: error?.message || String(error),
            },
          ],
          failed: 1,
        });
        showStatus(error?.message || String(error), "error");
      }
    }

    async function handleBatchStop() {
      if (!batchRunning) {
        return;
      }
      batchStopRequested = true;
      panel.setBatchButtons(true, true);
      showStatus("停止信号已记录，将在当前条保存完成后停止。", "info");
    }

    const panel = uiFactory.createRuntime({
      canFillPageText: function () {
        return dataApi.canFillPageText();
      },
      fillPageText: function (text) {
        return dataApi.fillPageText(text);
      },
      onBatchStart: handleBatchStart,
      onBatchStop: handleBatchStop,
      onRecommend: requestAiRecommend,
    });

    const shortcuts =
      shortcutsFactory && typeof shortcutsFactory.createRuntime === "function"
        ? shortcutsFactory.createRuntime({
            shortcuts: config.shortcuts,
            actions: {
              requestAiRecommend: function () {
                return panel.requestAiRecommend();
              },
              autoFillQualifiedItem: handleBatchStart,
              copyHeardText: function () {
                return panel.copyHeardText();
              },
              copyRecommendedText: function () {
                return panel.copyRecommendedText();
              },
              fillRecommendedText: function () {
                panel.fillRecommendedText();
              },
              ignoreAiResult: function () {
                panel.ignoreAiResult();
              },
              showStatus: showStatus,
            },
          })
        : null;

    function ensureMounted() {
      if (!panel.ensureMounted()) {
        return;
      }
      const itemPromise = dataApi.getCurrentItem();
      Promise.resolve(itemPromise)
        .then(function (item) {
          if (item?.key) {
            panel.updateCurrentItemKey(item.key);
          }
        })
        .catch(function () {});
    }

    function start() {
      dataApi.start();
      panel.ensureMounted();
      ensureMounted();
      if (shortcuts) {
        shortcuts.start();
      }
      observer = new MutationObserver(function () {
        ensureMounted();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
      mountTimer = window.setInterval(ensureMounted, 1200);
      trackTimer = window.setInterval(function () {
        Promise.resolve(dataApi.getCurrentItem())
          .then(function (item) {
            if (item?.key) {
              panel.updateCurrentItemKey(item.key);
            }
          })
          .catch(function () {});
      }, 600);
      showStatus("Aishell 闽南语助手已就绪。", "success");
    }

    function stop() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (mountTimer) {
        window.clearInterval(mountTimer);
        mountTimer = null;
      }
      if (trackTimer) {
        window.clearInterval(trackTimer);
        trackTimer = null;
      }
      if (shortcuts) {
        shortcuts.stop();
      }
      dataApi.stop();
      panel.remove();
      batchRunning = false;
      batchStopRequested = false;
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
    if (!shouldRun()) {
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

  function scheduleEvaluatePage() {
    if (evaluateTimer) {
      window.clearTimeout(evaluateTimer);
    }
    evaluateTimer = window.setTimeout(function () {
      evaluateTimer = null;
      void evaluatePage().catch(function (error) {
        console.warn("[Aishell][minnan-helper] evaluate failed", error?.message || error);
      });
    }, 80);
  }

  function installUrlWatch() {
    const nativePushState = history.pushState;
    const nativeReplaceState = history.replaceState;

    function notifyUrlMaybeChanged() {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        scheduleEvaluatePage();
      }
    }

    history.pushState = function () {
      const result = nativePushState.apply(this, arguments);
      notifyUrlMaybeChanged();
      return result;
    };

    history.replaceState = function () {
      const result = nativeReplaceState.apply(this, arguments);
      notifyUrlMaybeChanged();
      return result;
    };

    window.addEventListener("popstate", notifyUrlMaybeChanged);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      installUrlWatch();
      scheduleEvaluatePage();
    });
  } else {
    installUrlWatch();
    scheduleEvaluatePage();
  }
})();
