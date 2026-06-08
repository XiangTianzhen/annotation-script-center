(function () {
  const ROOT_ATTR = "data-asc-cvpc-liuzhou-panel";
  const TOOLBAR_ATTR = "data-asc-cvpc-liuzhou-toolbar";
  const STYLE_ID = "asc-cvpc-liuzhou-panel-style";
  const TOOLBAR_SELECTOR = ".page-top .top-right";
  const FALLBACK_TOOLBAR_HOST_ATTR = "data-asc-cvpc-liuzhou-toolbar-fallback";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  position: fixed;",
      "  top: 72px;",
      "  right: 16px;",
      "  width: 420px;",
      "  max-width: calc(100vw - 32px);",
      "  max-height: calc(100vh - 32px);",
      "  overflow: auto;",
      "  z-index: 2147483200;",
      "  padding: 14px;",
      "  border: 1px solid #cbd5e1;",
      "  border-radius: 12px;",
      "  background: linear-gradient(180deg, #fffdf7 0%, #ffffff 100%);",
      "  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);",
      "  color: #0f172a;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .head { display:flex; justify-content:space-between; align-items:center; gap:8px; }",
      "[" + ROOT_ATTR + "] .title { font-size:14px; font-weight:700; color:#92400e; }",
      "[" + ROOT_ATTR + "] .sub { color:#64748b; }",
      "[" + ROOT_ATTR + "] button { min-height:28px; padding:0 10px; border:1px solid #d6d3d1; border-radius:8px; background:#fff; cursor:pointer; }",
      "[" + ROOT_ATTR + "] button[data-primary='true'] { background:#b45309; border-color:#b45309; color:#fff; font-weight:700; }",
      "[" + ROOT_ATTR + "] button:disabled { opacity:0.55; cursor:not-allowed; }",
      "[" + ROOT_ATTR + "] .status { margin-top:10px; color:#475569; white-space:pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color:#b91c1c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color:#047857; }",
      "[" + ROOT_ATTR + "] .section { margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight:700; color:#1f2937; }",
      "[" + ROOT_ATTR + "] .section-note { color:#64748b; margin-top:4px; }",
      "[" + ROOT_ATTR + "] .audio-url-box { margin-top:8px; padding:8px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; color:#334155; overflow-wrap:anywhere; word-break:break-all; }",
      "[" + ROOT_ATTR + "] .audio-url-box[data-empty='true'] { color:#64748b; word-break:normal; }",
      "[" + ROOT_ATTR + "] .preview-list, [" + ROOT_ATTR + "] .recommend-grid { margin-top:8px; display:grid; gap:8px; }",
      "[" + ROOT_ATTR + "] .preview-item, [" + ROOT_ATTR + "] .recommend-item { padding:8px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; }",
      "[" + ROOT_ATTR + "] .preview-item strong, [" + ROOT_ATTR + "] .recommend-item strong { display:block; color:#334155; }",
      "[" + ROOT_ATTR + "] .foot { margin-top:10px; color:#9a3412; }",
      "[" + TOOLBAR_ATTR + "] { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }",
      "[" + TOOLBAR_ATTR + "] button {",
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
      "[" + TOOLBAR_ATTR + "] button[data-primary='true'] {",
      "  background: #e6a23c;",
      "  border-color: #e6a23c;",
      "  color: #fff;",
      "}",
      "[" + TOOLBAR_ATTR + "] button:hover {",
      "  color: #409eff;",
      "  border-color: #c6e2ff;",
      "  background: #ecf5ff;",
      "}",
      "[" + TOOLBAR_ATTR + "] button[data-primary='true']:hover {",
      "  color: #fff;",
      "  border-color: #ebb563;",
      "  background: #ebb563;",
      "}",
      "[" + TOOLBAR_ATTR + "] button[data-panel-toggle='true'] {",
      "  color: #909399;",
      "}",
      "[" + FALLBACK_TOOLBAR_HOST_ATTR + "] {",
      "  position: fixed;",
      "  top: 16px;",
      "  right: 16px;",
      "  z-index: 2147483201;",
      "  padding: 10px;",
      "  border-radius: 12px;",
      "  background: rgba(255, 255, 255, 0.96);",
      "  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);",
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

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let root = null;
    let toolbarRoot = null;
    let statusNode = null;
    let audioNode = null;
    let previewNode = null;
    let recommendationNode = null;
    let panelToggleButton = null;

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
      const audioUrl = String(source.audioUrl || "").trim();
      const entryName = String(source.selectedEntry?.name || "").trim();
      const sourceText = String(source.audioUrlSource || "").trim();
      if (!audioUrl) {
        audioNode.setAttribute("data-empty", "true");
        audioNode.textContent =
          source.audioUrlHintMessage ||
          "暂未获取到当前音频地址，页面初始化完成后会自动刷新。";
        return;
      }
      audioNode.setAttribute("data-empty", "false");
      audioNode.textContent = [
        entryName ? "文件：" + entryName : "",
        sourceText ? "来源：" + sourceText : "",
        "地址：" + audioUrl,
      ]
        .filter(Boolean)
        .join("\n");
    }

    function ensurePanelVisibility(visible) {
      if (!root) {
        return;
      }
      root.classList.toggle("hidden", visible === false);
      if (panelToggleButton) {
        panelToggleButton.textContent = visible === false ? "显示助手" : "隐藏助手";
      }
    }

    function resolveToolbarHost() {
      const host = document.querySelector(TOOLBAR_SELECTOR);
      if (host instanceof HTMLElement) {
        const fallbackHost = document.querySelector("[" + FALLBACK_TOOLBAR_HOST_ATTR + "]");
        if (fallbackHost instanceof HTMLElement) {
          fallbackHost.remove();
        }
        return host;
      }
      let fallbackHost = document.querySelector("[" + FALLBACK_TOOLBAR_HOST_ATTR + "]");
      if (!(fallbackHost instanceof HTMLElement)) {
        fallbackHost = document.createElement("div");
        fallbackHost.setAttribute(FALLBACK_TOOLBAR_HOST_ATTR, "");
        document.body.appendChild(fallbackHost);
      }
      return fallbackHost;
    }

    function mount() {
      ensureStyle();
      if (!root || !root.isConnected) {
        root = document.createElement("section");
        root.setAttribute(ROOT_ATTR, "");

        const head = document.createElement("div");
        head.className = "head";
        head.innerHTML =
          '<div><div class="title">柳州话脚本 Beta</div><div class="sub">CVPC /app/editor/asr/ 建议流 + 人工确认</div></div>';

        const closeButton = createButton("隐藏", false);
        closeButton.addEventListener("click", function () {
          ensurePanelVisibility(false);
        });
        head.appendChild(closeButton);

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
          '<div class="section-title">画段建议</div><div class="section-note">当前只做建议生成；真实画段写入仍受页面写入契约约束。</div>';
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
        document.body.appendChild(root);
      }

      if (!toolbarRoot || !toolbarRoot.isConnected) {
        toolbarRoot = document.createElement("div");
        toolbarRoot.setAttribute(TOOLBAR_ATTR, "");

        const buttons = {
          preview: createButton("生成画段建议", true),
          applyPreview: createButton("应用当前建议", false),
          recommend: createButton("当前段 AI 推荐", true),
          applyRecommend: createButton("填入当前推荐", false),
          valid: createButton("设为 Valid", false),
          invalid: createButton("设为 Invalid", false),
          fillAllValid: createButton("未填写补 Valid", false),
          togglePanel: createButton("隐藏助手", false),
        };
        buttons.togglePanel.setAttribute("data-panel-toggle", "true");
        panelToggleButton = buttons.togglePanel;
        Object.keys(buttons).forEach(function (key) {
          toolbarRoot.appendChild(buttons[key]);
        });
        resolveToolbarHost().appendChild(toolbarRoot);

        buttons.preview.addEventListener("click", function () {
          deps.onPreview && deps.onPreview();
        });
        buttons.applyPreview.addEventListener("click", function () {
          deps.onApplyPreview && deps.onApplyPreview();
        });
        buttons.recommend.addEventListener("click", function () {
          deps.onRecommend && deps.onRecommend();
        });
        buttons.applyRecommend.addEventListener("click", function () {
          deps.onApplyRecommend && deps.onApplyRecommend();
        });
        buttons.valid.addEventListener("click", function () {
          deps.onMarkValid && deps.onMarkValid();
        });
        buttons.invalid.addEventListener("click", function () {
          deps.onMarkInvalid && deps.onMarkInvalid();
        });
        buttons.fillAllValid.addEventListener("click", function () {
          deps.onFillAllValid && deps.onFillAllValid();
        });
        buttons.togglePanel.addEventListener("click", function () {
          const willShow = root ? root.classList.contains("hidden") : false;
          ensurePanelVisibility(willShow);
        });
      }

      const toolbarHost = resolveToolbarHost();
      if (toolbarRoot.parentNode !== toolbarHost) {
        toolbarHost.appendChild(toolbarRoot);
      }
      ensurePanelVisibility(!root.classList.contains("hidden"));
    }

    function destroy() {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      if (toolbarRoot && toolbarRoot.parentNode) {
        toolbarRoot.parentNode.removeChild(toolbarRoot);
      }
      root = null;
      toolbarRoot = null;
      statusNode = null;
      audioNode = null;
      previewNode = null;
      recommendationNode = null;
      panelToggleButton = null;
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
