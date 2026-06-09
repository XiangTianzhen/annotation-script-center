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
      "[" + ROOT_ATTR + "] .info-box[data-empty='true'] { color: #909399; word-break: normal; }",
      "[" + ROOT_ATTR + "] .audio-url-summary { color: #606266; word-break: normal; }",
      "[" + ROOT_ATTR + "] .audio-url-link { display: inline-block; margin-top: 6px; color: #526aff; text-decoration: none; }",
      "[" + ROOT_ATTR + "] .audio-url-link:hover { text-decoration: underline; }",
      "[" + ROOT_ATTR + "] .audio-url-details { margin-top: 8px; }",
      "[" + ROOT_ATTR + "] .audio-url-details summary { cursor: pointer; color: #909399; user-select: none; }",
      "[" + ROOT_ATTR + "] .audio-url-full { margin: 6px 0 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }",
      "[" + ROOT_ATTR + "] .panel-foot { margin-top: 10px; color: #909399; }",
      "[" + MIDDLE_AI_ATTR + "] {",
      "  margin-top: 12px;",
      "  padding-top: 12px;",
      "  border-top: 1px solid #ebeef5;",
      "}",
      "[" + MIDDLE_AI_ACTIONS_ATTR + "] { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }",
      "[" + MIDDLE_AI_ATTR + "] .preview-list, [" + MIDDLE_AI_ATTR + "] .meta-list, [" + FIELD_RECOMMEND_ATTR + "] {",
      "  margin-top: 8px;",
      "  display: grid;",
      "  gap: 8px;",
      "}",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item strong, [" + MIDDLE_AI_ATTR + "] .preview-item strong, [" + MIDDLE_AI_ATTR + "] .meta-box strong {",
      "  display: block;",
      "  color: #303133;",
      "}",
      "[" + FIELD_RECOMMEND_ATTR + "] .recommend-item-action { margin-top: 8px; }",
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
      "  color: #526aff;",
      "  border-color: #c6d1ff;",
      "  background: #f5f7ff;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true'], [" + MIDDLE_AI_ATTR + "] button[data-primary='true'] {",
      "  background: #526aff;",
      "  border-color: #526aff;",
      "  color: #fff;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true']:hover, [" + MIDDLE_AI_ATTR + "] button[data-primary='true']:hover {",
      "  background: #6a80ff;",
      "  border-color: #6a80ff;",
      "  color: #fff;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function createButton(text, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = primary
      ? "el-button el-button--primary el-button--mini"
      : "el-button el-button--default el-button--mini";
    if (primary) {
      button.setAttribute("data-primary", "true");
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
    const titleNode = document.createElement("strong");
    titleNode.textContent = String(title || "");
    const valueNode = document.createElement("div");
    valueNode.textContent = String(value || "");
    box.appendChild(titleNode);
    box.appendChild(valueNode);
    if (normalizeText(value) && normalizeText(buttonText) && typeof callback === "function") {
      const actionRow = document.createElement("div");
      actionRow.className = "recommend-item-action";
      const button = createButton(buttonText, false);
      button.addEventListener("click", callback);
      actionRow.appendChild(button);
      box.appendChild(actionRow);
    }
    return box;
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
      previewNode.innerHTML = "";
      const items = Array.isArray(preview?.items) ? preview.items : [];
      if (items.length === 0) {
        previewNode.textContent = "当前还没有画段建议。";
        return;
      }
      items.forEach(function (item, index) {
        const box = document.createElement("div");
        box.className = "preview-item";
        box.innerHTML = [
          "<strong>建议 " + String(index + 1) + "</strong>",
          "<div>" + formatSecondsFromMs(item.startMs) + " 秒 - " + formatSecondsFromMs(item.endMs) + " 秒</div>",
          "<div>原因：" + String(item.reason || "") + "</div>",
          "<div>需人工复核：" + (item.needsHumanReview === true ? "是" : "否") + "</div>",
        ].join("");
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
      recommendationMetaNode.innerHTML = "";
      [
        ["特殊标签", (result?.specialTags || []).join(" ") || "无"],
        ["需人工复核", result?.needHumanReview === true ? "是" : "否"],
        ["备注", (result?.notes || []).join("；") || "无"],
      ].forEach(function (item) {
        const box = document.createElement("div");
        box.className = "meta-box";
        box.innerHTML = "<strong>" + item[0] + "</strong><div>" + String(item[1] || "") + "</div>";
        recommendationMetaNode.appendChild(box);
      });
    }

    function renderRecommendation(result) {
      if (!dialectRecommendationNode || !mandarinRecommendationNode || !recommendationMetaNode) {
        return;
      }
      dialectRecommendationNode.innerHTML = "";
      mandarinRecommendationNode.innerHTML = "";
      if (!result || result.success !== true) {
        dialectRecommendationNode.textContent = "当前还没有柳州话 AI 推荐结果。";
        mandarinRecommendationNode.textContent = "当前还没有普通话 AI 推荐结果。";
        renderRecommendationMeta(null);
        return;
      }
      const audioDialectText = String(result.audioDialectText || result.dialectText || "");
      const audioMandarinText = String(result.audioMandarinText || result.mandarinText || "");
      const refinedDialectText = String(result.refinedDialectText || result.dialectText || "");
      [
        {
          host: dialectRecommendationNode,
          title: "音频的柳州话文本",
          value: audioDialectText,
          buttonText: "填入标注文本",
          applyKey: "audioDialectText",
        },
        {
          host: mandarinRecommendationNode,
          title: "音频的普通话文本",
          value: audioMandarinText,
          buttonText: "填入普通话顺滑",
          applyKey: "audioMandarinText",
        },
        {
          host: dialectRecommendationNode,
          title: "修正后的柳州话文本",
          value: refinedDialectText,
          buttonText: "填入标注文本",
          applyKey: "refinedDialectText",
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
      renderRecommendationMeta(result);
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
      summary.textContent = [
        entryName ? "文件：" + entryName : "",
        sourceText ? "来源：" + sourceText : "",
        Number(source.currentSegmentNumber) > 0 ? "当前第 " + String(Number(source.currentSegmentNumber)) + " 段" : "",
        selectedRange
          ? "当前段：开始 " +
            formatSecondsFromMs(selectedRange.startMs) +
            " 秒；结束 " +
            formatSecondsFromMs(selectedRange.endMs) +
            " 秒；截取 " +
            formatSecondsFromMs(selectedRange.durationMs) +
            " 秒"
          : "",
      ]
        .filter(Boolean)
        .join("；");

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
      foot.textContent = "提示：AI 建议与画段建议已集中到中间区域；真实写入仍需人工复核。";

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
        '<div class="section-title">柳州话脚本 AI 区</div><div class="section-note">当前段推荐、画段建议与辅助动作统一集中在这里。</div>';

      middleActionsNode = document.createElement("div");
      middleActionsNode.setAttribute(MIDDLE_AI_ACTIONS_ATTR, "");
      [
        ["当前段 AI 推荐", true, deps.onRecommend],
        ["未填写补 Valid", false, deps.onFillAllValid],
        ["生成画段建议", true, deps.onPreview],
        ["应用当前建议", false, deps.onApplyPreview],
      ].forEach(function (definition) {
        const button = createButton(definition[0], definition[1]);
        button.addEventListener("click", function () {
          if (typeof definition[2] === "function") {
            definition[2]();
          }
        });
        middleActionsNode.appendChild(button);
      });

      const previewSection = document.createElement("div");
      previewSection.className = "section";
      previewSection.innerHTML =
        '<div class="section-title">当前画段建议</div><div class="section-note">只展示建议，真实画段仍需人工确认。</div>';
      previewNode = document.createElement("div");
      previewNode.className = "preview-list";
      previewNode.textContent = "当前还没有画段建议。";
      previewSection.appendChild(previewNode);

      const recommendSection = document.createElement("div");
      recommendSection.className = "section";
      recommendSection.innerHTML =
        '<div class="section-title">当前段 AI 附加信息</div><div class="section-note">特殊标签、人工复核和备注保留在独立 AI 区，避免占用真实输入字段。</div>';
      recommendationMetaNode = document.createElement("div");
      recommendationMetaNode.className = "meta-list";
      recommendSection.appendChild(recommendationMetaNode);
      renderRecommendationMeta(null);

      middleAiRoot.appendChild(head);
      middleAiRoot.appendChild(middleActionsNode);
      middleAiRoot.appendChild(previewSection);
      middleAiRoot.appendChild(recommendSection);
      return middleAiRoot;
    }

    function ensureFieldRecommendationRoot(fieldBlock, emptyText) {
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
      root.textContent = String(emptyText || "");
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
      const formRoot =
        validityFieldBlock?.parentNode instanceof HTMLElement ? validityFieldBlock.parentNode : null;
      if (formRoot instanceof HTMLElement) {
        ensureMiddleAiRoot();
        if (middleAiRoot.parentNode !== formRoot) {
          insertAfter(formRoot, validityFieldBlock, middleAiRoot);
        }
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
    }

    return {
      mount,
      destroy,
      renderAudioContext,
      setStatus,
      renderPreview,
      renderRecommendation,
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
