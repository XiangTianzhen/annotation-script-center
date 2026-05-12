"use strict";

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "asr-transcription-ai-calls.jsonl");

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogDir() {
  return LOG_DIR;
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(/(api[_-]?key|token|authorization|cookie|signature|ossaccesskeyid)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 160);
}

function toSafeRecord(record) {
  const source = record && typeof record === "object" ? record : {};
  return {
    createdAt: source.createdAt || new Date().toISOString(),
    requestId: sanitizeText(source.requestId, 80),
    success: source.success === true,
    durationMs: Number(source.durationMs || 0) || 0,
    model: sanitizeText(source.model, 80),
    compareModel: sanitizeText(source.compareModel, 80),
    enableThinking: source.enableThinking === true,
    thinkingFallbackUsed: source.thinkingFallbackUsed === true,
    thinkingFallbackMode: sanitizeText(source.thinkingFallbackMode, 20),
    audioHostnames: Array.isArray(source.audioHostnames)
      ? source.audioHostnames.map(function (item) {
          return sanitizeText(item, 120);
        })
      : [],
    textCandidateCount: Number(source.textCandidateCount || 0) || 0,
    hasAudio: source.hasAudio === true,
    decision: sanitizeText(source.decision, 40),
    confidence: Number(source.confidence || 0) || 0,
    mock: source.mock === true,
    errorCode: sanitizeText(source.errorCode, 80),
    errorMessage: sanitizeText(source.errorMessage, 160),
  };
}

function appendAiCallLog(record) {
  ensureDir();
  const safeRecord = toSafeRecord(record);
  fs.appendFileSync(LOG_FILE, JSON.stringify(safeRecord) + "\n", "utf8");
}

module.exports = {
  appendAiCallLog,
  getLogDir,
};
