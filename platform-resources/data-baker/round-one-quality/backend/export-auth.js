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

function parseDateToMs(value) {
  const text = trimText(value);
  if (!text) {
    return 0;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseExpiryToMs(value, nowMs) {
  const baseNow = Number(nowMs) || Date.now();
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  if (typeof value === "string" && /[^0-9.\-]/.test(value)) {
    return parseDateToMs(value);
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
  const configuredUrl = trimText(config.loginUrl);
  if (configuredUrl) {
    return configuredUrl;
  }
  const baseUrl = trimText(config.baseUrl);
  if (!baseUrl) {
    return "";
  }
  try {
    return new URL(config.loginPath || "/cms/user/login", baseUrl).toString();
  } catch (error) {
    return "";
  }
}

function interpolateTemplate(template, username, password) {
  const raw = template && typeof template === "object" ? template : {};
  const result = {};
  Object.keys(raw).forEach(function (key) {
    const value = raw[key];
    if (typeof value === "string") {
      result[key] = value
        .replace(/\{\{username\}\}/g, username)
        .replace(/\{\{password\}\}/g, password);
      return;
    }
    result[key] = value;
  });
  return result;
}

function getExportAuthConfig() {
  return {
    baseUrl: trimText(process.env.DATABAKER_EXPORT_BASE_URL || "https://datafactory.data-baker.com"),
    username: trimText(process.env.DATABAKER_EXPORT_USERNAME),
    password: trimText(process.env.DATABAKER_EXPORT_PASSWORD),
    loginUrl: trimText(process.env.DATABAKER_EXPORT_LOGIN_URL),
    loginPath: trimText(process.env.DATABAKER_EXPORT_LOGIN_PATH || "/cms/user/login"),
    tokenRefreshMs: toPositiveInt(process.env.DATABAKER_EXPORT_TOKEN_REFRESH_MS, 3600000),
    tokenRefreshSkewMs: toPositiveInt(process.env.DATABAKER_EXPORT_TOKEN_REFRESH_SKEW_MS, 30000),
    loginMethod: trimText(process.env.DATABAKER_EXPORT_LOGIN_METHOD || "POST").toUpperCase(),
    usernameField: trimText(process.env.DATABAKER_EXPORT_LOGIN_USERNAME_FIELD || "username"),
    passwordField: trimText(process.env.DATABAKER_EXPORT_LOGIN_PASSWORD_FIELD || "password"),
    extraBody: parseJsonObject(process.env.DATABAKER_EXPORT_LOGIN_EXTRA_BODY_JSON),
    payloadTemplate: parseJsonObject(process.env.DATABAKER_EXPORT_LOGIN_PAYLOAD_TEMPLATE_JSON),
    accessTokenPath: trimText(process.env.DATABAKER_EXPORT_ACCESS_TOKEN_PATH || "data.access_token"),
    refreshTokenPath: trimText(process.env.DATABAKER_EXPORT_REFRESH_TOKEN_PATH || "data.refresh_token"),
    expiresAtPath: trimText(process.env.DATABAKER_EXPORT_EXPIRES_AT_PATH || "data.expires_at"),
    expiresInPath: trimText(process.env.DATABAKER_EXPORT_EXPIRES_IN_PATH || "data.expires_in"),
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
  const resolvedLoginUrl = resolveLoginUrl(activeConfig);
  if (!resolvedLoginUrl) {
    missing.push("DATABAKER_EXPORT_LOGIN_URL or DATABAKER_EXPORT_BASE_URL");
  }
  return missing;
}

function buildLoginPayload(config) {
  if (config.payloadTemplate && Object.keys(config.payloadTemplate).length > 0) {
    return interpolateTemplate(config.payloadTemplate, config.username, config.password);
  }

  const payload = Object.assign({}, config.extraBody);
  payload[config.usernameField || "username"] = config.username;
  payload[config.passwordField || "password"] = config.password;
  return payload;
}

function createAuthManager() {
  const cache = {
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    lastLoginAt: 0,
  };
  let loginPromise = null;

  async function login() {
    const config = getExportAuthConfig();
    const loginUrl = resolveLoginUrl(config);
    const missing = getMissingRequiredConfig(config);
    if (missing.length > 0) {
      const error = new Error("导出登录配置缺失：" + missing.join(", "));
      error.code = "missing-export-auth-config";
      error.statusCode = 400;
      throw error;
    }

    const response = await fetch(loginUrl, {
      method: config.loginMethod || "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildLoginPayload(config)),
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
      const error = new Error(
        "DataBaker 登录返回中未找到 access_token，请检查 token 字段路径配置。"
      );
      error.code = "missing-access-token";
      throw error;
    }

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
      "expireTime",
      "expiresAt",
      "expires_in",
      "expiresIn",
      "expire",
      "ttl",
    ]);
    const resolvedExpiresAt = parseExpiryToMs(expiresCandidate, cache.lastLoginAt);
    cache.expiresAt = resolvedExpiresAt > cache.lastLoginAt ? resolvedExpiresAt : cache.lastLoginAt + config.tokenRefreshMs;
    console.info("[DataBaker][export] login success", {
      expiresAt: new Date(cache.expiresAt).toISOString(),
      loginUrl: loginUrl,
    });
    return cache.accessToken;
  }

  async function ensureAccessToken(options) {
    const config = getExportAuthConfig();
    const now = Date.now();
    const shouldForce = options?.forceRefresh === true;
    const shouldRefresh =
      shouldForce ||
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

  function getSnapshot() {
    const config = getExportAuthConfig();
    return {
      hasAccessToken: Boolean(cache.accessToken),
      hasRefreshToken: Boolean(cache.refreshToken),
      expiresAt: cache.expiresAt || 0,
      lastLoginAt: cache.lastLoginAt || 0,
      tokenRefreshMs: config.tokenRefreshMs,
      tokenRefreshSkewMs: config.tokenRefreshSkewMs,
      loginUrlConfigured: Boolean(resolveLoginUrl(config)),
    };
  }

  return {
    ensureAccessToken,
    getSnapshot,
    invalidateTokens,
  };
}

module.exports = {
  createAuthManager,
  getExportAuthConfig,
  getMissingRequiredConfig,
};
