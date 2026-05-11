"use strict";

const RULE_VERSION = "magic-data-annotator-ai-review-v1";

function getLexiconText(lexiconContext) {
  return String(lexiconContext?.text || "").trim();
}

function buildListenPrompt(request, lexiconContext) {
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
    "请仅根据音频判断实际发声内容。",
    "平台文本只作参考，不得机械抄写。",
    "不要因为词表存在就强行改写。",
    "输出 JSON 字段：heardDialectText, heardMandarinMeaning, isValidAudio, invalidReasons, riskFlags, confidence。",
    "风险标记可从以下集合选择：无有效人声、噪音、方言区域错误、切音、多人重叠、听不清、非方言、敏感数据、机器合成音。",
  ];

  if (lexiconText) {
    promptLines.push("以下是客家话正字表上下文（仅作提示，不做强替换）：", lexiconText);
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
  const lexiconText = getLexiconText(lexiconContext);
  const input = {
    rulesProfile: request.rulesProfile,
    platformDialectText: request.platformDialectText,
    platformMandarinText: request.platformMandarinText,
    heardDialectText: listen.heardDialectText,
    heardMandarinMeaning: listen.heardMandarinMeaning,
    isValidAudio: listen.isValidAudio,
    riskFlags: listen.riskFlags,
  };

  const promptLines = [
    "请比较平台两行文本与 AI 听音结果，输出复核结论。",
    "结论字段 verdict 仅可用：same, mostly_same, different, uncertain, invalid_audio。",
    "平台预测准确时应保留平台文本，不要默认推翻。",
    "第一行是方言转写，第二行是普通话翻译，语义必须一致且口语化。",
    "词表只用于提示统一用字，不做强替换。",
    "输出 JSON 字段：verdict, shouldReview, dialectLine, mandarinLine, lexiconIssues, ruleIssues, confidence。",
    "dialectLine 字段：decision, platformText, aiText, recommendedText, issues。",
    "mandarinLine 字段：decision, platformText, recommendedText, issues。",
  ];

  if (lexiconText) {
    promptLines.push("客家话正字表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是客家话标注复核助手。只能输出 JSON，不能输出多余文本。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  buildComparePrompt,
  buildListenPrompt,
};
