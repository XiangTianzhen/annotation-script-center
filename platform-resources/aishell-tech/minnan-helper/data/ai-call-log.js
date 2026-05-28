"use strict";

const path = require("path");

const { createAiCallLogger } = require("../../../backend/ai-call-log");

const DEFAULT_LOG_DIR = path.join(__dirname, "runtime");

function normalizeText(value) {
  return String(value || "").trim();
}

function formatDatePart(input) {
  const date = input ? new Date(input) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getLogDir() {
  return DEFAULT_LOG_DIR;
}

const aiCallLogger = createAiCallLogger({
  logDir: DEFAULT_LOG_DIR,
  platformId: "aishellTech",
  scriptId: "aishellTechMinnanAssistant",
  extraColumns: [
    { key: "cancelled", header: "是否取消" },
    { key: "stage", header: "阶段" },
    { key: "listenDurationMs", header: "听音耗时毫秒" },
    { key: "compareDurationMs", header: "比较耗时毫秒" },
    { key: "queueWaitMs", header: "排队等待毫秒" },
    { key: "retryCount", header: "重试次数" },
    { key: "cacheHit", header: "缓存命中" },
    { key: "taskId", header: "任务ID" },
    { key: "packageId", header: "分包ID" },
    { key: "taskItemId", header: "条目ID" },
    { key: "modelMode", header: "模型方案" },
    { key: "recognitionStrategy", header: "识别策略" },
    { key: "pipelineMode", header: "流水线模式" },
    { key: "listenModel", header: "听音模型" },
    { key: "compareModel", header: "比较模型" },
    { key: "singleModel", header: "单模型" },
  ],
  buildExtendedRow(context) {
    const request = context?.normalizedRequest || {};
    const meta =
      (context?.error && context.error.meta) ||
      (context?.result && context.result.meta) ||
      {};
    const timing = meta.timing || context?.result?.timing || {};
    const queue = meta.queue || {};
    const cache = meta.cache || {};
    const models = meta.models || context?.result?.models || {};
    return {
      cancelled: meta.cancelled === true ? "true" : "false",
      stage: normalizeText(context?.error?.stage || meta.stage),
      listenDurationMs: normalizeText(timing.listenDurationMs),
      compareDurationMs: normalizeText(timing.compareDurationMs),
      queueWaitMs: normalizeText(queue.totalQueueWaitMs),
      retryCount: normalizeText(meta.retryCount),
      cacheHit: cache.hit === true ? "true" : "false",
      taskId: normalizeText(request.taskId),
      packageId: normalizeText(request.packageId),
      taskItemId: normalizeText(request.taskItemId),
      modelMode: normalizeText(request.modelMode || models.modelMode),
      recognitionStrategy: normalizeText(
        request.recognitionStrategy || models.recognitionStrategy
      ),
      pipelineMode: normalizeText(request.pipelineMode || models.pipelineMode),
      listenModel: normalizeText(models.listenModel || request.listenModel),
      compareModel: normalizeText(models.compareModel || request.compareModel),
      singleModel: normalizeText(models.singleModel || request.singleModel),
    };
  },
  pickRawResponse(context) {
    return context?.result || null;
  },
  pickRawError(context) {
    return context?.error || null;
  },
});

function getAishellAiCallLogFilePath(logDir, createdAt) {
  return path.join(
    normalizeText(logDir) || DEFAULT_LOG_DIR,
    "ai-calls-" + formatDatePart(createdAt) + ".csv"
  );
}

function buildAishellAiCallLogRow(input) {
  return aiCallLogger.buildRow(input);
}

function appendAishellAiCallLog(input) {
  return aiCallLogger.append(input);
}

function appendAishellAiCallLogSafe(input) {
  return aiCallLogger.appendSafe(input);
}

module.exports = {
  CSV_COLUMNS: aiCallLogger.schema,
  DEFAULT_LOG_DIR,
  aiCallLogger,
  appendAishellAiCallLog,
  appendAishellAiCallLogSafe,
  buildAishellAiCallLogRow,
  getAishellAiCallLogFilePath,
  getLogDir,
};
