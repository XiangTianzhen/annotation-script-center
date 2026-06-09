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
const { validateBusinessLexiconDocument } = require("../../../backend/business-lexicon");

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
  "JSON 字段固定为：audioDialectText, specialTags, needHumanReview, notes。",
  "audioDialectText 只写音频里的柳州话文本，不要在这一阶段输出普通话文本。",
  "不要先套词表推断，词表只能作为参考提示；听不清必须保守，并把 needHumanReview 设为 true。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "请同时收口柳州话文本和普通话文本，但仍以听音结果与词表草稿为主。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：refinedDialectText, refinedMandarinText, needHumanReview, notes。",
  "你会收到原始听音柳州话、词表优先生成的普通话草稿、页面字段上下文和词表命中片段。",
  "只做标点、断句、明显错字和顺滑修正，不做自由改写，不要偏离词表含义。",
  "若拿不准或需要保留歧义，必须把 needHumanReview 设为 true。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
let warnedLexiconReferenceOnly = false;

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

function parseCsvLine(text) {
  const source = String(text || "");
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source.charAt(index);
    if (char === '"') {
      if (inQuotes && source.charAt(index + 1) === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

function normalizeListenStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const audioDialectText = normalizeAllowedPunctuation(
    source.audioDialectText || source.dialectText || source.heardText || source.text || source.transcript || ""
  );
  const specialTags = normalizeSpecialTags(source.specialTags).concat(
    extractSupportedTagsFromText(audioDialectText)
  );
  return {
    audioDialectText,
    audioMandarinText: "",
    specialTags: normalizeSpecialTags(specialTags),
    needHumanReview: source.needHumanReview === true || !audioDialectText,
    notes: normalizeNotes(source.notes),
  };
}

function normalizeRefineStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const refinedDialectText = normalizeAllowedPunctuation(
    source.refinedDialectText || source.dialectText || source.recommendedDialectText || source.recommendedText || ""
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    source.refinedMandarinText ||
      source.mandarinText ||
      source.recommendedMandarinText ||
      source.translationText ||
      source.plainMandarinText ||
      ""
  );
  return {
    refinedDialectText,
    refinedMandarinText,
    needHumanReview: source.needHumanReview === true || !refinedDialectText || !refinedMandarinText,
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
    selectionKey: normalizeText(source.selectionKey),
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

function buildLexiconRows(document) {
  const normalizedDocument = validateBusinessLexiconDocument(document || {});
  const entries = Array.isArray(normalizedDocument.entries) ? normalizedDocument.entries : [];
  if (entries.length <= 0) {
    return [];
  }
  return entries
    .map(function (entry) {
      return {
        id: normalizeText(entry.id),
        normalized: normalizeText(entry.normalized),
        display: normalizeText(entry.display),
        mandarin: normalizeText(entry.mandarin),
        aliases: normalizeList(entry.aliases || [], 20),
        notes: normalizeList(entry.notes || [], 20),
        tags: normalizeList(entry.tags || [], 20),
      };
    })
    .filter(function (row) {
      return row.normalized && row.display && row.mandarin;
    });
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  let lexiconRows = [];
  let lexiconStatus = "missing";
  let lexiconWarning = "";
  const hasReferenceCsv = normalizeText(source.lexiconReferenceCsv).length > 0;
  try {
    if (source.lexiconJson) {
      lexiconRows = buildLexiconRows(source.lexiconJson);
      lexiconStatus = "ready";
    } else if (hasReferenceCsv) {
      lexiconStatus = "reference_only";
      lexiconWarning = "没有字词对应表";
    }
  } catch (_error) {
    lexiconRows = [];
    lexiconStatus = "invalid";
  }
  if (lexiconStatus === "reference_only") {
    if (!warnedLexiconReferenceOnly) {
      warnedLexiconReferenceOnly = true;
      console.warn("[DataBaker][cvpc][liuzhou][ai] 没有字词对应表，检测到本地参考 CSV，已按无词表模式继续返回。", {
        referenceFileName: "liuzhou-pronunciation-reference.csv",
      });
    }
  }
  return {
    rulesText: String(source.ruleText || "").trim(),
    lexiconRows,
    lexiconStatus,
    lexiconWarning,
  };
}

function buildRelevantLexiconContext(assetsContext, hintTexts) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  const hintText = (Array.isArray(hintTexts) ? hintTexts : [])
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const matches = rows.filter(function (row) {
    const dialectWord = normalizeText(row?.display || row?.normalized);
    const meaning = normalizeText(row?.mandarin);
    if (!hintText) {
      return false;
    }
    return (
      (dialectWord && hintText.indexOf(dialectWord) >= 0) ||
      (meaning && hintText.indexOf(meaning) >= 0)
    );
  });
  const shortlist = (matches.length > 0 ? matches : rows).slice(0, 24);
  return shortlist
    .map(function (row) {
      return {
        id: normalizeText(row?.id),
        dialectWord: normalizeText(row?.display || row?.normalized),
        meaning: normalizeText(row?.mandarin),
        aliases: normalizeList(row?.aliases || [], 20),
        notes: normalizeList(row?.notes || [], 20),
        tags: normalizeList(row?.tags || [], 20),
      };
    })
    .filter(function (row) {
      return row.dialectWord || row.meaning;
    });
}

function buildMandarinDraftFromLexicon(assetsContext, dialectText) {
  const sourceText = normalizeAllowedPunctuation(dialectText);
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  if (!sourceText || rows.length <= 0) {
    return sourceText;
  }
  const dictionary = rows
    .map(function (row) {
      return {
        dialectWord: normalizeText(row?.display || row?.normalized),
        meaning: normalizeText(row?.mandarin),
      };
    })
    .filter(function (row) {
      return row.dialectWord && row.meaning;
    })
    .sort(function (left, right) {
      return right.dialectWord.length - left.dialectWord.length;
    });
  if (dictionary.length <= 0) {
    return sourceText;
  }
  const segments = [];
  let cursor = 0;
  while (cursor < sourceText.length) {
    const matched = dictionary.find(function (row) {
      return sourceText.slice(cursor, cursor + row.dialectWord.length) === row.dialectWord;
    });
    if (matched) {
      segments.push(matched.meaning);
      cursor += matched.dialectWord.length;
      continue;
    }
    segments.push(sourceText.charAt(cursor));
    cursor += 1;
  }
  return normalizeAllowedPunctuation(segments.join("") || sourceText);
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
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult.mandarinDraft ||
      buildMandarinDraftFromLexicon(assetsContext, listenResult.audioDialectText)
  );
  const lexiconContext = buildRelevantLexiconContext(assetsContext, [
    listenResult.audioDialectText,
    mandarinDraft,
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
          mandarinDraft: mandarinDraft,
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请同时输出 refinedDialectText 与 refinedMandarinText。",
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
      lexiconStatus: normalizeText(assetsContext?.lexiconStatus || "missing"),
      lexiconWarning: normalizeText(assetsContext?.lexiconWarning || ""),
      lexiconSource: "liuzhou-lexicon.json",
      lexiconReferenceSource: "liuzhou-pronunciation-reference.csv",
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
    audioMandarinText: "",
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
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult.mandarinDraft ||
      buildMandarinDraftFromLexicon(assetsContext, listenResult.audioDialectText)
  );
  const result = await deps.requestTextCompareJson(
    {
      pageText: request.fieldContext?.dialectText || "",
      heardText: listenResult.audioDialectText,
      mandarinDraft: mandarinDraft,
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
  const refinedDialectText = normalizeAllowedPunctuation(
    normalized.refinedDialectText || listenResult.audioDialectText
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    normalized.refinedMandarinText || mandarinDraft
  );
  return {
    refinedDialectText,
    refinedMandarinText,
    needHumanReview:
      normalized.needHumanReview === true || !refinedDialectText || !refinedMandarinText,
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
  listenResult.mandarinDraft = buildMandarinDraftFromLexicon(
    assetsContext || {},
    listenResult.audioDialectText
  );
  const refineResult = await runRefineStage(request, assetsContext || {}, listenResult, deps);
  const audioDialectText = normalizeAllowedPunctuation(listenResult.audioDialectText);
  const refinedDialectText = normalizeAllowedPunctuation(
    refineResult.refinedDialectText || listenResult.audioDialectText
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    refineResult.refinedMandarinText || listenResult.mandarinDraft
  );
  return {
    audioDialectText,
    audioMandarinText: refinedMandarinText,
    refinedDialectText,
    refinedMandarinText,
    dialectText: refinedDialectText,
    mandarinText: refinedMandarinText,
    specialTags: normalizeSpecialTags(listenResult.specialTags),
    needHumanReview:
      listenResult.needHumanReview === true ||
      refineResult.needHumanReview === true ||
      !audioDialectText ||
      !refinedDialectText ||
      !refinedMandarinText,
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
    audioMandarinText: normalizeText(result.audioMandarinText || result.refinedMandarinText || result.mandarinText),
    refinedDialectText: normalizeText(result.refinedDialectText || result.dialectText),
    refinedMandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    dialectText: normalizeText(result.refinedDialectText || result.dialectText),
    mandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    specialTags: normalizeList(result.specialTags, 8),
    needHumanReview: result.needHumanReview === true,
    notes: normalizeNotes(result.notes),
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
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
    buildMandarinDraftFromLexicon,
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
