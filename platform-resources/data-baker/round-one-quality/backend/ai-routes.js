"use strict";

const { sendJson } = require("../../../backend/response");
const {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REQUEST_PARAMS,
  SUPPORTED_REQUEST_PARAMS,
  getClientConfig,
  requestCompare,
  requestListen,
} = require("./ai-client-qwen");
const { estimateCost } = require("./ai-cost");
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const { applyLexiconRewrite, buildLexiconContext } = require("./ai-lexicon");
const {
  buildComparePrompt,
  buildListenPrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_LISTEN_TEMPLATE,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  buildRecommendResponse,
  ensureChineseSentencePunctuation,
  normalizeCompareResponse,
  normalizeListenResponse,
  normalizeUsage,
  parseModelJsonText,
  removeTextSpaces,
} = require("./ai-response-schema");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
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

function getLexiconRewriteMode() {
  const mode = String(process.env.DATABAKER_AI_LEXICON_REWRITE_MODE || "aggressive").trim();
  return mode === "off" ? "off" : "aggressive";
}

function getPipelineMode() {
  const mode = String(process.env.DATABAKER_AI_PIPELINE_MODE || "two_stage").trim();
  return mode === "listen_only" ? "listen_only" : "two_stage";
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const aiOptions = normalizeAiOptions(source.aiOptions);
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
    aiOptions,
  };
}

function normalizePromptText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
}

function normalizeNumberInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  if (number < min || number > max) {
    return null;
  }
  return number;
}

function normalizeIntegerInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const integerValue = Math.floor(number);
  if (integerValue < min || integerValue > max) {
    return null;
  }
  return integerValue;
}

function normalizeStopSequences(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(/\r?\n/)
    : [];
  const result = [];
  source.forEach(function (item) {
    const text = String(item || "").trim().slice(0, 80);
    if (!text || result.length >= 8 || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return result;
}

function normalizeAiOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  const listenPrompt = normalizePromptText(source.listenPrompt);
  const comparePrompt = normalizePromptText(source.comparePrompt);
  const listenModel = String(source.listenModel || "").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
  const compareModel = String(source.compareModel || "").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
  if (listenPrompt) {
    result.listenPrompt = listenPrompt;
  }
  if (comparePrompt) {
    result.comparePrompt = comparePrompt;
  }
  if (listenModel) {
    result.listenModel = listenModel;
  }
  if (compareModel) {
    result.compareModel = compareModel;
  }
  if (SUPPORTED_REQUEST_PARAMS.temperature === true) {
    const normalized = normalizeNumberInRange(source.temperature, 0, 2);
    if (normalized !== null) {
      result.temperature = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.top_p === true) {
    const normalized = normalizeNumberInRange(source.top_p, 0, 1);
    if (normalized !== null) {
      result.top_p = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.max_tokens === true) {
    const normalized = normalizeIntegerInRange(source.max_tokens, 1, 8192);
    if (normalized !== null) {
      result.max_tokens = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.max_completion_tokens === true) {
    const normalized = normalizeIntegerInRange(source.max_completion_tokens, 1, 8192);
    if (normalized !== null) {
      result.max_completion_tokens = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.presence_penalty === true) {
    const normalized = normalizeNumberInRange(source.presence_penalty, -2, 2);
    if (normalized !== null) {
      result.presence_penalty = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.frequency_penalty === true) {
    const normalized = normalizeNumberInRange(source.frequency_penalty, -2, 2);
    if (normalized !== null) {
      result.frequency_penalty = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.seed === true) {
    const normalized = normalizeIntegerInRange(source.seed, 0, 2147483647);
    if (normalized !== null) {
      result.seed = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.stop === true) {
    const stop = normalizeStopSequences(source.stop);
    if (stop.length > 0) {
      result.stop = stop;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.enable_thinking === true && typeof source.enable_thinking === "boolean") {
    result.enable_thinking = source.enable_thinking === true;
  }
  return result;
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
    pipelineMode: getPipelineMode(),
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
  });
}

async function handleRecommend(request, response) {
  const startedAtMs = Date.now();
  let requestId = createRequestId();
  let recommendRequest = null;
  let config = null;
  let listenDurationMs = 0;
  let compareDurationMs = 0;
  let pipelineMode = getPipelineMode();
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
    pipelineMode = getPipelineMode();
    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(503, "missing-api-key", "missing-api-key");
    }

    const listenModel = String(
      recommendRequest.aiOptions.listenModel || config.listenModel || DEFAULT_LISTEN_MODEL
    )
      .replace(/[\r\n]+/g, " ")
      .trim()
      .slice(0, 80);
    const compareModel = String(
      recommendRequest.aiOptions.compareModel || config.compareModel || DEFAULT_COMPARE_MODEL
    )
      .replace(/[\r\n]+/g, " ")
      .trim()
      .slice(0, 80);
    const effectiveEnableThinking =
      typeof recommendRequest.aiOptions.enable_thinking === "boolean"
        ? recommendRequest.aiOptions.enable_thinking === true
        : config.enableThinkingDefault === true;

    console.info("[DataBaker][round-one-quality][ai] recommend start", {
      requestId,
      hostname: parseAudioHostname(recommendRequest.audioUrl),
      sentenceNumber: recommendRequest.sentenceNumber,
      listenModel,
      compareModel,
      pipelineMode,
      enableThinking: effectiveEnableThinking,
      mock: config.mockEnabled,
    });

    const listenLexiconContext = buildLexiconContext({
      pageText: recommendRequest.pageText,
      heardText: "",
      limit: 40,
    });
    const listenPrompt = buildListenPrompt(recommendRequest, listenLexiconContext);
    const listenStartedAtMs = Date.now();
    let listenResult = null;
    try {
      listenResult = await requestListen(recommendRequest, listenPrompt, {
        model: listenModel,
        timeoutMs: config.timeoutMs,
        enableThinking: effectiveEnableThinking,
      });
    } finally {
      listenDurationMs = Date.now() - listenStartedAtMs;
    }
    const listenJson = parseModelJsonText(listenResult.rawText, requestId);
    const normalizedListen = normalizeListenResponse(listenJson);
    normalizedListen.heardText = removeTextSpaces(normalizedListen.heardText);

    const compareLexiconContext = buildLexiconContext({
      pageText: recommendRequest.pageText,
      heardText: normalizedListen.heardText,
      limit: 60,
    });
    let compareResult = {
      model: "skipped",
      rawText: "",
      usage: {},
      mock: false,
      thinkingDisabledRequested: false,
      thinkingDisableFallbackUsed: false,
    };
    let normalizedCompare = {
      recommendedText: normalizedListen.heardText || recommendRequest.pageText,
      decision: "listen_only",
      changePoints: [],
      confidence: 0,
      needHumanReview: true,
    };
    if (pipelineMode === "two_stage") {
      const comparePrompt = buildComparePrompt(
        recommendRequest,
        normalizedListen.heardText,
        compareLexiconContext
      );
      const compareStartedAtMs = Date.now();
      try {
        compareResult = await requestCompare(
          recommendRequest,
          comparePrompt,
          normalizedListen.heardText,
          {
            model: compareModel,
            timeoutMs: config.timeoutMs,
            enableThinking: effectiveEnableThinking,
          }
        );
      } finally {
        compareDurationMs = Date.now() - compareStartedAtMs;
      }
      const compareJson = parseModelJsonText(compareResult.rawText, requestId);
      normalizedCompare = normalizeCompareResponse(compareJson, {
        pageText: recommendRequest.pageText,
        heardText: normalizedListen.heardText,
      });
      normalizedCompare.recommendedText = removeTextSpaces(normalizedCompare.recommendedText);
    }
    const rewriteMode = getLexiconRewriteMode();
    const rewriteResult = applyLexiconRewrite(normalizedCompare.recommendedText, {
      pageText: recommendRequest.pageText,
      heardText: normalizedListen.heardText,
      mode: rewriteMode,
    });
    if (rewriteResult.changed) {
      normalizedCompare.recommendedText = rewriteResult.text;
      normalizedCompare.needHumanReview = true;
    }
    normalizedCompare.recommendedText = removeTextSpaces(normalizedCompare.recommendedText);
    normalizedCompare.recommendedText = ensureChineseSentencePunctuation(
      normalizedCompare.recommendedText
    );

    const listenUsage = normalizeUsage(listenResult.usage);
    const compareUsage = normalizeUsage(compareResult.usage);
    const totalDurationMs = Date.now() - startedAtMs;
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
    responseData.lexicon = {
      enabled: Boolean(listenLexiconContext.enabled || compareLexiconContext.enabled || rewriteMode !== "off"),
      rewriteMode,
      matchedCount: Number(compareLexiconContext.matchedCount || 0),
      rewriteChanged: rewriteResult.changed === true,
      rewriteChanges: rewriteResult.changes,
    };
    responseData.timing = {
      listenDurationMs,
      compareDurationMs,
      totalDurationMs,
    };
    responseData.pipelineMode = pipelineMode;
    responseData.thinking = {
      enableThinking: effectiveEnableThinking,
      fallbackUsed: Boolean(
        listenResult.thinkingFallbackUsed || compareResult.thinkingFallbackUsed
      ),
      fallbackMode:
        String(listenResult.thinkingFallbackMode || "") ||
        String(compareResult.thinkingFallbackMode || ""),
      disabledRequested: Boolean(
        listenResult.thinkingDisabledRequested || compareResult.thinkingDisabledRequested
      ),
      disableFallbackUsed: Boolean(
        listenResult.thinkingDisableFallbackUsed || compareResult.thinkingDisableFallbackUsed
      ),
    };

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: true,
      durationMs: totalDurationMs,
      listenDurationMs,
      compareDurationMs,
      request: recommendRequest,
      response: responseData,
      listenModel: listenResult.model,
      compareModel: compareResult.model,
      pipelineMode,
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
      listenDurationMs,
      compareDurationMs,
      request: recommendRequest || {},
      response: {},
      listenModel: config?.listenModel || DEFAULT_LISTEN_MODEL,
      compareModel: config?.compareModel || DEFAULT_COMPARE_MODEL,
      pipelineMode,
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
  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    const config = getClientConfig();
    sendJson(response, 200, {
      success: true,
      service: "data-baker-round-one-quality-ai-recommend",
      scriptId: "dataBakerRoundOneQuality",
      component: "asr-voice-ai",
      defaults: {
        listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
        compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
        reviewModel: "",
        timeoutMs: config.timeoutMs,
        enableThinking: config.enableThinkingDefault === true,
        temperature: DEFAULT_REQUEST_PARAMS.temperature,
        top_p: DEFAULT_REQUEST_PARAMS.top_p,
        max_tokens: DEFAULT_REQUEST_PARAMS.max_tokens,
        max_completion_tokens: DEFAULT_REQUEST_PARAMS.max_completion_tokens,
        presence_penalty: DEFAULT_REQUEST_PARAMS.presence_penalty,
        frequency_penalty: DEFAULT_REQUEST_PARAMS.frequency_penalty,
        seed: DEFAULT_REQUEST_PARAMS.seed,
        stop: DEFAULT_REQUEST_PARAMS.stop,
        listenPrompt: DEFAULT_LISTEN_TEMPLATE,
        comparePrompt: DEFAULT_COMPARE_TEMPLATE,
        reviewPrompt: "",
      },
      supportedParams: SUPPORTED_REQUEST_PARAMS,
      notes: {
        promptOverride: "Prompt 可在前端覆盖；空 override 使用后端默认。",
        responseFormat: "结构化输出由后端固定控制，前端不配置。",
      },
    });
  });

  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleRecommend(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleRecommend,
  normalizeAnnotatorName,
  normalizeRecommendRequest,
  registerAiRoutes,
};
