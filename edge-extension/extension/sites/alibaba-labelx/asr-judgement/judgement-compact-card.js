(function () {
  const ROOT_ATTR = "data-asr-edge-judgement-compact-card";
  const ITEM_ATTR = "data-asr-edge-judgement-compact-item";
  const STYLE_ID = "asr-edge-judgement-compact-card-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".labelRender-item[" + ITEM_ATTR + "] {",
      "  flex-wrap: wrap !important;",
      "  align-items: stretch;",
      "}",
      ".labelRender-scrollable > [" + ROOT_ATTR + "] {",
      "  display: block !important;",
      "  flex: 0 0 auto;",
      "  align-self: stretch;",
      "  max-width: none;",
      "  grid-column: 1 / -1;",
      "  position: relative;",
      "  z-index: 1;",
      "}",
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
      "  align-items: flex-start;",
      "  justify-content: space-between;",
      "  gap: 8px;",
      "  margin-bottom: 4px;",
      "  min-width: 0;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-title {",
      "  min-width: 0;",
      "  color: #075985;",
      "  font-weight: 700;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-meta {",
      "  display: flex;",
      "  flex-direction: column;",
      "  align-items: stretch;",
      "  gap: 3px;",
      "  min-width: 118px;",
      "  max-width: 46%;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-choice {",
      "  min-width: 0;",
      "  padding: 1px 6px;",
      "  border-radius: 4px;",
      "  background: #e0f2fe;",
      "  color: #075985;",
      "  font-weight: 700;",
      "  text-align: right;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-choice[data-empty='true'] {",
      "  background: #f1f5f9;",
      "  color: #64748b;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-audio-time {",
      "  min-width: 0;",
      "  padding: 1px 6px;",
      "  border-radius: 4px;",
      "  background: #eef2ff;",
      "  color: #4338ca;",
      "  font-weight: 700;",
      "  text-align: right;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
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
      "[" + ROOT_ATTR + "] .asr-edge-compact-row[data-diff='true'] .asr-edge-compact-text {",
      "  font-family: Consolas, 'Microsoft YaHei UI', 'Microsoft YaHei', monospace;",
      "  line-height: 1.7;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-diff-summary {",
      "  display: inline-flex;",
      "  align-items: center;",
      "  width: fit-content;",
      "  max-width: 100%;",
      "  margin: 0 0 4px 0;",
      "  padding: 1px 6px;",
      "  border-radius: 4px;",
      "  background: #e0f2fe;",
      "  color: #075985;",
      "  font-weight: 700;",
      "  white-space: nowrap;",
      "  overflow: hidden;",
      "  text-overflow: ellipsis;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-diff-equal {",
      "  color: #0f172a;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-diff-change {",
      "  background: #fef3c7;",
      "  color: #92400e;",
      "  border-radius: 3px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-diff-gap {",
      "  background: #fee2e2;",
      "  color: transparent;",
      "  border-radius: 3px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-compact-diff-punctuation {",
      "  background: #ede9fe;",
      "  color: #5b21b6;",
      "  border-radius: 3px;",
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

  function parseDiffSignature(signature) {
    const text = String(signature || "").replace(/\r\n/g, "\n");
    const parts = text.split("\n---\n");
    if (parts.length < 2) {
      return null;
    }

    return {
      first: parts[0].trim(),
      second: parts.slice(1).join("\n---\n").trim(),
    };
  }

  function buildFastAlignment(first, second) {
    const firstChars = Array.from(first || "");
    const secondChars = Array.from(second || "");
    const maxLength = Math.max(firstChars.length, secondChars.length);
    const result = [];
    for (let index = 0; index < maxLength; index += 1) {
      result.push({
        left: firstChars[index] || "",
        right: secondChars[index] || "",
        type: firstChars[index] === secondChars[index] ? "equal" : "change",
      });
    }
    return result;
  }

  function getDiffModule() {
    return globalThis.__ASREdgeAlibabaLabelxJudgementAsrDiffView || null;
  }

  function buildAlignment(first, second) {
    const diffModule = getDiffModule();
    if (diffModule && typeof diffModule.buildAlignment === "function") {
      return diffModule.buildAlignment(first || "", second || "");
    }

    return buildFastAlignment(first, second);
  }

  function isPunctuation(char) {
    const diffModule = getDiffModule();
    if (diffModule && typeof diffModule.isPunctuation === "function") {
      return diffModule.isPunctuation(char);
    }

    return /^[\s\p{P}\p{S}]$/u.test(char || "");
  }

  function summarizeDiff(first, second, alignment) {
    const diffModule = getDiffModule();
    if (diffModule && typeof diffModule.summarize === "function") {
      return diffModule.summarize(first || "", second || "", alignment || []);
    }

    return first === second ? "完全相同" : "存在差异";
  }

  function formatSeconds(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 0) {
      return "--:--";
    }

    const totalSeconds = Math.floor(value);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secondPart = String(totalSeconds % 60).padStart(2, "0");
    if (hours > 0) {
      return String(hours) + ":" + String(minutes).padStart(2, "0") + ":" + secondPart;
    }

    return String(minutes) + ":" + secondPart;
  }

  function getAudioTimeText(item) {
    const audio = item?.querySelector?.(".dt-audio-base-container audio[controls], audio[controls]");
    if (!audio) {
      return "--:-- / --:--";
    }

    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : NaN;
    const currentTime = Number.isFinite(audio.currentTime) && audio.currentTime >= 0 ? audio.currentTime : 0;
    return formatSeconds(currentTime) + " / " + formatSeconds(duration);
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
    const rawPair = parseAsrText(container?.textContent || "");
    if (rawPair) {
      return rawPair;
    }

    const diffView = wrap?.querySelector("[data-asr-edge-judgement-diff-view]");
    return parseDiffSignature(diffView?.getAttribute("data-asr-edge-signature") || "");
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

  function appendDiffChar(parent, char, type) {
    const span = document.createElement("span");
    span.textContent = char || "\u00a0";
    if (type === "equal") {
      span.className = "asr-edge-compact-diff-equal";
    } else if (!char) {
      span.className = "asr-edge-compact-diff-gap";
      span.title = "此处为空，用于对齐另一条 ASR 文本。";
    } else if (isPunctuation(char)) {
      span.className = "asr-edge-compact-diff-punctuation";
    } else {
      span.className = "asr-edge-compact-diff-change";
    }
    parent.appendChild(span);
  }

  function appendDiffRow(parent, label, side, alignment) {
    const row = document.createElement("div");
    row.className = "asr-edge-compact-row";
    row.setAttribute("data-diff", "true");
    appendText(row, "asr-edge-compact-label", label);
    const textNode = appendText(row, "asr-edge-compact-text", "");
    alignment.forEach(function (part) {
      appendDiffChar(textNode, side === "left" ? part.left : part.right, part.type);
    });
    textNode.title = textNode.textContent || "";
    parent.appendChild(row);
  }

  function renderCompactCard(data) {
    const root = document.createElement("div");
    root.setAttribute(ROOT_ATTR, "true");

    const head = document.createElement("div");
    head.className = "asr-edge-compact-head";
    appendText(head, "asr-edge-compact-title", "两个ASR文本 · " + data.questionText);
    const meta = document.createElement("div");
    meta.className = "asr-edge-compact-meta";
    appendText(
      meta,
      "asr-edge-compact-choice",
      "哪个ASR更优：" + (data.choiceText || "未选择"),
      {
        "data-empty": data.choiceText ? "false" : "true",
      }
    );
    appendText(meta, "asr-edge-compact-audio-time", data.audioTimeText || "--:-- / --:--");
    head.appendChild(meta);
    root.appendChild(head);

    if (data.renderDiff === true) {
      const alignment = buildAlignment(data.first, data.second);
      appendText(root, "asr-edge-compact-diff-summary", summarizeDiff(data.first, data.second, alignment));
      appendDiffRow(root, "asr_text1", "left", alignment);
      appendDiffRow(root, "asr_text2", "right", alignment);
    } else {
      appendRow(root, "asr_text1", data.first);
      appendRow(root, "asr_text2", data.second);
    }
    return root;
  }

  function getSignature(data) {
    return [
      data.questionText,
      data.choiceText || "",
      data.audioTimeText || "",
      data.renderDiff === true ? "diff" : "plain",
      data.first || "",
      data.second || "",
    ].join("\n---\n");
  }

  function getItemKey(item) {
    const id = String(item?.getAttribute?.("data-id") || "").trim();
    if (id) {
      return "id:" + id;
    }

    const index = String(item?.getAttribute?.("data-index") || "").trim();
    return index ? "index:" + index : "";
  }

  function getCompactHost(item) {
    return item?.closest?.(".labelRender-scrollable") || item?.parentElement || null;
  }

  function getHostCompactCards(host) {
    return Array.from(host?.children || []).filter(function (child) {
      return child instanceof HTMLElement && child.hasAttribute(ROOT_ATTR);
    });
  }

  function findCompactCard(host, key) {
    return (
      getHostCompactCards(host).find(function (child) {
        return child.getAttribute("data-asr-edge-source-key") === key;
      }) || null
    );
  }

  function removeOrphanCompactCards(host, activeKeys) {
    getHostCompactCards(host).forEach(function (child) {
      const key = child.getAttribute("data-asr-edge-source-key") || "";
      if (!activeKeys.has(key)) {
        child.remove();
      }
    });
  }

  function upsertCompactCard(item, renderDiff) {
    const host = getCompactHost(item);
    const key = getItemKey(item);
    if (!host || !key) {
      return false;
    }

    const pair = getAsrPair(item);
    if (!pair) {
      removeCompactCard(item);
      return false;
    }

    const data = {
      questionText: getQuestionText(item),
      choiceText: getChoiceText(item),
      audioTimeText: getAudioTimeText(item),
      renderDiff: renderDiff === true,
      first: pair.first,
      second: pair.second,
    };
    const signature = getSignature(data);
    const existing = findCompactCard(host, key);
    if (
      existing &&
      existing.getAttribute("data-asr-edge-signature") === signature &&
      existing.nextElementSibling === item
    ) {
      return false;
    }

    const nextNode = renderCompactCard(data);
    nextNode.setAttribute("data-asr-edge-source-key", key);
    nextNode.setAttribute("data-asr-edge-source-index", String(item.getAttribute("data-index") || ""));
    nextNode.setAttribute("data-asr-edge-source-id", String(item.getAttribute("data-id") || ""));
    nextNode.setAttribute("data-asr-edge-signature", signature);
    item.setAttribute(ITEM_ATTR, "true");
    if (existing) {
      existing.replaceWith(nextNode);
    }
    host.insertBefore(nextNode, item);
    return true;
  }

  function removeCompactCard(item) {
    const host = getCompactHost(item);
    const key = getItemKey(item);
    const existing = host && key ? findCompactCard(host, key) : null;
    item.removeAttribute(ITEM_ATTR);
    if (existing) {
      existing.remove();
      return true;
    }

    return false;
  }

  function createRuntime(deps) {
    const options = deps && typeof deps === "object" ? deps : {};
    const audioEvents = ["timeupdate", "loadedmetadata", "durationchange", "seeked", "play", "pause", "ended"];
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
      const hostActiveKeys = new Map();
      const renderDiff = options.shouldRenderDiff ? options.shouldRenderDiff() === true : false;
      const items = Array.from(document.querySelectorAll(".labelRender-item[data-index]"));
      items.forEach(function (item) {
        try {
          const host = getCompactHost(item);
          const key = getItemKey(item);
          if (host && key) {
            if (!hostActiveKeys.has(host)) {
              hostActiveKeys.set(host, new Set());
            }
            hostActiveKeys.get(host).add(key);
          }
          visibleCount += 1;
          if (upsertCompactCard(item, renderDiff)) {
            updatedCount += 1;
          }
        } catch (error) {
          removeCompactCard(item);
        }
      });
      hostActiveKeys.forEach(function (activeKeys, host) {
        removeOrphanCompactCards(host, activeKeys);
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
        return;
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
        attributeFilter: ["class", "style", "checked", "data-index", "data-asr-edge-signature"],
        characterData: true,
      });
      document.addEventListener("change", scheduleScan, true);
      audioEvents.forEach(function (eventName) {
        document.addEventListener(eventName, scheduleScan, true);
      });
      scan();
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
      audioEvents.forEach(function (eventName) {
        document.removeEventListener(eventName, scheduleScan, true);
      });
      document.querySelectorAll("[" + ROOT_ATTR + "]").forEach(function (node) {
        node.remove();
      });
      document.querySelectorAll("[" + ITEM_ATTR + "]").forEach(function (node) {
        node.removeAttribute(ITEM_ATTR);
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
    parseDiffSignature: parseDiffSignature,
  };
})();
