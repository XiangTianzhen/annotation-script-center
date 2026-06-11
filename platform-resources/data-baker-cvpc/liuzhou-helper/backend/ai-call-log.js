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
    { key: "listenPromptTokens", header: "listenPromptTokens" },
    { key: "listenCompletionTokens", header: "listenCompletionTokens" },
    { key: "listenTotalTokens", header: "listenTotalTokens" },
    { key: "refinePromptTokens", header: "refinePromptTokens" },
    { key: "refineCompletionTokens", header: "refineCompletionTokens" },
    { key: "refineTotalTokens", header: "refineTotalTokens" },
    { key: "listenEstimatedCostCny", header: "listenEstimatedCostCny" },
    { key: "refineEstimatedCostCny", header: "refineEstimatedCostCny" },
    { key: "totalEstimatedCostCny", header: "totalEstimatedCostCny" },
    { key: "listenPricingStatus", header: "listenPricingStatus" },
    { key: "refinePricingStatus", header: "refinePricingStatus" },
    { key: "listenInputPrice", header: "listenInputPrice" },
    { key: "listenOutputPrice", header: "listenOutputPrice" },
    { key: "refineInputPrice", header: "refineInputPrice" },
    { key: "refineOutputPrice", header: "refineOutputPrice" },
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
      listenPricingStatus: normalizeText(listenCost.pricingStatus),
      refinePricingStatus: normalizeText(refineCost.pricingStatus),
      listenInputPrice: normalizeText(listenCost.inputPriceLabel),
      listenOutputPrice: normalizeText(listenCost.outputPriceLabel),
      refineInputPrice: normalizeText(refineCost.inputPriceLabel),
      refineOutputPrice: normalizeText(refineCost.outputPriceLabel),
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
