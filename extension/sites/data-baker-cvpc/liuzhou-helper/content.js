(function () {
  if (globalThis.__ASREdgeDataBakerCvpcLiuzhouInstalled === true) {
    return;
  }
  globalThis.__ASREdgeDataBakerCvpcLiuzhouInstalled = true;

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const dataApiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi || null;
  const aiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouAiRecommendation || null;
  const segmentFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouSegmentation || null;
  const uiFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouUiPanel || null;
  const shortcutFactory = globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts || null;
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

  let runtime = null;
  let routeTimer = null;
  let audioRefreshTimer = null;
  let audioRefreshAttempts = 0;
  let lastRecommendation = null;

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
    const params = buildStageParams(prefix, source, fallback.params || fallback);
    if (model) {
      stage.model = model;
    }
    if (prompt) {
      stage.prompt = prompt;
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
        };
      default:
        return null;
    }
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
          return "https://script.xiangtianzhen.store" + path;
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
      platformUserName: "",
    };
  }

  async function refreshAudioContextStatus() {
    if (!runtime?.dataApi || !runtime?.ui?.renderAudioContext) {
      return false;
    }
    try {
      const context = await runtime.dataApi.getEditorContext({ force: true });
      runtime.lastAudioContext = context;
      runtime.currentSelectionKey = String(context.selectionKey || "");
      runtime.currentSelectionEntryName = String(context.selectedEntry?.name || "");
      runtime.ui.renderAudioContext(context);
      return Boolean(context.audioUrl);
    } catch (error) {
      runtime.ui.renderAudioContext({
        audioUrl: "",
        audioUrlHintMessage:
          "读取当前音频地址失败：" + (error && error.message ? error.message : String(error)),
      });
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
    scheduleAudioContextRefresh(0);
  }

  async function handlePreview() {
    runtime.ui.setStatus("正在生成当前音频画段建议...", "");
    try {
      const context = await buildCurrentContext();
      const preview = await runtime.segment.preview(context);
      runtime.ui.renderPreview(preview);
      runtime.ui.setStatus("画段建议已生成；当前仍需人工确认后再画段。", "success");
    } catch (error) {
      runtime.ui.setStatus(
        "生成画段建议失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleApplyPreview() {
    const preview = runtime.segment.getLastPreview();
    const result = await runtime.dataApi.applySegmentPreview(preview);
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
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
      runtime.ui.setStatus("当前段 AI 推荐已生成。", "success");
    } catch (error) {
      runtime.ui.setStatus(
        "当前段 AI 推荐失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleApplyRecommendationText(targetKey) {
    if (!lastRecommendation) {
      runtime.ui.setStatus("请先生成当前段 AI 推荐。", "error");
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
    });
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
  }

  async function handleApplyRecommend() {
    if (!lastRecommendation) {
      runtime.ui.setStatus("请先生成当前段 AI 推荐。", "error");
      return;
    }
    const result = await runtime.dataApi.fillCurrentSegmentRecommendation(lastRecommendation);
    runtime.ui.setStatus(result.message, result.ok ? "success" : "error");
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
      aiUsageOperatorName: config.aiUsageOperatorName,
      aiStages: config.aiStages,
    });
    const segment = segmentFactory.createRuntime({
      endpoint: config.segmentPreviewEndpoint,
    });
    const editingTabTipGuard =
      editingTabTipGuardApi && typeof editingTabTipGuardApi.createEditingTabTipGuard === "function"
        ? editingTabTipGuardApi.createEditingTabTipGuard({
            blockNewTabEditingTips: config.blockNewTabEditingTips !== false,
            blockPauseStateTips: config.blockPauseStateTips !== false,
          })
        : null;
    const ui = uiFactory.createRuntime({
      onPreview: function () {
        if (config.segmentPreviewEnabled === false) {
          ui.setStatus("当前已关闭画段建议功能。", "error");
          return;
        }
        void handlePreview();
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
    runtime = {
      config,
      dataApi,
      ai,
      segment,
      editingTabTipGuard,
      ui,
      shortcuts,
      currentSelectionKey: "",
      currentSelectionEntryName: "",
      lastAudioContext: null,
    };
    ui.mount();
    shortcuts.bind();
    if (editingTabTipGuard?.start) {
      editingTabTipGuard.start();
    }
    ui.setStatus("柳州话脚本已就绪；当前处于建议生成 + 人工确认模式。", "success");
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

  void installRuntime();
  startRouteWatcher();
})();
