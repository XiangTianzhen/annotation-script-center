"use strict";

const path = require("path");

const { createAiCallLogger } = require("../../../backend/ai-call-log");
const { createStageLogSupport } = require("../../../backend/ai-call-log/stage-log-support");
const { SCRIPT_ID } = require("./ai-service");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");
const stageLogSupport = createStageLogSupport({
  stages: [
    {
      key: "listen",
      label: "听音",
      modelKeys: ["listenModel"],
    },
    {
      key: "refine",
      label: "文本修正",
      modelKeys: ["refineModel"],
    },
  ],
});

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number)) : "";
}

function pickProjectResult(context) {
  return (
    context?.execution?.projectResult ||
    context?.execution?.postProcessedResult ||
    context?.execution?.pipelineResult ||
    {}
  );
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
    { key: "projectId", header: "项目ID" },
    { key: "taskId", header: "任务ID" },
    { key: "processId", header: "流程ID" },
    { key: "dataId", header: "数据ID" },
    { key: "jobId", header: "作业ID" },
    { key: "fileName", header: "文件名" },
    { key: "entryIndex", header: "条目序号" },
    { key: "selectionKey", header: "选段键" },
    { key: "segmentStartMs", header: "片段开始毫秒" },
    { key: "segmentEndMs", header: "片段结束毫秒" },
    { key: "listenModel", header: "听音模型" },
    { key: "refineModel", header: "文本修正模型" },
    ...stageLogSupport.extraColumns,
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const query = input?.editorContext?.query || {};
    const selectedEntry = input?.editorContext?.selectedEntry || {};
    const projectResult = pickProjectResult(context);
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
      ...stageLogSupport.buildRow(context),
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
