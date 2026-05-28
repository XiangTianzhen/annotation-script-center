"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LOG_DIR = path.join(__dirname, "runtime");
const CSV_COLUMNS = [
  { key: "createdAt", header: "创建时间" },
  { key: "requestId", header: "请求ID" },
  { key: "platformId", header: "平台ID" },
  { key: "scriptId", header: "脚本ID" },
  { key: "success", header: "是否成功" },
  { key: "cancelled", header: "是否取消" },
  { key: "stage", header: "阶段" },
  { key: "errorCode", header: "错误码" },
  { key: "errorMessage", header: "错误信息" },
  { key: "durationMs", header: "总耗时毫秒" },
  { key: "listenDurationMs", header: "听音耗时毫秒" },
  { key: "compareDurationMs", header: "比较耗时毫秒" },
  { key: "queueWaitMs", header: "排队等待毫秒" },
  { key: "retryCount", header: "重试次数" },
  { key: "cacheHit", header: "缓存命中" },
  { key: "promptTokens", header: "输入Token" },
  { key: "completionTokens", header: "输出Token" },
  { key: "totalTokens", header: "总Token" },
  { key: "aiUsageOperatorName", header: "AI调用使用人" },
  { key: "platformUserName", header: "平台账号" },
  { key: "platformUserId", header: "平台用户ID" },
  { key: "taskId", header: "任务ID" },
  { key: "packageId", header: "分包ID" },
  { key: "taskItemId", header: "条目ID" },
  { key: "modelMode", header: "模型方案" },
  { key: "recognitionStrategy", header: "识别策略" },
  { key: "pipelineMode", header: "流水线模式" },
  { key: "listenModel", header: "听音模型" },
  { key: "compareModel", header: "比较模型" },
  { key: "singleModel", header: "单模型" },
  { key: "rawResponseJson", header: "原始返回JSON" },
  { key: "rawErrorJson", header: "原始错误JSON" },
];

function normalizeText(value) {
  return String(value || "").trim();
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...<truncated>";
}

function safeNumberString(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "";
  }
  return String(numeric);
}

function sanitizeUrlText(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    const tail = parts.length > 0 ? parts[parts.length - 1] : "";
    return url.origin + "/<redacted>/" + tail;
  } catch (_error) {
    return "<url-redacted>";
  }
}

function sanitizeJsonValue(value, depth) {
  const level = Number(depth || 0);
  if (level > 6) {
    return "<max-depth>";
  }
  if (value === null || value === undefined) {
    return value ?? null;
  }
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) {
      return sanitizeUrlText(value);
    }
    return truncateText(value, 2000);
  }
  if (typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 40).map(function (item) {
      return sanitizeJsonValue(item, level + 1);
    });
  }
  const result = {};
  Object.keys(value).forEach(function (key) {
    if (/token|cookie|authorization|api[_-]?key|secret|password/i.test(key)) {
      result[key] = "<redacted>";
      return;
    }
    result[key] = sanitizeJsonValue(value[key], level + 1);
  });
  return result;
}

function safeJsonStringify(value) {
  try {
    return truncateText(JSON.stringify(sanitizeJsonValue(value, 0)), 4000);
  } catch (_error) {
    return "";
  }
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatDatePart(input) {
  const date = input ? new Date(input) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getAishellAiCallLogFilePath(logDir, createdAt) {
  const targetDir = normalizeText(logDir) || DEFAULT_LOG_DIR;
  return path.join(targetDir, "ai-calls-" + formatDatePart(createdAt) + ".csv");
}

function pickPromptTokens(usage) {
  return safeNumberString(usage?.promptTokens);
}

function pickCompletionTokens(usage) {
  return safeNumberString(usage?.completionTokens);
}

function pickTotalTokens(usage) {
  const promptTokens = pickPromptTokens(usage);
  const completionTokens = pickCompletionTokens(usage);
  if (promptTokens || completionTokens) {
    return "";
  }
  return safeNumberString(usage?.totalTokens);
}

function buildErrorJson(error, requestId) {
  const source = error && typeof error === "object" ? error : {};
  return {
    requestId: normalizeText(source.requestId || requestId),
    code: normalizeText(source.code),
    stage: normalizeText(source.stage),
    message: truncateText(source.safeMessage || source.message || "", 500),
    providerCode: normalizeText(source.providerCode),
    providerStatus: Number(source.providerStatus || source.statusCode || 0) || 0,
    retryable: source.retryable === true,
    rawResponse: source.rawResponse && typeof source.rawResponse === "object" ? source.rawResponse : null,
    debugRawJson: source.debugRawJson && typeof source.debugRawJson === "object" ? source.debugRawJson : null,
    meta: source.meta && typeof source.meta === "object" ? source.meta : null,
  };
}

function buildAishellAiCallLogRow(input) {
  const source = input && typeof input === "object" ? input : {};
  const request = source.normalizedRequest && typeof source.normalizedRequest === "object"
    ? source.normalizedRequest
    : {};
  const result = source.result && typeof source.result === "object" ? source.result : {};
  const meta = result.meta && typeof result.meta === "object" ? result.meta : {};
  const error = source.error && typeof source.error === "object" ? source.error : null;
  const errorMeta = error?.meta && typeof error.meta === "object" ? error.meta : {};
  const finalMeta = error ? errorMeta : meta;
  const usage = finalMeta.usage && typeof finalMeta.usage === "object"
    ? finalMeta.usage
    : (result.usage && typeof result.usage === "object" ? result.usage : {});
  const models = finalMeta.models && typeof finalMeta.models === "object"
    ? finalMeta.models
    : (result.models && typeof result.models === "object" ? result.models : {});
  const timing = finalMeta.timing && typeof finalMeta.timing === "object"
    ? finalMeta.timing
    : (result.timing && typeof result.timing === "object" ? result.timing : {});
  const queue = finalMeta.queue && typeof finalMeta.queue === "object" ? finalMeta.queue : {};
  const cache = finalMeta.cache && typeof finalMeta.cache === "object" ? finalMeta.cache : {};

  return {
    createdAt: normalizeText(source.createdAt || new Date().toISOString()),
    requestId: normalizeText(source.requestId || finalMeta.requestId || error?.requestId),
    platformId: "aishellTech",
    scriptId: "aishellTechMinnanAssistant",
    success: error ? "false" : "true",
    cancelled: finalMeta.cancelled === true ? "true" : "false",
    stage: normalizeText(error?.stage || finalMeta.stage),
    errorCode: error ? normalizeText(error.code) : "",
    errorMessage: error ? truncateText(error.safeMessage || error.message || "", 500) : "",
    durationMs: safeNumberString(timing.totalDurationMs || source.durationMs),
    listenDurationMs: safeNumberString(timing.listenDurationMs),
    compareDurationMs: safeNumberString(timing.compareDurationMs),
    queueWaitMs: safeNumberString(queue.totalQueueWaitMs),
    retryCount: safeNumberString(finalMeta.retryCount),
    cacheHit: cache.hit === true ? "true" : "false",
    promptTokens: pickPromptTokens(usage),
    completionTokens: pickCompletionTokens(usage),
    totalTokens: pickTotalTokens(usage),
    aiUsageOperatorName: normalizeText(request.aiUsageOperatorName).slice(0, 40),
    platformUserName: normalizeText(request.platformUserName).slice(0, 80),
    platformUserId: normalizeText(request.platformUserId).slice(0, 120),
    taskId: normalizeText(request.taskId),
    packageId: normalizeText(request.packageId),
    taskItemId: normalizeText(request.taskItemId),
    modelMode: normalizeText(request.modelMode || models.modelMode),
    recognitionStrategy: normalizeText(request.recognitionStrategy || models.recognitionStrategy),
    pipelineMode: normalizeText(request.pipelineMode || models.pipelineMode),
    listenModel: normalizeText(models.listenModel || request.listenModel),
    compareModel: normalizeText(models.compareModel || request.compareModel),
    singleModel: normalizeText(models.singleModel || request.singleModel),
    rawResponseJson: error ? "" : safeJsonStringify(result),
    rawErrorJson: error ? safeJsonStringify(buildErrorJson(error, source.requestId)) : "",
  };
}

function toCsvLine(row) {
  return CSV_COLUMNS.map(function (column) {
    return escapeCsvCell(row[column.key] || "");
  }).join(",") + "\n";
}

function appendAishellAiCallLog(input) {
  const source = input && typeof input === "object" ? input : {};
  const logDir = normalizeText(source.logDir) || DEFAULT_LOG_DIR;
  const row = buildAishellAiCallLogRow(source);
  const filePath = getAishellAiCallLogFilePath(logDir, row.createdAt);
  ensureDir(logDir);
  if (!fs.existsSync(filePath)) {
    const headerLine = CSV_COLUMNS.map(function (column) {
      return escapeCsvCell(column.header);
    }).join(",") + "\n";
    fs.writeFileSync(filePath, headerLine, "utf8");
  }
  fs.appendFileSync(filePath, toCsvLine(row), "utf8");
  return {
    filePath,
    row,
  };
}

function appendAishellAiCallLogSafe(input) {
  try {
    return appendAishellAiCallLog(input);
  } catch (error) {
    console.warn("[aishell-ai-log] append failed:", error?.message || error);
    return null;
  }
}

module.exports = {
  CSV_COLUMNS,
  DEFAULT_LOG_DIR,
  appendAishellAiCallLog,
  appendAishellAiCallLogSafe,
  buildAishellAiCallLogRow,
  getAishellAiCallLogFilePath,
};
