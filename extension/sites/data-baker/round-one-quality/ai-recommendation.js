(function () {
  const DEFAULT_ENDPOINT =
    "http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend";
  const DEFAULT_TIMEOUT_MS = 120000;

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
      };

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
          throw new Error(
            responseBody?.message ||
              "AI 推荐接口请求失败（HTTP " + String(response.status) + "）。"
          );
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
