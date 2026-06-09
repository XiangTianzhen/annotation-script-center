"use strict";

const {
  requestOmniInputAudio,
  requestTextCompareJson,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  ensureChineseSentencePunctuation,
  normalizeUsage,
  parseLexiconCsv,
  parseModelJsonText,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const SCRIPT_ID = "dataBakerCvpcLiuzhouAssistant";
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
const SUPPORTED_SPECIAL_TAGS = [
  "#um",
  "#hmm",
  "#ah",
  "#eh",
  "<SPK/>",
  "<NPS/>",
  "<Unintelligible>",
  "<Meaningless>",
];
const DEFAULT_LISTEN_PROMPT = [
  "请严格以音频为主，输出当前段的听音结果。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：audioDialectText, audioMandarinText, specialTags, needHumanReview, notes。",
  "audioDialectText 写音频里的柳州话文本；audioMandarinText 写对应普通话文本。",
  "不要先套词表推断，词表只能作为参考提示；听不清必须保守，并把 needHumanReview 设为 true。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "请修正柳州话文本，但仍以听音结果为主。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：refinedDialectText, needHumanReview, notes。",
  "你会收到听音柳州话文本、普通话文本和词表命中片段，只修正柳州话文本，不重写普通话文本。",
  "若拿不准或需要保留歧义，必须把 needHumanReview 设为 true。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");

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
    .replace(/[；;：:]/g, "，")
    .replace(/[“”"「」『』（）()[\]{}]/g, "")
    .replace(/,/g, "，")
    .replace(/\?/g, "？")
    .replace(/!/g, "！")
    .replace(/\./g, "。")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAllowedPunctuation(text) {
  const value = normalizeLineText(text);
  if (!value) {
    return "";
  }
  const withEnding = ensureChineseSentencePunctuation(value);
  return withEnding
    .replace(/[；;：:]/g, "，")
    .replace(/[…]/g, "。")
    .replace(/。+/g, "。")
    .replace(/，+/g, "，")
    .replace(/？+/g, "？")
    .replace(/！+/g, "！");
}

function normalizeSpecialTag(tag) {
  const text = normalizeText(tag);
  return SUPPORTED_SPECIAL_TAGS.indexOf(text) >= 0 ? text : "";
}

function normalizeSpecialTags(value) {
  const result = [];
  (Array.isArray(value) ? value : [value]).forEach(function (item) {
    const normalized = normalizeSpecialTag(item);
    if (!normalized || result.indexOf(normalized) >= 0) {
      return;
    }
    result.push(normalized);
  });
  return result;
}

function extractSupportedTagsFromText(text) {
  const value = String(text || "");
  return SUPPORTED_SPECIAL_TAGS.filter(function (tag) {
    return value.indexOf(tag) >= 0;
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

function normalizeListenStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const audioDialectText = normalizeAllowedPunctuation(
    source.audioDialectText || source.dialectText || source.heardText || source.text || source.transcript || ""
  );
  const audioMandarinText = normalizeAllowedPunctuation(
    source.audioMandarinText || source.mandarinText || source.translationText || source.plainMandarinText || ""
  );
  const specialTags = normalizeSpecialTags(source.specialTags).concat(
    extractSupportedTagsFromText(audioDialectText),
    extractSupportedTagsFromText(audioMandarinText)
  );
  return {
    audioDialectText,
    audioMandarinText,
    specialTags: normalizeSpecialTags(specialTags),
    needHumanReview: source.needHumanReview === true || !audioDialectText || !audioMandarinText,
    notes: normalizeNotes(source.notes),
  };
}

function normalizeRefineStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const refinedDialectText = normalizeAllowedPunctuation(
    source.refinedDialectText || source.dialectText || source.recommendedDialectText || source.recommendedText || ""
  );
  return {
    refinedDialectText,
    needHumanReview: source.needHumanReview === true || !refinedDialectText,
    notes: normalizeNotes(source.notes),
  };
}

function buildStageDefaults() {
  return {
    listen: Object.assign(
      {
        model: DEFAULT_LISTEN_MODEL,
        prompt: DEFAULT_LISTEN_PROMPT,
        modelOptions: SUPPORTED_LISTEN_MODELS.slice(),
      },
      DEFAULT_STAGE_PARAMS
    ),
    refine: Object.assign(
      {
        model: DEFAULT_REFINE_MODEL,
        prompt: DEFAULT_REFINE_PROMPT,
        modelOptions: SUPPORTED_REFINE_MODELS.slice(),
      },
      DEFAULT_STAGE_PARAMS
    ),
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
  const stop = stopSource
    .map(function (item) {
      return normalizeText(item);
    })
    .filter(Boolean)
    .slice(0, 8);
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
    source.model || source.aiRecommendModel || stageDefaults.listen.model,
    stageDefaults.listen.prompt,
    SUPPORTED_LISTEN_MODELS
  );
  const refineStage = normalizeStageConfig(
    aiStages.refine,
    stageDefaults.refine.model,
    stageDefaults.refine.prompt,
    SUPPORTED_REFINE_MODELS
  );

  return {
    audioUrl,
    audioDataUrl,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
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

function buildLexiconRows(text) {
  try {
    return parseLexiconCsv(String(text || ""));
  } catch (_error) {
    return [];
  }
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  const lexiconRows = buildLexiconRows(source.lexiconCsv);
  return {
    rulesText: String(source.ruleText || "").trim(),
    lexiconRows,
  };
}

function buildRelevantLexiconContext(assetsContext, hintTexts) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  const hintText = (Array.isArray(hintTexts) ? hintTexts : [])
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const matches = rows.filter(function (row) {
    const reading = normalizeText(row?.["柳州话读音"]);
    const dialectWord = normalizeText(row?.["柳州字转写用字"]);
    const meaning = normalizeText(row?.["释义"]);
    if (!hintText) {
      return false;
    }
    return (
      (dialectWord && hintText.indexOf(dialectWord) >= 0) ||
      (meaning && hintText.indexOf(meaning) >= 0) ||
      (reading && hintText.indexOf(reading) >= 0)
    );
  });
  const shortlist = (matches.length > 0 ? matches : rows).slice(0, 24);
  return shortlist
    .map(function (row) {
      return {
        reading: normalizeText(row?.["柳州话读音"]),
        dialectWord: normalizeText(row?.["柳州字转写用字"]),
        meaning: normalizeText(row?.["释义"]),
      };
    })
    .filter(function (row) {
      return row.reading || row.dialectWord || row.meaning;
    });
}

function buildRulesExcerpt(assetsContext) {
  return String(assetsContext?.rulesText || "")
    .split(/\r?\n/)
    .slice(0, 60)
    .join("\n");
}

function buildListenPrompt(request, assetsContext) {
  const lexiconContext = buildRelevantLexiconContext(assetsContext, [
    request.fieldContext?.dialectText,
    request.fieldContext?.mandarinText,
    request.editorContext?.selectedEntry?.name,
  ]);
  return {
    systemPrompt: String(request.aiStages?.listen?.prompt || DEFAULT_LISTEN_PROMPT),
    userPrompt: [
      "项目规则摘要：",
      buildRulesExcerpt(assetsContext),
      "词表参考（只作辅助，不可压过听音）：",
      JSON.stringify(lexiconContext, null, 2),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
          },
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请仅根据音频输出 JSON。",
    ].join("\n"),
  };
}

function buildRefinePrompt(request, assetsContext, listenResult) {
  const lexiconContext = buildRelevantLexiconContext(assetsContext, [
    listenResult.audioDialectText,
    listenResult.audioMandarinText,
    request.fieldContext?.dialectText,
    request.fieldContext?.mandarinText,
    request.editorContext?.selectedEntry?.name,
  ]);
  return {
    systemPrompt: String(request.aiStages?.refine?.prompt || DEFAULT_REFINE_PROMPT),
    userPrompt: [
      "项目规则摘要：",
      buildRulesExcerpt(assetsContext),
      "词表命中参考：",
      JSON.stringify(lexiconContext, null, 2),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
          },
          audioDialectText: listenResult.audioDialectText,
          audioMandarinText: listenResult.audioMandarinText,
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请只修正柳州话文本，并输出 refinedDialectText。",
    ].join("\n"),
  };
}

function createHealthPayload(assetsContext) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  return {
    success: true,
    route: "data-baker-cvpc/liuzhou-helper/ai/recommend",
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      stages: buildStageDefaults(),
    },
    supportedModels: {
      listen: SUPPORTED_LISTEN_MODELS.slice(),
      refine: SUPPORTED_REFINE_MODELS.slice(),
    },
    reference: {
      lexiconRowCount: rows.length,
      lexiconSource: "liuzhou-pronunciation-reference.csv",
      rulesSource: "liuzhou-rules.md",
    },
    contract: {
      writeContractCaptured: false,
      fillMode: "manual-confirm",
      stages: ["listen", "refine"],
    },
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
  const parsed = deps.parseModelJsonText(result.rawText || "", {
    requestId: request.requestId || "liuzhou-cvpc",
    stage: "listen",
  });
  const normalized = normalizeListenStageOutput(parsed);
  return {
    audioDialectText: normalized.audioDialectText,
    audioMandarinText: normalized.audioMandarinText,
    specialTags: normalized.specialTags,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
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
      pageText: request.fieldContext?.dialectText || "",
      heardText: listenResult.audioDialectText,
      aiOptions: request.aiStages.refine.params,
    },
    buildRefinePrompt(request, assetsContext, listenResult),
    {
      model: request.refineModel,
      timeoutMs: request.timeoutMs,
      stage: "refine",
    }
  );
  const parsed = deps.parseModelJsonText(result.rawText || "", {
    requestId: request.requestId || "liuzhou-cvpc",
    stage: "refine",
  });
  const normalized = normalizeRefineStageOutput(parsed);
  return {
    refinedDialectText: normalized.refinedDialectText || listenResult.audioDialectText,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
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

async function recommend(request, assetsContext, overrides) {
  const deps = createRuntimeDeps(overrides);
  const startedAt = deps.now();
  const listenResult = await runListenStage(request, assetsContext || {}, deps);
  const refineResult = await runRefineStage(request, assetsContext || {}, listenResult, deps);
  const audioDialectText = normalizeAllowedPunctuation(listenResult.audioDialectText);
  const audioMandarinText = normalizeAllowedPunctuation(listenResult.audioMandarinText);
  const refinedDialectText = normalizeAllowedPunctuation(
    refineResult.refinedDialectText || listenResult.audioDialectText
  );
  return {
    audioDialectText,
    audioMandarinText,
    refinedDialectText,
    dialectText: refinedDialectText,
    mandarinText: audioMandarinText,
    specialTags: normalizeSpecialTags(listenResult.specialTags),
    needHumanReview:
      listenResult.needHumanReview === true ||
      refineResult.needHumanReview === true ||
      !audioDialectText ||
      !audioMandarinText ||
      !refinedDialectText,
    notes: normalizeNotes([].concat(listenResult.notes || [], refineResult.notes || [])),
    timing: Object.assign({}, listenResult.timing || {}, refineResult.timing || {}, {
      totalMs: Math.max(0, deps.now() - startedAt),
    }),
    models: Object.assign({}, listenResult.models || {}, refineResult.models || {}),
    usage: Object.assign({}, listenResult.usage || {}, refineResult.usage || {}),
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
    audioDialectText: normalizeText(result.audioDialectText),
    audioMandarinText: normalizeText(result.audioMandarinText),
    refinedDialectText: normalizeText(result.refinedDialectText || result.dialectText),
    dialectText: normalizeText(result.refinedDialectText || result.dialectText),
    mandarinText: normalizeText(result.audioMandarinText || result.mandarinText),
    specialTags: normalizeList(result.specialTags, 8),
    needHumanReview: result.needHumanReview === true,
    notes: normalizeNotes(result.notes),
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
  };
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error || {};
  return {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: normalizeText(error.safeMessage || error.message || "柳州话 AI 推荐失败。"),
  };
}

module.exports = {
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REFINE_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_LISTEN_MODELS,
  SUPPORTED_REFINE_MODELS,
  SUPPORTED_SPECIAL_TAGS,
  __testOnly: {
    normalizeAllowedPunctuation,
    normalizeListenStageOutput,
    normalizeRefineStageOutput,
    normalizeSpecialTags,
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
