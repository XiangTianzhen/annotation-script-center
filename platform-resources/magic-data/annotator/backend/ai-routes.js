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
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const { estimateIncome } = require("./ai-cost");
const { buildLexiconContext, getLexiconState } = require("./ai-lexicon");
const { buildComparePrompt, buildListenPrompt, RULE_VERSION } = require("./ai-prompts");
const {
  normalizeListenResponse,
  normalizeRuleFirstComparison,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");

const AI_BASE_PATH = "/api/magic-data/annotator/ai/review-current";
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

function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code || "";
  return error;
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        const tooLargeError = createHttpError(413, "请求体超过 3MB。", "payload-too-large");
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

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
}

function normalizeReviewMode(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "listen_assisted" || text === "strict_review" || text === "rule_first") {
    return text;
  }
  return "rule_first";
}

function normalizeReviewRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const taskItemId = normalizeText(source.taskItemId);
  const samplingRecordId = normalizeText(source.samplingRecordId);
  const projectName = normalizeText(source.projectName);
  const audioUrl = normalizeText(source.audioUrl);
  const platformDialectText = normalizeText(source.platformDialectText);
  const platformMandarinText = normalizeText(source.platformMandarinText);

  if (!isHttpUrl(audioUrl)) {
    throw createHttpError(400, "audioUrl 必须是 http/https。", "invalid-audio-url");
  }
  if (!platformDialectText && !platformMandarinText) {
    throw createHttpError(
      400,
      "platformDialectText 和 platformMandarinText 不能同时为空。",
      "missing-platform-text"
    );
  }

  const effectiveTime = normalizeNullableNumber(source.effectiveTime);
  if (effectiveTime !== null && effectiveTime < 0) {
    throw createHttpError(400, "effectiveTime 必须是非负数字。", "invalid-effective-time");
  }

  return {
    taskItemId,
    samplingRecordId,
    projectName,
    audioUrl,
    audioDuration: normalizeNullableNumber(source.audioDuration),
    effectiveStartTime: normalizeNullableNumber(source.effectiveStartTime),
    effectiveEndTime: normalizeNullableNumber(source.effectiveEndTime),
    effectiveTime,
    platformDialectText,
    platformMandarinText,
    speaker: {
      gender: normalizeText(source?.speaker?.gender),
      ageRange: normalizeText(source?.speaker?.ageRange),
    },
    rulesProfile: normalizeText(source.rulesProfile) || "hakka",
    clientVersion: normalizeText(source.clientVersion),
    listenModel: sanitizeModelName(source.listenModel, ""),
    reviewModel: sanitizeModelName(source.reviewModel, ""),
    reviewMode: normalizeReviewMode(source.reviewMode),
    showHeardText: source.showHeardText !== false,
    enableThinking: source.enableThinking === true,
  };
}

function resolveModelOverride(requestModel, defaultModel, config) {
  if (!config.allowClientModelOverride) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  const normalizedRequestModel = sanitizeModelName(requestModel, "");
  if (!normalizedRequestModel) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  return normalizedRequestModel;
}

function computeEffectiveTimeSeconds(request) {
  if (request.effectiveTime !== null) {
    return Math.max(0, Number(request.effectiveTime) || 0);
  }
  if (request.effectiveStartTime !== null && request.effectiveEndTime !== null) {
    const diff = Number(request.effectiveEndTime) - Number(request.effectiveStartTime);
    return Math.max(0, Number.isFinite(diff) ? diff : 0);
  }
  return 0;
}

function appendCallLogSafe(record) {
  try {
    appendAiCallLog(record);
  } catch (error) {
    console.warn("[MagicData][annotator][ai] 调用日志写入失败", {
      requestId: record?.requestId,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function buildHealthResponse() {
  const config = getClientConfig();
  const lexiconState = getLexiconState();
  return {
    success: true,
    service: "magic-data-annotator-ai-review-current",
    provider: "dashscope-qwen",
    ruleVersion: RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    reviewModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    allowClientModelOverride: config.allowClientModelOverride === true,
    enableThinkingDefault: config.enableThinkingDefault === true,
    timeoutMs: config.timeoutMs,
    pipelineMode: config.pipelineMode,
    lexiconRewriteMode: config.lexiconRewriteMode,
    lexicon: {
      enabled: lexiconState.enabled,
      status: lexiconState.status,
      source: lexiconState.source,
      rowCount: Array.isArray(lexiconState.rows) ? lexiconState.rows.length : 0,
    },
    callLogDir: getLogDir(),
  };
}

async function handleReviewCurrent(request, response) {
  const startedAtMs = Date.now();
  let requestId = createRequestId();
  let reviewRequest = null;
  let config = null;
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

    reviewRequest = normalizeReviewRequest(body);
    requestId = normalizeText(body.requestId) || requestId;
    config = getClientConfig();
    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(503, "missing-api-key", "missing-api-key");
    }

    const listenModel = resolveModelOverride(
      reviewRequest.listenModel,
      config.listenModel || DEFAULT_LISTEN_MODEL,
      config
    );
    const reviewModel = resolveModelOverride(
      reviewRequest.reviewModel,
      config.compareModel || DEFAULT_COMPARE_MODEL,
      config
    );

    const beforeListenLexicon = buildLexiconContext({
      platformDialectText: reviewRequest.platformDialectText,
      platformMandarinText: reviewRequest.platformMandarinText,
      heardDialectText: "",
    });
    const listenPrompt = buildListenPrompt(reviewRequest, beforeListenLexicon);

    const listenStartedAt = Date.now();
    const listenResult = await requestListen(reviewRequest, listenPrompt, {
      timeoutMs: config.timeoutMs,
      model: listenModel,
      enableThinking: reviewRequest.enableThinking,
    });
    listenDurationMs = Date.now() - listenStartedAt;

    const listenJson = parseModelJsonText(listenResult.rawText, requestId);
    const listen = normalizeListenResponse(listenJson);

    const lexiconContext = buildLexiconContext({
      platformDialectText: reviewRequest.platformDialectText,
      platformMandarinText: reviewRequest.platformMandarinText,
      heardDialectText: listen.heardDialectText,
    });

    const comparePrompt = buildComparePrompt(reviewRequest, listen, lexiconContext);
    const compareStartedAt = Date.now();
    const compareResult = await requestCompare(
      {
        platformDialectText: reviewRequest.platformDialectText,
        platformMandarinText: reviewRequest.platformMandarinText,
        heardDialectText: listen.heardDialectText,
        heardMandarinMeaning: listen.heardMandarinMeaning,
      },
      comparePrompt,
      {
        timeoutMs: config.timeoutMs,
        model: reviewModel,
        enableThinking: reviewRequest.enableThinking,
      }
    );
    compareDurationMs = Date.now() - compareStartedAt;

    const compareJson = parseModelJsonText(compareResult.rawText, requestId);
    const ruleFirst = normalizeRuleFirstComparison(compareJson, reviewRequest, listen);

    if (!listen.isValidAudio) {
      ruleFirst.reviewConclusion = "risky";
      ruleFirst.shouldReview = true;
      if (ruleFirst.textRuleCheck.ruleIssues.indexOf("音频无效或不清晰，建议人工复核。") < 0) {
        ruleFirst.textRuleCheck.ruleIssues.push("音频无效或不清晰，建议人工复核。");
      }
    }

    const effectiveTimeSeconds = computeEffectiveTimeSeconds(reviewRequest);
    const estimatedIncome = estimateIncome(effectiveTimeSeconds);
    const listenUsage = normalizeUsage(listenResult.usage);
    const compareUsage = normalizeUsage(compareResult.usage);
    const totalDurationMs = Date.now() - startedAtMs;

    const showHeardText = reviewRequest.showHeardText !== false;
    const heardDialectText = showHeardText ? listen.heardDialectText : "";
    const heardMandarinMeaning = showHeardText ? listen.heardMandarinMeaning : "";

    const responseData = {
      requestId,
      reviewConclusion: ruleFirst.reviewConclusion,
      shouldReview: ruleFirst.shouldReview === true,
      effectiveTime: effectiveTimeSeconds,
      estimatedIncome,
      platformBaseline: {
        dialectText: reviewRequest.platformDialectText,
        mandarinText: reviewRequest.platformMandarinText,
        gender: reviewRequest?.speaker?.gender || "",
        ageRange: reviewRequest?.speaker?.ageRange || "",
      },
      audioCheck: {
        isValidAudio: listen.isValidAudio,
        validityDecision: listen.validityDecision,
        riskFlags: listen.riskFlags,
        invalidReasons: listen.invalidReasons,
        genderGuess: listen.genderGuess,
        ageRangeGuess: listen.ageRangeGuess,
        heardDialectText,
        heardMandarinMeaning,
        confidence: listen.confidence,
      },
      textRuleCheck: ruleFirst.textRuleCheck,
      recommendations: ruleFirst.recommendations,
      lexicon: {
        enabled: lexiconContext.enabled,
        status: lexiconContext.status,
        matchedCount: lexiconContext.matchedCount,
        matches: lexiconContext.matches,
      },
      models: {
        listenModel: listenResult.model || listenModel || DEFAULT_LISTEN_MODEL,
        reviewModel: compareResult.model || reviewModel || DEFAULT_COMPARE_MODEL,
        compareModel: compareResult.model || reviewModel || DEFAULT_COMPARE_MODEL,
      },
      usage: {
        listen: listenUsage,
        compare: compareUsage,
      },
      thinking: {
        requested: reviewRequest.enableThinking === true,
        listen: {
          enableThinking: listenResult.enableThinking === true,
          fallbackUsed: listenResult.thinkingFallbackUsed === true,
          fallbackMode: listenResult.thinkingFallbackMode || "",
        },
        compare: {
          enableThinking: compareResult.enableThinking === true,
          fallbackUsed: compareResult.thinkingFallbackUsed === true,
          fallbackMode: compareResult.thinkingFallbackMode || "",
        },
      },
      timing: {
        listenDurationMs,
        compareDurationMs,
        totalDurationMs,
      },
      mock: Boolean(config.mockEnabled || listenResult.mock || compareResult.mock),

      // Legacy compatibility for previous frontend fields.
      verdict: !listen.isValidAudio ? "invalid_audio" : ruleFirst.legacyComparison.verdict,
      listen: {
        heardDialectText,
        heardMandarinMeaning,
        isValidAudio: listen.isValidAudio,
        invalidReasons: listen.invalidReasons,
        riskFlags: listen.riskFlags,
        confidence: listen.confidence,
      },
      comparison: {
        dialectLine: ruleFirst.legacyComparison.dialectLine,
        mandarinLine: ruleFirst.legacyComparison.mandarinLine,
        lexiconIssues: ruleFirst.legacyComparison.lexiconIssues,
        ruleIssues: ruleFirst.legacyComparison.ruleIssues,
      },
    };

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: true,
      durationMs: totalDurationMs,
      listenDurationMs,
      compareDurationMs,
      request: reviewRequest,
      response: responseData,
      listenModel: responseData.models.listenModel,
      compareModel: responseData.models.reviewModel,
      enableThinking: reviewRequest.enableThinking === true,
      audioHostname: parseAudioHostname(reviewRequest.audioUrl),
      mock: responseData.mock,
    });

    sendJson(response, 200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const responseBody = {
      success: false,
      requestId,
      code: normalizeText(error?.code || "internal-error"),
      message: normalizeText(error?.message || "Magic Data AI review-current 请求失败。").slice(0, 240),
    };
    if (error?.code === "provider-http-error" && error?.summary) {
      responseBody.summary = normalizeText(error.summary).slice(0, 200);
    }
    if (!responseBody.code) {
      responseBody.code = statusCode >= 500 ? "internal-error" : "request-error";
    }

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: false,
      durationMs: Date.now() - startedAtMs,
      listenDurationMs,
      compareDurationMs,
      request: reviewRequest || {},
      response: {},
      listenModel: config?.listenModel || DEFAULT_LISTEN_MODEL,
      compareModel: config?.compareModel || DEFAULT_COMPARE_MODEL,
      audioHostname: parseAudioHostname(reviewRequest?.audioUrl || ""),
      mock: Boolean(config?.mockEnabled),
      errorCode: responseBody.code,
      errorMessage: responseBody.message,
    });

    sendJson(response, statusCode, responseBody);
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });

  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleReviewCurrent(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_HEALTH_PATH,
  handleReviewCurrent,
  normalizeReviewRequest,
  registerAiRoutes,
};
