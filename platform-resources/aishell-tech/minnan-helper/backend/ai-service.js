"use strict";

const fs = require("fs");
const path = require("path");

const {
  DEFAULT_COMPARE_MODEL,
  DEFAULT_FUN_ASR_MODEL,
  DEFAULT_OMNI_MODEL,
  DATABAKER_COMPARE_MODEL_OPTIONS,
  DATABAKER_LISTEN_MODEL_OPTIONS,
  DATABAKER_SINGLE_MODEL_OPTIONS,
  DEFAULT_REQUEST_PARAMS,
  derivePipelineMode,
  getQueueGroupsHealth,
  normalizeDataBakerCompareModel,
  normalizeDataBakerListenModel,
  normalizeDataBakerSingleModel,
  normalizeModelMode,
  normalizeRecognitionStrategy,
  parseTimeoutMs,
  resolveDefaultCompareModel,
  resolveDefaultListenModel,
  resolveDefaultSingleModel,
} = require("./config");
const {
  parseLexiconCsv,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

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
const DEFAULT_MANDARIN_LISTEN_TEMPLATE = [
  "你正在处理闽南语音频。",
  "你只负责听音，不负责直接输出最终闽南语文本。",
  "请把听到的内容转写成简体普通话表达，优先保留原句语义，不要补充解释。",
  "如果音频里出现明显的闽南语专有用字、语气词或人名地名，可按实际发音保留，但主体输出仍以普通话转写为主。",
  "heardText 必须使用简体中文，不允许输出繁体字。",
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
  "recommendedText 必须使用简体中文书写，不允许出现任何繁体字；命中闽南语词表时也必须优先使用对应的简体推荐写法。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
  "只输出 JSON，不输出额外解释。",
].join("\n");
const DEFAULT_DIRECT_DIALECT_LISTEN_TEMPLATE = [
  "你正在处理闽南语音频。",
  "你只负责直接听写出闽南语文本，不要先翻译成普通话。",
  "听不清时请基于音频给出最可信的闽南语写法，并通过 needHumanReview 标记不确定性。",
  "heardText 必须使用简体中文书写，不允许出现任何繁体字。",
  "输出 JSON 字段必须包含 heardText、confidence、needHumanReview。",
  "heardText 必须直接写闽南语文本。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_DIRECT_DIALECT_COMPARE_TEMPLATE = [
  "你会收到 pageText（平台预测闽南语文本）和 heardText（听音得到的闽南语文本）。",
  "你的任务是对比两者并输出最终闽南语推荐文本。",
  "以实际发声为主，pageText 只作为闽南语写法参考。",
  "如果词表中存在更合适的闽南语建议用字，可在语义一致时优先采用。",
  "recommendedText 必须使用简体中文书写，不允许出现任何繁体字。",
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
    const rows = parseLexiconCsv(text);
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

  const modelMode = normalizeModelMode(
    source.modelMode || source.aiRecommendModelMode || source.recognitionMode || source.pipelineMode,
    DEFAULT_MODEL_MODE
  );
  const recognitionStrategy = normalizeRecognitionStrategy(
    source.recognitionStrategy || source.aiRecommendRecognitionStrategy || source.pipelineMode,
    DEFAULT_RECOGNITION_STRATEGY
  );
  const aiOptions = applyStrategyPromptDefaults(
    normalizeAiOptions(source.aiOptions),
    recognitionStrategy
  );
  const listenModel = normalizeModelText(
    source.listenModel || aiOptions.listenModel || resolveDefaultListenModel(modelMode)
  );
  const compareModel = normalizeModelText(
    source.compareModel || aiOptions.compareModel || resolveDefaultCompareModel()
  );
  const singleModel = normalizeModelText(
    source.singleModel || aiOptions.singleModel || aiOptions.omniModel || resolveDefaultSingleModel()
  );
  const pipelineMode = derivePipelineMode(modelMode, listenModel, singleModel);

  return {
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
      source.concurrencyModelType || source.aiOptions?.concurrencyModelType || "omni"
    ),
    modelMode,
    recognitionStrategy,
    recognitionMode: modelMode,
    pipelineMode,
    listenModel:
      pipelineMode === "omni_single"
        ? normalizeDataBakerListenModel(DEFAULT_OMNI_MODEL, DEFAULT_OMNI_MODEL)
        : pipelineMode === "fun_asr_compare"
          ? DEFAULT_FUN_ASR_MODEL
          : normalizeDataBakerListenModel(listenModel, DEFAULT_OMNI_MODEL),
    compareModel: normalizeDataBakerCompareModel(compareModel, DEFAULT_COMPARE_MODEL),
    singleModel: normalizeDataBakerSingleModel(singleModel, DEFAULT_OMNI_MODEL),
    enableThinking:
      typeof source.enableThinking === "boolean"
        ? source.enableThinking === true
        : typeof aiOptions.enable_thinking === "boolean"
          ? aiOptions.enable_thinking === true
          : false,
    aiOptions,
  };
}

function buildMeta(meta, requestId) {
  const source = meta && typeof meta === "object" ? meta : {};
  return {
    requestId: normalizeText(source.requestId || requestId),
    stage: normalizeText(source.stage || "complete"),
    models: source.models && typeof source.models === "object" ? source.models : {},
    timing: source.timing && typeof source.timing === "object" ? source.timing : {},
    usage: source.usage && typeof source.usage === "object" ? source.usage : {},
    queue: source.queue && typeof source.queue === "object" ? source.queue : {},
    cache: source.cache && typeof source.cache === "object" ? source.cache : {},
    debugId: normalizeText(source.debugId),
    retryCount: Number(source.retryCount || 0) || 0,
    cancelled: source.cancelled === true,
    debug: source.debug && typeof source.debug === "object" ? source.debug : {},
  };
}

function buildRecommendSuccessBody(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    success: true,
    data: source.data && typeof source.data === "object" ? source.data : null,
    meta: buildMeta(source.meta, source.requestId),
  };
}

function buildRecommendErrorBody(input) {
  const source = input && typeof input === "object" ? input : {};
  const error = source.error && typeof source.error === "object" ? source.error : {};
  return {
    success: false,
    error: {
      code: normalizeText(error.code) || "request-error",
      message: normalizeText(error.safeMessage || error.message || "Aishell 闽南语助手请求失败。").slice(0, 240),
      stage: normalizeText(error.stage) || "post_process",
      retryable: error.retryable === true,
      providerStatus: Number(error.providerStatus || error.statusCode || 0) || 0,
      providerCode: normalizeText(error.providerCode),
    },
    meta: buildMeta(error.meta, source.requestId || error.requestId),
  };
}

function createHealthPayload() {
  const queueGroups = getQueueGroupsHealth();
  const defaults = getStrategyPromptDefaults(DEFAULT_RECOGNITION_STRATEGY);
  return {
    success: true,
    service: SERVICE_NAME,
    scriptId: SCRIPT_ID,
    component: COMPONENT_NAME,
    status: "ready",
    timeoutMs: parseTimeoutMs(),
    modelMode: DEFAULT_MODEL_MODE,
    recognitionStrategy: DEFAULT_RECOGNITION_STRATEGY,
    modelModeOptions: MODEL_MODE_OPTIONS.slice(),
    recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
    listenModelOptions: DATABAKER_LISTEN_MODEL_OPTIONS.slice(),
    compareModelOptions: DATABAKER_COMPARE_MODEL_OPTIONS.slice(),
    singleModelOptions: DATABAKER_SINGLE_MODEL_OPTIONS.slice(),
    listenModel: resolveDefaultListenModel(DEFAULT_MODEL_MODE),
    compareModel: resolveDefaultCompareModel(),
    singleModel: resolveDefaultSingleModel(),
    queue: {
      groups: queueGroups,
    },
    lexicon: buildLexiconState(),
    notes: {
      backendMode: "independent-aishell-pipeline",
      timeout: "Aishell 独立同步超时墙默认小于 60s。",
      cancellation: "客户端断开、服务端超时和手动取消会统一透传 AbortSignal。",
      defaultListenPromptPreview: defaults.listenPrompt,
    },
  };
}

function createDefaultsPayload() {
  const directPrompts = getStrategyPromptDefaults("direct_dialect");
  const defaultPrompts = getStrategyPromptDefaults(DEFAULT_RECOGNITION_STRATEGY);
  return {
    success: true,
    service: SERVICE_NAME,
    scriptId: SCRIPT_ID,
    component: COMPONENT_NAME,
    defaults: Object.assign({}, DEFAULT_REQUEST_PARAMS, {
      timeoutMs: parseTimeoutMs(),
      modelMode: DEFAULT_MODEL_MODE,
      recognitionStrategy: DEFAULT_RECOGNITION_STRATEGY,
      recognitionMode: DEFAULT_MODEL_MODE,
      pipelineMode: derivePipelineMode(
        DEFAULT_MODEL_MODE,
        resolveDefaultListenModel(DEFAULT_MODEL_MODE),
        resolveDefaultSingleModel()
      ),
      modelModeOptions: MODEL_MODE_OPTIONS.slice(),
      recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
      listenModelOptions: DATABAKER_LISTEN_MODEL_OPTIONS.slice(),
      compareModelOptions: DATABAKER_COMPARE_MODEL_OPTIONS.slice(),
      singleModelOptions: DATABAKER_SINGLE_MODEL_OPTIONS.slice(),
      listenModel: resolveDefaultListenModel(DEFAULT_MODEL_MODE),
      compareModel: resolveDefaultCompareModel(),
      singleModel: resolveDefaultSingleModel(),
      listenPrompt: defaultPrompts.listenPrompt,
      comparePrompt: defaultPrompts.comparePrompt,
      promptProfiles: {
        mandarin_to_dialect: defaultPrompts,
        direct_dialect: directPrompts,
      },
    }),
    notes: {
      defaultsSource: "Aishell independent backend defaults",
      requestMode: "sync-http-only",
      responseFormat: "success + data + meta / success=false + error + meta",
    },
  };
}

module.exports = {
  COMPONENT_NAME,
  LEXICON_PATH,
  SCRIPT_ID,
  SERVICE_NAME,
  buildRecommendErrorBody,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  getStrategyPromptDefaults,
  normalizeRecommendRequest,
};
