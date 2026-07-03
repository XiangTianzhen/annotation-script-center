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
      "[" + ROOT_ATTR + "] .status[data-tone='warning'] { color: #b54708; }",
      "[" + ROOT_ATTR + "] .section { margin-top: 12px; }",
      "[" + ROOT_ATTR + "] .section-title { font-weight: 600; color: #26418b; }",
      "[" + ROOT_ATTR + "] .section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }",
      "[" + ROOT_ATTR + "] .inline-toggle { margin-top: 8px; display: inline-flex; align-items: center; gap: 8px; color: #4f5d78; }",
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
      "[" + ROOT_ATTR + "] .batch-help { color: #6f7b94; margin-top: 8px; }",
      "[" + ROOT_ATTR + "] .batch-state-item { padding: 10px 12px; border: 1px solid #e4ebfb; border-radius: 8px; background: #fff; color: #42506a; }",
      "[" + ROOT_ATTR + "] .batch-failure-list { margin: 6px 0 0; padding-left: 18px; color: #b42318; }",
      "[" + ROOT_ATTR + "] .meta-details { margin-top: 8px; }",
      "[" + ROOT_ATTR + "] .meta-details summary { cursor: pointer; color: #2f57c5; font-weight: 600; }",
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
      "[" + ROOT_ATTR + "] button[data-primary='true'] { border-color: #2f57c5; background: #2f57c5; color: #fff; }",
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
    let currentRecommendationNode = null;
    let previewNode = null;
    let aiMetaNode = null;
    let batchStateNode = null;
    let batchSelectionSummaryNode = null;
    let batchSelectionGridNode = null;
    let previewAutoApplyToggleNode = null;
    let aiRecommendAutoFillToggleNode = null;
    let currentAudioCollapsed = true;
    let batchSelectionState = {
      totalSegments: 0,
      selectedNumbers: [],
      dragging: false,
      dragNextSelected: true,
    };

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

    function stopBatchSelectionDrag() {
      batchSelectionState.dragging = false;
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
      if (batchSelectionSummaryNode) {
        batchSelectionSummaryNode.textContent =
          "当前选择：" + formatBatchSelectionSummary(total, current);
      }
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
        batchSelectionGridNode.children.slice?.();
      }
      if (batchSelectionGridNode) {
        batchSelectionGridNode.innerHTML = "";
      }
      if (total <= 0) {
        batchSelectionState.selectedNumbers = [];
        if (batchSelectionSummaryNode) {
          batchSelectionSummaryNode.textContent = "当前选择：暂无可选段";
        }
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
            const currentlySelected =
              batchSelectionState.selectedNumbers.indexOf(number) >= 0;
            updateBatchSelectionValue(number, !currentlySelected);
          });
          button.addEventListener("mousedown", function () {
            const currentlySelected =
              batchSelectionState.selectedNumbers.indexOf(number) >= 0;
            batchSelectionState.dragging = true;
            batchSelectionState.dragNextSelected = !currentlySelected;
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
      rootNode.innerHTML =
        '<div class="panel-title">苏州话脚本 Beta</div>' +
        '<div class="panel-note">当前支持普通话听写稿 AI、批量识别、分段建议和平台暂存直写。</div>';

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

      const currentSection = document.createElement("div");
      currentSection.className = "section";
      currentSection.innerHTML =
        '<div class="section-title">当前段识别</div><div class="panel-note">只对当前激活的 region 生效，最终写回 `regions[*].txt`。</div>';
      const currentToggleRow = document.createElement("label");
      currentToggleRow.className = "inline-toggle";
      aiRecommendAutoFillToggleNode = document.createElement("input");
      aiRecommendAutoFillToggleNode.type = "checkbox";
      aiRecommendAutoFillToggleNode.checked = deps.aiRecommendAutoFillEnabled !== false;
      aiRecommendAutoFillToggleNode.addEventListener("change", function () {
        if (typeof deps.onToggleAiRecommendAutoFill === "function") {
          deps.onToggleAiRecommendAutoFill(aiRecommendAutoFillToggleNode.checked === true);
        }
      });
      const currentToggleText = document.createElement("span");
      currentToggleText.textContent = "识别完成后自动填入";
      currentToggleRow.appendChild(aiRecommendAutoFillToggleNode);
      currentToggleRow.appendChild(currentToggleText);
      currentSection.appendChild(currentToggleRow);
      const currentActionRow = document.createElement("div");
      currentActionRow.className = "action-row";
      currentActionRow.appendChild(
        createButton("当前段识别", true, function () {
          deps.onRecommend?.();
        })
      );
      currentActionRow.appendChild(
        createButton("写回当前段", false, function () {
          deps.onWriteCurrentRecommend?.();
        })
      );
      currentSection.appendChild(currentActionRow);
      currentRecommendationNode = document.createElement("div");
      currentRecommendationNode.className = "info-card";
      currentRecommendationNode.textContent = "当前还没有识别结果。";
      currentSection.appendChild(currentRecommendationNode);
      rootNode.appendChild(currentSection);

      const batchSection = document.createElement("div");
      batchSection.className = "section";
      batchSection.innerHTML =
        '<div class="section-title">批量识别</div><div class="panel-note">只处理当前题当前页 regions；默认全选，支持段号点选和拖选，停止后不再继续发新请求。</div>';
      const batchSelectorHead = document.createElement("div");
      batchSelectorHead.className = "batch-selector-head";
      batchSelectionSummaryNode = document.createElement("div");
      batchSelectionSummaryNode.className = "batch-selector-summary";
      batchSelectionSummaryNode.textContent = "当前选择：正在读取段落...";
      batchSelectorHead.appendChild(batchSelectionSummaryNode);
      batchSection.appendChild(batchSelectorHead);
      batchSelectionGridNode = document.createElement("div");
      batchSelectionGridNode.className = "batch-selector-grid";
      batchSection.appendChild(batchSelectionGridNode);
      const batchHelp = document.createElement("div");
      batchHelp.className = "batch-help";
      batchHelp.textContent = "只更新目标段的 txt，不改 ms，不自动提交、不自动切题。";
      batchSection.appendChild(batchHelp);
      const batchActionRow = document.createElement("div");
      batchActionRow.className = "batch-action-row";
      batchActionRow.appendChild(
        createButton("批量识别并填入", true, function () {
          deps.onBatchRecommend?.(getSelectedBatchSegmentNumbers());
        })
      );
      batchActionRow.appendChild(
        createButton("停止批量", false, function () {
          deps.onBatchStop?.();
        })
      );
      batchSection.appendChild(batchActionRow);
      batchStateNode = document.createElement("div");
      batchStateNode.className = "batch-state-list";
      batchStateNode.textContent = "当前没有批量任务。";
      batchSection.appendChild(batchStateNode);
      rootNode.appendChild(batchSection);

      const previewSection = document.createElement("div");
      previewSection.className = "section";
      previewSection.innerHTML =
        '<div class="section-title">分段建议</div><div class="panel-note">建议只会作用于当前音频的分段状态；应用后仍需你手动复核。</div>';
      const previewToggleRow = document.createElement("label");
      previewToggleRow.className = "inline-toggle";
      previewAutoApplyToggleNode = document.createElement("input");
      previewAutoApplyToggleNode.type = "checkbox";
      previewAutoApplyToggleNode.checked = deps.segmentPreviewAutoApplyEnabled !== false;
      previewAutoApplyToggleNode.addEventListener("change", function () {
        if (typeof deps.onToggleSegmentPreviewAutoApply === "function") {
          deps.onToggleSegmentPreviewAutoApply(previewAutoApplyToggleNode.checked === true);
        }
      });
      const previewToggleText = document.createElement("span");
      previewToggleText.textContent = "生成后立即应用当前建议";
      previewToggleRow.appendChild(previewAutoApplyToggleNode);
      previewToggleRow.appendChild(previewToggleText);
      previewSection.appendChild(previewToggleRow);
      const previewActionRow = document.createElement("div");
      previewActionRow.className = "action-row";
      previewActionRow.appendChild(
        createButton("生成分段建议", true, function () {
          deps.onPreview?.();
        })
      );
      previewActionRow.appendChild(
        createButton("应用分段建议", false, function () {
          deps.onApplyPreview?.();
        })
      );
      previewSection.appendChild(previewActionRow);
      previewNode = document.createElement("div");
      previewNode.className = "preview-list";
      previewNode.innerHTML = '<div class="preview-card">当前还没有分段建议。</div>';
      previewSection.appendChild(previewNode);
      rootNode.appendChild(previewSection);

      const metaSection = document.createElement("div");
      metaSection.className = "section";
      metaSection.innerHTML =
        '<div class="section-title">AI信息</div><div class="panel-note">保留两阶段结果、usage/cost 与原始返回，默认折叠显示。</div>';
      const metaDetails = document.createElement("details");
      metaDetails.className = "meta-details";
      const metaSummary = document.createElement("summary");
      metaSummary.textContent = "展开查看 AI 信息";
      metaDetails.appendChild(metaSummary);
      aiMetaNode = document.createElement("div");
      aiMetaNode.className = "info-card";
      aiMetaNode.textContent = "当前还没有 AI 信息。";
      metaDetails.appendChild(aiMetaNode);
      metaSection.appendChild(metaDetails);
      rootNode.appendChild(metaSection);

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
      const currentSegments = Array.isArray(source.currentSegments) ? source.currentSegments : [];
      summaryNode.innerHTML = "";
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
      if (!currentRecommendationNode) {
        return;
      }
      const source = result && typeof result === "object" ? result : {};
      const finalMandarinText = normalizeText(source.finalMandarinText);
      const listenText = normalizeText(source.listenText);
      currentRecommendationNode.innerHTML = "";
      if (!finalMandarinText && !listenText) {
        currentRecommendationNode.textContent = "当前还没有识别结果。";
        return;
      }
      const grid = document.createElement("div");
      grid.className = "info-grid";
      [
        ["最终普通话听写稿", finalMandarinText || "空"],
        ["听音阶段结果", listenText || "空"],
        ["当前段", Number(source.segmentNumber) > 0 ? "第 " + String(source.segmentNumber) + " 段" : ""],
        [
          "听音总Token",
          pickUsageValue(source.usage?.listen, ["total_tokens", "totalTokens"]),
        ],
        [
          "收口总Token",
          pickUsageValue(source.usage?.refine, ["total_tokens", "totalTokens"]),
        ],
        [
          "总预估人民币",
          pickCostValue(source.cost, ["totalEstimatedCostCny", "totalCny", "total_cost_cny"]),
        ],
      ]
        .filter(function (item) {
          return normalizeText(item[0]) && normalizeText(item[1]);
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
      currentRecommendationNode.appendChild(grid);
    }

    function renderBatchState(snapshot) {
      if (!batchStateNode) {
        return;
      }
      const source = snapshot && typeof snapshot === "object" ? snapshot : {};
      batchStateNode.innerHTML = "";
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
      if (failures.length <= 0 && !normalizeText(source.phaseText)) {
        batchStateNode.textContent = "当前没有批量任务。";
      }
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
      const source = result && typeof result === "object" ? result : {};
      const listenUsage = source.usage?.listen || {};
      const refineUsage = source.usage?.refine || {};
      const listenCost = source.cost?.listen || {};
      const refineCost = source.cost?.refine || {};
      aiMetaNode.innerHTML = "";
      if (Object.keys(source).length <= 0) {
        aiMetaNode.textContent = "当前还没有 AI 信息。";
        return;
      }
      const grid = document.createElement("div");
      grid.className = "info-grid";
      [
        ["听音模型", source.models?.listenModel || ""],
        ["收口模型", source.models?.refineModel || ""],
        ["听音输入Token", pickUsageValue(listenUsage, ["input_tokens", "prompt_tokens"])],
        ["听音输出Token", pickUsageValue(listenUsage, ["output_tokens", "completion_tokens"])],
        ["听音总Token", pickUsageValue(listenUsage, ["total_tokens", "totalTokens"])],
        ["听音预估人民币", pickCostValue(listenCost, ["estimatedCostCny", "totalCny", "total_cost_cny"])],
        ["收口输入Token", pickUsageValue(refineUsage, ["input_tokens", "prompt_tokens"])],
        ["收口输出Token", pickUsageValue(refineUsage, ["output_tokens", "completion_tokens"])],
        ["收口总Token", pickUsageValue(refineUsage, ["total_tokens", "totalTokens"])],
        ["收口预估人民币", pickCostValue(refineCost, ["estimatedCostCny", "totalCny", "total_cost_cny"])],
        ["总预估人民币", pickCostValue(source.cost, ["totalEstimatedCostCny", "totalCny", "total_cost_cny"])],
      ]
        .filter(function (item) {
          return normalizeText(item[0]) && normalizeText(item[1]);
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
      aiMetaNode.appendChild(grid);

      const rawListen = normalizeText(source.raw?.listen);
      const rawRefine = normalizeText(source.raw?.refine);
      if (rawListen || rawRefine) {
        const rawCard = document.createElement("div");
        rawCard.className = "info-card";
        rawCard.textContent =
          "raw.listen: " +
          (rawListen || "空") +
          " | raw.refine: " +
          (rawRefine || "空");
        aiMetaNode.appendChild(rawCard);
      }

      if (source.debug && typeof source.debug === "object" && Object.keys(source.debug).length > 0) {
        const debugCard = document.createElement("div");
        debugCard.className = "info-card";
        debugCard.textContent = "debug: " + JSON.stringify(source.debug);
        aiMetaNode.appendChild(debugCard);
      }
    }

    function setSegmentPreviewAutoApplyEnabled(enabled) {
      if (previewAutoApplyToggleNode) {
        previewAutoApplyToggleNode.checked = enabled !== false;
      }
    }

    function setAiRecommendAutoFillEnabled(enabled) {
      if (aiRecommendAutoFillToggleNode) {
        aiRecommendAutoFillToggleNode.checked = enabled !== false;
      }
    }

    function destroy() {
      if (rootNode && rootNode.parentNode) {
        rootNode.parentNode.removeChild(rootNode);
      }
      rootNode = null;
      statusNode = null;
      summaryNode = null;
      summaryCollapseButtonNode = null;
      currentRecommendationNode = null;
      previewNode = null;
      aiMetaNode = null;
      batchStateNode = null;
      batchSelectionSummaryNode = null;
      batchSelectionGridNode = null;
      previewAutoApplyToggleNode = null;
      aiRecommendAutoFillToggleNode = null;
      batchSelectionState = {
        totalSegments: 0,
        selectedNumbers: [],
        dragging: false,
        dragNextSelected: true,
      };
    }

    return {
      mount,
      destroy,
      setStatus,
      renderAudioContext,
      renderCurrentRecommendation,
      renderBatchSelection,
      renderBatchState,
      renderPreview,
      renderAiMeta,
      setSegmentPreviewAutoApplyEnabled,
      setAiRecommendAutoFillEnabled,
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
