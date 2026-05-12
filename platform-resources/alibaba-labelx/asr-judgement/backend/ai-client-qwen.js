"use strict";

const AVAILABLE_MODELS = ["qwen3-omni-flash", "qwen3.5-omni-plus"];
const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen3-omni-flash";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isMockEnabled() {
  return String(process.env.ASR_JUDGEMENT_AI_MOCK || "").trim() === "1";
}

function isAllowedModel(model) {
  const value = String(model || "").trim();
  return AVAILABLE_MODELS.indexOf(value) >= 0;
}

function resolveDefaultModel(model) {
  const value = String(model || "").trim();
  if (isAllowedModel(value)) {
    return value;
  }
  return DEFAULT_MODEL;
}

function resolveRequestModel(requestedModel, defaultModel) {
  const text = String(requestedModel || "").trim();
  if (!text) {
    return {
      model: resolveDefaultModel(defaultModel),
      source: "default",
      valid: true,
    };
  }

  if (!isAllowedModel(text)) {
    return {
      model: text,
      source: "request",
      valid: false,
    };
  }

  return {
    model: text,
    source: "request",
    valid: true,
  };
}

function parseEnableThinking() {
  const value = String(process.env.ASR_JUDGEMENT_AI_ENABLE_THINKING || "0")
    .trim()
    .toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function inferAudioFormat(audioUrl) {
  let pathname = "";
  try {
    pathname = new URL(String(audioUrl || "")).pathname || "";
  } catch (error) {
    pathname = String(audioUrl || "").split("?")[0] || "";
  }

  const lowerPathname = pathname.toLowerCase();
  const matched = lowerPathname.match(/\.([a-z0-9]+)$/);
  const ext = matched ? matched[1] : "";
  const supportedFormats = {
    wav: "wav",
    mp3: "mp3",
    aac: "aac",
    m4a: "m4a",
    amr: "amr",
    "3gp": "3gp",
    "3gpp": "3gpp",
  };

  return supportedFormats[ext] || "wav";
}

function getClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL);
  const configuredDefaultModel = String(process.env.ASR_JUDGEMENT_AI_MODEL || "").trim();
  const effectiveDefaultModel = resolveDefaultModel(configuredDefaultModel || DEFAULT_MODEL);
  return {
    apiKey,
    baseUrl,
    configuredDefaultModel,
    effectiveDefaultModel,
    defaultModel: effectiveDefaultModel,
    availableModels: AVAILABLE_MODELS.slice(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    enableThinking: parseEnableThinking(),
  };
}

function buildMockResponse(input, model) {
  const firstLength = String(input?.asrText1 || "").length;
  const secondLength = String(input?.asrText2 || "").length;
  const answer = firstLength >= secondLength ? "first_better" : "second_better";
  return JSON.stringify({
    answer,
    answerText: answer === "first_better" ? "第一个更好" : "第二个更好",
    confidence: 0.72,
    reasonSummary: "Mock 模式：按文本长度给出示例建议，仅用于调试。",
    riskLevel: "medium",
    needManualSearch: false,
    shouldWarnBeforeApply: false,
    model: model,
  });
}

function sanitizeProviderErrorSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, function (matchText) {
      try {
        const parsedUrl = new URL(matchText);
        return parsedUrl.protocol + "//" + parsedUrl.host + "/[redacted]";
      } catch (error) {
        return "[url-redacted]";
      }
    })
    .replace(/(access_token["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(refresh_token["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(token["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(cookie["'\s:=]+)([^\n\r]+)/gi, "$1[redacted]")
    .replace(/(authorization["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(ossaccesskeyid["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(signature["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/(api[_-]?key["'\s:=]+)([^\s"',}]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function extractTextFromContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  return content
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

function extractCompletionText(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (!choice) {
    return "";
  }

  const deltaText = extractTextFromContent(choice?.delta?.content);
  if (deltaText) {
    return deltaText;
  }

  const messageText = extractTextFromContent(choice?.message?.content);
  if (messageText) {
    return messageText;
  }

  return "";
}

async function readStreamCompletion(response, options) {
  const startedAtMs = Number(options?.startedAtMs) || Date.now();
  let aggregatedText = "";
  let usage = {};
  let firstChunkAtMs = 0;
  let chunkCount = 0;

  function applyPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return;
    }
    chunkCount += 1;
    const chunkText = extractCompletionText(payload);
    if (chunkText) {
      aggregatedText += chunkText;
      if (firstChunkAtMs <= 0) {
        firstChunkAtMs = Math.max(0, Date.now() - startedAtMs);
      }
    }
    if (payload.usage && typeof payload.usage === "object") {
      usage = payload.usage;
    }
  }

  if (!response.body || typeof response.body.getReader !== "function") {
    const rawText = await response.text();
    try {
      const parsed = JSON.parse(rawText);
      applyPayload(parsed);
      if (!aggregatedText) {
        aggregatedText = extractTextFromContent(parsed?.output_text) || "";
      }
    } catch (error) {
      aggregatedText = rawText;
    }

    return {
      text: aggregatedText,
      usage,
      firstChunkAtMs,
      chunkCount,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf8");
  let buffer = "";

  function consumeLine(line) {
    const trimmed = String(line || "").trim();
    if (!trimmed || !trimmed.startsWith("data:")) {
      return;
    }

    const payloadText = trimmed.slice(5).trim();
    if (!payloadText || payloadText === "[DONE]") {
      return;
    }

    try {
      const payload = JSON.parse(payloadText);
      applyPayload(payload);
    } catch (error) {
      // ignore non-json data lines
    }
  }

  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    lines.forEach(consumeLine);
  }

  buffer += decoder.decode();
  buffer.split(/\r?\n/).forEach(consumeLine);

  return {
    text: aggregatedText,
    usage,
    firstChunkAtMs,
    chunkCount,
  };
}

function isEnableThinkingUnsupportedError(error) {
  if (!error || error.code !== "provider-http-error") {
    return false;
  }

  const summary = String(error.summary || error.message || "").toLowerCase();
  return (
    summary.indexOf("enable_thinking") >= 0 ||
    (summary.indexOf("unsupported") >= 0 && summary.indexOf("parameter") >= 0) ||
    (summary.indexOf("invalid") >= 0 && summary.indexOf("parameter") >= 0)
  );
}

function createRequestBody(input, prompt, model, enableThinking) {
  return {
    model,
    stream: true,
    stream_options: {
      include_usage: true,
    },
    modalities: ["text"],
    messages: [
      {
        role: "system",
        content: String(prompt?.systemPrompt || ""),
      },
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: String(input?.audioUrl || ""),
              format: inferAudioFormat(input?.audioUrl || ""),
            },
          },
          {
            type: "text",
            text: String(prompt?.userPrompt || ""),
          },
        ],
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.1,
    enable_thinking: enableThinking === true,
  };
}

async function requestChatCompletion(config, requestBody, options) {
  if (typeof fetch !== "function") {
    throw new Error("当前 Node 运行时不支持 fetch。");
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || 120000);
  const timer = controller
    ? setTimeout(function () {
        controller.abort();
      }, timeoutMs)
    : null;

  const endpoint = config.baseUrl + "/chat/completions";
  const providerRequestStartedAt = Date.now();

  console.info("[ASR Judgement][ai] provider request start", {
    requestId: String(options?.requestId || ""),
    hostname: String(options?.hostname || ""),
    itemIndex: Number(options?.itemIndex || 0),
    model: String(options?.model || ""),
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller ? controller.signal : undefined,
    });

    const providerStatus = Number(response.status) || 0;
    console.info("[ASR Judgement][ai] provider response", {
      requestId: String(options?.requestId || ""),
      hostname: String(options?.hostname || ""),
      itemIndex: Number(options?.itemIndex || 0),
      model: String(options?.model || ""),
      providerStatus,
      durationMs: Math.max(0, Date.now() - providerRequestStartedAt),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      const providerError = new Error(
        "Qwen 接口请求失败（HTTP " + String(response.status) + "）。"
      );
      providerError.code = "provider-http-error";
      providerError.statusCode = response.status;
      providerError.providerStatus = response.status;
      providerError.summary = sanitizeProviderErrorSummary(bodyText);
      throw providerError;
    }

    const completion = await readStreamCompletion(response, {
      startedAtMs: providerRequestStartedAt,
    });
    const text = String(completion.text || "");
    if (!text.trim()) {
      const emptyError = new Error("Qwen 接口未返回有效文本。");
      emptyError.code = "empty-provider-response";
      emptyError.statusCode = 502;
      throw emptyError;
    }

    console.info("[ASR Judgement][ai] provider stream complete", {
      requestId: String(options?.requestId || ""),
      hostname: String(options?.hostname || ""),
      itemIndex: Number(options?.itemIndex || 0),
      model: String(options?.model || ""),
      providerStatus,
      chunkCount: Number(completion.chunkCount || 0),
      rawTextLength: text.length,
      usage: completion.usage || {},
      durationMs: Math.max(0, Date.now() - providerRequestStartedAt),
    });

    return {
      text,
      usage: completion.usage || {},
      firstChunkAtMs: Number(completion.firstChunkAtMs || 0),
      chunkCount: Number(completion.chunkCount || 0),
      providerStatus,
      durationMs: Math.max(0, Date.now() - providerRequestStartedAt),
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Qwen 请求超时。",
      );
      timeoutError.code = "timeout";
      timeoutError.statusCode = 504;
      timeoutError.summary = "provider request aborted by timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function requestSuggestion(input, prompt, options) {
  const config = getClientConfig();
  const modelResult = resolveRequestModel(options?.model, config.defaultModel);
  if (!modelResult.valid) {
    const invalidModelError = new Error("invalid-model");
    invalidModelError.code = "invalid-model";
    invalidModelError.statusCode = 400;
    throw invalidModelError;
  }
  const model = modelResult.model;

  if (config.mockEnabled) {
    return {
      provider: "dashscope-qwen",
      model,
      rawText: buildMockResponse(input, model),
      mock: true,
      usage: {},
      chunkCount: 0,
      firstChunkAtMs: 0,
      providerStatus: 200,
      durationMs: 0,
      thinkingRequested: true,
      enableThinking: config.enableThinking,
      thinkingFallbackUsed: false,
      thinkingFallbackMode: "",
    };
  }

  if (!config.apiKey) {
    const error = new Error("missing-api-key");
    error.code = "missing-api-key";
    error.statusCode = 503;
    throw error;
  }

  const requestBody = createRequestBody(input, prompt, model, config.enableThinking);

  try {
    const completion = await requestChatCompletion(config, requestBody, {
      requestId: options?.requestId,
      hostname: options?.hostname,
      itemIndex: options?.itemIndex,
      model,
      timeoutMs: options?.timeoutMs,
    });

    return {
      provider: "dashscope-qwen",
      model,
      rawText: completion.text,
      usage: completion.usage,
      chunkCount: completion.chunkCount,
      firstChunkAtMs: completion.firstChunkAtMs,
      providerStatus: completion.providerStatus,
      durationMs: completion.durationMs,
      mock: false,
      thinkingRequested: true,
      enableThinking: config.enableThinking,
      thinkingFallbackUsed: false,
      thinkingFallbackMode: "",
    };
  } catch (error) {
    if (!isEnableThinkingUnsupportedError(error)) {
      throw error;
    }

    const fallbackBody = Object.assign({}, requestBody);
    delete fallbackBody.enable_thinking;

    const completion = await requestChatCompletion(config, fallbackBody, {
      requestId: options?.requestId,
      hostname: options?.hostname,
      itemIndex: options?.itemIndex,
      model,
      timeoutMs: options?.timeoutMs,
    });

    return {
      provider: "dashscope-qwen",
      model,
      rawText: completion.text,
      usage: completion.usage,
      chunkCount: completion.chunkCount,
      firstChunkAtMs: completion.firstChunkAtMs,
      providerStatus: completion.providerStatus,
      durationMs: completion.durationMs,
      mock: false,
      thinkingRequested: true,
      enableThinking: config.enableThinking,
      thinkingFallbackUsed: true,
      thinkingFallbackMode: "remove",
    };
  }
}

module.exports = {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  buildMockResponse,
  getClientConfig,
  inferAudioFormat,
  isAllowedModel,
  isEnableThinkingUnsupportedError,
  isMockEnabled,
  readStreamCompletion,
  resolveDefaultModel,
  resolveRequestModel,
  requestSuggestion,
};
