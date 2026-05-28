(function () {
  if (globalThis.__ASREdgeAishellTechMinnanAiRecommendationInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanAiRecommendationInstalled = true;
  const DEFAULT_ENDPOINT =
    "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend";
  const DEFAULT_TIMEOUT_MS = 120000;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function createClientError(message, details) {
    const error = new Error(String(message || "请求失败。"));
    Object.assign(error, details || {});
    return error;
  }

  function buildApiError(responseBody, statusCode) {
    const body = responseBody && typeof responseBody === "object" ? responseBody : {};
    const code = normalizeText(body.code);
    const providerCode = normalizeText(body.providerCode);
    const providerStatus = Number(body.providerStatus || statusCode || 0) || 0;
    let message = normalizeText(body.message) || "Aishell AI 推荐接口请求失败（HTTP " + String(statusCode) + "）。";

    if (code === "provider-queue-full") {
      message = "后端 AI 队列已满，请稍后重试。";
    } else if (code === "timeout") {
      message = "AI 推荐接口请求超时。";
    } else if (code === "network-disconnected") {
      message = "后端连接中断，请稍后重试。";
    } else if (code === "provider-rate-limited" || providerCode === "limit_burst_rate") {
      message = "上游模型限流，请降低并发或稍后重试。";
    } else if (code === "invalid-reference-text") {
      message = "当前条缺少平台参考文本，无法生成推荐文本。";
    } else if (code === "invalid-audio-url") {
      message = "当前条缺少可用音频地址，请先重新点击条目。";
    }

    if (body.summary) {
      message += "：" + String(body.summary || "").slice(0, 120);
    }

    return createClientError(message, {
      code: code,
      providerCode: providerCode,
      providerStatus: providerStatus,
      statusCode: Number(statusCode) || 0,
      requestId: normalizeText(body.requestId),
      debugId: normalizeText(body.debugId),
    });
  }

  function getClientVersion() {
    try {
      const manifest = chrome?.runtime?.getManifest ? chrome.runtime.getManifest() : null;
      return String(manifest?.version || "unknown");
    } catch (_error) {
      return "unknown";
    }
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};

    function getEndpoint() {
      try {
        return new URL(String(config.endpoint || DEFAULT_ENDPOINT)).toString();
      } catch (_error) {
        return DEFAULT_ENDPOINT;
      }
    }

    function createRequestBody(item) {
      const source = item && typeof item === "object" ? item : {};
      const requestBody = {
        taskId: normalizeText(source.taskId),
        packageId: normalizeText(source.packageId),
        taskItemId: normalizeText(source.taskItemId),
        fileName: normalizeText(source.fileName),
        audioUrl: normalizeText(source.audioUrl),
        referenceText: normalizeText(source.referenceText),
        existingMarkText: normalizeText(source.existingMarkText || source.currentInputText),
        duration: source.duration,
        itemNumber: source.number,
        clientVersion: getClientVersion(),
        batchRunId: normalizeText(source.batchRunId),
        batchItemIndex: source.batchItemIndex,
        batchProcessKey: normalizeText(source.batchProcessKey),
        clientRequestId: normalizeText(source.clientRequestId),
        frontConcurrency: source.frontConcurrency,
      };

      if (config.recognitionMode) {
        requestBody.recognitionMode = normalizeText(config.recognitionMode);
      }
      if (config.modelMode) {
        requestBody.modelMode = normalizeText(config.modelMode);
        requestBody.pipelineMode = normalizeText(config.modelMode);
      } else if (config.recognitionMode) {
        requestBody.pipelineMode = normalizeText(config.recognitionMode);
      }
      if (config.recognitionStrategy) {
        requestBody.recognitionStrategy = normalizeText(config.recognitionStrategy);
      }
      if (config.listenModel) {
        requestBody.listenModel = normalizeText(config.listenModel);
      }
      if (config.compareModel) {
        requestBody.compareModel = normalizeText(config.compareModel);
      }
      if (config.singleModel) {
        requestBody.singleModel = normalizeText(config.singleModel);
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
      if (!source.taskId) {
        throw new Error("缺少 taskId，无法调用 AI 推荐。");
      }
      if (!source.packageId) {
        throw new Error("缺少 packageId，无法调用 AI 推荐。");
      }
      if (!source.taskItemId) {
        throw new Error("缺少 taskItemId，请重新点击条目后再试。");
      }
      if (!source.audioUrl) {
        throw new Error("缺少当前条音频地址，请重新点击当前条后再试。");
      }
      if (!normalizeText(source.referenceText)) {
        throw new Error("缺少平台参考文本。");
      }

      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, timeoutMs)
        : null;

      try {
        const response = await fetch(getEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createRequestBody(source)),
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

    return {
      recommend,
    };
  }

  globalThis.__ASREdgeAishellTechMinnanAiRecommendation = {
    DEFAULT_ENDPOINT,
    DEFAULT_TIMEOUT_MS,
    createRuntime,
  };
})();
