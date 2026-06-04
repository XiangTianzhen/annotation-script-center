(function () {
  if (globalThis.__ASREdgeAishellTechMinnanContentInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanContentInstalled = true;

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const DEFAULT_TIMEOUT_MS = Number(CONSTANTS.DEFAULT_AI_REQUEST_TIMEOUT_MS || 60000) || 60000;
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

  function normalizeRecognitionStrategy(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "direct_dialect") {
      return "direct_dialect";
    }
    return "mandarin_to_dialect";
  }

  function createBatchRunId() {
    return [
      "aishell",
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 8),
    ].join("-");
  }

  function normalizeBatchMode(value) {
    return String(value || "").trim().toLowerCase() === "all" ? "all" : "pending";
  }

  function getBatchModeMeta(value) {
    const mode = normalizeBatchMode(value);
    if (mode === "all") {
      return {
        mode: "all",
        label: "全部AI批量识别",
        emptyMessage: "当前分包没有可识别条目。",
      };
    }
    return {
      mode: "pending",
      label: "未完成的AI批量识别",
      emptyMessage: "当前分包没有可识别的未完成条目。",
    };
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
    options.enableThinking = false;
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
        aiRecommendRecognitionStrategy: "mandarin_to_dialect",
        aiQualifiedAutofillConcurrency: 5,
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
    merged.aiRecommendRecognitionStrategy = normalizeRecognitionStrategy(
      merged.aiRecommendRecognitionStrategy || merged.recognitionStrategy
    );
    merged.recognitionStrategy = merged.aiRecommendRecognitionStrategy;
    merged.recognitionMode = merged.aiRecommendPipelineMode;
    merged.pipelineMode = merged.aiRecommendPipelineMode;
    merged.aiQualifiedAutofillConcurrency = Math.max(
      1,
      Math.floor(Number(merged.aiQualifiedAutofillConcurrency || 5) || 5)
    );
    merged.aiRecommendRequestTimeoutMs = Math.max(
      1000,
      Number(merged.aiRecommendRequestTimeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
    );
    return {
      config: merged,
      settings: settings || {},
      enabled:
        settings?.platforms?.aishellTech?.enabled !== false &&
        merged.enabled !== false &&
        merged.aiRecommendEnabled !== false,
    };
  }

  function createRuntime(config) {
    const dataApiFactory = globalThis.__ASREdgeAishellTechMinnanDataApi;
    const aiFactory = globalThis.__ASREdgeAishellTechMinnanAiRecommendation;
    const batchWindowFactory = globalThis.__ASREdgeAishellTechMinnanBatchWindow;
    const diagnosticsFactory = globalThis.__ASREdgeAishellTechMinnanDiagnostics || {};
    const uiFactory = globalThis.__ASREdgeAishellTechMinnanUiPanel;
    const shortcutsFactory = globalThis.__ASREdgeAishellTechMinnanShortcuts;
    const buildBatchFailureEntry =
      typeof diagnosticsFactory.buildBatchFailureEntry === "function"
        ? diagnosticsFactory.buildBatchFailureEntry
        : function (input) {
            const source = input && typeof input === "object" ? input : {};
            return {
              displayName: source.task?.displayName || "未知条目",
              message: source.message || "失败",
              stage: source.stage || "unknown",
              stageLabel: source.stage || "unknown",
              detailRows: [],
              rawJson:
                source.error?.rawResponse && typeof source.error.rawResponse === "object"
                  ? source.error.rawResponse
                  : {},
            };
          };

    if (
      !dataApiFactory?.createRuntime ||
      !aiFactory?.createRuntime ||
      !batchWindowFactory?.createRollingBatchWindow ||
      !uiFactory?.createRuntime
    ) {
      return null;
    }

    const dataApi = dataApiFactory.createRuntime();
    const aiClient = aiFactory.createRuntime({
      endpoint: config.aiRecommendEndpoint,
      timeoutMs: config.aiRecommendRequestTimeoutMs,
      settings: config.settings || {},
      modelMode: config.aiRecommendPipelineMode,
      recognitionStrategy: config.aiRecommendRecognitionStrategy,
      recognitionMode: config.aiRecommendPipelineMode,
      listenModel: config.aiRecommendListenModel,
      compareModel: config.aiRecommendCompareModel,
      singleModel: config.aiRecommendSingleModel,
      enableThinking: false,
      aiOptions: buildAiOptions(config),
    });

    const panel = uiFactory.createRuntime({
      onRecommend: handleRecommend,
      onBatchRecommendAll: handleBatchRecommendAll,
      onBatchRecommendPending: handleBatchRecommendPending,
      onBatchStop: handleBatchStop,
      canFillPageText: dataApi.canFillPageText,
      fillPageText: dataApi.fillPageText,
      fillAndSaveCurrent: dataApi.fillAndSaveCurrent,
    });
    const shortcuts = shortcutsFactory?.createRuntime
        ? shortcutsFactory.createRuntime({
          shortcuts: config.shortcuts || {},
          actions: {
            requestAiRecommend: handleRecommend,
            autoFillQualifiedItem: handleBatchRecommendPending,
            copyHeardText: panel.copyHeardText,
            copyRecommendedText: panel.copyRecommendedText,
            fillRecommendedText: panel.fillRecommendedText,
            ignoreAiResult: panel.ignoreAiResult,
            showStatus: panel.setStatus,
          },
        })
      : null;

    let mountTimer = null;
    let currentBusyState = {
      single: false,
      batch: false,
    };
    let batchStopRequested = false;
    let activeBatchContext = null;

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
        panel.setStatus(error?.message || String(error), "error", error?.rawResponse || null);
      } finally {
        syncBusyState({ single: false });
      }
    }

    async function handleBatchStop() {
      if (currentBusyState.batch !== true) {
        panel.setStatus("当前没有正在运行的批量识别。", "warning");
        return;
      }
      batchStopRequested = true;
      if (activeBatchContext?.scheduler?.cancelPending) {
        activeBatchContext.scheduler.cancelPending("批量识别已手动停止。");
      }
      const batchMeta = getBatchModeMeta(activeBatchContext?.mode);
      panel.setStatus(
        "已请求停止，将在当前条完成后结束本轮" + batchMeta.label + "。",
        "warning"
      );
      panel.updateBatch({
        phaseText: batchMeta.label + "停止中",
        running: true,
      });
    }

    async function runBatchRecommend(mode) {
      const batchMeta = getBatchModeMeta(mode);
      syncBusyState({ batch: true });
      batchStopRequested = false;
      panel.setStatus("正在准备" + batchMeta.label + "...", "info");
      try {
        const tasks = await dataApi.getBatchTasksForPackage({
          mode: batchMeta.mode,
        });
        if (!tasks.length) {
          throw new Error(batchMeta.emptyMessage);
        }
        const batchRunId = createBatchRunId();
        const batchConcurrency = Math.max(
          1,
          Number(config.aiQualifiedAutofillConcurrency || 5) || 5
        );
        const scheduler = dataApi.createRateLimitedTaskScheduler({
          concurrency: batchConcurrency,
          staggerMs: 50,
        });
        const requestWindow = batchWindowFactory.createRollingBatchWindow(
          tasks,
          batchConcurrency
        );
        activeBatchContext = {
          mode: batchMeta.mode,
          scheduler: scheduler,
          batchRunId: batchRunId,
        };
        const failures = [];
        const pendingResults = [];
        const resultWaiters = [];
        let consumedCount = 0;
        let producersDone = false;
        let activeProducerCount = 0;

        function enqueueBatchResult(entry) {
          if (resultWaiters.length > 0) {
            const resolve = resultWaiters.shift();
            resolve(entry);
            return;
          }
          pendingResults.push(entry);
        }

        function nextBatchResult() {
          if (pendingResults.length > 0) {
            return Promise.resolve(pendingResults.shift());
          }
          if (producersDone === true) {
            return Promise.resolve(null);
          }
          return new Promise(function (resolve) {
            resultWaiters.push(resolve);
          });
        }

        function markProducersDoneIfNeeded() {
          const snapshot = requestWindow.getSnapshot();
          if (snapshot.nextIndex >= tasks.length && activeProducerCount === 0) {
            producersDone = true;
            while (resultWaiters.length > 0) {
              const resolve = resultWaiters.shift();
              resolve(null);
            }
          }
        }

        function launchBatchTasks(taskEntries) {
          const source = Array.isArray(taskEntries) ? taskEntries : [];
          if (batchStopRequested === true) {
            return;
          }
          source.forEach(function (task) {
            activeProducerCount += 1;
            scheduler
              .run(async function () {
                if (batchStopRequested === true) {
                  throw new Error("批量识别已手动停止。");
                }
                const item = await dataApi.getItemByTask(task, {
                  includeCurrentInput: false,
                });
                if (!item) {
                  throw new Error("无法定位批量条目。");
                }
                item.batchRunId = batchRunId;
                item.batchItemIndex = Number(task.index || 0) || 0;
                item.batchProcessKey =
                  "task-item:" + String(item.taskItemId || task.taskItemId || task.index || "unknown");
                item.clientRequestId = [
                  batchRunId,
                  String(item.batchItemIndex + 1),
                  String(item.taskItemId || "unknown"),
                ].join(":");
                item.frontConcurrency = batchConcurrency;
                const result = await aiClient.recommend(item);
                enqueueBatchResult({
                  ok: true,
                  task: task,
                  result: result,
                });
              })
              .catch(function (error) {
                const message = error?.message || String(error);
                if (batchStopRequested === true && message.indexOf("手动停止") >= 0) {
                  return;
                }
                enqueueBatchResult({
                  ok: false,
                  task: task,
                  error: error,
                });
              })
              .finally(function () {
                activeProducerCount = Math.max(0, activeProducerCount - 1);
                markProducersDoneIfNeeded();
              });
          });
          markProducersDoneIfNeeded();
        }

        panel.updateBatch({
          phaseText: batchMeta.label + "开始",
          total: tasks.length,
          completed: 0,
          failed: 0,
          currentText: tasks[0].displayName,
          failures: failures,
          running: true,
        });

        launchBatchTasks(requestWindow.takeUntilCapacity());

        while (consumedCount < tasks.length) {
          const entry = await nextBatchResult();
          if (!entry) {
            if (producersDone === true) {
              break;
            }
            continue;
          }
          if (batchStopRequested === true) {
            break;
          }
          const task = entry.task;
          panel.updateBatch({
            phaseText: entry.ok === true ? batchMeta.label + "回填保存中" : batchMeta.label + "当前条失败",
            total: tasks.length,
            completed: consumedCount,
            failed: failures.length,
            currentText: task.displayName,
            failures: failures,
            running: true,
          });
          if (entry.ok !== true) {
            consumedCount += 1;
            failures.push(
              buildBatchFailureEntry({
                task: task,
                stage: "ai_request",
                message: entry.error?.message || String(entry.error),
                error: entry.error,
                batchConcurrency: batchConcurrency,
              })
            );
            panel.updateBatch({
              phaseText: batchMeta.label + "当前条失败",
              total: tasks.length,
              completed: consumedCount,
              failed: failures.length,
              currentText: task.displayName,
              failures: failures,
              running: true,
            });
          } else {
            let switchResult = null;
            let saveResult = null;
            let failureStage = "select_task";
            try {
              panel.renderResult(entry.result);
              switchResult = await dataApi.selectTask(task, {
                timeoutMs: 12000,
                maxAttempts: 4,
              });
              if (switchResult?.ok === false) {
                throw new Error(switchResult.message || "切换批量条目失败。");
              }
              failureStage = "save_current";
              saveResult = await dataApi.fillAndSaveCurrent(
                entry.result.recommendedText || "",
                {
                  timeoutMs: 15000,
                }
              );
              if (saveResult?.ok === false) {
                throw new Error(saveResult.message || "填入并保存失败。");
              }
              consumedCount += 1;
              panel.updateBatch({
                phaseText: batchMeta.label + "已识别并保存",
                total: tasks.length,
                completed: consumedCount,
                failed: failures.length,
                currentText: task.displayName,
                failures: failures,
                running: true,
              });
            } catch (error) {
              consumedCount += 1;
              failures.push(
                buildBatchFailureEntry({
                  task: task,
                  stage: failureStage,
                  message: error?.message || String(error),
                  error: error,
                  result: entry.result,
                  switchResult: switchResult,
                  saveResult: saveResult,
                  batchConcurrency: batchConcurrency,
                })
              );
              panel.updateBatch({
                phaseText: batchMeta.label + "当前条失败",
                total: tasks.length,
                completed: consumedCount,
                failed: failures.length,
                currentText: task.displayName,
                failures: failures,
                running: true,
              });
            }
          }
          launchBatchTasks(requestWindow.markConsumed());
          markProducersDoneIfNeeded();
        }

        if (batchStopRequested === true) {
          panel.updateBatch({
            phaseText: batchMeta.label + "已停止",
            total: tasks.length,
            completed: consumedCount,
            failed: failures.length,
            currentText: "",
            failures: failures,
            running: false,
          });
          panel.setStatus("本轮" + batchMeta.label + "已按请求停止。", "warning");
          return;
        }

        panel.updateBatch({
          phaseText: batchMeta.label + "已完成",
          total: tasks.length,
          completed: consumedCount,
          failed: failures.length,
          currentText: "",
          failures: failures,
          running: false,
        });
        panel.setStatus(
          failures.length > 0
            ? "当前分包" + batchMeta.label + "完成，存在失败条目。"
            : "当前分包" + batchMeta.label + "完成。",
          failures.length > 0 ? "warning" : "success"
        );
      } catch (error) {
        panel.setStatus(error?.message || String(error), "error");
      } finally {
        activeBatchContext = null;
        batchStopRequested = false;
        syncBusyState({ batch: false });
      }
    }

    async function handleBatchRecommendAll() {
      return runBatchRecommend("all");
    }

    async function handleBatchRecommendPending() {
      return runBatchRecommend("pending");
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
      shortcuts?.start?.();
      ensureMounted();
      mountTimer = window.setInterval(ensureMounted, 1200);
      panel.setStatus("闽南语助手已就绪。", "success");
    }

    function stop() {
      if (mountTimer) {
        window.clearInterval(mountTimer);
        mountTimer = null;
      }
      shortcuts?.stop?.();
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
      const runtime = createRuntime(
        Object.assign({}, runtimeConfig.config || {}, {
          settings: runtimeConfig.settings || {},
        })
      );
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
