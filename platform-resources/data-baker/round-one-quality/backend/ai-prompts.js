"use strict";

const RULE_VERSION = "data-baker-round-one-quality-ai-v1";
const DEFAULT_LISTEN_TEMPLATE = [
  "请听音频并输出本句话实际发声文本。",
  "页面候选文本只作为参考，实际发声优先。",
  "不要自动改成普通话含义，不要因为词表存在就强行改写。",
  "heardText 的普通中文字符统一使用简体中文；若听到的是繁体对应的普通中文，也输出简体。",
  "但命中闽南方言词表（minnan-lexicon.csv）的建议用字属于保留项，不参与普通简繁转换。",
  "词表建议用字优先级高于普通简繁转换，不要因为简繁转换改变实际发声含义。",
  "只输出 JSON，字段为 heardText、confidence、isValid、invalidReasons。",
].join("\n");
const DEFAULT_COMPARE_TEMPLATE = [
  "请比较页面候选文本和 AI 听音文本，生成单条 AI 推荐文本。",
  "以实际发声为主，不因词表存在就无依据改写。",
  "recommendedText 的普通中文字符统一使用简体中文；pageText/heardText 中的普通繁体字应转换为简体。",
  "但命中 minnan-lexicon.csv 的建议用字必须保持不变，不参与普通简繁转换。",
  "词表建议用字优先于普通简繁转换，不要把方言建议用字改回普通话同义词。",
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

function buildListenPrompt(request, lexiconContext) {
  const template = normalizePromptTemplate(
    request?.aiOptions?.listenPrompt,
    DEFAULT_LISTEN_TEMPLATE
  );
  const meta = {
    sentenceNumber: request.sentenceNumber,
    readRequire: request.readRequire,
    pageText: request.pageText,
    effectiveStartTime: request.effectiveStartTime,
    effectiveEndTime: request.effectiveEndTime,
    effectiveTime: request.effectiveTime,
    audioDuration: request.audioDuration,
  };

  const lexiconText = getLexiconText(lexiconContext);
  const promptLines = [
    template,
    "对“的/诶”“很/真”“喜欢/欢喜”“这位/即个”“我/阮”“你/汝”“他/伊”等易混词必须按实际发声判断。",
  ];

  if (lexiconText) {
    promptLines.push(
      "以下是官方闽南方言字词表上下文：",
      lexiconText,
      "词表使用规则：",
      "1. 如果实际发声明显符合建议用字，请优先使用建议用字。",
      "2. 如果实际发声就是普通话词，不要因为词表存在就强行改写。",
      "3. 例如听到“伊”写“伊”，听到“你”写“你”；听到“诶”写“诶”，听到“的”写“的”。",
      "4. 词表建议用字不参与普通简繁转换；命中后按词表建议用字保留。"
    );
  }

  promptLines.push(
    "如果音频无效、无法听清或无法判断，请 isValid=false 并给出 invalidReasons。",
    "只输出 JSON，字段为 heardText、confidence、isValid、invalidReasons。",
    "输入元信息：",
    JSON.stringify(meta, null, 2)
  );

  return {
    ruleVersion: RULE_VERSION,
    systemPrompt:
      "你是 DataBaker 质检听音助手。只根据实际音频发声输出 JSON，不要输出 Markdown 或 JSON 以外文本。",
    userPrompt: promptLines.join("\n"),
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
    "8. 对“的/诶”“很/真”“喜欢/欢喜”“这位/即个”“我/阮”“你/汝”“他/伊”等要按实际发声判断。",
  ];

  if (lexiconText) {
    promptLines.push(
      "以下是官方闽南方言字词表上下文：",
      lexiconText,
      "词表使用规则：",
      "1. 推荐文本以实际发声为主。",
      "2. 词表用于选择字形，不用于无依据改写。",
      "3. 如果听音文本命中词表建议用字，优先保留。",
      "4. 如果听音文本明显被页面文本保守覆盖，要按听音文本和词表修正。",
      "5. recommendedText 最终应对普通中文做简体化，但词表建议用字是保留项，不能被普通简繁转换覆盖。",
      "6. 如果听音文本命中词表建议用字，应先保留词表建议用字，再处理其他普通繁体字为简体。"
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
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_COMPARE_TEMPLATE,
  buildComparePrompt,
  buildListenPrompt,
};
