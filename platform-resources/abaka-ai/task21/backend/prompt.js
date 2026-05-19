"use strict";

const TASK21_AI_RULE_VERSION = "abaka-task21-ai-v3-annotation-rules";

const TASK21_RULES = [
  "【流程规则】",
  "- 先判断 same_font，再决定是否继续后续字段。",
  "- same_font=true 或 same underlying font+artistic effect 时，继续分析 image_b_texts_removed 与 other_changes。",
  "- same_font=false、unsure、error 时，image_b_texts_removed 与 other_changes 必须为 not_applicable。",
  "- same_font=error 的典型场景是仅单侧存在文本（数据异常）。",
  "",
  "【same_font 判断规则（只比较 image_a 与 image_b）】",
  "- 关注整体字形结构、typeface、weight、style。",
  "- 忽略文本内容、颜色、位置、字号、大小写。",
  "- 字体扭曲无法辨认：same_font=false。",
  "- 字形轻微扁长或视觉微偏差，但整体结构一致：same_font=true。",
  "- 同图出现两种同文字字形：same_font=false。",
  "- 艺术字、全大写/全小写且无相同字母可比：same_font=true。",
  "- 局部字母样式有异且整体字体不统一：same_font=false。",
  "- same_font 允许值：true | false | unsure | error | same underlying font+artistic effect。",
  "",
  "【image_b_texts_removed 规则（只比较 image_b 与 image_b_removed）】",
  "- 只记录 image_b 中存在、在 image_b_removed 中消失的可识别文本。",
  "- 不记录新替换文字、不记录图案/背景/人物等非文字。",
  "- 纯文字替换时：只把被删旧字写入 image_b_texts_removed；新文字替换行为写入 other_changes。",
  "- 文字改图案时：删字进 image_b_texts_removed；图案替换/图案改动写入 other_changes。",
  "- 图文顺序颠倒、图文错位归入 other_changes，不当作删除文本。",
  "- 部分删除只写被删部分；只删后半段就只写后半段。",
  "- 文本与 context/texts_b 不一致时，以实际截图可见文本为准。",
  "- 不可识别模糊文字不写入删除列表，改在 other_changes 描述文字块/文字元素变动。",
  "- 即使 context.image_b_texts 为空，也必须通过图片比较判断删除文本。",
  "- choice=specify 时，标准答案每行只允许以下格式：all instances of xxx；N instance of xxx；N instances of xxx。",
  "- 同内容多处删除优先写 all instances of xxx。",
  "- 单个明确实例写 1 instance of xxx。",
  "- 大小写不同或空格间隙不同但文本内容一致，视为同一实例。",
  "- 含 <br> 与不含 <br> 不属于同一实例；同段换行用 <br> 表示。",
  "- 多个不同语义文本必须多行输出。",
  "- 禁止 bullet、编号、解释、句号结尾。",
  "- 无删除文本：choice=true，value=true，lines=[]。",
  "- 无法判断：choice=null 或 not_applicable，并在 warnings 给理由。",
  "",
  "【other_changes 规则（只比较 image_b_removed 与 image_b）】",
  "- 描述 image_b_removed 变为 image_b 的非“纯删字”变化。",
  "- 必须用英文，优先 1 句，建议 30 词以内。",
  "- 可写入的变化包括：图文替换、图案改动、替换新文字行为、图文错位、模糊文字块变动、刻意画质变化、布局/排版/图标/前景/物品替换、空白气泡框新增文字、箭头指向的非删字改动。",
  "- image_b_removed 普遍自然更糊（非刻意）通常不单独标注。",
  "- 没有明确非文本变化：choice=null，value 为空。",
  "- 无法判断：choice=unsure，value=unsure。",
  "- 存在明确变化：choice=specify，value=英文短句。",
  "",
  "【特殊场景】",
  "- 纯黑图像也要参与比对，不可直接放弃判断。",
  "- 仅单侧存在文本时：same_font=error，后续字段 not_applicable。",
  "- 模糊不可识别文字统一放 other_changes，避免伪造具体文本。",
  "",
  "【输出格式】",
  "- 输出必须是合法 JSON，不要 Markdown，不要额外解释。",
  "- evidence 最多保留关键证据条目，warnings 仅写必要风险。",
].join("\n");

const TASK21_PROMPT_SUPPLEMENTS = [
  "- same_font 的 value 必须与 choice 一致，并使用页面选项原文。",
  "- same_font=error 时，workflow.skip_later_fields 必须为 true，skip_reason 建议写 same_font_false_unsure_or_error。",
  "- image_b_texts_removed 的 lines/value 必须逐行标准化，不要输出 JSON 数组字符串。",
  "- image_b_texts_removed 允许 all instances of xxx，不要把它降级为 null。",
  "- other_changes 只能比较 image_b_removed 与 image_b，不能比较 image_a 与 image_b。",
  "- OCR 或 context 仅是辅助，最终结论以实际图片可见事实为准。",
  "- 不得编造不可见文本。",
  "- 仅输出 JSON。",
].join("\n");

const SINGLE_MODEL_SYSTEM_PROMPT = [
  "你是 Abaka AI Task21 文本改动审核助手。",
  "你会看图并按 Task21 规则输出最终结构化建议。",
  "你只提供辅助判断，不自动保存、不自动提交。",
  "输出必须是合法 JSON，不要输出 Markdown，不要输出额外解释。",
].join("\n");

const VISION_EXTRACT_SYSTEM_PROMPT = [
  "你是 Task21 视觉事实提取器。",
  "你只负责提取可见事实，不做最终规则判断。",
  "你不得输出 same_font 最终值，不得输出最终 image_b_texts_removed 或 other_changes。",
  "deleted_text_candidates 必须基于 image_b 与 image_b_removed 对比得出，不能因为 context 为空就跳过。",
  "输出必须是 JSON，且只能包含可见证据，不得编造不可见文本。",
].join("\n");

const REASONING_DECIDE_SYSTEM_PROMPT = [
  "你是 Task21 规则判断器。",
  "你不看图片，只根据 Task21 规则与观察事实输出最终建议。",
  "你必须严格区分 same_font、image_b_texts_removed、other_changes。",
  "输出必须是合法 JSON，不要输出 Markdown，不要输出额外解释。",
].join("\n");

const OCR_EXTRACT_SYSTEM_PROMPT = [
  "你是 Task21 OCR 辅助提取器。",
  "你只负责提取可见文本和位置线索，不做最终规则判断。",
  "你不得输出 same_font 最终值，不得输出最终 image_b_texts_removed 或 other_changes。",
  "OCR 结果仅作辅助，最终规则判断必须以实际图片可见内容为准。",
  "输出必须是 JSON，不得编造看不见的文本。",
].join("\n");

const FINAL_OUTPUT_SCHEMA_TEXT = [
  "{",
  '  "target": "same_font | image_b_texts_removed | other_changes | overall",',
  '  "same_font": {',
  '    "applicable": true,',
  '    "choice": "true | false | unsure | error | same underlying font+artistic effect | not_applicable",',
  '    "value": "true | false | unsure | error | same underlying font+artistic effect | not_applicable",',
  '    "confidence": 0.0,',
  '    "reason_cn": "中文简要理由",',
  '    "evidence": [],',
  '    "warnings": []',
  "  },",
  '  "image_b_texts_removed": {',
  '    "applicable": true,',
  '    "choice": "specify | true | null | not_applicable",',
  '    "value_type": "list | true | blank | not_applicable",',
  '    "value": "choice=specify 时为多行标准答案（允许 all instances of xxx / N instance of xxx / N instances of xxx）；choice=true 时为 true；否则为空",',
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
  '    "image_b_removed_text_regions": [],',
  '    "font_evidence": [],',
  '    "font_similarity_observations": [],',
  '    "deleted_text_candidates": [],',
  '    "replaced_text_candidates": [],',
  '    "one_side_text_anomalies": [],',
  '    "layout_change_candidates": [],',
  '    "graphic_change_candidates": [],',
  '    "quality_change_candidates": [],',
  '    "ambiguous_text_blocks": [],',
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
    TASK21_PROMPT_SUPPLEMENTS,
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
    "必须提取：image_a_text_regions、image_b_text_regions、image_b_removed_text_regions、deleted_text_candidates、replaced_text_candidates、one_side_text_anomalies、layout_change_candidates、graphic_change_candidates、quality_change_candidates、ambiguous_text_blocks。",
    "deleted_text_candidates 必须来自 image_b 与 image_b_removed 的视觉对比，不得因 context 为空跳过。",
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
    "补充约束：",
    TASK21_PROMPT_SUPPLEMENTS,
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
    "OCR 提取仅作辅助，若 OCR 与实际图片冲突，以实际图片可见内容为准。",
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
    "补充约束：",
    TASK21_PROMPT_SUPPLEMENTS,
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
