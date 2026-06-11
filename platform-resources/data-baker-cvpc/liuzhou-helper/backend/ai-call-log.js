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

function normalizeCostNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : "";
}

function pickProjectResult(context) {
  return (
    context?.execution?.projectResult ||
    context?.execution?.postProcessedResult ||
    context?.execution?.pipelineResult ||
    {}
  );
}

function pickStageUsage(usage, stageKey) {
  const source = usage && typeof usage === "object" ? usage[stageKey] : null;
  if (!source || typeof source !== "object") {
    return {
      promptTokens: "",
      completionTokens: "",
      totalTokens: "",
    };
  }
  const promptTokens = Number(
    source.promptTokens ?? source.prompt_tokens ?? source.inputTokens ?? source.input_tokens ?? 0
  );
  const completionTokens = Number(
    source.completionTokens ?? source.completion_tokens ?? source.outputTokens ?? source.output_tokens ?? 0
  );
  const totalTokens = Number(source.totalTokens ?? source.total_tokens ?? promptTokens + completionTokens ?? 0);
  return {
    promptTokens: Number.isFinite(promptTokens) && promptTokens > 0 ? String(Math.round(promptTokens)) : "",
    completionTokens:
      Number.isFinite(completionTokens) && completionTokens >= 0 ? String(Math.round(completionTokens)) : "",
    totalTokens: Number.isFinite(totalTokens) && totalTokens > 0 ? String(Math.round(totalTokens)) : "",
  };
}

function pickStageCost(cost, stageKey) {
  const source = cost && typeof cost === "object" ? cost[stageKey] : null;
  return source && typeof source === "object" ? source : {};
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
    { key: "listenPromptTokens", header: "听音输入Token" },
    { key: "listenCompletionTokens", header: "听音输出Token" },
    { key: "listenTotalTokens", header: "听音总Token" },
    { key: "refinePromptTokens", header: "文本修正输入Token" },
    { key: "refineCompletionTokens", header: "文本修正输出Token" },
    { key: "refineTotalTokens", header: "文本修正总Token" },
    { key: "listenEstimatedCostCny", header: "听音预估人民币" },
    { key: "refineEstimatedCostCny", header: "文本修正预估人民币" },
    { key: "totalEstimatedCostCny", header: "总预估人民币" },
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const query = input?.editorContext?.query || {};
    const selectedEntry = input?.editorContext?.selectedEntry || {};
    const projectResult = pickProjectResult(context);
    const models = projectResult?.models || context?.execution?.models || {};
    const usage = projectResult?.usage || context?.error?.usage || context?.result?.usage || {};
    const cost = projectResult?.cost || context?.error?.cost || context?.result?.cost || {};
    const listenUsage = pickStageUsage(usage, "listen");
    const refineUsage = pickStageUsage(usage, "refine");
    const listenCost = pickStageCost(cost, "listen");
    const refineCost = pickStageCost(cost, "refine");
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
      listenPromptTokens: listenUsage.promptTokens,
      listenCompletionTokens: listenUsage.completionTokens,
      listenTotalTokens: listenUsage.totalTokens,
      refinePromptTokens: refineUsage.promptTokens,
      refineCompletionTokens: refineUsage.completionTokens,
      refineTotalTokens: refineUsage.totalTokens,
      listenEstimatedCostCny: normalizeCostNumber(listenCost.estimatedCostCny),
      refineEstimatedCostCny: normalizeCostNumber(refineCost.estimatedCostCny),
      totalEstimatedCostCny: normalizeCostNumber(cost.totalEstimatedCostCny),
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
