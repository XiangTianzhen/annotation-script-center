(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-api-client]";
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;

  async function getSettings() {
    if (runtimeGate && typeof runtimeGate.getSettings === "function") {
      return runtimeGate.getSettings();
    }

    return {
      platforms: {
        alibabaLabelx: {
          legacyServer: {
            apiBaseUrl: "http://47.108.254.138:3101",
            debugApiBaseUrl: "http://127.0.0.1:3101",
            useDebugApiBaseUrl: false,
          },
        },
      },
    };
  }

  async function getPlatformSettings() {
    const settings = await getSettings();
    return settings?.platforms?.alibabaLabelx || {};
  }

  async function getLegacyServerBaseUrl() {
    const platformSettings = await getPlatformSettings();
    const legacyServer = platformSettings.legacyServer || {};
    const baseUrl = legacyServer.useDebugApiBaseUrl
      ? legacyServer.debugApiBaseUrl
      : legacyServer.apiBaseUrl;

    return typeof baseUrl === "string" ? baseUrl.replace(/\/$/, "") : "";
  }

  function buildUrl(baseUrl, request) {
    if (typeof request?.url === "string" && request.url.length > 0) {
      return request.url;
    }

    const path = typeof request?.path === "string" ? request.path : "";
    if (!path) {
      return baseUrl;
    }

    return path.startsWith("http://") || path.startsWith("https://")
      ? path
      : baseUrl + (path.startsWith("/") ? path : "/" + path);
  }

  async function request(requestOptions) {
    const baseUrl = await getLegacyServerBaseUrl();
    const url = buildUrl(baseUrl, requestOptions || {});
    const response = await chrome.runtime.sendMessage({
      type: "ASR_EDGE_LEGACY_API_REQUEST",
      request: {
        url: url,
        method: requestOptions?.method || "GET",
        headers: requestOptions?.headers || {},
        body: requestOptions?.body,
      },
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Legacy API request failed.");
    }

    return response.result;
  }

  async function getJson(path) {
    const result = await request({ path: path, method: "GET" });
    return result.data;
  }

  async function postJson(path, body) {
    const result = await request({
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
    return result.data;
  }

  async function checkForUpdates() {
    const response = await chrome.runtime.sendMessage({
      type: "ASR_EDGE_VERSION_CHECK",
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Version check failed.");
    }

    return response.result;
  }

  window.__ASREdgeAlibabaLabelxLegacyApiClient = {
    getSettings: getSettings,
    getPlatformSettings: getPlatformSettings,
    getLegacyServerBaseUrl: getLegacyServerBaseUrl,
    request: request,
    getJson: getJson,
    postJson: postJson,
    checkForUpdates: checkForUpdates,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
