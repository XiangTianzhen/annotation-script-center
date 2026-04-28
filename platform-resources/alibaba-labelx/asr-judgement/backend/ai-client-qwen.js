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

function normalizeModel(model) {
  const value = String(model || "").trim();
  if (AVAILABLE_MODELS.indexOf(value) >= 0) {
    return value;
  }

  const envModel = String(process.env.ASR_JUDGEMENT_AI_MODEL || "").trim();
  if (AVAILABLE_MODELS.indexOf(envModel) >= 0) {
    return envModel;
  }
  return DEFAULT_MODEL;
}

function getClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL);
  const defaultModel = normalizeModel(process.env.ASR_JUDGEMENT_AI_MODEL || DEFAULT_MODEL);
  return {
    apiKey,
    baseUrl,
    defaultModel,
    availableModels: AVAILABLE_MODELS.slice(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
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

async function readStreamText(response) {
  if (!response.body || typeof response.body.getReader !== "function") {
    return await response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf8");
  let buffer = "";
  let aggregatedText = "";

  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    lines.forEach(function (line) {
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
      } catch (error) {
        // ignore non-json lines
      }
    });
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    buffer
      .split(/\r?\n/)
      .map(function (line) {
        return String(line || "").trim();
      })
      .filter(function (line) {
        return line.startsWith("data:");
      })
      .forEach(function (line) {
        const payloadText = line.slice(5).trim();
        if (!payloadText || payloadText === "[DONE]") {
          return;
        }
        try {
          const payload = JSON.parse(payloadText);
          aggregatedText += extractDeltaText(payload);
        } catch (error) {
          // ignore trailing non-json lines
        }
      });
  }

  return aggregatedText;
}

async function requestSuggestion(input, prompt, options) {
  const config = getClientConfig();
  const model = normalizeModel(options?.model || config.defaultModel);

  if (config.mockEnabled) {
    return {
      provider: "dashscope-qwen",
      model,
      rawText: buildMockResponse(input, model),
      mock: true,
    };
  }

  if (!config.apiKey) {
    const error = new Error("missing-api-key");
    error.code = "missing-api-key";
    throw error;
  }

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
  const requestBody = {
    model,
    stream: true,
    stream_options: {
      include_usage: true,
    },
    extra_body: {
      enable_thinking: false,
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
            type: "audio_url",
            audio_url: {
              url: String(input?.audioUrl || ""),
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
  };

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

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        "Qwen 接口请求失败（HTTP " + String(response.status) + "）: " + String(bodyText || "").slice(0, 200)
      );
    }

    const rawText = await readStreamText(response);
    if (!String(rawText || "").trim()) {
      throw new Error("Qwen 接口未返回有效文本。");
    }

    return {
      provider: "dashscope-qwen",
      model,
      rawText,
      mock: false,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Qwen 请求超时。");
      timeoutError.code = "timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

module.exports = {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  buildMockResponse,
  getClientConfig,
  isMockEnabled,
  normalizeModel,
  requestSuggestion,
};
