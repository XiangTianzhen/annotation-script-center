(function () {
  const ROOT_ATTR = "data-asr-edge-judgement-ai-suggestion";
  const STYLE_ID = "asr-edge-judgement-ai-suggestion-style";
  const AI_ACTION_KEY = "aiSuggestCurrentItem";
  const RULE_VERSION = "asr-judgement-ai-v1";
  const ANSWER_TO_CHOICE = {
    first_better: "choiceFirstBetter",
    second_better: "choiceSecondBetter",
    both_bad: "choiceBothBad",
    uncertain_or_similar: "choiceUnsure",
    other_dialect_or_language: "choiceOtherDialect",
  };
  const CONSTANTS = globalThis.ASREdgeConstants || {};
  const AI_SUGGEST_PATH =
    CONSTANTS.JUDGEMENT_AI_SUGGEST_PATH || "/api/alibaba-labelx/asr-judgement/ai/suggest";
  const CHOICE_LABELS = {
    choiceFirstBetter: "第一个更好",
    choiceSecondBetter: "第二个更好",
    choiceBothBad: "都不好",
    choiceUnsure: "不确定或差不多",
    choiceOtherDialect: "其他方言或语种",
  };
  const ASR_TITLE_ALLOW_LIST = [
    "两个asr文本",
    "online_rec",
    "online_recognition",
    "asr",
    "asr_text",
  ];
  const ASR_TITLE_IGNORE_LIST = ["上文", "音频地址", "wav_id", "音频", "音频文件"];

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  box-sizing: border-box;",
      "  margin: 6px 8px 10px;",
      "  padding: 8px 10px;",
      "  border: 1px solid #bfdbfe;",
      "  border-radius: 6px;",
      "  background: #f8fbff;",
      "  color: #0f172a;",
      "  font-size: 12px;",
      "  line-height: 1.5;",
      "}",
      "[" + ROOT_ATTR + "][data-tone='warn'] {",
      "  border-color: #f59e0b;",
      "  background: #fffbeb;",
      "}",
      "[" + ROOT_ATTR + "][data-tone='danger'] {",
      "  border-color: #ef4444;",
      "  background: #fef2f2;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-head {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  gap: 8px;",
      "  margin-bottom: 6px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-title {",
      "  font-weight: 700;",
      "  color: #1d4ed8;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-request {",
      "  color: #475569;",
      "  font-family: Consolas, 'Microsoft YaHei', monospace;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-warning {",
      "  margin: 4px 0 6px;",
      "  color: #b45309;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "][data-tone='danger'] .asr-edge-ai-warning {",
      "  color: #b91c1c;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-grid {",
      "  display: grid;",
      "  grid-template-columns: 120px minmax(0, 1fr);",
      "  gap: 4px 8px;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-label {",
      "  color: #475569;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-value {",
      "  min-width: 0;",
      "  word-break: break-word;",
      "  overflow-wrap: anywhere;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-actions {",
      "  display: flex;",
      "  gap: 8px;",
      "  margin-top: 8px;",
      "}",
      "[" + ROOT_ATTR + "] button {",
      "  min-height: 26px;",
      "  padding: 0 10px;",
      "  border-radius: 6px;",
      "  border: 1px solid #cbd5e1;",
      "  cursor: pointer;",
      "  font-size: 12px;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] button[data-action='apply'] {",
      "  border-color: #1d4ed8;",
      "  background: #1d4ed8;",
      "  color: #ffffff;",
      "}",
      "[" + ROOT_ATTR + "] button:disabled {",
      "  cursor: not-allowed;",
      "  opacity: 0.6;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-ai-foot {",
      "  margin-top: 6px;",
      "  color: #64748b;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function normalizeUrlParam(value) {
    try {
      return decodeURIComponent(String(value || "")).trim();
    } catch (error) {
      return String(value || "").trim();
    }
  }

  function readUrlParams() {
    const params = new URLSearchParams(location.search || "");
    return {
      projectId: normalizeUrlParam(params.get("projectId") || params.get("appId") || ""),
      subTaskId: normalizeUrlParam(params.get("subTaskId") || ""),
    };
  }

  function getText(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
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

  function parseAsrText(rawText) {
    const text = String(rawText || "").replace(/\r\n/g, "\n");
    const match = text.match(/asr_text1\s*:\s*([\s\S]*?)\s*asr_text2\s*:\s*([\s\S]*)$/i);
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

  function resolveItemAsrPair(item) {
    function normalizeTitle(title) {
      return String(title || "").replace(/\s+/g, "").trim().toLowerCase();
    }
    function isIgnoredContentTitle(title) {
      const normalized = normalizeTitle(title);
      return ASR_TITLE_IGNORE_LIST.some(function (itemTitle) {
        return normalized === normalizeTitle(itemTitle);
      });
    }
    function isAllowedAsrTitle(title) {
      const normalized = normalizeTitle(title);
      return ASR_TITLE_ALLOW_LIST.some(function (itemTitle) {
        return normalized === normalizeTitle(itemTitle);
      });
    }
    function findAsrContentWrap() {
      const wraps = Array.from(item.querySelectorAll(".labelRender-item-content-wrap"));
      let fallbackWrap = null;
      for (const wrapItem of wraps) {
        const title = getText(wrapItem.querySelector(".labelRender-item-content-title"));
        if (isIgnoredContentTitle(title)) {
          continue;
        }
        const container = wrapItem.querySelector(".dt-text-wrapper .dt-text-container");
        const pair = parseAsrText(container?.textContent || "");
        if (!pair) {
          continue;
        }
        if (isAllowedAsrTitle(title)) {
          return wrapItem;
        }
        if (!fallbackWrap) {
          fallbackWrap = wrapItem;
        }
      }
      return fallbackWrap;
    }

    const wrap = findAsrContentWrap();
    const rawPair = parseAsrText(wrap?.querySelector(".dt-text-container")?.textContent || "");
    if (rawPair) {
      return rawPair;
    }

    const diffView = wrap?.querySelector("[data-asr-edge-judgement-diff-view]");
    return parseDiffSignature(diffView?.getAttribute("data-asr-edge-signature") || "");
  }

  function parseAnswerNavIndex(text) {
    const match = String(text || "").match(/第\s*(\d+)\s*题/);
    if (!match) {
      return null;
    }

    const index = Number(match[1]);
    return Number.isFinite(index) && index > 0 ? index - 1 : null;
  }

  function resolveCurrentItem() {
    const selectedItem = document.querySelector(".labelRender-item-selected.labelRender-item[data-index]");
    if (selectedItem) {
      return selectedItem;
    }

    const playingAudio = Array.from(document.querySelectorAll("audio[controls], audio")).find(function (audio) {
      return audio && !audio.paused && !audio.ended;
    });
    const playingItem = playingAudio?.closest ? playingAudio.closest(".labelRender-item[data-index]") : null;
    if (playingItem) {
      return playingItem;
    }

    const selectedStatus = document.querySelector(
      ".labelRender-item-selected .labelRender-answerNav-status"
    );
    const statusNode = selectedStatus || document.querySelector(".labelRender-answerNav-status");
    const index = parseAnswerNavIndex(statusNode?.textContent || "");
    if (index === null) {
      return null;
    }

    return document.querySelector('.labelRender-item[data-index="' + String(index) + '"]');
  }

  function resolveAudioUrl(item) {
    const audio = item.querySelector("audio[controls], audio");
    return String(audio?.currentSrc || audio?.src || "").trim();
  }

  function getClientVersion() {
    try {
      const manifest = chrome?.runtime?.getManifest ? chrome.runtime.getManifest() : null;
      return String(manifest?.version || "unknown");
    } catch (error) {
      return "unknown";
    }
  }

  function normalizeConfidence(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }
    return Math.max(0, Math.min(1, numericValue));
  }

  function getTone(result) {
    if (result.thunderConflict) {
      return "danger";
    }
    if (result.needManualSearch || result.shouldWarnBeforeApply || result.confidence < 0.65) {
      return "warn";
    }
    return "info";
  }

  function createDetailRow(label, value) {
    const labelNode = document.createElement("span");
    labelNode.className = "asr-edge-ai-label";
    labelNode.textContent = label;

    const valueNode = document.createElement("span");
    valueNode.className = "asr-edge-ai-value";
    valueNode.textContent = String(value || "-");

    return [labelNode, valueNode];
  }

  function removeCard(item) {
    item.querySelectorAll("[" + ROOT_ATTR + "]").forEach(function (node) {
      node.remove();
    });
  }

  function renderCard(item, result, options) {
    removeCard(item);
    ensureStyle();

    const root = document.createElement("div");
    root.setAttribute(ROOT_ATTR, "true");
    root.setAttribute("data-tone", getTone(result));

    const head = document.createElement("div");
    head.className = "asr-edge-ai-head";
    const title = document.createElement("span");
    title.className = "asr-edge-ai-title";
    title.textContent = "AI 参考建议";
    const request = document.createElement("span");
    request.className = "asr-edge-ai-request";
    request.textContent = "requestId: " + String(result.requestId || "-");
    head.appendChild(title);
    head.appendChild(request);
    root.appendChild(head);

    if (result.thunderMatched) {
      const warning = document.createElement("div");
      warning.className = "asr-edge-ai-warning";
      warning.textContent = result.thunderConflict
        ? "雷题优先：AI 建议与雷题标准答案冲突，已禁用采用建议。"
        : "雷题优先：该题命中雷题库，请优先参考雷题标准答案。";
      root.appendChild(warning);
    } else if (result.needManualSearch) {
      const warning = document.createElement("div");
      warning.className = "asr-edge-ai-warning";
      warning.textContent = "需要人工搜索确认专有名词/语义。";
      root.appendChild(warning);
    }

    const grid = document.createElement("div");
    grid.className = "asr-edge-ai-grid";
    [
      createDetailRow("建议答案", result.answerText),
      createDetailRow("置信度", (result.confidence * 100).toFixed(1) + "%"),
      createDetailRow("风险等级", result.riskLevel || "unknown"),
      createDetailRow("需要人工搜索", result.needManualSearch ? "是" : "否"),
      createDetailRow("模型", result.model || "-"),
      createDetailRow("简短理由", result.reasonSummary || "-"),
    ].forEach(function (nodes) {
      grid.appendChild(nodes[0]);
      grid.appendChild(nodes[1]);
    });
    root.appendChild(grid);

    const actionWrap = document.createElement("div");
    actionWrap.className = "asr-edge-ai-actions";
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.setAttribute("data-action", "apply");
    applyButton.textContent = "采用建议";
    const ignoreButton = document.createElement("button");
    ignoreButton.type = "button";
    ignoreButton.setAttribute("data-action", "ignore");
    ignoreButton.textContent = "忽略";

    const canApply = Boolean(result.choiceActionKey) && !result.thunderConflict;
    applyButton.disabled = !canApply;
    applyButton.addEventListener("click", function () {
      if (!canApply) {
        return;
      }

      const needConfirm =
        result.shouldWarnBeforeApply || result.confidence < 0.65 || result.needManualSearch;
      if (
        needConfirm &&
        window.confirm("当前建议存在风险，请人工复核后再采用。是否继续采用？") !== true
      ) {
        return;
      }

      Promise.resolve(options.applySuggestion(result.choiceActionKey))
        .then(function (applyResult) {
          if (applyResult?.ok === false) {
            throw new Error(applyResult.message || "采用建议失败。");
          }
          if (typeof options.showToast === "function") {
            options.showToast("AI 建议已采用。", "info");
          }
        })
        .catch(function (error) {
          if (typeof options.showToast === "function") {
            options.showToast(
              "采用建议失败：" + (error && error.message ? error.message : String(error)),
              "error"
            );
          }
        });
    });
    ignoreButton.addEventListener("click", function () {
      removeCard(item);
    });
    actionWrap.appendChild(applyButton);
    actionWrap.appendChild(ignoreButton);
    root.appendChild(actionWrap);

    const foot = document.createElement("div");
    foot.className = "asr-edge-ai-foot";
    foot.textContent =
      "仅供参考：不会自动保存、不会自动提交、不会自动领取、不会自动流转。";
    root.appendChild(foot);

    item.insertBefore(root, item.firstElementChild || null);
  }

  function createRuntime(deps) {
    const options = deps && typeof deps === "object" ? deps : {};

    function shouldApply() {
      return typeof options.shouldApply === "function" ? options.shouldApply() === true : true;
    }

    function getConfig() {
      return typeof options.getConfig === "function" ? options.getConfig() || {} : {};
    }

    function buildActionResult(ok, message, extra) {
      return Object.assign(
        {
          action: AI_ACTION_KEY,
          ok: ok === true,
          message: String(message || ""),
          at: new Date().toISOString(),
        },
        extra || {}
      );
    }

    function parseChoiceActionKey(data) {
      if (typeof data.choiceActionKey === "string" && data.choiceActionKey.trim()) {
        return data.choiceActionKey.trim();
      }
      return ANSWER_TO_CHOICE[String(data.answer || "").trim()] || "";
    }

    function resolveHostname(audioUrl) {
      try {
        return new URL(audioUrl).hostname || "";
      } catch (error) {
        return "";
      }
    }

    async function requestThunderInfo(item) {
      if (typeof options.getThunderInfo !== "function") {
        return null;
      }
      try {
        return (await options.getThunderInfo(item)) || null;
      } catch (error) {
        return null;
      }
    }

    function mapAnswerTextToChoice(answerText) {
      return (
        Object.keys(CHOICE_LABELS).find(function (choiceActionKey) {
          return CHOICE_LABELS[choiceActionKey] === String(answerText || "").trim();
        }) || ""
      );
    }

    async function suggestCurrentItem(source) {
      if (!shouldApply()) {
        return buildActionResult(false, "当前页面不支持 AI 建议。", {
          reason: "page-not-supported",
          source: source || "unknown",
        });
      }

      const config = getConfig();
      if (config.aiSuggestionEnabled !== true) {
        return buildActionResult(false, "AI 建议未启用，请先在 options 开启。", {
          reason: "ai-disabled",
          source: source || "unknown",
        });
      }

      const item = resolveCurrentItem();
      if (!(item instanceof HTMLElement)) {
        return buildActionResult(false, "未找到当前题卡，请先点击要分析的题卡。", {
          reason: "current-item-not-found",
          source: source || "unknown",
        });
      }

      const pair = resolveItemAsrPair(item);
      if (!pair || !pair.first || !pair.second) {
        return buildActionResult(false, "当前题卡缺少 asr_text1 / asr_text2。", {
          reason: "asr-text-missing",
          source: source || "unknown",
        });
      }

      const audioUrl = resolveAudioUrl(item);
      if (!audioUrl) {
        return buildActionResult(false, "当前题卡缺少音频地址，无法调用 AI。", {
          reason: "audio-url-missing",
          source: source || "unknown",
        });
      }

      let endpoint = "";
      try {
        const modeText = String(config.backendEndpointMode || "").trim().toLowerCase();
        const mode = modeText === "local" ? "local" : "server";
        endpoint =
          typeof CONSTANTS.buildBackendUrl === "function"
            ? CONSTANTS.buildBackendUrl(AI_SUGGEST_PATH, mode)
            : (mode === "local" ? "http://127.0.0.1:3333" : "https://script.xiangtianzhen.store") +
              AI_SUGGEST_PATH;
        endpoint = new URL(String(endpoint)).toString();
      } catch (error) {
        return buildActionResult(false, "AI 接口地址无效，请检查全局后端接口地址设置。", {
          reason: "invalid-endpoint",
          source: source || "unknown",
        });
      }

      const timeoutMs = Math.max(
        1000,
        Math.min(180000, Number(config.aiSuggestionRequestTimeoutMs) || 120000)
      );
      const params = readUrlParams();
      const requestBody = {
        projectId: params.projectId || "",
        subTaskId: params.subTaskId || "",
        itemIndex: Number(item.getAttribute("data-index")),
        itemId: String(item.getAttribute("data-id") || ""),
        audioUrl: audioUrl,
        asrText1: pair.first,
        asrText2: pair.second,
        ruleVersion: RULE_VERSION,
        clientVersion: getClientVersion(),
        model: String(config.aiSuggestionModel || "qwen3-omni-flash"),
      };

      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, timeoutMs)
        : null;

      let responseBody = null;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller ? controller.signal : undefined,
        });
        responseBody = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || responseBody?.success !== true || !responseBody?.data) {
          throw new Error(
            responseBody?.message ||
              "AI 服务请求失败（HTTP " + String(response.status) + "）。"
          );
        }
      } catch (error) {
        return buildActionResult(false, error && error.message ? error.message : "AI 服务请求失败。", {
          reason: "ai-request-failed",
          source: source || "unknown",
        });
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }

      const suggestion = responseBody.data || {};
      const choiceActionKey = parseChoiceActionKey(suggestion) || mapAnswerTextToChoice(suggestion.answerText);
      const confidence = normalizeConfidence(suggestion.confidence);
      const thunderInfo = await requestThunderInfo(item);
      const thunderStandardChoice = mapAnswerTextToChoice(thunderInfo?.standardAnswer || "");
      const thunderConflict = Boolean(
        thunderInfo?.isThunder &&
          thunderStandardChoice &&
          choiceActionKey &&
          thunderStandardChoice !== choiceActionKey
      );

      const cardData = {
        answerText: String(
          suggestion.answerText || CHOICE_LABELS[choiceActionKey] || suggestion.answer || "未知"
        ),
        choiceActionKey: choiceActionKey,
        confidence: confidence,
        reasonSummary: String(suggestion.reasonSummary || "").trim(),
        riskLevel: String(suggestion.riskLevel || "medium"),
        needManualSearch: suggestion.needManualSearch === true,
        shouldWarnBeforeApply:
          suggestion.shouldWarnBeforeApply === true ||
          suggestion.needManualSearch === true ||
          confidence < 0.65,
        model: String(suggestion.model || requestBody.model || ""),
        requestId: String(suggestion.requestId || ""),
        thunderMatched: Boolean(thunderInfo?.isThunder),
        thunderConflict: thunderConflict,
      };
      renderCard(item, cardData, {
        applySuggestion: function (actionKey) {
          return typeof options.applySuggestion === "function"
            ? options.applySuggestion(actionKey)
            : buildActionResult(false, "判别动作不可用。", { reason: "apply-action-missing" });
        },
        showToast: options.showToast,
      });

      if (typeof options.onResult === "function") {
        options.onResult({
          requestId: cardData.requestId,
          hostname: resolveHostname(audioUrl),
          itemIndex: Number(requestBody.itemIndex),
          model: cardData.model,
        });
      }

      return buildActionResult(true, "AI 建议已生成，请人工确认后再采用。", {
        source: source || "unknown",
        requestId: cardData.requestId,
      });
    }

    function clearAllCards() {
      document.querySelectorAll(".labelRender-item[data-index]").forEach(function (item) {
        removeCard(item);
      });
    }

    function start() {}

    function stop() {
      clearAllCards();
    }

    return {
      start: start,
      stop: stop,
      suggestCurrentItem: suggestCurrentItem,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementAiSuggestion = {
    AI_ACTION_KEY: AI_ACTION_KEY,
    RULE_VERSION: RULE_VERSION,
    ANSWER_TO_CHOICE: ANSWER_TO_CHOICE,
    createRuntime: createRuntime,
  };
})();
