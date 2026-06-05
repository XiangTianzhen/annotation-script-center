(function () {
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_PATH = "/api/data-baker-cvpc/liuzhou-helper/ai/recommend";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};

    async function recommend(context) {
      const source = context && typeof context === "object" ? context : {};
      if (!normalizeText(source.audioUrl)) {
        throw new Error("缺少当前音频 audioUrl。");
      }
      const endpoint = normalizeText(config.endpoint) || DEFAULT_PATH;
      const body = {
        audioUrl: source.audioUrl,
        startMs: source.startMs,
        endMs: source.endMs,
        fieldContext: source.fieldContext || {},
        editorContext: source.editorContext || {},
        aiUsageOperatorName: normalizeText(config.aiUsageOperatorName),
        platformUserName: normalizeText(source.platformUserName),
        platformUserId: normalizeText(source.platformUserId),
        timeoutMs: Number(config.timeoutMs || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
      };
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, body.timeoutMs)
        : null;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller ? controller.signal : undefined,
        });
        const payload = await response.json().catch(function () {
          return null;
        });
        if (!response.ok || !payload || payload.success !== true) {
          throw new Error(payload?.message || "柳州话 AI 推荐失败。");
        }
        return payload;
      } finally {
        if (timer) {
          window.clearTimeout(timer);
        }
      }
    }

    return {
      recommend,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouAiRecommendation = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
