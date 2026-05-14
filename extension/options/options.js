(function () {
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const platformLibrary = constants.PLATFORM_LIBRARY || {};
  const scriptLibrary = constants.SCRIPT_LIBRARY || {};
  const transcriptionProjectId = constants.TRANSCRIPTION_PROJECT_ID || "transcription";
  const judgementProjectId = constants.JUDGEMENT_PROJECT_ID || "judgement";
  const lightwheelScriptId = constants.LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID || "lightwheelViewPanel";
  const dataBakerRoundOneQualityScriptId =
    constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID || "dataBakerRoundOneQuality";
  const magicDataAnnotatorScriptId =
    constants.MAGIC_DATA_ANNOTATOR_SCRIPT_ID || "magicDataAnnotatorAiReview";
  const backendModeServer = constants.BACKEND_ENDPOINT_MODE_SERVER || "server";
  const backendModeLocal = constants.BACKEND_ENDPOINT_MODE_LOCAL || "local";
  const getBackendModeFromSettings =
    typeof constants.getBackendEndpointModeFromSettings === "function"
      ? constants.getBackendEndpointModeFromSettings
      : function (settings) {
          const mode = settings?.meta?.backendEndpointMode;
          return String(mode || "").trim().toLowerCase() === backendModeLocal
            ? backendModeLocal
            : backendModeServer;
        };
  const getBackendBaseUrlByMode =
    typeof constants.getBackendBaseUrlByMode === "function"
      ? constants.getBackendBaseUrlByMode
      : function (mode) {
          return String(mode || "").trim().toLowerCase() === backendModeLocal
            ? "http://127.0.0.1:3333"
            : "https://script.xiangtianzhen.store";
        };
  const buildBackendUrl =
    typeof constants.buildBackendUrl === "function"
      ? constants.buildBackendUrl
      : function (path, settingsOrMode) {
          const mode =
            typeof settingsOrMode === "string"
              ? settingsOrMode
              : getBackendModeFromSettings(settingsOrMode || {});
          const baseUrl = String(getBackendBaseUrlByMode(mode) || "").replace(/\/+$/, "");
          const normalizedPath = String(path || "").charAt(0) === "/" ? String(path || "") : "/" + String(path || "");
          return baseUrl + normalizedPath;
        };
  const projectDataDownloadOptionsPath =
    constants.PROJECT_DATA_DOWNLOAD_OPTIONS_PATH || "/api/admin/project-data-download/options";
  const projectDataDownloadRequestPath =
    constants.PROJECT_DATA_DOWNLOAD_REQUEST_PATH || "/api/admin/project-data-download/request";
  const dataBakerPageSizeOptions = (
    Array.isArray(constants.DATABAKER_PAGE_SIZE_OPTIONS)
      ? constants.DATABAKER_PAGE_SIZE_OPTIONS
      : ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"]
  ).map(function (item) {
    return String(item || "").replace(/\s+/g, "");
  });
  const dataBakerShortcutActions = constants.DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS || [
    { key: "aiRecommendCurrentItem", label: "AI 推荐文本" },
    { key: "copyAiHeardText", label: "复制 AI 听音文本" },
    { key: "copyRecommendedText", label: "复制 AI 推荐文本" },
    { key: "fillRecommendedText", label: "填入推荐文本" },
    { key: "ignoreAiResult", label: "忽略 AI 推荐结果" },
    { key: "sentenceQualified", label: "句子判定：合格" },
    { key: "sentenceUnqualified", label: "句子判定：不合格" },
    { key: "taskPass", label: "任务判定：通过" },
    { key: "taskPartialReject", label: "任务判定：部分驳回" },
    { key: "taskFullReject", label: "任务判定：全部驳回" },
  ];
  const judgementAiListenModels = Array.isArray(constants.JUDGEMENT_AI_LISTEN_MODELS)
    ? constants.JUDGEMENT_AI_LISTEN_MODELS
    : ["qwen3.5-omni-flash", "qwen3-omni-flash", "qwen3.5-omni-plus"];
  const judgementAiCompareModels = Array.isArray(constants.JUDGEMENT_AI_COMPARE_MODELS)
    ? constants.JUDGEMENT_AI_COMPARE_MODELS
    : ["qwen3.5-plus", "qwen-plus", "qwen-turbo"];
  const judgementAiAdvancedDefinitions = Array.isArray(
    constants.JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS
  )
    ? constants.JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS
    : [];
  const judgementAiSupportedParams = judgementAiAdvancedDefinitions.reduce(function (result, item) {
    const apiKey = String(item?.apiKey || "").trim();
    if (!apiKey) {
      return result;
    }
    result[apiKey] = item?.supported !== false;
    return result;
  }, {});
  const judgementShortcutActions = constants.JUDGEMENT_SHORTCUT_ACTIONS || [
    { key: "choiceFirstBetter", label: "选择：第一个更好" },
    { key: "choiceSecondBetter", label: "选择：第二个更好" },
    { key: "choiceBothBad", label: "选择：都不好" },
    { key: "choiceUnsure", label: "选择：不确定或差不多" },
    { key: "choiceOtherDialect", label: "选择：其他方言或语种" },
    { key: "volumeUp", label: "增大音量" },
    { key: "volumeDown", label: "减小音量" },
    { key: "volumeReset", label: "重置音量" },
    { key: "rateUp", label: "提高倍速" },
    { key: "rateDown", label: "降低倍速" },
    { key: "rateReset", label: "重置倍速" },
    { key: "seekBackward", label: "后退当前音频" },
    { key: "seekForward", label: "前进当前音频" },
    { key: "playPause", label: "播放/暂停当前音频" },
    { key: "aiSuggestCurrentItem", label: "AI 分析当前题" },
    { key: "applyAiSuggestion", label: "AI：采用建议" },
    { key: "retryAiSuggestion", label: "AI：重新分析" },
    { key: "ignoreAiSuggestion", label: "AI：忽略建议" },
    { key: "copyAsrTextPair", label: "复制两条 ASR 文本" },
  ];
  const transcriptionShortcutActions = [
    { key: "shortcutPlayPause", label: "播放 / 暂停" },
    { key: "shortcutValid", label: "当前题标有效" },
    { key: "shortcutInvalid", label: "当前题标无效" },
    { key: "shortcutFill", label: "当前题快速填入" },
    { key: "shortcutRemoveSpaces", label: "当前题去空格" },
    { key: "shortcutConvertNum", label: "当前题数字转换" },
    { key: "shortcutToggleFocus", label: "焦点切换" },
    { key: "shortcutBackward", label: "当前音频后退" },
    { key: "shortcutForward", label: "当前音频前进" },
    { key: "shortcutSpeedDown", label: "降低倍速" },
    { key: "shortcutSpeedUp", label: "提高倍速" },
    { key: "shortcutResetSpeed", label: "重置倍速" },
    { key: "shortcutVolDown", label: "降低音量" },
    { key: "shortcutVolUp", label: "提高音量" },
    { key: "shortcutResetVol", label: "重置音量" },
    { key: "shortcutCopyDuration", label: "复制当前音频时长" },
    { key: "shortcutUploadStats", label: "上传转写统计" },
    { key: "shortcutAiSuggest", label: "AI 推荐当前题" },
    { key: "shortcutApplyAiSuggestion", label: "填入 AI 推荐" },
  ];
  const magicDataDefaultSettings = {
    enabled: true,
    aiReviewEnabled: true,
    listenModel: "qwen3.5-omni-flash",
    reviewModel: "qwen3.5-plus",
    reviewMode: "rule_first",
    showHeardText: true,
    showEstimatedIncome: true,
    enableThinking: false,
    shortcuts: {},
  };
  const magicDataListenModelOptions = [
    "qwen3.5-omni-flash",
    "qwen3.5-omni",
    "qwen-omni-turbo",
    "qwen-audio-turbo",
  ];
  const magicDataReviewModelOptions = [
    "qwen3.5-plus",
    "qwen-plus",
    "qwen-max",
    "qwen-turbo",
    "qwen-long",
  ];
  const magicDataShortcutActions = [
    { key: "reviewCurrent", label: "AI 质检当前条" },
    { key: "copySummary", label: "复制 AI 质检摘要" },
    { key: "fillDialectLine", label: "填入第一行" },
    { key: "fillMandarinLine", label: "填入第二行" },
    { key: "save", label: "保存" },
    { key: "submit", label: "提交" },
    { key: "genderMale", label: "性别男" },
    { key: "genderFemale", label: "性别女" },
    { key: "age0To5", label: "年龄0-5" },
    { key: "age6To12", label: "年龄6-12" },
    { key: "age13To18", label: "年龄13-18" },
    { key: "age19To25", label: "年龄19-25" },
    { key: "age26To36", label: "年龄26-36" },
    { key: "age37To50", label: "年龄37-50" },
    { key: "age51To65", label: "年龄51-65" },
    { key: "age65Plus", label: "年龄65以上" },
  ];
  const judgementItemsPerPageOptions = [
    { value: "1 条/页", label: "1 条/页" },
    { value: "2 条/页", label: "2 条/页" },
    { value: "3 条/页", label: "3 条/页" },
    { value: "4 条/页", label: "4 条/页" },
    { value: "5 条/页", label: "5 条/页" },
    { value: "10 条/页", label: "10 条/页" },
    { value: "20 条/页", label: "20 条/页" },
    { value: "30 条/页", label: "30 条/页" },
    { value: "40 条/页", label: "40 条/页" },
    { value: "50 条/页", label: "50 条/页" },
    { value: "400 条/页", label: "400 条/页" },
  ];
  const mouseButtonLabels = {
    0: "MouseLeft",
    1: "MouseMiddle",
    2: "MouseRight",
    3: "MouseBack",
    4: "MouseForward",
  };
  let currentSettings = null;
  let transcriptionShortcutsDraft = {};
  let transcriptionRecordingKey = null;
  let stopTranscriptionRecordingListeners = null;
  let judgementShortcutsDraft = {};
  let judgementRecordingKey = null;
  let stopJudgementRecordingListeners = null;
  let dataBakerShortcutsDraft = {};
  let dataBakerRecordingKey = null;
  let stopDataBakerRecordingListeners = null;
  let magicDataShortcutsDraft = {};
  let magicDataRecordingKey = null;
  let stopMagicDataRecordingListeners = null;
  let endpointAdvancedRevealCount = 0;
  let endpointAdvancedUnlocked = false;
  let judgementAiAdvancedRevealCount = 0;
  let judgementAiAdvancedUnlocked = false;
  let judgementAiAdvancedLastClickAt = 0;
  const asrVoiceAiRevealStates = {};
  const asrVoiceAiDefaultsCache = {};
  const asrVoiceAiDefaultsLoading = {};
  const asrVoiceAiDefaultsPaths = {
    judgement: "/api/alibaba-labelx/asr-judgement/ai/defaults",
    transcription: "/api/alibaba-labelx/asr-transcription/ai/defaults",
    dataBakerRoundOneQuality: "/api/data-baker/round-one-quality/ai/recommend/defaults",
    magicDataAnnotatorAiReview: "/api/magic-data/annotator/ai/defaults",
  };
  let projectDataDownloadDatasets = [];

  function getElement(id) {
    return document.getElementById(id);
  }

  function getSearchParams() {
    return new URLSearchParams(location.search || "");
  }

  function getCurrentDetailScriptId() {
    const scriptId = getSearchParams().get("script");
    return typeof scriptId === "string" && scriptLibrary[scriptId] ? scriptId : null;
  }

  function navigateToScript(scriptId) {
    const nextUrl = new URL(location.href);
    if (scriptId) {
      nextUrl.searchParams.set("script", scriptId);
    } else {
      nextUrl.searchParams.delete("script");
    }

    history.replaceState({}, "", nextUrl.toString());
    renderCurrentView();
  }

  function showError(message) {
    const node = getElement("options-error");
    node.textContent = String(message || "脚本中心加载失败。");
    node.classList.remove("hidden");
  }

  function hideError() {
    getElement("options-error").classList.add("hidden");
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampNumber(value, fallback, min, max, precision) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    const clamped = Math.max(min, Math.min(max, numericValue));
    return typeof precision === "number" ? Number(clamped.toFixed(precision)) : clamped;
  }

  function normalizeJudgementItemsPerPage(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (
      text === "all" ||
      text === "全部" ||
      text === "全部/400条" ||
      text === "全部（400 条）" ||
      text === "全部（400条）" ||
      text === "400 条/页" ||
      text === "400条/页"
    ) {
      return "400 条/页";
    }

    if (
      text === "100 条/页" ||
      text === "100条/页" ||
      text === "150 条/页" ||
      text === "150条/页" ||
      text === "200 条/页" ||
      text === "200条/页"
    ) {
      return "50 条/页";
    }

    const validValues = judgementItemsPerPageOptions.map(function (option) {
      return option.value;
    });
    if (validValues.indexOf(text) >= 0) {
      return text;
    }

    return validValues.indexOf(fallback) >= 0 ? fallback : "50 条/页";
  }

  function normalizeHexColor(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      return text.toLowerCase();
    }

    return fallback;
  }

  function normalizeJudgementDiffColors(value, defaults) {
    const colorDefaults = defaults || {
      changeBackground: "#fef3c7",
      gapBackground: "#fee2e2",
      punctuationBackground: "#ede9fe",
    };
    const source = value && typeof value === "object" ? value : {};
    return {
      changeBackground: normalizeHexColor(
        source.changeBackground,
        colorDefaults.changeBackground || "#fef3c7"
      ),
      gapBackground: normalizeHexColor(
        source.gapBackground,
        colorDefaults.gapBackground || "#fee2e2"
      ),
      punctuationBackground: normalizeHexColor(
        source.punctuationBackground,
        colorDefaults.punctuationBackground || "#ede9fe"
      ),
    };
  }

  function normalizeTimeList(value, fallback) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[,，\n]/)
        : Array.isArray(fallback)
          ? fallback
          : [];
    const result = [];

    source.forEach(function (item) {
      const text = String(item || "").trim();
      const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        return;
      }

      const normalized = String(Number(match[1])).padStart(2, "0") + ":" + match[2];
      if (result.indexOf(normalized) < 0) {
        result.push(normalized);
      }
    });

    return result.length > 0 ? result : ["10:00", "16:00"];
  }

  function inferBackendModeFromEndpoint(endpointText, fallbackMode) {
    const text = String(endpointText || "").trim().toLowerCase();
    if (text.indexOf("127.0.0.1") >= 0 || text.indexOf("localhost") >= 0) {
      return backendModeLocal;
    }
    if (text.indexOf("http://") === 0 || text.indexOf("https://") === 0) {
      return backendModeServer;
    }
    return fallbackMode === backendModeLocal ? backendModeLocal : backendModeServer;
  }

  function normalizeJudgementAiModelText(value, fallback) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return String(fallback || "").trim();
    }
    return text.slice(0, 80);
  }

  function normalizeJudgementAiAvailableModels(value, fallback) {
    const source = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
    const result = [];
    source.forEach(function (item) {
      const model = normalizeJudgementAiModelText(item, "");
      if (!model || result.indexOf(model) >= 0) {
        return;
      }
      result.push(model);
    });
    return result;
  }

  function isJudgementPresetModel(modelName, presetList) {
    return Array.isArray(presetList) && presetList.indexOf(modelName) >= 0;
  }

  function formatJudgementAiModelLabel(model, role) {
    if (role === "listen" && model === "qwen3.5-omni-flash") {
      return "qwen3.5-omni-flash（默认）";
    }
    if (role === "compare" && model === "qwen3.5-plus") {
      return "qwen3.5-plus（默认）";
    }
    return model;
  }

  function renderJudgementAiModelOptions(selectId, models, selectedModel, role) {
    const selectNode = getElement(selectId);
    if (!(selectNode instanceof HTMLSelectElement)) {
      return;
    }
    selectNode.innerHTML = (Array.isArray(models) ? models : [])
      .map(function (model) {
        return (
          '<option value="' +
          escapeHtml(model) +
          '">' +
          escapeHtml(formatJudgementAiModelLabel(model, role)) +
          "</option>"
        );
      })
      .join("") +
      '<option value="custom">自定义</option>';

    const normalizedModel = normalizeJudgementAiModelText(selectedModel, "");
    selectNode.value = isJudgementPresetModel(normalizedModel, models)
      ? normalizedModel
      : "custom";
  }

  function applyJudgementModelField(selectId, customInputId, modelName, presetList, role) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return;
    }
    const normalizedModel = normalizeJudgementAiModelText(modelName, "");
    renderJudgementAiModelOptions(selectId, presetList, normalizedModel, role);
    const useCustom = !normalizedModel || !isJudgementPresetModel(normalizedModel, presetList);
    selectNode.value = useCustom ? "custom" : normalizedModel;
    customNode.value = useCustom ? normalizedModel : "";
    customNode.classList.toggle("hidden", !useCustom);
  }

  function readJudgementModelField(selectId, customInputId, fallback, presetList) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return normalizeJudgementAiModelText(fallback, fallback);
    }
    if (selectNode.value === "custom") {
      return normalizeJudgementAiModelText(customNode.value, fallback);
    }
    if (isJudgementPresetModel(selectNode.value, presetList)) {
      return normalizeJudgementAiModelText(selectNode.value, fallback);
    }
    return normalizeJudgementAiModelText(fallback, fallback);
  }

  function bindJudgementModelSelect(selectId, customInputId) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return;
    }
    selectNode.addEventListener("change", function () {
      const useCustom = selectNode.value === "custom";
      customNode.classList.toggle("hidden", !useCustom);
      if (useCustom) {
        customNode.focus();
      }
    });
  }

  function isJudgementAiParamSupported(apiKey) {
    return judgementAiSupportedParams[String(apiKey || "")] === true;
  }

  function isJudgementSupportedParamFromDefaults(apiKey) {
    const payload = getAsrVoiceAiDefaultsCached(judgementProjectId);
    const supportedParams =
      payload && payload.supportedParams && typeof payload.supportedParams === "object"
        ? payload.supportedParams
        : {};
    if (hasOwn(supportedParams, apiKey)) {
      return supportedParams[apiKey] === true;
    }
    return isJudgementAiParamSupported(apiKey);
  }

  function normalizeOptionalNumberText(value, min, max, precision) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const numericValue = Number(text);
    if (!Number.isFinite(numericValue)) {
      return "";
    }
    const clamped = Math.max(min, Math.min(max, numericValue));
    return String(
      typeof precision === "number" ? Number(clamped.toFixed(precision)) : clamped
    );
  }

  function normalizeOptionalIntegerText(value, min, max) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const numericValue = Number(text);
    if (!Number.isFinite(numericValue)) {
      return "";
    }
    return String(Math.floor(Math.max(min, Math.min(max, numericValue))));
  }

  function normalizePromptText(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
  }

  function normalizeResponseFormat(value, fallback) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "json_object" || text === "text") {
      return text;
    }
    return String(fallback || "json_object").trim().toLowerCase() === "text"
      ? "text"
      : "json_object";
  }

  function normalizeStopSequencesText(value) {
    const source = String(value || "");
    if (!source.trim()) {
      return "";
    }
    const result = [];
    source
      .split(/\r?\n/)
      .map(function (item) {
        return String(item || "").trim().slice(0, 80);
      })
      .filter(Boolean)
      .forEach(function (item) {
        if (result.length >= 8) {
          return;
        }
        if (result.indexOf(item) >= 0) {
          return;
        }
        result.push(item);
      });
    return result.join("\n");
  }

  function toggleJudgementAiAdvancedFieldVisibility(inputId, supported) {
    const inputNode = getElement(inputId);
    if (!inputNode) {
      return;
    }
    const wrapper =
      typeof inputNode.closest === "function"
        ? inputNode.closest(".asr-ai-field")
        : inputNode.parentElement;
    if (!wrapper) {
      return;
    }
    wrapper.classList.toggle("hidden", supported !== true);
  }

  function applyJudgementAiAdvancedFieldVisibility() {
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-temperature",
      isJudgementAiParamSupported("temperature")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-top-p",
      isJudgementAiParamSupported("top_p")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-max-tokens",
      isJudgementAiParamSupported("max_tokens")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-max-completion-tokens",
      isJudgementAiParamSupported("max_completion_tokens")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-presence-penalty",
      isJudgementAiParamSupported("presence_penalty")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-frequency-penalty",
      isJudgementAiParamSupported("frequency_penalty")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-seed",
      isJudgementAiParamSupported("seed")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "judgement-ai-suggestion-stop-sequences",
      isJudgementAiParamSupported("stop")
    );
    const thinkingNode = getElement("judgement-ai-suggestion-enable-thinking");
    if (thinkingNode && thinkingNode.parentElement) {
      thinkingNode.parentElement.classList.toggle(
        "hidden",
        isJudgementAiParamSupported("enable_thinking") !== true
      );
    }
    const webSearchNode = getElement("judgement-ai-suggestion-web-search-enabled");
    if (webSearchNode && webSearchNode.parentElement) {
      webSearchNode.parentElement.classList.toggle(
        "hidden",
        isJudgementSupportedParamFromDefaults("web_search") !== true
      );
    }
  }

  function applyTranscriptionAiAdvancedFieldVisibility() {
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-temperature",
      isJudgementAiParamSupported("temperature")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-top-p",
      isJudgementAiParamSupported("top_p")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-max-tokens",
      isJudgementAiParamSupported("max_tokens")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-max-completion-tokens",
      isJudgementAiParamSupported("max_completion_tokens")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-presence-penalty",
      isJudgementAiParamSupported("presence_penalty")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-frequency-penalty",
      isJudgementAiParamSupported("frequency_penalty")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-seed",
      isJudgementAiParamSupported("seed")
    );
    toggleJudgementAiAdvancedFieldVisibility(
      "transcription-ai-suggestion-stop-sequences",
      isJudgementAiParamSupported("stop")
    );
    const thinkingNode = getElement("transcription-ai-suggestion-enable-thinking");
    if (thinkingNode && thinkingNode.parentElement) {
      thinkingNode.parentElement.classList.toggle(
        "hidden",
        isJudgementAiParamSupported("enable_thinking") !== true
      );
    }
  }

  function renderJudgementAiAdvancedPanel() {
    const panel = getElement("judgement-ai-advanced-panel");
    if (panel) {
      panel.classList.toggle("hidden", judgementAiAdvancedUnlocked !== true);
    }
    const statusNode = getElement("judgement-ai-advanced-unlock-status");
    if (!statusNode) {
      return;
    }
    statusNode.classList.toggle("hidden", judgementAiAdvancedUnlocked !== true);
    if (judgementAiAdvancedUnlocked) {
      statusNode.textContent = "AI 高级设置已显示；这些设置仅影响阿里ASR语音判别脚本。";
    } else {
      statusNode.textContent = "";
    }
  }

  function unlockJudgementAiAdvancedPanel() {
    if (judgementAiAdvancedUnlocked) {
      return;
    }
    judgementAiAdvancedUnlocked = true;
    renderJudgementAiAdvancedPanel();
    setStatus(
      "judgement-status",
      "AI 高级设置已显示；这些设置仅影响阿里ASR语音判别脚本。"
    );
  }

  function normalizeJudgementRateStep(value, fallback) {
    const allowedValues = [0.1, 0.25, 0.5, 1];
    const numericValue = Number(value);
    if (allowedValues.indexOf(numericValue) >= 0) {
      return numericValue;
    }

    return allowedValues.indexOf(fallback) >= 0 ? fallback : 0.25;
  }

  function normalizeJudgementSeekStep(value, fallback) {
    const allowedValues = [0.1, 0.25, 0.5, 1];
    const numericValue = Number(value);
    if (allowedValues.indexOf(numericValue) >= 0) {
      return numericValue;
    }

    return allowedValues.indexOf(fallback) >= 0 ? fallback : 0.5;
  }

  function normalizeTranscriptionRateStep(value, fallback) {
    const allowedValues = [0.1, 0.25, 0.5, 1];
    const numericValue = Number(value);
    if (allowedValues.indexOf(numericValue) >= 0) {
      return numericValue;
    }
    return allowedValues.indexOf(fallback) >= 0 ? fallback : 0.1;
  }

  function normalizeTranscriptionSeekStep(value, fallback) {
    const allowedValues = [0.5, 1, 2, 3, 5];
    const numericValue = Number(value);
    if (allowedValues.indexOf(numericValue) >= 0) {
      return numericValue;
    }
    return allowedValues.indexOf(fallback) >= 0 ? fallback : 1;
  }

  function hasOwn(target, key) {
    return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
  }

  function formatBackendModeLabel(settings) {
    return getBackendModeFromSettings(settings) === backendModeLocal
      ? "本机（127.0.0.1:3333）"
      : "服务器（script.xiangtianzhen.store）";
  }

  function isLabelxScript(scriptId) {
    return scriptId === transcriptionProjectId || scriptId === judgementProjectId;
  }

  function isDataBakerScript(scriptId) {
    return scriptId === dataBakerRoundOneQualityScriptId;
  }

  function isMagicDataScript(scriptId) {
    return scriptId === magicDataAnnotatorScriptId;
  }

  function supportsAsrVoiceAiSettings(scriptId) {
    return (
      scriptId === judgementProjectId ||
      scriptId === transcriptionProjectId ||
      scriptId === dataBakerRoundOneQualityScriptId ||
      scriptId === magicDataAnnotatorScriptId
    );
  }

  function getAsrVoiceAiStatusTargetId(scriptId) {
    if (scriptId === judgementProjectId) {
      return "judgement-status";
    }
    if (scriptId === transcriptionProjectId) {
      return "transcription-status";
    }
    if (scriptId === dataBakerRoundOneQualityScriptId) {
      return "data-baker-status";
    }
    if (scriptId === magicDataAnnotatorScriptId) {
      return "magic-data-status";
    }
    return "detail-status";
  }

  function getAsrVoiceAiRevealState(scriptId) {
    const key = String(scriptId || "");
    if (!asrVoiceAiRevealStates[key]) {
      asrVoiceAiRevealStates[key] = {
        clickCount: 0,
        lastClickAt: 0,
        unlocked: false,
      };
    }
    return asrVoiceAiRevealStates[key];
  }

  function isAsrVoiceAiUnlocked(scriptId) {
    return getAsrVoiceAiRevealState(scriptId).unlocked === true;
  }

  function registerAsrVoiceAiRevealClick(scriptId) {
    const state = getAsrVoiceAiRevealState(scriptId);
    if (state.unlocked) {
      return false;
    }
    const now = Date.now();
    if (now - state.lastClickAt > 3000) {
      state.clickCount = 0;
    }
    state.lastClickAt = now;
    state.clickCount += 1;
    if (state.clickCount < 10) {
      return false;
    }
    state.unlocked = true;
    return true;
  }

  function getAsrVoiceAiDefaultsPath(scriptId) {
    if (scriptId === judgementProjectId) {
      return asrVoiceAiDefaultsPaths.judgement;
    }
    if (scriptId === transcriptionProjectId) {
      return asrVoiceAiDefaultsPaths.transcription;
    }
    if (scriptId === dataBakerRoundOneQualityScriptId) {
      return asrVoiceAiDefaultsPaths.dataBakerRoundOneQuality;
    }
    if (scriptId === magicDataAnnotatorScriptId) {
      return asrVoiceAiDefaultsPaths.magicDataAnnotatorAiReview;
    }
    return "";
  }

  function buildFallbackAsrVoiceAiDefaults(scriptId) {
    const baseDefaults = {
      listenModel: "qwen3.5-omni-flash",
      compareModel: "qwen3.5-plus",
      reviewModel: "",
      timeoutMs: 120000,
      enableThinking: false,
      temperature: 0.1,
      top_p: 0.8,
      max_tokens: 1200,
      max_completion_tokens: "",
      presence_penalty: 0,
      frequency_penalty: 0,
      seed: "",
      stop: "",
      webSearchEnabled: scriptId === judgementProjectId,
      listenPrompt: "",
      comparePrompt: "",
      reviewPrompt: "",
    };
    const supportedParams = {
      temperature: true,
      top_p: true,
      max_tokens: true,
      max_completion_tokens: true,
      presence_penalty: true,
      frequency_penalty: true,
      seed: true,
      stop: true,
      enable_thinking: true,
      web_search: scriptId === judgementProjectId,
      reasoning_effort: false,
      response_format: false,
    };

    if (scriptId === magicDataAnnotatorScriptId) {
      baseDefaults.reviewModel = "qwen3.5-plus";
      baseDefaults.compareModel = "";
    }
    return {
      defaults: baseDefaults,
      supportedParams: supportedParams,
      loadedFromBackend: false,
      error: "",
    };
  }

  function normalizeAsrVoiceAiDefaultsPayload(payload, scriptId) {
    const fallback = buildFallbackAsrVoiceAiDefaults(scriptId);
    const source = payload && typeof payload === "object" ? payload : {};
    const defaults = source.defaults && typeof source.defaults === "object" ? source.defaults : {};
    const supportedParams =
      source.supportedParams && typeof source.supportedParams === "object"
        ? source.supportedParams
        : {};
    return {
      defaults: Object.assign({}, fallback.defaults, defaults),
      supportedParams: Object.assign({}, fallback.supportedParams, supportedParams),
      loadedFromBackend: source.success === true,
      error: "",
    };
  }

  function getAsrVoiceAiDefaultsCached(scriptId) {
    return asrVoiceAiDefaultsCache[String(scriptId || "")] || buildFallbackAsrVoiceAiDefaults(scriptId);
  }

  async function loadAsrVoiceAiDefaults(scriptId, settings) {
    const key = String(scriptId || "");
    if (asrVoiceAiDefaultsCache[key]) {
      return asrVoiceAiDefaultsCache[key];
    }
    if (asrVoiceAiDefaultsLoading[key]) {
      return asrVoiceAiDefaultsLoading[key];
    }
    const path = getAsrVoiceAiDefaultsPath(scriptId);
    if (!path) {
      const fallback = buildFallbackAsrVoiceAiDefaults(scriptId);
      asrVoiceAiDefaultsCache[key] = fallback;
      return fallback;
    }
    const request = (async function () {
      try {
        const endpoint = buildBackendUrl(path, settings || currentSettings || {});
        const response = await fetch(endpoint, { method: "GET" });
        const payload = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || !payload || payload.success !== true) {
          throw new Error("defaults-fetch-failed");
        }
        const normalized = normalizeAsrVoiceAiDefaultsPayload(payload, scriptId);
        asrVoiceAiDefaultsCache[key] = normalized;
        return normalized;
      } catch (error) {
        const fallback = buildFallbackAsrVoiceAiDefaults(scriptId);
        fallback.error = "后端默认配置读取失败，已使用本地默认值。";
        asrVoiceAiDefaultsCache[key] = fallback;
        return fallback;
      } finally {
        delete asrVoiceAiDefaultsLoading[key];
      }
    })();
    asrVoiceAiDefaultsLoading[key] = request;
    return request;
  }

  function getAsrVoiceAiEffectiveText(overrideValue, defaultValue) {
    const overrideText = String(overrideValue || "").trim();
    if (overrideText) {
      return overrideText;
    }
    return String(defaultValue === undefined || defaultValue === null ? "" : defaultValue);
  }

  function updateAsrVoiceAiDefaultsTip(scriptId, defaultsPayload) {
    if (!supportsAsrVoiceAiSettings(scriptId) || !isAsrVoiceAiUnlocked(scriptId)) {
      return;
    }
    const node = getElement("asr-ai-defaults-tip");
    if (!node) {
      return;
    }
    const payload = defaultsPayload || getAsrVoiceAiDefaultsCached(scriptId);
    if (payload.error) {
      node.textContent = payload.error;
      return;
    }
    node.textContent = "已读取后端默认配置；未单独覆盖的字段将沿用后端默认。";
  }

  function normalizeDataBakerTimeoutMs(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return 120000;
    }
    return Math.min(300000, Math.max(1000, Math.round(number)));
  }

  function dataBakerTimeoutMsToSeconds(value) {
    return Math.round(normalizeDataBakerTimeoutMs(value) / 1000);
  }

  function dataBakerTimeoutSecondsToMs(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) {
      return 120000;
    }
    return Math.min(300, Math.max(1, Math.round(seconds))) * 1000;
  }

  function normalizeDataBakerPageSize(value, fallback) {
    const text = String(value || "").replace(/\s+/g, "");
    const fallbackText = String(fallback || "50条/页").replace(/\s+/g, "");

    if (dataBakerPageSizeOptions.indexOf(text) >= 0) {
      return text;
    }
    if (dataBakerPageSizeOptions.indexOf(fallbackText) >= 0) {
      return fallbackText;
    }
    return "50条/页";
  }

  function normalizeNullableShortcut(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    return normalized && (normalized.key || typeof normalized.button === "number")
      ? normalized
      : null;
  }

  function normalizeDataBakerShortcuts(shortcuts) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const result = {};
    dataBakerShortcutActions.forEach(function (action) {
      result[action.key] = hasOwn(source, action.key)
        ? normalizeNullableShortcut(source[action.key])
        : null;
    });
    return result;
  }

  function normalizeMagicDataModel(value, fallback) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return fallback;
    }
    return text.slice(0, 80);
  }

  function normalizeMagicDataReviewMode(value, fallback) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "listen_assisted" || text === "strict_review" || text === "rule_first") {
      return text;
    }
    return fallback || "rule_first";
  }

  function normalizeMagicDataShortcuts(shortcuts) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const result = {};
    magicDataShortcutActions.forEach(function (action) {
      result[action.key] = hasOwn(source, action.key)
        ? normalizeNullableShortcut(source[action.key])
        : null;
    });
    return result;
  }

  function isMagicDataPresetModel(modelName, presetList) {
    return Array.isArray(presetList) && presetList.indexOf(modelName) >= 0;
  }

  function applyMagicDataModelField(selectId, customInputId, modelName, presetList) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return;
    }
    const normalizedModel = normalizeMagicDataModel(modelName, "");
    const useCustom = !normalizedModel || !isMagicDataPresetModel(normalizedModel, presetList);
    selectNode.value = useCustom ? "custom" : normalizedModel;
    customNode.value = useCustom ? normalizedModel : "";
    customNode.classList.toggle("hidden", !useCustom);
  }

  function readMagicDataModelField(selectId, customInputId, fallback, presetList) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return normalizeMagicDataModel(fallback, fallback);
    }
    if (selectNode.value === "custom") {
      return normalizeMagicDataModel(customNode.value, fallback);
    }
    if (isMagicDataPresetModel(selectNode.value, presetList)) {
      return normalizeMagicDataModel(selectNode.value, fallback);
    }
    return normalizeMagicDataModel(fallback, fallback);
  }

  function bindMagicDataModelSelect(selectId, customInputId) {
    const selectNode = getElement(selectId);
    const customNode = getElement(customInputId);
    if (!(selectNode instanceof HTMLSelectElement) || !(customNode instanceof HTMLInputElement)) {
      return;
    }
    selectNode.addEventListener("change", function () {
      const useCustom = selectNode.value === "custom";
      customNode.classList.toggle("hidden", !useCustom);
      if (useCustom) {
        customNode.focus();
      }
    });
  }

  function getMagicDataConfig(settings) {
    const source = settings?.scriptCenter?.projects?.magicDataAnnotator || {};
    return {
      enabled: source.enabled !== false,
      aiReviewEnabled: source.aiReviewEnabled !== false,
      listenModel: normalizeMagicDataModel(
        source.listenModel,
        magicDataDefaultSettings.listenModel
      ),
      reviewModel: normalizeMagicDataModel(
        source.reviewModel,
        magicDataDefaultSettings.reviewModel
      ),
      reviewMode: normalizeMagicDataReviewMode(
        source.reviewMode,
        magicDataDefaultSettings.reviewMode
      ),
      showHeardText: source.showHeardText !== false,
      showEstimatedIncome: source.showEstimatedIncome !== false,
      enableThinking: source.enableThinking === true,
      aiReviewRequestTimeoutMs: clampNumber(source.aiReviewRequestTimeoutMs, 120000, 1000, 300000, 0),
      aiReviewListenPrompt: normalizePromptText(source.aiReviewListenPrompt || ""),
      aiReviewComparePrompt: normalizePromptText(source.aiReviewComparePrompt || ""),
      aiReviewTemperature: normalizeOptionalNumberText(source.aiReviewTemperature, 0, 2, 3),
      aiReviewTopP: normalizeOptionalNumberText(source.aiReviewTopP, 0, 1, 3),
      aiReviewMaxTokens: normalizeOptionalIntegerText(source.aiReviewMaxTokens, 1, 8192),
      aiReviewMaxCompletionTokens: normalizeOptionalIntegerText(
        source.aiReviewMaxCompletionTokens,
        1,
        8192
      ),
      aiReviewPresencePenalty: normalizeOptionalNumberText(source.aiReviewPresencePenalty, -2, 2, 3),
      aiReviewFrequencyPenalty: normalizeOptionalNumberText(source.aiReviewFrequencyPenalty, -2, 2, 3),
      aiReviewSeed: normalizeOptionalIntegerText(source.aiReviewSeed, 0, 2147483647),
      aiReviewStopSequences: normalizeStopSequencesText(source.aiReviewStopSequences || ""),
      shortcuts: normalizeMagicDataShortcuts(source.shortcuts),
    };
  }

  function getLabelxActiveScriptId(settings) {
    return settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId || transcriptionProjectId;
  }

  function getDataBakerRoundOneConfig(settings) {
    const defaults =
      constants.DEFAULT_SETTINGS?.platforms?.dataBaker?.scripts?.roundOneQuality || {};
    const current =
      settings?.platforms?.dataBaker?.scripts?.roundOneQuality || {};

    const config = Object.assign(
      {
        id: dataBakerRoundOneQualityScriptId,
        enabled: true,
        aiRecommendEnabled: true,
        aiRecommendRequestTimeoutMs: 120000,
        aiRecommendListenModel: "qwen3.5-omni-flash",
        aiRecommendCompareModel: "qwen3.5-plus",
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
        autoPageSizeEnabled: true,
        defaultPageSize: "50条/页",
        shortcuts: {},
      },
      defaults,
      current
    );

    config.aiRecommendRequestTimeoutMs = normalizeDataBakerTimeoutMs(
      config.aiRecommendRequestTimeoutMs
    );
    config.aiRecommendListenModel = normalizeJudgementAiModelText(
      config.aiRecommendListenModel,
      "qwen3.5-omni-flash"
    );
    config.aiRecommendCompareModel = normalizeJudgementAiModelText(
      config.aiRecommendCompareModel,
      "qwen3.5-plus"
    );
    config.aiRecommendEnableThinking = config.aiRecommendEnableThinking === true;
    config.aiRecommendListenPrompt = normalizePromptText(config.aiRecommendListenPrompt || "");
    config.aiRecommendComparePrompt = normalizePromptText(config.aiRecommendComparePrompt || "");
    config.aiRecommendTemperature = normalizeOptionalNumberText(config.aiRecommendTemperature, 0, 2, 3);
    config.aiRecommendTopP = normalizeOptionalNumberText(config.aiRecommendTopP, 0, 1, 3);
    config.aiRecommendMaxTokens = normalizeOptionalIntegerText(config.aiRecommendMaxTokens, 1, 8192);
    config.aiRecommendMaxCompletionTokens = normalizeOptionalIntegerText(
      config.aiRecommendMaxCompletionTokens,
      1,
      8192
    );
    config.aiRecommendPresencePenalty = normalizeOptionalNumberText(
      config.aiRecommendPresencePenalty,
      -2,
      2,
      3
    );
    config.aiRecommendFrequencyPenalty = normalizeOptionalNumberText(
      config.aiRecommendFrequencyPenalty,
      -2,
      2,
      3
    );
    config.aiRecommendSeed = normalizeOptionalIntegerText(config.aiRecommendSeed, 0, 2147483647);
    config.aiRecommendStopSequences = normalizeStopSequencesText(config.aiRecommendStopSequences || "");
    config.autoPageSizeEnabled = config.autoPageSizeEnabled !== false;
    config.defaultPageSize = normalizeDataBakerPageSize(config.defaultPageSize, "50条/页");
    config.shortcuts = normalizeDataBakerShortcuts(config.shortcuts);
    return config;
  }

  function getTranscriptionAiConfig(settings) {
    const projectState =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[transcriptionProjectId] || {};
    const asrConfig = projectState.asrConfig || {};
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {};
    return {
      aiSuggestionRequestTimeoutMs: clampNumber(
        asrConfig.aiSuggestionRequestTimeoutMs,
        defaults.aiSuggestionRequestTimeoutMs || 120000,
        1000,
        180000,
        0
      ),
      aiSuggestionListenModel: normalizeJudgementAiModelText(
        asrConfig.aiSuggestionListenModel,
        defaults.aiSuggestionListenModel || "qwen3.5-omni-flash"
      ),
      aiSuggestionCompareModel: normalizeJudgementAiModelText(
        asrConfig.aiSuggestionCompareModel || asrConfig.aiSuggestionModel,
        defaults.aiSuggestionCompareModel || defaults.aiSuggestionModel || "qwen3.5-plus"
      ),
      aiSuggestionListenPrompt: normalizePromptText(asrConfig.aiSuggestionListenPrompt || ""),
      aiSuggestionComparePrompt: normalizePromptText(asrConfig.aiSuggestionComparePrompt || ""),
      aiSuggestionTemperature: normalizeOptionalNumberText(asrConfig.aiSuggestionTemperature, 0, 2, 3),
      aiSuggestionTopP: normalizeOptionalNumberText(asrConfig.aiSuggestionTopP, 0, 1, 3),
      aiSuggestionMaxTokens: normalizeOptionalIntegerText(asrConfig.aiSuggestionMaxTokens, 1, 8192),
      aiSuggestionMaxCompletionTokens: normalizeOptionalIntegerText(
        asrConfig.aiSuggestionMaxCompletionTokens,
        1,
        8192
      ),
      aiSuggestionPresencePenalty: normalizeOptionalNumberText(
        asrConfig.aiSuggestionPresencePenalty,
        -2,
        2,
        3
      ),
      aiSuggestionFrequencyPenalty: normalizeOptionalNumberText(
        asrConfig.aiSuggestionFrequencyPenalty,
        -2,
        2,
        3
      ),
      aiSuggestionSeed: normalizeOptionalIntegerText(asrConfig.aiSuggestionSeed, 0, 2147483647),
      aiSuggestionResponseFormat: normalizeResponseFormat(
        asrConfig.aiSuggestionResponseFormat,
        "json_object"
      ),
      aiSuggestionStopSequences: normalizeStopSequencesText(asrConfig.aiSuggestionStopSequences || ""),
      aiSuggestionEnableThinking: asrConfig.aiSuggestionEnableThinking === true,
    };
  }

  function buildAsrVoiceAiHeader(scriptId) {
    const scriptLabel = scriptLibrary[scriptId]?.label || scriptId;
    return [
      '<div class="asr-ai-head">',
      '<div class="asr-ai-title">',
      "<strong>ASR 语音 AI 设置</strong>",
      '<p class="asr-ai-copy">这些设置仅影响当前脚本的 AI 辅助能力。普通用户无需修改；后端地址仍由首页顶部“后端接口地址”统一控制。</p>',
      "</div>",
      '<span class="asr-ai-pill">' + escapeHtml(scriptLabel) + "</span>",
      "</div>",
    ].join("");
  }

  function renderAsrVoiceAiSettingsSection(settings, scriptId) {
    const panel = getElement("detail-shared-asr-ai-panel");
    if (!panel) {
      return;
    }
    if (!supportsAsrVoiceAiSettings(scriptId) || !isAsrVoiceAiUnlocked(scriptId)) {
      panel.classList.add("hidden");
      panel.innerHTML = "";
      return;
    }

    const headerHtml = buildAsrVoiceAiHeader(scriptId);
    const defaultsTipId = "asr-ai-defaults-tip";
    if (scriptId === judgementProjectId || scriptId === transcriptionProjectId) {
      const prefix = scriptId === judgementProjectId ? "judgement-ai-suggestion" : "transcription-ai-suggestion";
      panel.innerHTML = [
        '<div class="asr-ai-panel">',
        headerHtml,
        '<div class="asr-ai-note" id="' + defaultsTipId + '"></div>',
        '<div class="asr-ai-block"><strong>基础模型</strong><div class="asr-ai-grid two">',
        '<label class="asr-ai-field"><span>听音模型</span><select id="' + prefix + '-listen-model-select"></select></label>',
        '<label class="asr-ai-field"><span>比较模型</span><select id="' + prefix + '-compare-model-select"></select></label>',
        '<label class="asr-ai-field"><span>听音模型自定义</span><input id="' + prefix + '-listen-model-custom" type="text" class="hidden" autocomplete="off" /></label>',
        '<label class="asr-ai-field"><span>比较模型自定义</span><input id="' + prefix + '-compare-model-custom" type="text" class="hidden" autocomplete="off" /></label>',
        '<label class="asr-ai-field"><span>请求超时时间（ms）</span><input id="' + prefix + '-timeout" type="number" min="1000" max="180000" step="1000" /></label>',
        '<label class="asr-ai-field"><span>思考开关</span><label class="asr-ai-boolean"><input id="' + prefix + '-enable-thinking" type="checkbox" /><span>启用 thinking（不支持时后端自动降级）</span></label></label>',
        scriptId === judgementProjectId
          ? '<label class="asr-ai-field"><span>联网搜索</span><label class="asr-ai-boolean"><input id="' + prefix + '-web-search-enabled" type="checkbox" /><span>启用 Web Search 联网搜索（专有名词/实体词消歧）</span></label></label>'
          : "",
        "</div></div>",
        '<div class="asr-ai-block"><strong>Prompt</strong><div class="asr-ai-grid">',
        '<label class="asr-ai-field"><span>听音 Prompt（可选）</span><textarea id="' + prefix + '-listen-prompt" maxlength="8000"></textarea><span class="asr-ai-help">留空或恢复默认时，使用后端默认 Prompt。</span></label>',
        '<label class="asr-ai-field"><span>比较 Prompt（可选）</span><textarea id="' + prefix + '-compare-prompt" maxlength="8000"></textarea><span class="asr-ai-help">留空或恢复默认时，使用后端默认 Prompt。</span></label>',
        "</div></div>",
        '<div class="asr-ai-block"><strong>生成参数</strong><div class="asr-ai-grid three">',
        '<label class="asr-ai-field"><span>temperature</span><input id="' + prefix + '-temperature" type="number" min="0" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>top_p</span><input id="' + prefix + '-top-p" type="number" min="0" max="1" step="0.05" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>max_tokens</span><input id="' + prefix + '-max-tokens" type="number" min="1" max="8192" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>max_completion_tokens</span><input id="' + prefix + '-max-completion-tokens" type="number" min="1" max="8192" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>presence_penalty</span><input id="' + prefix + '-presence-penalty" type="number" min="-2" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>frequency_penalty</span><input id="' + prefix + '-frequency-penalty" type="number" min="-2" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>seed</span><input id="' + prefix + '-seed" type="number" min="0" max="2147483647" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>stop sequences（每行一个）</span><textarea id="' + prefix + '-stop-sequences" maxlength="960"></textarea><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        "</div></div>",
        "</div>",
      ].join("");
      bindJudgementModelSelect(prefix + "-listen-model-select", prefix + "-listen-model-custom");
      bindJudgementModelSelect(prefix + "-compare-model-select", prefix + "-compare-model-custom");
      panel.classList.remove("hidden");
      return;
    }

    if (scriptId === dataBakerRoundOneQualityScriptId || scriptId === magicDataAnnotatorScriptId) {
      const prefix = scriptId === dataBakerRoundOneQualityScriptId ? "data-baker-ai" : "magic-data-ai";
      const modelLabel = scriptId === dataBakerRoundOneQualityScriptId ? "比较模型" : "质检模型";
      panel.innerHTML = [
        '<div class="asr-ai-panel">',
        headerHtml,
        '<div class="asr-ai-note" id="' + defaultsTipId + '"></div>',
        '<div class="asr-ai-block"><strong>基础模型</strong><div class="asr-ai-grid two">',
        scriptId === dataBakerRoundOneQualityScriptId
          ? '<label class="asr-ai-field"><span>启用 AI 推荐文本</span><label class="asr-ai-boolean"><input id="data-baker-ai-recommend-enabled" type="checkbox" /><span>关闭后不显示 AI 推荐工具卡</span></label></label>'
          : '<label class="asr-ai-field"><span>启用 AI 质检助手</span><label class="asr-ai-boolean"><input id="magic-data-enabled" type="checkbox" /><span>关闭后不显示 AI 质检建议</span></label></label>',
        '<label class="asr-ai-field"><span>听音模型</span><select id="' + prefix + '-listen-model-select"></select></label>',
        '<label class="asr-ai-field"><span>' + modelLabel + '</span><select id="' + prefix + '-compare-model-select"></select></label>',
        '<label class="asr-ai-field"><span>听音模型自定义</span><input id="' + prefix + '-listen-model-custom" type="text" class="hidden" autocomplete="off" /></label>',
        '<label class="asr-ai-field"><span>' + modelLabel + '自定义</span><input id="' + prefix + '-compare-model-custom" type="text" class="hidden" autocomplete="off" /></label>',
        '<label class="asr-ai-field"><span>请求超时时间（ms）</span><input id="' + prefix + '-timeout" type="number" min="1000" max="300000" step="1000" /></label>',
        '<label class="asr-ai-field"><span>思考开关</span><label class="asr-ai-boolean"><input id="' + prefix + '-enable-thinking" type="checkbox" /><span>启用 thinking（不支持时后端自动降级）</span></label></label>',
        scriptId === magicDataAnnotatorScriptId
          ? '<label class="asr-ai-field"><span>AI 质检模式</span><select id="magic-data-review-mode"><option value="rule_first">规则优先</option><option value="listen_assisted">听音辅助</option><option value="strict_review">严格复核</option></select></label>'
          : "",
        scriptId === magicDataAnnotatorScriptId
          ? '<label class="asr-ai-field"><label class="asr-ai-boolean"><input id="magic-data-show-heard-text" type="checkbox" /><span>显示 AI 听音文本</span></label></label>'
          : "",
        scriptId === magicDataAnnotatorScriptId
          ? '<label class="asr-ai-field"><label class="asr-ai-boolean"><input id="magic-data-show-estimated-income" type="checkbox" /><span>显示预计金额</span></label></label>'
          : "",
        "</div></div>",
        '<div class="asr-ai-block"><strong>Prompt</strong><div class="asr-ai-grid">',
        '<label class="asr-ai-field"><span>听音 Prompt（可选）</span><textarea id="' + prefix + '-listen-prompt" maxlength="8000"></textarea><span class="asr-ai-help">留空或恢复默认时，使用后端默认 Prompt。</span></label>',
        '<label class="asr-ai-field"><span>' + modelLabel + ' Prompt（可选）</span><textarea id="' + prefix + '-compare-prompt" maxlength="8000"></textarea><span class="asr-ai-help">留空或恢复默认时，使用后端默认 Prompt。</span></label>',
        "</div></div>",
        '<div class="asr-ai-block"><strong>生成参数</strong><div class="asr-ai-grid three">',
        '<label class="asr-ai-field"><span>temperature</span><input id="' + prefix + '-temperature" type="number" min="0" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>top_p</span><input id="' + prefix + '-top-p" type="number" min="0" max="1" step="0.05" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>max_tokens</span><input id="' + prefix + '-max-tokens" type="number" min="1" max="8192" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>max_completion_tokens</span><input id="' + prefix + '-max-completion-tokens" type="number" min="1" max="8192" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>presence_penalty</span><input id="' + prefix + '-presence-penalty" type="number" min="-2" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>frequency_penalty</span><input id="' + prefix + '-frequency-penalty" type="number" min="-2" max="2" step="0.1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>seed</span><input id="' + prefix + '-seed" type="number" min="0" max="2147483647" step="1" /><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        '<label class="asr-ai-field"><span>stop sequences（每行一个）</span><textarea id="' + prefix + '-stop-sequences" maxlength="960"></textarea><span class="asr-ai-help">清空后使用后端默认值。</span></label>',
        "</div></div>",
        "</div>",
      ].join("");
      bindJudgementModelSelect(prefix + "-listen-model-select", prefix + "-listen-model-custom");
      bindJudgementModelSelect(prefix + "-compare-model-select", prefix + "-compare-model-custom");
      panel.classList.remove("hidden");
      return;
    }

    panel.classList.add("hidden");
    panel.innerHTML = "";
  }

  function isScriptEnabled(settings, scriptId) {
    if (scriptId === lightwheelScriptId) {
      return Boolean(
        settings?.platforms?.lightwheel?.enabled &&
          settings?.platforms?.lightwheel?.scripts?.viewPanel?.enabled
      );
    }

    if (isDataBakerScript(scriptId)) {
      const config = getDataBakerRoundOneConfig(settings);
      return Boolean(settings?.platforms?.dataBaker?.enabled !== false && config.enabled !== false);
    }

    if (isMagicDataScript(scriptId)) {
      const config = getMagicDataConfig(settings);
      return config.enabled !== false && config.aiReviewEnabled !== false;
    }

    if (isLabelxScript(scriptId)) {
      return Boolean(
        settings?.platforms?.alibabaLabelx?.enabled &&
          getLabelxActiveScriptId(settings) === scriptId
      );
    }

    return false;
  }

  function getScriptStatus(settings, scriptId) {
    if (scriptId === lightwheelScriptId) {
      return isScriptEnabled(settings, scriptId)
        ? { text: "已启用", tone: "enabled" }
        : { text: "未启用", tone: "disabled" };
    }

    if (isDataBakerScript(scriptId)) {
      const config = getDataBakerRoundOneConfig(settings);
      if (!isScriptEnabled(settings, scriptId)) {
        return { text: "未启用", tone: "disabled" };
      }
      return config.aiRecommendEnabled === false
        ? { text: "脚本已启用，AI 推荐已关闭", tone: "pending" }
        : { text: "已启用", tone: "enabled" };
    }

    if (isMagicDataScript(scriptId)) {
      const config = getMagicDataConfig(settings);
      if (!isScriptEnabled(settings, scriptId)) {
        return { text: "未启用", tone: "disabled" };
      }
      return config.aiReviewEnabled === false
        ? { text: "脚本已启用，AI 质检已关闭", tone: "pending" }
        : { text: "已启用", tone: "enabled" };
    }

    const labelxEnabled = Boolean(settings?.platforms?.alibabaLabelx?.enabled);
    const activeScriptId = getLabelxActiveScriptId(settings);

    if (!labelxEnabled) {
      return { text: "未启用", tone: "disabled" };
    }

    if (activeScriptId === scriptId) {
      return { text: "当前生效", tone: "enabled" };
    }

    const activeScript = scriptLibrary[activeScriptId] || {};
    return {
      text: "同平台当前为 " + String(activeScript.shortLabel || activeScript.label || activeScriptId),
      tone: "pending",
    };
  }

  function getScriptHostText(scriptId) {
    if (scriptId === lightwheelScriptId) {
      return "https://label-cloud.lightwheel.net/w/video3/index.html?access=1";
    }

    if (isDataBakerScript(scriptId)) {
      return "https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0";
    }

    if (isMagicDataScript(scriptId)) {
      return "https://work.magicdatatech.com/#/asrmark?taskItemId=...";
    }

    return "https://labelx.alibaba-inc.com/corpora/labeling/*";
  }

  function setScriptStatusNode(node, status) {
    node.textContent = status.text;
    node.className = "script-pill " + status.tone;
  }

  function normalizeTranscriptionConfig(settings) {
    const projectState =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[transcriptionProjectId] || {};
    const asrConfig = projectState.asrConfig || {};
    const defaults = constants.DEFAULT_ASR_CONFIG || {
      autoPlay: false,
      defaultValid: false,
      fillOnValid: true,
      clearOnInvalid: true,
      playbackRateValue: 1,
      resetRateValue: 1,
      rateStepValue: 0.1,
      seekStepSeconds: 1,
      volumeValue: 100,
      shortcutPlayPause: null,
      shortcutValid: null,
      shortcutInvalid: null,
      shortcutFill: null,
      shortcutRemoveSpaces: null,
      shortcutConvertNum: null,
      shortcutToggleFocus: null,
      shortcutBackward: null,
      shortcutForward: null,
      shortcutSpeedDown: null,
      shortcutSpeedUp: null,
      shortcutResetSpeed: null,
      shortcutVolDown: null,
      shortcutVolUp: null,
      shortcutResetVol: null,
      shortcutCopyDuration: null,
      shortcutUploadStats: null,
      shortcutAiSuggest: null,
      shortcutApplyAiSuggestion: null,
      statsUploadEnabled: true,
      statsUploadTimes: ["10:00", "16:00"],
      statsUploadJitterMinutes: 10,
      statsAutoUploadOnSchedule: true,
      statsUploadRequestTimeoutMs: 20000,
    };

    const shortcuts = {};
    transcriptionShortcutActions.forEach(function (action) {
      const sourceShortcut = hasOwn(asrConfig, action.key)
        ? asrConfig[action.key]
        : hasOwn(defaults, action.key)
          ? defaults[action.key]
          : null;
      shortcuts[action.key] = normalizeShortcut(sourceShortcut);
    });

    const resetRateValue = clampNumber(
      hasOwn(asrConfig, "resetRateValue")
        ? asrConfig.resetRateValue
        : hasOwn(asrConfig, "playbackRateValue")
          ? asrConfig.playbackRateValue
          : defaults.resetRateValue || defaults.playbackRateValue || 1,
      defaults.resetRateValue || defaults.playbackRateValue || 1,
      0.25,
      5,
      2
    );

    return {
      autoPlay: asrConfig.autoPlay === true,
      defaultValid: asrConfig.defaultValid === true,
      fillOnValid: asrConfig.fillOnValid !== false,
      clearOnInvalid: asrConfig.clearOnInvalid !== false,
      playbackRateValue: clampNumber(
        hasOwn(asrConfig, "playbackRateValue") ? asrConfig.playbackRateValue : resetRateValue,
        resetRateValue,
        0.25,
        5,
        2
      ),
      resetRateValue: resetRateValue,
      rateStepValue: normalizeTranscriptionRateStep(
        asrConfig.rateStepValue,
        defaults.rateStepValue || 0.1
      ),
      seekStepSeconds: normalizeTranscriptionSeekStep(
        asrConfig.seekStepSeconds,
        defaults.seekStepSeconds || 1
      ),
      volumeValue: clampNumber(
        asrConfig.volumeValue,
        defaults.volumeValue || 100,
        0,
        1000,
        0
      ),
      shortcuts: shortcuts,
      statsUploadEnabled: true,
      statsUploadTimes: normalizeTimeList(asrConfig.statsUploadTimes, defaults.statsUploadTimes),
      statsUploadJitterMinutes: clampNumber(
        asrConfig.statsUploadJitterMinutes,
        defaults.statsUploadJitterMinutes || 10,
        0,
        120,
        0
      ),
      statsAutoUploadOnSchedule: true,
      statsUploadRequestTimeoutMs: clampNumber(
        asrConfig.statsUploadRequestTimeoutMs,
        defaults.statsUploadRequestTimeoutMs || 20000,
        1000,
        120000,
        0
      ),
    };
  }

  function normalizeJudgementConfig(settings) {
    const projectState =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[judgementProjectId] || {};
    const asrConfig = projectState.asrConfig || {};
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {
      autoPlay: true,
      autoResetRate: true,
      resetRateValue: 1.0,
      playbackRateValue: 1.0,
      rateStepValue: 0.25,
      seekStepSeconds: 0.5,
      volumeValue: 100,
      itemsPerPage: "50 条/页",
      virtualWindowEnabled: false,
      asrDiffViewEnabled: true,
      asrDiffColors: {
        changeBackground: "#fef3c7",
        gapBackground: "#fee2e2",
        punctuationBackground: "#ede9fe",
      },
      compactCardEnabled: true,
      thunderQuestionEnabled: true,
      autoAdvanceAfterChoice: false,
      statsUploadEnabled: true,
      statsScheduleUrl: "",
      statsUploadTimes: ["10:00", "16:00"],
      statsUploadJitterMinutes: 10,
      statsAutoUploadOnSubtaskOpen: false,
      statsAutoUploadOnSchedule: true,
      statsUploadRequestTimeoutMs: 20000,
      aiSuggestionEnabled: true,
      aiSuggestionRequestTimeoutMs: 120000,
      aiSuggestionListenModel: "qwen3.5-omni-flash",
      aiSuggestionCompareModel: "qwen3.5-plus",
      aiSuggestionListenPrompt: "",
      aiSuggestionComparePrompt: "",
      aiSuggestionTemperature: "",
      aiSuggestionTopP: "",
      aiSuggestionMaxTokens: "",
      aiSuggestionMaxCompletionTokens: "",
      aiSuggestionPresencePenalty: "",
      aiSuggestionFrequencyPenalty: "",
      aiSuggestionSeed: "",
      aiSuggestionResponseFormat: "json_object",
      aiSuggestionReasoningEffort: "",
      aiSuggestionStopSequences: "",
      aiSuggestionEnableThinking: false,
      aiSuggestionWebSearchEnabled: true,
      aiSuggestionModel: "qwen3.5-plus",
      aiSuggestionAvailableModels: judgementAiCompareModels.slice(),
      shortcuts: {
        volumeUp: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "[",
          button: null,
        },
        volumeDown: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "]",
          button: null,
        },
        volumeReset: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "\\",
          button: null,
        },
        seekBackward: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "ArrowLeft",
          button: null,
        },
        seekForward: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "ArrowRight",
          button: null,
        },
      },
    };
    const shortcuts = {};
    const asrDiffColors = normalizeJudgementDiffColors(
      asrConfig.asrDiffColors,
      defaults.asrDiffColors
    );

    judgementShortcutActions.forEach(function (action) {
      const shortcut = hasOwn(asrConfig.shortcuts || {}, action.key)
        ? asrConfig.shortcuts[action.key]
        : hasOwn(defaults.shortcuts || {}, action.key)
        ? defaults.shortcuts[action.key]
        : null;
      shortcuts[action.key] = normalizeShortcut(shortcut);
    });

    const defaultPlaybackRate = clampNumber(
      hasOwn(asrConfig, "resetRateValue") ? asrConfig.resetRateValue : asrConfig.playbackRateValue,
      defaults.resetRateValue || defaults.playbackRateValue || 1,
      0.25,
      5,
      2
    );

    return {
      autoPlay: asrConfig.autoPlay !== false,
      autoResetRate: true,
      resetRateValue: defaultPlaybackRate,
      playbackRateValue: defaultPlaybackRate,
      rateStepValue: normalizeJudgementRateStep(
        asrConfig.rateStepValue,
        defaults.rateStepValue || 0.25
      ),
      seekStepSeconds: normalizeJudgementSeekStep(
        asrConfig.seekStepSeconds,
        defaults.seekStepSeconds || 0.5
      ),
      volumeValue:
        typeof asrConfig.volumeValue === "number" && asrConfig.volumeValue >= 0
          ? asrConfig.volumeValue
          : defaults.volumeValue,
      itemsPerPage: normalizeJudgementItemsPerPage(
        asrConfig.itemsPerPage,
        defaults.itemsPerPage || "50 条/页"
      ),
      virtualWindowEnabled: false,
      asrDiffViewEnabled: asrConfig.asrDiffViewEnabled !== false,
      asrDiffColors: asrDiffColors,
      compactCardEnabled: asrConfig.compactCardEnabled !== false,
      thunderQuestionEnabled: asrConfig.thunderQuestionEnabled !== false,
      autoAdvanceAfterChoice: asrConfig.autoAdvanceAfterChoice === true,
      statsUploadEnabled: true,
      statsScheduleUrl:
        typeof asrConfig.statsScheduleUrl === "string" ? asrConfig.statsScheduleUrl.trim() : "",
      statsUploadTimes: normalizeTimeList(
        asrConfig.statsUploadTimes,
        defaults.statsUploadTimes
      ),
      statsUploadJitterMinutes: clampNumber(
        asrConfig.statsUploadJitterMinutes,
        defaults.statsUploadJitterMinutes || 10,
        0,
        120,
        0
      ),
      statsAutoUploadOnSubtaskOpen: false,
      statsAutoUploadOnSchedule: true,
      statsUploadRequestTimeoutMs: clampNumber(
        asrConfig.statsUploadRequestTimeoutMs,
        defaults.statsUploadRequestTimeoutMs || 20000,
        1000,
        120000,
        0
      ),
      aiSuggestionEnabled: true,
      aiSuggestionRequestTimeoutMs: clampNumber(
        asrConfig.aiSuggestionRequestTimeoutMs,
        defaults.aiSuggestionRequestTimeoutMs || 120000,
        1000,
        180000,
        0
      ),
      aiSuggestionAvailableModels: normalizeJudgementAiAvailableModels(
        asrConfig.aiSuggestionAvailableModels,
        defaults.aiSuggestionAvailableModels
      ),
      aiSuggestionListenModel: normalizeJudgementAiModelText(
        asrConfig.aiSuggestionListenModel,
        defaults.aiSuggestionListenModel || "qwen3.5-omni-flash"
      ),
      aiSuggestionCompareModel: normalizeJudgementAiModelText(
        asrConfig.aiSuggestionCompareModel || asrConfig.aiSuggestionModel,
        defaults.aiSuggestionCompareModel || defaults.aiSuggestionModel || "qwen3.5-plus"
      ),
      aiSuggestionListenPrompt: normalizePromptText(asrConfig.aiSuggestionListenPrompt || ""),
      aiSuggestionComparePrompt: normalizePromptText(asrConfig.aiSuggestionComparePrompt || ""),
      aiSuggestionTemperature: normalizeOptionalNumberText(
        asrConfig.aiSuggestionTemperature,
        0,
        2,
        3
      ),
      aiSuggestionTopP: normalizeOptionalNumberText(asrConfig.aiSuggestionTopP, 0, 1, 3),
      aiSuggestionMaxTokens: normalizeOptionalIntegerText(asrConfig.aiSuggestionMaxTokens, 1, 8192),
      aiSuggestionMaxCompletionTokens: normalizeOptionalIntegerText(
        asrConfig.aiSuggestionMaxCompletionTokens,
        1,
        8192
      ),
      aiSuggestionPresencePenalty: normalizeOptionalNumberText(
        asrConfig.aiSuggestionPresencePenalty,
        -2,
        2,
        3
      ),
      aiSuggestionFrequencyPenalty: normalizeOptionalNumberText(
        asrConfig.aiSuggestionFrequencyPenalty,
        -2,
        2,
        3
      ),
      aiSuggestionSeed: normalizeOptionalIntegerText(asrConfig.aiSuggestionSeed, 0, 2147483647),
      aiSuggestionResponseFormat: normalizeResponseFormat(
        asrConfig.aiSuggestionResponseFormat,
        defaults.aiSuggestionResponseFormat || "json_object"
      ),
      aiSuggestionReasoningEffort: "",
      aiSuggestionStopSequences: normalizeStopSequencesText(asrConfig.aiSuggestionStopSequences),
      aiSuggestionEnableThinking: asrConfig.aiSuggestionEnableThinking === true,
      aiSuggestionWebSearchEnabled: asrConfig.aiSuggestionWebSearchEnabled !== false,
      aiSuggestionModel: normalizeJudgementAiModelText(
        asrConfig.aiSuggestionCompareModel || asrConfig.aiSuggestionModel,
        defaults.aiSuggestionCompareModel || defaults.aiSuggestionModel || "qwen3.5-plus"
      ),
      shortcuts: shortcuts,
    };
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

  function normalizeKeyName(key) {
    if (key === " ") {
      return "Space";
    }
    return String(key || "");
  }

  function formatShortcut(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    if (!normalized) {
      return "未设置";
    }

    const parts = [];
    if (normalized.ctrl) {
      parts.push("Ctrl");
    }
    if (normalized.alt) {
      parts.push("Alt");
    }
    if (normalized.shift) {
      parts.push("Shift");
    }
    if (normalized.meta) {
      parts.push("Meta");
    }

    if (typeof normalized.button === "number") {
      parts.push(mouseButtonLabels[normalized.button] || "Mouse" + normalized.button);
    } else {
      parts.push(normalizeKeyName(normalized.key));
    }

    return parts.join(" + ");
  }

  function isModifierOnlyKey(key) {
    return ["Control", "Alt", "Shift", "Meta"].indexOf(key) >= 0;
  }

  function shortcutFromKeyboardEvent(event) {
    if (event.key === "Escape") {
      return null;
    }

    if (isModifierOnlyKey(event.key)) {
      return false;
    }

    return {
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
      key: event.key === " " ? "Space" : String(event.key),
      button: null,
    };
  }

  function shortcutFromMouseEvent(event) {
    return {
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
      key: null,
      button: event.button,
    };
  }

  function ensureShortcutDraft() {
    judgementShortcutActions.forEach(function (action) {
      if (!Object.prototype.hasOwnProperty.call(judgementShortcutsDraft, action.key)) {
        judgementShortcutsDraft[action.key] = null;
      }
    });
  }

  function renderJudgementShortcutGrid() {
    const grid = getElement("judgement-shortcut-grid");
    if (!grid) {
      return;
    }

    ensureShortcutDraft();
    grid.innerHTML = judgementShortcutActions
      .map(function (action) {
        const recording = judgementRecordingKey === action.key;
        return [
          '<div class="shortcut-row">',
          '<span class="shortcut-label">' + escapeHtml(action.label) + "</span>",
          '<span class="shortcut-value">' +
            escapeHtml(recording ? "录制中..." : formatShortcut(judgementShortcutsDraft[action.key])) +
            "</span>",
          '<button type="button" class="secondary-button" data-record-judgement-shortcut="' +
            escapeHtml(action.key) +
            '">' +
            (recording ? "录制中" : "录制") +
            "</button>",
          '<button type="button" class="ghost-button" data-clear-judgement-shortcut="' +
            escapeHtml(action.key) +
            '">删除</button>',
          "</div>",
        ].join("");
      })
      .join("");

    Array.from(grid.querySelectorAll("[data-record-judgement-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        startJudgementShortcutRecording(button.getAttribute("data-record-judgement-shortcut"));
      });
    });

    Array.from(grid.querySelectorAll("[data-clear-judgement-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-clear-judgement-shortcut");
        judgementShortcutsDraft[key] = null;
        if (judgementRecordingKey === key) {
          stopJudgementShortcutRecording("快捷键录制已取消。");
          return;
        }
        setJudgementRecordingStatus("快捷键已删除，保存后生效。");
        renderJudgementShortcutGrid();
      });
    });
  }

  function setJudgementRecordingStatus(text) {
    const node = getElement("judgement-recording-status");
    if (!node) {
      return;
    }

    node.textContent = text || "";
    node.classList.toggle("hidden", !text);
  }

  function stopJudgementShortcutRecording(statusText) {
    if (typeof stopJudgementRecordingListeners === "function") {
      stopJudgementRecordingListeners();
      stopJudgementRecordingListeners = null;
    }

    judgementRecordingKey = null;
    setJudgementRecordingStatus(statusText || "");
    renderJudgementShortcutGrid();
  }

  function applyRecordedJudgementShortcut(shortcut) {
    if (!judgementRecordingKey || shortcut === false) {
      return;
    }

    if (!shortcut) {
      stopJudgementShortcutRecording("已取消快捷键录制。");
      return;
    }

    judgementShortcutsDraft[judgementRecordingKey] = normalizeShortcut(shortcut);
    stopJudgementShortcutRecording("快捷键已录制，保存后生效。");
  }

  function startJudgementShortcutRecording(actionKey) {
    if (!actionKey) {
      return;
    }

    if (typeof stopJudgementRecordingListeners === "function") {
      stopJudgementRecordingListeners();
    }

    judgementRecordingKey = actionKey;
    const action = judgementShortcutActions.find(function (item) {
      return item.key === actionKey;
    });

    setJudgementRecordingStatus(
      "正在录制「" + String(action?.label || actionKey) + "」：按键盘组合或鼠标按键，Esc 取消。"
    );

    function preventMouseDefaultOnce(event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }

    function suppressMouseFollowup() {
      ["mouseup", "auxclick", "contextmenu"].forEach(function (eventName) {
        window.addEventListener(eventName, preventMouseDefaultOnce, {
          capture: true,
          once: true,
        });
      });
      window.setTimeout(function () {
        ["mouseup", "auxclick", "contextmenu"].forEach(function (eventName) {
          window.removeEventListener(eventName, preventMouseDefaultOnce, true);
        });
      }, 800);
    }

    const keydownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      applyRecordedJudgementShortcut(shortcutFromKeyboardEvent(event));
    };
    const mousedownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      suppressMouseFollowup();
      applyRecordedJudgementShortcut(shortcutFromMouseEvent(event));
    };

    window.addEventListener("keydown", keydownListener, true);
    window.addEventListener("mousedown", mousedownListener, true);
    stopJudgementRecordingListeners = function () {
      window.removeEventListener("keydown", keydownListener, true);
      window.removeEventListener("mousedown", mousedownListener, true);
    };

    renderJudgementShortcutGrid();
  }

  function ensureDataBakerShortcutDraft() {
    dataBakerShortcutActions.forEach(function (action) {
      if (!hasOwn(dataBakerShortcutsDraft, action.key)) {
        dataBakerShortcutsDraft[action.key] = null;
      }
    });
  }

  function renderDataBakerShortcutGrid() {
    const grid = getElement("data-baker-shortcut-grid");
    if (!grid) {
      return;
    }

    ensureDataBakerShortcutDraft();
    grid.innerHTML = dataBakerShortcutActions
      .map(function (action) {
        const recording = dataBakerRecordingKey === action.key;
        return [
          '<div class="shortcut-row">',
          '<span class="shortcut-label">' + escapeHtml(action.label) + "</span>",
          '<span class="shortcut-value">' +
            escapeHtml(recording ? "录制中..." : formatShortcut(dataBakerShortcutsDraft[action.key])) +
            "</span>",
          '<button type="button" class="secondary-button" data-record-data-baker-shortcut="' +
            escapeHtml(action.key) +
            '">' +
            (recording ? "录制中" : "录制") +
            "</button>",
          '<button type="button" class="ghost-button" data-clear-data-baker-shortcut="' +
            escapeHtml(action.key) +
            '">删除</button>',
          "</div>",
        ].join("");
      })
      .join("");

    Array.from(grid.querySelectorAll("[data-record-data-baker-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        startDataBakerShortcutRecording(button.getAttribute("data-record-data-baker-shortcut"));
      });
    });

    Array.from(grid.querySelectorAll("[data-clear-data-baker-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-clear-data-baker-shortcut");
        dataBakerShortcutsDraft[key] = null;
        if (dataBakerRecordingKey === key) {
          stopDataBakerShortcutRecording("快捷键录制已取消。");
          return;
        }
        setDataBakerRecordingStatus("快捷键已删除，保存后生效。");
        renderDataBakerShortcutGrid();
      });
    });
  }

  function setDataBakerRecordingStatus(text) {
    const node = getElement("data-baker-recording-status");
    if (!node) {
      return;
    }

    node.textContent = text || "";
    node.classList.toggle("hidden", !text);
  }

  function stopDataBakerShortcutRecording(statusText) {
    if (typeof stopDataBakerRecordingListeners === "function") {
      stopDataBakerRecordingListeners();
      stopDataBakerRecordingListeners = null;
    }

    dataBakerRecordingKey = null;
    setDataBakerRecordingStatus(statusText || "");
    renderDataBakerShortcutGrid();
  }

  function applyRecordedDataBakerShortcut(shortcut) {
    if (!dataBakerRecordingKey || shortcut === false) {
      return;
    }

    if (!shortcut) {
      stopDataBakerShortcutRecording("已取消快捷键录制。");
      return;
    }

    dataBakerShortcutsDraft[dataBakerRecordingKey] = normalizeNullableShortcut(shortcut);
    stopDataBakerShortcutRecording("快捷键已录制，保存后生效。");
  }

  function startDataBakerShortcutRecording(actionKey) {
    if (!actionKey) {
      return;
    }

    if (typeof stopDataBakerRecordingListeners === "function") {
      stopDataBakerRecordingListeners();
    }

    dataBakerRecordingKey = actionKey;
    const action = dataBakerShortcutActions.find(function (item) {
      return item.key === actionKey;
    });

    setDataBakerRecordingStatus(
      "正在录制「" + String(action?.label || actionKey) + "」：按键盘组合，Esc 取消。"
    );

    const keydownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      applyRecordedDataBakerShortcut(shortcutFromKeyboardEvent(event));
    };

    window.addEventListener("keydown", keydownListener, true);
    stopDataBakerRecordingListeners = function () {
      window.removeEventListener("keydown", keydownListener, true);
    };

    renderDataBakerShortcutGrid();
  }

  function ensureMagicDataShortcutDraft() {
    magicDataShortcutActions.forEach(function (action) {
      if (!hasOwn(magicDataShortcutsDraft, action.key)) {
        magicDataShortcutsDraft[action.key] = null;
      }
    });
  }

  function setMagicDataRecordingStatus(text) {
    const node = getElement("magic-data-recording-status");
    if (!node) {
      return;
    }
    node.textContent = text || "";
    node.classList.toggle("hidden", !text);
  }

  function renderMagicDataShortcutGrid() {
    const grid = getElement("magic-data-shortcut-grid");
    if (!grid) {
      return;
    }
    ensureMagicDataShortcutDraft();
    grid.innerHTML = magicDataShortcutActions
      .map(function (action) {
        const recording = magicDataRecordingKey === action.key;
        return [
          '<div class="shortcut-row">',
          '<span class="shortcut-label">' + escapeHtml(action.label) + "</span>",
          '<span class="shortcut-value">' +
            escapeHtml(recording ? "录制中..." : formatShortcut(magicDataShortcutsDraft[action.key])) +
            "</span>",
          '<button type="button" class="secondary-button" data-record-magic-data-shortcut="' +
            escapeHtml(action.key) +
            '">' +
            (recording ? "录制中" : "录制") +
            "</button>",
          '<button type="button" class="ghost-button" data-clear-magic-data-shortcut="' +
            escapeHtml(action.key) +
            '">删除</button>',
          "</div>",
        ].join("");
      })
      .join("");

    Array.from(grid.querySelectorAll("[data-record-magic-data-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        startMagicDataShortcutRecording(button.getAttribute("data-record-magic-data-shortcut"));
      });
    });

    Array.from(grid.querySelectorAll("[data-clear-magic-data-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-clear-magic-data-shortcut");
        magicDataShortcutsDraft[key] = null;
        if (magicDataRecordingKey === key) {
          stopMagicDataShortcutRecording("快捷键录制已取消。");
          return;
        }
        setMagicDataRecordingStatus("快捷键已删除，保存后生效。");
        renderMagicDataShortcutGrid();
      });
    });
  }

  function stopMagicDataShortcutRecording(statusText) {
    if (typeof stopMagicDataRecordingListeners === "function") {
      stopMagicDataRecordingListeners();
      stopMagicDataRecordingListeners = null;
    }
    magicDataRecordingKey = null;
    setMagicDataRecordingStatus(statusText || "");
    renderMagicDataShortcutGrid();
  }

  function applyRecordedMagicDataShortcut(shortcut) {
    if (!magicDataRecordingKey || shortcut === false) {
      return;
    }
    if (!shortcut) {
      stopMagicDataShortcutRecording("已取消快捷键录制。");
      return;
    }
    magicDataShortcutsDraft[magicDataRecordingKey] = normalizeNullableShortcut(shortcut);
    stopMagicDataShortcutRecording("快捷键已录制，保存后生效。");
  }

  function startMagicDataShortcutRecording(actionKey) {
    if (!actionKey) {
      return;
    }
    if (typeof stopMagicDataRecordingListeners === "function") {
      stopMagicDataRecordingListeners();
    }
    magicDataRecordingKey = actionKey;
    const action = magicDataShortcutActions.find(function (item) {
      return item.key === actionKey;
    });

    setMagicDataRecordingStatus(
      "正在录制「" + String(action?.label || actionKey) + "」：按键盘组合，Esc 取消。"
    );

    const keydownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      applyRecordedMagicDataShortcut(shortcutFromKeyboardEvent(event));
    };

    window.addEventListener("keydown", keydownListener, true);
    stopMagicDataRecordingListeners = function () {
      window.removeEventListener("keydown", keydownListener, true);
    };

    renderMagicDataShortcutGrid();
  }

  function applyMagicDataSettingsForm(settings) {
    const config = getMagicDataConfig(settings);
    const defaultsPayload = getAsrVoiceAiDefaultsCached(magicDataAnnotatorScriptId);
    const aiDefaults = defaultsPayload.defaults || {};
    magicDataShortcutsDraft = clone(config.shortcuts) || {};
    if (getElement("magic-data-enabled")) {
      getElement("magic-data-enabled").checked = config.enabled !== false;
      applyJudgementModelField(
        "magic-data-ai-listen-model-select",
        "magic-data-ai-listen-model-custom",
        getAsrVoiceAiEffectiveText(config.listenModel, aiDefaults.listenModel),
        judgementAiListenModels,
        "listen"
      );
      applyJudgementModelField(
        "magic-data-ai-compare-model-select",
        "magic-data-ai-compare-model-custom",
        getAsrVoiceAiEffectiveText(config.reviewModel, aiDefaults.reviewModel || aiDefaults.compareModel),
        judgementAiCompareModels,
        "compare"
      );
      getElement("magic-data-review-mode").value = config.reviewMode;
      getElement("magic-data-show-heard-text").checked = config.showHeardText !== false;
      getElement("magic-data-show-estimated-income").checked =
        config.showEstimatedIncome !== false;
      getElement("magic-data-ai-timeout").value = String(
        Number(config.aiReviewRequestTimeoutMs || aiDefaults.timeoutMs || 120000)
      );
      getElement("magic-data-ai-enable-thinking").checked = Boolean(
        config.enableThinking === true ||
          (config.enableThinking !== true && aiDefaults.enableThinking === true)
      );
      getElement("magic-data-ai-listen-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewListenPrompt, aiDefaults.listenPrompt)
      );
      getElement("magic-data-ai-compare-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewComparePrompt, aiDefaults.reviewPrompt)
      );
      getElement("magic-data-ai-temperature").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewTemperature, aiDefaults.temperature)
      );
      getElement("magic-data-ai-top-p").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewTopP, aiDefaults.top_p)
      );
      getElement("magic-data-ai-max-tokens").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewMaxTokens, aiDefaults.max_tokens)
      );
      getElement("magic-data-ai-max-completion-tokens").value = String(
        getAsrVoiceAiEffectiveText(
          config.aiReviewMaxCompletionTokens,
          aiDefaults.max_completion_tokens
        )
      );
      getElement("magic-data-ai-presence-penalty").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewPresencePenalty, aiDefaults.presence_penalty)
      );
      getElement("magic-data-ai-frequency-penalty").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewFrequencyPenalty, aiDefaults.frequency_penalty)
      );
      getElement("magic-data-ai-seed").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewSeed, aiDefaults.seed)
      );
      getElement("magic-data-ai-stop-sequences").value = String(
        getAsrVoiceAiEffectiveText(config.aiReviewStopSequences, aiDefaults.stop)
      );
    }
    stopMagicDataShortcutRecording("");
    renderMagicDataShortcutGrid();
    setStatus(
      "magic-data-status",
      "当前后端地址由首页统一控制：" + formatBackendModeLabel(settings)
    );
  }

  async function saveMagicDataSettings() {
    if (!storage || typeof storage.patchSettings !== "function") {
      setStatus("magic-data-status", "当前扩展版本不支持保存 Magic Data 设置。");
      return false;
    }

    ensureMagicDataShortcutDraft();
    const shortcuts = {};
    magicDataShortcutActions.forEach(function (action) {
      shortcuts[action.key] = normalizeNullableShortcut(magicDataShortcutsDraft[action.key]);
    });

    const currentConfig = getMagicDataConfig(currentSettings || {});
    const aiDefaults = getAsrVoiceAiDefaultsCached(magicDataAnnotatorScriptId).defaults || {};
    const hasAiSettingsPanel = Boolean(getElement("magic-data-enabled"));
    const enabled = hasAiSettingsPanel
      ? getElement("magic-data-enabled").checked
      : currentConfig.enabled !== false;
    const listenModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "magic-data-ai-listen-model-select",
          "magic-data-ai-listen-model-custom",
          magicDataDefaultSettings.listenModel,
          judgementAiListenModels
        )
      : currentConfig.listenModel;
    const reviewModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "magic-data-ai-compare-model-select",
          "magic-data-ai-compare-model-custom",
          magicDataDefaultSettings.reviewModel,
          judgementAiCompareModels
        )
      : currentConfig.reviewModel;
    const reviewMode = hasAiSettingsPanel
      ? normalizeMagicDataReviewMode(
          getElement("magic-data-review-mode").value,
          magicDataDefaultSettings.reviewMode
        )
      : currentConfig.reviewMode;
    const showHeardText = hasAiSettingsPanel
      ? getElement("magic-data-show-heard-text").checked
      : currentConfig.showHeardText !== false;
    const showEstimatedIncome = hasAiSettingsPanel
      ? getElement("magic-data-show-estimated-income").checked
      : currentConfig.showEstimatedIncome !== false;
    const enableThinking = hasAiSettingsPanel
      ? getElement("magic-data-ai-enable-thinking").checked === true
      : currentConfig.enableThinking === true;
    const normalizeOverridePrompt = function (value, defaultValue) {
      const normalizedValue = normalizePromptText(value || "");
      const normalizedDefault = normalizePromptText(defaultValue || "");
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const normalizeOverrideNumber = function (value, defaultValue, min, max, precision) {
      const normalizedValue = normalizeOptionalNumberText(value, min, max, precision);
      const normalizedDefault = normalizeOptionalNumberText(defaultValue, min, max, precision);
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const normalizeOverrideInteger = function (value, defaultValue, min, max) {
      const normalizedValue = normalizeOptionalIntegerText(value, min, max);
      const normalizedDefault = normalizeOptionalIntegerText(defaultValue, min, max);
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const aiReviewRequestTimeoutMs = hasAiSettingsPanel
      ? clampNumber(getElement("magic-data-ai-timeout").value, 120000, 1000, 300000, 0)
      : currentConfig.aiReviewRequestTimeoutMs;
    const aiReviewListenPrompt = hasAiSettingsPanel
      ? normalizeOverridePrompt(
          getElement("magic-data-ai-listen-prompt").value,
          aiDefaults.listenPrompt
        )
      : currentConfig.aiReviewListenPrompt;
    const aiReviewComparePrompt = hasAiSettingsPanel
      ? normalizeOverridePrompt(
          getElement("magic-data-ai-compare-prompt").value,
          aiDefaults.reviewPrompt
        )
      : currentConfig.aiReviewComparePrompt;
    const aiReviewTemperature = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("magic-data-ai-temperature").value,
          aiDefaults.temperature,
          0,
          2,
          3
        )
      : currentConfig.aiReviewTemperature;
    const aiReviewTopP = hasAiSettingsPanel
      ? normalizeOverrideNumber(getElement("magic-data-ai-top-p").value, aiDefaults.top_p, 0, 1, 3)
      : currentConfig.aiReviewTopP;
    const aiReviewMaxTokens = hasAiSettingsPanel
      ? normalizeOverrideInteger(
          getElement("magic-data-ai-max-tokens").value,
          aiDefaults.max_tokens,
          1,
          8192
        )
      : currentConfig.aiReviewMaxTokens;
    const aiReviewMaxCompletionTokens = hasAiSettingsPanel
      ? normalizeOverrideInteger(
          getElement("magic-data-ai-max-completion-tokens").value,
          aiDefaults.max_completion_tokens,
          1,
          8192
        )
      : currentConfig.aiReviewMaxCompletionTokens;
    const aiReviewPresencePenalty = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("magic-data-ai-presence-penalty").value,
          aiDefaults.presence_penalty,
          -2,
          2,
          3
        )
      : currentConfig.aiReviewPresencePenalty;
    const aiReviewFrequencyPenalty = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("magic-data-ai-frequency-penalty").value,
          aiDefaults.frequency_penalty,
          -2,
          2,
          3
        )
      : currentConfig.aiReviewFrequencyPenalty;
    const aiReviewSeed = hasAiSettingsPanel
      ? normalizeOverrideInteger(getElement("magic-data-ai-seed").value, aiDefaults.seed, 0, 2147483647)
      : currentConfig.aiReviewSeed;
    const aiReviewStopSequences = hasAiSettingsPanel
      ? (function () {
          const normalizedValue = normalizeStopSequencesText(
            getElement("magic-data-ai-stop-sequences").value
          );
          const normalizedDefault = normalizeStopSequencesText(aiDefaults.stop || "");
          return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
        })()
      : currentConfig.aiReviewStopSequences;

    setStatus("magic-data-status", "正在保存 Magic Data 设置...");
    try {
      currentSettings = await storage.patchSettings({
        scriptCenter: {
          projects: {
            magicDataAnnotator: {
              enabled: enabled,
              aiReviewEnabled: enabled,
              listenModel:
                listenModel === String(aiDefaults.listenModel || "").trim() ? "" : listenModel,
              reviewModel:
                reviewModel ===
                String(aiDefaults.reviewModel || aiDefaults.compareModel || "").trim()
                  ? ""
                  : reviewModel,
              reviewMode: reviewMode,
              showHeardText: showHeardText,
              showEstimatedIncome: showEstimatedIncome,
              enableThinking: enableThinking,
              aiReviewRequestTimeoutMs: aiReviewRequestTimeoutMs,
              aiReviewListenPrompt: aiReviewListenPrompt,
              aiReviewComparePrompt: aiReviewComparePrompt,
              aiReviewTemperature: aiReviewTemperature,
              aiReviewTopP: aiReviewTopP,
              aiReviewMaxTokens: aiReviewMaxTokens,
              aiReviewMaxCompletionTokens: aiReviewMaxCompletionTokens,
              aiReviewPresencePenalty: aiReviewPresencePenalty,
              aiReviewFrequencyPenalty: aiReviewFrequencyPenalty,
              aiReviewSeed: aiReviewSeed,
              aiReviewStopSequences: aiReviewStopSequences,
              shortcuts: shortcuts,
            },
          },
        },
      });
      renderCurrentView();
      setStatus("magic-data-status", "Magic Data 设置已保存；如页面未生效请刷新目标页面。");
      return true;
    } catch (error) {
      setStatus(
        "magic-data-status",
        "保存失败：" + (error && error.message ? error.message : String(error))
      );
      return false;
    }
  }

  function applyJudgementForm(settings) {
    const config = normalizeJudgementConfig(settings);
    const defaultsPayload = getAsrVoiceAiDefaultsCached(judgementProjectId);
    const aiDefaults = defaultsPayload.defaults || {};
    judgementShortcutsDraft = clone(config.shortcuts) || {};
    getElement("judgement-volume").value = String(config.volumeValue);
    getElement("judgement-rate-step").value = String(config.rateStepValue);
    getElement("judgement-reset-rate").value = String(config.resetRateValue);
    getElement("judgement-seek-step").value = String(config.seekStepSeconds);
    getElement("judgement-items-per-page").value = config.itemsPerPage;
    getElement("judgement-auto-play").checked = config.autoPlay === true;
    getElement("judgement-asr-diff-view").checked = config.asrDiffViewEnabled !== false;
    getElement("judgement-diff-change-bg").value = config.asrDiffColors.changeBackground;
    getElement("judgement-diff-gap-bg").value = config.asrDiffColors.gapBackground;
    getElement("judgement-diff-punctuation-bg").value =
      config.asrDiffColors.punctuationBackground;
    getElement("judgement-compact-card").checked = config.compactCardEnabled !== false;
    getElement("judgement-thunder-question").checked = config.thunderQuestionEnabled !== false;
    getElement("judgement-auto-advance").checked = config.autoAdvanceAfterChoice === true;
    if (getElement("judgement-ai-suggestion-timeout")) {
      getElement("judgement-ai-suggestion-timeout").value = String(
        Number(config.aiSuggestionRequestTimeoutMs || aiDefaults.timeoutMs || 120000)
      );
      getElement("judgement-ai-suggestion-enable-thinking").checked = Boolean(
        config.aiSuggestionEnableThinking === true ||
          (config.aiSuggestionEnableThinking !== true && aiDefaults.enableThinking === true)
      );
      const webSearchEnabledNode = getElement("judgement-ai-suggestion-web-search-enabled");
      if (webSearchEnabledNode instanceof HTMLInputElement) {
        webSearchEnabledNode.checked = Boolean(
          config.aiSuggestionWebSearchEnabled === true ||
            (config.aiSuggestionWebSearchEnabled !== false &&
              aiDefaults.webSearchEnabled !== false)
        );
      }
      applyJudgementModelField(
        "judgement-ai-suggestion-listen-model-select",
        "judgement-ai-suggestion-listen-model-custom",
        getAsrVoiceAiEffectiveText(config.aiSuggestionListenModel, aiDefaults.listenModel),
        judgementAiListenModels,
        "listen"
      );
      applyJudgementModelField(
        "judgement-ai-suggestion-compare-model-select",
        "judgement-ai-suggestion-compare-model-custom",
        getAsrVoiceAiEffectiveText(config.aiSuggestionCompareModel, aiDefaults.compareModel),
        judgementAiCompareModels,
        "compare"
      );
      getElement("judgement-ai-suggestion-listen-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionListenPrompt, aiDefaults.listenPrompt)
      );
      getElement("judgement-ai-suggestion-compare-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionComparePrompt, aiDefaults.comparePrompt)
      );
      getElement("judgement-ai-suggestion-temperature").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionTemperature, aiDefaults.temperature)
      );
      getElement("judgement-ai-suggestion-top-p").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionTopP, aiDefaults.top_p)
      );
      getElement("judgement-ai-suggestion-max-tokens").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionMaxTokens, aiDefaults.max_tokens)
      );
      getElement("judgement-ai-suggestion-max-completion-tokens").value = String(
        getAsrVoiceAiEffectiveText(
          config.aiSuggestionMaxCompletionTokens,
          aiDefaults.max_completion_tokens
        )
      );
      getElement("judgement-ai-suggestion-presence-penalty").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionPresencePenalty, aiDefaults.presence_penalty)
      );
      getElement("judgement-ai-suggestion-frequency-penalty").value = String(
        getAsrVoiceAiEffectiveText(
          config.aiSuggestionFrequencyPenalty,
          aiDefaults.frequency_penalty
        )
      );
      getElement("judgement-ai-suggestion-seed").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionSeed, aiDefaults.seed)
      );
      getElement("judgement-ai-suggestion-stop-sequences").value = String(
        getAsrVoiceAiEffectiveText(config.aiSuggestionStopSequences, aiDefaults.stop)
      );
      applyJudgementAiAdvancedFieldVisibility();
    }
    renderJudgementAiAdvancedPanel();
    stopJudgementShortcutRecording("");
    renderJudgementShortcutGrid();
    setStatus(
      "judgement-status",
      "当前后端地址由首页统一控制：" + formatBackendModeLabel(settings)
    );
  }

  function ensureTranscriptionShortcutDraft() {
    transcriptionShortcutActions.forEach(function (action) {
      if (!hasOwn(transcriptionShortcutsDraft, action.key)) {
        transcriptionShortcutsDraft[action.key] = null;
      }
    });
  }

  function renderTranscriptionShortcutGrid() {
    const grid = getElement("transcription-shortcut-grid");
    if (!grid) {
      return;
    }
    ensureTranscriptionShortcutDraft();
    grid.innerHTML = transcriptionShortcutActions
      .map(function (action) {
        const recording = transcriptionRecordingKey === action.key;
        return [
          '<div class="shortcut-row">',
          '<span class="shortcut-label">' + escapeHtml(action.label) + "</span>",
          '<span class="shortcut-value">' +
            escapeHtml(recording ? "录制中..." : formatShortcut(transcriptionShortcutsDraft[action.key])) +
            "</span>",
          '<button type="button" class="secondary-button" data-record-transcription-shortcut="' +
            escapeHtml(action.key) +
            '">' +
            (recording ? "录制中" : "录制") +
            "</button>",
          '<button type="button" class="ghost-button" data-clear-transcription-shortcut="' +
            escapeHtml(action.key) +
            '">删除</button>',
          "</div>",
        ].join("");
      })
      .join("");

    Array.from(grid.querySelectorAll("[data-record-transcription-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        startTranscriptionShortcutRecording(button.getAttribute("data-record-transcription-shortcut"));
      });
    });

    Array.from(grid.querySelectorAll("[data-clear-transcription-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-clear-transcription-shortcut");
        transcriptionShortcutsDraft[key] = null;
        if (transcriptionRecordingKey === key) {
          stopTranscriptionShortcutRecording("快捷键录制已取消。");
          return;
        }
        setTranscriptionRecordingStatus("快捷键已删除，保存后生效。");
        renderTranscriptionShortcutGrid();
      });
    });
  }

  function setTranscriptionRecordingStatus(text) {
    const node = getElement("transcription-recording-status");
    if (!node) {
      return;
    }
    node.textContent = text || "";
    node.classList.toggle("hidden", !text);
  }

  function stopTranscriptionShortcutRecording(statusText) {
    if (typeof stopTranscriptionRecordingListeners === "function") {
      stopTranscriptionRecordingListeners();
      stopTranscriptionRecordingListeners = null;
    }
    transcriptionRecordingKey = null;
    setTranscriptionRecordingStatus(statusText || "");
    renderTranscriptionShortcutGrid();
  }

  function applyRecordedTranscriptionShortcut(shortcut) {
    if (!transcriptionRecordingKey || shortcut === false) {
      return;
    }
    if (!shortcut) {
      stopTranscriptionShortcutRecording("已取消快捷键录制。");
      return;
    }

    transcriptionShortcutsDraft[transcriptionRecordingKey] = normalizeShortcut(shortcut);
    stopTranscriptionShortcutRecording("快捷键已录制，保存后生效。");
  }

  function startTranscriptionShortcutRecording(actionKey) {
    if (!actionKey) {
      return;
    }
    if (typeof stopTranscriptionRecordingListeners === "function") {
      stopTranscriptionRecordingListeners();
    }

    transcriptionRecordingKey = actionKey;
    const action = transcriptionShortcutActions.find(function (item) {
      return item.key === actionKey;
    });
    setTranscriptionRecordingStatus(
      "正在录制「" + String(action?.label || actionKey) + "」：按键盘组合，Esc 取消。"
    );

    const keydownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      applyRecordedTranscriptionShortcut(shortcutFromKeyboardEvent(event));
    };
    window.addEventListener("keydown", keydownListener, true);
    stopTranscriptionRecordingListeners = function () {
      window.removeEventListener("keydown", keydownListener, true);
    };

    renderTranscriptionShortcutGrid();
  }

  function applyTranscriptionForm(settings) {
    const config = normalizeTranscriptionConfig(settings);
    const aiConfig = getTranscriptionAiConfig(settings);
    const defaultsPayload = getAsrVoiceAiDefaultsCached(transcriptionProjectId);
    const aiDefaults = defaultsPayload.defaults || {};
    transcriptionShortcutsDraft = clone(config.shortcuts) || {};

    getElement("transcription-auto-play").checked = config.autoPlay === true;
    getElement("transcription-playback-rate").value = String(config.playbackRateValue);
    getElement("transcription-reset-rate").value = String(config.resetRateValue);
    getElement("transcription-rate-step").value = String(config.rateStepValue);
    getElement("transcription-seek-step").value = String(config.seekStepSeconds);
    getElement("transcription-volume").value = String(config.volumeValue);
    getElement("transcription-default-valid").checked = config.defaultValid === true;
    getElement("transcription-fill-on-valid").checked = config.fillOnValid !== false;
    getElement("transcription-clear-on-invalid").checked = config.clearOnInvalid !== false;
    if (getElement("transcription-ai-suggestion-timeout")) {
      getElement("transcription-ai-suggestion-timeout").value = String(
        Number(aiConfig.aiSuggestionRequestTimeoutMs || aiDefaults.timeoutMs || 120000)
      );
    }
    if (getElement("transcription-ai-suggestion-enable-thinking")) {
      getElement("transcription-ai-suggestion-enable-thinking").checked =
        Boolean(
          aiConfig.aiSuggestionEnableThinking === true ||
            (aiConfig.aiSuggestionEnableThinking !== true && aiDefaults.enableThinking === true)
        );
    }
    if (getElement("transcription-ai-suggestion-listen-model-select")) {
      applyJudgementModelField(
        "transcription-ai-suggestion-listen-model-select",
        "transcription-ai-suggestion-listen-model-custom",
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionListenModel, aiDefaults.listenModel),
        judgementAiListenModels,
        "listen"
      );
    }
    if (getElement("transcription-ai-suggestion-compare-model-select")) {
      applyJudgementModelField(
        "transcription-ai-suggestion-compare-model-select",
        "transcription-ai-suggestion-compare-model-custom",
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionCompareModel, aiDefaults.compareModel),
        judgementAiCompareModels,
        "compare"
      );
    }
    if (getElement("transcription-ai-suggestion-listen-prompt")) {
      getElement("transcription-ai-suggestion-listen-prompt").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionListenPrompt, aiDefaults.listenPrompt)
      );
    }
    if (getElement("transcription-ai-suggestion-compare-prompt")) {
      getElement("transcription-ai-suggestion-compare-prompt").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionComparePrompt, aiDefaults.comparePrompt)
      );
    }
    if (getElement("transcription-ai-suggestion-temperature")) {
      getElement("transcription-ai-suggestion-temperature").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionTemperature, aiDefaults.temperature)
      );
      getElement("transcription-ai-suggestion-top-p").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionTopP, aiDefaults.top_p)
      );
      getElement("transcription-ai-suggestion-max-tokens").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionMaxTokens, aiDefaults.max_tokens)
      );
      getElement("transcription-ai-suggestion-max-completion-tokens").value = String(
        getAsrVoiceAiEffectiveText(
          aiConfig.aiSuggestionMaxCompletionTokens,
          aiDefaults.max_completion_tokens
        )
      );
      getElement("transcription-ai-suggestion-presence-penalty").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionPresencePenalty, aiDefaults.presence_penalty)
      );
      getElement("transcription-ai-suggestion-frequency-penalty").value = String(
        getAsrVoiceAiEffectiveText(
          aiConfig.aiSuggestionFrequencyPenalty,
          aiDefaults.frequency_penalty
        )
      );
      getElement("transcription-ai-suggestion-seed").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionSeed, aiDefaults.seed)
      );
      getElement("transcription-ai-suggestion-stop-sequences").value = String(
        getAsrVoiceAiEffectiveText(aiConfig.aiSuggestionStopSequences, aiDefaults.stop)
      );
      applyTranscriptionAiAdvancedFieldVisibility();
    }

    stopTranscriptionShortcutRecording("");
    renderTranscriptionShortcutGrid();
    const backendLabel = formatBackendModeLabel(settings);
    setStatus(
      "transcription-status",
      "数据统计上传为脚本默认能力，已强制启用；定时上传按脚本能力强制启用。后端地址：全局 " +
        backendLabel +
        "；当前题 AI 推荐仅供参考，需手动点击“填入 AI 推荐”生效。"
    );
  }

  async function saveTranscriptionSettings() {
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      setStatus("transcription-status", "当前扩展版本不支持保存转写设置。");
      return false;
    }

    const current = normalizeTranscriptionConfig(currentSettings || {});
    const currentAi = getTranscriptionAiConfig(currentSettings || {});
    const aiDefaults = getAsrVoiceAiDefaultsCached(transcriptionProjectId).defaults || {};
    const shortcuts = {};
    transcriptionShortcutActions.forEach(function (action) {
      shortcuts[action.key] = normalizeShortcut(transcriptionShortcutsDraft[action.key]);
    });

    const patch = {
      autoPlay: getElement("transcription-auto-play").checked === true,
      playbackRateValue: clampNumber(
        getElement("transcription-playback-rate").value,
        current.playbackRateValue,
        0.25,
        5,
        2
      ),
      resetRateValue: clampNumber(
        getElement("transcription-reset-rate").value,
        current.resetRateValue,
        0.25,
        5,
        2
      ),
      rateStepValue: normalizeTranscriptionRateStep(
        getElement("transcription-rate-step").value,
        current.rateStepValue
      ),
      seekStepSeconds: normalizeTranscriptionSeekStep(
        getElement("transcription-seek-step").value,
        current.seekStepSeconds
      ),
      volumeValue: clampNumber(getElement("transcription-volume").value, current.volumeValue, 0, 1000, 0),
      defaultValid: getElement("transcription-default-valid").checked === true,
      fillOnValid: getElement("transcription-fill-on-valid").checked === true,
      clearOnInvalid: getElement("transcription-clear-on-invalid").checked === true,
      shortcutPlayPause: shortcuts.shortcutPlayPause,
      shortcutValid: shortcuts.shortcutValid,
      shortcutInvalid: shortcuts.shortcutInvalid,
      shortcutFill: shortcuts.shortcutFill,
      shortcutRemoveSpaces: shortcuts.shortcutRemoveSpaces,
      shortcutConvertNum: shortcuts.shortcutConvertNum,
      shortcutToggleFocus: shortcuts.shortcutToggleFocus,
      shortcutBackward: shortcuts.shortcutBackward,
      shortcutForward: shortcuts.shortcutForward,
      shortcutSpeedDown: shortcuts.shortcutSpeedDown,
      shortcutSpeedUp: shortcuts.shortcutSpeedUp,
      shortcutResetSpeed: shortcuts.shortcutResetSpeed,
      shortcutVolDown: shortcuts.shortcutVolDown,
      shortcutVolUp: shortcuts.shortcutVolUp,
      shortcutResetVol: shortcuts.shortcutResetVol,
      shortcutCopyDuration: shortcuts.shortcutCopyDuration,
      shortcutUploadStats: shortcuts.shortcutUploadStats,
      shortcutAiSuggest: shortcuts.shortcutAiSuggest,
      shortcutApplyAiSuggestion: shortcuts.shortcutApplyAiSuggestion,
    };

    if (getElement("transcription-ai-suggestion-timeout")) {
      patch.aiSuggestionEnabled = true;
      patch.aiSuggestionRequestTimeoutMs = clampNumber(
        Number(getElement("transcription-ai-suggestion-timeout").value),
        currentAi.aiSuggestionRequestTimeoutMs,
        1000,
        180000,
        0
      );
      patch.aiSuggestionListenModel = readJudgementModelField(
        "transcription-ai-suggestion-listen-model-select",
        "transcription-ai-suggestion-listen-model-custom",
        "qwen3.5-omni-flash",
        judgementAiListenModels
      );
      patch.aiSuggestionCompareModel = readJudgementModelField(
        "transcription-ai-suggestion-compare-model-select",
        "transcription-ai-suggestion-compare-model-custom",
        "qwen3.5-plus",
        judgementAiCompareModels
      );
      patch.aiSuggestionListenPrompt = (function () {
        const value = normalizePromptText(getElement("transcription-ai-suggestion-listen-prompt").value);
        const defaultValue = normalizePromptText(aiDefaults.listenPrompt || "");
        return value && value !== defaultValue ? value : "";
      })();
      patch.aiSuggestionComparePrompt = (function () {
        const value = normalizePromptText(getElement("transcription-ai-suggestion-compare-prompt").value);
        const defaultValue = normalizePromptText(aiDefaults.comparePrompt || "");
        return value && value !== defaultValue ? value : "";
      })();
      patch.aiSuggestionTemperature = isJudgementAiParamSupported("temperature")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("transcription-ai-suggestion-temperature").value,
              0,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.temperature, 0, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionTopP = isJudgementAiParamSupported("top_p")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("transcription-ai-suggestion-top-p").value,
              0,
              1,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.top_p, 0, 1, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionMaxTokens = isJudgementAiParamSupported("max_tokens")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("transcription-ai-suggestion-max-tokens").value,
              1,
              8192
            );
            const defaultValue = normalizeOptionalIntegerText(aiDefaults.max_tokens, 1, 8192);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionMaxCompletionTokens = isJudgementAiParamSupported("max_completion_tokens")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("transcription-ai-suggestion-max-completion-tokens").value,
              1,
              8192
            );
            const defaultValue = normalizeOptionalIntegerText(
              aiDefaults.max_completion_tokens,
              1,
              8192
            );
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionPresencePenalty = isJudgementAiParamSupported("presence_penalty")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("transcription-ai-suggestion-presence-penalty").value,
              -2,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.presence_penalty, -2, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionFrequencyPenalty = isJudgementAiParamSupported("frequency_penalty")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("transcription-ai-suggestion-frequency-penalty").value,
              -2,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.frequency_penalty, -2, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionSeed = isJudgementAiParamSupported("seed")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("transcription-ai-suggestion-seed").value,
              0,
              2147483647
            );
            const defaultValue = normalizeOptionalIntegerText(aiDefaults.seed, 0, 2147483647);
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionResponseFormat = "json_object";
      patch.aiSuggestionStopSequences = isJudgementAiParamSupported("stop")
        ? (function () {
            const value = normalizeStopSequencesText(
              getElement("transcription-ai-suggestion-stop-sequences").value
            );
            const defaultValue = normalizeStopSequencesText(aiDefaults.stop || "");
            return value && value !== defaultValue ? value : "";
          })()
        : "";
      patch.aiSuggestionEnableThinking =
        getElement("transcription-ai-suggestion-enable-thinking").checked === true;
      patch.aiSuggestionModel = patch.aiSuggestionCompareModel;
      patch.aiSuggestionListenModel =
        patch.aiSuggestionListenModel === String(aiDefaults.listenModel || "").trim()
          ? ""
          : patch.aiSuggestionListenModel;
      patch.aiSuggestionCompareModel =
        patch.aiSuggestionCompareModel === String(aiDefaults.compareModel || "").trim()
          ? ""
          : patch.aiSuggestionCompareModel;
    }

    setStatus("transcription-status", "正在保存转写设置...");
    try {
      currentSettings = await storage.saveProjectSettings(transcriptionProjectId, patch);
      applyTranscriptionForm(currentSettings);
      setStatus("transcription-status", "转写设置已保存；已打开详情页请刷新或等待自动同步。");
      return true;
    } catch (error) {
      setStatus(
        "transcription-status",
        "保存失败：" + (error && error.message ? error.message : String(error))
      );
      return false;
    }
  }

  function renderScriptCenter(settings) {
    renderHomeBackendEndpoint(settings);

    const center = getElement("script-center-view");
    const platformIds = Object.keys(platformLibrary);

    center.innerHTML = platformIds
      .map(function (platformId) {
        const platform = platformLibrary[platformId] || {};
        const scriptIds = Object.keys(scriptLibrary).filter(function (scriptId) {
          return scriptLibrary[scriptId]?.platformId === platformId;
        });

        const scriptMarkup = scriptIds
          .map(function (scriptId) {
            const script = scriptLibrary[scriptId] || {};
            const status = getScriptStatus(settings, scriptId);
            const active = status.tone === "enabled";

            return [
              '<article class="script-card' + (active ? " active" : "") + '">',
              '<div class="script-head">',
              '<div class="script-title">',
              "<h3>" + String(script.label || scriptId) + "</h3>",
              '<div class="meta-row">',
              '<span class="script-pill info">' + String(script.statusLabel || "脚本") + "</span>",
              '<span class="script-pill ' + status.tone + '">' + status.text + "</span>",
              "</div>",
              "</div>",
              "</div>",
              '<p class="script-copy">' + String(script.description || "") + "</p>",
              '<p class="script-copy">匹配 URL：' + getScriptHostText(scriptId) + "</p>",
              '<div class="script-actions">',
              '<button type="button" class="primary-button" data-open-script="' + scriptId + '">打开设置</button>',
              isScriptEnabled(settings, scriptId)
                ? '<button type="button" class="danger-button" data-disable-script="' + scriptId + '">关闭脚本</button>'
                : '<button type="button" class="secondary-button" data-enable-script="' + scriptId + '">启用脚本</button>',
              "</div>",
              "</article>",
            ].join("");
          })
          .join("");

        return [
          '<section class="platform-section">',
          '<div class="platform-head">',
          "<div>",
          "<h2>" + String(platform.label || platformId) + "</h2>",
          '<p class="platform-copy">' + String(platform.description || "") + "</p>",
          "</div>",
          '<div class="status-row">',
          '<span class="pill info">' + String(platform.host || "") + "</span>",
          "</div>",
          "</div>",
          '<div class="script-grid">' + scriptMarkup + "</div>",
          "</section>",
        ].join("");
      })
      .join("");

    Array.from(center.querySelectorAll("[data-open-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        navigateToScript(button.getAttribute("data-open-script"));
      });
    });

    Array.from(center.querySelectorAll("[data-enable-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        void toggleScript(button.getAttribute("data-enable-script"), true);
      });
    });

    Array.from(center.querySelectorAll("[data-disable-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        void toggleScript(button.getAttribute("data-disable-script"), false);
      });
    });
  }

  function renderHomeBackendEndpoint(settings) {
    const serverButton = getElement("home-endpoint-server");
    const localButton = getElement("home-endpoint-local");
    if (!(serverButton instanceof HTMLButtonElement) || !(localButton instanceof HTMLButtonElement)) {
      return;
    }

    const mode = getBackendModeFromSettings(settings);
    const statusNode = getElement("home-endpoint-status");
    const isLocal = mode === backendModeLocal;

    serverButton.classList.toggle("active", !isLocal);
    localButton.classList.toggle("active", isLocal);
    serverButton.setAttribute("aria-pressed", String(!isLocal));
    localButton.setAttribute("aria-pressed", String(isLocal));
    const toggleNode = getElement("home-endpoint-toggle");
    if (toggleNode) {
      toggleNode.classList.toggle("hidden", endpointAdvancedUnlocked !== true);
    }

    if (statusNode) {
      statusNode.textContent = endpointAdvancedUnlocked
        ? "当前已选择：" + (isLocal ? "本机（127.0.0.1:3333）" : "服务器（script.xiangtianzhen.store）")
        : "";
    }
  }

  async function setHomeBackendEndpoint(mode) {
    if (!storage || typeof storage.patchSettings !== "function") {
      const statusNode = getElement("home-endpoint-status");
      if (statusNode) {
        statusNode.textContent = "当前扩展版本不支持保存后端接口地址。";
      }
      return;
    }

    const normalizedMode =
      String(mode || "").trim().toLowerCase() === backendModeLocal ? backendModeLocal : backendModeServer;
    const statusNode = getElement("home-endpoint-status");
    if (statusNode) {
      statusNode.textContent = "正在保存后端接口地址...";
    }

    try {
      currentSettings = await storage.patchSettings({
        meta: {
          backendEndpointMode: normalizedMode,
        },
      });
      renderHomeBackendEndpoint(currentSettings);
      if (statusNode) {
        statusNode.textContent =
          "后端接口地址已保存为" + (normalizedMode === backendModeLocal ? "本机" : "服务器") + "。";
      }
      if (endpointAdvancedUnlocked) {
        void loadProjectDataDownloadOptions();
      }
    } catch (error) {
      if (statusNode) {
        statusNode.textContent =
          "保存失败：" + (error && error.message ? error.message : String(error));
      }
    }
  }

  function parseJsonSafely(text) {
    try {
      return JSON.parse(String(text || "{}"));
    } catch (error) {
      return {};
    }
  }

  function normalizeText(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function getProjectDataDownloadDatasetById(datasetId) {
    const targetId = normalizeText(datasetId);
    if (!targetId) {
      return null;
    }
    for (let index = 0; index < projectDataDownloadDatasets.length; index += 1) {
      const item = projectDataDownloadDatasets[index] || {};
      if (normalizeText(item.id) === targetId) {
        return item;
      }
    }
    return null;
  }

  function setProjectDataDownloadStatus(text) {
    const node = getElement("project-download-status");
    if (node) {
      node.textContent = String(text || "");
    }
  }

  function updateProjectDataDownloadSupplierVisibility() {
    const datasetSelect = getElement("project-download-dataset");
    const supplierRow = getElement("project-download-supplier-row");
    const supplierSelect = getElement("project-download-supplier");
    if (
      !(datasetSelect instanceof HTMLSelectElement) ||
      !(supplierRow instanceof HTMLElement) ||
      !(supplierSelect instanceof HTMLSelectElement)
    ) {
      return;
    }

    const selectedDataset = getProjectDataDownloadDatasetById(datasetSelect.value);
    const suppliers = Array.isArray(selectedDataset?.suppliers) ? selectedDataset.suppliers : [];
    const needSupplier = Boolean(selectedDataset?.supplierRequired);

    supplierSelect.innerHTML = ['<option value="">请选择供应商</option>']
      .concat(
        suppliers.map(function (supplier) {
          const text = escapeHtml(supplier);
          return '<option value="' + text + '">' + text + "</option>";
        })
      )
      .join("");
    supplierRow.classList.toggle("hidden", !needSupplier);
    if (!needSupplier) {
      supplierSelect.value = "";
    }
  }

  function renderProjectDataDownloadDatasets(datasets) {
    const datasetSelect = getElement("project-download-dataset");
    if (!(datasetSelect instanceof HTMLSelectElement)) {
      return;
    }
    projectDataDownloadDatasets = Array.isArray(datasets) ? clone(datasets) : [];
    datasetSelect.innerHTML = ['<option value="">请选择数据类型</option>']
      .concat(
        projectDataDownloadDatasets.map(function (item) {
          const id = escapeHtml(item.id || "");
          const label = escapeHtml(item.label || item.id || "");
          return '<option value="' + id + '">' + label + "</option>";
        })
      )
      .join("");
    updateProjectDataDownloadSupplierVisibility();
  }

  function getProjectDataDownloadOperatorName(settings) {
    const name = settings?.meta?.projectDataDownloadOperatorName;
    return normalizeText(name);
  }

  async function persistProjectDataDownloadOperatorName(operatorName) {
    if (!storage || typeof storage.patchSettings !== "function") {
      return;
    }
    const normalizedName = normalizeText(operatorName);
    const currentName = getProjectDataDownloadOperatorName(currentSettings || {});
    if (normalizedName === currentName) {
      return;
    }
    currentSettings = await storage.patchSettings({
      meta: {
        projectDataDownloadOperatorName: normalizedName,
      },
    });
  }

  function getProjectDataDownloadClientInfo() {
    const screenText =
      globalThis.screen && Number(screen.width) > 0 && Number(screen.height) > 0
        ? String(screen.width) + "x" + String(screen.height)
        : "";
    return {
      userAgent: normalizeText(globalThis.navigator?.userAgent || ""),
      platform: normalizeText(globalThis.navigator?.platform || ""),
      language: normalizeText(globalThis.navigator?.language || ""),
      screen: screenText,
    };
  }

  function getProjectDataDownloadErrorMessage(body, statusCode) {
    const message = normalizeText(body?.message || "");
    const code = normalizeText(body?.code || "");
    if (code === "project-data-download-auth-not-configured") {
      return "后端未配置项目数据下载鉴权环境变量。";
    }
    if (code === "project-data-download-password-invalid") {
      return "下载密码错误，请重试。";
    }
    if (code === "project-data-download-supplier-required") {
      return "当前数据包含多个供应商，请先选择供应商。";
    }
    if (code === "project-data-download-csv-not-found") {
      return "当前数据文件不存在，请先生成数据后再下载。";
    }
    if (code === "project-data-download-token-invalid") {
      return "下载链接无效或已过期，请重新申请。";
    }
    if (message) {
      return message;
    }
    if (Number(statusCode) >= 500) {
      return "后端服务异常，请稍后重试。";
    }
    return "请求失败，请稍后重试。";
  }

  async function loadProjectDataDownloadOptions() {
    if (!endpointAdvancedUnlocked) {
      return;
    }
    setProjectDataDownloadStatus("正在加载可下载数据类型...");
    const url = buildBackendUrl(projectDataDownloadOptionsPath, currentSettings || {});
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      const body = parseJsonSafely(await response.text());
      if (!response.ok || body?.success !== true) {
        setProjectDataDownloadStatus(getProjectDataDownloadErrorMessage(body, response.status));
        return;
      }
      renderProjectDataDownloadDatasets(body?.data || []);
      if (projectDataDownloadDatasets.length <= 0) {
        setProjectDataDownloadStatus("暂无可下载数据类型。");
        return;
      }
      setProjectDataDownloadStatus("可下载数据类型已更新。");
    } catch (error) {
      setProjectDataDownloadStatus(
        "加载失败：" + (error && error.message ? error.message : String(error))
      );
    }
  }

  function unlockEndpointAdvancedPanel() {
    if (endpointAdvancedUnlocked) {
      return;
    }
    endpointAdvancedUnlocked = true;
    renderHomeBackendEndpoint(currentSettings || {});
    const panel = getElement("project-data-download-panel");
    if (panel) {
      panel.classList.remove("hidden");
    }
    setProjectDataDownloadStatus("正在拉取可下载类型...");
    void loadProjectDataDownloadOptions();
  }

  async function ensureBackendModeServerOnInit() {
    if (!storage || typeof storage.patchSettings !== "function") {
      return;
    }
    const mode = getBackendModeFromSettings(currentSettings || {});
    if (mode === backendModeServer) {
      return;
    }
    currentSettings = await storage.patchSettings({
      meta: {
        backendEndpointMode: backendModeServer,
      },
    });
  }

  function renderProjectDataDownloadPanel(settings) {
    const panel = getElement("project-data-download-panel");
    const operatorInput = getElement("project-download-operator");
    if (panel) {
      panel.classList.toggle("hidden", endpointAdvancedUnlocked !== true);
    }
    if (operatorInput instanceof HTMLInputElement) {
      operatorInput.value = getProjectDataDownloadOperatorName(settings || {});
    }
    updateProjectDataDownloadSupplierVisibility();
  }

  async function handleProjectDataDownloadExport() {
    const operatorInput = getElement("project-download-operator");
    const datasetSelect = getElement("project-download-dataset");
    const supplierSelect = getElement("project-download-supplier");
    if (
      !(operatorInput instanceof HTMLInputElement) ||
      !(datasetSelect instanceof HTMLSelectElement) ||
      !(supplierSelect instanceof HTMLSelectElement)
    ) {
      return;
    }

    const operatorName = normalizeText(operatorInput.value);
    if (!operatorName) {
      setProjectDataDownloadStatus("请先填写获取人姓名。");
      operatorInput.focus();
      return;
    }

    const datasetId = normalizeText(datasetSelect.value);
    const datasetInfo = getProjectDataDownloadDatasetById(datasetId);
    if (!datasetId || !datasetInfo) {
      setProjectDataDownloadStatus("请先选择数据类型。");
      datasetSelect.focus();
      return;
    }

    const supplier = normalizeText(supplierSelect.value);
    if (datasetInfo.supplierRequired && !supplier) {
      setProjectDataDownloadStatus("该数据类型需要先选择供应商。");
      supplierSelect.focus();
      return;
    }

    const password = globalThis.prompt("请输入下载密码");
    if (password === null) {
      setProjectDataDownloadStatus("已取消下载。");
      return;
    }
    if (!normalizeText(password)) {
      setProjectDataDownloadStatus("下载密码不能为空。");
      return;
    }

    setProjectDataDownloadStatus("正在申请短期下载链接...");
    try {
      await persistProjectDataDownloadOperatorName(operatorName);
      const response = await fetch(buildBackendUrl(projectDataDownloadRequestPath, currentSettings || {}), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: datasetId,
          supplier: supplier,
          password: String(password),
          operatorName: operatorName,
          clientInfo: getProjectDataDownloadClientInfo(),
        }),
      });
      const body = parseJsonSafely(await response.text());
      if (!response.ok || body?.success !== true) {
        setProjectDataDownloadStatus(getProjectDataDownloadErrorMessage(body, response.status));
        return;
      }

      const downloadUrl = normalizeText(body?.data?.downloadUrl);
      if (!downloadUrl) {
        setProjectDataDownloadStatus("后端未返回下载链接，请重试。");
        return;
      }
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      const expiresInSeconds = Number(body?.data?.expiresInSeconds || 0);
      if (expiresInSeconds > 0) {
        setProjectDataDownloadStatus("下载链接已生成（" + String(expiresInSeconds) + " 秒内有效）。");
      } else {
        setProjectDataDownloadStatus("下载链接已生成。");
      }
    } catch (error) {
      setProjectDataDownloadStatus(
        "申请下载失败：" + (error && error.message ? error.message : String(error))
      );
    }
  }

  function renderDetailHeader(settings, scriptId) {
    const script = scriptLibrary[scriptId] || {};
    const platform = platformLibrary[script.platformId] || {};
    const status = getScriptStatus(settings, scriptId);

    getElement("detail-script-name").textContent = script.label || scriptId;
    getElement("detail-script-description").textContent = script.description || "";
    getElement("detail-script-note").textContent =
      script.note ||
      (isLabelxScript(scriptId)
        ? "同平台脚本互斥：启用这个脚本后，另一个 LabelX 脚本会自动切换为非生效状态。"
        : "当前脚本属于独立平台。");

    const statusNode = getElement("detail-script-status");
    statusNode.textContent = status.text;
    statusNode.className = "pill " + status.tone;

    const platformNode = getElement("detail-platform-pill");
    platformNode.textContent = String(platform.label || script.platformId || "未知平台");

    const enableButton = getElement("detail-enable-button");
    const disableButton = getElement("detail-disable-button");
    const enabled = isScriptEnabled(settings, scriptId);

    enableButton.disabled = enabled;
    disableButton.disabled = !enabled;
  }

  function showDetailPanel(scriptId) {
    getElement("detail-transcription-panel").classList.toggle("hidden", scriptId !== transcriptionProjectId);
    getElement("detail-judgement-panel").classList.toggle("hidden", scriptId !== judgementProjectId);
    getElement("detail-lightwheel-panel").classList.toggle("hidden", scriptId !== lightwheelScriptId);
    getElement("detail-data-baker-round-one-quality-panel").classList.toggle(
      "hidden",
      scriptId !== dataBakerRoundOneQualityScriptId
    );
    getElement("detail-magic-data-annotator-panel").classList.toggle(
      "hidden",
      scriptId !== magicDataAnnotatorScriptId
    );
  }

  function renderDetail(settings, scriptId) {
    renderDetailHeader(settings, scriptId);
    renderAsrVoiceAiSettingsSection(settings, scriptId);
    updateAsrVoiceAiDefaultsTip(scriptId, getAsrVoiceAiDefaultsCached(scriptId));
    if (supportsAsrVoiceAiSettings(scriptId) && isAsrVoiceAiUnlocked(scriptId)) {
      void loadAsrVoiceAiDefaults(scriptId, settings).then(function (payload) {
        if (getCurrentDetailScriptId() !== scriptId || !isAsrVoiceAiUnlocked(scriptId)) {
          return;
        }
        updateAsrVoiceAiDefaultsTip(scriptId, payload);
        if (scriptId === judgementProjectId) {
          applyJudgementForm(currentSettings || settings || {});
        } else if (scriptId === transcriptionProjectId) {
          applyTranscriptionForm(currentSettings || settings || {});
        } else if (scriptId === dataBakerRoundOneQualityScriptId) {
          applyDataBakerForm(currentSettings || settings || {});
        } else if (scriptId === magicDataAnnotatorScriptId) {
          applyMagicDataSettingsForm(currentSettings || settings || {});
        }
      });
    }
    showDetailPanel(scriptId);
    setStatus("detail-status", "");

    if (scriptId === transcriptionProjectId) {
      applyTranscriptionForm(settings);
      setStatus(
        "detail-status",
        "ASR 转写当前为轻量工具栏模式：可配置自动播放、倍速、步长、音量与快捷键；支持当前题 AI 推荐（手动填入）；统计上传和定时上传按脚本规则强制启用。"
      );
      return;
    }

    if (scriptId === judgementProjectId) {
      applyJudgementForm(settings);
      setStatus("judgement-status", "");
      return;
    }

    if (scriptId === lightwheelScriptId) {
      const enabled = isScriptEnabled(settings, scriptId);
      setStatus(
        "lightwheel-status",
        enabled
          ? "当前只启用了脚本中心状态位；Lightwheel 扩展运行时还没有迁入。"
          : "当前脚本未启用。启用后会先纳入 URL 检测和脚本中心管理。"
      );
    }

    if (scriptId === dataBakerRoundOneQualityScriptId) {
      applyDataBakerForm(settings);
      setStatus(
        "data-baker-status",
        "DataBaker 导出数据会在本地下载的同时自动上传到后端；上传地址由首页顶部“后端接口地址”统一控制。"
      );
      return;
    }

    if (scriptId === magicDataAnnotatorScriptId) {
      applyMagicDataSettingsForm(settings);
      setStatus(
        "magic-data-status",
        "Magic Data 页面内结果区固定展示空状态，点击 AI 质检后仅更新内容，不会自动保存或提交。"
      );
    }
  }

  function applyDataBakerForm(settings) {
    const config = getDataBakerRoundOneConfig(settings);
    const defaultsPayload = getAsrVoiceAiDefaultsCached(dataBakerRoundOneQualityScriptId);
    const aiDefaults = defaultsPayload.defaults || {};
    dataBakerShortcutsDraft = clone(config.shortcuts) || {};
    if (getElement("data-baker-ai-recommend-enabled")) {
      getElement("data-baker-ai-recommend-enabled").checked =
        config.aiRecommendEnabled !== false;
      getElement("data-baker-ai-timeout").value = String(
        Number(config.aiRecommendRequestTimeoutMs || aiDefaults.timeoutMs || 120000)
      );
      applyJudgementModelField(
        "data-baker-ai-listen-model-select",
        "data-baker-ai-listen-model-custom",
        getAsrVoiceAiEffectiveText(config.aiRecommendListenModel, aiDefaults.listenModel),
        judgementAiListenModels,
        "listen"
      );
      applyJudgementModelField(
        "data-baker-ai-compare-model-select",
        "data-baker-ai-compare-model-custom",
        getAsrVoiceAiEffectiveText(config.aiRecommendCompareModel, aiDefaults.compareModel),
        judgementAiCompareModels,
        "compare"
      );
      getElement("data-baker-ai-enable-thinking").checked = Boolean(
        config.aiRecommendEnableThinking === true ||
          (config.aiRecommendEnableThinking !== true && aiDefaults.enableThinking === true)
      );
      getElement("data-baker-ai-listen-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendListenPrompt, aiDefaults.listenPrompt)
      );
      getElement("data-baker-ai-compare-prompt").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendComparePrompt, aiDefaults.comparePrompt)
      );
      getElement("data-baker-ai-temperature").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendTemperature, aiDefaults.temperature)
      );
      getElement("data-baker-ai-top-p").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendTopP, aiDefaults.top_p)
      );
      getElement("data-baker-ai-max-tokens").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendMaxTokens, aiDefaults.max_tokens)
      );
      getElement("data-baker-ai-max-completion-tokens").value = String(
        getAsrVoiceAiEffectiveText(
          config.aiRecommendMaxCompletionTokens,
          aiDefaults.max_completion_tokens
        )
      );
      getElement("data-baker-ai-presence-penalty").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendPresencePenalty, aiDefaults.presence_penalty)
      );
      getElement("data-baker-ai-frequency-penalty").value = String(
        getAsrVoiceAiEffectiveText(
          config.aiRecommendFrequencyPenalty,
          aiDefaults.frequency_penalty
        )
      );
      getElement("data-baker-ai-seed").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendSeed, aiDefaults.seed)
      );
      getElement("data-baker-ai-stop-sequences").value = String(
        getAsrVoiceAiEffectiveText(config.aiRecommendStopSequences, aiDefaults.stop)
      );
    }
    getElement("data-baker-auto-page-size-enabled").checked =
      config.autoPageSizeEnabled !== false;
    getElement("data-baker-default-page-size").value = normalizeDataBakerPageSize(
      config.defaultPageSize,
      "50条/页"
    );
    stopDataBakerShortcutRecording("");
    renderDataBakerShortcutGrid();
  }

  async function saveDataBakerSettings() {
    if (!storage || typeof storage.patchSettings !== "function") {
      setStatus("data-baker-status", "当前扩展版本不支持保存标贝易采设置。");
      return false;
    }

    const currentConfig = getDataBakerRoundOneConfig(currentSettings || {});
    const aiDefaults = getAsrVoiceAiDefaultsCached(dataBakerRoundOneQualityScriptId).defaults || {};
    const hasAiSettingsPanel = Boolean(getElement("data-baker-ai-timeout"));
    const timeoutInput = hasAiSettingsPanel
      ? getElement("data-baker-ai-timeout").value
      : String(currentConfig.aiRecommendRequestTimeoutMs);
    const aiRecommendEnabled = hasAiSettingsPanel
      ? getElement("data-baker-ai-recommend-enabled").checked
      : currentConfig.aiRecommendEnabled !== false;
    const autoPageSizeEnabled = getElement("data-baker-auto-page-size-enabled").checked;
    const defaultPageSize = normalizeDataBakerPageSize(
      getElement("data-baker-default-page-size").value,
      "50条/页"
    );
    const timeoutMs = normalizeDataBakerTimeoutMs(timeoutInput);
    const listenModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "data-baker-ai-listen-model-select",
          "data-baker-ai-listen-model-custom",
          currentConfig.aiRecommendListenModel,
          judgementAiListenModels
        )
      : currentConfig.aiRecommendListenModel;
    const compareModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "data-baker-ai-compare-model-select",
          "data-baker-ai-compare-model-custom",
          currentConfig.aiRecommendCompareModel,
          judgementAiCompareModels
        )
      : currentConfig.aiRecommendCompareModel;
    const listenPrompt = hasAiSettingsPanel
      ? normalizePromptText(getElement("data-baker-ai-listen-prompt").value)
      : currentConfig.aiRecommendListenPrompt;
    const comparePrompt = hasAiSettingsPanel
      ? normalizePromptText(getElement("data-baker-ai-compare-prompt").value)
      : currentConfig.aiRecommendComparePrompt;
    const normalizeOverridePrompt = function (value, defaultValue) {
      const normalizedValue = normalizePromptText(value || "");
      const normalizedDefault = normalizePromptText(defaultValue || "");
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const normalizeOverrideNumber = function (value, defaultValue, min, max, precision) {
      const normalizedValue = normalizeOptionalNumberText(value, min, max, precision);
      const normalizedDefault = normalizeOptionalNumberText(defaultValue, min, max, precision);
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const normalizeOverrideInteger = function (value, defaultValue, min, max) {
      const normalizedValue = normalizeOptionalIntegerText(value, min, max);
      const normalizedDefault = normalizeOptionalIntegerText(defaultValue, min, max);
      return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
    };
    const temperature = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("data-baker-ai-temperature").value,
          aiDefaults.temperature,
          0,
          2,
          3
        )
      : currentConfig.aiRecommendTemperature;
    const topP = hasAiSettingsPanel
      ? normalizeOverrideNumber(getElement("data-baker-ai-top-p").value, aiDefaults.top_p, 0, 1, 3)
      : currentConfig.aiRecommendTopP;
    const maxTokens = hasAiSettingsPanel
      ? normalizeOverrideInteger(
          getElement("data-baker-ai-max-tokens").value,
          aiDefaults.max_tokens,
          1,
          8192
        )
      : currentConfig.aiRecommendMaxTokens;
    const maxCompletionTokens = hasAiSettingsPanel
      ? normalizeOverrideInteger(
          getElement("data-baker-ai-max-completion-tokens").value,
          aiDefaults.max_completion_tokens,
          1,
          8192
        )
      : currentConfig.aiRecommendMaxCompletionTokens;
    const presencePenalty = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("data-baker-ai-presence-penalty").value,
          aiDefaults.presence_penalty,
          -2,
          2,
          3
        )
      : currentConfig.aiRecommendPresencePenalty;
    const frequencyPenalty = hasAiSettingsPanel
      ? normalizeOverrideNumber(
          getElement("data-baker-ai-frequency-penalty").value,
          aiDefaults.frequency_penalty,
          -2,
          2,
          3
        )
      : currentConfig.aiRecommendFrequencyPenalty;
    const seed = hasAiSettingsPanel
      ? normalizeOverrideInteger(getElement("data-baker-ai-seed").value, aiDefaults.seed, 0, 2147483647)
      : currentConfig.aiRecommendSeed;
    const stopSequences = hasAiSettingsPanel
      ? (function () {
          const normalizedValue = normalizeStopSequencesText(
            getElement("data-baker-ai-stop-sequences").value
          );
          const normalizedDefault = normalizeStopSequencesText(aiDefaults.stop || "");
          return normalizedValue && normalizedValue !== normalizedDefault ? normalizedValue : "";
        })()
      : currentConfig.aiRecommendStopSequences;
    const enableThinking = hasAiSettingsPanel
      ? getElement("data-baker-ai-enable-thinking").checked === true
      : currentConfig.aiRecommendEnableThinking === true;
    const shortcuts = {};

    ensureDataBakerShortcutDraft();
    dataBakerShortcutActions.forEach(function (action) {
      shortcuts[action.key] = normalizeNullableShortcut(dataBakerShortcutsDraft[action.key]);
    });

    setStatus("data-baker-status", "正在保存标贝易采设置...");

    try {
      currentSettings = await storage.patchSettings({
        platforms: {
          dataBaker: {
            scripts: {
              roundOneQuality: {
                id: dataBakerRoundOneQualityScriptId,
                aiRecommendEnabled: aiRecommendEnabled,
                aiRecommendRequestTimeoutMs: timeoutMs,
                aiRecommendListenModel:
                  listenModel === String(aiDefaults.listenModel || "").trim() ? "" : listenModel,
                aiRecommendCompareModel:
                  compareModel === String(aiDefaults.compareModel || "").trim() ? "" : compareModel,
                aiRecommendEnableThinking:
                  enableThinking === true && aiDefaults.enableThinking !== true ? true : false,
                aiRecommendListenPrompt: normalizeOverridePrompt(listenPrompt, aiDefaults.listenPrompt),
                aiRecommendComparePrompt: normalizeOverridePrompt(comparePrompt, aiDefaults.comparePrompt),
                aiRecommendTemperature: temperature,
                aiRecommendTopP: topP,
                aiRecommendMaxTokens: maxTokens,
                aiRecommendMaxCompletionTokens: maxCompletionTokens,
                aiRecommendPresencePenalty: presencePenalty,
                aiRecommendFrequencyPenalty: frequencyPenalty,
                aiRecommendSeed: seed,
                aiRecommendStopSequences: stopSequences,
                autoPageSizeEnabled: autoPageSizeEnabled,
                defaultPageSize: defaultPageSize,
                shortcuts: shortcuts,
              },
            },
          },
        },
      });
      renderCurrentView();
      setStatus(
        "data-baker-status",
        "标贝易采设置已保存；已打开的标贝易采页面未同步时请刷新页面。"
      );
      return true;
    } catch (error) {
      setStatus(
        "data-baker-status",
        "保存失败：" + (error && error.message ? error.message : String(error))
      );
      return false;
    }
  }

  function setStatus(targetId, text) {
    const node = getElement(targetId);
    if (node) {
      node.textContent = text || "";
    }
  }

  async function loadSettings() {
    if (!storage || typeof storage.getSettings !== "function") {
      throw new Error("扩展存储不可用。");
    }

    currentSettings = await storage.getSettings();
    return currentSettings;
  }

  async function toggleScript(scriptId, enabled) {
    if (!storage) {
      setStatus("detail-status", "当前扩展版本不支持脚本启停。");
      return;
    }

    const script = scriptLibrary[scriptId] || {};
    const targetStatus = enabled ? "启用" : "关闭";
    setStatus("detail-status", "正在" + targetStatus + " " + String(script.label || scriptId) + "...");

    try {
      if (isMagicDataScript(scriptId) && typeof storage.patchSettings === "function") {
        currentSettings = await storage.patchSettings({
          scriptCenter: {
            projects: {
              magicDataAnnotator: {
                enabled: enabled === true,
                aiReviewEnabled: enabled === true,
              },
            },
          },
        });
      } else if (typeof storage.setScriptEnabled === "function") {
        currentSettings = await storage.setScriptEnabled(scriptId, enabled);
      } else {
        throw new Error("当前扩展版本不支持脚本启停。");
      }
      renderCurrentView();
      setStatus(
        "detail-status",
        String(script.label || scriptId) +
          (enabled
            ? " 已启用。如当前平台页面已打开，建议刷新一次。"
            : " 已关闭。")
      );
    } catch (error) {
      setStatus(
        "detail-status",
        targetStatus + "失败：" + (error && error.message ? error.message : String(error))
      );
    }
  }

  async function saveJudgementSettings() {
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      setStatus("judgement-status", "当前扩展版本不支持保存语音判别设置。");
      return false;
    }

    const volumeValue = Number(getElement("judgement-volume").value);
    const rateStepValue = Number(getElement("judgement-rate-step").value);
    const resetRateValue = Number(getElement("judgement-reset-rate").value);
    const seekStepSeconds = Number(getElement("judgement-seek-step").value);
    const itemsPerPage = normalizeJudgementItemsPerPage(
      getElement("judgement-items-per-page").value,
      "50 条/页"
    );
    const autoPlay = Boolean(getElement("judgement-auto-play").checked);
    const asrDiffViewEnabled = Boolean(getElement("judgement-asr-diff-view").checked);
    const asrDiffColors = normalizeJudgementDiffColors(
      {
        changeBackground: getElement("judgement-diff-change-bg").value,
        gapBackground: getElement("judgement-diff-gap-bg").value,
        punctuationBackground: getElement("judgement-diff-punctuation-bg").value,
      },
      constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.asrDiffColors
    );
    const compactCardEnabled = Boolean(getElement("judgement-compact-card").checked);
    const thunderQuestionEnabled = Boolean(getElement("judgement-thunder-question").checked);
    const autoAdvanceAfterChoice = Boolean(getElement("judgement-auto-advance").checked);
    const currentConfig = normalizeJudgementConfig(currentSettings || {});
    const aiDefaults = getAsrVoiceAiDefaultsCached(judgementProjectId).defaults || {};
    const hasAiSettingsPanel = Boolean(getElement("judgement-ai-suggestion-timeout"));
    const aiSuggestionRequestTimeoutMs = hasAiSettingsPanel
      ? clampNumber(
          Number(getElement("judgement-ai-suggestion-timeout").value),
          currentConfig.aiSuggestionRequestTimeoutMs,
          1000,
          180000,
          0
        )
      : currentConfig.aiSuggestionRequestTimeoutMs;
    const aiSuggestionListenModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "judgement-ai-suggestion-listen-model-select",
          "judgement-ai-suggestion-listen-model-custom",
          currentConfig.aiSuggestionListenModel,
          judgementAiListenModels
        )
      : currentConfig.aiSuggestionListenModel;
    const aiSuggestionCompareModel = hasAiSettingsPanel
      ? readJudgementModelField(
          "judgement-ai-suggestion-compare-model-select",
          "judgement-ai-suggestion-compare-model-custom",
          currentConfig.aiSuggestionCompareModel,
          judgementAiCompareModels
        )
      : currentConfig.aiSuggestionCompareModel;
    const aiSuggestionEnableThinking = hasAiSettingsPanel
      ? getElement("judgement-ai-suggestion-enable-thinking").checked === true
      : currentConfig.aiSuggestionEnableThinking === true;
    const webSearchEnabledNode = getElement("judgement-ai-suggestion-web-search-enabled");
    const aiSuggestionWebSearchEnabled =
      hasAiSettingsPanel &&
      webSearchEnabledNode instanceof HTMLInputElement &&
      isJudgementSupportedParamFromDefaults("web_search")
        ? webSearchEnabledNode.checked === true
        : currentConfig.aiSuggestionWebSearchEnabled !== false;
    const aiSuggestionListenPrompt = hasAiSettingsPanel
      ? (function () {
          const value = normalizePromptText(getElement("judgement-ai-suggestion-listen-prompt").value);
          const defaultValue = normalizePromptText(aiDefaults.listenPrompt || "");
          return value && value !== defaultValue ? value : "";
        })()
      : currentConfig.aiSuggestionListenPrompt;
    const aiSuggestionComparePrompt = hasAiSettingsPanel
      ? (function () {
          const value = normalizePromptText(getElement("judgement-ai-suggestion-compare-prompt").value);
          const defaultValue = normalizePromptText(aiDefaults.comparePrompt || "");
          return value && value !== defaultValue ? value : "";
        })()
      : currentConfig.aiSuggestionComparePrompt;
    const aiSuggestionTemperature =
      hasAiSettingsPanel && isJudgementAiParamSupported("temperature")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("judgement-ai-suggestion-temperature").value,
              0,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.temperature, 0, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionTemperature;
    const aiSuggestionTopP =
      hasAiSettingsPanel && isJudgementAiParamSupported("top_p")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("judgement-ai-suggestion-top-p").value,
              0,
              1,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.top_p, 0, 1, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionTopP;
    const aiSuggestionMaxTokens =
      hasAiSettingsPanel && isJudgementAiParamSupported("max_tokens")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("judgement-ai-suggestion-max-tokens").value,
              1,
              8192
            );
            const defaultValue = normalizeOptionalIntegerText(aiDefaults.max_tokens, 1, 8192);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionMaxTokens;
    const aiSuggestionMaxCompletionTokens =
      hasAiSettingsPanel && isJudgementAiParamSupported("max_completion_tokens")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("judgement-ai-suggestion-max-completion-tokens").value,
              1,
              8192
            );
            const defaultValue = normalizeOptionalIntegerText(
              aiDefaults.max_completion_tokens,
              1,
              8192
            );
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionMaxCompletionTokens;
    const aiSuggestionPresencePenalty =
      hasAiSettingsPanel && isJudgementAiParamSupported("presence_penalty")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("judgement-ai-suggestion-presence-penalty").value,
              -2,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.presence_penalty, -2, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionPresencePenalty;
    const aiSuggestionFrequencyPenalty =
      hasAiSettingsPanel && isJudgementAiParamSupported("frequency_penalty")
        ? (function () {
            const value = normalizeOptionalNumberText(
              getElement("judgement-ai-suggestion-frequency-penalty").value,
              -2,
              2,
              3
            );
            const defaultValue = normalizeOptionalNumberText(aiDefaults.frequency_penalty, -2, 2, 3);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionFrequencyPenalty;
    const aiSuggestionSeed =
      hasAiSettingsPanel && isJudgementAiParamSupported("seed")
        ? (function () {
            const value = normalizeOptionalIntegerText(
              getElement("judgement-ai-suggestion-seed").value,
              0,
              2147483647
            );
            const defaultValue = normalizeOptionalIntegerText(aiDefaults.seed, 0, 2147483647);
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionSeed;
    const aiSuggestionStopSequences =
      hasAiSettingsPanel && isJudgementAiParamSupported("stop")
        ? (function () {
            const value = normalizeStopSequencesText(
              getElement("judgement-ai-suggestion-stop-sequences").value
            );
            const defaultValue = normalizeStopSequencesText(aiDefaults.stop || "");
            return value && value !== defaultValue ? value : "";
          })()
        : currentConfig.aiSuggestionStopSequences;
    const aiSuggestionAvailableModels = normalizeJudgementAiAvailableModels(
      constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.aiSuggestionAvailableModels,
      judgementAiCompareModels
    );
    const shortcuts = {};

    ensureShortcutDraft();
    judgementShortcutActions.forEach(function (action) {
      shortcuts[action.key] = normalizeShortcut(judgementShortcutsDraft[action.key]);
    });

    setStatus("judgement-status", "正在保存语音判别设置...");

    try {
      const defaultPlaybackRate = clampNumber(resetRateValue, 1.0, 0.25, 5, 2);
      currentSettings = await storage.saveProjectSettings(judgementProjectId, {
        volumeValue: clampNumber(volumeValue, 100, 0, 1000, 0),
        playbackRateValue: defaultPlaybackRate,
        rateStepValue: normalizeJudgementRateStep(rateStepValue, 0.25),
        seekStepSeconds: normalizeJudgementSeekStep(seekStepSeconds, 0.5),
        autoResetRate: true,
        resetRateValue: defaultPlaybackRate,
        itemsPerPage: itemsPerPage,
        autoPlay: autoPlay,
        virtualWindowEnabled: false,
        asrDiffViewEnabled: asrDiffViewEnabled,
        asrDiffColors: asrDiffColors,
        compactCardEnabled: compactCardEnabled,
        thunderQuestionEnabled: thunderQuestionEnabled,
        autoAdvanceAfterChoice: autoAdvanceAfterChoice,
        statsUploadEnabled: true,
        statsScheduleUrl: "",
        statsUploadTimes: constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.statsUploadTimes || ["10:00", "16:00"],
        statsUploadJitterMinutes: constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.statsUploadJitterMinutes || 10,
        statsAutoUploadOnSubtaskOpen: false,
        statsAutoUploadOnSchedule: true,
        statsUploadRequestTimeoutMs: 20000,
        aiSuggestionEnabled: true,
        aiSuggestionRequestTimeoutMs: aiSuggestionRequestTimeoutMs,
        aiSuggestionListenModel:
          aiSuggestionListenModel === String(aiDefaults.listenModel || "").trim()
            ? ""
            : aiSuggestionListenModel,
        aiSuggestionCompareModel:
          aiSuggestionCompareModel === String(aiDefaults.compareModel || "").trim()
            ? ""
            : aiSuggestionCompareModel,
        aiSuggestionListenPrompt: aiSuggestionListenPrompt,
        aiSuggestionComparePrompt: aiSuggestionComparePrompt,
        aiSuggestionTemperature: aiSuggestionTemperature,
        aiSuggestionTopP: aiSuggestionTopP,
        aiSuggestionMaxTokens: aiSuggestionMaxTokens,
        aiSuggestionMaxCompletionTokens: aiSuggestionMaxCompletionTokens,
        aiSuggestionPresencePenalty: aiSuggestionPresencePenalty,
        aiSuggestionFrequencyPenalty: aiSuggestionFrequencyPenalty,
        aiSuggestionSeed: aiSuggestionSeed,
        aiSuggestionResponseFormat: "json_object",
        aiSuggestionReasoningEffort: "",
        aiSuggestionStopSequences: aiSuggestionStopSequences,
        aiSuggestionEnableThinking: aiSuggestionEnableThinking,
        aiSuggestionWebSearchEnabled: aiSuggestionWebSearchEnabled,
        aiSuggestionModel: aiSuggestionCompareModel,
        aiSuggestionAvailableModels: aiSuggestionAvailableModels,
        shortcuts: shortcuts,
      });
      renderCurrentView();
      setStatus("judgement-status", "语音判别设置已保存；已打开的 LabelX 页面会尽量实时同步，未生效时请刷新页面。");
      return true;
    } catch (error) {
      setStatus(
        "judgement-status",
        "保存失败：" + (error && error.message ? error.message : String(error))
      );
      return false;
    }
  }

  async function renderCurrentView() {
    hideError();
    const scriptId = getCurrentDetailScriptId();
    const settings = currentSettings || (await loadSettings());

    document.title = (constants.EXTENSION_NAME || "标注脚本中心") + " - 设置";
    getElement("extension-name").textContent = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("stage-label").textContent = constants.STAGE_LABEL || "脚本中心";

    if (!scriptId) {
      getElement("script-center-view").classList.remove("hidden");
      getElement("script-detail-view").classList.add("hidden");
      getElement("home-endpoint-card").classList.remove("hidden");
      renderProjectDataDownloadPanel(settings);
      renderScriptCenter(settings);
      return;
    }

    getElement("script-center-view").classList.add("hidden");
    getElement("script-detail-view").classList.remove("hidden");
    getElement("home-endpoint-card").classList.add("hidden");
    getElement("project-data-download-panel").classList.add("hidden");
    renderDetail(settings, scriptId);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const homeEndpointTitle = getElement("home-endpoint-title");
    if (homeEndpointTitle) {
      homeEndpointTitle.addEventListener("click", function () {
        endpointAdvancedRevealCount += 1;
        if (endpointAdvancedRevealCount >= 10) {
          unlockEndpointAdvancedPanel();
        }
      });
    }

    const detailScriptName = getElement("detail-script-name");
    if (detailScriptName) {
      detailScriptName.addEventListener("click", function () {
        const scriptId = getCurrentDetailScriptId();
        if (!scriptId || !supportsAsrVoiceAiSettings(scriptId)) {
          return;
        }
        const justUnlocked = registerAsrVoiceAiRevealClick(scriptId);
        if (justUnlocked) {
          renderDetail(currentSettings || {}, scriptId);
          const statusTarget = getAsrVoiceAiStatusTargetId(scriptId);
          setStatus(statusTarget, "ASR 语音 AI 设置已显示，仅影响当前脚本。");
        }
      });
    }

    getElement("back-to-center").addEventListener("click", function () {
      navigateToScript(null);
    });

    getElement("detail-enable-button").addEventListener("click", function () {
      const scriptId = getCurrentDetailScriptId();
      if (scriptId) {
        void toggleScript(scriptId, true);
      }
    });

    getElement("detail-disable-button").addEventListener("click", function () {
      const scriptId = getCurrentDetailScriptId();
      if (scriptId) {
        void toggleScript(scriptId, false);
      }
    });

    getElement("save-judgement-settings").addEventListener("click", function () {
      void saveJudgementSettings();
    });

    getElement("save-transcription-settings").addEventListener("click", function () {
      void saveTranscriptionSettings();
    });

    getElement("save-data-baker-settings").addEventListener("click", function () {
      void saveDataBakerSettings();
    });

    getElement("save-magic-data-settings").addEventListener("click", function () {
      void saveMagicDataSettings();
    });

    getElement("home-endpoint-server").addEventListener("click", function () {
      void setHomeBackendEndpoint("server");
    });

    getElement("home-endpoint-local").addEventListener("click", function () {
      void setHomeBackendEndpoint("local");
    });

    const projectDownloadDataset = getElement("project-download-dataset");
    if (projectDownloadDataset instanceof HTMLSelectElement) {
      projectDownloadDataset.addEventListener("change", function () {
        updateProjectDataDownloadSupplierVisibility();
      });
    }

    const projectDownloadOperator = getElement("project-download-operator");
    if (projectDownloadOperator instanceof HTMLInputElement) {
      projectDownloadOperator.addEventListener("blur", function () {
        void persistProjectDataDownloadOperatorName(projectDownloadOperator.value).catch(function () {
          setProjectDataDownloadStatus("保存获取人姓名失败，请稍后重试。");
        });
      });
    }

    const projectDownloadExportButton = getElement("project-download-export");
    if (projectDownloadExportButton instanceof HTMLButtonElement) {
      projectDownloadExportButton.addEventListener("click", function () {
        void handleProjectDataDownloadExport();
      });
    }

    try {
      await loadSettings();
      await ensureBackendModeServerOnInit();
      await renderCurrentView();
    } catch (error) {
      showError(error && error.message ? error.message : String(error));
    }
  });
})();
