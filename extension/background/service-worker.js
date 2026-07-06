const sharedBuildMetaUrl = chrome.runtime.getURL("shared/build-meta.js");
const sharedBuildMetaLocalUrl = chrome.runtime.getURL("shared/build-meta.local.js");
const sharedConstantsUrl = chrome.runtime.getURL("shared/constants.js");
const sharedStorageUrl = chrome.runtime.getURL("shared/storage.js");
importScripts(sharedBuildMetaUrl);
try {
  importScripts(sharedBuildMetaLocalUrl);
} catch (_error) {
  // Local override is optional for unpacked development builds only.
}
importScripts(sharedConstantsUrl, sharedStorageUrl);

const constants = globalThis.ASREdgeConstants;
const storage = globalThis.ASREdgeStorage;
const LOG_PREFIX = "[ASR Edge][background]";
const AIDP_COOKIE_CLEAR_MESSAGE_TYPE = "ASR_EDGE_CLEAR_AIDP_COOKIES";
const AIDP_ACCOUNT_SWITCH_SCOPE_URLS = Object.freeze([
  "https://aidp.bytedance.com/",
  "https://mpsso.jiyunhudong.com/",
  "https://accounts.feishu.cn/",
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
    alibabaLabelxEnabled: nextSettings.platforms.alibabaLabelx.enabled,
  });
}

function isJsonResponse(contentType) {
  return typeof contentType === "string" && contentType.includes("application/json");
}

async function getPlatformSettings() {
  const settings = await storage.getSettings();
  return settings?.platforms?.alibabaLabelx || {};
}

async function performLegacyApiRequest(request) {
  const method = typeof request?.method === "string" ? request.method.toUpperCase() : "GET";
  const headers = request?.headers && typeof request.headers === "object" ? request.headers : {};
  const platformSettings = await getPlatformSettings();
  const timeoutMs = Math.max(
    1000,
    Number.parseInt(platformSettings?.legacyServer?.requestTimeoutMs, 10) || 20000
  );
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(function () {
        controller.abort();
      }, timeoutMs)
    : null;
  const init = {
    method: method,
    headers: headers,
    cache: "no-store",
    signal: controller ? controller.signal : undefined,
  };

  if (request?.body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body =
      typeof request.body === "string" ? request.body : JSON.stringify(request.body);
  }

  try {
    const response = await fetch(request.url, init);
    const contentType = response.headers.get("content-type") || "";
    const payload = isJsonResponse(contentType) ? await response.json() : await response.text();

    return {
      ok: response.ok,
      status: response.status,
      contentType: contentType,
      data: payload,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function resolveVersionManifestUrl() {
  const platformSettings = await getPlatformSettings();
  const serverSettings = platformSettings.legacyServer || {};
  const configuredUrl =
    typeof serverSettings.updateManifestUrl === "string"
      ? serverSettings.updateManifestUrl.trim()
      : "";

  return configuredUrl;
}

async function performVersionCheck() {
  let runtimeCheck = null;

  try {
    runtimeCheck = await chrome.runtime.requestUpdateCheck();
  } catch (error) {
    runtimeCheck = {
      status: "error",
      message: error && error.message ? error.message : String(error),
    };
  }

  let remoteManifest = null;
  let remoteManifestError = null;
  const versionManifestUrl = await resolveVersionManifestUrl();

  if (versionManifestUrl) {
    try {
      const manifestResponse = await fetch(versionManifestUrl, { cache: "no-store" });
      if (manifestResponse.ok) {
        remoteManifest = await manifestResponse.json();
      } else {
        remoteManifestError = "HTTP " + manifestResponse.status;
      }
    } catch (error) {
      remoteManifestError = error && error.message ? error.message : String(error);
    }
  }

  return {
    currentVersion: chrome.runtime.getManifest().version,
    runtimeCheck: runtimeCheck,
    remoteManifestUrl: versionManifestUrl || null,
    remoteManifest: remoteManifest,
    remoteManifestError: remoteManifestError,
  };
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

async function clearCookiesForUrl(url, cookieApi) {
  const queries = buildAidpCookieScopeQueries(url);
  if (queries.length <= 0) {
    return {
      ok: false,
      reason: "invalid-aidp-url",
      message: "仅支持从 ByteDance AIDP 列表页发起切换账号 Cookie 清理。",
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
        ? "已清除当前账号登录 Cookie。"
        : "当前未找到可清除的登录 Cookie。",
    clearedCount: clearedCount,
    scopeUrls: queries.map(function (query) {
      return query.url;
    }),
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

  if (message.type === "ASR_EDGE_LEGACY_API_REQUEST") {
    performLegacyApiRequest(message.request)
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

  if (message.type === "ASR_EDGE_VERSION_CHECK") {
    performVersionCheck()
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

  if (message.type === AIDP_COOKIE_CLEAR_MESSAGE_TYPE) {
    clearCookiesForUrl(message.url)
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
      clearCookiesForUrl: clearCookiesForUrl,
      AIDP_COOKIE_CLEAR_MESSAGE_TYPE: AIDP_COOKIE_CLEAR_MESSAGE_TYPE,
    },
  };
}
