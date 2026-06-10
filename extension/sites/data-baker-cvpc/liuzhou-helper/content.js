(function () {
  if (globalThis.ASREdgeDataBakerCvpcLiuzhouContent) {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = globalThis.ASREdgeDataBakerCvpcLiuzhouContent;
    }
    return;
  }

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const dataApiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi || null;
  const aiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouAiRecommendation || null;
  const segmentFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouSegmentation || null;
  const uiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouUiPanel || null;
  const shortcutFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts || null;
  const concurrentRequestStreamFactory = globalThis.ASREdgeConcurrentAiRequestStream || null;
  const editingTabTipGuardApi = globalThis.ASREdgeDataBakerCvpcEditingTabTipGuard || null;
  const SCRIPT_ID =
    CONSTANTS.DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID || "dataBakerCvpcLiuzhouAssistant";
  const AI_PATH =
    CONSTANTS.DATA_BAKER_CVPC_AI_RECOMMEND_PATH ||
    "/api/data-baker-cvpc/liuzhou-helper/ai/recommend";
  const SEGMENT_PATH =
    CONSTANTS.DATA_BAKER_CVPC_SEGMENT_PREVIEW_PATH ||
    "/api/data-baker-cvpc/liuzhou-helper/segment/preview";
  const DEFAULT_TIMEOUT_MS = Number(CONSTANTS.DEFAULT_AI_REQUEST_TIMEOUT_MS || 60000) || 60000;
  const MISSING_AUDIO_MESSAGE =
    dataApiFactory?.MISSING_AUDIO_MESSAGE ||
    "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";
  const UI_COPY = {
    recommendReady: "当前段识别结果已生成。",
    recommendRequired: "请先完成当前段识别。",
    previewBusy: "正在生成当前音频分段建议...",
    previewReady: "分段建议已生成，请先复核后再应用到页面。",
    previewFailedPrefix: "生成分段建议失败：",
    previewAutoApplyFailedPrefix: "分段建议已生成，但自动应用失败：",
    previewFeatureDisabled: "当前已关闭分段建议功能。",
  };

  let runtime = null;
  let routeTimer = null;
  let audioRefreshTimer = null;
  let audioRefreshAttempts = 0;
  let lastRecommendation = null;
  let activeBatchController = null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeOptionalNumber(value) {
    const text = normalizeText(value);
    if (!text) {
      return undefined;
    }
    const number = Number(text);
    return Number.isFinite(number) ? number : undefined;
  }

  function normalizeOptionalInteger(value) {
    const text = normalizeText(value);
    if (!text) {
      return undefined;
    }
    const number = Number(text);
    return Number.isFinite(number) ? Math.round(number) : undefined;
  }

  function normalizeStopSequences(value) {
    const text = normalizeText(value);
    if (!text) {
      return undefined;
    }
    const items = text
      .split(/\r?\n|,/)
      .map(function (item) {
        return normalizeText(item);
      })
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }

  function buildStageParams(prefix, current, defaults) {
    const source = current && typeof current === "object" ? current : {};
    const fallback = defaults && typeof defaults === "object" ? defaults : {};
    const params = {};
    [
      [prefix + "Temperature", "temperature", normalizeOptionalNumber],
      [prefix + "TopP", "top_p", normalizeOptionalNumber],
      [prefix + "MaxTokens", "max_tokens", normalizeOptionalInteger],
      [prefix + "MaxCompletionTokens", "max_completion_tokens", normalizeOptionalInteger],
      [prefix + "PresencePenalty", "presence_penalty", normalizeOptionalNumber],
      [prefix + "FrequencyPenalty", "frequency_penalty", normalizeOptionalNumber],
      [prefix + "Seed", "seed", normalizeOptionalInteger],
      [prefix + "StopSequences", "stop", normalizeStopSequences],
    ].forEach(function (definition) {
      const value = definition[2](source[definition[0]]);
      if (value !== undefined) {
        params[definition[1]] = value;
        return;
      }
      const fallbackValue = definition[2](fallback[definition[1]]);
      if (fallbackValue !== undefined) {
        params[definition[1]] = fallbackValue;
      }
    });
    return params;
  }

  function buildStageConfig(prefix, current, defaults, modelFallback) {
    const source = current && typeof current === "object" ? current : {};
    const fallback = defaults && typeof defaults === "object" ? defaults : {};
    const stage = {};
    const model = normalizeText(source[prefix + "Model"] || fallback.model || modelFallback);
    const prompt = String(source[prefix + "Prompt"] || fallback.prompt || "");
    const includeLexiconReference =
      source[prefix + "IncludeLexiconReference"] !== undefined
        ? source[prefix + "IncludeLexiconReference"] === true
        : fallback.includeLexiconReference === true;
    const params = buildStageParams(prefix, source, fallback.params || fallback);
    if (model) {
      stage.model = model;
    }
    if (prompt) {
      stage.prompt = prompt;
    }
    if (prefix === "aiRecommendListen") {
      stage.includeLexiconReference = includeLexiconReference;
    }
    if (Object.keys(params).length > 0) {
      stage.params = params;
    }
    return stage;
  }

  function buildAiStagesConfig(current, defaults) {
    const source = current && typeof current === "object" ? current : {};
    const fallback = defaults && typeof defaults === "object" ? defaults : {};
    return {
      listen: buildStageConfig(
        "aiRecommendListen",
        source,
        fallback.listen || {},
        fallback.listen?.model || source.aiRecommendModel || "qwen3.5-omni-plus"
      ),
      refine: buildStageConfig(
        "aiRecommendRefine",
        source,
        fallback.refine || {},
        fallback.refine?.model || "qwen3.5-plus"
      ),
    };
  }

  function resolveRecommendationFillTarget(result, targetKey) {
    const source = result && typeof result === "object" ? result : {};
    switch (String(targetKey || "")) {
      case "audioDialectText":
        return {
          targetField: "dialect",
          text: String(source.audioDialectText || source.dialectText || ""),
          tokens: Array.isArray(source.audioDialectTokens) ? source.audioDialectTokens.slice() : [],
        };
      case "audioMandarinText":
        return {
          targetField: "mandarin",
          text: String(source.audioMandarinText || source.mandarinText || ""),
        };
      case "refinedDialectText":
        return {
          targetField: "dialect",
          text: String(source.refinedDialectText || source.dialectText || ""),
          tokens: Array.isArray(source.refinedDialectTokens) ? source.refinedDialectTokens.slice() : [],
        };
      case "refinedMandarinText":
        return {
          targetField: "mandarin",
          text: String(
            source.refinedMandarinText || source.mandarinText || source.audioMandarinText || ""
          ),
        };
      default:
        return null;
    }
  }

  function resolveBatchRecommendationTexts(result) {
    const source = result && typeof result === "object" ? result : {};
    return {
      dialectText: String(
        source.refinedDialectText || source.dialectText || source.audioDialectText || ""
      ),
      dialectTokens: Array.isArray(source.refinedDialectTokens)
        ? source.refinedDialectTokens.slice()
        : Array.isArray(source.audioDialectTokens)
        ? source.audioDialectTokens.slice()
        : [],
      mandarinText: String(
        source.refinedMandarinText || source.mandarinText || source.audioMandarinText || ""
      ),
    };
  }

  function buildRecommendationFailurePayload(error) {
    if (error?.payload && typeof error.payload === "object") {
      return error.payload;
    }
    return {
      success: false,
      message: error && error.message ? String(error.message) : String(error || "柳州话 AI 推荐失败。"),
    };
  }

  function handleRecommendationFailure(runtimeContext, error) {
    const payload = buildRecommendationFailurePayload(error);
    runtimeContext?.ui?.renderRecommendation?.(payload);
    runtimeContext?.ui?.setStatus?.(
      "当前段 AI 推荐失败：" + (error && error.message ? error.message : String(error)),
      "error"
    );
    return payload;
  }

  function scheduleRuntimeReload(runtimeContext) {
    if (typeof runtimeContext?.scheduleReload === "function") {
      runtimeContext.scheduleReload();
      return;
    }
    if (typeof runtimeContext?.reloadPage === "function") {
      runtimeContext.reloadPage();
      return;
    }
    try {
      globalThis.location.reload();
    } catch (_error) {
      // Ignore reload failures in stale page or test contexts.
    }
  }

  async function maybeAutoApplyPreview(runtimeContext, preview) {
    const currentRuntime = runtimeContext && typeof runtimeContext === "object" ? runtimeContext : null;
    const proposedSegments = Array.isArray(preview?.proposedSegments) ? preview.proposedSegments : [];
    if (currentRuntime?.config?.segmentPreviewAutoApplyEnabled !== true) {
      return {
        attempted: false,
        ok: false,
        reason: "disabled",
      };
    }
    if (!currentRuntime?.dataApi?.applySegmentPreview || proposedSegments.length <= 0) {
      return {
        attempted: false,
        ok: false,
        reason: "empty",
      };
    }
    const result = await currentRuntime.dataApi.applySegmentPreview(preview);
    if (result?.ok) {
      currentRuntime.segment?.clearPreview?.();
      currentRuntime.ui?.renderPreview?.(null);
      currentRuntime.ui?.setStatus?.(result.message, "success");
      scheduleRuntimeReload(currentRuntime);
      return {
        attempted: true,
        ok: true,
        result: result,
      };
    }
    currentRuntime.ui?.setStatus?.(
      UI_COPY.previewAutoApplyFailedPrefix + String(result?.message || "未知错误"),
      "error"
    );
    return {
      attempted: true,
      ok: false,
      result: result,
    };
  }

  function createBatchRecommendController(options) {
    const deps = options && typeof options === "object" ? options : {};
    const dataApi = deps.dataApi || null;
    const ai = deps.ai || null;
    const ui = deps.ui || null;
    const streamFactory = deps.concurrentRequestStreamFactory || null;
    const reloadPage = typeof deps.reloadPage === "function" ? deps.reloadPage : function () {};
    const concurrency = 5;
    const requestStaggerMs = 50;
    let activeRun = null;

    function renderBatchState(run, phaseText, running) {
      if (!ui?.renderBatchState || !run?.requestStream?.getSnapshot) {
        return;
      }
      const snapshot = run.requestStream.getSnapshot();
      ui.renderBatchState({
        running: running !== false,
        phaseText: phaseText,
        selectionSpec: run.selectionSpecDisplay || "全部段",
        concurrency: run.concurrency,
        totalCount: run.totalCount,
        launchedCount: snapshot.launchedCount,
        activeAiCount: snapshot.activeAiCount,
        succeededCount: snapshot.succeededCount,
        failedCount: snapshot.failedCount,
        currentSegmentNumber: run.currentSegmentNumber,
        failures: run.failures.slice(),
      });
    }

    function buildBatchTaskContext(task, lockedContext) {
      return Object.assign({}, task, {
        audioUrl: lockedContext.audioUrl,
        fieldContext: lockedContext.fieldContext,
        editorContext: {
          query: lockedContext.query,
          audioUrlSource: lockedContext.audioUrlSource || "",
          selectedEntry: lockedContext.selectedEntry,
          template: lockedContext.editorContext?.template || lockedContext.template || {},
        },
        platformUserName: lockedContext.platformUserName || "",
        platformUserId: lockedContext.platformUserId || "",
      });
    }

    async function start(selectionSpec) {
      if (activeRun) {
        const busyMessage = "当前已有正在运行的批量识别，请先等待完成或点击停止批量。";
        ui?.setStatus?.(busyMessage, "error");
        return {
          ok: false,
          message: busyMessage,
        };
      }
      if (
        !dataApi?.getEditorContext ||
        !dataApi?.getBatchSegments ||
        !dataApi?.applyBatchTextRecommendations ||
        !ai?.createSharedAudioSource ||
        !ai?.recommendForSegment ||
        !streamFactory?.createConcurrentAiRequestStream
      ) {
        throw new Error("当前脚本缺少批量识别运行时依赖。");
      }

      let run = null;
      try {
        ui?.setStatus?.("正在准备当前音频的批量识别...", "");
        const lockedContext = await dataApi.getEditorContext({ force: true });
        if (!normalizeText(lockedContext?.audioUrl)) {
          throw new Error(lockedContext?.audioUrlHintMessage || MISSING_AUDIO_MESSAGE);
        }
        const batchPlan = await dataApi.getBatchSegments(selectionSpec, lockedContext);
        if (!Array.isArray(batchPlan?.segments) || batchPlan.segments.length <= 0) {
          throw new Error("当前没有命中可批量处理的段落。");
        }
        const sharedAudioSource = ai.createSharedAudioSource(lockedContext.audioUrl);
        run = {
          lockedContext: lockedContext,
          lockedEntryName: normalizeText(batchPlan.selectedEntryName || lockedContext.selectedEntry?.name),
          lockedAudioUrl: normalizeText(lockedContext.audioUrl),
          selectionSpecDisplay: normalizeText(selectionSpec) || "全部段",
          totalCount: batchPlan.segments.length,
          expectedSegmentCount: Number(batchPlan.totalSegments || 0) || 0,
          expectedUniqueIds: Array.isArray(batchPlan.allSegmentUniqueIds)
            ? batchPlan.allSegmentUniqueIds.slice()
            : [],
          concurrency: concurrency,
          currentSegmentNumber: 0,
          failures: [],
          successes: [],
          stopRequested: false,
          requestStream: null,
        };
        run.requestStream = streamFactory.createConcurrentAiRequestStream({
          tasks: batchPlan.segments,
          concurrency: concurrency,
          staggerMs: requestStaggerMs,
          onStateChange: function () {
            if (!activeRun) {
              return;
            }
            renderBatchState(run, run.stopRequested ? "批量识别停止中" : "批量识别进行中", true);
          },
          runTask: function (task) {
            run.currentSegmentNumber = Number(task?.segmentNumber || 0) || 0;
            return ai.recommendForSegment(buildBatchTaskContext(task, lockedContext), sharedAudioSource);
          },
        });
        activeRun = run;
        renderBatchState(run, "批量识别进行中", true);

        while (true) {
          const entry = await run.requestStream.nextResult();
          if (!entry) {
            break;
          }
          const task = entry.task && typeof entry.task === "object" ? entry.task : {};
          run.currentSegmentNumber = Number(task.segmentNumber || 0) || run.currentSegmentNumber;
          if (entry.ok === true) {
            const texts = resolveBatchRecommendationTexts(entry.value);
            run.successes.push({
              uniqueId: normalizeText(task.uniqueId || task.unique_id),
              segmentNumber: Number(task.segmentNumber || 0) || 0,
              selectionKey: normalizeText(task.selectionKey),
              dialectText: texts.dialectText,
              dialectTokens: texts.dialectTokens,
              mandarinText: texts.mandarinText,
            });
          } else {
            run.failures.push({
              segmentNumber: Number(task.segmentNumber || 0) || 0,
              message: entry.error?.message || String(entry.error),
            });
          }
          renderBatchState(
            run,
            entry.ok === true ? "批量识别返回中" : "批量识别存在失败",
            true
          );
        }

        await run.requestStream.whenProducersDone;

        if (run.successes.length <= 0) {
          const emptyMessage = run.stopRequested
            ? "本轮批量识别已停止，未产生可写回结果。"
            : "本轮批量识别未产生可写回结果。";
          renderBatchState(run, run.stopRequested ? "批量识别已停止" : "批量识别已完成", false);
          ui?.setStatus?.(emptyMessage, run.failures.length > 0 || run.stopRequested ? "warning" : "error");
          return {
            ok: false,
            message: emptyMessage,
          };
        }

        const liveSelection = dataApi.getLiveSelectionSnapshot?.() || null;
        if (
          normalizeText(liveSelection?.selectedEntryName) &&
          normalizeText(liveSelection?.selectedEntryName) !== run.lockedEntryName
        ) {
          const staleMessage = "当前音频或条目已变化，已停止批量写回，请刷新后重试。";
          renderBatchState(run, "批量写回已取消", false);
          ui?.setStatus?.(staleMessage, "error");
          return {
            ok: false,
            message: staleMessage,
          };
        }

        renderBatchState(run, "批量写回中", true);
        const saveResult = await dataApi.applyBatchTextRecommendations({
          selectedEntryName: run.lockedEntryName,
          expectedSegmentCount: run.expectedSegmentCount,
          expectedUniqueIds: run.expectedUniqueIds,
          results: run.successes,
        }, run.lockedContext);
        renderBatchState(run, saveResult.ok ? "批量写回完成" : "批量写回失败", false);
        ui?.setStatus?.(saveResult.message, saveResult.ok ? "success" : "error");
        if (saveResult.ok) {
          reloadPage();
        }
        return saveResult;
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        if (run) {
          renderBatchState(run, "批量识别失败", false);
        }
        ui?.setStatus?.("批量识别失败：" + message, "error");
        return {
          ok: false,
          message: "批量识别失败：" + message,
        };
      } finally {
        activeRun = null;
      }
    }

    function stop() {
      if (!activeRun) {
        const idleMessage = "当前没有正在运行的批量识别。";
        ui?.setStatus?.(idleMessage, "warning");
        return {
          ok: false,
          message: idleMessage,
        };
      }
      activeRun.stopRequested = true;
      if (activeRun.requestStream?.cancelPending) {
        activeRun.requestStream.cancelPending("批量识别已手动停止。");
      }
      renderBatchState(activeRun, "批量识别停止中", true);
      const message = "已请求停止，将在当前已发起段完成后结束本轮批量识别。";
      ui?.setStatus?.(message, "warning");
      return {
        ok: true,
        message: message,
      };
    }

    function dispose() {
      if (activeRun?.requestStream?.cancelPending) {
        activeRun.requestStream.cancelPending("批量识别上下文已销毁。");
      }
      activeRun = null;
    }

    return {
      start,
      stop,
      dispose,
      hasActiveRun: function () {
        return Boolean(activeRun);
      },
    };
  }

  function isEditorPage() {
    return Boolean(dataApiFactory && typeof dataApiFactory.isEditorPage === "function"
      ? dataApiFactory.isEditorPage()
      : location.hostname === "cvpc.data-baker.com" &&
          String(location.pathname || "").toLowerCase() === "/app/editor/asr/");
  }

  async function loadRuntimeConfig() {
    const settings = STORAGE && typeof STORAGE.getSettings === "function"
      ? await STORAGE.getSettings()
      : { platforms: {}, meta: {} };
    const defaults =
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.dataBakerCvpc?.scripts?.liuzhouAssistant || {};
    const current = settings?.platforms?.dataBakerCvpc?.scripts?.liuzhouAssistant || {};
    const endpointBuilder = typeof CONSTANTS.buildBackendUrl === "function"
      ? CONSTANTS.buildBackendUrl
      : function (path) {
          return String(CONSTANTS.DEFAULT_BACKEND_BASE_URLS?.server || "").replace(/\/+$/, "") + path;
        };
    return {
      settings,
      enabled:
        settings?.platforms?.dataBakerCvpc?.enabled !== false && current.enabled !== false,
      segmentPreviewEnabled:
        (current.segmentPreviewEnabled ?? defaults.segmentPreviewEnabled) !== false,
      blockNewTabEditingTips:
        (current.blockNewTabEditingTips ??
          current.blockEditingTabTips ??
          defaults.blockNewTabEditingTips ??
          defaults.blockEditingTabTips) !== false,
      blockPauseStateTips:
        (current.blockPauseStateTips ??
          current.blockEditingTabTips ??
          defaults.blockPauseStateTips ??
          defaults.blockEditingTabTips) !== false,
      segmentPreviewAutoApplyEnabled:
        current.segmentPreviewAutoApplyEnabled === true
          ? true
          : current.segmentPreviewAutoApplyEnabled === false
            ? false
            : defaults.segmentPreviewAutoApplyEnabled !== false,
      aiRecommendEnabled:
        (current.aiRecommendEnabled ?? defaults.aiRecommendEnabled) !== false,
      timeoutMs:
        Number(current.aiRecommendRequestTimeoutMs || defaults.aiRecommendRequestTimeoutMs || DEFAULT_TIMEOUT_MS) ||
        DEFAULT_TIMEOUT_MS,
      aiStages: buildAiStagesConfig(current, {
        listen: {
          model: defaults.aiRecommendListenModel || current.aiRecommendModel || "qwen3.5-omni-plus",
          prompt: defaults.aiRecommendListenPrompt || "",
          params: {},
        },
        refine: {
          model: defaults.aiRecommendRefineModel || "qwen3.5-plus",
          prompt: defaults.aiRecommendRefinePrompt || "",
          params: {},
        },
      }),
      aiRecommendEndpoint:
        current.aiRecommendEndpoint || endpointBuilder(AI_PATH, settings),
      segmentPreviewEndpoint:
        current.segmentPreviewEndpoint || endpointBuilder(SEGMENT_PATH, settings),
      segmentSilenceThresholdDbfs:
        Number.isFinite(Number(current.segmentSilenceThresholdDbfs))
          ? Math.round(Number(current.segmentSilenceThresholdDbfs))
          : Number.isFinite(Number(defaults.segmentSilenceThresholdDbfs))
            ? Math.round(Number(defaults.segmentSilenceThresholdDbfs))
            : -27,
      segmentContextPaddingMs:
        Number.isFinite(Number(current.segmentContextPaddingMs))
          ? Math.max(0, Math.min(1500, Math.round(Number(current.segmentContextPaddingMs))))
          : Number.isFinite(Number(defaults.segmentContextPaddingMs))
            ? Math.max(0, Math.min(1500, Math.round(Number(defaults.segmentContextPaddingMs))))
            : 200,
      segmentSilenceThresholdUnit:
        String(current.segmentSilenceThresholdUnit || defaults.segmentSilenceThresholdUnit || "db")
          .trim()
          .toLowerCase() || "db",
      aiUsageOperatorName: String(settings?.meta?.aiUsageOperatorName || "").trim(),
      shortcuts:
        current.shortcuts && typeof current.shortcuts === "object"
          ? current.shortcuts
          : {},
    };
  }

  function destroyRuntime() {
    if (audioRefreshTimer) {
      window.clearTimeout(audioRefreshTimer);
      audioRefreshTimer = null;
    }
    audioRefreshAttempts = 0;
    if (runtime?.batchController?.dispose) {
      runtime.batchController.dispose();
    }
    if (runtime?.shortcuts?.destroy) {
      runtime.shortcuts.destroy();
    }
    if (runtime?.ui?.destroy) {
      runtime.ui.destroy();
    }
    if (runtime?.editingTabTipGuard?.stop) {
      runtime.editingTabTipGuard.stop();
    }
    runtime = null;
    activeBatchController = null;
    lastRecommendation = null;
  }

  async function buildCurrentContext() {
    const context = await runtime.dataApi.getEditorContext({ force: true });
    runtime.lastAudioContext = context;
    runtime.currentSelectionKey = String(context.selectionKey || "");
    runtime.currentSelectionEntryName = String(context.selectedEntry?.name || "");
    if (runtime?.ui?.renderAudioContext) {
      runtime.ui.renderAudioContext(context);
    }
    if (!context.audioUrl) {
      throw new Error(context.audioUrlHintMessage || MISSING_AUDIO_MESSAGE);
    }
    return {
      audioUrl: context.audioUrl,
      audioDurationMs: context.audioDurationMs,
      currentSegments: context.currentSegments,
      fieldContext: context.fieldContext,
      selectedRange: context.selectedRange,
      selectionKey: context.selectionKey,
      selectedEntry: context.selectedEntry,
      editorContext: {
        query: context.query,
        audioUrlSource: context.audioUrlSource || "",
        selectedEntry: context.selectedEntry,
        template: {
          attrs: context.template?.attrs || [],
          entry_attrs: context.template?.entry_attrs || [],
          moment_attrs: context.template?.moment_attrs || [],
        },
      },
      platformUserName: context.platformUserName || "",
      platformUserId: context.platformUserId || "",
    };
  }

  async function refreshAudioContextStatus() {
    if (!runtime?.dataApi || !runtime?.ui?.renderAudioContext) {
      return false;
    }
    try {
      const context = await runtime.dataApi.getEditorContext({ force: true });
      const previousBatchEntryName = String(runtime.batchSelectionEntryName || "");
      const nextBatchEntryName = String(context.selectedEntry?.name || "");
      runtime.lastAudioContext = context;
      runtime.currentSelectionKey = String(context.selectionKey || "");
      runtime.currentSelectionEntryName = String(context.selectedEntry?.name || "");
      runtime.ui.renderAudioContext(context);
      if (runtime?.ui?.renderBatchSelection && runtime?.dataApi?.getBatchSegments) {
        try {
          const batchPlan = await runtime.dataApi.getBatchSegments("", context);
          runtime.ui.renderBatchSelection({
            totalSegments: Number(batchPlan?.totalSegments || 0) || 0,
            resetSelection:
              runtime.batchSelectionInitialized !== true ||
              previousBatchEntryName !== nextBatchEntryName,
          });
          runtime.batchSelectionInitialized = true;
          runtime.batchSelectionEntryName = nextBatchEntryName;
        } catch (_error) {
          runtime.ui.renderBatchSelection({
            totalSegments: 0,
            resetSelection: true,
          });
          runtime.batchSelectionInitialized = false;
          runtime.batchSelectionEntryName = nextBatchEntryName;
        }
      }
      return Boolean(context.audioUrl);
    } catch (error) {
      runtime.ui.renderAudioContext({
        audioUrl: "",
        audioUrlHintMessage:
          "读取当前音频地址失败：" + (error && error.message ? error.message : String(error)),
      });
      runtime?.ui?.renderBatchSelection?.({
        totalSegments: 0,
        resetSelection: true,
      });
      if (runtime) {
        runtime.batchSelectionInitialized = false;
      }
      return false;
    }
  }

  function scheduleAudioContextRefresh(delayMs) {
    if (audioRefreshTimer) {
      window.clearTimeout(audioRefreshTimer);
    }
    audioRefreshTimer = window.setTimeout(async function () {
      audioRefreshTimer = null;
      audioRefreshAttempts += 1;
      const ok = await refreshAudioContextStatus();
      if (!ok && audioRefreshAttempts < 12 && runtime) {
        scheduleAudioContextRefresh(audioRefreshAttempts < 4 ? 500 : 1500);
      }
    }, Math.max(0, Number(delayMs) || 0));
  }

  function syncLiveSelectionState() {
    if (!runtime?.dataApi?.getLiveSelectionSnapshot) {
      return;
    }
    const snapshot = runtime.dataApi.getLiveSelectionSnapshot();
    const nextSelectionKey = String(snapshot?.selectionKey || "");
    const nextEntryName = String(snapshot?.selectedEntryName || "");
    const selectionChanged =
      nextSelectionKey !== String(runtime.currentSelectionKey || "") ||
      nextEntryName !== String(runtime.currentSelectionEntryName || "");
    if (!selectionChanged) {
      return;
    }
    runtime.currentSelectionKey = nextSelectionKey;
    runtime.currentSelectionEntryName = nextEntryName;
    if (lastRecommendation) {
      lastRecommendation = null;
      runtime.ui.renderRecommendation(null);
    }
    if (runtime?.segment?.clearPreview) {
      runtime.segment.clearPreview();
      runtime.ui.renderPreview(null);
    }
    scheduleAudioContextRefresh(0);
  }

  async function handlePreview() {
    runtime.ui.setStatus(UI_COPY.previewBusy, "");
    try {
      const context = await buildCurrentContext();
      const preview = await runtime.segment.preview(context);
      runtime.ui.renderPreview(preview);
      const autoApplyResult = await maybeAutoApplyPreview(runtime, preview);
      if (autoApplyResult.attempted) {
        return;
      }
      if (String(preview?.meta?.previewMode || "") === "whole-audio-fallback") {
        if (String(preview?.meta?.analysisSource || "") === "backend-python-audio-url") {
          runtime.ui.setStatus("后端整音频分段预览已生成，可直接应用分段建议。", "success");
        } else {
          runtime.ui.setStatus(
            "当前增量补切未命中，已生成整条音频重切预览，可直接应用分段建议。",
            "success"
          );
        }
      } else {
        runtime.ui.setStatus(UI_COPY.previewReady, "success");
      }
    } catch (error) {
      runtime.ui.setStatus(
        UI_COPY.previewFailedPrefix + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleApplyPreview() {
    const preview = runtime.segment.getLastPreview();
    const result = await runtime.dataApi.applySegmentPreview(preview);
    if (result.ok) {
      if (runtime?.segment?.clearPreview) {
        runtime.segment.clearPreview();
        runtime.ui.renderPreview(null);
      }
      runtime.ui.setStatus(result.message, "success");
      scheduleRuntimeReload(runtime);
      return;
    }
    runtime.ui.setStatus(result.message, "error");
  }

  async function handleRecommend() {
    runtime.ui.setStatus("正在为当前段生成听音文本与柳州话修正结果...", "");
    try {
      const context = await buildCurrentContext();
      if (!context.selectedRange || !context.selectionKey) {
        throw new Error("未读取到当前波形选中段的开始/结束时间，请先在左侧选中目标段后重试。");
      }
      lastRecommendation = await runtime.ai.recommend(context);
      runtime.ui.renderRecommendation(lastRecommendation);
      runtime.ui.setStatus(UI_COPY.recommendReady, "success");
    } catch (error) {
      handleRecommendationFailure(runtime, error);
    }
  }

  async function handleApplyRecommendationText(targetKey) {
    if (!lastRecommendation) {
      runtime.ui.setStatus(UI_COPY.recommendRequired, "error");
      return;
    }
    const target = resolveRecommendationFillTarget(lastRecommendation, targetKey);
    if (!target || !target.text) {
      runtime.ui.setStatus("当前结果没有可填入的文本。", "error");
      return;
    }
    const result = await runtime.dataApi.fillCurrentSegmentField({
      selectionKey: lastRecommendation.selectionKey,
      targetField: target.targetField,
      text: target.text,
      tokens: target.tokens,
    });
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function handleApplyRecommend() {
    if (!lastRecommendation) {
      runtime.ui.setStatus(UI_COPY.recommendRequired, "error");
      return;
    }
    const result = await runtime.dataApi.fillCurrentSegmentRecommendation(lastRecommendation);
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function handleApplyDialectText() {
    await handleApplyRecommendationText("refinedDialectText");
  }

  async function handleApplyMandarinText() {
    await handleApplyRecommendationText("refinedMandarinText");
  }

  async function handleMarkValid() {
    const result = await runtime.dataApi.setCurrentValidity(true);
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function handleMarkInvalid() {
    const result = await runtime.dataApi.setCurrentValidity(false);
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function handleFillAllValid() {
    const result = await runtime.dataApi.fillUnresolvedSegmentsValid();
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function installRuntime() {
    const config = await loadRuntimeConfig();
    if (!config.enabled || !isEditorPage()) {
      destroyRuntime();
      return;
    }
    if (!dataApiFactory || !aiFactory || !segmentFactory || !uiFactory || !shortcutFactory) {
      return;
    }
    destroyRuntime();
    const dataApi = dataApiFactory.createRuntime();
    const ai = aiFactory.createRuntime({
      endpoint: config.aiRecommendEndpoint,
      timeoutMs: config.timeoutMs,
      settings: config.settings,
      aiUsageOperatorName: config.aiUsageOperatorName,
      aiStages: config.aiStages,
    });
    const segment = segmentFactory.createRuntime({
      endpoint: config.segmentPreviewEndpoint,
      silenceThresholdDbfs: config.segmentSilenceThresholdDbfs,
      silenceThresholdUnit: config.segmentSilenceThresholdUnit,
      contextPaddingMs: config.segmentContextPaddingMs,
    });
    const editingTabTipGuard =
      editingTabTipGuardApi && typeof editingTabTipGuardApi.createEditingTabTipGuard === "function"
        ? editingTabTipGuardApi.createEditingTabTipGuard({
            blockNewTabEditingTips: config.blockNewTabEditingTips !== false,
            blockPauseStateTips: config.blockPauseStateTips !== false,
          })
        : null;
    const ui = uiFactory.createRuntime({
      segmentPreviewAutoApplyEnabled: config.segmentPreviewAutoApplyEnabled !== false,
      onPreview: function () {
        if (config.segmentPreviewEnabled === false) {
          ui.setStatus(UI_COPY.previewFeatureDisabled, "error");
          return;
        }
        void handlePreview();
      },
      onToggleSegmentPreviewAutoApply: function (nextEnabled) {
        void (async function () {
          const previousEnabled = runtime?.config?.segmentPreviewAutoApplyEnabled !== false;
          const normalizedEnabled = nextEnabled === true;
          if (!STORAGE || typeof STORAGE.patchSettings !== "function") {
            ui.setSegmentPreviewAutoApplyEnabled(previousEnabled);
            ui.setStatus("当前扩展版本不支持保存自动应用开关。", "error");
            return;
          }
          try {
            const nextSettings = await STORAGE.patchSettings({
              platforms: {
                dataBakerCvpc: {
                  scripts: {
                    liuzhouAssistant: {
                      id: SCRIPT_ID,
                      segmentPreviewAutoApplyEnabled: normalizedEnabled,
                    },
                  },
                },
              },
            });
            if (runtime?.config) {
              runtime.config.segmentPreviewAutoApplyEnabled = normalizedEnabled;
              runtime.config.settings = nextSettings;
            }
            ui.setSegmentPreviewAutoApplyEnabled(normalizedEnabled);
          } catch (error) {
            ui.setSegmentPreviewAutoApplyEnabled(previousEnabled);
            ui.setStatus(
              "保存自动应用开关失败：" + (error && error.message ? error.message : String(error)),
              "error"
            );
          }
        })();
      },
      onApplyPreview: function () {
        void handleApplyPreview();
      },
      onRecommend: function () {
        if (config.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭 AI 推荐功能。", "error");
          return;
        }
        void handleRecommend();
      },
      onBatchRecommend: function (selectionSpec) {
        if (config.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭 AI 推荐功能。", "error");
          return;
        }
        void activeBatchController?.start(selectionSpec);
      },
      onBatchStop: function () {
        activeBatchController?.stop();
      },
      onApplyRecommendationText: function (targetKey) {
        void handleApplyRecommendationText(targetKey);
      },
      onMarkValid: function () {
        void handleMarkValid();
      },
      onMarkInvalid: function () {
        void handleMarkInvalid();
      },
      onFillAllValid: function () {
        void handleFillAllValid();
      },
    });
    const shortcuts = shortcutFactory.createRuntime({
      shortcuts: config.shortcuts,
      actions: {
        preview: function () {
          void handlePreview();
        },
        applyPreview: function () {
          void handleApplyPreview();
        },
        recommend: function () {
          void handleRecommend();
        },
        applyDialectText: function () {
          void handleApplyDialectText();
        },
        applyMandarinText: function () {
          void handleApplyMandarinText();
        },
        applyRecommend: function () {
          void handleApplyRecommend();
        },
        valid: function () {
          void handleMarkValid();
        },
        invalid: function () {
          void handleMarkInvalid();
        },
        fillAllValid: function () {
          void handleFillAllValid();
        },
      },
    });
    const batchController = createBatchRecommendController({
      dataApi: dataApi,
      ai: ai,
      ui: ui,
      concurrentRequestStreamFactory: concurrentRequestStreamFactory,
      reloadPage: function () {
        scheduleRuntimeReload(runtime);
      },
    });
    runtime = {
      config,
      dataApi,
      ai,
      batchController,
      segment,
      editingTabTipGuard,
      ui,
      shortcuts,
      currentSelectionKey: "",
      currentSelectionEntryName: "",
      lastAudioContext: null,
      batchSelectionInitialized: false,
      batchSelectionEntryName: "",
      reloadPage: function () {
        try {
          globalThis.location.reload();
        } catch (_error) {
          // Ignore reload failures and leave the success message visible.
        }
      },
      scheduleReload: function () {
        setTimeout(function () {
          runtime?.reloadPage?.();
        }, 300);
      },
    };
    activeBatchController = batchController;
    ui.mount();
    shortcuts.bind();
    if (editingTabTipGuard?.start) {
      editingTabTipGuard.start();
    }
    ui.setStatus("柳州话脚本已就绪；当前处于建议生成 + 人工确认模式。", "success");
    void ai.notifyLexiconWarning?.();
    runtime.ui.renderAudioContext({
      audioUrl: "",
      audioUrlHintMessage: "正在获取当前音频地址...",
    });
    audioRefreshAttempts = 0;
    scheduleAudioContextRefresh(0);
  }

  function startRouteWatcher() {
    if (routeTimer) {
      return;
    }
    routeTimer = window.setInterval(function () {
      if (!isEditorPage()) {
        destroyRuntime();
        return;
      }
      if (runtime?.ui?.mount) {
        runtime.ui.mount();
      }
      if (runtime) {
        syncLiveSelectionState();
      }
      if (!runtime) {
        void installRuntime();
      }
    }, 1200);
  }

  const api = {
    createBatchRecommendController: createBatchRecommendController,
    __testOnly: {
      copy: {
        recommendReady: UI_COPY.recommendReady,
        recommendRequired: UI_COPY.recommendRequired,
        previewBusy: UI_COPY.previewBusy,
        previewReady: UI_COPY.previewReady,
        previewFailedPrefix: UI_COPY.previewFailedPrefix,
      },
      createBatchRecommendController: createBatchRecommendController,
      resolveRecommendationFillTarget: resolveRecommendationFillTarget,
      resolveBatchRecommendationTexts: resolveBatchRecommendationTexts,
      buildRecommendationFailurePayload: buildRecommendationFailurePayload,
      handleRecommendationFailure: handleRecommendationFailure,
      maybeAutoApplyPreview: maybeAutoApplyPreview,
    },
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouContent = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (
    typeof window !== "undefined" &&
    window &&
    typeof document !== "undefined" &&
    globalThis.__ASREdgeDataBakerCvpcLiuzhouInstalled !== true
  ) {
    globalThis.__ASREdgeDataBakerCvpcLiuzhouInstalled = true;
    void installRuntime();
    startRouteWatcher();
  }
})();
