(function () {
  if (globalThis.ASREdgeBytedanceAidpSuzhouContent) {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = globalThis.ASREdgeBytedanceAidpSuzhouContent;
    }
    return;
  }

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const dataApiFactory = globalThis.ASREdgeBytedanceAidpSuzhouDataApi || null;
  const aiFactory = globalThis.ASREdgeBytedanceAidpSuzhouAiRecommendation || null;
  const segmentFactory = globalThis.ASREdgeBytedanceAidpSuzhouSegmentation || null;
  const uiFactory = globalThis.ASREdgeBytedanceAidpSuzhouUiPanel || null;
  const shortcutFactory = globalThis.ASREdgeBytedanceAidpSuzhouShortcuts || null;
  const SCRIPT_ID =
    CONSTANTS.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID || "bytedanceAidpSuzhouHelper";
  const AI_PATH = "/api/bytedance-aidp/suzhou-helper/ai/recommend";
  const SEGMENT_PREVIEW_PATH = "/api/bytedance-aidp/suzhou-helper/segment/preview";
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
  const TOOLBAR_ACTION_GROUP_ATTR = "data-asc-toolbar-action-group";
  const CLEAR_SEGMENTS_BUTTON_ATTR = "data-asc-clear-segments-button";
  const FILL_LANGUAGE_KIND_BUTTON_ATTR = "data-asc-fill-language-kind-button";
  const ACCOUNT_SWITCH_BAR_ATTR = "data-asc-aidp-account-switch-bar";
  const ACCOUNT_SWITCH_BUTTON_ATTR = "data-asc-aidp-account-switch-button";
  const ACCOUNT_SWITCH_STATUS_ATTR = "data-asc-aidp-account-switch-status";
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
    return Array.isArray(CONSTANTS.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS)
      ? CONSTANTS.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS
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
    return /^\/management\/task-v2\/[^/]+\/mark-v3\/[^/]+$/i.test(text);
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
      CONSTANTS.DEFAULT_SETTINGS?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {
        id: SCRIPT_ID,
        enabled: true,
        platformAiEnabled: false,
        segmentContextPaddingMs: DEFAULT_SEGMENT_CONTEXT_PADDING_MS,
        segmentSilenceThresholdDbfs: DEFAULT_SEGMENT_SILENCE_THRESHOLD_DBFS,
        mergeContiguousSuggestedSegmentsEnabled:
          DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED,
        segmentPreviewAutoApplyEnabled: DEFAULT_SEGMENT_PREVIEW_AUTO_APPLY_ENABLED,
        aiRecommendEnabled: true,
        aiRecommendAutoFillEnabled: DEFAULT_AI_RECOMMEND_AUTO_FILL_ENABLED,
        aiRecommendEndpoint:
          CONSTANTS.BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_SERVER_ENDPOINT ||
          "https://annotation-script-center.xiangtianzhen.store/api/bytedance-aidp/suzhou-helper/ai/recommend",
        aiRecommendRequestTimeoutMs: DEFAULT_TIMEOUT_MS,
        aiRecommendListenModel: "qwen3.5-omni-flash",
        aiRecommendListenPrompt: "",
        aiRecommendRefineModel: "qwen3.5-plus",
        aiRecommendRefinePrompt: "",
        defaultPlaybackRate: DEFAULT_PLAYBACK_RATE,
        fixedWaveZoom: DEFAULT_FIXED_WAVE_ZOOM,
        contractMode: "dom-guarded",
        shortcuts: {},
      }
    );
  }

  function resolveHelperConfig(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const defaults = getDefaultScriptConfig();
    const current = source?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {};
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
      aiRecommendAutoFillEnabled:
        current.aiRecommendAutoFillEnabled === false
          ? false
          : defaults.aiRecommendAutoFillEnabled !== false,
      aiRecommendEndpoint:
        normalizeText(current.aiRecommendEndpoint) || endpointBuilder(AI_PATH, settings),
      aiRecommendRequestTimeoutMs: normalizeAiRequestTimeoutMs(
        current.aiRecommendRequestTimeoutMs,
        defaults.aiRecommendRequestTimeoutMs || DEFAULT_TIMEOUT_MS
      ),
      aiStages: {
        listen: {
          model: normalizeStageModel(
            current.aiRecommendListenModel,
            defaults.aiRecommendListenModel || "qwen3.5-omni-flash"
          ),
          prompt: normalizeStagePrompt(current.aiRecommendListenPrompt || defaults.aiRecommendListenPrompt),
          params: buildAiStageParams(current, "aiRecommendListen"),
        },
        refine: {
          model: normalizeStageModel(
            current.aiRecommendRefineModel,
            defaults.aiRecommendRefineModel || "qwen3.5-plus"
          ),
          prompt: normalizeStagePrompt(current.aiRecommendRefinePrompt || defaults.aiRecommendRefinePrompt),
          params: buildAiStageParams(current, "aiRecommendRefine"),
        },
      },
      defaultPlaybackRate: normalizePlaybackRate(
        current.defaultPlaybackRate,
        defaults.defaultPlaybackRate
      ),
      fixedWaveZoom: normalizeFixedWaveZoom(
        current.fixedWaveZoom,
        defaults.fixedWaveZoom
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
    const current = source?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {};
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
    const mode = normalizeText(state.mode) === "fill" ? "fill" : "recognize";
    button.textContent = mode === "fill" ? "填入" : "识别音频";
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
      const mode = normalizeText(state.mode) === "fill" ? "fill" : "recognize";
      if (mode === "fill" && typeof recognizeOptions.onFill === "function") {
        recognizeOptions.onFill(segmentNumber);
        return;
      }
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
      listenText: normalizeText(source.listenText),
      finalMandarinText: normalizeText(source.finalMandarinText),
      usage: source.usage && typeof source.usage === "object" ? source.usage : {},
      cost: source.cost && typeof source.cost === "object" ? source.cost : {},
      timing: source.timing && typeof source.timing === "object" ? source.timing : {},
      models: source.models && typeof source.models === "object" ? source.models : {},
      raw: source.raw && typeof source.raw === "object" ? source.raw : {},
      debug: source.debug && typeof source.debug === "object" ? source.debug : {},
      notes: Array.isArray(source.notes) ? source.notes.slice() : [],
    };
  }

  async function maybeAutoFillCurrentRecommendation(runtimeContext, recommendation) {
    if (runtimeContext?.config?.aiRecommendAutoFillEnabled === false) {
      return {
        attempted: false,
        ok: false,
        reason: "disabled",
      };
    }
    if (!runtimeContext?.dataApi?.fillCurrentRegionTextIntoDom) {
      return {
        attempted: true,
        ok: false,
        result: {
          ok: false,
          message: "当前版本缺少单段直填能力，请刷新扩展后重试。",
        },
      };
    }
    const result = await runtimeContext.dataApi.fillCurrentRegionTextIntoDom({
      segmentNumber: recommendation.segmentNumber,
      finalMandarinText: recommendation.finalMandarinText,
    });
    if (!result.ok) {
      runtimeContext.ui?.setStatus?.(
        "识别结果已生成，但自动填入失败：" + normalizeText(result.message || "未知错误"),
        "error"
      );
      return {
        attempted: true,
        ok: false,
        result: result,
      };
    }
    runtimeContext.ui?.setStatus?.(result.message, result.filledCount > 0 ? "success" : "warning");
    return {
      attempted: true,
      ok: true,
      result: result,
    };
  }

  function buildRowRecommendCacheKey(selectionKey, segmentNumber) {
    return normalizeText(selectionKey) + "::" + String(Math.max(1, Math.round(Number(segmentNumber || 0)) || 1));
  }

  function buildSegmentsSignature(segments) {
    return (Array.isArray(segments) ? segments : [])
      .map(function (item) {
        return [
          Math.max(1, Math.round(Number(item?.segmentNumber || 0)) || 1),
          Math.max(0, Math.round(Number(item?.startMs || 0)) || 0),
          Math.max(0, Math.round(Number(item?.endMs || 0)) || 0),
        ].join(":");
      })
      .join("|");
  }

  function clearRowRecommendCache(runtimeContext) {
    if (runtimeContext?.rowRecommendCache && typeof runtimeContext.rowRecommendCache.clear === "function") {
      runtimeContext.rowRecommendCache.clear();
    }
  }

  function syncRowRecommendCacheContext(runtimeContext, context) {
    if (!runtimeContext) {
      return false;
    }
    const nextSelectionKey = normalizeText(context?.selectionKey);
    const nextSegmentsSignature = buildSegmentsSignature(context?.currentSegments);
    const changed =
      normalizeText(runtimeContext.rowRecommendScopeKey) !== nextSelectionKey ||
      normalizeText(runtimeContext.rowRecommendSegmentsSignature) !== nextSegmentsSignature;
    runtimeContext.rowRecommendScopeKey = nextSelectionKey;
    runtimeContext.rowRecommendSegmentsSignature = nextSegmentsSignature;
    if (changed) {
      clearRowRecommendCache(runtimeContext);
    }
    return changed;
  }

  function getCachedRowRecommendation(runtimeContext, selectionKey, segmentNumber) {
    if (!runtimeContext?.rowRecommendCache || typeof runtimeContext.rowRecommendCache.get !== "function") {
      return null;
    }
    return runtimeContext.rowRecommendCache.get(
      buildRowRecommendCacheKey(selectionKey, segmentNumber)
    ) || null;
  }

  function cacheRowRecommendation(runtimeContext, selectionKey, recommendation) {
    if (!runtimeContext?.rowRecommendCache || typeof runtimeContext.rowRecommendCache.set !== "function") {
      return;
    }
    runtimeContext.rowRecommendCache.set(
      buildRowRecommendCacheKey(selectionKey, recommendation.segmentNumber),
      {
        selectionKey: selectionKey,
        segmentNumber: recommendation.segmentNumber,
        finalMandarinText: recommendation.finalMandarinText,
        displayPayload: Object.assign({}, recommendation),
      }
    );
  }

  function deleteCachedRowRecommendation(runtimeContext, selectionKey, segmentNumber) {
    if (!runtimeContext?.rowRecommendCache || typeof runtimeContext.rowRecommendCache.delete !== "function") {
      return;
    }
    runtimeContext.rowRecommendCache.delete(
      buildRowRecommendCacheKey(selectionKey, segmentNumber)
    );
  }

  function buildSegmentRecognizeButtonOptions() {
    return {
      onRecognize: function (segmentNumber) {
        void handleRowRecommendAction(segmentNumber);
      },
      onFill: function (segmentNumber) {
        void handleFillRowRecommendAction(segmentNumber);
      },
      getActionState: function (segmentNumber) {
        if (!helperRuntime || helperRuntime.config?.aiRecommendAutoFillEnabled !== false) {
          return {
            mode: "recognize",
          };
        }
        return getCachedRowRecommendation(
          helperRuntime,
          helperRuntime.rowRecommendScopeKey,
          segmentNumber
        )
          ? {
              mode: "fill",
            }
          : {
              mode: "recognize",
            };
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
    return runWithProtectedScrollState(root, function () {
      let changed = false;
      changed =
        applyWaveToolSettings(
          root,
          Object.assign({}, resolvedConfig, {
            playbackScopeKey: playbackScopeKey,
          })
        ) || changed;
      changed =
        ensureClearSegmentsButton(root, function () {
          void handleClearSegmentsAction();
        }) || changed;
      changed =
        ensureFillLanguageKindsButton(root, function () {
          void handleFillLanguageKindsAction();
        }) || changed;
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
    let activeRun = null;
    let pendingFill = null;
    let autoFillEnabled =
      typeof deps.getAutoFillEnabled === "function" ? deps.getAutoFillEnabled() !== false : true;

    function getIdleActionMode() {
      return autoFillEnabled ? "recognizeAndFill" : "recognize";
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
      ui?.renderBatchState?.({
        phaseText: phaseText,
        actionMode: normalizeText(actionMode) || getIdleActionMode(),
        totalCount: Number(source.totalCount || 0) || 0,
        concurrency: Number(source.concurrency || 0) || 0,
        succeededCount: Number(source.succeededCount || 0) || 0,
        failedCount: Number(source.failedCount || 0) || 0,
        skippedCount: Number(source.skippedCount || 0) || 0,
        currentSegmentNumber: Number(source.currentSegmentNumber || 0) || 0,
        failures: Array.isArray(source.failures) ? source.failures.slice() : [],
      });
    }

    function clearPendingFill(keepBatchResults) {
      pendingFill = null;
      if (keepBatchResults !== true) {
        ui?.renderBatchAiResults?.([], 0);
      }
      render(null, "", getIdleActionMode());
    }

    async function runRecognition(selectedNumbers) {
      if (activeRun) {
        ui?.setStatus?.("当前已有正在运行的批量识别，请先等待完成或点击停止批量。", "error");
        return {
          ok: false,
          message: "当前已有正在运行的批量识别，请先等待完成或点击停止批量。",
        };
      }
      if (!dataApi?.getCurrentContext || !dataApi?.writeBatchRegionTexts || !ai?.recommendForSegment || !ai?.createSharedAudioSource) {
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
            if (payload.finalMandarinText) {
              run.updates.push({
                segmentNumber: payload.segmentNumber,
                finalMandarinText: payload.finalMandarinText,
              });
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
        clearPendingFill();
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
      };
    }

    async function writeUpdates(selectionKey, currentSignature, updates) {
      return dataApi.writeBatchRegionTexts({
        selectionKey: selectionKey,
        currentSignature: currentSignature,
        updates: Array.isArray(updates) ? updates.slice() : [],
      });
    }

    async function start(selectedNumbers, runtimeOptions) {
      const options = runtimeOptions && typeof runtimeOptions === "object" ? runtimeOptions : {};
      const shouldAutoFill = options.autoFill === false ? false : options.autoFill === true ? true : autoFillEnabled;
      const result = await runRecognition(selectedNumbers);
      if (!result?.ok) {
        return result;
      }
      if (!shouldAutoFill) {
        pendingFill =
          Array.isArray(result.updates) && result.updates.length > 0
            ? {
                selectionKey: normalizeText(result.selectionKey),
                currentSignature: normalizeText(result.currentSignature),
                totalCount: Number(result.totalCount || 0) || 0,
                concurrency: Number(result.concurrency || 0) || 0,
                succeededCount: Number(result.succeededCount || 0) || 0,
                failedCount: Number(result.failedCount || 0) || 0,
                skippedCount: Number(result.skippedCount || 0) || 0,
                failures: Array.isArray(result.failures) ? result.failures.slice() : [],
                results: Array.isArray(result.results) ? result.results.slice() : [],
                updates: result.updates.slice(),
              }
            : null;
        const hasPendingFill = Boolean(pendingFill && pendingFill.updates.length > 0);
        render(
          {
            totalCount: result.totalCount,
            concurrency: result.concurrency,
            succeededCount: result.succeededCount,
            failedCount: result.failedCount,
            skippedCount: result.skippedCount,
            failures: result.failures,
          },
          hasPendingFill ? "批量识别已完成" : "",
          hasPendingFill ? "fill" : getIdleActionMode()
        );
        if (hasPendingFill) {
          const successMessage =
            "已生成 " + String(pendingFill.updates.length) + " 段识别结果，点击“填入”可写回当前结果。";
          ui?.setStatus?.(successMessage, "success");
          return Object.assign({}, result, {
            message: successMessage,
            pendingFill: true,
            writtenCount: 0,
          });
        }
        const warningMessage = "批量识别已完成，但当前没有可填入的文本。";
        ui?.setStatus?.(warningMessage, "warning");
        return Object.assign({}, result, {
          message: warningMessage,
          pendingFill: false,
          writtenCount: 0,
        });
      }

      const saveResult = await writeUpdates(
        result.selectionKey,
        result.currentSignature,
        result.updates
      );
      render(
        {
          totalCount: result.totalCount,
          concurrency: result.concurrency,
          succeededCount: result.succeededCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount + Number(saveResult.skippedCount || 0),
          failures: result.failures,
        },
        saveResult.ok ? "批量写回完成" : "批量写回失败",
        getIdleActionMode()
      );
      if (saveResult.ok && saveResult.writtenCount > 0) {
        ui?.setStatus?.(saveResult.message, "success");
      } else if (saveResult.ok) {
        ui?.setStatus?.(saveResult.message, "warning");
      } else {
        ui?.setStatus?.(saveResult.message, "error");
      }
      return Object.assign({}, result, saveResult, {
        pendingFill: false,
        skippedCount: result.skippedCount + Number(saveResult.skippedCount || 0),
      });
    }

    async function fillPending() {
      if (activeRun) {
        return {
          ok: false,
          message: "当前仍有批量识别正在运行，请等待结束后再填入。",
        };
      }
      if (!pendingFill || !Array.isArray(pendingFill.updates) || pendingFill.updates.length <= 0) {
        render(null, "", getIdleActionMode());
        return {
          ok: false,
          message: "当前没有可填入的批量识别结果。",
        };
      }
      const liveContext = await dataApi.getCurrentContext();
      if (
        normalizeText(liveContext?.selectionKey) !== pendingFill.selectionKey ||
        normalizeText(liveContext?.currentSignature) !== pendingFill.currentSignature
      ) {
        clearPendingFill();
        return {
          ok: false,
          message: "当前题或分段状态已变化，已取消批量写回，请刷新后重试。",
        };
      }
      render(pendingFill, "批量写回进行中", "running");
      const saveResult = await writeUpdates(
        pendingFill.selectionKey,
        pendingFill.currentSignature,
        pendingFill.updates
      );
      const mergedSkippedCount =
        Number(pendingFill.skippedCount || 0) + Number(saveResult.skippedCount || 0);
      render(
        Object.assign({}, pendingFill, {
          skippedCount: mergedSkippedCount,
        }),
        saveResult.ok ? "批量写回完成" : "批量写回失败",
        getIdleActionMode()
      );
      if (saveResult.ok && saveResult.writtenCount > 0) {
        ui?.setStatus?.(saveResult.message, "success");
      } else if (saveResult.ok) {
        ui?.setStatus?.(saveResult.message, "warning");
      } else {
        ui?.setStatus?.(saveResult.message, "error");
      }
      const result = Object.assign({}, pendingFill, saveResult, {
        pendingFill: false,
        skippedCount: mergedSkippedCount,
      });
      pendingFill = null;
      return result;
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

    function setAutoFillEnabled(enabled) {
      autoFillEnabled = enabled !== false;
      if (!activeRun) {
        render(
          pendingFill,
          "",
          pendingFill && Array.isArray(pendingFill.updates) && pendingFill.updates.length > 0
            ? "fill"
            : getIdleActionMode()
        );
      }
    }

    function syncContext(context) {
      const selectionKey = normalizeText(context?.selectionKey);
      const currentSignature = normalizeText(context?.currentSignature);
      if (
        pendingFill &&
        (pendingFill.selectionKey !== selectionKey || pendingFill.currentSignature !== currentSignature)
      ) {
        clearPendingFill();
      }
    }

    function dispose() {
      activeRun = null;
      pendingFill = null;
    }

    return {
      start,
      fillPending,
      stop,
      setAutoFillEnabled,
      syncContext,
      dispose,
    };
  }

  function createShortcutActions(deps) {
    const source = deps && typeof deps === "object" ? deps : {};
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
        return source.onDeleteCurrentSelection?.();
      },
      clearSegments: function () {
        return source.onClearSegments?.();
      },
      previewSegments: function () {
        return source.onPreviewSegments?.();
      },
      applyPreviewSegments: function () {
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
        syncRowRecommendCacheContext(helperRuntime, context);
        helperRuntime.batchController?.syncContext?.(context);
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
        helperRuntime.batchSelectionKey = normalizeText(context?.selectionKey);
        if (!normalizeText(context?.audioUrl)) {
          helperRuntime.ui.setStatus("正在等待页面返回当前音频与分段上下文...", "");
        }
      } catch (_error) {
        if (helperRuntime) {
          helperRuntime.ui.setStatus("正在等待页面返回当前音频与分段上下文...", "");
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
              suzhouHelper: {
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

  async function handleAiRecommendAutoFillToggle(nextEnabled) {
    if (!helperRuntime) {
      return;
    }
    const previousEnabled = helperRuntime.config?.aiRecommendAutoFillEnabled !== false;
    helperRuntime.config = Object.assign({}, helperRuntime.config || {}, {
      aiRecommendAutoFillEnabled: nextEnabled !== false,
    });
    if (!STORAGE || typeof STORAGE.patchSettings !== "function") {
      return;
    }
    try {
      const settings = await STORAGE.patchSettings({
        platforms: {
          bytedanceAidp: {
            scripts: {
              suzhouHelper: {
                id: SCRIPT_ID,
                aiRecommendAutoFillEnabled: nextEnabled !== false,
              },
            },
          },
        },
      });
      runtimePolicy = resolveRuntimePolicy(settings);
      ensureHelperRuntime(settings);
    } catch (error) {
      helperRuntime.config = Object.assign({}, helperRuntime.config || {}, {
        aiRecommendAutoFillEnabled: previousEnabled,
      });
      helperRuntime.ui?.setAiRecommendAutoFillEnabled?.(previousEnabled);
      helperRuntime.ui?.setStatus?.(
        "保存自动填入开关失败：" + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleRecommendAction() {
    if (!helperRuntime || !helperRuntime.ai) {
      return;
    }
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在识别当前段普通话听写稿...", "");
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
      const requestContext = buildActiveSegmentRequestContext(context);
      const recommendation = await helperRuntime.ai.recommend(requestContext);
      helperRuntime.lastRecommendation = buildRecommendationDisplayPayload(recommendation);
      helperRuntime.ui.renderCurrentRecommendation(helperRuntime.lastRecommendation);
      helperRuntime.ui.renderAiMeta(helperRuntime.lastRecommendation);
      const autoFillResult = await maybeAutoFillCurrentRecommendation(
        helperRuntime,
        helperRuntime.lastRecommendation
      );
      if (autoFillResult.attempted) {
        return;
      }
      helperRuntime.ui.setStatus("识别结果已生成，可继续复核或暂存。", "success");
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
      helperRuntime.ui?.setStatus?.("当前已关闭苏州话 AI 识别功能。", "error");
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
    helperRuntime.ui.setStatus("正在识别第 " + String(targetSegmentNumber) + " 段普通话听写稿...", "");
    try {
      const context = await helperRuntime.dataApi.getCurrentContext();
      const cacheContextChanged = syncRowRecommendCacheContext(helperRuntime, context);
      helperRuntime.ui.renderAudioContext(context);
      if (cacheContextChanged) {
        syncRowRecognizeButtons();
      }
      if (!normalizeText(context?.audioUrl)) {
        helperRuntime.ui.setStatus(
          "当前还没拿到音频地址，请等待页面初始化完成，或刷新当前详情页后重试。",
          "error"
        );
        return;
      }
      const requestContext = buildSegmentRequestContext(context, targetSegmentNumber);
      const recommendation = await helperRuntime.ai.recommend(requestContext);
      helperRuntime.lastRecommendation = buildRecommendationDisplayPayload(recommendation);
      helperRuntime.ui.renderCurrentRecommendation(helperRuntime.lastRecommendation);
      helperRuntime.ui.renderAiMeta(helperRuntime.lastRecommendation);
      const selectionKey = normalizeText(context?.selectionKey);
      if (helperRuntime.config?.aiRecommendAutoFillEnabled === false) {
        if (!normalizeText(helperRuntime.lastRecommendation.finalMandarinText)) {
          deleteCachedRowRecommendation(helperRuntime, selectionKey, targetSegmentNumber);
          syncRowRecognizeButtons();
          helperRuntime.ui.setStatus(
            "第 " + String(targetSegmentNumber) + " 段识别结果为空，当前没有可填入的文本。",
            "warning"
          );
          return;
        }
        cacheRowRecommendation(helperRuntime, selectionKey, helperRuntime.lastRecommendation);
        syncRowRecognizeButtons();
        helperRuntime.ui.setStatus(
          "已生成第 " + String(targetSegmentNumber) + " 段识别结果，点击“填入”可写入输入框。",
          "success"
        );
        return;
      }
      if (!helperRuntime.dataApi?.fillCurrentRegionTextIntoDom) {
        helperRuntime.ui.setStatus("当前版本缺少单段直填能力，请刷新扩展后重试。", "error");
        return;
      }
      const result = await helperRuntime.dataApi.fillCurrentRegionTextIntoDom({
        segmentNumber: helperRuntime.lastRecommendation.segmentNumber,
        finalMandarinText: helperRuntime.lastRecommendation.finalMandarinText,
      });
      if (!result.ok) {
        helperRuntime.ui.setStatus(
          "第 " +
            String(targetSegmentNumber) +
            " 段识别已生成，但写回失败：" +
            normalizeText(result.message || "未知错误"),
          "error"
        );
        return;
      }
      deleteCachedRowRecommendation(helperRuntime, selectionKey, targetSegmentNumber);
      syncRowRecognizeButtons();
      helperRuntime.ui.setStatus(result.message, result.filledCount > 0 ? "success" : "warning");
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

  async function handleFillRowRecommendAction(segmentNumber) {
    if (!helperRuntime?.dataApi?.fillCurrentRegionTextIntoDom) {
      helperRuntime?.ui?.setStatus?.("当前版本缺少单段直填能力，请刷新扩展后重试。", "error");
      return;
    }
    const targetSegmentNumber = Math.max(0, Math.round(Number(segmentNumber || 0)) || 0);
    if (targetSegmentNumber <= 0) {
      helperRuntime?.ui?.setStatus?.("当前没有可填入的目标段，请刷新页面后重试。", "error");
      return;
    }
    try {
      const context = await helperRuntime.dataApi.getCurrentContext();
      const cacheContextChanged = syncRowRecommendCacheContext(helperRuntime, context);
      helperRuntime.ui.renderAudioContext(context);
      if (cacheContextChanged) {
        syncRowRecognizeButtons();
      }
      const selectionKey = normalizeText(context?.selectionKey);
      const cached = getCachedRowRecommendation(helperRuntime, selectionKey, targetSegmentNumber);
      if (!cached) {
        helperRuntime.ui.setStatus(
          "请先完成第 " + String(targetSegmentNumber) + " 段识别，再点击“填入”。",
          "error"
        );
        syncRowRecognizeButtons();
        return;
      }
      if (cached.displayPayload) {
        helperRuntime.lastRecommendation = Object.assign({}, cached.displayPayload);
        helperRuntime.ui.renderCurrentRecommendation(helperRuntime.lastRecommendation);
        helperRuntime.ui.renderAiMeta(helperRuntime.lastRecommendation);
      }
      const result = await helperRuntime.dataApi.fillCurrentRegionTextIntoDom({
        segmentNumber: targetSegmentNumber,
        finalMandarinText: cached.finalMandarinText,
      });
      if (result.ok) {
        deleteCachedRowRecommendation(helperRuntime, selectionKey, targetSegmentNumber);
        syncRowRecognizeButtons();
      }
      helperRuntime.ui.setStatus(
        result.message,
        result.filledCount > 0 ? "success" : result.ok ? "warning" : "error"
      );
    } catch (error) {
      helperRuntime.ui.setStatus(
        "第 " +
          String(targetSegmentNumber) +
          " 段填入失败：" +
          (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function handleWriteCurrentRecommendAction() {
    if (!helperRuntime || !helperRuntime.lastRecommendation) {
      helperRuntime?.ui?.setStatus?.("请先生成识别结果。", "error");
      return;
    }
    const result = await helperRuntime.dataApi.writeCurrentRegionText(helperRuntime.lastRecommendation);
    helperRuntime.ui.setStatus(result.message, result.writtenCount > 0 ? "success" : result.ok ? "warning" : "error");
    if (result.ok && result.writtenCount > 0) {
      scheduleRuntimeReload(helperRuntime);
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

  async function handleBatchFillAction() {
    if (!helperRuntime?.batchController) {
      return;
    }
    helperRuntime.ui.mount();
    helperRuntime.ui.setStatus("正在填入最近一次批量识别结果...", "");
    try {
      const result = await helperRuntime.batchController.fillPending();
      if (!result?.ok) {
        helperRuntime.ui.setStatus(
          normalizeText(result?.message || "当前没有可填入的批量识别结果。"),
          "error"
        );
        return;
      }
      if (result.writtenCount > 0) {
        scheduleRuntimeReload(helperRuntime);
        return;
      }
      helperRuntime.ui.setStatus(
        normalizeText(result.message || "当前没有新的批量结果需要填入。"),
        "warning"
      );
    } catch (error) {
      helperRuntime.ui.setStatus(
        "批量填入失败：" + (error && error.message ? error.message : String(error)),
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

  function destroyTaskListUi() {
    managementUiActive = false;
    if (typeof document !== "undefined") {
      destroyAccountSwitchBar(document);
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
    runtimePolicy = resolveRuntimePolicy(settings);
    if (typeof document !== "undefined") {
      syncManagementAccountSwitchBar(document);
    }
    return runtimePolicy;
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
    const helperConfig = resolveHelperConfig(settings);
    if (typeof document !== "undefined") {
      ensurePlaybackScrollGuardWatchdog(document);
    }
    const configSignature = JSON.stringify({
      endpoint: endpoint,
      helperConfig: helperConfig,
    });
    if (helperRuntime && helperRuntime.configSignature === configSignature) {
      helperRuntime.config = helperConfig;
      helperRuntime.endpoint = endpoint;
      helperRuntime.ui.setSegmentPreviewAutoApplyEnabled?.(
        helperConfig.segmentPreviewAutoApplyEnabled
      );
      helperRuntime.ui.setAiRecommendAutoFillEnabled?.(helperConfig.aiRecommendAutoFillEnabled);
      helperRuntime.batchController?.setAutoFillEnabled?.(
        helperConfig.aiRecommendAutoFillEnabled
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
            aiStages: helperConfig.aiStages,
          })
        : null;
    const segment = segmentFactory.createRuntime({
      endpoint: endpoint,
      silenceThresholdDbfs: helperConfig.segmentSilenceThresholdDbfs,
      contextPaddingMs: helperConfig.segmentContextPaddingMs,
      mergeContiguousSuggestedSegmentsEnabled:
        helperConfig.mergeContiguousSuggestedSegmentsEnabled,
    });
    const ui = uiFactory.createRuntime({
      segmentPreviewAutoApplyEnabled: helperConfig.segmentPreviewAutoApplyEnabled,
      aiRecommendAutoFillEnabled: helperConfig.aiRecommendAutoFillEnabled,
      onToggleAiRecommendAutoFill: function (nextEnabled) {
        void handleAiRecommendAutoFillToggle(nextEnabled);
      },
      onRecommend: function () {
        if (helperConfig.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭苏州话 AI 识别功能。", "error");
          return;
        }
        void handleRecommendAction();
      },
      onWriteCurrentRecommend: function () {
        void handleWriteCurrentRecommendAction();
      },
      onBatchRecommend: function (selectedNumbers) {
        if (helperConfig.aiRecommendEnabled === false) {
          ui.setStatus("当前已关闭苏州话 AI 识别功能。", "error");
          return;
        }
        void handleBatchRecommendAction(selectedNumbers);
      },
      onBatchStop: function () {
        helperRuntime?.batchController?.stop?.();
      },
      onBatchFill: function () {
        void handleBatchFillAction();
      },
      onPreview: function () {
        void handlePreviewAction();
      },
      onApplyPreview: function () {
        void handleApplyPreviewAction();
      },
      onClearSegments: function () {
        void handleClearSegmentsAction();
      },
    });
    const shortcuts =
      shortcutFactory && typeof shortcutFactory.createRuntime === "function"
        ? shortcutFactory.createRuntime({
            shortcuts: helperConfig.shortcuts,
            actions: createShortcutActions({
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
                return handleClearSegmentsAction();
              },
              onPreviewSegments: function () {
                return handlePreviewAction();
              },
              onApplyPreviewSegments: function () {
                return handleApplyPreviewAction();
              },
            }),
          })
        : null;
    const batchController = createBatchRecommendController({
      dataApi: dataApi,
      ai: ai,
      ui: ui,
      getAutoFillEnabled: function () {
        return helperConfig.aiRecommendAutoFillEnabled;
      },
    });
    helperRuntime = {
      dataApi: dataApi,
      ai: ai,
      batchController: batchController,
      segment: segment,
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
      rowRecommendScopeKey: "",
      rowRecommendSegmentsSignature: "",
      rowRecognizeLayoutSignature: "",
      rowRecommendCache: new Map(),
      scheduleReload: function () {
        scheduleRuntimeReload(helperRuntime);
      },
    };
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
      ui.setStatus(
        "苏州话脚本已就绪；当前支持单段识别直填输入框、批量识别和分段建议暂存写回。",
        "success"
      );
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
      isTaskListPagePathname: isTaskListPagePathname,
      isManagementPagePathname: isManagementPagePathname,
      normalizeInsightTarget: normalizeInsightTarget,
      normalizeFloatingTarget: normalizeFloatingTarget,
      getInsightCandidateScore: getInsightCandidateScore,
      getFloatingAssistantScore: getFloatingAssistantScore,
      ensureAccountSwitchBar: ensureAccountSwitchBar,
      requestAidpLoginStateReset: requestAidpLoginStateReset,
      runAccountSwitchFlow: runAccountSwitchFlow,
      resolveHelperConfig: resolveHelperConfig,
      applyWaveToolSettings: applyWaveToolSettings,
      syncPlaybackRateControl: syncPlaybackRateControl,
      syncWaveZoomControl: syncWaveZoomControl,
      getPlaybackComboboxLabel: getPlaybackComboboxLabel,
      parseWaveElapsedTimeMs: parseWaveElapsedTimeMs,
      isWavePlaybackActive: isWavePlaybackActive,
      ensureClearSegmentsButton: ensureClearSegmentsButton,
      ensureFillLanguageKindsButton: ensureFillLanguageKindsButton,
      ensureSegmentRecognizeButtons: ensureSegmentRecognizeButtons,
      maybeAutoApplyPreview: maybeAutoApplyPreview,
      createShortcutActions: createShortcutActions,
      createBatchRecommendController: createBatchRecommendController,
      fillEmptyLanguageKinds: fillEmptyLanguageKinds,
      buildSegmentRequestContext: buildSegmentRequestContext,
      buildSegmentRecognizeLayoutSignature: buildSegmentRecognizeLayoutSignature,
      syncPlaybackSensitiveDecorations: syncPlaybackSensitiveDecorations,
      syncPlaybackScrollGuard: syncPlaybackScrollGuard,
      getPlaybackScrollGuardState: getPlaybackScrollGuardState,
      setRuntimePolicyForTest: function (policy) {
        runtimePolicy = Object.assign({}, runtimePolicy || {}, policy || {});
      },
    },
  };

  globalThis.ASREdgeBytedanceAidpSuzhouContent = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (
    typeof window !== "undefined" &&
    window &&
    typeof document !== "undefined" &&
    globalThis.__ASREdgeBytedanceAidpSuzhouInstalled !== true
  ) {
    globalThis.__ASREdgeBytedanceAidpSuzhouInstalled = true;
    if (isManagementPage()) {
      void installTaskListUi();
    }
    if (isDetailPage()) {
      void installRuntime();
    }
    startRouteWatcher();
  }
})();
