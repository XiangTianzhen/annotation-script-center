(function () {
  "use strict";
  const API_PATH = "/api/shujiajia/luzhou-helper/ai/recommend";
  const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || {};
  function stageParams(settings, prefix) {
    const result = {};
    const fields = {
      Temperature: "temperature", TopP: "top_p", MaxTokens: "max_tokens",
      MaxCompletionTokens: "max_completion_tokens", PresencePenalty: "presence_penalty",
      FrequencyPenalty: "frequency_penalty", Seed: "seed", StopSequences: "stop",
    };
    Object.entries(fields).forEach(([suffix, key]) => {
      const value = settings?.[`aiRecommend${prefix}${suffix}`];
      if (value !== "" && value != null) result[key] = value;
    });
    return result;
  }
  function buildRequestPayload(options) {
    const settings = options?.settings || {};
    const payload = {
      audioDataUrl: String(options?.audioDataUrl || ""),
      requestId: String(options?.requestId || ""),
      timeoutMs: Math.min(60000, Math.max(1000, Number(settings.aiRecommendRequestTimeoutMs) || 60000)),
      aiStages: {
        listen: { model: settings.aiRecommendListenModel || "qwen3.5-omni-flash", prompt: settings.aiRecommendListenPrompt || "", params: stageParams(settings, "Listen") },
      },
    };
    return typeof aiUsageMeta.appendAiUsageRequestMeta === "function"
      ? aiUsageMeta.appendAiUsageRequestMeta(payload, { aiUsageOperatorName: options?.aiUsageOperatorName })
      : Object.assign(payload, { aiUsageOperatorName: String(options?.aiUsageOperatorName || "").trim().slice(0, 40) });
  }
  async function recognize(options) {
    const constants = globalThis.ASREdgeConstants || {};
    const storage = globalThis.ASREdgeStorage || {};
    const settingsRoot = options?.settingsRoot || await storage.getSettings?.() || {};
    const settings = options?.settings || settingsRoot.platforms?.shujiajia?.scripts?.luzhouHelper || {};
    const requestMeta = typeof aiUsageMeta.buildAiUsageRequestMeta === "function"
      ? aiUsageMeta.buildAiUsageRequestMeta({ settings: settingsRoot })
      : { aiUsageOperatorName: String(settingsRoot?.meta?.aiUsageOperatorName || "").trim().slice(0, 40) };
    if (typeof aiUsageMeta.assertAiUsageOperatorConfigured === "function") {
      aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);
    } else if (!requestMeta.aiUsageOperatorName) {
      const error = new Error("请先在 options 首页填写 AI 调用使用人。");
      error.code = "missing-ai-usage-operator-name";
      throw error;
    }
    const endpoint = typeof constants.buildBackendUrl === "function"
      ? constants.buildBackendUrl(API_PATH, settingsRoot)
      : API_PATH;
    const response = await (options?.fetchImpl || globalThis.fetch)(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestPayload({
        audioDataUrl: options?.audioDataUrl,
        requestId: options?.requestId,
        settings,
        aiUsageOperatorName: requestMeta.aiUsageOperatorName,
      })),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success !== true) {
      const error = new Error(String(body.message || "泸州话 AI 识别失败。"));
      error.code = String(body.code || "recommend-request-failed");
      error.requestId = String(body.requestId || "");
      throw error;
    }
    return body.data && typeof body.data === "object" ? body.data : body;
  }
  const api = { API_PATH, buildRequestPayload, recognize };
  globalThis.__ASREdgeShujiajiaAiRecommendation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
