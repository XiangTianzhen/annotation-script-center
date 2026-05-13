"use strict";

const { sendJson } = require("../../../backend/response");
const {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  getClientConfig,
  requestCompare,
  requestListen,
  sanitizeModelName,
} = require("./ai-client-qwen");
const { buildComparePrompt, buildListenPrompt, RULE_VERSION } = require("./ai-prompt");
const {
  buildSuggestResponse,
  normalizeCompareResponse,
  normalizeListenResponse,
  parseModelJsonText,
} = require("./ai-response-schema");

const AI_BASE_PATH = "/api/alibaba-labelx/asr-judgement/ai";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_SUGGEST_PATH = AI_BASE_PATH + "/suggest";
const DEFAULT_RULE_VERSION = RULE_VERSION;
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

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "1" || value === 1) {
    return true;
  }
  if (value === "0" || value === 0) {
    return false;
  }
  return fallback === true;
}

function normalizeContextText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 1200);
}

function normalizeSuggestRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const config = getClientConfig();
  const projectId = String(source.projectId || "").trim();
  const subTaskId = String(source.subTaskId || "").trim();
  const itemId = String(source.itemId || "").trim();
  const audioUrl = String(source.audioUrl || "").trim();
  const asrText1 = String(source.asrText1 || "").trim();
  const asrText2 = String(source.asrText2 || "").trim();
  const contextText = normalizeContextText(source.contextText);
  const contextAvailable = contextText.length > 0;
  const includeContext = contextAvailable
    ? normalizeBoolean(source.includeContext, true)
    : false;
  const ruleVersion = String(source.ruleVersion || DEFAULT_RULE_VERSION).trim();
  const clientVersion = String(source.clientVersion || "").trim();
  const rawItemIndex = source.itemIndex;
  const itemIndex =
    rawItemIndex === undefined || rawItemIndex === null || rawItemIndex === ""
      ? 0
      : Number(rawItemIndex);
  const requestedListenModel = sanitizeModelName(source.listenModel, "");
  const requestedCompareModel = sanitizeModelName(source.compareModel || source.model, "");
  const listenModel = config.allowClientModelOverride
    ? sanitizeModelName(requestedListenModel, config.listenModel)
    : sanitizeModelName(config.listenModel, DEFAULT_LISTEN_MODEL);
  const compareModel = config.allowClientModelOverride
    ? sanitizeModelName(
        requestedCompareModel,
        config.compareModel || config.legacyModel || DEFAULT_COMPARE_MODEL
      )
    : sanitizeModelName(
        config.compareModel || config.legacyModel || DEFAULT_COMPARE_MODEL,
        DEFAULT_COMPARE_MODEL
      );
  const enableThinking = normalizeBoolean(
    source.enableThinking,
    config.enableThinkingDefault === true
  );

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
  if (!Number.isFinite(itemIndex)) {
    throw createHttpError(400, "itemIndex 必须是数字。", "invalid-item-index");
  }

  return {
    projectId,
    subTaskId,
    itemId,
    itemIndex,
    audioUrl,
    asrText1,
    asrText2,
    contextText,
    contextAvailable,
    includeContext,
    listenModel: listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: compareModel || DEFAULT_COMPARE_MODEL,
    enableThinking,
    ruleVersion,
    clientVersion,
  };
}

function sanitizeLogSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function sendHealth(response) {
  const config = getClientConfig();
  sendJson(response, 200, {
    success: true,
    service: "asr-judgement-ai",
    provider: "dashscope-qwen",
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    legacyModel: config.legacyModel || "",
    allowClientModelOverride: config.allowClientModelOverride === true,
    enableThinkingDefault: config.enableThinkingDefault === true,
    timeoutMs: config.timeoutMs,
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    ruleVersion: DEFAULT_RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
  });
}

async function handleSuggest(request, response) {
  const startedAtMs = Date.now();
  let suggestRequest = null;
  let requestId = createRequestId();
  let listenDurationMs = 0;
  let compareDurationMs = 0;

  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }

    suggestRequest = normalizeSuggestRequest(body);
    requestId = String(body.requestId || requestId);
    const config = getClientConfig();
    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(
        503,
        "后端未读取到 DASHSCOPE_API_KEY，请检查 config/env/ai.env 或环境变量。",
        "missing-api-key"
      );
    }

    const hostname = parseAudioHostname(suggestRequest.audioUrl);
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || 120000));

    console.info("[ASR Judgement][ai] suggest start", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      listenModel: suggestRequest.listenModel,
      compareModel: suggestRequest.compareModel,
      includeContext: suggestRequest.includeContext === true,
      contextLength: suggestRequest.contextText.length,
    });

    console.info("[ASR Judgement][ai] listen start", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      listenModel: suggestRequest.listenModel,
    });
    const listenPrompt = buildListenPrompt(suggestRequest);
    const listenStartedAtMs = Date.now();
    const listenResult = await requestListen(suggestRequest, listenPrompt, {
      model: suggestRequest.listenModel,
      timeoutMs: timeoutMs,
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      enableThinking: suggestRequest.enableThinking,
    });
    listenDurationMs = Math.max(0, Date.now() - listenStartedAtMs);
    const listenJson = parseModelJsonText(listenResult.rawText, requestId);
    const normalizedListen = normalizeListenResponse(listenJson);
    console.info("[ASR Judgement][ai] listen success", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      listenModel: listenResult.model,
      durationMs: listenDurationMs,
      providerStatus: Number(listenResult.providerStatus || 0),
      chunkCount: Number(listenResult.chunkCount || 0),
      usage: listenResult.usage || {},
      summary: "validAudio=" + String(normalizedListen.isValidAudio !== false),
    });

    console.info("[ASR Judgement][ai] compare start", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      compareModel: suggestRequest.compareModel,
      includeContext: suggestRequest.includeContext === true,
      contextLength: suggestRequest.contextText.length,
    });
    const comparePrompt = buildComparePrompt(suggestRequest, normalizedListen);
    const compareStartedAtMs = Date.now();
    const compareResult = await requestCompare(
      Object.assign({}, suggestRequest, {
        heardText: normalizedListen.heardText,
      }),
      comparePrompt,
      {
        model: suggestRequest.compareModel,
        timeoutMs: timeoutMs,
        requestId,
        hostname,
        itemIndex: suggestRequest.itemIndex,
        enableThinking: suggestRequest.enableThinking,
      }
    );
    compareDurationMs = Math.max(0, Date.now() - compareStartedAtMs);
    const compareJson = parseModelJsonText(compareResult.rawText, requestId);
    const normalizedCompare = normalizeCompareResponse(compareJson, {
      contextAvailable: suggestRequest.contextAvailable,
      contextIncluded: suggestRequest.includeContext,
      heardText: normalizedListen.heardText,
    });
    console.info("[ASR Judgement][ai] compare success", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      compareModel: compareResult.model,
      durationMs: compareDurationMs,
      providerStatus: Number(compareResult.providerStatus || 0),
      chunkCount: Number(compareResult.chunkCount || 0),
      usage: compareResult.usage || {},
      summary: "answer=" + String(normalizedCompare.answer || ""),
    });

    const totalDurationMs = Math.max(0, Date.now() - startedAtMs);
    const responseData = buildSuggestResponse({
      requestId: requestId,
      request: {
        contextAvailable: suggestRequest.contextAvailable,
        contextIncluded: suggestRequest.includeContext,
      },
      listen: normalizedListen,
      compare: normalizedCompare,
      listenModel: listenResult.model,
      compareModel: compareResult.model,
      listenUsage: listenResult.usage,
      compareUsage: compareResult.usage,
      listenDurationMs: listenDurationMs,
      compareDurationMs: compareDurationMs,
      totalDurationMs: totalDurationMs,
      thinking: {
        requested: suggestRequest.enableThinking === true,
        listenFallbackUsed: listenResult.thinkingFallbackUsed === true,
        compareFallbackUsed: compareResult.thinkingFallbackUsed === true,
      },
      ruleVersion: suggestRequest.ruleVersion || DEFAULT_RULE_VERSION,
      mock: Boolean(config.mockEnabled || listenResult.mock || compareResult.mock),
    });

    console.info("[ASR Judgement][ai] suggest success", {
      requestId,
      hostname,
      itemIndex: suggestRequest.itemIndex,
      listenModel: listenResult.model,
      compareModel: compareResult.model,
      includeContext: suggestRequest.includeContext === true,
      contextLength: suggestRequest.contextText.length,
      durationMs: totalDurationMs,
      providerStatus: Number(compareResult.providerStatus || listenResult.providerStatus || 0),
      chunkCount:
        Number(listenResult.chunkCount || 0) + Number(compareResult.chunkCount || 0),
      usage: responseData.usage || {},
      summary: "answer=" + String(responseData.answer || ""),
    });

    sendJson(response, 200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const providerStatus = Number(error?.providerStatus || error?.statusCode || 0) || undefined;
    const code = String(error?.code || "internal-error");
    const message = String(error?.message || "AI suggest 请求失败。").slice(0, 240);
    const summaryText = sanitizeLogSummary(error?.summary || message);
    const responseBody = {
      success: false,
      requestId,
      code,
      message,
    };
    if (providerStatus) {
      responseBody.providerStatus = providerStatus;
    }
    if (summaryText) {
      responseBody.summary = summaryText;
    }

    console.info("[ASR Judgement][ai] suggest failed", {
      requestId,
      hostname: parseAudioHostname(suggestRequest?.audioUrl || ""),
      itemIndex: Number(suggestRequest?.itemIndex || 0),
      listenModel: String(suggestRequest?.listenModel || ""),
      compareModel: String(suggestRequest?.compareModel || ""),
      includeContext: suggestRequest?.includeContext === true,
      contextLength: Number(suggestRequest?.contextText?.length || 0),
      durationMs: Math.max(0, Date.now() - startedAtMs),
      providerStatus: Number(providerStatus || 0),
      errorCode: code,
      summary: summaryText || "ai suggest failed",
    });
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
