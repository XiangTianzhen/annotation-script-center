"use strict";

const VERDICT_SET = new Set(["same", "mostly_same", "different", "uncertain", "invalid_audio"]);
const LINE_DECISION_SET = new Set(["same", "minor_diff", "different", "uncertain"]);

function normalizeConfidence(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numericValue));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeStringArray(value, maxLength) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(function (item) {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object") {
        return JSON.stringify(item);
      }
      return String(item || "").trim();
    })
    .filter(Boolean)
    .slice(0, maxLength || 30);
}

function parseModelJsonText(rawText, requestId) {
  const source = String(rawText || "").trim();
  if (!source) {
    throw new Error("模型未返回文本。");
  }

  const withoutFence = source
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const attempts = [withoutFence];
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(withoutFence.slice(firstBrace, lastBrace + 1));
  }

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      return JSON.parse(attempts[index]);
    } catch (error) {
      // try next candidate
    }
  }

  const parseError = new Error(
    "模型 JSON 解析失败（requestId: " + String(requestId || "") + "）。"
  );
  parseError.code = "invalid-json";
  throw parseError;
}

function normalizeLineDecision(value) {
  const decision = String(value || "").trim();
  return LINE_DECISION_SET.has(decision) ? decision : "uncertain";
}

function normalizeVerdict(value) {
  const verdict = String(value || "").trim();
  return VERDICT_SET.has(verdict) ? verdict : "uncertain";
}

function normalizeListenResponse(modelJson) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  return {
    heardDialectText: normalizeText(source.heardDialectText || source.heardText || source.text || ""),
    heardMandarinMeaning: normalizeText(
      source.heardMandarinMeaning || source.mandarinMeaning || source.meaning || ""
    ),
    isValidAudio: source.isValidAudio !== false,
    invalidReasons: normalizeStringArray(source.invalidReasons, 20),
    riskFlags: normalizeStringArray(source.riskFlags, 20),
    confidence: normalizeConfidence(source.confidence),
  };
}

function normalizeComparisonResponse(modelJson, request) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  const dialectSource = source.dialectLine && typeof source.dialectLine === "object" ? source.dialectLine : {};
  const mandarinSource =
    source.mandarinLine && typeof source.mandarinLine === "object" ? source.mandarinLine : {};

  return {
    verdict: normalizeVerdict(source.verdict),
    shouldReview:
      source.shouldReview === true ||
      source.should_review === true ||
      normalizeVerdict(source.verdict) !== "same",
    confidence: normalizeConfidence(source.confidence),
    dialectLine: {
      decision: normalizeLineDecision(dialectSource.decision),
      platformText: normalizeText(dialectSource.platformText || request.platformDialectText),
      aiText: normalizeText(dialectSource.aiText),
      recommendedText: normalizeText(dialectSource.recommendedText || dialectSource.aiText),
      issues: normalizeStringArray(dialectSource.issues, 30),
    },
    mandarinLine: {
      decision: normalizeLineDecision(mandarinSource.decision),
      platformText: normalizeText(mandarinSource.platformText || request.platformMandarinText),
      recommendedText: normalizeText(mandarinSource.recommendedText),
      issues: normalizeStringArray(mandarinSource.issues, 30),
    },
    lexiconIssues: normalizeStringArray(source.lexiconIssues, 30),
    ruleIssues: normalizeStringArray(source.ruleIssues, 30),
  };
}

function normalizeUsage(usage) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = Number(source.promptTokens || source.prompt_tokens || source.input_tokens || 0);
  const completionTokens = Number(
    source.completionTokens || source.completion_tokens || source.output_tokens || 0
  );
  const totalTokens = Number(
    source.totalTokens || source.total_tokens || promptTokens + completionTokens || 0
  );

  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
    raw: source,
  };
}

module.exports = {
  normalizeComparisonResponse,
  normalizeConfidence,
  normalizeListenResponse,
  normalizeUsage,
  parseModelJsonText,
};
