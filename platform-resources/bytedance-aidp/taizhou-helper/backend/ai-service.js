"use strict";

const {
  requestOmniInputAudio,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  normalizeUsage,
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
const DEFAULT_OMNI_PROMPT = [
  "你是浙江台州方言音频识别助手。只写出当前音频片段中实际听到的文本原文。",
  "只输出当前片段的最终转写文本；不得输出 JSON、字段名、Markdown、解释或多余文字。",
  "最终转写文本必须逐字保留模型听到的内容；不要翻译成普通话，不要润色、补写、删减、改数字、规整标点或压缩重复字。",
  "纯静音或完全听不清时，直接输出空字符串。",
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
  return typeof value === "string" ? value : "";
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
  const requestedPrompt = typeof source.prompt === "string" ? source.prompt : "";
  return {
    model:
      SUPPORTED_OMNI_MODELS.indexOf(requestedModel) >= 0
        ? requestedModel
        : defaults.model,
    prompt: normalizeText(requestedPrompt) ? requestedPrompt : defaults.prompt,
    params: normalizeOmniParams(source.params),
    enableThinking: source.enableThinking === true,
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

function normalizeOmniOutput(value) {
  return {
    listenText: normalizeListenText(value),
  };
}

function buildOmniPrompt(request, assetsContext) {
  return {
    systemPrompt: String(request.aiOmni?.prompt || DEFAULT_OMNI_PROMPT),
    userPrompt: [
      "单次全模态识别上下文：",
      normalizeText(assetsContext?.rulesText)
        ? "参考资料已加载：taizhou-rules.md。"
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
    ].filter(Boolean).join("\n"),
  };
}

function createRuntimeDeps(overrides) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return {
    now: typeof source.now === "function" ? source.now : Date.now,
    normalizeUsage:
      typeof source.normalizeUsage === "function" ? source.normalizeUsage : normalizeUsage,
    requestOmniInputAudio:
      typeof source.requestOmniInputAudio === "function" ? source.requestOmniInputAudio : requestOmniInputAudio,
  };
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
      enableThinking: request.aiOmni.enableThinking,
    }
  );
  const rawText = typeof result.rawText === "string" ? result.rawText : "";
  const normalized = normalizeOmniOutput(rawText);
  return {
    listenText: normalized.listenText,
    rawText,
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
  return {
    listenText: normalizeListenText(omniResult.listenText),
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
      writeMode: "direct-current-or-batch-temp-answer",
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
      enable_thinking: true,
    },
    contract: {
      stages: ["omni"],
      outputMode: "text",
      enableThinking: false,
      supportsThinking: true,
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
    listenText: normalizeListenText(result.listenText),
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
    cost: result.cost && typeof result.cost === "object" ? result.cost : {},
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
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
  return body;
}

module.exports = {
  DEFAULT_OMNI_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_OMNI_MODELS,
  __testOnly: {
    normalizeListenText,
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
