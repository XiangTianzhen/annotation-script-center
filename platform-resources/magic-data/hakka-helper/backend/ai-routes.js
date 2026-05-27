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
  sanitizeModelName,
} = require("./ai-client-qwen");
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const { estimateIncome } = require("./ai-cost");
const {
  buildLexiconContext,
  getLexiconState,
  normalizeToSimplifiedChinesePreservingLexicon,
} = require("./ai-lexicon");
const {
  buildComparePrompt,
  buildListenPrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_LISTEN_TEMPLATE,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  normalizeOmniSingleComparison,
  normalizeListenResponse,
  normalizeRuleFirstComparison,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");

const HAKKA_AI_BASE_PATH = "/api/magic-data/hakka-helper/ai/review-current";
const LEGACY_AI_BASE_PATH = "/api/magic-data/annotator/ai/review-current";
const AI_HEALTH_PATH = HAKKA_AI_BASE_PATH + "/health";
const LEGACY_AI_HEALTH_PATH = LEGACY_AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = "/api/magic-data/hakka-helper/ai/defaults";
const LEGACY_AI_DEFAULTS_PATH = "/api/magic-data/annotator/ai/defaults";
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MODEL_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较/转换模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
];
const RECOGNITION_STRATEGY_OPTIONS = [
  { value: "direct_dialect", label: "直接识别方言文本" },
  { value: "mandarin_to_dialect", label: "识别转换：先听成普通话，再按字词表转方言" },
];
const RECOGNITION_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
  { value: "recognition_convert", label: "识别转换：先听成普通话，再按词表转客家话" },
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
const SERVICE_NAME = "magic-data-hakka-helper-ai-review-current";
const SCRIPT_ID = "magicDataAnnotatorAiReview";
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

function normalizeResponseTextValue(value) {
  return normalizeToSimplifiedChinesePreservingLexicon(normalizeText(value));
}

function normalizeResponseTextArray(values) {
  if (!Array.isArray(values)) {
    return values;
  }
  return values.map(function (value) {
    return typeof value === "string" ? normalizeResponseTextValue(value) : value;
  });
}

function normalizeResponseTextFields(value) {
  const output =
    value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : {};

  if (output.speakerCheck?.gender) {
    output.speakerCheck.gender.suggestedValue = normalizeResponseTextValue(
      output.speakerCheck.gender.suggestedValue
    );
    output.speakerCheck.gender.reason = normalizeResponseTextValue(output.speakerCheck.gender.reason);
  }
  if (output.speakerCheck?.ageRange) {
    output.speakerCheck.ageRange.suggestedValue = normalizeResponseTextValue(
      output.speakerCheck.ageRange.suggestedValue
    );
    output.speakerCheck.ageRange.reason = normalizeResponseTextValue(output.speakerCheck.ageRange.reason);
  }
  if (output.dialectTextCheck) {
    output.dialectTextCheck.suggestedValue = normalizeResponseTextValue(
      output.dialectTextCheck.suggestedValue
    );
    output.dialectTextCheck.reason = normalizeResponseTextValue(output.dialectTextCheck.reason);
  }
  if (output.mandarinTextCheck) {
    output.mandarinTextCheck.suggestedValue = normalizeResponseTextValue(
      output.mandarinTextCheck.suggestedValue
    );
    output.mandarinTextCheck.reason = normalizeResponseTextValue(output.mandarinTextCheck.reason);
  }
  if (output.overall) {
    output.overall.summary = normalizeResponseTextValue(output.overall.summary);
  }
  if (output.audioCheck) {
    output.audioCheck.heardDialectText = normalizeResponseTextValue(output.audioCheck.heardDialectText);
    output.audioCheck.heardMandarinMeaning = normalizeResponseTextValue(
      output.audioCheck.heardMandarinMeaning
    );
    output.audioCheck.riskFlags = normalizeResponseTextArray(output.audioCheck.riskFlags);
    output.audioCheck.invalidReasons = normalizeResponseTextArray(output.audioCheck.invalidReasons);
  }
  if (output.textRuleCheck) {
    output.textRuleCheck.dialectIssues = normalizeResponseTextArray(output.textRuleCheck.dialectIssues);
    output.textRuleCheck.mandarinIssues = normalizeResponseTextArray(output.textRuleCheck.mandarinIssues);
    output.textRuleCheck.translationConsistencyIssues = normalizeResponseTextArray(
      output.textRuleCheck.translationConsistencyIssues
    );
    output.textRuleCheck.punctuationIssues = normalizeResponseTextArray(output.textRuleCheck.punctuationIssues);
    output.textRuleCheck.speakerAttributeIssues = normalizeResponseTextArray(
      output.textRuleCheck.speakerAttributeIssues
    );
    output.textRuleCheck.lexiconIssues = normalizeResponseTextArray(output.textRuleCheck.lexiconIssues);
    output.textRuleCheck.ruleIssues = normalizeResponseTextArray(output.textRuleCheck.ruleIssues);
  }
  if (output.recommendations) {
    output.recommendations.dialectText = normalizeResponseTextValue(output.recommendations.dialectText);
    output.recommendations.mandarinText = normalizeResponseTextValue(output.recommendations.mandarinText);
    output.recommendations.summary = normalizeResponseTextValue(output.recommendations.summary);
  }
  if (output.listen) {
    output.listen.heardDialectText = normalizeResponseTextValue(output.listen.heardDialectText);
    output.listen.heardMandarinMeaning = normalizeResponseTextValue(output.listen.heardMandarinMeaning);
    output.listen.riskFlags = normalizeResponseTextArray(output.listen.riskFlags);
    output.listen.invalidReasons = normalizeResponseTextArray(output.listen.invalidReasons);
  }
  if (output.comparison?.dialectLine) {
    output.comparison.dialectLine.aiText = normalizeResponseTextValue(output.comparison.dialectLine.aiText);
    output.comparison.dialectLine.recommendedText = normalizeResponseTextValue(
      output.comparison.dialectLine.recommendedText
    );
    output.comparison.dialectLine.issues = normalizeResponseTextArray(output.comparison.dialectLine.issues);
  }
  if (output.comparison?.mandarinLine) {
    output.comparison.mandarinLine.recommendedText = normalizeResponseTextValue(
      output.comparison.mandarinLine.recommendedText
    );
    output.comparison.mandarinLine.issues = normalizeResponseTextArray(output.comparison.mandarinLine.issues);
  }
  if (output.comparison) {
    output.comparison.lexiconIssues = normalizeResponseTextArray(output.comparison.lexiconIssues);
    output.comparison.ruleIssues = normalizeResponseTextArray(output.comparison.ruleIssues);
  }
  if (output.recognitionConvert) {
    output.recognitionConvert.recognizedMandarinText = normalizeResponseTextValue(
      output.recognitionConvert.recognizedMandarinText
    );
    output.recognitionConvert.convertedDialectText = normalizeResponseTextValue(
      output.recognitionConvert.convertedDialectText
    );
    output.recognitionConvert.conversionWarnings = normalizeResponseTextArray(
      output.recognitionConvert.conversionWarnings
    );
  }

  return output;
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
  const aiOptions = normalizeAiOptions(source.aiOptions);
  const pageType = normalizePageType(source.pageType);
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

  const fallbackLegacyMode = normalizeRecognitionMode(
    source.aiReviewRecognitionMode || source.aiReviewPipelineMode || source.pipelineMode
  );
  const modelMode = normalizeModelMode(
    source.modelMode || source.aiReviewModelMode || fallbackLegacyMode,
    fallbackLegacyMode
  );
  const recognitionStrategy = normalizeRecognitionStrategy(
    source.recognitionStrategy || source.aiReviewRecognitionStrategy || fallbackLegacyMode,
    fallbackLegacyMode
  );
  const recognitionMode = deriveLegacyRecognitionMode(modelMode, recognitionStrategy);
  const listenModel = sanitizeModelName(aiOptions.listenModel || source.listenModel || source.aiReviewListenModel, "");
  const compareModel = sanitizeModelName(
    aiOptions.compareModel ||
      aiOptions.reviewModel ||
      source.compareModel ||
      source.reviewModel ||
      source.aiReviewCompareModel,
    ""
  );
  const singleModel = sanitizeModelName(
    aiOptions.singleModel || source.singleModel || source.aiReviewSingleModel,
    ""
  );

  return {
    pageType,
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
    modelMode: modelMode,
    recognitionStrategy: recognitionStrategy,
    recognitionMode: recognitionMode,
    pipelineMode: recognitionMode,
    rulesProfile: normalizeText(source.rulesProfile) || "hakka",
    clientVersion: normalizeText(source.clientVersion),
    listenModel: listenModel,
    compareModel: compareModel,
    singleModel: singleModel,
    reviewModel: compareModel,
    reviewMode: normalizeReviewMode(source.reviewMode),
    showHeardText: source.showHeardText !== false,
    enableThinking:
      typeof aiOptions.enable_thinking === "boolean"
        ? aiOptions.enable_thinking === true
        : source.aiReviewEnableThinking === true || source.enableThinking === true,
    aiOptions,
  };
}

function normalizePageType(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "asrmarkcheck") {
    return "asrmarkCheck";
  }
  return "asrmark";
}

function normalizeRecognitionMode(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "two_stage" || text === "omni_single" || text === "recognition_convert") {
    return text;
  }
  if (text === "fun_asr_compare" || text === "qwen_omni_compare" || text === "qwen_omni_two_stage") {
    return "two_stage";
  }
  if (text === "listen_only") {
    return "omni_single";
  }
  return "two_stage";
}

function normalizeModelMode(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "two_stage" || text === "omni_single") {
    return text;
  }
  if (text === "recognition_convert") {
    return "two_stage";
  }
  return String(fallback || "two_stage").trim().toLowerCase() === "omni_single"
    ? "omni_single"
    : "two_stage";
}

function normalizeRecognitionStrategy(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "mandarin_to_dialect" || text === "recognition_convert") {
    return "mandarin_to_dialect";
  }
  return String(fallback || "direct_dialect").trim().toLowerCase() === "mandarin_to_dialect"
    ? "mandarin_to_dialect"
    : "direct_dialect";
}

function deriveLegacyRecognitionMode(modelMode, recognitionStrategy) {
  if (normalizeRecognitionStrategy(recognitionStrategy, "direct_dialect") === "mandarin_to_dialect") {
    return "recognition_convert";
  }
  return normalizeModelMode(modelMode, "two_stage");
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
    if (!text || result.indexOf(text) >= 0 || result.length >= 8) {
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
  const comparePrompt = normalizePromptText(source.comparePrompt || source.reviewPrompt);
  const listenModel = sanitizeModelName(source.listenModel, "");
  const compareModel = sanitizeModelName(source.compareModel || source.reviewModel, "");
  const singleModel = sanitizeModelName(source.singleModel, "");
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
    result.reviewModel = compareModel;
  }
  if (singleModel) {
    result.singleModel = singleModel;
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
    console.warn("[MagicData][hakka][ai] 调用日志写入失败", {
      requestId: record?.requestId,
      message: error && error.message ? error.message : String(error),
    });
  }
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
  return {
    success: true,
    service: "magic-data-hakka-helper-ai-review-current",
    scriptId: "magicDataAnnotatorAiReview",
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
    recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
    recognitionModeOptions: RECOGNITION_MODE_OPTIONS.slice(),
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
    },
    evaluation: {
      sampleCount: 50,
      totalAudioSeconds: 398.932,
      recommendedDefault: "direct_dialect + qwen3.5-flash",
      estimatedCostPerHourCny: 27.71,
      estimatedCostPer10000HoursCny: 277100,
      note: "客家话文本质量优先，生产默认使用双模型+直接识别客家话，thinking 默认关闭。",
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
      reviewRequest.modelMode === "omni_single"
        ? reviewRequest.singleModel || reviewRequest.listenModel
        : reviewRequest.listenModel,
      config.listenModel || DEFAULT_LISTEN_MODEL,
      config
    );
    const reviewModel = resolveModelOverride(
      reviewRequest.modelMode === "omni_single"
        ? reviewRequest.singleModel || reviewRequest.compareModel || reviewRequest.reviewModel
        : reviewRequest.compareModel || reviewRequest.reviewModel,
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
      aiOptions: reviewRequest.aiOptions,
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
        aiOptions: reviewRequest.aiOptions,
      }
    );
    compareDurationMs = Date.now() - compareStartedAt;

    const compareJson = parseModelJsonText(compareResult.rawText, requestId);
    const normalizedResult =
      reviewRequest.modelMode === "omni_single"
        ? normalizeOmniSingleComparison(compareJson, reviewRequest)
        : normalizeRuleFirstComparison(compareJson, reviewRequest, listen);

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

    const showHeardText = reviewRequest.showHeardText !== false;
    const heardDialectText = showHeardText ? listen.heardDialectText : "";
    const heardMandarinMeaning = showHeardText ? listen.heardMandarinMeaning : "";

    const speakerCheck = normalizedResult?.speakerCheck || {};
    const dialectTextCheck = normalizedResult?.dialectTextCheck || {};
    const mandarinTextCheck = normalizedResult?.mandarinTextCheck || {};
    const overall = normalizedResult?.overall || {};
    const recognitionConvertMeta =
      reviewRequest.recognitionStrategy === "mandarin_to_dialect" ||
      reviewRequest.recognitionMode === "recognition_convert"
        ? {
            recognizedMandarinText: normalizeText(
              compareJson?.recognizedMandarinText || listen?.heardMandarinMeaning || ""
            ),
            convertedDialectText: normalizeText(
              compareJson?.convertedDialectText ||
                normalizedResult?.recommendations?.dialectText ||
                ""
            ),
            lexiconMatches: Array.isArray(compareJson?.lexiconMatches) ? compareJson.lexiconMatches : [],
            conversionWarnings: Array.isArray(compareJson?.conversionWarnings)
              ? compareJson.conversionWarnings
              : [],
          }
        : null;
    const normalizedSummary = normalizeText(
      overall.summary || normalizedResult?.recommendations?.summary || ""
    );
    const responseData = normalizeResponseTextFields({
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
        singleModel: reviewRequest.singleModel || "",
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
      rawAiDebug: sanitizeDebugValue({
        hasRaw:
          Boolean(String(listenResult.rawText || "").trim()) ||
          Boolean(String(compareResult.rawText || "").trim()),
        modelMode: reviewRequest.modelMode,
        recognitionStrategy: reviewRequest.recognitionStrategy,
        recognitionMode: reviewRequest.recognitionMode,
        derivedPipelineMode:
          reviewRequest.modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
        recognizedMandarinText: recognitionConvertMeta?.recognizedMandarinText || "",
        convertedDialectText: recognitionConvertMeta?.convertedDialectText || "",
        lexiconMatches: recognitionConvertMeta?.lexiconMatches || [],
        conversionWarnings: recognitionConvertMeta?.conversionWarnings || [],
      }),
      rawModelText: sanitizeDebugValue({
        listen: listenResult.rawText || "",
        compare: compareResult.rawText || "",
      }),
      rawJson: sanitizeDebugValue({
        listen: listenJson,
        compare: compareJson,
      }),
      recognitionConvert: recognitionConvertMeta
        ? Object.assign(
            {
              recognitionStrategy: "mandarin_to_dialect",
              pipelineMode: "recognition_convert",
            },
            recognitionConvertMeta
          )
        : null,
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
  function buildDefaultsPayload(config) {
    const modelMode = normalizeModelMode(config.pipelineMode || "two_stage", "two_stage");
    const recognitionStrategy = normalizeRecognitionStrategy(
      config.pipelineMode || "direct_dialect",
      "direct_dialect"
    );
    const recognitionMode = deriveLegacyRecognitionMode(modelMode, recognitionStrategy);
    return {
      success: true,
      service: "magic-data-hakka-helper-ai-review-current",
      scriptId: "magicDataAnnotatorAiReview",
      component: "asr-voice-ai",
      defaults: {
        modelMode: modelMode,
        recognitionStrategy: recognitionStrategy,
        recognitionMode: recognitionMode,
        pipelineMode: recognitionMode,
        derivedPipelineMode: modelMode === "omni_single" ? "omni_single" : "qwen_omni_compare",
        modelModeOptions: MODEL_MODE_OPTIONS.slice(),
        recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
        recognitionModeOptions: RECOGNITION_MODE_OPTIONS.slice(),
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
      },
      supportedParams: SUPPORTED_REQUEST_PARAMS,
      evaluation: {
        sampleCount: 50,
        totalAudioSeconds: 398.932,
        recommendedDefault: "direct_dialect + qwen3.5-flash",
        highQualityCandidate: "direct_dialect + qwen3.5-plus",
        mandarinPriorityCandidate: "mandarin_to_dialect + qwen3.5-plus",
        costPer10000HoursCny: {
          directFlash: 277100,
          directPlus: 287500,
          convertFlash: 273600,
          convertPlus: 284200,
        },
        note: "评测口径：50条样本，398.932秒；默认强制 enable_thinking=false。",
      },
      notes: {
        promptOverride: "Prompt 可在前端覆盖；空 override 使用后端默认。",
        responseFormat: "结构化输出由后端固定控制，前端不配置。",
        compatibility:
          "兼容旧字段 listenModel/reviewModel/enableThinking/reviewPrompt；新字段优先 modelMode/recognitionStrategy/listenModel/compareModel/singleModel。",
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

  router.get(LEGACY_AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });
  router.get(LEGACY_AI_DEFAULTS_PATH, function ({ response }) {
    const config = getClientConfig();
    sendJson(response, 200, buildDefaultsPayload(config));
  });

  router.post(HAKKA_AI_BASE_PATH, function ({ request, response }) {
    return handleReviewCurrent(request, response);
  });
  router.post(LEGACY_AI_BASE_PATH, function ({ request, response }) {
    return handleReviewCurrent(request, response);
  });
}

module.exports = {
  AI_BASE_PATH: HAKKA_AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleReviewCurrent,
  normalizeReviewRequest,
  normalizeResponseTextFields,
  registerAiRoutes,
};
