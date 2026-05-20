(function () {
  const DEFAULT_ENDPOINT =
    "https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend";
  const DEFAULT_TIMEOUT_MS = 120000;

  function buildFriendlyErrorMessage(responseBody, status) {
    const code = String(responseBody?.code || "");
    if (code === "fun-asr-python-not-configured") {
      return "Fun-ASR Python 环境未配置，请在 platform-resources/backend/.venv 创建统一 Python 虚拟环境，并执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。";
    }
    if (code === "invalid-fun-asr-model") {
      return "Fun-ASR 模型名应为 fun-asr。";
    }
    if (code === "provider-queue-full") {
      return "后端 AI 排队已满，请稍后重试。";
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
    if (code === "timeout") {
      return "AI 分析超时，请稍后重试。";
    }
    return String(responseBody?.message || "AI 推荐接口请求失败（HTTP " + String(status) + "）。");
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
          throw new Error(buildFriendlyErrorMessage(responseBody, response.status));
        }
        return responseBody.data;
      } catch (error) {
        if (error?.name === "AbortError") {
          throw new Error("AI 推荐接口请求超时。");
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

  globalThis.__ASREdgeDataBakerRoundOneAiRecommendation = {
    DEFAULT_ENDPOINT,
    DEFAULT_TIMEOUT_MS,
    createRuntime,
    getAnnotatorName,
  };
})();
