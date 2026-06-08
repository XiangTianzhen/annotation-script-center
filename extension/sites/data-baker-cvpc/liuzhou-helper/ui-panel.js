(function () {
  const ROOT_ATTR = "data-asc-cvpc-liuzhou-panel";
  const SEGMENT_BUTTON_ATTR = "data-asc-cvpc-liuzhou-segment-button";
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
      "[" + ROOT_ATTR + "] {",
      "  color: #303133;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .panel { margin-top: 10px; padding-top: 10px; border-top: 1px solid #ebeef5; }",
      "[" + ROOT_ATTR + "] .head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }",
      "[" + ROOT_ATTR + "] .title { font-size:14px; font-weight:700; color:#92400e; }",
      "[" + ROOT_ATTR + "] .sub { margin-top:2px; color:#909399; }",
      "[" + ROOT_ATTR + "] .status { margin-top:8px; color:#606266; white-space:pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color:#f56c6c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color:#67c23a; }",
      "[" + ROOT_ATTR + "] .section { margin-top:12px; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight:700; color:#303133; }",
      "[" + ROOT_ATTR + "] .section-note { margin-top:4px; color:#909399; }",
      "[" + ROOT_ATTR + "] .audio-url-box, [" + ROOT_ATTR + "] .preview-item, [" + ROOT_ATTR + "] .recommend-item, [" + ROOT_ATTR + "] .meta-box {",
      "  margin-top:8px;",
      "  padding:8px;",
      "  border:1px solid #ebeef5;",
      "  border-radius:8px;",
      "  background:#f8fafc;",
      "  color:#334155;",
      "  overflow-wrap:anywhere;",
      "  word-break:break-word;",
      "}",
      "[" + ROOT_ATTR + "] .audio-url-box[data-empty='true'] { color:#909399; word-break:normal; }",
      "[" + ROOT_ATTR + "] .audio-url-summary { color:#334155; word-break:normal; }",
      "[" + ROOT_ATTR + "] .audio-url-link { display:inline-block; margin-top:6px; color:#409eff; text-decoration:none; font-weight:700; }",
      "[" + ROOT_ATTR + "] .audio-url-link:hover { text-decoration:underline; }",
      "[" + ROOT_ATTR + "] .audio-url-details { margin-top:8px; }",
      "[" + ROOT_ATTR + "] .audio-url-details summary { cursor:pointer; color:#909399; user-select:none; }",
      "[" + ROOT_ATTR + "] .audio-url-full { margin:6px 0 0; white-space:pre-wrap; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; }",
      "[" + ROOT_ATTR + "] .preview-list, [" + ROOT_ATTR + "] .recommend-grid { margin-top:8px; display:grid; gap:8px; }",
      "[" + ROOT_ATTR + "] .preview-item strong, [" + ROOT_ATTR + "] .recommend-item strong { display:block; color:#334155; }",
      "[" + ROOT_ATTR + "] .recommend-item-action { margin-top:8px; }",
      "[" + ROOT_ATTR + "] .action-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }",
      "[" + ROOT_ATTR + "] .meta-list { margin-top:8px; display:grid; gap:8px; }",
      "[" + ROOT_ATTR + "] button, [" + SEGMENT_BUTTON_ATTR + "] {",
      "  min-height: 28px;",
      "  padding: 7px 12px;",
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
      "[" + ROOT_ATTR + "] button[data-primary='true'], [" + SEGMENT_BUTTON_ATTR + "][data-primary='true'] {",
      "  background: #e6a23c;",
      "  border-color: #e6a23c;",
      "  color: #fff;",
      "}",
      "[" + ROOT_ATTR + "] button:hover, [" + SEGMENT_BUTTON_ATTR + "]:hover {",
      "  color: #409eff;",
      "  border-color: #c6e2ff;",
      "  background: #ecf5ff;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true']:hover, [" + SEGMENT_BUTTON_ATTR + "][data-primary='true']:hover {",
      "  color: #fff;",
      "  border-color: #ebb563;",
      "  background: #ebb563;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function createButton(text, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = primary
      ? "el-button el-button--warning el-button--mini"
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

  function resolveSegmentActionsHost() {
    const host = document.querySelector(".bottom-right");
    return host instanceof HTMLElement ? host : null;
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
    let root = null;
    let previewButton = null;
    let applyPreviewButton = null;
    let panelNode = null;
    let statusNode = null;
    let audioNode = null;
    let previewSectionNode = null;
    let previewNode = null;
    let recommendSectionNode = null;
    let recommendationNode = null;
    let recommendationMetaNode = null;

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
      if (previewSectionNode && panelNode && previewSectionNode.parentNode !== panelNode) {
        panelNode.insertBefore(previewSectionNode, recommendSectionNode || null);
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

    function renderRecommendation(result) {
      if (!recommendationNode || !recommendationMetaNode) {
        return;
      }
      recommendationNode.innerHTML = "";
      recommendationMetaNode.innerHTML = "";
      if (!result || result.success !== true) {
        recommendationNode.textContent = "当前还没有 AI 推荐结果。";
        return;
      }

      const audioDialectText = String(result.audioDialectText || result.dialectText || "");
      const audioMandarinText = String(result.audioMandarinText || result.mandarinText || "");
      const refinedDialectText = String(result.refinedDialectText || result.dialectText || "");
      [
        {
          title: "音频的柳州话文本",
          value: audioDialectText,
          buttonText: "填入标注文本",
          applyKey: "audioDialectText",
        },
        {
          title: "音频的普通话文本",
          value: audioMandarinText,
          buttonText: "填入普通话顺滑",
          applyKey: "audioMandarinText",
        },
        {
          title: "修正后的柳州话文本",
          value: refinedDialectText,
          buttonText: "填入标注文本",
          applyKey: "refinedDialectText",
        },
      ].forEach(function (item) {
        recommendationNode.appendChild(
          createRecommendationCard(item.title, item.value, item.buttonText, function () {
            if (typeof deps.onApplyRecommendationText === "function") {
              deps.onApplyRecommendationText(item.applyKey);
            }
          })
        );
      });

      [
        ["特殊标签", (result.specialTags || []).join(" ") || "无"],
        ["需人工复核", result.needHumanReview === true ? "是" : "否"],
        ["备注", (result.notes || []).join("；") || "无"],
      ].forEach(function (item) {
        const box = document.createElement("div");
        box.className = "meta-box";
        box.innerHTML = "<strong>" + item[0] + "</strong><div>" + String(item[1] || "") + "</div>";
        recommendationMetaNode.appendChild(box);
      });
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

    function ensureRoot() {
      if (root && root.isConnected) {
        return root;
      }
      root = document.createElement("section");
      root.setAttribute(ROOT_ATTR, "");
      panelNode = document.createElement("div");
      panelNode.className = "panel";

      const head = document.createElement("div");
      head.className = "head";
      head.innerHTML =
        '<div><div class="title">柳州话脚本 Beta</div><div class="sub">CVPC /app/editor/asr/ 建议生成 + 人工确认</div></div>';

      statusNode = document.createElement("div");
      statusNode.className = "status";

      const audioSection = document.createElement("div");
      audioSection.className = "section";
      audioSection.innerHTML =
        '<div class="section-title">当前音频地址</div><div class="section-note">页面刷新后自动获取，仅在右侧助手区显示当前音频与当前段摘要。</div>';
      audioNode = document.createElement("div");
      audioNode.className = "audio-url-box";
      audioNode.setAttribute("data-empty", "true");
      audioNode.textContent = "正在获取当前音频地址...";
      audioSection.appendChild(audioNode);

      previewSectionNode = document.createElement("div");
      previewSectionNode.className = "section";
      previewSectionNode.innerHTML =
        '<div class="section-title">当前画段建议</div><div class="section-note">只展示建议，真实画段仍需人工确认。</div>';
      previewNode = document.createElement("div");
      previewNode.className = "preview-list";
      previewNode.textContent = "当前还没有画段建议。";
      previewSectionNode.appendChild(previewNode);

      recommendSectionNode = document.createElement("div");
      recommendSectionNode.className = "section";
      recommendSectionNode.innerHTML =
        '<div class="section-title">当前段 AI 推荐结果</div><div class="section-note">展示听音与文本修正两阶段结果；AI 只提供建议，不自动保存、不自动提交。</div>';
      recommendationNode = document.createElement("div");
      recommendationNode.className = "recommend-grid";
      recommendationNode.textContent = "当前还没有 AI 推荐结果。";
      recommendationMetaNode = document.createElement("div");
      recommendationMetaNode.className = "meta-list";
      recommendSectionNode.appendChild(recommendationNode);
      recommendSectionNode.appendChild(recommendationMetaNode);

      const actionSection = document.createElement("div");
      actionSection.className = "section";
      actionSection.innerHTML =
        '<div class="section-title">助手动作</div><div class="section-note">只处理当前左侧选中段，不自动保存、不自动提交。</div>';
      const actionRow = document.createElement("div");
      actionRow.className = "action-row";
      const recommendButton = createButton("当前段 AI 推荐", true);
      const markValidButton = createButton("设为 Valid", false);
      const markInvalidButton = createButton("设为 Invalid", false);
      const fillAllValidButton = createButton("未填写补 Valid", false);
      recommendButton.addEventListener("click", function () {
        deps.onRecommend && deps.onRecommend();
      });
      markValidButton.addEventListener("click", function () {
        deps.onMarkValid && deps.onMarkValid();
      });
      markInvalidButton.addEventListener("click", function () {
        deps.onMarkInvalid && deps.onMarkInvalid();
      });
      fillAllValidButton.addEventListener("click", function () {
        deps.onFillAllValid && deps.onFillAllValid();
      });
      actionRow.appendChild(recommendButton);
      actionRow.appendChild(markValidButton);
      actionRow.appendChild(markInvalidButton);
      actionRow.appendChild(fillAllValidButton);
      actionSection.appendChild(actionRow);

      panelNode.appendChild(head);
      panelNode.appendChild(statusNode);
      panelNode.appendChild(audioSection);
      panelNode.appendChild(recommendSectionNode);
      panelNode.appendChild(actionSection);
      root.appendChild(panelNode);
      return root;
    }

    function ensureSegmentButtons() {
      if (!previewButton || !previewButton.isConnected) {
        previewButton = createButton("生成画段建议", true);
        previewButton.setAttribute(SEGMENT_BUTTON_ATTR, "");
        previewButton.addEventListener("click", function () {
          deps.onPreview && deps.onPreview();
        });
      }
      if (!applyPreviewButton || !applyPreviewButton.isConnected) {
        applyPreviewButton = createButton("应用当前建议", false);
        applyPreviewButton.setAttribute(SEGMENT_BUTTON_ATTR, "");
        applyPreviewButton.addEventListener("click", function () {
          deps.onApplyPreview && deps.onApplyPreview();
        });
      }
    }

    function mount() {
      ensureStyle();
      const bodyHost = getBodyHost();
      if (!bodyHost) {
        return false;
      }
      const annotationHost = resolveGlobalAnnotationHost();
      if (!(annotationHost instanceof HTMLElement)) {
        return false;
      }
      ensureRoot();
      ensureSegmentButtons();
      if (root.parentNode !== annotationHost) {
        annotationHost.appendChild(root);
      }

      const segmentHost = resolveSegmentActionsHost();
      if (segmentHost instanceof HTMLElement) {
        const firstChild = Array.from(segmentHost.children || [])[0] || null;
        if (firstChild !== previewButton) {
          segmentHost.insertBefore(previewButton, firstChild);
        }
        const currentChildren = Array.from(segmentHost.children || []);
        const secondChild = currentChildren[1] || null;
        if (secondChild !== applyPreviewButton) {
          segmentHost.insertBefore(applyPreviewButton, secondChild);
        }
      }
      return true;
    }

    function destroy() {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      if (previewButton && previewButton.parentNode) {
        previewButton.parentNode.removeChild(previewButton);
      }
      if (applyPreviewButton && applyPreviewButton.parentNode) {
        applyPreviewButton.parentNode.removeChild(applyPreviewButton);
      }
      root = null;
      previewButton = null;
      applyPreviewButton = null;
      statusNode = null;
      audioNode = null;
      previewNode = null;
      recommendationNode = null;
      recommendationMetaNode = null;
      panelNode = null;
      previewSectionNode = null;
      recommendSectionNode = null;
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
