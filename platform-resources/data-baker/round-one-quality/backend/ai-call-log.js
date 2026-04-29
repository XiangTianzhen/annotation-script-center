"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LOG_DIR = path.join(__dirname, "logs");
const JSONL_FILE_NAME = "recommend-calls.jsonl";
const CSV_FILE_NAME = "recommend-calls.csv";

const CSV_COLUMNS = [
  { key: "createdAt", header: "创建时间" },
  { key: "requestId", header: "请求ID" },
  { key: "success", header: "是否成功" },
  { key: "durationMs", header: "耗时毫秒" },
  { key: "listenDurationMs", header: "听音耗时毫秒" },
  { key: "compareDurationMs", header: "对比耗时毫秒" },
  { key: "pipelineMode", header: "流水线模式" },
  { key: "annotatorName", header: "标注员" },
  { key: "collectId", header: "采集ID" },
  { key: "itemId", header: "记录ID" },
  { key: "textId", header: "文本ID" },
  { key: "sentenceNumber", header: "句子编号" },
  { key: "readRequire", header: "朗读要求" },
  { key: "audioHostname", header: "音频域名" },
  { key: "pageText", header: "页面候选文本" },
  { key: "heardText", header: "AI听音文本" },
  { key: "recommendedText", header: "AI推荐文本" },
  { key: "isChanged", header: "是否变更" },
  { key: "needHumanReview", header: "需要人工复核" },
  { key: "decision", header: "决策" },
  { key: "lexiconEnabled", header: "是否启用词表" },
  { key: "lexiconRewriteMode", header: "词表替换模式" },
  { key: "lexiconRewriteChanged", header: "词表是否改写" },
  { key: "lexiconRewriteChangeCount", header: "词表改写数量" },
  { key: "lexiconRewriteChanges", header: "词表改写明细" },
  { key: "listenConfidence", header: "听音置信度" },
  { key: "compareConfidence", header: "对比置信度" },
  { key: "listenModel", header: "听音模型" },
  { key: "compareModel", header: "对比模型" },
  { key: "listenPromptTokens", header: "听音输入Token" },
  { key: "listenCompletionTokens", header: "听音输出Token" },
  { key: "listenTotalTokens", header: "听音总Token" },
  { key: "comparePromptTokens", header: "对比输入Token" },
  { key: "compareCompletionTokens", header: "对比输出Token" },
  { key: "compareTotalTokens", header: "对比总Token" },
  { key: "totalTokens", header: "总Token" },
  { key: "estimatedCostCny", header: "预估AI成本人民币" },
  { key: "effectiveRevenueCny", header: "有效时长收入人民币" },
  { key: "grossProfitCny", header: "预估毛利润人民币" },
  { key: "effectiveStartTime", header: "有效开始时间" },
  { key: "effectiveEndTime", header: "有效结束时间" },
  { key: "effectiveTime", header: "有效时长" },
  { key: "audioDuration", header: "音频总时长" },
  { key: "clientVersion", header: "扩展版本" },
  { key: "mock", header: "是否Mock" },
  { key: "errorCode", header: "错误码" },
  { key: "errorMessage", header: "错误信息" },
];

function getLogDir() {
  const customDir = String(process.env.DATABAKER_AI_CALL_LOG_DIR || "").trim();
  return customDir || DEFAULT_LOG_DIR;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeString(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function safeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function safeBoolean(value) {
  return value === true;
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value === undefined ? null : value);
  } catch (error) {
    return "";
  }
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
}

function getUsageValue(usage, key) {
  const source = usage && typeof usage === "object" ? usage : {};
  return safeNumber(source[key]);
}

function sanitizeForLog(record) {
  const source = record && typeof record === "object" ? record : {};
  const request = source.request && typeof source.request === "object" ? source.request : {};
  const response = source.response && typeof source.response === "object" ? source.response : {};
  const usage = response.usage && typeof response.usage === "object" ? response.usage : {};
  const listenUsage = usage.listen && typeof usage.listen === "object" ? usage.listen : {};
  const compareUsage = usage.compare && typeof usage.compare === "object" ? usage.compare : {};
  const cost = response.cost && typeof response.cost === "object" ? response.cost : {};
  const model = response.model && typeof response.model === "object" ? response.model : {};
  const lexicon = response.lexicon && typeof response.lexicon === "object" ? response.lexicon : {};
  const timing = response.timing && typeof response.timing === "object" ? response.timing : {};
  const rewriteChanges = Array.isArray(lexicon.rewriteChanges)
    ? lexicon.rewriteChanges.map(function (item) {
        const change = item && typeof item === "object" ? item : {};
        return {
          from: safeString(change.from),
          to: safeString(change.to),
          source: safeString(change.source),
          reason: safeString(change.reason),
        };
      })
    : [];

  return {
    createdAt: safeString(source.createdAt || new Date().toISOString()),
    requestId: safeString(source.requestId),
    success: safeBoolean(source.success),
    durationMs: safeNumber(source.durationMs),
    listenDurationMs: safeNumber(source.listenDurationMs || timing.listenDurationMs),
    compareDurationMs: safeNumber(source.compareDurationMs || timing.compareDurationMs),
    pipelineMode: safeString(response.pipelineMode || source.pipelineMode),
    annotatorName: safeString(request.annotatorName),
    collectId: safeString(request.collectId),
    itemId: safeString(request.itemId),
    textId: safeString(request.textId),
    sentenceNumber: request.sentenceNumber === null ? "" : safeString(request.sentenceNumber),
    readRequire: safeString(request.readRequire),
    audioHostname: safeString(source.audioHostname || parseAudioHostname(request.audioUrl)),
    pageText: safeString(response.pageText || request.pageText),
    heardText: safeString(response.heardText),
    recommendedText: safeString(response.recommendedText),
    isChanged: response.isChanged === true,
    needHumanReview: response.needHumanReview === true,
    decision: safeString(response.decision),
    lexiconEnabled: lexicon.enabled === true,
    lexiconRewriteMode: safeString(lexicon.rewriteMode),
    lexiconRewriteChanged: lexicon.rewriteChanged === true,
    lexiconRewriteChangeCount: rewriteChanges.length,
    lexiconRewriteChanges: safeJsonStringify(rewriteChanges),
    listenConfidence: safeNumber(response.listenConfidence),
    compareConfidence: safeNumber(response.compareConfidence),
    listenModel: safeString(model.listen || source.listenModel),
    compareModel: safeString(model.compare || source.compareModel),
    listenPromptTokens: getUsageValue(listenUsage, "promptTokens"),
    listenCompletionTokens: getUsageValue(listenUsage, "completionTokens"),
    listenTotalTokens: getUsageValue(listenUsage, "totalTokens"),
    comparePromptTokens: getUsageValue(compareUsage, "promptTokens"),
    compareCompletionTokens: getUsageValue(compareUsage, "completionTokens"),
    compareTotalTokens: getUsageValue(compareUsage, "totalTokens"),
    totalTokens: safeNumber(usage.totalTokens),
    estimatedCostCny: safeNumber(cost.estimatedCostCny),
    effectiveRevenueCny: safeNumber(cost.effectiveRevenueCny),
    grossProfitCny: safeNumber(cost.grossProfitCny),
    effectiveStartTime: request.effectiveStartTime === null ? "" : safeString(request.effectiveStartTime),
    effectiveEndTime: request.effectiveEndTime === null ? "" : safeString(request.effectiveEndTime),
    effectiveTime: request.effectiveTime === null ? "" : safeString(request.effectiveTime),
    audioDuration: request.audioDuration === null ? "" : safeString(request.audioDuration),
    clientVersion: safeString(request.clientVersion),
    mock: source.mock === true,
    errorCode: safeString(source.errorCode),
    errorMessage: safeString(source.errorMessage),
  };
}

function escapeCsvCell(value) {
  const text = safeString(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsvLine(record) {
  return CSV_COLUMNS.map(function (column) {
    return escapeCsvCell(record[column.key]);
  }).join(",") + "\n";
}

function appendJsonl(filePath, record) {
  fs.appendFileSync(filePath, JSON.stringify(record, null, 0) + "\n", "utf8");
}

function appendCsv(filePath, record) {
  if (!fs.existsSync(filePath)) {
    const headerLine = CSV_COLUMNS.map(function (column) {
      return escapeCsvCell(column.header);
    }).join(",") + "\n";
    fs.writeFileSync(filePath, headerLine, "utf8");
  }
  fs.appendFileSync(filePath, toCsvLine(record), "utf8");
}

function appendAiCallLog(record) {
  const logDir = getLogDir();
  ensureDir(logDir);
  const sanitized = sanitizeForLog(record);
  appendJsonl(path.join(logDir, JSONL_FILE_NAME), sanitized);
  appendCsv(path.join(logDir, CSV_FILE_NAME), sanitized);
  return sanitized;
}

module.exports = {
  CSV_COLUMNS,
  CSV_FILE_NAME,
  DEFAULT_LOG_DIR,
  JSONL_FILE_NAME,
  appendAiCallLog,
  getLogDir,
  sanitizeForLog,
};
