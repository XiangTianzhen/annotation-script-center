(function () {
  const ANALYZE_PATH = "/api/abaka-ai/task21/ai/analyze";
  const DEFAULT_TIMEOUT_MS = 120000;
  const DEFAULT_MODEL = "qwen-vl-max-latest";

  function sanitizeText(value, maxLength) {
    return String(value || "")
      .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
      .replace(
        /(access_token|refresh_token|authorization|token|cookie|password|secret|signature|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
        "$1=[redacted]"
      )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength || 280);
  }

  function buildEndpoint(settingsOrMode) {
    const constants = globalThis.ASREdgeConstants || {};
    if (typeof constants.buildBackendUrl === "function") {
      return constants.buildBackendUrl(ANALYZE_PATH, settingsOrMode || {});
    }
    const base = "http://127.0.0.1:3333";
    return base + ANALYZE_PATH;
  }

  function normalizeModelName(value, fallback) {
    const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return String(fallback || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
    }
    return text.slice(0, 80);
  }

  function normalizeTimeoutMs(value, fallback) {
    const number = Number(value);
    const base = Number.isFinite(number) ? number : Number(fallback);
    const safe = Number.isFinite(base) ? base : DEFAULT_TIMEOUT_MS;
    return Math.max(1000, Math.min(300000, Math.floor(safe)));
  }

  function getAbakaAiTaskConfig(settings) {
    const constants = globalThis.ASREdgeConstants || {};
    const defaultConfig =
      constants.DEFAULT_SETTINGS?.platforms?.abakaAi?.scripts?.taskPageCapture || {};
    const currentConfig = settings?.platforms?.abakaAi?.scripts?.taskPageCapture || {};
    const modelOptions = Array.isArray(constants.ABAKA_AI_TASK21_AI_MODEL_OPTIONS)
      ? constants.ABAKA_AI_TASK21_AI_MODEL_OPTIONS
      : [{ value: DEFAULT_MODEL }];
    const allowedModels = modelOptions
      .map(function (item) {
        return String(item?.value || "").trim();
      })
      .filter(Boolean);
    const fallbackModel = normalizeModelName(defaultConfig.aiDebugModel, DEFAULT_MODEL);
    const mergedModel = normalizeModelName(currentConfig.aiDebugModel, fallbackModel);
    const model = allowedModels.indexOf(mergedModel) >= 0 ? mergedModel : fallbackModel;
    return {
      model: model,
      enableThinking: currentConfig.aiEnableThinking === true,
      timeoutMs: normalizeTimeoutMs(
        currentConfig.aiRequestTimeoutMs,
        normalizeTimeoutMs(defaultConfig.aiRequestTimeoutMs, DEFAULT_TIMEOUT_MS)
      ),
    };
  }

  function createTimeoutController(timeoutMs) {
    const safeTimeout = Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS);
    if (typeof AbortController !== "function") {
      return {
        signal: undefined,
        dispose: function () {},
      };
    }
    const controller = new AbortController();
    const timer = window.setTimeout(function () {
      controller.abort();
    }, safeTimeout);
    return {
      signal: controller.signal,
      dispose: function () {
        window.clearTimeout(timer);
      },
    };
  }

  function mapErrorMessage(statusCode, code, message) {
    const normalizedCode = String(code || "").trim();
    if (normalizedCode === "missing-api-key") {
      return "后端未配置 DASHSCOPE_API_KEY 或 mock 未开启。";
    }
    if (normalizedCode === "unsupported-target") {
      return "分析目标不支持，请刷新页面后重试。";
    }
    if (normalizedCode === "invalid-request") {
      return "请求参数无效，请检查页面采集是否完整。";
    }
    if (statusCode === 404) {
      return "AI 后端接口不存在，请确认已启动统一后端并拉取最新代码。";
    }
    if (statusCode >= 500) {
      return "AI 后端服务异常，请稍后重试。";
    }
    return sanitizeText(message || "AI 分析失败。", 220);
  }

  async function analyze(payload, options) {
    const config = options && typeof options === "object" ? options : {};
    const taskConfig = getAbakaAiTaskConfig(config.settings || {});
    const timeoutMs = normalizeTimeoutMs(config.timeoutMs, taskConfig.timeoutMs);
    const endpoint = buildEndpoint(config.settings || null);
    const controller = createTimeoutController(timeoutMs);
    const requestPayload = Object.assign({}, payload || {}, {
      options: {
        model: taskConfig.model,
        enableThinking: taskConfig.enableThinking === true,
        timeoutMs: timeoutMs,
      },
      debugConfig: {
        model: taskConfig.model,
        enableThinking: taskConfig.enableThinking === true,
        timeoutMs: timeoutMs,
      },
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      const text = await response.text();
      let body = null;
      try {
        body = JSON.parse(text || "{}");
      } catch (error) {
        body = null;
      }

      if (!response.ok || !body || body.success !== true) {
        const code = body && body.code ? body.code : "request-error";
        const error = new Error(mapErrorMessage(response.status, code, body && body.message));
        error.code = code;
        error.statusCode = response.status;
        error.requestId = body && body.requestId ? body.requestId : "";
        throw error;
      }

      return {
        endpoint: endpoint,
        data: body,
        requestDebug: {
          selectedModel: taskConfig.model,
          enableThinking: taskConfig.enableThinking === true,
          timeoutMs: timeoutMs,
        },
      };
    } catch (error) {
      if (error && error.name === "AbortError") {
        const timeoutError = new Error("AI 分析超时，请稍后重试。", { cause: error });
        timeoutError.code = "timeout";
        throw timeoutError;
      }
      if (error && error.code) {
        throw error;
      }
      throw new Error("AI 后端连接失败，请确认已启动 node platform-resources\\backend\\server.js。");
    } finally {
      controller.dispose();
    }
  }

  globalThis.__ASCEdgeAbakaAiTask21AiClient = {
    ANALYZE_PATH: ANALYZE_PATH,
    analyze: analyze,
    buildEndpoint: buildEndpoint,
    sanitizeText: sanitizeText,
  };
})();
