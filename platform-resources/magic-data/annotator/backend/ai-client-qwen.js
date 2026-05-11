"use strict";

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_LISTEN_MODEL = "qwen3.5-omni-flash";
const DEFAULT_COMPARE_MODEL = "qwen3.5-plus";

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isMockEnabled() {
  return String(process.env.MAGIC_DATA_AI_MOCK || "0").trim() === "1";
}

function shouldDisableThinking() {
  return String(process.env.MAGIC_DATA_AI_ENABLE_THINKING || "0").trim() !== "1";
}

function withThinkingDisabled(requestBody) {
  if (!shouldDisableThinking()) {
    return requestBody;
  }
  return Object.assign({}, requestBody, {
    enable_thinking: false,
  });
}

function withoutThinkingDisabled(requestBody) {
  const nextBody = Object.assign({}, requestBody || {});
  delete nextBody.enable_thinking;
  return nextBody;
}

function parseTimeoutMs() {
  const value = Number(process.env.MAGIC_DATA_AI_TIMEOUT_MS || 120000);
  if (!Number.isFinite(value)) {
    return 120000;
  }
  return Math.max(1000, Math.min(300000, value));
}

function parseBooleanEnv(name, fallback) {
  const value = String(process.env[name] || "").trim().toLowerCase();
  if (!value) {
    return fallback === true;
  }
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function sanitizeModelName(value, fallback) {
  const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (!text) {
    return String(fallback || "").trim();
  }
  return text.slice(0, 80);
}

function inferAudioFormat(audioUrl) {
  let pathname = "";
  try {
    pathname = new URL(String(audioUrl || "")).pathname || "";
  } catch (error) {
    pathname = String(audioUrl || "").split("?")[0] || "";
  }
  const matched = pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = matched ? matched[1] : "";
  const map = {
    wav: "wav",
    mp3: "mp3",
    aac: "aac",
    m4a: "m4a",
    amr: "amr",
    "3gp": "3gp",
    "3gpp": "3gpp",
  };
  return map[ext] || "wav";
}

function getClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL);
  const listenModel = sanitizeModelName(process.env.MAGIC_DATA_AI_LISTEN_MODEL, DEFAULT_LISTEN_MODEL);
  const compareModel = sanitizeModelName(process.env.MAGIC_DATA_AI_COMPARE_MODEL, DEFAULT_COMPARE_MODEL);
  const pipelineMode = String(process.env.MAGIC_DATA_AI_PIPELINE_MODE || "two_stage").trim();
  const lexiconRewriteMode = String(process.env.MAGIC_DATA_AI_LEXICON_REWRITE_MODE || "off").trim();
  const allowClientModelOverride = parseBooleanEnv("MAGIC_DATA_AI_ALLOW_CLIENT_MODEL_OVERRIDE", true);
  return {
    apiKey,
    baseUrl,
    listenModel: listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: compareModel || DEFAULT_COMPARE_MODEL,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    pipelineMode: pipelineMode === "listen_only" ? "listen_only" : "two_stage",
    lexiconRewriteMode: lexiconRewriteMode || "off",
    allowClientModelOverride,
  };
}

function sanitizeProviderErrorSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, function (urlText) {
      try {
        const parsedUrl = new URL(urlText);
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

function extractDeltaText(chunk) {
  const choice = Array.isArray(chunk?.choices) ? chunk.choices[0] : null;
  if (!choice) {
    return "";
  }

  const deltaContent = choice?.delta?.content;
  if (typeof deltaContent === "string") {
    return deltaContent;
  }
  if (Array.isArray(deltaContent)) {
    return deltaContent
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
  return "";
}

async function readStreamCompletion(response) {
  if (!response.body || typeof response.body.getReader !== "function") {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      return {
        text: extractDeltaText(parsed) || text,
        usage: parsed.usage || {},
      };
    } catch (error) {
      return {
        text,
        usage: {},
      };
    }
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf8");
  let buffer = "";
  let aggregatedText = "";
  let usage = {};

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
      aggregatedText += extractDeltaText(payload);
      if (payload.usage && typeof payload.usage === "object") {
        usage = payload.usage;
      }
    } catch (error) {
      // ignore malformed data line
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
  };
}

async function requestChatCompletion(requestBody, options) {
  const config = getClientConfig();
  if (!config.apiKey) {
    const missingKeyError = new Error("missing-api-key");
    missingKeyError.code = "missing-api-key";
    missingKeyError.statusCode = 503;
    throw missingKeyError;
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

    if (!response.ok) {
      const bodyText = await response.text();
      const providerError = new Error(
        "Qwen 接口请求失败（HTTP " + String(response.status) + "）。"
      );
      providerError.code = "provider-http-error";
      providerError.statusCode = response.status;
      providerError.summary = sanitizeProviderErrorSummary(bodyText);
      throw providerError;
    }

    const result = await readStreamCompletion(response);
    if (!String(result.text || "").trim()) {
      const emptyError = new Error("Qwen 接口未返回有效文本。");
      emptyError.code = "empty-provider-response";
      throw emptyError;
    }
    return result;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Qwen 请求超时。");
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

async function requestChatCompletionWithFallback(requestBody, options) {
  const thinkingDisabledRequested = shouldDisableThinking();
  const initialBody = thinkingDisabledRequested ? withThinkingDisabled(requestBody) : requestBody;
  try {
    const result = await requestChatCompletion(initialBody, options);
    return Object.assign({}, result, {
      thinkingDisabledRequested,
      thinkingDisableFallbackUsed: false,
    });
  } catch (error) {
    if (!thinkingDisabledRequested || !isEnableThinkingUnsupportedError(error)) {
      throw error;
    }
    const fallbackResult = await requestChatCompletion(withoutThinkingDisabled(initialBody), options);
    return Object.assign({}, fallbackResult, {
      thinkingDisabledRequested,
      thinkingDisableFallbackUsed: true,
    });
  }
}

function buildMockListenResponse(input) {
  return JSON.stringify({
    heardDialectText: String(input?.platformDialectText || "").trim() || "mock 听音文本",
    heardMandarinMeaning: String(input?.platformMandarinText || "").trim() || "mock 普通话意思",
    isValidAudio: true,
    invalidReasons: [],
    riskFlags: [],
    confidence: 0.82,
  });
}

function buildMockCompareResponse(input) {
  const dialectText = String(input?.platformDialectText || "").trim();
  const mandarinText = String(input?.platformMandarinText || "").trim();
  return JSON.stringify({
    verdict: "mostly_same",
    shouldReview: true,
    confidence: 0.78,
    dialectLine: {
      decision: "minor_diff",
      platformText: dialectText,
      aiText: dialectText,
      recommendedText: dialectText,
      issues: [],
    },
    mandarinLine: {
      decision: "same",
      platformText: mandarinText,
      recommendedText: mandarinText,
      issues: [],
    },
    lexiconIssues: [],
    ruleIssues: [],
  });
}

async function requestListen(input, prompt, options) {
  const config = getClientConfig();
  const model = sanitizeModelName(options?.model, config.listenModel || DEFAULT_LISTEN_MODEL);
  if (config.mockEnabled) {
    return {
      model,
      rawText: buildMockListenResponse(input),
      usage: {
        prompt_tokens: 160,
        completion_tokens: 80,
        total_tokens: 240,
      },
      mock: true,
      thinkingDisabledRequested: shouldDisableThinking(),
      thinkingDisableFallbackUsed: false,
    };
  }

  const requestBody = {
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
    temperature: 0.1,
  };
  const result = await requestChatCompletionWithFallback(requestBody, options);
  return {
    model,
    rawText: result.text,
    usage: result.usage,
    mock: false,
    thinkingDisabledRequested: result.thinkingDisabledRequested,
    thinkingDisableFallbackUsed: result.thinkingDisableFallbackUsed,
  };
}

async function requestCompare(input, prompt, options) {
  const config = getClientConfig();
  const model = sanitizeModelName(options?.model, config.compareModel || DEFAULT_COMPARE_MODEL);
  if (config.mockEnabled) {
    return {
      model,
      rawText: buildMockCompareResponse(input),
      usage: {
        prompt_tokens: 220,
        completion_tokens: 90,
        total_tokens: 310,
      },
      mock: true,
      thinkingDisabledRequested: shouldDisableThinking(),
      thinkingDisableFallbackUsed: false,
    };
  }

  const requestBody = {
    model,
    stream: true,
    stream_options: {
      include_usage: true,
    },
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: String(prompt?.systemPrompt || ""),
      },
      {
        role: "user",
        content: String(prompt?.userPrompt || ""),
      },
    ],
    temperature: 0.1,
  };
  const result = await requestChatCompletionWithFallback(requestBody, options);
  return {
    model,
    rawText: result.text,
    usage: result.usage,
    mock: false,
    thinkingDisabledRequested: result.thinkingDisabledRequested,
    thinkingDisableFallbackUsed: result.thinkingDisableFallbackUsed,
  };
}

module.exports = {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  getClientConfig,
  inferAudioFormat,
  sanitizeModelName,
  requestCompare,
  requestListen,
};
