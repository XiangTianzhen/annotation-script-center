"use strict";

const RULE_VERSION = "magic-data-minnan-helper-ai-review-v1";
const DEFAULT_LISTEN_TEMPLATE = [
  "你是闽南语音频辅助检查助手。",
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
const DEFAULT_OMNI_SINGLE_TEMPLATE = [
  "你要一次完成：听音、复核平台两行文本、给出最终建议。",
  "平台两行文本只作为参考，实际发声优先。",
  "输出 JSON 字段必须包含 reviewConclusion、shouldReview、audioCheck、textRuleCheck、recommendations。",
  "普通中文统一简体；命中词表建议用字必须保留。",
  "只输出 JSON，不输出 Markdown 或解释文字。",
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
    promptLines.push("闽南语词表上下文（仅提示，不做强替换）：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(meta, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是闽南语音频复核助手。严格输出 JSON，不要输出 Markdown，不要输出额外解释。",
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
    "普通中文统一简体；命中词表建议用字必须保留。",
    "第二行普通话含义需与方言行含义一致；若无法确认请 shouldReview=true。",
  ];

  if (lexiconText) {
    promptLines.push("闽南语词表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是闽南语标注规则质检助手。只能输出 JSON，不能输出额外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildOmniSinglePrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt || request?.aiOptions?.comparePrompt,
    DEFAULT_OMNI_SINGLE_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
  const input = {
    rulesProfile: request.rulesProfile || "minnan",
    projectName: request.projectName || "",
    speaker: request.speaker || {},
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
    platformDialectText: request.platformDialectText,
    platformMandarinText: request.platformMandarinText,
  };
  const promptLines = [
    template,
    "规则：",
    "1. 如果实际发声与平台方言行一致，优先保留平台方言行。",
    "2. 如果实际发声明显不同，方言建议按实际发声输出。",
    "3. 第二行普通话含义必须与方言行含义一致；不确定时 shouldReview=true。",
    "4. 词表只用于字形选择，不用于无依据改写。",
    "5. 输出字段：",
    "   reviewConclusion: pass|need_review|risky|uncertain",
    "   shouldReview: boolean",
    "   audioCheck: isValidAudio/heardDialectText/heardMandarinMeaning/riskFlags/invalidReasons/genderGuess/ageRangeGuess/confidence",
    "   textRuleCheck: dialectIssues/mandarinIssues/translationConsistencyIssues/lexiconIssues/ruleIssues",
    "   recommendations: dialectText/mandarinText/summary",
    "6. 只输出 JSON，不输出额外说明。",
  ];

  if (lexiconText) {
    promptLines.push("闽南语词表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是闽南语音频与文本复核助手。严格输出 JSON，不要输出 Markdown。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  buildComparePrompt,
  buildListenPrompt,
  buildOmniSinglePrompt,
};
