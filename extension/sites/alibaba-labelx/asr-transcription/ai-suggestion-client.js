(function () {
  const API_PATH = "/api/alibaba-labelx/asr-transcription/ai/suggest-current";
  const DEFAULT_TIMEOUT_MS = 60000;
  const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:3333";
  const DEFAULT_SERVER_BASE_URL = "https://script.xiangtianzhen.store";

  function sanitizeMessage(value, maxLength) {
    return String(value || "")
      .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
      .replace(/(ossaccesskeyid|signature|token|authorization|cookie|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength || 240);
  }

  function normalizeBaseUrl(value, fallback) {
    try {
      const url = new URL(String(value || "").trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return fallback;
      }
      return url.origin;
    } catch (error) {
      return fallback;
    }
  }

  function getClientVersion() {
    try {
      const manifest = chrome?.runtime?.getManifest ? chrome.runtime.getManifest() : null;
      return String(manifest?.version || "0.3.0");
    } catch (error) {
      return "0.3.0";
    }
  }

  async function resolveBackendConfig() {
    const constants = globalThis.ASREdgeConstants || {};
    const storage = globalThis.ASREdgeStorage || {};
    let settings = null;
    try {
      if (typeof storage.getSettings === "function") {
        settings = await storage.getSettings();
      }
    } catch (error) {
      settings = null;
    }

    const localMode = constants.BACKEND_ENDPOINT_MODE_LOCAL || "local";
    const serverMode = constants.BACKEND_ENDPOINT_MODE_SERVER || "server";
    const mode = typeof constants.getBackendEndpointModeFromSettings === "function"
      ? constants.getBackendEndpointModeFromSettings(settings || {})
      : String(settings?.meta?.backendEndpointMode || "").trim().toLowerCase() === localMode
        ? localMode
        : serverMode;

    const baseUrl =
      typeof constants.getBackendBaseUrlByMode === "function"
        ? constants.getBackendBaseUrlByMode(mode)
        : mode === localMode
          ? DEFAULT_LOCAL_BASE_URL
          : DEFAULT_SERVER_BASE_URL;

    const normalizedBaseUrl = normalizeBaseUrl(
      baseUrl,
      mode === localMode ? DEFAULT_LOCAL_BASE_URL : DEFAULT_SERVER_BASE_URL
    );

    const endpoint =
      typeof constants.buildBackendUrl === "function"
        ? constants.buildBackendUrl(API_PATH, mode)
        : normalizedBaseUrl.replace(/\/+$/, "") + API_PATH;

    return {
      mode,
      baseUrl: normalizedBaseUrl,
      endpoint,
    };
  }

  function mapErrorMessage(code, message, summary, statusCode) {
    const mappedCode = String(code || "").trim();
    if (mappedCode === "request-error" && Number(statusCode) === 404) {
      return "转写 AI 后端接口不存在，请确认后端已启动并包含最新路由。";
    }
    if (mappedCode === "missing-api-key") {
      return "后端未读取到 DASHSCOPE_API_KEY，请检查 config/env/ai.env 或环境变量。";
    }
    if (mappedCode === "invalid-audio-url") {
      return "当前题音频 URL 无效，请先播放一次音频后重试。";
    }
    if (mappedCode === "empty-provider-response") {
      return "Qwen 未返回有效文本，请稍后重试。";
    }
    if (mappedCode) {
      const detail = sanitizeMessage(message || "", 180);
      const extra = sanitizeMessage(summary || "", 120);
      return mappedCode + (detail ? "：" + detail : "") + (extra ? "（" + extra + "）" : "");
    }
    return sanitizeMessage(message || "AI 推荐调用失败。", 220);
  }

  async function suggestCurrent(payload, options) {
    const config = options && typeof options === "object" ? options : {};
    const backend = await resolveBackendConfig();
    const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, timeoutMs)
      : null;

    const requestBody = Object.assign({}, payload || {}, {
      clientVersion: payload?.clientVersion || getClientVersion(),
    });

    try {
      const response = await fetch(backend.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller ? controller.signal : undefined,
      });

      const responseText = await response.text();
      let json = null;
      try {
        json = JSON.parse(responseText || "{}");
      } catch (error) {
        json = null;
      }

      if (!response.ok || !json || json.success !== true || !json.data) {
        const code = json?.code || (response.status >= 500 ? "provider-http-error" : "request-error");
        const message = mapErrorMessage(
          code,
          json?.message || "AI 推荐失败。",
          json?.summary || "",
          response.status
        );
        const error = new Error(message);
        error.code = code;
        error.requestId = json?.requestId || "";
        throw error;
      }

      return {
        backend,
        data: json.data,
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("AI 后端请求超时，请稍后重试。");
      }
      if (error?.code) {
        throw error;
      }
      throw new Error("AI 后端连接失败，请确认已启动 node platform-resources\\backend\\server.js。");
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionAiSuggestionClient = {
    API_PATH,
    getClientVersion,
    resolveBackendConfig,
    suggestCurrent,
  };
})();
