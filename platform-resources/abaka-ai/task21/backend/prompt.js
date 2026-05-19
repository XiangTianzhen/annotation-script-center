"use strict";

const TASK21_AI_RULE_VERSION = "abaka-task21-ai-v4-image-b-removed-diff";

const TASK21_RULES = [
  "【流程规则】",
  "- 先判断 same_font，再决定是否继续后续字段。",
  "- same_font=true 或 same underlying font+artistic effect 时，继续分析 image_b_texts_removed 与 other_changes。",
  "- same_font=false、unsure、error 时，image_b_texts_removed 与 other_changes 必须为 not_applicable。",
  "- same_font=error 的典型场景是仅单侧存在文本（数据异常）。",
  "",
  "【same_font 判断规则（只比较 image_a 与 image_b）】",
  "- same_font 只比较 image_a 与 image_b 的字形结构、typeface、weight、style。",
  "- 忽略文本内容、颜色、位置、字号、大小写。",
  "- 字体扭曲无法辨认：same_font=false。",
  "- 字形轻微扁长或视觉微偏差，但整体结构一致：same_font=true。",
  "- 同图出现两种同文字字形：same_font=false。",
  "- 艺术字、全大写/全小写且无相同字母可比：same_font=true。",
  "- 局部字母样式有异且整体字体不统一：same_font=false。",
  "- same_font 允许值：true | false | unsure | error | same underlying font+artistic effect。",
  "",
  "【image_b_texts_removed 判断规则（只比较 image_b 与 image_b_removed）】",
  "- image_b_texts_removed 只能比较 image_b 与 image_b_removed 的实际可见文字。",
  "- image_a 不参与 image_b_texts_removed 删除判断；image_a 只能用于 same_font。",
  "- 页面左侧说明、红框、OCR、context、current values 只能作为辅助，最终以 image_b 与 image_b_removed 的实际图片内容为准。",
  "- 定义四个集合：",
  "  - T = target removal texts，目标删除文本范围，来自页面说明 / 左侧文本 / 红框对应文本 / 当前题上下文，仅作目标范围辅助。",
  "  - B = readable text instances visible in image_b。",
  "  - R = readable text instances still visible in image_b_removed。",
  "  - D = deleted text instances = B - R。",
  "- “删除”只表示：image_b 中有、image_b_removed 中没有了。",
  "- 不允许把 image_a 中的文字当作 image_b_texts_removed 的删除依据。",
  "- 先识别 B 和 R，再计算 D，最后再判断 D 与 T 的关系。",
  "- T 只是目标范围辅助，不能覆盖图片实际差异；若 T 与图片事实冲突，以图片事实为准。",
  "",
  "【image_b_texts_removed 选择规则】",
  "- choice=true：只有目标删除文本 T 被完整删除，且没有额外删除其他 image_b 文本。",
  "- choice=specify：",
  "  - 目标删除文本 T 只删了一部分；或",
  "  - 出现任何非目标文本也被删除（extra deleted texts）；或",
  "  - 目标文本删除情况需要具体说明。",
  "- choice=null：image_b 中没有任何可读文本在 image_b_removed 中消失，也就是 D 为空。",
  "- choice=specify 时，必须列出所有 D 中需要说明的删除项。",
  "- 如果 D 同时包含目标文本删除项和额外多删文本，必须两类都列出，不能漏掉目标文本实际删除部分。",
  "",
  "【多实例与文本归一比较规则】",
  "- 比较 deleted text instances 时采用 case-insensitive，对普通大小写差异不敏感。",
  "- 普通空格、普通字距差异可忽略。",
  "- line breaks / 换行 / <br> 是文本内容的一部分，不能忽略。",
  "- ABCDEFG 与 abcdefg 算同一文本。",
  "- ABCDEFG 与 ABC<br>DEFG 不算同一文本。",
  "- ABC<br>DEFG 与 abc<br>defg 算同一文本。",
  "- 不可识别模糊文字不进入 image_b_texts_removed，不要编造小字。",
  "- 如果模糊文字块确实变化，交给 other_changes 用 text block / text element change 概括。",
  "",
  "【specify 标准答案格式】",
  "- choice=specify 时，每行只能是以下格式之一：",
  "  - all instances of xxx",
  "  - 1 instance of xxx",
  "  - N instances of xxx",
  "- 拼写只能是 instance / instances，不要写 intance / intances。",
  "- 如果同一文本在 image_b 中所有实例都在 image_b_removed 中消失，使用 all instances of xxx。",
  "- 如果同一文本在 image_b 中只有 1 个实例被删，使用 1 instance of xxx。",
  "- 如果同一文本在 image_b 中删了 N 个但不是全部，使用 N instances of xxx。",
  "- 多个不同文本必须分多行输出。",
  "- 禁止 bullet、编号、解释句、句号结尾。",
  "",
  "【与 other_changes 的边界】",
  "- 纯文字替换：旧文字被删进 image_b_texts_removed，新文字替换行为进 other_changes，新文字不进入删除文本列表。",
  "- 文字改图案：被删文字进 image_b_texts_removed，图案变化进 other_changes。",
  "- 图文顺序错位、图文位置移动、布局改动、图案改动、模糊文字块变化进 other_changes，不进 image_b_texts_removed。",
  "- other_changes 只比较 image_b_removed 与 image_b 的非纯删字变化，不比较 image_a。",
  "",
  "【特殊场景】",
  "- 纯黑图像也要参与比对，不可直接放弃判断。",
  "- 仅单侧存在文本时：same_font=error，后续字段 not_applicable。",
  "- 即使 context.image_b_texts 为空，也必须通过 image_b 与 image_b_removed 的视觉差异判断 D。",
  "",
  "【输出格式】",
  "- 输出必须是合法 JSON，不要 Markdown，不要额外解释。",
  "- evidence 只保留关键证据条目，warnings 只写必要风险，不泄露敏感信息。",
].join("\n");

const TASK21_PROMPT_SUPPLEMENTS = [
  "- same_font 的 value 必须与 choice 一致，并使用页面选项原文。",
  "- same_font=error 时，workflow.skip_later_fields 必须为 true，skip_reason 建议写 same_font_false_unsure_or_error。",
  "- image_b_texts_removed 的 value/lines 必须逐行标准化，不要输出 JSON 数组字符串。",
  "- image_b_texts_removed 的 choice=true 只在“只有目标文本完整删除且没有额外删除”时成立，不要把这种场景误判为 specify。",
  "- deleted text instances 的判断必须先看 D = B - R，再看 D 与 T 的关系。",
  "- target removal texts 只是辅助范围，不得覆盖 image_b 与 image_b_removed 的实际视觉差异。",
  "- OCR、页面文本、current values 仅是辅助，最终结论以实际图片可见事实为准。",
  "- 不得编造不可见文本，不得把 image_a 独有文本写入 deleted_text_candidates。",
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
  "你必须先观察 target removal texts、image_b 文本、image_b_removed 文本，再提取 deleted_text_candidates 和 extra_deleted_text_candidates。",
  "deleted_text_candidates 必须基于 image_b 与 image_b_removed 的视觉对比得出，不能因为表单当前值为空就跳过。",
  "你不得把 image_a 中独有文本列入 deleted_text_candidates。",
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
  '    "value": "choice=specify 时为多行文本；choice=true 时为 true；choice=null 或 not_applicable 时为空",',
  '    "lines": ["all instances of xxx | 1 instance of xxx | N instances of xxx"],',
  '    "segment_count": 0,',
  '    "reason_cn": "必须简要说明为什么是 true/specify/null；specify 时说明是部分删除还是多删除",',
  '    "evidence": ["可包含 D = image_b 有、image_b_removed 无", "可包含 T = 目标删除文本", "可包含 extra_deleted_texts = 非目标文本也被删"],',
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
  '    "target_removal_text_candidates": [',
  '      {',
  '        "text": "",',
  '        "normalized_text": "",',
  '        "location": "",',
  '        "confidence": 0.0',
  "      }",
  "    ],",
  '    "image_b_visible_text_instances": [',
  '      {',
  '        "text": "",',
  '        "normalized_text": "",',
  '        "location": "",',
  '        "count_in_image_b": 0,',
  '        "count_in_image_b_removed": 0,',
  '        "deleted_count": 0,',
  '        "is_target_text": false,',
  '        "confidence": 0.0',
  "      }",
  "    ],",
  '    "image_b_removed_visible_text_instances": [],',
  '    "deleted_text_candidates": [],',
  '    "extra_deleted_text_candidates": [],',
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

function normalizeHintArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const result = [];
  value.forEach(function (item) {
    const text = String(item || "").trim();
    if (!text || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text.slice(0, 300));
  });
  return result.slice(0, 12);
}

function buildCommonInputBlock(input) {
  const payload = input && typeof input === "object" ? input : {};
  const currentValues = payload.context?.currentValues || {};
  const currentRemovedValue = String(currentValues.image_b_texts_removed || "").trim();
  const inferredHints = currentRemovedValue
    ? [currentRemovedValue]
    : [];
  return {
    target: payload.target || "overall",
    image_a_texts: payload.context?.imageATexts || "",
    image_b_texts: payload.context?.imageBTexts || "",
    text_positions: payload.context?.textPositions || {},
    target_removal_text_hints: normalizeHintArray(payload.context?.targetRemovalTextHints || inferredHints),
    current_page_values: currentValues,
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
    "你必须观察并输出或在 visual_observations 中明确体现：target_removal_text_candidates、image_b_visible_text_instances、image_b_removed_visible_text_instances、deleted_text_candidates、extra_deleted_text_candidates。",
    "deleted_text_candidates 必须来自 image_b 与 image_b_removed 的视觉对比，核心关系是 D = B - R。",
    "image_b_visible_text_instances / deleted_text_candidates 需要尽量体现：text、normalized_text、location、count_in_image_b、count_in_image_b_removed、deleted_count、is_target_text、confidence。",
    "多实例比较采用 case-insensitive，普通空格差异可忽略，但 line breaks / <br> 要保留并视为文本内容的一部分。",
    "不得因为 image_b_texts_removed 当前表单值为空而跳过。",
    "不得把 image_a 中独有文本列入 deleted_text_candidates。",
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
    "必须先识别 T = target removal texts，再识别 B、R，并基于 D = B - R 判断 true/specify/null。",
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
    "请尽量保留 line breaks / <br> 线索，不要把换行文本与无换行文本合并。",
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
    "必须先识别 T = target removal texts，再识别 B、R，并基于 D = B - R 判断 true/specify/null。",
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
