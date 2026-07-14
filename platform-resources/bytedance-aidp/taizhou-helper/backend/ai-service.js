"use strict";

const {
  requestOmniInputAudio,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  ensureChineseSentencePunctuation,
  normalizeUsage,
  parseModelJsonText,
} = require("../../../backend/ai/model-response-utils");
const {
  buildPricingAvailabilitySummary,
  estimateProjectCost,
} = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "bytedanceAidpTaizhouHelper";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_OMNI_MODEL = "qwen3.5-omni-plus";
const SUPPORTED_OMNI_MODELS = ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];
const DEFAULT_OMNI_PARAMS = {
  temperature: 0.1,
  top_p: 0.8,
  max_tokens: 1200,
  max_completion_tokens: "",
  presence_penalty: "",
  frequency_penalty: "",
  seed: "",
  stop: "",
};
const ARABIC_DIGIT_TO_CHINESE = Object.freeze({
  "0": "零",
  "1": "一",
  "2": "二",
  "3": "三",
  "4": "四",
  "5": "五",
  "6": "六",
  "7": "七",
  "8": "八",
  "9": "九",
  "０": "零",
  "１": "一",
  "２": "二",
  "３": "三",
  "４": "四",
  "５": "五",
  "６": "六",
  "７": "七",
  "８": "八",
  "９": "九",
});
const EMPTY_RESULT_PATTERN =
  /^(纯静音|静音|完全听不清|听不清|听不出来|无法听清|无法识别|无内容|无语音|没有声音)([，。？！；,.!?;:]*)$/;
const DEFAULT_OMNI_PROMPT = [
  "你是浙江台州方言音频识别与普通话转换助手。请直接理解当前音频片段的实际语义，再写成自然普通话。",
  "台州各地口音差异较大；没有可确认的语音或上下文证据时，不猜测词义、不虚构方言词映射。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：listenText, finalMandarinText, isSinging, isNonTaizhouDialect, blockAutoFill, needHumanReview, notes。",
  "listenText 只保留原始听音草稿，不做润色、数字汉字化、标点规整或重复字裁剪；听到多少写多少。",
  "finalMandarinText 写可确认的自然普通话，不自由改写、不扩写、不截取局部短句。",
  "不知名人名、地名、公司名或其他无法精准锁定的事物，用 ##名称## 包起来。",
  "请显式判断主说话人是否唱歌，以及主要内容是否不是台州话；命中任一项仍保留可识别文本，但 blockAutoFill 必须为 true。",
  "抖音音效不截取。纯静音或完全听不清时，listenText 和 finalMandarinText 都返回空字符串。",
  "finalMandarinText 标点只允许使用 ，。？！不允许其他标点；句末只允许使用 。？！；不要使用阿拉伯数字，统一改写为汉字数字。",
  "finalMandarinText 中明显的口吃式同字或同音节连续重复最多保留三次；有语义的正常重复不要误删。",
].join("\n");
const PRICING_SUMMARY = Object.freeze(
  buildPricingAvailabilitySummary({
    omni: SUPPORTED_OMNI_MODELS,
  })
);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeListenText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function convertArabicDigitsToChinese(value) {
  return String(value || "").replace(/[0-9０-９]/g, function (digit) {
    return ARABIC_DIGIT_TO_CHINESE[digit] || digit;
  });
}

function stripUnsupportedMandarinSymbols(value) {
  let result = "";
  for (const char of String(value || "")) {
    if (
      /\s/u.test(char) ||
      /[\p{L}\p{N}]/u.test(char) ||
      char === "，" ||
      char === "。" ||
      char === "？" ||
      char === "！" ||
      char === "#"
    ) {
      result += char;
    }
  }
  return result;
}

function normalizeLineText(value) {
  return stripUnsupportedMandarinSymbols(
    convertArabicDigitsToChinese(
      String(value || "")
        .replace(/[\r\n]+/g, " ")
        .replace(/[《》]/g, "")
        .replace(/[“”"「」『』（）()[\]{}]/g, "")
        .replace(/[、]/g, "，")
        .replace(/,/g, "，")
        .replace(/\?/g, "？")
        .replace(/!/g, "！")
        .replace(/\./g, "。")
        .replace(/[…]/g, "。")
        .replace(/[；;：:]/g, "，")
        .replace(/\s+/g, " ")
    )
  ).trim();
}

function compressObviousStutters(text) {
  return String(text || "")
    .replace(/([\u3400-\u9fffA-Za-z])\1{3,}/g, function (_all, char) {
      return char + char + char;
    })
    .replace(/([\u3400-\u9fffA-Za-z]{2,4})\1{3,}/g, function (_all, word) {
      return word + word + word;
    });
}

function normalizeMandarinResultText(value) {
  const text = normalizeLineText(value);
  if (!text || EMPTY_RESULT_PATTERN.test(text)) {
    return "";
  }
  const normalized = ensureChineseSentencePunctuation(
    text
      .replace(/，+/g, "，")
      .replace(/。+/g, "。")
      .replace(/？+/g, "？")
      .replace(/！+/g, "！")
      .replace(/[，]+([。？！])/g, "$1")
      .replace(/([。？！])[，]+/g, "$1")
      .replace(/\s*([，。？！])\s*/g, "$1")
      .replace(/^[，。？！]+/g, "")
      .trim()
  )
    .replace(/[，]+([。？！])/g, "$1")
    .replace(/([。？！])[，]+/g, "$1")
    .replace(/\s*([，。？！])\s*/g, "$1")
    .trim();
  return compressObviousStutters(normalized);
}

function normalizeNotes(value) {
  return normalizeList(
    (Array.isArray(value) ? value : [value]).map(function (item) {
      return normalizeLineText(item);
    }),
    8
  );
}

function normalizeBooleanFlag(value) {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}

function normalizeErrorDebugObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function buildOmniDefaults() {
  return {
    model: DEFAULT_OMNI_MODEL,
    prompt: DEFAULT_OMNI_PROMPT,
    params: Object.assign({}, DEFAULT_OMNI_PARAMS),
  };
}

function normalizeOmniParams(params) {
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

function normalizeOmniConfig(rawOmni) {
  const defaults = buildOmniDefaults();
  const source = rawOmni && typeof rawOmni === "object" ? rawOmni : {};
  const requestedModel = normalizeText(source.model || defaults.model);
  return {
    model:
      SUPPORTED_OMNI_MODELS.indexOf(requestedModel) >= 0
        ? requestedModel
        : defaults.model,
    prompt: String(source.prompt || defaults.prompt || ""),
    params: normalizeOmniParams(source.params),
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
      Math.min(DEFAULT_TIMEOUT_MS, Math.round(toFiniteNumber(source.timeoutMs, DEFAULT_TIMEOUT_MS)))
    ),
    aiOmni: normalizeOmniConfig(source.aiOmni),
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

function normalizeOmniOutput(value) {
  const source = value && typeof value === "object" ? value : { finalMandarinText: value };
  const isSinging = normalizeBooleanFlag(source.isSinging);
  const isNonTaizhouDialect = normalizeBooleanFlag(source.isNonTaizhouDialect);
  return {
    listenText: normalizeListenText(
      source.listenText || source.heardText || source.audioText || source.transcript || ""
    ),
    finalMandarinText: normalizeMandarinResultText(
      source.finalMandarinText || source.refinedMandarinText || source.mandarinText || source.text || ""
    ),
    isSinging,
    isNonTaizhouDialect,
    blockAutoFill: normalizeBooleanFlag(source.blockAutoFill) || isSinging || isNonTaizhouDialect,
    needHumanReview:
      normalizeBooleanFlag(source.needHumanReview) || isSinging || isNonTaizhouDialect,
    notes: normalizeNotes(source.notes),
  };
}

function buildOmniPrompt(request, assetsContext) {
  return {
    systemPrompt: appendPromptRequirements(
      request.aiOmni?.prompt || DEFAULT_OMNI_PROMPT,
      [
        "仅根据当前音频片段输出 JSON。",
        "listenText 保留原始听音；finalMandarinText 输出普通话翻译。",
        "标点只允许使用 ，。？！不允许其他标点；不要使用阿拉伯数字。",
        "唱歌或非台州话时 blockAutoFill 必须为 true。",
      ]
    ),
    userPrompt: [
      "单次全模态识别上下文：",
      normalizeText(assetsContext?.rulesText)
        ? "参考资料已加载：taizhou-rules.md（按其当前边界处理，不编造方言映射）。"
        : "",
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
      "请直接完成听音、普通话转换与风险判断，只返回约定 JSON。",
    ].filter(Boolean).join("\n"),
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
  };
}

function parseOmniJsonWithFallback(rawText, requestId, deps) {
  try {
    return deps.parseModelJsonText(rawText || "", {
      requestId: requestId || SCRIPT_ID,
      stage: "omni",
    });
  } catch (_error) {
    return {
      listenText: rawText || "",
      finalMandarinText: rawText || "",
      blockAutoFill: true,
      needHumanReview: true,
      notes: ["模型未返回标准 JSON，已保留原始文本并阻止自动填入。"],
    };
  }
}

async function runOmni(request, assetsContext, deps) {
  const startedAt = deps.now();
  const result = await deps.requestOmniInputAudio(
    {
      audioUrl: request.audioUrl,
      audioDataUrl: request.audioDataUrl,
      aiOptions: request.aiOmni.params,
    },
    buildOmniPrompt(request, assetsContext),
    {
      model: request.aiOmni.model,
      timeoutMs: request.timeoutMs,
      enableThinking: false,
    }
  );
  const parsed = parseOmniJsonWithFallback(result.rawText || "", request.requestId, deps);
  const normalized = normalizeOmniOutput(parsed);
  return {
    listenText: normalized.listenText,
    finalMandarinText: normalized.finalMandarinText,
    isSinging: normalized.isSinging,
    isNonTaizhouDialect: normalized.isNonTaizhouDialect,
    blockAutoFill: normalized.blockAutoFill,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
    rawText: String(result.rawText || ""),
    debugRawJson: parsed && typeof parsed === "object" ? parsed : null,
    timing: {
      omniMs: Math.max(0, deps.now() - startedAt),
    },
    models: {
      omniModel: normalizeText(result.model) || request.aiOmni.model,
    },
    usage: {
      omni: deps.normalizeUsage(result.usage),
    },
  };
}

function buildRecommendCost(models, usage) {
  return estimateProjectCost({
    omni: {
      modelId: models?.omniModel,
      usage: usage?.omni,
      outputMode: "text",
    },
  });
}

async function recommend(request, assetsContext, overrides) {
  const deps = createRuntimeDeps(overrides);
  const startedAt = deps.now();
  const omniResult = await runOmni(request, assetsContext || {}, deps);
  const isSinging = omniResult.isSinging === true;
  const isNonTaizhouDialect = omniResult.isNonTaizhouDialect === true;
  const blockAutoFill = omniResult.blockAutoFill === true || isSinging || isNonTaizhouDialect;
  return {
    listenText: normalizeText(omniResult.listenText),
    finalMandarinText: normalizeText(omniResult.finalMandarinText),
    isSinging,
    isNonTaizhouDialect,
    blockAutoFill,
    needHumanReview:
      omniResult.needHumanReview === true || isSinging || isNonTaizhouDialect || blockAutoFill,
    notes: normalizeNotes(omniResult.notes),
    timing: {
      omniMs: Number(omniResult.timing?.omniMs || 0) || 0,
      totalMs: Math.max(0, deps.now() - startedAt),
    },
    models: omniResult.models,
    usage: omniResult.usage,
    cost: buildRecommendCost(omniResult.models, omniResult.usage),
    raw: {
      omni: omniResult.rawText,
    },
    debug: {
      omni: normalizeErrorDebugObject(omniResult.debugRawJson),
      rulesSource: "taizhou-rules.md",
    },
  };
}

function createHealthPayload(assetsContext) {
  return {
    success: true,
    route: "bytedance-aidp/taizhou-helper/ai/recommend",
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      omni: buildOmniDefaults(),
    },
    supportedModels: {
      omni: SUPPORTED_OMNI_MODELS.slice(),
    },
    contract: {
      writeField: "TempAnswer.Content.data.regions[*].txt",
      stages: ["omni"],
      writeMode: "manual-or-autofill",
    },
    reference: {
      rulesSource: "taizhou-rules.md",
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
      omni: buildOmniDefaults(),
    },
    supportedModels: {
      omni: SUPPORTED_OMNI_MODELS.slice(),
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
    contract: {
      stages: ["omni"],
      outputMode: "text",
      enableThinking: false,
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
    isSinging: result.isSinging === true,
    isNonTaizhouDialect: result.isNonTaizhouDialect === true,
    blockAutoFill: result.blockAutoFill === true,
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
    message: normalizeText(error.message) || "台州话 AI 识别失败。",
  };
  ["usage", "timing", "models", "cost", "raw", "debug"].forEach(function (key) {
    const value = normalizeErrorDebugObject(error[key]);
    if (value) {
      body[key] = value;
    }
  });
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
  DEFAULT_OMNI_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_OMNI_MODELS,
  __testOnly: {
    compressObviousStutters,
    normalizeListenText,
    normalizeMandarinResultText,
    normalizeOmniOutput,
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
