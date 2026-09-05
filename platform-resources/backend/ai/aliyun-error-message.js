"use strict";

const { sanitizeProviderErrorSummary } = require("./sanitizer");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseResponseBody(value) {
  if (value && typeof value === "object") return value;
  const text = normalizeText(value);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function extractProviderFields(input) {
  const source = input && typeof input === "object" ? input : {};
  const parsed = parseResponseBody(source.responseBody);
  const errorBody = parsed?.error && typeof parsed.error === "object" ? parsed.error : parsed;
  const providerCode = normalizeText(
    source.providerCode || errorBody?.code || errorBody?.error_code || errorBody?.type
  );
  let providerMessage = normalizeText(
    source.providerMessage || errorBody?.message || errorBody?.error_message
  );
  if (!providerMessage && typeof source.responseBody === "string" && !parsed) {
    providerMessage = normalizeText(source.responseBody);
  }
  if (!providerMessage) providerMessage = normalizeText(source.summary);
  return {
    providerCode,
    providerMessage: sanitizeProviderErrorSummary(providerMessage),
  };
}

function resolveKnownMessage(providerStatus, providerCode, providerMessage) {
  const code = normalizeText(providerCode).toLowerCase();
  const message = normalizeText(providerMessage).toLowerCase();
  if (message.includes("access denied") && message.includes("account is in good standing")) {
    return "API Key 所属的阿里云账号存在欠费，导致访问被拒绝。";
  }
  if (
    Number(providerStatus) === 401 ||
    code.includes("invalidapikey") || code === "invalid_api_key" ||
    message.includes("invalid api key") || message.includes("invalid api-key") ||
    message.includes("no api-key provided") || message.includes("incorrect api key")
  ) {
    return "当前服务器配置的 DashScope API Key 无效或未正确配置。";
  }
  if (code === "accessdenied.unpurchased") {
    return "当前阿里云账号尚未开通百炼服务，或目标模型尚未获得使用资格。";
  }
  if (code === "model.accessdenied") {
    return "当前 API Key 所属业务空间没有目标模型的调用权限。";
  }
  if (
    message.includes("not authorized to access this workspace") ||
    (message.includes("workspace") && (
      message.includes("does not exist") ||
      message.includes("access denied") ||
      message.includes("permission denied")
    ))
  ) {
    return "当前 API Key 无权访问目标工作空间，或工作空间、地域、接口地址配置不匹配。";
  }
  if (
    code === "model_not_found" || code === "modelnotexist" ||
    message.includes("model not exist") || message.includes("model not found")
  ) {
    return "当前配置的模型不存在，或在所选地域不可用。";
  }
  if (
    Number(providerStatus) === 429 ||
    ["throttling", "rate_limit", "limit_requests", "limit_burst_rate", "toomanyrequests"].includes(code)
  ) {
    return "阿里云百炼接口触发限流，请稍后重试。";
  }
  if (code.includes("invalid_parameter") || code === "invalidparameter" || message.includes("invalid parameter")) {
    return "发送给阿里云百炼的请求参数不符合目标模型要求。";
  }
  return "";
}

function resolveAliyunProviderError(input) {
  const source = input && typeof input === "object" ? input : {};
  const fields = extractProviderFields(source);
  const knownMessage = resolveKnownMessage(source.providerStatus, fields.providerCode, fields.providerMessage);
  return {
    providerStatus: Number(source.providerStatus) || 0,
    providerCode: fields.providerCode,
    providerMessage: fields.providerMessage,
    displayMessage: knownMessage || fields.providerMessage ||
      sanitizeProviderErrorSummary(source.fallbackMessage || "阿里云百炼接口请求失败。"),
    translated: Boolean(knownMessage),
  };
}

module.exports = { resolveAliyunProviderError };
