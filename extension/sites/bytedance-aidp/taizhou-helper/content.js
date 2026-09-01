(function () {
  if (globalThis.ASREdgeBytedanceAidpTaizhouContent) {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = globalThis.ASREdgeBytedanceAidpTaizhouContent;
    }
    return;
  }

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const dataApiFactory = globalThis.ASREdgeBytedanceAidpTaizhouDataApi || null;
  const recordingFactory =
    globalThis.ASREdgeBytedanceAidpTaizhouRecordingIntegration || null;
  const aiFactory = globalThis.ASREdgeBytedanceAidpTaizhouAiRecommendation || null;
  const segmentFactory = globalThis.ASREdgeBytedanceAidpTaizhouSegmentation || null;
  const uiFactory = globalThis.ASREdgeBytedanceAidpTaizhouUiPanel || null;
  const shortcutFactory = globalThis.ASREdgeBytedanceAidpTaizhouShortcuts || null;
  const SCRIPT_ID =
    CONSTANTS.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID || "bytedanceAidpTaizhouHelper";
  const AI_PATH = "/api/bytedance-aidp/taizhou-helper/ai/recommend";
  const SEGMENT_PREVIEW_PATH = "/api/bytedance-aidp/taizhou-helper/segment/preview";
  const PLAYBACK_RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const FIXED_WAVE_ZOOM_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_SEGMENT_SILENCE_THRESHOLD_DBFS = -31;
  const DEFAULT_SEGMENT_CONTEXT_PADDING_MS = 300;
  const DEFAULT_PLAYBACK_RATE = 1;
  const DEFAULT_FIXED_WAVE_ZOOM = 2;
  const DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED = true;
  const DEFAULT_SEGMENT_PREVIEW_AUTO_APPLY_ENABLED = true;
  const DEFAULT_AI_RECOMMEND_AUTO_FILL_ENABLED = true;
  const RECORDING_AUTOMATION_TIMEOUT_MS = 20000;
  const RECORDING_AUTOMATION_POLL_INTERVAL_MS = 200;
  const RECORDING_AUTOMATION_NETWORK_QUIET_MS = 1000;
  const RECORDING_AUTOMATION_POSTPONABLE_STATUSES = new Set(["AVAILABLE", "SUBMITTED"]);
  const COMMON_READY_MESSAGE =
    "台州话脚本已就绪，可使用当前页面中的辅助功能。";
  const TOOLBAR_ACTION_GROUP_ATTR = "data-asc-toolbar-action-group";
  const CLEAR_SEGMENTS_BUTTON_ATTR = "data-asc-clear-segments-button";
  const FILL_LANGUAGE_KIND_BUTTON_ATTR = "data-asc-fill-language-kind-button";
  const RECORDING_IMPORT_BUTTON_ATTR = "data-asc-recording-import-button";
  const HIDE_AUXILIARY_ZONE_BUTTON_ATTR = "data-asc-hide-auxiliary-zone-button";
  const ACCOUNT_SWITCH_BAR_ATTR = "data-asc-aidp-account-switch-bar";
  const ACCOUNT_SWITCH_BUTTON_ATTR = "data-asc-aidp-account-switch-button";
  const ACCOUNT_SWITCH_STATUS_ATTR = "data-asc-aidp-account-switch-status";
  const REVISE_IMPORT_CARD_ATTR = "data-asc-taizhou-revise-import-card";
  const SEGMENT_RECOGNIZE_HEADER_ATTR = "data-asc-segment-recognize-header";
  const SEGMENT_RECOGNIZE_CELL_ATTR = "data-asc-segment-recognize-cell";
  const SEGMENT_RECOGNIZE_BUTTON_ATTR = "data-asc-segment-recognize-button";
  const SEGMENT_RECOGNIZE_ACTION_ATTR = "data-asc-segment-recognize-action";
  const HIDDEN_ATTR = "data-asc-platform-ai-hidden";
  const HIDDEN_OWNER_ATTR = "data-asc-platform-ai-hidden-by";
  const EXACT_PLATFORM_AI_SELECTORS = {
    insight: ".insight-container-Hn0Gna",
    trigger: ".trigger-wrapper-RlG7Dx",
  };
  const INSIGHT_TEXT_ANCHORS = [
    "AI 洞察",
    "统计周期",
    "前往数据看板",
    "立即生成",
  ];
  const FLOATING_HINT_PATTERN = /(trigger|assistant|avatar|chat|robot|float)/i;
  const OBSERVED_ATTRIBUTE_NAMES = [
    "class",
    "style",
    "hidden",
    "aria-hidden",
  ];
  const TAIZHOU_PANEL_ROOT_ATTR = "data-asc-bytedance-aidp-taizhou-panel";

  let runtimeActive = false;
  let runtimePolicy = {
    runtimeAccessible: false,
    enabled: true,
    platformAiEnabled: false,
    shouldHidePlatformAi: false,
    contractMode: "dom-guarded",
  };
  let mutationObserver = null;
  let routeTimer = null;
  let domSyncTimer = null;
  let helperSyncTimer = null;
  let playbackRateSyncToken = 0;
  let playbackRateAutoSyncState = {
    target: null,
    scopeKey: "",
    status: "idle",
  };
  let waveZoomSyncToken = 0;
  let waveZoomAutoSyncState = {
    target: null,
    status: "idle",
  };
  let wavePlaybackActivityState = {
    lastElapsedMs: null,
    lastObservedAt: 0,
    activeUntil: 0,
  };
  const PLAYBACK_SCROLL_GUARD_USER_WINDOW_MS = 900;
  const PLAYBACK_SCROLL_GUARD_IGNORE_WINDOW_MS = 80;
  const PLAYBACK_SCROLL_GUARD_WATCHDOG_INTERVAL_MS = 120;
  let playbackScrollGuardWatchdogTimer = null;
  let storageListenerBound = false;
  let helperRuntime = null;
  let managementUiActive = false;
  let reviseListRuntime = null;
  let managementSettings = null;
  let taizhouAuxiliaryZonesHidden = false;

  function createPlaybackScrollGuardTargetState(name) {
    return {
      name: name,
      node: null,
      baselineTop: 0,
      baselineLeft: 0,
      lastUserIntentAt: 0,
      pointerActive: false,
      ignoreScrollUntil: 0,
      cleanup: [],
      styleRestore: null,
    };
  }

  function createPlaybackScrollGuardState() {
    return {
      active: false,
      root: null,
      globalCleanup: [],
      detail: createPlaybackScrollGuardTargetState("detail"),
      table: createPlaybackScrollGuardTargetState("table"),
    };
  }

  let playbackScrollGuardState = createPlaybackScrollGuardState();

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeSegmentContextPaddingMs(value, fallback) {
    const fallbackNumber = Number.isFinite(Number(fallback)) ? Math.round(Number(fallback)) : 300;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNumber;
    }
    const rounded = Math.round(numeric);
    if (rounded < 0 || rounded > 500) {
      return fallbackNumber;
    }
    return rounded;
  }

  function normalizeSegmentSilenceThresholdDbfs(value, fallback) {
    const fallbackNumber = Number.isFinite(Number(fallback)) ? Math.round(Number(fallback)) : -31;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNumber;
    }
    const rounded = Math.round(numeric);
    if (rounded < -80 || rounded > -5) {
      return fallbackNumber;
    }
    return rounded;
  }

  function normalizePlaybackRate(value, fallback) {
    const fallbackNumber = Number.isFinite(Number(fallback)) ? Number(fallback) : 1;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNumber;
    }
    const rounded = Number(numeric.toFixed(2));
    if (PLAYBACK_RATE_PRESETS.indexOf(rounded) < 0) {
      return fallbackNumber;
    }
    return rounded;
  }

  function normalizeFixedWaveZoom(value, fallback) {
    const fallbackNumber = Number.isFinite(Number(fallback)) ? Number(fallback) : 2;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNumber;
    }
    const rounded = Math.round(numeric);
    if (rounded !== numeric || FIXED_WAVE_ZOOM_PRESETS.indexOf(rounded) < 0) {
      return fallbackNumber;
    }
    return rounded;
  }

  function normalizeAiRequestTimeoutMs(value, fallback) {
    const fallbackNumber = Number.isFinite(Number(fallback)) ? Math.round(Number(fallback)) : DEFAULT_TIMEOUT_MS;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNumber;
    }
    return Math.max(1000, Math.min(DEFAULT_TIMEOUT_MS, Math.round(numeric)));
  }

  function normalizeStageModel(value, fallback) {
    const model = normalizeText(value);
    return model || normalizeText(fallback);
  }

  function normalizeStagePrompt(value) {
    return String(value || "");
  }

  function normalizeStageParamValue(value, options) {
    const source = options && typeof options === "object" ? options : {};
    if (value === "" || value === null || value === undefined) {
      return "";
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "";
    }
    const min = Number.isFinite(Number(source.min)) ? Number(source.min) : numeric;
    const max = Number.isFinite(Number(source.max)) ? Number(source.max) : numeric;
    const clamped = Math.max(min, Math.min(max, numeric));
    if (source.integer === true) {
      return Math.round(clamped);
    }
    return Number(clamped.toFixed(3));
  }

  function buildAiStageParams(source, prefix) {
    const current = source && typeof source === "object" ? source : {};
    const result = {};
    const params = [
      ["Temperature", "temperature", { min: 0, max: 2 }],
      ["TopP", "top_p", { min: 0, max: 1 }],
      ["MaxTokens", "max_tokens", { min: 1, max: 8192, integer: true }],
      [
        "MaxCompletionTokens",
        "max_completion_tokens",
        { min: 1, max: 8192, integer: true },
      ],
      ["PresencePenalty", "presence_penalty", { min: -2, max: 2 }],
      ["FrequencyPenalty", "frequency_penalty", { min: -2, max: 2 }],
      ["Seed", "seed", { min: 0, max: 2147483647, integer: true }],
    ];
    params.forEach(function (definition) {
      const value = normalizeStageParamValue(current[prefix + definition[0]], definition[2]);
      if (value !== "") {
        result[definition[1]] = value;
      }
    });
    const stopSequences = String(current[prefix + "StopSequences"] || "")
      .split(/\r?\n|,/)
      .map(function (item) {
        return normalizeText(item);
      })
      .filter(Boolean)
      .slice(0, 8);
    if (stopSequences.length > 0) {
      result.stop = stopSequences;
    }
    return result;
  }

  function getShortcutActionDefinitions() {
    return Array.isArray(CONSTANTS.BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS)
      ? CONSTANTS.BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS
      : [
          { key: "togglePlayPause" },
          { key: "playSelection" },
          { key: "jumpToFirstFrame" },
          { key: "deleteCurrentSelection" },
          { key: "clearSegments" },
          { key: "previewSegments" },
          { key: "applyPreviewSegments" },
        ];
  }

  function normalizeShortcutValue(shortcut, fallback) {
    if (shortcut === null) {
      return null;
    }
    const source = shortcut && typeof shortcut === "object" ? shortcut : fallback || null;
    if (!source || typeof source !== "object") {
      return null;
    }
    const key = normalizeText(source.key);
    const button =
      typeof source.button === "number" && Number.isFinite(source.button)
        ? Number(source.button)
        : null;
    if (!key && button === null) {
      return null;
    }
    return {
      ctrl: source.ctrl === true,
      alt: source.alt === true,
      shift: source.shift === true,
      meta: source.meta === true,
      key: key,
      button: button,
    };
  }

  function normalizeShortcutMap(shortcuts, fallback) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
    const result = {};
    getShortcutActionDefinitions().forEach(function (action) {
      const key = action.key;
      result[key] =
        Object.prototype.hasOwnProperty.call(source, key)
          ? normalizeShortcutValue(source[key], fallbackSource[key] || null)
          : normalizeShortcutValue(fallbackSource[key] || null, null);
    });
    return result;
  }

  function formatControlValue(value) {
    return String(Number(value))
      .replace(/\.0$/, "")
      .replace(/(\.\d*?)0+$/, "$1");
  }

  function formatPlaybackRateLabel(value) {
    return Number(value).toFixed(2) + "倍速";
  }

  function getCurrentPlaybackScopeKey() {
    const pathname = normalizeText(globalThis.location?.pathname || "");
    const search = normalizeText(globalThis.location?.search || "");
    return pathname + search;
  }

  function isDetailPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return (
      /^\/management\/task-v2\/[^/]+\/mark-v3\/[^/]+$/i.test(text) ||
      /^\/management\/task-v2\/[^/]+\/modify-v2\/4\/[^/]+$/i.test(text) ||
      isReadOnlyScanPagePathname(text)
    );
  }

  function isModifyPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return /^\/management\/task-v2\/[^/]+\/modify-v2\/4\/[^/]+$/i.test(text);
  }

  function isReviseListPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return /^\/management\/task-v2\/[^/]+\/node\/14\/revise$/i.test(text);
  }

  function isReadOnlyScanPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return (
      /^\/management\/task-v2\/[^/]+\/scan-v3\/(?:14|17)\/[^/]+$/i.test(text) ||
      /^\/management\/task-v2\/[^/]+\/mark-package\/[^/]+\/(?:14|17)$/i.test(text)
    );
  }

  function isInternalQualityPackagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return /^\/management\/task-v2\/[^/]+\/mark-package\/[^/]+\/17$/i.test(text);
  }

  function getCurrentInternalQualityPackageItemId(locationLike) {
    const currentLocation = locationLike || globalThis.location || {};
    if (!isInternalQualityPackagePathname(currentLocation.pathname || "")) {
      return "";
    }
    try {
      return normalizeText(
        new URLSearchParams(String(currentLocation.search || "")).get("itemID")
      );
    } catch (_error) {
      return "";
    }
  }

  function resolveHelperPageCapabilities(pathname) {
    const resolvedPathname =
      pathname === undefined ? globalThis.location?.pathname || "" : pathname;
    const readOnly = isReadOnlyScanPagePathname(resolvedPathname);
    const modify = isModifyPagePathname(resolvedPathname);
    const recordingEnabled = isDetailPagePathname(resolvedPathname);
    const internalQualitySubmitAutomationEnabled =
      isInternalQualityPackagePathname(resolvedPathname);
    return {
      readOnly: readOnly || modify,
      recordingImportEnabled: recordingEnabled,
      recordingAutomationEnabled: recordingEnabled && !modify,
      recordingResultFillEnabled: modify,
      internalQualitySubmitAutomationEnabled: internalQualitySubmitAutomationEnabled,
    };
  }

  function isManagementPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return /^\/management(?:\/.*)?$/i.test(text);
  }

  function isDetailPage() {
    try {
      return isDetailPagePathname(globalThis.location?.pathname || "");
    } catch (_error) {
      return false;
    }
  }

  function isManagementPage() {
    try {
      return isManagementPagePathname(globalThis.location?.pathname || "");
    } catch (_error) {
      return false;
    }
  }

  function isTaskListPagePathname(pathname) {
    const text = normalizeText(pathname).replace(/\?.*$/, "").replace(/\/+$/, "");
    return /^\/management\/task-v2$/i.test(text);
  }

  function isHideableNode(node) {
    return Boolean(
      node &&
        node.nodeType === 1 &&
        String(node.tagName || "").toUpperCase() !== "DOCUMENT" &&
        typeof node.setAttribute === "function" &&
        typeof node.getAttribute === "function" &&
        typeof node.removeAttribute === "function" &&
        node.style &&
        typeof node.style.setProperty === "function" &&
        typeof node.style.removeProperty === "function"
    );
  }

  function getDefaultScriptConfig() {
    return (
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.bytedanceAidp?.scripts?.taizhouHelper || {
        id: SCRIPT_ID,
        enabled: true,
        platformAiEnabled: false,
        segmentContextPaddingMs: DEFAULT_SEGMENT_CONTEXT_PADDING_MS,
        segmentSilenceThresholdDbfs: DEFAULT_SEGMENT_SILENCE_THRESHOLD_DBFS,
        mergeContiguousSuggestedSegmentsEnabled:
          DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED,
        segmentPreviewAutoApplyEnabled: DEFAULT_SEGMENT_PREVIEW_AUTO_APPLY_ENABLED,
        aiRecommendEnabled: true,
        aiRecommendEndpoint:
          CONSTANTS.BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_SERVER_ENDPOINT ||
          "https://annotation-script-center.xiangtianzhen.store/api/bytedance-aidp/taizhou-helper/ai/recommend",
        aiRecommendRequestTimeoutMs: DEFAULT_TIMEOUT_MS,
        aiRecommendEnableThinking: false,
        aiRecommendOmniModel: "qwen3.5-omni-plus",
        aiRecommendOmniPrompt: "",
        defaultPlaybackRate: DEFAULT_PLAYBACK_RATE,
        fixedWaveZoom: DEFAULT_FIXED_WAVE_ZOOM,
        recordingImportTaskCode: "",
        contractMode: "dom-guarded",
        shortcuts: {},
      }
    );
  }

  function resolveHelperConfig(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const defaults = getDefaultScriptConfig();
    const current = source?.platforms?.bytedanceAidp?.scripts?.taizhouHelper || {};
    const endpointBuilder =
      typeof CONSTANTS.buildBackendUrl === "function"
        ? CONSTANTS.buildBackendUrl
        : function (path) {
            return "http://127.0.0.1:3333" + String(path || "");
          };
    return {
      segmentContextPaddingMs: normalizeSegmentContextPaddingMs(
        current.segmentContextPaddingMs,
        defaults.segmentContextPaddingMs
      ),
      segmentSilenceThresholdDbfs: normalizeSegmentSilenceThresholdDbfs(
        current.segmentSilenceThresholdDbfs,
        defaults.segmentSilenceThresholdDbfs
      ),
      mergeContiguousSuggestedSegmentsEnabled:
        current.mergeContiguousSuggestedSegmentsEnabled === false
          ? false
          : defaults.mergeContiguousSuggestedSegmentsEnabled !== false,
      segmentPreviewAutoApplyEnabled:
        current.segmentPreviewAutoApplyEnabled === false
          ? false
          : defaults.segmentPreviewAutoApplyEnabled !== false,
      aiRecommendEnabled:
        (current.aiRecommendEnabled ?? defaults.aiRecommendEnabled) !== false,
      aiRecommendEndpoint:
        normalizeText(current.aiRecommendEndpoint) || endpointBuilder(AI_PATH, settings),
      aiRecommendRequestTimeoutMs: normalizeAiRequestTimeoutMs(
        current.aiRecommendRequestTimeoutMs,
        defaults.aiRecommendRequestTimeoutMs || DEFAULT_TIMEOUT_MS
      ),
      aiOmni: {
        enableThinking: current.aiRecommendEnableThinking === true,
        model: normalizeStageModel(
          current.aiRecommendOmniModel,
          defaults.aiRecommendOmniModel || "qwen3.5-omni-plus"
        ),
        prompt: normalizeStagePrompt(current.aiRecommendOmniPrompt || defaults.aiRecommendOmniPrompt),
        params: buildAiStageParams(current, "aiRecommendOmni"),
      },
      defaultPlaybackRate: normalizePlaybackRate(
        current.defaultPlaybackRate,
        defaults.defaultPlaybackRate
      ),
      fixedWaveZoom: normalizeFixedWaveZoom(
        current.fixedWaveZoom,
        defaults.fixedWaveZoom
      ),
      recordingImportTaskCode: normalizeText(
        current.recordingImportTaskCode || defaults.recordingImportTaskCode
      ),
      settings: settings,
      aiUsageOperatorName: normalizeText(settings?.meta?.aiUsageOperatorName || ""),
      shortcuts: normalizeShortcutMap(current.shortcuts, defaults.shortcuts),
    };
  }

  function resolveSegmentPreviewEndpoint(settings) {
    if (typeof CONSTANTS.buildBackendUrl === "function") {
      return CONSTANTS.buildBackendUrl(SEGMENT_PREVIEW_PATH, settings || {});
    }
    return "http://127.0.0.1:3333" + SEGMENT_PREVIEW_PATH;
  }

  function resolveRuntimePolicy(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const defaults = getDefaultScriptConfig();
    const current = source?.platforms?.bytedanceAidp?.scripts?.taizhouHelper || {};
    const platformEnabled = source?.platforms?.bytedanceAidp?.enabled !== false;
    const enabled = current.enabled !== false;
    const platformAiEnabled =
      current.platformAiEnabled !== undefined
        ? current.platformAiEnabled !== false
        : defaults.platformAiEnabled !== false;
    const contractMode =
      normalizeText(current.contractMode || defaults.contractMode || "dom-guarded") ||
      "dom-guarded";
    const runtimeAccessible =
      typeof CONSTANTS.isScriptRuntimeAccessible === "function"
        ? CONSTANTS.isScriptRuntimeAccessible(SCRIPT_ID, source)
        : platformEnabled && enabled;
    return {
      runtimeAccessible: runtimeAccessible === true,
      enabled: enabled,
      platformAiEnabled: platformAiEnabled,
      shouldHidePlatformAi: runtimeAccessible === true && platformAiEnabled === false,
      contractMode: contractMode,
    };
  }

  function hidePlatformAiNode(node) {
    if (!isHideableNode(node)) {
      return false;
    }

    const alreadyHidden = node.getAttribute(HIDDEN_ATTR) === "true";
    const previousOwner = normalizeText(node.getAttribute(HIDDEN_OWNER_ATTR));
    if (!alreadyHidden) {
      node.__ascPrevDisplayValue =
        typeof node.style.getPropertyValue === "function"
          ? String(node.style.getPropertyValue("display") || "")
          : "";
      node.__ascPrevDisplayPriority =
        typeof node.style.getPropertyPriority === "function"
          ? String(node.style.getPropertyPriority("display") || "")
          : "";
    }
    node.setAttribute(HIDDEN_ATTR, "true");
    node.setAttribute(HIDDEN_OWNER_ATTR, SCRIPT_ID);

    const currentDisplayValue =
      typeof node.style.getPropertyValue === "function"
        ? String(node.style.getPropertyValue("display") || "")
        : "";
    const currentDisplayPriority =
      typeof node.style.getPropertyPriority === "function"
        ? String(node.style.getPropertyPriority("display") || "")
        : "";
    node.style.setProperty("display", "none", "important");
    return (
      alreadyHidden !== true ||
      previousOwner !== SCRIPT_ID ||
      currentDisplayValue !== "none" ||
      currentDisplayPriority !== "important"
    );
  }

  function restorePlatformAiNode(node) {
    if (!isHideableNode(node) || node.getAttribute(HIDDEN_ATTR) !== "true") {
      return false;
    }
    const hiddenBy = normalizeText(node.getAttribute(HIDDEN_OWNER_ATTR));
    if (hiddenBy && hiddenBy !== SCRIPT_ID) {
      return false;
    }

    const previousValue =
      typeof node.__ascPrevDisplayValue === "string" ? node.__ascPrevDisplayValue : "";
    const previousPriority =
      typeof node.__ascPrevDisplayPriority === "string" ? node.__ascPrevDisplayPriority : "";
    if (previousValue) {
      node.style.setProperty("display", previousValue, previousPriority);
    } else {
      node.style.removeProperty("display");
    }
    delete node.__ascPrevDisplayValue;
    delete node.__ascPrevDisplayPriority;
    node.removeAttribute(HIDDEN_ATTR);
    node.removeAttribute(HIDDEN_OWNER_ATTR);
    return true;
  }

  function applyPlatformAiVisibility(nodes, shouldHide) {
    const list = Array.isArray(nodes) ? nodes : [];
    let changed = 0;
    list.forEach(function (node) {
      changed += shouldHide
        ? hidePlatformAiNode(node)
          ? 1
          : 0
        : restorePlatformAiNode(node)
          ? 1
          : 0;
    });
    return changed;
  }

  function getChildElements(node) {
    if (!node) {
      return [];
    }
    if (node.children && typeof node.children.length === "number") {
      return Array.from(node.children).filter(function (child) {
        return child && child.nodeType === 1;
      });
    }
    if (node.childNodes && typeof node.childNodes.length === "number") {
      return Array.from(node.childNodes).filter(function (child) {
        return child && child.nodeType === 1;
      });
    }
    return [];
  }

  function collectDescendantElements(root) {
    const results = [];
    (function visit(node) {
      getChildElements(node).forEach(function (child) {
        results.push(child);
        visit(child);
      });
    })(root);
    return results;
  }

  function safeQuerySelectorAll(root, selector) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return [];
    }
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (_error) {
      return [];
    }
  }

  function safeGetIframeDocument(iframeNode) {
    if (!iframeNode) {
      return null;
    }
    try {
      const iframeDocument = iframeNode.contentDocument || iframeNode.contentWindow?.document || null;
      return iframeDocument && typeof iframeDocument.querySelectorAll === "function"
        ? iframeDocument
        : null;
    } catch (_error) {
      return null;
    }
  }

  function getSearchRoots(root) {
    const queue = [];
    const seen = new Set();
    const results = [];

    function enqueue(candidate) {
      if (!candidate || seen.has(candidate) || typeof candidate.querySelectorAll !== "function") {
        return;
      }
      seen.add(candidate);
      queue.push(candidate);
      results.push(candidate);
    }

    enqueue(root);
    while (queue.length > 0) {
      const current = queue.shift();
      safeQuerySelectorAll(current, "iframe").forEach(function (iframeNode) {
        enqueue(safeGetIframeDocument(iframeNode));
      });
    }
    return results;
  }

  function getClassName(node) {
    return String(node?.className || node?.getAttribute?.("class") || "");
  }

  function getNodeText(node) {
    return normalizeText(node?.textContent || node?.innerText || "");
  }

  function dispatchControlEvent(node, type) {
    if (!node || typeof node.dispatchEvent !== "function") {
      return;
    }
    try {
      if (typeof Event === "function") {
        node.dispatchEvent(new Event(type, { bubbles: true }));
        return;
      }
    } catch (_error) {
      // Fall through to plain event object.
    }
    node.dispatchEvent({ type: type, bubbles: true });
  }

  function dispatchKeyboardEvent(node, type, key) {
    if (!node || typeof node.dispatchEvent !== "function") {
      return;
    }
    try {
      if (typeof KeyboardEvent === "function") {
        node.dispatchEvent(
          new KeyboardEvent(type, {
            bubbles: true,
            key: key,
            code: key,
          })
        );
        return;
      }
    } catch (_error) {
      // Fall through to plain event object.
    }
    node.dispatchEvent({
      type: type,
      bubbles: true,
      key: key,
      code: key,
    });
  }

  function setControlValue(node, nextValue) {
    if (!node || nextValue === undefined || nextValue === null) {
      return false;
    }
    const text = formatControlValue(nextValue);
    if (String(node.value || "") === text) {
      return false;
    }
    node.value = text;
    dispatchControlEvent(node, "input");
    dispatchControlEvent(node, "change");
    dispatchControlEvent(node, "blur");
    return true;
  }

  function waitFor(delayMs) {
    const timeout = Math.max(0, Number(delayMs) || 0);
    if (timeout <= 0 || typeof setTimeout !== "function") {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      setTimeout(resolve, timeout);
    });
  }

  function invokeClick(node) {
    if (!node) {
      return false;
    }
    if (typeof node.click === "function") {
      node.click();
      return true;
    }
    dispatchControlEvent(node, "click");
    return true;
  }

  function focusControl(node) {
    if (node && typeof node.focus === "function") {
      node.focus();
      return true;
    }
    return false;
  }

  function getStylePropertyValue(node, propertyName) {
    if (!node) {
      return "";
    }
    const name = String(propertyName || "");
    if (node.style && typeof node.style.getPropertyValue === "function") {
      const inlineValue = String(node.style.getPropertyValue(name) || "");
      if (inlineValue) {
        return inlineValue;
      }
    }
    if (
      typeof globalThis.getComputedStyle === "function" &&
      node.nodeType === 1 &&
      String(node.tagName || "").toUpperCase() !== "DOCUMENT"
    ) {
      try {
        const computedStyle = globalThis.getComputedStyle(node);
        if (computedStyle && typeof computedStyle.getPropertyValue === "function") {
          return String(computedStyle.getPropertyValue(name) || "");
        }
      } catch (_error) {
        // Ignore computed-style failures and keep falling back to inline values.
      }
    }
    return "";
  }

  function parsePixelValue(value) {
    const text = normalizeText(value).toLowerCase();
    if (!text || text === "auto") {
      return null;
    }
    const numeric = Number.parseFloat(text.replace(/px$/i, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  function getNodeRect(node) {
    if (node && typeof node.getBoundingClientRect === "function") {
      try {
        return node.getBoundingClientRect();
      } catch (_error) {
        return null;
      }
    }
    return null;
  }

  function getNodeDimension(node, rect, propertyName) {
    const rectValue = rect && Number.isFinite(rect[propertyName]) ? Number(rect[propertyName]) : 0;
    if (rectValue > 0) {
      return rectValue;
    }
    const styleValue = parsePixelValue(getStylePropertyValue(node, propertyName));
    return styleValue !== null ? styleValue : 0;
  }

  function hasAnchorText(text, anchor) {
    return Boolean(text && anchor && text.includes(anchor));
  }

  function getInsightCandidateScore(node) {
    if (!isHideableNode(node)) {
      return -1;
    }
    const text = getNodeText(node);
    const className = getClassName(node).toLowerCase();
    let score = 0;
    if (hasAnchorText(text, "AI 洞察")) {
      score += 2;
    }
    if (hasAnchorText(text, "统计周期")) {
      score += 1;
    }
    if (hasAnchorText(text, "前往数据看板")) {
      score += 1;
    }
    if (hasAnchorText(text, "立即生成")) {
      score += 1;
    }
    if (className.includes("insight-container")) {
      score += 3;
    } else if (className.includes("insight")) {
      score += 2;
    }
    if (className.includes("analysis")) {
      score += 1;
    }
    const childCount = getChildElements(node).length;
    if (childCount >= 2 && childCount <= 10) {
      score += 1;
    }
    return score;
  }

  function normalizeInsightTarget(node, boundaryRoot) {
    let current = node;
    let bestNode = null;
    let bestScore = -1;
    let depth = 0;
    while (current && current !== boundaryRoot && depth < 8) {
      const score = getInsightCandidateScore(current);
      if (score > bestScore) {
        bestScore = score;
        bestNode = current;
      }
      current = current.parentElement || null;
      depth += 1;
    }
    return bestScore >= 4 ? bestNode : null;
  }

  function pushUniqueNode(results, seen, node) {
    if (!node || seen.has(node)) {
      return;
    }
    seen.add(node);
    results.push(node);
  }

  function isAncestorNode(ancestor, node) {
    let current = node?.parentElement || null;
    while (current) {
      if (current === ancestor) {
        return true;
      }
      current = current.parentElement || null;
    }
    return false;
  }

  function removeBroadAncestorTargets(nodes) {
    return (Array.isArray(nodes) ? nodes : []).filter(function (node) {
      return !nodes.some(function (otherNode) {
        return otherNode !== node && isAncestorNode(node, otherNode);
      });
    });
  }

  function findInsightTargets(root) {
    const seen = new Set();
    const results = [];
    const searchRoots = getSearchRoots(root);

    searchRoots.forEach(function (searchRoot) {
      safeQuerySelectorAll(searchRoot, EXACT_PLATFORM_AI_SELECTORS.insight).forEach(function (node) {
        pushUniqueNode(results, seen, normalizeInsightTarget(node, searchRoot) || node);
      });
    });
    if (results.length > 0) {
      return results;
    }

    searchRoots.forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        if (!hasAnchorText(getNodeText(node), "AI 洞察")) {
          return;
        }
        const normalizedNode = normalizeInsightTarget(node, searchRoot);
        if (normalizedNode) {
          pushUniqueNode(results, seen, normalizedNode);
        }
      });
    });
    return removeBroadAncestorTargets(results);
  }

  function hasMediaDescendant(node) {
    if (!node || typeof node.querySelector === "function") {
      return Boolean(node?.querySelector?.("img,svg,canvas"));
    }
    return collectDescendantElements(node).some(function (child) {
      const tagName = String(child.tagName || "").toLowerCase();
      return tagName === "img" || tagName === "svg" || tagName === "canvas";
    });
  }

  function isTaskExtraInfoToolbar(node) {
    if (!isHideableNode(node)) {
      return false;
    }
    const className = getClassName(node);
    const text = getNodeText(node);
    return (
      className.includes("operation-time-container") ||
      className.includes("task-extra-info") ||
      hasAnchorText(text, "最近暂存时间") ||
      (hasAnchorText(text, "暂存") && hasAnchorText(text, "重置"))
    );
  }

  function getFloatingAssistantScore(node) {
    if (!isHideableNode(node)) {
      return -1;
    }
    if (isTaskExtraInfoToolbar(node)) {
      return -1;
    }
    const position = normalizeText(getStylePropertyValue(node, "position")).toLowerCase();
    if (position !== "fixed" && position !== "absolute") {
      return -1;
    }

    const rect = getNodeRect(node);
    const width = getNodeDimension(node, rect, "width");
    const height = getNodeDimension(node, rect, "height");
    if (width <= 0 || height <= 0 || width > 220 || height > 220) {
      return -1;
    }

    let score = position === "fixed" ? 4 : 2;
    const bottom = parsePixelValue(getStylePropertyValue(node, "bottom"));
    const right = parsePixelValue(getStylePropertyValue(node, "right"));
    if (bottom !== null) {
      score += 1;
      if (bottom <= 120) {
        score += 1;
      }
    }
    if (right !== null) {
      score += 1;
      if (right <= 120) {
        score += 1;
      }
    }

    const className = getClassName(node);
    if (FLOATING_HINT_PATTERN.test(className)) {
      score += 2;
    }
    const text = getNodeText(node);
    if (!text || text.length <= 16) {
      score += 1;
    }
    if (hasMediaDescendant(node)) {
      score += 1;
    }
    if (getChildElements(node).length <= 6) {
      score += 1;
    }
    return score;
  }

  function normalizeFloatingTarget(node, boundaryRoot) {
    let bestNode = isHideableNode(node) ? node : null;
    let bestScore = bestNode ? getFloatingAssistantScore(bestNode) : -1;
    let current = node;
    let depth = 0;
    while (current && current !== boundaryRoot && depth < 6) {
      const parent = current.parentElement || null;
      if (!parent || parent === boundaryRoot) {
        break;
      }
      const parentScore = getFloatingAssistantScore(parent);
      if (parentScore >= bestScore && parentScore >= 4) {
        bestNode = parent;
        bestScore = parentScore;
      }
      current = parent;
      depth += 1;
    }
    return bestScore >= 4 ? bestNode : null;
  }

  function findFloatingAssistantTargets(root) {
    const seen = new Set();
    const results = [];
    const searchRoots = getSearchRoots(root);

    searchRoots.forEach(function (searchRoot) {
      safeQuerySelectorAll(searchRoot, EXACT_PLATFORM_AI_SELECTORS.trigger).forEach(function (node) {
        pushUniqueNode(results, seen, normalizeFloatingTarget(node, searchRoot) || node);
      });
    });
    if (results.length > 0) {
      return results;
    }

    let bestNode = null;
    let bestScore = -1;
    searchRoots.forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        const normalizedNode = normalizeFloatingTarget(node, searchRoot);
        if (!normalizedNode) {
          return;
        }
        const score = getFloatingAssistantScore(normalizedNode);
        if (score > bestScore) {
          bestNode = normalizedNode;
          bestScore = score;
        }
      });
    });
    return bestNode && bestScore >= 7 ? [bestNode] : [];
  }

  function findPlatformAiTargets(root) {
    if (!root) {
      return [];
    }

    const seen = new Set();
    const results = [];
    findInsightTargets(root).forEach(function (node) {
      pushUniqueNode(results, seen, node);
    });
    findFloatingAssistantTargets(root).forEach(function (node) {
      pushUniqueNode(results, seen, node);
    });
    return results;
  }

  function isNodeVisible(node) {
    if (!isHideableNode(node)) {
      return false;
    }
    if (node.hasAttribute?.("hidden")) {
      return false;
    }
    const ariaHidden = normalizeText(node.getAttribute?.("aria-hidden") || "").toLowerCase();
    if (ariaHidden === "true") {
      return false;
    }
    const display = normalizeText(getStylePropertyValue(node, "display")).toLowerCase();
    if (display === "none") {
      return false;
    }
    const visibility = normalizeText(getStylePropertyValue(node, "visibility")).toLowerCase();
    if (visibility === "hidden") {
      return false;
    }
    return true;
  }

  function isEnabledNativeButton(node) {
    if (!node) {
      return false;
    }
    if (node.disabled === true || node.hasAttribute?.("disabled")) {
      return false;
    }
    return normalizeText(node.getAttribute?.("aria-disabled") || "").toLowerCase() !== "true";
  }

  function isNodeAndAncestorsVisible(node) {
    let current = node || null;
    while (
      current &&
      current.nodeType !== 9 &&
      String(current.tagName || "").toUpperCase() !== "DOCUMENT"
    ) {
      if (!isNodeVisible(current)) {
        return false;
      }
      current = current.parentElement || current.parentNode || null;
    }
    return true;
  }

  function findExactVisibleButton(root, label, requireButtonGroup) {
    const normalizedLabel = normalizeText(label);
    const matches = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        const tagName = String(node?.tagName || "").toUpperCase();
        if (
          tagName !== "BUTTON" ||
          getNodeText(node) !== normalizedLabel ||
          !isNodeAndAncestorsVisible(node) ||
          !isEnabledNativeButton(node)
        ) {
          return;
        }
        if (requireButtonGroup === true && !findAncestorWithClassFragment(node, "button-group")) {
          return;
        }
        matches.push(node);
      });
    });
    return {
      node: matches.length === 1 ? matches[0] : null,
      count: matches.length,
    };
  }

  function isCheckedRadioInput(node) {
    return Boolean(node?.checked === true || node?.hasAttribute?.("checked"));
  }

  function getRadioInputValue(node) {
    return String(node?.value ?? node?.getAttribute?.("value") ?? "");
  }

  function getRadioInputLabel(node) {
    const parent = node?.parentElement || node?.parentNode || null;
    return String(parent?.tagName || "").toUpperCase() === "LABEL" ? getNodeText(parent) : "";
  }

  function collectVisibleRadioInputs(root) {
    const inputs = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        if (
          String(node?.tagName || "").toUpperCase() === "INPUT" &&
          normalizeText(node?.getAttribute?.("type") || node?.type).toLowerCase() === "radio" &&
          isNodeAndAncestorsVisible(node) &&
          node.disabled !== true &&
          !node.hasAttribute?.("disabled") &&
          normalizeText(node?.getAttribute?.("aria-disabled")).toLowerCase() !== "true"
        ) {
          inputs.push(node);
        }
      });
    });
    return inputs;
  }

  function readInternalQualitySubmitDecision(root) {
    const radioInputs = collectVisibleRadioInputs(root);
    const retentionInputs = radioInputs.filter(function (node) {
      const value = getRadioInputValue(node);
      return value === "保留" || value === "丢弃";
    });
    const retentionValues = new Set(retentionInputs.map(getRadioInputValue));
    const checkedRetention = retentionInputs.filter(isCheckedRadioInput);
    if (
      retentionInputs.length !== 2 ||
      retentionValues.size !== 2 ||
      !retentionValues.has("保留") ||
      !retentionValues.has("丢弃") ||
      checkedRetention.length !== 1
    ) {
      return { ok: false, reason: "retention-ambiguous" };
    }

    const overallInputs = radioInputs.filter(function (node) {
      const value = getRadioInputValue(node);
      const label = getRadioInputLabel(node);
      return (value === "true" && label === "合格") || (value === "" && label === "不合格");
    });
    const checkedOverall = overallInputs.filter(isCheckedRadioInput);
    if (overallInputs.length !== 2 || checkedOverall.length !== 1) {
      return { ok: false, reason: "overall-quality-ambiguous" };
    }

    const retention = getRadioInputValue(checkedRetention[0]);
    const overallQuality = getRadioInputLabel(checkedOverall[0]);
    if (retention === "丢弃" || overallQuality === "不合格") {
      return { ok: true, action: "direct" };
    }
    if (retention === "保留" && overallQuality === "合格") {
      return { ok: true, action: "correct" };
    }
    return { ok: false, reason: "unsupported-decision" };
  }

  function isReadOnlyScanPage() {
    try {
      return isReadOnlyScanPagePathname(globalThis.location?.pathname || "");
    } catch (_error) {
      return false;
    }
  }

  function getCurrentHelperPageMode(pathname) {
    const resolvedPathname =
      pathname === undefined ? globalThis.location?.pathname || "" : pathname;
    const capabilities = resolveHelperPageCapabilities(resolvedPathname);
    return isModifyPagePathname(resolvedPathname)
      ? "modify-read-only"
      : capabilities.readOnly
        ? "scan-read-only"
        : "mark-write";
  }

  function findExactVisiblePostponeControl(root) {
    const matches = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        const tagName = String(node?.tagName || "").toUpperCase();
        const isNativeButton = tagName === "BUTTON";
        const isVerifiedDeferControl =
          tagName === "DIV" && getClassName(node).toLowerCase().indexOf("defer-button") >= 0;
        if (
          getNodeText(node) !== "押后" ||
          (!isNativeButton && !isVerifiedDeferControl) ||
          !isNodeAndAncestorsVisible(node) ||
          !isEnabledNativeButton(node)
        ) {
          return;
        }
        matches.push(node);
      });
    });
    return {
      node: matches.length === 1 ? matches[0] : null,
      count: matches.length,
    };
  }

  function findAncestorWithClassFragment(node, fragment) {
    const normalizedFragment = normalizeText(fragment).toLowerCase();
    let current = node?.parentElement || node?.parentNode || null;
    while (current) {
      if (getClassName(current).toLowerCase().indexOf(normalizedFragment) >= 0) {
        return current;
      }
      current = current.parentElement || current.parentNode || null;
    }
    return null;
  }

  function findPostponeReasonPopover(root) {
    const candidates = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        if (
          normalizeText(node?.getAttribute?.("role") || "").toLowerCase() !== "tooltip" ||
          !isNodeAndAncestorsVisible(node)
        ) {
          return;
        }
        const titles = collectDescendantElements(node).filter(function (child) {
          return getNodeText(child) === "押后原因" && isNodeAndAncestorsVisible(child);
        });
        if (titles.length === 1) {
          candidates.push(node);
        }
      });
    });
    return {
      node: candidates.length === 1 ? candidates[0] : null,
      count: candidates.length,
    };
  }

  function findUniquePostponeTextarea(popover) {
    const matches = collectDescendantElements(popover).filter(function (node) {
      return (
        String(node?.tagName || "").toUpperCase() === "TEXTAREA" &&
        isNodeAndAncestorsVisible(node)
      );
    });
    return matches.length === 1 ? matches[0] : null;
  }

  function getNextElementSibling(node) {
    if (node?.nextElementSibling?.nodeType === 1) {
      return node.nextElementSibling;
    }
    const parent = node?.parentElement || node?.parentNode || null;
    const children = parent?.children ? Array.from(parent.children) : [];
    const index = children.indexOf(node);
    for (let cursor = index + 1; cursor >= 0 && cursor < children.length; cursor += 1) {
      if (children[cursor]?.nodeType === 1) {
        return children[cursor];
      }
    }
    return null;
  }

  function findPostponeTextareaActionButtonGroup(textarea) {
    const candidate = getNextElementSibling(textarea);
    if (
      !candidate ||
      getClassName(candidate).toLowerCase().indexOf("button-group") < 0 ||
      !isNodeAndAncestorsVisible(candidate)
    ) {
      return null;
    }
    return candidate;
  }

  function writePostponeReason(textarea) {
    if (!textarea) {
      return false;
    }
    focusControl(textarea);
    const changed = setControlValue(textarea, "1");
    if (!changed && String(textarea.value || "") === "1") {
      dispatchControlEvent(textarea, "input");
      dispatchControlEvent(textarea, "change");
      dispatchControlEvent(textarea, "blur");
    }
    return String(textarea.value || "") === "1";
  }

  function createRecordingAutomationController(options) {
    const source = options && typeof options === "object" ? options : {};
    const timeoutMs = Math.max(
      1,
      Math.round(Number(source.timeoutMs) || RECORDING_AUTOMATION_TIMEOUT_MS)
    );
    const pollIntervalMs = Math.max(
      0,
      Math.round(Number(source.pollIntervalMs) || RECORDING_AUTOMATION_POLL_INTERVAL_MS)
    );
    const networkQuietMs = Math.max(
      0,
      Math.round(
        Number.isFinite(Number(source.networkQuietMs))
          ? Number(source.networkQuietMs)
          : RECORDING_AUTOMATION_NETWORK_QUIET_MS
      )
    );
    const getNow = typeof source.now === "function" ? source.now : Date.now;
    const wait = typeof source.wait === "function" ? source.wait : waitFor;
    const getRoot = function () {
      return typeof source.root === "function"
        ? source.root()
        : source.root || (typeof document !== "undefined" ? document : null);
    };
    let runToken = 0;
    let running = false;
    let pendingPopover = null;
    let pendingPopoverActionGroup = null;
    let confirmationSent = false;
    let lastForwardClickAt = 0;
    let hasForwardClick = false;
    let capturedAutomationScopeKey = "";
    let state = {
      phase: "idle",
      completedCount: 0,
      itemCode: "",
      message: "待命，等待手动开始。",
    };

    function publish(patch) {
      state = Object.assign({}, state, patch || {});
      try {
        source.onStateChange?.(Object.assign({}, state));
      } catch (_error) {
        // The automation safety boundary must not depend on panel rendering.
      }
      return state;
    }

    function isActive(token) {
      return running === true && token === runToken;
    }

    function dismissPendingPopover() {
      if (pendingPopoverActionGroup && !confirmationSent) {
        const cancelLookup = findExactVisibleButton(pendingPopoverActionGroup, "取消", false);
        if (cancelLookup.count === 1) {
          invokeClick(cancelLookup.node);
        }
      }
      pendingPopover = null;
      pendingPopoverActionGroup = null;
    }

    function finish(phase, message, patch) {
      running = false;
      dismissPendingPopover();
      confirmationSent = false;
      publish(
        Object.assign(
          {
            phase: phase,
            message: message,
          },
          patch || {}
        )
      );
    }

    async function waitUntil(token, predicate) {
      const startedAt = Number(getNow()) || 0;
      while (isActive(token)) {
        const scopeOutcome = await verifyAutomationScope(token);
        if (!scopeOutcome.ok) {
          return { stopped: true };
        }
        let value = null;
        try {
          value = await predicate();
        } catch (_error) {
          return { error: true };
        }
        if (value) {
          return { value: value };
        }
        const elapsed = (Number(getNow()) || 0) - startedAt;
        if (elapsed >= timeoutMs) {
          return { timeout: true };
        }
        await wait(Math.min(pollIntervalMs, Math.max(0, timeoutMs - elapsed)));
      }
      return { stopped: true };
    }

    async function executeWithinTimeout(token, operation) {
      let timer = null;
      const setTimer = typeof source.setTimeout === "function" ? source.setTimeout : setTimeout;
      const clearTimer = typeof source.clearTimeout === "function" ? source.clearTimeout : clearTimeout;
      const timeoutResult = new Promise(function (resolve) {
        if (typeof setTimer !== "function") {
          return;
        }
        timer = setTimer(function () {
          resolve({ timeout: true });
        }, timeoutMs);
      });
      try {
        const result = await Promise.race([
          Promise.resolve()
            .then(operation)
            .then(function (value) {
              return { value: value };
            })
            .catch(function () {
              return { error: true };
            }),
          timeoutResult,
        ]);
        if (!isActive(token)) {
          return { stopped: true };
        }
        return result || { error: true };
      } finally {
        if (timer !== null && typeof clearTimer === "function") {
          clearTimer(timer);
        }
      }
    }

    async function getCurrentItemId(token) {
      if (typeof source.getCurrentItemId !== "function") {
        return { error: true };
      }
      const outcome = await executeWithinTimeout(token, source.getCurrentItemId);
      if (outcome.value !== undefined) {
        outcome.value = normalizeText(outcome.value);
        if (!outcome.value) {
          outcome.error = true;
        }
      }
      return outcome;
    }

    async function getAutomationScopeKey(token) {
      if (typeof source.getAutomationScopeKey !== "function") {
        return { value: "" };
      }
      const outcome = await executeWithinTimeout(token, source.getAutomationScopeKey);
      if (outcome.value !== undefined) {
        outcome.value = normalizeText(outcome.value);
        if (!outcome.value) {
          outcome.error = true;
        }
      }
      return outcome;
    }

    async function verifyAutomationScope(token) {
      if (
        !capturedAutomationScopeKey ||
        typeof source.getAutomationScopeKey !== "function"
      ) {
        return { ok: true };
      }
      const outcome = await getAutomationScopeKey(token);
      if (outcome.stopped) {
        return { ok: false };
      }
      if (outcome.timeout || outcome.error) {
        finish("failed", "读取当前自动化范围超时或失败，自动流程已停止。");
        return { ok: false };
      }
      if (outcome.value !== capturedAutomationScopeKey) {
        finish("stopped", "页面类型或检查包范围已切换，自动流程已停止。");
        return { ok: false };
      }
      return { ok: true };
    }

    function getPageNetworkActivity() {
      try {
        const activity =
          typeof source.getNetworkActivity === "function" ? source.getNetworkActivity() : null;
        return {
          pendingCount: Math.max(0, Math.round(Number(activity?.pendingCount) || 0)),
          lastActivityAt: Math.max(0, Number(activity?.lastActivityAt) || 0),
          activitySequence: Math.max(0, Math.round(Number(activity?.activitySequence) || 0)),
        };
      } catch (_error) {
        return null;
      }
    }

    async function waitForPageNetworkQuiet(token, completedCount, itemCode) {
      const waitStartedAt = Math.max(0, Number(getNow()) || 0);
      let latestActivity = {
        pendingCount: 0,
        lastActivityAt: 0,
        activitySequence: 0,
      };
      const outcome = await waitUntil(token, function () {
        const activity = getPageNetworkActivity();
        if (!activity) {
          throw new Error("network activity unavailable");
        }
        latestActivity = activity;
        const currentTime = Math.max(0, Number(getNow()) || 0);
        const hasObservedNetworkActivity =
          activity.activitySequence > 0 || activity.lastActivityAt > 0;
        const quietSince = hasForwardClick
          ? Math.max(lastForwardClickAt, activity.lastActivityAt)
          : hasObservedNetworkActivity
            ? activity.lastActivityAt
            : waitStartedAt;
        const remainingQuietMs = Math.max(
          0,
          networkQuietMs - (currentTime - quietSince)
        );
        if (activity.pendingCount <= 0 && remainingQuietMs <= 0) {
          return true;
        }
        publish({
          phase: "waiting-network",
          completedCount: completedCount,
          itemCode: itemCode,
          pendingRequestCount: activity.pendingCount,
          message:
            activity.pendingCount > 0
              ? "正在等待网络结算（" + String(activity.pendingCount) + " 个请求）。"
              : "网络请求已结算，正在等待 " + String(networkQuietMs) + "ms 安全间隔。",
        });
        return null;
      });
      return Object.assign({}, outcome, {
        activity: latestActivity,
      });
    }

    function finishForNetworkWaitFailure(completedCount, itemCode, pendingCount) {
      finish(
        "failed",
        "页面网络请求在 20 秒内未结算或未连续静默（" +
          String(Math.max(0, Math.round(Number(pendingCount) || 0))) +
          " 个未结算请求），自动流程已停止。",
        {
          completedCount: completedCount,
          itemCode: itemCode,
          pendingRequestCount: Math.max(0, Math.round(Number(pendingCount) || 0)),
        }
      );
    }

    async function run() {
      const token = runToken;
      let completedCount = 0;
      let round = 0;
      if (typeof source.getAutomationScopeKey === "function") {
        const scopeOutcome = await getAutomationScopeKey(token);
        if (scopeOutcome.stopped) {
          return;
        }
        if (scopeOutcome.timeout || scopeOutcome.error) {
          finish("failed", "读取当前自动化范围超时或失败，自动流程已停止。", {
            completedCount: completedCount,
          });
          return;
        }
        capturedAutomationScopeKey = scopeOutcome.value;
      }
      while (isActive(token)) {
        if (!(await verifyAutomationScope(token)).ok) {
          return;
        }
        const currentOutcome = await getCurrentItemId(token);
        if (currentOutcome.stopped) {
          return;
        }
        if (currentOutcome.timeout || currentOutcome.error) {
          finish("failed", "读取当前 AIDP 条目超时或失败，自动流程已停止。", {
            completedCount: completedCount,
          });
          return;
        }
        if (!(await verifyAutomationScope(token)).ok) {
          return;
        }
        const currentItemId = currentOutcome.value;

        if (round > 0) {
          publish({
            phase: "waiting-next",
            completedCount: completedCount,
            message: "正在等待下一题完成初始化。",
          });
          const nextButtonOutcome = await waitUntil(token, function () {
            const lookup = findExactVisiblePostponeControl(getRoot());
            return lookup.count > 0 ? lookup : null;
          });
          if (nextButtonOutcome.stopped) {
            return;
          }
          if (nextButtonOutcome.timeout) {
            finish("completed", "已无可押后数据。", {
              completedCount: completedCount,
            });
            return;
          }
          if (nextButtonOutcome.error || nextButtonOutcome.value?.count !== 1) {
            finish("failed", "未找到唯一可用的“押后”按钮，自动流程已停止。", {
              completedCount: completedCount,
            });
            return;
          }
        }

        if (typeof source.getImportContext === "function") {
          publish({
            phase: "importing",
            completedCount: completedCount,
            itemCode: "",
            message: "正在等待当前完整题目数据刷新。",
          });
          const importContextOutcome = await waitUntil(token, async function () {
            const context = await source.getImportContext();
            if (context?.ok === true) {
              return { ready: true };
            }
            const reason = normalizeText(context?.reason).toLowerCase();
            if (reason === "waiting" || reason === "stale") {
              return null;
            }
            return { invalid: context || null };
          });
          if (importContextOutcome.stopped) {
            return;
          }
          if (importContextOutcome.timeout) {
            finish("failed", "等待当前完整题目数据刷新超过 20 秒，自动流程已停止。", {
              completedCount: completedCount,
            });
            return;
          }
          if (importContextOutcome.error || importContextOutcome.value?.invalid) {
            finish(
              "failed",
              normalizeText(importContextOutcome.value?.invalid?.message) ||
                "当前完整题目数据不可用，自动流程已停止。",
              {
                completedCount: completedCount,
              }
            );
            return;
          }
        }

        publish({
          phase: "importing",
          completedCount: completedCount,
          itemCode: "",
          message: "正在导入并刷新当前录音条目。",
        });
        if (typeof source.importAndRefresh !== "function") {
          finish("failed", "录音导入流程不可用，自动流程已停止。", {
            completedCount: completedCount,
          });
          return;
        }
        const importOutcome = await executeWithinTimeout(token, source.importAndRefresh);
        if (importOutcome.stopped) {
          return;
        }
        if (importOutcome.timeout) {
          finish("failed", "导入或刷新录音结果超过 20 秒，自动流程已停止。", {
            completedCount: completedCount,
          });
          return;
        }
        if (!(await verifyAutomationScope(token)).ok) {
          return;
        }
        const imported = importOutcome.value;
        if (importOutcome.error || !imported?.ok || imported?.current === false) {
          finish("failed", normalizeText(imported?.message) || "导入或刷新录音结果失败，自动流程已停止。", {
            completedCount: completedCount,
          });
          return;
        }
        const recordingResult = imported.result || imported.recordingResult || null;
        const recordingStatus = normalizeText(recordingResult?.status || imported.status).toUpperCase();
        const itemCode = normalizeText(imported.mapping?.itemCode || recordingResult?.itemCode);
        publish({
          phase: "waiting-available",
          completedCount: completedCount,
          itemCode: itemCode,
          message: "正在确认录音条目是否可押后。",
        });
        if (!RECORDING_AUTOMATION_POSTPONABLE_STATUSES.has(recordingStatus)) {
          finish(
            "failed",
            "当前录音条目不在可押后状态（当前状态：" +
              (recordingStatus || "UNKNOWN") +
              "），自动流程已停止。",
            {
            completedCount: completedCount,
            itemCode: itemCode,
            }
          );
          return;
        }

        const postponeButtonOutcome = await waitUntil(token, function () {
          const lookup = findExactVisiblePostponeControl(getRoot());
          return lookup.count > 0 ? lookup : null;
        });
        if (postponeButtonOutcome.stopped) {
          return;
        }
        if (postponeButtonOutcome.timeout) {
          finish("completed", "已无可押后数据。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        if (postponeButtonOutcome.error || postponeButtonOutcome.value?.count !== 1) {
          finish("failed", "未找到唯一可用的“押后”按钮，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        const postponeLookup = postponeButtonOutcome.value;

        const postponeNetworkOutcome = await waitForPageNetworkQuiet(
          token,
          completedCount,
          itemCode
        );
        if (postponeNetworkOutcome.stopped) {
          return;
        }
        if (postponeNetworkOutcome.timeout || postponeNetworkOutcome.error) {
          finishForNetworkWaitFailure(
            completedCount,
            itemCode,
            postponeNetworkOutcome.activity?.pendingCount
          );
          return;
        }

        publish({
          phase: "postponing",
          completedCount: completedCount,
          itemCode: itemCode,
          message: "正在填写押后原因。",
        });
        if (!invokeClick(postponeLookup.node)) {
          finish("failed", "无法点击“押后”按钮，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        lastForwardClickAt = Math.max(0, Number(getNow()) || 0);
        hasForwardClick = true;
        const popoverOutcome = await waitUntil(token, function () {
          const lookup = findPostponeReasonPopover(getRoot());
          return lookup.count > 0 ? lookup : null;
        });
        if (popoverOutcome.stopped) {
          return;
        }
        if (popoverOutcome.timeout || popoverOutcome.error || popoverOutcome.value?.count !== 1) {
          finish("failed", "未找到唯一可见的“押后原因”弹层，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        pendingPopover = popoverOutcome.value.node;
        confirmationSent = false;
        const textarea = findUniquePostponeTextarea(pendingPopover);
        pendingPopoverActionGroup = findPostponeTextareaActionButtonGroup(textarea);
        if (!textarea || !pendingPopoverActionGroup || !writePostponeReason(textarea)) {
          finish("failed", "无法写入押后原因，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        if (!isActive(token)) {
          return;
        }
        const confirmLookup = findExactVisibleButton(pendingPopoverActionGroup, "确定", false);
        if (confirmLookup.count !== 1) {
          finish("failed", "未找到唯一可用的押后确认按钮，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        const confirmNetworkOutcome = await waitForPageNetworkQuiet(
          token,
          completedCount,
          itemCode
        );
        if (confirmNetworkOutcome.stopped) {
          return;
        }
        if (confirmNetworkOutcome.timeout || confirmNetworkOutcome.error) {
          finishForNetworkWaitFailure(
            completedCount,
            itemCode,
            confirmNetworkOutcome.activity?.pendingCount
          );
          return;
        }
        if (!invokeClick(confirmLookup.node)) {
          finish("failed", "无法确认押后，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        lastForwardClickAt = Math.max(0, Number(getNow()) || 0);
        hasForwardClick = true;
        confirmationSent = true;
        pendingPopover = null;
        pendingPopoverActionGroup = null;
        publish({
          phase: "waiting-next",
          completedCount: completedCount,
          itemCode: itemCode,
          message: "押后已确认，正在验证是否进入下一题。",
        });
        const nextItemOutcome = await waitUntil(token, async function () {
          const nextOutcome = await getCurrentItemId(token);
          if (nextOutcome.stopped || nextOutcome.timeout || nextOutcome.error) {
            return null;
          }
          return nextOutcome.value !== currentItemId ? nextOutcome.value : null;
        });
        if (nextItemOutcome.stopped) {
          return;
        }
        if (nextItemOutcome.timeout || nextItemOutcome.error) {
          finish("failed", "押后可能已提交，但未验证下一题，自动流程已停止。", {
            completedCount: completedCount,
            itemCode: itemCode,
          });
          return;
        }
        completedCount += 1;
        round += 1;
      }
    }

    function start() {
      if (running) {
        return Promise.resolve(false);
      }
      running = true;
      runToken += 1;
      pendingPopover = null;
      pendingPopoverActionGroup = null;
      confirmationSent = false;
      capturedAutomationScopeKey = "";
      publish({
        phase: "importing",
        completedCount: 0,
        itemCode: "",
        message: "自动流程已开始。",
      });
      return run().then(function () {
        return true;
      });
    }

    function stop(message) {
      if (!running) {
        return false;
      }
      runToken += 1;
      running = false;
      dismissPendingPopover();
      confirmationSent = false;
      publish({
        phase: "stopped",
        message: normalizeText(message) || "已停止自动流程。",
      });
      return true;
    }

    return {
      start: start,
      stop: stop,
      isRunning: function () {
        return running;
      },
      getState: function () {
        return Object.assign({}, state);
      },
    };
  }

  function findTaskListMountAnchor(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const mainNode = safeQuerySelectorAll(searchRoots[index], "main,[role='main']")[0];
      if (mainNode) {
        return mainNode;
      }
    }
    for (let index = 0; index < searchRoots.length; index += 1) {
      const descendants = collectDescendantElements(searchRoots[index]);
      if (descendants.length > 0) {
        return descendants[0];
      }
    }
    return null;
  }

  function hasClassToken(node, token) {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken) {
      return false;
    }
    return getClassName(node)
      .split(/\s+/)
      .filter(Boolean)
      .some(function (className) {
        return className === normalizedToken;
      });
  }

  function hasClassPrefix(node, prefix) {
    const normalizedPrefix = normalizeText(prefix);
    if (!normalizedPrefix) {
      return false;
    }
    return getClassName(node)
      .split(/\s+/)
      .filter(Boolean)
      .some(function (className) {
        return className.indexOf(normalizedPrefix) === 0;
      });
  }

  function isTaskListHeaderNode(node) {
    return (
      isNodeVisible(node) &&
      String(node?.tagName || "").toUpperCase() === "HEADER" &&
      hasClassToken(node, "aidp-foundation-layout-header") &&
      hasClassPrefix(node, "frame-header-")
    );
  }

  function findTaskListHeader(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const searchRoot = searchRoots[index];
      const candidates = [searchRoot].concat(collectDescendantElements(searchRoot));
      const headerNode = candidates.find(isTaskListHeaderNode);
      if (headerNode) {
        return headerNode;
      }
    }
    return null;
  }

  function isTaskListHeaderUserInfoNode(node) {
    return isNodeVisible(node) && hasClassPrefix(node, "frame-user-info-");
  }

  function findTaskListHeaderUserInfo(root) {
    const headerNode = findTaskListHeader(root);
    if (!headerNode) {
      return null;
    }
    const candidates = [headerNode].concat(collectDescendantElements(headerNode));
    return candidates.find(isTaskListHeaderUserInfoNode) || null;
  }

  function findAccountSwitchBar(root) {
    return safeQuerySelectorAll(root, "[" + ACCOUNT_SWITCH_BAR_ATTR + "='true']")[0] || null;
  }

  function findAccountSwitchButton(root) {
    return safeQuerySelectorAll(root, "[" + ACCOUNT_SWITCH_BUTTON_ATTR + "='true']")[0] || null;
  }

  function findAccountSwitchStatusNode(root) {
    return safeQuerySelectorAll(root, "[" + ACCOUNT_SWITCH_STATUS_ATTR + "='true']")[0] || null;
  }

  function setAccountSwitchStatus(message, tone) {
    if (typeof document === "undefined") {
      return;
    }
    const node = findAccountSwitchStatusNode(document);
    if (!node) {
      return;
    }
    node.textContent = normalizeText(message);
    const normalizedTone = normalizeText(tone).toLowerCase();
    node.style.color =
      normalizedTone === "error"
        ? "#c73932"
        : normalizedTone === "success"
          ? "#1f7a45"
          : "#5f6f90";
  }

  function setAccountSwitchBusy(busy) {
    if (typeof document === "undefined") {
      return;
    }
    const button = findAccountSwitchButton(document);
    if (!button) {
      return;
    }
    button.disabled = busy === true;
    button.style.opacity = busy === true ? "0.7" : "1";
    button.style.cursor = busy === true ? "wait" : "pointer";
  }

  function destroyAccountSwitchBar(root) {
    safeQuerySelectorAll(root, "[" + ACCOUNT_SWITCH_BAR_ATTR + "='true']").forEach(function (node) {
      if (node?.parentNode && typeof node.parentNode.removeChild === "function") {
        node.parentNode.removeChild(node);
      }
    });
  }

  function ensureAccountSwitchBar(root, onClick) {
    const existing = findAccountSwitchBar(root);
    if (existing) {
      return {
        node: existing,
        created: false,
      };
    }
    const userInfoNode = findTaskListHeaderUserInfo(root);
    const avatarTrigger = userInfoNode ? findAccountAvatarTrigger(userInfoNode) : null;
    const documentLike = userInfoNode?.ownerDocument || globalThis.document;
    if (
      !userInfoNode ||
      !avatarTrigger ||
      avatarTrigger.parentElement !== userInfoNode ||
      !documentLike ||
      typeof documentLike.createElement !== "function"
    ) {
      return {
        node: null,
        created: false,
      };
    }

    const bar = documentLike.createElement("div");
    bar.setAttribute(ACCOUNT_SWITCH_BAR_ATTR, "true");
    bar.style.display = "inline-flex";
    bar.style.alignItems = "center";
    bar.style.gap = "8px";
    bar.style.marginRight = "8px";
    bar.style.flexShrink = "0";

    const status = documentLike.createElement("span");
    status.setAttribute(ACCOUNT_SWITCH_STATUS_ATTR, "true");
    status.textContent = "";
    status.style.maxWidth = "200px";
    status.style.color = "#5f6f90";
    status.style.fontSize = "12px";
    status.style.lineHeight = "1.4";
    status.style.whiteSpace = "nowrap";
    status.style.overflow = "hidden";
    status.style.textOverflow = "ellipsis";
    bar.appendChild(status);

    const button = documentLike.createElement("button");
    button.type = "button";
    button.setAttribute(ACCOUNT_SWITCH_BUTTON_ATTR, "true");
    button.textContent = "切换账号";
    button.style.padding = "0 12px";
    button.style.height = "32px";
    button.style.border = "1px solid #26418b";
    button.style.borderRadius = "999px";
    button.style.background = "#ffffff";
    button.style.color = "#26418b";
    button.style.fontWeight = "600";
    button.style.cursor = "pointer";
    button.style.whiteSpace = "nowrap";
    button.addEventListener("click", function () {
      if (typeof onClick === "function") {
        onClick();
      }
    });
    bar.appendChild(button);

    userInfoNode.insertBefore(bar, avatarTrigger);
    return {
      node: bar,
      created: true,
    };
  }

  function getAccountAvatarTriggerScore(node) {
    if (!isNodeVisible(node)) {
      return -1;
    }
    const className = getClassName(node).toLowerCase();
    if (className.includes("popover")) {
      return -1;
    }
    let score = 0;
    if (className.includes("avatar")) {
      score += 3;
    }
    if (className.includes("user") || className.includes("account")) {
      score += 1;
    }
    if (
      String(node?.tagName || "").toUpperCase() === "BUTTON" ||
      normalizeText(node?.getAttribute?.("role") || "").toLowerCase() === "button"
    ) {
      score += 1;
    }
    if (hasMediaDescendant(node)) {
      score += 1;
    }
    if (getNodeText(node).length <= 16) {
      score += 1;
    }
    return score;
  }

  function findAccountAvatarTrigger(root) {
    let bestNode = null;
    let bestScore = -1;
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        const score = getAccountAvatarTriggerScore(node);
        if (score > bestScore) {
          bestNode = node;
          bestScore = score;
        }
      });
    });
    return bestScore >= 3 ? bestNode : null;
  }

  function findAccountPopoverRoots(root) {
    const results = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        if (!isNodeVisible(node)) {
          return;
        }
        const className = getClassName(node).toLowerCase();
        if (!className.includes("popover")) {
          return;
        }
        results.push(node);
      });
    });
    return results;
  }

  function findAccountMenuAction(root, label) {
    const targetLabel = normalizeText(label);
    const matches = [];
    findAccountPopoverRoots(root).forEach(function (popoverRoot) {
      collectDescendantElements(popoverRoot).forEach(function (node) {
        if (!isNodeVisible(node)) {
          return;
        }
        if (normalizeText(getNodeText(node)) !== targetLabel) {
          return;
        }
        matches.push(node);
      });
    });
    if (matches.length !== 1) {
      return {
        ok: false,
        reason: matches.length > 1 ? "ambiguous-action" : "missing-action",
        node: null,
      };
    }
    return {
      ok: true,
      node: matches[0],
    };
  }

  async function openAccountMenu(root, waitForFn) {
    const trigger = findAccountAvatarTrigger(root);
    if (!trigger) {
      return {
        ok: false,
        reason: "missing-avatar-trigger",
      };
    }
    invokeClick(trigger);
    await waitForFn(80);
    return {
      ok: true,
    };
  }

  function sendRuntimeMessage(message) {
    return new Promise(function (resolve, reject) {
      const runtime = globalThis.chrome?.runtime;
      if (!runtime || typeof runtime.sendMessage !== "function") {
        reject(new Error("扩展后台不可用，无法清理登录 Cookie。"));
        return;
      }
      try {
        runtime.sendMessage(message, function (response) {
          const runtimeError = globalThis.chrome?.runtime?.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message || String(runtimeError)));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function getAidpCookieClearUrl(value) {
    const source = normalizeText(value || globalThis.location?.href || "");
    if (source) {
      return source;
    }
    return "https://aidp.bytedance.com/";
  }

  async function requestAidpLoginStateReset(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const response = await sendRuntimeMessage({
      type: "ASR_EDGE_RESET_AIDP_LOGIN_STATE",
      url: getAidpCookieClearUrl(source.url),
    });
    if (!response || response.ok !== true || !response.result) {
      return {
        ok: false,
        message:
          normalizeText(response?.error || response?.result?.message || "") ||
          "重置登录态失败。",
      };
    }
    return response.result;
  }

  async function requestAidpLoginCookieClear(payload) {
    return requestAidpLoginStateReset(payload);
  }

  function reloadCurrentPage() {
    globalThis.location?.reload?.();
  }

  async function runAccountSwitchFlow(root, options) {
    const source = options && typeof options === "object" ? options : {};
    const confirmFn =
      typeof source.confirm === "function"
        ? source.confirm
        : typeof globalThis.confirm === "function"
          ? globalThis.confirm
          : null;
    const resetLoginState =
      typeof source.resetLoginState === "function"
        ? source.resetLoginState
        : typeof source.clearLoginCookies === "function"
          ? source.clearLoginCookies
        : requestAidpLoginStateReset;
    const reloadPage =
      typeof source.reloadPage === "function" ? source.reloadPage : reloadCurrentPage;
    const pageUrl = getAidpCookieClearUrl(source.url);

    if (
      confirmFn &&
      confirmFn("确认清理当前站点储存和登录态并刷新页面吗？") === false
    ) {
      return {
        ok: false,
        reason: "cancelled",
        message: "已取消切换账号。",
      };
    }

    const clearResult = await resetLoginState({
      url: pageUrl,
    });
    if (!clearResult || clearResult.ok !== true) {
      return {
        ok: false,
        reason: normalizeText(clearResult?.reason || "") || "reset-login-state-failed",
        message: normalizeText(clearResult?.message || "") || "重置登录态失败。",
      };
    }

    reloadPage();
    return {
      ok: true,
      message: "已重置登录态，正在刷新页面。",
    };
  }

  function findWaveWorkbench(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const searchRoot = searchRoots[index];
      const exact = safeQuerySelectorAll(searchRoot, ".neeko-wavesurfer-warper.neeko-wavesurfer")[0];
      if (exact) {
        return exact.parentElement || exact;
      }
      const classFallback = collectDescendantElements(searchRoot).find(function (node) {
        const className = getClassName(node);
        return (
          className.includes("neeko-wavesurfer-warper") &&
          className.includes("neeko-wavesurfer")
        );
      });
      if (classFallback) {
        return classFallback.parentElement || classFallback;
      }
      const semantic = collectDescendantElements(searchRoot).find(function (node) {
        const text = getNodeText(node);
        return text.includes("播放速度") && text.includes("总时长");
      });
      if (semantic) {
        return semantic;
      }
    }
    return null;
  }

  function findPlaybackRateControl(root) {
    const workbench = findWaveWorkbench(root);
    if (!workbench) {
      return null;
    }
    return (
      safeQuerySelectorAll(workbench, "[role='combobox'], select").find(function (node) {
        return node && ("value" in node || normalizeText(node.getAttribute?.("role")) === "combobox");
      }) || null
    );
  }

  function findWaveZoomControl(root) {
    const workbench = findWaveWorkbench(root);
    if (!workbench) {
      return null;
    }
    return (
      safeQuerySelectorAll(workbench, "[role='spinbutton']").find(function (node) {
        return node && "value" in node;
      }) || null
    );
  }

  function getWaveZoomValue(node) {
    if (!node) {
      return null;
    }
    const ariaValue = Number(node.getAttribute?.("aria-valuenow"));
    if (Number.isFinite(ariaValue)) {
      const normalizedAriaValue = normalizeFixedWaveZoom(ariaValue, NaN);
      if (Number.isFinite(normalizedAriaValue) && normalizedAriaValue === ariaValue) {
        return normalizedAriaValue;
      }
    }
    const inputValue = Number(node.value);
    if (!Number.isFinite(inputValue)) {
      return null;
    }
    const normalizedInputValue = normalizeFixedWaveZoom(inputValue, NaN);
    return Number.isFinite(normalizedInputValue) && normalizedInputValue === inputValue
      ? normalizedInputValue
      : null;
  }

  function nodeOrDescendantClassIncludes(node, fragment) {
    const target = normalizeText(fragment).toLowerCase();
    if (!node || !target) {
      return false;
    }
    if (getClassName(node).toLowerCase().includes(target)) {
      return true;
    }
    return collectDescendantElements(node).some(function (child) {
      return getClassName(child).toLowerCase().includes(target);
    });
  }

  function findWaveZoomButtons(root) {
    const workbench = findWaveWorkbench(root);
    if (!workbench) {
      return {
        zoomOutButton: null,
        zoomInButton: null,
      };
    }
    const nodes = collectDescendantElements(workbench);
    function findButton(fragment) {
      return (
        nodes.find(function (node) {
          return getClassName(node).toLowerCase().includes(fragment);
        }) ||
        nodes.find(function (node) {
          return (
            nodeOrDescendantClassIncludes(node, fragment) &&
            !collectDescendantElements(node).some(function (child) {
              return getClassName(child).toLowerCase().includes(fragment);
            })
          );
        }) ||
        null
      );
    }
    return {
      zoomOutButton: findButton("zoom-out"),
      zoomInButton: findButton("zoom-in"),
    };
  }

  async function syncWaveZoomControl(root, targetZoom, options) {
    const source = options && typeof options === "object" ? options : {};
    const maxSteps = Number.isFinite(Number(source.maxSteps)) ? Number(source.maxSteps) : 12;
    const stepDelayMs = Number.isFinite(Number(source.stepDelayMs))
      ? Number(source.stepDelayMs)
      : 16;
    const requestToken = source.requestToken;
    const zoomNode = findWaveZoomControl(root);
    const normalizedTarget = normalizeFixedWaveZoom(targetZoom, DEFAULT_FIXED_WAVE_ZOOM);
    if (!zoomNode) {
      return {
        changed: false,
        confirmed: false,
        attempts: 0,
        reason: "missing-control",
      };
    }
    let currentValue = getWaveZoomValue(zoomNode);
    if (currentValue === normalizedTarget) {
      return {
        changed: false,
        confirmed: true,
        attempts: 0,
        reason: "already-matched",
      };
    }
    const controls = findWaveZoomButtons(root);
    const directionButton =
      currentValue !== null && currentValue > normalizedTarget
        ? controls.zoomOutButton
        : controls.zoomInButton;
    if (!directionButton) {
      const changed = setControlValue(zoomNode, normalizedTarget);
      return {
        changed: changed,
        confirmed: false,
        attempts: 0,
        reason: changed ? "fallback-write-only" : "fallback-no-change",
      };
    }
    let attempts = 0;
    while (attempts < maxSteps) {
      if (
        requestToken !== undefined &&
        requestToken !== null &&
        requestToken !== waveZoomSyncToken
      ) {
        return {
          changed: attempts > 0,
          confirmed: false,
          attempts: attempts,
          reason: "superseded",
        };
      }
      currentValue = getWaveZoomValue(zoomNode);
      if (currentValue === normalizedTarget) {
        return {
          changed: attempts > 0,
          confirmed: true,
          attempts: attempts,
          reason: "reached-target",
        };
      }
      invokeClick(directionButton);
      attempts += 1;
      await waitFor(stepDelayMs);
    }
    return {
      changed: attempts > 0,
      confirmed: getWaveZoomValue(zoomNode) === normalizedTarget,
      attempts: attempts,
      reason: "max-steps-reached",
    };
  }

  function getPlaybackComboboxLabel(node) {
    if (!node) {
      return "";
    }
    const viewValueNode =
      typeof node.querySelector === "function"
        ? node.querySelector(".arco-select-view-value")
        : null;
    const inputNode =
      typeof node.querySelector === "function"
        ? node.querySelector(".arco-select-view-input")
        : null;
    return (
      normalizeText(viewValueNode?.textContent) ||
      normalizeText(inputNode?.value) ||
      normalizeText(node.getAttribute?.("title")) ||
      normalizeText(node.textContent)
    );
  }

  async function syncPlaybackRateControl(root, targetPlaybackRate, options) {
    const source = options && typeof options === "object" ? options : {};
    const stepDelayMs = Number.isFinite(Number(source.stepDelayMs))
      ? Number(source.stepDelayMs)
      : 24;
    const requestToken = source.requestToken;
    const playbackNode = findPlaybackRateControl(root);
    const normalizedTargetPlaybackRate = normalizePlaybackRate(
      targetPlaybackRate,
      DEFAULT_PLAYBACK_RATE
    );
    const targetLabel = formatPlaybackRateLabel(normalizedTargetPlaybackRate);
    if (!playbackNode) {
      return {
        changed: false,
        confirmed: false,
        attempts: 0,
        reason: "missing-control",
      };
    }
    if (getPlaybackComboboxLabel(playbackNode) === targetLabel) {
      return {
        changed: false,
        confirmed: true,
        attempts: 0,
        reason: "already-matched",
      };
    }
    let changed = false;
    let attempts = 0;
    let selectedOptionBeforeOpen = false;

    function isSuperseded() {
      return (
        requestToken !== undefined &&
        requestToken !== null &&
        requestToken !== playbackRateSyncToken
      );
    }

    const optionBeforeOpen = findPlaybackRateOption(root, targetLabel);
    if (optionBeforeOpen) {
      invokeClick(optionBeforeOpen);
      changed = true;
      attempts += 1;
      selectedOptionBeforeOpen = true;
      await waitFor(stepDelayMs);
    }
    if (isSuperseded()) {
      return {
        changed: changed,
        confirmed: false,
        attempts: attempts,
        reason: "superseded",
      };
    }
    if (getPlaybackComboboxLabel(playbackNode) === targetLabel) {
      return {
        changed: changed,
        confirmed: true,
        attempts: attempts,
        reason: "option-before-open",
      };
    }

    if (!selectedOptionBeforeOpen) {
      invokeClick(playbackNode);
      changed = true;
      attempts += 1;
      await waitFor(stepDelayMs);
      if (isSuperseded()) {
        return {
          changed: changed,
          confirmed: false,
          attempts: attempts,
          reason: "superseded",
        };
      }

      const optionAfterOpen = findPlaybackRateOption(root, targetLabel);
      if (optionAfterOpen) {
        invokeClick(optionAfterOpen);
        changed = true;
        attempts += 1;
        await waitFor(stepDelayMs);
      }
      if (getPlaybackComboboxLabel(playbackNode) === targetLabel) {
        return {
          changed: changed,
          confirmed: true,
          attempts: attempts,
          reason: "option-after-open",
        };
      }
    }

    return {
      changed: changed,
      confirmed: false,
      attempts: attempts,
      reason: "confirmation-missed",
    };
  }

  function schedulePlaybackRateSync(root, targetPlaybackRate, scopeKey) {
    const requestToken = playbackRateSyncToken + 1;
    playbackRateSyncToken = requestToken;
    void syncPlaybackRateControl(root, targetPlaybackRate, {
      requestToken: requestToken,
      scopeKey: scopeKey,
    }).then(function (result) {
      if (
        requestToken !== playbackRateSyncToken ||
        playbackRateAutoSyncState.target !== targetPlaybackRate ||
        playbackRateAutoSyncState.scopeKey !== scopeKey
      ) {
        return;
      }
      playbackRateAutoSyncState.status = result?.confirmed ? "completed" : "attempted";
    });
    return requestToken;
  }

  function scheduleWaveZoomSync(root, targetZoom) {
    const requestToken = waveZoomSyncToken + 1;
    waveZoomSyncToken = requestToken;
    void syncWaveZoomControl(root, targetZoom, {
      requestToken: requestToken,
    }).then(function (_result) {
      if (requestToken === waveZoomSyncToken && waveZoomAutoSyncState.target === targetZoom) {
        waveZoomAutoSyncState.status = "completed";
      }
    });
    return requestToken;
  }

  function applyWaveToolSettings(root, config) {
    const source = config && typeof config === "object" ? config : {};
    let changed = false;
    const playbackNode = findPlaybackRateControl(root);
    const zoomNode = findWaveZoomControl(root);
    if (playbackNode) {
      const targetPlaybackRate = normalizePlaybackRate(
        source.defaultPlaybackRate,
        DEFAULT_PLAYBACK_RATE
      );
      const playbackScopeKey =
        normalizeText(source.playbackScopeKey) || getCurrentPlaybackScopeKey();
      if (
        playbackRateAutoSyncState.target !== targetPlaybackRate ||
        playbackRateAutoSyncState.scopeKey !== playbackScopeKey
      ) {
        playbackRateAutoSyncState.target = targetPlaybackRate;
        playbackRateAutoSyncState.scopeKey = playbackScopeKey;
        playbackRateAutoSyncState.status = "idle";
      }
      if (normalizeText(playbackNode.getAttribute?.("role")) === "combobox") {
        if (getPlaybackComboboxLabel(playbackNode) === formatPlaybackRateLabel(targetPlaybackRate)) {
          playbackRateAutoSyncState.status = "completed";
        } else if (playbackRateAutoSyncState.status === "idle") {
          playbackRateAutoSyncState.status = "pending";
          schedulePlaybackRateSync(root, targetPlaybackRate, playbackScopeKey);
          changed = true;
        }
      } else {
        changed = setControlValue(playbackNode, targetPlaybackRate) || changed;
        if (changed || Number(playbackNode.value) === targetPlaybackRate) {
          playbackRateAutoSyncState.status = "completed";
        }
      }
    }
    if (zoomNode) {
      const normalizedTargetZoom = normalizeFixedWaveZoom(
        source.fixedWaveZoom,
        DEFAULT_FIXED_WAVE_ZOOM
      );
      if (waveZoomAutoSyncState.target !== normalizedTargetZoom) {
        waveZoomAutoSyncState.target = normalizedTargetZoom;
        waveZoomAutoSyncState.status = "idle";
      }
      const currentWaveZoomValue = getWaveZoomValue(zoomNode);
      if (currentWaveZoomValue === normalizedTargetZoom) {
        waveZoomAutoSyncState.status = "completed";
      } else if (waveZoomAutoSyncState.status === "idle") {
        waveZoomAutoSyncState.status = "pending";
        scheduleWaveZoomSync(root, normalizedTargetZoom);
        changed = true;
      }
    }
    return changed;
  }

  function findPlaybackRateOption(root, label) {
    const targetLabel = normalizeText(label);
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const nodes = collectDescendantElements(searchRoots[index]);
      const matched = nodes.find(function (node) {
        const className = getClassName(node);
        return (
          (className.includes("arco-select-option") ||
            normalizeText(node.getAttribute?.("role")) === "option") &&
          getNodeText(node) === targetLabel
        );
      });
      if (matched) {
        return matched;
      }
    }
    return null;
  }

  function selectPlaybackRateComboboxOption(root, node, playbackRate) {
    const targetLabel = formatPlaybackRateLabel(playbackRate);
    if (getPlaybackComboboxLabel(node) === targetLabel) {
      return false;
    }
    const optionBeforeOpen = findPlaybackRateOption(root, targetLabel);
    if (optionBeforeOpen) {
      invokeClick(optionBeforeOpen);
      return true;
    }
    invokeClick(node);
    const optionAfterOpen = findPlaybackRateOption(root, targetLabel);
    if (!optionAfterOpen) {
      return false;
    }
    invokeClick(optionAfterOpen);
    return true;
  }

  function findPlayToolbarRoot(root) {
    const workbench = findWaveWorkbench(root);
    if (!workbench) {
      return null;
    }
    return safeQuerySelectorAll(workbench, ".btns-play")[0] || null;
  }

  function parseWaveElapsedTimeMs(text) {
    const source = normalizeText(text);
    if (!source) {
      return null;
    }
    const match = source.match(/(\d+):(\d{2})(?:\.(\d{1,3}))?/);
    if (!match) {
      return null;
    }
    const minutes = Math.max(0, Number(match[1]) || 0);
    const seconds = Math.max(0, Number(match[2]) || 0);
    const fractionText = String(match[3] || "");
    const fractionMs = fractionText
      ? Math.max(0, Number(fractionText.padEnd(3, "0").slice(0, 3)) || 0)
      : 0;
    return minutes * 60000 + seconds * 1000 + fractionMs;
  }

  function getWaveElapsedTimeMs(root) {
    const workbench = findWaveWorkbench(root);
    if (!workbench) {
      return null;
    }
    return parseWaveElapsedTimeMs(getNodeText(workbench));
  }

  function isWavePlaybackActive(root) {
    const now =
      typeof Date.now === "function" ? Date.now() : new Date().getTime();
    const elapsedMs = getWaveElapsedTimeMs(root);
    if (elapsedMs === null) {
      return wavePlaybackActivityState.activeUntil > now;
    }
    if (
      wavePlaybackActivityState.lastElapsedMs !== null &&
      now - wavePlaybackActivityState.lastObservedAt <= 4000 &&
      elapsedMs !== wavePlaybackActivityState.lastElapsedMs
    ) {
      wavePlaybackActivityState.activeUntil = now + 2500;
    }
    wavePlaybackActivityState.lastElapsedMs = elapsedMs;
    wavePlaybackActivityState.lastObservedAt = now;
    return wavePlaybackActivityState.activeUntil > now;
  }

  function findDetailHeaderActionGroup(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const currentRoot = searchRoots[index];
      const candidates = [currentRoot].concat(collectDescendantElements(currentRoot));
      const headerContainer = candidates.find(function (node) {
        return getClassName(node)
          .split(/\s+/)
          .filter(Boolean)
          .includes("item-info-Gr9sCs");
      });
      if (!headerContainer) {
        continue;
      }
      const actionGroup = [headerContainer].concat(collectDescendantElements(headerContainer)).find(
        function (node) {
          return getClassName(node)
            .split(/\s+/)
            .filter(Boolean)
            .includes("operation-group-btn-GcvnvK");
        }
      );
      if (actionGroup) {
        return actionGroup;
      }
    }
    return null;
  }

  function removeLegacyToolbarActionGroups(root) {
    safeQuerySelectorAll(root, "[" + TOOLBAR_ACTION_GROUP_ATTR + "='true']").forEach(function (node) {
      if (node?.parentNode && typeof node.parentNode.removeChild === "function") {
        node.parentNode.removeChild(node);
      }
    });
  }

  function applyHeaderActionButtonStyle(button) {
    if (!button || !button.style) {
      return;
    }
    button.style.padding = "0 8px";
    button.style.height = "24px";
    button.style.border = "1px solid #d7dce5";
    button.style.borderRadius = "6px";
    button.style.background = "#fff";
    button.style.color = "#39424e";
    button.style.cursor = "pointer";
    button.style.fontSize = "12px";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.whiteSpace = "nowrap";
    button.style.flex = "0 0 auto";
  }

  function ensureHeaderActionButton(root, attrName, label, onClick) {
    const actionGroup = findDetailHeaderActionGroup(root);
    if (!actionGroup || typeof actionGroup.querySelector === "undefined") {
      return false;
    }
    if (actionGroup.style) {
      actionGroup.style.display = "inline-flex";
      actionGroup.style.alignItems = "center";
      actionGroup.style.gap = "8px";
      actionGroup.style.flexWrap = "wrap";
    }
    removeLegacyToolbarActionGroups(root);
    const documentLike = actionGroup.ownerDocument || globalThis.document;
    const existing =
      typeof actionGroup.querySelector === "function"
        ? actionGroup.querySelector("[" + attrName + "='true']")
        : null;
    if (existing) {
      return false;
    }
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return false;
    }
    const button = documentLike.createElement("button");
    button.type = "button";
    button.setAttribute(attrName, "true");
    button.textContent = label;
    applyHeaderActionButtonStyle(button);
    button.addEventListener("click", function () {
      if (typeof onClick === "function") {
        onClick();
      }
    });
    actionGroup.appendChild(button);
    return true;
  }

  function ensureClearSegmentsButton(root, onClick) {
    return ensureHeaderActionButton(root, CLEAR_SEGMENTS_BUTTON_ATTR, "清空画段", onClick);
  }

  function ensureFillLanguageKindsButton(root, onClick) {
    return ensureHeaderActionButton(
      root,
      FILL_LANGUAGE_KIND_BUTTON_ATTR,
      "填充语言种类",
      onClick
    );
  }

  function syncRecordingImportButton(root, options) {
    const source = options && typeof options === "object" ? options : {};
    const actionGroup = findDetailHeaderActionGroup(root);
    if (!actionGroup || typeof actionGroup.querySelector !== "function") {
      return false;
    }
    const selector = "[" + RECORDING_IMPORT_BUTTON_ATTR + "='true']";
    let button = actionGroup.querySelector(selector);
    if (!normalizeText(source.recordingTaskCode)) {
      if (button?.parentNode && typeof button.parentNode.removeChild === "function") {
        button.parentNode.removeChild(button);
        return true;
      }
      return false;
    }
    let changed = false;
    if (!button) {
      const documentLike = actionGroup.ownerDocument || globalThis.document;
      if (!documentLike || typeof documentLike.createElement !== "function") {
        return false;
      }
      button = documentLike.createElement("button");
      button.type = "button";
      button.setAttribute(RECORDING_IMPORT_BUTTON_ATTR, "true");
      applyHeaderActionButtonStyle(button);
      button.addEventListener("click", function () {
        if (button.disabled !== true && typeof button.__ascRecordingOnClick === "function") {
          button.__ascRecordingOnClick();
        }
      });
      const clearSegmentsButton = actionGroup.querySelector(
        "[" + CLEAR_SEGMENTS_BUTTON_ATTR + "='true']"
      );
      if (clearSegmentsButton && typeof actionGroup.insertBefore === "function") {
        actionGroup.insertBefore(button, clearSegmentsButton);
      } else {
        actionGroup.appendChild(button);
      }
      changed = true;
    }
    const clearSegmentsButton = actionGroup.querySelector(
      "[" + CLEAR_SEGMENTS_BUTTON_ATTR + "='true']"
    );
    if (clearSegmentsButton && button.parentNode === actionGroup) {
      const children = Array.from(actionGroup.children || []);
      const buttonIndex = children.indexOf(button);
      const clearIndex = children.indexOf(clearSegmentsButton);
      if (
        buttonIndex >= 0 &&
        clearIndex >= 0 &&
        buttonIndex !== clearIndex - 1 &&
        typeof actionGroup.insertBefore === "function"
      ) {
        if (typeof actionGroup.removeChild === "function") {
          actionGroup.removeChild(button);
        }
        actionGroup.insertBefore(button, clearSegmentsButton);
        changed = true;
      }
    }
    button.__ascRecordingOnClick =
      typeof source.onClick === "function" ? source.onClick : null;
    const busy = source.busy === true;
    const nextDisabled = busy || source.contextReady !== true;
    const nextText = busy ? "正在添加..." : "添加数据";
    const disabledReason = busy
      ? "正在添加当前完整题目数据。"
      : nextDisabled
        ? normalizeText(source.contextMessage) ||
          "当前完整题目数据尚未就绪，请稍后重试。"
        : "";
    if (button.disabled !== nextDisabled || button.textContent !== nextText) {
      changed = true;
    }
    button.disabled = nextDisabled;
    button.textContent = nextText;
    if (disabledReason) {
      button.setAttribute("title", disabledReason);
      button.setAttribute("aria-label", nextText + "：" + disabledReason);
    } else {
      button.removeAttribute("title");
      button.removeAttribute("aria-label");
    }
    if (button.style) {
      button.style.cursor = nextDisabled ? "not-allowed" : "pointer";
      button.style.opacity = nextDisabled ? "0.58" : "1";
    }
    return changed;
  }

  function hasClassToken(node, className) {
    return getClassName(node)
      .split(/\s+/)
      .filter(Boolean)
      .includes(String(className || ""));
  }

  function findTaizhouPanelRoot(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const candidates = [searchRoots[index]].concat(collectDescendantElements(searchRoots[index]));
      const matched = candidates.find(function (node) {
        if (!node || node.nodeType !== 1) {
          return false;
        }
        if (typeof node.hasAttribute === "function") {
          return node.hasAttribute(TAIZHOU_PANEL_ROOT_ATTR);
        }
        return normalizeText(node.getAttribute?.(TAIZHOU_PANEL_ROOT_ATTR)) !== "";
      });
      if (matched) {
        return matched;
      }
    }
    return null;
  }

  function findClosestAncestorElement(node, predicate, boundaryRoot) {
    let current = node || null;
    let depth = 0;
    while (current && current !== boundaryRoot && depth < 16) {
      if (typeof predicate === "function" && predicate(current) === true) {
        return current;
      }
      current = current.parentElement || null;
      depth += 1;
    }
    return null;
  }

  function hasSegmentTableSignals(node) {
    if (!node || node.nodeType !== 1) {
      return false;
    }
    const descendants = collectDescendantElements(node);
    const text = getNodeText(node);
    const hasTableBody =
      hasClassToken(node, "arco-table-body") ||
      descendants.some(function (child) {
        return hasClassToken(child, "arco-table-body");
      });
    if (!hasTableBody) {
      return false;
    }
    const hasTextarea = descendants.some(function (child) {
      return (
        String(child?.tagName || "").toUpperCase() === "TEXTAREA" &&
        hasClassToken(child, "arco-textarea") &&
        hasClassToken(child, "neeko-input-textarea")
      );
    });
    if (!hasTextarea) {
      return false;
    }
    const requiredHeaders = ["序号", "区间", "转写文本", "音频段", "操作"];
    const matchedRequiredHeaders = requiredHeaders.filter(function (label) {
      return text.includes(label);
    }).length;
    const hasLanguageHeader = text.includes("语言种类") || text.includes("语音种类");
    return matchedRequiredHeaders === requiredHeaders.length && hasLanguageHeader;
  }

  function findNativeSegmentTableContainer(root) {
    const searchRoots = getSearchRoots(root);
    const waveWorkbench = findWaveWorkbench(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const searchRoot = searchRoots[index];
      const tableBodies = collectDescendantElements(searchRoot).filter(function (node) {
        return hasClassToken(node, "arco-table-body");
      });
      for (let bodyIndex = 0; bodyIndex < tableBodies.length; bodyIndex += 1) {
        const tableBody = tableBodies[bodyIndex];
        const tableRoot =
          findClosestAncestorElement(
            tableBody,
            function (node) {
              return hasClassToken(node, "arco-table");
            },
            searchRoot
          ) || tableBody;
        if (!hasSegmentTableSignals(tableRoot)) {
          continue;
        }
        let fallbackCandidate = null;
        let current = tableRoot;
        let depth = 0;
        while (current && current !== searchRoot && depth < 12) {
          if (hasSegmentTableSignals(current)) {
            if (!waveWorkbench || !isNodeWithin(current, waveWorkbench)) {
              if (!fallbackCandidate) {
                fallbackCandidate = current;
              }
              if (hasClassToken(current, "neeko-container")) {
                return current;
              }
            }
          }
          current = current.parentElement || null;
          depth += 1;
        }
        if (fallbackCandidate) {
          return fallbackCandidate;
        }
      }
    }
    return null;
  }

  function setHideableNodeHidden(node, hidden) {
    if (!node || !node.style) {
      return false;
    }
    const style = node.style;
    const currentDisplayValue =
      typeof style.getPropertyValue === "function"
        ? String(style.getPropertyValue("display") || "")
        : String(style.display || "");
    const currentDisplayPriority =
      typeof style.getPropertyPriority === "function"
        ? String(style.getPropertyPriority("display") || "")
        : "";
    if (hidden === true) {
      if (node.__ascPrevDisplayValue === undefined) {
        node.__ascPrevDisplayValue = currentDisplayValue;
        node.__ascPrevDisplayPriority = currentDisplayPriority;
      }
      if (typeof style.setProperty === "function") {
        style.setProperty("display", "none", "important");
      } else {
        style.display = "none";
      }
      return currentDisplayValue !== "none" || currentDisplayPriority !== "important";
    }
    const previousValue = String(node.__ascPrevDisplayValue || "");
    const previousPriority = String(node.__ascPrevDisplayPriority || "");
    if (typeof style.removeProperty === "function") {
      style.removeProperty("display");
    } else {
      style.display = "";
    }
    if (previousValue) {
      if (typeof style.setProperty === "function") {
        style.setProperty("display", previousValue, previousPriority);
      } else {
        style.display = previousValue;
      }
    } else if (typeof style.setProperty === "function" && previousPriority) {
      style.setProperty("display", "", previousPriority);
    } else {
      style.display = "";
    }
    delete node.__ascPrevDisplayValue;
    delete node.__ascPrevDisplayPriority;
    return currentDisplayValue === "none" || currentDisplayPriority === "important";
  }

  function syncHideAuxiliaryZoneButtonLabel(root) {
    const actionGroup = findDetailHeaderActionGroup(root);
    if (!actionGroup || typeof actionGroup.querySelector !== "function") {
      return false;
    }
    const button = actionGroup.querySelector(
      "[" + HIDE_AUXILIARY_ZONE_BUTTON_ATTR + "='true']"
    );
    if (!button) {
      return false;
    }
    const nextLabel = taizhouAuxiliaryZonesHidden ? "显示辅助区" : "隐藏辅助区";
    const changed = String(button.textContent || "") !== nextLabel;
    button.textContent = nextLabel;
    return changed;
  }

  function ensureHideAuxiliaryZoneButton(root, onClick) {
    const actionGroup = findDetailHeaderActionGroup(root);
    if (!actionGroup || typeof actionGroup.querySelector === "undefined") {
      return false;
    }
    if (actionGroup.style) {
      actionGroup.style.display = "inline-flex";
      actionGroup.style.alignItems = "center";
      actionGroup.style.gap = "8px";
      actionGroup.style.flexWrap = "wrap";
    }
    removeLegacyToolbarActionGroups(root);
    const documentLike = actionGroup.ownerDocument || globalThis.document;
    let button =
      typeof actionGroup.querySelector === "function"
        ? actionGroup.querySelector("[" + HIDE_AUXILIARY_ZONE_BUTTON_ATTR + "='true']")
        : null;
    let changed = false;
    if (!button) {
      if (!documentLike || typeof documentLike.createElement !== "function") {
        return false;
      }
      button = documentLike.createElement("button");
      button.type = "button";
      button.setAttribute(HIDE_AUXILIARY_ZONE_BUTTON_ATTR, "true");
      applyHeaderActionButtonStyle(button);
      button.addEventListener("click", function () {
        if (typeof button.__ascOnClick === "function") {
          button.__ascOnClick();
        }
      });
      actionGroup.appendChild(button);
      changed = true;
    }
    button.__ascOnClick = onClick;
    return syncHideAuxiliaryZoneButtonLabel(root) || changed;
  }

  function setTaizhouAuxiliaryZonesHidden(root, hidden) {
    const nextHidden = hidden === true;
    let changed = taizhouAuxiliaryZonesHidden !== nextHidden;
    taizhouAuxiliaryZonesHidden = nextHidden;
    if (helperRuntime?.ui?.setPanelHidden) {
      helperRuntime.ui.setPanelHidden(nextHidden);
    } else {
      changed = setHideableNodeHidden(findTaizhouPanelRoot(root), nextHidden) || changed;
    }
    changed = setHideableNodeHidden(findNativeSegmentTableContainer(root), nextHidden) || changed;
    changed = syncHideAuxiliaryZoneButtonLabel(root) || changed;
    return changed;
  }

  function findSegmentRowsTableRoot(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const descendants = collectDescendantElements(searchRoots[index]);
      const virtualTable = descendants.find(function (node) {
        const className = getClassName(node);
        const text = normalizeText(node?.textContent || node?.innerText || "");
        if (!className.includes("arco-table")) {
          return false;
        }
        if (
          !text.includes("序号") ||
          !text.includes("区间") ||
          !text.includes("转写文本") ||
          (!text.includes("语音种类") && !text.includes("语言种类"))
        ) {
          return false;
        }
        return collectDescendantElements(node).some(function (child) {
          return getClassName(child).includes("arco-table-tr");
        });
      });
      if (virtualTable) {
        return virtualTable;
      }
      const tables = safeQuerySelectorAll(searchRoots[index], "table");
      for (let tableIndex = 0; tableIndex < tables.length; tableIndex += 1) {
        const text = normalizeText(tables[tableIndex]?.textContent || tables[tableIndex]?.innerText || "");
        if (
          text.includes("序号") &&
          text.includes("区间") &&
          text.includes("转写文本") &&
          (text.includes("语音种类") || text.includes("语言种类"))
        ) {
          return tables[tableIndex];
        }
      }
    }
    return null;
  }

  function getSegmentRowCells(rowNode, type) {
    const directChildren = getChildElements(rowNode);
    const expectHeader = type === "header";
    return directChildren.filter(function (node) {
      const tagName = String(node?.tagName || "").toUpperCase();
      const className = getClassName(node);
      if (expectHeader) {
        return tagName === "TH" || className.includes("arco-table-th");
      }
      return tagName === "TD" || className.includes("arco-table-td");
    });
  }

  function getSegmentTableHeaderRow(tableRoot) {
    if (String(tableRoot?.tagName || "").toUpperCase() === "TABLE") {
      return safeQuerySelectorAll(tableRoot, "tr").find(function (node) {
        return safeQuerySelectorAll(node, "th").length > 0;
      }) || null;
    }
    return collectDescendantElements(tableRoot).find(function (node) {
      return getSegmentRowCells(node, "header").length > 0;
    }) || null;
  }

  function getSegmentTableRows(tableRoot) {
    if (String(tableRoot?.tagName || "").toUpperCase() === "TABLE") {
      return safeQuerySelectorAll(tableRoot, "tr").filter(function (node) {
        return safeQuerySelectorAll(node, "td").length > 0;
      });
    }
    return collectDescendantElements(tableRoot).filter(function (node) {
      return getSegmentRowCells(node, "body").length > 0;
    });
  }

  function findDetailScrollContainer(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const nodes = [searchRoots[index]].concat(collectDescendantElements(searchRoots[index]));
      const exact = nodes.find(function (node) {
        return normalizeText(node?.getAttribute?.("id")) === "conbination-wrap";
      });
      if (exact && typeof exact.scrollTop === "number") {
        return exact;
      }
      const fallback = nodes.find(function (node) {
        return getClassName(node).includes("render-zone-container");
      });
      if (fallback && typeof fallback.scrollTop === "number") {
        return fallback;
      }
    }
    return null;
  }

  function findSegmentTableScrollContainer(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const nodes = [searchRoots[index]].concat(collectDescendantElements(searchRoots[index]));
      const matched = nodes.find(function (node) {
        const className = getClassName(node);
        return (
          className.includes("arco-table-body") &&
          !className.includes("arco-table-body-inner")
        );
      });
      if (matched && typeof matched.scrollTop === "number") {
        return matched;
      }
    }
    return null;
  }

  function captureProtectedScrollState(root) {
    const nodes = [];
    const seen = new Set();

    function pushNode(node) {
      if (!node || seen.has(node) || typeof node.scrollTop !== "number") {
        return;
      }
      seen.add(node);
      nodes.push({
        node: node,
        scrollTop: Number(node.scrollTop) || 0,
        scrollLeft: typeof node.scrollLeft === "number" ? Number(node.scrollLeft) || 0 : null,
      });
    }

    pushNode(findDetailScrollContainer(root));
    pushNode(findSegmentTableScrollContainer(root));
    return nodes;
  }

  function restoreProtectedScrollState(state) {
    (Array.isArray(state) ? state : []).forEach(function (entry) {
      if (!entry?.node || typeof entry.node.scrollTop !== "number") {
        return;
      }
      entry.node.scrollTop = entry.scrollTop;
      if (typeof entry.scrollLeft === "number" && typeof entry.node.scrollLeft === "number") {
        entry.node.scrollLeft = entry.scrollLeft;
      }
    });
  }

  function runWithProtectedScrollState(root, callback) {
    const state = captureProtectedScrollState(root);
    let result;
    try {
      result = typeof callback === "function" ? callback() : undefined;
    } catch (error) {
      restoreProtectedScrollState(state);
      throw error;
    }
    if (result && typeof result.then === "function") {
      return result.finally(function () {
        restoreProtectedScrollState(state);
      });
    }
    restoreProtectedScrollState(state);
    return result;
  }

  function getPlaybackScrollGuardNow() {
    return typeof Date.now === "function" ? Date.now() : new Date().getTime();
  }

  function isNodeWithin(ancestor, node) {
    let current = node;
    while (current) {
      if (current === ancestor) {
        return true;
      }
      current = current.parentNode || current.parentElement || null;
    }
    return false;
  }

  function addDisposableEventListener(node, type, listener, options) {
    if (!node || typeof node.addEventListener !== "function") {
      return function () {};
    }
    node.addEventListener(type, listener, options);
    return function () {
      if (typeof node.removeEventListener === "function") {
        node.removeEventListener(type, listener, options);
      }
    };
  }

  function getPlaybackScrollGuardTargetStates() {
    return [playbackScrollGuardState.detail, playbackScrollGuardState.table];
  }

  function clearPlaybackScrollGuardPointerState() {
    getPlaybackScrollGuardTargetStates().forEach(function (target) {
      target.pointerActive = false;
    });
  }

  function capturePlaybackScrollGuardBaseline(target) {
    if (!target?.node) {
      return;
    }
    target.baselineTop =
      typeof target.node.scrollTop === "number" ? Number(target.node.scrollTop) || 0 : 0;
    target.baselineLeft =
      typeof target.node.scrollLeft === "number" ? Number(target.node.scrollLeft) || 0 : 0;
  }

  function rememberPlaybackScrollGuardUserIntent(target) {
    if (!target) {
      return;
    }
    target.lastUserIntentAt = getPlaybackScrollGuardNow();
  }

  function hasRecentPlaybackScrollGuardUserIntent(target, now) {
    if (!target) {
      return false;
    }
    return (
      target.pointerActive === true ||
      now - Number(target.lastUserIntentAt || 0) <= PLAYBACK_SCROLL_GUARD_USER_WINDOW_MS
    );
  }

  function suppressPlaybackScrollGuardAnchor(target) {
    if (!target?.node?.style || typeof target.node.style.setProperty !== "function") {
      return;
    }
    if (!target.styleRestore) {
      target.styleRestore = {
        value:
          typeof target.node.style.getPropertyValue === "function"
            ? target.node.style.getPropertyValue("overflow-anchor")
            : "",
        priority:
          typeof target.node.style.getPropertyPriority === "function"
            ? target.node.style.getPropertyPriority("overflow-anchor")
            : "",
      };
    }
    target.node.style.setProperty("overflow-anchor", "none", "important");
  }

  function restorePlaybackScrollGuardAnchor(target) {
    if (!target?.node?.style || !target.styleRestore) {
      return;
    }
    if (target.styleRestore.value) {
      target.node.style.setProperty(
        "overflow-anchor",
        target.styleRestore.value,
        target.styleRestore.priority || ""
      );
    } else if (typeof target.node.style.removeProperty === "function") {
      target.node.style.removeProperty("overflow-anchor");
    } else {
      target.node.style.setProperty("overflow-anchor", "", "");
    }
    target.styleRestore = null;
  }

  function restorePlaybackScrollGuardTarget(target) {
    if (!playbackScrollGuardState.active || !target?.node) {
      return false;
    }
    const currentTop =
      typeof target.node.scrollTop === "number" ? Number(target.node.scrollTop) || 0 : 0;
    const currentLeft =
      typeof target.node.scrollLeft === "number" ? Number(target.node.scrollLeft) || 0 : 0;
    if (currentTop === target.baselineTop && currentLeft === target.baselineLeft) {
      return false;
    }
    target.ignoreScrollUntil = getPlaybackScrollGuardNow() + PLAYBACK_SCROLL_GUARD_IGNORE_WINDOW_MS;
    if (typeof target.node.scrollTop === "number") {
      target.node.scrollTop = target.baselineTop;
    }
    if (typeof target.node.scrollLeft === "number") {
      target.node.scrollLeft = target.baselineLeft;
    }
    return true;
  }

  function verifyPlaybackScrollGuardTarget(target) {
    if (!playbackScrollGuardState.active || !target?.node) {
      return false;
    }
    const now = getPlaybackScrollGuardNow();
    if (Number(target.ignoreScrollUntil || 0) > now) {
      return false;
    }
    const currentTop =
      typeof target.node.scrollTop === "number" ? Number(target.node.scrollTop) || 0 : 0;
    const currentLeft =
      typeof target.node.scrollLeft === "number" ? Number(target.node.scrollLeft) || 0 : 0;
    if (currentTop === target.baselineTop && currentLeft === target.baselineLeft) {
      return false;
    }
    if (hasRecentPlaybackScrollGuardUserIntent(target, now)) {
      capturePlaybackScrollGuardBaseline(target);
      return false;
    }
    return restorePlaybackScrollGuardTarget(target);
  }

  function resolvePlaybackScrollGuardTargetFromNode(node) {
    if (!node) {
      return null;
    }
    if (playbackScrollGuardState.table?.node && isNodeWithin(playbackScrollGuardState.table.node, node)) {
      return playbackScrollGuardState.table;
    }
    if (playbackScrollGuardState.detail?.node && isNodeWithin(playbackScrollGuardState.detail.node, node)) {
      return playbackScrollGuardState.detail;
    }
    return null;
  }

  function releasePlaybackScrollGuardTarget(target) {
    if (!target) {
      return;
    }
    restorePlaybackScrollGuardAnchor(target);
    (Array.isArray(target.cleanup) ? target.cleanup : []).forEach(function (dispose) {
      try {
        if (typeof dispose === "function") {
          dispose();
        }
      } catch (_error) {
        // Ignore cleanup failures for detached nodes.
      }
    });
    target.cleanup = [];
    target.node = null;
    target.pointerActive = false;
    target.ignoreScrollUntil = 0;
    target.lastUserIntentAt = 0;
    target.baselineTop = 0;
    target.baselineLeft = 0;
  }

  function bindPlaybackScrollGuardTarget(target, node) {
    if (!target) {
      return false;
    }
    if (target.node === node) {
      if (playbackScrollGuardState.active) {
        suppressPlaybackScrollGuardAnchor(target);
      }
      return false;
    }
    releasePlaybackScrollGuardTarget(target);
    if (!node || typeof node.scrollTop !== "number") {
      return true;
    }
    target.node = node;
    capturePlaybackScrollGuardBaseline(target);
    if (playbackScrollGuardState.active) {
      suppressPlaybackScrollGuardAnchor(target);
    }
    target.cleanup = [
      addDisposableEventListener(node, "scroll", function () {
        verifyPlaybackScrollGuardTarget(target);
      }),
      addDisposableEventListener(node, "wheel", function () {
        rememberPlaybackScrollGuardUserIntent(target);
      }),
      addDisposableEventListener(node, "touchmove", function () {
        rememberPlaybackScrollGuardUserIntent(target);
      }),
      addDisposableEventListener(node, "pointerdown", function () {
        target.pointerActive = true;
        rememberPlaybackScrollGuardUserIntent(target);
      }),
      addDisposableEventListener(node, "mousedown", function () {
        target.pointerActive = true;
        rememberPlaybackScrollGuardUserIntent(target);
      }),
      addDisposableEventListener(node, "touchstart", function () {
        target.pointerActive = true;
        rememberPlaybackScrollGuardUserIntent(target);
      }),
    ];
    return true;
  }

  function isPlaybackScrollGuardNavigationEvent(event) {
    const key = normalizeText(event?.key || event?.code);
    return [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      "Space",
    ].indexOf(key) >= 0;
  }

  function bindPlaybackScrollGuardGlobalListeners(root) {
    if (playbackScrollGuardState.globalCleanup.length > 0) {
      return;
    }
    const documentLike = root?.ownerDocument || root || globalThis.document || null;
    const eventTargets = [];
    if (documentLike && typeof documentLike.addEventListener === "function") {
      eventTargets.push(documentLike);
    }
    if (
      globalThis.window &&
      typeof globalThis.window.addEventListener === "function" &&
      eventTargets.indexOf(globalThis.window) < 0
    ) {
      eventTargets.push(globalThis.window);
    }
    playbackScrollGuardState.globalCleanup = eventTargets
      .map(function (node) {
        return [
          addDisposableEventListener(node, "pointerup", clearPlaybackScrollGuardPointerState),
          addDisposableEventListener(node, "mouseup", clearPlaybackScrollGuardPointerState),
          addDisposableEventListener(node, "touchend", clearPlaybackScrollGuardPointerState),
          addDisposableEventListener(node, "touchcancel", clearPlaybackScrollGuardPointerState),
          addDisposableEventListener(node, "keydown", function (event) {
            if (!isPlaybackScrollGuardNavigationEvent(event)) {
              return;
            }
            const eventTarget =
              resolvePlaybackScrollGuardTargetFromNode(
                event?.target || documentLike?.activeElement || null
              );
            if (eventTarget) {
              rememberPlaybackScrollGuardUserIntent(eventTarget);
              return;
            }
            getPlaybackScrollGuardTargetStates().forEach(function (target) {
              rememberPlaybackScrollGuardUserIntent(target);
            });
          }),
        ];
      })
      .flat();
  }

  function releasePlaybackScrollGuardGlobalListeners() {
    (Array.isArray(playbackScrollGuardState.globalCleanup)
      ? playbackScrollGuardState.globalCleanup
      : []
    ).forEach(function (dispose) {
      try {
        if (typeof dispose === "function") {
          dispose();
        }
      } catch (_error) {
        // Ignore cleanup failures for detached nodes.
      }
    });
    playbackScrollGuardState.globalCleanup = [];
    clearPlaybackScrollGuardPointerState();
  }

  function deactivatePlaybackScrollGuard() {
    releasePlaybackScrollGuardGlobalListeners();
    releasePlaybackScrollGuardTarget(playbackScrollGuardState.detail);
    releasePlaybackScrollGuardTarget(playbackScrollGuardState.table);
    playbackScrollGuardState = createPlaybackScrollGuardState();
    return {
      active: false,
    };
  }

  function syncPlaybackScrollGuard(root, options) {
    const source = options && typeof options === "object" ? options : {};
    const resolvedRoot = root || playbackScrollGuardState.root || globalThis.document || null;
    const playing =
      typeof source.playing === "boolean"
        ? source.playing
        : resolvedRoot
          ? isWavePlaybackActive(resolvedRoot)
          : false;
    if (!playing || !resolvedRoot) {
      return deactivatePlaybackScrollGuard();
    }
    if (!playbackScrollGuardState.active) {
      playbackScrollGuardState.active = true;
      bindPlaybackScrollGuardGlobalListeners(resolvedRoot);
    }
    playbackScrollGuardState.root = resolvedRoot;
    bindPlaybackScrollGuardTarget(
      playbackScrollGuardState.detail,
      findDetailScrollContainer(resolvedRoot)
    );
    bindPlaybackScrollGuardTarget(
      playbackScrollGuardState.table,
      findSegmentTableScrollContainer(resolvedRoot)
    );
    verifyPlaybackScrollGuardTarget(playbackScrollGuardState.detail);
    verifyPlaybackScrollGuardTarget(playbackScrollGuardState.table);
    return {
      active: true,
      detailBaselineTop: playbackScrollGuardState.detail.baselineTop,
      tableBaselineTop: playbackScrollGuardState.table.baselineTop,
    };
  }

  function getPlaybackScrollGuardState() {
    return {
      active: playbackScrollGuardState.active === true,
      detailBaselineTop: playbackScrollGuardState.detail.baselineTop,
      tableBaselineTop: playbackScrollGuardState.table.baselineTop,
      detailNodeBound: Boolean(playbackScrollGuardState.detail.node),
      tableNodeBound: Boolean(playbackScrollGuardState.table.node),
    };
  }

  function clearPlaybackScrollGuardWatchdog() {
    if (playbackScrollGuardWatchdogTimer && typeof clearInterval === "function") {
      clearInterval(playbackScrollGuardWatchdogTimer);
    }
    playbackScrollGuardWatchdogTimer = null;
  }

  function runPlaybackScrollGuardWatchdog(root) {
    const resolvedRoot =
      root ||
      (typeof document !== "undefined" ? document : null) ||
      playbackScrollGuardState.root ||
      null;
    const shouldGuard =
      Boolean(resolvedRoot) &&
      runtimeActive === true &&
      runtimePolicy?.runtimeAccessible === true &&
      isDetailPage();
    if (!shouldGuard) {
      syncPlaybackScrollGuard(resolvedRoot, {
        playing: false,
      });
      return false;
    }
    syncPlaybackScrollGuard(resolvedRoot);
    return true;
  }

  function ensurePlaybackScrollGuardWatchdog(root) {
    if (!runPlaybackScrollGuardWatchdog(root)) {
      clearPlaybackScrollGuardWatchdog();
      return false;
    }
    if (playbackScrollGuardWatchdogTimer || typeof setInterval !== "function") {
      return true;
    }
    playbackScrollGuardWatchdogTimer = setInterval(function () {
      if (!runPlaybackScrollGuardWatchdog()) {
        clearPlaybackScrollGuardWatchdog();
      }
    }, PLAYBACK_SCROLL_GUARD_WATCHDOG_INTERVAL_MS);
    return true;
  }

  function getSegmentNumberFromRow(rowNode, fallbackNumber) {
    const cells = getSegmentRowCells(rowNode, "body");
    const firstCellText = normalizeText(cells[0]?.textContent || cells[0]?.innerText || "");
    const matched = firstCellText.match(/\d+/);
    if (matched) {
      const segmentNumber = Math.max(0, Math.round(Number(matched[0])) || 0);
      if (segmentNumber > 0) {
        return segmentNumber;
      }
    }
    return Math.max(1, Math.round(Number(fallbackNumber || 0)) || 1);
  }

  function normalizeSegmentRecognizeOptions(value) {
    if (typeof value === "function") {
      return {
        onRecognize: value,
      };
    }
    return value && typeof value === "object" ? value : {};
  }

  function getSegmentRecognizeActionState(options, segmentNumber) {
    const normalizedOptions = normalizeSegmentRecognizeOptions(options);
    if (typeof normalizedOptions.getActionState === "function") {
      const state = normalizedOptions.getActionState(segmentNumber);
      if (state && typeof state === "object") {
        return state;
      }
    }
    return {
      mode: "recognize",
    };
  }

  function updateSegmentRecognizeButton(button, segmentNumber, options) {
    if (!button) {
      return;
    }
    const state = getSegmentRecognizeActionState(options, segmentNumber);
    const normalizedMode = normalizeText(state.mode);
    const mode = normalizedMode === "recognize" ? "recognize" : "recognize";
    button.textContent = "识别音频";
    button.setAttribute(SEGMENT_RECOGNIZE_ACTION_ATTR, mode);
  }

  function createSegmentRecognizeButton(documentLike, segmentNumber, onRecognize) {
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return null;
    }
    const recognizeOptions = normalizeSegmentRecognizeOptions(onRecognize);
    const button = documentLike.createElement("button");
    button.type = "button";
    button.setAttribute(SEGMENT_RECOGNIZE_BUTTON_ATTR, "true");
    button.setAttribute("data-segment-number", String(segmentNumber));
    button.style.padding = "0 8px";
    button.style.height = "24px";
    button.style.border = "1px solid #d7dce5";
    button.style.borderRadius = "6px";
    button.style.background = "#fff";
    button.style.color = "#39424e";
    button.style.cursor = "pointer";
    button.style.fontSize = "12px";
    button.style.whiteSpace = "nowrap";
    button.addEventListener("click", function () {
      const state = getSegmentRecognizeActionState(recognizeOptions, segmentNumber);
      const normalizedMode = normalizeText(state.mode);
      const mode = normalizedMode === "recognize" ? "recognize" : "recognize";
      if (typeof recognizeOptions.onRecognize === "function") {
        recognizeOptions.onRecognize(segmentNumber);
      }
    });
    updateSegmentRecognizeButton(button, segmentNumber, recognizeOptions);
    return button;
  }

  function createSegmentRecognizeHeaderCell(documentLike, headerRow) {
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return null;
    }
    const headerCells = getSegmentRowCells(headerRow, "header");
    const useArcoLayout =
      String(headerRow?.tagName || "").toUpperCase() !== "TR" ||
      headerCells.some(function (node) {
        return getClassName(node).includes("arco-table-th");
      });
    const headerCell = documentLike.createElement("th");
    headerCell.setAttribute(SEGMENT_RECOGNIZE_HEADER_ATTR, "true");
    if (useArcoLayout) {
      headerCell.setAttribute("class", "arco-table-th");
      headerCell.style.textAlign = "center";
      headerCell.style.width = "100px";
      headerCell.style.minWidth = "100px";
      headerCell.style.maxWidth = "100px";
      const item = documentLike.createElement("div");
      item.setAttribute("class", "arco-table-th-item");
      const title = documentLike.createElement("span");
      title.setAttribute("class", "arco-table-th-item-title");
      title.textContent = "识别音频";
      item.appendChild(title);
      headerCell.appendChild(item);
      return headerCell;
    }
    headerCell.textContent = "识别音频";
    return headerCell;
  }

  function createSegmentRecognizeCell(documentLike, rowNode, button) {
    if (!documentLike || typeof documentLike.createElement !== "function" || !button) {
      return null;
    }
    const bodyCells = getSegmentRowCells(rowNode, "body");
    const useArcoLayout =
      String(rowNode?.tagName || "").toUpperCase() !== "TR" ||
      bodyCells.some(function (node) {
        return getClassName(node).includes("arco-table-td");
      });
    if (useArcoLayout) {
      const cell = documentLike.createElement("div");
      cell.setAttribute("class", "arco-table-td");
      cell.setAttribute(SEGMENT_RECOGNIZE_CELL_ATTR, "true");
      cell.style.textAlign = "center";
      cell.style.width = "100px";
      cell.style.minWidth = "100px";
      cell.style.maxWidth = "100px";
      const wrapper = documentLike.createElement("div");
      wrapper.setAttribute("class", "arco-table-cell");
      wrapper.appendChild(button);
      cell.appendChild(wrapper);
      return cell;
    }
    const cell = documentLike.createElement("td");
    cell.setAttribute(SEGMENT_RECOGNIZE_CELL_ATTR, "true");
    cell.appendChild(button);
    return cell;
  }

  function removeElement(node) {
    if (!node) {
      return false;
    }
    const parentNode = node.parentNode || node.parentElement || null;
    if (!parentNode || typeof parentNode.removeChild !== "function") {
      return false;
    }
    parentNode.removeChild(node);
    return true;
  }

  function isSegmentRecognizeDataRow(rowNode) {
    return safeQuerySelectorAll(rowNode, "textarea").length > 0;
  }

  function cleanupSegmentRecognizeNodes(tableRoot, realRows) {
    const rowSet = new Set(Array.isArray(realRows) ? realRows : []);
    let changed = false;
    getSegmentTableRows(tableRoot).forEach(function (rowNode) {
      if (rowSet.has(rowNode)) {
        return;
      }
      safeQuerySelectorAll(rowNode, "[" + SEGMENT_RECOGNIZE_CELL_ATTR + "='true']").forEach(function (node) {
        changed = removeElement(node) || changed;
      });
    });
    if (rowSet.size <= 0) {
      const headerRow = getSegmentTableHeaderRow(tableRoot);
      if (headerRow) {
        getSegmentRowCells(headerRow, "header").forEach(function (node) {
          if (normalizeText(node?.getAttribute?.(SEGMENT_RECOGNIZE_HEADER_ATTR)) === "true") {
            changed = removeElement(node) || changed;
          }
        });
      }
      safeQuerySelectorAll(tableRoot, "[" + SEGMENT_RECOGNIZE_HEADER_ATTR + "='true']").forEach(function (node) {
        changed = removeElement(node) || changed;
      });
    }
    return changed;
  }

  function ensureSegmentRecognizeButtons(root, onRecognize) {
    const tableRoot = findSegmentRowsTableRoot(root);
    if (!tableRoot) {
      return false;
    }
    const documentLike = tableRoot.ownerDocument || globalThis.document;
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return false;
    }
    return runWithProtectedScrollState(root, function () {
      const recognizeOptions = normalizeSegmentRecognizeOptions(onRecognize);
      const realRows = getSegmentTableRows(tableRoot).filter(isSegmentRecognizeDataRow);
      let inserted = cleanupSegmentRecognizeNodes(tableRoot, realRows);
      if (realRows.length <= 0) {
        return inserted;
      }
      const headerRow = getSegmentTableHeaderRow(tableRoot);
      if (
        headerRow &&
        safeQuerySelectorAll(headerRow, "[" + SEGMENT_RECOGNIZE_HEADER_ATTR + "='true']").length <= 0
      ) {
        const headerCell = createSegmentRecognizeHeaderCell(documentLike, headerRow);
        if (headerCell) {
          headerRow.appendChild(headerCell);
          inserted = true;
        }
      }
      realRows.forEach(function (rowNode, index) {
        const segmentNumber = getSegmentNumberFromRow(rowNode, index + 1);
        const existingButton =
          safeQuerySelectorAll(rowNode, "[" + SEGMENT_RECOGNIZE_BUTTON_ATTR + "='true']")[0] || null;
        if (existingButton) {
          updateSegmentRecognizeButton(existingButton, segmentNumber, recognizeOptions);
          return;
        }
        const button = createSegmentRecognizeButton(
          documentLike,
          segmentNumber,
          recognizeOptions
        );
        if (!button) {
          return;
        }
        const actionCell = createSegmentRecognizeCell(documentLike, rowNode, button);
        if (!actionCell) {
          return;
        }
        rowNode.appendChild(actionCell);
        inserted = true;
      });
      return inserted;
    });
  }

  function scheduleRuntimeReload(runtimeContext) {
    if (typeof setTimeout !== "function") {
      return;
    }
    setTimeout(function () {
      try {
        globalThis.location.reload();
      } catch (_error) {
        runtimeContext?.ui?.setStatus?.("操作已成功，请手动刷新页面复核。", "success");
      }
    }, 350);
  }

  function getToolbarActionNodes(root) {
    const toolbar = findPlayToolbarRoot(root);
    if (!toolbar) {
      return [];
    }
    return Array.from(toolbar.children || []).filter(function (node) {
      return node && node.nodeType === 1;
    });
  }

  function isToolbarActionDisabled(node) {
    if (!node) {
      return true;
    }
    if (node.disabled === true || normalizeText(node.getAttribute?.("disabled")) === "true") {
      return true;
    }
    return getClassName(node).indexOf("disabled-EAukvU") >= 0;
  }

  function findToolbarActionNode(root, fallbackIndex) {
    const nodes = getToolbarActionNodes(root);
    const candidate =
      Number.isInteger(fallbackIndex) && fallbackIndex >= 0 ? nodes[fallbackIndex] || null : null;
    return candidate && !isToolbarActionDisabled(candidate) ? candidate : null;
  }

  function triggerToolbarAction(root, fallbackIndex) {
    const node = findToolbarActionNode(root, fallbackIndex);
    if (!node) {
      return false;
    }
    return invokeClick(node);
  }

  function triggerPlayPauseAction(root) {
    return triggerToolbarAction(root, 1);
  }

  function triggerPlaySelectionAction(root) {
    return triggerToolbarAction(root, 2);
  }

  function triggerJumpToFirstFrameAction(root) {
    return triggerToolbarAction(root, 4);
  }

  function triggerDeleteCurrentSelectionAction(root) {
    return triggerToolbarAction(root, 5);
  }

  async function maybeAutoApplyPreview(runtimeContext, preview) {
    const config = runtimeContext?.config || {};
    const proposedSegments = Array.isArray(preview?.proposedSegments) ? preview.proposedSegments : [];
    if (config.segmentPreviewAutoApplyEnabled === false) {
      return {
        attempted: false,
        ok: false,
        reason: "disabled",
      };
    }
    if (proposedSegments.length <= 0) {
      return {
        attempted: false,
        ok: false,
        reason: "empty",
      };
    }
    const result = await runtimeContext.dataApi.applySegmentPreview(preview);
    if (!result.ok) {
      runtimeContext.ui?.setStatus?.(
        "分段建议已生成，但自动应用失败：" + normalizeText(result.message || "未知错误"),
        "error"
      );
      return {
        attempted: true,
        ok: false,
        result: result,
      };
    }
    runtimeContext.preview = null;
    runtimeContext.segment?.clearPreview?.();
    runtimeContext.ui?.renderPreview?.(null);
    runtimeContext.ui?.setStatus?.(result.message, "success");
    if (typeof runtimeContext.scheduleReload === "function") {
      runtimeContext.scheduleReload();
    } else {
      scheduleRuntimeReload(runtimeContext);
    }
    return {
      attempted: true,
      ok: true,
      result: result,
    };
  }

  function buildActiveSegmentRequestContext(context) {
    const source = context && typeof context === "object" ? context : {};
    const activeSegment = source.activeSegment && typeof source.activeSegment === "object" ? source.activeSegment : null;
    if (!activeSegment) {
      throw new Error("请先在当前题里点击要识别的段。");
    }
    return buildSegmentRequestContext(source, Number(activeSegment.segmentNumber || 0) || 0);
  }

  function buildSegmentRequestContext(context, segmentNumber) {
    const source = context && typeof context === "object" ? context : {};
    const targetSegmentNumber = Math.max(0, Math.round(Number(segmentNumber || 0)) || 0);
    const targetSegment =
      (Array.isArray(source.currentSegments) ? source.currentSegments : []).find(function (item) {
        return Number(item?.segmentNumber || 0) === targetSegmentNumber;
      }) || null;
    if (!targetSegment) {
      throw new Error("当前题里没有找到目标段，请刷新页面后重试。");
    }
    return {
      audioUrl: normalizeText(source.audioUrl),
      selectionKey: normalizeText(source.selectionKey),
      segmentNumber: Number(targetSegment.segmentNumber || 0) || 0,
      selectedRange: {
        startMs: Number(targetSegment.startMs || 0) || 0,
        endMs: Number(targetSegment.endMs || 0) || 0,
        durationMs:
          Math.max(0, Number(targetSegment.endMs || 0) - Number(targetSegment.startMs || 0)) || 0,
      },
      selection: {
        startMs: Number(targetSegment.startMs || 0) || 0,
        endMs: Number(targetSegment.endMs || 0) || 0,
        durationMs:
          Math.max(0, Number(targetSegment.endMs || 0) - Number(targetSegment.startMs || 0)) || 0,
      },
      fieldContext: {
        text: normalizeText(targetSegment.text),
        language: normalizeText(targetSegment.language),
      },
      currentText: normalizeText(targetSegment.text),
      currentLanguage: normalizeText(targetSegment.language),
      editorContext: {
        query: {
          taskId: normalizeText(source.taskId),
          itemId: normalizeText(source.itemId),
          entryId: normalizeText(source.entryId),
          templateID: normalizeText(source.templateID),
        },
      },
    };
  }

  function buildRecommendationDisplayPayload(result) {
    const source = result && typeof result === "object" ? result : {};
    return {
      selectionKey: normalizeText(source.selectionKey),
      segmentNumber: Number(source.segmentNumber || 0) || 0,
      listenText: typeof source.listenText === "string" ? source.listenText : "",
      usage: source.usage && typeof source.usage === "object" ? source.usage : {},
      cost: source.cost && typeof source.cost === "object" ? source.cost : {},
      timing: source.timing && typeof source.timing === "object" ? source.timing : {},
      models: source.models && typeof source.models === "object" ? source.models : {},
      raw: source.raw && typeof source.raw === "object" ? source.raw : {},
      debug: source.debug && typeof source.debug === "object" ? source.debug : {},
    };
  }

  async function fillCurrentRecommendation(runtimeContext, recommendation) {
    if (recommendation?.listenText === "") {
      runtimeContext?.ui?.setStatus?.("识别结果为空，未填入任何文本。", "warning");
      return { ok: true, filledCount: 0, skippedCount: 1 };
    }
    if (!runtimeContext?.dataApi?.fillCurrentRegionTextIntoDom) {
      const result = { ok: false, message: "当前版本缺少单段直填能力，请刷新扩展后重试。" };
      runtimeContext?.ui?.setStatus?.(result.message, "error");
      return result;
    }
    const result = await runtimeContext.dataApi.fillCurrentRegionTextIntoDom({
      segmentNumber: recommendation.segmentNumber,
      listenText: recommendation.listenText,
    });
    runtimeContext.ui?.setStatus?.(result.message, result.filledCount > 0 ? "success" : "warning");
    return result;
  }


  function buildSegmentRecognizeButtonOptions() {
    return {
      onRecognize: function (segmentNumber) {
        void handleRowRecommendAction(segmentNumber);
      },
      getActionState: function () {
        return { mode: "recognize" };
      },
    };
  }

  function buildSegmentRecognizeLayoutSignature(root, onRecognize) {
    const tableRoot = findSegmentRowsTableRoot(root);
    if (!tableRoot) {
      return "";
    }
    const recognizeOptions = normalizeSegmentRecognizeOptions(onRecognize);
    const headerRow = getSegmentTableHeaderRow(tableRoot);
    const headerCellCount = headerRow
      ? getSegmentRowCells(headerRow, "header").filter(function (node) {
          return normalizeText(node?.getAttribute?.(SEGMENT_RECOGNIZE_HEADER_ATTR)) !== "true";
        }).length
      : 0;
    const rowSignature = getSegmentTableRows(tableRoot)
      .filter(isSegmentRecognizeDataRow)
      .map(function (rowNode, index) {
        const segmentNumber = getSegmentNumberFromRow(rowNode, index + 1);
        const bodyCellCount = getSegmentRowCells(rowNode, "body").filter(function (node) {
          return normalizeText(node?.getAttribute?.(SEGMENT_RECOGNIZE_CELL_ATTR)) !== "true";
        }).length;
        const actionState = recognizeOptions.getActionState(segmentNumber) || {};
        return [
          segmentNumber,
          bodyCellCount,
          normalizeText(actionState.mode) || "recognize",
        ].join(":");
      })
      .join("|");
    return [headerCellCount, rowSignature].join("||");
  }

  function syncRowRecognizeButtons(options) {
    const source = options && typeof options === "object" ? options : {};
    const root = source.root || (typeof document !== "undefined" ? document : null);
    if (!root) {
      return false;
    }
    const recognizeOptions = source.recognizeOptions || buildSegmentRecognizeButtonOptions();
    const nextSignature = buildSegmentRecognizeLayoutSignature(root, recognizeOptions);
    if (helperRuntime) {
      if (!nextSignature) {
        helperRuntime.rowRecognizeLayoutSignature = "";
      } else if (
        source.force !== true &&
        normalizeText(helperRuntime.rowRecognizeLayoutSignature) === nextSignature
      ) {
        return false;
      }
    }
    const changed = ensureSegmentRecognizeButtons(root, recognizeOptions);
    if (helperRuntime) {
      helperRuntime.rowRecognizeLayoutSignature =
        buildSegmentRecognizeLayoutSignature(root, recognizeOptions) || nextSignature;
    }
    return changed;
  }

  function syncPlaybackSensitiveDecorations(root, config) {
    if (!root || runtimePolicy.runtimeAccessible !== true) {
      return {
        changed: false,
        deferred: false,
      };
    }
    if (isWavePlaybackActive(root)) {
      return {
        changed: false,
        deferred: true,
      };
    }
    const resolvedConfig =
      config && typeof config === "object"
        ? config
        : helperRuntime?.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS || {});
    const playbackScopeKey =
      normalizeText(resolvedConfig.playbackScopeKey) ||
      helperRuntime?.playbackScopeKey ||
      getCurrentPlaybackScopeKey();
    const readOnly = isReadOnlyScanPage() || resolvedConfig.readOnly === true;
    return runWithProtectedScrollState(root, function () {
      let changed = false;
      changed =
        applyWaveToolSettings(
          root,
          Object.assign({}, resolvedConfig, {
            playbackScopeKey: playbackScopeKey,
          })
        ) || changed;
      if (!readOnly) {
        changed =
          ensureClearSegmentsButton(root, function () {
            void handleClearSegmentsAction();
          }) || changed;
        changed =
          ensureFillLanguageKindsButton(root, function () {
            void handleFillLanguageKindsAction();
          }) || changed;
        changed =
          syncRecordingImportButton(root, {
            recordingTaskCode: resolvedConfig.recordingImportTaskCode,
            contextReady: helperRuntime?.recordingContextReady === true,
            contextMessage: helperRuntime?.recordingContextMessage,
            busy: helperRuntime?.recordingImportBusy === true,
            onClick: function () {
              void handleRecordingImportAction();
            },
          }) || changed;
      }
      changed =
        ensureHideAuxiliaryZoneButton(root, function () {
          setTaizhouAuxiliaryZonesHidden(root, !taizhouAuxiliaryZonesHidden);
        }) || changed;
      changed = setTaizhouAuxiliaryZonesHidden(root, taizhouAuxiliaryZonesHidden) || changed;
      changed =
        syncRowRecognizeButtons({
          root: root,
        }) || changed;
      return {
        changed: changed,
        deferred: false,
      };
    });
  }

  function createConcurrentTaskRunner(tasks, concurrency, runTask, onSettled, shouldStop) {
    const queue = Array.isArray(tasks) ? tasks.slice() : [];
    const limit = Math.max(1, Math.round(Number(concurrency || 1)) || 1);
    return new Promise(function (resolve) {
      let activeCount = 0;
      let nextIndex = 0;

      function launchNext() {
        if ((nextIndex >= queue.length || shouldStop()) && activeCount <= 0) {
          resolve();
          return;
        }
        while (activeCount < limit && nextIndex < queue.length && !shouldStop()) {
          const task = queue[nextIndex];
          nextIndex += 1;
          activeCount += 1;
          Promise.resolve()
            .then(function () {
              return runTask(task);
            })
            .then(function (value) {
              onSettled({
                ok: true,
                task: task,
                value: value,
              });
            })
            .catch(function (error) {
              onSettled({
                ok: false,
                task: task,
                error: error,
              });
            })
            .finally(function () {
              activeCount -= 1;
              launchNext();
            });
        }
      }

      launchNext();
    });
  }

  function createBatchRecommendController(options) {
    const deps = options && typeof options === "object" ? options : {};
    const dataApi = deps.dataApi || null;
    const ai = deps.ai || null;
    const ui = deps.ui || null;
    const readOnly = deps.readOnly === true;
    let activeRun = null;
    function getIdleActionMode() {
      return readOnly ? "recognizeOnly" : "recognizeAndWrite";
    }

    function pickBatchAiActiveSegment(results) {
      const list = Array.isArray(results) ? results : [];
      for (let index = 0; index < list.length; index += 1) {
        const segmentNumber = Number(list[index]?.segmentNumber || 0) || 0;
        if (segmentNumber > 0) {
          return segmentNumber;
        }
      }
      return 0;
    }

    function render(run, phaseText, actionMode) {
      const source = run && typeof run === "object" ? run : {};
      const normalizedActionMode = normalizeText(actionMode) || getIdleActionMode();
      ui?.renderBatchState?.({
        phaseText: phaseText,
        actionMode: normalizedActionMode,
        totalCount: Number(source.totalCount || 0) || 0,
        concurrency: Number(source.concurrency || 0) || 0,
        succeededCount: Number(source.succeededCount || 0) || 0,
        failedCount: Number(source.failedCount || 0) || 0,
        skippedCount: Number(source.skippedCount || 0) || 0,
        currentSegmentNumber: Number(source.currentSegmentNumber || 0) || 0,
        failures: Array.isArray(source.failures) ? source.failures.slice() : [],
      });
    }

    async function runRecognition(selectedNumbers) {
      if (activeRun) {
        ui?.setStatus?.("当前已有正在运行的批量识别，请先等待完成或点击停止批量。", "error");
        return {
          ok: false,
          message: "当前已有正在运行的批量识别，请先等待完成或点击停止批量。",
        };
      }
      if (
        !dataApi?.getCurrentContext ||
        (!readOnly && !dataApi?.writeBatchRegionTexts) ||
        !ai?.recommendForSegment ||
        !ai?.createSharedAudioSource
      ) {
        throw new Error("当前脚本缺少批量识别运行时依赖。");
      }
      const lockedContext = await dataApi.getCurrentContext();
      if (!normalizeText(lockedContext?.audioUrl)) {
        throw new Error("当前还没拿到音频地址，请等待页面初始化完成后重试。");
      }
      const currentSegments = Array.isArray(lockedContext.currentSegments) ? lockedContext.currentSegments : [];
      const normalizedSelected = Array.isArray(selectedNumbers) && selectedNumbers.length > 0
        ? selectedNumbers.map(function (value) {
            return Math.max(1, Math.round(Number(value || 0)) || 0);
          })
        : currentSegments.map(function (item) {
            return Number(item.segmentNumber || 0) || 0;
          });
      const tasks = currentSegments.filter(function (segment) {
        return normalizedSelected.indexOf(Number(segment.segmentNumber || 0) || 0) >= 0;
      });
      if (tasks.length <= 0) {
        throw new Error("当前没有命中可批量处理的段落。");
      }
      const sharedAudioSource = ai.createSharedAudioSource(lockedContext.audioUrl);
      const run = {
        selectionKey: normalizeText(lockedContext.selectionKey),
        currentSignature: normalizeText(lockedContext.currentSignature),
        totalCount: tasks.length,
        concurrency: 5,
        currentSegmentNumber: 0,
        succeededCount: 0,
        failedCount: 0,
        skippedCount: 0,
        failures: [],
        updates: [],
        results: [],
        stopRequested: false,
      };
      activeRun = run;
      render(run, "批量识别进行中", "running");

      await createConcurrentTaskRunner(
        tasks,
        run.concurrency,
        function (segment) {
          run.currentSegmentNumber = Number(segment.segmentNumber || 0) || 0;
          return ai.recommendForSegment(
            {
              audioUrl: lockedContext.audioUrl,
              selectionKey: lockedContext.selectionKey,
              segmentNumber: run.currentSegmentNumber,
              selectedRange: {
                startMs: Number(segment.startMs || 0) || 0,
                endMs: Number(segment.endMs || 0) || 0,
                durationMs:
                  Math.max(0, Number(segment.endMs || 0) - Number(segment.startMs || 0)) || 0,
              },
              fieldContext: {
                text: normalizeText(segment.text),
                language: normalizeText(segment.language),
              },
              editorContext: {
                query: {
                  taskId: normalizeText(lockedContext.taskId),
                  itemId: normalizeText(lockedContext.itemId),
                  entryId: normalizeText(lockedContext.entryId),
                  templateID: normalizeText(lockedContext.templateID),
                },
              },
            },
            sharedAudioSource
          );
        },
        function (entry) {
          if (entry.ok) {
            const payload = buildRecommendationDisplayPayload(entry.value);
            run.results.push(payload);
            if (payload.listenText !== "") {
              const update = {
                segmentNumber: payload.segmentNumber,
                listenText: payload.listenText,
              };
              run.updates.push(update);
              run.succeededCount += 1;
            } else {
              run.skippedCount += 1;
            }
          } else {
            run.failedCount += 1;
            run.failures.push({
              segmentNumber: Number(entry.task?.segmentNumber || 0) || 0,
              message: entry.error?.message || String(entry.error),
            });
          }
          render(run, run.stopRequested ? "批量识别停止中" : "批量识别进行中", "running");
        },
        function () {
          return run.stopRequested === true;
        }
      );

      const liveContext = await dataApi.getCurrentContext();
      if (
        normalizeText(liveContext?.selectionKey) !== run.selectionKey ||
        normalizeText(liveContext?.currentSignature) !== run.currentSignature
      ) {
        activeRun = null;
        return {
          ok: false,
          message: "当前题或分段状态已变化，已取消批量写回，请刷新后重试。",
        };
      }

      run.results.sort(function (left, right) {
        return (Number(left.segmentNumber || 0) || 0) - (Number(right.segmentNumber || 0) || 0);
      });
      run.updates.sort(function (left, right) {
        return (Number(left.segmentNumber || 0) || 0) - (Number(right.segmentNumber || 0) || 0);
      });
      activeRun = null;
      ui?.renderBatchAiResults?.(run.results, pickBatchAiActiveSegment(run.results));
      return {
        ok: true,
        message: "批量识别已完成。",
        selectionKey: run.selectionKey,
        currentSignature: run.currentSignature,
        totalCount: run.totalCount,
        concurrency: run.concurrency,
        succeededCount: run.succeededCount,
        failedCount: run.failedCount,
        skippedCount: run.skippedCount,
        failures: run.failures.slice(),
        results: run.results.slice(),
        updates: run.updates.slice(),
        stopRequested: run.stopRequested === true,
      };
    }

    async function writeUpdates(selectionKey, currentSignature, updates) {
      if (readOnly) {
        return {
          ok: true,
          message: "批量识别完成，结果仅供预览和复制。",
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      return dataApi.writeBatchRegionTexts({
        selectionKey: selectionKey,
        currentSignature: currentSignature,
        updates: Array.isArray(updates) ? updates.slice() : [],
      });
    }

    async function start(selectedNumbers) {
      const result = await runRecognition(selectedNumbers);
      if (!result?.ok) {
        return result;
      }
      if (result.stopRequested === true) {
        render(
          {
            totalCount: result.totalCount,
            concurrency: result.concurrency,
            succeededCount: result.succeededCount,
            failedCount: result.failedCount,
            skippedCount: result.skippedCount,
            failures: result.failures,
          },
          "批量识别已停止",
          getIdleActionMode()
        );
        const message = "批量识别已停止，已返回结果未写回平台。";
        ui?.setStatus?.(message, "warning");
        return Object.assign({}, result, {
          message: message,
          writtenCount: 0,
        });
      }
      const saveResult = await writeUpdates(
        result.selectionKey,
        result.currentSignature,
        result.updates
      );
      const skippedCount = result.skippedCount + Number(saveResult.skippedCount || 0);
      render(
        {
          totalCount: result.totalCount,
          concurrency: result.concurrency,
          succeededCount: result.succeededCount,
          failedCount: result.failedCount,
          skippedCount: skippedCount,
          failures: result.failures,
        },
        readOnly ? "批量识别完成" : saveResult.ok ? "批量写回完成" : "批量写回失败",
        getIdleActionMode()
      );
      ui?.setStatus?.(
        saveResult.message,
        saveResult.ok && saveResult.writtenCount > 0 ? "success" : saveResult.ok ? "warning" : "error"
      );
      return Object.assign({}, result, saveResult, {
        skippedCount: skippedCount,
      });
    }

    function stop() {
      if (!activeRun) {
        return false;
      }
      activeRun.stopRequested = true;
      ui?.setStatus?.("正在停止批量识别，已发出的请求会等待返回。", "warning");
      render(activeRun, "批量识别停止中", "running");
      return true;
    }

    function dispose() {
      activeRun = null;
    }

    return {
      start,
      stop,
      dispose,
    };
  }

  function createShortcutActions(deps) {
    const source = deps && typeof deps === "object" ? deps : {};
    const readOnly = source.readOnly === true;
    return {
      togglePlayPause: function () {
        return source.onTogglePlayPause?.();
      },
      playSelection: function () {
        return source.onPlaySelection?.();
      },
      jumpToFirstFrame: function () {
        return source.onJumpToFirstFrame?.();
      },
      deleteCurrentSelection: function () {
        if (readOnly) {
          return;
        }
        return source.onDeleteCurrentSelection?.();
      },
      clearSegments: function () {
        if (readOnly) {
          return;
        }
        return source.onClearSegments?.();
      },
      previewSegments: function () {
        if (readOnly) {
          return;
        }
        return source.onPreviewSegments?.();
      },
      applyPreviewSegments: function () {
        if (readOnly) {
          return;
        }
        return source.onApplyPreviewSegments?.();
      },
    };
  }

  function getComboboxDisplayText(node) {
    if (!node) {
      return "";
    }
    const valueNode =
      (typeof node.querySelector === "function" &&
        (node.querySelector(".arco-select-view-value") ||
          node.querySelector(".arco-select-view-input"))) ||
      null;
    const text = normalizeText(valueNode?.textContent || valueNode?.value || node.getAttribute?.("title"));
    return text || getNodeText(node);
  }

  function findSegmentLanguageTableRoot(root) {
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const tables = Array.from(searchRoots[index].querySelectorAll?.("table, div") || []);
      const matched = tables.find(function (node) {
        const text = getNodeText(node);
        return (
          (text.includes("语言种类") || text.includes("语音种类")) &&
          text.includes("转写文本") &&
          text.includes("区间")
        );
      });
      if (matched) {
        return matched;
      }
    }
    return null;
  }

  function findEmptyLanguageKindComboboxes(root) {
    const tableRoot = findSegmentLanguageTableRoot(root);
    if (!tableRoot || typeof tableRoot.querySelectorAll !== "function") {
      return [];
    }
    return Array.from(tableRoot.querySelectorAll("[role='combobox']")).filter(function (node) {
      const className = getClassName(node);
      const displayText = getComboboxDisplayText(node);
      if (!className.includes("arco-select")) {
        return false;
      }
      return !displayText || displayText === "请选择";
    });
  }

  function findNodeByAttribute(root, name, value) {
    const attrName = normalizeText(name);
    const attrValue = normalizeText(value);
    if (!root || !attrName || !attrValue) {
      return null;
    }
    return (
      collectDescendantElements(root).find(function (node) {
        return normalizeText(node.getAttribute?.(attrName)) === attrValue;
      }) || null
    );
  }

  function isNodeHidden(node) {
    let current = node;
    while (current && current.nodeType === 1) {
      if (current.hidden === true) {
        return true;
      }
      const hiddenAttr = normalizeText(current.getAttribute?.("hidden")).toLowerCase();
      if (hiddenAttr === "true" || hiddenAttr === "hidden") {
        return true;
      }
      const ariaHidden = normalizeText(current.getAttribute?.("aria-hidden")).toLowerCase();
      if (ariaHidden === "true") {
        return true;
      }
      const className = getClassName(current).toLowerCase();
      if (className.includes("hidden")) {
        return true;
      }
      const displayValue =
        typeof current.style?.getPropertyValue === "function"
          ? normalizeText(current.style.getPropertyValue("display")).toLowerCase()
          : "";
      if (displayValue === "none") {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function collectDialectOptions(root, label) {
    const targetLabel = normalizeText(label);
    if (!root || !targetLabel) {
      return [];
    }
    return collectDescendantElements(root).filter(function (node) {
      const role = normalizeText(node.getAttribute?.("role")).toLowerCase();
      const className = getClassName(node);
      if (
        role !== "option" &&
        !className.includes("arco-select-option") &&
        !className.includes("arco-select-option-content")
      ) {
        return false;
      }
      if (getNodeText(node) !== targetLabel) {
        return false;
      }
      return !isNodeHidden(node);
    });
  }

  function findComboboxPopup(root, combobox) {
    const popupId = normalizeText(combobox?.getAttribute?.("aria-controls"));
    if (!popupId) {
      return null;
    }
    const searchRoots = getSearchRoots(root);
    for (let index = 0; index < searchRoots.length; index += 1) {
      const popupNode = findNodeByAttribute(searchRoots[index], "id", popupId);
      if (popupNode) {
        return popupNode;
      }
    }
    return null;
  }

  function findDialectOption(root, label, combobox) {
    const scopedPopup = findComboboxPopup(root, combobox);
    if (scopedPopup) {
      const scopedMatches = collectDialectOptions(scopedPopup, label);
      if (scopedMatches.length === 1) {
        return scopedMatches[0];
      }
      if (scopedMatches.length > 1) {
        return null;
      }
    }

    const targetLabel = normalizeText(label);
    const searchRoots = getSearchRoots(root);
    const matches = [];
    searchRoots.forEach(function (searchRoot) {
      collectDialectOptions(searchRoot, targetLabel).forEach(function (node) {
        matches.push(node);
      });
    });
    return matches.length === 1 ? matches[0] : null;
  }

  async function triggerInternalQualityControlWithDebugger(node, itemId, action) {
    const rect = getNodeRect(node);
    const left = Number(rect?.left);
    const top = Number(rect?.top);
    const width = Number(rect?.width);
    const height = Number(rect?.height);
    const normalizedItemId = normalizeText(itemId);
    const normalizedAction = normalizeText(action);
    if (
      !normalizedItemId ||
      (normalizedAction !== "submit" && normalizedAction !== "quality-ok-radio") ||
      !Number.isFinite(left) ||
      !Number.isFinite(top) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0 ||
      left + width / 2 < 0 ||
      top + height / 2 < 0
    ) {
      return { ok: false, message: "无法确认右上角“提交”按钮的可点击位置。" };
    }
    try {
      const response = await sendRuntimeMessage({
        type: "ASR_EDGE_AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK",
        action: normalizedAction,
        itemId: normalizedItemId,
        x: left + width / 2,
        y: top + height / 2,
      });
      if (response?.ok === true && response?.result?.ok === true) {
        return { ok: true };
      }
      const failureReason = normalizeText(response?.result?.reason);
      if (failureReason === "debugger-attach-failed") {
        return { ok: false, message: "受限鼠标输入无法附着到当前标签页，未提交并已停止自动流程。" };
      }
      if (failureReason === "debugger-mouse-press-failed") {
        return { ok: false, message: "受限鼠标按下未被浏览器接受，未提交并已停止自动流程。" };
      }
      if (failureReason === "debugger-mouse-release-failed") {
        return { ok: false, message: "受限鼠标抬起未被浏览器接受，未提交并已停止自动流程。" };
      }
      if (failureReason === "debugger-detach-failed") {
        return { ok: false, message: "受限鼠标输入完成后无法安全断开，未提交并已停止自动流程。" };
      }
      if (failureReason === "debugger-click-unavailable") {
        return { ok: false, message: "扩展未获得受限鼠标输入能力，未提交并已停止自动流程。" };
      }
    } catch (_error) {
      // The controller owns the safe-stop message and must not fall back to DOM click.
    }
    return { ok: false, message: "浏览器未接受受限鼠标点击，未提交并已停止自动流程。" };
  }

  function triggerInternalQualitySubmitWithDebugger(node, itemId) {
    return triggerInternalQualityControlWithDebugger(node, itemId, "submit");
  }

  function collectInternalQualitySegmentRows(root) {
    const tableRoot = findSegmentLanguageTableRoot(root);
    if (!tableRoot) {
      return { ok: false, reason: "missing-segment-table", rows: [] };
    }
    const rows = collectDescendantElements(tableRoot).filter(function (node) {
      return (
        getClassName(node).split(/\s+/).includes("arco-table-tr") &&
        Boolean(normalizeText(node.getAttribute?.("data-neeko-table-row-key"))) &&
        isNodeAndAncestorsVisible(node)
      );
    });
    return rows.length > 0
      ? { ok: true, rows: rows }
      : { ok: false, reason: "missing-segment-rows", rows: [] };
  }

  function collectVisibleSegmentComboboxes(row) {
    return collectDescendantElements(row).filter(function (node) {
      return (
        normalizeText(node.getAttribute?.("role")).toLowerCase() === "combobox" &&
        getClassName(node).includes("arco-select") &&
        isNodeAndAncestorsVisible(node) &&
        normalizeText(node.getAttribute?.("aria-disabled")).toLowerCase() !== "true"
      );
    });
  }

  function collectVisibleInternalQualityInputs(row) {
    return collectVisibleRadioInputs(row).filter(function (node) {
      const value = getRadioInputValue(node);
      const label = getRadioInputLabel(node);
      return (value === "ok" && label === "合格") || (value === "failed" && label === "不合格");
    });
  }

  function getRadioInputLabelNode(node) {
    const parent = node?.parentElement || node?.parentNode || null;
    return String(parent?.tagName || "").toUpperCase() === "LABEL" ? parent : null;
  }

  async function correctInternalQualitySegments(root, options) {
    const source = options && typeof options === "object" ? options : {};
    const waitForNetworkQuiet =
      typeof source.waitForNetworkQuiet === "function"
        ? source.waitForNetworkQuiet
        : async function () { return true; };
    const isActive = typeof source.isActive === "function" ? source.isActive : function () { return true; };
    const rowResult = collectInternalQualitySegmentRows(root);
    if (!rowResult.ok) {
      return { ok: false, reason: rowResult.reason };
    }
    let correctedLanguageCount = 0;
    let correctedQualityCount = 0;
    for (let index = 0; index < rowResult.rows.length; index += 1) {
      if (!isActive()) {
        return { ok: false, reason: "stopped" };
      }
      const row = rowResult.rows[index];
      const comboboxes = collectVisibleSegmentComboboxes(row);
      if (comboboxes.length !== 1) {
        return { ok: false, reason: "segment-language-ambiguous" };
      }
      const combobox = comboboxes[0];
      if (getComboboxDisplayText(combobox) !== "目标方言") {
        if (!(await waitForNetworkQuiet()) || !isActive()) {
          return { ok: false, reason: "network-or-stopped" };
        }
        if (!invokeClick(combobox)) {
          return { ok: false, reason: "cannot-open-language" };
        }
        const option = findDialectOption(root, "目标方言", combobox);
        if (!option || !invokeClick(option)) {
          collapseCombobox(combobox);
          return { ok: false, reason: "missing-target-dialect" };
        }
        source.recordAction?.();
        if (!(await waitForNetworkQuiet()) || !isActive()) {
          return { ok: false, reason: "network-or-stopped" };
        }
        if (getComboboxDisplayText(combobox) !== "目标方言") {
          return { ok: false, reason: "language-not-confirmed" };
        }
        correctedLanguageCount += 1;
      }
      const qualityInputs = collectVisibleInternalQualityInputs(row);
      const okInputs = qualityInputs.filter(function (node) {
        return getRadioInputValue(node) === "ok";
      });
      const failedInputs = qualityInputs.filter(function (node) {
        return getRadioInputValue(node) === "failed";
      });
      const checkedInputs = qualityInputs.filter(isCheckedRadioInput);
      if (okInputs.length !== 1 || failedInputs.length !== 1 || checkedInputs.length > 1) {
        return { ok: false, reason: "segment-quality-ambiguous" };
      }
      if (!isCheckedRadioInput(okInputs[0])) {
        const label = getRadioInputLabelNode(okInputs[0]);
        if (!label || !(await waitForNetworkQuiet()) || !isActive()) {
          return { ok: false, reason: "network-or-stopped" };
        }
        let clicked = false;
        let clickMessage = "";
        try {
          const clickResult = typeof source.triggerInternalQualityClick === "function"
            ? await source.triggerInternalQualityClick(label)
            : invokeClick(label);
          clicked = clickResult === true || clickResult?.ok === true;
          clickMessage = normalizeText(clickResult?.message);
        } catch (_error) {
          clicked = false;
        }
        if (!clicked) {
          return Object.assign(
            { ok: false, reason: "cannot-set-internal-quality" },
            clickMessage ? { message: clickMessage } : {}
          );
        }
        source.recordAction?.();
        if (!(await waitForNetworkQuiet()) || !isActive()) {
          return { ok: false, reason: "network-or-stopped" };
        }
        const confirmedInputs = collectVisibleInternalQualityInputs(row);
        const confirmedOk = confirmedInputs.filter(function (node) {
          return getRadioInputValue(node) === "ok" && isCheckedRadioInput(node);
        });
        const confirmedChecked = confirmedInputs.filter(isCheckedRadioInput);
        if (confirmedInputs.length !== 2 || confirmedOk.length !== 1 || confirmedChecked.length !== 1) {
          return { ok: false, reason: "internal-quality-not-confirmed" };
        }
        correctedQualityCount += 1;
      }
    }
    return {
      ok: true,
      correctedLanguageCount: correctedLanguageCount,
      correctedQualityCount: correctedQualityCount,
    };
  }

  function collapseCombobox(node) {
    if (!node) {
      return;
    }
    focusControl(node);
    dispatchKeyboardEvent(node, "keydown", "Escape");
    dispatchKeyboardEvent(node, "keyup", "Escape");
    dispatchControlEvent(node, "blur");
    if (normalizeText(node.getAttribute?.("aria-expanded")).toLowerCase() === "true") {
      invokeClick(node);
    }
  }

  async function fillEmptyLanguageKinds(root) {
    const comboboxes = findEmptyLanguageKindComboboxes(root);
    if (comboboxes.length <= 0) {
      return {
        ok: true,
        filledCount: 0,
      };
    }
    let filledCount = 0;
    for (let index = 0; index < comboboxes.length; index += 1) {
      const node = comboboxes[index];
      const displayText = getComboboxDisplayText(node);
      if (displayText && displayText !== "请选择") {
        continue;
      }
      invokeClick(node);
      await waitFor(30);
      const option = findDialectOption(root, "目标方言", node);
      if (!option) {
        collapseCombobox(node);
        await waitFor(10);
        return {
          ok: false,
          filledCount: filledCount,
          reason: "missing-target-option",
        };
      }
      invokeClick(option);
      filledCount += 1;
      await waitFor(30);
    }
    return {
      ok: true,
      filledCount: filledCount,
    };
  }

  function findHiddenPlatformAiTargets(root) {
    if (!root) {
      return [];
    }
    return safeQuerySelectorAll(root, "[" + HIDDEN_ATTR + "='true']").filter(isHideableNode);
  }

  function syncPlatformAiVisibility(root, shouldHide) {
    if (shouldHide) {
      return applyPlatformAiVisibility(findPlatformAiTargets(root), true);
    }
    return applyPlatformAiVisibility(findHiddenPlatformAiTargets(root), false);
  }

  async function loadSettings() {
    if (STORAGE && typeof STORAGE.getSettings === "function") {
      try {
        return await STORAGE.getSettings();
      } catch (_error) {
        // Ignore storage read failures and fall back to defaults below.
      }
    }
    return CONSTANTS.DEFAULT_SETTINGS || {};
  }

  function clearHelperSyncTimer() {
    if (helperSyncTimer && typeof clearTimeout === "function") {
      clearTimeout(helperSyncTimer);
    }
    helperSyncTimer = null;
  }

  function destroyHelperRuntime() {
    clearHelperSyncTimer();
    clearPlaybackScrollGuardWatchdog();
    deactivatePlaybackScrollGuard();
    playbackRateSyncToken = 0;
    playbackRateAutoSyncState = {
      target: null,
      scopeKey: "",
      status: "idle",
    };
    waveZoomSyncToken = 0;
    waveZoomAutoSyncState = {
      target: null,
      status: "idle",
    };
    wavePlaybackActivityState = {
      lastElapsedMs: null,
      lastObservedAt: 0,
      activeUntil: 0,
    };
    helperRuntime?.recordingAutomation?.stop?.("页面已切换，自动流程已停止。");
    helperRuntime?.internalQualitySubmitAutomation?.stop?.("页面已切换，自动流程已停止。");
    if (helperRuntime?.ui?.destroy) {
      helperRuntime.ui.destroy();
    }
    if (helperRuntime?.batchController?.dispose) {
      helperRuntime.batchController.dispose();
    }
    if (helperRuntime?.shortcuts?.destroy) {
      helperRuntime.shortcuts.destroy();
    }
    if (helperRuntime?.dataApi?.destroy) {
      helperRuntime.dataApi.destroy();
    }
    helperRuntime = null;
  }

  function scheduleHelperContextRefresh(delayMs) {
    if (!helperRuntime || helperSyncTimer || typeof setTimeout !== "function") {
      return;
    }
    helperSyncTimer = setTimeout(async function () {
      helperSyncTimer = null;
      if (!runtimeActive || !helperRuntime) {
        return;
      }
      try {
        if (typeof document !== "undefined" && isWavePlaybackActive(document)) {
          return;
        }
        runWithProtectedScrollState(document, function () {
          helperRuntime.ui.mount();
        });
        const initialSyncResult = syncPlaybackSensitiveDecorations(
          document,
          Object.assign({}, helperRuntime.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS), {
            playbackScopeKey: helperRuntime.playbackScopeKey,
          })
        );
        if (initialSyncResult.deferred) {
          return;
        }
        const context = await helperRuntime.dataApi.getCurrentContext();
        let recordingSourceItemId = "";
        if (helperRuntime.recordingImportEnabled === true) {
          const recordingImportContext =
            typeof helperRuntime.dataApi.getRecordingImportContext === "function"
              ? await helperRuntime.dataApi.getRecordingImportContext()
              : null;
          recordingSourceItemId = normalizeText(
            recordingImportContext?.sourceItemId || context?.itemId
          );
          updateRecordingImportContextState(
            helperRuntime,
            recordingSourceItemId,
            recordingImportContext
          );
        }
        helperRuntime.playbackScopeKey =
          normalizeText(context?.selectionKey) ||
          helperRuntime.playbackScopeKey ||
          getCurrentPlaybackScopeKey();
        const contextSyncResult = syncPlaybackSensitiveDecorations(
          document,
          Object.assign({}, helperRuntime.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS), {
            playbackScopeKey: helperRuntime.playbackScopeKey,
          })
        );
        if (contextSyncResult.deferred) {
          return;
        }
        runWithProtectedScrollState(document, function () {
          helperRuntime.ui.renderAudioContext(context);
          helperRuntime.ui.renderBatchSelection?.({
            totalSegments: Array.isArray(context?.currentSegments) ? context.currentSegments.length : 0,
            resetSelection:
              normalizeText(helperRuntime.batchSelectionKey) !== normalizeText(context?.selectionKey),
          });
        });
        if (helperRuntime.recordingImportEnabled === true) {
          await syncRecordingResultForContext(recordingSourceItemId);
        }
        syncPlaybackSensitiveDecorations(
          document,
          Object.assign({}, helperRuntime.config || {}, {
            playbackScopeKey: helperRuntime.playbackScopeKey,
          })
        );
        helperRuntime.batchSelectionKey = normalizeText(context?.selectionKey);
      } catch (_error) {
        if (
          helperRuntime?.recordingImportEnabled === true &&
          !normalizeText(helperRuntime.recordingContextSignature)
        ) {
          updateRecordingImportContextState(helperRuntime, "", {
            ok: false,
            reason: "waiting",
            message: "正在等待页面返回当前音频与分段上下文...",
          });
        }
      }
    }, Math.max(0, Math.round(Number(delayMs || 0) || 0)));
  }

  async function handleSegmentPreviewAutoApplyToggle(nextEnabled) {
    if (!helperRuntime) {
      return;
    }
    const previousEnabled = helperRuntime.config?.segmentPreviewAutoApplyEnabled !== false;
    helperRuntime.config = Object.assign({}, helperRuntime.config || {}, {
      segmentPreviewAutoApplyEnabled: nextEnabled !== false,
    });
    if (!STORAGE || typeof STORAGE.patchSettings !== "function") {
      return;
    }
    try {
      const settings = await STORAGE.patchSettings({
        platforms: {
          bytedanceAidp: {
            scripts: {
              taizhouHelper: {
                id: SCRIPT_ID,
                segmentPreviewAutoApplyEnabled: nextEnabled !== false,
              },
            },
          },
        },
      });
      runtimePolicy = resolveRuntimePolicy(settings);
      ensureHelperRuntime(settings);
    } catch (error) {
      helperRuntime.config = Object.assign({}, helperRuntime.config || {}, {
        segmentPreviewAutoApplyEnabled: previousEnabled,
      });
      helperRuntime.ui?.setSegmentPreviewAutoApplyEnabled?.(previousEnabled);
      helperRuntime.ui?.setStatus?.(
        "保存自动应用开关失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }


  async function handleRecommendAction() {
    if (!helperRuntime || !helperRuntime.ai) {
      return;
    }
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在识别当前段原始听音...", "");
    try {
      const context = await helperRuntime.dataApi.getCurrentContext();
      helperRuntime.ui.renderAudioContext(context);
      if (!normalizeText(context?.audioUrl)) {
        helperRuntime.ui.setStatus(
          "当前还没拿到音频地址，请等待页面初始化完成，或刷新当前详情页后重试。",
          "error"
        );
        return;
      }
      const recommendation = await helperRuntime.ai.recommend(buildActiveSegmentRequestContext(context));
      helperRuntime.lastRecommendation = buildRecommendationDisplayPayload(recommendation);
      helperRuntime.ui.renderCurrentRecommendation(helperRuntime.lastRecommendation);
      helperRuntime.ui.renderAiMeta(helperRuntime.lastRecommendation);
      if (helperRuntime.readOnly) {
        helperRuntime.ui.setStatus("识别完成，结果仅供预览和复制。", "success");
      } else {
        await fillCurrentRecommendation(helperRuntime, helperRuntime.lastRecommendation);
      }
    } catch (error) {
      helperRuntime.ui.setStatus(
        "识别失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleRowRecommendAction(segmentNumber) {
    if (!helperRuntime || !helperRuntime.ai) {
      return;
    }
    if (helperRuntime.config?.aiRecommendEnabled === false) {
      helperRuntime.ui?.setStatus?.("当前已关闭台州话 AI 功能。", "error");
      return;
    }
    if (helperRuntime.rowRecommendInFlight === true) {
      helperRuntime.ui?.setStatus?.("当前已有正在运行的行内识别，请等待当前段完成后重试。", "error");
      return;
    }
    const targetSegmentNumber = Math.max(0, Math.round(Number(segmentNumber || 0)) || 0);
    if (targetSegmentNumber <= 0) {
      helperRuntime.ui?.setStatus?.("当前没有找到可识别的目标段，请刷新页面后重试。", "error");
      return;
    }
    helperRuntime.rowRecommendInFlight = true;
    helperRuntime.rowRecommendSegmentNumber = targetSegmentNumber;
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在识别第 " + String(targetSegmentNumber) + " 段原始听音...", "");
    try {
      const context = await helperRuntime.dataApi.getCurrentContext();
      helperRuntime.ui.renderAudioContext(context);
      if (!normalizeText(context?.audioUrl)) {
        helperRuntime.ui.setStatus(
          "当前还没拿到音频地址，请等待页面初始化完成，或刷新当前详情页后重试。",
          "error"
        );
        return;
      }
      const recommendation = await helperRuntime.ai.recommend(
        buildSegmentRequestContext(context, targetSegmentNumber)
      );
      helperRuntime.lastRecommendation = buildRecommendationDisplayPayload(recommendation);
      helperRuntime.ui.renderCurrentRecommendation(helperRuntime.lastRecommendation);
      helperRuntime.ui.renderAiMeta(helperRuntime.lastRecommendation);
      if (helperRuntime.readOnly) {
        helperRuntime.ui.setStatus("识别完成，结果仅供预览和复制。", "success");
      } else {
        await fillCurrentRecommendation(helperRuntime, helperRuntime.lastRecommendation);
      }
    } catch (error) {
      helperRuntime.ui.setStatus(
        "第 " +
          String(targetSegmentNumber) +
          " 段识别失败：" +
          (error && error.message ? error.message : String(error)),
        "error"
      );
    } finally {
      if (helperRuntime) {
        helperRuntime.rowRecommendInFlight = false;
        helperRuntime.rowRecommendSegmentNumber = 0;
      }
    }
  }

  async function handleBatchRecommendAction(selectedNumbers) {
    if (!helperRuntime?.batchController) {
      return;
    }
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在准备当前题批量识别...", "");
    try {
      const result = await helperRuntime.batchController.start(selectedNumbers);
      if (result?.ok && result.writtenCount > 0) {
        scheduleRuntimeReload(helperRuntime);
      }
    } catch (error) {
      helperRuntime.ui.setStatus(
        "批量识别失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }


  async function handlePreviewAction() {
    if (!helperRuntime) {
      return;
    }
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在生成当前音频分段建议...", "");
    try {
      const context = await helperRuntime.dataApi.getCurrentContext();
      helperRuntime.ui.renderAudioContext(context);
      if (!normalizeText(context?.audioUrl)) {
        helperRuntime.ui.setStatus(
          "当前还没拿到音频地址，请等待页面初始化完成，或刷新当前详情页后重试。",
          "error"
        );
        return;
      }
      const preview = await helperRuntime.segment.preview(context);
      helperRuntime.preview = preview;
      helperRuntime.ui.renderPreview(preview);
      if (!Array.isArray(preview?.proposedSegments) || preview.proposedSegments.length <= 0) {
        helperRuntime.ui.setStatus("当前没有生成可应用的分段建议。", "error");
        return;
      }
      const autoApplyResult = await maybeAutoApplyPreview(helperRuntime, preview);
      if (autoApplyResult.attempted) {
        return;
      }
      if (normalizeText(preview?.meta?.previewMode) === "whole-audio-fallback") {
        helperRuntime.ui.setStatus("已生成整条音频分段建议，可展开分段建议复核。", "success");
        return;
      }
      helperRuntime.ui.setStatus("分段建议已生成，可展开分段建议复核。", "success");
    } catch (error) {
      helperRuntime.ui.setStatus(
        "生成分段建议失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleApplyPreviewAction() {
    if (!helperRuntime) {
      return;
    }
    const preview =
      helperRuntime.preview ||
      (typeof helperRuntime.segment?.getLastPreview === "function"
        ? helperRuntime.segment.getLastPreview()
        : null);
    const result = await helperRuntime.dataApi.applySegmentPreview(preview);
    helperRuntime.ui.setStatus(result.message, result.ok ? "success" : "error");
    if (!result.ok) {
      scheduleHelperContextRefresh(0);
      return;
    }
    helperRuntime.preview = null;
    helperRuntime.segment?.clearPreview?.();
    helperRuntime.ui.renderPreview(null);
    scheduleRuntimeReload(helperRuntime);
  }

  async function handleClearSegmentsAction() {
    if (!helperRuntime) {
      return;
    }
    let confirmed = true;
    try {
      if (typeof globalThis.confirm === "function") {
        confirmed = globalThis.confirm("确认清空当前题的所有画段内容吗？此操作会写入平台暂存。");
      }
    } catch (_error) {
      confirmed = true;
    }
    if (!confirmed) {
      return;
    }
    const result = await helperRuntime.dataApi.clearCurrentSegments();
    helperRuntime.ui.setStatus(result.message, result.ok ? "success" : "error");
    if (!result.ok) {
      scheduleHelperContextRefresh(0);
      return;
    }
    helperRuntime.preview = null;
    helperRuntime.segment?.clearPreview?.();
    helperRuntime.ui.renderPreview(null);
    scheduleRuntimeReload(helperRuntime);
  }

  async function handleFillLanguageKindsAction() {
    if (!helperRuntime || typeof document === "undefined") {
      return;
    }
    helperRuntime.ui?.mount?.();
    helperRuntime.ui?.setStatus?.("正在为当前题补齐空语言种类...", "");
    const result =
      typeof helperRuntime.dataApi?.fillEmptyRegionLanguages === "function"
        ? await helperRuntime.dataApi.fillEmptyRegionLanguages()
        : await fillEmptyLanguageKinds(document);
    if (!result.ok) {
      const statusType =
        result.filledCount <= 0 &&
        normalizeText(result.message) === "当前没有空的语言种类需要填充。"
          ? "success"
          : "error";
      helperRuntime.ui?.setStatus?.(result.message, statusType);
      return;
    }
    if (result.filledCount <= 0) {
      helperRuntime.ui?.setStatus?.(result.message, "success");
      return;
    }
    helperRuntime.ui?.setStatus?.(result.message, "success");
    scheduleRuntimeReload(helperRuntime);
  }

  function renderRecordingImportState(runtime) {
    if (!runtime) {
      return;
    }
    const busy = runtime.recordingImportBusy === true;
    const hasRecordingTaskCode = Boolean(
      normalizeText(runtime.config?.recordingImportTaskCode)
    );
    runtime.ui?.renderRecordingImportState?.({
      enabled:
        runtime.recordingImportEnabled !== false &&
        hasRecordingTaskCode &&
        runtime.recordingContextReady === true,
      busy: busy,
      reason: busy
        ? "importing"
        : !hasRecordingTaskCode
          ? "missing-task-code"
          : normalizeText(runtime.recordingContextReason) || "waiting",
      message: busy
        ? "正在添加当前数据。"
        : !hasRecordingTaskCode
          ? "请先在 Options 基础设置中填写录音平台任务编号。"
          : normalizeText(runtime.recordingContextMessage) ||
            "当前完整题目数据尚未就绪，请稍后重试。",
    });
  }

  function updateRecordingImportContextState(runtime, sourceItemId, context) {
    if (!runtime) {
      return false;
    }
    const normalizedSourceItemId = normalizeText(sourceItemId);
    const previousSourceItemId = normalizeText(
      runtime.recordingContextSourceItemId
    );
    const ready = context?.ok === true;
    const reason = ready ? "ready" : normalizeText(context?.reason) || "waiting";
    const message = ready
      ? "当前完整题目数据已就绪，可添加数据。"
      : normalizeText(context?.message) ||
        "当前完整题目数据尚未就绪，请稍后重试。";
    const signature = [
      normalizeText(sourceItemId),
      ready ? "ready" : "blocked",
      reason,
      message,
    ].join("\n");
    runtime.recordingContextSourceItemId = normalizedSourceItemId;
    runtime.recordingContextReady = ready;
    runtime.recordingContextReason = reason;
    runtime.recordingContextMessage = message;
    renderRecordingImportState(runtime);
    if (normalizeText(runtime.recordingContextSignature) === signature) {
      return false;
    }
    runtime.recordingContextSignature = signature;
    if (
      previousSourceItemId &&
      normalizedSourceItemId &&
      previousSourceItemId !== normalizedSourceItemId
    ) {
      runtime.ui?.setStatus?.(COMMON_READY_MESSAGE, "success");
    }
    return true;
  }

  async function syncRecordingResultForContext(sourceItemId) {
    const runtime = helperRuntime;
    const recording = runtime?.recording;
    const normalizedSourceItemId = normalizeText(sourceItemId);
    if (
      runtime?.recordingImportEnabled === false ||
      !recording ||
      !normalizedSourceItemId ||
      typeof recording.beginResultEntry !== "function" ||
      typeof recording.isCurrentResultEntry !== "function"
    ) {
      return;
    }
    const entry = recording.beginResultEntry(normalizedSourceItemId);
    const syncSignature = [
      normalizeText(entry?.sourceItemId),
      String(Number(entry?.generation) || 0),
    ].join("\n");
    if (
      syncSignature &&
      normalizeText(runtime.recordingResultSyncSignature) === syncSignature
    ) {
      return;
    }
    runtime.recordingResultSyncSignature = syncSignature;
    const isCurrent = function () {
      return (
        helperRuntime === runtime &&
        recording.isCurrentResultEntry(entry)
      );
    };
    try {
      const mapping = await recording.findMapping(normalizedSourceItemId);
      if (!isCurrent()) {
        return;
      }
      if (!mapping) {
        runtime.ui.renderRecordingResult?.({
          sourceItemId: normalizedSourceItemId,
        });
        return;
      }
      const recordingResult =
        await recording.autoRefreshForEntry(entry, mapping);
      if (recordingResult && isCurrent()) {
        runtime.ui.renderRecordingResult?.(recordingResult);
      }
    } catch (_recordingError) {
      if (isCurrent()) {
        runtime.ui.setStatus(
          "录音结果自动刷新失败，可使用录音平台结果区的刷新按钮重试。",
          "warning"
        );
      }
    }
  }

  async function runRecordingImportAndRefresh(options) {
    const source = options && typeof options === "object" ? options : {};
    const runtime = helperRuntime;
    if (
      !runtime?.recording ||
      runtime.recordingImportEnabled === false ||
      runtime.recordingImportBusy === true
    ) {
      return {
        ok: false,
        message: "录音导入正在进行或当前不可用。",
      };
    }
    runtime.recordingImportBusy = true;
    renderRecordingImportState(runtime);
    try {
      if (typeof runtime.recording.inspectCurrentItem === "function") {
        const inspected = await runtime.recording.inspectCurrentItem();
        if (helperRuntime !== runtime) {
          return {
            ok: false,
            current: false,
          };
        }
        if (inspected?.current === false) {
          return {
            ok: false,
            current: false,
          };
        }
        if (!inspected?.ok) {
          const message =
            inspected?.message || "当前完整题目数据尚未就绪，请稍后重试。";
          runtime.ui?.setStatus?.(message, "error");
          return {
            ok: false,
            message: message,
          };
        }
      }
      runtime.ui?.setStatus?.("正在导入当前完整题目到录音平台...", "");
      if (typeof document !== "undefined") {
        syncPlaybackSensitiveDecorations(document, runtime.config || {});
      }
      const imported = await runtime.recording.importCurrentItem();
      if (helperRuntime !== runtime || imported?.current === false) {
        return {
          ok: false,
          current: false,
        };
      }
      if (!imported?.ok || !imported?.mapping) {
        const message = imported?.message || "导入录音任务失败，请稍后重试。";
        runtime.ui?.setStatus?.(message, imported?.ok ? "success" : "error");
        return {
          ok: false,
          message: message,
          importResult: imported || null,
        };
      }
      if (imported.kind === "existing") {
        showRecordingAlreadyImported(imported.mapping);
        if (source.refreshExisting !== true) {
          return {
            ok: true,
            kind: imported.kind,
            mapping: imported.mapping,
            importResult: imported,
            result: imported.initialResult || null,
          };
        }
      } else if (imported.kind === "replayed") {
        showRecordingAlreadyImported(imported.mapping);
      }
      const refreshed = await refreshRecordingResultAfterImport(imported);
      if (!refreshed?.ok) {
        return {
          ok: false,
          current: refreshed?.current,
          message: refreshed?.message || "录音结果刷新失败，请稍后重试。",
          kind: imported.kind,
          mapping: imported.mapping,
          importResult: imported,
        };
      }
      return {
        ok: true,
        kind: imported.kind,
        mapping: imported.mapping,
        importResult: imported,
        result: refreshed.result,
      };
    } catch (_error) {
      const message = "导入录音任务失败，请稍后重试。";
      if (helperRuntime === runtime) {
        runtime.ui?.setStatus?.(message, "error");
      }
      return {
        ok: false,
        current: helperRuntime === runtime,
        message: message,
      };
    } finally {
      runtime.recordingImportBusy = false;
      renderRecordingImportState(runtime);
      if (helperRuntime === runtime && typeof document !== "undefined") {
        syncPlaybackSensitiveDecorations(document, runtime.config || {});
      }
    }
  }

  async function handleRecordingImportAction() {
    return runRecordingImportAndRefresh({
      refreshExisting: false,
    });
  }

  function showRecordingAlreadyImported(mapping) {
    const message =
      "当前题目已添加到录音平台，录音条目：" +
      normalizeText(mapping?.itemCode);
    if (typeof helperRuntime?.ui?.showToast === "function") {
      helperRuntime.ui.showToast(message, {
        tone: "info",
        durationMs: 1000,
      });
      return;
    }
    helperRuntime?.ui?.setStatus?.(message, "warning");
  }

  async function refreshRecordingResultAfterImport(importResult) {
    const runtime = helperRuntime;
    if (!runtime?.recording || !importResult?.mapping) {
      return {
        ok: false,
        message: "录音映射不可用。",
      };
    }
    runtime.ui?.renderRecordingResult?.(
      importResult.initialResult || {
        sourceItemId: importResult.mapping.sourceItemId,
        itemCode: importResult.mapping.itemCode,
        status: "AVAILABLE",
      }
    );
    try {
      const refreshed = await runtime.recording.refreshCurrentResult();
      if (helperRuntime !== runtime || !refreshed) {
        return {
          ok: false,
          current: false,
          message: "当前题目已切换，已忽略过期录音结果。",
        };
      }
      if (refreshed.notImported === true) {
        throw new Error("recording mapping unavailable after import");
      }
      runtime.ui?.renderRecordingResult?.(refreshed);
      runtime.ui?.setStatus?.(
        importResult.kind === "replayed"
          ? "录音条目已存在，结果已刷新。"
          : "录音条目已添加，结果已刷新。",
        "success"
      );
      return {
        ok: true,
        current: true,
        result: refreshed,
      };
    } catch (_error) {
      if (helperRuntime === runtime) {
        runtime.ui?.setStatus?.(
          "录音条目已添加，但结果刷新失败，可手动刷新。",
          "warning"
        );
      }
      return {
        ok: false,
        current: helperRuntime === runtime,
        message: "录音条目已添加，但结果刷新失败，可手动刷新。",
      };
    }
  }

  async function handleRecordingRefreshAction() {
    if (
      !helperRuntime?.recording ||
      helperRuntime.recordingImportEnabled === false
    ) {
      return;
    }
    helperRuntime.ui?.setStatus?.("正在刷新录音平台结果...", "");
    try {
      const result = await helperRuntime.recording.refreshCurrentResult();
      if (!result) {
        helperRuntime.ui?.setStatus?.("题目已切换，已忽略过期的录音结果。", "");
        return;
      }
      if (result.notImported === true) {
        helperRuntime.ui?.setStatus?.(
          "当前题目还未添加到录音平台，暂无可刷新结果。",
          ""
        );
        return;
      }
      helperRuntime.ui?.renderRecordingResult?.(result);
      helperRuntime.ui?.setStatus?.("录音平台结果已刷新。", "success");
    } catch (error) {
      helperRuntime.ui?.setStatus?.(
        normalizeText(error?.message) || "刷新录音结果失败，请稍后重试。",
        "error"
      );
    }
  }

  function findInternalQualitySubmitButton(root) {
    const matches = [];
    getSearchRoots(root).forEach(function (searchRoot) {
      collectDescendantElements(searchRoot).forEach(function (node) {
        if (
          String(node?.tagName || "").toUpperCase() === "BUTTON" &&
          getNodeText(node) === "提交" &&
          getClassName(node).indexOf("submit-button") >= 0 &&
          isNodeAndAncestorsVisible(node) &&
          isEnabledNativeButton(node)
        ) {
          matches.push(node);
        }
      });
    });
    return {
      node: matches.length === 1 ? matches[0] : null,
      count: matches.length,
    };
  }

  function createInternalQualitySubmitAutomationController(options) {
    const source = options && typeof options === "object" ? options : {};
    const timeoutMs = Math.max(
      1,
      Math.round(Number(source.timeoutMs) || RECORDING_AUTOMATION_TIMEOUT_MS)
    );
    const pollIntervalMs = Math.max(
      0,
      Math.round(Number(source.pollIntervalMs) || RECORDING_AUTOMATION_POLL_INTERVAL_MS)
    );
    const networkQuietMs = Math.max(
      0,
      Math.round(
        Number.isFinite(Number(source.networkQuietMs))
          ? Number(source.networkQuietMs)
          : RECORDING_AUTOMATION_NETWORK_QUIET_MS
      )
    );
    const maxRounds = Math.max(0, Math.round(Number(source.maxRounds) || 0));
    const getNow = typeof source.now === "function" ? source.now : Date.now;
    const wait = typeof source.wait === "function" ? source.wait : waitFor;
    const getRoot = function () {
      return typeof source.root === "function"
        ? source.root()
        : source.root || (typeof document !== "undefined" ? document : null);
    };
    let runToken = 0;
    let running = false;
    let capturedAutomationScopeKey = "";
    let networkPendingBaseline = 0;
    let lastActionAt = 0;
    let state = {
      phase: "idle",
      completedCount: 0,
      directSubmittedCount: 0,
      correctedSubmittedCount: 0,
      itemId: "",
      pendingRequestCount: 0,
      message: "待命，等待手动开始。",
    };

    function publish(patch) {
      state = Object.assign({}, state, patch || {});
      try {
        source.onStateChange?.(Object.assign({}, state));
      } catch (_error) {
        // Panel rendering must not weaken the automation stop boundary.
      }
      return state;
    }

    function isActive(token) {
      return running === true && token === runToken;
    }

    function finish(phase, message, patch) {
      running = false;
      publish(Object.assign({ phase: phase, message: message }, patch || {}));
    }

    async function executeWithinTimeout(token, operation) {
      let timer = null;
      const setTimer = typeof source.setTimeout === "function" ? source.setTimeout : setTimeout;
      const clearTimer = typeof source.clearTimeout === "function" ? source.clearTimeout : clearTimeout;
      const timeoutResult = new Promise(function (resolve) {
        timer = setTimer(function () {
          resolve({ timeout: true });
        }, timeoutMs);
      });
      try {
        const outcome = await Promise.race([
          Promise.resolve()
            .then(operation)
            .then(function (value) {
              return { value: value };
            })
            .catch(function () {
              return { error: true };
            }),
          timeoutResult,
        ]);
        return isActive(token) ? outcome : { stopped: true };
      } finally {
        if (timer !== null) {
          clearTimer(timer);
        }
      }
    }

    async function getCurrentItemId(token) {
      if (typeof source.getCurrentItemId !== "function") {
        return { error: true };
      }
      const outcome = await executeWithinTimeout(token, source.getCurrentItemId);
      if (outcome.value !== undefined) {
        outcome.value = normalizeText(outcome.value);
        if (!outcome.value) {
          outcome.error = true;
        }
      }
      return outcome;
    }

    async function getAutomationScopeKey(token) {
      if (typeof source.getAutomationScopeKey !== "function") {
        return { value: "" };
      }
      const outcome = await executeWithinTimeout(token, source.getAutomationScopeKey);
      if (outcome.value !== undefined) {
        outcome.value = normalizeText(outcome.value);
        if (!outcome.value) {
          outcome.error = true;
        }
      }
      return outcome;
    }

    async function verifyAutomationScope(token) {
      if (!capturedAutomationScopeKey || typeof source.getAutomationScopeKey !== "function") {
        return { ok: true };
      }
      const outcome = await getAutomationScopeKey(token);
      if (outcome.stopped) {
        return { ok: false };
      }
      if (outcome.timeout || outcome.error) {
        finish("failed", "读取当前自动化范围超时或失败，自动流程已停止。");
        return { ok: false };
      }
      if (outcome.value !== capturedAutomationScopeKey) {
        finish("stopped", "页面类型或检查包范围已切换，自动流程已停止。");
        return { ok: false };
      }
      return { ok: true };
    }

    function getPageNetworkActivity() {
      try {
        const activity =
          typeof source.getNetworkActivity === "function" ? source.getNetworkActivity() : null;
        return {
          pendingCount: Math.max(0, Math.round(Number(activity?.pendingCount) || 0)),
          lastActivityAt: Math.max(0, Number(activity?.lastActivityAt) || 0),
          activitySequence: Math.max(0, Math.round(Number(activity?.activitySequence) || 0)),
        };
      } catch (_error) {
        return null;
      }
    }

    async function waitUntil(token, predicate) {
      const startedAt = Math.max(0, Number(getNow()) || 0);
      while (isActive(token)) {
        if (!(await verifyAutomationScope(token)).ok) {
          return { stopped: true };
        }
        try {
          const value = await predicate();
          if (value) {
            return { value: value };
          }
        } catch (_error) {
          return { error: true };
        }
        const elapsed = (Math.max(0, Number(getNow()) || 0) - startedAt);
        if (elapsed >= timeoutMs) {
          return { timeout: true };
        }
        await wait(Math.min(pollIntervalMs, Math.max(0, timeoutMs - elapsed)));
      }
      return { stopped: true };
    }

    async function waitForPageNetworkQuiet(token, completedCount, itemId) {
      let latestActivity = { pendingCount: 0, lastActivityAt: 0, activitySequence: 0 };
      const outcome = await waitUntil(token, function () {
        const activity = getPageNetworkActivity();
        if (!activity) {
          throw new Error("network activity unavailable");
        }
        latestActivity = activity;
        const quietSince = Math.max(lastActionAt, activity.lastActivityAt);
        const quietElapsed = Math.max(0, Number(getNow()) || 0) - quietSince;
        const blockingPendingCount = Math.max(
          0,
          activity.pendingCount - networkPendingBaseline
        );
        if (blockingPendingCount <= 0 && quietElapsed >= networkQuietMs) {
          return true;
        }
        publish({
          phase: "waiting-network",
          completedCount: completedCount,
          itemId: itemId,
          pendingRequestCount: blockingPendingCount,
          message: blockingPendingCount > 0
            ? "正在等待自动化启动后新增网络请求结算（" + String(blockingPendingCount) + " 个请求）。"
            : "网络请求已结算，正在等待 " + String(networkQuietMs) + "ms 安全间隔。",
        });
        return null;
      });
      return Object.assign({}, outcome, { activity: latestActivity });
    }

    function finishForNetworkWaitFailure(completedCount, itemId, pendingCount) {
      finish("failed", "页面网络请求在 20 秒内未结算或未连续静默，自动流程已停止。", {
        completedCount: completedCount,
        itemId: itemId,
        pendingRequestCount: Math.max(0, Math.round(Number(pendingCount) || 0)),
      });
    }

    async function run() {
      const token = runToken;
      let completedCount = 0;
      let directSubmittedCount = 0;
      let correctedSubmittedCount = 0;
      if (typeof source.getAutomationScopeKey === "function") {
        const scopeOutcome = await getAutomationScopeKey(token);
        if (scopeOutcome.stopped) return;
        if (scopeOutcome.timeout || scopeOutcome.error) {
          finish("failed", "读取当前自动化范围超时或失败，自动流程已停止。");
          return;
        }
        capturedAutomationScopeKey = scopeOutcome.value;
      }
      while (isActive(token)) {
        if (!(await verifyAutomationScope(token)).ok) return;
        const currentOutcome = await getCurrentItemId(token);
        if (currentOutcome.stopped) return;
        if (currentOutcome.timeout || currentOutcome.error) {
          finish("failed", "读取当前题号超时或失败，自动流程已停止。");
          return;
        }
        const currentItemId = currentOutcome.value;
        const networkBefore = await waitForPageNetworkQuiet(token, completedCount, currentItemId);
        if (networkBefore.stopped) return;
        if (networkBefore.timeout || networkBefore.error) {
          finishForNetworkWaitFailure(completedCount, currentItemId, networkBefore.activity?.pendingCount);
          return;
        }
        let decision;
        try {
          decision = typeof source.readDecision === "function"
            ? source.readDecision(getRoot())
            : readInternalQualitySubmitDecision(getRoot());
        } catch (_error) {
          decision = null;
        }
        if (!decision?.ok || (decision.action !== "direct" && decision.action !== "correct")) {
          finish("failed", "当前题目状态无法唯一确认，未提交并已停止自动流程。", {
            completedCount: completedCount,
            itemId: currentItemId,
          });
          return;
        }
        if (decision.action === "correct") {
          if (typeof source.correctCurrentItem !== "function") {
            finish("failed", "当前分段质检修正流程不可用，未提交并已停止自动流程。", {
              completedCount: completedCount,
              itemId: currentItemId,
            });
            return;
          }
          publish({
            phase: "correcting",
            completedCount: completedCount,
            directSubmittedCount: directSubmittedCount,
            correctedSubmittedCount: correctedSubmittedCount,
            itemId: currentItemId,
            message: "正在逐段确认语言种类和内部质检状态。",
          });
          const correctionOutcome = await executeWithinTimeout(token, function () {
            return source.correctCurrentItem({
              root: getRoot(),
              itemId: currentItemId,
              isActive: function () {
                return isActive(token);
              },
              waitForNetworkQuiet: async function () {
                const outcome = await waitForPageNetworkQuiet(
                  token,
                  completedCount,
                  currentItemId
                );
                return outcome.value === true;
              },
              recordAction: function () {
                lastActionAt = Math.max(0, Number(getNow()) || 0);
              },
            });
          });
          if (correctionOutcome.stopped) return;
          if (correctionOutcome.timeout || correctionOutcome.error || !correctionOutcome.value?.ok) {
            finish(
              "failed",
              normalizeText(correctionOutcome.value?.message) ||
                "当前分段质检状态无法安全修正，未提交并已停止自动流程。",
              {
                completedCount: completedCount,
                itemId: currentItemId,
              }
            );
            return;
          }
          const networkAfterCorrection = await waitForPageNetworkQuiet(
            token,
            completedCount,
            currentItemId
          );
          if (networkAfterCorrection.stopped) return;
          if (networkAfterCorrection.timeout || networkAfterCorrection.error) {
            finishForNetworkWaitFailure(
              completedCount,
              currentItemId,
              networkAfterCorrection.activity?.pendingCount
            );
            return;
          }
        }
        const submitLookup = findInternalQualitySubmitButton(getRoot());
        if (submitLookup.count !== 1) {
          finish("failed", "未找到唯一可用的右上角“提交”按钮，自动流程已停止。", {
            completedCount: completedCount,
            itemId: currentItemId,
          });
          return;
        }
        publish({
          phase: "submitting",
          completedCount: completedCount,
          directSubmittedCount: directSubmittedCount,
          correctedSubmittedCount: correctedSubmittedCount,
          itemId: currentItemId,
          message: "正在提交当前题目。",
        });
        const submitOutcome = await executeWithinTimeout(token, function () {
          if (typeof source.triggerSubmit === "function") {
            return source.triggerSubmit({
              node: submitLookup.node,
              itemId: currentItemId,
            });
          }
          return { ok: invokeClick(submitLookup.node) };
        });
        if (
          submitOutcome.stopped ||
          submitOutcome.timeout ||
          submitOutcome.error ||
          !(submitOutcome.value === true || submitOutcome.value?.ok === true)
        ) {
          finish(
            "failed",
            normalizeText(submitOutcome.value?.message) ||
              "无法点击右上角“提交”按钮，自动流程已停止。",
            {
              completedCount: completedCount,
              directSubmittedCount: directSubmittedCount,
              correctedSubmittedCount: correctedSubmittedCount,
              itemId: currentItemId,
            }
          );
          return;
        }
        lastActionAt = Math.max(0, Number(getNow()) || 0);
        const networkAfter = await waitForPageNetworkQuiet(token, completedCount, currentItemId);
        if (networkAfter.stopped) return;
        if (networkAfter.timeout || networkAfter.error) {
          finishForNetworkWaitFailure(completedCount, currentItemId, networkAfter.activity?.pendingCount);
          return;
        }
        completedCount += 1;
        if (decision.action === "direct") {
          directSubmittedCount += 1;
        } else {
          correctedSubmittedCount += 1;
        }
        if (maxRounds > 0 && completedCount >= maxRounds) {
          finish("completed", "测试处理上限已到达。", {
            completedCount: completedCount,
            directSubmittedCount: directSubmittedCount,
            correctedSubmittedCount: correctedSubmittedCount,
            itemId: currentItemId,
          });
          return;
        }
        publish({
          phase: "waiting-next",
          completedCount: completedCount,
          directSubmittedCount: directSubmittedCount,
          correctedSubmittedCount: correctedSubmittedCount,
          itemId: currentItemId,
          message: "提交已触发，正在验证是否进入下一题。",
        });
        const nextItemOutcome = await waitUntil(token, async function () {
          const nextOutcome = await getCurrentItemId(token);
          if (nextOutcome.stopped || nextOutcome.timeout || nextOutcome.error) return null;
          return nextOutcome.value !== currentItemId ? nextOutcome.value : null;
        });
        if (nextItemOutcome.stopped) return;
        if (nextItemOutcome.timeout || nextItemOutcome.error) {
          finish("failed", "提交可能已发送，未确认下一题，自动流程已停止。", {
            completedCount: completedCount,
            directSubmittedCount: directSubmittedCount,
            correctedSubmittedCount: correctedSubmittedCount,
            itemId: currentItemId,
          });
          return;
        }
      }
    }

    function start() {
      if (running) return Promise.resolve(false);
      running = true;
      runToken += 1;
      capturedAutomationScopeKey = "";
      const initialNetworkActivity = getPageNetworkActivity();
      networkPendingBaseline = initialNetworkActivity ? initialNetworkActivity.pendingCount : 0;
      lastActionAt = 0;
      publish({
        phase: "starting",
        completedCount: 0,
        directSubmittedCount: 0,
        correctedSubmittedCount: 0,
        itemId: "",
        pendingRequestCount: 0,
        message: "自动质检提交流程已开始。",
      });
      return run().then(function () { return true; });
    }

    function stop(message) {
      if (!running) return false;
      runToken += 1;
      running = false;
      publish({ phase: "stopped", message: normalizeText(message) || "已停止自动流程。" });
      return true;
    }

    return {
      start: start,
      stop: stop,
      isRunning: function () { return running; },
      getState: function () { return Object.assign({}, state); },
    };
  }

  function createReviseBatchImportController(options) {
    const deps = options && typeof options === "object" ? options : {};
    let runToken = 0;
    let running = false;
    let state = {
      phase: "idle",
      total: 0,
      processed: 0,
      succeeded: 0,
      reused: 0,
      skipped: 0,
      failed: 0,
      currentItemId: "",
      message: "等待开始。",
    };

    function publish(patch) {
      state = Object.assign({}, state, patch || {});
      deps.onStateChange?.(Object.assign({}, state));
      return Object.assign({}, state);
    }

    function stop(message) {
      if (!running) return false;
      running = false;
      runToken += 1;
      publish({ phase: "stopped", currentItemId: "", message: message || "已停止批量添加。" });
      return true;
    }

    async function start(items) {
      if (running) return Object.assign({}, state, { alreadyRunning: true });
      const queue = (Array.isArray(items) ? items : []).slice(0, 10);
      const waitBetweenImports =
        typeof deps.waitFor === "function" ? deps.waitFor : waitFor;
      const scopeKey = normalizeText(deps.getScopeKey?.());
      const token = ++runToken;
      running = true;
      publish({ phase: "running", total: queue.length, processed: 0, succeeded: 0, reused: 0, skipped: 0, failed: 0, currentItemId: "", message: "正在逐条添加当前页数据。" });
      for (let index = 0; index < queue.length; index += 1) {
        const context = queue[index];
        if (!running || token !== runToken) break;
        if (normalizeText(deps.getScopeKey?.()) !== scopeKey) {
          stop("页面或页码已变化，批量添加已停止。");
          break;
        }
        const sourceItemId = normalizeText(context?.sourceItemId);
        if (!sourceItemId || (!normalizeText(context?.referenceText) && !normalizeText(context?.audioUrl) && !normalizeText(context?.videoUrl))) {
          publish({ processed: state.processed + 1, skipped: state.skipped + 1, currentItemId: sourceItemId });
          continue;
        }
        publish({ currentItemId: sourceItemId, message: "正在添加 ItemID：" + sourceItemId });
        let result;
        try {
          result = await deps.importItemContext(context);
        } catch (_error) {
          result = { ok: false };
        }
        const patch = { processed: state.processed + 1 };
        if (result?.ok && (result.kind === "replayed" || result.kind === "existing")) patch.reused = state.reused + 1;
        else if (result?.ok) patch.succeeded = state.succeeded + 1;
        else patch.failed = state.failed + 1;
        publish(patch);
        if (!result?.ok) {
          stop("当前数据添加失败，批量添加已停止。");
          break;
        }
        const reused = result.kind === "replayed" || result.kind === "existing";
        if (!reused && index < queue.length - 1 && running && token === runToken) {
          await waitBetweenImports(1000);
        }
      }
      if (running && token === runToken) {
        running = false;
        publish({ phase: "completed", currentItemId: "", message: "当前页批量添加已完成。" });
      }
      return Object.assign({}, state);
    }

    return { start, stop, getState: function () { return Object.assign({}, state); } };
  }

  async function handleTaskListAccountSwitchAction() {
    if (typeof document === "undefined") {
      return;
    }
    setAccountSwitchBusy(true);
    setAccountSwitchStatus("正在切换账号...", "");
    try {
      const result = await runAccountSwitchFlow(document);
      if (result.ok) {
        setAccountSwitchStatus(result.message, "success");
        return;
      }
      if (result.reason === "cancelled") {
        setAccountSwitchStatus(result.message, "");
        return;
      }
      setAccountSwitchStatus(result.message || "切换账号失败。", "error");
    } catch (error) {
      setAccountSwitchStatus(
        "切换账号失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    } finally {
      setAccountSwitchBusy(false);
    }
  }

  function syncManagementAccountSwitchBar(root) {
    if (!root || !isManagementPage()) {
      destroyAccountSwitchBar(root);
      return;
    }
    if (runtimePolicy.runtimeAccessible !== true) {
      destroyAccountSwitchBar(root);
      return;
    }
    ensureAccountSwitchBar(root, function () {
      void handleTaskListAccountSwitchAction();
    });
  }

  function getCurrentReviseListScopeKey() {
    return normalizeText(globalThis.location?.pathname) + normalizeText(globalThis.location?.search);
  }

  function destroyReviseImportCard(root) {
    safeQuerySelectorAll(root, "[" + REVISE_IMPORT_CARD_ATTR + "='true']").forEach(function (node) {
      node.parentNode?.removeChild?.(node);
    });
    if (reviseListRuntime?.refreshTimer) {
      globalThis.clearTimeout?.(reviseListRuntime.refreshTimer);
    }
    reviseListRuntime?.controller?.stop?.("已离开返修列表，批量添加已停止。");
    reviseListRuntime?.dataApi?.destroy?.();
    reviseListRuntime = null;
  }

  function resolveReviseImportAvailability(options) {
    const source = options && typeof options === "object" ? options : {};
    const context = source.context && typeof source.context === "object"
      ? source.context
      : {};
    if (!normalizeText(source.recordingTaskCode)) {
      return {
        enabled: false,
        message: "请先在 Options 基础设置中填写录音平台任务编号。",
      };
    }
    if (context.ok !== true) {
      return {
        enabled: false,
        message: normalizeText(context.message) || "正在等待当前页返修数据。",
      };
    }
    return { enabled: true, message: "" };
  }

  function renderReviseImportCard(runtime) {
    const card = runtime?.card;
    if (!card) return;
    const state = runtime.controller.getState();
    const context = runtime.context || {};
    const availability = resolveReviseImportAvailability({
      context: context,
      recordingTaskCode: runtime.recording?.recordingTaskCode,
    });
    runtime.startButton.disabled =
      state.phase === "running" || availability.enabled !== true || !runtime.recording;
    runtime.stopButton.disabled = state.phase !== "running";
    runtime.status.textContent = availability.enabled !== true
      ? availability.message
      : [
          "总数 " + String(state.total || context.items.length),
          "已处理 " + String(state.processed),
          "成功 " + String(state.succeeded),
          "复用 " + String(state.reused),
          "跳过 " + String(state.skipped),
          "失败 " + String(state.failed),
          state.currentItemId ? "当前 " + state.currentItemId : "",
          normalizeText(state.message),
        ].filter(Boolean).join(" ｜ ");
  }

  function refreshReviseImportContext(runtime) {
    if (!runtime) return null;
    runtime.context = runtime.dataApi.getReviseListImportContext();
    renderReviseImportCard(runtime);
    return runtime.context;
  }

  function ensureReviseImportCard(root, settings) {
    if (!root || !isReviseListPagePathname(globalThis.location?.pathname)) {
      destroyReviseImportCard(root);
      return;
    }
    if (reviseListRuntime?.scopeKey === getCurrentReviseListScopeKey()) {
      refreshReviseImportContext(reviseListRuntime);
      return;
    }
    destroyReviseImportCard(root);
    if (!dataApiFactory || !recordingFactory || typeof document === "undefined") return;
    const dataApi = dataApiFactory.createRuntime();
    const helperConfig = resolveHelperConfig(settings);
    const recording = recordingFactory.createRuntime({
      dataApi,
      storage: STORAGE,
      settings: helperConfig.settings,
      fetch: globalThis.fetch,
      buildBackendUrl: function (path) {
        return typeof CONSTANTS.buildBackendUrl === "function"
          ? CONSTANTS.buildBackendUrl(path, helperConfig.settings)
          : String(path || "");
      },
    });
    const card = document.createElement("div");
    card.setAttribute(REVISE_IMPORT_CARD_ATTR, "true");
    card.style.cssText = "margin:12px 20px;padding:14px 16px;border:1px solid #d9e2f1;border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(31,56,88,.08);font-size:14px;";
    const title = document.createElement("div");
    title.textContent = "台州话返修数据导入";
    title.style.cssText = "font-weight:600;margin-bottom:10px;";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;";
    const startButton = document.createElement("button");
    startButton.textContent = "批量添加当前页数据";
    const stopButton = document.createElement("button");
    stopButton.textContent = "停止";
    const status = document.createElement("div");
    status.style.cssText = "color:#4e5969;line-height:1.6;overflow-wrap:anywhere;";
    actions.appendChild(startButton);
    actions.appendChild(stopButton);
    card.appendChild(title);
    card.appendChild(actions);
    card.appendChild(status);
    const target = document.querySelector?.("main") || document.body || document.documentElement;
    target?.insertBefore?.(card, target.firstChild || null) || target?.appendChild?.(card);
    const runtime = { scopeKey: getCurrentReviseListScopeKey(), dataApi, recording, card, startButton, stopButton, status, context: dataApi.getReviseListImportContext() };
    runtime.controller = createReviseBatchImportController({
      getScopeKey: getCurrentReviseListScopeKey,
      importItemContext: function (context) { return recording.importItemContext(context); },
      onStateChange: function () { renderReviseImportCard(runtime); },
    });
    startButton.addEventListener("click", function () {
      runtime.context = dataApi.getReviseListImportContext();
      if (runtime.context.ok) void runtime.controller.start(runtime.context.items);
      renderReviseImportCard(runtime);
    });
    stopButton.addEventListener("click", function () { runtime.controller.stop(); renderReviseImportCard(runtime); });
    reviseListRuntime = runtime;
    renderReviseImportCard(runtime);
    runtime.refreshTimer = globalThis.setTimeout?.(function refresh() {
      if (reviseListRuntime !== runtime) return;
      refreshReviseImportContext(runtime);
      runtime.refreshTimer = globalThis.setTimeout?.(refresh, 500);
    }, 500);
  }

  function destroyTaskListUi() {
    managementUiActive = false;
    managementSettings = null;
    if (typeof document !== "undefined") {
      destroyAccountSwitchBar(document);
      destroyReviseImportCard(document);
    }
    if (!runtimeActive) {
      unbindStorageListener();
    }
  }

  async function installTaskListUi() {
    if (!isManagementPage()) {
      destroyTaskListUi();
      return runtimePolicy;
    }
    managementUiActive = true;
    bindStorageListener();
    const settings = await loadSettings();
    managementSettings = settings;
    runtimePolicy = resolveRuntimePolicy(settings);
    if (typeof document !== "undefined") {
      syncManagementAccountSwitchBar(document);
      ensureReviseImportCard(document, settings);
    }
    return runtimePolicy;
  }

  function buildHelperRuntimeConfigSignature(endpoint, helperConfig) {
    const stableHelperConfig = JSON.parse(JSON.stringify(helperConfig || {}));
    const taizhouSettings =
      stableHelperConfig?.settings?.platforms?.bytedanceAidp?.scripts?.taizhouHelper;
    if (taizhouSettings && typeof taizhouSettings === "object") {
      delete taizhouSettings.recordingSyncMappings;
    }
    return JSON.stringify({
      endpoint: endpoint,
      helperConfig: stableHelperConfig,
    });
  }

  function ensureHelperRuntime(settings) {
    if (!runtimePolicy.runtimeAccessible || !isDetailPage()) {
      destroyHelperRuntime();
      return;
    }
    if (!dataApiFactory || !segmentFactory || !uiFactory) {
      return;
    }
    const endpoint = resolveSegmentPreviewEndpoint(settings);
    const pageCapabilities = resolveHelperPageCapabilities();
    const readOnly = pageCapabilities.readOnly === true;
    const recordingImportEnabled = pageCapabilities.recordingImportEnabled === true;
    const recordingAutomationEnabled =
      pageCapabilities.recordingAutomationEnabled === true;
    const internalQualitySubmitAutomationEnabled =
      pageCapabilities.internalQualitySubmitAutomationEnabled === true;
    const recordingResultFillEnabled =
      pageCapabilities.recordingResultFillEnabled === true;
    const helperConfig = Object.assign(
      {},
      resolveHelperConfig(settings),
      pageCapabilities
    );
    if (typeof document !== "undefined") {
      ensurePlaybackScrollGuardWatchdog(document);
    }
    const configSignature = buildHelperRuntimeConfigSignature(endpoint, helperConfig);
    if (helperRuntime && helperRuntime.configSignature === configSignature) {
      helperRuntime.config = helperConfig;
      helperRuntime.endpoint = endpoint;
      helperRuntime.ui.setSegmentPreviewAutoApplyEnabled?.(
        helperConfig.segmentPreviewAutoApplyEnabled
      );
      if (typeof document !== "undefined" && !isWavePlaybackActive(document)) {
        runWithProtectedScrollState(document, function () {
          helperRuntime.ui.mount();
        });
        syncPlaybackSensitiveDecorations(
          document,
          Object.assign({}, helperConfig, {
            playbackScopeKey: helperRuntime.playbackScopeKey,
          })
        );
        scheduleHelperContextRefresh(0);
      }
      return;
    }
    destroyHelperRuntime();
    const dataApi = dataApiFactory.createRuntime();
    const ai =
      aiFactory && typeof aiFactory.createRuntime === "function"
        ? aiFactory.createRuntime({
            endpoint: helperConfig.aiRecommendEndpoint,
            timeoutMs: helperConfig.aiRecommendRequestTimeoutMs,
            settings: helperConfig.settings,
            aiUsageOperatorName: helperConfig.aiUsageOperatorName,
            aiOmni: helperConfig.aiOmni,
          })
        : null;
    const segment = segmentFactory.createRuntime({
      endpoint: endpoint,
      silenceThresholdDbfs: helperConfig.segmentSilenceThresholdDbfs,
      contextPaddingMs: helperConfig.segmentContextPaddingMs,
      mergeContiguousSuggestedSegmentsEnabled:
        helperConfig.mergeContiguousSuggestedSegmentsEnabled,
    });
    const recording =
      recordingImportEnabled &&
      recordingFactory &&
      typeof recordingFactory.createRuntime === "function"
        ? recordingFactory.createRuntime({
            dataApi: dataApi,
            storage: STORAGE,
            settings: helperConfig.settings,
            fetch: globalThis.fetch,
            buildBackendUrl: function (path) {
              return typeof CONSTANTS.buildBackendUrl === "function"
                ? CONSTANTS.buildBackendUrl(path, helperConfig.settings)
                : String(path || "");
            },
          })
        : null;
    const ui = uiFactory.createRuntime({
      segmentPreviewAutoApplyEnabled: helperConfig.segmentPreviewAutoApplyEnabled,
      readOnly: readOnly,
      recordingImportEnabled: recordingImportEnabled,
      recordingAutomationEnabled: recordingAutomationEnabled,
      internalQualitySubmitAutomationEnabled: internalQualitySubmitAutomationEnabled,
      recordingResultFillEnabled: recordingResultFillEnabled,
      onRecommend: function () {
        if (helperConfig.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭台州话 AI 功能。", "error");
          return;
        }
        void handleRecommendAction();
      },
      onBatchRecommend: function (selectedNumbers) {
        if (helperConfig.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭台州话 AI 功能。", "error");
          return;
        }
        void handleBatchRecommendAction(selectedNumbers);
      },
      onBatchStop: function () {
        helperRuntime?.batchController?.stop?.();
      },
      onPreview: function () {
        if (readOnly) {
          return;
        }
        void handlePreviewAction();
      },
      onApplyPreview: function () {
        if (readOnly) {
          return;
        }
        void handleApplyPreviewAction();
      },
      onClearSegments: function () {
        if (readOnly) {
          return;
        }
        void handleClearSegmentsAction();
      },
      onAddRecordingData: function () {
        if (!recordingImportEnabled) {
          return false;
        }
        return handleRecordingImportAction();
      },
      onRefreshRecordingResult: function () {
        if (!recordingImportEnabled) {
          return;
        }
        void handleRecordingRefreshAction();
      },
      onFillRecordingResult: async function (result) {
        if (
          !recordingResultFillEnabled ||
          helperRuntime !== runtime ||
          typeof dataApi.appendRecordingResultIntoModifyDom !== "function"
        ) {
          return;
        }
        const outcome = await dataApi.appendRecordingResultIntoModifyDom(result);
        if (helperRuntime !== runtime) return;
        if (outcome.ok && outcome.reason === "already-present") {
          ui.setStatus("当前审核结果已在返修文本末尾，无需重复填入。", "warning");
        } else {
          ui.setStatus(
            normalizeText(outcome.message) || (outcome.ok ? "审核结果已填入。" : "当前审核结果不能安全填入。"),
            outcome.ok ? "success" : "error"
          );
        }
      },
      onStartRecordingAutomation: function () {
        if (!recordingAutomationEnabled) {
          return;
        }
        void helperRuntime?.recordingAutomation?.start?.();
      },
      onStopRecordingAutomation: function () {
        if (!recordingAutomationEnabled) {
          return;
        }
        helperRuntime?.recordingAutomation?.stop?.();
      },
      onStartInternalQualitySubmitAutomation: function () {
        if (!internalQualitySubmitAutomationEnabled) {
          return;
        }
        void helperRuntime?.internalQualitySubmitAutomation?.start?.();
      },
      onStopInternalQualitySubmitAutomation: function () {
        if (!internalQualitySubmitAutomationEnabled) {
          return;
        }
        helperRuntime?.internalQualitySubmitAutomation?.stop?.();
      },
    });
    const shortcuts =
      shortcutFactory && typeof shortcutFactory.createRuntime === "function"
        ? shortcutFactory.createRuntime({
            shortcuts: helperConfig.shortcuts,
            actions: createShortcutActions({
              readOnly: readOnly,
              onTogglePlayPause: function () {
                return triggerPlayPauseAction(document);
              },
              onPlaySelection: function () {
                return triggerPlaySelectionAction(document);
              },
              onJumpToFirstFrame: function () {
                return triggerJumpToFirstFrameAction(document);
              },
              onDeleteCurrentSelection: function () {
                return triggerDeleteCurrentSelectionAction(document);
              },
              onClearSegments: function () {
                if (readOnly) {
                  return;
                }
                return handleClearSegmentsAction();
              },
              onPreviewSegments: function () {
                if (readOnly) {
                  return;
                }
                return handlePreviewAction();
              },
              onApplyPreviewSegments: function () {
                if (readOnly) {
                  return;
                }
                return handleApplyPreviewAction();
              },
            }),
          })
        : null;
    const batchController = createBatchRecommendController({
      dataApi: dataApi,
      ai: ai,
      ui: ui,
      readOnly: readOnly,
    });
    const runtime = {
      dataApi: dataApi,
      ai: ai,
      readOnly: readOnly,
      recordingImportEnabled: recordingImportEnabled,
      recordingAutomationEnabled: recordingAutomationEnabled,
      internalQualitySubmitAutomationEnabled: internalQualitySubmitAutomationEnabled,
      recordingResultFillEnabled: recordingResultFillEnabled,
      pageCapabilities: pageCapabilities,
      pageMode: getCurrentHelperPageMode(),
      batchController: batchController,
      segment: segment,
      recording: recording,
      ui: ui,
      shortcuts: shortcuts,
      preview: null,
      lastRecommendation: null,
      endpoint: endpoint,
      config: helperConfig,
      configSignature: configSignature,
      playbackScopeKey: getCurrentPlaybackScopeKey(),
      batchSelectionKey: "",
      rowRecommendInFlight: false,
      rowRecommendSegmentNumber: 0,
      rowRecognizeLayoutSignature: "",
      recordingContextReady: false,
      recordingContextReason: "waiting",
      recordingContextMessage: "正在等待当前完整题目数据，请稍后重试。",
      recordingContextSourceItemId: "",
      recordingContextSignature: "",
      recordingResultSyncSignature: "",
      recordingImportBusy: false,
      scheduleReload: function () {
        scheduleRuntimeReload(helperRuntime);
      },
    };
    helperRuntime = runtime;
    runtime.recordingAutomation = !recordingAutomationEnabled
      ? {
          getState: function () {
            return { phase: "idle", completedCount: 0, itemCode: "", message: "" };
          },
          start: function () {
            return false;
          },
          stop: function () {
            return false;
          },
        }
      : createRecordingAutomationController({
      root: function () {
        return typeof document !== "undefined" ? document : null;
      },
      getCurrentItemId: async function () {
        if (
          helperRuntime !== runtime ||
          typeof runtime.dataApi?.getCurrentAutomationItemId !== "function"
        ) {
          return "";
        }
        const itemId = await runtime.dataApi.getCurrentAutomationItemId();
        return helperRuntime === runtime ? normalizeText(itemId) : "";
      },
      getAutomationScopeKey: async function () {
        if (
          helperRuntime !== runtime ||
          typeof runtime.dataApi?.getAutomationScopeKey !== "function"
        ) {
          return "";
        }
        const scopeKey = await runtime.dataApi.getAutomationScopeKey();
        return helperRuntime === runtime ? normalizeText(scopeKey) : "";
      },
      getImportContext: async function () {
        if (
          helperRuntime !== runtime ||
          typeof runtime.dataApi?.getRecordingImportContext !== "function"
        ) {
          return {
            ok: false,
            reason: "unavailable",
            message: "当前完整题目数据不可用。",
          };
        }
        const context = await runtime.dataApi.getRecordingImportContext();
        if (helperRuntime !== runtime) {
          return {
            ok: false,
            reason: "unavailable",
            message: "页面已切换，当前完整题目数据不可用。",
          };
        }
        return context;
      },
      getNetworkActivity: function () {
        if (helperRuntime !== runtime || typeof runtime.dataApi?.getPageNetworkActivity !== "function") {
          return {
            pendingCount: 0,
            lastActivityAt: 0,
            activitySequence: 0,
          };
        }
        return runtime.dataApi.getPageNetworkActivity();
      },
      importAndRefresh: async function () {
        if (helperRuntime !== runtime) {
          return {
            ok: false,
            current: false,
          };
        }
        return runRecordingImportAndRefresh({
          refreshExisting: true,
        });
      },
      onStateChange: function (state) {
        if (helperRuntime === runtime) {
          runtime.ui?.renderRecordingAutomationState?.(state);
        }
      },
      });
    runtime.internalQualitySubmitAutomation = !internalQualitySubmitAutomationEnabled
      ? {
          getState: function () {
            return {
              phase: "idle",
              completedCount: 0,
              directSubmittedCount: 0,
              correctedSubmittedCount: 0,
              itemId: "",
              message: "",
            };
          },
          start: function () {
            return false;
          },
          stop: function () {
            return false;
          },
        }
      : createInternalQualitySubmitAutomationController({
          root: function () {
            return typeof document !== "undefined" ? document : null;
          },
          getCurrentItemId: async function () {
            return helperRuntime === runtime
              ? getCurrentInternalQualityPackageItemId(globalThis.location)
              : "";
          },
          getAutomationScopeKey: async function () {
            if (
              helperRuntime !== runtime ||
              typeof runtime.dataApi?.getAutomationScopeKey !== "function"
            ) {
              return "";
            }
            const scopeKey = await runtime.dataApi.getAutomationScopeKey();
            return helperRuntime === runtime ? normalizeText(scopeKey) : "";
          },
          getNetworkActivity: function () {
            if (
              helperRuntime !== runtime ||
              typeof runtime.dataApi?.getPageNetworkActivity !== "function"
            ) {
              return {
                pendingCount: 0,
                lastActivityAt: 0,
                activitySequence: 0,
              };
            }
            return runtime.dataApi.getPageNetworkActivity();
          },
          readDecision: function (root) {
            if (helperRuntime !== runtime) {
              return { ok: false, reason: "runtime-replaced" };
            }
            return readInternalQualitySubmitDecision(root);
          },
          correctCurrentItem: async function (context) {
            if (helperRuntime !== runtime) {
              return { ok: false, reason: "runtime-replaced" };
            }
            return correctInternalQualitySegments(context.root, {
              isActive: context.isActive,
              waitForNetworkQuiet: context.waitForNetworkQuiet,
              triggerInternalQualityClick: async function (node) {
                if (helperRuntime !== runtime) {
                  return { ok: false };
                }
                return triggerInternalQualityControlWithDebugger(
                  node,
                  context.itemId,
                  "quality-ok-radio"
                );
              },
            });
          },
          triggerSubmit: async function (context) {
            if (helperRuntime !== runtime) {
              return { ok: false, message: "运行时已切换，未提交并已停止自动流程。" };
            }
            return triggerInternalQualitySubmitWithDebugger(context.node, context.itemId);
          },
          onStateChange: function (state) {
            if (helperRuntime === runtime) {
              runtime.ui?.renderInternalQualitySubmitAutomationState?.(state);
            }
          },
        });
    shortcuts?.bind?.();
    runWithProtectedScrollState(document, function () {
      ui.mount();
      ui.renderCurrentRecommendation(null);
      ui.renderAiMeta(null);
      ui.renderBatchAiResults([], 0);
      ui.renderBatchSelection({
        totalSegments: 0,
        resetSelection: true,
      });
      ui.renderBatchState({
        phaseText: "",
      });
      ui.renderRecordingResult?.(null);
      renderRecordingImportState(runtime);
      ui.renderRecordingAutomationState?.(runtime.recordingAutomation.getState());
      ui.renderInternalQualitySubmitAutomationState?.(
        runtime.internalQualitySubmitAutomation.getState()
      );
      ui.setStatus(COMMON_READY_MESSAGE, "success");
    });
    syncPlaybackSensitiveDecorations(
      document,
      Object.assign({}, helperConfig, {
        playbackScopeKey: helperRuntime.playbackScopeKey,
      })
    );
    scheduleHelperContextRefresh(0);
  }

  async function refreshRuntimePolicy() {
    const settings = await loadSettings();
    runtimePolicy = resolveRuntimePolicy(settings);
    if (typeof document !== "undefined") {
      syncPlatformAiVisibility(document, runtimePolicy.shouldHidePlatformAi);
      syncPlaybackSensitiveDecorations(
        document,
        Object.assign({}, resolveHelperConfig(settings), {
          readOnly: isReadOnlyScanPage(),
          playbackScopeKey: helperRuntime?.playbackScopeKey || getCurrentPlaybackScopeKey(),
        })
      );
      if (runtimePolicy.shouldHidePlatformAi) {
        ensureMutationObserver();
      } else {
        disconnectMutationObserver();
      }
    }
    ensureHelperRuntime(settings);
    return runtimePolicy;
  }

  function scheduleDomSync() {
    if (domSyncTimer || typeof setTimeout !== "function") {
      return;
    }
    domSyncTimer = setTimeout(function () {
      domSyncTimer = null;
      if (!runtimeActive || typeof document === "undefined") {
        return;
      }
      syncPlatformAiVisibility(document, runtimePolicy.shouldHidePlatformAi);
      syncPlaybackSensitiveDecorations(
        document,
        Object.assign(
          {},
          helperRuntime?.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS || {}),
          {
            playbackScopeKey: helperRuntime?.playbackScopeKey || getCurrentPlaybackScopeKey(),
          }
        )
      );
      if (runtimePolicy.shouldHidePlatformAi) {
        ensureMutationObserver();
      }
    }, 60);
  }

  function ensureMutationObserver() {
    if (
      mutationObserver ||
      typeof MutationObserver !== "function" ||
      typeof document === "undefined" ||
      !document.body
    ) {
      return;
    }

    mutationObserver = new MutationObserver(function () {
      scheduleDomSync();
    });
    mutationObserver.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTE_NAMES,
    });
  }

  function disconnectMutationObserver() {
    if (mutationObserver && typeof mutationObserver.disconnect === "function") {
      mutationObserver.disconnect();
    }
    mutationObserver = null;
  }

  function handleStorageChanged(_changes, areaName) {
    if (areaName && areaName !== "local") {
      return;
    }
    if (runtimeActive && isDetailPage()) {
      void refreshRuntimePolicy().then(function () {
        if (managementUiActive && isManagementPage() && typeof document !== "undefined") {
          syncManagementAccountSwitchBar(document);
        }
      });
      return;
    }
    if (managementUiActive && isManagementPage()) {
      void installTaskListUi();
    }
  }

  function bindStorageListener() {
    if (storageListenerBound) {
      return;
    }
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged &&
      typeof chrome.storage.onChanged.addListener === "function"
    ) {
      chrome.storage.onChanged.addListener(handleStorageChanged);
      storageListenerBound = true;
    }
  }

  function unbindStorageListener() {
    if (!storageListenerBound) {
      return;
    }
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged &&
      typeof chrome.storage.onChanged.removeListener === "function"
    ) {
      chrome.storage.onChanged.removeListener(handleStorageChanged);
    }
    storageListenerBound = false;
  }

  function destroyRuntime() {
    runtimeActive = false;
    disconnectMutationObserver();
    clearPlaybackScrollGuardWatchdog();
    deactivatePlaybackScrollGuard();
    if (typeof document !== "undefined") {
      setTaizhouAuxiliaryZonesHidden(document, false);
    } else {
      taizhouAuxiliaryZonesHidden = false;
    }
    destroyHelperRuntime();
    if (!managementUiActive) {
      unbindStorageListener();
    }
    if (typeof document !== "undefined") {
      syncPlatformAiVisibility(document, false);
    }
    runtimePolicy = resolveRuntimePolicy(CONSTANTS.DEFAULT_SETTINGS || {});
  }

  async function installRuntime() {
    if (!isDetailPage()) {
      destroyRuntime();
      return runtimePolicy;
    }

    runtimeActive = true;
    bindStorageListener();
    return refreshRuntimePolicy();
  }

  function startRouteWatcher() {
    if (routeTimer || typeof window === "undefined" || !window) {
      return;
    }
    routeTimer = window.setInterval(function () {
      const onManagementPage = isManagementPage();
      const onDetailPage = isDetailPage();

      if (onManagementPage) {
        if (!managementUiActive) {
          void installTaskListUi();
        } else {
          syncManagementAccountSwitchBar(document);
          ensureReviseImportCard(document, managementSettings || CONSTANTS.DEFAULT_SETTINGS || {});
        }
      } else if (managementUiActive) {
        destroyTaskListUi();
      }

      if (onDetailPage) {
        if (!runtimeActive) {
          void installRuntime();
          return;
        }
        ensurePlaybackScrollGuardWatchdog(document);
        scheduleDomSync();
        if (helperRuntime) {
          if (helperRuntime.pageMode !== getCurrentHelperPageMode()) {
            void refreshRuntimePolicy();
            return;
          }
          if (!isWavePlaybackActive(document)) {
            runWithProtectedScrollState(document, function () {
              helperRuntime.ui.mount();
            });
            scheduleHelperContextRefresh(0);
          }
        } else if (runtimePolicy.runtimeAccessible && dataApiFactory && segmentFactory && uiFactory) {
          void refreshRuntimePolicy();
        }
        if (runtimePolicy.shouldHidePlatformAi) {
          ensureMutationObserver();
        }
        return;
      }

      if (runtimeActive) {
        destroyRuntime();
      }
    }, 1200);
  }

  const api = {
    __testOnly: {
      resolveRuntimePolicy: resolveRuntimePolicy,
      applyPlatformAiVisibility: applyPlatformAiVisibility,
      findPlatformAiTargets: findPlatformAiTargets,
      syncPlatformAiVisibility: syncPlatformAiVisibility,
      isDetailPagePathname: isDetailPagePathname,
      isReadOnlyScanPagePathname: isReadOnlyScanPagePathname,
      isInternalQualityPackagePathname: isInternalQualityPackagePathname,
      getCurrentInternalQualityPackageItemId: getCurrentInternalQualityPackageItemId,
      readInternalQualitySubmitDecision: readInternalQualitySubmitDecision,
      createInternalQualitySubmitAutomationController:
        createInternalQualitySubmitAutomationController,
      correctInternalQualitySegments: correctInternalQualitySegments,
      isModifyPagePathname: isModifyPagePathname,
      isReviseListPagePathname: isReviseListPagePathname,
      resolveHelperPageCapabilities: resolveHelperPageCapabilities,
      getCurrentHelperPageMode: getCurrentHelperPageMode,
      isTaskListPagePathname: isTaskListPagePathname,
      isManagementPagePathname: isManagementPagePathname,
      normalizeInsightTarget: normalizeInsightTarget,
      normalizeFloatingTarget: normalizeFloatingTarget,
      getInsightCandidateScore: getInsightCandidateScore,
      getFloatingAssistantScore: getFloatingAssistantScore,
      ensureAccountSwitchBar: ensureAccountSwitchBar,
      requestAidpLoginStateReset: requestAidpLoginStateReset,
      triggerInternalQualityControlWithDebugger: triggerInternalQualityControlWithDebugger,
      triggerInternalQualitySubmitWithDebugger: triggerInternalQualitySubmitWithDebugger,
      runAccountSwitchFlow: runAccountSwitchFlow,
      resolveHelperConfig: resolveHelperConfig,
      buildHelperRuntimeConfigSignature: buildHelperRuntimeConfigSignature,
      applyWaveToolSettings: applyWaveToolSettings,
      syncPlaybackRateControl: syncPlaybackRateControl,
      syncWaveZoomControl: syncWaveZoomControl,
      getPlaybackComboboxLabel: getPlaybackComboboxLabel,
      parseWaveElapsedTimeMs: parseWaveElapsedTimeMs,
      isWavePlaybackActive: isWavePlaybackActive,
      ensureClearSegmentsButton: ensureClearSegmentsButton,
      ensureFillLanguageKindsButton: ensureFillLanguageKindsButton,
      syncRecordingImportButton: syncRecordingImportButton,
      renderRecordingImportState: renderRecordingImportState,
      updateRecordingImportContextState: updateRecordingImportContextState,
      ensureHideAuxiliaryZoneButton: ensureHideAuxiliaryZoneButton,
      ensureSegmentRecognizeButtons: ensureSegmentRecognizeButtons,
      createSegmentRecognizeButton: createSegmentRecognizeButton,
      maybeAutoApplyPreview: maybeAutoApplyPreview,
      fillCurrentRecommendation: fillCurrentRecommendation,
      buildSegmentRecognizeButtonOptions: buildSegmentRecognizeButtonOptions,
      handleRecommendAction: handleRecommendAction,
      handleRowRecommendAction: handleRowRecommendAction,
      createRecordingAutomationController: createRecordingAutomationController,
      createReviseBatchImportController: createReviseBatchImportController,
      resolveReviseImportAvailability: resolveReviseImportAvailability,
      runRecordingImportAndRefresh: runRecordingImportAndRefresh,
      handleRecordingImportAction: handleRecordingImportAction,
      handleRecordingRefreshAction: handleRecordingRefreshAction,
      syncRecordingResultForContext: syncRecordingResultForContext,
      createShortcutActions: createShortcutActions,
      createBatchRecommendController: createBatchRecommendController,
      fillEmptyLanguageKinds: fillEmptyLanguageKinds,
      buildSegmentRequestContext: buildSegmentRequestContext,
      buildSegmentRecognizeLayoutSignature: buildSegmentRecognizeLayoutSignature,
      findNativeSegmentTableContainer: findNativeSegmentTableContainer,
      setTaizhouAuxiliaryZonesHidden: setTaizhouAuxiliaryZonesHidden,
      syncPlaybackSensitiveDecorations: syncPlaybackSensitiveDecorations,
      syncPlaybackScrollGuard: syncPlaybackScrollGuard,
      getPlaybackScrollGuardState: getPlaybackScrollGuardState,
      setRuntimePolicyForTest: function (policy) {
        runtimePolicy = Object.assign({}, runtimePolicy || {}, policy || {});
      },
      setHelperRuntimeForTest: function (runtime) {
        helperRuntime = runtime || null;
      },
    },
  };

  globalThis.ASREdgeBytedanceAidpTaizhouContent = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (
    typeof window !== "undefined" &&
    window &&
    typeof document !== "undefined" &&
    globalThis.__ASREdgeBytedanceAidpTaizhouInstalled !== true
  ) {
    globalThis.__ASREdgeBytedanceAidpTaizhouInstalled = true;
    if (isManagementPage()) {
      void installTaskListUi();
    }
    if (isDetailPage()) {
      void installRuntime();
    }
    startRouteWatcher();
  }
})();
