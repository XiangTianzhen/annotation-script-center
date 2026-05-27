(function () {
  const ROOT_ATTR = "data-asr-edge-aishell-tech-panel";
  const STYLE_ID = "asr-edge-aishell-tech-panel-style";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function removeTextSpaces(value) {
    return String(value || "").replace(/[\s\u3000]+/g, "");
  }

  function ensureChineseSentencePunctuation(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const last = text[text.length - 1];
    if ("。！？；…".indexOf(last) >= 0) {
      return text;
    }
    if (last === ".") {
      return text.slice(0, -1) + "。";
    }
    if (last === "?") {
      return text.slice(0, -1) + "？";
    }
    if (last === "!") {
      return text.slice(0, -1) + "！";
    }
    if (last === ";") {
      return text.slice(0, -1) + "；";
    }
    return text + "。";
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  box-sizing: border-box;",
      "  margin-top: 16px;",
      "  padding: 12px 14px;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 10px;",
      "  background: #f8fbff;",
      "  color: #1f2937;",
      "  font-size: 12px;",
      "  line-height: 1.6;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .asc-aishell-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }",
      "[" + ROOT_ATTR + "] .asc-aishell-title { color: #1d4ed8; font-weight: 700; font-size: 13px; }",
      "[" + ROOT_ATTR + "] .asc-aishell-actions, [" + ROOT_ATTR + "] .asc-aishell-result-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }",
      "[" + ROOT_ATTR + "] button { min-height: 28px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #1f2937; cursor: pointer; font-size: 12px; }",
      "[" + ROOT_ATTR + "] button[data-primary='true'] { background: #1d4ed8; border-color: #1d4ed8; color: #fff; font-weight: 700; }",
      "[" + ROOT_ATTR + "] button[data-danger='true'] { background: #b91c1c; border-color: #b91c1c; color: #fff; }",
      "[" + ROOT_ATTR + "] button:disabled { opacity: 0.6; cursor: not-allowed; }",
      "[" + ROOT_ATTR + "] .asc-aishell-status { margin-top: 8px; color: #64748b; }",
      "[" + ROOT_ATTR + "] .asc-aishell-status[data-tone='error'] { color: #b91c1c; }",
      "[" + ROOT_ATTR + "] .asc-aishell-status[data-tone='success'] { color: #047857; }",
      "[" + ROOT_ATTR + "] .asc-aishell-result { margin-top: 10px; border-top: 1px solid #dbeafe; padding-top: 10px; }",
      "[" + ROOT_ATTR + "] .asc-aishell-grid { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 6px 8px; }",
      "[" + ROOT_ATTR + "] .asc-aishell-label { color: #475569; font-weight: 700; }",
      "[" + ROOT_ATTR + "] .asc-aishell-value { white-space: pre-wrap; overflow-wrap: anywhere; }",
      "[" + ROOT_ATTR + "] .asc-aishell-note { margin-top: 8px; color: #b45309; font-weight: 700; }",
      ".asc-aishell-batch-floating { position: fixed; top: 16px; right: 16px; width: 360px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); overflow: auto; padding: 12px; border: 1px solid #a7f3d0; border-radius: 8px; background: #f0fdf4; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16); z-index: 2147483000; color: #064e3b; font-size: 12px; line-height: 1.6; }",
      ".asc-aishell-batch-floating[data-tone='error'], .asc-aishell-batch-floating[data-tone='stopped'] { border-color: #fecaca; background: #fef2f2; color: #7f1d1d; }",
      ".asc-aishell-batch-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; }",
      ".asc-aishell-batch-title { font-size: 13px; font-weight: 700; }",
      ".asc-aishell-batch-grid { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 4px 6px; margin-top: 8px; }",
      ".asc-aishell-batch-label { font-weight: 700; }",
      ".asc-aishell-batch-current { margin-top: 8px; font-weight: 700; }",
      ".asc-aishell-batch-failures { margin-top: 8px; border-top: 1px dashed rgba(15, 23, 42, 0.18); padding-top: 8px; }",
      ".asc-aishell-batch-failures ul { margin: 6px 0 0 16px; padding: 0; }",
      ".asc-aishell-batch-failures li { margin: 0 0 6px; overflow-wrap: anywhere; }",
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

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let root = null;
    let resultNode = null;
    let statusNode = null;
    let recommendButtonNode = null;
    let batchStartButtonNode = null;
    let batchStopButtonNode = null;
    let currentResult = null;
    let currentItemKey = "";
    let batchFloatingNode = null;
    let batchFloatingGrid = null;
    let batchFloatingCurrentNode = null;
    let batchFloatingFailuresNode = null;

    function findMountContext() {
      const markArea = document.querySelector(".mark-area");
      if (!(markArea instanceof HTMLElement)) {
        const markContainer = document.querySelector(".mark-container");
        if (!(markContainer instanceof HTMLElement)) {
          return null;
        }
        return {
          container: markContainer,
          anchor: null,
        };
      }
      const formNode = markArea.querySelector("form.el-form, .el-form");
      return {
        container: markArea,
        anchor: formNode instanceof HTMLElement ? formNode : null,
      };
    }

    function applyMountContext(targetNode, mountContext) {
      const mountTarget = mountContext?.container;
      if (!(targetNode instanceof HTMLElement) || !(mountTarget instanceof HTMLElement)) {
        return false;
      }
      const anchorNode = mountContext?.anchor;
      if (
        anchorNode instanceof HTMLElement &&
        anchorNode.parentElement === mountTarget
      ) {
        mountTarget.insertBefore(targetNode, anchorNode);
        return true;
      }
      mountTarget.appendChild(targetNode);
      return true;
    }

    function setStatus(message, tone) {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(message || "");
      statusNode.setAttribute("data-tone", String(tone || "info"));
    }

    async function copyText(text) {
      const content = String(text || "");
      if (!content) {
        throw new Error("暂无可复制内容。");
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(content);
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    function clearResult() {
      currentResult = null;
      if (resultNode) {
        resultNode.remove();
      }
      resultNode = null;
    }

    function renderRow(grid, label, value) {
      const labelNode = document.createElement("div");
      labelNode.className = "asc-aishell-label";
      labelNode.textContent = label;
      const valueNode = document.createElement("div");
      valueNode.className = "asc-aishell-value";
      valueNode.textContent = String(value || "");
      grid.appendChild(labelNode);
      grid.appendChild(valueNode);
    }

    function renderResult(result) {
      if (!root) {
        return;
      }
      clearResult();
      currentResult = result && typeof result === "object" ? result : null;
      if (!currentResult) {
        return;
      }
      const resultWrap = document.createElement("div");
      resultWrap.className = "asc-aishell-result";
      const grid = document.createElement("div");
      grid.className = "asc-aishell-grid";
      renderRow(grid, "听音文本", currentResult.heardText || "");
      renderRow(grid, "推荐文本", currentResult.recommendedText || "");
      renderRow(grid, "参考文本", currentResult.referenceText || "");
      renderRow(grid, "决策", currentResult.decision || "");
      renderRow(
        grid,
        "模型",
        [
          currentResult.models?.listenModel,
          currentResult.models?.compareModel,
        ]
          .filter(Boolean)
          .join(" + ") || currentResult.models?.singleModel || ""
      );
      renderRow(
        grid,
        "耗时",
        "听音 " +
          String(Number(currentResult.timing?.listenDurationMs || 0)) +
          "ms / 对比 " +
          String(Number(currentResult.timing?.compareDurationMs || 0)) +
          "ms / 总计 " +
          String(Number(currentResult.timing?.totalDurationMs || 0)) +
          "ms"
      );
      renderRow(grid, "requestId", currentResult.debug?.requestId || "");
      resultWrap.appendChild(grid);

      const actions = document.createElement("div");
      actions.className = "asc-aishell-result-actions";
      const copyHeardButton = createButton("复制听音文本");
      copyHeardButton.addEventListener("click", function () {
        copyText(removeTextSpaces(currentResult.heardText || ""))
          .then(function () {
            setStatus("AI 听音文本已复制。", "success");
          })
          .catch(function (error) {
            setStatus(error?.message || String(error), "error");
          });
      });
      const copyRecommendedButton = createButton("复制推荐文本", {
        "data-primary": "true",
      });
      copyRecommendedButton.addEventListener("click", function () {
        copyText(removeTextSpaces(currentResult.recommendedText || ""))
          .then(function () {
            setStatus("AI 推荐文本已复制。", "success");
          })
          .catch(function (error) {
            setStatus(error?.message || String(error), "error");
          });
      });
      const fillButton = createButton("填入当前条");
      fillButton.disabled =
        typeof deps.canFillPageText === "function" ? !deps.canFillPageText() : false;
      fillButton.addEventListener("click", function () {
        if (typeof deps.fillPageText !== "function") {
          setStatus("填入能力未就绪。", "error");
          return;
        }
        const fillResult = deps.fillPageText(
          ensureChineseSentencePunctuation(removeTextSpaces(currentResult.recommendedText || ""))
        );
        setStatus(fillResult?.message || "已填入推荐文本。", fillResult?.ok === false ? "error" : "success");
      });
      const ignoreButton = createButton("忽略");
      ignoreButton.addEventListener("click", function () {
        clearResult();
        setStatus("已忽略当前推荐结果。", "info");
      });
      actions.appendChild(copyHeardButton);
      actions.appendChild(copyRecommendedButton);
      actions.appendChild(fillButton);
      actions.appendChild(ignoreButton);
      resultWrap.appendChild(actions);

      const note = document.createElement("div");
      note.className = "asc-aishell-note";
      note.textContent =
        "AI 结果仅作辅助。单条不会自动保存；批量模式会在每条填入后点击页面真实保存按钮。";
      resultWrap.appendChild(note);

      root.appendChild(resultWrap);
      resultNode = resultWrap;
    }

    function ensureBatchFloating() {
      if (batchFloatingNode && document.documentElement.contains(batchFloatingNode)) {
        return batchFloatingNode;
      }
      batchFloatingNode = document.createElement("div");
      batchFloatingNode.className = "asc-aishell-batch-floating";
      const head = document.createElement("div");
      head.className = "asc-aishell-batch-head";
      const title = document.createElement("div");
      title.className = "asc-aishell-batch-title";
      title.textContent = "Aishell 批量推荐并保存";
      const closeButton = createButton("关闭");
      closeButton.addEventListener("click", function () {
        if (batchFloatingNode) {
          batchFloatingNode.remove();
        }
        batchFloatingNode = null;
        batchFloatingGrid = null;
        batchFloatingCurrentNode = null;
        batchFloatingFailuresNode = null;
      });
      head.appendChild(title);
      head.appendChild(closeButton);
      batchFloatingNode.appendChild(head);
      batchFloatingGrid = document.createElement("div");
      batchFloatingGrid.className = "asc-aishell-batch-grid";
      batchFloatingNode.appendChild(batchFloatingGrid);
      batchFloatingCurrentNode = document.createElement("div");
      batchFloatingCurrentNode.className = "asc-aishell-batch-current";
      batchFloatingNode.appendChild(batchFloatingCurrentNode);
      batchFloatingFailuresNode = document.createElement("div");
      batchFloatingFailuresNode.className = "asc-aishell-batch-failures";
      batchFloatingNode.appendChild(batchFloatingFailuresNode);
      document.documentElement.appendChild(batchFloatingNode);
      return batchFloatingNode;
    }

    function updateBatch(snapshot) {
      const data = snapshot && typeof snapshot === "object" ? snapshot : {};
      const floating = ensureBatchFloating();
      if (!floating || !batchFloatingGrid || !batchFloatingCurrentNode || !batchFloatingFailuresNode) {
        return;
      }
      floating.setAttribute("data-tone", String(data.tone || "running"));
      batchFloatingGrid.innerHTML = "";
      [
        ["阶段", data.phaseText || "-"],
        ["总数", Number(data.total || 0)],
        ["已完成", Number(data.completed || 0)],
        ["失败", Number(data.failed || 0)],
        ["并发", Number(data.concurrency || 0)],
        ["耗时", String(data.elapsedText || "-")],
      ].forEach(function (row) {
        const label = document.createElement("div");
        label.className = "asc-aishell-batch-label";
        label.textContent = row[0];
        const value = document.createElement("div");
        value.textContent = String(row[1]);
        batchFloatingGrid.appendChild(label);
        batchFloatingGrid.appendChild(value);
      });
      batchFloatingCurrentNode.textContent = data.currentText
        ? "当前条目：" + data.currentText
        : "当前条目：-";
      const failures = Array.isArray(data.failures) ? data.failures : [];
      if (!failures.length) {
        batchFloatingFailuresNode.innerHTML = "<strong>失败清单</strong><div>暂无失败项。</div>";
        return;
      }
      const list = document.createElement("ul");
      failures.slice(0, 12).forEach(function (failure) {
        const item = document.createElement("li");
        item.textContent =
          normalizeText(failure?.displayName || "未命名条目") +
          "：" +
          normalizeText(failure?.message || "未知错误");
        list.appendChild(item);
      });
      batchFloatingFailuresNode.innerHTML = "<strong>失败清单</strong>";
      batchFloatingFailuresNode.appendChild(list);
    }

    function setBatchButtons(running, stopping) {
      if (batchStartButtonNode) {
        batchStartButtonNode.disabled = running === true;
      }
      if (batchStopButtonNode) {
        batchStopButtonNode.disabled = running !== true || stopping === true;
      }
    }

    async function requestAiRecommend() {
      if (typeof deps.onRecommend !== "function") {
        setStatus("AI 推荐运行时未就绪。", "error");
        return { ok: false };
      }
      recommendButtonNode.disabled = true;
      setStatus("正在生成 AI 推荐文本...", "info");
      try {
        const result = await deps.onRecommend();
        renderResult(result);
        setStatus("AI 推荐文本已生成，请人工复核。", "success");
        return { ok: true };
      } catch (error) {
        setStatus(error?.message || String(error), "error");
        return { ok: false };
      } finally {
        recommendButtonNode.disabled = false;
      }
    }

    function ensureMounted() {
      if (root && document.documentElement.contains(root)) {
        const existingMountContext = findMountContext();
        applyMountContext(root, existingMountContext);
        return root;
      }
      ensureStyle();
      const mountContext = findMountContext();
      const mountTarget = mountContext?.container;
      if (!(mountTarget instanceof HTMLElement)) {
        return null;
      }
      root = document.createElement("div");
      root.setAttribute(ROOT_ATTR, "true");

      const head = document.createElement("div");
      head.className = "asc-aishell-head";
      const titleWrap = document.createElement("div");
      const title = document.createElement("div");
      title.className = "asc-aishell-title";
      title.textContent = "闽南语助手推荐文本";
      const subtitle = document.createElement("div");
      subtitle.textContent = "当前页只处理当前分包，从当前选中条开始，跳过已完成条目。";
      titleWrap.appendChild(title);
      titleWrap.appendChild(subtitle);
      head.appendChild(titleWrap);
      root.appendChild(head);

      const actions = document.createElement("div");
      actions.className = "asc-aishell-actions";
      recommendButtonNode = createButton("AI 推荐当前条", { "data-primary": "true" });
      recommendButtonNode.addEventListener("click", function () {
        void requestAiRecommend();
      });
      batchStartButtonNode = createButton("批量开始");
      batchStartButtonNode.addEventListener("click", function () {
        if (typeof deps.onBatchStart === "function") {
          void deps.onBatchStart();
        }
      });
      batchStopButtonNode = createButton("批量停止", { "data-danger": "true" });
      batchStopButtonNode.disabled = true;
      batchStopButtonNode.addEventListener("click", function () {
        if (typeof deps.onBatchStop === "function") {
          void deps.onBatchStop();
        }
      });
      actions.appendChild(recommendButtonNode);
      actions.appendChild(batchStartButtonNode);
      actions.appendChild(batchStopButtonNode);
      root.appendChild(actions);

      statusNode = document.createElement("div");
      statusNode.className = "asc-aishell-status";
      statusNode.textContent = "请选择当前条后手动触发。";
      root.appendChild(statusNode);

      applyMountContext(root, mountContext);
      return root;
    }

    function updateCurrentItemKey(itemKey) {
      const nextKey = String(itemKey || "");
      if (nextKey && currentItemKey && nextKey !== currentItemKey) {
        clearResult();
        setStatus("当前条已变化，请重新点击 AI 推荐当前条。", "info");
      }
      currentItemKey = nextKey;
    }

    function copyHeardText() {
      return copyText(removeTextSpaces(currentResult?.heardText || ""));
    }

    function copyRecommendedText() {
      return copyText(removeTextSpaces(currentResult?.recommendedText || ""));
    }

    function fillRecommendedText() {
      if (typeof deps.fillPageText !== "function") {
        return {
          ok: false,
          message: "填入能力未就绪。",
        };
      }
      return deps.fillPageText(
        ensureChineseSentencePunctuation(removeTextSpaces(currentResult?.recommendedText || ""))
      );
    }

    function ignoreAiResult() {
      clearResult();
      setStatus("已忽略当前推荐结果。", "info");
    }

    function remove() {
      clearResult();
      if (root) {
        root.remove();
      }
      root = null;
      resultNode = null;
      statusNode = null;
      recommendButtonNode = null;
      batchStartButtonNode = null;
      batchStopButtonNode = null;
      currentResult = null;
      currentItemKey = "";
      if (batchFloatingNode) {
        batchFloatingNode.remove();
      }
      batchFloatingNode = null;
      batchFloatingGrid = null;
      batchFloatingCurrentNode = null;
      batchFloatingFailuresNode = null;
    }

    return {
      copyHeardText,
      copyRecommendedText,
      ensureMounted,
      fillRecommendedText,
      ignoreAiResult,
      remove,
      renderResult,
      requestAiRecommend,
      setBatchButtons,
      setStatus,
      updateBatch,
      updateCurrentItemKey,
    };
  }

  globalThis.__ASREdgeAishellTechMinnanUiPanel = {
    createRuntime,
    ensureChineseSentencePunctuation,
    removeTextSpaces,
  };
})();
