"use strict";

const path = require("path");

const {
  createAiCallLogger,
} = require("../../../backend/ai-call-log");
const { SCRIPT_ID } = require("./ai-analyze-request");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");

function normalizeText(value) {
  return String(value || "").trim();
}

const aiCallLogger = createAiCallLogger({
  logDir: DEFAULT_LOG_DIR,
  platformId: "abakaAi",
  scriptId: SCRIPT_ID,
  extraColumns: [
    { key: "target", header: "分析目标" },
    { key: "analysisMode", header: "分析模式" },
    { key: "imageCount", header: "图片数量" },
    { key: "visionModel", header: "视觉模型" },
    { key: "ocrEnabled", header: "开启OCR" },
    { key: "ocrModel", header: "OCR模型" },
    { key: "reasoningModel", header: "推理模型" },
    { key: "singleModel", header: "单模型" },
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const projectOptions = context?.normalizedRequest?.projectOptions || {};
    const result = context?.execution?.projectResult || context?.execution?.pipelineResult || {};
    return {
      target: normalizeText(input.target),
      analysisMode: normalizeText(projectOptions.analysisMode || result.analysisMode),
      imageCount: normalizeText(Array.isArray(input.images) ? input.images.length : 0),
      visionModel: normalizeText(result.visionModel || projectOptions.visionModel),
      ocrEnabled: projectOptions.ocrEnabled === true ? "true" : "false",
      ocrModel: normalizeText(result.ocrModel || projectOptions.ocrModel),
      reasoningModel: normalizeText(result.reasoningModel || projectOptions.reasoningModel),
      singleModel: normalizeText(result.singleModel || projectOptions.singleModel),
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
