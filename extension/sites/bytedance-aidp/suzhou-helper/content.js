(function () {
  if (globalThis.ASREdgeBytedanceAidpSuzhouContent) {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = globalThis.ASREdgeBytedanceAidpSuzhouContent;
    }
    return;
  }

  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const STORAGE = globalThis.ASREdgeStorage || null;
  const SCRIPT_ID =
    CONSTANTS.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID || "bytedanceAidpSuzhouHelper";
  const HIDDEN_ATTR = "data-asc-platform-ai-hidden";
  const PLATFORM_AI_SELECTORS = [
    ".trigger-wrapper-RlG7Dx",
    ".insight-container-Hn0Gna",
  ];

  let runtimeActive = false;
  let runtimePolicy = {
    runtimeAccessible: false,
    enabled: true,
    platformAiEnabled: true,
    shouldHidePlatformAi: false,
    contractMode: "dom-guarded",
  };
  let mutationObserver = null;
  let routeTimer = null;
  let domSyncTimer = null;
  let storageListenerBound = false;

  function normalizeText(value) {
    return String(value || "").trim();
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
        platformAiEnabled: true,
        contractMode: "dom-guarded",
      }
    );
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
    if (!isHideableNode(node) || node.getAttribute(HIDDEN_ATTR) === "true") {
      return false;
    }

    node.__ascPrevDisplayValue =
      typeof node.style.getPropertyValue === "function"
        ? String(node.style.getPropertyValue("display") || "")
        : "";
    node.__ascPrevDisplayPriority =
      typeof node.style.getPropertyPriority === "function"
        ? String(node.style.getPropertyPriority("display") || "")
        : "";
    node.setAttribute(HIDDEN_ATTR, "true");
    node.style.setProperty("display", "none", "important");
    return true;
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

  function findPlatformAiTargets(root) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : null;
    if (!scope) {
      return [];
    }

    const seen = new Set();
    const results = [];
    PLATFORM_AI_SELECTORS.forEach(function (selector) {
      Array.from(scope.querySelectorAll(selector)).forEach(function (node) {
        if (!seen.has(node) && isHideableNode(node)) {
          seen.add(node);
          results.push(node);
        }
      });
    });
    return results;
  }

  function findHiddenPlatformAiTargets(root) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : null;
    if (!scope) {
      return [];
    }
    return Array.from(scope.querySelectorAll("[" + HIDDEN_ATTR + "='true']")).filter(isHideableNode);
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

  async function refreshRuntimePolicy() {
    runtimePolicy = resolveRuntimePolicy(await loadSettings());
    if (typeof document !== "undefined") {
      syncPlatformAiVisibility(document, runtimePolicy.shouldHidePlatformAi);
      if (runtimePolicy.shouldHidePlatformAi) {
        ensureMutationObserver();
      } else {
        disconnectMutationObserver();
      }
    }
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
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
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
