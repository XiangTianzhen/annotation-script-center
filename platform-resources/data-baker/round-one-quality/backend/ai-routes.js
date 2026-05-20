"use strict";

const { sendJson } = require("../../../backend/response");
const {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_OMNI_MODEL,
  DEFAULT_REQUEST_PARAMS,
  SUPPORTED_REQUEST_PARAMS,
  getClientConfig,
  requestCompare,
  requestOmniSingle,
} = require("./ai-client-qwen");
const {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrClientConfig,
  requestFunAsrRecognition,
} = require("./ai-client-funasr");
const { estimateCost } = require("./ai-cost");
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const { applyLexiconRewrite, buildLexiconContext } = require("./ai-lexicon");
const { normalizeToSimplifiedChinesePreservingLexicon } = require("./ai-text-normalizer");
const {
  buildComparePrompt,
  buildOmniSinglePrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_OMNI_SINGLE_TEMPLATE,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  buildRecommendResponse,
  ensureChineseSentencePunctuation,
  normalizeCompareResponse,
  normalizeOmniSingleResponse,
  normalizeUsage,
  parseModelJsonText,
  removeTextSpaces,
} = require("./ai-response-schema");
const {
  enqueueProviderTask,
  getGlobalQueueMaxSize,
  getGlobalRetryMax,
  getQueueSnapshots,
} = require("./ai-provider-queue");
const {
  buildRecommendCacheKey,
  getCacheSnapshot,
  getCachedRecommendResult,
  setCachedRecommendResult,
} = require("./ai-result-cache");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const SUPPORTED_PIPELINE_MODES = [
  { value: "omni_single", label: "Omni 单模型（默认）" },
  { value: "fun_asr_compare", label: "Fun-ASR + 比较模型" },
];
const LEGACY_PIPELINE_MODE_MAP = {
  two_stage: "omni_single",
  qwen_omni_two_stage: "omni_single",
  listen_only: "omni_single",
};
const deprecatedModeLogKeys = new Set();

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

function resolvePipelineMode(value, fallbackMode, sourceLabel) {
  const fallbackText = String(fallbackMode || "omni_single").trim().toLowerCase();
  const normalizedFallback = fallbackText === "fun_asr_compare" ? "fun_asr_compare" : "omni_single";
  const rawText = String(value || "").trim().toLowerCase();
  if (!rawText) {
    return {
      mode: normalizedFallback,
      deprecatedFrom: "",
      source: sourceLabel || "env",
      warning: "",
    };
  }
  if (rawText === "fun_asr_compare" || rawText === "omni_single") {
    return {
      mode: rawText,
      deprecatedFrom: "",
      source: sourceLabel || "env",
      warning: "",
    };
  }
  if (LEGACY_PIPELINE_MODE_MAP[rawText]) {
    return {
      mode: LEGACY_PIPELINE_MODE_MAP[rawText],
      deprecatedFrom: rawText,
      source: sourceLabel || "env",
      warning:
        "deprecated pipeline mode " + rawText + " 已迁移为 " + LEGACY_PIPELINE_MODE_MAP[rawText],
    };
  }
  return {
    mode: normalizedFallback,
    deprecatedFrom: "",
    source: sourceLabel || "env",
    warning: "",
  };
}

function getEnvPipelineResolution() {
  return resolvePipelineMode(process.env.DATABAKER_AI_PIPELINE_MODE || "omni_single", "omni_single", "env");
}

function logDeprecatedPipelineOnce(resolution) {
  if (!resolution?.deprecatedFrom || !resolution.warning) {
    return;
  }
  const key = resolution.source + ":" + resolution.deprecatedFrom + ":" + resolution.mode;
  if (deprecatedModeLogKeys.has(key)) {
    return;
  }
  deprecatedModeLogKeys.add(key);
  console.warn("[DataBaker][round-one-quality][ai]", resolution.warning);
}

function normalizePromptText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
}

function normalizeNumberInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }
  return number;
}

function normalizeIntegerInRange(value, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }
  return number;
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

function normalizeModelText(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function normalizeAiOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  const listenPrompt = normalizePromptText(source.listenPrompt);
  const comparePrompt = normalizePromptText(source.comparePrompt);
  const listenModel = normalizeModelText(source.listenModel);
  const compareModel = normalizeModelText(source.compareModel);
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
    const normalized = normalizeStopSequences(source.stop);
    if (normalized.length > 0) {
      result.stop = normalized;
    }
  }
  if (typeof source.enable_thinking === "boolean") {
    result.enable_thinking = source.enable_thinking === true;
  } else if (typeof source.enableThinking === "boolean") {
    result.enable_thinking = source.enableThinking === true;
  }
  return result;
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
    pipelineMode: normalizeModelText(source.pipelineMode),
    aiOptions,
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

function summarizeQueueMeta(queueMeta) {
  const source = queueMeta && typeof queueMeta === "object" ? queueMeta : {};
  return {
    groupName: String(source.groupName || ""),
    queueWaitMs: Math.max(0, Number(source.queueWaitMs) || 0),
    retryCount: Math.max(0, Number(source.retryCount) || 0),
    retryDelaysMs: Array.isArray(source.retryDelaysMs) ? source.retryDelaysMs.slice(0, 6) : [],
    durationMs: Math.max(0, Number(source.durationMs) || 0),
  };
}

function appendCallLogSafe(record) {
  try {
    appendAiCallLog(record);
  } catch (error) {
    console.warn("[DataBaker][round-one-quality][ai] append log failed", String(error?.message || error));
  }
}

function createHealthPayload() {
  const qwenConfig = getClientConfig();
  const funAsrConfig = getFunAsrClientConfig();
  const envPipeline = getEnvPipelineResolution();
  logDeprecatedPipelineOnce(envPipeline);
  return {
    success: true,
    service: "data-baker-round-one-quality-ai-recommend",
    provider: "dashscope-fun-asr-and-qwen",
    ruleVersion: RULE_VERSION,
    pipelineMode: envPipeline.mode,
    deprecatedPipelineMode: envPipeline.deprecatedFrom || "",
    supportedPipelineModes: SUPPORTED_PIPELINE_MODES,
    funAsrModel: funAsrConfig.model || DEFAULT_FUN_ASR_MODEL,
    funAsrPythonConfigured: funAsrConfig.pythonExists === true,
    omniModel: qwenConfig.omniModel || DEFAULT_OMNI_MODEL,
    compareModel: qwenConfig.compareModel || DEFAULT_COMPARE_MODEL,
    mockEnabled: qwenConfig.mockEnabled || funAsrConfig.mockEnabled,
    hasApiKey: qwenConfig.hasApiKey || funAsrConfig.hasApiKey,
    callLogDir: getLogDir(),
    cache: getCacheSnapshot(),
    queue: {
      maxSize: getGlobalQueueMaxSize(),
      retryMax: getGlobalRetryMax(),
      groups: getQueueSnapshots(),
    },
    status: qwenConfig.hasApiKey || qwenConfig.mockEnabled ? "ready" : "missing-api-key",
  };
}

function sendHealth(response) {
  sendJson(response, 200, createHealthPayload());
}

function buildCacheKeyInput(recommendRequest, pipelineMode, listenModel, compareModel) {
  return {
    audioUrl: recommendRequest.audioUrl,
    effectiveStartTime: recommendRequest.effectiveStartTime,
    effectiveEndTime: recommendRequest.effectiveEndTime,
    pipelineMode,
    listenModel,
    compareModel,
    ruleVersion: RULE_VERSION,
    listenPrompt: recommendRequest.aiOptions.listenPrompt || "",
    comparePrompt: recommendRequest.aiOptions.comparePrompt || "",
  };
}

async function runQueuedProviderCall(groupName, task) {
  return enqueueProviderTask(groupName, task);
}

function rewriteRecommendedText(recommendedText, request, heardText) {
  const rewriteMode = getLexiconRewriteMode();
  const rewriteResult = applyLexiconRewrite(recommendedText, {
    pageText: request.pageText,
    heardText: heardText,
    mode: rewriteMode,
  });
  let nextText = rewriteResult.changed ? rewriteResult.text : recommendedText;
  nextText = normalizeToSimplifiedChinesePreservingLexicon(nextText);
  nextText = removeTextSpaces(nextText);
  nextText = ensureChineseSentencePunctuation(nextText);
  return {
    rewriteMode,
    rewriteResult,
    text: nextText,
  };
}

function createRuntimeMeta(options) {
  const queueMetas = Array.isArray(options?.queueMetas) ? options.queueMetas : [];
  return {
    cache: {
      hit: options?.cacheHit === true,
      ttlMs: Number(options?.cacheTtlMs) || 0,
      sourceRequestId: String(options?.cacheSourceRequestId || ""),
    },
    deprecatedMode: String(options?.deprecatedMode || ""),
    queue: {
      groups: queueMetas.map(summarizeQueueMeta),
      totalQueueWaitMs: queueMetas.reduce(function (total, item) {
        return total + Math.max(0, Number(item?.queueWaitMs) || 0);
      }, 0),
      totalRetryCount: queueMetas.reduce(function (total, item) {
        return total + Math.max(0, Number(item?.retryCount) || 0);
      }, 0),
    },
  };
}

async function handleRecommend(request, response) {
  const startedAtMs = Date.now();
  let requestId = createRequestId();
  let recommendRequest = null;
  let qwenConfig = null;
  let funAsrConfig = null;
  let pipelineMode = getEnvPipelineResolution().mode;
  let deprecatedMode = "";
  let listenDurationMs = 0;
  let compareDurationMs = 0;
  let activeListenModel = "";
  let activeCompareModel = "";
  let cacheKey = "";
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

    qwenConfig = getClientConfig();
    funAsrConfig = getFunAsrClientConfig();
    const envPipeline = getEnvPipelineResolution();
    const requestPipeline = resolvePipelineMode(recommendRequest.pipelineMode, envPipeline.mode, "request");
    logDeprecatedPipelineOnce(envPipeline);
    logDeprecatedPipelineOnce(requestPipeline);
    pipelineMode = requestPipeline.mode || envPipeline.mode;
    deprecatedMode = requestPipeline.deprecatedFrom || envPipeline.deprecatedFrom || "";

    if (!qwenConfig.hasApiKey && !qwenConfig.mockEnabled) {
      throw createHttpError(503, "缺少 DASHSCOPE_API_KEY。", "missing-api-key");
    }

    const effectiveEnableThinking =
      typeof recommendRequest.aiOptions.enable_thinking === "boolean"
        ? recommendRequest.aiOptions.enable_thinking === true
        : qwenConfig.enableThinkingDefault === true;

    activeListenModel =
      pipelineMode === "fun_asr_compare"
        ? normalizeModelText(recommendRequest.aiOptions.listenModel || funAsrConfig.model || DEFAULT_FUN_ASR_MODEL)
        : normalizeModelText(recommendRequest.aiOptions.listenModel || qwenConfig.omniModel || DEFAULT_OMNI_MODEL);
    activeCompareModel = normalizeModelText(
      recommendRequest.aiOptions.compareModel || qwenConfig.compareModel || DEFAULT_COMPARE_MODEL
    );

    cacheKey = buildRecommendCacheKey(
      buildCacheKeyInput(recommendRequest, pipelineMode, activeListenModel, activeCompareModel)
    );
    const cached = getCachedRecommendResult(cacheKey);
    if (cached) {
      const cacheSnapshot = getCacheSnapshot();
      const responseData = cloneJson(cached);
      const cacheSourceRequestId = responseData.requestId || "";
      responseData.requestId = requestId;
      responseData.runtime = createRuntimeMeta({
        cacheHit: true,
        cacheTtlMs: cacheSnapshot.ttlMs,
        cacheSourceRequestId,
        deprecatedMode,
        queueMetas: [],
      });
      appendCallLogSafe({
        createdAt: new Date().toISOString(),
        requestId,
        success: true,
        durationMs: Date.now() - startedAtMs,
        listenDurationMs: 0,
        compareDurationMs: 0,
        request: recommendRequest,
        response: responseData,
        listenModel: activeListenModel,
        compareModel: activeCompareModel,
        pipelineMode,
        audioHostname: parseAudioHostname(recommendRequest.audioUrl),
        mock: Boolean(qwenConfig.mockEnabled),
      });
      sendJson(response, 200, {
        success: true,
        data: responseData,
      });
      return;
    }

    console.info("[DataBaker][round-one-quality][ai] recommend start", {
      requestId,
      hostname: parseAudioHostname(recommendRequest.audioUrl),
      sentenceNumber: recommendRequest.sentenceNumber,
      pipelineMode,
      listenModel: activeListenModel,
      compareModel: activeCompareModel,
      enableThinking: effectiveEnableThinking,
      mock: qwenConfig.mockEnabled,
    });

    const queueMetas = [];
    let responseData = null;

    if (pipelineMode === "fun_asr_compare") {
      const listenStartedAtMs = Date.now();
      let funAsrResult = null;
      try {
        const queued = await runQueuedProviderCall("fun_asr", function () {
          return requestFunAsrRecognition(recommendRequest, {
            model: activeListenModel,
            timeoutMs: qwenConfig.timeoutMs,
          });
        });
        funAsrResult = queued.value;
        queueMetas.push(queued.queueMeta);
      } finally {
        listenDurationMs = Date.now() - listenStartedAtMs;
      }

      const heardText = normalizeToSimplifiedChinesePreservingLexicon(
        removeTextSpaces(funAsrResult.heardText || "")
      );
      const listenData = {
        heardText,
        confidence: Number(funAsrResult.confidence || 0),
        isValid: Boolean(heardText),
        invalidReasons: [],
      };
      const compareLexiconContext = buildLexiconContext({
        pageText: recommendRequest.pageText,
        heardText: heardText,
        limit: 60,
      });
      const comparePrompt = buildComparePrompt(recommendRequest, heardText, compareLexiconContext);
      const compareStartedAtMs = Date.now();
      let compareResult = null;
      try {
        const queued = await runQueuedProviderCall("text_compare", function () {
          return requestCompare(recommendRequest, comparePrompt, heardText, {
            model: activeCompareModel,
            timeoutMs: qwenConfig.timeoutMs,
            enableThinking: effectiveEnableThinking,
          });
        });
        compareResult = queued.value;
        queueMetas.push(queued.queueMeta);
      } finally {
        compareDurationMs = Date.now() - compareStartedAtMs;
      }
      const compareJson = parseModelJsonText(compareResult.rawText, requestId);
      const normalizedCompare = normalizeCompareResponse(compareJson, {
        pageText: recommendRequest.pageText,
        heardText,
      });
      const rewriteState = rewriteRecommendedText(
        normalizeToSimplifiedChinesePreservingLexicon(removeTextSpaces(normalizedCompare.recommendedText)),
        recommendRequest,
        heardText
      );
      normalizedCompare.recommendedText = rewriteState.text;
      if (rewriteState.rewriteResult.changed) {
        normalizedCompare.needHumanReview = true;
      }

      responseData = buildRecommendResponse({
        requestId,
        request: recommendRequest,
        listen: listenData,
        compare: normalizedCompare,
        listenModel: funAsrResult.model,
        compareModel: compareResult.model,
        listenUsage: normalizeUsage(funAsrResult.usage),
        compareUsage: normalizeUsage(compareResult.usage),
        cost: estimateCost({
          effectiveTime: recommendRequest.effectiveTime,
          listenUsage: {},
          compareUsage: normalizeUsage(compareResult.usage),
        }),
        listenConfidence: listenData.confidence,
        compareConfidence: normalizedCompare.confidence,
      });
      responseData.lexicon = {
        enabled: Boolean(compareLexiconContext.enabled || rewriteState.rewriteMode !== "off"),
        rewriteMode: rewriteState.rewriteMode,
        matchedCount: Number(compareLexiconContext.matchedCount || 0),
        rewriteChanged: rewriteState.rewriteResult.changed === true,
        rewriteChanges: rewriteState.rewriteResult.changes,
      };
      responseData.timing = {
        listenDurationMs,
        compareDurationMs,
        totalDurationMs: Date.now() - startedAtMs,
      };
    } else {
      const singleLexiconContext = buildLexiconContext({
        pageText: recommendRequest.pageText,
        heardText: "",
        limit: 60,
      });
      const singlePrompt = buildOmniSinglePrompt(recommendRequest, singleLexiconContext);
      const listenStartedAtMs = Date.now();
      let singleResult = null;
      try {
        const queued = await runQueuedProviderCall("qwen_omni", function () {
          return requestOmniSingle(recommendRequest, singlePrompt, {
            model: activeListenModel,
            timeoutMs: qwenConfig.timeoutMs,
            enableThinking: effectiveEnableThinking,
          });
        });
        singleResult = queued.value;
        queueMetas.push(queued.queueMeta);
      } finally {
        listenDurationMs = Date.now() - listenStartedAtMs;
      }

      const singleJson = parseModelJsonText(singleResult.rawText, requestId);
      const normalizedSingle = normalizeOmniSingleResponse(singleJson, {
        pageText: recommendRequest.pageText,
      });
      normalizedSingle.heardText = normalizeToSimplifiedChinesePreservingLexicon(
        removeTextSpaces(normalizedSingle.heardText)
      );
      const rewriteState = rewriteRecommendedText(
        normalizeToSimplifiedChinesePreservingLexicon(removeTextSpaces(normalizedSingle.recommendedText)),
        recommendRequest,
        normalizedSingle.heardText
      );
      normalizedSingle.recommendedText = rewriteState.text;
      if (rewriteState.rewriteResult.changed) {
        normalizedSingle.needHumanReview = true;
      }

      responseData = buildRecommendResponse({
        requestId,
        request: recommendRequest,
        listen: {
          heardText: normalizedSingle.heardText,
          confidence: normalizedSingle.confidence,
          isValid: Boolean(normalizedSingle.heardText),
          invalidReasons: [],
        },
        compare: {
          recommendedText: normalizedSingle.recommendedText,
          decision: normalizedSingle.decision,
          changePoints: normalizedSingle.changePoints,
          confidence: normalizedSingle.confidence,
          needHumanReview: normalizedSingle.needHumanReview,
        },
        listenModel: singleResult.model,
        compareModel: "",
        listenUsage: normalizeUsage(singleResult.usage),
        compareUsage: normalizeUsage({}),
        cost: estimateCost({
          effectiveTime: recommendRequest.effectiveTime,
          listenUsage: normalizeUsage(singleResult.usage),
          compareUsage: {},
        }),
        listenConfidence: normalizedSingle.confidence,
        compareConfidence: normalizedSingle.confidence,
      });
      responseData.lexicon = {
        enabled: Boolean(singleLexiconContext.enabled || rewriteState.rewriteMode !== "off"),
        rewriteMode: rewriteState.rewriteMode,
        matchedCount: Number(singleLexiconContext.matchedCount || 0),
        rewriteChanged: rewriteState.rewriteResult.changed === true,
        rewriteChanges: rewriteState.rewriteResult.changes,
      };
      responseData.timing = {
        listenDurationMs,
        compareDurationMs: 0,
        totalDurationMs: Date.now() - startedAtMs,
      };
    }

    responseData.pipelineMode = pipelineMode;
    responseData.runtime = createRuntimeMeta({
      cacheHit: false,
      cacheTtlMs: setCachedRecommendResult(cacheKey, responseData),
      deprecatedMode,
      queueMetas,
    });
    responseData.thinking = {
      enableThinking: effectiveEnableThinking,
    };
    responseData.normalization = {
      simplifiedChineseApplied: true,
      lexiconTermsPreserved: true,
    };

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: true,
      durationMs: Date.now() - startedAtMs,
      listenDurationMs,
      compareDurationMs,
      request: recommendRequest,
      response: responseData,
      listenModel: activeListenModel,
      compareModel: activeCompareModel,
      pipelineMode,
      audioHostname: parseAudioHostname(recommendRequest.audioUrl),
      mock: Boolean(qwenConfig.mockEnabled),
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
      code: String(error?.code || ""),
      message: String(error?.message || "DataBaker AI recommend 请求失败。").slice(0, 240),
    };
    if (Number(error?.providerStatus) > 0) {
      responseBody.providerStatus = Number(error.providerStatus);
    } else if (error?.code === "provider-rate-limited") {
      responseBody.providerStatus = 429;
    } else if (error?.code === "provider-http-error" && Number(error?.statusCode) > 0) {
      responseBody.providerStatus = Number(error.statusCode);
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
      listenModel: activeListenModel || qwenConfig?.omniModel || funAsrConfig?.model || DEFAULT_OMNI_MODEL,
      compareModel: activeCompareModel || qwenConfig?.compareModel || DEFAULT_COMPARE_MODEL,
      pipelineMode,
      audioHostname: parseAudioHostname(recommendRequest?.audioUrl || ""),
      mock: Boolean(qwenConfig?.mockEnabled || funAsrConfig?.mockEnabled),
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
    const qwenConfig = getClientConfig();
    const funAsrConfig = getFunAsrClientConfig();
    const envPipeline = getEnvPipelineResolution();
    logDeprecatedPipelineOnce(envPipeline);
    sendJson(response, 200, {
      success: true,
      service: "data-baker-round-one-quality-ai-recommend",
      scriptId: "dataBakerRoundOneQuality",
      component: "asr-voice-ai",
      defaults: {
        pipelineMode: envPipeline.mode,
        supportedPipelineModes: SUPPORTED_PIPELINE_MODES,
        listenModel:
          envPipeline.mode === "fun_asr_compare"
            ? funAsrConfig.model || DEFAULT_FUN_ASR_MODEL
            : qwenConfig.omniModel || DEFAULT_OMNI_MODEL,
        compareModel: qwenConfig.compareModel || DEFAULT_COMPARE_MODEL,
        funAsrModel: funAsrConfig.model || DEFAULT_FUN_ASR_MODEL,
        funAsrPythonConfigured: funAsrConfig.pythonExists === true,
        omniModel: qwenConfig.omniModel || DEFAULT_OMNI_MODEL,
        reviewModel: "",
        timeoutMs: qwenConfig.timeoutMs,
        enableThinking: qwenConfig.enableThinkingDefault === true,
        temperature: DEFAULT_REQUEST_PARAMS.temperature,
        top_p: DEFAULT_REQUEST_PARAMS.top_p,
        max_tokens: DEFAULT_REQUEST_PARAMS.max_tokens,
        max_completion_tokens: DEFAULT_REQUEST_PARAMS.max_completion_tokens,
        presence_penalty: DEFAULT_REQUEST_PARAMS.presence_penalty,
        frequency_penalty: DEFAULT_REQUEST_PARAMS.frequency_penalty,
        seed: DEFAULT_REQUEST_PARAMS.seed,
        stop: DEFAULT_REQUEST_PARAMS.stop,
        listenPrompt: DEFAULT_OMNI_SINGLE_TEMPLATE,
        comparePrompt: DEFAULT_COMPARE_TEMPLATE,
        reviewPrompt: "",
      },
      supportedParams: SUPPORTED_REQUEST_PARAMS,
      queue: {
        maxSize: getGlobalQueueMaxSize(),
        retryMax: getGlobalRetryMax(),
        groups: getQueueSnapshots(),
      },
      cache: getCacheSnapshot(),
      deprecated: envPipeline.deprecatedFrom
        ? [
            {
              from: envPipeline.deprecatedFrom,
              to: envPipeline.mode,
            },
          ]
        : [],
      notes: {
        promptOverride: "omni_single 使用单模型 Prompt；fun_asr_compare 只使用比较 Prompt，Fun-ASR 听音由 Python SDK 完成。",
        responseFormat: "结构化输出由后端固定控制，前端不配置。",
        funAsr: "Fun-ASR 为录音文件识别接口，不走 OpenAI-compatible chat model，由后端 Python SDK 调用。",
        queue: "所有 Fun-ASR / Omni / compare 调用都会先进入后端统一限流队列。",
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
