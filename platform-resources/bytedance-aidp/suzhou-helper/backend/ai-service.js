"use strict";

const {
  requestOmniInputAudio,
  requestTextCompareJson,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  ensureChineseSentencePunctuation,
  normalizeUsage,
  parseModelJsonText,
} = require("../../../data-baker/round-one-quality/backend/ai-service");
const {
  buildPricingAvailabilitySummary,
  estimateProjectCost,
} = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "bytedanceAidpSuzhouHelper";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_LISTEN_MODEL = "qwen3.5-omni-flash";
const DEFAULT_REFINE_MODEL = "qwen3.5-plus";
const SUPPORTED_LISTEN_MODELS = ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];
const SUPPORTED_REFINE_MODELS = ["qwen3.5-plus", "qwen3.5-flash"];
const DEFAULT_STAGE_PARAMS = {
  temperature: 0.1,
  top_p: 0.8,
  max_tokens: 1200,
  max_completion_tokens: "",
  presence_penalty: "",
  frequency_penalty: "",
  seed: "",
  stop: "",
};
const EMPTY_RESULT_PATTERN =
  /^(纯静音|静音|完全听不清|听不清|听不出来|无法听清|无法识别|无内容|无语音|没有声音)([，。？！；,.!?;:]*)$/;
const DEFAULT_LISTEN_PROMPT = [
  "请严格只根据当前音频片段输出原始听音草稿。",
  "最终目标不是苏州话原文稿，而是给下一阶段一个保守的听音结果。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：listenText, needHumanReview, notes。",
  "listenText 只写你听到的大致文本，不做润色，不做语义扩写。",
  "听不清时必须保守；纯静音或完全听不清时，listenText 返回空字符串。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "请把听音草稿收口成普通话听写稿。",
  "最终输出不是苏州话原文稿，也不是润色后的书面语。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：finalMandarinText, needHumanReview, notes。",
  "以听音为主，写成普通话写法；不要自由改写，不要补充没听到的信息。",
  "语气词、笑声等按听到的普通话写法保留。",
  "明显的口吃式同字或同音节连续重复，最多保留 3 次；有语义的正常重复不要误删。",
  "纯静音或完全听不清时，finalMandarinText 返回空字符串。",
].join("\n");
const PRICING_SUMMARY = Object.freeze(
  buildPricingAvailabilitySummary({
    listen: SUPPORTED_LISTEN_MODELS,
    refine: SUPPORTED_REFINE_MODELS,
  })
);

function normalizeText(value) {
  return String(value || "").trim();
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = normalizeText(code) || "request-failed";
  return error;
}

function normalizeList(value, limit) {
  const result = [];
  (Array.isArray(value) ? value : [value]).forEach(function (item) {
    const text = normalizeText(item);
    if (!text || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return typeof limit === "number" && limit > 0 ? result.slice(0, limit) : result;
}

function normalizeLineText(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[《》]/g, "")
    .replace(/[“”"「」『』（）()[\]{}]/g, "")
    .replace(/,/g, "，")
    .replace(/\?/g, "？")
    .replace(/!/g, "！")
    .replace(/\./g, "。")
    .replace(/[；;：:]/g, "，")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMandarinResultText(value) {
  const text = normalizeLineText(value);
  if (!text) {
    return "";
  }
  if (EMPTY_RESULT_PATTERN.test(text)) {
    return "";
  }
  return compressObviousStutters(
    ensureChineseSentencePunctuation(text)
      .replace(/[…]/g, "。")
      .replace(/，+/g, "，")
      .replace(/。+/g, "。")
      .replace(/？+/g, "？")
      .replace(/！+/g, "！")
  );
}

function compressObviousStutters(text) {
  return String(text || "").replace(/([\u3400-\u9fffA-Za-z])\1{3,}/g, function (_all, char) {
    return char + char + char;
  });
}

function normalizeNotes(value) {
  return normalizeList(
    (Array.isArray(value) ? value : [value]).map(function (item) {
      return normalizeLineText(item);
    }),
    8
  );
}

function normalizeErrorDebugObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function buildStageDefaults() {
  return {
    listen: {
      model: DEFAULT_LISTEN_MODEL,
      prompt: DEFAULT_LISTEN_PROMPT,
      params: Object.assign({}, DEFAULT_STAGE_PARAMS),
    },
    refine: {
      model: DEFAULT_REFINE_MODEL,
      prompt: DEFAULT_REFINE_PROMPT,
      params: Object.assign({}, DEFAULT_STAGE_PARAMS),
    },
  };
}

function normalizeStageParams(params) {
  const source = params && typeof params === "object" ? params : {};
  const result = {};
  [
    ["temperature", false],
    ["top_p", false],
    ["max_tokens", true],
    ["max_completion_tokens", true],
    ["presence_penalty", false],
    ["frequency_penalty", false],
    ["seed", true],
  ].forEach(function (definition) {
    const value = source[definition[0]];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return;
    }
    result[definition[0]] = definition[1] ? Math.round(number) : number;
  });
  const stopSource = Array.isArray(source.stop)
    ? source.stop
    : typeof source.stop === "string"
      ? source.stop.split(/\r?\n|,/)
      : [];
  const stop = stopSource.map(normalizeText).filter(Boolean).slice(0, 8);
  if (stop.length > 0) {
    result.stop = stop;
  }
  return result;
}

function normalizeStageConfig(rawStage, fallbackModel, fallbackPrompt, supportedModels) {
  const source = rawStage && typeof rawStage === "object" ? rawStage : {};
  const requestedModel = normalizeText(source.model || fallbackModel);
  return {
    model:
      supportedModels.indexOf(requestedModel) >= 0
        ? requestedModel
        : normalizeText(fallbackModel),
    prompt: String(source.prompt || fallbackPrompt || ""),
    params: normalizeStageParams(source.params),
  };
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const audioUrl = normalizeText(source.audioUrl);
  const audioDataUrl = normalizeText(source.audioDataUrl);
  if (!audioUrl && !audioDataUrl) {
    throw createHttpError(400, "缺少 audioUrl 或 audioDataUrl。", "missing-audio-input");
  }
  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, source.segment?.startMs || 0)));
  const endMs = Math.max(
    startMs,
    Math.round(toFiniteNumber(source.endMs, source.segment?.endMs || startMs))
  );
  const stageDefaults = buildStageDefaults();
  const aiStages = source.aiStages && typeof source.aiStages === "object" ? source.aiStages : {};
  const listenStage = normalizeStageConfig(
    aiStages.listen,
    source.listenModel || stageDefaults.listen.model,
    stageDefaults.listen.prompt,
    SUPPORTED_LISTEN_MODELS
  );
  const refineStage = normalizeStageConfig(
    aiStages.refine,
    source.refineModel || stageDefaults.refine.model,
    stageDefaults.refine.prompt,
    SUPPORTED_REFINE_MODELS
  );
  return {
    audioUrl,
    audioDataUrl,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    selectionKey: normalizeText(source.selectionKey),
    segmentNumber: Math.max(0, Math.round(Number(source.segmentNumber || 0)) || 0),
    fieldContext:
      source.fieldContext && typeof source.fieldContext === "object" ? source.fieldContext : {},
    editorContext:
      source.editorContext && typeof source.editorContext === "object" ? source.editorContext : {},
    requestId: normalizeText(source.requestId),
    aiUsageOperatorName: normalizeText(source.aiUsageOperatorName),
    platformUserName: normalizeText(source.platformUserName),
    platformUserId: normalizeText(source.platformUserId),
    timeoutMs: Math.max(
      1000,
      Math.min(300000, Math.round(toFiniteNumber(source.timeoutMs, DEFAULT_TIMEOUT_MS)))
    ),
    listenModel: listenStage.model,
    refineModel: refineStage.model,
    aiStages: {
      listen: listenStage,
      refine: refineStage,
    },
  };
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  return {
    rulesText: normalizeText(source.ruleText),
  };
}

function appendPromptRequirements(prompt, requiredLines) {
  return [String(prompt || "").trim()]
    .concat(Array.isArray(requiredLines) ? requiredLines : [])
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean)
    .join("\n");
}

function buildRulesExcerpt(assetsContext) {
  return String(assetsContext?.rulesText || "")
    .split(/\r?\n/)
    .slice(0, 60)
    .join("\n");
}

function normalizeListenStageOutput(value) {
  const source = value && typeof value === "object" ? value : { listenText: value };
  return {
    listenText: normalizeMandarinResultText(
      source.listenText || source.heardText || source.text || source.audioText || ""
    ),
    needHumanReview: source.needHumanReview === true,
    notes: normalizeNotes(source.notes),
  };
}

function normalizeRefineStageOutput(value) {
  const source = value && typeof value === "object" ? value : { finalMandarinText: value };
  return {
    finalMandarinText: normalizeMandarinResultText(
      source.finalMandarinText ||
        source.refinedMandarinText ||
        source.mandarinText ||
        source.text ||
        ""
    ),
    needHumanReview: source.needHumanReview === true,
    notes: normalizeNotes(source.notes),
  };
}

function buildListenPrompt(request, assetsContext) {
  return {
    systemPrompt: appendPromptRequirements(
      request.aiStages?.listen?.prompt || DEFAULT_LISTEN_PROMPT,
      [
        "listenText 只保留听到的文本，不要润色成自然书面语。",
        "纯静音或完全听不清时，listenText 返回空字符串。",
      ]
    ),
    userPrompt: [
      "项目规则摘要：",
      buildRulesExcerpt(assetsContext),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
            segmentNumber: request.segmentNumber,
          },
          fieldContext: request.fieldContext,
          editorContext: request.editorContext,
        },
        null,
        2
      ),
      "请仅根据当前音频片段输出 JSON。",
    ].join("\n"),
  };
}

function buildRefinePrompt(request, assetsContext, listenResult) {
  return {
    systemPrompt: appendPromptRequirements(
      request.aiStages?.refine?.prompt || DEFAULT_REFINE_PROMPT,
      [
        "finalMandarinText 必须是普通话听写稿，不是苏州话原文稿，不是润色稿。",
        "语气词和笑声保留；口吃式连续重复最多保留 3 次。",
        "纯静音或完全听不清时，finalMandarinText 返回空字符串。",
      ]
    ),
    userPrompt: [
      "项目规则摘要：",
      buildRulesExcerpt(assetsContext),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
            segmentNumber: request.segmentNumber,
          },
          listenText: listenResult.listenText,
          fieldContext: request.fieldContext,
          editorContext: request.editorContext,
        },
        null,
        2
      ),
      "请把听音草稿收口成普通话听写稿并输出 JSON。",
    ].join("\n"),
  };
}

function createRuntimeDeps(overrides) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return {
    now: typeof source.now === "function" ? source.now : Date.now,
    parseModelJsonText:
      typeof source.parseModelJsonText === "function" ? source.parseModelJsonText : parseModelJsonText,
    normalizeUsage:
      typeof source.normalizeUsage === "function" ? source.normalizeUsage : normalizeUsage,
    requestOmniInputAudio:
      typeof source.requestOmniInputAudio === "function" ? source.requestOmniInputAudio : requestOmniInputAudio,
    requestTextCompareJson:
      typeof source.requestTextCompareJson === "function" ? source.requestTextCompareJson : requestTextCompareJson,
  };
}

function parseStageJsonWithFallback(rawText, requestId, stage) {
  try {
    return parseModelJsonText(rawText || "", {
      requestId: requestId || SCRIPT_ID,
      stage: stage,
    });
  } catch (_error) {
    if (stage === "listen") {
      return {
        listenText: rawText || "",
        needHumanReview: true,
        notes: ["模型未返回标准 JSON，已按原始文本兜底。"],
      };
    }
    return {
      finalMandarinText: rawText || "",
      needHumanReview: true,
      notes: ["模型未返回标准 JSON，已按原始文本兜底。"],
    };
  }
}

async function runListenStage(request, assetsContext, deps) {
  const stageStartedAt = deps.now();
  const result = await deps.requestOmniInputAudio(
    {
      audioUrl: request.audioUrl,
      audioDataUrl: request.audioDataUrl,
      aiOptions: request.aiStages.listen.params,
    },
    buildListenPrompt(request, assetsContext),
    {
      model: request.listenModel,
      timeoutMs: request.timeoutMs,
    }
  );
  const parsed = parseStageJsonWithFallback(result.rawText || "", request.requestId, "listen");
  const normalized = normalizeListenStageOutput(parsed);
  return {
    listenText: normalized.listenText,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
    rawText: String(result.rawText || ""),
    debugRawJson: parsed && typeof parsed === "object" ? parsed : null,
    timing: {
      listenMs: Math.max(0, deps.now() - stageStartedAt),
    },
    models: {
      listenModel: normalizeText(result.model) || request.listenModel,
    },
    usage: {
      listen: deps.normalizeUsage(result.usage),
    },
  };
}

async function runRefineStage(request, assetsContext, listenResult, deps) {
  const stageStartedAt = deps.now();
  const result = await deps.requestTextCompareJson(
    {
      pageText: request.fieldContext?.text || request.fieldContext?.dialectText || "",
      heardText: listenResult.listenText,
      aiOptions: request.aiStages.refine.params,
    },
    buildRefinePrompt(request, assetsContext, listenResult),
    {
      model: request.refineModel,
      timeoutMs: request.timeoutMs,
      stage: "refine",
    }
  );
  const parsed = parseStageJsonWithFallback(result.rawText || "", request.requestId, "refine");
  const normalized = normalizeRefineStageOutput(parsed);
  return {
    finalMandarinText: normalized.finalMandarinText,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
    rawText: String(result.rawText || ""),
    debugRawJson: parsed && typeof parsed === "object" ? parsed : null,
    timing: {
      refineMs: Math.max(0, deps.now() - stageStartedAt),
    },
    models: {
      refineModel: normalizeText(result.model) || request.refineModel,
    },
    usage: {
      refine: deps.normalizeUsage(result.usage),
    },
  };
}

function buildRecommendCost(models, usage) {
  return estimateProjectCost({
    listen: {
      modelId: models?.listenModel,
      usage: usage?.listen,
      outputMode: "text",
    },
    refine: {
      modelId: models?.refineModel,
      usage: usage?.refine,
    },
  });
}

function mergeNotes() {
  return normalizeNotes(Array.from(arguments).flat());
}

async function recommend(request, assetsContext, overrides) {
  const deps = createRuntimeDeps(overrides);
  const startedAt = deps.now();
  const normalizedAssetsContext = assetsContext || {};
  const listenResult = await runListenStage(request, normalizedAssetsContext, deps);
  const refineResult = await runRefineStage(request, normalizedAssetsContext, listenResult, deps);
  const models = Object.assign({}, listenResult.models || {}, refineResult.models || {});
  const usage = Object.assign({}, listenResult.usage || {}, refineResult.usage || {});
  return {
    listenText: normalizeText(listenResult.listenText),
    finalMandarinText: normalizeText(refineResult.finalMandarinText),
    needHumanReview:
      listenResult.needHumanReview === true || refineResult.needHumanReview === true,
    notes: mergeNotes(listenResult.notes, refineResult.notes),
    timing: {
      listenMs: Number(listenResult.timing?.listenMs || 0) || 0,
      refineMs: Number(refineResult.timing?.refineMs || 0) || 0,
      totalMs: Math.max(0, deps.now() - startedAt),
    },
    models: models,
    usage: usage,
    cost: buildRecommendCost(models, usage),
    raw: {
      listen: listenResult.rawText,
      refine: refineResult.rawText,
    },
    debug: {
      listen: normalizeErrorDebugObject(listenResult.debugRawJson),
      refine: normalizeErrorDebugObject(refineResult.debugRawJson),
      rulesSource: "suzhou-rules.md",
    },
  };
}

function createHealthPayload(assetsContext) {
  return {
    success: true,
    route: "bytedance-aidp/suzhou-helper/ai/recommend",
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      stages: buildStageDefaults(),
    },
    supportedModels: {
      listen: SUPPORTED_LISTEN_MODELS.slice(),
      refine: SUPPORTED_REFINE_MODELS.slice(),
    },
    contract: {
      writeField: "TempAnswer.Content.data.regions[*].txt",
      stages: ["listen", "refine"],
      writeMode: "manual-or-autofill",
    },
    reference: {
      rulesSource: "suzhou-rules.md",
      rulesLoaded: Boolean(normalizeText(assetsContext?.rulesText)),
    },
    pricing: Object.assign({}, PRICING_SUMMARY),
  };
}

function createDefaultsPayload() {
  return {
    success: true,
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      stages: buildStageDefaults(),
    },
    supportedModels: {
      listen: SUPPORTED_LISTEN_MODELS.slice(),
      refine: SUPPORTED_REFINE_MODELS.slice(),
    },
    supportedParams: {
      temperature: true,
      top_p: true,
      max_tokens: true,
      max_completion_tokens: true,
      presence_penalty: true,
      frequency_penalty: true,
      seed: true,
      stop: true,
      enable_thinking: false,
    },
    pricing: Object.assign({}, PRICING_SUMMARY),
  };
}

function buildRecommendSuccessBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const result =
    source.data && typeof source.data === "object"
      ? source.data
      : source.execution?.projectResult || {};
  return {
    success: true,
    requestId: normalizeText(source.requestId || source.normalizedRequest?.requestId),
    listenText: normalizeText(result.listenText),
    finalMandarinText: normalizeText(result.finalMandarinText),
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
    cost: result.cost && typeof result.cost === "object" ? result.cost : {},
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
    notes: normalizeNotes(result.notes),
    needHumanReview: result.needHumanReview === true,
    raw: result.raw && typeof result.raw === "object" ? result.raw : {},
    debug: result.debug && typeof result.debug === "object" ? result.debug : {},
  };
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error && typeof source.error === "object" ? source.error : {};
  const body = {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: normalizeText(error.message) || "苏州话 AI 识别失败。",
  };
  const usage = normalizeErrorDebugObject(error.usage);
  const timing = normalizeErrorDebugObject(error.timing);
  const models = normalizeErrorDebugObject(error.models);
  const cost = normalizeErrorDebugObject(error.cost);
  const raw = normalizeErrorDebugObject(error.raw);
  const debug = normalizeErrorDebugObject(error.debug);
  if (usage) {
    body.usage = usage;
  }
  if (timing) {
    body.timing = timing;
  }
  if (models) {
    body.models = models;
  }
  if (cost) {
    body.cost = cost;
  }
  if (raw) {
    body.raw = raw;
  }
  if (debug) {
    body.debug = debug;
  }
  if (normalizeText(error.listenText)) {
    body.listenText = normalizeText(error.listenText);
  }
  if (normalizeText(error.finalMandarinText)) {
    body.finalMandarinText = normalizeText(error.finalMandarinText);
  }
  if (Array.isArray(error.notes)) {
    body.notes = normalizeNotes(error.notes);
  }
  return body;
}

module.exports = {
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REFINE_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_LISTEN_MODELS,
  SUPPORTED_REFINE_MODELS,
  __testOnly: {
    compressObviousStutters,
    normalizeListenStageOutput,
    normalizeMandarinResultText,
    normalizeRefineStageOutput,
  },
  buildAssetsContext,
  buildRecommendErrorBody,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  createHttpError,
  normalizeRecommendRequest,
  recommend,
};
