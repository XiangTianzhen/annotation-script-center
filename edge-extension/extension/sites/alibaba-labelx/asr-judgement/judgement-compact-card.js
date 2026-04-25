(function () {
  const ROOT_ATTR = "data-asr-edge-judgement-compact-card";
  const STYLE_ID = "asr-edge-judgement-compact-card-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  box-sizing: border-box;",
      "  width: 100%;",
      "  margin: 4px 6px;",
      "  padding: 6px 8px;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 4px;",
      "  background: #f8fbff;",
      "  color: #0f172a;",
      "  font-size: 12px;",
      "  line-height: 1.5;",
      "  overflow: hidden;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-head {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  gap: 8px;",
      "  margin-bottom: 4px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-title {",
      "  color: #075985;",
      "  font-weight: 700;",
      "  white-space: nowrap;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-choice {",
      "  min-width: 0;",
      "  padding: 1px 6px;",
      "  border-radius: 4px;",
      "  background: #e0f2fe;",
      "  color: #075985;",
      "  font-weight: 700;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-choice[data-empty='true'] {",
      "  background: #f1f5f9;",
      "  color: #64748b;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-row {",
      "  display: grid;",
      "  grid-template-columns: 62px minmax(0, 1fr);",
      "  gap: 6px;",
      "  align-items: start;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-label {",
      "  color: #475569;",
      "  font-weight: 700;",
      "  white-space: nowrap;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-text {",
      "  min-width: 0;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "  white-space: nowrap;",
      "  word-break: keep-all;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function getText(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function parseAsrText(rawText) {
    const text = String(rawText || "").replace(/\r\n/g, "\n");
    const match = text.match(/asr_text1\s*:\s*([\s\S]*?)\s*asr_text2\s*:\s*([\s\S]*)$/);
    if (!match) {
      return null;
    }

    return {
      first: match[1].trim(),
      second: match[2].trim(),
    };
  }

  function findWrapByTitle(item, wrapSelector, titleSelector, targetTitle) {
    const wraps = Array.from(item.querySelectorAll(wrapSelector));
    return (
      wraps.find(function (wrap) {
        const title = wrap.querySelector(titleSelector);
        const text = getText(title);
        return text === targetTitle || text.indexOf(targetTitle) >= 0;
      }) || null
    );
  }

  function getAsrPair(item) {
    const wrap = findWrapByTitle(
      item,
      ".labelRender-item-content-wrap",
      ".labelRender-item-content-title",
      "两个ASR文本"
    );
    const container = wrap?.querySelector(".dt-text-container");
    return parseAsrText(container?.textContent || "");
  }

  function getChoiceText(item) {
    const wrap = findWrapByTitle(
      item,
      ".labelRender-item-answer-wrap",
      ".labelRender-item-answer-title",
      "哪个ASR更优"
    );
    const scope = wrap || item;
    const checkedInput =
      scope.querySelector(".ant-v5-radio-wrapper-checked input[type='radio']") ||
      scope.querySelector("input[type='radio']:checked");
    if (checkedInput) {
      const label = checkedInput.closest("label");
      const labelNode = label?.querySelector(".ant-v5-radio-label");
      return getText(labelNode) || String(checkedInput.value || "").trim();
    }

    return "";
  }

  function getQuestionText(item) {
    const status = item.querySelector(".labelRender-answerNav-status");
    const text = getText(status);
    if (text) {
      return text;
    }

    const index = Number(item.getAttribute("data-index"));
    return Number.isFinite(index) && index >= 0 ? "第 " + String(index + 1) + " 题" : "当前题";
  }

  function appendText(parent, className, text, attrs) {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    parent.appendChild(node);
    return node;
  }

  function appendRow(parent, label, text) {
    const row = document.createElement("div");
    row.className = "asr-edge-compact-row";
    appendText(row, "asr-edge-compact-label", label);
    const textNode = appendText(row, "asr-edge-compact-text", text || "");
    textNode.title = text || "";
    parent.appendChild(row);
  }

  function renderCompactCard(data) {
    const root = document.createElement("div");
    root.setAttribute(ROOT_ATTR, "true");

    const head = document.createElement("div");
    head.className = "asr-edge-compact-head";
    appendText(head, "asr-edge-compact-title", "两个ASR文本 · " + data.questionText);
    appendText(
      head,
      "asr-edge-compact-choice",
      "哪个ASR更优：" + (data.choiceText || "未选择"),
      {
        "data-empty": data.choiceText ? "false" : "true",
      }
    );
    root.appendChild(head);

    appendRow(root, "asr_text1", data.first);
    appendRow(root, "asr_text2", data.second);
    return root;
  }

  function getSignature(data) {
    return [data.questionText, data.choiceText || "", data.first || "", data.second || ""].join("\n---\n");
  }

  function upsertCompactCard(item) {
    const pair = getAsrPair(item);
    if (!pair) {
      removeCompactCard(item);
      return false;
    }

    const data = {
      questionText: getQuestionText(item),
      choiceText: getChoiceText(item),
      first: pair.first,
      second: pair.second,
    };
    const signature = getSignature(data);
    const existing = item.querySelector(":scope > [" + ROOT_ATTR + "]");
    if (existing && existing.getAttribute("data-asr-edge-signature") === signature) {
      return false;
    }

    const nextNode = renderCompactCard(data);
    nextNode.setAttribute("data-asr-edge-signature", signature);
    if (existing) {
      existing.replaceWith(nextNode);
    } else {
      item.appendChild(nextNode);
    }
    return true;
  }

  function removeCompactCard(item) {
    const existing = item.querySelector(":scope > [" + ROOT_ATTR + "]");
    if (existing) {
      existing.remove();
      return true;
    }

    return false;
  }

  function createRuntime(deps) {
    const options = deps && typeof deps === "object" ? deps : {};
    let observer = null;
    let timer = null;
    let started = false;
    let state = {
      visibleCount: 0,
      updatedCount: 0,
      removedCount: 0,
      lastUpdatedAt: null,
    };

    function scan() {
      timer = null;
      if (!started || (options.shouldApply && !options.shouldApply())) {
        return;
      }

      ensureStyle();
      let visibleCount = 0;
      let updatedCount = 0;
      Array.from(document.querySelectorAll(".labelRender-item[data-index]")).forEach(function (item) {
        visibleCount += 1;
        if (upsertCompactCard(item)) {
          updatedCount += 1;
        }
      });

      state = {
        visibleCount: visibleCount,
        updatedCount: updatedCount,
        removedCount: 0,
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    function scheduleScan() {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(scan, 120);
    }

    function start() {
      if (started) {
        scheduleScan();
        return;
      }

      started = true;
      observer = new MutationObserver(scheduleScan);
      observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "checked", "data-index"],
        characterData: true,
      });
      document.addEventListener("change", scheduleScan, true);
      scheduleScan();
    }

    function stop() {
      started = false;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      document.removeEventListener("change", scheduleScan, true);
      document.querySelectorAll("[" + ROOT_ATTR + "]").forEach(function (node) {
        node.remove();
      });
    }

    function getState() {
      return Object.assign({}, state, {
        started: started,
      });
    }

    return {
      start: start,
      stop: stop,
      getState: getState,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementCompactCard = {
    createRuntime: createRuntime,
    parseAsrText: parseAsrText,
  };
})();
