"use strict";

const ANSWER_CHOICE_MAP = {
  first_better: "choiceFirstBetter",
  second_better: "choiceSecondBetter",
  both_bad: "choiceBothBad",
  uncertain_or_similar: "choiceUnsure",
  other_dialect_or_language: "choiceOtherDialect",
};

const ANSWER_TEXT_MAP = {
  first_better: "第一个更好",
  second_better: "第二个更好",
  both_bad: "都不好",
  uncertain_or_similar: "不确定或差不多",
  other_dialect_or_language: "其他方言或语种",
};

const RISK_LEVELS = ["low", "medium", "high"];

function normalizeConfidence(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numericValue));
}

function parseModelJsonText(rawText, requestId) {
  const source = String(rawText || "").trim();
  if (!source) {
    throw new Error("模型未返回文本结果。");
  }

  const withoutCodeFence = source
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const attempts = [withoutCodeFence];
  const firstBrace = withoutCodeFence.indexOf("{");
  const lastBrace = withoutCodeFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(withoutCodeFence.slice(firstBrace, lastBrace + 1));
  }

  for (let index = 0; index < attempts.length; index += 1) {
    const candidate = attempts[index];
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // try next candidate
    }
  }

  throw new Error(
    "模型输出 JSON 解析失败（requestId: " + String(requestId || "") + "）。"
  );
}

function normalizeModelResponse(modelJson, context) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  const requestId = String(context?.requestId || "");
  const answer = String(source.answer || "").trim();
  if (!Object.prototype.hasOwnProperty.call(ANSWER_CHOICE_MAP, answer)) {
    throw new Error("模型返回的 answer 不在允许范围内。");
  }

  const mappedChoiceActionKey = ANSWER_CHOICE_MAP[answer];
  const rawChoiceActionKey = String(source.choiceActionKey || "").trim();
  if (rawChoiceActionKey && rawChoiceActionKey !== mappedChoiceActionKey) {
    throw new Error("模型返回的 choiceActionKey 与 answer 映射不一致。");
  }

  const riskLevel = String(source.riskLevel || "").trim().toLowerCase() || "medium";
  if (RISK_LEVELS.indexOf(riskLevel) < 0) {
    throw new Error("模型返回的 riskLevel 不在允许范围内。");
  }

  const confidence = normalizeConfidence(source.confidence);
  const needManualSearch = source.needManualSearch === true;
  const shouldWarnBeforeApply =
    source.shouldWarnBeforeApply === true ||
    needManualSearch ||
    confidence < 0.65 ||
    riskLevel === "high";
  const reasonSummary = String(source.reasonSummary || "").trim();

  return {
    answer,
    answerText: String(source.answerText || ANSWER_TEXT_MAP[answer]),
    choiceActionKey: mappedChoiceActionKey,
    confidence,
    reasonSummary: reasonSummary || "模型未提供理由。",
    riskLevel,
    needManualSearch,
    shouldWarnBeforeApply,
    model: String(source.model || context?.model || ""),
    ruleVersion: String(source.ruleVersion || context?.ruleVersion || ""),
    requestId,
  };
}

module.exports = {
  ANSWER_CHOICE_MAP,
  ANSWER_TEXT_MAP,
  RISK_LEVELS,
  normalizeConfidence,
  parseModelJsonText,
  normalizeModelResponse,
};
