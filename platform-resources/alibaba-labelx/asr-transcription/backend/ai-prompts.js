"use strict";

const fs = require("fs");
const path = require("path");

const RULE_VERSION = "asr-transcription-ai-v1";
const RULE_FILE_PATH = path.join(__dirname, "..", "ai-rules.md");

const RULE_FALLBACK = [
  "# 阿里 LabelX ASR 转写 AI 推荐规则",
  "",
  "你是 ASR 转写辅助推荐模型。",
  "必须输出 JSON，字段为：",
  "decision(candidate_a|candidate_b|merged|uncertain|invalid_audio)",
  "recommendedText(string)",
  "confidence(0~1)",
  "reasonSummary(30字以内)",
  "riskFlags(string[])",
  "applyAdvice(manual_confirm)",
  "",
  "若音频不可访问或明显无效，decision=invalid_audio。",
  "AI 结果仅供人工参考，不自动保存、不自动提交。",
].join("\n");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function safeReadRules() {
  try {
    const content = fs.readFileSync(RULE_FILE_PATH, "utf8");
    const text = String(content || "").trim();
    return text || RULE_FALLBACK;
  } catch (error) {
    return RULE_FALLBACK;
  }
}

function buildAudioHintLines(audioCandidates) {
  const list = Array.isArray(audioCandidates) ? audioCandidates : [];
  if (list.length === 0) {
    return ["音频：未提供。仅做文本比较模式。"];
  }
  return list.map(function (item, index) {
    return (
      "音频" +
      String(index + 1) +
      "：id=" +
      normalizeText(item.id || "") +
      " format=" +
      normalizeText(item.format || "")
    );
  });
}

function buildTextCandidateLines(textCandidates) {
  const list = Array.isArray(textCandidates) ? textCandidates : [];
  if (list.length === 0) {
    return ["候选文本：未提供。"];
  }
  return list.map(function (item, index) {
    const candidateId = normalizeText(item.id || "") || String.fromCharCode(97 + index);
    const body = normalizeText(item.text || "");
    return "候选" + candidateId.toUpperCase() + "：" + (body || "<空>");
  });
}

function buildPrompt(request) {
  const rulesText = safeReadRules();
  const audioLines = buildAudioHintLines(request.audioCandidates);
  const textLines = buildTextCandidateLines(request.textCandidates);

  const systemPrompt = [
    "你是 Alibaba LabelX ASR 转写辅助模型。",
    "你只输出 JSON，不输出 Markdown。",
    "严格遵守 applyAdvice=manual_confirm。",
    "严格使用 decision 枚举：candidate_a,candidate_b,merged,uncertain,invalid_audio。",
    "以下是规则文档：",
    rulesText,
  ].join("\n");

  const userPrompt = [
    "请分析当前题并给出推荐。",
    "任务信息：",
    "taskItemId=" + normalizeText(request.taskItemId || ""),
    "itemIndex=" + String(Number(request.itemIndex || 0)),
    "projectName=" + normalizeText(request.projectName || ""),
    "",
    "音频信息：",
    audioLines.join("\n"),
    "",
    "文本候选：",
    textLines.join("\n"),
    "",
    "当前文本框内容：",
    normalizeText(request.currentText || "") || "<空>",
    "",
    "输出要求：",
    "- 只输出 JSON 对象",
    "- 不要输出多余字段",
    "- reasonSummary 简短中文",
    "- 不确定时使用 uncertain，并在 riskFlags 提示人工复核",
  ].join("\n");

  return {
    ruleVersion: RULE_VERSION,
    rulesText,
    systemPrompt,
    userPrompt,
  };
}

module.exports = {
  RULE_VERSION,
  RULE_FILE_PATH,
  buildPrompt,
};
