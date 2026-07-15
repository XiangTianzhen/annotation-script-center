(function () {
  "use strict";

  const EXTENSION_NAME = "标注脚本中心";
  const STAGE_LABEL = "脚本中心";
  const STORAGE_KEY = "asrEdgeSettings";
  const SCHEMA_VERSION = 32;
  const DEFAULT_AI_REQUEST_TIMEOUT_MS = 60000;
  const BACKEND_ENDPOINT_MODE_SERVER = "server";
  const BACKEND_ENDPOINT_MODE_LOCAL = "local";
  const DEFAULT_BACKEND_BASE_URLS = {
    server: "https://annotation-script-center.xiangtianzhen.store",
    local: "http://127.0.0.1:3333",
  };

  const DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID = "dataBakerCvpcLiuzhouAssistant";
  const BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID = "bytedanceAidpSuzhouHelper";
  const BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID = "bytedanceAidpJinhuaHelper";
  const BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID = "bytedanceAidpTaizhouHelper";
  const MAGIC_DATA_HANGZHOU_SCRIPT_ID = "magicDataHangzhouAssistant";

  const DATA_BAKER_CVPC_AI_RECOMMEND_PATH = "/api/data-baker-cvpc/liuzhou-helper/ai/recommend";
  const DATA_BAKER_CVPC_SEGMENT_PREVIEW_PATH = "/api/data-baker-cvpc/liuzhou-helper/segment/preview";
  const BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_PATH = "/api/bytedance-aidp/suzhou-helper/ai/recommend";
  const BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_PATH = "/api/bytedance-aidp/jinhua-helper/ai/recommend";
  const BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_PATH = "/api/bytedance-aidp/taizhou-helper/ai/recommend";

  const DATA_BAKER_CVPC_PLATFORM = {
    id: "dataBakerCvpc", label: "DataBaker CVPC", host: "cvpc.data-baker.com",
    displayHost: "cvpc.data-baker.com/app/editor/asr", entryUrl: "https://cvpc.data-baker.com/app/web/",
    matches: ["https://cvpc.data-baker.com/*"], runtimeBridge: "data-baker-cvpc-liuzhou-helper",
    description: "CVPC 语音编辑器柳州话脚本平台。",
  };
  const BYTEDANCE_AIDP_PLATFORM = {
    id: "bytedanceAidp", label: "ByteDance AIDP", host: "aidp.bytedance.com",
    displayHost: "aidp.bytedance.com/management/task-v2", entryUrl: "https://aidp.bytedance.com/management/task-v2?page=1",
    matches: ["https://aidp.bytedance.com/*"], runtimeBridge: "bytedance-aidp-helpers",
    description: "ByteDance AIDP 方言详情页辅助平台（苏州话 / 金华话 / 台州话）。",
  };
  const MAGIC_DATA_PLATFORM = {
    id: "magicData", label: "Magic Data ANNOTATOR", host: "work.magicdatatech.com",
    displayHost: "work.magicdatatech.com", entryUrl: "https://work.magicdatatech.com/",
    matches: ["https://work.magicdatatech.com/*"], runtimeBridge: "magic-data-hangzhou-assistant",
    description: "Magic Data 杭州话 AI 质检辅助平台。",
  };

  const PLATFORM_LIBRARY = {
    dataBakerCvpc: DATA_BAKER_CVPC_PLATFORM,
    bytedanceAidp: BYTEDANCE_AIDP_PLATFORM,
    magicData: MAGIC_DATA_PLATFORM,
  };
  const SCRIPT_LIBRARY = {
    [DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID]: {
      id: DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID, platformId: "dataBakerCvpc", label: "柳州话脚本",
      shortLabel: "柳州话脚本", description: "CVPC 柳州话分段建议、当前段 AI 推荐与辅助填入助手。",
      note: "只做建议生成与人工确认，不自动保存、不自动提交。", detailView: "data-baker-cvpc-liuzhou-helper",
      host: DATA_BAKER_CVPC_PLATFORM.host, matchUrl: "https://cvpc.data-baker.com/app/editor/asr/",
    },
    [BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID]: {
      id: BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID, platformId: "bytedanceAidp", label: "苏州话脚本",
      shortLabel: "苏州话脚本", description: "AIDP 苏州话普通话听写、分段建议与快捷键辅助。",
      note: "不自动提交、不自动切题。", detailView: "bytedance-aidp-suzhou-helper",
      host: BYTEDANCE_AIDP_PLATFORM.host, matchUrl: "https://aidp.bytedance.com/management/task-v2/",
    },
    [BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID]: {
      id: BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID, platformId: "bytedanceAidp", label: "金华话脚本",
      shortLabel: "金华话脚本", description: "AIDP 金华话普通话翻译、分段建议与快捷键辅助。",
      note: "不自动提交、不自动切题。", detailView: "bytedance-aidp-jinhua-helper",
      host: BYTEDANCE_AIDP_PLATFORM.host, matchUrl: "https://aidp.bytedance.com/management/task-v2/",
    },
    [BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID]: {
      id: BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID, platformId: "bytedanceAidp", label: "台州话脚本",
      shortLabel: "台州话脚本", description: "AIDP 台州话普通话翻译、分段建议与快捷键辅助。",
      note: "不自动提交、不自动切题。", detailView: "bytedance-aidp-taizhou-helper",
      host: BYTEDANCE_AIDP_PLATFORM.host, matchUrl: "https://aidp.bytedance.com/management/task-v2/",
    },
    [MAGIC_DATA_HANGZHOU_SCRIPT_ID]: {
      id: MAGIC_DATA_HANGZHOU_SCRIPT_ID, platformId: "magicData", label: "杭州话脚本",
      shortLabel: "杭州话脚本", description: "Magic Data 当前条杭州话 AI 质检辅助。",
      note: "不自动保存、不自动提交。", detailView: "magic-data-hangzhou-assistant",
      host: MAGIC_DATA_PLATFORM.host, matchUrl: "https://work.magicdatatech.com/#/asrmark",
    },
  };

  const BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS = [
    { key: "togglePlayPause", label: "播放/暂停切换" }, { key: "playSelection", label: "区间播放" },
    { key: "jumpToFirstFrame", label: "回到首帧" }, { key: "deleteCurrentSelection", label: "删除当前选区" },
    { key: "clearSegments", label: "清空画段" }, { key: "previewSegments", label: "生成分段建议" },
    { key: "applyPreviewSegments", label: "应用分段建议" },
  ];
  const BYTEDANCE_AIDP_JINHUA_SHORTCUT_ACTIONS = BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS.map((item) => ({ ...item }));
  const BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS = BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS.map((item) => ({ ...item }));

  function trimBaseUrl(value) { return String(value || "").trim().replace(/\/+$/, ""); }
  function normalizeBackendEndpointMode(value, fallback) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === BACKEND_ENDPOINT_MODE_LOCAL) return mode;
    if (mode === BACKEND_ENDPOINT_MODE_SERVER) return mode;
    return BACKEND_ENDPOINT_MODE_SERVER;
  }
  function getBackendBaseUrlsFromSettings(settings) {
    const source = settings?.meta?.backendBaseUrls || {};
    return {
      server: trimBaseUrl(source.server) || DEFAULT_BACKEND_BASE_URLS.server,
      local: trimBaseUrl(source.local) || DEFAULT_BACKEND_BASE_URLS.local,
    };
  }
  function getBackendEndpointModeFromSettings(settings) {
    return normalizeBackendEndpointMode(settings?.meta?.backendEndpointMode, BACKEND_ENDPOINT_MODE_SERVER);
  }
  function getBackendBaseUrlByMode(mode, settings) {
    const normalized = normalizeBackendEndpointMode(mode, getBackendEndpointModeFromSettings(settings));
    return getBackendBaseUrlsFromSettings(settings)[normalized];
  }
  function buildBackendUrl(path, settingsOrMode) {
    const settings = settingsOrMode && typeof settingsOrMode === "object" ? settingsOrMode : {};
    const mode = typeof settingsOrMode === "string" ? settingsOrMode : getBackendEndpointModeFromSettings(settings);
    const suffix = String(path || "").trim();
    if (/^https?:\/\//i.test(suffix)) return suffix;
    return getBackendBaseUrlByMode(mode, settings) + (suffix.startsWith("/") ? suffix : "/" + suffix);
  }

  const baseAidp = (id, enabled) => ({
    id, enabled, platformAiEnabled: false, segmentContextPaddingMs: 300, segmentSilenceThresholdDbfs: -31,
    mergeContiguousSuggestedSegmentsEnabled: true, segmentPreviewAutoApplyEnabled: true,
    aiRecommendEnabled: enabled, aiRecommendAutoFillEnabled: true, aiRecommendRequestTimeoutMs: 60000,
    aiRecommendListenModel: "qwen3.5-omni-flash", aiRecommendListenPrompt: "", aiRecommendListenTemperature: "",
    aiRecommendListenTopP: "", aiRecommendListenMaxTokens: "", aiRecommendListenMaxCompletionTokens: "",
    aiRecommendListenPresencePenalty: "", aiRecommendListenFrequencyPenalty: "", aiRecommendListenSeed: "",
    aiRecommendListenStopSequences: "", aiRecommendRefineModel: "qwen3.5-plus", aiRecommendRefinePrompt: "",
    aiRecommendRefineTemperature: "", aiRecommendRefineTopP: "", aiRecommendRefineMaxTokens: "",
    aiRecommendRefineMaxCompletionTokens: "", aiRecommendRefinePresencePenalty: "", aiRecommendRefineFrequencyPenalty: "",
    aiRecommendRefineSeed: "", aiRecommendRefineStopSequences: "", defaultPlaybackRate: 1, fixedWaveZoom: 2,
    contractMode: "dom-guarded", shortcuts: Object.fromEntries(BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS.map((item) => [item.key, null])),
  });
  const taizhouAidp = (id, enabled) => ({
    id, enabled, platformAiEnabled: false, segmentContextPaddingMs: 300, segmentSilenceThresholdDbfs: -31,
    mergeContiguousSuggestedSegmentsEnabled: true, segmentPreviewAutoApplyEnabled: true,
    aiRecommendEnabled: enabled, aiRecommendAutoFillEnabled: true, aiRecommendRequestTimeoutMs: 60000,
    aiRecommendOmniModel: "qwen3.5-omni-plus", aiRecommendOmniPrompt: "", aiRecommendOmniTemperature: "",
    aiRecommendOmniTopP: "", aiRecommendOmniMaxTokens: "", aiRecommendOmniMaxCompletionTokens: "",
    aiRecommendOmniPresencePenalty: "", aiRecommendOmniFrequencyPenalty: "", aiRecommendOmniSeed: "",
    aiRecommendOmniStopSequences: "", defaultPlaybackRate: 1, fixedWaveZoom: 2,
    contractMode: "dom-guarded", shortcuts: Object.fromEntries(BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS.map((item) => [item.key, null])),
  });
  const magicDefaults = {
    id: MAGIC_DATA_HANGZHOU_SCRIPT_ID, enabled: false, aiReviewEnabled: false, aiReviewModelMode: "two_stage",
    aiReviewRecognitionStrategy: "direct_dialect", aiReviewRecognitionMode: "two_stage",
    aiReviewListenModel: "qwen3.5-omni-flash", aiReviewCompareModel: "qwen3.5-flash",
    aiReviewSingleModel: "qwen3.5-omni-flash", aiReviewEnableThinking: false,
    listenModel: "qwen3.5-omni-flash", reviewModel: "qwen3.5-flash", reviewMode: "rule_first",
    showHeardText: true, showEstimatedIncome: true, enableThinking: false, aiReviewRequestTimeoutMs: 60000,
    aiReviewListenPrompt: "", aiReviewComparePrompt: "", aiReviewTemperature: "", aiReviewTopP: "",
    aiReviewMaxTokens: "", aiReviewMaxCompletionTokens: "", aiReviewPresencePenalty: "",
    aiReviewFrequencyPenalty: "", aiReviewSeed: "", aiReviewStopSequences: "", shortcuts: {},
  };
  const DEFAULT_SETTINGS = {
    platforms: {
      dataBakerCvpc: { enabled: true, scripts: { liuzhouAssistant: {
        id: DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID, enabled: true, segmentPreviewEnabled: true,
        segmentPreviewAutoApplyEnabled: true, aiRecommendAutoFillEnabled: true,
        recommendationValidityAutoCorrectEnabled: true, segmentContextPaddingMs: 200,
        segmentSilenceThresholdDbfs: -27, segmentSilenceThresholdUnit: "db", blockNewTabEditingTips: true,
        blockPauseStateTips: true, segmentPreviewEndpoint: DEFAULT_BACKEND_BASE_URLS.server + DATA_BAKER_CVPC_SEGMENT_PREVIEW_PATH,
        aiRecommendEnabled: true, aiRecommendEndpoint: DEFAULT_BACKEND_BASE_URLS.server + DATA_BAKER_CVPC_AI_RECOMMEND_PATH,
        aiRecommendRequestTimeoutMs: 60000, aiRecommendListenModel: "qwen3.5-omni-flash", aiRecommendListenPrompt: "",
        aiRecommendListenIncludeLexiconReference: false, aiRecommendListenTemperature: "", aiRecommendListenTopP: "",
        aiRecommendListenMaxTokens: "", aiRecommendListenMaxCompletionTokens: "", aiRecommendListenPresencePenalty: "",
        aiRecommendListenFrequencyPenalty: "", aiRecommendListenSeed: "", aiRecommendListenStopSequences: "",
        aiRecommendRefineModel: "qwen3.5-plus", aiRecommendRefinePrompt: "", aiRecommendRefineTemperature: "",
        aiRecommendRefineTopP: "", aiRecommendRefineMaxTokens: "", aiRecommendRefineMaxCompletionTokens: "",
        aiRecommendRefinePresencePenalty: "", aiRecommendRefineFrequencyPenalty: "", aiRecommendRefineSeed: "",
        aiRecommendRefineStopSequences: "", contractMode: "dom-guarded", shortcuts: {},
      } } },
      bytedanceAidp: { enabled: true, activeScriptId: BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID, scripts: {
        suzhouHelper: { ...baseAidp(BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID, true), aiRecommendEndpoint: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_PATH },
        jinhuaHelper: { ...baseAidp(BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID, false), aiRecommendEndpoint: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_PATH },
        taizhouHelper: { ...taizhouAidp(BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID, false), aiRecommendEndpoint: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_PATH },
      } },
      magicData: { enabled: true, activeScriptId: "", scripts: { hangzhouHelper: { ...magicDefaults } } },
    },
    meta: { schemaVersion: SCHEMA_VERSION, backendEndpointMode: "server", backendBaseUrls: { ...DEFAULT_BACKEND_BASE_URLS },
      aiUsageOperatorName: "", aiCallLogDownloadOperatorName: "", publicCenterPlatformOrder: [],
      lastBootstrapReason: null, lastBootstrappedAt: null },
    scriptCenter: { projects: { [MAGIC_DATA_HANGZHOU_SCRIPT_ID]: { ...magicDefaults } } },
  };

  function isPlatformVisible(platformId) { return Object.prototype.hasOwnProperty.call(PLATFORM_LIBRARY, platformId); }
  function isScriptVisible(scriptId) { return Object.prototype.hasOwnProperty.call(SCRIPT_LIBRARY, scriptId); }
  function booleanOrDefault(value, fallback) {
    return typeof value === "boolean" ? value : fallback === true;
  }
  function stringOrDefault(source, key, fallback) {
    return source && Object.prototype.hasOwnProperty.call(source, key)
      ? String(source[key] || "").trim()
      : String(fallback || "").trim();
  }
  function isScriptRuntimeAccessible(scriptId, settings) {
    if (!isScriptVisible(scriptId)) return false;
    const source = settings && typeof settings === "object" ? settings : {};
    if (scriptId === DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID) {
      const fallbackPlatform = DEFAULT_SETTINGS.platforms.dataBakerCvpc;
      const platform = source.platforms?.dataBakerCvpc || {};
      const fallbackScript = fallbackPlatform.scripts.liuzhouAssistant;
      const script = platform.scripts?.liuzhouAssistant || {};
      return Boolean(
        booleanOrDefault(platform.enabled, fallbackPlatform.enabled) &&
          booleanOrDefault(script.enabled, fallbackScript.enabled)
      );
    }
    if (
      scriptId === BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID ||
      scriptId === BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID ||
      scriptId === BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID
    ) {
      const fallbackPlatform = DEFAULT_SETTINGS.platforms.bytedanceAidp;
      const platform = source.platforms?.bytedanceAidp || {};
      const scriptKey =
        scriptId === BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID
          ? "jinhuaHelper"
          : scriptId === BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID
            ? "taizhouHelper"
            : "suzhouHelper";
      const fallbackScript = fallbackPlatform.scripts[scriptKey];
      const script = platform.scripts?.[scriptKey] || {};
      const activeScriptId = stringOrDefault(
        platform,
        "activeScriptId",
        fallbackPlatform.activeScriptId
      );
      return Boolean(
        booleanOrDefault(platform.enabled, fallbackPlatform.enabled) &&
          booleanOrDefault(script.enabled, fallbackScript.enabled) &&
          (!activeScriptId || activeScriptId === scriptId)
      );
    }
    if (scriptId === MAGIC_DATA_HANGZHOU_SCRIPT_ID) {
      const fallbackPlatform = DEFAULT_SETTINGS.platforms.magicData;
      const platform = source.platforms?.magicData || {};
      const fallbackScript = fallbackPlatform.scripts.hangzhouHelper;
      const script = platform.scripts?.hangzhouHelper || {};
      const activeScriptId = stringOrDefault(
        platform,
        "activeScriptId",
        fallbackPlatform.activeScriptId
      );
      return Boolean(
        booleanOrDefault(platform.enabled, fallbackPlatform.enabled) &&
          booleanOrDefault(script.enabled, fallbackScript.enabled) &&
          booleanOrDefault(script.aiReviewEnabled, fallbackScript.aiReviewEnabled) &&
          (!activeScriptId || activeScriptId === scriptId)
      );
    }
    return false;
  }
  function buildPlatformEntryDescriptor(platform) {
    const source = platform || {};
    return { displayHost: source.displayHost || source.host || "", entryUrl: source.entryUrl || "" };
  }

  const api = {
    EXTENSION_NAME, STAGE_LABEL, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_AI_REQUEST_TIMEOUT_MS,
    BACKEND_ENDPOINT_MODE_SERVER, BACKEND_ENDPOINT_MODE_LOCAL, DEFAULT_BACKEND_BASE_URLS,
    DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID, BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID,
    BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID, BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID, MAGIC_DATA_HANGZHOU_SCRIPT_ID,
    DATA_BAKER_CVPC_AI_RECOMMEND_PATH, DATA_BAKER_CVPC_SEGMENT_PREVIEW_PATH,
    BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_PATH, BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_PATH, BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_PATH,
    DATA_BAKER_CVPC_PLATFORM, BYTEDANCE_AIDP_PLATFORM, MAGIC_DATA_PLATFORM,
    PLATFORM_LIBRARY, SCRIPT_LIBRARY, BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS,
    BYTEDANCE_AIDP_JINHUA_SHORTCUT_ACTIONS, BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS, DEFAULT_SETTINGS,
    normalizeBackendEndpointMode, getBackendBaseUrlsFromSettings, getBackendEndpointModeFromSettings,
    getBackendBaseUrlByMode, buildBackendUrl, isPlatformVisible, isScriptVisible,
    isScriptRuntimeAccessible, buildPlatformEntryDescriptor,
    BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_SERVER_ENDPOINT: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_PATH,
    BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_SERVER_ENDPOINT: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_PATH,
    BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_SERVER_ENDPOINT: DEFAULT_BACKEND_BASE_URLS.server + BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_PATH,
  };
  globalThis.ASREdgeConstants = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
