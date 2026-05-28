"use strict";

const path = require("path");

const {
  createAiCallLogger,
} = require("../../../backend/ai-call-log");
const { SCRIPT_ID, parseAudioHostname } = require("./ai-suggest-request");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");

function normalizeText(value) {
  return String(value || "").trim();
}

const aiCallLogger = createAiCallLogger({
  logDir: DEFAULT_LOG_DIR,
  platformId: "alibabaLabelx",
  scriptId: SCRIPT_ID,
  extraColumns: [
    { key: "subTaskId", header: "子任务ID" },
    { key: "itemIndex", header: "条目序号" },
    { key: "audioHostname", header: "音频域名" },
    { key: "includeContext", header: "带上下文" },
    { key: "contextLength", header: "上下文长度" },
    { key: "listenModel", header: "听音模型" },
    { key: "compareModel", header: "比较模型" },
    { key: "webSearchEnabled", header: "启用联网搜索" },
  ],
  buildExtendedRow(context) {
    const input = context?.normalizedRequest?.input || {};
    const projectOptions = context?.normalizedRequest?.projectOptions || {};
    const models = context?.execution?.models || {};
    return {
      subTaskId: normalizeText(input.subTaskId),
      itemIndex: normalizeText(input.itemIndex),
      audioHostname: parseAudioHostname(input.audioUrl),
      includeContext: input.includeContext === true ? "true" : "false",
      contextLength: normalizeText(String(input.contextText || "").length),
      listenModel: normalizeText(models.listenModel || projectOptions.listenModel),
      compareModel: normalizeText(models.compareModel || projectOptions.compareModel),
      webSearchEnabled: projectOptions.webSearchEnabled === true ? "true" : "false",
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
