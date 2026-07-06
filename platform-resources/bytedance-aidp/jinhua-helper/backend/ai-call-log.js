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
      label: "普通话翻译收口",
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
  const customDir = normalizeText(process.env.BYTEDANCE_AIDP_JINHUA_AI_CALL_LOG_DIR);
  return customDir || DEFAULT_LOG_DIR;
}

const aiCallLogger = createAiCallLogger({
  logDir: getLogDir(),
  platformId: "bytedanceAidp",
  scriptId: SCRIPT_ID,
  extraColumns: [
    { key: "taskId", header: "任务ID" },
    { key: "itemId", header: "题目ID" },
    { key: "entryId", header: "条目ID" },
    { key: "templateID", header: "模板ID" },
    { key: "selectionKey", header: "选段键" },
    { key: "segmentNumber", header: "段号" },
    { key: "segmentStartMs", header: "片段开始毫秒" },
    { key: "segmentEndMs", header: "片段结束毫秒" },
    { key: "listenModel", header: "听音模型" },
    { key: "refineModel", header: "普通话翻译收口模型" },
    ...stageLogSupport.extraColumns,
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const query = input?.editorContext?.query || {};
    const projectResult = pickProjectResult(context);
    const models = projectResult?.models || context?.execution?.models || {};
    return {
      taskId: normalizeText(query.taskId || input.taskId),
      itemId: normalizeText(query.itemId || input.itemId),
      entryId: normalizeText(query.entryId || input.entryId),
      templateID: normalizeText(query.templateID || input.templateID),
      selectionKey: normalizeText(input.selectionKey),
      segmentNumber: normalizeNumber(input.segmentNumber),
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

