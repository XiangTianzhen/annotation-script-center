"use strict";

const { sendJson } = require("../../../backend/response");
const {
  AVAILABLE_MODELS,
  getClientConfig,
  resolveRequestModel,
  requestSuggestion,
} = require("./ai-client-qwen");
const { buildPrompt } = require("./ai-prompt");
const { normalizeModelResponse, parseModelJsonText } = require("./ai-response-schema");

const AI_BASE_PATH = "/api/alibaba-labelx/asr-judgement/ai";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_SUGGEST_PATH = AI_BASE_PATH + "/suggest";
const DEFAULT_RULE_VERSION = "asr-judgement-ai-v1";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

function createRequestId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8);
  return String(yyyy) + mm + dd + "-" + hh + mi + ss + "-" + suffix;
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        const tooLargeError = new Error("请求体超过 2MB。");
        tooLargeError.statusCode = 413;
        tooLargeError.code = "payload-too-large";
        reject(tooLargeError);
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code || "";
  return error;
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(audioUrl).hostname || "";
  } catch (error) {
    return "";
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function normalizeSuggestRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const projectId = String(source.projectId || "").trim();
  const subTaskId = String(source.subTaskId || "").trim();
  const itemId = String(source.itemId || "").trim();
  const audioUrl = String(source.audioUrl || "").trim();
  const asrText1 = String(source.asrText1 || "").trim();
  const asrText2 = String(source.asrText2 || "").trim();
  const ruleVersion = String(source.ruleVersion || DEFAULT_RULE_VERSION).trim();
  const clientVersion = String(source.clientVersion || "").trim();
  const rawItemIndex = source.itemIndex;
  const itemIndex =
    rawItemIndex === undefined || rawItemIndex === null || rawItemIndex === ""
      ? null
      : Number(rawItemIndex);
  const modelText = source.model === undefined || source.model === null ? "" : String(source.model).trim();
  const clientConfig = getClientConfig();
  const modelResult = resolveRequestModel(modelText, clientConfig.defaultModel);

  if (!projectId) {
    throw createHttpError(400, "projectId 不能为空。", "invalid-project-id");
  }
  if (!subTaskId) {
    throw createHttpError(400, "subTaskId 不能为空。", "invalid-subtask-id");
  }
  if (!isHttpUrl(audioUrl)) {
    throw createHttpError(400, "audioUrl 必须是 http/https。", "invalid-audio-url");
  }
  if (!asrText1 || !asrText2) {
    throw createHttpError(400, "asrText1/asrText2 不能为空。", "invalid-asr-text");
  }
  if (rawItemIndex !== undefined && rawItemIndex !== null && !Number.isFinite(itemIndex)) {
    throw createHttpError(400, "itemIndex 必须是数字。", "invalid-item-index");
  }
  if (modelText && !modelResult.valid) {
    throw createHttpError(400, "model 不在允许列表中。", "invalid-model");
  }

  return {
    projectId,
    subTaskId,
    itemIndex: itemIndex === null ? 0 : itemIndex,
    itemId,
    audioUrl,
    asrText1,
    asrText2,
    ruleVersion,
    clientVersion,
    model: modelResult.model,
  };
}

function parseTimeoutMs() {
  const value = Number(process.env.ASR_JUDGEMENT_AI_TIMEOUT_MS || 120000);
  if (!Number.isFinite(value)) {
    return 120000;
  }
  return Math.max(1000, Math.min(180000, value));
}

function sendHealth(response) {
  const config = getClientConfig();
  sendJson(response, 200, {
    success: true,
    service: "asr-judgement-ai",
    provider: "dashscope-qwen",
    defaultModel: config.defaultModel,
    configuredDefaultModel: config.configuredDefaultModel || "",
    effectiveDefaultModel: config.effectiveDefaultModel || config.defaultModel,
    availableModels: config.availableModels,
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    ruleVersion: DEFAULT_RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
  });
}

async function handleSuggest(request, response) {
  let requestId = createRequestId();
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }
    const suggestRequest = normalizeSuggestRequest(body);
    requestId = String(body.requestId || requestId);

    const clientConfig = getClientConfig();
    if (!clientConfig.hasApiKey && !clientConfig.mockEnabled) {
      throw createHttpError(503, "missing-api-key", "missing-api-key");
    }

    console.info("[ASR Judgement][ai] suggest start", {
      requestId,
      hostname: parseAudioHostname(suggestRequest.audioUrl),
      itemIndex: suggestRequest.itemIndex,
      model: suggestRequest.model,
    });

    const prompt = buildPrompt(suggestRequest);
    const modelResult = await requestSuggestion(suggestRequest, prompt, {
      model: suggestRequest.model,
      timeoutMs: parseTimeoutMs(),
    });
    const modelJson = parseModelJsonText(modelResult.rawText, requestId);
    const normalized = normalizeModelResponse(modelJson, {
      requestId,
      model: modelResult.model,
      ruleVersion: prompt.ruleVersion || suggestRequest.ruleVersion,
    });

    sendJson(response, 200, {
      success: true,
      data: normalized,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const message = String(error?.message || "AI suggest 请求失败。").slice(0, 240);
    const responseBody = {
      success: false,
      message,
      requestId,
      code: String(error?.code || ""),
    };
    if (error?.code === "provider-http-error" && error?.statusCode) {
      responseBody.providerStatus = Number(error.statusCode);
    }
    if (error?.code === "provider-http-error" && error?.summary) {
      responseBody.summary = String(error.summary || "").slice(0, 200);
    }
    sendJson(response, statusCode, responseBody);
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendHealth(response);
  });

  router.post(AI_SUGGEST_PATH, function ({ request, response }) {
    return handleSuggest(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_HEALTH_PATH,
  AI_SUGGEST_PATH,
  DEFAULT_RULE_VERSION,
  handleSuggest,
  normalizeSuggestRequest,
  registerAiRoutes,
};
