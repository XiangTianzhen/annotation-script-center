"use strict";

function toPositiveInt(value, fallbackValue) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }
  return Math.floor(numericValue);
}

function trimText(value) {
  return String(value || "").trim();
}

function parseJsonObject(value) {
  const text = trimText(value);
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function readPathValue(source, dottedPath) {
  const pathText = trimText(dottedPath);
  if (!pathText) {
    return undefined;
  }
  return pathText.split(".").reduce(function (current, key) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return current[key];
  }, source);
}

function getFirstNonEmptyPathValue(source, pathList) {
  const list = Array.isArray(pathList) ? pathList : [];
  for (let index = 0; index < list.length; index += 1) {
    const value = readPathValue(source, list[index]);
    if (value !== undefined && value !== null && String(value) !== "") {
      return value;
    }
  }
  return undefined;
}

function resolveLoginUrl(config) {
  const explicitUrl = trimText(config.loginUrl);
  if (explicitUrl) {
    return explicitUrl;
  }
  const baseUrl = trimText(config.baseUrl);
  if (!baseUrl) {
    return "";
  }
  try {
    return new URL(config.loginPath || "/cms/authentication/form", baseUrl).toString();
  } catch (error) {
    return "";
  }
}

function interpolateTemplateValue(value, username, password) {
  if (typeof value !== "string") {
    return value;
  }
  return value
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{password\}\}/g, password);
}

function interpolateTemplateObject(template, username, password) {
  const raw = template && typeof template === "object" ? template : {};
  const result = {};
  Object.keys(raw).forEach(function (key) {
    result[key] = interpolateTemplateValue(raw[key], username, password);
  });
  return result;
}

function parseSetCookie(headers) {
  const list = [];
  if (!headers || typeof headers.forEach !== "function") {
    return list;
  }
  headers.forEach(function (value, name) {
    if (String(name || "").toLowerCase() === "set-cookie" && value) {
      list.push(String(value));
    }
  });
  return list;
}

function extractCookiePair(cookieLine) {
  const firstPart = String(cookieLine || "").split(";")[0];
  const equalIndex = firstPart.indexOf("=");
  if (equalIndex <= 0) {
    return null;
  }
  const key = firstPart.slice(0, equalIndex).trim();
  const value = firstPart.slice(equalIndex + 1).trim();
  if (!key || !value) {
    return null;
  }
  return key + "=" + value;
}

function mergeCookieHeader(currentCookieHeader, newCookiePairs) {
  const map = {};
  String(currentCookieHeader || "")
    .split(";")
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean)
    .forEach(function (pair) {
      const index = pair.indexOf("=");
      if (index <= 0) {
        return;
      }
      map[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
    });

  (Array.isArray(newCookiePairs) ? newCookiePairs : []).forEach(function (pair) {
    const index = pair.indexOf("=");
    if (index <= 0) {
      return;
    }
    map[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
  });

  return Object.keys(map)
    .map(function (key) {
      return key + "=" + map[key];
    })
    .join("; ");
}

function parseExpiryToMs(value, nowMs) {
  const baseNow = Number(nowMs) || Date.now();
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  if (typeof value === "string" && /[^0-9.\-]/.test(value)) {
    const dateMs = Date.parse(value);
    return Number.isFinite(dateMs) ? dateMs : 0;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }
  if (numericValue >= 1e12) {
    return Math.floor(numericValue);
  }
  if (numericValue >= 1e9) {
    return Math.floor(numericValue * 1000);
  }
  return Math.floor(baseNow + numericValue * 1000);
}

function getExportAuthConfig() {
  return {
    baseUrl: trimText(process.env.DATABAKER_EXPORT_BASE_URL || "https://datafactory.data-baker.com"),
    username: trimText(process.env.DATABAKER_EXPORT_USERNAME),
    password: trimText(process.env.DATABAKER_EXPORT_PASSWORD),
    loginUrl: trimText(process.env.DATABAKER_EXPORT_LOGIN_URL),
    loginPath: trimText(process.env.DATABAKER_EXPORT_LOGIN_PATH || "/cms/authentication/form"),
    loginMethod: trimText(process.env.DATABAKER_EXPORT_LOGIN_METHOD || "POST").toUpperCase(),
    loginCredentialInQuery:
      trimText(process.env.DATABAKER_EXPORT_LOGIN_CREDENTIAL_IN_QUERY || "1") !== "0",
    usernameField: trimText(process.env.DATABAKER_EXPORT_LOGIN_USERNAME_FIELD || "username"),
    passwordField: trimText(process.env.DATABAKER_EXPORT_LOGIN_PASSWORD_FIELD || "password"),
    queryTemplate: parseJsonObject(process.env.DATABAKER_EXPORT_LOGIN_QUERY_TEMPLATE_JSON),
    extraBody: parseJsonObject(process.env.DATABAKER_EXPORT_LOGIN_EXTRA_BODY_JSON),
    payloadTemplate: parseJsonObject(process.env.DATABAKER_EXPORT_LOGIN_PAYLOAD_TEMPLATE_JSON),
    language: trimText(process.env.DATABAKER_EXPORT_LANGUAGE || "zh"),
    tokenRefreshMs: toPositiveInt(process.env.DATABAKER_EXPORT_TOKEN_REFRESH_MS, 3600000),
    tokenRefreshSkewMs: toPositiveInt(process.env.DATABAKER_EXPORT_TOKEN_REFRESH_SKEW_MS, 30000),
    accessTokenPath: trimText(process.env.DATABAKER_EXPORT_ACCESS_TOKEN_PATH || "data.access_token"),
    refreshTokenPath: trimText(process.env.DATABAKER_EXPORT_REFRESH_TOKEN_PATH || "data.refresh_token"),
    expiresAtPath: trimText(process.env.DATABAKER_EXPORT_EXPIRES_AT_PATH || "data.expires_at"),
    expiresInPath: trimText(process.env.DATABAKER_EXPORT_EXPIRES_IN_PATH || "data.expires_in"),
    ticketField: trimText(process.env.DATABAKER_EXPORT_LOGIN_TICKET_FIELD || "ticket"),
    nounceField: trimText(process.env.DATABAKER_EXPORT_LOGIN_NOUNCE_FIELD || "nounce"),
    ticket: trimText(process.env.DATABAKER_EXPORT_LOGIN_TICKET || ""),
    nounce: trimText(process.env.DATABAKER_EXPORT_LOGIN_NOUNCE || ""),
  };
}

function getMissingRequiredConfig(config) {
  const activeConfig = config || getExportAuthConfig();
  const missing = [];
  if (!activeConfig.username) {
    missing.push("DATABAKER_EXPORT_USERNAME");
  }
  if (!activeConfig.password) {
    missing.push("DATABAKER_EXPORT_PASSWORD");
  }
  if (!resolveLoginUrl(activeConfig)) {
    missing.push("DATABAKER_EXPORT_LOGIN_URL");
  }
  if (!activeConfig.ticket) {
    missing.push("DATABAKER_EXPORT_LOGIN_TICKET");
  }
  if (!activeConfig.nounce) {
    missing.push("DATABAKER_EXPORT_LOGIN_NOUNCE");
  }
  return missing;
}

function createLoginRequest(config) {
  const loginUrl = new URL(resolveLoginUrl(config));
  const queryTemplate = interpolateTemplateObject(
    config.queryTemplate,
    config.username,
    config.password
  );
  Object.keys(queryTemplate).forEach(function (key) {
    loginUrl.searchParams.set(key, String(queryTemplate[key]));
  });

  if (config.loginCredentialInQuery) {
    loginUrl.searchParams.set(config.usernameField || "username", config.username);
    loginUrl.searchParams.set(config.passwordField || "password", config.password);
  }

  if (config.ticketField && config.ticket) {
    loginUrl.searchParams.set(config.ticketField, config.ticket);
  }
  if (config.nounceField && config.nounce) {
    loginUrl.searchParams.set(config.nounceField, config.nounce);
  }

  let bodyText = "";
  if (!config.loginCredentialInQuery) {
    if (config.payloadTemplate && Object.keys(config.payloadTemplate).length > 0) {
      bodyText = JSON.stringify(
        interpolateTemplateObject(config.payloadTemplate, config.username, config.password)
      );
    } else {
      const payload = Object.assign({}, config.extraBody);
      payload[config.usernameField || "username"] = config.username;
      payload[config.passwordField || "password"] = config.password;
      bodyText = JSON.stringify(payload);
    }
  }

  return {
    url: loginUrl.toString(),
    method: config.loginMethod || "POST",
    bodyText,
  };
}

function createAuthManager() {
  const cache = {
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    lastLoginAt: 0,
    cookieHeader: "",
  };
  let loginPromise = null;

  async function login() {
    const config = getExportAuthConfig();
    const missing = getMissingRequiredConfig(config);
    if (missing.length > 0) {
      const error = new Error("导出登录配置缺失：" + missing.join(", "));
      error.code = "missing-export-auth-config";
      error.statusCode = 400;
      throw error;
    }

    const loginRequest = createLoginRequest(config);
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9",
      Origin: config.baseUrl,
      Referer: config.baseUrl + "/v2/",
      language: config.language || "zh",
      Cookie: cache.cookieHeader || "",
    };

    if (loginRequest.bodyText) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(loginRequest.bodyText, "utf8").toString();
    } else {
      headers["Content-Length"] = "0";
    }

    const response = await fetch(loginRequest.url, {
      method: loginRequest.method,
      headers: headers,
      body: loginRequest.bodyText || undefined,
    });

    if (!response.ok) {
      const error = new Error("DataBaker 登录失败（HTTP " + String(response.status) + "）。");
      error.code = "export-login-http-error";
      error.statusCode = response.status;
      throw error;
    }

    const responseBody = await response.json().catch(function () {
      return {};
    });
    const loginCode = Number(responseBody?.code);
    const loginSuccess = responseBody?.success === true || loginCode === 0;
    if (!loginSuccess) {
      const message = trimText(responseBody?.message || responseBody?.msg || "DataBaker 登录失败。");
      const error = new Error(message || "DataBaker 登录失败。");
      error.code = "export-login-business-error";
      error.statusCode = 401;
      throw error;
    }

    const accessToken = trimText(
      getFirstNonEmptyPathValue(responseBody, [
        config.accessTokenPath,
        "data.accessToken",
        "data.token",
        "access_token",
        "accessToken",
        "token",
      ])
    );
    const refreshToken = trimText(
      getFirstNonEmptyPathValue(responseBody, [
        config.refreshTokenPath,
        "data.refreshToken",
        "refresh_token",
        "refreshToken",
      ])
    );
    if (!accessToken) {
      const error = new Error("DataBaker 登录响应未返回 access_token。");
      error.code = "missing-access-token";
      error.statusCode = 502;
      throw error;
    }

    const setCookiePairs = parseSetCookie(response.headers)
      .map(extractCookiePair)
      .filter(Boolean);
    cache.cookieHeader = mergeCookieHeader(cache.cookieHeader, setCookiePairs);
    cache.cookieHeader = mergeCookieHeader(cache.cookieHeader, [
      "access_token=" + accessToken,
      refreshToken ? "refresh_token=" + refreshToken : "",
    ]);

    cache.accessToken = accessToken;
    cache.refreshToken = refreshToken;
    cache.lastLoginAt = Date.now();
    const expiresCandidate = getFirstNonEmptyPathValue(responseBody, [
      config.expiresAtPath,
      config.expiresInPath,
      "data.expireTime",
      "data.expiresAt",
      "data.expire_at",
      "data.expires_in",
      "expiresAt",
      "expires_in",
      "ttl",
    ]);
    const parsedExpireMs = parseExpiryToMs(expiresCandidate, cache.lastLoginAt);
    cache.expiresAt =
      parsedExpireMs > cache.lastLoginAt ? parsedExpireMs : cache.lastLoginAt + config.tokenRefreshMs;

    console.info("[DataBaker][export] login success", {
      expiresAt: new Date(cache.expiresAt).toISOString(),
      hasCookie: Boolean(cache.cookieHeader),
    });
    return cache.accessToken;
  }

  async function ensureAccessToken(options) {
    const config = getExportAuthConfig();
    const now = Date.now();
    const forceRefresh = options?.forceRefresh === true;
    const shouldRefresh =
      forceRefresh ||
      !cache.accessToken ||
      now + config.tokenRefreshSkewMs >= Number(cache.expiresAt || 0);
    if (!shouldRefresh) {
      return cache.accessToken;
    }

    if (!loginPromise) {
      loginPromise = login().finally(function () {
        loginPromise = null;
      });
    }
    return loginPromise;
  }

  function invalidateTokens() {
    cache.accessToken = "";
    cache.refreshToken = "";
    cache.expiresAt = 0;
    cache.lastLoginAt = 0;
  }

  function getCookieHeader() {
    return cache.cookieHeader;
  }

  function getSnapshot() {
    const config = getExportAuthConfig();
    return {
      hasAccessToken: Boolean(cache.accessToken),
      hasRefreshToken: Boolean(cache.refreshToken),
      hasCookieHeader: Boolean(cache.cookieHeader),
      expiresAt: cache.expiresAt || 0,
      lastLoginAt: cache.lastLoginAt || 0,
      tokenRefreshMs: config.tokenRefreshMs,
      tokenRefreshSkewMs: config.tokenRefreshSkewMs,
      loginUrlConfigured: Boolean(resolveLoginUrl(config)),
      language: config.language || "zh",
    };
  }

  return {
    ensureAccessToken,
    getCookieHeader,
    getSnapshot,
    invalidateTokens,
  };
}

module.exports = {
  createAuthManager,
  getExportAuthConfig,
  getMissingRequiredConfig,
};
