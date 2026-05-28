(function () {
  if (globalThis.__ASREdgeAishellTechMinnanUiPanelInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanUiPanelInstalled = true;

  const ROOT_ATTR = "data-asr-edge-aishell-tech-panel";
  const STYLE_ID = "asr-edge-aishell-tech-panel-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  position: relative;",
      "  width: 100%;",
      "  margin-top: 16px;",
      "  padding: 14px;",
      "  overflow: auto;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 12px;",
      "  background: #f8fbff;",
      "  color: #1f2937;",
      "  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .asc-status { margin-top: 12px; color: #475569; white-space: pre-wrap; }",
      "[" + ROOT_ATTR + "] .asc-status[data-tone='success'] { color: #047857; }",
      "[" + ROOT_ATTR + "] .asc-status[data-tone='error'] { color: #b91c1c; }",
      "[" + ROOT_ATTR + "] .asc-status[data-tone='warning'] { color: #b45309; }",
      "[" + ROOT_ATTR + "] .asc-section { margin-top: 12px; border-top: 1px solid #dbeafe; padding-top: 12px; }",
      "[" + ROOT_ATTR + "] .asc-section-title { display: flex; align-items: center; font-size: 14px; font-weight: 700; color: #1d4ed8; margin-bottom: 8px; }",
      "[" + ROOT_ATTR + "] .asc-grid { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 6px 8px; }",
      "[" + ROOT_ATTR + "] .asc-label { color: #475569; font-weight: 700; }",
      "[" + ROOT_ATTR + "] .asc-value { white-space: pre-wrap; overflow-wrap: anywhere; }",
      "[" + ROOT_ATTR + "] .asc-failures { margin: 8px 0 0 16px; padding: 0; }",
      "[" + ROOT_ATTR + "] .asc-failures li { margin-bottom: 6px; color: #b91c1c; }",
      "[" + ROOT_ATTR + "] .asc-result-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }",
      "[" + ROOT_ATTR + "] .asc-result-label { flex-shrink: 0; font-weight: 700; color: #475569; }",
      "[" + ROOT_ATTR + "] .asc-result-content { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }",
      "[" + ROOT_ATTR + "] .asc-result-text-box { flex: 1; min-height: 32px; max-height: 80px; overflow-y: auto; padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; display: flex; align-items: center; }",
      "[" + ROOT_ATTR + "] .asc-toggle-bar { display: flex; justify-content: center; margin-top: 12px; border-top: 1px solid #dbeafe; padding-top: 8px; }",
      "[" + ROOT_ATTR + "] .asc-toggle-btn { background: none; border: none; color: #1d4ed8; cursor: pointer; font-weight: 700; font-size: 11px; min-height: 20px; padding: 0; }",
      "[" + ROOT_ATTR + "] .asc-error-json { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; overflow: auto; margin-top: 10px; white-space: pre-wrap; max-height: 200px; }",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function createButton(text, attrs) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    Object.keys(attrs || {}).forEach(function (key) {
      button.setAttribute(key, attrs[key]);
    });
    return button;
  }

  function copyText(text) {
    const value = String(text || "");
    if (!value) {
      return Promise.reject(new Error("没有可复制的文本。"));
    }
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(value);
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    if (!ok) {
      return Promise.reject(new Error("浏览器未允许复制。"));
    }
    return Promise.resolve();
  }

  function normalizeCompareText(text) {
    return String(text || "").replace(/[\s\u3000]+/g, "").trim();
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let root = null;
    let statusNode = null;
    let resultNode = null;
    let batchNode = null;
    let singleButtonNode = null;
    let batchButtonNode = null;
    let stopButtonNode = null;
    let currentItemKey = "";
    let currentResult = null;
    let isExpanded = false;
    let advancedSectionNode = null;
    let toggleBtnNode = null;
    let recommendTextDisplay = null;
    let fillRecommendBtn = null;
    let errorJsonNode = null;
    let currentBusyState = {
      single: false,
      batch: false,
    };

    function getContainerAnchor() {
      const form = document.querySelector(".mark-area form.el-form");
      return form || document.querySelector(".mark-area");
    }

    function getNativeBatchButtonContainer() {
      const buttons = Array.from(document.querySelectorAll("button"));
      const target = buttons.find(function (button) {
        const text = String(button.textContent || "");
        return text.indexOf("删除音频标点") >= 0 || text.indexOf("查看历史标注记录") >= 0;
      });
      return target ? target.parentNode : null;
    }

    function getNativeSaveButton() {
      const buttons = Array.from(
        document.querySelectorAll(".mark-area button.el-button--primary")
      );
      return buttons.find(function (button) {
        return String(button.textContent || "").indexOf("保存") >= 0;
      }) || null;
    }

    function getScopedDataAttrs(element) {
      const attrs = {};
      if (!element) {
        return attrs;
      }
      Array.from(element.attributes || []).forEach(function (attr) {
        if (attr.name.indexOf("data-v-") === 0) {
          attrs[attr.name] = attr.value;
        }
      });
      return attrs;
    }

    function applyScopedAttrs(element, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        element.setAttribute(key, attrs[key]);
      });
    }

    function syncLayoutVisibility() {
      if (advancedSectionNode) {
        advancedSectionNode.style.display = isExpanded ? "block" : "none";
      }
      if (toggleBtnNode) {
        toggleBtnNode.textContent = isExpanded ? "收起详细信息" : "查看详细信息";
      }
    }

    function requireCurrentResult() {
      if (!currentResult || typeof currentResult !== "object") {
        throw new Error("当前没有可操作的识别结果。");
      }
      return currentResult;
    }

    function copyCurrentHeardText() {
      const result = requireCurrentResult();
      return copyText(result.heardText || "").then(function () {
        setStatus("听音文本已复制。", "success");
        return { ok: true };
      });
    }

    function copyCurrentRecommendedText() {
      const result = requireCurrentResult();
      return copyText(result.recommendedText || "").then(function () {
        setStatus("推荐文本已复制。", "success");
        return { ok: true };
      });
    }

    function fillCurrentRecommendedText() {
      const result = requireCurrentResult();
      if (typeof deps.fillAndSaveCurrent !== "function") {
        return Promise.reject(new Error("当前运行时没有填入并保存能力。"));
      }
      setStatus("正在填入并保存当前条...", "info");
      return Promise.resolve(deps.fillAndSaveCurrent(result.recommendedText || "")).then(
        function (fillResult) {
          setStatus(
            fillResult?.message || "已填入并保存当前条。",
            fillResult?.ok === false ? "error" : "success"
          );
          return fillResult;
        }
      );
    }

    function ignoreCurrentResult() {
      clearResult();
      setStatus("已忽略本次识别结果。", "info");
      return { ok: true };
    }

    function ensureRoot() {
      ensureStyle();
      const anchor = getContainerAnchor();
      if (root && document.documentElement.contains(root)) {
        if (anchor && root.parentNode !== anchor && root.previousSibling !== anchor) {
          if (anchor.tagName === "FORM") {
            anchor.insertAdjacentElement("afterend", root);
          } else {
            anchor.appendChild(root);
          }
        }
        syncLayoutVisibility();
        syncInjectedButtons();
        return root;
      }

      root = document.createElement("div");
      root.setAttribute(ROOT_ATTR, "true");

      const resultsSection = document.createElement("div");
      resultsSection.className = "asc-section";
      resultsSection.style.marginTop = "0";
      resultsSection.style.borderTop = "none";
      resultsSection.style.paddingTop = "0";

      const resultsTitle = document.createElement("div");
      resultsTitle.className = "asc-section-title";
      resultsTitle.textContent = "Aishell Tech 闽南语推荐";
      resultsSection.appendChild(resultsTitle);

      const recommendRow = document.createElement("div");
      recommendRow.className = "asc-result-row";

      const recommendLabel = document.createElement("div");
      recommendLabel.className = "asc-result-label";
      recommendLabel.textContent = "AI推荐文本";
      recommendRow.appendChild(recommendLabel);

      const recommendContent = document.createElement("div");
      recommendContent.className = "asc-result-content";

      recommendTextDisplay = document.createElement("div");
      recommendTextDisplay.className = "asc-result-text-box";
      recommendTextDisplay.style.backgroundColor = "#f0fdf4";
      recommendTextDisplay.style.borderColor = "#bbf7d0";
      recommendTextDisplay.style.color = "#166534";
      recommendTextDisplay.style.fontWeight = "700";
      recommendTextDisplay.textContent = "暂无 AI 推荐";
      recommendContent.appendChild(recommendTextDisplay);

      fillRecommendBtn = createButton("填入并保存", {
        "data-primary": "true",
      });
      fillRecommendBtn.disabled = true;
      fillRecommendBtn.style.padding = "0 14px";
      fillRecommendBtn.addEventListener("click", function () {
        fillCurrentRecommendedText().catch(function (error) {
          setStatus(error?.message || String(error), "error");
        });
      });
      recommendContent.appendChild(fillRecommendBtn);

      recommendRow.appendChild(recommendContent);
      resultsSection.appendChild(recommendRow);

      statusNode = document.createElement("div");
      statusNode.className = "asc-status";
      statusNode.textContent = "等待进入标注页并点击“AI识别”或“AI批量识别”。";
      resultsSection.appendChild(statusNode);
      root.appendChild(resultsSection);

      advancedSectionNode = document.createElement("div");
      advancedSectionNode.style.marginTop = "12px";
      advancedSectionNode.style.borderTop = "1px dashed #dbeafe";
      advancedSectionNode.style.paddingTop = "12px";
      root.appendChild(advancedSectionNode);

      const toggleBar = document.createElement("div");
      toggleBar.className = "asc-toggle-bar";
      toggleBtnNode = document.createElement("button");
      toggleBtnNode.type = "button";
      toggleBtnNode.className = "asc-toggle-btn";
      toggleBtnNode.textContent = "查看详细信息";
      toggleBtnNode.addEventListener("click", function () {
        isExpanded = !isExpanded;
        syncLayoutVisibility();
      });
      toggleBar.appendChild(toggleBtnNode);
      root.appendChild(toggleBar);

      if (anchor) {
        if (anchor.tagName === "FORM") {
          anchor.insertAdjacentElement("afterend", root);
        } else {
          anchor.appendChild(root);
        }
      }

      syncLayoutVisibility();
      syncInjectedButtons();
      return root;
    }

    function renderKeyValueRows(container, rows) {
      const grid = document.createElement("div");
      grid.className = "asc-grid";
      rows.forEach(function (row) {
        const labelNode = document.createElement("div");
        labelNode.className = "asc-label";
        labelNode.textContent = row[0];
        const valueNode = document.createElement("div");
        valueNode.className = "asc-value";
        valueNode.textContent = String(row[1] || "");
        grid.appendChild(labelNode);
        grid.appendChild(valueNode);
      });
      container.appendChild(grid);
    }

    function clearErrorJson() {
      if (errorJsonNode) {
        errorJsonNode.remove();
        errorJsonNode = null;
      }
    }

    function clearResult() {
      currentResult = null;
      if (resultNode) {
        resultNode.remove();
      }
      resultNode = null;
      clearErrorJson();
      if (recommendTextDisplay) {
        recommendTextDisplay.textContent = "暂无 AI 推荐";
        recommendTextDisplay.style.backgroundColor = "#f0fdf4";
        recommendTextDisplay.style.borderColor = "#bbf7d0";
        recommendTextDisplay.style.color = "#166534";
        recommendTextDisplay.style.fontStyle = "normal";
        recommendTextDisplay.style.fontWeight = "700";
      }
      if (fillRecommendBtn) {
        fillRecommendBtn.disabled = true;
      }
    }

    function clearBatch() {
      if (batchNode) {
        batchNode.remove();
      }
      batchNode = null;
    }

    function setStatus(message, tone, rawResponse) {
      ensureRoot();
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(message || "");
      statusNode.setAttribute("data-tone", String(tone || "info"));
      clearErrorJson();
      if (tone === "error" && rawResponse && typeof rawResponse === "object") {
        errorJsonNode = document.createElement("pre");
        errorJsonNode.className = "asc-error-json";
        errorJsonNode.textContent = JSON.stringify(rawResponse, null, 2);
        statusNode.parentNode.insertBefore(errorJsonNode, statusNode.nextSibling);
        isExpanded = true;
        syncLayoutVisibility();
      }
    }

    function setBusy(state) {
      const nextState = state && typeof state === "object" ? state : {};
      currentBusyState = Object.assign({}, nextState);
      ensureRoot();
      if (singleButtonNode) {
        singleButtonNode.disabled = nextState.single === true || nextState.batch === true;
      }
      if (batchButtonNode) {
        batchButtonNode.disabled = nextState.batch === true || nextState.single === true;
        batchButtonNode.style.color = batchButtonNode.disabled ? "#94a3b8" : "#1d4ed8";
      }
      if (stopButtonNode) {
        stopButtonNode.disabled = nextState.batch !== true;
        stopButtonNode.style.color = stopButtonNode.disabled ? "#94a3b8" : "#dc2626";
        stopButtonNode.style.fontWeight = stopButtonNode.disabled ? "400" : "700";
      }
      if (fillRecommendBtn) {
        fillRecommendBtn.disabled =
          nextState.single === true ||
          nextState.batch === true ||
          !currentResult ||
          !String(currentResult.recommendedText || "");
      }
    }

    function syncInjectedButtons() {
      syncSingleButton();
      syncBatchButtons();
    }

    function syncSingleButton() {
      const saveButton = getNativeSaveButton();
      if (!saveButton || !saveButton.parentNode) {
        return;
      }
      if (
        singleButtonNode &&
        document.documentElement.contains(singleButtonNode) &&
        singleButtonNode.parentNode === saveButton.parentNode
      ) {
        return;
      }
      if (singleButtonNode) {
        singleButtonNode.remove();
      }
      const scopedAttrs = getScopedDataAttrs(saveButton);
      singleButtonNode = document.createElement("button");
      singleButtonNode.type = "button";
      singleButtonNode.className = saveButton.className || "el-button el-button--primary";
      applyScopedAttrs(singleButtonNode, scopedAttrs);
      singleButtonNode.setAttribute("data-asc-injected-single", "true");
      singleButtonNode.style.marginLeft = "12px";
      const label = document.createElement("span");
      applyScopedAttrs(label, scopedAttrs);
      label.textContent = "AI识别";
      singleButtonNode.appendChild(label);
      singleButtonNode.addEventListener("click", function (event) {
        event.preventDefault();
        if (typeof deps.onRecommend === "function") {
          void deps.onRecommend();
        }
      });
      saveButton.insertAdjacentElement("afterend", singleButtonNode);
      setBusy(currentBusyState);
    }

    function syncBatchButtons() {
      const container = getNativeBatchButtonContainer();
      if (!container) {
        return;
      }
      if (
        batchButtonNode &&
        stopButtonNode &&
        document.documentElement.contains(batchButtonNode) &&
        document.documentElement.contains(stopButtonNode)
      ) {
        return;
      }
      if (batchButtonNode) {
        batchButtonNode.remove();
      }
      if (stopButtonNode) {
        stopButtonNode.remove();
      }
      const scopedAttrs = getScopedDataAttrs(container);
      const referenceButton = Array.from(container.children).find(function (child) {
        if (!(child instanceof HTMLButtonElement)) {
          return false;
        }
        const text = String(child.textContent || "");
        return text.indexOf("删除音频标点") >= 0 || text.indexOf("查看历史标注记录") >= 0;
      });

      batchButtonNode = document.createElement("button");
      batchButtonNode.type = "button";
      batchButtonNode.className = "el-button el-button--text el-button--small";
      batchButtonNode.setAttribute("data-asc-injected-batch", "true");
      applyScopedAttrs(batchButtonNode, scopedAttrs);
      batchButtonNode.style.marginRight = "12px";
      batchButtonNode.style.color = "#1d4ed8";
      batchButtonNode.style.fontWeight = "700";
      const batchLabel = document.createElement("span");
      applyScopedAttrs(batchLabel, scopedAttrs);
      batchLabel.textContent = "AI批量识别";
      batchButtonNode.appendChild(batchLabel);
      batchButtonNode.addEventListener("click", function (event) {
        event.preventDefault();
        if (typeof deps.onBatchRecommend === "function") {
          void deps.onBatchRecommend();
        }
      });

      stopButtonNode = document.createElement("button");
      stopButtonNode.type = "button";
      stopButtonNode.className = "el-button el-button--text el-button--small";
      stopButtonNode.setAttribute("data-asc-injected-stop", "true");
      applyScopedAttrs(stopButtonNode, scopedAttrs);
      stopButtonNode.style.marginRight = "12px";
      stopButtonNode.style.color = "#94a3b8";
      const stopLabel = document.createElement("span");
      applyScopedAttrs(stopLabel, scopedAttrs);
      stopLabel.textContent = "停止批量";
      stopButtonNode.appendChild(stopLabel);
      stopButtonNode.addEventListener("click", function (event) {
        event.preventDefault();
        if (typeof deps.onBatchStop === "function") {
          void deps.onBatchStop();
        }
      });

      if (referenceButton) {
        container.insertBefore(stopButtonNode, referenceButton);
        container.insertBefore(batchButtonNode, stopButtonNode);
      } else {
        container.appendChild(batchButtonNode);
        container.appendChild(stopButtonNode);
      }
      setBusy(currentBusyState);
    }

    function renderResult(result) {
      const source = result && typeof result === "object" ? result : null;
      ensureRoot();
      clearResult();
      if (!source) {
        return;
      }
      currentResult = source;

      const recommendedText = String(source.recommendedText || "");
      const referenceText = String(source.referenceText || "");
      const showNoChange =
        recommendedText &&
        normalizeCompareText(recommendedText) === normalizeCompareText(referenceText);
      if (recommendTextDisplay) {
        if (showNoChange) {
          recommendTextDisplay.textContent = "无需修改";
          recommendTextDisplay.style.backgroundColor = "#f1f5f9";
          recommendTextDisplay.style.borderColor = "#cbd5e1";
          recommendTextDisplay.style.color = "#64748b";
          recommendTextDisplay.style.fontStyle = "italic";
          recommendTextDisplay.style.fontWeight = "400";
        } else {
          recommendTextDisplay.textContent = recommendedText || "暂无 AI 推荐";
          recommendTextDisplay.style.backgroundColor = "#f0fdf4";
          recommendTextDisplay.style.borderColor = "#bbf7d0";
          recommendTextDisplay.style.color = "#166534";
          recommendTextDisplay.style.fontStyle = "normal";
          recommendTextDisplay.style.fontWeight = "700";
        }
      }
      if (fillRecommendBtn) {
        fillRecommendBtn.disabled = !recommendedText;
      }

      resultNode = document.createElement("div");
      resultNode.className = "asc-section";

      const title = document.createElement("div");
      title.className = "asc-section-title";
      title.textContent = "当前识别结果";
      resultNode.appendChild(title);

      renderKeyValueRows(resultNode, [
        ["听音文本", source.heardText || ""],
        ["推荐文本", recommendedText],
        ["参考文本", referenceText],
        [
          "模型",
          [
            source.models?.listenModel,
            source.models?.compareModel,
            source.models?.singleModel,
          ]
            .filter(Boolean)
            .join(" + "),
        ],
        ["requestId", source.debug?.requestId || ""],
      ]);

      advancedSectionNode.appendChild(resultNode);
    }

    function updateBatch(snapshot) {
      const source = snapshot && typeof snapshot === "object" ? snapshot : {};
      ensureRoot();
      clearBatch();

      batchNode = document.createElement("div");
      batchNode.className = "asc-section";

      const title = document.createElement("div");
      title.className = "asc-section-title";
      title.textContent = "批量识别状态";
      batchNode.appendChild(title);

      renderKeyValueRows(batchNode, [
        ["阶段", source.phaseText || "-"],
        ["总数", Number(source.total || 0)],
        ["已完成", Number(source.completed || 0)],
        ["失败", Number(source.failed || 0)],
        ["当前条", source.currentText || "-"],
      ]);

      if (Array.isArray(source.failures) && source.failures.length > 0) {
        const failureTitle = document.createElement("div");
        failureTitle.className = "asc-section-title";
        failureTitle.textContent = "失败清单";
        batchNode.appendChild(failureTitle);

        const list = document.createElement("ul");
        list.className = "asc-failures";
        source.failures.forEach(function (entry) {
          const item = document.createElement("li");
          item.textContent =
            String(entry?.displayName || "未知条目") + "： " + String(entry?.message || "失败");
          list.appendChild(item);
        });
        batchNode.appendChild(list);
      }

      advancedSectionNode.appendChild(batchNode);
    }

    function updateCurrentItemKey(itemKey) {
      const nextKey = String(itemKey || "");
      if (nextKey && currentItemKey && nextKey !== currentItemKey) {
        clearResult();
        setStatus("当前条已变化，请重新点击“AI识别”。", "warning");
      }
      currentItemKey = nextKey;
    }

    function ensureMounted() {
      return ensureRoot();
    }

    function remove() {
      clearResult();
      clearBatch();
      if (singleButtonNode) {
        singleButtonNode.remove();
      }
      if (batchButtonNode) {
        batchButtonNode.remove();
      }
      if (stopButtonNode) {
        stopButtonNode.remove();
      }
      if (root) {
        root.remove();
      }
      root = null;
      statusNode = null;
      singleButtonNode = null;
      batchButtonNode = null;
      stopButtonNode = null;
      currentItemKey = "";
      advancedSectionNode = null;
      toggleBtnNode = null;
      recommendTextDisplay = null;
      fillRecommendBtn = null;
      errorJsonNode = null;
    }

    return {
      ensureMounted,
      remove,
      renderResult,
      copyHeardText: copyCurrentHeardText,
      copyRecommendedText: copyCurrentRecommendedText,
      fillRecommendedText: fillCurrentRecommendedText,
      ignoreAiResult: ignoreCurrentResult,
      setBusy,
      setStatus,
      updateBatch,
      updateCurrentItemKey,
    };
  }

  globalThis.__ASREdgeAishellTechMinnanUiPanel = {
    createRuntime,
  };
})();
