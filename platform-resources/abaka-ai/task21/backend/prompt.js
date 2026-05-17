"use strict";

const TASK21_AI_RULE_VERSION = "abaka-task21-ai-v2-two-stage";

const TASK21_RULES = [
  "Task21 流程：先判 same_font，再决定是否继续后两个字段。",
  "same_font=false 或 unsure 时，image_b_texts_removed 与 other_changes 返回 not_applicable。",
  "same_font=true 或 same underlying font+artistic effect 时，继续分析后两个字段。",
  "same_font 判断字体集合是否一致：typeface + weight + style，忽略文本内容/颜色/字号/位置/大小写。",
  "image_b_texts_removed 只记录 image_b 中存在、image_b_removed 中消失的可识别文本，禁止写入其他视觉变化。",
  "other_changes 仅描述除文本删除外的变化，并且必须用英文，表达为对 image_b_removed 的操作以得到 image_b。",
  "other_changes 最多 40 词，建议 30 词以内，必要时可用 unsure。",
].join("\n");

const SINGLE_MODEL_SYSTEM_PROMPT = [
  "你是 Abaka AI Task21 文本移除任务的视觉标注审核助手。",
  "你会同时看图并按 Task21 规则输出最终结构化建议。",
  "你只提供辅助判断，不自动保存、不自动提交。",
  "输出必须是合法 JSON，不要输出 Markdown，不要输出额外解释。",
].join("\n");

const VISION_EXTRACT_SYSTEM_PROMPT = [
  "你是 Task21 视觉事实提取器。",
  "你只负责看图提取可见事实，不做最终标注判断。",
  "你不得输出 same_font 最终值，不得输出最终 image_b_texts_removed 或 other_changes。",
  "输出必须是 JSON，且只能包含可见证据，不得编造不可见文本。",
].join("\n");

const REASONING_DECIDE_SYSTEM_PROMPT = [
  "你是 Task21 规则判断器。",
  "你不看图片，只根据 Task21 规则与视觉观察事实输出最终建议。",
  "你必须严格区分 same_font、image_b_texts_removed、other_changes。",
  "输出必须是合法 JSON，不要输出 Markdown，不要输出额外解释。",
].join("\n");

const FINAL_OUTPUT_SCHEMA_TEXT = [
  "{",
  '  "target": "same_font | image_b_texts_removed | other_changes | overall",',
  '  "same_font": {',
  '    "applicable": true,',
  '    "value": "true | false | unsure | same underlying font+artistic effect | not_applicable",',
  '    "confidence": 0.0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "image_b_texts_removed": {',
  '    "applicable": true,',
  '    "value_type": "true | list | blank | not_applicable",',
  '    "value": "true 或多行文本或空字符串",',
  '    "lines": [],',
  '    "segment_count": 0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "other_changes": {',
  '    "applicable": true,',
  '    "value_type": "text | blank | unsure | not_applicable",',
  '    "value": "英文描述或空字符串或 unsure",',
  '    "word_count": 0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "workflow": {',
  '    "skip_later_fields": false,',
  '    "skip_reason": ""',
  "  }",
  "}",
].join("\n");

const VISUAL_OBSERVATION_SCHEMA_TEXT = [
  "{",
  '  "target": "same_font | image_b_texts_removed | other_changes | overall",',
  '  "visual_observations": {',
  '    "image_a_text_regions": [],',
  '    "image_b_text_regions": [],',
  '    "font_evidence": [],',
  '    "font_similarity_observations": [],',
  '    "deleted_text_candidates": [],',
  '    "other_visual_change_candidates": [],',
  '    "uncertainties": []',
  "  }",
  "}",
].join("\n");

function safeJsonText(value) {
  return JSON.stringify(value === undefined ? null : value, null, 2);
}

function buildCommonInputBlock(input) {
  const payload = input && typeof input === "object" ? input : {};
  return {
    target: payload.target || "overall",
    image_a_texts: payload.context?.imageATexts || "",
    image_b_texts: payload.context?.imageBTexts || "",
    text_positions: payload.context?.textPositions || {},
    current_page_values: payload.context?.currentValues || {},
  };
}

function buildSingleModelUserPrompt(input) {
  const source = buildCommonInputBlock(input);
  return [
    "请按 Task21 规则输出最终标注建议。",
    TASK21_RULES,
    "补充约束：",
    "- same_font 的 value 必须使用页面选项原文。",
    "- image_b_texts_removed 的 list 必须每行一个文本块。",
    "- other_changes 必须是英文，不超过 40 词。",
    "- 不能编造不可见文本。",
    "- 仅输出 JSON。",
    "输出 schema：",
    FINAL_OUTPUT_SCHEMA_TEXT,
    "",
    "--- 输入数据（JSON）---",
    safeJsonText(source),
  ].join("\n");
}

function buildVisionExtractUserPrompt(input) {
  const source = buildCommonInputBlock(input);
  return [
    "请只提取视觉事实，不做最终规则判断。",
    "禁止输出 same_font 最终值，禁止输出最终 image_b_texts_removed/other_changes。",
    "你可以输出与字体、文本消失候选、其他视觉变化候选相关的可见证据。",
    "不要编造看不见的文本。",
    "仅输出 JSON，schema：",
    VISUAL_OBSERVATION_SCHEMA_TEXT,
    "",
    "--- 输入数据（JSON）---",
    safeJsonText(source),
  ].join("\n");
}

function buildReasoningDecideUserPrompt(input, visualObservations) {
  const source = buildCommonInputBlock(input);
  return [
    "请基于 Task21 规则与 visual_observations 输出最终标注建议。",
    "你不看图片，只根据输入文本与 visual_observations 判断。",
    TASK21_RULES,
    "输出必须是 JSON，schema：",
    FINAL_OUTPUT_SCHEMA_TEXT,
    "",
    "--- 输入数据（JSON）---",
    safeJsonText(source),
    "",
    "--- visual_observations（JSON）---",
    safeJsonText(visualObservations || {}),
  ].join("\n");
}

module.exports = {
  TASK21_AI_RULE_VERSION,
  TASK21_RULES,
  SINGLE_MODEL_SYSTEM_PROMPT,
  VISION_EXTRACT_SYSTEM_PROMPT,
  REASONING_DECIDE_SYSTEM_PROMPT,
  FINAL_OUTPUT_SCHEMA_TEXT,
  VISUAL_OBSERVATION_SCHEMA_TEXT,
  buildSingleModelUserPrompt,
  buildVisionExtractUserPrompt,
  buildReasoningDecideUserPrompt,
};
