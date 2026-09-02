const sharedConstantsUrl = chrome.runtime.getURL("shared/constants.js");
const sharedStorageUrl = chrome.runtime.getURL("shared/storage.js");
importScripts(sharedConstantsUrl, sharedStorageUrl);

const constants = globalThis.ASREdgeConstants;
const storage = globalThis.ASREdgeStorage;
const LOG_PREFIX = "[ASR Edge][background]";
const AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE = "ASR_EDGE_RESET_AIDP_LOGIN_STATE";
const AIDP_COOKIE_CLEAR_MESSAGE_TYPE = "ASR_EDGE_CLEAR_AIDP_COOKIES";
const AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE =
  "ASR_EDGE_AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK";
const SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE = "ASR_EDGE_SHUJIAJIA_TRUSTED_INPUT";
const AIDP_SITE_STORAGE_CLEAR_ORIGINS = Object.freeze([
  "https://aidp.bytedance.com",
  "https://mpsso.jiyunhudong.com",
]);
const AIDP_SITE_STORAGE_REMOVE_OPTIONS = Object.freeze({
  cache: true,
  cacheStorage: true,
  cookies: true,
  fileSystems: true,
  indexedDB: true,
  localStorage: true,
  serviceWorkers: true,
  webSQL: true,
});
const AIDP_ACCOUNT_SWITCH_SCOPE_URLS = Object.freeze([
  "https://aidp.bytedance.com/",
  "https://bytedance.com/",
  "https://mpsso.jiyunhudong.com/",
  "https://accounts.feishu.cn/",
  "https://api.feelgood.cn/",
]);
const AIDP_ACCOUNT_SWITCH_PARTITIONED_SCOPE_QUERIES = Object.freeze([
  Object.freeze({
    url: "https://accounts.feishu.cn/",
    partitionKey: Object.freeze({
      topLevelSite: "https://mpsso.jiyunhudong.com",
    }),
  }),
]);

async function bootstrap(reason) {
  const nextSettings = await storage.patchSettings({
    meta: {
      lastBootstrapReason: reason,
      lastBootstrappedAt: new Date().toISOString(),
    },
  });

  console.info(LOG_PREFIX, "Bootstrap completed.", {
    reason: reason,
    stage: nextSettings.stage,
    enabledPlatforms: Object.keys(nextSettings.platforms || {}).filter(function (platformId) {
      return nextSettings.platforms[platformId]?.enabled !== false;
    }),
  });
}

function normalizeAidpCookieScopeUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    if (String(url.protocol || "").toLowerCase() !== "https:") {
      return "";
    }
    const hostname = String(url.hostname || "").toLowerCase();
    if (
      hostname !== "aidp.bytedance.com" &&
      hostname !== "mpsso.jiyunhudong.com"
    ) {
      return "";
    }
    return url.origin + "/";
  } catch (_error) {
    return "";
  }
}

function getAidpInternalQualityDebuggerClickTarget(message, sender) {
  if (
    !message ||
    typeof message !== "object" ||
    message.type !== AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE ||
    sender?.frameId !== 0
  ) {
    return null;
  }
  const tabId = sender?.tab?.id;
  const urlText = String(sender?.tab?.url || "").trim();
  const action = String(message.action || "").trim();
  const itemId = String(message.itemId || "").trim();
  const x = Number(message.x);
  const y = Number(message.y);
  if (
    !Number.isInteger(tabId) ||
    (action !== "submit" && action !== "quality-ok-radio") ||
    !itemId ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0
  ) {
    return null;
  }
  try {
    const url = new URL(urlText);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "aidp.bytedance.com" ||
      !/^\/management\/task-v2\/[^/]+\/mark-package\/[^/]+\/17$/i.test(url.pathname) ||
      url.searchParams.get("itemID") !== itemId
    ) {
      return null;
    }
    return {
      tabId: tabId,
      x: x,
      y: y,
    };
  } catch (_error) {
    return null;
  }
}

async function triggerAidpInternalQualityDebuggerClick(message, sender) {
  const target = getAidpInternalQualityDebuggerClickTarget(message, sender);
  const debuggerApi = chrome.debugger;
  if (
    !target ||
    !debuggerApi ||
    typeof debuggerApi.attach !== "function" ||
    typeof debuggerApi.sendCommand !== "function" ||
    typeof debuggerApi.detach !== "function"
  ) {
    return { ok: false, reason: "debugger-click-unavailable" };
  }
  const debuggee = { tabId: target.tabId };
  let attached = false;
  let actionError = null;
  try {
    try {
    await debuggerApi.attach(debuggee, "1.3");
    attached = true;
    } catch (_error) {
      actionError = "debugger-attach-failed";
    }
    if (!actionError) {
      try {
    await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: target.x,
      y: target.y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    });
      } catch (_error) {
        actionError = "debugger-mouse-press-failed";
      }
    }
    if (!actionError) {
      try {
    await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: target.x,
      y: target.y,
      button: "left",
      buttons: 0,
      clickCount: 1,
    });
      } catch (_error) {
        actionError = "debugger-mouse-release-failed";
      }
    }
  } finally {
    if (attached) {
      try {
        await debuggerApi.detach(debuggee);
      } catch (_error) {
        actionError = actionError || "debugger-detach-failed";
      }
    }
  }
  return actionError ? { ok: false, reason: actionError } : { ok: true };
}

function getShujiajiaTrustedInputTarget(message, sender) {
  if (!message || message.type !== SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE || sender?.frameId !== 0) return null;
  const tab = sender?.tab || {};
  const action = String(message.action || "");
  if (!Number.isInteger(tab.id) || (action !== "shift-drag" && action !== "delete")) return null;
  try {
    const url = new URL(String(tab.url || ""));
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "www.shujiajia.com" || url.pathname !== "/workbench/piece/mark.html") return null;
  } catch (_error) {
    return null;
  }
  if (action === "delete") return { tabId: tab.id, action };
  const width = Number(tab.width);
  const height = Number(tab.height);
  const values = [message.startX, message.startY, message.endX, message.endY].map(Number);
  if (!(width > 0) || !(height > 0) || values.some((value) => !Number.isFinite(value))) return null;
  const [startX, startY, endX, endY] = values;
  if (startX < 0 || startY < 0 || endX <= startX || endY < 0 || startX > width || endX > width || startY > height || endY > height) return null;
  return { tabId: tab.id, action, startX, startY, endX, endY };
}

async function triggerShujiajiaTrustedInput(message, sender) {
  const target = getShujiajiaTrustedInputTarget(message, sender);
  const debuggerApi = chrome.debugger;
  if (!target || !debuggerApi?.attach || !debuggerApi?.sendCommand || !debuggerApi?.detach) {
    return { ok: false, reason: "trusted-input-unavailable" };
  }
  const debuggee = { tabId: target.tabId };
  let attached = false;
  let pressed = false;
  let actionError = "";
  try {
    try {
      await debuggerApi.attach(debuggee, "1.3");
      attached = true;
    } catch (_error) {
      actionError = "debugger-attach-failed";
    }
    if (!actionError && target.action === "delete") {
      try {
        await debuggerApi.sendCommand(debuggee, "Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46, nativeVirtualKeyCode: 46 });
        await debuggerApi.sendCommand(debuggee, "Input.dispatchKeyEvent", { type: "keyUp", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46, nativeVirtualKeyCode: 46 });
      } catch (_error) {
        actionError = "debugger-delete-failed";
      }
    }
    if (!actionError && target.action === "shift-drag") {
      const base = { button: "left", clickCount: 1, modifiers: 8 };
      try {
        await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", { ...base, type: "mouseMoved", x: target.startX, y: target.startY, buttons: 0 });
        await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", { ...base, type: "mousePressed", x: target.startX, y: target.startY, buttons: 1 });
        pressed = true;
        const steps = 12;
        for (let index = 1; index <= steps; index += 1) {
          const ratio = index / steps;
          await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", {
            ...base,
            type: "mouseMoved",
            x: target.startX + (target.endX - target.startX) * ratio,
            y: target.startY + (target.endY - target.startY) * ratio,
            buttons: 1,
          });
        }
        await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", { ...base, type: "mouseReleased", x: target.endX, y: target.endY, buttons: 0 });
        pressed = false;
      } catch (_error) {
        actionError = "debugger-drag-failed";
      }
    }
  } finally {
    if (attached && pressed) {
      try {
        await debuggerApi.sendCommand(debuggee, "Input.dispatchMouseEvent", { type: "mouseReleased", x: target.endX, y: target.endY, button: "left", buttons: 0, clickCount: 1, modifiers: 8 });
      } catch (_error) {}
    }
    if (attached) {
      try { await debuggerApi.detach(debuggee); } catch (_error) { actionError = actionError || "debugger-detach-failed"; }
    }
  }
  return actionError ? { ok: false, reason: actionError } : { ok: true };
}

function clonePartitionKey(partitionKey) {
  if (!partitionKey || typeof partitionKey !== "object") {
    return undefined;
  }
  const nextKey = {};
  if (String(partitionKey.topLevelSite || "").trim()) {
    nextKey.topLevelSite = String(partitionKey.topLevelSite || "").trim();
  }
  if (typeof partitionKey.hasCrossSiteAncestor === "boolean") {
    nextKey.hasCrossSiteAncestor = partitionKey.hasCrossSiteAncestor;
  }
  return Object.keys(nextKey).length > 0 ? nextKey : undefined;
}

function buildAidpCookieScopeQueries(value) {
  const entryUrl = normalizeAidpCookieScopeUrl(value);
  if (!entryUrl) {
    return [];
  }
  const queries = AIDP_ACCOUNT_SWITCH_SCOPE_URLS.map(function (url) {
    return { url: url };
  });
  AIDP_ACCOUNT_SWITCH_PARTITIONED_SCOPE_QUERIES.forEach(function (query) {
    queries.push({
      url: query.url,
      partitionKey: clonePartitionKey(query.partitionKey),
    });
  });
  return queries;
}

function buildCookieRemovalDetails(cookie) {
  if (!cookie || typeof cookie !== "object") {
    return null;
  }
  const name = String(cookie.name || "").trim();
  const domain = String(cookie.domain || "").trim().replace(/^\./, "");
  if (!name || !domain) {
    return null;
  }
  const path = String(cookie.path || "/").trim() || "/";
  const details = {
    url: (cookie.secure === false ? "http://" : "https://") + domain + (path.charAt(0) === "/" ? path : "/" + path),
    name: name,
  };
  if (String(cookie.storeId || "").trim()) {
    details.storeId = String(cookie.storeId || "").trim();
  }
  if (cookie.partitionKey && typeof cookie.partitionKey === "object") {
    details.partitionKey = cookie.partitionKey;
  }
  return details;
}

function buildCookieRemovalIdentity(details) {
  if (!details || typeof details !== "object") {
    return "";
  }
  return JSON.stringify({
    url: String(details.url || ""),
    name: String(details.name || ""),
    storeId: String(details.storeId || ""),
    partitionKey: clonePartitionKey(details.partitionKey) || null,
  });
}

function cloneAidpSiteStorageRemovalOptions() {
  return {
    cache: true,
    cacheStorage: true,
    cookies: true,
    fileSystems: true,
    indexedDB: true,
    localStorage: true,
    serviceWorkers: true,
    webSQL: true,
  };
}

async function clearAidpSiteStorage(browsingDataApi) {
  const api = browsingDataApi || chrome.browsingData;
  if (!api || typeof api.remove !== "function") {
    return {
      ok: false,
      reason: "browsing-data-api-unavailable",
      message: "扩展当前没有可用的站点储存清理能力。",
      clearedCount: 0,
    };
  }

  await new Promise(function (resolve, reject) {
    try {
      api.remove(
        {
          origins: AIDP_SITE_STORAGE_CLEAR_ORIGINS.slice(),
        },
        cloneAidpSiteStorageRemovalOptions(),
        function () {
          const lastError = chrome.runtime && chrome.runtime.lastError;
          if (lastError) {
            reject(new Error(lastError.message || String(lastError)));
            return;
          }
          resolve();
        }
      );
    } catch (error) {
      reject(error);
    }
  });

  return {
    ok: true,
    message: "已清理 AIDP 站点储存。",
    clearedCount: 0,
    origins: AIDP_SITE_STORAGE_CLEAR_ORIGINS.slice(),
  };
}

async function clearCookiesForUrl(url, cookieApi) {
  const queries = buildAidpCookieScopeQueries(url);
  if (queries.length <= 0) {
    return {
      ok: false,
      reason: "invalid-aidp-url",
      message: "仅支持从 ByteDance AIDP 管理区发起登录态清理。",
      clearedCount: 0,
    };
  }
  const api = cookieApi || chrome.cookies;
  if (!api || typeof api.getAll !== "function" || typeof api.remove !== "function") {
    return {
      ok: false,
      reason: "cookies-api-unavailable",
      message: "扩展当前没有可用的 Cookie 清理能力。",
      clearedCount: 0,
    };
  }

  const cookies = [];
  for (const query of queries) {
    try {
      const matched = await api.getAll(query);
      if (Array.isArray(matched) && matched.length > 0) {
        cookies.push.apply(cookies, matched);
      }
    } catch (error) {
      if (!query.partitionKey) {
        throw error;
      }
    }
  }
  let clearedCount = 0;
  const seenRemovalKeys = new Set();
  for (const cookie of Array.isArray(cookies) ? cookies : []) {
    const details = buildCookieRemovalDetails(cookie);
    if (!details) {
      continue;
    }
    const removalKey = buildCookieRemovalIdentity(details);
    if (!removalKey || seenRemovalKeys.has(removalKey)) {
      continue;
    }
    seenRemovalKeys.add(removalKey);
    const removed = await api.remove(details);
    if (removed) {
      clearedCount += 1;
    }
  }

  return {
    ok: true,
    message:
      clearedCount > 0
        ? "已补清当前账号登录 Cookie。"
        : "当前未找到额外登录 Cookie。",
    clearedCount: clearedCount,
    scopeUrls: queries.map(function (query) {
      return query.url;
    }),
  };
}

async function resetAidpLoginState(url, dependencies) {
  const source = dependencies && typeof dependencies === "object" ? dependencies : {};
  let siteStorageResult = null;
  try {
    siteStorageResult = await clearAidpSiteStorage(source.browsingDataApi);
  } catch (error) {
    return {
      ok: false,
      reason: "clear-site-storage-failed",
      message:
        error && error.message ? error.message : "清理 AIDP 站点储存失败。",
      clearedCount: 0,
    };
  }
  if (!siteStorageResult || siteStorageResult.ok !== true) {
    return siteStorageResult || {
      ok: false,
      reason: "clear-site-storage-failed",
      message: "清理站点储存失败。",
      clearedCount: 0,
    };
  }
  let cookieResult = null;
  try {
    cookieResult = await clearCookiesForUrl(url, source.cookieApi);
  } catch (error) {
    return {
      ok: false,
      reason: "clear-cookie-failed",
      message:
        error && error.message ? error.message : "补清登录 Cookie 失败。",
      clearedCount: 0,
    };
  }
  if (!cookieResult || cookieResult.ok !== true) {
    return cookieResult || {
      ok: false,
      reason: "clear-cookie-failed",
      message: "补清登录 Cookie 失败。",
      clearedCount: 0,
    };
  }
  return {
    ok: true,
    message:
      cookieResult.clearedCount > 0
        ? "已重置 AIDP 登录态。"
        : "已清理站点储存，当前未找到额外登录 Cookie。",
    clearedCount: cookieResult.clearedCount,
    origins: AIDP_SITE_STORAGE_CLEAR_ORIGINS.slice(),
    scopeUrls: cookieResult.scopeUrls,
  };
}

chrome.runtime.onInstalled.addListener((details) => {
  void bootstrap("onInstalled:" + details.reason);
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrap("onStartup");
});

chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.info(LOG_PREFIX, "Extension update available.", details);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  if (
    message.type === AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE ||
    message.type === AIDP_COOKIE_CLEAR_MESSAGE_TYPE
  ) {
    resetAidpLoginState(message.url)
      .then(function (result) {
        sendResponse({ ok: true, result: result });
      })
      .catch(function (error) {
        sendResponse({
          ok: false,
          error: error && error.message ? error.message : String(error),
        });
      });
    return true;
  }

  if (message.type === AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE) {
    triggerAidpInternalQualityDebuggerClick(message, sender)
      .then(function (result) {
        sendResponse({ ok: result.ok === true, result: result });
      })
      .catch(function () {
        sendResponse({
          ok: false,
          result: { ok: false, reason: "debugger-click-failed" },
        });
      });
    return true;
  }

  if (message.type === SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE) {
    triggerShujiajiaTrustedInput(message, sender)
      .then(function (result) { sendResponse({ ok: result.ok === true, result: result }); })
      .catch(function () { sendResponse({ ok: false, result: { ok: false, reason: "trusted-input-failed" } }); });
    return true;
  }

  return undefined;
});

console.info(LOG_PREFIX, "Service worker loaded for", constants.EXTENSION_NAME);

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    __testOnly: {
      normalizeAidpCookieScopeUrl: normalizeAidpCookieScopeUrl,
      buildAidpCookieScopeQueries: buildAidpCookieScopeQueries,
      buildCookieRemovalDetails: buildCookieRemovalDetails,
      buildCookieRemovalIdentity: buildCookieRemovalIdentity,
      clearAidpSiteStorage: clearAidpSiteStorage,
      clearCookiesForUrl: clearCookiesForUrl,
      resetAidpLoginState: resetAidpLoginState,
      getAidpInternalQualityDebuggerClickTarget: getAidpInternalQualityDebuggerClickTarget,
      triggerAidpInternalQualityDebuggerClick: triggerAidpInternalQualityDebuggerClick,
      getShujiajiaTrustedInputTarget: getShujiajiaTrustedInputTarget,
      triggerShujiajiaTrustedInput: triggerShujiajiaTrustedInput,
      AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE: AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE,
      AIDP_COOKIE_CLEAR_MESSAGE_TYPE: AIDP_COOKIE_CLEAR_MESSAGE_TYPE,
      AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE:
        AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE,
      SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE: SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE,
      AIDP_SITE_STORAGE_CLEAR_ORIGINS: AIDP_SITE_STORAGE_CLEAR_ORIGINS,
      AIDP_SITE_STORAGE_REMOVE_OPTIONS: AIDP_SITE_STORAGE_REMOVE_OPTIONS,
    },
  };
}
