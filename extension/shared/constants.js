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
  const TRANSCRIPTION_PROJECT_ID = "transcription";
  const JUDGEMENT_PROJECT_ID = "judgement";
  const LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID = "lightwheelViewPanel";
  const DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID = "dataBakerRoundOneQuality";
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
  const TRANSCRIPTION_STATS_UPLOAD_PATH = "/api/alibaba-labelx/asr-transcription/statistics/upload";
  const TRANSCRIPTION_STATS_DOWNLOAD_PATH =
    "/api/alibaba-labelx/asr-transcription/statistics/download";
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
  const DATABAKER_PAGE_SIZE_OPTIONS = ["5条/页", "10条/页", "20条/页", "50条/页", "100条/页"];
  const DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS = [
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

  const JUDGEMENT_AI_AVAILABLE_MODELS = ["qwen3-omni-flash", "qwen3.5-omni-plus"];

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
    resetRateValue: 1.0,
    playbackRateValue: 1.0,
    rateStepValue: 0.1,
    seekStepSeconds: 1.0,
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
    resetRateValue: 1.0,
    playbackRateValue: 1.0,
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
    aiSuggestionEnabled: false,
    aiSuggestionEndpoint: JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT,
    aiSuggestionRequestTimeoutMs: 120000,
    aiSuggestionModel: "qwen3-omni-flash",
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
      note: "当前不提供独立大表单和快捷键配置；支持轻量统计导出，不做保存/提交/自动化/AI链路。",
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

    return {
      enabled: true,
      scripts: {
        roundOneQuality: {
          id: DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID,
          enabled: true,
          aiRecommendEnabled: true,
          aiRecommendEndpoint: DATABAKER_AI_RECOMMEND_SERVER_ENDPOINT,
          aiRecommendRequestTimeoutMs: 120000,
          autoPageSizeEnabled: true,
          defaultPageSize: "50条/页",
          shortcuts: shortcuts,
        },
      },
    };
  }

  const DEFAULT_SETTINGS = {
    stage: STAGE_ID,
    platforms: {
      alibabaLabelx: createDefaultPlatformSettings(),
      lightwheel: createDefaultLightwheelPlatformSettings(),
      dataBaker: createDefaultDataBakerPlatformSettings(),
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
    PLATFORM_LIBRARY: clone(PLATFORM_LIBRARY),
    MESSAGE_TYPES: MESSAGE_TYPES,
    PAGE_OPTIONS: PAGE_OPTIONS,
    AI_MODEL_OPTIONS: AI_MODEL_OPTIONS,
    JUDGEMENT_AI_AVAILABLE_MODELS: clone(JUDGEMENT_AI_AVAILABLE_MODELS),
    DEFAULT_CUSTOM_REPLACEMENTS: clone(DEFAULT_CUSTOM_REPLACEMENTS),
    DEFAULT_CUSTOM_RATES: clone(DEFAULT_CUSTOM_RATES),
    SHORTCUT_DEFINITIONS: SHORTCUT_DEFINITIONS,
    SHORTCUT_KEYS: SHORTCUT_KEYS,
    SHORTCUT_COMPATIBILITY_MAP: SHORTCUT_COMPATIBILITY_MAP,
    TRANSCRIPTION_PROJECT_ID: TRANSCRIPTION_PROJECT_ID,
    JUDGEMENT_PROJECT_ID: JUDGEMENT_PROJECT_ID,
    LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID: LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID,
    DATA_BAKER_PLATFORM_ID: DATA_BAKER_PLATFORM_ID,
    DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID: DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID,
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
    TRANSCRIPTION_STATS_UPLOAD_PATH: TRANSCRIPTION_STATS_UPLOAD_PATH,
    TRANSCRIPTION_STATS_DOWNLOAD_PATH: TRANSCRIPTION_STATS_DOWNLOAD_PATH,
    BACKEND_ENDPOINT_MODE_SERVER: BACKEND_ENDPOINT_MODE_SERVER,
    BACKEND_ENDPOINT_MODE_LOCAL: BACKEND_ENDPOINT_MODE_LOCAL,
    BACKEND_ENDPOINTS: clone(BACKEND_ENDPOINTS),
    JUDGEMENT_STATS_SERVER_ENDPOINT: JUDGEMENT_STATS_SERVER_ENDPOINT,
    JUDGEMENT_STATS_LOCAL_ENDPOINT: JUDGEMENT_STATS_LOCAL_ENDPOINT,
    JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT: JUDGEMENT_AI_SUGGEST_SERVER_ENDPOINT,
    JUDGEMENT_AI_SUGGEST_LOCAL_ENDPOINT: JUDGEMENT_AI_SUGGEST_LOCAL_ENDPOINT,
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
    DEFAULT_SETTINGS: clone(DEFAULT_SETTINGS),
    LEGACY_ROOT_DEBUG_KEY: LEGACY_ROOT_DEBUG_KEY,
    LEGACY_ROOT_CACHE_KEYS: Object.assign({}, LEGACY_ROOT_CACHE_KEYS),
  };
})();
