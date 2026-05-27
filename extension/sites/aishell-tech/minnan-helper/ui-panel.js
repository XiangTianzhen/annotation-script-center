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
      "  position: fixed;",
      "  right: 16px;",
      "  bottom: 16px;",
      "  width: 420px;",
      "  max-width: calc(100vw - 32px);",
      "  max-height: calc(100vh - 32px);",
      "  padding: 14px;",
      "  overflow: auto;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 12px;",
      "  background: #f8fbff;",
      "  color: #1f2937;",
      "  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);",
      "  z-index: 2147483000;",
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
      "[" + ROOT_ATTR + "] .asc-section-title { font-weight: 700; color: #0f172a; margin-bottom: 8px; }",
      "[" + ROOT_ATTR + "] .asc-grid { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 6px 8px; }",
      "[" + ROOT_ATTR + "] .asc-label { color: #475569; font-weight: 700; }",
      "[" + ROOT_ATTR + "] .asc-value { white-space: pre-wrap; overflow-wrap: anywhere; }",
      "[" + ROOT_ATTR + "] .asc-failures { margin: 8px 0 0 16px; padding: 0; }",
      "[" + ROOT_ATTR + "] .asc-failures li { margin-bottom: 6px; color: #b91c1c; }",
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

    function ensureRoot() {
      ensureStyle();
      if (root && document.documentElement.contains(root)) {
        return root;
      }

      root = document.createElement("div");
      root.setAttribute(ROOT_ATTR, "true");

      const head = document.createElement("div");
      head.className = "asc-head";

      const titleWrap = document.createElement("div");
      const title = document.createElement("div");
      title.className = "asc-title";
      title.textContent = "Aishell Tech 闽南语助手";
      const subtitle = document.createElement("div");
      subtitle.className = "asc-subtitle";
      subtitle.textContent = "悬浮窗版：识别、填入、批量识别与失败反馈。";
      titleWrap.appendChild(title);
      titleWrap.appendChild(subtitle);

      const closeButton = createButton("关闭");
      closeButton.addEventListener("click", function () {
        if (root) {
          root.remove();
        }
        root = null;
      });

      head.appendChild(titleWrap);
      head.appendChild(closeButton);
      root.appendChild(head);

      const actions = document.createElement("div");
      actions.className = "asc-actions";

      singleButtonNode = createButton("识别", {
        "data-primary": "true",
      });
      singleButtonNode.addEventListener("click", function () {
        if (typeof deps.onRecommend === "function") {
          void deps.onRecommend();
        }
      });

      batchButtonNode = createButton("批量识别");
      batchButtonNode.addEventListener("click", function () {
        if (typeof deps.onBatchRecommend === "function") {
          void deps.onBatchRecommend();
        }
      });

      stopButtonNode = createButton("停止批量", {
        "data-danger": "true",
      });
      stopButtonNode.disabled = true;
      stopButtonNode.addEventListener("click", function () {
        if (typeof deps.onBatchStop === "function") {
          void deps.onBatchStop();
        }
      });

      actions.appendChild(singleButtonNode);
      actions.appendChild(batchButtonNode);
      actions.appendChild(stopButtonNode);
      root.appendChild(actions);

      statusNode = document.createElement("div");
      statusNode.className = "asc-status";
      statusNode.textContent = "等待进入标注页并点击“识别”或“批量识别”。";
      root.appendChild(statusNode);

      document.documentElement.appendChild(root);
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
    }

    function clearBatch() {
      if (batchNode) {
        batchNode.remove();
      }
      batchNode = null;
    }

    function setStatus(message, tone) {
      ensureRoot();
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(message || "");
      statusNode.setAttribute("data-tone", String(tone || "info"));
    }

    function setBusy(state) {
      const nextState = state && typeof state === "object" ? state : {};
      ensureRoot();
      if (singleButtonNode) {
        singleButtonNode.disabled = nextState.single === true || nextState.batch === true;
      }
      if (batchButtonNode) {
        batchButtonNode.disabled = nextState.batch === true || nextState.single === true;
      }
      if (stopButtonNode) {
        stopButtonNode.disabled = nextState.batch !== true;
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
      resultNode = document.createElement("div");
      resultNode.className = "asc-section";

      const title = document.createElement("div");
      title.className = "asc-section-title";
      title.textContent = "当前识别结果";
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

      const fillButton = createButton("填入当前条");
      fillButton.disabled =
        typeof deps.canFillPageText === "function" ? deps.canFillPageText() !== true : true;
      fillButton.addEventListener("click", function () {
        if (typeof deps.fillPageText !== "function") {
          setStatus("当前运行时没有填入能力。", "error");
          return;
        }
        const fillResult = deps.fillPageText(source.recommendedText || "");
        setStatus(
          fillResult?.message || "已填入当前条。",
          fillResult?.ok === false ? "error" : "success"
        );
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

      root.appendChild(resultNode);
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

      root.appendChild(batchNode);
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
      return ensureRoot();
    }

    function remove() {
      clearResult();
      clearBatch();
      if (root) {
        root.remove();
      }
      root = null;
      statusNode = null;
      singleButtonNode = null;
      batchButtonNode = null;
      stopButtonNode = null;
      currentItemKey = "";
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
