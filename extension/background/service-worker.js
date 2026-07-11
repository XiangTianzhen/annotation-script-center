const sharedConstantsUrl = chrome.runtime.getURL("shared/constants.js");
const sharedStorageUrl = chrome.runtime.getURL("shared/storage.js");
importScripts(sharedConstantsUrl, sharedStorageUrl);

const constants = globalThis.ASREdgeConstants;
const storage = globalThis.ASREdgeStorage;
const LOG_PREFIX = "[ASR Edge][background]";
const AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE = "ASR_EDGE_RESET_AIDP_LOGIN_STATE";
const AIDP_COOKIE_CLEAR_MESSAGE_TYPE = "ASR_EDGE_CLEAR_AIDP_COOKIES";
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
      AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE: AIDP_LOGIN_STATE_RESET_MESSAGE_TYPE,
      AIDP_COOKIE_CLEAR_MESSAGE_TYPE: AIDP_COOKIE_CLEAR_MESSAGE_TYPE,
      AIDP_SITE_STORAGE_CLEAR_ORIGINS: AIDP_SITE_STORAGE_CLEAR_ORIGINS,
      AIDP_SITE_STORAGE_REMOVE_OPTIONS: AIDP_SITE_STORAGE_REMOVE_OPTIONS,
    },
  };
}
