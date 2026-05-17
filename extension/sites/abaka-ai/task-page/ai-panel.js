(function () {
  const STYLE_ID = "asc-abaka-ai-inline-style";
  const ACTIONS_WRAP_CLASS = "asc-abaka-ai-inline-actions";
  const PANEL_CLASS = "asc-abaka-ai-result-panel";
  const BUTTON_CLASS = "asc-abaka-ai-btn";
  const BUTTON_OVERALL_CLASS = "asc-abaka-ai-btn-overall";

  const FIELD_CONFIGS = {
    same_font: {
      key: "same_font",
      title: "same_font",
      actionButtons: [
        {
          key: "aiAnalyzeSameFont",
          label: "AI分析",
          target: "same_font",
          panelField: "same_font",
        },
        {
          key: "aiAnalyzeOverall",
          label: "整体分析",
          target: "overall",
          panelField: "same_font",
          overall: true,
        },
      ],
    },
    image_b_texts_removed: {
      key: "image_b_texts_removed",
      title: "image_b_texts_removed",
      actionButtons: [
        {
          key: "aiAnalyzeImageBTextsRemoved",
          label: "AI分析",
          target: "image_b_texts_removed",
          panelField: "image_b_texts_removed",
        },
      ],
    },
    other_changes: {
      key: "other_changes",
      title: "other_changes",
      actionButtons: [
        {
          key: "aiAnalyzeOtherChanges",
          label: "AI分析",
          target: "other_changes",
          panelField: "other_changes",
        },
      ],
    },
  };

  const TARGET_TO_PANEL_FIELD = {
    same_font: "same_font",
    overall: "same_font",
    image_b_texts_removed: "image_b_texts_removed",
    other_changes: "other_changes",
  };

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
  }

  function nowMs() {
    return Date.now();
  }

  function isVisible(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    const style = window.getComputedStyle(node);
    if (!style || style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function sanitizeRawForDisplay(payload) {
    function sanitizeValue(key, value) {
      const keyText = String(key || "").toLowerCase();
      if (
        keyText === "dataurl" ||
        keyText === "imageurl" ||
        keyText.indexOf("authorization") >= 0 ||
        keyText.indexOf("token") >= 0 ||
        keyText.indexOf("cookie") >= 0 ||
        keyText.indexOf("password") >= 0 ||
        keyText.indexOf("secret") >= 0 ||
        keyText.indexOf("signature") >= 0
      ) {
        return "[redacted]";
      }
      if (typeof value === "string") {
        if (/^data:image\//i.test(value)) {
          return "[data-url-redacted]";
        }
        if (/^https?:\/\//i.test(value)) {
          return "[url-redacted]";
        }
      }
      return value;
    }

    return safeJsonParse(
      JSON.stringify(payload || {}, function (key, value) {
        return sanitizeValue(key, value);
      })
    );
  }

  function findFieldItemByTitle(fieldTitle) {
    const target = normalizeLower(fieldTitle);
    if (!target) {
      return null;
    }
    const titleNodes = document.querySelectorAll(".l-title-text");
    for (let index = 0; index < titleNodes.length; index += 1) {
      const node = titleNodes[index];
      if (!isVisible(node)) {
        continue;
      }
      if (normalizeLower(node.textContent || "") !== target) {
        continue;
      }
      const item = node.closest(".l-item");
      if (item) {
        return {
          item: item,
          titleNode: node,
        };
      }
    }
    return null;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "." + ACTIONS_WRAP_CLASS + "{display:inline-flex;align-items:center;gap:6px;margin-left:10px;flex-wrap:wrap;}",
      "." + BUTTON_CLASS + "{height:24px;line-height:22px;padding:0 9px;border:1px solid #7ba7ff;border-radius:12px;background:#eef4ff;color:#1d4ed8;font-size:12px;font-weight:600;cursor:pointer;}",
      "." + BUTTON_CLASS + ":hover{background:#dbeafe;}",
      "." + BUTTON_CLASS + ":disabled{opacity:.45;cursor:not-allowed;}",
      "." + BUTTON_OVERALL_CLASS + "{border-color:#93c5fd;background:#f0f9ff;color:#1d4ed8;}",
      "." + PANEL_CLASS + "{position:fixed;z-index:2147483640;width:min(520px,calc(100vw - 24px));max-height:70vh;overflow:hidden;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;color:#0f172a;box-shadow:0 18px 42px rgba(15,23,42,.22);}",
      "." + PANEL_CLASS + " *{box-sizing:border-box;}",
      "." + PANEL_CLASS + " .asc-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;}",
      "." + PANEL_CLASS + " .asc-panel-title{font-weight:700;font-size:13px;color:#1e293b;}",
      "." + PANEL_CLASS + " .asc-panel-sub{font-size:11px;color:#64748b;margin-top:2px;}",
      "." + PANEL_CLASS + " .asc-panel-close{border:1px solid #cbd5e1;border-radius:6px;background:#fff;padding:2px 8px;font-size:12px;cursor:pointer;}",
      "." + PANEL_CLASS + " .asc-panel-body{padding:10px 12px;overflow:auto;max-height:calc(70vh - 52px);display:grid;gap:8px;}",
      "." + PANEL_CLASS + " .asc-block{border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;padding:8px;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;}",
      "." + PANEL_CLASS + " .asc-block-title{font-weight:700;color:#334155;margin-bottom:6px;}",
      "." + PANEL_CLASS + " .asc-note{font-size:12px;color:#334155;}",
      "." + PANEL_CLASS + " details{border:1px solid #e2e8f0;border-radius:8px;background:#fff;}",
      "." + PANEL_CLASS + " details summary{cursor:pointer;padding:8px 10px;font-size:12px;color:#334155;}",
      "." + PANEL_CLASS + " details pre{margin:0;border-top:1px solid #e2e8f0;padding:8px 10px;max-height:220px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12px;}",
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    const collector = config.collector || {};
    const client = config.client || {};
    const pricing = config.pricing || {};
    const showToast = typeof config.showToast === "function" ? config.showToast : function () {};

    const actionButtonByKey = {};
    const panelByField = {};
    const latestByField = {};
    const runningByField = {};
    const missingFieldLogged = {};

    let started = false;
    let mutationObserver = null;
    let refreshTimer = null;

    function buildMetaText(display) {
      const usage = display.usage || {};
      const imageStats = Array.isArray(display.imageStats) ? display.imageStats : [];
      const lines = [];
      lines.push("目标: " + String(display.target || "-"));
      lines.push("requestId: " + String(display.requestId || "-"));
      lines.push("model: " + String(display.model || "-"));
      lines.push("selectedModel: " + String(display.selectedModel || "-"));
      lines.push("enableThinking: " + String(display.enableThinking === true));
      lines.push("thinkingParamName: " + String(display.thinkingParamName || "enable_thinking"));
      lines.push("thinkingParamLocation: " + String(display.thinkingParamLocation || "root"));
      lines.push("timeoutMs: " + String(display.timeoutMs || 0));
      lines.push("elapsedMs: " + String(display.elapsedMs || 0));
      lines.push(
        "tokens: input=" +
          String(usage.inputTokens || 0) +
          ", output=" +
          String(usage.outputTokens || 0) +
          ", total=" +
          String(usage.totalTokens || 0)
      );
      lines.push("usageSource: " + String(usage.source || "unavailable"));
      lines.push("hasUsage: " + String(usage.hasUsage === true));
      lines.push("imageCount: " + String(imageStats.length));
      lines.push(
        "imageFields: " +
          imageStats
            .map(function (item) {
              return String(item.fieldName || "unknown");
            })
            .join(", ")
      );
      imageStats.forEach(function (item) {
        lines.push(
          "- " +
            String(item.fieldName || "unknown") +
            ": mime=" +
            String(item.mime || "unknown") +
            ", size=" +
            String(item.width || "unknown") +
            "x" +
            String(item.height || "unknown") +
            ", bytes=" +
            String(item.bytes || "unknown")
        );
      });

      const price = display.price || {};
      if (price.sameFont) {
        lines.push(
          "price.same_font: segments=" +
            String(price.sameFont.segmentCount || 0) +
            ", tier=" +
            String(price.sameFont.tier || "-") +
            ", price=" +
            String(price.sameFont.price || 0)
        );
      }
      if (price.imageBTextsRemoved) {
        lines.push(
          "price.image_b_texts_removed: segments=" +
            String(price.imageBTextsRemoved.segmentCount || 0) +
            ", tier=" +
            String(price.imageBTextsRemoved.tier || "-") +
            ", price=" +
            String(price.imageBTextsRemoved.price || 0)
        );
      }
      if (price.otherChanges) {
        lines.push(
          "price.other_changes: words=" +
            String(price.otherChanges.wordCount || 0) +
            ", tier=" +
            String(price.otherChanges.tier || "-") +
            ", price=" +
            String(price.otherChanges.price || 0)
        );
      }
      lines.push("price.total: " + String(price.totalPrice || 0));
      return lines.join("\n");
    }

    function buildResultText(display) {
      const result = display.result || {};
      const values = [
        "same_font=" + String(result?.same_font?.value || ""),
        "image_b_texts_removed=" + String(result?.image_b_texts_removed?.value || ""),
        "other_changes=" + String(result?.other_changes?.value || ""),
      ];
      const reasons = [
        String(result?.same_font?.reason_cn || ""),
        String(result?.image_b_texts_removed?.reason_cn || ""),
        String(result?.other_changes?.reason_cn || ""),
      ].filter(Boolean);

      const evidence = [];
      const warnings = [];
      ["same_font", "image_b_texts_removed", "other_changes"].forEach(function (key) {
        const field = result[key] || {};
        (Array.isArray(field.evidence) ? field.evidence : []).forEach(function (item) {
          evidence.push(key + ": " + String(item || ""));
        });
        (Array.isArray(field.warnings) ? field.warnings : []).forEach(function (item) {
          warnings.push(key + ": " + String(item || ""));
        });
      });

      return [
        "建议结果: " + values.join(" | "),
        "置信度: " + String(result?.same_font?.confidence ?? "-"),
        "中文理由: " + (reasons.length > 0 ? reasons.join(" / ") : "-"),
        "workflow.skip_later_fields: " + String(result?.workflow?.skip_later_fields === true),
        "workflow.skip_reason: " + String(result?.workflow?.skip_reason || ""),
        "evidence:\n" + (evidence.length > 0 ? evidence.join("\n") : "-"),
        "warnings:\n" + (warnings.length > 0 ? warnings.join("\n") : "-"),
      ].join("\n");
    }

    function getFieldAnchor(fieldKey) {
      const fieldConfig = FIELD_CONFIGS[fieldKey];
      if (!fieldConfig) {
        return null;
      }
      return findFieldItemByTitle(fieldConfig.title);
    }

    function ensurePanel(fieldKey) {
      let panel = panelByField[fieldKey] || null;
      if (panel && document.documentElement.contains(panel.root)) {
        return panel;
      }

      const root = document.createElement("section");
      root.className = PANEL_CLASS;
      root.style.display = "none";

      const head = document.createElement("div");
      head.className = "asc-panel-head";

      const headText = document.createElement("div");
      const title = document.createElement("div");
      title.className = "asc-panel-title";
      title.textContent = "Task21 AI 分析（" + fieldKey + "）";
      const sub = document.createElement("div");
      sub.className = "asc-panel-sub";
      sub.textContent = "仅辅助建议，不自动写入/保存/提交";
      headText.appendChild(title);
      headText.appendChild(sub);

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "asc-panel-close";
      closeButton.textContent = "关闭";
      closeButton.addEventListener("click", function () {
        root.style.display = "none";
      });

      head.appendChild(headText);
      head.appendChild(closeButton);

      const body = document.createElement("div");
      body.className = "asc-panel-body";

      const status = document.createElement("div");
      status.className = "asc-note";
      status.textContent = "就绪。";

      const metaBlock = document.createElement("div");
      metaBlock.className = "asc-block";
      const metaTitle = document.createElement("div");
      metaTitle.className = "asc-block-title";
      metaTitle.textContent = "调试信息";
      const metaText = document.createElement("div");
      metaText.textContent = "等待分析...";
      metaBlock.appendChild(metaTitle);
      metaBlock.appendChild(metaText);

      const resultBlock = document.createElement("div");
      resultBlock.className = "asc-block";
      const resultTitle = document.createElement("div");
      resultTitle.className = "asc-block-title";
      resultTitle.textContent = "建议结果";
      const resultText = document.createElement("div");
      resultText.textContent = "暂无分析结果。";
      resultBlock.appendChild(resultTitle);
      resultBlock.appendChild(resultText);

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.flexWrap = "wrap";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = BUTTON_CLASS;
      copyButton.textContent = "复制建议";
      copyButton.disabled = true;
      copyButton.addEventListener("click", function () {
        const latest = latestByField[fieldKey];
        if (!latest) {
          return;
        }
        const suggestion = {
          same_font: latest?.result?.same_font?.value || "",
          image_b_texts_removed: latest?.result?.image_b_texts_removed?.value || "",
          other_changes: latest?.result?.other_changes?.value || "",
          workflow: latest?.result?.workflow || {},
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard
            .writeText(JSON.stringify(suggestion, null, 2))
            .then(function () {
              showToast("建议已复制", "success");
            })
            .catch(function () {
              showToast("复制失败", "warn");
            });
        } else {
          showToast("当前页面不支持剪贴板 API", "warn");
        }
      });
      actions.appendChild(copyButton);

      const rawPanel = document.createElement("details");
      const rawSummary = document.createElement("summary");
      rawSummary.textContent = "查看原始 JSON（脱敏）";
      const rawText = document.createElement("pre");
      rawText.textContent = "{}";
      rawPanel.appendChild(rawSummary);
      rawPanel.appendChild(rawText);

      body.appendChild(status);
      body.appendChild(metaBlock);
      body.appendChild(resultBlock);
      body.appendChild(actions);
      body.appendChild(rawPanel);

      root.appendChild(head);
      root.appendChild(body);
      (document.body || document.documentElement).appendChild(root);

      panel = {
        fieldKey: fieldKey,
        root: root,
        status: status,
        metaText: metaText,
        resultText: resultText,
        rawText: rawText,
        copyButton: copyButton,
      };
      panelByField[fieldKey] = panel;
      return panel;
    }

    function updatePanelPosition(fieldKey) {
      const panel = panelByField[fieldKey];
      if (!panel || panel.root.style.display === "none") {
        return;
      }
      const anchor = getFieldAnchor(fieldKey);
      if (!anchor || !(anchor.item instanceof Element)) {
        return;
      }
      const rect = anchor.item.getBoundingClientRect();
      const panelWidth = panel.root.offsetWidth || Math.min(520, window.innerWidth - 24);
      const leftCandidate = rect.right + 8;
      let left = leftCandidate;
      if (left + panelWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelWidth - 8);
      }
      const top = Math.max(8, Math.min(rect.top + 8, window.innerHeight - 120));
      panel.root.style.left = String(Math.round(left)) + "px";
      panel.root.style.top = String(Math.round(top)) + "px";
    }

    function updateAllPanelPositions() {
      Object.keys(panelByField).forEach(function (fieldKey) {
        updatePanelPosition(fieldKey);
      });
    }

    function setPanelLoading(panel, label) {
      panel.status.textContent = "正在分析 " + label + " ...";
      panel.metaText.textContent = "等待分析结果...";
      panel.resultText.textContent = "分析中...";
      panel.rawText.textContent = "{}";
      panel.copyButton.disabled = true;
    }

    function setPanelError(panel, message) {
      panel.status.textContent = normalizeText(message || "分析失败。") || "分析失败。";
      panel.resultText.textContent = "暂无分析结果。";
      panel.copyButton.disabled = true;
    }

    function setPanelResult(panel, display) {
      panel.status.textContent = "分析完成：" + String(display.target || "-");
      panel.metaText.textContent = buildMetaText(display);
      panel.resultText.textContent = buildResultText(display);
      panel.rawText.textContent = JSON.stringify(sanitizeRawForDisplay(display.raw), null, 2);
      panel.copyButton.disabled = false;
    }

    function getFieldStates(snapshot) {
      const page = snapshot?.page || {};
      const values = snapshot?.context?.currentValues || {};
      return {
        same_font: page.hasSameFontField === true,
        image_b_texts_removed: values.image_b_texts_removed_exists === true,
        other_changes: values.other_changes_exists === true,
      };
    }

    function updateInlineButtonState(snapshot) {
      const states = getFieldStates(snapshot || {});
      Object.keys(actionButtonByKey).forEach(function (actionKey) {
        const entry = actionButtonByKey[actionKey];
        const button = entry && entry.button;
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }
        const panelField = entry.panelField;
        const enabled = states[panelField] === true;
        button.disabled = !enabled || runningByField[panelField] === true;
        button.title = enabled ? "" : "未检测到该板块";
      });
    }

    function buildRequestPayload(snapshot, target) {
      const currentValues = snapshot?.context?.currentValues || {};
      return {
        target: target,
        context: {
          imageATexts: snapshot?.context?.imageATexts || "",
          imageBTexts: snapshot?.context?.imageBTexts || "",
          textPositions: snapshot?.context?.textPositions || {},
          currentValues: {
            same_font: currentValues.same_font || "",
            image_b_texts_removed: currentValues.image_b_texts_removed || "",
            other_changes: currentValues.other_changes || "",
          },
          route: snapshot?.context?.route || {},
        },
        images: Array.isArray(snapshot?.images)
          ? snapshot.images.map(function (item) {
              return {
                fieldName: item.fieldName,
                dataUrl: item.dataUrl || "",
                imageUrl: item.dataUrl ? "" : item.imageUrl || "",
                mime: item.mime || "unknown",
                width: item.width || 0,
                height: item.height || 0,
                bytes: item.bytes || 0,
              };
            })
          : [],
        debug: true,
      };
    }

    function extractPriceInput(snapshot, result) {
      const currentValues = snapshot?.context?.currentValues || {};
      return {
        imageATexts: snapshot?.context?.imageATexts || "",
        imageBTexts: snapshot?.context?.imageBTexts || "",
        sameFontValue: result?.same_font?.value || currentValues.same_font || "",
        imageBTextsRemovedValue:
          result?.image_b_texts_removed?.value || currentValues.image_b_texts_removed || "",
        otherChangesValue: result?.other_changes?.value || currentValues.other_changes || "",
      };
    }

    async function runAnalysis(target, options) {
      const runtimeOptions = options && typeof options === "object" ? options : {};
      const panelField = runtimeOptions.panelField || TARGET_TO_PANEL_FIELD[target] || "same_font";
      const fieldConfig = FIELD_CONFIGS[panelField];
      if (!fieldConfig) {
        return { ok: false, message: "未知分析目标。" };
      }
      if (runningByField[panelField] === true) {
        return { ok: false, message: "该板块正在分析中，请稍候。" };
      }
      if (typeof collector.collectTask21Payload !== "function") {
        return { ok: false, message: "data-collector 未就绪。" };
      }
      if (typeof client.analyze !== "function") {
        return { ok: false, message: "ai-client 未就绪。" };
      }

      const panel = ensurePanel(panelField);
      panel.root.style.display = "block";
      updatePanelPosition(panelField);
      setPanelLoading(panel, target);
      runningByField[panelField] = true;

      try {
        const snapshot = await collector.collectTask21Payload();
        updateInlineButtonState(snapshot);

        const states = getFieldStates(snapshot);
        if (target === "same_font" || target === "overall") {
          if (!states.same_font) {
            const message = "未检测到 same_font 板块。";
            setPanelError(panel, message);
            return { ok: false, message: message };
          }
        }
        if (target === "image_b_texts_removed" && !states.image_b_texts_removed) {
          const message = "未检测到 image_b_texts_removed 板块。";
          setPanelError(panel, message);
          return { ok: false, message: message };
        }
        if (target === "other_changes" && !states.other_changes) {
          const message = "未检测到 other_changes 板块。";
          setPanelError(panel, message);
          return { ok: false, message: message };
        }

        const startedAt = nowMs();
        const requestPayload = buildRequestPayload(snapshot, target);
        const response = await client.analyze(requestPayload, {
          settings: config.settings || null,
        });
        const body = response.data || {};
        const result = body.result || {};
        const thinkingDebug = body.thinking || {};
        const requestDebug = response.requestDebug || {};

        const price =
          typeof pricing.estimateTask21Price === "function"
            ? pricing.estimateTask21Price(extractPriceInput(snapshot, result))
            : null;

        const display = {
          target: target,
          requestId: body.requestId || "",
          model: body.model || "",
          selectedModel:
            String(body.selectedModel || "") ||
            String(requestDebug.selectedModel || "") ||
            String(body.model || ""),
          enableThinking:
            thinkingDebug.requested === true ||
            (thinkingDebug.requested !== false && requestDebug.enableThinking === true),
          thinkingParamName: String(thinkingDebug.paramName || "enable_thinking"),
          thinkingParamLocation: String(thinkingDebug.paramLocation || "root"),
          timeoutMs: Number(thinkingDebug.timeoutMs || requestDebug.timeoutMs || 0),
          elapsedMs: Number(body.elapsedMs || nowMs() - startedAt),
          usage: Object.assign(
            {
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              source: "unavailable",
              hasUsage: false,
            },
            body.usage || {},
            {
              hasUsage: Boolean(body.usage && String(body.usage.source || "") === "provider"),
            }
          ),
          imageStats:
            Array.isArray(body.imageStats) && body.imageStats.length > 0
              ? body.imageStats
              : snapshot.imageStats,
          price: price,
          result: result,
          raw: {
            request: requestPayload,
            response: body,
          },
        };

        latestByField[panelField] = display;
        setPanelResult(panel, display);
        if (runtimeOptions.source !== "shortcut") {
          showToast("AI 分析完成：" + target, "success");
        }
        return { ok: true, message: "AI 分析完成：" + target };
      } catch (error) {
        const message = normalizeText(error && error.message ? error.message : "AI 分析失败。");
        setPanelError(panel, message);
        return { ok: false, message: message || "AI 分析失败。" };
      } finally {
        runningByField[panelField] = false;
        try {
          const snapshot = await collector.collectTask21Payload();
          updateInlineButtonState(snapshot);
        } catch (error) {
          updateInlineButtonState(null);
        }
      }
    }

    function ensureInlineButtons() {
      Object.keys(FIELD_CONFIGS).forEach(function (fieldKey) {
        const fieldConfig = FIELD_CONFIGS[fieldKey];
        const anchor = findFieldItemByTitle(fieldConfig.title);
        if (!anchor || !(anchor.item instanceof Element)) {
          if (!missingFieldLogged[fieldKey]) {
            console.info("[ASC][Abaka AI] 未检测到 " + fieldConfig.title + " 板块，跳过挂载。");
            missingFieldLogged[fieldKey] = true;
          }
          return;
        }

        const headerActions =
          anchor.item.querySelector(".l-header-actions") ||
          anchor.item.querySelector(".l-header") ||
          anchor.titleNode.parentElement;
        if (!(headerActions instanceof Element)) {
          return;
        }

        let wrap = headerActions.querySelector(
          "." + ACTIONS_WRAP_CLASS + "[data-asc-field='" + fieldKey + "']"
        );
        if (!wrap) {
          wrap = document.createElement("span");
          wrap.className = ACTIONS_WRAP_CLASS;
          wrap.setAttribute("data-asc-field", fieldKey);
          headerActions.appendChild(wrap);
        }

        fieldConfig.actionButtons.forEach(function (buttonConfig) {
          let button = wrap.querySelector("button[data-asc-action='" + buttonConfig.key + "']");
          if (!(button instanceof HTMLButtonElement)) {
            button = document.createElement("button");
            button.type = "button";
            button.className =
              BUTTON_CLASS + (buttonConfig.overall ? " " + BUTTON_OVERALL_CLASS : "");
            button.textContent = buttonConfig.label;
            button.setAttribute("data-asc-action", buttonConfig.key);
            button.addEventListener("click", function () {
              void runAnalysis(buttonConfig.target, {
                panelField: buttonConfig.panelField,
                source: "button",
              });
            });
            wrap.appendChild(button);
          }
          actionButtonByKey[buttonConfig.key] = {
            button: button,
            panelField: buttonConfig.panelField,
          };
        });
      });
    }

    function scheduleRefreshMount() {
      if (refreshTimer) {
        return;
      }
      refreshTimer = window.setTimeout(function () {
        refreshTimer = null;
        ensureInlineButtons();
        updateAllPanelPositions();
        if (typeof collector.collectTask21Payload === "function") {
          collector
            .collectTask21Payload()
            .then(function (snapshot) {
              updateInlineButtonState(snapshot);
            })
            .catch(function () {
              updateInlineButtonState(null);
            });
        }
      }, 160);
    }

    function startObservers() {
      if (mutationObserver) {
        return;
      }
      mutationObserver = new MutationObserver(function () {
        scheduleRefreshMount();
      });
      mutationObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });

      window.addEventListener("resize", updateAllPanelPositions, true);
      window.addEventListener("scroll", updateAllPanelPositions, true);
    }

    function stopObservers() {
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      window.removeEventListener("resize", updateAllPanelPositions, true);
      window.removeEventListener("scroll", updateAllPanelPositions, true);
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    }

    function isEligiblePage() {
      if (typeof collector.isItemsPage === "function") {
        return collector.isItemsPage() === true;
      }
      return String(location.pathname || "").indexOf("/items") >= 0;
    }

    function start() {
      if (started) {
        return { ok: true, message: "AI inline runtime already started." };
      }
      if (!isEligiblePage()) {
        return { ok: false, message: "当前不是 /items 页面，跳过 AI 内联按钮挂载。" };
      }
      ensureStyle();
      ensureInlineButtons();
      startObservers();
      started = true;
      if (typeof collector.collectTask21Payload === "function") {
        collector
          .collectTask21Payload()
          .then(function (snapshot) {
            updateInlineButtonState(snapshot);
          })
          .catch(function () {
            updateInlineButtonState(null);
          });
      }
      return { ok: true, message: "AI inline runtime started." };
    }

    function remove() {
      stopObservers();
      Object.keys(panelByField).forEach(function (fieldKey) {
        const panel = panelByField[fieldKey];
        if (panel && panel.root && panel.root.parentElement) {
          panel.root.parentElement.removeChild(panel.root);
        }
        delete panelByField[fieldKey];
      });
      const wraps = document.querySelectorAll("." + ACTIONS_WRAP_CLASS);
      wraps.forEach(function (node) {
        if (node && node.parentElement) {
          node.parentElement.removeChild(node);
        }
      });
      Object.keys(actionButtonByKey).forEach(function (key) {
        delete actionButtonByKey[key];
      });
      started = false;
    }

    return {
      start: start,
      remove: remove,
      runAnalysis: runAnalysis,
      refreshState: function () {
        ensureInlineButtons();
        updateAllPanelPositions();
      },
      getLatest: function (fieldKey) {
        return latestByField[fieldKey || "same_font"] || null;
      },
    };
  }

  globalThis.__ASCEdgeAbakaAiTask21AiPanel = {
    createRuntime: createRuntime,
  };
})();
