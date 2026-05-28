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
      "  margin-top: 16px;",
      "  width: 100%;",
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
      "[" + ROOT_ATTR + "] .asc-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }",
      "[" + ROOT_ATTR + "] .asc-title { color: #1d4ed8; font-size: 14px; font-weight: 700; }",
      "[" + ROOT_ATTR + "] .asc-subtitle { color: #64748b; margin-top: 2px; }",
      "[" + ROOT_ATTR + "] .asc-actions, [" + ROOT_ATTR + "] .asc-result-actions, [" + ROOT_ATTR + "] .asc-batch-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }",
      "[" + ROOT_ATTR + "] button {",
      "  min-height: 30px;",
      "  padding: 0 12px;",
      "  border: 1px solid #cbd5e1;",
      "  border-radius: 8px;",
      "  background: #ffffff;",
      "  color: #1f2937;",
      "  cursor: pointer;",
      "  font-size: 12px;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true'] { background: #1d4ed8; border-color: #1d4ed8; color: #ffffff; font-weight: 700; }",
      "[" + ROOT_ATTR + "] button[data-danger='true'] { border-color: #dc2626; color: #b91c1c; }",
      "[" + ROOT_ATTR + "] button:disabled { opacity: 0.6; cursor: not-allowed; }",
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
      "[" + ROOT_ATTR + "] .asc-result-label { flex-shrink: 0; font-weight: bold; color: #475569; }",
      "[" + ROOT_ATTR + "] .asc-result-content { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }",
      "[" + ROOT_ATTR + "] .asc-result-text-box { flex: 1; min-height: 32px; max-height: 80px; overflow-y: auto; padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; display: flex; align-items: center; }",
      "[" + ROOT_ATTR + "] .asc-toggle-bar { display: flex; justify-content: center; margin-top: 12px; border-top: 1px solid #dbeafe; padding-top: 8px; }",
      "[" + ROOT_ATTR + "] .asc-toggle-btn { background: none; border: none; color: #1d4ed8; cursor: pointer; font-weight: bold; font-size: 11px; min-height: 20px; padding: 0; }",
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
    let resultsSectionNode = null;
    let recommendTextDisplay = null;
    let fillRecommendBtn = null;
    let advancedSectionNode = null;
    let toggleBtnNode = null;
    let errorJsonNode = null;
    let currentBusyState = { single: false, batch: false };

    function getContainerAnchor() {
      const form = document.querySelector(".mark-area form.el-form");
      return form || document.querySelector(".mark-area");
    }

    function syncLayoutVisibility() {
      if (advancedSectionNode) {
        advancedSectionNode.style.display = isExpanded ? "block" : "none";
      }
      if (toggleBtnNode) {
        toggleBtnNode.textContent = isExpanded ? "收起详细信息" : "查看详细信息";
      }
    }

    function ensureRoot() {
      ensureStyle();
      if (root && document.documentElement.contains(root)) {
        const anchor = getContainerAnchor();
        if (anchor && root.parentNode !== anchor && root.nextSibling !== anchor) {
          if (anchor.tagName === "FORM") {
            anchor.insertAdjacentElement("afterend", root);
          } else {
            anchor.appendChild(root);
          }
        }
        syncLayoutVisibility();
        return root;
      }

      root = document.createElement("div");
      root.setAttribute(ROOT_ATTR, "true");

      resultsSectionNode = document.createElement("div");
      resultsSectionNode.className = "asc-section";
      resultsSectionNode.style.marginTop = "0px";
      resultsSectionNode.style.border = "none";
      resultsSectionNode.style.paddingTop = "0px";

      const resultsTitle = document.createElement("div");
      resultsTitle.className = "asc-section-title";
      resultsTitle.textContent = "Aishell Tech 闽南语推荐";
      resultsSectionNode.appendChild(resultsTitle);

      const recommendRow = document.createElement("div");
      recommendRow.className = "asc-result-row";
      const recommendLabel = document.createElement("div");
      recommendLabel.className = "asc-result-label";
      recommendLabel.style.color = "#475569";
      recommendLabel.textContent = "AI推荐文本";
      recommendRow.appendChild(recommendLabel);

      const recommendContent = document.createElement("div");
      recommendContent.className = "asc-result-content";
      recommendTextDisplay = document.createElement("div");
      recommendTextDisplay.className = "asc-result-text-box";
      recommendTextDisplay.style.backgroundColor = "#f0fdf4";
      recommendTextDisplay.style.borderColor = "#bbf7d0";
      recommendTextDisplay.style.color = "#166534";
      recommendTextDisplay.style.fontWeight = "bold";
      recommendTextDisplay.textContent = "暂无 AI 推荐";
      recommendContent.appendChild(recommendTextDisplay);

      fillRecommendBtn = createButton("填入并保存", {
        "data-primary": "true",
      });
      fillRecommendBtn.style.padding = "0 14px";
      fillRecommendBtn.disabled = true;
      fillRecommendBtn.addEventListener("click", function () {
        if (!currentResult || !currentResult.recommendedText) {
          return;
        }
        const val = currentResult.recommendedText;
        if (typeof deps.fillAndSaveCurrent === "function") {
          setStatus("正在填入并点击页面真实保存...", "info");
          Promise.resolve(deps.fillAndSaveCurrent(val))
            .then(function (fillResult) {
              setStatus(
                fillResult?.message || "已填入并保存当前条。",
                fillResult?.ok === false ? "error" : "success"
              );
            })
            .catch(function (error) {
              setStatus(error?.message || String(error), "error");
            });
        } else {
          setStatus("当前运行时没有填入并保存能力。", "error");
        }
      });
      recommendContent.appendChild(fillRecommendBtn);
      recommendRow.appendChild(recommendContent);
      resultsSectionNode.appendChild(recommendRow);

      statusNode = document.createElement("div");
      statusNode.className = "asc-status";
      statusNode.textContent = "等待进入标注页并点击“识别”或“批量识别”。";
      resultsSectionNode.appendChild(statusNode);

      root.appendChild(resultsSectionNode);

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

      const anchor = getContainerAnchor();
      if (anchor) {
        if (anchor.tagName === "FORM") {
          anchor.insertAdjacentElement("afterend", root);
        } else {
          anchor.appendChild(root);
        }
      }

      syncLayoutVisibility();
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

    function clearResult() {
      currentResult = null;
      if (resultNode) {
        resultNode.remove();
      }
      resultNode = null;

      if (errorJsonNode) {
        errorJsonNode.remove();
        errorJsonNode = null;
      }

      if (recommendTextDisplay) {
        recommendTextDisplay.textContent = "暂无 AI 推荐";
        recommendTextDisplay.style.backgroundColor = "#f0fdf4";
        recommendTextDisplay.style.borderColor = "#bbf7d0";
        recommendTextDisplay.style.color = "#166534";
        recommendTextDisplay.style.fontStyle = "normal";
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

      if (errorJsonNode) {
        errorJsonNode.remove();
        errorJsonNode = null;
      }

      if (tone === "error" && rawResponse && typeof rawResponse === "object") {
        errorJsonNode = document.createElement("pre");
        errorJsonNode.style.backgroundColor = "#fee2e2";
        errorJsonNode.style.border = "1px solid #fca5a5";
        errorJsonNode.style.color = "#991b1b";
        errorJsonNode.style.padding = "10px";
        errorJsonNode.style.borderRadius = "8px";
        errorJsonNode.style.fontFamily = "monospace";
        errorJsonNode.style.fontSize = "11px";
        errorJsonNode.style.overflow = "auto";
        errorJsonNode.style.marginTop = "10px";
        errorJsonNode.style.whiteSpace = "pre-wrap";
        errorJsonNode.style.maxHeight = "200px";
        errorJsonNode.textContent = JSON.stringify(rawResponse, null, 2);

        statusNode.parentNode.insertBefore(errorJsonNode, statusNode.nextSibling);

        isExpanded = true;
        syncLayoutVisibility();
      }
    }

    function setBusy(state) {
      const nextState = state && typeof state === "object" ? state : {};
      currentBusyState = nextState;
      ensureRoot();
      if (singleButtonNode) {
        singleButtonNode.disabled = nextState.single === true || nextState.batch === true;
      }
      if (batchButtonNode) {
        batchButtonNode.disabled = nextState.batch === true || nextState.single === true;
        if (batchButtonNode.disabled) {
          batchButtonNode.style.color = "#94a3b8";
        } else {
          batchButtonNode.style.color = "#1d4ed8";
        }
      }
      if (stopButtonNode) {
        stopButtonNode.disabled = nextState.batch !== true;
        if (stopButtonNode.disabled) {
          stopButtonNode.style.color = "#94a3b8";
          stopButtonNode.style.fontWeight = "normal";
        } else {
          stopButtonNode.style.color = "#dc2626";
          stopButtonNode.style.fontWeight = "700";
        }
      }
    }

    function getNativeButtonContainer() {
      const buttons = document.querySelectorAll("button");
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        if (btn.textContent.includes("删除音频标点") || btn.textContent.includes("查看历史标注记录")) {
          return btn.parentNode;
        }
      }
      return null;
    }

    function getScopedDataVAttrs(element) {
      const attrs = {};
      if (!element) {
        return attrs;
      }
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name.startsWith("data-v-")) {
          attrs[attr.name] = attr.value;
        }
      }
      return attrs;
    }

    function syncInjectedBatchButtons() {
      const container = getNativeButtonContainer();
      if (!container) {
        return;
      }

      const injectedBatch = container.querySelector("[data-asc-injected-batch='true']");
      const injectedStop = container.querySelector("[data-asc-injected-stop='true']");

      if (injectedBatch && injectedStop && document.documentElement.contains(injectedBatch) && document.documentElement.contains(injectedStop)) {
        batchButtonNode = injectedBatch;
        stopButtonNode = injectedStop;
        return;
      }

      if (injectedBatch) {
        injectedBatch.remove();
      }
      if (injectedStop) {
        injectedStop.remove();
      }

      const scopedAttrs = getScopedDataVAttrs(container) || {};
      const refBtn = Array.from(container.children).find(function (child) {
        return child.tagName === "BUTTON" && (child.textContent.includes("删除音频标点") || child.textContent.includes("查看历史标注记录"));
      });

      const batchBtn = document.createElement("button");
      batchBtn.type = "button";
      batchBtn.className = "el-button el-button--text el-button--small";
      batchBtn.setAttribute("data-asc-injected-batch", "true");
      Object.keys(scopedAttrs).forEach(function (key) {
        batchBtn.setAttribute(key, scopedAttrs[key]);
      });
      batchBtn.style.color = "#1d4ed8";
      batchBtn.style.fontWeight = "700";
      batchBtn.style.marginRight = "12px";

      const batchSpan = document.createElement("span");
      batchSpan.textContent = "AI批量识别";
      Object.keys(scopedAttrs).forEach(function (key) {
        batchSpan.setAttribute(key, scopedAttrs[key]);
      });
      batchBtn.appendChild(batchSpan);

      batchBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof deps.onBatchRecommend === "function") {
          void deps.onBatchRecommend();
        }
      });

      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.className = "el-button el-button--text el-button--small";
      stopBtn.setAttribute("data-asc-injected-stop", "true");
      Object.keys(scopedAttrs).forEach(function (key) {
        stopBtn.setAttribute(key, scopedAttrs[key]);
      });
      stopBtn.style.marginRight = "12px";
      stopBtn.style.color = "#94a3b8";
      stopBtn.disabled = true;

      const stopSpan = document.createElement("span");
      stopSpan.textContent = "停止批量";
      Object.keys(scopedAttrs).forEach(function (key) {
        stopSpan.setAttribute(key, scopedAttrs[key]);
      });
      stopBtn.appendChild(stopSpan);

      stopBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof deps.onBatchStop === "function") {
          void deps.onBatchStop();
        }
      });

      if (refBtn) {
        container.insertBefore(batchBtn, refBtn);
        container.insertBefore(stopBtn, refBtn);
      } else {
        container.appendChild(batchBtn);
        container.appendChild(stopBtn);
      }

      batchButtonNode = batchBtn;
      stopButtonNode = stopBtn;

      if (currentBusyState) {
        setBusy(currentBusyState);
      }
    }

    function getNativeSaveButton() {
      const buttons = document.querySelectorAll(".mark-area button.el-button--primary");
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        if (btn.textContent.includes("保存")) {
          return btn;
        }
      }
      return null;
    }

    function syncInjectedSingleButton() {
      const saveBtn = getNativeSaveButton();
      if (!saveBtn) {
        return;
      }
      const container = saveBtn.parentNode;
      if (!container) {
        return;
      }

      const injectedSingle = container.querySelector("[data-asc-injected-single='true']");
      if (injectedSingle && document.documentElement.contains(injectedSingle)) {
        singleButtonNode = injectedSingle;
        return;
      }

      if (injectedSingle) {
        injectedSingle.remove();
      }

      const scopedAttrs = getScopedDataVAttrs(saveBtn) || {};

      const singleBtn = document.createElement("button");
      singleBtn.type = "button";
      singleBtn.className = "el-button el-button--primary el-button--small";
      singleBtn.setAttribute("data-asc-injected-single", "true");
      Object.keys(scopedAttrs).forEach(function (key) {
        singleBtn.setAttribute(key, scopedAttrs[key]);
      });
      singleBtn.style.marginLeft = "12px";

      const span = document.createElement("span");
      span.textContent = "AI识别";
      Object.keys(scopedAttrs).forEach(function (key) {
        span.setAttribute(key, scopedAttrs[key]);
      });
      singleBtn.appendChild(span);

      singleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof deps.onRecommend === "function") {
          void deps.onRecommend();
        }
      });

      if (saveBtn.nextSibling) {
        container.insertBefore(singleBtn, saveBtn.nextSibling);
      } else {
        container.appendChild(singleBtn);
      }

      singleButtonNode = singleBtn;

      if (currentBusyState) {
        setBusy(currentBusyState);
      }
    }

    function renderResult(result) {
      const source = result && typeof result === "object" ? result : null;
      ensureRoot();
      clearResult();
      if (!source) {
        return;
      }
      currentResult = source;

      const isSame = source.recommendedText && source.referenceText &&
        String(source.recommendedText).trim() === String(source.referenceText).trim();

      if (recommendTextDisplay) {
        if (isSame) {
          recommendTextDisplay.textContent = "无需修改";
          recommendTextDisplay.style.backgroundColor = "#f1f5f9";
          recommendTextDisplay.style.borderColor = "#e2e8f0";
          recommendTextDisplay.style.color = "#64748b";
          recommendTextDisplay.style.fontStyle = "italic";
        } else {
          recommendTextDisplay.textContent = source.recommendedText || "";
          recommendTextDisplay.style.backgroundColor = "#f0fdf4";
          recommendTextDisplay.style.borderColor = "#bbf7d0";
          recommendTextDisplay.style.color = "#166534";
          recommendTextDisplay.style.fontStyle = "normal";
        }
        if (fillRecommendBtn) {
          fillRecommendBtn.disabled = !source.recommendedText ||
            (typeof deps.canFillPageText === "function" ? deps.canFillPageText() !== true : true);
        }
      }

      resultNode = document.createElement("div");
      resultNode.className = "asc-section";

      const title = document.createElement("div");
      title.className = "asc-section-title";
      title.textContent = "当前识别结果详情";
      resultNode.appendChild(title);

      renderKeyValueRows(resultNode, [
        ["听音文本", source.heardText || ""],
        ["推荐文本", source.recommendedText || ""],
        ["参考文本", source.referenceText || ""],
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

      const actions = document.createElement("div");
      actions.className = "asc-result-actions";

      const copyHeardButton = createButton("复制听音文本");
      copyHeardButton.addEventListener("click", function () {
        copyText(source.heardText || "")
          .then(function () {
            setStatus("听音文本已复制。", "success");
          })
          .catch(function (error) {
            setStatus(error?.message || String(error), "error");
          });
      });

      const copyRecommendedButton = createButton("复制推荐文本", {
        "data-primary": "true",
      });
      copyRecommendedButton.addEventListener("click", function () {
        copyText(source.recommendedText || "")
          .then(function () {
            setStatus("推荐文本已复制。", "success");
          })
          .catch(function (error) {
            setStatus(error?.message || String(error), "error");
          });
      });

      const fillButton = createButton("填入并保存当前条");
      fillButton.disabled =
        typeof deps.canFillPageText === "function" ? deps.canFillPageText() !== true : true;
      fillButton.addEventListener("click", function () {
        if (typeof deps.fillAndSaveCurrent !== "function") {
          setStatus("当前运行时没有填入并保存能力。", "error");
          return;
        }
        setStatus("正在填入并点击页面真实保存...", "info");
        Promise.resolve(deps.fillAndSaveCurrent(source.recommendedText || ""))
          .then(function (fillResult) {
            setStatus(
              fillResult?.message || "已填入并保存当前条。",
              fillResult?.ok === false ? "error" : "success"
            );
          })
          .catch(function (error) {
            setStatus(error?.message || String(error), "error");
          });
      });

      const ignoreButton = createButton("忽略");
      ignoreButton.addEventListener("click", function () {
        clearResult();
        setStatus("已忽略本次识别结果。", "info");
      });

      actions.appendChild(copyHeardButton);
      actions.appendChild(copyRecommendedButton);
      actions.appendChild(fillButton);
      actions.appendChild(ignoreButton);
      resultNode.appendChild(actions);

      if (advancedSectionNode) {
        advancedSectionNode.appendChild(resultNode);
      }
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
          item.textContent = String(entry?.displayName || "未知条目") + "： " + String(entry?.message || "失败");
          list.appendChild(item);
        });
        batchNode.appendChild(list);
      }

      const actions = document.createElement("div");
      actions.className = "asc-batch-actions";
      const stopButton = createButton("停止本轮批量", {
        "data-danger": "true",
      });
      stopButton.disabled = source.running !== true;
      stopButton.addEventListener("click", function () {
        if (typeof deps.onBatchStop === "function") {
          void deps.onBatchStop();
        }
      });
      actions.appendChild(stopButton);
      batchNode.appendChild(actions);

      if (advancedSectionNode) {
        advancedSectionNode.appendChild(batchNode);
      }
    }

    function updateCurrentItemKey(itemKey) {
      const nextKey = String(itemKey || "");
      if (nextKey && currentItemKey && nextKey !== currentItemKey) {
        clearResult();
        setStatus("当前条已变化，请重新点击“识别”。", "warning");
      }
      currentItemKey = nextKey;
    }

    function ensureMounted() {
      ensureRoot();
      syncInjectedBatchButtons();
      syncInjectedSingleButton();
      return root;
    }

    function remove() {
      clearResult();
      clearBatch();
      if (root) {
        root.remove();
      }
      root = null;
      statusNode = null;

      const container = getNativeButtonContainer();
      if (container) {
        const injectedBatch = container.querySelector("[data-asc-injected-batch='true']");
        const injectedStop = container.querySelector("[data-asc-injected-stop='true']");
        if (injectedBatch) {
          injectedBatch.remove();
        }
        if (injectedStop) {
          injectedStop.remove();
        }
      }

      const saveBtn = getNativeSaveButton();
      if (saveBtn && saveBtn.parentNode) {
        const injectedSingle = saveBtn.parentNode.querySelector("[data-asc-injected-single='true']");
        if (injectedSingle) {
          injectedSingle.remove();
        }
      }

      batchButtonNode = null;
      stopButtonNode = null;
      currentItemKey = "";

      resultsSectionNode = null;
      heardTextDisplay = null;
      recommendTextDisplay = null;
      fillHeardBtn = null;
      fillRecommendBtn = null;
      advancedSectionNode = null;
      toggleBtnNode = null;
    }

    return {
      ensureMounted,
      remove,
      renderResult,
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
