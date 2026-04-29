"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");
const JSONL_FILE_NAME = "recommend-calls.jsonl";
const CSV_FILE_NAME = "recommend-calls.csv";

const CSV_COLUMNS = [
  "createdAt",
  "requestId",
  "success",
  "durationMs",
  "annotatorName",
  "collectId",
  "itemId",
  "textId",
  "sentenceNumber",
  "readRequire",
  "audioHostname",
  "pageText",
  "heardText",
  "recommendedText",
  "isChanged",
  "needHumanReview",
  "decision",
  "listenConfidence",
  "compareConfidence",
  "listenModel",
  "compareModel",
  "listenPromptTokens",
  "listenCompletionTokens",
  "listenTotalTokens",
  "comparePromptTokens",
  "compareCompletionTokens",
  "compareTotalTokens",
  "totalTokens",
  "estimatedCostCny",
  "effectiveRevenueCny",
  "grossProfitCny",
  "effectiveStartTime",
  "effectiveEndTime",
  "effectiveTime",
  "audioDuration",
  "clientVersion",
  "mock",
  "errorCode",
  "errorMessage",
];

function getLogDir() {
  const customDir = String(process.env.DATABAKER_AI_CALL_LOG_DIR || "").trim();
  return customDir || DEFAULT_LOG_DIR;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeString(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function safeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function safeBoolean(value) {
  return value === true;
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
}

function getUsageValue(usage, key) {
  const source = usage && typeof usage === "object" ? usage : {};
  return safeNumber(source[key]);
}

function sanitizeForLog(record) {
  const source = record && typeof record === "object" ? record : {};
  const request = source.request && typeof source.request === "object" ? source.request : {};
  const response = source.response && typeof source.response === "object" ? source.response : {};
  const usage = response.usage && typeof response.usage === "object" ? response.usage : {};
  const listenUsage = usage.listen && typeof usage.listen === "object" ? usage.listen : {};
  const compareUsage = usage.compare && typeof usage.compare === "object" ? usage.compare : {};
  const cost = response.cost && typeof response.cost === "object" ? response.cost : {};
  const model = response.model && typeof response.model === "object" ? response.model : {};

  return {
    createdAt: safeString(source.createdAt || new Date().toISOString()),
    requestId: safeString(source.requestId),
    success: safeBoolean(source.success),
    durationMs: safeNumber(source.durationMs),
    annotatorName: safeString(request.annotatorName),
    collectId: safeString(request.collectId),
    itemId: safeString(request.itemId),
    textId: safeString(request.textId),
    sentenceNumber: request.sentenceNumber === null ? "" : safeString(request.sentenceNumber),
    readRequire: safeString(request.readRequire),
    audioHostname: safeString(source.audioHostname || parseAudioHostname(request.audioUrl)),
    pageText: safeString(response.pageText || request.pageText),
    heardText: safeString(response.heardText),
    recommendedText: safeString(response.recommendedText),
    isChanged: response.isChanged === true,
    needHumanReview: response.needHumanReview === true,
    decision: safeString(response.decision),
    listenConfidence: safeNumber(response.listenConfidence),
    compareConfidence: safeNumber(response.compareConfidence),
    listenModel: safeString(model.listen || source.listenModel),
    compareModel: safeString(model.compare || source.compareModel),
    listenPromptTokens: getUsageValue(listenUsage, "promptTokens"),
    listenCompletionTokens: getUsageValue(listenUsage, "completionTokens"),
    listenTotalTokens: getUsageValue(listenUsage, "totalTokens"),
    comparePromptTokens: getUsageValue(compareUsage, "promptTokens"),
    compareCompletionTokens: getUsageValue(compareUsage, "completionTokens"),
    compareTotalTokens: getUsageValue(compareUsage, "totalTokens"),
    totalTokens: safeNumber(usage.totalTokens),
    estimatedCostCny: safeNumber(cost.estimatedCostCny),
    effectiveRevenueCny: safeNumber(cost.effectiveRevenueCny),
    grossProfitCny: safeNumber(cost.grossProfitCny),
    effectiveStartTime: request.effectiveStartTime === null ? "" : safeString(request.effectiveStartTime),
    effectiveEndTime: request.effectiveEndTime === null ? "" : safeString(request.effectiveEndTime),
    effectiveTime: request.effectiveTime === null ? "" : safeString(request.effectiveTime),
    audioDuration: request.audioDuration === null ? "" : safeString(request.audioDuration),
    clientVersion: safeString(request.clientVersion),
    mock: source.mock === true,
    errorCode: safeString(source.errorCode),
    errorMessage: safeString(source.errorMessage),
  };
}

function escapeCsvCell(value) {
  const text = safeString(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsvLine(record) {
  return CSV_COLUMNS.map(function (column) {
    return escapeCsvCell(record[column]);
  }).join(",") + "\n";
}

function appendJsonl(filePath, record) {
  fs.appendFileSync(filePath, JSON.stringify(record, null, 0) + "\n", "utf8");
}

function appendCsv(filePath, record) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, CSV_COLUMNS.join(",") + "\n", "utf8");
  }
  fs.appendFileSync(filePath, toCsvLine(record), "utf8");
}

function appendAiCallLog(record) {
  const logDir = getLogDir();
  ensureDir(logDir);
  const sanitized = sanitizeForLog(record);
  appendJsonl(path.join(logDir, JSONL_FILE_NAME), sanitized);
  appendCsv(path.join(logDir, CSV_FILE_NAME), sanitized);
  return sanitized;
}

module.exports = {
  CSV_COLUMNS,
  CSV_FILE_NAME,
  DEFAULT_LOG_DIR,
  JSONL_FILE_NAME,
  appendAiCallLog,
  getLogDir,
  sanitizeForLog,
};
