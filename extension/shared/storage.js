/**
 * @fileoverview Shared chrome.storage helpers with legacy-settings compatibility.
 */

(function () {
  function getConstants() {
    return globalThis.ASREdgeConstants || {
      STORAGE_KEY: "asrEdgeSettings",
      DEFAULT_SETTINGS: {
        platforms: {
          alibabaLabelx: {
            enabled: true,
            scriptCenter: {
              activeProjectId: "transcription",
              projects: {},
            },
            annotation: {
              shortcuts: {},
              customReplacements: [],
              customRates: [],
            },
            automation: {},
            aiPunctuation: {},
            dictionary: {},
            safety: {},
            legacyServer: {},
            reporting: {},
          },
          lightwheel: {
            enabled: false,
            scripts: {
              viewPanel: {
                id: "lightwheelViewPanel",
                enabled: false,
              },
            },
          },
          dataBaker: {
            enabled: true,
            scripts: {
              roundOneQuality: {
                id: "dataBakerRoundOneQuality",
                enabled: true,
                aiRecommendEnabled: true,
                aiRecommendEndpoint:
                  "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend",
                aiRecommendRequestTimeoutMs: DEFAULT_AI_REQUEST_TIMEOUT_MS,
                aiRecommendPipelineMode: "two_stage",
                aiQualifiedAutofillConcurrency: 20,
                aiQualifiedAutofillWaitAllBeforeFill: false,
                aiRecommendListenModel: "qwen3.5-omni-flash",
                aiRecommendCompareModel: "qwen3.5-plus",
                aiRecommendSingleModel: "qwen3.5-omni-flash",
                autoPageSizeEnabled: true,
                defaultPageSize: "50条/页",
                shortcuts: {
                  aiRecommendCurrentItem: null,
                  autoFillQualifiedItem: null,
                  copyAiHeardText: null,
                  copyRecommendedText: null,
                  fillRecommendedText: null,
                  ignoreAiResult: null,
                  sentenceQualified: null,
                  sentenceUnqualified: null,
                  taskPass: null,
                  taskPartialReject: null,
                  taskFullReject: null,
                },
              },
            },
          },
          abakaAi: {
            enabled: true,
            scripts: {
              taskPageCapture: {
                id: "abakaAiTaskPageCapture",
                enabled: true,
                stage: "task21-inline-ai-analysis-debug",
                autoSelectSpecifyOnSameFontTrue: true,
                aiAnalysisMode: "two_stage",
                aiVisionModel: "qwen3.6-plus",
                aiOcrEnabled: false,
                aiOcrModel: "",
                aiReasoningModel: "qwen3.6-plus",
                aiSingleModel: "qwen3.6-plus",
                aiEnableThinking: false,
                aiRequestTimeoutMs: DEFAULT_AI_REQUEST_TIMEOUT_MS,
                shortcuts: {
                  sameFontTrue: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "1",
                    button: null,
                  },
                  sameFontFalse: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "2",
                    button: null,
                  },
                  sameFontArtisticEffect: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "3",
                    button: null,
                  },
                  imageBTextsRemovedSpecify: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "4",
                    button: null,
                  },
                  otherChangesSpecify: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "5",
                    button: null,
                  },
                  stashSave: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "6",
                    button: null,
                  },
                  submitReview: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                    key: "7",
                    button: null,
                  },
                  aiAnalyzeSameFont: {
                    ctrl: false,
                    alt: true,
                    shift: false,
                    meta: false,
                    key: "1",
                    button: null,
                  },
                  aiAnalyzeImageBTextsRemoved: {
                    ctrl: false,
                    alt: true,
                    shift: false,
                    meta: false,
                    key: "2",
                    button: null,
                  },
                  aiAnalyzeOtherChanges: {
                    ctrl: false,
                    alt: true,
                    shift: false,
                    meta: false,
                    key: "3",
                    button: null,
                  },
                  aiAnalyzeOverall: {
                    ctrl: false,
                    alt: true,
                    shift: false,
                    meta: false,
                    key: "4",
                    button: null,
                  },
                },
              },
            },
          },
        },
        asr: {},
        debug: {
          enabled: false,
        },
        cache: {},
        meta: {
          schemaVersion: 7,
          backendEndpointMode: "server",
        },
      },
      DEFAULT_ASR_CONFIG: {},
      DEFAULT_JUDGEMENT_ASR_CONFIG: {},
      DEFAULT_LIGHTWHEEL_PLATFORM_SETTINGS: {},
      DEFAULT_ABAKA_AI_PLATFORM_SETTINGS: {},
      SCRIPT_PROJECTS: {},
      SCRIPT_LIBRARY: {},
      TRANSCRIPTION_PROJECT_ID: "transcription",
      JUDGEMENT_PROJECT_ID: "judgement",
      LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID: "lightwheelViewPanel",
      DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID: "dataBakerRoundOneQuality",
      ABAKA_AI_PLATFORM_ID: "abakaAi",
      ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID: "abakaAiTaskPageCapture",
      DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT:
        "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend",
      DATABAKER_AI_RECOMMEND_LOCAL_ENDPOINT:
        "http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend",
      TRANSCRIPTION_STATS_SERVER_ENDPOINT:
        "https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload",
      TRANSCRIPTION_STATS_LOCAL_ENDPOINT:
        "http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload",
      BACKEND_ENDPOINT_MODE_SERVER: "server",
      BACKEND_ENDPOINT_MODE_LOCAL: "local",
      DATABAKER_PAGE_SIZE_OPTIONS: ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"],
        DATABAKER_AI_PIPELINE_MODE_OPTIONS: [
          { value: "two_stage", label: "双模型：听音模型 + 比较模型" },
          { value: "omni_single", label: "单模型：Omni 单模型" },
        ],
        DATABAKER_AI_LISTEN_MODEL_OPTIONS: [
          { value: "fun-asr", label: "fun-asr" },
          { value: "qwen3.5-omni-plus", label: "qwen3.5-omni-plus" },
          { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
        ],
        DATABAKER_AI_SINGLE_MODEL_OPTIONS: [
          { value: "qwen3.5-omni-plus", label: "qwen3.5-omni-plus" },
          { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
        ],
      DATABAKER_AI_OMNI_MODEL_OPTIONS: [
        { value: "qwen3.5-omni-plus", label: "qwen3.5-omni-plus" },
        { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
      ],
      DATABAKER_AI_FUN_ASR_MODEL_OPTIONS: [{ value: "fun-asr", label: "fun-asr" }],
      DATABAKER_AI_COMPARE_MODEL_OPTIONS: [
        { value: "qwen3.6-plus", label: "qwen3.6-plus" },
        { value: "qwen3.5-plus", label: "qwen3.5-plus" },
        { value: "qwen3.6-flash", label: "qwen3.6-flash" },
        { value: "qwen3.5-flash", label: "qwen3.5-flash" },
      ],
      DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS: [
        { key: "aiRecommendCurrentItem", label: "AI 推荐文本" },
        { key: "autoFillQualifiedItem", label: "AI并发分析并连续填入合格项" },
        { key: "copyAiHeardText", label: "复制 AI 听音文本" },
        { key: "copyRecommendedText", label: "复制 AI 推荐文本" },
        { key: "fillRecommendedText", label: "填入推荐文本" },
        { key: "ignoreAiResult", label: "忽略 AI 推荐结果" },
        { key: "sentenceQualified", label: "句子判定：合格" },
        { key: "sentenceUnqualified", label: "句子判定：不合格" },
        { key: "taskPass", label: "任务判定：通过" },
        { key: "taskPartialReject", label: "任务判定：部分驳回" },
        { key: "taskFullReject", label: "任务判定：全部驳回" },
      ],
      ABAKA_AI_TASK21_SHORTCUT_ACTIONS: [
        { key: "sameFontTrue", label: "same_font：true" },
        { key: "sameFontFalse", label: "same_font：false" },
        {
          key: "sameFontArtisticEffect",
          label: "same_font：same underlying font+artistic effect",
        },
        { key: "imageBTextsRemovedSpecify", label: "image_b_texts_removed：specify" },
        { key: "otherChangesSpecify", label: "other_changes：specify" },
        { key: "stashSave", label: "暂存" },
        { key: "submitReview", label: "送审" },
        { key: "aiAnalyzeSameFont", label: "AI 分析 same_font" },
        { key: "aiAnalyzeImageBTextsRemoved", label: "AI 分析 image_b_texts_removed" },
        { key: "aiAnalyzeOtherChanges", label: "AI 分析 other_changes" },
        { key: "aiAnalyzeOverall", label: "AI 整体分析" },
      ],
      ABAKA_AI_TASK21_AI_MODEL_OPTIONS: [
        { value: "qwen3.6-plus", supportsVision: true, supportsThinking: true },
      ],
      ABAKA_AI_TASK21_AI_ANALYSIS_MODES: [
        { value: "two_stage", label: "双模型方案（默认）" },
        { value: "single_model", label: "单模型方案" },
      ],
      ABAKA_AI_TASK21_VISION_MODEL_OPTIONS: [
        { value: "qwen3.6-plus", supportsVision: true, supportsThinking: true },
      ],
      ABAKA_AI_TASK21_OCR_MODEL_OPTIONS: [],
      ABAKA_AI_TASK21_REASONING_MODEL_OPTIONS: [
        { value: "qwen3.6-plus", supportsVision: true, supportsThinking: true },
      ],
      ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS: [
        { value: "qwen3.6-plus", supportsVision: true, supportsThinking: true },
      ],
      JUDGEMENT_PROJECT_ASR_KEYS: [
        "itemsPerPage",
        "autoPlay",
        "autoResetRate",
        "resetRateValue",
        "playbackRateValue",
        "rateStepValue",
        "seekStepSeconds",
        "volumeValue",
        "virtualWindowEnabled",
        "asrDiffViewEnabled",
        "asrDiffColors",
        "compactCardEnabled",
        "autoAdvanceAfterChoice",
        "statsUploadEnabled",
        "statsUploadEndpoint",
        "statsScheduleUrl",
        "statsUploadTimes",
        "statsUploadJitterMinutes",
        "statsAutoUploadOnSubtaskOpen",
        "statsAutoUploadOnSchedule",
        "statsUploadRequestTimeoutMs",
        "aiSuggestionEnabled",
        "aiSuggestionEndpoint",
        "aiSuggestionRequestTimeoutMs",
        "aiSuggestionListenModel",
        "aiSuggestionCompareModel",
        "aiSuggestionListenPrompt",
        "aiSuggestionComparePrompt",
        "aiSuggestionTemperature",
        "aiSuggestionTopP",
        "aiSuggestionMaxTokens",
        "aiSuggestionMaxCompletionTokens",
        "aiSuggestionPresencePenalty",
        "aiSuggestionFrequencyPenalty",
        "aiSuggestionSeed",
        "aiSuggestionResponseFormat",
        "aiSuggestionReasoningEffort",
        "aiSuggestionStopSequences",
        "aiSuggestionEnableThinking",
        "aiSuggestionModel",
        "aiSuggestionAvailableModels",
        "shortcuts",
      ],
      SHORTCUT_COMPATIBILITY_MAP: {},
    };
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  const EXTENSION_CONTEXT_INVALIDATED_CODE = "EXTENSION_CONTEXT_INVALIDATED";
  const DEFAULT_AI_REQUEST_TIMEOUT_MS = 120000;
  const LEGACY_DEFAULT_AI_REQUEST_TIMEOUT_MS = 60 * 1000;

  function isExtensionContextInvalidatedError(error) {
    const message = String((error && (error.message || error)) || "").toLowerCase();
    return (
      message.indexOf("extension context invalidated") >= 0 ||
      message.indexOf("context invalidated") >= 0
    );
  }

  function createExtensionContextInvalidatedError(rawError) {
    const error = new Error("Extension context invalidated");
    error.code = EXTENSION_CONTEXT_INVALIDATED_CODE;
    if (rawError && rawError !== error) {
      error.cause = rawError;
    }
    return error;
  }

  function isChromeExtensionContextAvailable() {
    try {
      return Boolean(
        globalThis.chrome &&
          chrome.runtime &&
          typeof chrome.runtime.id === "string" &&
          chrome.runtime.id &&
          chrome.storage &&
          chrome.storage.local
      );
    } catch (error) {
      return false;
    }
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
  }

  function deepMerge(base, override) {
    const source = isPlainObject(base) ? base : {};
    const patch = isPlainObject(override) ? override : {};
    const result = { ...source };

    Object.keys(patch).forEach(function (key) {
      if (isPlainObject(source[key]) && isPlainObject(patch[key])) {
        result[key] = deepMerge(source[key], patch[key]);
        return;
      }

      result[key] = clone(patch[key]);
    });

    return result;
  }

  function normalizeShortcut(shortcut, fallback) {
    const base = isPlainObject(fallback) ? fallback : {};
    const input = isPlainObject(shortcut) ? shortcut : {};

    return {
      ctrl: input.ctrl === true || base.ctrl === true,
      alt: input.alt === true || base.alt === true,
      shift: input.shift === true || base.shift === true,
      meta: input.meta === true || base.meta === true,
      key:
        typeof input.key === "string"
          ? input.key
          : typeof base.key === "string"
            ? base.key
            : null,
      button:
        typeof input.button === "number"
          ? input.button
          : typeof base.button === "number"
            ? base.button
            : null,
    };
  }

  function normalizeReplacementRules(rules) {
    return Array.isArray(rules)
      ? rules
          .map(function (rule) {
            return {
              from: typeof rule?.from === "string" ? rule.from : "",
              to: typeof rule?.to === "string" ? rule.to : "",
            };
          })
          .filter(function (rule) {
            return rule.from.trim().length > 0 || rule.to.trim().length > 0;
          })
      : [];
  }

  function normalizeCustomRates(rates, fallback) {
    const defaults = Array.isArray(fallback) ? fallback : [];
    const source = Array.isArray(rates) ? rates : defaults;
    return source.map(function (entry, index) {
      const base = defaults[index] || {};
      const rateValue =
        typeof entry?.rate === "number"
          ? entry.rate
          : typeof base.rate === "number"
            ? base.rate
            : 1.0;

      return {
        rate: Math.max(0.1, Math.min(8, Number(rateValue) || 1.0)),
        shortcut:
          entry?.shortcut === null
            ? null
            : normalizeShortcut(entry?.shortcut, base.shortcut || null),
      };
    });
  }

  function normalizeNumber(value, fallback) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  function normalizeBackendEndpointMode(value, fallback) {
    const constants = getConstants();
    const localMode = constants.BACKEND_ENDPOINT_MODE_LOCAL || "local";
    const serverMode = constants.BACKEND_ENDPOINT_MODE_SERVER || "server";
    const fallbackMode = String(fallback || "").trim().toLowerCase() === localMode ? localMode : serverMode;
    const text = String(value || "").trim().toLowerCase();
    if (text === localMode || text === "localhost" || text === "127.0.0.1") {
      return localMode;
    }
    if (text === serverMode) {
      return serverMode;
    }
    return fallbackMode;
  }

  function inferBackendModeFromEndpoint(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
      return "";
    }
    if (text.indexOf("127.0.0.1") >= 0 || text.indexOf("localhost") >= 0) {
      return "local";
    }
    if (text.indexOf("http://") === 0 || text.indexOf("https://") === 0) {
      return "server";
    }
    return "";
  }

  function ensureGlobalBackendEndpointMode(settings, input, defaults) {
    const constants = getConstants();
    const defaultMode = normalizeBackendEndpointMode(
      defaults?.meta?.backendEndpointMode,
      constants.BACKEND_ENDPOINT_MODE_SERVER || "server"
    );
    settings.meta = deepMerge(defaults?.meta || {}, settings.meta || {});
    const existingMode = normalizeBackendEndpointMode(
      settings.meta.backendEndpointMode,
      defaultMode
    );
    const inputMeta = isPlainObject(input?.meta) ? input.meta : {};
    const hasExplicitInputMode = hasOwn(inputMeta, "backendEndpointMode");
    if (hasExplicitInputMode) {
      settings.meta.backendEndpointMode = existingMode;
      return;
    }

    const candidates = [
      input?.platforms?.alibabaLabelx?.scriptCenter?.projects?.transcription?.asrConfig?.statsUploadEndpoint,
      input?.platforms?.alibabaLabelx?.scriptCenter?.projects?.judgement?.asrConfig?.statsUploadEndpoint,
      input?.platforms?.alibabaLabelx?.scriptCenter?.projects?.judgement?.asrConfig?.aiSuggestionEndpoint,
      input?.platforms?.dataBaker?.scripts?.roundOneQuality?.aiRecommendEndpoint,
      input?.asr?.statsUploadEndpoint,
      input?.asr?.aiSuggestionEndpoint,
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.transcription?.asrConfig?.statsUploadEndpoint,
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.judgement?.asrConfig?.statsUploadEndpoint,
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.judgement?.asrConfig?.aiSuggestionEndpoint,
      settings?.platforms?.dataBaker?.scripts?.roundOneQuality?.aiRecommendEndpoint,
    ];

    const inferredMode =
      candidates
        .map(inferBackendModeFromEndpoint)
        .find(function (mode) {
          return mode === "local" || mode === "server";
        }) || defaultMode;
    settings.meta.backendEndpointMode = normalizeBackendEndpointMode(inferredMode, defaultMode);
  }

  const JUDGEMENT_ITEMS_PER_PAGE_VALUES = [
    "1 条/页",
    "2 条/页",
    "3 条/页",
    "4 条/页",
    "5 条/页",
    "10 条/页",
    "20 条/页",
    "30 条/页",
    "40 条/页",
    "50 条/页",
    "400 条/页",
  ];

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

    if (JUDGEMENT_ITEMS_PER_PAGE_VALUES.indexOf(text) >= 0) {
      return text;
    }

    return JUDGEMENT_ITEMS_PER_PAGE_VALUES.indexOf(fallback) >= 0 ? fallback : "50 条/页";
  }

  function normalizeHexColor(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      return text.toLowerCase();
    }

    return fallback;
  }

  function normalizeJudgementAsrDiffColors(value) {
    const constants = getConstants();
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.asrDiffColors || {
      changeBackground: "#fef3c7",
      gapBackground: "#fee2e2",
      punctuationBackground: "#ede9fe",
    };
    const source = isPlainObject(value) ? value : {};
    const result = {};
    Object.keys(defaults).forEach(function (key) {
      result[key] = normalizeHexColor(source[key], defaults[key]);
    });
    return result;
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

  function normalizeJudgementStatsEndpoint(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    const defaultEndpoint = typeof fallback === "string" ? fallback : "";
    const localEndpoint =
      "http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/upload";

    if (!text) {
      return defaultEndpoint;
    }
    if (text.indexOf("127.0.0.1:3333") >= 0 || text.indexOf("localhost:3333") >= 0) {
      return localEndpoint;
    }
    if (
      text.indexOf("47.108.254.138:3333") >= 0 ||
      text.indexOf("/api/asr-judgement/statistics/upload") >= 0
    ) {
      return defaultEndpoint;
    }
    return text;
  }

  function normalizeJudgementStatsConfig(config) {
    const defaults = getConstants().DEFAULT_JUDGEMENT_ASR_CONFIG || {};
    const nextConfig = isPlainObject(config) ? config : {};
    nextConfig.statsUploadEnabled = true;
    nextConfig.statsUploadEndpoint = normalizeJudgementStatsEndpoint(
      nextConfig.statsUploadEndpoint,
      defaults.statsUploadEndpoint
    );
    nextConfig.statsScheduleUrl = "";
    nextConfig.statsUploadTimes = normalizeTimeList(
      nextConfig.statsUploadTimes,
      defaults.statsUploadTimes
    );
    nextConfig.statsUploadJitterMinutes = Math.max(
      0,
      Math.min(120, normalizeNumber(nextConfig.statsUploadJitterMinutes, defaults.statsUploadJitterMinutes || 10))
    );
    nextConfig.statsAutoUploadOnSubtaskOpen = false;
    nextConfig.statsAutoUploadOnSchedule = true;
    nextConfig.statsUploadRequestTimeoutMs = Math.max(
      1000,
      Math.min(
        120000,
        normalizeNumber(
          nextConfig.statsUploadRequestTimeoutMs,
          defaults.statsUploadRequestTimeoutMs || 20000
        )
      )
    );
    return nextConfig;
  }

  function normalizeJudgementAiEndpoint(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    const fallbackEndpoint = typeof fallback === "string" ? fallback.trim() : "";
    if (!text) {
      return fallbackEndpoint;
    }

    try {
      const url = new URL(text);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return fallbackEndpoint;
      }
      return url.toString();
    } catch (error) {
      return fallbackEndpoint;
    }
  }

  function normalizeJudgementAiAvailableModels(value, fallback) {
    const constants = getConstants();
    const whitelist = Array.isArray(constants.JUDGEMENT_AI_AVAILABLE_MODELS)
      ? constants.JUDGEMENT_AI_AVAILABLE_MODELS
      : ["qwen3.5-plus", "qwen-plus", "qwen-turbo"];
    const source = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : whitelist;
    const result = [];

    source.forEach(function (item) {
      const model = String(item || "").trim();
      if (!model || whitelist.indexOf(model) < 0 || result.indexOf(model) >= 0) {
        return;
      }
      result.push(model);
    });

    return result.length > 0 ? result : whitelist.slice();
  }

  function normalizeJudgementAiModel(value, fallback, availableModels) {
    const source = String(value || "").trim();
    const models = Array.isArray(availableModels) ? availableModels : [];
    if (source && models.indexOf(source) >= 0) {
      return source;
    }

    const fallbackModel = String(fallback || "").trim();
    if (fallbackModel && models.indexOf(fallbackModel) >= 0) {
      return fallbackModel;
    }

    return models[0] || "qwen3.5-plus";
  }

  function normalizeJudgementAiModelText(value, fallback) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return String(fallback || "").trim();
    }
    return text.slice(0, 80);
  }

  function normalizeJudgementAiPrompt(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
  }

  function normalizeJudgementAiOptionalNumberText(value, min, max, precision) {
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

  function normalizeJudgementAiOptionalIntegerText(value, min, max) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const numericValue = Number(text);
    if (!Number.isFinite(numericValue)) {
      return "";
    }
    const normalized = Math.floor(Math.max(min, Math.min(max, numericValue)));
    return String(normalized);
  }

  function normalizeJudgementAiResponseFormat(value, fallback) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "json_object" || text === "text") {
      return text;
    }
    const fallbackText = String(fallback || "").trim().toLowerCase();
    if (fallbackText === "json_object" || fallbackText === "text") {
      return fallbackText;
    }
    return "json_object";
  }

  function normalizeJudgementAiReasoningEffort(value) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "low" || text === "medium" || text === "high") {
      return text;
    }
    return "";
  }

  function normalizeJudgementAiStopSequences(value) {
    const source = String(value || "");
    if (!source.trim()) {
      return "";
    }
    const list = source
      .split(/\r?\n/)
      .map(function (item) {
        return String(item || "").trim().slice(0, 80);
      })
      .filter(Boolean);
    const result = [];
    list.forEach(function (item) {
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

  function normalizeClampedNumber(value, fallback, min, max, precision) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    const clamped = Math.max(min, Math.min(max, numericValue));
    return typeof precision === "number" ? Number(clamped.toFixed(precision)) : clamped;
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

  function normalizeJudgementAsrConfig(config) {
    const constants = getConstants();
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {};
    const fallback = defaults.itemsPerPage || "50 条/页";
    const nextConfig = isPlainObject(config) ? config : {};
    nextConfig.itemsPerPage = normalizeJudgementItemsPerPage(
      nextConfig.itemsPerPage,
      fallback
    );
    const defaultPlaybackRate = normalizeClampedNumber(
      hasOwn(nextConfig, "resetRateValue") ? nextConfig.resetRateValue : nextConfig.playbackRateValue,
      defaults.resetRateValue || defaults.playbackRateValue || 1,
      0.25,
      5,
      2
    );
    nextConfig.autoResetRate = true;
    nextConfig.resetRateValue = defaultPlaybackRate;
    nextConfig.playbackRateValue = defaultPlaybackRate;
    nextConfig.rateStepValue = normalizeJudgementRateStep(
      nextConfig.rateStepValue,
      defaults.rateStepValue || 0.25
    );
    nextConfig.seekStepSeconds = normalizeJudgementSeekStep(
      nextConfig.seekStepSeconds,
      defaults.seekStepSeconds || 0.5
    );
    nextConfig.volumeValue = normalizeClampedNumber(
      nextConfig.volumeValue,
      defaults.volumeValue || 100,
      0,
      1000,
      0
    );
    nextConfig.asrDiffColors = normalizeJudgementAsrDiffColors(nextConfig.asrDiffColors);
    nextConfig.thunderQuestionEnabled = nextConfig.thunderQuestionEnabled !== false;
    if (!isPlainObject(nextConfig.shortcuts)) {
      nextConfig.shortcuts = {};
    }

    const legacyAiShortcut = hasOwn(nextConfig, "aiSuggestionShortcut")
      ? nextConfig.aiSuggestionShortcut
      : null;
    const aiShortcut = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "aiSuggestCurrentItem")
        ? nextConfig.shortcuts.aiSuggestCurrentItem
        : legacyAiShortcut,
      null
    );
    nextConfig.shortcuts.aiSuggestCurrentItem = aiShortcut;
    nextConfig.shortcuts.applyAiSuggestion = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "applyAiSuggestion")
        ? nextConfig.shortcuts.applyAiSuggestion
        : null,
      null
    );
    nextConfig.shortcuts.retryAiSuggestion = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "retryAiSuggestion")
        ? nextConfig.shortcuts.retryAiSuggestion
        : null,
      null
    );
    nextConfig.shortcuts.ignoreAiSuggestion = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "ignoreAiSuggestion")
        ? nextConfig.shortcuts.ignoreAiSuggestion
        : null,
      null
    );
    nextConfig.shortcuts.copyAsrTextPair = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "copyAsrTextPair")
        ? nextConfig.shortcuts.copyAsrTextPair
        : null,
      null
    );
    nextConfig.shortcuts.submitTask = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "submitTask")
        ? nextConfig.shortcuts.submitTask
        : null,
      null
    );
    nextConfig.shortcuts.submitTaskAndFinish = normalizeShortcut(
      hasOwn(nextConfig.shortcuts, "submitTaskAndFinish")
        ? nextConfig.shortcuts.submitTaskAndFinish
        : null,
      null
    );
    delete nextConfig.aiSuggestionShortcut;

    const normalizedStatsConfig = normalizeJudgementStatsConfig(nextConfig);
    normalizedStatsConfig.aiSuggestionEnabled = true;
    normalizedStatsConfig.aiSuggestionEndpoint = normalizeJudgementAiEndpoint(
      normalizedStatsConfig.aiSuggestionEndpoint,
      defaults.aiSuggestionEndpoint ||
        "http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/ai/suggest"
    );
    normalizedStatsConfig.aiSuggestionRequestTimeoutMs = Math.max(
      1000,
      Math.min(
        180000,
        normalizeNumber(
          normalizedStatsConfig.aiSuggestionRequestTimeoutMs,
          defaults.aiSuggestionRequestTimeoutMs || DEFAULT_AI_REQUEST_TIMEOUT_MS
        )
      )
    );
    normalizedStatsConfig.aiSuggestionAvailableModels = normalizeJudgementAiAvailableModels(
      normalizedStatsConfig.aiSuggestionAvailableModels,
      defaults.aiSuggestionAvailableModels
    );
    const legacyCompareModel = normalizeJudgementAiModelText(
      normalizedStatsConfig.aiSuggestionModel,
      defaults.aiSuggestionModel || defaults.aiSuggestionCompareModel || "qwen3.5-plus"
    );
    normalizedStatsConfig.aiSuggestionListenModel = normalizeJudgementAiModelText(
      normalizedStatsConfig.aiSuggestionListenModel,
      defaults.aiSuggestionListenModel || "qwen3.5-omni-flash"
    );
    normalizedStatsConfig.aiSuggestionCompareModel = normalizeJudgementAiModelText(
      normalizedStatsConfig.aiSuggestionCompareModel || legacyCompareModel,
      defaults.aiSuggestionCompareModel || defaults.aiSuggestionModel || "qwen3.5-plus"
    );
    normalizedStatsConfig.aiSuggestionListenPrompt = normalizeJudgementAiPrompt(
      normalizedStatsConfig.aiSuggestionListenPrompt
    );
    normalizedStatsConfig.aiSuggestionComparePrompt = normalizeJudgementAiPrompt(
      normalizedStatsConfig.aiSuggestionComparePrompt
    );
    normalizedStatsConfig.aiSuggestionTemperature = normalizeJudgementAiOptionalNumberText(
      normalizedStatsConfig.aiSuggestionTemperature,
      0,
      2,
      3
    );
    normalizedStatsConfig.aiSuggestionTopP = normalizeJudgementAiOptionalNumberText(
      normalizedStatsConfig.aiSuggestionTopP,
      0,
      1,
      3
    );
    normalizedStatsConfig.aiSuggestionMaxTokens = normalizeJudgementAiOptionalIntegerText(
      normalizedStatsConfig.aiSuggestionMaxTokens,
      1,
      8192
    );
    normalizedStatsConfig.aiSuggestionMaxCompletionTokens = normalizeJudgementAiOptionalIntegerText(
      normalizedStatsConfig.aiSuggestionMaxCompletionTokens,
      1,
      8192
    );
    normalizedStatsConfig.aiSuggestionPresencePenalty = normalizeJudgementAiOptionalNumberText(
      normalizedStatsConfig.aiSuggestionPresencePenalty,
      -2,
      2,
      3
    );
    normalizedStatsConfig.aiSuggestionFrequencyPenalty = normalizeJudgementAiOptionalNumberText(
      normalizedStatsConfig.aiSuggestionFrequencyPenalty,
      -2,
      2,
      3
    );
    normalizedStatsConfig.aiSuggestionSeed = normalizeJudgementAiOptionalIntegerText(
      normalizedStatsConfig.aiSuggestionSeed,
      0,
      2147483647
    );
    normalizedStatsConfig.aiSuggestionResponseFormat = normalizeJudgementAiResponseFormat(
      normalizedStatsConfig.aiSuggestionResponseFormat,
      defaults.aiSuggestionResponseFormat || "json_object"
    );
    normalizedStatsConfig.aiSuggestionReasoningEffort = normalizeJudgementAiReasoningEffort(
      normalizedStatsConfig.aiSuggestionReasoningEffort
    );
    normalizedStatsConfig.aiSuggestionStopSequences = normalizeJudgementAiStopSequences(
      normalizedStatsConfig.aiSuggestionStopSequences
    );
    normalizedStatsConfig.aiSuggestionEnableThinking =
      normalizedStatsConfig.aiSuggestionEnableThinking === true;
    normalizedStatsConfig.aiSuggestionWebSearchEnabled =
      normalizedStatsConfig.aiSuggestionWebSearchEnabled !== false;
    // legacy compatibility: keep single model field aligned with compare model.
    normalizedStatsConfig.aiSuggestionModel = normalizedStatsConfig.aiSuggestionCompareModel;
    return normalizedStatsConfig;
  }

  function createStoragePromise(method, payload) {
    if (!isChromeExtensionContextAvailable()) {
      return Promise.reject(createExtensionContextInvalidatedError());
    }

    if (!chrome?.storage?.local?.[method]) {
      return Promise.reject(createExtensionContextInvalidatedError());
    }

    return new Promise(function (resolve, reject) {
      try {
        chrome.storage.local[method](payload, function (result) {
          const runtimeLastError = chrome?.runtime?.lastError || null;
          if (runtimeLastError) {
            const runtimeError = new Error(runtimeLastError.message || "chrome.runtime.lastError");
            if (isExtensionContextInvalidatedError(runtimeError)) {
              reject(createExtensionContextInvalidatedError(runtimeError));
              return;
            }
            reject(runtimeError);
            return;
          }

          resolve(result);
        });
      } catch (error) {
        if (isExtensionContextInvalidatedError(error) || !isChromeExtensionContextAvailable()) {
          reject(createExtensionContextInvalidatedError(error));
          return;
        }
        reject(error);
      }
    });
  }

  async function getStoredValue() {
    const constants = getConstants();
    const result = await createStoragePromise("get", constants.STORAGE_KEY);
    return result?.[constants.STORAGE_KEY] || {};
  }

  async function setStoredValue(settings) {
    const constants = getConstants();
    await createStoragePromise("set", {
      [constants.STORAGE_KEY]: settings,
    });
    return settings;
  }

  function ensurePlatformRoot(settings) {
    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    if (!isPlainObject(settings.platforms.alibabaLabelx)) {
      settings.platforms.alibabaLabelx = {};
    }

    return settings.platforms.alibabaLabelx;
  }

  function ensureLightwheelRoot(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});

    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    settings.platforms.lightwheel = deepMerge(
      defaults?.platforms?.lightwheel || constants.DEFAULT_LIGHTWHEEL_PLATFORM_SETTINGS || {},
      settings.platforms.lightwheel || {}
    );

    return settings.platforms.lightwheel;
  }

  function normalizeDataBakerAiEndpoint(value, fallback) {
    const constants = getConstants();
    const serverEndpoint =
      constants.DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT ||
      "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend";
    const localEndpoint =
      constants.DATABAKER_AI_RECOMMEND_LOCAL_ENDPOINT ||
      "http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend";
    const fallbackEndpoint =
      normalizeDataBakerAiEndpointUrl(fallback) === normalizeDataBakerAiEndpointUrl(localEndpoint)
        ? localEndpoint
        : serverEndpoint;
    const normalized = normalizeDataBakerAiEndpointUrl(value);

    if (normalized && normalized === normalizeDataBakerAiEndpointUrl(localEndpoint)) {
      return localEndpoint;
    }
    if (normalized && normalized === normalizeDataBakerAiEndpointUrl(serverEndpoint)) {
      return serverEndpoint;
    }

    return fallbackEndpoint;
  }

  function normalizeDataBakerAiEndpointUrl(value) {
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

  function normalizeAiRequestTimeoutValue(value, fallback) {
    const numericValue = Number(value);
    const fallbackNumber = Number(fallback);
    let resolved = Number.isFinite(numericValue) ? numericValue : fallbackNumber;
    if (!Number.isFinite(resolved)) {
      resolved = DEFAULT_AI_REQUEST_TIMEOUT_MS;
    }
    if (Math.round(resolved) === LEGACY_DEFAULT_AI_REQUEST_TIMEOUT_MS) {
      resolved = DEFAULT_AI_REQUEST_TIMEOUT_MS;
    }
    return Math.max(1000, Math.min(300000, Math.floor(resolved)));
  }

  function normalizeDataBakerTimeout(value, fallback) {
    return normalizeAiRequestTimeoutValue(value, fallback);
  }

  function normalizeDataBakerPageSize(value, fallback) {
    const constants = getConstants();
    const options = Array.isArray(constants.DATABAKER_PAGE_SIZE_OPTIONS)
      ? constants.DATABAKER_PAGE_SIZE_OPTIONS
      : ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"];
    const normalizedOptions = options.map(function (item) {
      return String(item || "").replace(/\s+/g, "");
    });
    const text = String(value || "").replace(/\s+/g, "");
    const fallbackText = String(fallback || "50条/页").replace(/\s+/g, "");

    if (normalizedOptions.indexOf(text) >= 0) {
      return options[normalizedOptions.indexOf(text)];
    }
    if (normalizedOptions.indexOf(fallbackText) >= 0) {
      return options[normalizedOptions.indexOf(fallbackText)];
    }
    return "50条/页";
  }

  function normalizeDataBakerConcurrency(value, fallback) {
    const numeric = Number(value);
    const fallbackNumeric = Number(fallback);
    const base = Number.isFinite(numeric)
      ? numeric
      : Number.isFinite(fallbackNumeric)
        ? fallbackNumeric
        : 20;
    return Math.max(1, Math.min(50, Math.round(base)));
  }

  function normalizeDataBakerPipelineMode(value, fallback) {
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
    return String(fallback || "two_stage").trim().toLowerCase() === "omni_single"
      ? "omni_single"
      : "two_stage";
  }

  function getDataBakerListenModelOptions(constants) {
    const values = Array.isArray(constants?.DATABAKER_AI_LISTEN_MODEL_OPTIONS)
      ? constants.DATABAKER_AI_LISTEN_MODEL_OPTIONS
          .map(function (item) {
            return getDataBakerModelText(item && typeof item === "object" ? item.value : item);
          })
          .filter(Boolean)
      : [];
    if (values.length > 0) {
      return values;
    }
    return ["fun-asr", "qwen3.5-omni-plus", "qwen3.5-omni-flash"];
  }

  function getDataBakerSingleModelOptions(constants) {
    const values = Array.isArray(constants?.DATABAKER_AI_SINGLE_MODEL_OPTIONS)
      ? constants.DATABAKER_AI_SINGLE_MODEL_OPTIONS
          .map(function (item) {
            return getDataBakerModelText(item && typeof item === "object" ? item.value : item);
          })
          .filter(Boolean)
      : [];
    if (values.length > 0) {
      return values;
    }
    return ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];
  }

  function deriveDataBakerPipelineModeFromListenModel(listenModel) {
    return getDataBakerModelText(listenModel) === "fun-asr"
      ? "fun_asr_compare"
      : "qwen_omni_compare";
  }

  function normalizeDataBakerListenModel(value, fallback, constants) {
    const listenOptions = getDataBakerListenModelOptions(constants);
    const normalizedFallback =
      listenOptions.indexOf(getDataBakerModelText(fallback || "")) >= 0
        ? getDataBakerModelText(fallback || "")
        : "qwen3.5-omni-flash";
    const normalizedValue = getDataBakerModelText(value);
    if (listenOptions.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    return normalizedFallback;
  }

  function normalizeDataBakerSingleModel(value, fallback, constants) {
    const singleOptions = getDataBakerSingleModelOptions(constants);
    const normalizedFallback =
      singleOptions.indexOf(getDataBakerModelText(fallback || "")) >= 0
        ? getDataBakerModelText(fallback || "")
        : "qwen3.5-omni-flash";
    const normalizedValue = getDataBakerModelText(value);
    if (singleOptions.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    return normalizedFallback;
  }

  function resolveDataBakerListenModel(value, pipelineMode, fallback, constants) {
    const normalizedValue = getDataBakerModelText(value);
    if (normalizedValue) {
      return normalizeDataBakerListenModel(normalizedValue, fallback, constants);
    }
    const rawPipelineMode = String(pipelineMode || "").trim().toLowerCase();
    if (rawPipelineMode === "fun_asr_compare") {
      return "fun-asr";
    }
    if (rawPipelineMode === "qwen_omni_compare" || rawPipelineMode === "qwen_omni_two_stage") {
      return normalizeDataBakerListenModel("qwen3.5-omni-flash", fallback || "qwen3.5-omni-flash", constants);
    }
    return normalizeDataBakerListenModel("", fallback || "qwen3.5-omni-flash", constants);
  }

  function normalizeDataBakerOmniModel(value, fallback, constants) {
    const normalized = normalizeDataBakerListenModel(value, fallback, constants);
    if (normalized === "fun-asr") {
      return normalizeDataBakerListenModel(fallback, "qwen3.5-omni-flash", constants);
    }
    return normalized;
  }

  function getDataBakerModelText(value) {
    if (isPlainObject(value)) {
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

  function getDataBakerCompareModelOptions(constants) {
    const values = Array.isArray(constants?.DATABAKER_AI_COMPARE_MODEL_OPTIONS)
      ? constants.DATABAKER_AI_COMPARE_MODEL_OPTIONS
          .map(function (item) {
            return getDataBakerModelText(item && typeof item === "object" ? item.value : item);
          })
          .filter(Boolean)
      : [];
    if (values.length > 0) {
      return values;
    }
    return ["qwen3.6-plus", "qwen3.5-plus", "qwen3.6-flash", "qwen3.5-flash"];
  }

  function normalizeDataBakerOmniModel(value, fallback, constants) {
    const omniOptions = Array.isArray(constants?.DATABAKER_AI_OMNI_MODEL_OPTIONS)
      ? constants.DATABAKER_AI_OMNI_MODEL_OPTIONS
          .map(function (item) {
            return getDataBakerModelText(item && typeof item === "object" ? item.value : item);
          })
          .filter(Boolean)
      : [];
    const normalizedFallback =
      getDataBakerModelText(fallback || "qwen3.5-omni-flash") || "qwen3.5-omni-flash";
    const normalizedValue = getDataBakerModelText(value);
    if (omniOptions.length > 0) {
      if (normalizedValue && omniOptions.indexOf(normalizedValue) >= 0) {
        return normalizedValue;
      }
      if (omniOptions.indexOf(normalizedFallback) >= 0) {
        return normalizedFallback;
      }
      return omniOptions[0];
    }
    return normalizedValue || normalizedFallback;
  }

  function normalizeDataBakerCompareModel(value, fallback, constants) {
    const compareOptions = getDataBakerCompareModelOptions(constants);
    const normalizedFallback =
      compareOptions.indexOf(getDataBakerModelText(fallback || "")) >= 0
        ? getDataBakerModelText(fallback || "")
        : "qwen3.5-plus";
    const normalizedValue = getDataBakerModelText(value);
    if (compareOptions.indexOf(normalizedValue) >= 0) {
      return normalizedValue;
    }
    return normalizedFallback;
  }

  function normalizeDataBakerWaitAllBeforeFill(value, fallback) {
    if (value === true || value === false) {
      return value;
    }
    return fallback === false ? false : true;
  }

  function normalizeNullableShortcut(shortcut, fallback) {
    if (shortcut === null) {
      return null;
    }
    const normalized = normalizeShortcut(shortcut, fallback || null);
    return normalized.key || typeof normalized.button === "number" ? normalized : null;
  }

  function normalizeDataBakerShortcuts(value, fallback) {
    const constants = getConstants();
    const actions = Array.isArray(constants.DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS)
        ? constants.DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS
        : [
          { key: "aiRecommendCurrentItem" },
          { key: "autoFillQualifiedItem" },
          { key: "copyAiHeardText" },
          { key: "copyRecommendedText" },
          { key: "fillRecommendedText" },
          { key: "ignoreAiResult" },
          { key: "sentenceQualified" },
          { key: "sentenceUnqualified" },
          { key: "taskPass" },
          { key: "taskPartialReject" },
          { key: "taskFullReject" },
        ];
    const source = isPlainObject(value) ? value : {};
    const fallbackSource = isPlainObject(fallback) ? fallback : {};
    const result = {};

    actions.forEach(function (action) {
      const key = action.key;
      result[key] = hasOwn(source, key)
        ? normalizeNullableShortcut(source[key], fallbackSource[key] || null)
        : normalizeNullableShortcut(fallbackSource[key] || null, null);
    });

    return result;
  }

  function normalizeAbakaAiTask21Shortcuts(value, fallback) {
    const constants = getConstants();
    const actions = Array.isArray(constants.ABAKA_AI_TASK21_SHORTCUT_ACTIONS)
      ? constants.ABAKA_AI_TASK21_SHORTCUT_ACTIONS
      : [
          { key: "sameFontTrue" },
          { key: "sameFontFalse" },
          { key: "sameFontArtisticEffect" },
          { key: "imageBTextsRemovedSpecify" },
          { key: "otherChangesSpecify" },
          { key: "stashSave" },
          { key: "submitReview" },
          { key: "aiAnalyzeSameFont" },
          { key: "aiAnalyzeImageBTextsRemoved" },
          { key: "aiAnalyzeOtherChanges" },
          { key: "aiAnalyzeOverall" },
        ];
    const source = isPlainObject(value) ? value : {};
    const fallbackSource = isPlainObject(fallback) ? fallback : {};
    const result = {};

    actions.forEach(function (action) {
      const key = action.key;
      result[key] = hasOwn(source, key)
        ? normalizeNullableShortcut(source[key], fallbackSource[key] || null)
        : normalizeNullableShortcut(fallbackSource[key] || null, null);
    });

    return result;
  }

  function mapLegacyAbakaAiModelName(modelName) {
    const text = String(modelName || "").trim();
    const lower = text.toLowerCase();
    if (!text) {
      return "";
    }
    if (lower === "qwen3.6plus") {
      return "qwen3.6-plus";
    }
    if (lower === "qwen-vl-max-latest") {
      return "qwen-vl-max";
    }
    if (lower === "qwen-vl-plus-latest") {
      return "qwen-vl-plus";
    }
    if (lower === "qwen-vl-ocr-latest") {
      return "";
    }
    if (lower === "qvq-plus-latest") {
      return "qwen3.6-plus";
    }
    return text;
  }

  function normalizeAbakaAiModel(value, fallback, options) {
    const allowed = Array.isArray(options)
      ? options
          .map(function (item) {
            return mapLegacyAbakaAiModelName(String(item?.value || "").trim());
          })
          .filter(Boolean)
      : [];
    const rawFallback = fallback === undefined ? "qwen3.6-plus" : String(fallback || "");
    const fallbackModel = mapLegacyAbakaAiModelName(rawFallback).trim();
    const text = mapLegacyAbakaAiModelName(
      String(value || "")
        .replace(/[\r\n]+/g, " ")
        .trim()
    );
    if (!text) {
      if (allowed.length > 0) {
        if (fallbackModel && allowed.indexOf(fallbackModel) >= 0) {
          return fallbackModel;
        }
        return allowed[0];
      }
      return fallbackModel;
    }
    const normalized = text.slice(0, 80);
    if (allowed.length <= 0 || allowed.indexOf(normalized) >= 0) {
      return normalized;
    }
    if (fallbackModel && allowed.indexOf(fallbackModel) >= 0) {
      return fallbackModel;
    }
    return allowed[0];
  }

  function normalizeAbakaAiAnalysisMode(value, fallback) {
    const text = String(value || "").trim().toLowerCase();
    if (text === "single_model") {
      return "single_model";
    }
    if (text === "two_stage") {
      return "two_stage";
    }
    return String(fallback || "two_stage").trim().toLowerCase() === "single_model"
      ? "single_model"
      : "two_stage";
  }

  function normalizeAbakaAiRequestTimeout(value, fallback) {
    return normalizeAiRequestTimeoutValue(value, fallback);
  }

  function normalizeDataBakerRoundOneQualityConfig(config, defaults) {
    const source = isPlainObject(config) ? config : {};
    const defaultConfig = isPlainObject(defaults) ? defaults : {};
    const result = deepMerge(defaultConfig, source);
    const constants = getConstants();

    result.id =
      constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID ||
      result.id ||
      "dataBakerRoundOneQuality";
    result.enabled = result.enabled !== false;
    result.aiRecommendEnabled = result.aiRecommendEnabled !== false;
    result.aiRecommendEndpoint = normalizeDataBakerAiEndpoint(
      result.aiRecommendEndpoint,
      defaultConfig.aiRecommendEndpoint ||
        constants.DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT
    );
    result.aiRecommendRequestTimeoutMs = normalizeDataBakerTimeout(
      result.aiRecommendRequestTimeoutMs,
      defaultConfig.aiRecommendRequestTimeoutMs || DEFAULT_AI_REQUEST_TIMEOUT_MS
    );
    const defaultPipelineMode = normalizeDataBakerPipelineMode(
      defaultConfig.aiRecommendPipelineMode || "two_stage",
      "two_stage"
    );
    const defaultListenModel = resolveDataBakerListenModel(
      defaultConfig.aiRecommendListenModel,
      defaultPipelineMode,
      "qwen3.5-omni-flash",
      constants
    );
    const defaultSingleModel = normalizeDataBakerSingleModel(
      defaultConfig.aiRecommendSingleModel || defaultConfig.aiRecommendListenModel,
      "qwen3.5-omni-flash",
      constants
    );
    const rawPipelineMode = getDataBakerModelText(result.aiRecommendPipelineMode);
    const normalizedPipelineMode = normalizeDataBakerPipelineMode(
      result.aiRecommendPipelineMode,
      defaultPipelineMode
    );
    result.aiRecommendListenModel = resolveDataBakerListenModel(
      result.aiRecommendListenModel,
      rawPipelineMode || (normalizedPipelineMode === "omni_single" ? "" : normalizedPipelineMode),
      defaultListenModel,
      constants
    );
    result.aiRecommendSingleModel = normalizeDataBakerSingleModel(
      result.aiRecommendSingleModel ||
        (normalizedPipelineMode === "omni_single"
          ? result.aiRecommendListenModel === "fun-asr"
            ? "qwen3.5-omni-flash"
            : result.aiRecommendListenModel
          : ""),
      defaultSingleModel,
      constants
    );
    result.aiRecommendPipelineMode = normalizedPipelineMode;
    result.aiQualifiedAutofillConcurrency = normalizeDataBakerConcurrency(
      result.aiQualifiedAutofillConcurrency,
      defaultConfig.aiQualifiedAutofillConcurrency || 20
    );
    result.aiQualifiedAutofillWaitAllBeforeFill = normalizeDataBakerWaitAllBeforeFill(
      result.aiQualifiedAutofillWaitAllBeforeFill,
      defaultConfig.aiQualifiedAutofillWaitAllBeforeFill === true
    );
    result.aiRecommendCompareModel = normalizeDataBakerCompareModel(
      result.aiRecommendCompareModel,
      defaultConfig.aiRecommendCompareModel || "qwen3.5-plus",
      constants
    );
    result.aiRecommendEnableThinking = result.aiRecommendEnableThinking === true;
    result.aiRecommendListenPrompt = normalizeJudgementAiPrompt(result.aiRecommendListenPrompt);
    result.aiRecommendComparePrompt = normalizeJudgementAiPrompt(result.aiRecommendComparePrompt);
    result.aiRecommendTemperature = normalizeJudgementAiOptionalNumberText(
      result.aiRecommendTemperature,
      0,
      2,
      3
    );
    result.aiRecommendTopP = normalizeJudgementAiOptionalNumberText(
      result.aiRecommendTopP,
      0,
      1,
      3
    );
    result.aiRecommendMaxTokens = normalizeJudgementAiOptionalIntegerText(
      result.aiRecommendMaxTokens,
      1,
      8192
    );
    result.aiRecommendMaxCompletionTokens = normalizeJudgementAiOptionalIntegerText(
      result.aiRecommendMaxCompletionTokens,
      1,
      8192
    );
    result.aiRecommendPresencePenalty = normalizeJudgementAiOptionalNumberText(
      result.aiRecommendPresencePenalty,
      -2,
      2,
      3
    );
    result.aiRecommendFrequencyPenalty = normalizeJudgementAiOptionalNumberText(
      result.aiRecommendFrequencyPenalty,
      -2,
      2,
      3
    );
    result.aiRecommendSeed = normalizeJudgementAiOptionalIntegerText(
      result.aiRecommendSeed,
      0,
      2147483647
    );
    result.aiRecommendStopSequences = normalizeJudgementAiStopSequences(
      result.aiRecommendStopSequences
    );
    result.autoPageSizeEnabled = result.autoPageSizeEnabled !== false;
    result.defaultPageSize = normalizeDataBakerPageSize(
      result.defaultPageSize,
      defaultConfig.defaultPageSize || "50条/页"
    );
    result.shortcuts = normalizeDataBakerShortcuts(
      result.shortcuts,
      defaultConfig.shortcuts || {}
    );

    return result;
  }

  function ensureDataBakerRoot(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultPlatform =
      defaults?.platforms?.dataBaker || constants.DEFAULT_DATA_BAKER_PLATFORM_SETTINGS || {
        enabled: true,
        scripts: {
          roundOneQuality: {
            id: constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID || "dataBakerRoundOneQuality",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendEndpoint:
              constants.DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT ||
              "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend",
            aiRecommendRequestTimeoutMs: DEFAULT_AI_REQUEST_TIMEOUT_MS,
            aiRecommendPipelineMode: "two_stage",
                aiQualifiedAutofillConcurrency: 20,
            aiQualifiedAutofillWaitAllBeforeFill: false,
            aiRecommendListenModel: "qwen3.5-omni-flash",
            aiRecommendCompareModel: "qwen3.5-plus",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
            autoPageSizeEnabled: true,
            defaultPageSize: "50条/页",
            shortcuts: {
              aiRecommendCurrentItem: null,
              autoFillQualifiedItem: null,
              copyAiHeardText: null,
              copyRecommendedText: null,
              fillRecommendedText: null,
              ignoreAiResult: null,
              sentenceQualified: null,
              sentenceUnqualified: null,
              taskPass: null,
              taskPartialReject: null,
              taskFullReject: null,
            },
          },
        },
      };

    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    settings.platforms.dataBaker = deepMerge(
      defaultPlatform,
      settings.platforms.dataBaker || {}
    );

    if (!isPlainObject(settings.platforms.dataBaker.scripts)) {
      settings.platforms.dataBaker.scripts = {};
    }

    settings.platforms.dataBaker.enabled = settings.platforms.dataBaker.enabled !== false;
    settings.platforms.dataBaker.scripts.roundOneQuality =
      normalizeDataBakerRoundOneQualityConfig(
        settings.platforms.dataBaker.scripts.roundOneQuality,
        defaultPlatform.scripts?.roundOneQuality || {}
      );

    return settings.platforms.dataBaker;
  }

  function ensureAbakaAiRoot(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultPlatform =
      defaults?.platforms?.abakaAi || constants.DEFAULT_ABAKA_AI_PLATFORM_SETTINGS || {
        enabled: true,
        scripts: {
          taskPageCapture: {
            id: constants.ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID || "abakaAiTaskPageCapture",
            enabled: true,
              stage: "task21-inline-ai-analysis-debug",
              autoSelectSpecifyOnSameFontTrue: true,
              aiAnalysisMode: "two_stage",
              aiVisionModel: "qwen3.6-plus",
              aiOcrEnabled: false,
              aiOcrModel: "",
              aiReasoningModel: "qwen3.6-plus",
              aiSingleModel: "qwen3.6-plus",
              aiEnableThinking: false,
              aiRequestTimeoutMs: DEFAULT_AI_REQUEST_TIMEOUT_MS,
            shortcuts: {
              sameFontTrue: { key: "1" },
              sameFontFalse: { key: "2" },
              sameFontArtisticEffect: { key: "3" },
              imageBTextsRemovedSpecify: { key: "4" },
              otherChangesSpecify: { key: "5" },
              stashSave: { key: "6" },
              submitReview: { key: "7" },
              aiAnalyzeSameFont: { alt: true, key: "1" },
              aiAnalyzeImageBTextsRemoved: { alt: true, key: "2" },
              aiAnalyzeOtherChanges: { alt: true, key: "3" },
              aiAnalyzeOverall: { alt: true, key: "4" },
            },
          },
        },
      };

    if (!isPlainObject(settings.platforms)) {
      settings.platforms = {};
    }

    settings.platforms.abakaAi = deepMerge(defaultPlatform, settings.platforms.abakaAi || {});
    if (!isPlainObject(settings.platforms.abakaAi.scripts)) {
      settings.platforms.abakaAi.scripts = {};
    }

    const defaultScript = isPlainObject(defaultPlatform.scripts?.taskPageCapture)
      ? defaultPlatform.scripts.taskPageCapture
      : {};
    const currentScript = isPlainObject(settings.platforms.abakaAi.scripts.taskPageCapture)
      ? settings.platforms.abakaAi.scripts.taskPageCapture
      : {};
      const legacyAiDebugModel = normalizeAbakaAiModel(
        currentScript.aiDebugModel,
        defaultScript.aiSingleModel || "qwen3.6-plus"
      );
    settings.platforms.abakaAi.enabled = settings.platforms.abakaAi.enabled !== false;
    settings.platforms.abakaAi.scripts.taskPageCapture = Object.assign({}, defaultScript, currentScript, {
      id: constants.ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID || "abakaAiTaskPageCapture",
      enabled: currentScript.enabled !== false,
      stage: String(
        currentScript.stage || defaultScript.stage || "task21-inline-ai-analysis-debug"
      ),
      autoSelectSpecifyOnSameFontTrue:
        currentScript.autoSelectSpecifyOnSameFontTrue !== false,
      aiAnalysisMode: normalizeAbakaAiAnalysisMode(
        currentScript.aiAnalysisMode,
        defaultScript.aiAnalysisMode || "two_stage"
      ),
        aiVisionModel: normalizeAbakaAiModel(
          currentScript.aiVisionModel,
          defaultScript.aiVisionModel || "qwen3.6-plus",
          constants.ABAKA_AI_TASK21_VISION_MODEL_OPTIONS || []
        ),
        aiOcrEnabled:
          typeof currentScript.aiOcrEnabled === "boolean"
            ? currentScript.aiOcrEnabled === true
            : defaultScript.aiOcrEnabled === true,
        aiOcrModel: normalizeAbakaAiModel(
          currentScript.aiOcrModel,
          defaultScript.aiOcrModel || "",
          constants.ABAKA_AI_TASK21_OCR_MODEL_OPTIONS || []
        ),
        aiReasoningModel: normalizeAbakaAiModel(
          currentScript.aiReasoningModel,
          defaultScript.aiReasoningModel || "qwen3.6-plus",
          constants.ABAKA_AI_TASK21_REASONING_MODEL_OPTIONS || []
        ),
        aiSingleModel: normalizeAbakaAiModel(
          currentScript.aiSingleModel || legacyAiDebugModel,
          defaultScript.aiSingleModel || "qwen3.6-plus",
          constants.ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS || []
        ),
      aiEnableThinking: currentScript.aiEnableThinking === true,
      aiRequestTimeoutMs: normalizeAbakaAiRequestTimeout(
        currentScript.aiRequestTimeoutMs,
        defaultScript.aiRequestTimeoutMs || DEFAULT_AI_REQUEST_TIMEOUT_MS
      ),
      shortcuts: normalizeAbakaAiTask21Shortcuts(
        currentScript.shortcuts,
        defaultScript.shortcuts || {}
      ),
    });

    return settings.platforms.abakaAi;
  }

  function getProjectDefinitions(constants) {
    return isPlainObject(constants?.SCRIPT_PROJECTS) ? constants.SCRIPT_PROJECTS : {};
  }

  function normalizeProjectId(projectId, constants) {
    const definitions = getProjectDefinitions(constants);
    if (typeof projectId === "string" && hasOwn(definitions, projectId)) {
      return projectId;
    }

    return String(constants?.TRANSCRIPTION_PROJECT_ID || "transcription");
  }

  function pickAsrFields(source, allowedKeys) {
    const result = {};
    const input = isPlainObject(source) ? source : {};
    const keys = Array.isArray(allowedKeys) ? allowedKeys : [];

    keys.forEach(function (key) {
      if (hasOwn(input, key)) {
        result[key] = clone(input[key]);
      }
    });

    return result;
  }

  function sanitizeTranscriptionAsrConfig(config, fallback) {
    const defaults = isPlainObject(fallback) ? fallback : {};
    const next = deepMerge(defaults, isPlainObject(config) ? config : {});

    next.autoAssignCheckTasks = false;
    next.autoAssignTaskKeyword = "";
    next.autoAssignTargetUser = "";
    next.autoAssignBatchSize = 0;
    next.autoAssignAllTasks = false;
    next.autoAssignFetchAll = false;
    next.autoBatchSubmit = false;
    next.autoReceiveOnSubmit = false;
    next.validateBeforeSubmit = false;
    next.autoSubmitAfterValidation = false;
    next.qwenApiKey = "";
    next.useAdvancedRules = false;
    next.qwenModel = "";

    next.shortcutSubmit = null;
    next.shortcutFixPunctuationAll = null;
    next.shortcutToggleAutoBatchSubmit = null;
    next.shortcutToggleAutoSubmitAfterValidation = null;
    next.shortcutLeaderboard = null;
    next.shortcutAllValid = null;
    next.shortcutValidateItems = null;
    next.shortcutRemoveAllSpaces = null;

    next.resetRateValue = normalizeClampedNumber(next.resetRateValue, 1.5, 0.25, 8, 2);
    next.playbackRateValue = normalizeClampedNumber(
      hasOwn(next, "playbackRateValue") ? next.playbackRateValue : next.resetRateValue,
      next.resetRateValue,
      0.25,
      8,
      2
    );
    next.rateStepValue = normalizeClampedNumber(next.rateStepValue, 0.25, 0.05, 2, 2);
    next.seekStepSeconds = normalizeClampedNumber(next.seekStepSeconds, 0.5, 0.1, 10, 2);
    next.volumeValue = normalizeClampedNumber(next.volumeValue, 100, 0, 1000, 0);
    next.statsUploadEnabled = true;
    next.statsUploadTimes = normalizeTimeList(next.statsUploadTimes, ["10:00", "16:00"]);
    next.statsUploadJitterMinutes = Math.max(
      0,
      Math.min(120, normalizeNumber(next.statsUploadJitterMinutes, 10))
    );
    next.statsAutoUploadOnSchedule = true;
    next.statsUploadRequestTimeoutMs = Math.max(
      1000,
      Math.min(120000, normalizeNumber(next.statsUploadRequestTimeoutMs, 20000))
    );
    next.statsUploadEndpoint = (function () {
      const text = String(next.statsUploadEndpoint || "").trim();
      const constants = getConstants();
      const serverEndpoint =
        constants.TRANSCRIPTION_STATS_SERVER_ENDPOINT ||
        "https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload";
      const localEndpoint =
        constants.TRANSCRIPTION_STATS_LOCAL_ENDPOINT ||
        "http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload";
      if (!text) {
        return serverEndpoint;
      }
      if (text.indexOf("127.0.0.1:3333") >= 0 || text.indexOf("localhost:3333") >= 0) {
        return localEndpoint;
      }
      if (text.indexOf("/api/asr-transcription/statistics/upload") >= 0) {
        return text;
      }
      if (text.indexOf("/api/alibaba-labelx/asr-transcription/statistics/upload") >= 0) {
        return text;
      }
      return serverEndpoint;
    })();

    return next;
  }

  function ensureScriptCenter(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const platform = ensurePlatformRoot(settings);
    const defaultCenter = defaults?.platforms?.alibabaLabelx?.scriptCenter || {
      activeProjectId: constants.TRANSCRIPTION_PROJECT_ID || "transcription",
      projects: {},
    };
    const activeProjectId = normalizeProjectId(
      platform?.scriptCenter?.activeProjectId || defaultCenter.activeProjectId,
      constants
    );
    const definitions = getProjectDefinitions(constants);

    platform.scriptCenter = deepMerge(defaultCenter, platform.scriptCenter || {});
    platform.scriptCenter.activeProjectId = activeProjectId;

    if (!isPlainObject(platform.scriptCenter.projects)) {
      platform.scriptCenter.projects = {};
    }

    Object.keys(definitions).forEach(function (projectId) {
      const definition = definitions[projectId];
      const defaultProject = defaultCenter?.projects?.[projectId] || {};
      const nextProject = deepMerge(defaultProject, platform.scriptCenter.projects[projectId] || {});

      nextProject.id = definition.id;
      nextProject.label = definition.label;
      nextProject.shortLabel = definition.shortLabel;
      nextProject.description = definition.description;
      nextProject.note = definition.note;
      nextProject.capabilityScope = definition.capabilityScope;
      nextProject.active = projectId === activeProjectId;

      if (projectId === constants.JUDGEMENT_PROJECT_ID) {
        nextProject.asrConfig = normalizeJudgementAsrConfig(
          deepMerge(
            constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {},
            nextProject.asrConfig || {}
          )
        );
      } else {
        const fallbackAsrConfig =
          isPlainObject(nextProject.asrConfig) && Object.keys(nextProject.asrConfig).length > 0
            ? nextProject.asrConfig
            : settings.asr || {};
        nextProject.asrConfig = sanitizeTranscriptionAsrConfig(
          fallbackAsrConfig,
          constants.DEFAULT_ASR_CONFIG || {}
        );
      }

      platform.scriptCenter.projects[projectId] = nextProject;
    });

    return platform.scriptCenter;
  }

  function resolveProjectAsrConfig(settings, projectId) {
    const constants = getConstants();
    const scriptCenter = ensureScriptCenter(settings);
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    const projectConfig = scriptCenter?.projects?.[normalizedProjectId]?.asrConfig || {};
    const defaultProjectConfig =
      normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
        ? constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {}
        : constants.DEFAULT_ASR_CONFIG || {};

    const nextConfig = deepMerge(defaultProjectConfig, projectConfig);
    return normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
      ? normalizeJudgementAsrConfig(nextConfig)
      : sanitizeTranscriptionAsrConfig(nextConfig, constants.DEFAULT_ASR_CONFIG || {});
  }

  function syncProjectCenterFromActiveAsr(settings) {
    const constants = getConstants();
    const scriptCenter = ensureScriptCenter(settings);
    const activeProjectId = normalizeProjectId(scriptCenter.activeProjectId, constants);

    Object.keys(scriptCenter.projects || {}).forEach(function (projectId) {
      scriptCenter.projects[projectId].active = projectId === activeProjectId;
    });

    if (activeProjectId === constants.JUDGEMENT_PROJECT_ID) {
      scriptCenter.projects[activeProjectId].asrConfig = normalizeJudgementAsrConfig(
        deepMerge(
          constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {},
          pickAsrFields(settings.asr || {}, constants.JUDGEMENT_PROJECT_ASR_KEYS || [])
        )
      );
      return;
    }

    scriptCenter.projects[activeProjectId].asrConfig = sanitizeTranscriptionAsrConfig(
      settings.asr || {},
      constants.DEFAULT_ASR_CONFIG || {}
    );
  }

  function getPatchedActiveProjectId(patch) {
    const projectId = patch?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId;
    return typeof projectId === "string" ? projectId : null;
  }

  function syncNestedFromAsr(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultPlatform = defaults?.platforms?.alibabaLabelx || {};
    const defaultAsr = defaults?.asr || constants.DEFAULT_ASR_CONFIG || {};
    const platform = ensurePlatformRoot(settings);
    const asr = sanitizeTranscriptionAsrConfig(settings.asr || {}, defaultAsr);
    const debug = deepMerge(defaults.debug || { enabled: false }, settings.debug || {});

    platform.annotation = deepMerge(defaultPlatform.annotation || {}, platform.annotation || {});
    platform.automation = deepMerge(defaultPlatform.automation || {}, platform.automation || {});
    platform.aiPunctuation = deepMerge(
      defaultPlatform.aiPunctuation || {},
      platform.aiPunctuation || {}
    );
    platform.dictionary = deepMerge(defaultPlatform.dictionary || {}, platform.dictionary || {});
    platform.safety = deepMerge(defaultPlatform.safety || {}, platform.safety || {});
    platform.legacyServer = deepMerge(
      defaultPlatform.legacyServer || {},
      platform.legacyServer || {}
    );
    platform.reporting = deepMerge(defaultPlatform.reporting || {}, platform.reporting || {});

    platform.annotation.itemsPerPage = asr.itemsPerPage || platform.annotation.itemsPerPage;
    platform.annotation.autoPlay = asr.autoPlay === true;
    platform.annotation.defaultValid = asr.defaultValid === true;
    platform.annotation.fillOnValid = asr.fillOnValid !== false;
    platform.annotation.clearOnInvalid = asr.clearOnInvalid !== false;
    platform.annotation.autoNext = asr.autoNext === true;
    platform.annotation.autoResetRate = asr.autoResetRate === true;
    platform.annotation.resetRateValue = normalizeNumber(asr.resetRateValue, 1.5);
    platform.annotation.playbackRateValue = normalizeNumber(
      hasOwn(asr, "playbackRateValue") ? asr.playbackRateValue : asr.resetRateValue,
      platform.annotation.resetRateValue || 1.5
    );
    platform.annotation.rateStepValue = normalizeNumber(asr.rateStepValue, 0.25);
    platform.annotation.seekStepSeconds = normalizeNumber(asr.seekStepSeconds, 0.5);
    platform.annotation.volumeValue = normalizeNumber(asr.volumeValue, 100);
    platform.annotation.autoClearInvalidValidation = asr.autoClearInvalidValidation === true;
    platform.annotation.autoFillOnValidValidation = asr.autoFillOnValidValidation === true;
    platform.annotation.autoFillOnLoad = asr.autoFillOnLoad === true;
    platform.annotation.numConvertMode =
      asr.numConvertMode === "蜂鸟众包" ? "蜂鸟众包" : "千问";
    platform.annotation.customReplacements = normalizeReplacementRules(
      asr.customReplacements || platform.annotation.customReplacements
    );
    platform.annotation.customRates = normalizeCustomRates(
      asr.customRates,
      defaultPlatform.annotation?.customRates || []
    );

    const defaultShortcuts = defaultPlatform.annotation?.shortcuts || {};
    const compatibilityMap = constants.SHORTCUT_COMPATIBILITY_MAP || {};
    platform.annotation.shortcuts = deepMerge(defaultShortcuts, platform.annotation.shortcuts || {});
    Object.keys(compatibilityMap).forEach(function (shortcutKey) {
      const asrKey = compatibilityMap[shortcutKey];
      platform.annotation.shortcuts[shortcutKey] = normalizeShortcut(
        asr[asrKey],
        platform.annotation.shortcuts[shortcutKey]
      );
    });
    delete platform.annotation.shortcuts.markAllValidFill;
    delete platform.annotation.shortcuts.validatePage;
    delete platform.annotation.shortcuts.removeAllSpaces;

    platform.automation.autoAssignCheckTasks = false;
    platform.automation.autoAssignTaskKeyword = "";
    platform.automation.autoAssignTargetUser = "";
    platform.automation.autoAssignBatchSize = 0;
    platform.automation.autoAssignAllTasks = false;
    platform.automation.autoAssignFetchAll = false;
    platform.automation.autoAssignPollIntervalMs = Math.max(
      5000,
      normalizeNumber(asr.autoAssignPollIntervalMs, platform.automation.autoAssignPollIntervalMs || 60000)
    );
    platform.automation.autoBatchSubmit = false;
    platform.automation.autoFillOnLoad = asr.autoFillOnLoad === true;
    platform.automation.validateBeforeSubmit = false;
    platform.automation.autoSubmitAfterValidation = false;
    platform.automation.autoReceiveOnSubmit = false;
    platform.automation.autoNavigateNextTask = false;
    platform.automation.autoPlay = asr.autoPlay === true;
    platform.automation.autoNext = asr.autoNext === true;
    platform.automation.defaultValid = asr.defaultValid === true;

    platform.aiPunctuation.apiKey = "";
    platform.aiPunctuation.useAdvancedRules = false;
    platform.aiPunctuation.model = "";

    platform.dictionary.customReplacements = normalizeReplacementRules(
      asr.customReplacements || platform.dictionary.customReplacements
    );
    platform.reporting.itemsPerPage = asr.itemsPerPage || platform.reporting.itemsPerPage;
    if (platform.reporting.exportUploadEnabled !== false) {
      platform.reporting.exportUploadEnabled = true;
    }

    platform.legacyServer.useDebugApiBaseUrl = debug.enabled === true;
    settings.debug = debug;
  }

  function syncCompatibilityFromNested(settings) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const defaultAsr = defaults?.asr || constants.DEFAULT_ASR_CONFIG || {};
    const platform = ensurePlatformRoot(settings);
    const annotation = platform.annotation || {};
    const automation = platform.automation || {};
    const aiPunctuation = platform.aiPunctuation || platform.ai || {};
    const dictionary = platform.dictionary || {};
    const legacyServer = platform.legacyServer || {};
    const reporting = platform.reporting || {};
    const compatibilityMap = constants.SHORTCUT_COMPATIBILITY_MAP || {};
    const nextAsr = sanitizeTranscriptionAsrConfig(settings.asr || {}, defaultAsr);

    nextAsr.itemsPerPage = reporting.itemsPerPage || annotation.itemsPerPage || nextAsr.itemsPerPage;
    nextAsr.autoPlay = annotation.autoPlay === true || automation.autoPlay === true;
    nextAsr.defaultValid =
      annotation.defaultValid === true || automation.defaultValid === true;
    nextAsr.fillOnValid = annotation.fillOnValid !== false;
    nextAsr.clearOnInvalid = annotation.clearOnInvalid !== false;
    nextAsr.autoNext = annotation.autoNext === true || automation.autoNext === true;
    nextAsr.autoAssignCheckTasks = false;
    nextAsr.autoAssignTaskKeyword = "";
    nextAsr.autoAssignTargetUser = "";
    nextAsr.autoAssignBatchSize = 0;
    nextAsr.autoAssignAllTasks = false;
    nextAsr.autoAssignFetchAll = false;
    nextAsr.autoAssignPollIntervalMs = 60000;
    nextAsr.autoBatchSubmit = false;
    nextAsr.autoResetRate = annotation.autoResetRate === true;
    nextAsr.resetRateValue = normalizeNumber(annotation.resetRateValue, 1.5);
    nextAsr.playbackRateValue = normalizeNumber(
      annotation.playbackRateValue,
      nextAsr.resetRateValue
    );
    nextAsr.rateStepValue = normalizeNumber(annotation.rateStepValue, 0.25);
    nextAsr.seekStepSeconds = normalizeNumber(annotation.seekStepSeconds, 0.5);
    nextAsr.volumeValue = normalizeNumber(annotation.volumeValue, 100);
    nextAsr.autoReceiveOnSubmit = false;
    nextAsr.validateBeforeSubmit = false;
    nextAsr.autoClearInvalidValidation = annotation.autoClearInvalidValidation === true;
    nextAsr.autoFillOnValidValidation = annotation.autoFillOnValidValidation === true;
    nextAsr.autoSubmitAfterValidation = false;
    nextAsr.autoFillOnLoad =
      annotation.autoFillOnLoad === true || automation.autoFillOnLoad === true;
    nextAsr.qwenApiKey = "";
    nextAsr.useAdvancedRules = false;
    nextAsr.qwenModel = "";
    nextAsr.numConvertMode =
      annotation.numConvertMode === "蜂鸟众包" ? "蜂鸟众包" : "千问";
    nextAsr.customReplacements = normalizeReplacementRules(
      dictionary.customReplacements || annotation.customReplacements
    );
    nextAsr.customRates = normalizeCustomRates(
      annotation.customRates,
      defaults?.platforms?.alibabaLabelx?.annotation?.customRates || []
    );

    Object.keys(compatibilityMap).forEach(function (shortcutKey) {
      const asrKey = compatibilityMap[shortcutKey];
      nextAsr[asrKey] = normalizeShortcut(
        annotation.shortcuts?.[shortcutKey],
        nextAsr[asrKey]
      );
    });
    if (isPlainObject(annotation.shortcuts)) {
      delete annotation.shortcuts.markAllValidFill;
      delete annotation.shortcuts.validatePage;
      delete annotation.shortcuts.removeAllSpaces;
    }

    settings.asr = sanitizeTranscriptionAsrConfig(nextAsr, defaultAsr);
    settings.debug = deepMerge(defaults.debug || {}, settings.debug || {});
    settings.debug.enabled = legacyServer.useDebugApiBaseUrl === true;
    settings.cache = deepMerge(defaults.cache || {}, settings.cache || {});
    settings.meta = deepMerge(defaults.meta || {}, settings.meta || {});
  }

  function normalizeSettings(input) {
    const constants = getConstants();
    const defaults = clone(constants.DEFAULT_SETTINGS || {});
    const settings = deepMerge(defaults, input || {});
    const currentSchemaVersion = Number(input?.meta?.schemaVersion || 0);

    ensureScriptCenter(settings);
    ensureLightwheelRoot(settings);
    ensureDataBakerRoot(settings);
    ensureAbakaAiRoot(settings);
    ensureGlobalBackendEndpointMode(settings, input || {}, defaults);

    const activeProjectId =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId ||
      constants.TRANSCRIPTION_PROJECT_ID ||
      "transcription";
    const storedJudgementConfig =
      input?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[
        constants.JUDGEMENT_PROJECT_ID
      ]?.asrConfig || {};
    if (
      activeProjectId === constants.JUDGEMENT_PROJECT_ID &&
      !hasOwn(storedJudgementConfig, "itemsPerPage")
    ) {
      settings.asr = isPlainObject(settings.asr) ? settings.asr : {};
      settings.asr.itemsPerPage =
        constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.itemsPerPage || "50 条/页";
    }

    if (currentSchemaVersion < 12) {
      const judgementProject =
        settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[constants.JUDGEMENT_PROJECT_ID] || null;
      const judgementConfigsToPatch = [];
      if (judgementProject && isPlainObject(judgementProject.asrConfig)) {
        judgementConfigsToPatch.push(judgementProject.asrConfig);
      }
      if (activeProjectId === constants.JUDGEMENT_PROJECT_ID && isPlainObject(settings.asr)) {
        judgementConfigsToPatch.push(settings.asr);
      }

      judgementConfigsToPatch.forEach(function (asrConfig) {
        if (!hasOwn(asrConfig, "compactCardEnabled")) {
          asrConfig.compactCardEnabled =
            constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.compactCardEnabled !== false;
        }

        if (!isPlainObject(asrConfig.shortcuts)) {
          asrConfig.shortcuts = {};
        }

        ["volumeUp", "volumeDown", "volumeReset"].forEach(function (shortcutKey) {
          if (
            !hasOwn(asrConfig.shortcuts, shortcutKey) ||
            asrConfig.shortcuts[shortcutKey] === null
          ) {
            asrConfig.shortcuts[shortcutKey] = clone(
              constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.shortcuts?.[shortcutKey] || null
            );
          }
        });
      });
    }

    if (currentSchemaVersion < 13) {
      const judgementProject =
        settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[constants.JUDGEMENT_PROJECT_ID] || null;
      const judgementConfigsToPatch = [];
      if (judgementProject && isPlainObject(judgementProject.asrConfig)) {
        judgementConfigsToPatch.push(judgementProject.asrConfig);
      }
      if (activeProjectId === constants.JUDGEMENT_PROJECT_ID && isPlainObject(settings.asr)) {
        judgementConfigsToPatch.push(settings.asr);
      }

      judgementConfigsToPatch.forEach(function (asrConfig) {
        asrConfig.asrDiffColors = normalizeJudgementAsrDiffColors(asrConfig.asrDiffColors);
      });
    }

    if (currentSchemaVersion < 6) {
      const judgementProject =
        settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[constants.JUDGEMENT_PROJECT_ID] || null;
      if (judgementProject && isPlainObject(judgementProject.asrConfig)) {
        if (!isPlainObject(judgementProject.asrConfig.shortcuts)) {
          judgementProject.asrConfig.shortcuts = {};
        }

        [
          "choiceFirstBetter",
          "choiceSecondBetter",
          "choiceBothBad",
          "choiceUnsure",
          "choiceOtherDialect",
          "playPause",
        ].forEach(function (shortcutKey) {
          if (
            !hasOwn(judgementProject.asrConfig.shortcuts, shortcutKey) ||
            judgementProject.asrConfig.shortcuts[shortcutKey] === null
          ) {
            judgementProject.asrConfig.shortcuts[shortcutKey] = clone(
              constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.shortcuts?.[shortcutKey] || null
            );
          }
        });
      }
    }

    syncNestedFromAsr(settings);
    syncCompatibilityFromNested(settings);
    syncProjectCenterFromActiveAsr(settings);
    settings.stage = defaults.stage || settings.stage || "mv3-legacy-migration";
    settings.meta = deepMerge(defaults.meta || {}, settings.meta || {});
    settings.meta.backendEndpointMode = normalizeBackendEndpointMode(
      settings.meta.backendEndpointMode,
      defaults?.meta?.backendEndpointMode || "server"
    );
    settings.meta.schemaVersion = constants.SCHEMA_VERSION || 7;
    return settings;
  }

  async function getSettings() {
    const stored = await getStoredValue();
    return normalizeSettings(stored);
  }

  async function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    await setStoredValue(normalized);
    return normalized;
  }

  async function patchSettings(patch) {
    const current = await getSettings();
    const next = deepMerge(current, patch || {});
    const constants = getConstants();
    const patchedProjectId = getPatchedActiveProjectId(patch);

    if (patchedProjectId && !isPlainObject(patch?.asr)) {
      next.asr = resolveProjectAsrConfig(next, normalizeProjectId(patchedProjectId, constants));
    }

    return saveSettings(next);
  }

  async function isPlatformEnabled(platformId) {
    const settings = await getSettings();
    return Boolean(settings.platforms?.[platformId || "alibabaLabelx"]?.enabled);
  }

  async function setDebugMode(enabled) {
    const nextSettings = await patchSettings({
      debug: {
        enabled: enabled === true,
        lastToggledAt: new Date().toISOString(),
      },
      platforms: {
        alibabaLabelx: {
          legacyServer: {
            useDebugApiBaseUrl: enabled === true,
          },
        },
      },
    });

    return clone(nextSettings.debug);
  }

  async function clearRuntimeCache() {
    const constants = getConstants();
    const nextSettings = await patchSettings({
      cache: clone(constants.DEFAULT_SETTINGS?.cache || {}),
    });
    return clone(nextSettings.cache);
  }

  async function resetSettings(options) {
    const constants = getConstants();
    const preservePlatformEnabled = options?.preservePlatformEnabled === true;
    const current = preservePlatformEnabled ? await getSettings() : null;
    const nextSettings = clone(constants.DEFAULT_SETTINGS || {});

    if (preservePlatformEnabled && current?.platforms?.alibabaLabelx) {
      nextSettings.platforms.alibabaLabelx.enabled = Boolean(
        current.platforms.alibabaLabelx.enabled
      );
    }

    if (preservePlatformEnabled && current?.platforms?.lightwheel) {
      nextSettings.platforms.lightwheel.enabled = Boolean(current.platforms.lightwheel.enabled);
      nextSettings.platforms.lightwheel.scripts = clone(current.platforms.lightwheel.scripts || {});
    }

    if (preservePlatformEnabled && current?.platforms?.dataBaker) {
      nextSettings.platforms.dataBaker.enabled = Boolean(current.platforms.dataBaker.enabled);
      nextSettings.platforms.dataBaker.scripts = clone(current.platforms.dataBaker.scripts || {});
    }

    if (preservePlatformEnabled && current?.platforms?.abakaAi) {
      nextSettings.platforms.abakaAi.enabled = Boolean(current.platforms.abakaAi.enabled);
      nextSettings.platforms.abakaAi.scripts = clone(current.platforms.abakaAi.scripts || {});
    }

    return saveSettings(nextSettings);
  }

  async function setActiveProject(projectId) {
    const constants = getConstants();
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    return patchSettings({
      platforms: {
        alibabaLabelx: {
          scriptCenter: {
            activeProjectId: normalizedProjectId,
          },
        },
      },
    });
  }

  async function saveProjectSettings(projectId, patch) {
    const constants = getConstants();
    const normalizedProjectId = normalizeProjectId(projectId, constants);
    const current = await getSettings();
    const next = clone(current);
    const platform = ensurePlatformRoot(next);
    const scriptCenter = ensureScriptCenter(next);
    const targetProject = scriptCenter.projects[normalizedProjectId];
    const currentProjectConfig = targetProject?.asrConfig || {};
    const projectPatch = isPlainObject(patch) ? patch : {};
    const defaultProjectConfig =
      normalizedProjectId === constants.JUDGEMENT_PROJECT_ID
        ? constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {}
        : constants.DEFAULT_ASR_CONFIG || {};

    targetProject.asrConfig = deepMerge(
      deepMerge(defaultProjectConfig, currentProjectConfig),
      projectPatch
    );
    if (normalizedProjectId === constants.JUDGEMENT_PROJECT_ID) {
      targetProject.asrConfig = normalizeJudgementAsrConfig(targetProject.asrConfig);
    } else {
      targetProject.asrConfig = sanitizeTranscriptionAsrConfig(
        targetProject.asrConfig,
        constants.DEFAULT_ASR_CONFIG || {}
      );
    }

    if (scriptCenter.activeProjectId === normalizedProjectId) {
      next.asr = resolveProjectAsrConfig(next, normalizedProjectId);
    }

    return saveSettings(next);
  }

  async function setScriptEnabled(scriptId, enabled) {
    const constants = getConstants();
    const nextEnabled = enabled === true;

    if (
      scriptId === constants.TRANSCRIPTION_PROJECT_ID ||
      scriptId === constants.JUDGEMENT_PROJECT_ID
    ) {
      return patchSettings({
        platforms: {
          alibabaLabelx: {
            enabled: nextEnabled,
            scriptCenter: {
              activeProjectId: scriptId,
            },
          },
        },
      });
    }

    if (scriptId === constants.LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID) {
      return patchSettings({
        platforms: {
          lightwheel: {
            enabled: nextEnabled,
            scripts: {
              viewPanel: {
                enabled: nextEnabled,
              },
            },
          },
        },
      });
    }

    if (scriptId === constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID) {
      return patchSettings({
        platforms: {
          dataBaker: {
            enabled: nextEnabled,
            scripts: {
              roundOneQuality: {
                id:
                  constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID ||
                  "dataBakerRoundOneQuality",
                enabled: nextEnabled,
              },
            },
          },
        },
      });
    }

    if (scriptId === constants.ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID) {
      return patchSettings({
        platforms: {
          abakaAi: {
            enabled: nextEnabled,
            scripts: {
              taskPageCapture: {
                id:
                  constants.ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID ||
                  "abakaAiTaskPageCapture",
                enabled: nextEnabled,
                stage: "task21-inline-ai-analysis-debug",
              },
            },
          },
        },
      });
    }

    return getSettings();
  }

  globalThis.ASREdgeStorage = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    patchSettings: patchSettings,
    isPlatformEnabled: isPlatformEnabled,
    setDebugMode: setDebugMode,
    clearRuntimeCache: clearRuntimeCache,
    resetSettings: resetSettings,
    setActiveProject: setActiveProject,
    saveProjectSettings: saveProjectSettings,
    setScriptEnabled: setScriptEnabled,
    EXTENSION_CONTEXT_INVALIDATED_CODE: EXTENSION_CONTEXT_INVALIDATED_CODE,
    isExtensionContextInvalidatedError: isExtensionContextInvalidatedError,
    isChromeExtensionContextAvailable: isChromeExtensionContextAvailable,
  };
})();
