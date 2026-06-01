"use strict";

const MAX_RUNTIME_LOG_ENTRIES = 200;

const runtimeLogEntries = [];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLevel(value) {
  const level = normalizeText(value).toLowerCase();
  if (level === "error" || level === "warn" || level === "success") {
    return level;
  }
  return "info";
}

function normalizeScope(value) {
  return normalizeText(value) || "backend";
}

function sanitizeDetails(input) {
  const source = input && typeof input === "object" ? input : {};
  const entries = Object.entries(source).slice(0, 10);
  return entries.reduce(function reduceDetails(result, entry) {
    const key = normalizeText(entry[0]);
    if (!key) {
      return result;
    }
    const value = entry[1];
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = String(value);
      return result;
    }
    try {
      result[key] = JSON.stringify(value).slice(0, 240);
    } catch (_error) {
      result[key] = "[unserializable]";
    }
    return result;
  }, {});
}

function appendRuntimeLog(input) {
  const source = input && typeof input === "object" ? input : {};
  const entry = {
    createdAt: normalizeText(source.createdAt) || new Date().toISOString(),
    level: normalizeLevel(source.level),
    scope: normalizeScope(source.scope),
    action: normalizeText(source.action) || "event",
    message: normalizeText(source.message) || "运行事件",
    requestId: normalizeText(source.requestId),
    details: sanitizeDetails(source.details),
  };
  runtimeLogEntries.unshift(entry);
  if (runtimeLogEntries.length > MAX_RUNTIME_LOG_ENTRIES) {
    runtimeLogEntries.length = MAX_RUNTIME_LOG_ENTRIES;
  }
  return Object.assign({}, entry);
}

function listRuntimeLogs(options) {
  const config = options && typeof options === "object" ? options : {};
  const limit = Math.max(1, Math.min(100, Number(config.limit || 20) || 20));
  return runtimeLogEntries.slice(0, limit).map(function cloneItem(item) {
    return Object.assign({}, item, {
      details: Object.assign({}, item.details || {}),
    });
  });
}

function clearRuntimeLogsForTest() {
  runtimeLogEntries.length = 0;
}

module.exports = {
  MAX_RUNTIME_LOG_ENTRIES,
  appendRuntimeLog,
  clearRuntimeLogsForTest,
  listRuntimeLogs,
};
