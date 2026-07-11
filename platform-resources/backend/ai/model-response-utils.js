"use strict";

const { sanitizeProviderText } = require("./sanitizer");

function ensureChineseSentencePunctuation(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  const last = value[value.length - 1];
  if ("。！？；…".includes(last)) return value;
  const replacements = { ".": "。", "?": "？", "!": "！", ";": "；" };
  return replacements[last] ? value.slice(0, -1) + replacements[last] : value + "。";
}

function normalizeUsage(usage) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = Number(source.promptTokens || source.prompt_tokens || source.input_tokens || 0);
  const completionTokens = Number(source.completionTokens || source.completion_tokens || source.output_tokens || 0);
  const totalTokens = Number(source.totalTokens || source.total_tokens || promptTokens + completionTokens || 0);
  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
    raw: source,
  };
}

function normalizeContext(value) {
  const source = value && typeof value === "object" ? value : { requestId: value };
  return {
    requestId: String(source.requestId || "").trim(),
    jobId: String(source.jobId || "").trim(),
    itemId: String(source.itemId || "").trim(),
    sentenceNumber: Number(source.sentenceNumber) || 0,
    stage: String(source.stage || "").trim(),
    model: String(source.model || "").trim(),
    createdAt: String(source.createdAt || new Date().toISOString()).trim(),
  };
}

function createModelJsonParseError(rawText, contextValue) {
  const context = normalizeContext(contextValue);
  const rawModelText = sanitizeProviderText(String(rawText || ""), 4000);
  const error = new Error("模型输出 JSON 解析失败，可查看原始AI返回。");
  error.statusCode = 502;
  error.code = "model-json-parse-failed";
  error.requestId = context.requestId;
  error.stage = context.stage;
  error.model = context.model;
  error.rawModelText = rawModelText;
  error.debugRawJson = {
    ...context,
    errorCode: error.code,
    errorMessage: error.message,
    rawModelText,
  };
  error.hasDebugRawJson = true;
  return error;
}

function parseModelJsonText(rawText, context) {
  const source = String(rawText || "").trim();
  if (!source) throw createModelJsonParseError(rawText, context);
  const withoutCodeFence = source.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const attempts = [withoutCodeFence];
  const firstBrace = withoutCodeFence.indexOf("{");
  const lastBrace = withoutCodeFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) attempts.push(withoutCodeFence.slice(firstBrace, lastBrace + 1));
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (_error) {
      // Try the next safe JSON candidate.
    }
  }
  throw createModelJsonParseError(rawText, context);
}

module.exports = { ensureChineseSentencePunctuation, normalizeUsage, parseModelJsonText };
