"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");
const JSONL_FILE_NAME = "review-current-calls.jsonl";

function getLogDir() {
  const customDir = String(process.env.MAGIC_DATA_AI_CALL_LOG_DIR || "").trim();
  return customDir || DEFAULT_LOG_DIR;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeString(value) {
  return String(value || "").trim();
}

function safeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
}

function textHash(value) {
  const text = safeString(value);
  if (!text) {
    return "";
  }
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function sanitizeErrorMessage(message) {
  return String(message || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, function (urlText) {
      try {
        const parsedUrl = new URL(urlText);
        return parsedUrl.protocol + "//" + parsedUrl.host + "/[redacted]";
      } catch (error) {
        return "[url-redacted]";
      }
    })
    .replace(/(ossaccesskeyid["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(signature["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(token["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(authorization["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(cookie["'\s:=]+)([^\n\r]+)/gi, "$1[redacted]")
    .replace(/(api[_-]?key["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function sanitizeForLog(record) {
  const source = record && typeof record === "object" ? record : {};
  const request = source.request && typeof source.request === "object" ? source.request : {};
  const response = source.response && typeof source.response === "object" ? source.response : {};
  const listen = response.listen && typeof response.listen === "object" ? response.listen : {};
  const comparison = response.comparison && typeof response.comparison === "object" ? response.comparison : {};
  const timing = response.timing && typeof response.timing === "object" ? response.timing : {};

  return {
    createdAt: safeString(source.createdAt || new Date().toISOString()),
    requestId: safeString(source.requestId),
    success: source.success === true,
    durationMs: safeNumber(source.durationMs || timing.totalDurationMs),
    listenDurationMs: safeNumber(source.listenDurationMs || timing.listenDurationMs),
    compareDurationMs: safeNumber(source.compareDurationMs || timing.compareDurationMs),
    taskItemId: safeString(request.taskItemId),
    samplingRecordId: safeString(request.samplingRecordId),
    projectName: safeString(request.projectName),
    audioHostname: safeString(source.audioHostname || parseAudioHostname(request.audioUrl)),
    effectiveTime: request.effectiveTime === null ? null : safeNumber(request.effectiveTime),
    estimatedIncome: safeNumber(response.estimatedIncome),
    listenModel: safeString(source.listenModel || response?.models?.listenModel),
    compareModel: safeString(source.compareModel || response?.models?.compareModel),
    mock: source.mock === true,
    verdict: safeString(response.verdict),
    errorCode: safeString(source.errorCode),
    errorMessage: sanitizeErrorMessage(source.errorMessage),
    textStats: {
      platformDialectLength: safeString(request.platformDialectText).length,
      platformDialectHash: textHash(request.platformDialectText),
      platformMandarinLength: safeString(request.platformMandarinText).length,
      platformMandarinHash: textHash(request.platformMandarinText),
      heardDialectLength: safeString(listen.heardDialectText).length,
      heardDialectHash: textHash(listen.heardDialectText),
      dialectIssueCount: Array.isArray(comparison?.dialectLine?.issues)
        ? comparison.dialectLine.issues.length
        : 0,
      mandarinIssueCount: Array.isArray(comparison?.mandarinLine?.issues)
        ? comparison.mandarinLine.issues.length
        : 0,
    },
  };
}

function appendAiCallLog(record) {
  const logDir = getLogDir();
  ensureDir(logDir);
  const sanitized = sanitizeForLog(record);
  const logPath = path.join(logDir, JSONL_FILE_NAME);
  fs.appendFileSync(logPath, JSON.stringify(sanitized) + "\n", "utf8");
  return sanitized;
}

module.exports = {
  DEFAULT_LOG_DIR,
  JSONL_FILE_NAME,
  appendAiCallLog,
  getLogDir,
  sanitizeForLog,
};
