"use strict";

const fs = require("fs");
const path = require("path");

const AI_RESOURCE_DIR = path.join(__dirname, "..", "ai");
const RULES_PATH = path.join(AI_RESOURCE_DIR, "rules.ai.md");
const TEMPLATE_PATH = path.join(AI_RESOURCE_DIR, "prompt-template.md");
const FEWSHOT_PATH = path.join(AI_RESOURCE_DIR, "fewshot-examples.json");

const cache = {
  rulesText: null,
  templateText: null,
  fewshotExamples: null,
};

function readUtf8File(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadRulesText() {
  if (typeof cache.rulesText === "string") {
    return cache.rulesText;
  }
  cache.rulesText = readUtf8File(RULES_PATH).trim();
  return cache.rulesText;
}

function loadTemplateText() {
  if (typeof cache.templateText === "string") {
    return cache.templateText;
  }
  cache.templateText = readUtf8File(TEMPLATE_PATH).trim();
  return cache.templateText;
}

function loadFewshotExamples() {
  if (Array.isArray(cache.fewshotExamples)) {
    return cache.fewshotExamples;
  }
  const rawText = readUtf8File(FEWSHOT_PATH);
  const parsed = JSON.parse(rawText);
  cache.fewshotExamples = Array.isArray(parsed) ? parsed : [];
  return cache.fewshotExamples;
}

function buildPrompt(request) {
  const ruleVersion = String(request?.ruleVersion || "asr-judgement-ai-v1");
  const rulesText = loadRulesText();
  const templateText = loadTemplateText();
  const fewshotExamples = loadFewshotExamples();
  const inputJson = {
    asrText1: String(request?.asrText1 || ""),
    asrText2: String(request?.asrText2 || ""),
  };

  const userPrompt = templateText
    .replace(/\{\{ruleVersion\}\}/g, ruleVersion)
    .replace(/\{\{rules\}\}/g, rulesText)
    .replace(/\{\{fewshots\}\}/g, JSON.stringify(fewshotExamples, null, 2))
    .replace(/\{\{inputJson\}\}/g, JSON.stringify(inputJson, null, 2));

  return {
    systemPrompt:
      "你是 Alibaba LabelX ASR 快判辅助模型。只输出 JSON，不要输出 JSON 以外文本。",
    userPrompt,
    ruleVersion,
  };
}

module.exports = {
  AI_RESOURCE_DIR,
  RULES_PATH,
  TEMPLATE_PATH,
  FEWSHOT_PATH,
  buildPrompt,
  loadFewshotExamples,
  loadRulesText,
  loadTemplateText,
};
