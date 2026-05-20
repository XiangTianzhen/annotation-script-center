"use strict";

const RULE_VERSION = "data-baker-round-one-quality-ai-v3-omni-default-python-funasr";
const DEFAULT_OMNI_SINGLE_TEMPLATE = [
  "你要一次完成：听音、对比页面候选文本、输出最终推荐文本。",
  "页面候选文本只作为参考，实际发声优先。",
  "输出 JSON 字段必须包含 recommendedText、heardText、decision、changePoints、confidence、needHumanReview。",
  "recommendedText 与 heardText 的普通中文统一输出简体；命中 minnan-lexicon.csv 的建议用字必须保留。",
  "不要把方言建议用字改回普通话同义词。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_OMNI_LISTEN_TEMPLATE = [
  "你只负责听音转写，不负责生成最终推荐文本。",
  "页面候选文本、朗读要求和有效时间只用于辅助你更稳定地识别音频内容。",
  "输出 JSON 字段必须包含 heardText、confidence、needHumanReview。",
  "heardText 的普通中文统一输出简体。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_COMPARE_TEMPLATE = [
  "听音阶段已经完成音频转写；你现在只负责比较 heardText 与页面候选文本，输出最终推荐文本。",
  "以实际发声为主，不因词表存在就无依据改写。",
  "recommendedText 的普通中文统一使用简体；pageText/heardText 中的普通繁体字应转换为简体。",
  "但命中 minnan-lexicon.csv 的建议用字必须保持不变，不参与普通简繁转换。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
  "只输出 JSON，不输出额外解释。",
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

function buildOmniSinglePrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_OMNI_SINGLE_TEMPLATE
  );
  const lexiconText = getLexiconText(lexiconContext);
  const input = {
    pageText: request.pageText,
    readRequire: request.readRequire,
    sentenceNumber: request.sentenceNumber,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
  };
  const promptLines = [
    template,
    "规则：",
    "1. 一个请求完成听音 + 对比 + 推荐文本，不要要求第二个模型继续判断。",
    "2. 页面候选文本只是参考，实际发声优先。",
    "3. 不自动改成普通话含义，不因为词表存在就强行改写。",
    "4. 如果实际发声和页面候选文本一致，recommendedText 保留页面候选文本。",
    "5. 如果实际发声明显不同，recommendedText 按实际发声输出。",
    "6. 对‘的/诶’‘很/真’‘喜欢/欢喜’‘这位/即个’‘我/阮’‘你/汝’‘他/伊’等易混词必须按实际发声判断。",
    "7. confidence 取 0 到 1；无法完全确认时 needHumanReview=true。",
    "8. changePoints 可写字符串数组或对象数组；推荐至少说明页面文本与听到文本的关键差异。",
  ];
  if (lexiconText) {
    promptLines.push(
      "以下是官方闽南方言字词表上下文：",
      lexiconText,
      "词表使用规则：",
      "1. 词表只用于选择字形，不用于无依据改写。",
      "2. 如果实际发声明显符合建议用字，请优先使用建议用字。",
      "3. 如果实际发声就是普通话词，不要因为词表存在就强行改写。",
      "4. 命中词表建议用字后，后端仍会做普通中文简体归一化，但不会覆盖词表建议用字。"
    );
  }
  promptLines.push(
    "输出 JSON 字段：recommendedText、heardText、decision、changePoints、confidence、needHumanReview。",
    "decision 可用值建议：keep_page_text、use_heard_text、minor_edit、uncertain。",
    "输入：",
    JSON.stringify(input, null, 2)
  );
  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是 DataBaker 质检推荐助手。你会接收音频和页面上下文，必须只输出 JSON，不要输出 Markdown 或 JSON 以外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

function buildOmniListenPrompt(request) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_OMNI_LISTEN_TEMPLATE
  );
  const input = {
    pageText: request.pageText,
    readRequire: request.readRequire,
    sentenceNumber: request.sentenceNumber,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
  };
  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是 DataBaker 听音助手。你会接收音频和页面上下文，必须只输出 JSON，不要输出 Markdown 或 JSON 以外文本。",
    userPrompt: [
      template,
      "规则：",
      "1. 你只负责输出 heardText，不负责生成 recommendedText。",
      "2. pageText 只是辅助，不要机械照抄页面文本。",
      "3. 以实际发声为主；听不清时 needHumanReview=true。",
      "4. confidence 取 0 到 1。",
      "5. 输出 JSON 字段：heardText、confidence、needHumanReview。",
      "输入：",
      JSON.stringify(input, null, 2),
    ].join("\n"),
  };
}

function buildComparePrompt(request, heardText, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.comparePrompt,
    DEFAULT_COMPARE_TEMPLATE
  );
  const input = {
    pageText: request.pageText,
    heardText,
    readRequire: request.readRequire,
    sentenceNumber: request.sentenceNumber,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
  };
  const lexiconText = getLexiconText(lexiconContext);
  const promptLines = [
    template,
    "规则：",
    "1. 以实际发声为主。",
    "2. 页面候选文本只是参考。",
    "3. 不自动改成普通话含义。",
    "4. 不因为词表存在就强行改写。",
    "5. 如果实际发声和页面候选文本一致，recommendedText 保留页面候选文本。",
    "6. 如果实际发声明显不同，recommendedText 按实际发声输出。",
    "7. 只生成推荐文本，不自动提交。",
    "8. 对‘的/诶’‘很/真’‘喜欢/欢喜’‘这位/即个’‘我/阮’‘你/汝’‘他/伊’等要按实际发声判断。",
  ];
  if (lexiconText) {
    promptLines.push(
      "以下是官方闽南方言字词表上下文：",
      lexiconText,
      "词表使用规则：",
      "1. 推荐文本以实际发声为主。",
      "2. 词表用于选择字形，不用于无依据改写。",
      "3. 如果 heardText 命中词表建议用字，优先保留。",
      "4. 如果 heardText 明显被页面文本保守覆盖，要按 heardText 和词表修正。",
      "5. recommendedText 最终应对普通中文做简体化，但词表建议用字是保留项，不能被普通简繁转换覆盖。"
    );
  }
  promptLines.push(
    "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
    "decision 可用值建议：keep_page_text、use_heard_text、minor_edit、uncertain。",
    "输入：",
    JSON.stringify(input, null, 2)
  );
  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是 DataBaker 质检文本复核助手。只输出 JSON，不要输出 Markdown 或 JSON 以外文本。",
    userPrompt: promptLines.join("\n"),
  };
}

module.exports = {
  RULE_VERSION,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_OMNI_LISTEN_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  buildComparePrompt,
  buildOmniListenPrompt,
  buildOmniSinglePrompt,
};
