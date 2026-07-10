"use strict";

const RULE_VERSION = "magic-data-hangzhou-helper-ai-review-v4-audio-first-lexicon-direction";
const DEFAULT_LISTEN_TEMPLATE = [
  "你是杭州话音频辅助检查助手。",
  "本阶段是盲听阶段，只根据音频实际发声记录杭州话文本。",
  "请优先判断音频有效性与风险，并辅助判断说话人属性。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字。",
  "严格输出 JSON，不输出 Markdown 或额外解释。",
].join("\n");
const DEFAULT_COMPARE_TEMPLATE = [
  "当前任务是杭州话三项预测质检，不是直接改写平台文本。",
  "请分别检查：说话人书写（性别/年龄/音频是否是纯方言）、杭州话内容、普通话文本。",
  "每项必须给出是否正确、平台值、建议值、原因、置信度。",
  "词表只用于已听出杭州话词形的规范字形和普通话释义，不得依据普通话含义反推杭州话文本。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字；只有实际听到并命中杭州话词形时才保留词表统一用字。",
  "严格输出 JSON，不输出额外解释。",
].join("\n");
const DEFAULT_OMNI_SINGLE_TEMPLATE = [
  "你要一次完成：听音 + 三项预测质检（说话人书写、杭州话内容、普通话文本）。",
  "平台已填内容是被检对象，音频实际发声优先。",
  "输出 JSON 字段必须包含 speakerCheck、dialectTextCheck、mandarinTextCheck、overall、heard。",
  "普通中文统一简体；命中词表建议用字优先保留。",
  "只输出 JSON，不输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_RECOGNITION_CONVERT_LISTEN_TEMPLATE = [
  "你是杭州话音频识别助手。",
  "请先把杭州话语音识别为普通话表达，不要直接生成杭州话字形。",
  "输出仅用于后续词表转换和三项质检。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字。",
  "严格输出 JSON，不输出 Markdown 或额外解释。",
].join("\n");
const DEFAULT_RECOGNITION_CONVERT_COMPARE_TEMPLATE = [
  "当前任务是识别转换 + 三项预测质检。",
  "先基于识别到的普通话文本，结合词表和平台上下文，生成建议杭州话文本。",
  "命中词表的杭州话建议用字优先保留词表写法，不强制繁体。",
  "词表未覆盖时不要强行转换为生僻杭州字，可保留稳妥表达并标记待人工复核。",
  "所有普通中文字段一律输出简体中文，禁止输出普通繁体字；只有命中杭州话词表统一用字时才保留该写法。",
  "再检查三项：说话人属性、杭州话内容、普通话文本。",
  "严格输出 JSON，不输出 Markdown 或额外解释。",
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

function buildListenPrompt(request) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_LISTEN_TEMPLATE
  );
  const meta = {
    taskItemId: request.taskItemId,
    samplingRecordId: request.samplingRecordId,
    projectName: request.projectName,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
  };

  const promptLines = [
    template,
    "只根据音频实际发声记录杭州话文本，不参考平台已填杭州话、平台普通话、说话人已有值或词表。",
    "杭州话原文以读音为主：听到什么写什么，不要把听到的普通话表达替换成含义相同的杭州话词。",
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
    "证据优先级固定为：音频实际发声 > 听音杭州话文本 > 平台文本。平台文本只是被检对象，不能覆盖听音证据。",
    "词表只能从已听出的杭州话词形查普通话释义，禁止从 platformMandarinText、heardMandarinMeaning 或其他普通话含义反推杭州话词形。",
    "音频听到“现在”时，杭州话文本必须保留“现在”，不得仅因词表中“现在”对应“葛毛”而改成“葛毛”。",
    "只有实际听到对应杭州话读音并命中杭州话词形时，才允许采用“葛毛”等词表规范字形。",
    "不要默认推翻平台文本。没有明显问题时 suggestedValue 应保持与平台值一致。",
    "普通中文统一简体；禁止输出普通繁体字；有听音词形证据时才优先保留词表建议用字。",
    "第二行普通话含义需与方言行含义一致；若无法确认请 shouldReview=true。",
    "纯方言判断口径从宽：只要音频里存在明确杭州话/方言字词、方言说法或方言发音证据，就应建议为 纯方言。",
    "只有整段几乎都在说普通话、没有明显方言表达时，才建议为 口音普通话。",
  ];

  if (lexiconText) {
    promptLines.push("杭州话转普通话词表上下文（仅由听音杭州话词形命中）：", lexiconText);
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
    request?.aiOptions?.listenPrompt || request?.aiOptions?.comparePrompt,
    DEFAULT_OMNI_SINGLE_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
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
    promptLines.push("杭州话词表上下文：", lexiconText);
  }

  promptLines.push("输入信息：", JSON.stringify(input, null, 2));

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是杭州话音频与文本复核助手。严格输出 JSON，不要输出 Markdown。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildRecognitionConvertListenPrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_RECOGNITION_CONVERT_LISTEN_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
  const input = {
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
    "先判断音频是否有效，再输出识别到的普通话文本。",
    "JSON 必须包含字段：recognizedMandarinText, isValidAudio, validityDecision, invalidReasons, riskFlags, genderGuess, ageRangeGuess, pureDialectGuess, confidence。",
    "validityDecision 只能是 valid|invalid|uncertain。",
    "genderGuess 只能是 男|女|uncertain。",
    "ageRangeGuess 只能是 0-5|6-12|13-18|19-25|26-36|37-50|51-65|65以上|uncertain。",
    "纯方言判断口径从宽：只要音频里能听到明确方言表达、方言词或方言读法，就判为 纯方言；只有整段几乎都是普通话表达时才判为 口音普通话。",
    "pureDialectGuess 只能是 纯方言|口音普通话|uncertain。",
    "recognizedMandarinText 必须使用简体中文，禁止输出普通繁体字。",
  ];
  if (lexiconText) {
    promptLines.push("词表上下文（仅辅助理解，不要求在本阶段输出杭州话）：", lexiconText);
  }
  promptLines.push("输入信息：", JSON.stringify(input, null, 2));
  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是杭州话语音识别助手。严格输出 JSON，不要输出 Markdown，不要输出额外解释。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildRecognitionConvertComparePrompt(request, context) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.comparePrompt,
    DEFAULT_RECOGNITION_CONVERT_COMPARE_TEMPLATE
  );
  const lexiconText = getLexiconText(context?.lexiconContext);
  const input = {
    rulesProfile: request.rulesProfile || "hangzhou",
    recognizedMandarinText: context?.recognizedMandarinText || "",
    convertedDialectText: context?.convertedDialectText || "",
    platformBaseline: {
      dialectText: request.platformDialectText || "",
      mandarinText: request.platformMandarinText || "",
      gender: request?.speaker?.gender || "",
      ageRange: request?.speaker?.ageRange || "",
      pureDialect: request?.speaker?.pureDialect || "",
    },
    listenEvidence: context?.listenEvidence || {},
    lexiconMatches: Array.isArray(context?.lexiconMatches) ? context.lexiconMatches : [],
  };
  const promptLines = [
    template,
    "输出结构必须包含：speakerCheck, dialectTextCheck, mandarinTextCheck, overall, heard。",
    "speakerCheck 内必须有 gender、ageRange、pureDialect，字段：isCorrect, platformValue, suggestedValue, reason, confidence。",
    "dialectTextCheck / mandarinTextCheck 字段：isCorrect, platformValue, suggestedValue, reason, confidence。",
    "overall 字段：reviewConclusion(pass|need_review|risky|invalid_audio), shouldReview, summary。",
    "heard 字段：heardDialectText, heardMandarinMeaning。",
    "同时输出 recognizedMandarinText, convertedDialectText, lexiconMatches, conversionWarnings。",
    "命中词表的杭州话建议用字优先保留词表写法，不强制繁体。",
    "所有普通中文字段必须使用简体中文，禁止输出普通繁体字；只有命中词表统一用字时才保留。",
    "词表找不到对应写法时不要编造冷门杭州字，保守输出并在 conversionWarnings 标记 needHumanReview=true。",
    "不要为了更像杭州话而无依据改写，普通话文本与杭州话文本必须语义一致。",
    "纯方言判断口径从宽：只要音频证据里出现明确方言字词、方言说法或方言发音，就建议为 纯方言；只有整段几乎都是普通话时，才建议为 口音普通话。",
  ];
  if (lexiconText) {
    promptLines.push("杭州话词表上下文：", lexiconText);
  }
  promptLines.push("输入信息：", JSON.stringify(input, null, 2));
  return {
    ruleVersion: RULE_VERSION,
    systemPrompt: "你是杭州话识别转换质检助手。只能输出 JSON，不能输出额外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  DEFAULT_RECOGNITION_CONVERT_LISTEN_TEMPLATE,
  DEFAULT_RECOGNITION_CONVERT_COMPARE_TEMPLATE,
  buildComparePrompt,
  buildListenPrompt,
  buildOmniSinglePrompt,
  buildRecognitionConvertListenPrompt,
  buildRecognitionConvertComparePrompt,
};

