(function () {
  const ROOT_ATTR = "data-asc-cvpc-liuzhou-panel";
  const STYLE_ID = "asc-cvpc-liuzhou-panel-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  position: fixed;",
      "  top: 16px;",
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
      "[" + ROOT_ATTR + "] .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }",
      "[" + ROOT_ATTR + "] button { min-height:28px; padding:0 10px; border:1px solid #d6d3d1; border-radius:8px; background:#fff; cursor:pointer; }",
      "[" + ROOT_ATTR + "] button[data-primary='true'] { background:#b45309; border-color:#b45309; color:#fff; font-weight:700; }",
      "[" + ROOT_ATTR + "] button:disabled { opacity:0.55; cursor:not-allowed; }",
      "[" + ROOT_ATTR + "] .status { margin-top:10px; color:#475569; white-space:pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color:#b91c1c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color:#047857; }",
      "[" + ROOT_ATTR + "] .section { margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight:700; color:#1f2937; }",
      "[" + ROOT_ATTR + "] .section-note { color:#64748b; margin-top:4px; }",
      "[" + ROOT_ATTR + "] .preview-list, [" + ROOT_ATTR + "] .recommend-grid { margin-top:8px; display:grid; gap:8px; }",
      "[" + ROOT_ATTR + "] .preview-item, [" + ROOT_ATTR + "] .recommend-item { padding:8px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; }",
      "[" + ROOT_ATTR + "] .preview-item strong, [" + ROOT_ATTR + "] .recommend-item strong { display:block; color:#334155; }",
      "[" + ROOT_ATTR + "] .foot { margin-top:10px; color:#9a3412; }",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function createButton(text, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (primary) {
      button.setAttribute("data-primary", "true");
    }
    return button;
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let root = null;
    let statusNode = null;
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

    function mount() {
      ensureStyle();
      if (root && root.isConnected) {
        return;
      }
      root = document.createElement("section");
      root.setAttribute(ROOT_ATTR, "");

      const head = document.createElement("div");
      head.className = "head";
      head.innerHTML =
        '<div><div class="title">柳州话脚本 Beta</div><div class="sub">CVPC /app/editor/asr/ 建议流 + 人工确认</div></div>';

      const closeButton = createButton("隐藏", false);
      closeButton.addEventListener("click", function () {
        root.classList.toggle("hidden");
      });
      head.appendChild(closeButton);

      const actionRow = document.createElement("div");
      actionRow.className = "actions";
      const buttons = {
        preview: createButton("生成画段建议", true),
        applyPreview: createButton("应用当前建议（实验）", false),
        recommend: createButton("当前段 AI 推荐", true),
        applyRecommend: createButton("填入当前推荐", false),
        valid: createButton("当前段设为 Valid", false),
        invalid: createButton("当前段设为 Invalid", false),
        fillAllValid: createButton("未填写段落补为 Valid", false),
      };
      Object.keys(buttons).forEach(function (key) {
        actionRow.appendChild(buttons[key]);
      });

      statusNode = document.createElement("div");
      statusNode.className = "status";

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
      root.appendChild(actionRow);
      root.appendChild(statusNode);
      root.appendChild(previewSection);
      root.appendChild(recommendSection);
      root.appendChild(foot);
      document.body.appendChild(root);

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
    }

    function destroy() {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
      statusNode = null;
      previewNode = null;
      recommendationNode = null;
    }

    return {
      mount,
      destroy,
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
