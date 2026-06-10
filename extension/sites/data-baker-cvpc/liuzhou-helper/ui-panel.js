(function () {
  const ROOT_ATTR = "data-asc-cvpc-liuzhou-panel";
  const MIDDLE_AI_ATTR = "data-asc-cvpc-liuzhou-middle-ai";
  const MIDDLE_AI_ACTIONS_ATTR = "data-asc-cvpc-liuzhou-middle-ai-actions";
  const FIELD_RECOMMEND_ATTR = "data-asc-cvpc-liuzhou-field-recommend";
  const LEGACY_SEGMENT_BUTTON_ATTR = "data-asc-cvpc-liuzhou-segment-button";
  const STYLE_ID = "asc-cvpc-liuzhou-panel-style";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function formatSecondsFromMs(value) {
    const seconds = Math.max(0, Number(value || 0)) / 1000;
    return seconds
      .toFixed(3)
      .replace(/\.000$/, "")
      .replace(/(\.\d*?)0+$/, "$1");
  }

  function stringifyJsonSafely(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value || "");
    }
  }

  function normalizeBatchSelectionNumbers(totalSegments, selectedNumbers) {
    const total = Math.max(0, Math.round(Number(totalSegments || 0)) || 0);
    if (total <= 0) {
      return [];
    }
    const unique = new Set();
    (Array.isArray(selectedNumbers) ? selectedNumbers : []).forEach(function (value) {
      const number = Math.max(0, Math.round(Number(value || 0)) || 0);
      if (number <= 0 || number > total) {
        return;
      }
      unique.add(number);
    });
    return Array.from(unique).sort(function (left, right) {
      return left - right;
    });
  }

  function buildBatchSelectionSpec(totalSegments, selectedNumbers) {
    const total = Math.max(0, Math.round(Number(totalSegments || 0)) || 0);
    const normalized = normalizeBatchSelectionNumbers(total, selectedNumbers);
    if (total <= 0 || normalized.length <= 0 || normalized.length >= total) {
      return "";
    }
    const tokens = [];
    let rangeStart = normalized[0];
    let previous = normalized[0];
    for (let index = 1; index <= normalized.length; index += 1) {
      const current = normalized[index];
      if (current === previous + 1) {
        previous = current;
        continue;
      }
      tokens.push(rangeStart === previous ? String(rangeStart) : String(rangeStart) + "-" + String(previous));
      rangeStart = current;
      previous = current;
    }
    return tokens.join(",");
  }

  function formatBatchSelectionSummary(totalSegments, selectedNumbers) {
    const spec = buildBatchSelectionSpec(totalSegments, selectedNumbers);
    return spec || "全部段";
  }

  function readUsageNumber(source, keys) {
    const input = source && typeof source === "object" ? source : {};
    for (let index = 0; index < keys.length; index += 1) {
      const value = Number(input[keys[index]]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
    return 0;
  }

  function collectUsageTotals(usage) {
    const source = usage && typeof usage === "object" ? usage : null;
    if (!source) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        found: false,
      };
    }
    const ownPromptTokens = readUsageNumber(source, [
      "promptTokens",
      "prompt_tokens",
      "inputTokens",
      "input_tokens",
    ]);
    const ownCompletionTokens = readUsageNumber(source, [
      "completionTokens",
      "completion_tokens",
      "outputTokens",
      "output_tokens",
    ]);
    const ownTotalTokens = readUsageNumber(source, ["totalTokens", "total_tokens"]);
    const childKeys = Object.keys(source).filter(function (key) {
      return source[key] && typeof source[key] === "object";
    });
    const childTotals = childKeys.map(function (key) {
      return collectUsageTotals(source[key]);
    });
    const hasChildTotals = childTotals.some(function (item) {
      return item.found;
    });
    if (hasChildTotals) {
      return childTotals.reduce(
        function (result, item) {
          result.promptTokens += item.promptTokens;
          result.completionTokens += item.completionTokens;
          result.totalTokens += item.totalTokens;
          result.found = result.found || item.found;
          return result;
        },
        {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          found: false,
        }
      );
    }
    return {
      promptTokens: ownPromptTokens,
      completionTokens: ownCompletionTokens,
      totalTokens:
        ownPromptTokens || ownCompletionTokens ? ownPromptTokens + ownCompletionTokens : ownTotalTokens,
      found: Boolean(ownPromptTokens || ownCompletionTokens || ownTotalTokens),
    };
  }

  function buildAiStageSummary(source, stageKey, title, modelKey) {
    const usageSource = source && typeof source === "object" ? source.usage : null;
    const modelsSource = source && typeof source === "object" ? source.models : null;
    const totals = collectUsageTotals(usageSource?.[stageKey]);
    return {
      title: title,
      model: normalizeText(modelsSource?.[modelKey]),
      promptTokens: totals.found ? String(totals.promptTokens) : "",
      completionTokens: totals.found ? String(totals.completionTokens) : "",
    };
  }

  function clearNodeChildren(node) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    while (node.children && node.children.length > 0) {
      node.removeChild(node.children[0]);
    }
    node.textContent = "";
    if (typeof node.innerHTML === "string") {
      node.innerHTML = "";
    }
  }

  function formatMetaValue(value, joiner) {
    if (Array.isArray(value)) {
      return value.join(joiner || " ");
    }
    return String(value || "");
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "], [" + MIDDLE_AI_ATTR + "] {",
      "  color: #303133;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] *, [" + MIDDLE_AI_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] {",
      "  margin-top: 10px;",
      "  padding-top: 10px;",
      "  border-top: 1px solid #ebeef5;",
      "}",
      "[" + ROOT_ATTR + "] .panel-title, [" + MIDDLE_AI_ATTR + "] .section-title {",
      "  font-size: 13px;",
      "  font-weight: 600;",
      "  color: #303133;",
      "}",
      "[" + ROOT_ATTR + "] .panel-subtitle, [" + MIDDLE_AI_ATTR + "] .section-note {",
      "  margin-top: 4px;",
      "  color: #909399;",
      "}",
      "[" + ROOT_ATTR + "] .status { margin-top: 8px; color: #606266; white-space: pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color: #f56c6c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color: #67c23a; }",
      "[" + ROOT_ATTR + "] .section, [" + MIDDLE_AI_ATTR + "] .section { margin-top: 12px; }",
      "[" + ROOT_ATTR + "] .info-box, [" + MIDDLE_AI_ATTR + "] .preview-item, [" + MIDDLE_AI_ATTR + "] .meta-box, [" + FIELD_RECOMMEND_ATTR + "] .recommend-item {",
      "  margin-top: 8px;",
      "  padding: 10px 12px;",
      "  border: 1px solid #ebeef5;",
      "  border-radius: 4px;",
      "  background: #fff;",
      "  color: #606266;",
      "  overflow-wrap: anywhere;",
      "  word-break: break-word;",
      "}",
      "[" + ROOT_ATTR + "] { --asc-primary: #4f7cff; --asc-primary-strong: #3f6df2; --asc-primary-soft: #eef4ff; --asc-primary-border: #cddcff; --asc-muted: #7b88a1; }",
      "[" + ROOT_ATTR + "] { --asc-accent: #f59f45; --asc-accent-soft: #fff4e8; --asc-accent-border: #f7c58b; }",
      "[" + ROOT_ATTR + "] .info-box[data-empty='true'] { color: #909399; word-break: normal; }",
      "[" + ROOT_ATTR + "] .audio-url-summary { display: grid; gap: 6px; color: #606266; word-break: normal; }",
      "[" + ROOT_ATTR + "] .audio-url-line { display: flex; align-items: flex-start; gap: 8px; }",
      "[" + ROOT_ATTR + "] .audio-url-label { min-width: 58px; color: var(--asc-primary-strong); font-weight: 600; }",
      "[" + ROOT_ATTR + "] .audio-url-value { color: #4a5670; }",
      "[" + ROOT_ATTR + "] .audio-url-value.is-emphasis { color: var(--asc-primary-strong); font-weight: 600; }",
      "[" + ROOT_ATTR + "] .audio-url-link { display: inline-block; margin-top: 6px; color: var(--asc-primary); text-decoration: none; font-weight: 600; }",
      "[" + ROOT_ATTR + "] .audio-url-link:hover { text-decoration: underline; }",
      "[" + ROOT_ATTR + "] .audio-url-details { margin-top: 8px; }",
      "[" + ROOT_ATTR + "] .audio-url-details summary { cursor: pointer; color: #909399; user-select: none; }",
      "[" + ROOT_ATTR + "] .audio-url-full { margin: 6px 0 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }",
      "[" + ROOT_ATTR + "] .panel-foot { margin-top: 10px; color: #909399; }",
      "[" + MIDDLE_AI_ATTR + "] {",
      "  margin-top: 12px;",
      "  padding: 14px 16px;",
      "  border: 1px solid var(--asc-primary-border);",
      "  border-radius: 10px;",
      "  background: linear-gradient(180deg, #f9fbff 0%, #f4f8ff 100%);",
      "  box-shadow: 0 6px 18px rgba(79, 124, 255, 0.08);",
      "}",
      "[" + MIDDLE_AI_ACTIONS_ATTR + "], [" + MIDDLE_AI_ATTR + "] .section-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-controls { margin-top: 8px; display: grid; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector { display: grid; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-summary { color: var(--asc-primary-strong); font-weight: 600; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-grid { display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-grid button { min-width: 44px; justify-content: center; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-grid button[data-selected='true'] { background: var(--asc-primary-soft); border-color: var(--asc-primary); color: var(--asc-primary-strong); box-shadow: inset 0 0 0 1px rgba(79, 124, 255, 0.12); }",
      "[" + MIDDLE_AI_ATTR + "] .batch-selector-grid button[data-batch-all='true'] { min-width: 56px; font-weight: 600; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-help { color: var(--asc-muted); }",
      "[" + MIDDLE_AI_ATTR + "] .batch-action-row { display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-state-list { margin-top: 8px; display: grid; gap: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-state-item { padding: 10px 12px; border: 1px solid var(--asc-primary-border); border-radius: 8px; background: #fff; color: #42506a; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-state-item strong { color: var(--asc-primary-strong); }",
      "[" + MIDDLE_AI_ATTR + "] .batch-failure-list { margin: 0; padding-left: 18px; color: #b42318; }",
      "[" + MIDDLE_AI_ATTR + "] .batch-failure-list li { margin-top: 4px; }",
      "[" +
        MIDDLE_AI_ACTIONS_ATTR +
        "] button[data-accent='true'], [" +
        MIDDLE_AI_ATTR +
        "] .section-actions button[data-accent='true'], [" +
        MIDDLE_AI_ATTR +
        "] .batch-action-row button[data-accent='true'] {",
      "  color: #fff;",
      "  border-color: #f29a38;",
      "  background: linear-gradient(180deg, #ffb357 0%, #f59f45 100%);",
      "  box-shadow: 0 6px 14px rgba(245, 159, 69, 0.26);",
      "}",
      "[" +
        MIDDLE_AI_ACTIONS_ATTR +
        "] button[data-accent='true']:hover, [" +
        MIDDLE_AI_ATTR +
        "] .section-actions button[data-accent='true']:hover, [" +
        MIDDLE_AI_ATTR +
        "] .batch-action-row button[data-accent='true']:hover {",
      "  color: #fff;",
      "  border-color: #e68a24;",
      "  background: linear-gradient(180deg, #ffac45 0%, #ee922f 100%);",
      "}",
      "[" + MIDDLE_AI_ATTR + "] .preview-list, [" + MIDDLE_AI_ATTR + "] .meta-list, [" + FIELD_RECOMMEND_ATTR + "] {",
      "  margin-top: 8px;",
      "  display: grid;",
      "  gap: 8px;",
      "}",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item strong, [" + MIDDLE_AI_ATTR + "] .preview-item strong, [" + MIDDLE_AI_ATTR + "] .meta-box strong {",
      "  display: block;",
      "  color: var(--asc-primary-strong);",
      "}",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item { border-color: var(--asc-primary-border); background: linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%); border-radius: 10px; box-shadow: 0 6px 16px rgba(79, 124, 255, 0.08); }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-body { flex: 1 1 auto; min-width: 0; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-body strong { font-size: 13px; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-text { margin-top: 6px; color: #42506a; font-size: 13px; line-height: 1.7; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-action { flex: 0 0 auto; margin-top: 0; display: flex; align-items: flex-start; justify-content: flex-end; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-action button { border-color: var(--asc-primary-border); background: #fff; color: var(--asc-primary-strong); font-weight: 600; }",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-action button:hover { background: #edf3ff; border-color: var(--asc-primary); color: var(--asc-primary); }",
      "[" + FIELD_RECOMMEND_ATTR + "] { margin-top: 8px; }",
      "[" + ROOT_ATTR + "] button, [" + MIDDLE_AI_ATTR + "] button {",
      "  min-height: 32px;",
      "  padding: 8px 14px;",
      "  border: 1px solid #dcdfe6;",
      "  border-radius: 4px;",
      "  background: #fff;",
      "  color: #606266;",
      "  font-size: 12px;",
      "  line-height: 1;",
      "  font-weight: 500;",
      "  white-space: nowrap;",
      "  cursor: pointer;",
      "  transition: .1s;",
      "}",
      "[" + ROOT_ATTR + "] button:hover, [" + MIDDLE_AI_ATTR + "] button:hover {",
      "  color: var(--asc-primary-strong);",
      "  border-color: var(--asc-primary-border);",
      "  background: #f3f7ff;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true'], [" + MIDDLE_AI_ATTR + "] button[data-primary='true'] {",
      "  background: var(--asc-primary);",
      "  border-color: var(--asc-primary);",
      "  color: #fff;",
      "  box-shadow: 0 6px 14px rgba(79, 124, 255, 0.22);",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true']:hover, [" + MIDDLE_AI_ATTR + "] button[data-primary='true']:hover {",
      "  background: var(--asc-primary-strong);",
      "  border-color: var(--asc-primary-strong);",
      "  color: #fff;",
      "}",
      "[" + MIDDLE_AI_ATTR + "] .section-title, [" + ROOT_ATTR + "] .panel-title { color: var(--asc-primary-strong); }",
      "[" + MIDDLE_AI_ATTR + "] .section-note, [" + ROOT_ATTR + "] .panel-subtitle { color: var(--asc-muted); }",
      "[" + MIDDLE_AI_ATTR + "] .meta-box, [" + MIDDLE_AI_ATTR + "] .preview-item { border-color: var(--asc-primary-border); background: #ffffff; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-box .meta-line { margin-top: 4px; color: #42506a; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-details { margin-top: 8px; border: 1px solid var(--asc-primary-border); border-radius: 10px; background: #fff; overflow: hidden; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-details summary { cursor: pointer; list-style: none; padding: 10px 12px; color: var(--asc-primary-strong); font-weight: 600; background: #f6f9ff; user-select: none; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-details summary::-webkit-details-marker { display: none; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-details-content { padding: 4px 12px 12px; }",
      "[" + MIDDLE_AI_ATTR + "] .meta-box pre { margin: 6px 0 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; color: #42506a; }",
      "[" + MIDDLE_AI_ATTR + "] .inline-toggle { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; color: var(--asc-primary-strong); font-size: 13px; }",
      "[" + MIDDLE_AI_ATTR + "] .inline-toggle input { margin: 0; }",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function createButton(text, primary, variant) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = primary
      ? "el-button el-button--primary el-button--mini"
      : "el-button el-button--default el-button--mini";
    if (primary) {
      button.setAttribute("data-primary", "true");
    }
    if (variant) {
      button.setAttribute("data-" + String(variant), "true");
    }
    return button;
  }

  function getBodyHost() {
    return document.body instanceof HTMLElement ? document.body : null;
  }

  function resolveGlobalAnnotationHost() {
    if (typeof document.querySelectorAll !== "function") {
      return null;
    }
    const hosts = Array.from(document.querySelectorAll(".Label_top"));
    return (
      hosts.find(function (node) {
        return node instanceof HTMLElement && normalizeText(node.textContent).indexOf("全局标注") >= 0;
      }) || null
    );
  }

  function resolveGlobalAnnotationContentHost(annotationHost) {
    if (!(annotationHost instanceof HTMLElement) || typeof annotationHost.querySelector !== "function") {
      return null;
    }
    return (
      annotationHost.querySelector(".label_title_border2") ||
      annotationHost.querySelector(".label_title_border") ||
      annotationHost.querySelector(".asr_label") ||
      annotationHost
    );
  }

  function findDescendantByClassToken(root, token) {
    if (!(root instanceof HTMLElement) || typeof root.querySelectorAll !== "function") {
      return null;
    }
    return (
      Array.from(root.querySelectorAll("div, span, label"))
        .find(function (node) {
          return node instanceof HTMLElement && normalizeText(node.className || "").indexOf(token) >= 0;
        }) || null
    );
  }

  function findFieldBlock(labelMatchers) {
    if (typeof document.querySelectorAll !== "function") {
      return null;
    }
    const nodes = Array.from(
      document.querySelectorAll(".item-name, .quest-span, .el-only-child__content, .el-form-item, .ant-form-item, label, span")
    );
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      const text = normalizeText(node.textContent || "");
      const matched = labelMatchers.find(function (matcher) {
        return text.indexOf(matcher) >= 0;
      });
      if (!matched) {
        continue;
      }
      let scope = node;
      for (let depth = 0; scope && depth < 6; depth += 1) {
        if (
          typeof scope.querySelector === "function" &&
          scope.querySelector(
            "textarea, input[type='text'], input:not([type]), [contenteditable='true'], .tiptap.ProseMirror, [role='textbox'], .el-radio-group, [role='radiogroup']"
          )
        ) {
          return scope;
        }
        scope =
          scope.closest?.(".el-form-item, .ant-form-item, .el-card, .ant-card, .field-block") ||
          (scope.parentNode instanceof HTMLElement ? scope.parentNode : null);
      }
    }
    return null;
  }

  function resolveFieldValueHost(fieldBlock) {
    return findDescendantByClassToken(fieldBlock, "w-[100%]") || fieldBlock;
  }

  function resolveFieldGroupHost(fieldBlock) {
    let scope = fieldBlock instanceof HTMLElement ? fieldBlock : null;
    for (let depth = 0; scope && depth < 6; depth += 1) {
      if (typeof scope.hasAttribute === "function" && scope.hasAttribute("data-v-fd55b986")) {
        return scope;
      }
      scope = scope.parentNode instanceof HTMLElement ? scope.parentNode : null;
    }
    return fieldBlock?.parentNode instanceof HTMLElement ? fieldBlock.parentNode : null;
  }

  function insertAfter(parentNode, targetNode, childNode) {
    if (!(parentNode instanceof HTMLElement) || !(childNode instanceof HTMLElement)) {
      return;
    }
    if (!(targetNode instanceof HTMLElement) || targetNode.parentNode !== parentNode) {
      parentNode.appendChild(childNode);
      return;
    }
    const siblings = Array.from(parentNode.children || []);
    const targetIndex = siblings.indexOf(targetNode);
    const referenceNode = targetIndex >= 0 ? siblings[targetIndex + 1] || null : null;
    if (referenceNode) {
      parentNode.insertBefore(childNode, referenceNode);
      return;
    }
    parentNode.appendChild(childNode);
  }

  function resolveHostBranch(hostNode, node) {
    let current = node instanceof HTMLElement ? node : null;
    while (current && current.parentNode instanceof HTMLElement) {
      if (current.parentNode === hostNode) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function removeLegacySegmentButtons() {
    if (typeof document.querySelectorAll !== "function") {
      return;
    }
    Array.from(document.querySelectorAll("[" + LEGACY_SEGMENT_BUTTON_ATTR + "]")).forEach(function (node) {
      if (node instanceof HTMLElement && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  function createRecommendationCard(title, value, buttonText, callback) {
    const box = document.createElement("div");
    box.className = "recommend-item";
    const content = document.createElement("div");
    content.className = "recommend-item-content";
    const body = document.createElement("div");
    body.className = "recommend-item-body";
    const titleNode = document.createElement("strong");
    titleNode.textContent = String(title || "");
    const valueNode = document.createElement("div");
    valueNode.className = "recommend-item-text";
    valueNode.textContent = String(value || "");
    body.appendChild(titleNode);
    body.appendChild(valueNode);
    content.appendChild(body);
    if (normalizeText(value) && normalizeText(buttonText) && typeof callback === "function") {
      const actionRow = document.createElement("div");
      actionRow.className = "recommend-item-action";
      const button = createButton(buttonText, false);
      button.addEventListener("click", callback);
      actionRow.appendChild(button);
      content.appendChild(actionRow);
    }
    box.appendChild(content);
    return box;
  }

  function buildPreviewRuleSummary(preview) {
    const rules = preview?.meta?.rules && typeof preview.meta.rules === "object"
      ? preview.meta.rules
      : {};
    const thresholdDbfs = Number.isFinite(Number(rules.silenceThresholdDbfs))
      ? Math.round(Number(rules.silenceThresholdDbfs))
      : -27;
    const thresholdUnit = String(rules.silenceThresholdUnit || "db").trim().toLowerCase();
    const thresholdValue = Number.isFinite(Number(rules.silenceThresholdValue))
      ? Number(rules.silenceThresholdValue)
      : thresholdUnit === "ratio"
        ? Number((100 * Math.pow(10, thresholdDbfs / 20)).toFixed(2))
        : thresholdUnit === "value"
          ? Math.max(1, Math.round(32768 * Math.pow(10, thresholdDbfs / 20)))
          : thresholdDbfs;
    if (thresholdUnit === "ratio") {
      return (
        "静音 >= 0.4s，阈值 " +
        String(Number(thresholdValue.toFixed(2))) +
        "%，约 " +
        String(thresholdDbfs) +
        " dB，前后补偿 0.1s"
      );
    }
    if (thresholdUnit === "value") {
      return (
        "静音 >= 0.4s，阈值 " +
        String(Math.round(thresholdValue)) +
        " Val，约 " +
        String(thresholdDbfs) +
        " dB，前后补偿 0.1s"
      );
    }
    return "静音 >= 0.4s，阈值 " + String(thresholdDbfs) + " dB，前后补偿 0.1s";
  }

  function isWholeAudioFallbackPreview(preview) {
    return String(preview?.meta?.previewMode || "") === "whole-audio-fallback";
  }

  function buildPreviewDetectionSummary(preview) {
    const analysisMeta =
      preview?.analysisMeta && typeof preview.analysisMeta === "object" ? preview.analysisMeta : {};
    const silentRangeCount = Math.max(
      0,
      Math.round(Number(analysisMeta.silentRangeCount || 0)) || 0
    );
    const rawSilentRangeCount = Math.max(
      0,
      Math.round(Number(analysisMeta.rawSilentRangeCount || 0)) || 0
    );
    const frameCount = Math.max(0, Math.round(Number(analysisMeta.frameCount || 0)) || 0);
    const detectionLabel =
      String(preview?.meta?.analysisSource || "") === "backend-python-audio-url"
        ? "后端静音检测"
        : "本地静音检测";
    if (frameCount <= 0) {
      return detectionLabel + "摘要暂不可用";
    }
    const parts = [
      detectionLabel + "命中 " + String(silentRangeCount) + " 段候选静音",
    ];
    if (rawSilentRangeCount > silentRangeCount) {
      parts.push(
        "原始候选 " +
          String(rawSilentRangeCount) +
          " 段，已自动合并短尖峰打断"
      );
    }
    return parts.join("；");
  }

  function buildWholeAudioPreviewTitle(preview) {
    if (String(preview?.meta?.analysisSource || "") === "backend-python-audio-url") {
      return "后端整音频重切预览";
    }
    return "整条音频重切预览";
  }

  function buildWholeAudioPreviewLead(preview) {
    if (String(preview?.meta?.analysisSource || "") === "backend-python-audio-url") {
      return "后端已直接生成整条音频重切预览";
    }
    return "当前增量补切未命中，以下为整条音频重切预览";
  }

  function buildPreviewAnalysisNote(preview) {
    const analysisMeta =
      preview?.analysisMeta && typeof preview.analysisMeta === "object" ? preview.analysisMeta : {};
    const detectionLabel =
      String(preview?.meta?.analysisSource || "") === "backend-python-audio-url"
        ? "后端静音检测"
        : "本地静音检测";
    const silentRangeCount = Math.max(
      0,
      Math.round(Number(analysisMeta.silentRangeCount || 0)) || 0
    );
    const rawSilentRangeCount = Math.max(
      0,
      Math.round(Number(analysisMeta.rawSilentRangeCount || 0)) || 0
    );
    const frameCount = Math.max(0, Math.round(Number(analysisMeta.frameCount || 0)) || 0);
    const emptyReason = String(preview?.meta?.emptyReason || "");
    if (frameCount <= 0) {
      return "";
    }
    if (silentRangeCount <= 0 || emptyReason === "no-silence") {
      return detectionLabel + "未找到满足条件的连续静音；已自动平滑并合并 <=0.18 秒的短尖峰打断。";
    }
    const parts = [
      detectionLabel + "已找到 " + String(silentRangeCount) + " 段满足条件的候选静音",
    ];
    if (rawSilentRangeCount > silentRangeCount) {
      parts.push("已自动合并短尖峰打断");
    }
    if (emptyReason === "insufficient-split") {
      parts.push("命中了静音，但拆分后仍不足 2 段");
    } else {
      parts.push("当前没有命中现有段内部");
    }
    return parts.join("；") + "。";
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let rightRoot = null;
    let rightPanelNode = null;
    let middleAiRoot = null;
    let middleActionsNode = null;
    let statusNode = null;
    let audioNode = null;
    let previewNode = null;
    let recommendationMetaNode = null;
    let dialectRecommendationNode = null;
    let mandarinRecommendationNode = null;
    let batchSelectionSummaryNode = null;
    let batchSelectionGridNode = null;
    let batchStateNode = null;
    let autoApplyToggleNode = null;
    let batchSelectionState = {
      totalSegments: 0,
      selectedNumbers: [],
      dragging: false,
      dragNextSelected: true,
    };
    let batchSelectionPointerCleanup = null;

    function setStatus(text, tone) {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(text || "");
      statusNode.setAttribute("data-tone", tone || "");
    }

    function renderPreview(preview) {
      if (!previewNode) {
        return;
      }
      clearNodeChildren(previewNode);
      if (!preview || typeof preview !== "object") {
        previewNode.textContent = "当前还没有分段建议。";
        return;
      }
      const summary = document.createElement("div");
      summary.className = "preview-item";
      summary.innerHTML = "<strong>规则摘要</strong><div>" + buildPreviewRuleSummary(preview) + "</div>";
      previewNode.appendChild(summary);

      if (isWholeAudioFallbackPreview(preview)) {
        const sourceSegments = Array.isArray(preview?.sourceSegments) ? preview.sourceSegments : [];
        const proposedSegments = Array.isArray(preview?.proposedSegments) ? preview.proposedSegments : [];

        const banner = document.createElement("div");
        banner.className = "preview-item";
        banner.innerHTML =
          "<strong>" +
          buildWholeAudioPreviewTitle(preview) +
          "</strong><div>" +
          buildWholeAudioPreviewLead(preview) +
          "</div>";
        previewNode.appendChild(banner);

        const readonlyBox = document.createElement("div");
        readonlyBox.className = "preview-item";
        readonlyBox.innerHTML =
          "<strong>应用方式</strong><div>点击“应用分段建议”会先尝试直写平台保存接口；当前整音频预览直写失败时不会回退页面内分段</div>";
        previewNode.appendChild(readonlyBox);

        const metaBox = document.createElement("div");
        metaBox.className = "preview-item";
        const metaLines = ['<strong>当前结果</strong>'];
        if (sourceSegments.length > 0) {
          metaLines.push("<div>原现有段数：" + String(sourceSegments.length) + " 段</div>");
          metaLines.push("<div>fallback 建议段数：" + String(proposedSegments.length) + " 段</div>");
        } else {
          metaLines.push("<div>当前模式：后端整音频分段</div>");
          metaLines.push("<div>建议段数：" + String(proposedSegments.length) + " 段</div>");
        }
        metaLines.push("<div>" + buildPreviewDetectionSummary(preview) + "</div>");
        metaBox.innerHTML = metaLines.join("");
        previewNode.appendChild(metaBox);

        if (proposedSegments.length === 0) {
          const emptyBox = document.createElement("div");
          emptyBox.className = "preview-item";
          emptyBox.innerHTML = "<strong>建议段</strong><div>当前还没有可展示的整条音频重切建议。</div>";
          previewNode.appendChild(emptyBox);
        }

        proposedSegments.forEach(function (segment, index) {
          const box = document.createElement("div");
          box.className = "preview-item";
          box.innerHTML =
            "<strong>建议段 " +
            String(index + 1) +
            "</strong><div>" +
            formatSecondsFromMs(segment?.startMs) +
            " 秒 - " +
            formatSecondsFromMs(segment?.endMs) +
            " 秒</div>";
          previewNode.appendChild(box);
        });

        if (preview.analysisError) {
          const note = document.createElement("div");
          note.className = "section-note";
          note.textContent = "静音分析降级：" + preview.analysisError;
          previewNode.appendChild(note);
        }
        return;
      }

      const changes = Array.isArray(preview?.changes) ? preview.changes : [];
      if (changes.length === 0) {
        const emptyBox = document.createElement("div");
        emptyBox.className = "preview-item";
        emptyBox.innerHTML = "<strong>当前结果</strong><div>当前音频没有命中可拆分静音，保持现有段不变</div>";
        previewNode.appendChild(emptyBox);
        const analysisNote = buildPreviewAnalysisNote(preview);
        if (analysisNote) {
          const note = document.createElement("div");
          note.className = "section-note";
          note.textContent = analysisNote;
          previewNode.appendChild(note);
        }
      }
      changes.forEach(function (item) {
        const box = document.createElement("div");
        box.className = "preview-item";
        const suggestedSegments = Array.isArray(item?.suggestedSegments) ? item.suggestedSegments : [];
        const lines = [
          "<strong>原第 " +
            String(Number(item?.sourceSegmentNumber || 0) || "-") +
            " 段</strong>",
          "<div>原时间：" +
            formatSecondsFromMs(item?.originalStartMs) +
            " 秒 - " +
            formatSecondsFromMs(item?.originalEndMs) +
            " 秒</div>",
          "<div>将拆为 " + String(suggestedSegments.length) + " 段</div>",
        ];
        suggestedSegments.forEach(function (segment, index) {
          lines.push(
            "<div>子段 " +
              String(index + 1) +
              "：" +
              formatSecondsFromMs(segment?.startMs) +
              " 秒 - " +
              formatSecondsFromMs(segment?.endMs) +
              " 秒</div>"
          );
        });
        lines.push("<div>规则：" + buildPreviewRuleSummary(preview) + "</div>");
        if (normalizeText(item?.reason)) {
          lines.push("<div>原因：" + String(item.reason) + "</div>");
        }
        box.innerHTML = lines.join("");
        previewNode.appendChild(box);
      });
      if (preview.analysisError) {
        const note = document.createElement("div");
        note.className = "section-note";
        note.textContent = "静音分析降级：" + preview.analysisError;
        previewNode.appendChild(note);
      }
    }

    function renderRecommendationMeta(result) {
      if (!recommendationMetaNode) {
        return;
      }
      clearNodeChildren(recommendationMetaNode);
      const source = result && typeof result === "object" ? result : {};
      const rawSource =
        source.debugRawJson ||
        source.rawResponse ||
        source.debugRawAiResponse ||
        null;
      const rawText = rawSource ? stringifyJsonSafely(rawSource) : "";
      [
        buildAiStageSummary(source, "listen", "听音识别", "listenModel"),
        buildAiStageSummary(source, "refine", "文本修正", "refineModel"),
      ].forEach(function (stageItem) {
        const box = document.createElement("div");
        box.className = "meta-box";
        box.innerHTML =
          "<strong>" +
          stageItem.title +
          "</strong>" +
          '<div class="meta-line">模型：' +
          stageItem.model +
          "</div>" +
          '<div class="meta-line">输入：' +
          stageItem.promptTokens +
          "</div>" +
          '<div class="meta-line">输出：' +
          stageItem.completionTokens +
          "</div>";
        recommendationMetaNode.appendChild(box);
      });
      [
        ["音频听出的柳州话文本", source.audioDialectText || source.dialectText || ""],
        ["特殊标签", formatMetaValue(source.specialTags, " ")],
        ["需人工复核", source.needHumanReview === true ? "是" : source.needHumanReview === false ? "否" : ""],
        ["备注", formatMetaValue(source.notes, "；")],
        ["AI 返回原始内容", rawText],
      ].forEach(function (item) {
        const box = document.createElement("div");
        box.className = "meta-box";
        if (item[0] === "AI 返回原始内容") {
          const title = document.createElement("strong");
          title.textContent = item[0];
          const rawNode = document.createElement("pre");
          rawNode.textContent = String(item[1] || "");
          box.appendChild(title);
          box.appendChild(rawNode);
        } else {
          box.innerHTML = "<strong>" + item[0] + "</strong><div>" + String(item[1] || "") + "</div>";
        }
        recommendationMetaNode.appendChild(box);
      });
    }

    function renderRecommendation(result) {
      if (!dialectRecommendationNode || !mandarinRecommendationNode || !recommendationMetaNode) {
        return;
      }
      dialectRecommendationNode.innerHTML = "";
      mandarinRecommendationNode.innerHTML = "";
      renderRecommendationMeta(result);
      if (!result || result.success !== true) {
        return;
      }
      const refinedDialectText = String(result.refinedDialectText || result.dialectText || "");
      const refinedMandarinText = String(
        result.refinedMandarinText || result.mandarinText || result.audioMandarinText || ""
      );
      [
        {
          host: dialectRecommendationNode,
          title: "修正后的柳州话文本",
          value: refinedDialectText,
          buttonText: "填入标注文本",
          applyKey: "refinedDialectText",
        },
        {
          host: mandarinRecommendationNode,
          title: "整理后的普通话文本",
          value: refinedMandarinText,
          buttonText: "填入普通话顺滑",
          applyKey: "refinedMandarinText",
        },
      ].forEach(function (item) {
        item.host.appendChild(
          createRecommendationCard(item.title, item.value, item.buttonText, function () {
            if (typeof deps.onApplyRecommendationText === "function") {
              deps.onApplyRecommendationText(item.applyKey);
            }
          })
        );
      });
    }

    function renderBatchState(snapshot) {
      if (!batchStateNode) {
        return;
      }
      const source = snapshot && typeof snapshot === "object" ? snapshot : null;
      batchStateNode.innerHTML = "";
      if (!source) {
        batchStateNode.textContent = "当前没有批量任务。";
        return;
      }

      const summary = document.createElement("div");
      summary.className = "batch-state-item";
      const summaryLines = [
        "<strong>批量识别状态</strong>",
        "<div>阶段：" + String(source.phaseText || "-") + "</div>",
        "<div>范围：" + String(source.selectionSpec || "全部段") + "</div>",
        "<div>并发：" + String(Number(source.concurrency || 0) || "-") + "</div>",
        "<div>总数：" + String(Number(source.totalCount || 0)) + "</div>",
        "<div>已发起：" + String(Number(source.launchedCount || 0)) + "</div>",
        "<div>进行中：" + String(Number(source.activeAiCount || 0)) + "</div>",
        "<div>已成功：" + String(Number(source.succeededCount || 0)) + "</div>",
        "<div>已失败：" + String(Number(source.failedCount || 0)) + "</div>",
        "<div>当前段：" +
          (Number(source.currentSegmentNumber || 0) > 0
            ? "第 " + String(Number(source.currentSegmentNumber)) + " 段"
            : "-") +
          "</div>",
      ];
      summary.innerHTML = summaryLines.join("");
      batchStateNode.appendChild(summary);

      const failures = Array.isArray(source.failures) ? source.failures : [];
      if (failures.length > 0) {
        const failureBox = document.createElement("div");
        failureBox.className = "batch-state-item";
        const title = document.createElement("strong");
        title.textContent = "失败清单";
        const list = document.createElement("ul");
        list.className = "batch-failure-list";
        failures.forEach(function (item) {
          const line = document.createElement("li");
          line.textContent =
            "第 " +
            String(Number(item?.segmentNumber || 0) || "-") +
            " 段： " +
            String(item?.message || "失败");
          list.appendChild(line);
        });
        failureBox.appendChild(title);
        failureBox.appendChild(list);
        batchStateNode.appendChild(failureBox);
      }
    }

    function stopBatchSelectionDrag() {
      batchSelectionState.dragging = false;
    }

    function getCurrentBatchSelectedNumbers() {
      return normalizeBatchSelectionNumbers(
        batchSelectionState.totalSegments,
        batchSelectionState.selectedNumbers
      );
    }

    function applyBatchSelectionNumbers(selectedNumbers) {
      const total = Math.max(0, Math.round(Number(batchSelectionState.totalSegments || 0)) || 0);
      batchSelectionState.selectedNumbers = normalizeBatchSelectionNumbers(total, selectedNumbers);
      if (total > 0 && batchSelectionState.selectedNumbers.length <= 0) {
        batchSelectionState.selectedNumbers = Array.from({ length: total }, function (_item, index) {
          return index + 1;
        });
      }
      const current = getCurrentBatchSelectedNumbers();
      const selectedSet = new Set(current);
      const isAllSelected = total > 0 && current.length >= total;
      if (batchSelectionSummaryNode) {
        batchSelectionSummaryNode.textContent = "当前选择：" + formatBatchSelectionSummary(total, current);
      }
      if (batchSelectionGridNode) {
        Array.from(batchSelectionGridNode.children || []).forEach(function (node) {
          if (!(node instanceof HTMLElement) || typeof node.getAttribute !== "function") {
            return;
          }
          if (node.getAttribute("data-batch-all") === "true") {
            node.setAttribute("data-selected", isAllSelected ? "true" : "false");
            return;
          }
          const segmentNumber = Math.max(0, Math.round(Number(node.getAttribute("data-segment-number") || 0)) || 0);
          node.setAttribute("data-selected", selectedSet.has(segmentNumber) ? "true" : "false");
        });
      }
    }

    function updateBatchSelectionValue(segmentNumber, selected) {
      const total = Math.max(0, Math.round(Number(batchSelectionState.totalSegments || 0)) || 0);
      if (segmentNumber <= 0 || segmentNumber > total) {
        return;
      }
      const next = new Set(getCurrentBatchSelectedNumbers());
      if (selected) {
        next.add(segmentNumber);
      } else {
        next.delete(segmentNumber);
      }
      applyBatchSelectionNumbers(Array.from(next));
    }

    function bindBatchSegmentButton(button, segmentNumber) {
      button.addEventListener("mousedown", function () {
        const selectedSet = new Set(getCurrentBatchSelectedNumbers());
        const nextSelected = selectedSet.has(segmentNumber) !== true;
        batchSelectionState.dragging = true;
        batchSelectionState.dragNextSelected = nextSelected;
        updateBatchSelectionValue(segmentNumber, nextSelected);
      });
      button.addEventListener("mouseenter", function () {
        if (!batchSelectionState.dragging) {
          return;
        }
        updateBatchSelectionValue(segmentNumber, batchSelectionState.dragNextSelected === true);
      });
    }

    function renderBatchSelection(options) {
      const source = options && typeof options === "object" ? options : {};
      const total = Math.max(0, Math.round(Number(source.totalSegments || 0)) || 0);
      batchSelectionState.totalSegments = total;
      if (total <= 0) {
        if (batchSelectionSummaryNode) {
          batchSelectionSummaryNode.textContent = "当前选择：暂无可选段";
        }
        if (batchSelectionGridNode) {
          batchSelectionGridNode.innerHTML = "";
        }
        batchSelectionState.selectedNumbers = [];
        return;
      }

      if (batchSelectionGridNode) {
        batchSelectionGridNode.innerHTML = "";
        const allButton = createButton("全部", false);
        allButton.setAttribute("data-batch-all", "true");
        allButton.addEventListener("click", function () {
          applyBatchSelectionNumbers(
            Array.from({ length: total }, function (_item, index) {
              return index + 1;
            })
          );
        });
        batchSelectionGridNode.appendChild(allButton);
        for (let index = 1; index <= total; index += 1) {
          const button = createButton(String(index), false);
          button.setAttribute("data-segment-number", String(index));
          bindBatchSegmentButton(button, index);
          batchSelectionGridNode.appendChild(button);
        }
      }

      const preferredSelected =
        source.resetSelection === true || batchSelectionState.selectedNumbers.length <= 0
          ? Array.from({ length: total }, function (_item, index) {
              return index + 1;
            })
          : getCurrentBatchSelectedNumbers();
      applyBatchSelectionNumbers(preferredSelected);
    }

    function getBatchSelectionSpec() {
      return buildBatchSelectionSpec(
        batchSelectionState.totalSegments,
        batchSelectionState.selectedNumbers
      );
    }

    function renderAudioContext(context) {
      if (!audioNode) {
        return;
      }
      const source = context && typeof context === "object" ? context : {};
      const audioUrl = normalizeText(source.audioUrl);
      const entryName = normalizeText(source.selectedEntry?.name);
      const sourceText = normalizeText(source.audioUrlSource);
      const selectedRange =
        source.selectedRange && typeof source.selectedRange === "object" ? source.selectedRange : null;
      if (!audioUrl) {
        audioNode.setAttribute("data-empty", "true");
        audioNode.textContent =
          source.audioUrlHintMessage || "暂未获取到当前音频地址，页面初始化完成后会自动刷新。";
        return;
      }
      audioNode.setAttribute("data-empty", "false");
      audioNode.innerHTML = "";

      const summary = document.createElement("div");
      summary.className = "audio-url-summary";
      [
        ["文件", entryName, true],
        ["来源", sourceText, false],
        [
          Number(source.currentSegmentNumber) > 0 ? "段落" : "",
          Number(source.currentSegmentNumber) > 0 ? "当前第 " + String(Number(source.currentSegmentNumber)) + " 段" : "",
          true,
        ],
        [
          "当前段",
          selectedRange
            ? "开始 " +
              formatSecondsFromMs(selectedRange.startMs) +
              " 秒，结束 " +
              formatSecondsFromMs(selectedRange.endMs) +
              " 秒，截取 " +
              formatSecondsFromMs(selectedRange.durationMs) +
              " 秒"
            : "",
          false,
        ],
      ]
        .filter(function (item) {
          return normalizeText(item[0]) && normalizeText(item[1]);
        })
        .forEach(function (item) {
          const line = document.createElement("div");
          line.className = "audio-url-line";
          const labelNode = document.createElement("span");
          labelNode.className = "audio-url-label";
          labelNode.textContent = String(item[0]) + "：";
          const valueNode = document.createElement("span");
          valueNode.className = item[2] ? "audio-url-value is-emphasis" : "audio-url-value";
          valueNode.textContent = String(item[1] || "");
          line.appendChild(labelNode);
          line.appendChild(valueNode);
          summary.appendChild(line);
        });

      const link = document.createElement("a");
      link.className = "audio-url-link";
      link.setAttribute("href", audioUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.textContent = "打开当前音频 URL";

      const details = document.createElement("details");
      details.className = "audio-url-details";
      const detailsSummary = document.createElement("summary");
      detailsSummary.textContent = "展开查看完整地址";
      const fullUrl = document.createElement("pre");
      fullUrl.className = "audio-url-full";
      fullUrl.textContent = audioUrl;
      details.appendChild(detailsSummary);
      details.appendChild(fullUrl);

      audioNode.appendChild(summary);
      audioNode.appendChild(link);
      audioNode.appendChild(details);
    }

    function setSegmentPreviewAutoApplyEnabled(enabled) {
      if (autoApplyToggleNode) {
        autoApplyToggleNode.checked = enabled !== false;
      }
    }

    function ensureRightRoot() {
      if (rightRoot && rightRoot.isConnected) {
        return rightRoot;
      }
      rightRoot = document.createElement("section");
      rightRoot.setAttribute(ROOT_ATTR, "");

      rightPanelNode = document.createElement("div");
      rightPanelNode.innerHTML =
        '<div class="panel-title">柳州话脚本 Beta</div><div class="panel-subtitle">CVPC /app/editor/asr/ 建议生成 + 人工确认</div>';

      statusNode = document.createElement("div");
      statusNode.className = "status";

      const audioSection = document.createElement("div");
      audioSection.className = "section";
      audioSection.innerHTML =
        '<div class="panel-title">当前音频地址</div><div class="panel-subtitle">页面刷新后自动获取，仅在右侧连续信息区显示当前音频与当前段摘要。</div>';
      audioNode = document.createElement("div");
      audioNode.className = "info-box";
      audioNode.setAttribute("data-empty", "true");
      audioNode.textContent = "正在获取当前音频地址...";
      audioSection.appendChild(audioNode);

      const foot = document.createElement("div");
      foot.className = "panel-foot";
      foot.textContent = "提示：AI 识别与分段建议已集中到中间区域；应用后仍需人工复核并手动保存。";

      rightPanelNode.appendChild(statusNode);
      rightPanelNode.appendChild(audioSection);
      rightPanelNode.appendChild(foot);
      rightRoot.appendChild(rightPanelNode);
      return rightRoot;
    }

    function ensureMiddleAiRoot() {
      if (middleAiRoot && middleAiRoot.isConnected) {
        return middleAiRoot;
      }
      middleAiRoot = document.createElement("section");
      middleAiRoot.setAttribute(MIDDLE_AI_ATTR, "");

      const head = document.createElement("div");
      head.innerHTML =
        '<div class="section-title">柳州话 AI 识别助手</div><div class="section-note">当前段识别、批量识别、分段建议和 AI 信息集中展示在这里。</div>';

      const currentSection = document.createElement("div");
      currentSection.className = "section";
      currentSection.innerHTML =
        '<div class="section-title">当前段识别</div><div class="section-note">用于当前选中段的识别、文本建议应用和有效性补填。</div>';

      const currentActionsNode = document.createElement("div");
      currentActionsNode.setAttribute(MIDDLE_AI_ACTIONS_ATTR, "");
      [
        ["当前段识别", false, "accent", deps.onRecommend],
        ["未填写补 Valid", false, "accent", deps.onFillAllValid],
      ].forEach(function (definition) {
        const button = createButton(definition[0], definition[1], definition[2]);
        button.addEventListener("click", function () {
          if (typeof definition[3] === "function") {
            definition[3]();
          }
        });
        currentActionsNode.appendChild(button);
      });
      currentSection.appendChild(currentActionsNode);

      const previewSection = document.createElement("div");
      previewSection.className = "section";
      previewSection.innerHTML =
        '<div class="section-title">分段建议</div><div class="section-note">建议只会作用于当前音频的分段状态；应用后仍需你手动点击平台保存。</div>';

      const toggleRow = document.createElement("label");
      toggleRow.className = "inline-toggle";
      autoApplyToggleNode = document.createElement("input");
      autoApplyToggleNode.type = "checkbox";
      autoApplyToggleNode.checked = deps.segmentPreviewAutoApplyEnabled !== false;
      autoApplyToggleNode.addEventListener("change", function () {
        if (typeof deps.onToggleSegmentPreviewAutoApply === "function") {
          deps.onToggleSegmentPreviewAutoApply(autoApplyToggleNode.checked === true);
        }
      });
      const toggleText = document.createElement("span");
      toggleText.textContent = "生成后自动应用分段建议";
      toggleRow.appendChild(autoApplyToggleNode);
      toggleRow.appendChild(toggleText);

      middleActionsNode = document.createElement("div");
      middleActionsNode.className = "section-actions";
      [
        ["生成分段建议", false, "accent", deps.onPreview],
        ["应用分段建议", false, "accent", deps.onApplyPreview],
      ].forEach(function (definition) {
        const button = createButton(definition[0], definition[1], definition[2]);
        button.addEventListener("click", function () {
          if (typeof definition[3] === "function") {
            definition[3]();
          }
        });
        middleActionsNode.appendChild(button);
      });
      previewSection.appendChild(toggleRow);
      previewSection.appendChild(middleActionsNode);

      const batchSection = document.createElement("div");
      batchSection.className = "section";
      batchSection.innerHTML =
        '<div class="section-title">批量识别</div><div class="section-note">仅作用于当前音频；默认全选，可点击段号或拖动连续选择。</div>';

      const batchControls = document.createElement("div");
      batchControls.className = "batch-controls";

      const batchSelector = document.createElement("div");
      batchSelector.className = "batch-selector";
      const batchSelectorHead = document.createElement("div");
      batchSelectorHead.className = "batch-selector-head";
      batchSelectionSummaryNode = document.createElement("div");
      batchSelectionSummaryNode.className = "batch-selector-summary";
      batchSelectionSummaryNode.textContent = "当前选择：正在读取段落...";
      batchSelectorHead.appendChild(batchSelectionSummaryNode);
      batchSelectionGridNode = document.createElement("div");
      batchSelectionGridNode.className = "batch-selector-grid";
      const batchHelp = document.createElement("div");
      batchHelp.className = "batch-help";
      batchHelp.textContent = "默认处理当前音频全部段；只处理当前 entry，不会自动提交或切下一条。";
      batchSelector.appendChild(batchSelectorHead);
      batchSelector.appendChild(batchSelectionGridNode);
      batchSelector.appendChild(batchHelp);

      const batchActionRow = document.createElement("div");
      batchActionRow.className = "batch-action-row";
      const batchStartButton = createButton("批量识别并填入", false, "accent");
      batchStartButton.addEventListener("click", function () {
        if (typeof deps.onBatchRecommend === "function") {
          deps.onBatchRecommend(getBatchSelectionSpec());
        }
      });
      const batchStopButton = createButton("停止批量", false);
      batchStopButton.addEventListener("click", function () {
        if (typeof deps.onBatchStop === "function") {
          deps.onBatchStop();
        }
      });
      batchActionRow.appendChild(batchStartButton);
      batchActionRow.appendChild(batchStopButton);

      batchStateNode = document.createElement("div");
      batchStateNode.className = "batch-state-list";
      batchStateNode.textContent = "当前没有批量任务。";

      batchControls.appendChild(batchSelector);
      batchControls.appendChild(batchActionRow);
      batchControls.appendChild(batchStateNode);
      batchSection.appendChild(batchControls);

      previewNode = document.createElement("div");
      previewNode.className = "preview-list";
      previewNode.textContent = "当前还没有分段建议。";
      previewSection.appendChild(previewNode);

      const recommendSection = document.createElement("div");
      recommendSection.className = "section";
      recommendSection.innerHTML =
        '<div class="section-title">AI信息</div><div class="section-note">展示听音识别、文本修正、听音文本和原始返回内容，默认折叠，不占用真实输入字段。</div>';
      const metaDetails = document.createElement("details");
      metaDetails.className = "meta-details";
      const metaSummary = document.createElement("summary");
      metaSummary.textContent = "展开查看 AI 信息";
      const metaContent = document.createElement("div");
      metaContent.className = "meta-details-content";
      recommendationMetaNode = document.createElement("div");
      recommendationMetaNode.className = "meta-list";
      metaContent.appendChild(recommendationMetaNode);
      metaDetails.appendChild(metaSummary);
      metaDetails.appendChild(metaContent);
      recommendSection.appendChild(metaDetails);
      renderRecommendationMeta(null);

      middleAiRoot.appendChild(head);
      middleAiRoot.appendChild(currentSection);
      middleAiRoot.appendChild(batchSection);
      middleAiRoot.appendChild(previewSection);
      middleAiRoot.appendChild(recommendSection);
      if (!batchSelectionPointerCleanup) {
        const releaseHandler = function () {
          stopBatchSelectionDrag();
        };
        const windowLike = globalThis.window || null;
        if (windowLike && typeof windowLike.addEventListener === "function") {
          windowLike.addEventListener("mouseup", releaseHandler);
          windowLike.addEventListener("blur", releaseHandler);
          batchSelectionPointerCleanup = function () {
            windowLike.removeEventListener?.("mouseup", releaseHandler);
            windowLike.removeEventListener?.("blur", releaseHandler);
          };
        }
      }
      return middleAiRoot;
    }

    function ensureFieldRecommendationRoot(fieldBlock, _emptyText) {
      const valueHost = resolveFieldValueHost(fieldBlock);
      if (!(valueHost instanceof HTMLElement)) {
        return null;
      }
      const existing = Array.from(valueHost.children || []).find(function (node) {
        return node instanceof HTMLElement && node.hasAttribute(FIELD_RECOMMEND_ATTR);
      });
      if (existing) {
        return existing;
      }
      const root = document.createElement("div");
      root.setAttribute(FIELD_RECOMMEND_ATTR, "");
      valueHost.appendChild(root);
      return root;
    }

    function mount() {
      ensureStyle();
      const bodyHost = getBodyHost();
      if (!bodyHost) {
        return false;
      }
      removeLegacySegmentButtons();
      const annotationHost = resolveGlobalAnnotationHost();
      if (!(annotationHost instanceof HTMLElement)) {
        return false;
      }
      const annotationContentHost = resolveGlobalAnnotationContentHost(annotationHost);
      if (!(annotationContentHost instanceof HTMLElement)) {
        return false;
      }
      ensureRightRoot();
      if (rightRoot.parentNode !== annotationContentHost) {
        annotationContentHost.appendChild(rightRoot);
      }

      const validityFieldBlock = findFieldBlock(["是否有效（Valid or Not）", "是否有效"]);
      const dialectFieldBlock = findFieldBlock(["标注文本", "柳州话", "转写文本"]);
      const mandarinFieldBlock = findFieldBlock(["普通话顺滑", "普通话", "顺滑"]);
      if (dialectFieldBlock instanceof HTMLElement) {
        dialectRecommendationNode = ensureFieldRecommendationRoot(
          dialectFieldBlock,
          "当前还没有柳州话 AI 推荐结果。"
        );
      }
      if (mandarinFieldBlock instanceof HTMLElement) {
        mandarinRecommendationNode = ensureFieldRecommendationRoot(
          mandarinFieldBlock,
          "当前还没有普通话 AI 推荐结果。"
        );
      }
      const formRoot = resolveFieldGroupHost(validityFieldBlock);
      if (formRoot instanceof HTMLElement) {
        ensureMiddleAiRoot();
        if (middleAiRoot.parentNode !== formRoot) {
          insertAfter(formRoot, validityFieldBlock, middleAiRoot);
        }
      }
      const middleBranch =
        resolveHostBranch(annotationContentHost, middleAiRoot) ||
        resolveHostBranch(annotationContentHost, formRoot);
      if (middleBranch && rightRoot.parentNode === annotationContentHost && rightRoot !== middleBranch) {
        annotationContentHost.insertBefore(rightRoot, middleBranch);
      }
      return true;
    }

    function destroy() {
      if (rightRoot && rightRoot.parentNode) {
        rightRoot.parentNode.removeChild(rightRoot);
      }
      if (middleAiRoot && middleAiRoot.parentNode) {
        middleAiRoot.parentNode.removeChild(middleAiRoot);
      }
      [dialectRecommendationNode, mandarinRecommendationNode].forEach(function (node) {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
      rightRoot = null;
      rightPanelNode = null;
      middleAiRoot = null;
      middleActionsNode = null;
      statusNode = null;
      audioNode = null;
      previewNode = null;
      recommendationMetaNode = null;
      dialectRecommendationNode = null;
      mandarinRecommendationNode = null;
      batchSelectionSummaryNode = null;
      batchSelectionGridNode = null;
      batchStateNode = null;
      autoApplyToggleNode = null;
      batchSelectionState = {
        totalSegments: 0,
        selectedNumbers: [],
        dragging: false,
        dragNextSelected: true,
      };
      if (typeof batchSelectionPointerCleanup === "function") {
        batchSelectionPointerCleanup();
      }
      batchSelectionPointerCleanup = null;
    }

    return {
      mount,
      destroy,
      renderAudioContext,
      renderBatchState,
      renderBatchSelection,
      setStatus,
      renderPreview,
      renderRecommendation,
      setSegmentPreviewAutoApplyEnabled,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouUiPanel = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
