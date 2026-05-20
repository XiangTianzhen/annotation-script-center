(function () {
  const DEFAULT_ENDPOINT =
    "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend";
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_JOB_POLL_INTERVAL_MS = 1000;
  const DEFAULT_JOB_MAX_WAIT_MS = 300000;

  function createClientError(message, details) {
    const error = new Error(String(message || "请求失败。"));
    Object.assign(error, details || {});
    return error;
  }

  function buildFriendlyErrorMessage(responseBody, status) {
    const code = String(responseBody?.code || "");
    if (code === "fun-asr-python-not-configured") {
      return "Fun-ASR Python 环境未配置，请在 platform-resources/backend/.venv 创建统一 Python 虚拟环境，并执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。";
    }
    if (code === "invalid-fun-asr-model") {
      return "Fun-ASR 模型名应为 fun-asr。";
    }
    if (code === "provider-queue-full" || code === "ai-job-store-full") {
      return "后端 AI 任务队列已满，请稍后重试。";
    }
    if (code === "provider-rate-limited" || Number(responseBody?.providerStatus) === 429) {
      return "上游模型限流，后端已重试仍失败，请稍后重试。";
    }
    if (code === "fun-asr-forbidden" || Number(responseBody?.providerStatus) === 403) {
      return "Fun-ASR 调用被拒绝。可能是 DashScope 权限/地域未开通、API Key 无权限，或平台音频 URL 无法被 Fun-ASR 服务访问。可先切换到 qwen3.5-omni-plus 或 qwen3.5-omni-flash 恢复使用。";
    }
    if (code === "fun-asr-audio-url-unreachable") {
      return "Fun-ASR 调用被拒绝。当前更像是平台音频 URL 对模型服务不可访问。可先切换到 qwen3.5-omni-plus 或 qwen3.5-omni-flash 恢复使用。";
    }
    if (code === "ai-job-timeout") {
      return "当前任务超过60s，请重新请求。";
    }
    if (code === "timeout") {
      return "AI 分析超时，请稍后重试。";
    }
    if (code === "ai-job-not-found") {
      return "后端任务不存在或已过期，请重试。";
    }
    if (code === "ai-jobs-disabled") {
      return "当前后端未启用 Fun-ASR 异步任务接口。";
    }
    if (code === "model-json-parse-failed") {
      return "模型输出 JSON 解析失败，可复制原始JSON后反馈修复。";
    }
    return String(responseBody?.message || "AI 推荐接口请求失败（HTTP " + String(status) + "）。");
  }

  function buildFriendlyAsyncJobFetchErrorMessage() {
    return "后端连接中断，请稍后重试。";
  }

  function buildApiError(responseBody, status, fallbackMessage) {
    const normalizedBody = responseBody && typeof responseBody === "object" ? responseBody : {};
    return createClientError(buildFriendlyErrorMessage(normalizedBody, status), {
      code: String(normalizedBody.code || ""),
      status: Number(status) || 0,
      providerStatus: Number(normalizedBody.providerStatus) || 0,
      requestId: String(normalizedBody.requestId || normalizedBody.data?.requestId || ""),
      jobId: String(normalizedBody.jobId || ""),
      hasDebugRawJson: normalizedBody.hasDebugRawJson === true,
      debugRawJson: normalizedBody.debugRawJson || null,
      responseBody: normalizedBody,
      fallbackMessage: String(fallbackMessage || ""),
    });
  }

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
      rightMenu.querySelectorAll(".avatar-container.el-dropdown > .el-dropdown-selfdefine, .avatar-container.el-dropdown [role='button']")
    )
      .map(function (node) {
        return normalizeText(node.textContent || "");
      })
      .filter(function (text) {
        return text && text !== "帮助文档" && text !== "简体中文" && text !== "English";
      });

    return candidates.length > 0 ? candidates[candidates.length - 1].slice(0, 40) : "";
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

    function getJobsEndpoint() {
      try {
        const endpointUrl = new URL(getEndpoint());
        endpointUrl.pathname = endpointUrl.pathname.replace(/\/+$/, "") + "/jobs";
        endpointUrl.search = "";
        endpointUrl.hash = "";
        return endpointUrl.toString();
      } catch (error) {
        return DEFAULT_ENDPOINT.replace(/\/+$/, "") + "/jobs";
      }
    }

    function getJobDebugEndpoint(jobId) {
      return getJobsEndpoint().replace(/\/+$/, "") + "/" + encodeURIComponent(String(jobId || "").trim()) + "/debug";
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
        recognitionMode: String(config.recognitionMode || "").trim(),
        pipelineMode: String(config.pipelineMode || "").trim(),
      };
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

    function delay(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
      });
    }

    async function fetchJsonWithTimeout(
      url,
      requestOptions,
      timeoutMs,
      onAbortMessage,
      onNetworkErrorMessage
    ) {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS))
        : null;
      try {
        const response = await fetch(url, Object.assign({}, requestOptions || {}, {
          signal: controller ? controller.signal : undefined,
        }));
        const responseBody = await response.json().catch(function () {
          return null;
        });
        return {
          response: response,
          responseBody: responseBody,
        };
      } catch (error) {
        if (error?.name === "AbortError") {
          throw createClientError(onAbortMessage || "AI 推荐接口请求超时。", {
            code: "timeout",
          });
        }
        if (error instanceof TypeError) {
          throw createClientError(onNetworkErrorMessage || "后端连接中断，请稍后重试。", {
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

      const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
      const requestBody = createRequestBody(source);

      const result = await fetchJsonWithTimeout(
        getEndpoint(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        timeoutMs,
        "AI 推荐接口请求超时。",
        "后端连接中断，请稍后重试。"
      );
      const response = result.response;
      const responseBody = result.responseBody;
      if (!response.ok || responseBody?.success !== true || !responseBody?.data) {
        throw buildApiError(responseBody, response.status, "AI 推荐接口请求失败。", true);
      }
      return responseBody.data;
    }

    async function createRecommendJob(item) {
      const source = item && typeof item === "object" ? item : {};
      const requestBody = createRequestBody(source);
      const result = await fetchJsonWithTimeout(
        getJobsEndpoint(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        Math.min(30000, Math.max(10000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS)),
        "创建后端异步任务超时。",
        buildFriendlyAsyncJobFetchErrorMessage()
      );
      const response = result.response;
      const responseBody = result.responseBody;
      if (!response.ok || responseBody?.success !== true || !responseBody?.jobId) {
        throw buildApiError(responseBody, response.status, "创建后端异步任务失败。", true);
      }
      return {
        jobId: String(responseBody.jobId || ""),
        requestId: String(responseBody.requestId || ""),
        status: String(responseBody.status || "pending"),
      };
    }

    async function pollRecommendJob(jobId, options) {
      const runtimeOptions = options && typeof options === "object" ? options : {};
      const onJobUpdate =
        typeof runtimeOptions.onJobUpdate === "function" ? runtimeOptions.onJobUpdate : null;
      const pollIntervalMs = Math.max(
        200,
        Number(runtimeOptions.pollIntervalMs) || DEFAULT_JOB_POLL_INTERVAL_MS
      );
      const maxWaitMs = Math.max(
        Number(runtimeOptions.maxWaitMs) || 0,
        Math.max(Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS, DEFAULT_JOB_MAX_WAIT_MS)
      );
      const deadlineAt = Date.now() + maxWaitMs;
      while (Date.now() <= deadlineAt) {
        const result = await fetchJsonWithTimeout(
          getJobsEndpoint().replace(/\/+$/, "") + "/" + encodeURIComponent(String(jobId || "").trim()),
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
          Math.min(30000, maxWaitMs),
          "查询后端异步任务超时。",
          buildFriendlyAsyncJobFetchErrorMessage()
        );
        const response = result.response;
        const responseBody = result.responseBody;
        if (response.status === 404 || responseBody?.code === "ai-job-not-found") {
          throw createClientError("后端任务不存在或已过期，请重试。", {
            code: "ai-job-not-found",
            jobId: String(jobId || ""),
          });
        }
        if (!response.ok) {
          throw buildApiError(responseBody, response.status, "查询后端异步任务失败。", true);
        }
        const status = String(responseBody?.status || "").trim().toLowerCase();
        if (onJobUpdate) {
          onJobUpdate({
            jobId: String(jobId || ""),
            status: status || "pending",
            response: responseBody,
          });
        }
        if (status === "succeeded" && responseBody?.data) {
          return responseBody.data;
        }
        if (status === "failed") {
          throw buildApiError(Object.assign({}, responseBody, { jobId: String(jobId || "") }), response.status, "后端异步任务失败。", true);
        }
        await delay(pollIntervalMs);
      }
      throw createClientError("后端异步任务等待超时，请稍后重试。", {
        code: "timeout",
        jobId: String(jobId || ""),
      });
    }

    async function getRecommendJobDebug(jobId) {
      const normalizedJobId = String(jobId || "").trim();
      if (!normalizedJobId) {
        throw createClientError("缺少 jobId，无法获取原始 JSON。", {
          code: "ai-job-debug-not-found",
        });
      }
      const result = await fetchJsonWithTimeout(
        getJobDebugEndpoint(normalizedJobId),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
        15000,
        "读取原始 JSON 超时。",
        buildFriendlyAsyncJobFetchErrorMessage()
      );
      const response = result.response;
      const responseBody = result.responseBody;
      if (!response.ok || responseBody?.success !== true || !responseBody?.debug) {
        throw buildApiError(responseBody, response.status, "读取原始 JSON 失败。", true);
      }
      return responseBody.debug;
    }

    async function recommendAsync(item, options) {
      const runtimeOptions = options && typeof options === "object" ? options : {};
      const onJobUpdate =
        typeof runtimeOptions.onJobUpdate === "function" ? runtimeOptions.onJobUpdate : null;
      const createdJob = await createRecommendJob(item);
      if (onJobUpdate) {
        onJobUpdate({
          jobId: createdJob.jobId,
          status: createdJob.status || "pending",
          response: createdJob,
        });
      }
      return pollRecommendJob(createdJob.jobId, {
        onJobUpdate: onJobUpdate,
        pollIntervalMs: runtimeOptions.pollIntervalMs,
        maxWaitMs: runtimeOptions.maxWaitMs,
      });
    }

    return {
      recommend,
      recommendAsync,
      createRecommendJob,
      getRecommendJobDebug,
      pollRecommendJob,
    };
  }

  globalThis.__ASREdgeDataBakerRoundOneAiRecommendation = {
    DEFAULT_ENDPOINT,
    DEFAULT_JOB_MAX_WAIT_MS,
    DEFAULT_JOB_POLL_INTERVAL_MS,
    DEFAULT_TIMEOUT_MS,
    createRuntime,
    getAnnotatorName,
  };
})();
