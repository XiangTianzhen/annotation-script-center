"use strict";

const { sanitizeProviderErrorSummary } = require("./sanitizer");

function createError(message, code, statusCode) {
  const error = new Error(message);
  error.code = code || "";
  error.statusCode = statusCode;
  return error;
}

function createProviderHttpError(statusCode, summary, message) {
  const error = createError(
    message || "上游模型请求失败（HTTP " + String(statusCode || 500) + "）。",
    "provider-http-error",
    Number(statusCode) || 500
  );
  error.summary = sanitizeProviderErrorSummary(summary || "");
  return error;
}

function createRateLimitError(summary) {
  const error = createError("上游模型限流，后端已重试仍失败，请稍后重试。", "provider-rate-limited", 429);
  error.providerStatus = 429;
  error.summary = sanitizeProviderErrorSummary(summary || "");
  return error;
}

function createTimeoutError(message) {
  return createError(message || "上游模型请求超时。", "timeout", 504);
}

function createPythonRuntimeError(message, code, statusCode, summary) {
  const error = createError(message, code || "python-runtime-error", statusCode || 502);
  if (summary) {
    error.summary = sanitizeProviderErrorSummary(summary);
  }
  return error;
}

function createAudioUrlUnavailableError(message, statusCode, rawStatus) {
  const error = createError(
    message || "Fun-ASR 无法访问当前音频链接，请确认平台 audioUrl 对模型服务可访问。",
    "fun-asr-audio-url-unreachable",
    statusCode || 403
  );
  error.providerStatus = statusCode || 403;
  if (rawStatus) {
    error.rawStatus = String(rawStatus);
  }
  return error;
}

function isProviderRateLimitedError(error) {
  if (!error) {
    return false;
  }
  return (
    error.code === "provider-rate-limited" ||
    (error.code === "provider-http-error" && Number(error.statusCode) === 429)
  );
}

function isAudioUrlLikelyUnavailable(text) {
  const lowered = String(text || "").toLowerCase();
  return (
    lowered.indexOf("url") >= 0 &&
    ["access", "download", "forbidden", "denied", "signature", "oss", "403", "404"].some(function (keyword) {
      return lowered.indexOf(keyword) >= 0;
    })
  );
}

module.exports = {
  createAudioUrlUnavailableError,
  createProviderHttpError,
  createPythonRuntimeError,
  createRateLimitError,
  createTimeoutError,
  isAudioUrlLikelyUnavailable,
  isProviderRateLimitedError,
};
