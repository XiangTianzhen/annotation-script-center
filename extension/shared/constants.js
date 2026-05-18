/**
 * @fileoverview Shared settings schema, defaults, and compatibility constants.
 */

(function () {
  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function createShortcut(key, extra) {
    return Object.assign(
      {
        ctrl: false,
        alt: false,
        shift: false,
        meta: false,
        key: key || null,
        button: null,
      },
      extra || {}
    );
  }

  const EXTENSION_NAME = "标注脚本中心";
  const STAGE_ID = "labelx-script-center";
  const STAGE_LABEL = "脚本中心";
  const SCHEMA_VERSION = 20;
  const ALIBABA_LABELX_PLATFORM_ID = "alibabaLabelx";
  const LIGHTWHEEL_PLATFORM_ID = "lightwheel";
  const DATA_BAKER_PLATFORM_ID = "dataBaker";
  const MAGIC_DATA_PLATFORM_ID = "magicData";
  const ABAKA_AI_PLATFORM_ID = "abakaAi";
  const TRANSCRIPTION_PROJECT_ID = "transcription";
  const JUDGEMENT_PROJECT_ID = "judgement";
  const LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID = "lightwheelViewPanel";
  const DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID = "dataBakerRoundOneQuality";
  const MAGIC_DATA_ANNOTATOR_SCRIPT_ID = "magicDataAnnotatorAiReview";
  const ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID = "abakaAiTaskPageCapture";
  const BACKEND_ENDPOINT_MODE_SERVER = "server";
  const BACKEND_ENDPOINT_MODE_LOCAL = "local";
  const BACKEND_ENDPOINTS = {
    server: "https://script.xiangtianzhen.store",
    local: "http://127.0.0.1:3333",
  };
  const DATABAKER_AI_RECOMMEND_PATH = "/api/data-baker/round-one-quality/ai/recommend";
  const DATABAKER_EXPORT_UPLOAD_PATH = "/api/data-baker/round-one-quality/export/upload";
  const DATABAKER_EXPORT_DOWNLOAD_PATH = "/api/data-baker/round-one-quality/export/download";
  const JUDGEMENT_STATS_UPLOAD_PATH = "/api/alibaba-labelx/asr-judgement/statistics/upload";
  const JUDGEMENT_STATS_DOWNLOAD_PATH = "/api/alibaba-labelx/asr-judgement/statistics/download";
  const JUDGEMENT_AI_SUGGEST_PATH = "/api/alibaba-labelx/asr-judgement/ai/suggest";
  const TRANSCRIPTION_AI_SUGGEST_CURRENT_PATH =
    "/api/alibaba-labelx/asr-transcription/ai/suggest-current";
  const TRANSCRIPTION_STATS_UPLOAD_PATH = "/api/alibaba-labelx/asr-transcription/statistics/upload";
  const TRANSCRIPTION_STATS_DOWNLOAD_PATH =
    "/api/alibaba-labelx/asr-transcription/statistics/download";
  const PROJECT_DATA_DOWNLOAD_OPTIONS_PATH = "/api/admin/project-data-download/options";
  const PROJECT_DATA_DOWNLOAD_REQUEST_PATH = "/api/admin/project-data-download/request";
  const PROJECT_DATA_DOWNLOAD_FILE_PATH = "/api/admin/project-data-download/file";
  const DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + DATABAKER_AI_RECOMMEND_PATH;
  const DATABAKER_AI_RECOMMEND_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + DATABAKER_AI_RECOMMEND_PATH;
  const DATABAKER_EXPORT_UPLOAD_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + DATABAKER_EXPORT_UPLOAD_PATH;
  const DATABAKER_EXPORT_UPLOAD_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + DATABAKER_EXPORT_UPLOAD_PATH;
  const DATABAKER_EXPORT_DOWNLOAD_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + DATABAKER_EXPORT_DOWNLOAD_PATH;
  const DATABAKER_EXPORT_DOWNLOAD_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + DATABAKER_EXPORT_DOWNLOAD_PATH;
  const TRANSCRIPTION_STATS_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + TRANSCRIPTION_STATS_UPLOAD_PATH;
  const TRANSCRIPTION_STATS_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + TRANSCRIPTION_STATS_UPLOAD_PATH;
  const JUDGEMENT_STATS_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + JUDGEMENT_STATS_UPLOAD_PATH;
  const JUDGEMENT_STATS_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + JUDGEMENT_STATS_UPLOAD_PATH;
  const JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + JUDGEMENT_AI_SUGGEST_PATH;
  const JUDGEMENT_AI_SUGGEST_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + JUDGEMENT_AI_SUGGEST_PATH;
  const TRANSCRIPTION_AI_SUGGEST_CURRENT_SERVER_ENDPOINT =
    BACKEND_ENDPOINTS.server + TRANSCRIPTION_AI_SUGGEST_CURRENT_PATH;
  const TRANSCRIPTION_AI_SUGGEST_CURRENT_LOCAL_ENDPOINT =
    BACKEND_ENDPOINTS.local + TRANSCRIPTION_AI_SUGGEST_CURRENT_PATH;
  const DATABAKER_PAGE_SIZE_OPTIONS = ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"];
  const DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS = [
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
  ];
  const ABAKA_AI_TASK21_SHORTCUT_ACTIONS = [
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
  ];
  const BAILIAN_DOC_URLS = {
    helpVision:
      "https://help.aliyun.com/zh/model-studio/vision?spm=a2c4g.11186623.help-menu-2400256.d_0_3_1_0.34b2141cE5YHDK",
    visionUnderstanding:
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3026912",
    imageVideoUnderstanding:
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2845871",
    ocr:
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2860683",
    visualReasoning:
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2877996",
    modelList:
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market/all",
  };
  const ABAKA_AI_TASK21_AI_ANALYSIS_MODES = [
    { value: "two_stage", label: "双模型方案（默认）" },
    { value: "single_model", label: "单模型方案" },
  ];
  const ABAKA_AI_TASK21_VISION_MODEL_OPTIONS = [
    {
      value: "qwen3.6-plus",
      label: "qwen3.6-plus",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.6-flash",
      label: "qwen3.6-flash",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3-vl-plus",
      label: "qwen3-vl-plus",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3-vl-flash",
      label: "qwen3-vl-flash",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-plus",
      label: "qwen3.5-plus",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-flash",
      label: "qwen3.5-flash",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen-vl-max",
      label: "qwen-vl-max",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen-vl-plus",
      label: "qwen-vl-plus",
      role: "vision",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
  ];
  const ABAKA_AI_TASK21_OCR_MODEL_OPTIONS = [];
  const ABAKA_AI_TASK21_REASONING_MODEL_OPTIONS = [
    {
      value: "qwen3.6-plus",
      label: "qwen3.6-plus",
      role: "reasoning",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.6-flash",
      label: "qwen3.6-flash",
      role: "reasoning",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-plus",
      label: "qwen3.5-plus",
      role: "reasoning",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-flash",
      label: "qwen3.5-flash",
      role: "reasoning",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
  ];
  const ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS = [
    {
      value: "qwen3.6-plus",
      label: "qwen3.6-plus",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.6-flash",
      label: "qwen3.6-flash",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3-vl-plus",
      label: "qwen3-vl-plus",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3-vl-flash",
      label: "qwen3-vl-flash",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-plus",
      label: "qwen3.5-plus",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen3.5-flash",
      label: "qwen3.5-flash",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: true,
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen-vl-max",
      label: "qwen-vl-max",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
    {
      value: "qwen-vl-plus",
      label: "qwen-vl-plus",
      role: "single",
      callMode: "openai-compatible-chat",
      supportsVision: true,
      supportsOcr: false,
      supportsThinking: "unknown",
      supportsJsonObject: true,
      docUrl: BAILIAN_DOC_URLS.helpVision,
    },
  ];
  const ABAKA_AI_TASK21_AI_MODEL_OPTIONS = clone(ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS);

  const MESSAGE_TYPES = {
    PANEL_PING: "ASR_EDGE_SETTINGS_PANEL_PING",
    JUDGEMENT_STATS_UPLOAD: "ASR_EDGE_JUDGEMENT_STATS_UPLOAD",
  };

  function normalizeBackendEndpointMode(value, fallback) {
    const fallbackMode =
      fallback === BACKEND_ENDPOINT_MODE_LOCAL
        ? BACKEND_ENDPOINT_MODE_LOCAL
        : BACKEND_ENDPOINT_MODE_SERVER;
    const text = String(value || "").trim().toLowerCase();
    if (text === BACKEND_ENDPOINT_MODE_LOCAL || text === "localhost" || text === "127.0.0.1") {
      return BACKEND_ENDPOINT_MODE_LOCAL;
    }
    if (text === BACKEND_ENDPOINT_MODE_SERVER) {
      return BACKEND_ENDPOINT_MODE_SERVER;
    }
    return fallbackMode;
  }

  function inferBackendEndpointModeFromEndpoint(value, fallback) {
    const fallbackMode = normalizeBackendEndpointMode(fallback, BACKEND_ENDPOINT_MODE_SERVER);
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
      return fallbackMode;
    }
    if (text.indexOf("127.0.0.1") >= 0 || text.indexOf("localhost") >= 0) {
      return BACKEND_ENDPOINT_MODE_LOCAL;
    }
    if (text.indexOf("script.xiangtianzhen.store") >= 0 || text.indexOf("http://") >= 0 || text.indexOf("https://") >= 0) {
      return BACKEND_ENDPOINT_MODE_SERVER;
    }
    return fallbackMode;
  }

  function getBackendEndpointModeFromSettings(settings) {
    const mode =
      settings?.meta?.backendEndpointMode ||
      settings?.backend?.endpointMode ||
      settings?.backendEndpointMode;
    return normalizeBackendEndpointMode(mode, BACKEND_ENDPOINT_MODE_SERVER);
  }

  function getBackendBaseUrlByMode(mode) {
    const normalizedMode = normalizeBackendEndpointMode(mode, BACKEND_ENDPOINT_MODE_SERVER);
    return normalizedMode === BACKEND_ENDPOINT_MODE_LOCAL
      ? BACKEND_ENDPOINTS.local
      : BACKEND_ENDPOINTS.server;
  }

  function getBackendBaseUrlFromSettings(settings) {
    return getBackendBaseUrlByMode(getBackendEndpointModeFromSettings(settings));
  }

  function buildBackendUrl(path, settingsOrMode) {
    const text = String(path || "").trim();
    if (!text) {
      return "";
    }
    if (/^https?:\/\//i.test(text)) {
      return text;
    }
    const mode =
      typeof settingsOrMode === "string"
        ? settingsOrMode
        : getBackendEndpointModeFromSettings(settingsOrMode || {});
    const baseUrl = getBackendBaseUrlByMode(mode).replace(/\/+$/, "");
    const normalizedPath = text.charAt(0) === "/" ? text : "/" + text;
    return baseUrl + normalizedPath;
  }

  const TARGET_PLATFORM = {
    id: "alibaba-labelx",
    label: "Alibaba LabelX",
    host: "labelx.alibaba-inc.com",
    matches: ["https://labelx.alibaba-inc.com/*"],
  };

  const LIGHTWHEEL_PLATFORM = {
    id: "lightwheel",
    label: "Lightwheel",
    host: "label-cloud.lightwheel.net",
    matches: ["https://label-cloud.lightwheel.net/*"],
  };

  const DATA_BAKER_PLATFORM = {
    id: "data-baker",
    label: "标贝易采",
    host: "datafactory.data-baker.com",
    matches: ["https://datafactory.data-baker.com/*"],
  };

  const MAGIC_DATA_PLATFORM = {
    id: "magic-data",
    label: "Magic Data ANNOTATOR",
    host: "work.magicdatatech.com",
    matches: ["https://work.magicdatatech.com/*"],
  };

  const ABAKA_AI_PLATFORM = {
    id: "abaka-ai",
    label: "Abaka AI",
    host: "abao.fortidyndns.com",
    matches: ["http://abao.fortidyndns.com:30473/*"],
  };

  const PAGE_OPTIONS = [
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
  ];

  const AI_MODEL_OPTIONS = [
    { value: "qwen3.5-flash", label: "Qwen3.5-Flash (默认)" },
    { value: "qwen3.6-plus", label: "Qwen3.6-Plus" },
    { value: "siliconflow/deepseek-v3.2", label: "DeepSeek-V3.2" },
    { value: "glm-5", label: "GLM-5" },
    { value: "kimi/kimi-k2.5", label: "Kimi-K2.5" },
  ];

  const JUDGEMENT_AI_LISTEN_MODELS = [
    "qwen3.5-omni-flash",
    "qwen3-omni-flash",
    "qwen3.5-omni-plus",
  ];
  const JUDGEMENT_AI_COMPARE_MODELS = ["qwen3.5-plus", "qwen-plus", "qwen-turbo"];
  const JUDGEMENT_AI_AVAILABLE_MODELS = clone(JUDGEMENT_AI_COMPARE_MODELS);
  const JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS = [
    {
      key: "aiSuggestionTemperature",
      apiKey: "temperature",
      label: "temperature",
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      placeholder: "留空使用后端默认",
      help: "控制输出随机性，建议 0~0.5。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionTopP",
      apiKey: "top_p",
      label: "top_p",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      placeholder: "留空使用后端默认",
      help: "核采样阈值，通常与 temperature 二选一微调。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionMaxTokens",
      apiKey: "max_tokens",
      label: "max_tokens",
      type: "int",
      min: 1,
      max: 8192,
      step: 1,
      placeholder: "留空使用后端默认",
      help: "最大生成 token 数（兼容字段）。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionMaxCompletionTokens",
      apiKey: "max_completion_tokens",
      label: "max_completion_tokens",
      type: "int",
      min: 1,
      max: 8192,
      step: 1,
      placeholder: "留空使用后端默认",
      help: "最大 completion token 数（新字段）。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionPresencePenalty",
      apiKey: "presence_penalty",
      label: "presence_penalty",
      type: "number",
      min: -2,
      max: 2,
      step: 0.1,
      placeholder: "留空使用后端默认",
      help: "主题多样性惩罚。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionFrequencyPenalty",
      apiKey: "frequency_penalty",
      label: "frequency_penalty",
      type: "number",
      min: -2,
      max: 2,
      step: 0.1,
      placeholder: "留空使用后端默认",
      help: "重复频率惩罚。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionSeed",
      apiKey: "seed",
      label: "seed",
      type: "int",
      min: 0,
      max: 2147483647,
      step: 1,
      placeholder: "留空不发送",
      help: "固定随机种子，便于复现。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionResponseFormat",
      apiKey: "response_format",
      label: "response_format",
      type: "enum",
      options: ["json_object", "text"],
      help: "快判默认建议 json_object。",
      supported: false,
      target: "both",
    },
    {
      key: "aiSuggestionStopSequences",
      apiKey: "stop",
      label: "stop sequences",
      type: "multiline",
      placeholder: "每行一个 stop 序列",
      help: "最多 8 行，每行最多 80 字。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionEnableThinking",
      apiKey: "enable_thinking",
      label: "enable thinking / reasoning",
      type: "boolean",
      help:
        "关闭会显式传 enable_thinking=false，开启会显式传 enable_thinking=true；模型不支持时后端仅移除该参数重试一次。",
      supported: true,
      target: "both",
    },
    {
      key: "aiSuggestionReasoningEffort",
      apiKey: "reasoning_effort",
      label: "reasoningEffort",
      type: "enum",
      options: ["low", "medium", "high"],
      help: "当前快判链路暂不支持。",
      supported: false,
      target: "both",
    },
  ];

  const DEFAULT_CUSTOM_REPLACEMENTS = [
    { from: "小二,小恶,小乐,小额", to: "小饿" },
    { from: "小二小二,小额小额,小恶小恶", to: "小饿小饿" },
    { from: "批掉,劈掉", to: "p" },
    { from: "饿了吗,二了,饿了么？,饿了吧,饿了马", to: "饿了么" },
    { from: "淘宝选购,淘宝上购,淘宝返购", to: "淘宝闪购" },
    {
      from:
        "千份,千分,千万,先问,前问,前文,亲们,请吻,千吻,前吻,qw,家人们,千温,天问,钱问,钱文,千文,千味,田伟,田问,田文,亲我,前卫,钱伟,千闷,千梦",
      to: "千问",
    },
    { from: "请问请问,千万千万", to: "千问千问" },
    { from: "临时有名", to: "零食有鸣" },
    { from: "物探", to: "木炭" },
    { from: "河马", to: "盒马" },
    { from: "飞驰人生三,奔驰人生三,飞驰三,真实人生三", to: "《飞驰人生3》" },
    { from: "飞驰人生", to: "《飞驰人生》" },
    { from: "坦斯丁,塔斯丁", to: "塔斯汀" },
    { from: "博雅绝学,伯牙绝学", to: "伯牙绝弦" },
    { from: "VIVO", to: "vivo" },
    { from: "瑞星,瑞信", to: "瑞幸" },
    { from: "惊蛰无声", to: "《惊蛰无声》" },
    { from: "龙江猪脚饭", to: "隆江猪脚饭" },
    { from: "雨雨涵,余雨涵,雨余涵,俞宇航", to: "余宇涵" },
    { from: "李若陶", to: "李若桃" },
    { from: "风跑", to: "蜂跑" },
    { from: "一键到电,确认到电", to: "一键到店" },
    { from: "全部都电", to: "全部到店" },
    { from: "确认照片,确认到点,确认到地", to: "确认到店" },
    { from: "散购便利店", to: "闪购便利店" },
    { from: "申咐", to: "申诉" },
    { from: "舞栋", to: "5栋" },
    { from: "拒绝接待", to: "拒绝接单" },
    { from: "充门奖", to: "冲单奖" },
  ];

  const DEFAULT_CUSTOM_RATES = [
    { rate: 0.5, shortcut: createShortcut("f1") },
    { rate: 1.0, shortcut: createShortcut("f2") },
    { rate: 1.5, shortcut: createShortcut("f3") },
    { rate: 2.0, shortcut: createShortcut("f4") },
  ];

  const DEFAULT_ASR_CONFIG = {
    itemsPerPage: "50 条/页",
    autoPlay: true,
    defaultValid: false,
    fillOnValid: true,
    clearOnInvalid: true,
    autoNext: false,
    shortcutRemoveSpaces: createShortcut("h"),
    autoResetRate: false,
    resetRateValue: 1.5,
    playbackRateValue: 1.5,
    rateStepValue: 0.25,
    seekStepSeconds: 0.5,
    volumeValue: 100,
    autoClearInvalidValidation: false,
    autoFillOnValidValidation: false,
    autoFillOnLoad: false,
    numConvertMode: "千问",
    customReplacements: clone(DEFAULT_CUSTOM_REPLACEMENTS),
    customRates: clone(DEFAULT_CUSTOM_RATES),
    shortcutPanel: createShortcut("p", { ctrl: true }),
    shortcutPlayPause: createShortcut(" "),
    shortcutForward: createShortcut("arrowright"),
    shortcutBackward: createShortcut("arrowleft"),
    shortcutToggleFocus: createShortcut("tab"),
    shortcutVolUp: createShortcut("]"),
    shortcutVolDown: createShortcut("["),
    shortcutResetVol: createShortcut("\\"),
    shortcutSpeedDown: createShortcut("z"),
    shortcutSpeedUp: createShortcut("x"),
    shortcutResetSpeed: createShortcut("c"),
    shortcutValid: createShortcut("1"),
    shortcutInvalid: createShortcut("2"),
    shortcutFill: createShortcut("f"),
    shortcutConvertNum: createShortcut("v"),
    shortcutCopyDuration: createShortcut("b"),
    shortcutUploadStats: null,
    shortcutAiSuggest: null,
    shortcutApplyAiSuggestion: null,
    shortcutSubmitTask: null,
    shortcutSubmitTaskAndFinish: null,
    aiSuggestionRequestTimeoutMs: 120000,
    statsUploadEnabled: true,
    statsUploadEndpoint: TRANSCRIPTION_STATS_SERVER_ENDPOINT,
    statsUploadTimes: ["10:00", "16:00"],
    statsUploadJitterMinutes: 10,
    statsAutoUploadOnSchedule: true,
    statsUploadRequestTimeoutMs: 20000,
  };

  const DEFAULT_JUDGEMENT_ASR_DIFF_COLORS = {
    changeBackground: "#fef3c7",
    gapBackground: "#fee2e2",
    punctuationBackground: "#ede9fe",
  };

  const DEFAULT_JUDGEMENT_ASR_CONFIG = {
    itemsPerPage: "50 条/页",
    autoPlay: true,
    autoResetRate: true,
    resetRateValue: 2.0,
    playbackRateValue: 2.0,
    rateStepValue: 0.25,
    seekStepSeconds: 0.5,
    volumeValue: 100,
    virtualWindowEnabled: false,
    asrDiffViewEnabled: true,
    asrDiffColors: clone(DEFAULT_JUDGEMENT_ASR_DIFF_COLORS),
    compactCardEnabled: true,
    thunderQuestionEnabled: true,
    autoAdvanceAfterChoice: false,
    statsUploadEnabled: true,
    statsUploadEndpoint:
      JUDGEMENT_STATS_SERVER_ENDPOINT,
    statsScheduleUrl: "",
    statsUploadTimes: ["10:00", "16:00"],
    statsUploadJitterMinutes: 10,
    statsAutoUploadOnSubtaskOpen: false,
    statsAutoUploadOnSchedule: true,
    statsUploadRequestTimeoutMs: 20000,
    aiSuggestionEnabled: true,
    aiSuggestionEndpoint: JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT,
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
    aiSuggestionAvailableModels: clone(JUDGEMENT_AI_AVAILABLE_MODELS),
    shortcuts: {
      choiceFirstBetter: createShortcut("1"),
      choiceSecondBetter: createShortcut("2"),
      choiceBothBad: createShortcut("3"),
      choiceUnsure: createShortcut("4"),
      choiceOtherDialect: createShortcut("5"),
      volumeUp: createShortcut("["),
      volumeDown: createShortcut("]"),
      volumeReset: createShortcut("\\"),
      rateUp: null,
      rateDown: null,
      rateReset: null,
      seekBackward: createShortcut("ArrowLeft"),
      seekForward: createShortcut("ArrowRight"),
      playPause: createShortcut("Space"),
      aiSuggestCurrentItem: null,
      applyAiSuggestion: null,
      retryAiSuggestion: null,
      ignoreAiSuggestion: null,
      copyAsrTextPair: null,
      submitTask: null,
      submitTaskAndFinish: null,
    },
  };

  const JUDGEMENT_SHORTCUT_ACTIONS = [
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
    { key: "submitTask", label: "提交任务" },
    { key: "submitTaskAndFinish", label: "提交任务并结束" },
  ];

  const JUDGEMENT_PROJECT_ASR_KEYS = [
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
    "aiSuggestionWebSearchEnabled",
    "aiSuggestionModel",
    "aiSuggestionAvailableModels",
    "shortcuts",
  ];

  const SCRIPT_PROJECTS = {
    transcription: {
      id: TRANSCRIPTION_PROJECT_ID,
      shortLabel: "语音转写",
      label: "阿里ASR语音转写",
      description: "基础转写能力（当前题处理 + 当前音频控制 + 页面工具栏）。",
      note: "支持当前题 AI 推荐（人工确认填入），不自动保存/提交/流转；保持轻量统计导出能力。",
      capabilityScope: "basic-transcription",
    },
    judgement: {
      id: JUDGEMENT_PROJECT_ID,
      shortLabel: "语音判别",
      label: "阿里ASR语音判别",
      description: "同域名下的轻量音频判别项目。",
      note: "当前启用音量、倍速、快捷键提示与自动播放音频能力。",
      capabilityScope: "audio-lite",
    },
  };

  const PLATFORM_LIBRARY = {
    alibabaLabelx: {
      id: ALIBABA_LABELX_PLATFORM_ID,
      label: "Alibaba LabelX",
      host: TARGET_PLATFORM.host,
      matches: clone(TARGET_PLATFORM.matches),
      runtimeBridge: "labelx-content",
      description: "阿里内部 LabelX 标注/审核平台。",
    },
    lightwheel: {
      id: LIGHTWHEEL_PLATFORM_ID,
      label: "Lightwheel",
      host: LIGHTWHEEL_PLATFORM.host,
      matches: clone(LIGHTWHEEL_PLATFORM.matches),
      runtimeBridge: "none",
      description: "Lightwheel 视频标注查看态平台。",
    },
    dataBaker: {
      id: DATA_BAKER_PLATFORM_ID,
      label: "标贝易采",
      host: DATA_BAKER_PLATFORM.host,
      matches: clone(DATA_BAKER_PLATFORM.matches),
      runtimeBridge: "data-baker-round-one-quality",
      description: "标贝易采质检站点。",
    },
    magicData: {
      id: MAGIC_DATA_PLATFORM_ID,
      label: "Magic Data ANNOTATOR",
      host: MAGIC_DATA_PLATFORM.host,
      matches: clone(MAGIC_DATA_PLATFORM.matches),
      runtimeBridge: "magic-data-annotator-ai-review",
      description: "Magic Data 当前条 AI 质检、快捷键与模型配置。",
    },
    abakaAi: {
      id: ABAKA_AI_PLATFORM_ID,
      label: "Abaka AI",
      host: ABAKA_AI_PLATFORM.host,
      matches: clone(ABAKA_AI_PLATFORM.matches),
      runtimeBridge: "abaka-ai-task-page-capture",
      description: "Abaka AI 任务页结构与 Network 只读采集平台。",
    },
  };

  const SCRIPT_LIBRARY = {
    transcription: {
      id: TRANSCRIPTION_PROJECT_ID,
      platformId: ALIBABA_LABELX_PLATFORM_ID,
      label: SCRIPT_PROJECTS.transcription.label,
      shortLabel: SCRIPT_PROJECTS.transcription.shortLabel,
      description: SCRIPT_PROJECTS.transcription.description,
      note: SCRIPT_PROJECTS.transcription.note,
      capabilityScope: SCRIPT_PROJECTS.transcription.capabilityScope,
      statusLabel: "基础能力阶段",
      detailView: "labelx-transcription",
    },
    judgement: {
      id: JUDGEMENT_PROJECT_ID,
      platformId: ALIBABA_LABELX_PLATFORM_ID,
      label: SCRIPT_PROJECTS.judgement.label,
      shortLabel: SCRIPT_PROJECTS.judgement.shortLabel,
      description: SCRIPT_PROJECTS.judgement.description,
      note: SCRIPT_PROJECTS.judgement.note,
      capabilityScope: SCRIPT_PROJECTS.judgement.capabilityScope,
      statusLabel: "已接入音频基础能力",
      detailView: "labelx-judgement",
    },
    lightwheelViewPanel: {
      id: LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID,
      platformId: LIGHTWHEEL_PLATFORM_ID,
      label: "Lightwheel 查看态面板",
      shortLabel: "查看态面板",
      description:
        "access=1 查看态面板：状态筛选、名称列表、上下条跳转、编辑回退与 access-key 处理。",
      note: "当前扩展版先纳入脚本中心管理与 URL 检测，运行时迁移待继续接入。",
      capabilityScope: "legacy-reference-only",
      statusLabel: "待迁移",
      detailView: "lightwheel-view-panel",
      host: LIGHTWHEEL_PLATFORM.host,
      pathPattern: "^/w/video3/index\\.html$",
      requiredQuery: {
        access: "1",
      },
    },
    dataBakerRoundOneQuality: {
      id: DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID,
      platformId: DATA_BAKER_PLATFORM_ID,
      label: "标贝易采一检质检",
      shortLabel: "一检质检",
      description: "标贝易采一检质检 roundOneCollect 页面 AI 推荐文本能力。",
      note:
        "当前只提供单条 AI 推荐文本，不自动保存、提交、批量识别或自动流转。",
      capabilityScope: "ai-recommend-text",
      statusLabel: "已接入 AI 推荐文本",
      detailView: "data-baker-round-one-quality",
      host: DATA_BAKER_PLATFORM.host,
      matchUrl:
        "https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0",
    },
    magicDataAnnotatorAiReview: {
      id: MAGIC_DATA_ANNOTATOR_SCRIPT_ID,
      platformId: MAGIC_DATA_PLATFORM_ID,
      label: "Magic Data AI 质检助手",
      shortLabel: "AI 质检助手",
      description: "用于 #/asrmark 当前条规则质检，不自动保存、不自动提交。",
      note: "页面内结果区仅辅助复核，平台两行文本为基准答案，AI 输出以风险提示为主。",
      capabilityScope: "rule-first-ai-review",
      statusLabel: "已接入 AI 质检",
      detailView: "magic-data-annotator-ai-review",
      host: MAGIC_DATA_PLATFORM.host,
      matchUrl: "https://work.magicdatatech.com/#/asrmark?taskItemId=...",
    },
    abakaAiTaskPageCapture: {
      id: ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID,
      platformId: ABAKA_AI_PLATFORM_ID,
      label: "Abaka AI Task21 快捷键与 AI 分析",
      shortLabel: "Task21 快捷键+AI",
      description:
        "用于 Task21 same_font/按钮快捷键与 AI 调试分析（AI 仅建议，不自动写入）。",
      note:
        "快捷键与按钮动作仅 DOM 点击；AI 面板仅调用统一后端分析，不自动保存/提交/送审。",
      capabilityScope: "task21-shortcuts-and-ai-analysis-debug",
      statusLabel: "Task21 快捷键 + AI 分析调试版",
      detailView: "abaka-ai-task-page-capture",
      host: ABAKA_AI_PLATFORM.host,
      matchUrl: "http://abao.fortidyndns.com:30473/login",
    },
  };

  const SHORTCUT_DEFINITIONS = [
    { key: "shortcutPanel", label: "面板开关" },
    { key: "shortcutPlayPause", label: "播放 / 暂停" },
    { key: "shortcutValid", label: "标记有效" },
    { key: "shortcutInvalid", label: "标记无效" },
    { key: "shortcutFill", label: "快速填入" },
    { key: "shortcutToggleFocus", label: "切换输入(焦点)" },
    { key: "shortcutConvertNum", label: "转当前选择阿拉伯数字" },
    { key: "shortcutSpeedDown", label: "倍速 -0.1" },
    { key: "shortcutSpeedUp", label: "倍速 +0.1" },
    { key: "shortcutResetSpeed", label: "重置倍速" },
    { key: "shortcutBackward", label: "后退 1 秒" },
    { key: "shortcutForward", label: "前进 1 秒" },
    { key: "shortcutCopyDuration", label: "复制总时长(秒)" },
    { key: "shortcutVolDown", label: "音量 -50%" },
    { key: "shortcutVolUp", label: "音量 +50%" },
    { key: "shortcutResetVol", label: "重置音量 (100%)" },
    { key: "shortcutRemoveSpaces", label: "去除当前空格" },
    { key: "shortcutUploadStats", label: "上传转写统计" },
    { key: "shortcutAiSuggest", label: "AI 推荐当前题" },
    { key: "shortcutApplyAiSuggestion", label: "填入 AI 推荐" },
    { key: "shortcutSubmitTask", label: "提交任务" },
    { key: "shortcutSubmitTaskAndFinish", label: "提交任务并结束" },
  ];

  const SHORTCUT_KEYS = SHORTCUT_DEFINITIONS.map(function (item) {
    return item.key;
  });

  const SHORTCUT_COMPATIBILITY_MAP = {
    panel: "shortcutPanel",
    playPause: "shortcutPlayPause",
    valid: "shortcutValid",
    invalid: "shortcutInvalid",
    quickfill: "shortcutFill",
    toggleFocus: "shortcutToggleFocus",
    convertNumbers: "shortcutConvertNum",
    speedDown: "shortcutSpeedDown",
    speedUp: "shortcutSpeedUp",
    resetSpeed: "shortcutResetSpeed",
    backward: "shortcutBackward",
    forward: "shortcutForward",
    copyDuration: "shortcutCopyDuration",
    volumeDown: "shortcutVolDown",
    volumeUp: "shortcutVolUp",
    resetVolume: "shortcutResetVol",
    removeSpaces: "shortcutRemoveSpaces",
    uploadStats: "shortcutUploadStats",
    aiSuggest: "shortcutAiSuggest",
    applyAiSuggestion: "shortcutApplyAiSuggestion",
    submitTask: "shortcutSubmitTask",
    submitTaskAndFinish: "shortcutSubmitTaskAndFinish",
  };

  const BOOLEAN_CONFIG_KEYS = [
    "autoPlay",
    "defaultValid",
    "fillOnValid",
    "clearOnInvalid",
    "autoNext",
    "autoResetRate",
    "autoClearInvalidValidation",
    "autoFillOnValidValidation",
    "autoFillOnLoad",
  ];

  const NUMBER_CONFIG_KEYS = [
    "resetRateValue",
    "playbackRateValue",
    "rateStepValue",
    "seekStepSeconds",
    "volumeValue",
  ];

  const STRING_CONFIG_KEYS = ["itemsPerPage", "numConvertMode"];

  const ASR_CONFIG_KEYS = Object.keys(DEFAULT_ASR_CONFIG);

  const LEGACY_ROOT_DEBUG_KEY = "asr_debug_mode";
  const LEGACY_ROOT_CACHE_KEYS = {
    lastUpdateCheckTime: "asr_last_update_check_time",
    scriptVersion: "asr_script_version",
    currentTotalDuration: "currentTotalDuration",
    audioFilenameToDuration: "audioFilenameToDuration",
    cachedDataList: "cachedDataList",
  };

  const DEFAULT_CACHE = {
    lastUpdateCheckTime: 0,
    scriptVersion: "0",
    currentTotalDuration: 0,
    audioFilenameToDuration: {},
    cachedDataList: [],
    versionCheck: null,
    runtime: {},
  };

  const BUSINESS_ACTIONS = [
    { key: "checkUpdate", label: "手动检查更新", placeholder: "待接版本检查" },
    { key: "syncDictionary", label: "同步云端词库", placeholder: "待接云端词库同步" },
    { key: "uploadDictionary", label: "上传本地数据", placeholder: "待接词库上传" },
  ];

  function createShortcutMapFromAsr(asrConfig) {
    const map = {};
    Object.keys(SHORTCUT_COMPATIBILITY_MAP).forEach(function (compatKey) {
      const sourceKey = SHORTCUT_COMPATIBILITY_MAP[compatKey];
      map[compatKey] = clone(asrConfig[sourceKey]);
    });
    return map;
  }

  function createDefaultPlatformSettings() {
    const asr = clone(DEFAULT_ASR_CONFIG);

    return {
      enabled: true,
      scriptCenter: {
        activeProjectId: TRANSCRIPTION_PROJECT_ID,
        projects: {
          transcription: {
            id: TRANSCRIPTION_PROJECT_ID,
            label: SCRIPT_PROJECTS.transcription.label,
            shortLabel: SCRIPT_PROJECTS.transcription.shortLabel,
            description: SCRIPT_PROJECTS.transcription.description,
            note: SCRIPT_PROJECTS.transcription.note,
            capabilityScope: SCRIPT_PROJECTS.transcription.capabilityScope,
            active: true,
            asrConfig: clone(asr),
          },
          judgement: {
            id: JUDGEMENT_PROJECT_ID,
            label: SCRIPT_PROJECTS.judgement.label,
            shortLabel: SCRIPT_PROJECTS.judgement.shortLabel,
            description: SCRIPT_PROJECTS.judgement.description,
            note: SCRIPT_PROJECTS.judgement.note,
            capabilityScope: SCRIPT_PROJECTS.judgement.capabilityScope,
            active: false,
            asrConfig: clone(DEFAULT_JUDGEMENT_ASR_CONFIG),
          },
        },
      },
      annotation: {
        itemsPerPage: asr.itemsPerPage,
        autoPlay: asr.autoPlay,
        defaultValid: asr.defaultValid,
        fillOnValid: asr.fillOnValid,
        clearOnInvalid: asr.clearOnInvalid,
        autoNext: asr.autoNext,
        autoResetRate: asr.autoResetRate,
        resetRateValue: asr.resetRateValue,
        playbackRateValue: asr.playbackRateValue,
        rateStepValue: asr.rateStepValue,
        seekStepSeconds: asr.seekStepSeconds,
        volumeValue: asr.volumeValue,
        autoClearInvalidValidation: asr.autoClearInvalidValidation,
        autoFillOnValidValidation: asr.autoFillOnValidValidation,
        autoFillOnLoad: asr.autoFillOnLoad,
        numConvertMode: asr.numConvertMode,
        shortcuts: createShortcutMapFromAsr(asr),
        customReplacements: clone(asr.customReplacements),
        customRates: clone(asr.customRates),
      },
      automation: {
        autoAssignCheckTasks: false,
        autoAssignTaskKeyword: "",
        autoAssignTargetUser: "",
        autoAssignBatchSize: 0,
        autoAssignAllTasks: false,
        autoAssignFetchAll: false,
        autoAssignPollIntervalMs: 60000,
        autoBatchSubmit: false,
        autoBatchSubmitDelayMs: 10000,
        autoNavigateNextTask: false,
        autoFillOnLoad: asr.autoFillOnLoad,
        validateBeforeSubmit: false,
        autoSubmitAfterValidation: false,
        autoReceiveOnSubmit: false,
      },
      aiPunctuation: {
        apiKey: "",
        useAdvancedRules: false,
        model: "",
      },
      ai: {
        qwenApiKey: "",
        useAdvancedRules: false,
        qwenModel: "",
      },
      dictionary: {
        customReplacements: clone(asr.customReplacements),
        lastSyncedAt: null,
        lastUploadedAt: null,
      },
      safety: {
        interceptPlatformAutosave: true,
        blurBeforeManualSave: false,
        submitRequiresManualSave: false,
        uploadStatsBeforeSubmit: false,
        reloadAfterBulkSave: false,
        saveReloadDelayMs: 1200,
        validateBeforeSubmit: false,
        autoClearInvalidValidation: asr.autoClearInvalidValidation,
        autoFillOnValidValidation: asr.autoFillOnValidValidation,
        autoSubmitAfterValidation: false,
      },
      legacyServer: {
        apiBaseUrl: "http://47.108.254.138:3101",
        debugApiBaseUrl: "http://127.0.0.1:3101",
        useDebugApiBaseUrl: false,
        requestTimeoutMs: 20000,
        updateManifestUrl: "",
      },
      reporting: {
        itemsPerPage: asr.itemsPerPage,
        exportUploadEnabled: true,
      },
    };
  }

  function createDefaultLightwheelPlatformSettings() {
    return {
      enabled: false,
      scripts: {
        viewPanel: {
          id: LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID,
          enabled: false,
          migrationStatus: "legacy-reference-only",
          note:
            "legacy-reference/Lightwheel 查看态面板.js 已纳入参考，扩展版运行时待迁移。",
        },
      },
    };
  }

  function createDefaultDataBakerPlatformSettings() {
    const shortcuts = {};
    DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS.forEach(function (action) {
      shortcuts[action.key] = null;
    });
    shortcuts.autoFillQualifiedItem = createShortcut("q", { alt: true });

    return {
      enabled: true,
      scripts: {
        roundOneQuality: {
          id: DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID,
          enabled: true,
          aiRecommendEnabled: true,
          aiRecommendEndpoint: DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT,
          aiRecommendRequestTimeoutMs: 120000,
          aiQualifiedAutofillConcurrency: 5,
          aiQualifiedAutofillWaitAllBeforeFill: true,
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
          shortcuts: shortcuts,
        },
      },
    };
  }

  function createDefaultAbakaAiPlatformSettings() {
    const shortcuts = {};
    ABAKA_AI_TASK21_SHORTCUT_ACTIONS.forEach(function (action) {
      shortcuts[action.key] = null;
    });
    shortcuts.sameFontTrue = createShortcut("1");
    shortcuts.sameFontFalse = createShortcut("2");
    shortcuts.sameFontArtisticEffect = createShortcut("3");
    shortcuts.imageBTextsRemovedSpecify = createShortcut("4");
    shortcuts.otherChangesSpecify = createShortcut("5");
    shortcuts.stashSave = createShortcut("6");
    shortcuts.submitReview = createShortcut("7");
    shortcuts.aiAnalyzeSameFont = createShortcut("1", { alt: true });
    shortcuts.aiAnalyzeImageBTextsRemoved = createShortcut("2", { alt: true });
    shortcuts.aiAnalyzeOtherChanges = createShortcut("3", { alt: true });
    shortcuts.aiAnalyzeOverall = createShortcut("4", { alt: true });

    return {
      enabled: true,
      scripts: {
        taskPageCapture: {
          id: ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID,
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
          aiRequestTimeoutMs: 120000,
          shortcuts: shortcuts,
        },
      },
    };
  }

  const DEFAULT_SETTINGS = {
    stage: STAGE_ID,
    scriptCenter: {
      projects: {
        magicDataAnnotator: {
          enabled: true,
          aiReviewEnabled: true,
          listenModel: "qwen3.5-omni-flash",
          reviewModel: "qwen3.5-plus",
          reviewMode: "rule_first",
          showHeardText: true,
          showEstimatedIncome: true,
          enableThinking: false,
          aiReviewRequestTimeoutMs: 120000,
          aiReviewListenPrompt: "",
          aiReviewComparePrompt: "",
          aiReviewTemperature: "",
          aiReviewTopP: "",
          aiReviewMaxTokens: "",
          aiReviewMaxCompletionTokens: "",
          aiReviewPresencePenalty: "",
          aiReviewFrequencyPenalty: "",
          aiReviewSeed: "",
          aiReviewStopSequences: "",
          shortcuts: {},
        },
      },
    },
    platforms: {
      alibabaLabelx: createDefaultPlatformSettings(),
      lightwheel: createDefaultLightwheelPlatformSettings(),
      dataBaker: createDefaultDataBakerPlatformSettings(),
      abakaAi: createDefaultAbakaAiPlatformSettings(),
    },
    asr: clone(DEFAULT_ASR_CONFIG),
    debug: {
      enabled: false,
      lastToggledAt: null,
    },
    cache: clone(DEFAULT_CACHE),
    meta: {
      schemaVersion: SCHEMA_VERSION,
      backendEndpointMode: BACKEND_ENDPOINT_MODE_SERVER,
      lastBootstrapReason: null,
      lastBootstrappedAt: null,
    },
  };

  globalThis.ASREdgeConstants = {
    EXTENSION_NAME: EXTENSION_NAME,
    STAGE_ID: STAGE_ID,
    STAGE_LABEL: STAGE_LABEL,
    STAGE_DESCRIPTION:
      "脚本中心统一管理多平台脚本，options 页负责启停与必要配置，运行时功能由各脚本独立维护。",
    CAPABILITY_SCOPE:
      "当前支持多平台脚本中心、LabelX 语音转写轻量工具栏与统计导出、语音判别音频能力、Lightwheel 脚本占位管理，以及标贝易采一检质检 AI 推荐文本。",
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_KEY: "asrEdgeSettings",
    PRESENCE_BADGE_ID: "asr-edge-presence-host",
    TARGET_PLATFORM: TARGET_PLATFORM,
    LIGHTWHEEL_PLATFORM: LIGHTWHEEL_PLATFORM,
    DATA_BAKER_PLATFORM: DATA_BAKER_PLATFORM,
    MAGIC_DATA_PLATFORM: MAGIC_DATA_PLATFORM,
    ABAKA_AI_PLATFORM: ABAKA_AI_PLATFORM,
    PLATFORM_LIBRARY: clone(PLATFORM_LIBRARY),
    MESSAGE_TYPES: MESSAGE_TYPES,
    PAGE_OPTIONS: PAGE_OPTIONS,
    AI_MODEL_OPTIONS: AI_MODEL_OPTIONS,
    JUDGEMENT_AI_LISTEN_MODELS: clone(JUDGEMENT_AI_LISTEN_MODELS),
    JUDGEMENT_AI_COMPARE_MODELS: clone(JUDGEMENT_AI_COMPARE_MODELS),
    JUDGEMENT_AI_AVAILABLE_MODELS: clone(JUDGEMENT_AI_AVAILABLE_MODELS),
    JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS: clone(JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS),
    DEFAULT_CUSTOM_REPLACEMENTS: clone(DEFAULT_CUSTOM_REPLACEMENTS),
    DEFAULT_CUSTOM_RATES: clone(DEFAULT_CUSTOM_RATES),
    SHORTCUT_DEFINITIONS: SHORTCUT_DEFINITIONS,
    SHORTCUT_KEYS: SHORTCUT_KEYS,
    SHORTCUT_COMPATIBILITY_MAP: SHORTCUT_COMPATIBILITY_MAP,
    TRANSCRIPTION_PROJECT_ID: TRANSCRIPTION_PROJECT_ID,
    JUDGEMENT_PROJECT_ID: JUDGEMENT_PROJECT_ID,
    LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID: LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID,
    DATA_BAKER_PLATFORM_ID: DATA_BAKER_PLATFORM_ID,
    MAGIC_DATA_PLATFORM_ID: MAGIC_DATA_PLATFORM_ID,
    ABAKA_AI_PLATFORM_ID: ABAKA_AI_PLATFORM_ID,
    DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID: DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID,
    MAGIC_DATA_ANNOTATOR_SCRIPT_ID: MAGIC_DATA_ANNOTATOR_SCRIPT_ID,
    ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID: ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID,
    DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT: DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT,
    DATABAKER_AI_RECOMMEND_LOCAL_ENDPOINT: DATABAKER_AI_RECOMMEND_LOCAL_ENDPOINT,
    DATABAKER_AI_RECOMMEND_PATH: DATABAKER_AI_RECOMMEND_PATH,
    DATABAKER_EXPORT_UPLOAD_PATH: DATABAKER_EXPORT_UPLOAD_PATH,
    DATABAKER_EXPORT_DOWNLOAD_PATH: DATABAKER_EXPORT_DOWNLOAD_PATH,
    DATABAKER_EXPORT_UPLOAD_SERVER_ENDPOINT: DATABAKER_EXPORT_UPLOAD_SERVER_ENDPOINT,
    DATABAKER_EXPORT_UPLOAD_LOCAL_ENDPOINT: DATABAKER_EXPORT_UPLOAD_LOCAL_ENDPOINT,
    DATABAKER_EXPORT_DOWNLOAD_SERVER_ENDPOINT: DATABAKER_EXPORT_DOWNLOAD_SERVER_ENDPOINT,
    DATABAKER_EXPORT_DOWNLOAD_LOCAL_ENDPOINT: DATABAKER_EXPORT_DOWNLOAD_LOCAL_ENDPOINT,
    JUDGEMENT_STATS_UPLOAD_PATH: JUDGEMENT_STATS_UPLOAD_PATH,
    JUDGEMENT_STATS_DOWNLOAD_PATH: JUDGEMENT_STATS_DOWNLOAD_PATH,
    JUDGEMENT_AI_SUGGEST_PATH: JUDGEMENT_AI_SUGGEST_PATH,
    TRANSCRIPTION_AI_SUGGEST_CURRENT_PATH: TRANSCRIPTION_AI_SUGGEST_CURRENT_PATH,
    TRANSCRIPTION_STATS_UPLOAD_PATH: TRANSCRIPTION_STATS_UPLOAD_PATH,
    TRANSCRIPTION_STATS_DOWNLOAD_PATH: TRANSCRIPTION_STATS_DOWNLOAD_PATH,
    PROJECT_DATA_DOWNLOAD_OPTIONS_PATH: PROJECT_DATA_DOWNLOAD_OPTIONS_PATH,
    PROJECT_DATA_DOWNLOAD_REQUEST_PATH: PROJECT_DATA_DOWNLOAD_REQUEST_PATH,
    PROJECT_DATA_DOWNLOAD_FILE_PATH: PROJECT_DATA_DOWNLOAD_FILE_PATH,
    BACKEND_ENDPOINT_MODE_SERVER: BACKEND_ENDPOINT_MODE_SERVER,
    BACKEND_ENDPOINT_MODE_LOCAL: BACKEND_ENDPOINT_MODE_LOCAL,
    BACKEND_ENDPOINTS: clone(BACKEND_ENDPOINTS),
    JUDGEMENT_STATS_SERVER_ENDPOINT: JUDGEMENT_STATS_SERVER_ENDPOINT,
    JUDGEMENT_STATS_LOCAL_ENDPOINT: JUDGEMENT_STATS_LOCAL_ENDPOINT,
    JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT: JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT,
    JUDGEMENT_AI_SUGGEST_LOCAL_ENDPOINT: JUDGEMENT_AI_SUGGEST_LOCAL_ENDPOINT,
    TRANSCRIPTION_AI_SUGGEST_CURRENT_SERVER_ENDPOINT:
      TRANSCRIPTION_AI_SUGGEST_CURRENT_SERVER_ENDPOINT,
    TRANSCRIPTION_AI_SUGGEST_CURRENT_LOCAL_ENDPOINT:
      TRANSCRIPTION_AI_SUGGEST_CURRENT_LOCAL_ENDPOINT,
    normalizeBackendEndpointMode: normalizeBackendEndpointMode,
    inferBackendEndpointModeFromEndpoint: inferBackendEndpointModeFromEndpoint,
    getBackendEndpointModeFromSettings: getBackendEndpointModeFromSettings,
    getBackendBaseUrlByMode: getBackendBaseUrlByMode,
    getBackendBaseUrlFromSettings: getBackendBaseUrlFromSettings,
    buildBackendUrl: buildBackendUrl,
    TRANSCRIPTION_STATS_SERVER_ENDPOINT: TRANSCRIPTION_STATS_SERVER_ENDPOINT,
    TRANSCRIPTION_STATS_LOCAL_ENDPOINT: TRANSCRIPTION_STATS_LOCAL_ENDPOINT,
    DATABAKER_PAGE_SIZE_OPTIONS: clone(DATABAKER_PAGE_SIZE_OPTIONS),
    DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS: clone(DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS),
    ABAKA_AI_TASK21_SHORTCUT_ACTIONS: clone(ABAKA_AI_TASK21_SHORTCUT_ACTIONS),
    ABAKA_AI_TASK21_AI_ANALYSIS_MODES: clone(ABAKA_AI_TASK21_AI_ANALYSIS_MODES),
    ABAKA_AI_TASK21_VISION_MODEL_OPTIONS: clone(ABAKA_AI_TASK21_VISION_MODEL_OPTIONS),
    ABAKA_AI_TASK21_OCR_MODEL_OPTIONS: clone(ABAKA_AI_TASK21_OCR_MODEL_OPTIONS),
    ABAKA_AI_TASK21_REASONING_MODEL_OPTIONS: clone(ABAKA_AI_TASK21_REASONING_MODEL_OPTIONS),
    ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS: clone(ABAKA_AI_TASK21_SINGLE_MODEL_OPTIONS),
    ABAKA_AI_TASK21_AI_MODEL_OPTIONS: clone(ABAKA_AI_TASK21_AI_MODEL_OPTIONS),
    SCRIPT_PROJECTS: clone(SCRIPT_PROJECTS),
    SCRIPT_LIBRARY: clone(SCRIPT_LIBRARY),
    JUDGEMENT_SHORTCUT_ACTIONS: clone(JUDGEMENT_SHORTCUT_ACTIONS),
    JUDGEMENT_PROJECT_ASR_KEYS: clone(JUDGEMENT_PROJECT_ASR_KEYS),
    BUSINESS_ACTIONS: BUSINESS_ACTIONS,
    BOOLEAN_CONFIG_KEYS: BOOLEAN_CONFIG_KEYS,
    NUMBER_CONFIG_KEYS: NUMBER_CONFIG_KEYS,
    STRING_CONFIG_KEYS: STRING_CONFIG_KEYS,
    ASR_CONFIG_KEYS: ASR_CONFIG_KEYS,
    DEFAULT_ASR_CONFIG: clone(DEFAULT_ASR_CONFIG),
    DEFAULT_JUDGEMENT_ASR_CONFIG: clone(DEFAULT_JUDGEMENT_ASR_CONFIG),
    DEFAULT_CACHE: clone(DEFAULT_CACHE),
    DEFAULT_PLATFORM_SETTINGS: createDefaultPlatformSettings(),
    DEFAULT_LIGHTWHEEL_PLATFORM_SETTINGS: createDefaultLightwheelPlatformSettings(),
    DEFAULT_DATA_BAKER_PLATFORM_SETTINGS: createDefaultDataBakerPlatformSettings(),
    DEFAULT_ABAKA_AI_PLATFORM_SETTINGS: createDefaultAbakaAiPlatformSettings(),
    DEFAULT_SETTINGS: clone(DEFAULT_SETTINGS),
    LEGACY_ROOT_DEBUG_KEY: LEGACY_ROOT_DEBUG_KEY,
    LEGACY_ROOT_CACHE_KEYS: Object.assign({}, LEGACY_ROOT_CACHE_KEYS),
  };
})();
