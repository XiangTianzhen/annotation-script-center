"use strict";

const path = require("path");

const { createAiCallLogger } = require("../../../backend/ai-call-log");
const { SCRIPT_ID } = require("./ai-service");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number)) : "";
}

function getLogDir() {
  const customDir = normalizeText(process.env.DATABAKER_CVPC_AI_CALL_LOG_DIR);
  return customDir || DEFAULT_LOG_DIR;
}

const aiCallLogger = createAiCallLogger({
  logDir: getLogDir(),
  platformId: "dataBakerCvpc",
  scriptId: SCRIPT_ID,
  extraColumns: [
    { key: "projectId", header: "projectId" },
    { key: "taskId", header: "taskId" },
    { key: "processId", header: "processId" },
    { key: "dataId", header: "dataId" },
    { key: "jobId", header: "jobId" },
    { key: "fileName", header: "fileName" },
    { key: "entryIndex", header: "entryIndex" },
    { key: "selectionKey", header: "selectionKey" },
    { key: "segmentStartMs", header: "segmentStartMs" },
    { key: "segmentEndMs", header: "segmentEndMs" },
    { key: "listenModel", header: "listenModel" },
    { key: "refineModel", header: "refineModel" },
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const query = input?.editorContext?.query || {};
    const selectedEntry = input?.editorContext?.selectedEntry || {};
    const projectResult = context?.execution?.projectResult || context?.execution?.pipelineResult || {};
    const models = projectResult?.models || context?.execution?.models || {};
    return {
      projectId: normalizeText(query.projectId),
      taskId: normalizeText(query.taskId),
      processId: normalizeText(query.processId),
      dataId: normalizeText(query.dataId),
      jobId: normalizeText(query.jobId),
      fileName: normalizeText(selectedEntry.name || input.fileName),
      entryIndex: normalizeText(selectedEntry.entry_index || selectedEntry.entryIndex),
      selectionKey: normalizeText(input.selectionKey),
      segmentStartMs: normalizeNumber(input.startMs),
      segmentEndMs: normalizeNumber(input.endMs),
      listenModel: normalizeText(models.listenModel || input.listenModel),
      refineModel: normalizeText(models.refineModel || input.refineModel),
    };
  },
});

module.exports = {
  aiCallLogger,
  appendAiCallLog: aiCallLogger.append,
  appendAiCallLogSafe: aiCallLogger.appendSafe,
  getLogDir: aiCallLogger.getLogDir,
  summarizeAiCallLogs: aiCallLogger.summarize,
};
