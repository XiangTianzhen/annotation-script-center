(function () {
  const ROOT_ATTR = "data-asc-bytedance-aidp-suzhou-panel";
  const STYLE_ID = "asc-bytedance-aidp-suzhou-panel-style";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function formatSeconds(value) {
    const number = Math.max(0, Number(value || 0));
    return number
      .toFixed(3)
      .replace(/\.000$/, "")
      .replace(/(\.\d*?)0+$/, "$1");
  }

  function formatMs(value) {
    return formatSeconds((Math.max(0, Number(value || 0)) || 0) / 1000);
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
      "  padding: 14px 16px;",
      "  border: 1px solid #d7e3ff;",
      "  border-radius: 12px;",
      "  background: linear-gradient(180deg, #fbfdff 0%, #f3f8ff 100%);",
      "  color: #31415f;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "  box-shadow: 0 10px 24px rgba(65, 110, 206, 0.08);",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .panel-title { font-size: 14px; font-weight: 700; color: #26418b; }",
      "[" + ROOT_ATTR + "] .panel-note { margin-top: 4px; color: #6f7b94; }",
      "[" + ROOT_ATTR + "] .status { margin-top: 10px; color: #4f5d78; white-space: pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { color: #c2410c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { color: #1d7a36; }",
      "[" + ROOT_ATTR + "] .section { margin-top: 12px; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight: 600; color: #26418b; }",
      "[" + ROOT_ATTR + "] .section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .summary-card, [" + ROOT_ATTR + "] .preview-card {",
      "  margin-top: 8px;",
      "  padding: 10px 12px;",
      "  border: 1px solid #e4ebfb;",
      "  border-radius: 10px;",
      "  background: #fff;",
      "}",
      "[" + ROOT_ATTR + "] .summary-grid { display: grid; gap: 6px; }",
      "[" + ROOT_ATTR + "] .summary-line { display: flex; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .summary-label { min-width: 64px; font-weight: 600; color: #3a5db4; }",
      "[" + ROOT_ATTR + "] .action-row { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + ROOT_ATTR + "] button {",
      "  min-height: 32px;",
      "  padding: 8px 14px;",
      "  border: 1px solid #c9d8ff;",
      "  border-radius: 999px;",
      "  background: #fff;",
      "  color: #2f57c5;",
      "  font-size: 12px;",
      "  font-weight: 600;",
      "  cursor: pointer;",
      "}",
      "[" + ROOT_ATTR + "] button:hover { background: #edf3ff; }",
      "[" + ROOT_ATTR + "] button[data-primary='true'] {",
      "  border-color: #2f57c5;",
      "  background: #2f57c5;",
      "  color: #fff;",
      "}",
      "[" + ROOT_ATTR + "] .preview-list { display: grid; gap: 8px; }",
      "[" + ROOT_ATTR + "] .preview-meta { color: #6f7b94; }",
      "[" + ROOT_ATTR + "] .preview-unsafe { margin-top: 8px; color: #c2410c; }",
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function getNodeText(node) {
    return normalizeText(node?.textContent || node?.innerText || "");
  }

  function findWaveAnchor() {
    const exact = document.querySelector(".neeko-wavesurfer-warper.neeko-wavesurfer");
    if (exact) {
      return exact;
    }
    const candidates = Array.from(document.querySelectorAll("div,section,article"));
    return (
      candidates.find(function (node) {
        const text = getNodeText(node);
        return text.includes("播放速度") && text.includes("总时长");
      }) || null
    );
  }

  function insertAfter(parentNode, referenceNode, nextNode) {
    if (!parentNode || !referenceNode || !nextNode) {
      return;
    }
    if (referenceNode.nextSibling) {
      parentNode.insertBefore(nextNode, referenceNode.nextSibling);
      return;
    }
    parentNode.appendChild(nextNode);
  }

  function createButton(text, primary, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (primary) {
      button.setAttribute("data-primary", "true");
    }
    button.addEventListener("click", function () {
      if (typeof onClick === "function") {
        onClick();
      }
    });
    return button;
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let rootNode = null;
    let statusNode = null;
    let summaryNode = null;
    let summaryCollapseButtonNode = null;
    let previewNode = null;
    let currentAudioCollapsed = true;

    function syncCurrentAudioSectionState() {
      if (!summaryNode) {
        return;
      }
      summaryNode.style.display = currentAudioCollapsed ? "none" : "";
      if (summaryCollapseButtonNode) {
        summaryCollapseButtonNode.textContent = currentAudioCollapsed
          ? "展开当前音频"
          : "折叠当前音频";
      }
    }

    function ensureRoot() {
      if (rootNode && rootNode.isConnected) {
        return rootNode;
      }
      rootNode = document.createElement("section");
      rootNode.setAttribute(ROOT_ATTR, "");
      rootNode.innerHTML =
        '<div class="panel-title">苏州话脚本 Beta</div>' +
        '<div class="panel-note">当前支持 mark-v3 详情页分段建议生成，并把结果写回平台暂存答案。</div>';

      statusNode = document.createElement("div");
      statusNode.className = "status";
      statusNode.textContent = "正在读取当前详情上下文...";
      rootNode.appendChild(statusNode);

      const summarySection = document.createElement("div");
      summarySection.className = "section";
      const summaryHead = document.createElement("div");
      summaryHead.className = "section-head";
      const summaryTitle = document.createElement("div");
      summaryTitle.className = "section-title";
      summaryTitle.textContent = "当前音频";
      summaryHead.appendChild(summaryTitle);
      const summaryActions = document.createElement("div");
      summaryActions.className = "section-actions";
      summaryCollapseButtonNode = createButton("展开当前音频", false, function () {
        currentAudioCollapsed = !currentAudioCollapsed;
        syncCurrentAudioSectionState();
      });
      summaryActions.appendChild(summaryCollapseButtonNode);
      summaryHead.appendChild(summaryActions);
      summarySection.appendChild(summaryHead);
      summaryNode = document.createElement("div");
      summaryNode.className = "summary-card";
      summaryNode.textContent = "等待页面返回当前条目与分段上下文...";
      summarySection.appendChild(summaryNode);
      rootNode.appendChild(summarySection);
      syncCurrentAudioSectionState();

      const actionSection = document.createElement("div");
      actionSection.className = "section";
      actionSection.innerHTML =
        '<div class="section-title">分段建议</div><div class="panel-note">先生成建议，再决定是否应用到当前暂存答案。</div>';
      const actionRow = document.createElement("div");
      actionRow.className = "action-row";
      actionRow.appendChild(
        createButton("生成分段建议", true, function () {
          deps.onPreview?.();
        })
      );
      actionRow.appendChild(
        createButton("应用分段建议", false, function () {
          deps.onApplyPreview?.();
        })
      );
      actionSection.appendChild(actionRow);
      previewNode = document.createElement("div");
      previewNode.className = "preview-list";
      previewNode.innerHTML = '<div class="preview-card">当前还没有分段建议。</div>';
      actionSection.appendChild(previewNode);
      rootNode.appendChild(actionSection);
      return rootNode;
    }

    function mount() {
      ensureStyle();
      const anchor = findWaveAnchor();
      if (!(anchor instanceof HTMLElement) || !(anchor.parentNode instanceof HTMLElement)) {
        return false;
      }
      const root = ensureRoot();
      if (root.parentNode !== anchor.parentNode) {
        root.parentNode?.removeChild(root);
        insertAfter(anchor.parentNode, anchor, root);
      } else if (root.previousSibling !== anchor) {
        insertAfter(anchor.parentNode, anchor, root);
      }
      return true;
    }

    function setStatus(message, tone) {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = normalizeText(message) || " ";
      if (normalizeText(tone)) {
        statusNode.setAttribute("data-tone", normalizeText(tone));
      } else {
        statusNode.removeAttribute("data-tone");
      }
    }

    function renderAudioContext(context) {
      if (!summaryNode) {
        return;
      }
      const source = context && typeof context === "object" ? context : {};
      const audioUrl = normalizeText(source.audioUrl);
      if (!audioUrl) {
        summaryNode.textContent = "当前还没拿到音频地址；请等页面初始化完成，或刷新当前详情页后重试。";
        syncCurrentAudioSectionState();
        return;
      }
      summaryNode.innerHTML = "";
      const grid = document.createElement("div");
      grid.className = "summary-grid";
      [
        ["题目", normalizeText(source.entryId || source.itemId)],
        ["模板", normalizeText(source.templateID)],
        ["总时长", formatMs(source.audioDurationMs) + " 秒"],
        ["当前分段", String(Array.isArray(source.currentSegments) ? source.currentSegments.length : 0)],
      ].forEach(function (item) {
        const line = document.createElement("div");
        line.className = "summary-line";
        const labelNode = document.createElement("span");
        labelNode.className = "summary-label";
        labelNode.textContent = item[0] + "：";
        const valueNode = document.createElement("span");
        valueNode.textContent = item[1] || "-";
        line.appendChild(labelNode);
        line.appendChild(valueNode);
        grid.appendChild(line);
      });
      const audioLine = document.createElement("div");
      audioLine.className = "summary-line";
      const audioLabel = document.createElement("span");
      audioLabel.className = "summary-label";
      audioLabel.textContent = "音频地址：";
      const audioValue = document.createElement("span");
      audioValue.textContent = audioUrl;
      audioLine.appendChild(audioLabel);
      audioLine.appendChild(audioValue);
      grid.appendChild(audioLine);
      if (normalizeText(source.unsafeReason)) {
        const unsafeNode = document.createElement("div");
        unsafeNode.className = "preview-unsafe";
        unsafeNode.textContent = "注意：" + normalizeText(source.unsafeReason);
        grid.appendChild(unsafeNode);
      }
      summaryNode.appendChild(grid);
      syncCurrentAudioSectionState();
    }

    function renderPreview(preview) {
      if (!previewNode) {
        return;
      }
      const source = preview && typeof preview === "object" ? preview : null;
      if (!source || !Array.isArray(source.proposedSegments) || source.proposedSegments.length <= 0) {
        previewNode.innerHTML = '<div class="preview-card">当前还没有分段建议。</div>';
        return;
      }
      previewNode.innerHTML = "";
      const metaCard = document.createElement("div");
      metaCard.className = "preview-card preview-meta";
      metaCard.textContent =
        "建议总段数：" +
        String(source.proposedSegments.length) +
        "；模式：" +
        normalizeText(source?.meta?.previewMode || "unknown");
      previewNode.appendChild(metaCard);
      source.proposedSegments.forEach(function (item, index) {
        const card = document.createElement("div");
        card.className = "preview-card";
        card.textContent =
          "建议段 " +
          String(index + 1) +
          "：开始 " +
          formatMs(item.startMs) +
          " 秒，结束 " +
          formatMs(item.endMs) +
          " 秒";
        previewNode.appendChild(card);
      });
    }

    function destroy() {
      if (rootNode && rootNode.parentNode) {
        rootNode.parentNode.removeChild(rootNode);
      }
      rootNode = null;
      statusNode = null;
      summaryNode = null;
      previewNode = null;
    }

    return {
      mount,
      destroy,
      setStatus,
      renderAudioContext,
      renderPreview,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeBytedanceAidpSuzhouUiPanel = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
