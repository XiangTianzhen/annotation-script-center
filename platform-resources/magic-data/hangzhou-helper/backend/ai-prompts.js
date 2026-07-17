"use strict";

const RULE_VERSION = "magic-data-hangzhou-helper-ai-review-v3-loose-pure-dialect";
const DEFAULT_LISTEN_TEMPLATE = [
  "你是杭州话音频辅助检查助手。",
  "听音结果只作为辅助证据，不作为平台文本自动替换依据。",
  "请优先判断音频有效性与风险，并辅助判断说话人属性。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字；只有命中杭州话词表统一用字时才保留该写法。",
  "严格输出 JSON，不输出 Markdown 或额外解释。",
].join("\n");
const DEFAULT_COMPARE_TEMPLATE = [
  "当前任务是杭州话三项预测质检，不是直接改写平台文本。",
  "请分别检查：说话人书写（性别/年龄/音频是否是纯方言）、杭州话内容、普通话文本。",
  "每项必须给出是否正确、平台值、建议值、原因、置信度。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字；只有命中杭州话词表统一用字时才保留该写法。",
  "严格输出 JSON，不输出额外解释。",
].join("\n");
const DEFAULT_OMNI_SINGLE_TEMPLATE = [
  "你要一次完成：听音 + 三项预测质检（说话人书写、杭州话内容、普通话文本）。",
  "平台已填内容是被检对象，音频实际发声优先。",
  "输出 JSON 字段必须包含 speakerCheck、dialectTextCheck、mandarinTextCheck、overall、heard。",
  "普通中文统一简体；命中词表建议用字优先保留。",
  "只输出 JSON，不输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_LISTEN_LEXICON_PROMPT = "请对照下方字词表，根据音频真实读音选择方言用字；即使语句不通顺也不要改写为普通话。音频证据优先，词表仅作参考，未命中时不得编造。";
const DEFAULT_REFINE_LEXICON_PROMPT = "请借助下方字词表理解方言词义，再结合完整语句整理对应的通顺普通话文本；不要把方言用字直接当作普通话照抄，不得改变原意。";
const DEFAULT_SINGLE_LEXICON_PROMPT = DEFAULT_LISTEN_LEXICON_PROMPT + " 同时请依据方言文本的完整语义整理通顺普通话，不要直接照抄方言用字。";

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
    request?.aiStages?.listen?.prompt || request?.aiOptions?.listenPrompt,
    DEFAULT_LISTEN_TEMPLATE
  );
  const lexiconEnabled = request?.aiStages?.listen?.lexicon?.enabled !== false;
  const lexiconText = lexiconEnabled ? getLexiconText(lexiconContext) : "";
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
    "请辅助判断说话人性别、年龄段，以及音频是否是纯方言；不确定时可输出 uncertain。",
    "音频是否是纯方言的判断口径要明显从宽：只要实际发声里出现明确杭州话/方言字词、方言读法或方言表达，就优先判为 纯方言。",
    "只有整段内容基本都是普通话表达、几乎没有方言字词或方言说法时，才判为 口音普通话。",
    "输出严格 JSON 字段：heardDialectText, heardMandarinMeaning, isValidAudio, validityDecision, invalidReasons, riskFlags, genderGuess, ageRangeGuess, pureDialectGuess, confidence。",
    "validityDecision 只能是 valid|invalid|uncertain。",
    "ageRangeGuess 只能是 0-5|6-12|13-18|19-25|26-36|37-50|51-65|65以上|uncertain。",
    "pureDialectGuess 只能是 纯方言|口音普通话|uncertain。",
    "heardDialectText 与 heardMandarinMeaning 中的普通中文必须使用简体，禁止输出 這/個/聽/講/說/學/競/賽/輔/導 等普通繁体字。",
  ];

  if (lexiconText) {
    promptLines.push(request?.aiStages?.listen?.lexicon?.prompt || DEFAULT_LISTEN_LEXICON_PROMPT);
    promptLines.push("杭州话词表上下文（仅提示，不做强替换）：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(meta, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是杭州话音频复核助手。严格输出 JSON，不要输出 Markdown，不要输出额外解释。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildComparePrompt(request, listen, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiStages?.refine?.prompt || request?.aiOptions?.comparePrompt,
    DEFAULT_COMPARE_TEMPLATE
  );
  const lexiconEnabled = request?.aiStages?.refine?.lexicon?.enabled !== false;
  const lexiconText = lexiconEnabled ? getLexiconText(lexiconContext) : "";
  const input = {
    reviewMode: request.reviewMode || "rule_first",
    rulesProfile: request.rulesProfile,
    platformBaseline: {
      dialectText: request.platformDialectText,
      mandarinText: request.platformMandarinText,
      gender: request?.speaker?.gender || "",
      ageRange: request?.speaker?.ageRange || "",
      pureDialect: request?.speaker?.pureDialect || "",
    },
    listenEvidence: {
      heardDialectText: listen.heardDialectText,
      heardMandarinMeaning: listen.heardMandarinMeaning,
      isValidAudio: listen.isValidAudio,
      validityDecision: listen.validityDecision,
      riskFlags: listen.riskFlags,
      genderGuess: listen.genderGuess,
      ageRangeGuess: listen.ageRangeGuess,
      pureDialectGuess: listen.pureDialectGuess,
      confidence: listen.confidence,
    },
  };

  const promptLines = [
    template,
    "输出结构必须包含：speakerCheck, dialectTextCheck, mandarinTextCheck, overall, heard。",
    "speakerCheck 中必须包含 gender、ageRange、pureDialect 三个对象，每个对象字段为：isCorrect, platformValue, suggestedValue, reason, confidence。",
    "dialectTextCheck / mandarinTextCheck 字段为：isCorrect, platformValue, suggestedValue, reason, confidence。",
    "overall 字段包含：reviewConclusion(pass|need_review|risky|invalid_audio), shouldReview, summary。",
    "heard 字段包含：heardDialectText, heardMandarinMeaning。",
    "不要默认推翻平台文本。没有明显问题时 suggestedValue 应保持与平台值一致。",
    "普通中文统一简体；禁止输出普通繁体字；命中词表建议用字优先保留。",
    "第二行普通话含义需与方言行含义一致；若无法确认请 shouldReview=true。",
    "纯方言判断口径从宽：只要音频里存在明确杭州话/方言字词、方言说法或方言发音证据，就应建议为 纯方言。",
    "只有整段几乎都在说普通话、没有明显方言表达时，才建议为 口音普通话。",
  ];

  if (lexiconText) {
    promptLines.push(request?.aiStages?.refine?.lexicon?.prompt || DEFAULT_REFINE_LEXICON_PROMPT);
    promptLines.push("杭州话词表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是杭州话标注规则质检助手。只能输出 JSON，不能输出额外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildOmniSinglePrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiStages?.single?.prompt || request?.aiOptions?.listenPrompt || request?.aiOptions?.comparePrompt,
    DEFAULT_OMNI_SINGLE_TEMPLATE
  );
  const lexiconEnabled = request?.aiStages?.single?.lexicon?.enabled !== false;
  const lexiconText = lexiconEnabled ? getLexiconText(lexiconContext) : "";
  const input = {
    rulesProfile: request.rulesProfile || "hangzhou",
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
    "1. 说话人书写需检查性别、年龄段、音频是否是纯方言；不确定时 isCorrect=null 且 shouldReview=true。",
    "1.1 纯方言判断口径从宽：只要出现明确杭州话/方言字词、方言说法或方言读法，就优先视为 纯方言；只有整段基本都是普通话时才视为 口音普通话。",
    "2. 如果实际发声与平台方言行一致，优先保留平台方言行。",
    "3. 如果实际发声明显不同，方言建议按实际发声输出。",
    "4. 第二行普通话含义必须与方言行含义一致；不确定时 shouldReview=true。",
    "5. 词表只用于字形选择，不用于无依据改写。",
    "6. 输出字段：speakerCheck / dialectTextCheck / mandarinTextCheck / overall / heard。",
    "7. overall.reviewConclusion 只能是 pass|need_review|risky|invalid_audio。",
    "8. 所有普通中文字段必须使用简体，禁止输出普通繁体字；只有命中词表统一用字时才保留。",
    "9. 只输出 JSON，不输出额外说明。",
  ];

  if (lexiconText) {
    promptLines.push(request?.aiStages?.single?.lexicon?.prompt || DEFAULT_SINGLE_LEXICON_PROMPT);
    promptLines.push("杭州话词表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是杭州话音频与文本复核助手。严格输出 JSON，不要输出 Markdown。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  DEFAULT_LISTEN_LEXICON_PROMPT,
  DEFAULT_REFINE_LEXICON_PROMPT,
  DEFAULT_SINGLE_LEXICON_PROMPT,
  buildComparePrompt,
  buildListenPrompt,
  buildOmniSinglePrompt,
};

