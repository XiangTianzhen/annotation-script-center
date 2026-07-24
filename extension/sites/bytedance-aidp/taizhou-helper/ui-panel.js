(function () {
  const ROOT_ATTR = "data-asc-bytedance-aidp-taizhou-panel";
  const STYLE_ID = "asc-bytedance-aidp-taizhou-panel-style";
  let activeTooltipAnchor = null;
  let tooltipListenersBound = false;

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

  function formatRecordingStatus(value) {
    const status = normalizeText(value);
    const labels = {
      AVAILABLE: "待领取",
      RECORDING_PENDING: "待录音",
      SUBMITTED: "待审核领取",
      REVIEW_PENDING: "审核中",
      REWORK_PENDING: "待返修",
      COMPLETED: "已完成",
    };
    return labels[status] || status || "未知状态";
  }

  function pickUsageValue(usage, keys) {
    const source = usage && typeof usage === "object" ? usage : {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (let index = 0; index < keyList.length; index += 1) {
      const value = source[keyList[index]];
      if (value === "" || value === null || value === undefined) {
        continue;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return String(numeric);
      }
      const text = normalizeText(value);
      if (text) {
        return text;
      }
    }
    return "";
  }

  function pickCostValue(cost, keys) {
    const source = cost && typeof cost === "object" ? cost : {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (let index = 0; index < keyList.length; index += 1) {
      const value = source[keyList[index]];
      if (value === "" || value === null || value === undefined) {
        continue;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return String(Number(numeric.toFixed(6)));
      }
      const text = normalizeText(value);
      if (text) {
        return text;
      }
    }
    return "";
  }

  async function copyTextToClipboard(text) {
    const normalized = String(text || "");
    if (!normalized) {
      return false;
    }
    try {
      if (
        globalThis.navigator?.clipboard &&
        typeof globalThis.navigator.clipboard.writeText === "function"
      ) {
        await globalThis.navigator.clipboard.writeText(normalized);
        return true;
      }
    } catch (_error) {
      // Fall back to the temporary textarea path below.
    }

    const documentLike = globalThis.document;
    if (!documentLike || typeof documentLike.createElement !== "function") {
      return false;
    }
    const bodyNode = documentLike.body || documentLike.documentElement || null;
    if (!bodyNode || typeof bodyNode.appendChild !== "function") {
      return false;
    }
    const textarea = documentLike.createElement("textarea");
    textarea.value = normalized;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.style.top = "-1000px";
    bodyNode.appendChild(textarea);
    try {
      if (typeof textarea.focus === "function") {
        textarea.focus();
      }
      if (typeof textarea.select === "function") {
        textarea.select();
      }
      if (typeof documentLike.execCommand === "function") {
        return documentLike.execCommand("copy") === true;
      }
    } catch (_error) {
      return false;
    } finally {
      if (textarea.parentNode && typeof textarea.parentNode.removeChild === "function") {
        textarea.parentNode.removeChild(textarea);
      }
    }
    return false;
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
      "[" + ROOT_ATTR + "] .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .panel-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .panel-title { font-size: 14px; font-weight: 700; color: #26418b; }",
      "[" + ROOT_ATTR + "] .tooltip-anchor { position: relative; display: inline-flex; align-items: flex-start; line-height: 1; }",
      "[" + ROOT_ATTR + "] .tooltip-dot { min-height: auto; width: auto; padding: 0; border: none; border-radius: 0; background: transparent; color: #5f6f90; font-size: 13px; font-weight: 700; line-height: 1; vertical-align: super; transform: translateY(-0.18em); cursor: pointer; }",
      "[" + ROOT_ATTR + "] .tooltip-dot:hover { background: transparent; color: #26418b; text-decoration: none; }",
      "[" + ROOT_ATTR + "] .tooltip-anchor[data-hover='true'] .tooltip-popover, [" + ROOT_ATTR + "] .tooltip-anchor[data-open='true'] .tooltip-popover { display: block; }",
      "[" + ROOT_ATTR + "] .tooltip-popover { display: none; position: absolute; top: calc(100% + 8px); left: 0; z-index: 1200; min-width: 220px; max-width: 320px; padding: 10px 12px; border: 1px solid #d6e4ff; border-radius: 10px; background: #fff; color: #4f5d78; box-shadow: 0 12px 24px rgba(38, 65, 139, 0.14); white-space: normal; line-height: 1.6; }",
      "[" + ROOT_ATTR + "] .status { margin-top: 10px; padding: 10px 12px; border: 1px solid #e4ebfb; border-radius: 10px; background: #fff; color: #4f5d78; white-space: pre-wrap; }",
      "[" + ROOT_ATTR + "] .status[data-tone='error'] { border-color: rgba(194, 65, 12, 0.22); color: #c2410c; }",
      "[" + ROOT_ATTR + "] .status[data-tone='success'] { border-color: rgba(29, 122, 54, 0.24); color: #1d7a36; }",
      "[" + ROOT_ATTR + "] .status[data-tone='warning'] { border-color: rgba(181, 71, 8, 0.22); color: #b54708; }",
      "[" + ROOT_ATTR + "] .section { margin-top: 12px; }",
      "[" + ROOT_ATTR + "] .panel-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }",
      "[" + ROOT_ATTR + "] .panel-grid .section { margin-top: 0; }",
      "[" + ROOT_ATTR + "] .section[data-span='full'] { grid-column: 1 / -1; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight: 600; color: #26418b; }",
      "[" + ROOT_ATTR + "] .section-title-row { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .summary-card, [" + ROOT_ATTR + "] .preview-card, [" + ROOT_ATTR + "] .info-card {",
      "  margin-top: 8px;",
      "  padding: 10px 12px;",
      "  border: 1px solid #e4ebfb;",
      "  border-radius: 10px;",
      "  background: #fff;",
      "}",
      "[" + ROOT_ATTR + "] .summary-grid, [" + ROOT_ATTR + "] .info-grid, [" + ROOT_ATTR + "] .batch-state-list { display: grid; gap: 6px; }",
      "[" + ROOT_ATTR + "] .summary-line, [" + ROOT_ATTR + "] .info-line { display: flex; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .summary-label, [" + ROOT_ATTR + "] .info-label { min-width: 72px; font-weight: 600; color: #3a5db4; }",
      "[" + ROOT_ATTR + "] .action-row, [" + ROOT_ATTR + "] .batch-action-row { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + ROOT_ATTR + "] .batch-selector-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .batch-selector-summary { color: var(--asc-primary-strong, #26418b); font-weight: 600; }",
      "[" + ROOT_ATTR + "] .batch-selector-grid { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + ROOT_ATTR + "] .batch-selector-grid button { min-width: 44px; justify-content: center; }",
      "[" + ROOT_ATTR + "] .batch-selector-grid button[data-selected='true'] { background: #e8f0ff; border-color: #2f57c5; color: #26418b; }",
      "[" + ROOT_ATTR + "] .batch-selector-grid button[data-batch-all='true'] { min-width: 56px; font-weight: 600; }",
      "[" + ROOT_ATTR + "] .batch-ai-tabs { margin-top: 0; margin-bottom: 10px; }",
      "[" + ROOT_ATTR + "] .batch-state-item { padding: 10px 12px; border: 1px solid #e4ebfb; border-radius: 8px; background: #fff; color: #42506a; }",
      "[" + ROOT_ATTR + "] .batch-failure-list { margin: 6px 0 0; padding-left: 18px; color: #b42318; }",
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
      "  white-space: nowrap;",
      "}",
      "[" + ROOT_ATTR + "] button:hover { background: #edf3ff; }",
      "[" + ROOT_ATTR + "] button[data-primary='true'] { border-color: #2f57c5; background: #2f57c5; color: #fff; }",
      "[" + ROOT_ATTR + "] button.collapse-toggle { min-height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid #d9e6ff; background: #fff; color: #2f57c5; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3); }",
      "[" + ROOT_ATTR + "] button.collapse-toggle:hover { background: #f7faff; text-decoration: none; }",
      "[" + ROOT_ATTR + "] .collapsible-body { margin-top: 8px; }",
      "[" + ROOT_ATTR + "] .preview-list { display: grid; gap: 8px; }",
      "[" + ROOT_ATTR + "] .preview-meta { color: #6f7b94; }",
      "[" + ROOT_ATTR + "] .preview-unsafe { margin-top: 8px; color: #c2410c; }",
      "[" + ROOT_ATTR + "] .info-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.9fr); gap: 12px; align-items: start; }",
      "[" + ROOT_ATTR + "] .info-pane, [" + ROOT_ATTR + "] .debug-pane { display: grid; gap: 10px; min-width: 0; }",
      "[" + ROOT_ATTR + "] .review-warning { display: grid; gap: 10px; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(181, 71, 8, 0.2); border-radius: 10px; background: #fff8f2; color: #9a3412; }",
      "[" + ROOT_ATTR + "] .review-warning-text { color: #9a3412; }",
      "[" + ROOT_ATTR + "] .review-tag-row { display: flex; flex-wrap: wrap; gap: 8px; }",
      "[" + ROOT_ATTR + "] .review-tag { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; background: #ffe7d1; color: #9a3412; font-weight: 600; }",
      "[" + ROOT_ATTR + "] .debug-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .debug-title { font-weight: 600; color: #26418b; }",
      "[" + ROOT_ATTR + "] .debug-copy-button { min-height: 28px; padding: 0 12px; font-size: 12px; }",
      "[" + ROOT_ATTR + "] .recording-result-text { margin-top: 10px; padding: 10px; border-radius: 8px; background: #f7f9fc; white-space: pre-wrap; word-break: break-word; }",
      "[" + ROOT_ATTR + "] .recording-result-audio { width: 100%; margin-top: 10px; }",
      "[" + ROOT_ATTR + "] .debug-card { margin: 0; padding: 10px 12px; border: 1px solid #e4ebfb; border-radius: 10px; background: #f8fbff; color: #334155; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; max-height: 240px; overflow: auto; }",
      "@media (max-width: 1120px) {",
      "  [" + ROOT_ATTR + "] .panel-grid { grid-template-columns: minmax(0, 1fr); }",
      "  [" + ROOT_ATTR + "] .section[data-span='full'] { grid-column: auto; }",
      "  [" + ROOT_ATTR + "] .info-layout { grid-template-columns: minmax(0, 1fr); }",
      "}",
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

  function clearNode(node) {
    if (!node) {
      return;
    }
    while (true) {
      const nextChild =
        (node.children && typeof node.children.length === "number" && node.children[0]) ||
        node.firstChild ||
        null;
      if (!nextChild || typeof node.removeChild !== "function") {
        break;
      }
      node.removeChild(nextChild);
    }
    node.textContent = "";
  }

  function isNodeInsideContainer(node, container) {
    let current = node || null;
    while (current) {
      if (current === container) {
        return true;
      }
      current = current.parentNode || current.parentElement || null;
    }
    return false;
  }

  function getTooltipButton(anchor) {
    if (!anchor || typeof anchor.querySelector !== "function") {
      return null;
    }
    return anchor.querySelector(".tooltip-dot");
  }

  function setTooltipOpen(anchor, open) {
    if (!anchor || typeof anchor.setAttribute !== "function") {
      return;
    }
    if (open) {
      anchor.setAttribute("data-open", "true");
      activeTooltipAnchor = anchor;
    } else {
      anchor.removeAttribute("data-open");
      if (activeTooltipAnchor === anchor) {
        activeTooltipAnchor = null;
      }
    }
    const button = getTooltipButton(anchor);
    if (button && typeof button.setAttribute === "function") {
      button.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  function setTooltipHover(anchor, hovered) {
    if (!anchor || typeof anchor.setAttribute !== "function") {
      return;
    }
    if (hovered) {
      anchor.setAttribute("data-hover", "true");
      return;
    }
    anchor.removeAttribute("data-hover");
  }

  function bindTooltipDocumentListeners(documentLike) {
    if (
      tooltipListenersBound ||
      !documentLike ||
      typeof documentLike.addEventListener !== "function"
    ) {
      return;
    }
    documentLike.addEventListener("click", function (event) {
      if (!activeTooltipAnchor) {
        return;
      }
      if (isNodeInsideContainer(event?.target || null, activeTooltipAnchor)) {
        return;
      }
      setTooltipOpen(activeTooltipAnchor, false);
    });
    documentLike.addEventListener("keydown", function (event) {
      if (String(event?.key || "") !== "Escape" || !activeTooltipAnchor) {
        return;
      }
      setTooltipOpen(activeTooltipAnchor, false);
    });
    tooltipListenersBound = true;
  }

  function createTooltipDot(text) {
    const anchor = document.createElement("span");
    anchor.className = "tooltip-anchor";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tooltip-dot";
    button.textContent = "?";
    button.setAttribute("aria-label", normalizeText(text));
    button.setAttribute("aria-expanded", "false");
    const popover = document.createElement("div");
    popover.className = "tooltip-popover";
    popover.textContent = normalizeText(text);
    anchor.appendChild(button);
    anchor.appendChild(popover);
    bindTooltipDocumentListeners(document);
    anchor.addEventListener("mouseenter", function () {
      setTooltipHover(anchor, true);
    });
    anchor.addEventListener("mouseleave", function () {
      setTooltipHover(anchor, false);
    });
    button.addEventListener("click", function (event) {
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      setTooltipOpen(anchor, anchor.getAttribute("data-open") !== "true");
    });
    return anchor;
  }

  function createSectionTitleRow(title, helpText) {
    const row = document.createElement("div");
    row.className = "section-title-row";
    const titleNode = document.createElement("div");
    titleNode.className = "section-title";
    titleNode.textContent = title;
    row.appendChild(titleNode);
    if (normalizeText(helpText)) {
      row.appendChild(createTooltipDot(helpText));
    }
    return row;
  }

  function createCollapseToggle(sectionLabel, collapsed, onClick) {
    const button = createButton("", false, onClick);
    button.className = "collapse-toggle";
    setCollapseToggleText(button, sectionLabel, collapsed);
    return button;
  }

  function setCollapseToggleText(button, sectionLabel, collapsed) {
    if (!button) {
      return;
    }
    button.textContent =
      (collapsed ? "▶ " : "▼ ") +
      (collapsed ? "展开" : "折叠") +
      normalizeText(sectionLabel);
  }

  function normalizeBatchSelectionNumbers(total, selectedNumbers) {
    const result = Array.from(new Set((Array.isArray(selectedNumbers) ? selectedNumbers : []).map(function (value) {
      return Math.max(1, Math.round(Number(value || 0)) || 0);
    }))).filter(function (value) {
      return value >= 1 && value <= total;
    });
    return result.sort(function (left, right) {
      return left - right;
    });
  }

  function formatBatchSelectionSummary(total, selectedNumbers) {
    if (total <= 0) {
      return "暂无可选段";
    }
    if (!selectedNumbers || selectedNumbers.length <= 0) {
      return "未选择";
    }
    if (selectedNumbers.length === total) {
      return "全部 " + String(total) + " 段";
    }
    return selectedNumbers.join("、");
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let rootNode = null;
    let statusNode = null;
    let summaryNode = null;
    let summaryCollapseButtonNode = null;
    let previewNode = null;
    let previewActionRowNode = null;
    let previewCollapseButtonNode = null;
    let aiMetaNode = null;
    let aiMetaCollapseButtonNode = null;
    let recordingResultNode = null;
    let recordingRefreshButtonNode = null;
    let batchStateNode = null;
    let batchSelectionGridNode = null;
    let batchActionRowNode = null;
    let batchActionMode = "recognizeAndWrite";
    let segmentPreviewAutoApplyEnabled = deps.segmentPreviewAutoApplyEnabled !== false;
    let panelHidden = false;
    let currentAudioCollapsed = true;
    let previewCollapsed = true;
    let aiMetaCollapsed = true;
    let latestRecommendation = null;
    let batchAiResults = [];
    let batchAiActiveSegmentNumber = 0;
    let batchAiTabSelectHandler = null;
    let batchSelectionState = {
      totalSegments: 0,
      selectedNumbers: [],
      dragging: false,
      dragNextSelected: true,
      mouseDownHandledSegmentNumber: 0,
    };

    function syncCurrentAudioSectionState() {
      if (!summaryNode) {
        return;
      }
      summaryNode.style.display = currentAudioCollapsed ? "none" : "";
      if (summaryCollapseButtonNode) {
        setCollapseToggleText(summaryCollapseButtonNode, "当前音频信息", currentAudioCollapsed);
      }
    }

    function syncPreviewSectionState() {
      if (!previewNode) {
        return;
      }
      previewNode.style.display = previewCollapsed ? "none" : "";
      if (previewCollapseButtonNode) {
        setCollapseToggleText(previewCollapseButtonNode, "分段建议", previewCollapsed);
      }
    }

    function syncAiMetaSectionState() {
      if (!aiMetaNode) {
        return;
      }
      aiMetaNode.style.display = aiMetaCollapsed ? "none" : "";
      if (aiMetaCollapseButtonNode) {
        setCollapseToggleText(aiMetaCollapseButtonNode, "AI信息", aiMetaCollapsed);
      }
    }

    function syncPanelVisibility() {
      if (rootNode) {
        rootNode.style.display = panelHidden ? "none" : "";
      }
    }

    function setPanelHidden(hidden) {
      panelHidden = hidden === true;
      syncPanelVisibility();
    }

    function togglePanelHidden() {
      setPanelHidden(!panelHidden);
    }

    function isPanelHidden() {
      return panelHidden === true;
    }

    function renderPreviewActionButtons() {
      if (!previewActionRowNode) {
        return;
      }
      clearNode(previewActionRowNode);
      if (segmentPreviewAutoApplyEnabled) {
        previewActionRowNode.appendChild(
          createButton("生成分段并应用", true, function () {
            deps.onPreview?.();
          })
        );
        return;
      }
      previewActionRowNode.appendChild(
        createButton("生成分段建议", true, function () {
          deps.onPreview?.();
        })
      );
      previewActionRowNode.appendChild(
        createButton("应用分段建议", false, function () {
          deps.onApplyPreview?.();
        })
      );
    }

    function renderBatchActionButton() {
      if (!batchActionRowNode) {
        return;
      }
      clearNode(batchActionRowNode);
      let actionButton = null;
      if (batchActionMode === "running") {
        actionButton = createButton("停止批量", false, function () {
          deps.onBatchStop?.();
        });
      } else {
        actionButton = createButton("批量识别并填入", true, function () {
          deps.onBatchRecommend?.(getSelectedBatchSegmentNumbers());
        });
      }
      if (actionButton) {
        actionButton.setAttribute("data-batch-primary-action", "true");
        batchActionRowNode.appendChild(actionButton);
      }
    }

    function stopBatchSelectionDrag() {
      batchSelectionState.dragging = false;
      if (typeof setTimeout === "function") {
        setTimeout(function () {
          batchSelectionState.mouseDownHandledSegmentNumber = 0;
        }, 0);
      } else {
        batchSelectionState.mouseDownHandledSegmentNumber = 0;
      }
    }

    function updateBatchSelectionValue(segmentNumber, nextSelected) {
      const total = Math.max(0, Math.round(Number(batchSelectionState.totalSegments || 0)) || 0);
      let current = normalizeBatchSelectionNumbers(total, batchSelectionState.selectedNumbers);
      const index = current.indexOf(segmentNumber);
      if (nextSelected) {
        if (index < 0) {
          current.push(segmentNumber);
        }
      } else if (index >= 0) {
        current.splice(index, 1);
      }
      current = normalizeBatchSelectionNumbers(total, current);
      batchSelectionState.selectedNumbers = current;
      if (batchSelectionGridNode) {
        Array.prototype.slice.call(batchSelectionGridNode.children || []).forEach(function (node) {
          const currentNumber = Math.round(Number(node.getAttribute("data-segment-number") || 0)) || 0;
          if (node.getAttribute("data-batch-all") === "true") {
            node.setAttribute("data-selected", current.length === total && total > 0 ? "true" : "false");
            return;
          }
          if (currentNumber > 0) {
            node.setAttribute("data-selected", current.indexOf(currentNumber) >= 0 ? "true" : "false");
          }
        });
      }
    }

    function renderBatchSelection(state) {
      const source = state && typeof state === "object" ? state : {};
      const total = Math.max(0, Math.round(Number(source.totalSegments || 0)) || 0);
      batchSelectionState.totalSegments = total;
      if (batchSelectionGridNode) {
        clearNode(batchSelectionGridNode);
      }
      if (total <= 0) {
        batchSelectionState.selectedNumbers = [];
        return;
      }

      const resetSelection = source.resetSelection === true || batchSelectionState.selectedNumbers.length <= 0;
      const nextSelectedNumbers = resetSelection
        ? Array.from({ length: total }, function (_item, index) {
            return index + 1;
          })
        : batchSelectionState.selectedNumbers;
      batchSelectionState.selectedNumbers = normalizeBatchSelectionNumbers(total, nextSelectedNumbers);

      if (batchSelectionGridNode) {
        const allButton = createButton("全选", false, function () {
          updateBatchSelectionValue(1, true);
          batchSelectionState.selectedNumbers = Array.from({ length: total }, function (_item, index) {
            return index + 1;
          });
          updateBatchSelectionValue(1, true);
        });
        allButton.setAttribute("data-batch-all", "true");
        batchSelectionGridNode.appendChild(allButton);

        for (let index = 0; index < total; index += 1) {
          const number = index + 1;
          const button = createButton(String(number), false, null);
          button.setAttribute("data-segment-number", String(number));
          button.addEventListener("click", function () {
            if (batchSelectionState.mouseDownHandledSegmentNumber === number) {
              batchSelectionState.mouseDownHandledSegmentNumber = 0;
              return;
            }
            const currentlySelected =
              batchSelectionState.selectedNumbers.indexOf(number) >= 0;
            updateBatchSelectionValue(number, !currentlySelected);
          });
          button.addEventListener("mousedown", function () {
            const currentlySelected =
              batchSelectionState.selectedNumbers.indexOf(number) >= 0;
            batchSelectionState.dragging = true;
            batchSelectionState.dragNextSelected = !currentlySelected;
            batchSelectionState.mouseDownHandledSegmentNumber = number;
            updateBatchSelectionValue(number, !currentlySelected);
          });
          button.addEventListener("mouseenter", function () {
            if (!batchSelectionState.dragging) {
              return;
            }
            updateBatchSelectionValue(number, batchSelectionState.dragNextSelected === true);
          });
          batchSelectionGridNode.appendChild(button);
        }
      }
      updateBatchSelectionValue(
        batchSelectionState.selectedNumbers[0] || 1,
        batchSelectionState.selectedNumbers.length > 0
      );
    }

    function getSelectedBatchSegmentNumbers() {
      return normalizeBatchSelectionNumbers(
        Math.max(0, Math.round(Number(batchSelectionState.totalSegments || 0)) || 0),
        batchSelectionState.selectedNumbers
      );
    }

    function ensureRoot() {
      if (rootNode && rootNode.isConnected) {
        return rootNode;
      }
      rootNode = document.createElement("section");
      rootNode.setAttribute(ROOT_ATTR, "");
      const panelHead = document.createElement("div");
      panelHead.className = "panel-head";
      const panelTitleRow = document.createElement("div");
      panelTitleRow.className = "panel-title-row";
      const panelTitle = document.createElement("div");
      panelTitle.className = "panel-title";
      panelTitle.textContent = "台州话脚本";
      panelTitleRow.appendChild(panelTitle);
      panelTitleRow.appendChild(
        createTooltipDot(
          "当前支持原始听音识别、批量识别、分段建议和平台暂存写回；单段识别只直填当前输入框，批量识别和分段建议继续走平台暂存写回。"
        )
      );
      panelHead.appendChild(panelTitleRow);
      rootNode.appendChild(panelHead);

      statusNode = document.createElement("div");
      statusNode.className = "status";
      statusNode.textContent = "正在读取当前详情上下文...";
      rootNode.appendChild(statusNode);

      const grid = document.createElement("div");
      grid.className = "panel-grid";

      const previewSection = document.createElement("div");
      previewSection.className = "section";
      const previewHead = document.createElement("div");
      previewHead.className = "section-head";
      previewHead.appendChild(
        createSectionTitleRow(
          "分段建议",
          "建议只会作用于当前音频的分段状态；应用后仍需你手动复核。若设置页开启“画段后自动应用建议”，这里会直接显示“生成分段并应用”。"
        )
      );
      const previewActions = document.createElement("div");
      previewActions.className = "section-actions";
      previewCollapseButtonNode = createCollapseToggle("分段建议", previewCollapsed, function () {
        previewCollapsed = !previewCollapsed;
        syncPreviewSectionState();
      });
      previewActions.appendChild(previewCollapseButtonNode);
      previewHead.appendChild(previewActions);
      previewSection.appendChild(previewHead);
      previewActionRowNode = document.createElement("div");
      previewActionRowNode.className = "action-row";
      previewSection.appendChild(previewActionRowNode);
      renderPreviewActionButtons();
      previewNode = document.createElement("div");
      previewNode.className = "preview-list collapsible-body";
      previewNode.appendChild(document.createElement("div")).className = "preview-card";
      previewNode.children[0].textContent = "当前还没有分段建议。";
      previewSection.appendChild(previewNode);
      grid.appendChild(previewSection);
      syncPreviewSectionState();

      const batchSection = document.createElement("div");
      batchSection.className = "section";
      const batchHead = document.createElement("div");
      batchHead.className = "section-head";
      batchHead.appendChild(
        createSectionTitleRow(
          "批量识别",
          "只处理当前题当前页 regions；默认全选，支持段号点选和拖选，停止后不再继续发新请求；只更新目标段的 txt，不改 ms，不自动提交、不自动切题。"
        )
      );
      batchSection.appendChild(batchHead);
      batchSelectionGridNode = document.createElement("div");
      batchSelectionGridNode.className = "batch-selector-grid";
      batchSection.appendChild(batchSelectionGridNode);
      batchActionRowNode = document.createElement("div");
      batchActionRowNode.className = "batch-action-row";
      batchSection.appendChild(batchActionRowNode);
      renderBatchActionButton();
      batchStateNode = document.createElement("div");
      batchStateNode.className = "batch-state-list";
      batchSection.appendChild(batchStateNode);
      grid.appendChild(batchSection);

      const summarySection = document.createElement("div");
      summarySection.className = "section";
      summarySection.setAttribute("data-span", "full");
      const summaryHead = document.createElement("div");
      summaryHead.className = "section-head";
      summaryHead.appendChild(
        createSectionTitleRow(
          "当前音频信息",
          "展示当前题号、模板、总时长、当前段和音频地址，默认折叠。"
        )
      );
      const summaryActions = document.createElement("div");
      summaryActions.className = "section-actions";
      summaryCollapseButtonNode = createCollapseToggle("当前音频信息", currentAudioCollapsed, function () {
        currentAudioCollapsed = !currentAudioCollapsed;
        syncCurrentAudioSectionState();
      });
      summaryActions.appendChild(summaryCollapseButtonNode);
      summaryHead.appendChild(summaryActions);
      summarySection.appendChild(summaryHead);
      summaryNode = document.createElement("div");
      summaryNode.className = "summary-card collapsible-body";
      summaryNode.textContent = "等待页面返回当前条目与分段上下文...";
      summarySection.appendChild(summaryNode);
      grid.appendChild(summarySection);
      syncCurrentAudioSectionState();

      const recordingSection = document.createElement("div");
      recordingSection.className = "section";
      recordingSection.setAttribute("data-span", "full");
      const recordingHead = document.createElement("div");
      recordingHead.className = "section-head";
      recordingHead.appendChild(
        createSectionTitleRow(
          "录音平台结果",
          "只读显示当前完整题目对应的录音任务状态、完成文本与结果音频；不会写入 AIDP 输入框、画段、暂存或提交接口。"
        )
      );
      recordingRefreshButtonNode = createButton(
        "刷新录音结果",
        false,
        function () {
          deps.onRefreshRecordingResult?.();
        }
      );
      recordingRefreshButtonNode.setAttribute(
        "data-recording-result-refresh",
        "true"
      );
      recordingSection.appendChild(recordingHead);
      recordingResultNode = document.createElement("div");
      recordingResultNode.className = "summary-card";
      recordingResultNode.setAttribute("data-recording-result-card", "true");
      recordingResultNode.textContent = "当前题目尚未同步录音任务。";
      recordingResultNode.appendChild(recordingRefreshButtonNode);
      recordingSection.appendChild(recordingResultNode);
      grid.appendChild(recordingSection);

      const metaSection = document.createElement("div");
      metaSection.className = "section";
      metaSection.setAttribute("data-span", "full");
      const metaHead = document.createElement("div");
      metaHead.className = "section-head";
      metaHead.appendChild(
        createSectionTitleRow(
          "AI信息",
          "展示最近一次单次全模态识别结果、usage/cost 与 debug，默认折叠显示。"
        )
      );
      const metaActions = document.createElement("div");
      metaActions.className = "section-actions";
      aiMetaCollapseButtonNode = createCollapseToggle("AI信息", aiMetaCollapsed, function () {
        aiMetaCollapsed = !aiMetaCollapsed;
        syncAiMetaSectionState();
      });
      metaActions.appendChild(aiMetaCollapseButtonNode);
      metaHead.appendChild(metaActions);
      metaSection.appendChild(metaHead);
      aiMetaNode = document.createElement("div");
      aiMetaNode.className = "info-card collapsible-body";
      aiMetaNode.textContent = "当前还没有 AI 信息。";
      metaSection.appendChild(aiMetaNode);
      grid.appendChild(metaSection);
      syncAiMetaSectionState();

      rootNode.appendChild(grid);
      syncPanelVisibility();

      const windowLike = globalThis.window || null;
      if (windowLike && typeof windowLike.addEventListener === "function") {
        windowLike.addEventListener("mouseup", stopBatchSelectionDrag);
        windowLike.addEventListener("blur", stopBatchSelectionDrag);
      }

      return rootNode;
    }

    function mount() {
      ensureStyle();
      const anchor = findWaveAnchor();
      if (!(anchor instanceof HTMLElement) || !(anchor.parentNode instanceof HTMLElement)) {
        return false;
      }
      const parentNode = anchor.parentNode;
      const root = ensureRoot();
      if (root.parentNode !== parentNode) {
        root.parentNode?.removeChild(root);
        insertAfter(parentNode, anchor, root);
      } else if (anchor.nextSibling !== root) {
        insertAfter(parentNode, anchor, root);
      }
      syncPanelVisibility();
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
      const currentSegments = Array.isArray(source.currentSegments) ? source.currentSegments : [];
      clearNode(summaryNode);
      const lines = [
        ["题目", source.itemId || source.entryId || ""],
        ["模板", source.templateID || ""],
        ["总时长", Number(source.audioDurationMs) > 0 ? formatMs(source.audioDurationMs) + " 秒" : ""],
        ["分段数", currentSegments.length > 0 ? String(currentSegments.length) : ""],
        [
          "当前段",
          source.activeSegment
            ? "第 " +
              String(source.activeSegment.segmentNumber) +
              " 段，开始 " +
              formatMs(source.activeSegment.startMs) +
              " 秒，结束 " +
              formatMs(source.activeSegment.endMs) +
              " 秒"
            : "",
        ],
        ["音频", source.audioUrl || ""],
      ].filter(function (item) {
        return normalizeText(item[0]) && normalizeText(item[1]);
      });
      if (lines.length <= 0) {
        summaryNode.textContent = "等待页面返回当前条目与分段上下文...";
        return;
      }
      const grid = document.createElement("div");
      grid.className = "summary-grid";
      lines.forEach(function (item) {
        const line = document.createElement("div");
        line.className = "summary-line";
        const labelNode = document.createElement("span");
        labelNode.className = "summary-label";
        labelNode.textContent = String(item[0]) + "：";
        const valueNode = document.createElement("span");
        valueNode.textContent = String(item[1]);
        line.appendChild(labelNode);
        line.appendChild(valueNode);
        grid.appendChild(line);
      });
      summaryNode.appendChild(grid);
    }

    function renderCurrentRecommendation(result) {
      latestRecommendation = result && typeof result === "object" ? Object.assign({}, result) : null;
    }

    function renderRecordingResult(result) {
      if (!recordingResultNode) {
        return;
      }
      const source = result && typeof result === "object" ? result : {};
      clearNode(recordingResultNode);
      const sourceItemId = normalizeText(source.sourceItemId);
      const itemCode = normalizeText(source.itemCode);
      const status = normalizeText(source.status);
      if (!sourceItemId && !itemCode && !status) {
        recordingResultNode.textContent = "当前题目尚未同步录音任务。";
        recordingResultNode.appendChild(recordingRefreshButtonNode);
        return;
      }
      const grid = document.createElement("div");
      grid.className = "summary-grid";
      [
        ["来源题目", sourceItemId],
        ["录音条目", itemCode],
        ["状态", formatRecordingStatus(status)],
      ]
        .filter(function (item) {
          return normalizeText(item[1]);
        })
        .forEach(function (item) {
          const line = document.createElement("div");
          line.className = "summary-line";
          const labelNode = document.createElement("span");
          labelNode.className = "summary-label";
          labelNode.textContent = String(item[0]) + "：";
          const valueNode = document.createElement("span");
          valueNode.textContent = String(item[1]);
          line.appendChild(labelNode);
          line.appendChild(valueNode);
          grid.appendChild(line);
        });
      recordingResultNode.appendChild(grid);
      if (status === "COMPLETED" && typeof source.text === "string" && source.text !== "") {
        const textNode = document.createElement("div");
        textNode.className = "recording-result-text";
        textNode.setAttribute("data-recording-result-text", "true");
        textNode.textContent = source.text;
        recordingResultNode.appendChild(textNode);
      }
      if (
        status === "COMPLETED" &&
        source.audioAvailable === true &&
        normalizeText(source.audioUrl)
      ) {
        const audio = document.createElement("audio");
        audio.className = "recording-result-audio";
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = normalizeText(source.audioUrl);
        recordingResultNode.appendChild(audio);
      }
      recordingResultNode.appendChild(recordingRefreshButtonNode);
    }

    function renderBatchState(snapshot) {
      if (!batchStateNode) {
        return;
      }
      const source = snapshot && typeof snapshot === "object" ? snapshot : {};
      const effectiveActionMode = normalizeText(source.actionMode)
        ? normalizeText(source.actionMode)
        : source.isRunning === true
          ? "running"
          : "recognizeAndWrite";
      if (batchActionMode !== effectiveActionMode) {
        batchActionMode = effectiveActionMode;
        renderBatchActionButton();
      }
      clearNode(batchStateNode);
      if (
        !normalizeText(source.phaseText) &&
        (!Array.isArray(source.failures) || source.failures.length <= 0) &&
        source.hasPendingFill !== true &&
        Number(source.reviewCount || 0) <= 0
      ) {
        return;
      }
      const summary = document.createElement("div");
      summary.className = "batch-state-item";
      summary.textContent =
        "状态：" +
        (normalizeText(source.phaseText) || "待命") +
        "；并发 " +
        String(Number(source.concurrency || 0) || 0) +
        "；总数 " +
        String(Number(source.totalCount || 0) || 0) +
        "；成功 " +
        String(Number(source.succeededCount || source.writtenCount || 0) || 0) +
        "；失败 " +
        String(Number(source.failedCount || 0) || 0) +
        "；跳过 " +
        String(Number(source.skippedCount || 0) || 0);
      batchStateNode.appendChild(summary);
      const failures = Array.isArray(source.failures) ? source.failures : [];
      if (failures.length > 0) {
        const failureBox = document.createElement("div");
        failureBox.className = "batch-state-item";
        const title = document.createElement("div");
        title.textContent = "失败列表";
        failureBox.appendChild(title);
        const list = document.createElement("ul");
        list.className = "batch-failure-list";
        failures.slice(0, 12).forEach(function (item) {
          const entry = document.createElement("li");
          const segmentNumber = Number(item?.segmentNumber || 0) || 0;
          entry.textContent =
            (segmentNumber > 0 ? "第 " + String(segmentNumber) + " 段：" : "") +
            normalizeText(item?.message || "未知错误");
          list.appendChild(entry);
        });
        failureBox.appendChild(list);
        batchStateNode.appendChild(failureBox);
      }
    }

    function sortBatchAiResults(results) {
      return (Array.isArray(results) ? results : [])
        .filter(function (item) {
          return item && typeof item === "object" && (Number(item.segmentNumber) > 0 || typeof item.listenText === "string");
        })
        .slice()
        .sort(function (left, right) {
          return (Number(left.segmentNumber || 0) || 0) - (Number(right.segmentNumber || 0) || 0);
        });
    }

    function renderBatchAiResultTabs() {
      if (!aiMetaNode || batchAiResults.length <= 0) {
        return;
      }
      const tabRow = document.createElement("div");
      tabRow.className = "batch-selector-grid batch-ai-tabs";
      batchAiResults.forEach(function (item) {
        const segmentNumber = Number(item.segmentNumber || 0) || 0;
        const button = createButton(String(segmentNumber), false, function () {
          batchAiActiveSegmentNumber = segmentNumber;
          if (typeof batchAiTabSelectHandler === "function") {
            batchAiTabSelectHandler(segmentNumber);
            return;
          }
          renderAiMeta(null);
        });
        button.setAttribute("data-segment-number", String(segmentNumber));
        button.setAttribute("data-batch-result-segment", String(segmentNumber));
        button.setAttribute(
          "data-selected",
          batchAiActiveSegmentNumber === segmentNumber ? "true" : "false"
        );
        tabRow.appendChild(button);
      });
      aiMetaNode.appendChild(tabRow);
    }

    function renderBatchAiResults(results, activeSegmentNumber) {
      batchAiResults = sortBatchAiResults(results);
      batchAiActiveSegmentNumber = Math.max(0, Math.round(Number(activeSegmentNumber || 0)) || 0);
      batchAiTabSelectHandler = null;
      if (
        batchAiResults.length > 0 &&
        batchAiResults.every(function (item) {
          return Number(item.segmentNumber || 0) !== batchAiActiveSegmentNumber;
        })
      ) {
        batchAiActiveSegmentNumber = Number(batchAiResults[0].segmentNumber || 0) || 0;
      }
      latestRecommendation = null;
      renderAiMeta(null);
    }

    function renderBatchResultTabs(snapshot) {
      const source = snapshot && typeof snapshot === "object" ? snapshot : {};
      batchAiResults = sortBatchAiResults(source.items);
      batchAiActiveSegmentNumber = Math.max(0, Math.round(Number(source.activeSegmentNumber || 0)) || 0);
      batchAiTabSelectHandler =
        typeof source.onSelect === "function" ? source.onSelect : null;
      clearNode(aiMetaNode);
      if (batchAiResults.length <= 0) {
        batchAiTabSelectHandler = null;
        return;
      }
      if (
        batchAiResults.every(function (item) {
          return Number(item.segmentNumber || 0) !== batchAiActiveSegmentNumber;
        })
      ) {
        batchAiActiveSegmentNumber = Number(batchAiResults[0].segmentNumber || 0) || 0;
      }
      renderBatchAiResultTabs();
    }

    function renderPreview(preview) {
      if (!previewNode) {
        return;
      }
      const source = preview && typeof preview === "object" ? preview : null;
      if (!source || !Array.isArray(source.proposedSegments) || source.proposedSegments.length <= 0) {
        clearNode(previewNode);
        const emptyCard = document.createElement("div");
        emptyCard.className = "preview-card";
        emptyCard.textContent = "当前还没有分段建议。";
        previewNode.appendChild(emptyCard);
        return;
      }
      clearNode(previewNode);
      source.proposedSegments.forEach(function (item, index) {
        const card = document.createElement("div");
        card.className = "preview-card";
        const summary = document.createElement("div");
        summary.textContent =
          "建议段 " +
          String(index + 1) +
          "：开始 " +
          formatMs(item.startMs) +
          " 秒，结束 " +
          formatMs(item.endMs) +
          " 秒";
        card.appendChild(summary);
        previewNode.appendChild(card);
      });
      if (normalizeText(source.unsafeReason)) {
        const warning = document.createElement("div");
        warning.className = "preview-unsafe";
        warning.textContent = normalizeText(source.unsafeReason);
        previewNode.appendChild(warning);
      }
    }

    function renderAiMeta(result) {
      if (!aiMetaNode) {
        return;
      }
      if (result && typeof result === "object" && Object.keys(result).length > 0) {
        latestRecommendation = Object.assign(
          {},
          latestRecommendation && typeof latestRecommendation === "object" ? latestRecommendation : {},
          result
        );
        batchAiResults = [];
        batchAiActiveSegmentNumber = 0;
        batchAiTabSelectHandler = null;
      }
      let source = null;
      if (batchAiResults.length > 0) {
        source =
          batchAiResults.find(function (item) {
            return Number(item.segmentNumber || 0) === batchAiActiveSegmentNumber;
          }) || batchAiResults[0];
      } else if (latestRecommendation && typeof latestRecommendation === "object") {
        source = Object.assign({}, latestRecommendation);
      }
      if (source && latestRecommendation && typeof latestRecommendation === "object") {
        source = Object.assign({}, latestRecommendation, source);
      }
      clearNode(aiMetaNode);
      if (!source || Object.keys(source).length <= 0) {
        aiMetaNode.textContent = "当前还没有 AI 信息。";
        return;
      }
      const omniUsage = source.usage?.omni || {};
      const omniCost = source.cost?.omni || {};
      renderBatchAiResultTabs();
      const layout = document.createElement("div");
      layout.className = "info-layout";
      const infoPane = document.createElement("div");
      infoPane.className = "info-pane";
      const grid = document.createElement("div");
      grid.className = "info-grid";
      [
        ["原始听音", typeof source.listenText === "string" ? source.listenText : ""],
        ["当前段", Number(source.segmentNumber) > 0 ? "第 " + String(source.segmentNumber) + " 段" : ""],
        ["全模态模型", source.models?.omniModel || ""],
        ["全模态输入Token", pickUsageValue(omniUsage, ["input_tokens", "prompt_tokens"])],
        ["全模态输出Token", pickUsageValue(omniUsage, ["output_tokens", "completion_tokens"])],
        ["全模态总Token", pickUsageValue(omniUsage, ["total_tokens", "totalTokens"])],
        ["全模态预估人民币", pickCostValue(omniCost, ["estimatedCostCny", "totalCny", "total_cost_cny"])],
      ]
        .filter(function (item) {
          return normalizeText(item[0]) && (typeof item[1] === "string" ? item[1] !== "" : normalizeText(item[1]));
        })
        .forEach(function (item) {
          const line = document.createElement("div");
          line.className = "info-line";
          const labelNode = document.createElement("span");
          labelNode.className = "info-label";
          labelNode.textContent = String(item[0]) + "：";
          const valueNode = document.createElement("span");
          valueNode.textContent = String(item[1]);
          line.appendChild(labelNode);
          line.appendChild(valueNode);
          grid.appendChild(line);
        });
      infoPane.appendChild(grid);
      layout.appendChild(infoPane);

      const debugPane = document.createElement("div");
      debugPane.className = "debug-pane";
      const debugHead = document.createElement("div");
      debugHead.className = "debug-head";
      const debugTitle = document.createElement("div");
      debugTitle.className = "debug-title";
      debugTitle.textContent = "AI返回内容";
      debugHead.appendChild(debugTitle);
      const debugPayload = {};
      if (source.raw && typeof source.raw === "object" && Object.keys(source.raw).length > 0) {
        debugPayload.raw = source.raw;
      }
      if (source.debug && typeof source.debug === "object" && Object.keys(source.debug).length > 0) {
        debugPayload.debug = source.debug;
      }
      const debugContentText =
        Object.keys(debugPayload).length > 0 ? JSON.stringify(debugPayload, null, 2) : "";
      const copyButton = createButton("复制内容", false, async function () {
        if (!debugContentText) {
          setStatus("当前还没有 AI 返回内容。", "warning");
          return;
        }
        const copied = await copyTextToClipboard(debugContentText);
        const nextLabel = copied ? "已复制" : "复制失败";
        copyButton.textContent = nextLabel;
        if (!copied) {
          setStatus("复制 AI 返回内容失败，请手动复制。", "error");
        }
        if (typeof setTimeout === "function") {
          setTimeout(function () {
            copyButton.textContent = "复制内容";
          }, copied ? 1200 : 1600);
        }
      });
      copyButton.className = normalizeText(copyButton.className + " debug-copy-button");
      debugHead.appendChild(copyButton);
      debugPane.appendChild(debugHead);
      const debugCard = document.createElement("pre");
      debugCard.className = "debug-card";
      debugCard.textContent = debugContentText || "当前还没有 AI 返回内容。";
      debugPane.appendChild(debugCard);
      layout.appendChild(debugPane);
      aiMetaNode.appendChild(layout);
    }

    function setSegmentPreviewAutoApplyEnabled(enabled) {
      segmentPreviewAutoApplyEnabled = enabled !== false;
      renderPreviewActionButtons();
    }

    function setBatchActionState(mode) {
      const normalizedMode = normalizeText(mode);
      if (!normalizedMode) {
        batchActionMode = "recognizeAndWrite";
      } else {
        batchActionMode = normalizedMode;
      }
      renderBatchActionButton();
    }

    function destroy() {
      if (rootNode && rootNode.parentNode) {
        rootNode.parentNode.removeChild(rootNode);
      }
      rootNode = null;
      statusNode = null;
      summaryNode = null;
      summaryCollapseButtonNode = null;
      previewNode = null;
      aiMetaNode = null;
      recordingResultNode = null;
      recordingRefreshButtonNode = null;
      batchStateNode = null;
      batchSelectionGridNode = null;
      batchActionRowNode = null;
      previewActionRowNode = null;
      previewCollapseButtonNode = null;
      aiMetaCollapseButtonNode = null;
      latestRecommendation = null;
      batchAiResults = [];
      batchAiActiveSegmentNumber = 0;
      batchAiTabSelectHandler = null;
      batchSelectionState = {
        totalSegments: 0,
        selectedNumbers: [],
        dragging: false,
        dragNextSelected: true,
        mouseDownHandledSegmentNumber: 0,
      };
      segmentPreviewAutoApplyEnabled = deps.segmentPreviewAutoApplyEnabled !== false;
      batchActionMode = "recognizeAndWrite";
      panelHidden = false;
      previewCollapsed = true;
      aiMetaCollapsed = true;
    }

    return {
      mount,
      destroy,
      setStatus,
      renderAudioContext,
      renderCurrentRecommendation,
      renderRecordingResult,
      renderBatchSelection,
      renderBatchState,
      renderBatchResultTabs,
      renderPreview,
      renderAiMeta,
      renderBatchAiResults,
      setSegmentPreviewAutoApplyEnabled,
      setBatchActionState,
      setPanelHidden,
      togglePanelHidden,
      isPanelHidden,
    };
  }

  const api = {
    createRuntime,
    __testOnly: {
      formatRecordingStatus,
    },
  };

  globalThis.ASREdgeBytedanceAidpTaizhouUiPanel = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
