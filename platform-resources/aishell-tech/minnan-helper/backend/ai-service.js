"use strict";

const fs = require("fs");
const path = require("path");

const {
  DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD,
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
  listModelsByFamily,
} = require("../../../backend/ai/model-dispatcher");
const { buildAsyncJobRuntimeMeta } = require("../../../backend/ai-framework/runtime/ai-runtime-meta");
const {
  parseLexiconCsv,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const SERVICE_NAME = "aishell-tech-minnan-helper-ai-recommend";
const SCRIPT_ID = "aishellTechMinnanAssistant";
const COMPONENT_NAME = "asr-voice-ai";
const LEXICON_PATH = path.join(__dirname, "reference", "minnan-lexicon.csv");
const DEFAULT_MODEL_MODE = "two_stage";
const DEFAULT_RECOGNITION_STRATEGY = "audio_first_reference";
const MODEL_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较/转换模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
];
const RECOGNITION_STRATEGY_OPTIONS = [
  {
    value: "audio_first_reference",
    label: "三文本对照：按实际发音输出，页面原文和词表候选只做参考",
  },
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
  "recommendedText 与 heardText 的普通中文统一输出简体；命中 minnan-lexicon.csv 的建议用字必须保留。",
  "不要把方言建议用字改回普通话同义词。",
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
  "recommendedText 的普通中文统一使用简体；命中 minnan-lexicon.csv 的建议用字必须保持不变。",
  "不要把方言建议用字改回普通话同义词。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview。",
  "只输出 JSON，不输出额外解释。",
].join("\n");
const DEFAULT_AUDIO_FIRST_REFERENCE_LISTEN_TEMPLATE = [
  "你正在处理闽南语音频。",
  "你只负责按实际发音输出 heardText，不要为了统一风格把整句强行改成普通话或闽南语。",
  "如果音频里某个词读的是普通话，就直接保留普通话简体写法；如果读的是闽南语词或闽南语语气词，就按实际闽南语写法输出。",
  "一句话里允许同时出现普通话词和闽南语词。",
  "如果某个词没有读出来，就不要补写。",
  "听不清时可结合上下文给出最可信写法，并通过 needHumanReview 标记不确定性。",
  "heardText 必须使用简体中文，不允许输出繁体字。",
  "输出 JSON 字段必须包含 heardText、confidence、needHumanReview。",
  "只输出 JSON，不要输出 Markdown 或解释文字。",
].join("\n");
const DEFAULT_AUDIO_FIRST_REFERENCE_CANDIDATE_TEMPLATE = [
  "你现在只负责把 pageText 转成标准闽南语候选文本，不要参考音频，也不要输出最终推荐结论。",
  "转换依据只允许使用 pageText 的原始语义、词表上下文以及常见闽南语标准写法判断。",
  "如果词表中存在明确对应关系，例如 和/跟 -> 甲、缀，应优先转成标准闽南语候选写法。",
  "如果没有足够依据，不要凭空改写；可以保留原词。",
  "candidateText 必须是给后续听音对照使用的标准闽南语候选文本，普通中文统一输出简体。",
  "candidatePairs 只列出真正发生改写的差异项，元素字段固定为 sourceText、candidateText、source。",
  "输出 JSON 字段必须包含 candidateText、candidatePairs、confidence、needHumanReview。",
  "只输出 JSON，不要输出 Markdown 或额外解释。",
].join("\n");
const DEFAULT_AUDIO_FIRST_REFERENCE_COMPARE_TEMPLATE = [
  "你会收到三份上下文：pageText（平台原始文本）、lexiconCandidateText（先由独立文本模型结合词表生成的标准闽南语候选文本）、heardText（按实际发音转写出的文本）。",
  "你的任务是输出最终 recommendedText，但必须以实际发音为准；不要机械照抄 pageText，也不要把整句强行统一成闽南语。",
  "先看 heardText，再看 lexiconCandidateText，最后只把 pageText 当作语义兜底参考。",
  "candidatePairs 只列出词表候选改写项，请重点检查这些差异项，不要求整句统一方言化。",
  "如果某个词在音频里读的是普通话，就保留普通话简体；如果读的是闽南语，就输出对应闽南语写法；如果没有读出来，就不要补回。",
  "一句话里允许同时保留普通话词和闽南语词。",
  "当 lexiconCandidateText 与 heardText 发音接近、语义一致，且你对候选标准写法有把握时，可以采用词表候选写法。",
  "audioFirstReferenceCorrectionThreshold 是词表候选校正阈值；当 correctionConfidence 低于该阈值时，应优先保留 heardText，并将 needHumanReview 设为 true。",
  "当低于阈值但存在明显冲突时，candidateDecisions 里要明确说明原因；不要为了命中词表而强行转换。",
  "recommendedText 与 heardText 的普通中文统一输出简体；命中 minnan-lexicon.csv 的建议用字只在确认音频确实这样读，或确认候选标准化更合理时才保留。",
  "输出 JSON 字段：recommendedText、decision、changePoints、confidence、needHumanReview、correctionConfidence、candidateDecisions。",
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
  const normalizedStrategy = normalizeRecognitionStrategy(
    recognitionStrategy,
    DEFAULT_RECOGNITION_STRATEGY
  );
  if (normalizedStrategy === "audio_first_reference") {
    return {
      candidatePrompt: DEFAULT_AUDIO_FIRST_REFERENCE_CANDIDATE_TEMPLATE,
      listenPrompt: DEFAULT_AUDIO_FIRST_REFERENCE_LISTEN_TEMPLATE,
      comparePrompt: DEFAULT_AUDIO_FIRST_REFERENCE_COMPARE_TEMPLATE,
    };
  }
  return {
    candidatePrompt: "",
    listenPrompt: DEFAULT_MANDARIN_LISTEN_TEMPLATE,
    comparePrompt: DEFAULT_MANDARIN_COMPARE_TEMPLATE,
  };
}

function normalizeAiOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  const stringFields = [
    "listenPrompt",
    "candidatePrompt",
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
  result.enable_thinking = false;
  if (Number.isFinite(Number(source.frontConcurrency))) {
    result.frontConcurrency = Math.round(Number(source.frontConcurrency));
  }
  if (Number.isFinite(Number(source.batchConcurrency))) {
    result.batchConcurrency = Math.round(Number(source.batchConcurrency));
  }
  if (normalizeModelText(source.concurrencyModelType)) {
    result.concurrencyModelType = normalizeModelText(source.concurrencyModelType);
  }
  const audioFirstReferenceCorrectionThreshold = normalizeNumberInRange(
    source.audioFirstReferenceCorrectionThreshold,
    0,
    1
  );
  result.audioFirstReferenceCorrectionThreshold =
    audioFirstReferenceCorrectionThreshold === null
      ? DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD
      : Number(audioFirstReferenceCorrectionThreshold.toFixed(3));
  return result;
}

function applyStrategyPromptDefaults(aiOptions, recognitionStrategy) {
  const next = Object.assign({}, aiOptions || {});
  const defaults = getStrategyPromptDefaults(recognitionStrategy);
  if (!normalizePromptText(next.listenPrompt)) {
    next.listenPrompt = defaults.listenPrompt;
  }
  if (defaults.candidatePrompt && !normalizePromptText(next.candidatePrompt)) {
    next.candidatePrompt = defaults.candidatePrompt;
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
    enableThinking: false,
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
    audioFirstReference:
      source.audioFirstReference && typeof source.audioFirstReference === "object"
        ? source.audioFirstReference
        : null,
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
  const runtime = buildAsyncJobRuntimeMeta();
  const modelCatalog = {
    text: listModelsByFamily("text"),
    omni: listModelsByFamily("omni"),
    asr: listModelsByFamily("asr"),
  };
  return {
    success: true,
    service: SERVICE_NAME,
    scriptId: SCRIPT_ID,
    component: COMPONENT_NAME,
    status: "ready",
    timeoutMs: parseTimeoutMs(),
    modelMode: DEFAULT_MODEL_MODE,
    recognitionStrategy: DEFAULT_RECOGNITION_STRATEGY,
    audioFirstReferenceCorrectionThreshold: DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD,
    enableThinking: false,
    modelModeOptions: MODEL_MODE_OPTIONS.slice(),
    recognitionStrategyOptions: RECOGNITION_STRATEGY_OPTIONS.slice(),
    listenModelOptions: DATABAKER_LISTEN_MODEL_OPTIONS.slice(),
    compareModelOptions: DATABAKER_COMPARE_MODEL_OPTIONS.slice(),
    singleModelOptions: DATABAKER_SINGLE_MODEL_OPTIONS.slice(),
    listenModel: resolveDefaultListenModel(DEFAULT_MODEL_MODE),
    compareModel: resolveDefaultCompareModel(),
    singleModel: resolveDefaultSingleModel(),
    modelCatalog,
    queue: {
      groups: queueGroups,
      modelPoolPolicy: runtime.queue.defaultModelPool,
    },
    jobs: runtime.jobs,
    runtime,
    lexicon: buildLexiconState(),
    notes: {
      backendMode: "independent-aishell-pipeline",
      timeout: "Aishell 独立超时墙当前统一为 60s，前端默认通过短请求建 job + 轮询接收结果。",
      cancellation: "客户端断开、服务端超时和手动取消会统一透传 AbortSignal。",
      defaultListenPromptPreview: defaults.listenPrompt,
    },
  };
}

function createDefaultsPayload() {
  const audioFirstPrompts = getStrategyPromptDefaults("audio_first_reference");
  const defaultPrompts = getStrategyPromptDefaults(DEFAULT_RECOGNITION_STRATEGY);
  const runtime = buildAsyncJobRuntimeMeta();
  const modelCatalog = {
    text: listModelsByFamily("text"),
    omni: listModelsByFamily("omni"),
    asr: listModelsByFamily("asr"),
  };
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
      enableThinking: false,
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
      audioFirstReferenceCorrectionThreshold: DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD,
      listenPrompt: defaultPrompts.listenPrompt,
      candidatePrompt: defaultPrompts.candidatePrompt,
      comparePrompt: defaultPrompts.comparePrompt,
      promptProfiles: {
        audio_first_reference: audioFirstPrompts,
      },
      modelCatalog,
    }),
    jobs: runtime.jobs,
    runtime,
    notes: {
      defaultsSource: "Aishell independent backend defaults",
      requestMode: "async-job-default",
      compatibilityMode: "sync-recommend-kept-for-debug",
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
