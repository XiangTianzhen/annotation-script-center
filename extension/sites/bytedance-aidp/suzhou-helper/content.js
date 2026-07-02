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
  const segmentFactory = globalThis.ASREdgeBytedanceAidpSuzhouSegmentation || null;
  const uiFactory = globalThis.ASREdgeBytedanceAidpSuzhouUiPanel || null;
  const SCRIPT_ID =
    CONSTANTS.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID || "bytedanceAidpSuzhouHelper";
  const SEGMENT_PREVIEW_PATH = "/api/bytedance-aidp/suzhou-helper/segment/preview";
  const PLAYBACK_RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const FIXED_WAVE_ZOOM_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const DEFAULT_SEGMENT_SILENCE_THRESHOLD_DBFS = -31;
  const DEFAULT_SEGMENT_CONTEXT_PADDING_MS = 300;
  const DEFAULT_PLAYBACK_RATE = 1;
  const DEFAULT_FIXED_WAVE_ZOOM = 2;
  const DEFAULT_MERGE_CONTIGUOUS_SUGGESTED_SEGMENTS_ENABLED = true;
  const CLEAR_SEGMENTS_BUTTON_ATTR = "data-asc-clear-segments-button";
  const HIDDEN_ATTR = "data-asc-platform-ai-hidden";
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
  let storageListenerBound = false;
  let helperRuntime = null;

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

  function isDetailPage() {
    try {
      return isDetailPagePathname(globalThis.location?.pathname || "");
    } catch (_error) {
      return false;
    }
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
        defaultPlaybackRate: DEFAULT_PLAYBACK_RATE,
        fixedWaveZoom: DEFAULT_FIXED_WAVE_ZOOM,
        contractMode: "dom-guarded",
      }
    );
  }

  function resolveHelperConfig(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const defaults = getDefaultScriptConfig();
    const current = source?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {};
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
      defaultPlaybackRate: normalizePlaybackRate(
        current.defaultPlaybackRate,
        defaults.defaultPlaybackRate
      ),
      fixedWaveZoom: normalizeFixedWaveZoom(
        current.fixedWaveZoom,
        defaults.fixedWaveZoom
      ),
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
    if (!alreadyHidden) {
      node.__ascPrevDisplayValue =
        typeof node.style.getPropertyValue === "function"
          ? String(node.style.getPropertyValue("display") || "")
          : "";
      node.__ascPrevDisplayPriority =
        typeof node.style.getPropertyPriority === "function"
          ? String(node.style.getPropertyPriority("display") || "")
          : "";
      node.setAttribute(HIDDEN_ATTR, "true");
    }

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
      currentDisplayValue !== "none" ||
      currentDisplayPriority !== "important"
    );
  }

  function restorePlatformAiNode(node) {
    if (!isHideableNode(node) || node.getAttribute(HIDDEN_ATTR) !== "true") {
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

  function getFloatingAssistantScore(node) {
    if (!isHideableNode(node)) {
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

  function getPlaybackRateConfirmTarget(node) {
    if (!node) {
      return null;
    }
    return (
      (typeof node.querySelector === "function"
        ? node.querySelector(".arco-select-view-input")
        : null) || node
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

    const confirmTarget = getPlaybackRateConfirmTarget(playbackNode) || playbackNode;
    focusControl(playbackNode);
    if (confirmTarget !== playbackNode) {
      focusControl(confirmTarget);
    }
    dispatchKeyboardEvent(confirmTarget, "keydown", "Enter");
    dispatchKeyboardEvent(confirmTarget, "keypress", "Enter");
    dispatchKeyboardEvent(confirmTarget, "keyup", "Enter");
    if (confirmTarget !== playbackNode) {
      dispatchKeyboardEvent(playbackNode, "keydown", "Enter");
      dispatchKeyboardEvent(playbackNode, "keypress", "Enter");
      dispatchKeyboardEvent(playbackNode, "keyup", "Enter");
    }
    dispatchControlEvent(confirmTarget, "change");
    dispatchControlEvent(playbackNode, "change");
    dispatchControlEvent(confirmTarget, "blur");
    await waitFor(stepDelayMs);
    return {
      changed: changed,
      confirmed: getPlaybackComboboxLabel(playbackNode) === targetLabel,
      attempts: attempts,
      reason: getPlaybackComboboxLabel(playbackNode) === targetLabel
        ? "enter-confirmed"
        : "confirmation-missed",
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

  function ensureClearSegmentsButton(root, onClick) {
    const toolbar = findPlayToolbarRoot(root);
    if (!toolbar || typeof toolbar.querySelector === "undefined") {
      return false;
    }
    const existing =
      typeof toolbar.querySelector === "function"
        ? toolbar.querySelector("[" + CLEAR_SEGMENTS_BUTTON_ATTR + "='true']")
        : null;
    if (existing) {
      return false;
    }
    const documentLike = toolbar.ownerDocument || globalThis.document;
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return false;
    }
    const button = documentLike.createElement("button");
    button.type = "button";
    button.setAttribute(CLEAR_SEGMENTS_BUTTON_ATTR, "true");
    button.textContent = "清空画段";
    button.style.marginLeft = "8px";
    button.style.padding = "0 8px";
    button.style.height = "24px";
    button.style.border = "1px solid #d7dce5";
    button.style.borderRadius = "6px";
    button.style.background = "#fff";
    button.style.color = "#39424e";
    button.style.cursor = "pointer";
    button.style.fontSize = "12px";
    button.addEventListener("click", function () {
      if (typeof onClick === "function") {
        onClick();
      }
    });
    toolbar.appendChild(button);
    return true;
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
    if (helperRuntime?.ui?.destroy) {
      helperRuntime.ui.destroy();
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
        helperRuntime.ui.mount();
        applyWaveToolSettings(
          document,
          Object.assign(
            {},
            helperRuntime.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS),
            {
              playbackScopeKey: helperRuntime.playbackScopeKey,
            }
          )
        );
        ensureClearSegmentsButton(document, function () {
          void handleClearSegmentsAction();
        });
        const context = await helperRuntime.dataApi.getCurrentContext();
        helperRuntime.playbackScopeKey =
          normalizeText(context?.selectionKey) ||
          helperRuntime.playbackScopeKey ||
          getCurrentPlaybackScopeKey();
        applyWaveToolSettings(
          document,
          Object.assign({}, helperRuntime.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS), {
            playbackScopeKey: helperRuntime.playbackScopeKey,
          })
        );
        helperRuntime.ui.renderAudioContext(context);
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
      if (normalizeText(preview?.meta?.previewMode) === "whole-audio-fallback") {
        helperRuntime.ui.setStatus("已生成整条音频分段预览，可直接应用到当前暂存答案。", "success");
        return;
      }
      helperRuntime.ui.setStatus("分段建议已生成，请先复核后再应用。", "success");
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
    if (typeof setTimeout === "function") {
      setTimeout(function () {
        try {
          globalThis.location.reload();
        } catch (_error) {
          // Ignore reload failures and keep the success state visible.
        }
      }, 350);
    }
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
    if (typeof setTimeout === "function") {
      setTimeout(function () {
        try {
          globalThis.location.reload();
        } catch (_error) {
          // Ignore reload failures and keep the success state visible.
        }
      }, 350);
    }
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
    const configSignature = JSON.stringify({
      endpoint: endpoint,
      helperConfig: helperConfig,
    });
    if (helperRuntime && helperRuntime.configSignature === configSignature) {
      helperRuntime.ui.mount();
      applyWaveToolSettings(
        document,
        Object.assign({}, helperConfig, {
          playbackScopeKey: helperRuntime.playbackScopeKey,
        })
      );
      ensureClearSegmentsButton(document, function () {
        void handleClearSegmentsAction();
      });
      scheduleHelperContextRefresh(0);
      return;
    }
    destroyHelperRuntime();
    const dataApi = dataApiFactory.createRuntime();
    const segment = segmentFactory.createRuntime({
      endpoint: endpoint,
      silenceThresholdDbfs: helperConfig.segmentSilenceThresholdDbfs,
      contextPaddingMs: helperConfig.segmentContextPaddingMs,
      mergeContiguousSuggestedSegmentsEnabled:
        helperConfig.mergeContiguousSuggestedSegmentsEnabled,
    });
    const ui = uiFactory.createRuntime({
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
    helperRuntime = {
      dataApi: dataApi,
      segment: segment,
      ui: ui,
      preview: null,
      endpoint: endpoint,
      config: helperConfig,
      configSignature: configSignature,
      playbackScopeKey: getCurrentPlaybackScopeKey(),
    };
    ui.mount();
    applyWaveToolSettings(
      document,
      Object.assign({}, helperConfig, {
        playbackScopeKey: helperRuntime.playbackScopeKey,
      })
    );
    ensureClearSegmentsButton(document, function () {
      void handleClearSegmentsAction();
    });
    ui.setStatus("苏州话脚本已就绪；当前支持分段建议与平台暂存直写。", "success");
    scheduleHelperContextRefresh(0);
  }

  async function refreshRuntimePolicy() {
    const settings = await loadSettings();
    runtimePolicy = resolveRuntimePolicy(settings);
    if (typeof document !== "undefined") {
      syncPlatformAiVisibility(document, runtimePolicy.shouldHidePlatformAi);
      if (runtimePolicy.runtimeAccessible) {
        applyWaveToolSettings(
          document,
          Object.assign({}, resolveHelperConfig(settings), {
            playbackScopeKey: helperRuntime?.playbackScopeKey || getCurrentPlaybackScopeKey(),
          })
        );
        ensureClearSegmentsButton(document, function () {
          void handleClearSegmentsAction();
        });
      }
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
      if (runtimePolicy.runtimeAccessible) {
        applyWaveToolSettings(
          document,
          Object.assign(
            {},
            helperRuntime?.config || resolveHelperConfig(CONSTANTS.DEFAULT_SETTINGS || {}),
            {
              playbackScopeKey: helperRuntime?.playbackScopeKey || getCurrentPlaybackScopeKey(),
            }
          )
        );
        ensureClearSegmentsButton(document, function () {
          void handleClearSegmentsAction();
        });
      }
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
    if (!runtimeActive || !isDetailPage()) {
      return;
    }
    void refreshRuntimePolicy();
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
    destroyHelperRuntime();
    unbindStorageListener();
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
      if (!isDetailPage()) {
        if (runtimeActive) {
          destroyRuntime();
        }
        return;
      }
      if (!runtimeActive) {
        void installRuntime();
        return;
      }
      scheduleDomSync();
      if (helperRuntime) {
        helperRuntime.ui.mount();
        scheduleHelperContextRefresh(0);
      } else if (runtimePolicy.runtimeAccessible && dataApiFactory && segmentFactory && uiFactory) {
        void refreshRuntimePolicy();
      }
      if (runtimePolicy.shouldHidePlatformAi) {
        ensureMutationObserver();
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
      normalizeInsightTarget: normalizeInsightTarget,
      normalizeFloatingTarget: normalizeFloatingTarget,
      getInsightCandidateScore: getInsightCandidateScore,
      getFloatingAssistantScore: getFloatingAssistantScore,
      resolveHelperConfig: resolveHelperConfig,
      applyWaveToolSettings: applyWaveToolSettings,
      syncPlaybackRateControl: syncPlaybackRateControl,
      syncWaveZoomControl: syncWaveZoomControl,
      getPlaybackComboboxLabel: getPlaybackComboboxLabel,
      ensureClearSegmentsButton: ensureClearSegmentsButton,
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
    void installRuntime();
    startRouteWatcher();
  }
})();
