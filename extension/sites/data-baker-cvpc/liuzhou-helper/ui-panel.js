(function () {
  const ROOT_ATTR = "data-asc-cvpc-liuzhou-panel";
  const SEGMENT_ACTIONS_ATTR = "data-asc-cvpc-liuzhou-segment-actions";
  const VALIDITY_ACTIONS_ATTR = "data-asc-cvpc-liuzhou-validity-actions";
  const VALIDITY_ACTION_ROW_ATTR = "data-asc-cvpc-liuzhou-validity-row";
  const RECOMMEND_ACTIONS_ATTR = "data-asc-cvpc-liuzhou-recommend-actions";
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
      "  margin-top: 12px;",
      "  padding-top: 12px;",
      "  border-top: 1px solid #ebeef5;",
      "  color: #303133;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }",
      "[" + ROOT_ATTR + "] .title { font-size:14px; font-weight:700; color:#92400e; }",
      "[" + ROOT_ATTR + "] .sub { margin-top:2px; color:#909399; }",
      "[" + ROOT_ATTR + "] .status { margin-top:8px; color:#606266; white-space:pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color:#f56c6c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color:#67c23a; }",
      "[" + ROOT_ATTR + "] .section { margin-top:12px; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight:700; color:#303133; }",
      "[" + ROOT_ATTR + "] .section-note { margin-top:4px; color:#909399; }",
      "[" + ROOT_ATTR + "] .audio-url-box { margin-top:8px; padding:8px; border:1px solid #ebeef5; border-radius:8px; background:#f8fafc; color:#334155; overflow-wrap:anywhere; word-break:break-all; }",
      "[" + ROOT_ATTR + "] .audio-url-box[data-empty='true'] { color:#909399; word-break:normal; }",
      "[" + ROOT_ATTR + "] .audio-url-summary { color:#334155; word-break:normal; }",
      "[" + ROOT_ATTR + "] .audio-url-link { display:inline-block; margin-top:6px; color:#409eff; text-decoration:none; font-weight:700; }",
      "[" + ROOT_ATTR + "] .audio-url-link:hover { text-decoration:underline; }",
      "[" + ROOT_ATTR + "] .audio-url-details { margin-top:8px; }",
      "[" + ROOT_ATTR + "] .audio-url-details summary { cursor:pointer; color:#909399; user-select:none; }",
      "[" + ROOT_ATTR + "] .audio-url-full { margin:6px 0 0; white-space:pre-wrap; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; }",
      "[" + ROOT_ATTR + "] .preview-list, [" + ROOT_ATTR + "] .recommend-grid { margin-top:8px; display:grid; gap:8px; }",
      "[" + ROOT_ATTR + "] .preview-item, [" + ROOT_ATTR + "] .recommend-item { padding:8px; border:1px solid #ebeef5; border-radius:8px; background:#f8fafc; }",
      "[" + ROOT_ATTR + "] .preview-item strong, [" + ROOT_ATTR + "] .recommend-item strong { display:block; color:#334155; }",
      "[" + ROOT_ATTR + "] button, [" + SEGMENT_ACTIONS_ATTR + "] button {",
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
      "[" + ROOT_ATTR + "] button[data-primary='true'], [" + SEGMENT_ACTIONS_ATTR + "] button[data-primary='true'] {",
      "  background: #e6a23c;",
      "  border-color: #e6a23c;",
      "  color: #fff;",
      "}",
      "[" + ROOT_ATTR + "] button:hover, [" + SEGMENT_ACTIONS_ATTR + "] button:hover {",
      "  color: #409eff;",
      "  border-color: #c6e2ff;",
      "  background: #ecf5ff;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true']:hover, [" + SEGMENT_ACTIONS_ATTR + "] button[data-primary='true']:hover {",
      "  color: #fff;",
      "  border-color: #ebb563;",
      "  background: #ebb563;",
      "}",
      "[" + ROOT_ATTR + "] .foot { margin-top:10px; color:#9a3412; }",
      "[" + SEGMENT_ACTIONS_ATTR + "] { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-right: 8px; }",
      "[" + VALIDITY_ACTION_ROW_ATTR + "] { display:flex; flex-wrap:wrap; align-items:center; gap:12px; }",
      "[" + VALIDITY_ACTIONS_ATTR + "] { display:flex; align-items:center; gap:8px; }",
      "[" + RECOMMEND_ACTIONS_ATTR + "] { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }",
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

  function findFieldBlock(labelMatchers) {
    if (typeof document.querySelectorAll !== "function") {
      return null;
    }
    const nodes = Array.from(
      document.querySelectorAll(".item-name, .quest-span, .el-only-child__content, label, span")
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
          (findDescendantByClassToken(scope, "w-[100%]") ||
            scope.querySelector(".el-radio-group, [contenteditable='true'], .tiptap.ProseMirror, [role='textbox']"))
        ) {
          return scope;
        }
        scope =
          scope.closest?.(".field-block, .el-form-item, .ant-form-item, .el-card, .ant-card") ||
          (scope.parentNode instanceof HTMLElement ? scope.parentNode : null);
      }
    }
    return null;
  }

  function findDirectChildByAttr(parent, attrName) {
    if (!(parent instanceof HTMLElement)) {
      return null;
    }
    const children = Array.from(parent.children || []);
    return (
      children.find(function (child) {
        if (!(child instanceof HTMLElement)) {
          return false;
        }
        if (typeof child.hasAttribute === "function") {
          return child.hasAttribute(attrName);
        }
        return Object.prototype.hasOwnProperty.call(child.attributes || {}, attrName);
      }) || null
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

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let root = null;
    let segmentActionsRoot = null;
    let validityActionsRoot = null;
    let recommendActionsRoot = null;
    let statusNode = null;
    let audioNode = null;
    let previewNode = null;
    let recommendationNode = null;

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
          "<div>" + String(item.startMs) + "ms - " + String(item.endMs) + "ms</div>",
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
      if (!recommendationNode) {
        return;
      }
      recommendationNode.innerHTML = "";
      if (!result || result.success !== true) {
        recommendationNode.textContent = "当前还没有 AI 推荐结果。";
        return;
      }
      [
        ["柳州话文本", result.dialectText],
        ["普通话顺滑", result.mandarinText],
        ["特殊标签", (result.specialTags || []).join(" ") || "无"],
        ["需人工复核", result.needHumanReview === true ? "是" : "否"],
        ["备注", (result.notes || []).join("；") || "无"],
      ].forEach(function (item) {
        const box = document.createElement("div");
        box.className = "recommend-item";
        box.innerHTML =
          "<strong>" +
          item[0] +
          "</strong><div>" +
          String(item[1] || "") +
          "</div>";
        recommendationNode.appendChild(box);
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
      const selectedRange = source.selectedRange && typeof source.selectedRange === "object"
        ? source.selectedRange
        : null;
      if (!audioUrl) {
        audioNode.setAttribute("data-empty", "true");
        audioNode.textContent =
          source.audioUrlHintMessage ||
          "暂未获取到当前音频地址，页面初始化完成后会自动刷新。";
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

    function mount() {
      ensureStyle();
      const bodyHost = getBodyHost();
      if (!bodyHost) {
        return false;
      }
      const annotationHost = resolveGlobalAnnotationHost();
      const segmentHost = resolveSegmentActionsHost();
      if (!(annotationHost instanceof HTMLElement) || !(segmentHost instanceof HTMLElement)) {
        return false;
      }

      if (!root || !root.isConnected) {
        root = document.createElement("section");
        root.setAttribute(ROOT_ATTR, "");

        const head = document.createElement("div");
        head.className = "head";
        head.innerHTML =
          '<div><div class="title">柳州话脚本 Beta</div><div class="sub">CVPC /app/editor/asr/ 建议生成 + 人工确认</div></div>';

        statusNode = document.createElement("div");
        statusNode.className = "status";

        const audioSection = document.createElement("div");
        audioSection.className = "section";
        audioSection.innerHTML =
          '<div class="section-title">当前音频地址</div><div class="section-note">页面刷新后自动获取，仅在本页运行时显示。</div>';
        audioNode = document.createElement("div");
        audioNode.className = "audio-url-box";
        audioNode.setAttribute("data-empty", "true");
        audioNode.textContent = "正在获取当前音频地址...";
        audioSection.appendChild(audioNode);

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
          '<div class="section-title">当前段 AI 推荐</div><div class="section-note">AI 只提供建议，不自动保存、不自动提交。</div>';
        recommendationNode = document.createElement("div");
        recommendationNode.className = "recommend-grid";
        recommendationNode.textContent = "当前还没有 AI 推荐结果。";
        recommendSection.appendChild(recommendationNode);

        const foot = document.createElement("div");
        foot.className = "foot";
        foot.textContent = "提示：真实 segment create/update、保存接口和稳定字段映射仍待补采；当前所有写入都必须人工复核。";

        root.appendChild(head);
        root.appendChild(statusNode);
        root.appendChild(audioSection);
        root.appendChild(previewSection);
        root.appendChild(recommendSection);
        root.appendChild(foot);
      }

      if (!segmentActionsRoot || !segmentActionsRoot.isConnected) {
        segmentActionsRoot = document.createElement("div");
        segmentActionsRoot.setAttribute(SEGMENT_ACTIONS_ATTR, "");
        const previewButton = createButton("生成画段建议", true);
        const applyPreviewButton = createButton("应用当前建议", false);
        previewButton.addEventListener("click", function () {
          deps.onPreview && deps.onPreview();
        });
        applyPreviewButton.addEventListener("click", function () {
          deps.onApplyPreview && deps.onApplyPreview();
        });
        segmentActionsRoot.appendChild(previewButton);
        segmentActionsRoot.appendChild(applyPreviewButton);
      }

      if (!validityActionsRoot || !validityActionsRoot.isConnected) {
        validityActionsRoot = document.createElement("div");
        validityActionsRoot.setAttribute(VALIDITY_ACTIONS_ATTR, "");
        const fillAllValidButton = createButton("未填写补 Valid", false);
        fillAllValidButton.addEventListener("click", function () {
          deps.onFillAllValid && deps.onFillAllValid();
        });
        validityActionsRoot.appendChild(fillAllValidButton);
      }

      if (!recommendActionsRoot || !recommendActionsRoot.isConnected) {
        recommendActionsRoot = document.createElement("div");
        recommendActionsRoot.setAttribute(RECOMMEND_ACTIONS_ATTR, "");
        const recommendButton = createButton("当前段 AI 推荐", true);
        const applyRecommendButton = createButton("填入当前推荐", false);
        recommendButton.addEventListener("click", function () {
          deps.onRecommend && deps.onRecommend();
        });
        applyRecommendButton.addEventListener("click", function () {
          deps.onApplyRecommend && deps.onApplyRecommend();
        });
        recommendActionsRoot.appendChild(recommendButton);
        recommendActionsRoot.appendChild(applyRecommendButton);
      }

      if (root.parentNode !== annotationHost) {
        annotationHost.appendChild(root);
      }
      const validityFieldBlock = findFieldBlock(["是否有效（Valid or Not）", "是否有效"]);
      const validityValueHost =
        findDescendantByClassToken(validityFieldBlock, "w-[100%]") ||
        validityFieldBlock;
      const radioGroup =
        validityValueHost?.querySelector?.(".el-radio-group") ||
        validityValueHost?.querySelector?.("[role='radiogroup']") ||
        null;
      if (validityValueHost instanceof HTMLElement && radioGroup instanceof HTMLElement) {
        let row = findDirectChildByAttr(validityValueHost, VALIDITY_ACTION_ROW_ATTR);
        if (!(row instanceof HTMLElement)) {
          row = document.createElement("div");
          row.setAttribute(VALIDITY_ACTION_ROW_ATTR, "");
          validityValueHost.insertBefore(row, radioGroup);
        }
        if (radioGroup.parentNode !== row) {
          row.appendChild(radioGroup);
        }
        if (validityActionsRoot.parentNode !== row) {
          row.appendChild(validityActionsRoot);
        }
      }
      const mandarinFieldBlock = findFieldBlock(["普通话顺滑", "普通话", "顺滑"]);
      const mandarinValueHost =
        findDescendantByClassToken(mandarinFieldBlock, "w-[100%]") ||
        mandarinFieldBlock;
      if (mandarinValueHost instanceof HTMLElement && recommendActionsRoot.parentNode !== mandarinValueHost) {
        mandarinValueHost.appendChild(recommendActionsRoot);
      }
      if (segmentActionsRoot.parentNode !== segmentHost) {
        const firstChild = segmentHost.children && segmentHost.children[0] ? segmentHost.children[0] : null;
        if (firstChild) {
          segmentHost.insertBefore(segmentActionsRoot, firstChild);
        } else {
          segmentHost.appendChild(segmentActionsRoot);
        }
      }
      return true;
    }

    function destroy() {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      if (segmentActionsRoot && segmentActionsRoot.parentNode) {
        segmentActionsRoot.parentNode.removeChild(segmentActionsRoot);
      }
      if (validityActionsRoot && validityActionsRoot.parentNode) {
        validityActionsRoot.parentNode.removeChild(validityActionsRoot);
      }
      if (recommendActionsRoot && recommendActionsRoot.parentNode) {
        recommendActionsRoot.parentNode.removeChild(recommendActionsRoot);
      }
      root = null;
      segmentActionsRoot = null;
      validityActionsRoot = null;
      recommendActionsRoot = null;
      statusNode = null;
      audioNode = null;
      previewNode = null;
      recommendationNode = null;
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
