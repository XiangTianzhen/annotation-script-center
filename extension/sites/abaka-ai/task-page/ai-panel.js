(function () {
  const ROOT_ID = "asc-abaka-ai-task21-ai-panel";
  const STYLE_ID = "asc-abaka-ai-task21-ai-panel-style";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function nowMs() {
    return Date.now();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + ROOT_ID + "{position:fixed;right:16px;bottom:16px;z-index:2147483640;width:420px;max-height:72vh;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:10px;font:12px/1.5 'Microsoft YaHei',sans-serif;box-shadow:0 12px 28px rgba(2,6,23,.35);overflow:hidden;}",
      "#" + ROOT_ID + " *{box-sizing:border-box;}",
      "#" + ROOT_ID + " .asc-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #334155;background:#111827;}",
      "#" + ROOT_ID + " .asc-title{font-size:13px;font-weight:700;}",
      "#" + ROOT_ID + " .asc-sub{font-size:11px;color:#94a3b8;margin-top:2px;}",
      "#" + ROOT_ID + " .asc-toggle{border:1px solid #475569;background:#1f2937;color:#e2e8f0;border-radius:6px;padding:2px 8px;cursor:pointer;}",
      "#" + ROOT_ID + " .asc-body{padding:10px 12px;max-height:calc(72vh - 52px);overflow:auto;}",
      "#" + ROOT_ID + " .asc-buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;}",
      "#" + ROOT_ID + " .asc-btn{border:1px solid #475569;background:#1e293b;color:#f1f5f9;border-radius:7px;padding:7px 8px;cursor:pointer;text-align:left;}",
      "#" + ROOT_ID + " .asc-btn:hover{background:#334155;}",
      "#" + ROOT_ID + " .asc-btn[disabled]{cursor:not-allowed;opacity:.45;}",
      "#" + ROOT_ID + " .asc-btn-wide{grid-column:1 / -1;background:#0b4a6f;border-color:#0b4a6f;}",
      "#" + ROOT_ID + " .asc-meta{border:1px solid #334155;background:#111827;border-radius:8px;padding:8px;margin-bottom:8px;white-space:pre-wrap;word-break:break-word;}",
      "#" + ROOT_ID + " .asc-note{color:#fbbf24;font-size:11px;margin-bottom:8px;}",
      "#" + ROOT_ID + " .asc-result{border:1px solid #334155;background:#0b1220;border-radius:8px;padding:8px;margin-bottom:8px;}",
      "#" + ROOT_ID + " .asc-row{margin-bottom:4px;}",
      "#" + ROOT_ID + " .asc-k{color:#93c5fd;font-weight:700;margin-right:6px;}",
      "#" + ROOT_ID + " .asc-value{white-space:pre-wrap;word-break:break-word;}",
      "#" + ROOT_ID + " .asc-actions{display:flex;gap:6px;margin-bottom:8px;}",
      "#" + ROOT_ID + " .asc-collapse{border:1px solid #334155;border-radius:8px;background:#0f172a;}",
      "#" + ROOT_ID + " .asc-collapse summary{cursor:pointer;padding:8px 10px;color:#cbd5e1;}",
      "#" + ROOT_ID + " .asc-collapse pre{margin:0;padding:8px 10px;border-top:1px solid #334155;max-height:220px;overflow:auto;white-space:pre-wrap;word-break:break-word;}",
      "@media (max-width: 640px){#" + ROOT_ID + "{left:8px;right:8px;width:auto;bottom:8px;max-height:75vh;}}",
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function copyText(text) {
    const value = String(text || "").trim();
    if (!value) {
      return Promise.reject(new Error("无可复制内容。"));
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(value);
    }
    return Promise.reject(new Error("当前页面不支持剪贴板 API。"));
  }

  function pick(obj, keyPath, fallback) {
    const keys = String(keyPath || "").split(".").filter(Boolean);
    let current = obj;
    for (let index = 0; index < keys.length; index += 1) {
      if (!current || typeof current !== "object") {
        return fallback;
      }
      current = current[keys[index]];
    }
    return current === undefined ? fallback : current;
  }

  function sanitizeRawForDisplay(payload) {
    function replacer(key, value) {
      if (key === "dataUrl" || key === "imageUrl") {
        return value ? "[redacted]" : "";
      }
      if (typeof key === "string") {
        const lowered = key.toLowerCase();
        if (
          lowered.indexOf("token") >= 0 ||
          lowered.indexOf("authorization") >= 0 ||
          lowered.indexOf("cookie") >= 0 ||
          lowered.indexOf("secret") >= 0 ||
          lowered.indexOf("password") >= 0 ||
          lowered.indexOf("signature") >= 0
        ) {
          return "[redacted]";
        }
      }
      return value;
    }
    return safeJsonParse(JSON.stringify(payload || {}, replacer));
  }

  function resultToSuggestionJson(result) {
    return {
      same_font: pick(result, "same_font.value", ""),
      image_b_texts_removed: pick(result, "image_b_texts_removed.value", ""),
      other_changes: pick(result, "other_changes.value", ""),
      workflow: pick(result, "workflow", {}),
    };
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    const collector = config.collector || {};
    const client = config.client || {};
    const pricing = config.pricing || {};
    const showToast = typeof config.showToast === "function" ? config.showToast : function () {};

    let root = null;
    let body = null;
    let messageNode = null;
    let metaNode = null;
    let resultNode = null;
    let rawNode = null;
    let collapsed = false;
    let running = false;
    let latestDisplay = null;
    const buttons = {};

    function setMessage(text, tone) {
      if (!messageNode) {
        return;
      }
      messageNode.textContent = normalizeText(text || "就绪。") || "就绪。";
      messageNode.style.color = tone === "warn" ? "#fbbf24" : tone === "error" ? "#fca5a5" : "#cbd5e1";
    }

    function currentSameFontValue(pageValues) {
      return String(pageValues && pageValues.same_font ? pageValues.same_font : "").toLowerCase();
    }

    function updateButtonStates(snapshot) {
      const page = snapshot && snapshot.page ? snapshot.page : {};
      const currentValues = pick(snapshot, "context.currentValues", {});
      const hasSameFont = page.hasSameFontField === true;
      const hasRemoved = Boolean(currentValues.image_b_texts_removed_exists);
      const hasOther = Boolean(currentValues.other_changes_exists);

      buttons.sameFont.disabled = !hasSameFont || running;
      buttons.removed.disabled = !hasRemoved || running;
      buttons.other.disabled = !hasOther || running;
      buttons.overall.disabled = !hasSameFont || running;
      buttons.copy.disabled = running || !latestDisplay;

      buttons.sameFont.title = hasSameFont ? "" : "未检测到该板块";
      buttons.removed.title = hasRemoved ? "" : "未检测到该板块";
      buttons.other.title = hasOther ? "" : "未检测到该板块";
      buttons.overall.title = hasSameFont ? "" : "未检测到 same_font 板块";

      if (hasSameFont) {
        const same = currentSameFontValue(currentValues);
        if (same === "false" || same === "unsure") {
          setMessage("提示：same_font 当前为 false/unsure，按正式流程后两个字段可跳过；当前按钮仍可用于调试分析。", "warn");
        }
      }
    }

    function renderMeta(display) {
      if (!metaNode) {
        return;
      }
      if (!display) {
        metaNode.textContent = "等待分析...";
        return;
      }
      const usage = display.usage || {};
      const imageStats = Array.isArray(display.imageStats) ? display.imageStats : [];
      const lines = [];
      lines.push("target: " + (display.target || "-"));
      lines.push("requestId: " + (display.requestId || "-"));
      lines.push("model: " + (display.model || "-"));
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
              return item.fieldName;
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

      metaNode.textContent = lines.join("\n");
    }

    function renderResult(display) {
      if (!resultNode) {
        return;
      }
      if (!display || !display.result) {
        resultNode.innerHTML = "<div class='asc-row'>暂无分析结果。</div>";
        return;
      }
      const result = display.result;
      const evidence = [];
      const warnings = [];
      ["same_font", "image_b_texts_removed", "other_changes"].forEach(function (key) {
        const field = result[key] || {};
        const fieldEvidence = Array.isArray(field.evidence) ? field.evidence : [];
        const fieldWarnings = Array.isArray(field.warnings) ? field.warnings : [];
        fieldEvidence.forEach(function (item) {
          evidence.push(key + ": " + String(item || ""));
        });
        fieldWarnings.forEach(function (item) {
          warnings.push(key + ": " + String(item || ""));
        });
      });

      const blocks = [];
      blocks.push("<div class='asc-row'><span class='asc-k'>建议结果</span><span class='asc-value'>" +
        [
          "same_font=" + String(pick(result, "same_font.value", "")),
          "image_b_texts_removed=" + String(pick(result, "image_b_texts_removed.value", "")),
          "other_changes=" + String(pick(result, "other_changes.value", "")),
        ].join(" | ") +
        "</span></div>");
      blocks.push("<div class='asc-row'><span class='asc-k'>置信度</span><span class='asc-value'>" + String(pick(result, "same_font.confidence", "-")) + "</span></div>");
      blocks.push("<div class='asc-row'><span class='asc-k'>中文理由</span><span class='asc-value'>" +
        [
          String(pick(result, "same_font.reason_cn", "")),
          String(pick(result, "image_b_texts_removed.reason_cn", "")),
          String(pick(result, "other_changes.reason_cn", "")),
        ].filter(Boolean).join(" / ") +
        "</span></div>");
      blocks.push("<div class='asc-row'><span class='asc-k'>workflow</span><span class='asc-value'>skip_later_fields=" + String(pick(result, "workflow.skip_later_fields", false)) + "</span></div>");
      blocks.push("<div class='asc-row'><span class='asc-k'>evidence</span><span class='asc-value'>" + (evidence.length > 0 ? evidence.join("\n") : "-") + "</span></div>");
      blocks.push("<div class='asc-row'><span class='asc-k'>warnings</span><span class='asc-value'>" + (warnings.length > 0 ? warnings.join("\n") : "-") + "</span></div>");
      resultNode.innerHTML = blocks.join("");
    }

    function renderRaw(display) {
      if (!rawNode) {
        return;
      }
      if (!display) {
        rawNode.textContent = "{}";
        return;
      }
      rawNode.textContent = JSON.stringify(sanitizeRawForDisplay(display.raw), null, 2);
    }

    function extractPriceInput(snapshot, result) {
      const currentValues = pick(snapshot, "context.currentValues", {});
      return {
        imageATexts: pick(snapshot, "context.imageATexts", ""),
        imageBTexts: pick(snapshot, "context.imageBTexts", ""),
        sameFontValue: pick(result, "same_font.value", currentValues.same_font || ""),
        imageBTextsRemovedValue: pick(
          result,
          "image_b_texts_removed.value",
          currentValues.image_b_texts_removed || ""
        ),
        otherChangesValue: pick(result, "other_changes.value", currentValues.other_changes || ""),
      };
    }

    async function runAnalysis(target) {
      if (running) {
        return;
      }
      if (typeof collector.collectTask21Payload !== "function") {
        setMessage("data-collector 未就绪。", "error");
        return;
      }
      if (typeof client.analyze !== "function") {
        setMessage("ai-client 未就绪。", "error");
        return;
      }

      running = true;
      updateButtonStates(null);
      setMessage("正在分析 " + target + " ...");

      const startedAt = nowMs();
      try {
        const snapshot = await collector.collectTask21Payload();
        const currentValues = pick(snapshot, "context.currentValues", {});

        if (target === "same_font" && snapshot.page.hasSameFontField !== true) {
          setMessage("未检测到该板块：same_font", "warn");
          return;
        }
        if (target === "image_b_texts_removed" && !currentValues.image_b_texts_removed_exists) {
          setMessage("未检测到该板块：image_b_texts_removed", "warn");
          return;
        }
        if (target === "other_changes" && !currentValues.other_changes_exists) {
          setMessage("未检测到该板块：other_changes", "warn");
          return;
        }

        const requestPayload = {
          target: target,
          context: {
            imageATexts: pick(snapshot, "context.imageATexts", ""),
            imageBTexts: pick(snapshot, "context.imageBTexts", ""),
            textPositions: pick(snapshot, "context.textPositions", {}),
            currentValues: currentValues,
            route: pick(snapshot, "context.route", {}),
          },
          images: Array.isArray(snapshot.images)
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

        const response = await client.analyze(requestPayload, {
          timeoutMs: 120000,
          settings: config.settings || null,
        });
        const body = response.data || {};
        const result = body.result || {};

        const price =
          typeof pricing.estimateTask21Price === "function"
            ? pricing.estimateTask21Price(extractPriceInput(snapshot, result))
            : null;

        latestDisplay = {
          target: target,
          requestId: body.requestId || "",
          model: body.model || "",
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
          imageStats: Array.isArray(body.imageStats) && body.imageStats.length > 0 ? body.imageStats : snapshot.imageStats,
          price: price,
          result: result,
          raw: {
            request: requestPayload,
            response: body,
          },
        };

        renderMeta(latestDisplay);
        renderResult(latestDisplay);
        renderRaw(latestDisplay);
        setMessage("分析完成：" + target, "info");
      } catch (error) {
        const message = normalizeText(error && error.message ? error.message : "AI 分析失败。");
        setMessage(message, "error");
      } finally {
        running = false;
        if (typeof collector.collectTask21Payload === "function") {
          collector
            .collectTask21Payload()
            .then(function (snapshot) {
              updateButtonStates(snapshot);
            })
            .catch(function () {
              updateButtonStates(null);
            });
        } else {
          updateButtonStates(null);
        }
      }
    }

    function toggleCollapse() {
      collapsed = !collapsed;
      if (!body) {
        return;
      }
      body.style.display = collapsed ? "none" : "block";
      if (buttons.toggle) {
        buttons.toggle.textContent = collapsed ? "展开" : "收起";
      }
    }

    async function refreshState() {
      if (typeof collector.collectTask21Payload !== "function") {
        updateButtonStates(null);
        return;
      }
      try {
        const snapshot = await collector.collectTask21Payload();
        updateButtonStates(snapshot);
      } catch (error) {
        updateButtonStates(null);
      }
    }

    function ensureMounted() {
      if (root && document.documentElement.contains(root)) {
        return root;
      }
      ensureStyle();

      root = document.createElement("section");
      root.id = ROOT_ID;

      const head = document.createElement("div");
      head.className = "asc-head";

      const headLeft = document.createElement("div");
      const title = document.createElement("div");
      title.className = "asc-title";
      title.textContent = "Abaka AI Task21 AI 分析面板（调试）";
      const sub = document.createElement("div");
      sub.className = "asc-sub";
      sub.textContent = "AI 仅输出建议，不自动写入/保存/提交/送审";
      headLeft.appendChild(title);
      headLeft.appendChild(sub);

      buttons.toggle = document.createElement("button");
      buttons.toggle.type = "button";
      buttons.toggle.className = "asc-toggle";
      buttons.toggle.textContent = "收起";
      buttons.toggle.addEventListener("click", toggleCollapse);

      head.appendChild(headLeft);
      head.appendChild(buttons.toggle);

      body = document.createElement("div");
      body.className = "asc-body";

      const buttonsWrap = document.createElement("div");
      buttonsWrap.className = "asc-buttons";

      buttons.sameFont = document.createElement("button");
      buttons.sameFont.type = "button";
      buttons.sameFont.className = "asc-btn";
      buttons.sameFont.textContent = "AI 分析 same_font";
      buttons.sameFont.addEventListener("click", function () {
        void runAnalysis("same_font");
      });

      buttons.removed = document.createElement("button");
      buttons.removed.type = "button";
      buttons.removed.className = "asc-btn";
      buttons.removed.textContent = "AI 分析 image_b_texts_removed";
      buttons.removed.addEventListener("click", function () {
        void runAnalysis("image_b_texts_removed");
      });

      buttons.other = document.createElement("button");
      buttons.other.type = "button";
      buttons.other.className = "asc-btn";
      buttons.other.textContent = "AI 分析 other_changes";
      buttons.other.addEventListener("click", function () {
        void runAnalysis("other_changes");
      });

      buttons.overall = document.createElement("button");
      buttons.overall.type = "button";
      buttons.overall.className = "asc-btn asc-btn-wide";
      buttons.overall.textContent = "AI 整体分析（Task21 流程）";
      buttons.overall.addEventListener("click", function () {
        void runAnalysis("overall");
      });

      buttonsWrap.appendChild(buttons.sameFont);
      buttonsWrap.appendChild(buttons.removed);
      buttonsWrap.appendChild(buttons.other);
      buttonsWrap.appendChild(buttons.overall);

      const note = document.createElement("div");
      note.className = "asc-note";
      note.textContent = "调试输出包含 token、图片统计、耗时、requestId、价格估算。";

      metaNode = document.createElement("pre");
      metaNode.className = "asc-meta";
      metaNode.textContent = "等待分析...";

      resultNode = document.createElement("div");
      resultNode.className = "asc-result";
      resultNode.innerHTML = "<div class='asc-row'>暂无分析结果。</div>";

      const actionRow = document.createElement("div");
      actionRow.className = "asc-actions";
      buttons.copy = document.createElement("button");
      buttons.copy.type = "button";
      buttons.copy.className = "asc-btn";
      buttons.copy.textContent = "复制建议";
      buttons.copy.disabled = true;
      buttons.copy.addEventListener("click", function () {
        const suggestion = latestDisplay ? resultToSuggestionJson(latestDisplay.result) : null;
        copyText(JSON.stringify(suggestion || {}, null, 2))
          .then(function () {
            showToast("建议已复制", "success");
          })
          .catch(function (error) {
            setMessage(error && error.message ? error.message : "复制失败", "warn");
          });
      });
      actionRow.appendChild(buttons.copy);

      const rawPanel = document.createElement("details");
      rawPanel.className = "asc-collapse";
      const rawSummary = document.createElement("summary");
      rawSummary.textContent = "原始 JSON（脱敏）";
      rawNode = document.createElement("pre");
      rawNode.textContent = "{}";
      rawPanel.appendChild(rawSummary);
      rawPanel.appendChild(rawNode);

      messageNode = document.createElement("div");
      messageNode.className = "asc-meta";
      messageNode.textContent = "就绪。";

      body.appendChild(buttonsWrap);
      body.appendChild(note);
      body.appendChild(metaNode);
      body.appendChild(resultNode);
      body.appendChild(actionRow);
      body.appendChild(rawPanel);
      body.appendChild(messageNode);

      root.appendChild(head);
      root.appendChild(body);
      (document.body || document.documentElement).appendChild(root);
      return root;
    }

    function isEligiblePage() {
      if (typeof collector.isItemsPage === "function" && collector.isItemsPage() !== true) {
        return false;
      }
      return true;
    }

    function start() {
      if (!isEligiblePage()) {
        return {
          ok: false,
          message: "当前不是 /items 页面，AI 面板未注入。",
        };
      }
      ensureMounted();
      void refreshState();
      return {
        ok: true,
        message: "AI 面板已初始化。",
      };
    }

    function remove() {
      if (root && root.parentElement) {
        root.parentElement.removeChild(root);
      }
      root = null;
      body = null;
      messageNode = null;
      metaNode = null;
      resultNode = null;
      rawNode = null;
    }

    return {
      start: start,
      remove: remove,
      refreshState: refreshState,
      runAnalysis: runAnalysis,
      getLatest: function () {
        return latestDisplay;
      },
    };
  }

  globalThis.__ASCEdgeAbakaAiTask21AiPanel = {
    createRuntime: createRuntime,
  };
})();
