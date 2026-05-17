"use strict";

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen-vl-max-latest";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function parseBooleanEnv(name, fallback) {
  const value = String(process.env[name] || "").trim().toLowerCase();
  if (!value) {
    return fallback === true;
  }
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function parseTimeoutMs() {
  const value = Number(process.env.ABAKA_TASK21_AI_TIMEOUT_MS || 120000);
  if (!Number.isFinite(value)) {
    return 120000;
  }
  return Math.max(1000, Math.min(300000, value));
}

function sanitizeModelName(value, fallback) {
  const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (!text) {
    return String(fallback || "").trim();
  }
  return text.slice(0, 80);
}

function getClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const model = sanitizeModelName(process.env.ABAKA_TASK21_AI_MODEL, DEFAULT_MODEL) || DEFAULT_MODEL;
  return {
    apiKey,
    baseUrl: trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL),
    model,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: parseBooleanEnv("ABAKA_TASK21_AI_MOCK", false),
    allowClientModelOverride: parseBooleanEnv("ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE", false),
    hasApiKey: Boolean(apiKey),
  };
}

function sanitizeProviderErrorSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, function (inputUrl) {
      try {
        const parsed = new URL(inputUrl);
        return parsed.protocol + "//" + parsed.host + "/[redacted]";
      } catch (error) {
        return "[url-redacted]";
      }
    })
    .replace(
      /(access_token|refresh_token|authorization|token|cookie|password|secret|signature|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[redacted]"
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function extractChoiceText(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (!choice) {
    return "";
  }
  const messageContent = choice?.message?.content;
  if (typeof messageContent === "string") {
    return messageContent;
  }
  if (Array.isArray(messageContent)) {
    return messageContent
      .map(function (part) {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  const text = choice?.text;
  return typeof text === "string" ? text : "";
}

function buildImageContent(images) {
  const source = Array.isArray(images) ? images : [];
  const result = [];
  source.forEach(function (item) {
    const url = String(item?.dataUrl || item?.imageUrl || "").trim();
    if (!url) {
      return;
    }
    result.push({
      type: "image_url",
      image_url: {
        url,
      },
    });
  });
  return result;
}

function buildMockResult(target) {
  const normalizedTarget = String(target || "overall");
  return {
    target: normalizedTarget,
    same_font: {
      applicable: true,
      value: normalizedTarget === "image_b_texts_removed" || normalizedTarget === "other_changes" ? "not_applicable" : "true",
      confidence: 0.62,
      reason_cn: "mock 模式返回：用于调试面板渲染。",
      evidence: ["mock evidence"],
      warnings: ["mock-response"],
    },
    image_b_texts_removed: {
      applicable: normalizedTarget !== "same_font",
      value_type: normalizedTarget === "same_font" ? "not_applicable" : "blank",
      value: "",
      lines: [],
      segment_count: 0,
      reason_cn: "mock 模式返回。",
      evidence: [],
      warnings: [],
    },
    other_changes: {
      applicable: normalizedTarget !== "same_font",
      value_type: normalizedTarget === "same_font" ? "not_applicable" : "blank",
      value: "",
      word_count: 0,
      reason_cn: "mock 模式返回。",
      evidence: [],
      warnings: [],
    },
    workflow: {
      skip_later_fields: false,
      skip_reason: "",
    },
  };
}

async function requestChatCompletion(requestBody, options) {
  const config = getClientConfig();
  if (!config.hasApiKey) {
    const missingApiKeyError = new Error("missing-api-key");
    missingApiKeyError.code = "missing-api-key";
    missingApiKeyError.statusCode = 503;
    throw missingApiKeyError;
  }
  if (typeof fetch !== "function") {
    throw new Error("当前 Node 运行时不支持 fetch。");
  }

  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(function () {
        controller.abort();
      }, timeoutMs)
    : null;

  try {
    const response = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller ? controller.signal : undefined,
    });
    const rawText = await response.text();

    if (!response.ok) {
      const providerError = new Error("DashScope 视觉分析请求失败（HTTP " + String(response.status) + "）。");
      providerError.code = "provider-http-error";
      providerError.statusCode = response.status;
      providerError.summary = sanitizeProviderErrorSummary(rawText);
      throw providerError;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText || "{}");
    } catch (error) {
      parsed = null;
    }
    if (!parsed) {
      const invalidJsonError = new Error("provider-invalid-json");
      invalidJsonError.code = "provider-invalid-json";
      throw invalidJsonError;
    }

    return {
      model: String(parsed.model || requestBody.model || ""),
      rawText: extractChoiceText(parsed),
      usage: parsed.usage || {},
      rawResponse: parsed,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("DashScope 请求超时。", { cause: error });
      timeoutError.code = "timeout";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function analyzeTask21(input, prompts, options) {
  const payload = input && typeof input === "object" ? input : {};
  const promptConfig = prompts && typeof prompts === "object" ? prompts : {};
  const runtimeOptions = options && typeof options === "object" ? options : {};
  const config = getClientConfig();
  const requestModel = sanitizeModelName(runtimeOptions.modelOverride, "");
  const model = config.allowClientModelOverride && requestModel ? requestModel : config.model;

  if (config.mockEnabled) {
    return {
      mock: true,
      model,
      rawText: JSON.stringify(buildMockResult(payload.target), null, 2),
      usage: {
        inputTokens: 420,
        outputTokens: 180,
        totalTokens: 600,
        source: "provider",
      },
      rawResponse: {
        mock: true,
      },
    };
  }

  const imageContent = buildImageContent(payload.images);
  const requestBody = {
    model,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: String(promptConfig.systemPrompt || ""),
      },
      {
        role: "user",
        content: imageContent.concat([
          {
            type: "text",
            text: String(promptConfig.userPrompt || ""),
          },
        ]),
      },
    ],
    temperature: 0,
    top_p: 0.1,
    max_tokens: 1800,
  };

  return requestChatCompletion(requestBody, {
    timeoutMs: runtimeOptions.timeoutMs,
  });
}

module.exports = {
  DEFAULT_MODEL,
  getClientConfig,
  analyzeTask21,
  sanitizeModelName,
};
