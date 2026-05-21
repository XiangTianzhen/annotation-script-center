"use strict";

const RULE_VERSION = "magic-data-hakka-helper-ai-review-v1";
const DEFAULT_LISTEN_TEMPLATE = [
  "你是客家话音频辅助检查助手。",
  "听音结果只作为辅助证据，不作为平台文本自动替换依据。",
  "请优先判断音频有效性与风险，并辅助判断说话人属性。",
  "严格输出 JSON，不输出 Markdown 或额外解释。",
].join("\n");
const DEFAULT_COMPARE_TEMPLATE = [
  "当前任务是质量检查，不是直接改写平台文本。",
  "平台两行文本是基准答案，AI 只输出规则检查、风险提示和复核建议。",
  "请输出 reviewConclusion、shouldReview、textRuleCheck、recommendations、confidence。",
  "严格输出 JSON，不输出额外解释。",
].join("\n");

function getLexiconText(lexiconContext) {
  return String(lexiconContext?.text || "").trim();
}

function normalizePromptTemplate(value, fallback) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return String(fallback || "");
  }
  return text.slice(0, 8000);
}

function buildListenPrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_LISTEN_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
  const meta = {
    taskItemId: request.taskItemId,
    samplingRecordId: request.samplingRecordId,
    projectName: request.projectName,
    speaker: request.speaker,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
    platformDialectText: request.platformDialectText,
    platformMandarinText: request.platformMandarinText,
  };

  const promptLines = [
    template,
    "请优先判断音频有效性与风险：无有效人声、噪音、方言区域错误、切音、多人重叠、听不清、非方言、敏感数据、机器合成音。",
    "请辅助判断说话人性别和年龄段，可输出 uncertain。",
    "输出严格 JSON 字段：heardDialectText, heardMandarinMeaning, isValidAudio, validityDecision, invalidReasons, riskFlags, genderGuess, ageRangeGuess, confidence。",
    "validityDecision 只能是 valid|invalid|uncertain。",
    "ageRangeGuess 只能是 0-5|6-12|13-18|19-25|26-36|37-50|51-65|65以上|uncertain。",
  ];

  if (lexiconText) {
    promptLines.push("客家话正字表上下文（仅提示，不做强替换）：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(meta, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是客家话音频复核助手。严格输出 JSON，不要输出 Markdown，不要输出额外解释。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildComparePrompt(request, listen, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.comparePrompt,
    DEFAULT_COMPARE_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
  const input = {
    reviewMode: request.reviewMode || "rule_first",
    rulesProfile: request.rulesProfile,
    platformBaseline: {
      dialectText: request.platformDialectText,
      mandarinText: request.platformMandarinText,
      gender: request?.speaker?.gender || "",
      ageRange: request?.speaker?.ageRange || "",
    },
    listenEvidence: {
      heardDialectText: listen.heardDialectText,
      heardMandarinMeaning: listen.heardMandarinMeaning,
      isValidAudio: listen.isValidAudio,
      validityDecision: listen.validityDecision,
      riskFlags: listen.riskFlags,
      genderGuess: listen.genderGuess,
      ageRangeGuess: listen.ageRangeGuess,
      confidence: listen.confidence,
    },
  };

  const promptLines = [
    template,
    "请检查：方言行规则、普通话翻译一致性、是否口语化、标点、正字表统一用字建议、说话人属性冲突。",
    "输出 JSON 字段：reviewConclusion, shouldReview, textRuleCheck, recommendations, confidence。",
    "reviewConclusion 只能是 pass|need_review|risky|uncertain。",
    "textRuleCheck 字段包含：dialectIssues, mandarinIssues, translationConsistencyIssues, punctuationIssues, speakerAttributeIssues, lexiconIssues, ruleIssues。",
    "recommendations 字段包含：dialectText, mandarinText, summary。",
    "不要默认推翻平台文本。没有明显问题时 recommendations 保持与平台文本一致。",
  ];

  if (lexiconText) {
    promptLines.push("客家话正字表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是客家话标注规则质检助手。只能输出 JSON，不能输出额外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_COMPARE_TEMPLATE,
  buildComparePrompt,
  buildListenPrompt,
};
