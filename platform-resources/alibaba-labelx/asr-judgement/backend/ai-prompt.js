"use strict";

const fs = require("fs");
const path = require("path");

const RULE_VERSION = "asr-judgement-ai-v2";
const AI_RESOURCE_DIR = path.join(__dirname, "..", "ai");
const RULES_PATH = path.join(AI_RESOURCE_DIR, "rules-v2.ai.md");
const LISTEN_TEMPLATE_PATH = path.join(AI_RESOURCE_DIR, "listen-prompt-template.md");
const COMPARE_TEMPLATE_PATH = path.join(AI_RESOURCE_DIR, "compare-prompt-template.md");

const FALLBACK_RULES_TEXT = [
  "# 阿里 LabelX ASR 快判 AI 规则（v2）",
  "",
  "1. 听音结果优先级最高。",
  "2. asrText1/asrText2 仅为候选。",
  "3. 上文只用于语义消歧，不能覆盖听音事实。",
  "4. 不确定时降低置信度并提示人工复核。",
  "5. 只输出 JSON，不输出 Markdown。",
].join("\n");

const FALLBACK_LISTEN_TEMPLATE = [
  "你是 ASR 快判听音模型。",
  "",
  "请只根据音频输出 JSON，字段必须包含：",
  "- heardText: string",
  "- confidence: 0~1",
  "- isValidAudio: boolean",
  "- invalidReasons: string[]",
  "- uncertainParts: string[]",
  "- audioNotes: string（可选，20字以内）",
  "",
  "若音频无效、不可访问、无语音或严重噪音，请 isValidAudio=false，并给出 invalidReasons。",
  "不要输出 JSON 之外内容。",
].join("\n");

const FALLBACK_COMPARE_TEMPLATE = [
  "你是 ASR 快判比较模型。",
  "",
  "请结合听音结果和候选文本判断哪个更优。",
  "输出 JSON 字段：",
  "- answer: first_better|second_better|both_bad|uncertain_or_similar|other_dialect_or_language",
  "- confidence: 0~1",
  "- reasonSummary: 30字以内",
  "- riskLevel: low|medium|high",
  "- needManualSearch: boolean",
  "- shouldWarnBeforeApply: boolean",
  "- contextUsed: boolean",
  "- evidence: { heardText, asrText1Match, asrText2Match, contextHint }",
  "",
  "注意：上文只能用于消歧，不能覆盖音频听感。",
  "当两条文本主体语义一致时，不要默认 uncertain_or_similar。",
  "若仅在标点、空格、数字/日期格式上有明显优劣，应选择更规范的一条：",
  "- asrText1 更规范 -> first_better",
  "- asrText2 更规范 -> second_better",
  "只有格式差异轻微且无明显优劣时，才允许 uncertain_or_similar。",
  "不要输出 JSON 之外内容。",
].join("\n");

const cache = {
  rulesText: null,
  listenTemplateText: null,
  compareTemplateText: null,
};

function readUtf8FileOrFallback(filePath, fallbackText) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    const trimmed = String(text || "").trim();
    return trimmed || fallbackText;
  } catch (error) {
    return fallbackText;
  }
}

function loadRulesText() {
  if (typeof cache.rulesText === "string") {
    return cache.rulesText;
  }
  cache.rulesText = readUtf8FileOrFallback(RULES_PATH, FALLBACK_RULES_TEXT);
  return cache.rulesText;
}

function loadListenTemplateText() {
  if (typeof cache.listenTemplateText === "string") {
    return cache.listenTemplateText;
  }
  cache.listenTemplateText = readUtf8FileOrFallback(
    LISTEN_TEMPLATE_PATH,
    FALLBACK_LISTEN_TEMPLATE
  );
  return cache.listenTemplateText;
}

function loadCompareTemplateText() {
  if (typeof cache.compareTemplateText === "string") {
    return cache.compareTemplateText;
  }
  cache.compareTemplateText = readUtf8FileOrFallback(
    COMPARE_TEMPLATE_PATH,
    FALLBACK_COMPARE_TEMPLATE
  );
  return cache.compareTemplateText;
}

function buildListenPrompt(request) {
  const template = loadListenTemplateText();
  const inputJson = {
    projectId: String(request?.projectId || ""),
    subTaskId: String(request?.subTaskId || ""),
    itemId: String(request?.itemId || ""),
    itemIndex: Number(request?.itemIndex || 0),
    audioUrlAvailable: Boolean(request?.audioUrl),
  };

  const userPrompt = [
    "ruleVersion: " + RULE_VERSION,
    "",
    "规则：",
    loadRulesText(),
    "",
    template,
    "",
    "输入摘要：",
    JSON.stringify(inputJson, null, 2),
  ].join("\n");

  return {
    systemPrompt:
      "你是 Alibaba LabelX ASR 快判听音助手。只输出 JSON，不要输出 JSON 以外文本。",
    userPrompt,
    ruleVersion: RULE_VERSION,
  };
}

function buildComparePrompt(request, listen) {
  const template = loadCompareTemplateText();
  const includeContext = request?.includeContext === true && request?.contextAvailable === true;
  const inputJson = {
    asrText1: String(request?.asrText1 || ""),
    asrText2: String(request?.asrText2 || ""),
    heardText: String(listen?.heardText || ""),
    listenConfidence: Number(listen?.confidence || 0),
    isValidAudio: listen?.isValidAudio !== false,
    invalidReasons: Array.isArray(listen?.invalidReasons) ? listen.invalidReasons : [],
    includeContext: includeContext,
    contextText: includeContext ? String(request?.contextText || "") : "",
  };

  const userPrompt = [
    "ruleVersion: " + RULE_VERSION,
    "",
    "规则：",
    loadRulesText(),
    "",
    template,
    "",
    "输入：",
    JSON.stringify(inputJson, null, 2),
  ].join("\n");

  return {
    systemPrompt:
      "你是 Alibaba LabelX ASR 快判比较助手。只输出 JSON，不要输出 JSON 以外文本。",
    userPrompt,
    ruleVersion: RULE_VERSION,
  };
}

module.exports = {
  AI_RESOURCE_DIR,
  RULES_PATH,
  LISTEN_TEMPLATE_PATH,
  COMPARE_TEMPLATE_PATH,
  RULE_VERSION,
  buildListenPrompt,
  buildComparePrompt,
  loadRulesText,
};
