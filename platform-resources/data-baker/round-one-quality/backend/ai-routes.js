"use strict";

const { sendJson } = require("../../../backend/response");
const { DEFAULT_COMPARE_MODEL, DEFAULT_LISTEN_MODEL, getClientConfig, requestCompare, requestListen } =
  require("./ai-client-qwen");
const { estimateCost } = require("./ai-cost");
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const { buildComparePrompt, buildListenPrompt, RULE_VERSION } = require("./ai-prompts");
const {
  buildRecommendResponse,
  normalizeCompareResponse,
  normalizeListenResponse,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const MAX_BODY_BYTES = 3 * 1024 * 1024;

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
        const tooLargeError = new Error("请求体超过 3MB。");
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

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(audioUrl).hostname || "";
  } catch (error) {
    return "";
  }
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeAnnotatorName(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.slice(0, 40);
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const collectId = String(source.collectId || "").trim();
  const itemId = String(source.itemId || "").trim();
  const textId = String(source.textId || "").trim();
  const audioUrl = String(source.audioUrl || "").trim();
  const pageText = String(source.pageText || "").trim();
  const readRequire = String(source.readRequire || "").trim();
  const clientVersion = String(source.clientVersion || "").trim();
  const sentenceNumber = normalizeNullableNumber(source.sentenceNumber);
  const annotatorName = normalizeAnnotatorName(source.annotatorName);

  if (!collectId) {
    throw createHttpError(400, "collectId 不能为空。", "invalid-collect-id");
  }
  if (!itemId) {
    throw createHttpError(400, "itemId 不能为空。", "invalid-item-id");
  }
  if (!isHttpUrl(audioUrl)) {
    throw createHttpError(400, "audioUrl 必须是 http/https。", "invalid-audio-url");
  }
  if (!pageText) {
    throw createHttpError(400, "pageText 不能为空。", "invalid-page-text");
  }

  return {
    collectId,
    itemId,
    textId,
    sentenceNumber,
    readRequire,
    audioUrl,
    pageText,
    annotatorName,
    effectiveStartTime: normalizeNullableNumber(source.effectiveStartTime),
    effectiveEndTime: normalizeNullableNumber(source.effectiveEndTime),
    effectiveTime: normalizeNullableNumber(source.effectiveTime),
    audioDuration: normalizeNullableNumber(source.audioDuration),
    clientVersion,
  };
}

function appendCallLogSafe(record) {
  try {
    appendAiCallLog(record);
  } catch (error) {
    console.warn("[DataBaker][round-one-quality][ai] 写入调用日志失败", {
      requestId: record?.requestId,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function sendHealth(response) {
  const config = getClientConfig();
  sendJson(response, 200, {
    success: true,
    service: "data-baker-round-one-quality-ai-recommend",
    provider: "dashscope-qwen",
    ruleVersion: RULE_VERSION,
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    cropEffectiveAudio: config.cropEffectiveAudio,
    cropPaddingSeconds: config.cropPaddingSeconds,
    cropStatus: config.cropEffectiveAudio ? "reserved-fallback-to-full-audio-url" : "disabled",
    callLogDir: getLogDir(),
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
  });
}

async function handleRecommend(request, response) {
  const startedAtMs = Date.now();
  let requestId = createRequestId();
  let recommendRequest = null;
  let config = null;
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }
    recommendRequest = normalizeRecommendRequest(body);
    requestId = String(body.requestId || requestId);

    config = getClientConfig();
    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(503, "missing-api-key", "missing-api-key");
    }

    console.info("[DataBaker][round-one-quality][ai] recommend start", {
      requestId,
      hostname: parseAudioHostname(recommendRequest.audioUrl),
      sentenceNumber: recommendRequest.sentenceNumber,
      listenModel: config.listenModel,
      compareModel: config.compareModel,
      mock: config.mockEnabled,
    });

    const listenPrompt = buildListenPrompt(recommendRequest);
    const listenResult = await requestListen(recommendRequest, listenPrompt, {
      model: config.listenModel,
      timeoutMs: config.timeoutMs,
    });
    const listenJson = parseModelJsonText(listenResult.rawText, requestId);
    const normalizedListen = normalizeListenResponse(listenJson);

    const comparePrompt = buildComparePrompt(recommendRequest, normalizedListen.heardText);
    const compareResult = await requestCompare(
      recommendRequest,
      comparePrompt,
      normalizedListen.heardText,
      {
        model: config.compareModel,
        timeoutMs: config.timeoutMs,
      }
    );
    const compareJson = parseModelJsonText(compareResult.rawText, requestId);
    const normalizedCompare = normalizeCompareResponse(compareJson, {
      pageText: recommendRequest.pageText,
      heardText: normalizedListen.heardText,
    });

    const listenUsage = normalizeUsage(listenResult.usage);
    const compareUsage = normalizeUsage(compareResult.usage);
    const responseData = buildRecommendResponse({
      requestId,
      request: recommendRequest,
      listen: normalizedListen,
      compare: normalizedCompare,
      listenModel: listenResult.model,
      compareModel: compareResult.model,
      listenUsage,
      compareUsage,
      cost: estimateCost({
        effectiveTime: recommendRequest.effectiveTime,
        listenUsage,
        compareUsage,
      }),
    });

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: true,
      durationMs: Date.now() - startedAtMs,
      request: recommendRequest,
      response: responseData,
      listenModel: listenResult.model,
      compareModel: compareResult.model,
      audioHostname: parseAudioHostname(recommendRequest.audioUrl),
      mock: Boolean(config.mockEnabled || listenResult.mock || compareResult.mock),
    });

    sendJson(response, 200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const responseBody = {
      success: false,
      message: String(error?.message || "DataBaker AI recommend 请求失败。").slice(0, 240),
      requestId,
      code: String(error?.code || ""),
    };
    if (error?.code === "provider-http-error" && error?.statusCode) {
      responseBody.providerStatus = Number(error.statusCode);
    }
    if (error?.code === "provider-http-error" && error?.summary) {
      responseBody.summary = String(error.summary || "").slice(0, 200);
    }

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: false,
      durationMs: Date.now() - startedAtMs,
      request: recommendRequest || {},
      response: {},
      listenModel: config?.listenModel || DEFAULT_LISTEN_MODEL,
      compareModel: config?.compareModel || DEFAULT_COMPARE_MODEL,
      audioHostname: parseAudioHostname(recommendRequest?.audioUrl || ""),
      mock: Boolean(config?.mockEnabled),
      errorCode: String(error?.code || ""),
      errorMessage: responseBody.message,
    });

    sendJson(response, statusCode, responseBody);
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendHealth(response);
  });

  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleRecommend(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_HEALTH_PATH,
  handleRecommend,
  normalizeAnnotatorName,
  normalizeRecommendRequest,
  registerAiRoutes,
};
