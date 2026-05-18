"use strict";

const TASK21_AI_RULE_VERSION = "abaka-task21-ai-v2-two-stage";

const TASK21_RULES = [
  "Task21 流程：先判 same_font，再决定是否继续后两个字段。",
  "same_font 只比较 image_a 与 image_b 的字体是否相同（typeface/weight/style），忽略文本内容、颜色、位置、字号、大小写。",
  "same_font 只能输出：true | false | unsure | same underlying font+artistic effect。",
  "same_font=false 或 unsure 时，image_b_texts_removed 与 other_changes 必须输出 not_applicable。",
  "same_font=true 或 same underlying font+artistic effect 时，继续分析后两个字段。",
  "image_b_texts_removed 必须比较 image_b 与 image_b_removed，不允许比较 image_a 与 image_b。",
  "image_b_texts_removed 仅记录 image_b 中存在且在 image_b_removed 中消失的文本；不记录图形/背景/人物等非文字。",
  "image_b_texts_removed 若有文本被移除：choice=specify，value/lines 只能用格式 `N instance of xxx` 或 `N instances of xxx`，N 为正整数，N=1 用 instance，N>1 用 instances。",
  "image_b_texts_removed 禁止输出 `all instances of xxx`，禁止 bullets、编号、冒号、解释、句号结尾。",
  "image_b_texts_removed 多个文本必须多行输出；同文本多次出现合并计数；保留可见文本大小写，去掉多余空格。",
  "image_b_texts_removed 若确认没有文本被移除：choice=true 且 value=true。",
  "image_b_texts_removed 若无法判断：choice=null 或 not_applicable，并在 warnings 说明。",
  "other_changes 必须比较 image_b_removed 与 image_b，不允许比较 image_a 与 image_b。",
  "other_changes 仅描述“文本移除/恢复”之外的变化，输出必须为英文。",
  "other_changes 若存在明确非文本变化：choice=specify，value 为英文短句，优先 1 句，建议 30 词以内，表达为如何把 image_b_removed 变成 image_b（例如 Brighten the brightness of the image_b_removed）。",
  "other_changes 若没有非文本变化：choice=null 且 value 为空。",
  "other_changes 若无法判断：choice=unsure 且 value=unsure。",
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

const OCR_EXTRACT_SYSTEM_PROMPT = [
  "你是 Task21 OCR 辅助提取器。",
  "你只负责从图片中提取可见文本与位置线索，不做规则判断。",
  "你不得输出 same_font 最终值，不得输出最终 image_b_texts_removed 或 other_changes。",
  "输出必须是 JSON，不得编造看不见的文本。",
].join("\n");

const FINAL_OUTPUT_SCHEMA_TEXT = [
  "{",
  '  "target": "same_font | image_b_texts_removed | other_changes | overall",',
  '  "same_font": {',
  '    "applicable": true,',
  '    "choice": "true | false | unsure | same underlying font+artistic effect | not_applicable",',
  '    "value": "true | false | unsure | same underlying font+artistic effect | not_applicable",',
  '    "confidence": 0.0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "image_b_texts_removed": {',
  '    "applicable": true,',
  '    "choice": "specify | true | null | not_applicable",',
  '    "value_type": "list | true | blank | not_applicable",',
  '    "value": "choice=specify 时为多行文本；choice=true 时为 true；否则为空",',
  '    "lines": [],',
  '    "segment_count": 0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "other_changes": {',
  '    "applicable": true,',
  '    "choice": "specify | unsure | null | not_applicable",',
  '    "value_type": "text | blank | unsure | not_applicable",',
  '    "value": "choice=specify 时英文描述；choice=unsure 时 unsure；其余为空",',
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

const OCR_OBSERVATION_SCHEMA_TEXT = [
  "{",
  '  "target": "same_font | image_b_texts_removed | other_changes | overall",',
  '  "ocr_observations": {',
  '    "image_a_texts": [],',
  '    "image_b_texts": [],',
  '    "image_b_removed_texts": [],',
  '    "matched_pairs": [],',
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
    "- image_b_texts_removed 若 choice=specify，lines/value 必须每行一个文本块，且严格满足 `N instance(s) of xxx` 格式。",
    "- image_b_texts_removed 禁止 `all instances of xxx`、bullet、编号、冒号、解释和句号。",
    "- other_changes 必须是英文，优先 1 句，建议 30 词以内。",
    "- other_changes 必须描述 image_b_removed 如何变为 image_b，不能比较 image_a。",
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

function buildOcrExtractUserPrompt(input) {
  const source = buildCommonInputBlock(input);
  return [
    "请执行 OCR 辅助提取，仅输出可见文本和线索，不做最终规则判断。",
    "输出 JSON schema：",
    OCR_OBSERVATION_SCHEMA_TEXT,
    "",
    "--- 输入数据（JSON）---",
    safeJsonText(source),
  ].join("\n");
}

function buildReasoningDecideUserPromptWithOcr(input, visualObservations, ocrObservations) {
  const source = buildCommonInputBlock(input);
  return [
    "请基于 Task21 规则、visual_observations 与 ocr_observations 输出最终标注建议。",
    "你不看图片，只根据输入文本与观察事实判断。",
    TASK21_RULES,
    "输出必须是 JSON，schema：",
    FINAL_OUTPUT_SCHEMA_TEXT,
    "",
    "--- 输入数据（JSON）---",
    safeJsonText(source),
    "",
    "--- visual_observations（JSON）---",
    safeJsonText(visualObservations || {}),
    "",
    "--- ocr_observations（JSON）---",
    safeJsonText(ocrObservations || {}),
  ].join("\n");
}

module.exports = {
  TASK21_AI_RULE_VERSION,
  TASK21_RULES,
  SINGLE_MODEL_SYSTEM_PROMPT,
  VISION_EXTRACT_SYSTEM_PROMPT,
  REASONING_DECIDE_SYSTEM_PROMPT,
  OCR_EXTRACT_SYSTEM_PROMPT,
  FINAL_OUTPUT_SCHEMA_TEXT,
  VISUAL_OBSERVATION_SCHEMA_TEXT,
  OCR_OBSERVATION_SCHEMA_TEXT,
  buildSingleModelUserPrompt,
  buildVisionExtractUserPrompt,
  buildReasoningDecideUserPrompt,
  buildOcrExtractUserPrompt,
  buildReasoningDecideUserPromptWithOcr,
};
