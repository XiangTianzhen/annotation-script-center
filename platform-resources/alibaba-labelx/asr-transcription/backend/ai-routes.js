"use strict";

const { sendJson } = require("../../../backend/response");
const { buildAiCallLogSummaryPayload } = require("../../../backend/ai-call-log");
const { createAiRoute } = require("../../../backend/ai-framework");
const transcriptionAdapter = require("../ai/adapter");
const {
  DEFAULT_REQUEST_PARAMS,
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  SUPPORTED_REQUEST_PARAMS,
  getClientConfig,
  requestCurrentSuggestion,
  sanitizeModelName,
} = require("./ai-client-qwen");
const { getLogDir } = require("./ai-call-log");
const {
  buildPrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_LISTEN_TEMPLATE,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  DEFAULT_APPLY_ADVICE,
  normalizeSuggestionResponse,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");
const {
  SCRIPT_ID,
  createHttpError,
  normalizeSuggestRequest,
  normalizeText,
  parseAudioHostname,
  sanitizeErrorMessage,
} = require("./ai-suggest-request");

const AI_ROOT_PATH = "/api/alibaba-labelx/asr-transcription/ai";
const AI_BASE_PATH = AI_ROOT_PATH + "/suggest-current";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_ROOT_PATH + "/defaults";
const AI_LOG_SUMMARY_PATH = AI_BASE_PATH + "/logs/summary";
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const SERVICE_NAME = "asr-transcription-ai-suggest-current";

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

function resolveModelOverride(requestModel, defaultModel, config) {
  if (!config.allowClientModelOverride) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  const normalized = sanitizeModelName(requestModel, "");
  if (!normalized) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  return normalized;
}

function buildHealthResponse() {
  const config = getClientConfig();
  return {
    success: true,
    service: SERVICE_NAME,
    provider: "dashscope-qwen",
    ruleVersion: RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    allowClientModelOverride: config.allowClientModelOverride === true,
    enableThinkingDefault: config.enableThinkingDefault === true,
    timeoutMs: config.timeoutMs,
    callLogDir: getLogDir(),
  };
}

async function requestWithPossibleFallback(suggestRequest, prompt, models, config) {
  const hasAudio =
    Array.isArray(suggestRequest.audioCandidates) && suggestRequest.audioCandidates.length > 0;
  const hasTexts =
    Array.isArray(suggestRequest.textCandidates) && suggestRequest.textCandidates.length > 0;

  if (!hasAudio) {
    const compareResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.compareModel,
      includeAudio: false,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });
    return Object.assign({}, compareResult, {
      mode: "text-only",
      usedCompareModel: true,
    });
  }

  try {
    const listenResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.listenModel,
      includeAudio: true,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });
    return Object.assign({}, listenResult, {
      mode: "audio+text",
      usedCompareModel: false,
    });
  } catch (error) {
    if (!hasTexts) {
      throw error;
    }

    const fallbackResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.compareModel,
      includeAudio: false,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });

    return Object.assign({}, fallbackResult, {
      mode: "text-fallback",
      usedCompareModel: true,
      listenErrorCode: String(error?.code || ""),
      listenErrorMessage: sanitizeErrorMessage(error?.message || ""),
    });
  }
}

async function suggestCurrentRequest(body, requestId) {
  const startedAtMs = Date.now();
  let suggestRequest = null;
  let config = null;
  let selectedModels = null;
  requestId = normalizeText(requestId) || createRequestId();

  try {
    const rawBody = body && typeof body === "object" ? body : {};
    suggestRequest = normalizeSuggestRequest(rawBody);
    config = getClientConfig();

    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(
        503,
        "后端未读取到 DASHSCOPE_API_KEY，请检查 config/env/ai.env 或环境变量。",
        "missing-api-key"
      );
    }

    selectedModels = {
      listenModel: resolveModelOverride(
        suggestRequest.listenModel,
        config.listenModel || DEFAULT_LISTEN_MODEL,
        config
      ),
      compareModel: resolveModelOverride(
        suggestRequest.compareModel,
        config.compareModel || DEFAULT_COMPARE_MODEL,
        config
      ),
    };

    const prompt = buildPrompt(suggestRequest);
    const modelResult = await requestWithPossibleFallback(
      suggestRequest,
      prompt,
      selectedModels,
      config
    );
    const modelJson = parseModelJsonText(modelResult.rawText, requestId);
    const normalized = normalizeSuggestionResponse(modelJson);

    if (
      suggestRequest.invalidAudioCount > 0 &&
      normalized.riskFlags.indexOf("invalid_audio_candidate_detected") < 0
    ) {
      normalized.riskFlags.push("invalid_audio_candidate_detected");
    }
    if (
      modelResult.mode === "text-fallback" &&
      normalized.riskFlags.indexOf("audio_unavailable_fallback_text_compare") < 0
    ) {
      normalized.riskFlags.push("audio_unavailable_fallback_text_compare");
    }

    const durationMs = Date.now() - startedAtMs;
    const responseData = {
      requestId,
      decision: normalized.decision,
      recommendedText: normalized.recommendedText,
      confidence: normalized.confidence,
      reasonSummary: normalized.reasonSummary,
      riskFlags: normalized.riskFlags,
      applyAdvice: DEFAULT_APPLY_ADVICE,
      models: {
        listenModel: selectedModels.listenModel,
        compareModel: selectedModels.compareModel,
      },
      usage: normalizeUsage(modelResult.usage),
      mock: modelResult.mock === true,
      timing: {
        durationMs,
      },
      thinking: {
        requested: suggestRequest.enableThinking === true,
        enableThinking: modelResult.enableThinking === true,
        fallbackUsed: modelResult.thinkingFallbackUsed === true,
        fallbackMode: modelResult.thinkingFallbackMode || "",
      },
    };

    return responseData;
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const errorBody = {
      requestId,
      code: normalizeText(error?.code || "internal-error") || "internal-error",
      message:
        sanitizeErrorMessage(error?.message || "AI 推荐请求失败。") || "AI 推荐请求失败。",
    };
    if (error?.code === "provider-http-error" && error?.summary) {
      errorBody.summary = sanitizeErrorMessage(error.summary).slice(0, 200);
    }

    const propagatedError =
      error instanceof Error ? error : new Error(errorBody.message || "AI 推荐请求失败。");
    propagatedError.statusCode = statusCode;
    propagatedError.requestId = requestId;
    propagatedError.code = errorBody.code;
    propagatedError.message = errorBody.message;
    if (errorBody.summary) {
      propagatedError.summary = errorBody.summary;
    }
    throw propagatedError;
  }
}

const handleSuggestCurrent = createAiRoute(transcriptionAdapter, {
  maxBodyBytes: MAX_BODY_BYTES,
  run(context) {
    const requestId =
      normalizeText(context?.runtimeContext?.rawBody?.requestId) || createRequestId();
    const body = context?.runtimeContext?.rawBody || {};
    return suggestCurrentRequest(body, requestId);
  },
  createSuccessBody(context) {
    return transcriptionAdapter.buildSuggestSuccessBody(context);
  },
  createErrorBody(context) {
    return transcriptionAdapter.buildSuggestErrorBody(context);
  },
});
function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });
  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    const config = getClientConfig();
    sendJson(response, 200, {
      success: true,
      service: SERVICE_NAME,
      scriptId: SCRIPT_ID,
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

  router.post(AI_BASE_PATH, function (routeContext) {
    return handleSuggestCurrent(routeContext);
  });
  router.get(AI_LOG_SUMMARY_PATH, function ({ response, query }) {
    sendJson(
      response,
      200,
      buildAiCallLogSummaryPayload({
        service: SERVICE_NAME,
        scriptId: SCRIPT_ID,
        logger: transcriptionAdapter.aiCallLogger,
        query,
      })
    );
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  AI_LOG_SUMMARY_PATH,
  handleSuggestCurrent,
  normalizeSuggestRequest,
  registerAiRoutes,
  suggestCurrentRequest,
};
