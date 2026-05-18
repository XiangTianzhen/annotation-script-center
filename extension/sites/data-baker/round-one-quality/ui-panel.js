(function () {
  const ROOT_ATTR = "data-asr-edge-databaker-ai-panel";
  const STYLE_ID = "asr-edge-databaker-ai-panel-style";

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function ensureChineseSentencePunctuation(text) {
    const value = String(text || "").trim();
    if (!value) {
      return "";
    }
    const last = value[value.length - 1];
    if ("。！？；…".indexOf(last) >= 0) {
      return value;
    }
    if (last === ".") {
      return value.slice(0, -1) + "。";
    }
    if (last === "?") {
      return value.slice(0, -1) + "？";
    }
    if (last === "!") {
      return value.slice(0, -1) + "！";
    }
    if (last === ";") {
      return value.slice(0, -1) + "；";
    }
    return value + "。";
  }

  function removeTextSpaces(text) {
    return String(text || "").replace(/[\s\u3000]+/g, "");
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
      "  margin: 12px 20px;",
      "  padding: 10px 12px;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 6px;",
      "  background: #f8fbff;",
      "  color: #1f2937;",
      "  font-size: 12px;",
      "  line-height: 1.55;",
      "}",
      "[" + ROOT_ATTR + "] * { box-sizing: border-box; }",
      "[" + ROOT_ATTR + "] .asr-edge-db-head {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  gap: 8px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-title {",
      "  color: #1d4ed8;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-actions,",
      "[" + ROOT_ATTR + "] .asr-edge-db-result-actions {",
      "  display: flex;",
      "  align-items: center;",
      "  flex-wrap: wrap;",
      "  gap: 8px;",
      "}",
      "[" + ROOT_ATTR + "] button {",
      "  min-height: 26px;",
      "  padding: 0 10px;",
      "  border: 1px solid #cbd5e1;",
      "  border-radius: 6px;",
      "  background: #ffffff;",
      "  color: #1f2937;",
      "  cursor: pointer;",
      "  font-size: 12px;",
      "}",
      "[" + ROOT_ATTR + "] button[data-primary='true'] {",
      "  border-color: #1d4ed8;",
      "  background: #1d4ed8;",
      "  color: #ffffff;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] button:disabled {",
      "  cursor: not-allowed;",
      "  opacity: 0.6;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-status {",
      "  margin-top: 8px;",
      "  color: #64748b;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-status[data-tone='error'] { color: #b91c1c; }",
      "[" + ROOT_ATTR + "] .asr-edge-db-status[data-tone='success'] { color: #047857; }",
      "[" + ROOT_ATTR + "] .asr-edge-db-result {",
      "  margin-top: 10px;",
      "  border-top: 1px solid #dbeafe;",
      "  padding-top: 8px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-grid {",
      "  display: grid;",
      "  grid-template-columns: 112px minmax(0, 1fr);",
      "  gap: 5px 8px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-label {",
      "  color: #475569;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-value {",
      "  min-width: 0;",
      "  white-space: pre-wrap;",
      "  overflow-wrap: anywhere;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-review {",
      "  margin: 8px 0;",
      "  color: #b45309;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-lexicon-list {",
      "  margin: 6px 0 8px 120px;",
      "  color: #0f766e;",
      "  overflow-wrap: anywhere;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-foot {",
      "  margin-top: 8px;",
      "  color: #64748b;",
      "}",
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
    let autoFillQualifiedButtonNode = null;
    let currentResult = null;
    let currentItemKey = "";

    function findMountTarget() {
      return (
        document.querySelector(".waver-page .text-box") ||
        document.querySelector(".waver-page") ||
        document.querySelector(".right")
      );
    }

    function setStatus(message, tone) {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = String(message || "");
      statusNode.setAttribute("data-tone", String(tone || "info"));
    }

    function clearResult() {
      currentResult = null;
      if (resultNode) {
        resultNode.remove();
        resultNode = null;
      }
    }

    function createRow(grid, label, value) {
      const labelNode = document.createElement("div");
      labelNode.className = "asr-edge-db-label";
      labelNode.textContent = label;
      const valueNode = document.createElement("div");
      valueNode.className = "asr-edge-db-value";
      valueNode.textContent = String(value === undefined || value === null || value === "" ? "-" : value);
      grid.appendChild(labelNode);
      grid.appendChild(valueNode);
    }

    function formatDurationSeconds(value) {
      const ms = Number(value);
      if (!Number.isFinite(ms) || ms < 0) {
        return "-";
      }
      return (ms / 1000).toFixed(1) + " 秒";
    }

    async function copyText(text) {
      const value = String(text || "");
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    function renderResult(result) {
      clearResult();
      const data = Object.assign({}, result || {});
      data.heardText = removeTextSpaces(data.heardText || "");
      data.recommendedText = ensureChineseSentencePunctuation(
        removeTextSpaces(data.recommendedText || "")
      );
      currentResult = data || null;
      const model = data.model || {};
      const lexicon = data.lexicon && typeof data.lexicon === "object" ? data.lexicon : {};
      const timing = data.timing && typeof data.timing === "object" ? data.timing : null;
      const rewriteChanges = Array.isArray(lexicon.rewriteChanges) ? lexicon.rewriteChanges : [];
      const resultWrap = document.createElement("div");
      resultWrap.className = "asr-edge-db-result";

      const grid = document.createElement("div");
      grid.className = "asr-edge-db-grid";
      createRow(grid, "页面候选文本", data.pageText || "");
      createRow(grid, "AI 听音文本", data.heardText || "");
      createRow(grid, "AI 推荐文本", data.recommendedText || "");
      createRow(grid, "相对页面变更", data.isChanged ? "是" : "否");
      createRow(
        grid,
        "置信度",
        "听音 " +
          (Number(data.listenConfidence || 0) * 100).toFixed(1) +
          "% / 对比 " +
          (Number(data.compareConfidence || 0) * 100).toFixed(1) +
          "%"
      );
      createRow(
        grid,
        "模型",
        String(model.listen || "qwen3.5-omni-flash") +
          " + " +
          String(model.compare || "qwen3.5-plus")
      );
      if (data.pipelineMode === "listen_only" || model.compare === "skipped") {
        createRow(grid, "模式", "极速听音模式");
      }
      if (timing) {
        createRow(
          grid,
          "耗时",
          "听音 " +
            formatDurationSeconds(timing.listenDurationMs) +
            " / 对比 " +
            formatDurationSeconds(timing.compareDurationMs) +
            " / 总计 " +
            formatDurationSeconds(timing.totalDurationMs)
        );
      }
      createRow(grid, "决策", data.decision || "");
      if (lexicon.rewriteChanged === true) {
        createRow(grid, "词表替换", "已替换 " + String(rewriteChanges.length || 0) + " 处");
      }
      createRow(grid, "requestId", data.requestId || "");
      resultWrap.appendChild(grid);

      if (lexicon.rewriteChanged === true && rewriteChanges.length > 0) {
        const lexiconList = document.createElement("div");
        lexiconList.className = "asr-edge-db-lexicon-list";
        lexiconList.textContent = rewriteChanges
          .slice(0, 8)
          .map(function (change) {
            return String(change.from || "") + " → " + String(change.to || "");
          })
          .filter(function (text) {
            return text.trim() !== "→";
          })
          .join("；");
        resultWrap.appendChild(lexiconList);
      }

      const review = document.createElement("div");
      review.className = "asr-edge-db-review";
      review.textContent = data.needHumanReview
        ? "复核提示：请人工复听确认后再复制或填入。"
        : "复核提示：仍需人工确认，不会自动保存或提交。";
      resultWrap.appendChild(review);

      const actions = document.createElement("div");
      actions.className = "asr-edge-db-result-actions";
      const copyButton = createButton("复制推荐文本", { "data-primary": "true" });
      const fillButton = createButton("填入推荐文本");
      const ignoreButton = createButton("忽略");
      fillButton.disabled = typeof deps.canFillPageText === "function" && !deps.canFillPageText();

      copyButton.addEventListener("click", function () {
        copyText(removeTextSpaces(data.recommendedText || ""))
          .then(function () {
            setStatus("推荐文本已复制。", "success");
          })
          .catch(function (error) {
            setStatus("复制失败：" + (error?.message || String(error)), "error");
          });
      });
      fillButton.addEventListener("click", function () {
        if (typeof deps.fillPageText !== "function") {
          setStatus("无法安全定位可编辑文本框，已保留复制入口。", "error");
          return;
        }
        const fillResult = deps.fillPageText(removeTextSpaces(data.recommendedText || ""));
        setStatus(fillResult?.message || "已填入推荐文本。", fillResult?.ok === false ? "error" : "success");
      });
      ignoreButton.addEventListener("click", function () {
        clearResult();
        setStatus("已忽略本次推荐。", "info");
      });

      actions.appendChild(copyButton);
      actions.appendChild(fillButton);
      actions.appendChild(ignoreButton);
      resultWrap.appendChild(actions);

      const foot = document.createElement("div");
      foot.className = "asr-edge-db-foot";
      foot.textContent =
        "当前仅自动处理当前页质检合格单条；不会自动保存、提交、批量识别或流转。";
      resultWrap.appendChild(foot);

      root.appendChild(resultWrap);
      resultNode = resultWrap;
    }

    async function handleRecommendClick(button) {
      if (typeof deps.onRecommend !== "function") {
        setStatus("AI 推荐运行时未就绪。", "error");
        return;
      }

      const triggerButton = button || recommendButtonNode;
      if (triggerButton) {
        triggerButton.disabled = true;
      }
      setStatus("正在生成 AI 推荐文本...", "info");
      clearResult();
      try {
        const payload = await deps.onRecommend();
        renderResult(payload);
        setStatus("AI 推荐文本已生成，请人工复核。", "success");
      } catch (error) {
        setStatus(error?.message || String(error), "error");
      } finally {
        if (triggerButton) {
          triggerButton.disabled = false;
        }
      }
    }

    async function handleAutoFillQualifiedClick(button) {
      if (typeof deps.onAutoFillQualifiedItem !== "function") {
        setStatus("AI填入合格项运行时未就绪。", "error");
        return;
      }
      const triggerButton = button || autoFillQualifiedButtonNode;
      if (triggerButton) {
        triggerButton.disabled = true;
      }
      try {
        await deps.onAutoFillQualifiedItem();
      } catch (error) {
        setStatus(error?.message || String(error), "error");
      } finally {
        if (triggerButton) {
          triggerButton.disabled = false;
        }
      }
    }

    async function requestAiRecommend() {
      if (!ensureMounted()) {
        return { ok: false, message: "AI 推荐工具卡未就绪。" };
      }
      await handleRecommendClick(recommendButtonNode);
      return { ok: true };
    }

    async function copyHeardText() {
      const text = removeTextSpaces(currentResult?.heardText || "");
      if (!text) {
        setStatus("暂无 AI 听音文本。", "error");
        return { ok: false };
      }
      await copyText(text);
      setStatus("AI 听音文本已复制。", "success");
      return { ok: true };
    }

    async function copyRecommendedText() {
      const text = removeTextSpaces(currentResult?.recommendedText || "");
      if (!text) {
        setStatus("暂无 AI 推荐文本。", "error");
        return { ok: false };
      }
      await copyText(text);
      setStatus("AI 推荐文本已复制。", "success");
      return { ok: true };
    }

    function fillRecommendedText() {
      const text = removeTextSpaces(currentResult?.recommendedText || "");
      if (!text) {
        setStatus("暂无 AI 推荐文本。", "error");
        return { ok: false };
      }
      if (typeof deps.fillPageText !== "function") {
        setStatus("无法安全定位可编辑文本框，已保留复制入口。", "error");
        return { ok: false };
      }
      const fillResult = deps.fillPageText(text);
      setStatus(fillResult?.message || "已填入推荐文本。", fillResult?.ok === false ? "error" : "success");
      return fillResult || { ok: true };
    }

    function ignoreAiResult() {
      if (!currentResult) {
        setStatus("暂无 AI 推荐结果。", "error");
        return { ok: false };
      }
      clearResult();
      setStatus("已忽略本次推荐。", "info");
      return { ok: true };
    }

    function ensureMounted() {
      if (root && document.documentElement.contains(root)) {
        return root;
      }

      ensureStyle();
      const mountTarget = findMountTarget();
      if (!mountTarget) {
        return null;
      }

      root = document.createElement("div");
      root.setAttribute(ROOT_ATTR, "true");

      const head = document.createElement("div");
      head.className = "asr-edge-db-head";
      const title = document.createElement("div");
      title.className = "asr-edge-db-title";
      title.textContent = "DataBaker AI 推荐文本";
      const actions = document.createElement("div");
      actions.className = "asr-edge-db-actions";
      const recommendButton = createButton("AI 推荐文本", { "data-primary": "true" });
      const autoFillQualifiedButton = createButton("AI填入合格项");
      autoFillQualifiedButton.title =
        "刷新当前页列表，只处理质检合格数据，AI 推荐并填入，不自动保存提交。";
      recommendButtonNode = recommendButton;
      autoFillQualifiedButtonNode = autoFillQualifiedButton;
      recommendButton.addEventListener("click", function () {
        handleRecommendClick(recommendButton);
      });
      autoFillQualifiedButton.addEventListener("click", function () {
        handleAutoFillQualifiedClick(autoFillQualifiedButton);
      });
      actions.appendChild(recommendButton);
      actions.appendChild(autoFillQualifiedButton);
      head.appendChild(title);
      head.appendChild(actions);
      root.appendChild(head);

      statusNode = document.createElement("div");
      statusNode.className = "asr-edge-db-status";
      statusNode.textContent = "请选择左侧当前句子后手动触发。";
      root.appendChild(statusNode);

      if (mountTarget.classList.contains("text-box")) {
        mountTarget.insertAdjacentElement("afterend", root);
      } else {
        mountTarget.insertBefore(root, mountTarget.firstElementChild || null);
      }
      return root;
    }

    function updateCurrentItemKey(itemKey) {
      const key = String(itemKey || "");
      if (key && currentItemKey && key !== currentItemKey) {
        clearResult();
        setStatus("当前题已变化，请重新点击 AI 推荐文本。", "info");
      }
      currentItemKey = key;
    }

    function getCurrentResult() {
      return currentResult;
    }

    function remove() {
      if (root) {
        root.remove();
      }
      root = null;
      resultNode = null;
      statusNode = null;
      recommendButtonNode = null;
      autoFillQualifiedButtonNode = null;
      currentResult = null;
      currentItemKey = "";
    }

    return {
      clearResult,
      copyHeardText,
      copyRecommendedText,
      ensureMounted,
      fillRecommendedText,
      getCurrentResult,
      ignoreAiResult,
      remove,
      renderResult,
      requestAiRecommend,
      setStatus,
      updateCurrentItemKey,
    };
  }

  globalThis.__ASREdgeDataBakerRoundOneUiPanel = {
    createRuntime,
    ensureChineseSentencePunctuation,
    removeTextSpaces,
    normalizeText,
  };
})();
