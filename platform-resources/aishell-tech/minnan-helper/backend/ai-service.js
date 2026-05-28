"use strict";

const fs = require("fs");
const path = require("path");

const dataBakerService = require("../../../data-baker/round-one-quality/backend/ai-service");

const SERVICE_NAME = "aishell-tech-minnan-helper-ai-recommend";
const SCRIPT_ID = "aishellTechMinnanAssistant";
const COMPONENT_NAME = "asr-voice-ai";
const LEXICON_PATH = path.join(__dirname, "reference", "minnan-lexicon.csv");
const DEFAULT_MODEL_MODE = "two_stage";
const DEFAULT_RECOGNITION_STRATEGY = "mandarin_to_dialect";
const MODEL_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较/转换模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
];
const RECOGNITION_STRATEGY_OPTIONS = [
  { value: "mandarin_to_dialect", label: "普通话对照默认：先听成普通话，再按预测文本和字词表转闽南语" },
  { value: "direct_dialect", label: "直接听音：直接写出闽南语文本" },
];
const RECOGNITION_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
  { value: "recognition_convert", label: "识别转换：先听成普通话，再按字词表转闽南语" },
];
const DEFAULT_MANDARIN_LISTEN_TEMPLATE = [
  "你正在处理闽南语音频。",
  "你只负责听音，不负责直接输出最终闽南语文本。",
  "请把听到的内容转写成简体普通话表达，优先保留原句语义，不要补充解释。",
  "如果音频里出现明显的闽南语专有用字、语气词或人名地名，可按实际发音保留，但主体输出仍以普通话转写为主。",
  "输出 JSON 字段必须包含 heardText、confidence、needHumanReview。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_MANDARIN_COMPARE_TEMPLATE = [
  "你会收到两份上下文：",
  "1. pageText：平台预测的闽南语候选文本。",
  "2. heardText：听音模型转写出的简体普通话文本。",
  "你的任务是结合 pageText、heardText 和闽南语字词对照表，输出最终的闽南语推荐文本。",
  "以实际发声语义为主，pageText 负责提供闽南语用字候选，不要机械照抄页面文本。",
  "如果 heardText 与 pageText 语义一致，应优先选择符合闽南语词表的写法。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
  "只输出 JSON，不输出额外解释。",
].join("\n");
const DEFAULT_DIRECT_DIALECT_LISTEN_TEMPLATE = [
  "你正在处理闽南语音频。",
  "你只负责直接听写出闽南语文本，不要先翻译成普通话。",
  "听不清时请基于音频给出最可信的闽南语写法，并通过 needHumanReview 标记不确定性。",
  "输出 JSON 字段必须包含 heardText、confidence、needHumanReview。",
  "heardText 必须直接写闽南语文本。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_DIRECT_DIALECT_COMPARE_TEMPLATE = [
  "你会收到 pageText（平台预测闽南语文本）和 heardText（听音得到的闽南语文本）。",
  "你的任务是对比两者并输出最终闽南语推荐文本。",
  "以实际发声为主，pageText 只作为闽南语写法参考。",
  "如果词表中存在更合适的闽南语建议用字，可在语义一致时优先采用。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
  "只输出 JSON，不输出额外解释。",
].join("\n");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizePromptText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
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
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = String(code || "request-error");
  return error;
}

function sanitizeSignedUrl(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const tail = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
    return url.origin + "/<redacted>/" + tail;
  } catch (_error) {
    return "<signed-url-redacted>";
  }
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

function normalizeNumberInRange(value, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }
  return number;
}

function normalizeIntegerInRange(value, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }
  return number;
}

function normalizeModelText(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function normalizeModelMode(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "two_stage" || text === "omni_single") {
    return text;
  }
  if (text === "recognition_convert") {
    return "two_stage";
  }
  return String(fallback || DEFAULT_MODEL_MODE).trim().toLowerCase() === "omni_single"
    ? "omni_single"
    : "two_stage";
}

function normalizeRecognitionStrategy(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "direct_dialect") {
    return "direct_dialect";
  }
  if (text === "mandarin_to_dialect" || text === "recognition_convert") {
    return "mandarin_to_dialect";
  }
  return String(fallback || DEFAULT_RECOGNITION_STRATEGY).trim().toLowerCase() ===
    "direct_dialect"
    ? "direct_dialect"
    : "mandarin_to_dialect";
}

function deriveLegacyRecognitionMode(modelMode, recognitionStrategy) {
  return normalizeRecognitionStrategy(recognitionStrategy, DEFAULT_RECOGNITION_STRATEGY) ===
    "mandarin_to_dialect"
    ? "recognition_convert"
    : normalizeModelMode(modelMode, DEFAULT_MODEL_MODE);
}

function getStrategyPromptDefaults(recognitionStrategy) {
  return normalizeRecognitionStrategy(recognitionStrategy, DEFAULT_RECOGNITION_STRATEGY) ===
    "direct_dialect"
    ? {
        listenPrompt: DEFAULT_DIRECT_DIALECT_LISTEN_TEMPLATE,
        comparePrompt: DEFAULT_DIRECT_DIALECT_COMPARE_TEMPLATE,
      }
    : {
        listenPrompt: DEFAULT_MANDARIN_LISTEN_TEMPLATE,
        comparePrompt: DEFAULT_MANDARIN_COMPARE_TEMPLATE,
      };
}

function normalizeAiOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  const stringFields = [
    "listenPrompt",
    "comparePrompt",
    "listenModel",
    "compareModel",
    "singleModel",
    "omniModel",
    "mockResponseMode",
  ];

  stringFields.forEach(function (key) {
    const normalized =
      key.indexOf("Prompt") >= 0 ? normalizePromptText(source[key]) : normalizeModelText(source[key]);
    if (normalized) {
      result[key] = normalized;
    }
  });

  const temperature = normalizeNumberInRange(source.temperature, 0, 2);
  if (temperature !== null) {
    result.temperature = temperature;
  }
  const topP = normalizeNumberInRange(source.top_p, 0, 1);
  if (topP !== null) {
    result.top_p = topP;
  }
  const maxTokens = normalizeIntegerInRange(source.max_tokens, 1, 8192);
  if (maxTokens !== null) {
    result.max_tokens = maxTokens;
  }
  const maxCompletionTokens = normalizeIntegerInRange(source.max_completion_tokens, 1, 8192);
  if (maxCompletionTokens !== null) {
    result.max_completion_tokens = maxCompletionTokens;
  }
  const presencePenalty = normalizeNumberInRange(source.presence_penalty, -2, 2);
  if (presencePenalty !== null) {
    result.presence_penalty = presencePenalty;
  }
  const frequencyPenalty = normalizeNumberInRange(source.frequency_penalty, -2, 2);
  if (frequencyPenalty !== null) {
    result.frequency_penalty = frequencyPenalty;
  }
  const seed = normalizeIntegerInRange(source.seed, 0, 2147483647);
  if (seed !== null) {
    result.seed = seed;
  }
  const stop = normalizeStopSequences(source.stop);
  if (stop.length > 0) {
    result.stop = stop;
  }
  if (typeof source.enable_thinking === "boolean") {
    result.enable_thinking = source.enable_thinking === true;
  } else if (typeof source.enableThinking === "boolean") {
    result.enable_thinking = source.enableThinking === true;
  }
  if (Number.isFinite(Number(source.frontConcurrency))) {
    result.frontConcurrency = Math.round(Number(source.frontConcurrency));
  }
  if (Number.isFinite(Number(source.batchConcurrency))) {
    result.batchConcurrency = Math.round(Number(source.batchConcurrency));
  }
  if (normalizeModelText(source.concurrencyModelType)) {
    result.concurrencyModelType = normalizeModelText(source.concurrencyModelType);
  }
  return result;
}

function applyStrategyPromptDefaults(aiOptions, recognitionStrategy) {
  const next = Object.assign({}, aiOptions || {});
  const defaults = getStrategyPromptDefaults(recognitionStrategy);
  if (!normalizePromptText(next.listenPrompt)) {
    next.listenPrompt = defaults.listenPrompt;
  }
  if (!normalizePromptText(next.comparePrompt)) {
    next.comparePrompt = defaults.comparePrompt;
  }
  return next;
}

function createDataBakerRequest(normalizedRequest) {
  const request = normalizedRequest && typeof normalizedRequest === "object" ? normalizedRequest : {};
  const aiOptions = applyStrategyPromptDefaults(
    normalizeAiOptions(request.aiOptions),
    request.recognitionStrategy
  );
  const duration = normalizeNullableNumber(request.duration);

  const dataBakerRequest = {
    collectId: normalizeText(request.taskId),
    itemId: normalizeText(request.taskItemId),
    textId: normalizeText(request.packageId),
    sentenceNumber: normalizeNullableNumber(request.itemNumber),
    readRequire: normalizeText(request.fileName),
    audioUrl: normalizeText(request.audioUrl),
    pageText: normalizeText(request.referenceText),
    annotatorName: normalizeText(request.annotatorName || request.platformUserName),
    aiUsageOperatorName: normalizeText(request.aiUsageOperatorName).slice(0, 40),
    platformUserName: normalizeText(request.platformUserName).slice(0, 80),
    platformUserId: normalizeText(request.platformUserId).slice(0, 120),
    effectiveTime: duration,
    audioDuration: duration,
    clientVersion: normalizeText(request.clientVersion),
    batchRunId: normalizeText(request.batchRunId).slice(0, 160),
    batchItemIndex: normalizeNullableNumber(request.batchItemIndex),
    batchProcessKey: normalizeText(request.batchProcessKey).slice(0, 240),
    clientRequestId: normalizeText(request.clientRequestId).slice(0, 200),
    frontConcurrency: request.frontConcurrency,
    batchConcurrency: request.frontConcurrency,
    concurrencyModelType: normalizeText(request.concurrencyModelType || aiOptions.concurrencyModelType),
    aiOptions: aiOptions,
  };

  const modelMode = normalizeModelMode(request.modelMode || request.recognitionMode, DEFAULT_MODEL_MODE);
  if (modelMode) {
    dataBakerRequest.recognitionMode = modelMode;
    dataBakerRequest.pipelineMode = modelMode;
  }

  const listenModel = normalizeModelText(request.listenModel || aiOptions.listenModel);
  if (listenModel) {
    dataBakerRequest.listenModel = listenModel;
  }
  const compareModel = normalizeModelText(request.compareModel || aiOptions.compareModel);
  if (compareModel) {
    dataBakerRequest.compareModel = compareModel;
  }
  const singleModel = normalizeModelText(
    request.singleModel || aiOptions.singleModel || aiOptions.omniModel
  );
  if (singleModel) {
    dataBakerRequest.singleModel = singleModel;
  }
  if (typeof request.enableThinking === "boolean") {
    dataBakerRequest.enableThinking = request.enableThinking === true;
  } else if (typeof aiOptions.enable_thinking === "boolean") {
    dataBakerRequest.enableThinking = aiOptions.enable_thinking === true;
  }

  return dataBakerRequest;
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const taskId = normalizeText(source.taskId);
  const packageId = normalizeText(source.packageId);
  const taskItemId = normalizeText(source.taskItemId);
  const fileName = normalizeText(source.fileName);
  const audioUrl = normalizeText(source.audioUrl);
  const referenceText = normalizeText(source.referenceText);
  const existingMarkText = normalizeText(source.existingMarkText);
  const duration = normalizeNullableNumber(source.duration);

  if (!taskId) {
    throw createHttpError(400, "taskId 不能为空。", "invalid-task-id");
  }
  if (!packageId) {
    throw createHttpError(400, "packageId 不能为空。", "invalid-package-id");
  }
  if (!taskItemId) {
    throw createHttpError(400, "taskItemId 不能为空。", "invalid-task-item-id");
  }
  if (!isHttpUrl(audioUrl)) {
    throw createHttpError(400, "audioUrl 必须是 http/https。", "invalid-audio-url");
  }
  if (!referenceText) {
    throw createHttpError(400, "referenceText 不能为空。", "invalid-reference-text");
  }

  const fallbackLegacyMode = normalizeModelMode(
    source.recognitionMode || source.pipelineMode,
    DEFAULT_MODEL_MODE
  );
  const modelMode = normalizeModelMode(
    source.modelMode || source.aiRecommendModelMode || source.pipelineMode,
    fallbackLegacyMode
  );
  const recognitionStrategy = normalizeRecognitionStrategy(
    source.recognitionStrategy || source.aiRecommendRecognitionStrategy || source.pipelineMode,
    DEFAULT_RECOGNITION_STRATEGY
  );
  const legacyRecognitionMode = deriveLegacyRecognitionMode(modelMode, recognitionStrategy);

  const normalizedRequest = {
    taskId,
    packageId,
    taskItemId,
    fileName,
    audioUrl,
    referenceText,
    existingMarkText,
    duration,
    itemNumber: normalizeNullableNumber(source.itemNumber ?? source.number),
    annotatorName: normalizeText(source.annotatorName || source.platformUserName),
    aiUsageOperatorName: normalizeText(source.aiUsageOperatorName).slice(0, 40),
    platformUserName: normalizeText(source.platformUserName).slice(0, 80),
    platformUserId: normalizeText(source.platformUserId).slice(0, 120),
    clientVersion: normalizeText(source.clientVersion),
    batchRunId: normalizeText(source.batchRunId),
    batchItemIndex: normalizeNullableNumber(source.batchItemIndex),
    batchProcessKey: normalizeText(source.batchProcessKey),
    clientRequestId: normalizeText(source.clientRequestId),
    frontConcurrency:
      source.frontConcurrency !== undefined && source.frontConcurrency !== null
        ? Math.round(Number(source.frontConcurrency))
        : source.batchConcurrency !== undefined && source.batchConcurrency !== null
          ? Math.round(Number(source.batchConcurrency))
          : source.aiOptions?.frontConcurrency !== undefined && source.aiOptions?.frontConcurrency !== null
            ? Math.round(Number(source.aiOptions.frontConcurrency))
            : null,
    concurrencyModelType: normalizeText(
      source.concurrencyModelType || source.aiOptions?.concurrencyModelType
    ),
    modelMode: modelMode,
    recognitionStrategy: recognitionStrategy,
    recognitionMode: legacyRecognitionMode,
    listenModel: normalizeModelText(source.listenModel),
    compareModel: normalizeModelText(source.compareModel),
    singleModel: normalizeModelText(source.singleModel),
    enableThinking:
      typeof source.enableThinking === "boolean"
        ? source.enableThinking === true
        : typeof source.aiOptions?.enableThinking === "boolean"
          ? source.aiOptions.enableThinking === true
          : typeof source.aiOptions?.enable_thinking === "boolean"
            ? source.aiOptions.enable_thinking === true
            : false,
    aiOptions: applyStrategyPromptDefaults(
      normalizeAiOptions(source.aiOptions),
      recognitionStrategy
    ),
  };

  normalizedRequest.dataBakerRequest = createDataBakerRequest(normalizedRequest);
  normalizedRequest.dataBakerNormalizedRequest =
    dataBakerService.normalizeRecommendRequest(normalizedRequest.dataBakerRequest);
  normalizedRequest.modelMode =
    normalizeText(normalizedRequest.dataBakerNormalizedRequest.recognitionMode) ||
    normalizedRequest.modelMode;
  normalizedRequest.listenModel =
    normalizeText(normalizedRequest.dataBakerNormalizedRequest.listenModel) ||
    normalizedRequest.listenModel;
  normalizedRequest.compareModel =
    normalizeText(normalizedRequest.dataBakerNormalizedRequest.compareModel) ||
    normalizedRequest.compareModel;
  normalizedRequest.singleModel =
    normalizeText(normalizedRequest.dataBakerNormalizedRequest.singleModel) ||
    normalizedRequest.singleModel;
  normalizedRequest.frontConcurrency =
    normalizedRequest.dataBakerNormalizedRequest.frontConcurrencyNormalized ??
    normalizedRequest.frontConcurrency;
  normalizedRequest.concurrencyModelType =
    normalizeText(normalizedRequest.dataBakerNormalizedRequest.concurrencyModelType) ||
    normalizedRequest.concurrencyModelType;

  return normalizedRequest;
}

function buildLexiconState() {
  if (!fs.existsSync(LEXICON_PATH)) {
    return {
      enabled: false,
      status: "missing",
      source: path.basename(LEXICON_PATH),
      rowCount: 0,
    };
  }
  try {
    const text = fs.readFileSync(LEXICON_PATH, "utf8");
    const rows = dataBakerService.parseLexiconCsv(text);
    return {
      enabled: rows.length > 0,
      status: rows.length > 0 ? "ready" : "empty",
      source: path.basename(LEXICON_PATH),
      rowCount: rows.length,
    };
  } catch (error) {
    return {
      enabled: false,
      status: "read-failed",
      source: path.basename(LEXICON_PATH),
      rowCount: 0,
      message: normalizeText(error?.message).slice(0, 160),
    };
  }
}

function sanitizeDebug(dataBakerResult, normalizedRequest) {
  const result = dataBakerResult && typeof dataBakerResult === "object" ? dataBakerResult : {};
  const runtime = result.runtime && typeof result.runtime === "object" ? result.runtime : {};
  const queue = runtime.queue && typeof runtime.queue === "object" ? runtime.queue : {};
  const concurrencyDiagnostic =
    runtime.concurrencyDiagnostic && typeof runtime.concurrencyDiagnostic === "object"
      ? runtime.concurrencyDiagnostic
      : {};
  return {
    requestId: normalizeText(result.requestId),
    cacheHit: runtime.cache?.hit === true,
    cacheSourceRequestId: normalizeText(runtime.cache?.sourceRequestId),
    totalQueueWaitMs: Number(queue.totalQueueWaitMs || 0),
    totalRetryCount: Number(queue.totalRetryCount || 0),
    queueGroups: Array.isArray(queue.groups) ? queue.groups.length : 0,
    debugId: normalizeText(result.debugId),
    hasRawAiDebug: result.hasRawAiDebug === true,
    frontConcurrencyOriginal:
      concurrencyDiagnostic.frontConcurrencyOriginal === null
        ? null
        : Number(concurrencyDiagnostic.frontConcurrencyOriginal) || 0,
    frontConcurrencyNormalized: Number(concurrencyDiagnostic.frontConcurrencyNormalized) || 0,
    concurrencyModelType: normalizeText(concurrencyDiagnostic.concurrencyModelType || normalizedRequest?.concurrencyModelType),
    audioUrl: sanitizeSignedUrl(normalizedRequest?.audioUrl),
  };
}

function transformRecommendResult(dataBakerResult, normalizedRequest) {
  const result = dataBakerResult && typeof dataBakerResult === "object" ? dataBakerResult : {};
  const usage = result.usage && typeof result.usage === "object" ? result.usage : {};
  const model = result.model && typeof result.model === "object" ? result.model : {};
  const modelSelection =
    result.modelSelection && typeof result.modelSelection === "object" ? result.modelSelection : {};
  const timing = result.timing && typeof result.timing === "object" ? result.timing : {};
  const transformed = {
    taskId: normalizeText(normalizedRequest?.taskId),
    packageId: normalizeText(normalizedRequest?.packageId),
    taskItemId: normalizeText(normalizedRequest?.taskItemId),
    fileName: normalizeText(normalizedRequest?.fileName),
    referenceText: normalizeText(normalizedRequest?.referenceText),
    existingMarkText: normalizeText(normalizedRequest?.existingMarkText),
    heardText: normalizeText(result.heardText),
    recommendedText: normalizeText(result.recommendedText),
    isChanged: result.isChanged === true,
    needHumanReview: result.needHumanReview === true,
    decision: normalizeText(result.decision),
    changePoints: Array.isArray(result.changePoints) ? result.changePoints : [],
    models: {
      modelMode: normalizeText(normalizedRequest?.modelMode),
      recognitionStrategy: normalizeText(normalizedRequest?.recognitionStrategy),
      recognitionMode: normalizeText(result.recognitionMode || normalizedRequest?.recognitionMode),
      derivedPipelineMode: normalizeText(result.derivedPipelineMode),
      listenModel: normalizeText(model.listen || modelSelection.listenModel),
      compareModel: normalizeText(model.compare || modelSelection.compareModel),
      singleModel: normalizeText(modelSelection.singleModel),
      funAsrProvider: normalizeText(modelSelection.funAsrProvider || result.runtime?.funAsrProvider),
    },
    usage: {
      totalTokens: Number(usage.totalTokens || 0),
      promptTokens: Number(usage.promptTokens || 0),
      completionTokens: Number(usage.completionTokens || 0),
      listen: usage.listen && typeof usage.listen === "object" ? usage.listen : null,
      compare: usage.compare && typeof usage.compare === "object" ? usage.compare : null,
      estimatedCostCny:
        result.cost && typeof result.cost === "object" ? Number(result.cost.estimatedCostCny || 0) : 0,
    },
    timing: {
      listenDurationMs: Number(timing.listenDurationMs || 0),
      compareDurationMs: Number(timing.compareDurationMs || 0),
      totalDurationMs: Number(timing.totalDurationMs || 0),
    },
    debug: sanitizeDebug(result, normalizedRequest),
  };

  if (result.lexicon && typeof result.lexicon === "object") {
    transformed.lexicon = {
      enabled: result.lexicon.enabled === true,
      rewriteMode: normalizeText(result.lexicon.rewriteMode),
      rewriteChanged: result.lexicon.rewriteChanged === true,
      matchedCount: Number(result.lexicon.matchedCount || 0),
      rewriteChanges: Array.isArray(result.lexicon.rewriteChanges)
        ? result.lexicon.rewriteChanges.slice(0, 20)
        : [],
    };
  }

  return transformed;
}

function createHealthPayload() {
  const baseHealth = dataBakerService.createHealthPayload();
  const baseDefaults = dataBakerService.createDefaultsPayload();
  const lexicon = buildLexiconState();
  const defaultStrategyPrompts = getStrategyPromptDefaults(DEFAULT_RECOGNITION_STRATEGY);
  return {
    success: true,
    service: SERVICE_NAME,
    scriptId: SCRIPT_ID,
    component: COMPONENT_NAME,
    provider: baseHealth.provider,
    ruleVersion: dataBakerService.RULE_VERSION,
    status: baseHealth.status,
    modelMode: DEFAULT_MODEL_MODE,
    recognitionStrategy: DEFAULT_RECOGNITION_STRATEGY,
    recognitionMode: deriveLegacyRecognitionMode(
      DEFAULT_MODEL_MODE,
      DEFAULT_RECOGNITION_STRATEGY
    ),
    pipelineMode: DEFAULT_MODEL_MODE,
    derivedPipelineMode: baseHealth.derivedPipelineMode,
    modelModeOptions: MODEL_MODE_OPTIONS.slice(),
    recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
    recognitionModeOptions: Array.isArray(baseHealth.recognitionModeOptions)
      ? RECOGNITION_MODE_OPTIONS.slice()
      : [],
    supportedPipelineModes: Array.isArray(baseHealth.supportedPipelineModes)
      ? baseHealth.supportedPipelineModes.slice()
      : [],
    listenModelOptions: Array.isArray(baseHealth.listenModelOptions)
      ? baseHealth.listenModelOptions.slice()
      : [],
    singleModelOptions: Array.isArray(baseHealth.singleModelOptions)
      ? baseHealth.singleModelOptions.slice()
      : [],
    compareModelOptions: Array.isArray(baseHealth.compareModelOptions)
      ? baseHealth.compareModelOptions.slice()
      : [],
    listenModel: normalizeText(baseHealth.listenModel),
    singleModel: normalizeText(baseHealth.singleModel),
    compareModel: normalizeText(baseHealth.compareModel),
    funAsrModel: normalizeText(baseHealth.funAsrModel),
    funAsrProvider: normalizeText(baseHealth.funAsrProvider),
    funAsrRestConfigured: baseHealth.funAsrRestConfigured === true,
    funAsrPythonConfigured: baseHealth.funAsrPythonConfigured === true,
    funAsrApiBase: normalizeText(baseHealth.funAsrApiBase),
    omniModel: normalizeText(baseHealth.omniModel),
    timeoutMs: Number(baseDefaults?.defaults?.timeoutMs || 120000),
    queue: baseHealth.queue || {},
    concurrency: baseHealth.concurrency || {},
    cache: baseHealth.cache || {},
    lexicon: lexicon,
    callLogDir: dataBakerService.getLogDir(),
    notes: {
      defaultsSource: "参考 data-baker/round-one-quality，并保留 Aishell 独立接口与脚本 ID。",
      saveBoundary: "当前脚本只在用户触发批量时点击页面真实保存按钮；不自动提交、不跨分包、不触发质检区。",
      promptOverride: "支持前端覆盖听音/比较 Prompt；为空时按当前识别策略加载 Aishell 默认模板。",
      batchConcurrency:
        "Fun-ASR 默认 25、范围 1~50；Omni 默认 15、范围 1~25；前后端都会归一。",
      defaultRecognitionStrategy: "默认使用普通话对照：先听成普通话，再结合预测闽南语文本与字词表输出最终闽南语。",
      defaultListenPromptPreview: defaultStrategyPrompts.listenPrompt,
    },
  };
}

function createDefaultsPayload() {
  const baseDefaults = dataBakerService.createDefaultsPayload();
  const directPrompts = getStrategyPromptDefaults("direct_dialect");
  const defaultPrompts = getStrategyPromptDefaults(DEFAULT_RECOGNITION_STRATEGY);
  return {
    success: true,
    service: SERVICE_NAME,
    scriptId: SCRIPT_ID,
    component: COMPONENT_NAME,
    defaults: Object.assign({}, baseDefaults.defaults || {}, {
      modelMode: DEFAULT_MODEL_MODE,
      recognitionStrategy: DEFAULT_RECOGNITION_STRATEGY,
      modelModeOptions: MODEL_MODE_OPTIONS.slice(),
      recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
      recognitionMode: deriveLegacyRecognitionMode(
        DEFAULT_MODEL_MODE,
        DEFAULT_RECOGNITION_STRATEGY
      ),
      pipelineMode: DEFAULT_MODEL_MODE,
      recognitionModeOptions: RECOGNITION_MODE_OPTIONS.slice(),
      pipelineModeOptions: MODEL_MODE_OPTIONS.slice(),
      reviewModel: "",
      listenPrompt: defaultPrompts.listenPrompt,
      comparePrompt: defaultPrompts.comparePrompt,
      promptProfiles: {
        mandarin_to_dialect: defaultPrompts,
        direct_dialect: directPrompts,
      },
    }),
    supportedParams: Object.assign({}, baseDefaults.supportedParams || {}),
    queue: baseDefaults.queue || {},
    concurrency: baseDefaults.concurrency || {},
    cache: baseDefaults.cache || {},
    notes: Object.assign({}, baseDefaults.notes || {}, {
      defaultsSource: "DataBaker recommend defaults blueprint",
      responseFormat: "返回结构固定为 success/requestId/data，前端不单独配置 response_format。",
      saveBoundary: "批量只填当前分包未完成条目，并在每条填入后点击页面真实保存按钮。",
      recognitionStrategy:
        "Aishell 默认策略为普通话对照；也支持直接听写闽南语文本进行对比测试。",
    }),
  };
}

module.exports = {
  COMPONENT_NAME,
  LEXICON_PATH,
  SCRIPT_ID,
  SERVICE_NAME,
  createDataBakerRequest,
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
  transformRecommendResult,
};
