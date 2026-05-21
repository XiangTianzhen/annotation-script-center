(function () {
  const DEFAULT_ENDPOINT =
    "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend";
  const DEFAULT_TIMEOUT_MS = 120000;
  const DEFAULT_REQUEST_STAGGER_MS = 30;

  function getClientVersion() {
    try {
      const manifest = chrome?.runtime?.getManifest ? chrome.runtime.getManifest() : null;
      return String(manifest?.version || "unknown");
    } catch (error) {
      return "unknown";
    }
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function getAnnotatorName() {
    const rightMenu = document.querySelector(".right-menu");
    if (!rightMenu) {
      return "";
    }

    const candidates = Array.from(
      rightMenu.querySelectorAll(
        ".avatar-container.el-dropdown > .el-dropdown-selfdefine, .avatar-container.el-dropdown [role='button']"
      )
    )
      .map(function (node) {
        return normalizeText(node.textContent || "");
      })
      .filter(function (text) {
        return text && text !== "帮助文档" && text !== "简体中文" && text !== "English";
      });

    return candidates.length > 0 ? candidates[candidates.length - 1].slice(0, 40) : "";
  }

  function createClientError(message, details) {
    const error = new Error(String(message || "请求失败。"));
    Object.assign(error, details || {});
    return error;
  }

  function buildApiError(responseBody, statusCode) {
    const body = responseBody && typeof responseBody === "object" ? responseBody : {};
    const code = String(body.code || "").trim();
    let message = String(body.message || "AI 推荐接口请求失败（HTTP " + String(statusCode) + "）。").trim();
    if (code === "provider-queue-full") {
      message = "后端 AI 队列已满，请稍后重试。";
    } else if (code === "network-disconnected") {
      message = "后端连接中断，请稍后重试。";
    } else if (code === "timeout") {
      message = "AI 推荐接口请求超时。";
    } else if (code === "qwen-empty-response") {
      message = "Qwen 接口未返回有效文本，可查看原始AI返回排查。";
    } else if (code === "model-json-parse-failed") {
      message = "模型输出 JSON 解析失败，可查看原始AI返回。";
    } else if (code === "provider-http-error") {
      message = "上游模型接口返回错误，可查看原始AI返回。";
    }
    if (body.summary) {
      message += "：" + String(body.summary || "").slice(0, 120);
    }
    return createClientError(message, {
      code,
      statusCode: Number(statusCode) || 0,
      hasRawAiDebug: body.hasRawAiDebug === true,
      debugId: String(body.debugId || ""),
      rawAiDebug: body.rawAiDebug || null,
      hasDebugRawJson: body.hasDebugRawJson === true,
      debugRawJson: body.debugRawJson || null,
      requestId: String(body.requestId || ""),
    });
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};

    function getEndpoint() {
      try {
        return new URL(String(config.endpoint || DEFAULT_ENDPOINT)).toString();
      } catch (error) {
        return DEFAULT_ENDPOINT;
      }
    }

    function createRequestBody(source) {
      const requestBody = {
        collectId: String(source.collectId || ""),
        itemId: String(source.itemId || ""),
        textId: String(source.textId || ""),
        sentenceNumber: source.sentenceNumber,
        readRequire: String(source.readRequire || ""),
        audioUrl: String(source.audioUrl || ""),
        pageText: String(source.pageText || ""),
        annotatorName: String(source.annotatorName || getAnnotatorName() || ""),
        effectiveStartTime: source.effectiveStartTime,
        effectiveEndTime: source.effectiveEndTime,
        effectiveTime: source.effectiveTime,
        audioDuration: source.audioDuration,
        clientVersion: getClientVersion(),
        batchRunId: String(source.batchRunId || ""),
        batchItemIndex: source.batchItemIndex,
        batchProcessKey: String(source.batchProcessKey || ""),
        clientRequestId: String(source.clientRequestId || ""),
      };
      if (config.recognitionMode) {
        requestBody.recognitionMode = String(config.recognitionMode).trim();
      }
      if (config.pipelineMode) {
        requestBody.pipelineMode = String(config.pipelineMode).trim();
      }
      if (config.listenModel) {
        requestBody.listenModel = String(config.listenModel).trim();
      }
      if (config.compareModel) {
        requestBody.compareModel = String(config.compareModel).trim();
      }
      if (config.singleModel) {
        requestBody.singleModel = String(config.singleModel).trim();
      }
      if (typeof config.enableThinking === "boolean") {
        requestBody.enableThinking = config.enableThinking === true;
      }
      if (config.aiOptions && typeof config.aiOptions === "object") {
        requestBody.aiOptions = Object.assign({}, config.aiOptions);
      }
      return requestBody;
    }

    async function recommend(item) {
      const source = item && typeof item === "object" ? item : {};
      if (!source.collectId) {
        throw new Error("缺少 collectId，无法调用 AI 推荐。");
      }
      if (!source.itemId) {
        throw new Error("缺少当前题 itemId，请刷新或重新点击题目后再试。");
      }
      if (!source.audioUrl) {
        throw new Error("缺少当前题 audioUrl，请等待列表接口加载完成后再试。");
      }
      if (!String(source.pageText || "").trim()) {
        throw new Error("缺少页面候选文本。");
      }

      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, timeoutMs)
        : null;
      const requestBody = createRequestBody(source);

      try {
        const response = await fetch(getEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller ? controller.signal : undefined,
        });
        const responseBody = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || responseBody?.success !== true || !responseBody?.data) {
          throw buildApiError(responseBody, response.status);
        }
        return responseBody.data;
      } catch (error) {
        if (error?.name === "AbortError") {
          throw createClientError("AI 推荐接口请求超时。", { code: "timeout" });
        }
        if (error instanceof TypeError) {
          throw createClientError("后端连接中断，请稍后重试。", {
            code: "network-disconnected",
          });
        }
        throw error;
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    }

    async function getRawAiDebug(debugId) {
      const key = String(debugId || "").trim();
      if (!key) {
        throw createClientError("当前失败项没有可查看的原始 AI 返回。", {
          code: "ai-debug-not-found",
        });
      }
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, timeoutMs)
        : null;
      try {
        const response = await fetch(getEndpoint().replace(/\/+$/, "") + "/debug/" + encodeURIComponent(key), {
          method: "GET",
          signal: controller ? controller.signal : undefined,
        });
        const responseBody = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || responseBody?.success !== true || !responseBody?.debug) {
          throw buildApiError(responseBody, response.status);
        }
        return responseBody.debug;
      } catch (error) {
        if (error?.name === "AbortError") {
          throw createClientError("获取原始 AI 返回超时，请稍后重试。", { code: "timeout" });
        }
        if (error instanceof TypeError) {
          throw createClientError("后端连接中断，请稍后重试。", {
            code: "network-disconnected",
          });
        }
        throw error;
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    }

    return {
      getRawAiDebug,
      recommend,
      defaultRequestStaggerMs: DEFAULT_REQUEST_STAGGER_MS,
    };
  }

  globalThis.__ASREdgeDataBakerRoundOneAiRecommendation = {
    DEFAULT_ENDPOINT,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_REQUEST_STAGGER_MS,
    createRuntime,
    getAnnotatorName,
  };
})();
