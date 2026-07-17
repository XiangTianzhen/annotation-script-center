"use strict";

const { sendJson } = require("../../../backend/response");
const { buildAiCallLogSummaryPayload } = require("../../../backend/ai-call-log");
const { createAiRoute } = require("../../../backend/ai-framework");
const { createAiJobRouteHandlers } = require("../../../backend/ai-framework/core/create-ai-job-routes");
const { buildAsyncJobRuntimeMeta } = require("../../../backend/ai-framework/runtime/ai-runtime-meta");
const { estimateProjectCost } = require("../../../backend/ai/model-pricing");
const {
  buildModelQueueKey,
  enqueueProviderTask,
} = require("../../../backend/ai/provider-queue");
const hangzhouHelperAdapter = require("../ai/adapter");
const {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REQUEST_PARAMS,
  SUPPORTED_REQUEST_PARAMS,
  getClientConfig,
  requestCompare,
  requestListen,
  sanitizeModelName,
} = require("./ai-client-qwen");
const { getLogDir } = require("./ai-call-log");
const { estimateIncome } = require("./ai-cost");
const {
  buildLexiconContext,
  getLexiconState,
} = require("./ai-lexicon");
const {
  SCRIPT_ID,
  deriveLegacyRecognitionMode,
  normalizeModelMode,
  normalizeRecognitionStrategy,
  normalizeReviewRequest,
} = require("./ai-review-request");
const {
  buildComparePrompt,
  buildListenPrompt,
  buildOmniSinglePrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_LISTEN_LEXICON_PROMPT,
  DEFAULT_LISTEN_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  DEFAULT_REFINE_LEXICON_PROMPT,
  DEFAULT_SINGLE_LEXICON_PROMPT,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  normalizeOmniSingleComparison,
  normalizeListenResponse,
  normalizeRuleFirstComparison,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");

const HANGZHOU_AI_BASE_PATH = "/api/magic-data/hangzhou-helper/ai/review-current";
const AI_HEALTH_PATH = HANGZHOU_AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = "/api/magic-data/hangzhou-helper/ai/defaults";
const HANGZHOU_AI_JOBS_PATH = HANGZHOU_AI_BASE_PATH + "/jobs";
const HANGZHOU_AI_JOB_DETAIL_PATH = HANGZHOU_AI_JOBS_PATH + "/:jobId";
const HANGZHOU_AI_JOB_DEBUG_PATH = HANGZHOU_AI_JOB_DETAIL_PATH + "/debug";
const AI_LOG_SUMMARY_PATH = HANGZHOU_AI_BASE_PATH + "/logs/summary";
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MODEL_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 普通话整理模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
];
const LISTEN_MODEL_OPTIONS = [
  "qwen3.5-omni-plus",
  "qwen3.5-omni-flash",
  "qwen3.5-omni-flash-2026-03-15",
  "qwen3-omni-flash",
  "qwen3-omni-flash-2025-12-01",
  "qwen3-omni-flash-2025-09-15",
];
const COMPARE_MODEL_OPTIONS = [
  "qwen3.6-plus",
  "qwen3.5-plus",
  "qwen3.6-flash",
  "qwen3.5-flash",
];
const SERVICE_NAME = "magic-data-hangzhou-helper-ai-review-current";
const COMPONENT_NAME = "asr-voice-ai";

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

async function runQueuedModelTask(modelName, task) {
  const normalizedModel = sanitizeModelName(modelName, "");
  if (!normalizedModel) {
    return task();
  }
  const queued = await enqueueProviderTask(buildModelQueueKey(normalizedModel), task);
  return queued?.value;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function sanitizeDebugText(value) {
  return String(value || "")
    .replace(/https?:\/\/([^\s"'?]+)\?[^ \n\r"']+/gi, "https://$1?<signed-query-redacted>")
    .replace(/(authorization|cookie|token|signature|ossaccesskeyid)\s*[:=]\s*([^\s,;]+)/gi, "$1=<redacted>");
}

function sanitizeDebugValue(value) {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === "string") {
    return sanitizeDebugText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeDebugValue);
  }
  if (typeof value === "object") {
    const next = {};
    Object.keys(value).forEach(function (key) {
      const lower = String(key || "").toLowerCase();
      if (
        lower.indexOf("authorization") >= 0 ||
        lower.indexOf("cookie") >= 0 ||
        lower.indexOf("token") >= 0 ||
        lower.indexOf("signature") >= 0 ||
        lower.indexOf("ossaccesskeyid") >= 0
      ) {
        next[key] = "<redacted>";
      } else {
        next[key] = sanitizeDebugValue(value[key]);
      }
    });
    return next;
  }
  return value;
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
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

function buildHealthResponse() {
  const config = getClientConfig();
  const lexiconState = getLexiconState();
  const modelMode = normalizeModelMode(config.pipelineMode || "two_stage", "two_stage");
  const recognitionStrategy = normalizeRecognitionStrategy(
    config.pipelineMode || "direct_dialect",
    "direct_dialect"
  );
  const recognitionMode = deriveLegacyRecognitionMode(modelMode, recognitionStrategy);
  const runtime = buildAsyncJobRuntimeMeta({ includeQueueSnapshots: true });
  return {
    success: true,
    service: "magic-data-hangzhou-helper-ai-review-current",
    scriptId: "magicDataHangzhouAssistant",
    component: "asr-voice-ai",
    provider: "dashscope-qwen",
    ruleVersion: RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    modelMode: modelMode,
    recognitionStrategy: recognitionStrategy,
    recognitionMode: recognitionMode,
    pipelineMode: recognitionMode,
    derivedPipelineMode: modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
    modelModeOptions: MODEL_MODE_OPTIONS.slice(),
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    listenModelOptions: LISTEN_MODEL_OPTIONS.slice(),
    reviewModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    compareModelOptions: COMPARE_MODEL_OPTIONS.slice(),
    singleModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    singleModelOptions: LISTEN_MODEL_OPTIONS.slice(),
    allowClientModelOverride: config.allowClientModelOverride === true,
    enableThinkingDefault: config.enableThinkingDefault === true,
    enableThinking: config.enableThinkingDefault === true,
    timeoutMs: config.timeoutMs,
    lexiconRewriteMode: config.lexiconRewriteMode,
    lexicon: {
      enabled: lexiconState.enabled,
      status: lexiconState.status,
      source: lexiconState.source,
      rowCount: Array.isArray(lexiconState.rows) ? lexiconState.rows.length : 0,
      warningMessage: String(lexiconState.warningMessage || "").trim(),
    },
    evaluation: {
      sampleCount: 0,
      totalAudioSeconds: 0,
      recommendedDefault: "direct_dialect + qwen3.5-flash",
      estimatedCostPerHourCny: null,
      estimatedCostPer10000HoursCny: null,
      note: "首版沿用客家话助手默认配置；待杭州话独立词表与评测补齐后再更新。",
    },
    callLogDir: getLogDir(),
    jobs: runtime.jobs,
    runtime,
  };
}

function buildReviewLexiconMeta(baseLexicon) {
  const source = baseLexicon && typeof baseLexicon === "object" ? baseLexicon : {};
  return Object.assign({}, source, {
    mode: "prompt_reference_only",
    lexiconMatches: [],
    conversionWarnings: [],
  });
}

function buildDefaultGeneration() {
  return {
    temperature: DEFAULT_REQUEST_PARAMS.temperature,
    top_p: DEFAULT_REQUEST_PARAMS.top_p,
    max_tokens: DEFAULT_REQUEST_PARAMS.max_tokens,
    max_completion_tokens: DEFAULT_REQUEST_PARAMS.max_completion_tokens,
    presence_penalty: DEFAULT_REQUEST_PARAMS.presence_penalty,
    frequency_penalty: DEFAULT_REQUEST_PARAMS.frequency_penalty,
    seed: DEFAULT_REQUEST_PARAMS.seed,
    stop: DEFAULT_REQUEST_PARAMS.stop,
  };
}

function applyFinalDialectNormalizationToResponseData(responseData, options) {
  return Object.assign({}, responseData && typeof responseData === "object" ? responseData : {});
}

function buildStageLexiconContext(stage, input) {
  if (stage?.lexicon?.enabled !== true) {
    const state = getLexiconState();
    return {
      enabled: false,
      status: state.status,
      source: state.source,
      rowCount: Array.isArray(state.rows) ? state.rows.length : 0,
      matchedCount: 0,
      matches: [],
      text: "",
    };
  }
  return buildLexiconContext(input);
}

async function reviewCurrent(body, requestId) {
  const startedAtMs = Date.now();
  requestId = normalizeText(requestId) || createRequestId();
  let reviewRequest = null;
  let config = null;
  let listenDurationMs = 0;
  let compareDurationMs = 0;
  try {
    reviewRequest = normalizeReviewRequest(body || {});
    config = getClientConfig();
    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(503, "missing-api-key", "missing-api-key");
    }

    const isSingle = reviewRequest.modelMode === "omni_single";
    const listenStage = isSingle ? reviewRequest.aiStages.single : reviewRequest.aiStages.listen;
    const refineStage = reviewRequest.aiStages.refine;
    const listenModel = resolveModelOverride(
      listenStage.model || (isSingle ? reviewRequest.singleModel : reviewRequest.listenModel),
      config.listenModel || DEFAULT_LISTEN_MODEL,
      config
    );
    const reviewModel = resolveModelOverride(
      refineStage.model || reviewRequest.compareModel || reviewRequest.reviewModel,
      config.compareModel || DEFAULT_COMPARE_MODEL,
      config
    );

    const beforeListenLexicon = buildStageLexiconContext(listenStage, {
      platformDialectText: reviewRequest.platformDialectText,
      platformMandarinText: reviewRequest.platformMandarinText,
      heardDialectText: "",
    });
    const listenPrompt = isSingle
      ? buildOmniSinglePrompt(reviewRequest, beforeListenLexicon)
      : buildListenPrompt(reviewRequest, beforeListenLexicon);

    const listenStartedAt = Date.now();
    const listenResult = await runQueuedModelTask(listenModel, function () {
      return requestListen(reviewRequest, listenPrompt, {
        timeoutMs: config.timeoutMs,
        model: listenModel,
        enableThinking: reviewRequest.enableThinking,
        aiOptions: listenStage.generation,
      });
    });
    listenDurationMs = Date.now() - listenStartedAt;

    const listenJson = parseModelJsonText(listenResult.rawText, requestId);
    let listen = normalizeListenResponse(listenJson);
    let lexiconContext = beforeListenLexicon;
    let compareResult = { rawText: "", usage: {}, model: "", mock: false };
    let compareJson = listenJson;
    let normalizedResult = null;

    if (isSingle) {
      normalizedResult = normalizeOmniSingleComparison(listenJson, reviewRequest);
      listen = Object.assign({}, listen, normalizedResult.audioCheck || {});
    } else {
      lexiconContext = buildStageLexiconContext(refineStage, {
        platformDialectText: reviewRequest.platformDialectText,
        platformMandarinText: reviewRequest.platformMandarinText,
        heardDialectText: listen.heardDialectText,
      });
      const comparePrompt = buildComparePrompt(reviewRequest, listen, lexiconContext);
      const compareStartedAt = Date.now();
      compareResult = await runQueuedModelTask(reviewModel, function () {
        return requestCompare(
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
            aiOptions: refineStage.generation,
          }
        );
      });
      compareDurationMs = Date.now() - compareStartedAt;
      compareJson = parseModelJsonText(compareResult.rawText, requestId);
      normalizedResult = normalizeRuleFirstComparison(compareJson, reviewRequest, listen);
    }

    if (!listen.isValidAudio) {
      normalizedResult.reviewConclusion = "risky";
      normalizedResult.shouldReview = true;
      if (normalizedResult.textRuleCheck.ruleIssues.indexOf("音频无效或不清晰，建议人工复核。") < 0) {
        normalizedResult.textRuleCheck.ruleIssues.push("音频无效或不清晰，建议人工复核。");
      }
    }

    const effectiveTimeSeconds = computeEffectiveTimeSeconds(reviewRequest);
    const estimatedIncome = estimateIncome(effectiveTimeSeconds);
    const listenUsage = normalizeUsage(listenResult.usage);
    const compareUsage = normalizeUsage(compareResult.usage);
    const totalDurationMs = Date.now() - startedAtMs;
    const cost = estimateProjectCost(isSingle ? {
      single: {
        modelId: listenResult.model || listenModel || DEFAULT_LISTEN_MODEL,
        usage: listenUsage,
        outputMode: "text",
      },
    } : {
      listen: {
        modelId: listenResult.model || listenModel || DEFAULT_LISTEN_MODEL,
        usage: listenUsage,
        outputMode: "text",
      },
      compare: {
        modelId: compareResult.model || reviewModel || DEFAULT_COMPARE_MODEL,
        usage: compareUsage,
        outputMode: "text",
      },
    });

    const showHeardText = reviewRequest.showHeardText !== false;
    const heardDialectText = showHeardText ? listen.heardDialectText : "";
    const heardMandarinMeaning = showHeardText ? listen.heardMandarinMeaning : "";

    const speakerCheck = normalizedResult?.speakerCheck || {};
    const dialectTextCheck = normalizedResult?.dialectTextCheck || {};
    const mandarinTextCheck = normalizedResult?.mandarinTextCheck || {};
    const overall = normalizedResult?.overall || {};
    const normalizedSummary = normalizeText(
      overall.summary || normalizedResult?.recommendations?.summary || ""
    );
    const responseData = applyFinalDialectNormalizationToResponseData({
      requestId,
      service: SERVICE_NAME,
      scriptId: SCRIPT_ID,
      component: COMPONENT_NAME,
      pageType: reviewRequest.pageType || "asrmark",
      taskItemId: reviewRequest.taskItemId || "",
      samplingRecordId: reviewRequest.samplingRecordId || "",
      reviewConclusion: normalizedResult.reviewConclusion,
      shouldReview: normalizedResult.shouldReview === true,
      modelMode: reviewRequest.modelMode,
      recognitionStrategy: reviewRequest.recognitionStrategy,
      recognitionMode: reviewRequest.recognitionMode,
      pipelineMode: reviewRequest.recognitionMode,
      derivedPipelineMode: reviewRequest.modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
      effectiveTime: effectiveTimeSeconds,
      estimatedIncome,
      platformBaseline: {
        dialectText: reviewRequest.platformDialectText,
        mandarinText: reviewRequest.platformMandarinText,
        gender: reviewRequest?.speaker?.gender || "",
        ageRange: reviewRequest?.speaker?.ageRange || "",
        pureDialect: reviewRequest?.speaker?.pureDialect || "",
      },
      speakerCheck: speakerCheck,
      dialectTextCheck: dialectTextCheck,
      mandarinTextCheck: mandarinTextCheck,
      overall: {
        reviewConclusion: overall.reviewConclusion || normalizedResult.reviewConclusion,
        shouldReview: overall.shouldReview === true || normalizedResult.shouldReview === true,
        summary: normalizedSummary,
      },
      audioCheck: {
        isValidAudio: listen.isValidAudio,
        validityDecision: listen.validityDecision,
        riskFlags: listen.riskFlags,
        invalidReasons: listen.invalidReasons,
        genderGuess: listen.genderGuess,
        ageRangeGuess: listen.ageRangeGuess,
        pureDialectGuess: listen.pureDialectGuess,
        heardDialectText,
        heardMandarinMeaning,
        confidence: listen.confidence,
      },
      textRuleCheck: normalizedResult.textRuleCheck,
      recommendations: {
        dialectText: normalizeText(
          normalizedResult?.recommendations?.dialectText ||
            dialectTextCheck?.suggestedValue ||
            listen.heardDialectText ||
            reviewRequest.platformDialectText
        ),
        mandarinText: normalizeText(
          normalizedResult?.recommendations?.mandarinText ||
            mandarinTextCheck?.suggestedValue ||
            listen.heardMandarinMeaning ||
            reviewRequest.platformMandarinText
        ),
        summary: normalizedSummary,
      },
      lexicon: buildReviewLexiconMeta(
        {
          enabled: beforeListenLexicon.enabled || lexiconContext.enabled,
          status: lexiconContext.status,
          source: lexiconContext.source || beforeListenLexicon.source,
          rowCount: Math.max(
            Number(beforeListenLexicon.rowCount) || 0,
            Number(lexiconContext.rowCount) || 0
          ),
          stages: {
            listen: {
              enabled: !isSingle && listenStage.lexicon.enabled === true,
              contextEntryCount: !isSingle ? Number(beforeListenLexicon.matchedCount) || 0 : 0,
            },
            refine: {
              enabled: !isSingle && refineStage.lexicon.enabled === true,
              contextEntryCount: !isSingle ? Number(lexiconContext.matchedCount) || 0 : 0,
            },
            single: {
              enabled: isSingle && listenStage.lexicon.enabled === true,
              contextEntryCount: isSingle ? Number(beforeListenLexicon.matchedCount) || 0 : 0,
            },
          },
        },
        config.lexiconRewriteMode
      ),
      models: {
        listenModel: listenResult.model || listenModel || DEFAULT_LISTEN_MODEL,
        reviewModel: isSingle ? "" : compareResult.model || reviewModel || DEFAULT_COMPARE_MODEL,
        compareModel: isSingle ? "" : compareResult.model || reviewModel || DEFAULT_COMPARE_MODEL,
        singleModel: isSingle ? listenResult.model || listenModel || DEFAULT_LISTEN_MODEL : "",
      },
      usage: {
        listen: listenUsage,
        compare: compareUsage,
        single: isSingle ? listenUsage : normalizeUsage({}),
      },
      cost,
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
      rawAiDebug: sanitizeDebugValue({
        hasRaw:
          Boolean(String(listenResult.rawText || "").trim()) ||
          Boolean(String(compareResult.rawText || "").trim()),
        modelMode: reviewRequest.modelMode,
        recognitionStrategy: reviewRequest.recognitionStrategy,
        recognitionMode: reviewRequest.recognitionMode,
        derivedPipelineMode:
          reviewRequest.modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
        recognizedMandarinText: "",
        convertedDialectText: "",
        lexiconMatches: [],
        conversionWarnings: [],
      }),
      rawModelText: sanitizeDebugValue({
        listen: listenResult.rawText || "",
        compare: compareResult.rawText || "",
        single: isSingle ? listenResult.rawText || "" : "",
      }),
      rawJson: sanitizeDebugValue({
        listen: listenJson,
        compare: compareJson,
      }),
      recognitionConvert: null,
      mock: Boolean(config.mockEnabled || listenResult.mock || compareResult.mock),

      // Legacy compatibility for previous frontend fields.
      verdict: !listen.isValidAudio ? "invalid_audio" : normalizedResult.legacyComparison.verdict,
      listen: {
        heardDialectText,
        heardMandarinMeaning,
        isValidAudio: listen.isValidAudio,
        invalidReasons: listen.invalidReasons,
        riskFlags: listen.riskFlags,
        confidence: listen.confidence,
      },
      comparison: {
        dialectLine: normalizedResult.legacyComparison.dialectLine,
        mandarinLine: normalizedResult.legacyComparison.mandarinLine,
        lexiconIssues: normalizedResult.legacyComparison.lexiconIssues,
        ruleIssues: normalizedResult.legacyComparison.ruleIssues,
      },
    });

    return {
      data: responseData,
    };
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

    const propagatedError =
      error instanceof Error
        ? error
        : new Error(normalizeText(error) || "Magic Data AI review-current 请求失败。");
    propagatedError.statusCode = statusCode;
    propagatedError.requestId = requestId;
    propagatedError.code = responseBody.code;
    propagatedError.message = responseBody.message;
    if (responseBody.summary) {
      propagatedError.summary = responseBody.summary;
    }

    throw propagatedError;
  }
}

const reviewCurrentRouteOptions = {
  maxBodyBytes: MAX_BODY_BYTES,
  run(context) {
    const requestId = normalizeText(context?.normalizedRequest?.requestId || createRequestId());
    const body = context?.runtimeContext?.rawBody || {};
    return reviewCurrent(body, requestId);
  },
  createSuccessBody(context) {
    return hangzhouHelperAdapter.buildReviewSuccessBody(context);
  },
  createErrorBody(context) {
    const error = context?.error || {};
    if (error?.code === "timeout" && !error.statusCode) {
      error.statusCode = 504;
    }
    return hangzhouHelperAdapter.buildReviewErrorBody(context);
  },
};
const handleReviewCurrent = createAiRoute(hangzhouHelperAdapter, reviewCurrentRouteOptions);
const reviewCurrentJobHandlers = createAiJobRouteHandlers(
  hangzhouHelperAdapter,
  reviewCurrentRouteOptions
);
function registerAiRoutes(router) {
  function buildDefaultsPayload(config) {
    const modelMode = normalizeModelMode(config.pipelineMode || "two_stage", "two_stage");
    const recognitionStrategy = normalizeRecognitionStrategy(
      config.pipelineMode || "direct_dialect",
      "direct_dialect"
    );
    const recognitionMode = deriveLegacyRecognitionMode(modelMode, recognitionStrategy);
    const runtime = buildAsyncJobRuntimeMeta();
    return {
      success: true,
      service: "magic-data-hangzhou-helper-ai-review-current",
      scriptId: "magicDataHangzhouAssistant",
      component: "asr-voice-ai",
      defaults: {
        modelMode: modelMode,
        recognitionStrategy: recognitionStrategy,
        recognitionMode: recognitionMode,
        pipelineMode: recognitionMode,
        derivedPipelineMode: modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
        modelModeOptions: MODEL_MODE_OPTIONS.slice(),
        listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
        listenModelOptions: LISTEN_MODEL_OPTIONS.slice(),
        compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
        compareModelOptions: COMPARE_MODEL_OPTIONS.slice(),
        singleModel: config.listenModel || DEFAULT_LISTEN_MODEL,
        singleModelOptions: LISTEN_MODEL_OPTIONS.slice(),
        reviewModel: config.compareModel || DEFAULT_COMPARE_MODEL,
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
        comparePrompt: "",
        reviewPrompt: DEFAULT_COMPARE_TEMPLATE,
        stages: {
          listen: {
            model: config.listenModel || DEFAULT_LISTEN_MODEL,
            prompt: DEFAULT_LISTEN_TEMPLATE,
            generation: buildDefaultGeneration(),
            lexicon: { enabled: true, prompt: DEFAULT_LISTEN_LEXICON_PROMPT },
          },
          refine: {
            model: config.compareModel || DEFAULT_COMPARE_MODEL,
            prompt: DEFAULT_COMPARE_TEMPLATE,
            generation: buildDefaultGeneration(),
            lexicon: { enabled: true, prompt: DEFAULT_REFINE_LEXICON_PROMPT },
          },
          single: {
            model: config.listenModel || DEFAULT_LISTEN_MODEL,
            prompt: DEFAULT_OMNI_SINGLE_TEMPLATE,
            generation: buildDefaultGeneration(),
            lexicon: { enabled: true, prompt: DEFAULT_SINGLE_LEXICON_PROMPT },
          },
        },
      },
      supportedParams: SUPPORTED_REQUEST_PARAMS,
      jobs: runtime.jobs,
      runtime,
      evaluation: {
        sampleCount: 0,
        totalAudioSeconds: 0,
        recommendedDefault: "direct_dialect + qwen3.5-flash",
        highQualityCandidate: "",
        mandarinPriorityCandidate: "",
        costPer10000HoursCny: {},
        note: "首版沿用客家话助手默认配置；待杭州话独立评测后再补充。",
      },
      notes: {
        promptOverride: "Prompt 可在前端覆盖；空 override 使用后端默认。",
        responseFormat: "结构化输出由后端固定控制，前端不配置。",
        requestMode:
          "默认短请求创建 /jobs 任务，再轮询 job 状态；同步 review-current 仅保留兼容 / 调试入口。",
        compatibility:
          "兼容旧字段 listenModel/reviewModel/enableThinking/reviewPrompt 一个迁移周期；新请求优先使用 aiStages.listen/refine/single，旧 recognitionStrategy 会被忽略。",
      },
    };
  }

  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });
  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    const config = getClientConfig();
    sendJson(response, 200, buildDefaultsPayload(config));
  });

  router.post(HANGZHOU_AI_BASE_PATH, function (routeContext) {
    return handleReviewCurrent(routeContext);
  });
  router.post(HANGZHOU_AI_JOBS_PATH, function (routeContext) {
    return reviewCurrentJobHandlers.handleCreateJob(routeContext);
  });
  router.get(HANGZHOU_AI_JOB_DETAIL_PATH, function (routeContext) {
    return reviewCurrentJobHandlers.handleGetJobStatus(routeContext);
  });
  router.get(HANGZHOU_AI_JOB_DEBUG_PATH, function (routeContext) {
    return reviewCurrentJobHandlers.handleGetJobDebug(routeContext);
  });
  router.get(AI_LOG_SUMMARY_PATH, function ({ response, query }) {
    sendJson(
      response,
      200,
      buildAiCallLogSummaryPayload({
        service: SERVICE_NAME,
        scriptId: SCRIPT_ID,
        logger: hangzhouHelperAdapter.aiCallLogger,
        query,
      })
    );
  });
}

module.exports = {
  AI_BASE_PATH: HANGZHOU_AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  AI_JOB_DEBUG_PATH: HANGZHOU_AI_JOB_DEBUG_PATH,
  AI_JOB_DETAIL_PATH: HANGZHOU_AI_JOB_DETAIL_PATH,
  AI_JOBS_PATH: HANGZHOU_AI_JOBS_PATH,
  AI_LOG_SUMMARY_PATH,
  handleReviewCurrent,
  normalizeReviewRequest,
  reviewCurrent,
  registerAiRoutes,
  __test__: {
    applyFinalDialectNormalizationToResponseData,
    buildReviewLexiconMeta,
  },
};
