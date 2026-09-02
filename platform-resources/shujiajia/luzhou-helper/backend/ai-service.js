"use strict";

const {
  requestOmniInputAudio,
  requestTextCompareJson,
  sanitizeProviderErrorSummary,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const { normalizeUsage } = require("../../../backend/ai/model-response-utils");
const { estimateProjectCost } = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "shujiajiaLuzhouHelper";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_LISTEN_MODEL = "qwen3.5-omni-flash";
const DEFAULT_REFINE_MODEL = "qwen3.5-plus";
const SUPPORTED_LISTEN_MODELS = ["qwen3.5-omni-flash", "qwen3.5-omni-plus"];
const SUPPORTED_REFINE_MODELS = ["qwen3.5-plus", "qwen3.5-flash"];
const DEFAULT_LISTEN_PROMPT = [
  "你是泸州话音频听写助手。",
  "只根据音频逐字听写，保留泸州话口语、语气词和重复，不翻译、不润色、不补充。",
  "无法确认的内容用【听不清】标记；纯静音返回空字符串。",
  "只输出听写文本，不输出解释、Markdown 或 JSON。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "你是泸州话转写整理助手。",
  "在不改变原意、不扩写的前提下整理听音草稿，保留泸州话表达和语气。",
  "只修正明显同音误识别、空格与中文标点；无法确认处保留【听不清】。",
  "只输出 JSON 对象，格式固定为 {\"text\":\"最终可填入标注框的文本\"}，不输出解释或 Markdown。",
].join("\n");

function text(value) {
  return String(value == null ? "" : value).trim();
}

function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function normalizeParams(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  [
    ["temperature", false], ["top_p", false], ["max_tokens", true],
    ["max_completion_tokens", true], ["presence_penalty", false],
    ["frequency_penalty", false], ["seed", true],
  ].forEach(([key, integer]) => {
    if (source[key] === "" || source[key] == null) return;
    const valueNumber = Number(source[key]);
    if (Number.isFinite(valueNumber)) result[key] = integer ? Math.round(valueNumber) : valueNumber;
  });
  const stop = Array.isArray(source.stop)
    ? source.stop
    : typeof source.stop === "string" ? source.stop.split(/\r?\n|,/) : [];
  const normalizedStop = Array.from(new Set(stop.map(text).filter(Boolean))).slice(0, 8);
  if (normalizedStop.length) result.stop = normalizedStop;
  return result;
}

function pickModel(value, supported, fallback) {
  const normalized = text(value);
  return supported.includes(normalized) ? normalized : fallback;
}

function extractRefinedText(rawText) {
  const raw = String(rawText == null ? "" : rawText).trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return String(parsed.text ?? parsed.refinedText ?? "").trim();
    }
  } catch (_error) {}
  return raw;
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const audioDataUrl = text(source.audioDataUrl);
  if (!/^data:audio\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(audioDataUrl)) {
    throw createHttpError(400, "仅支持有效的 audioDataUrl 音频输入。", "invalid-audio-data-url");
  }
  const aiStages = source.aiStages && typeof source.aiStages === "object" ? source.aiStages : {};
  const listen = aiStages.listen && typeof aiStages.listen === "object" ? aiStages.listen : {};
  const refine = aiStages.refine && typeof aiStages.refine === "object" ? aiStages.refine : {};
  return {
    audioDataUrl,
    requestId: text(source.requestId).slice(0, 120),
    timeoutMs: Math.max(1000, Math.min(DEFAULT_TIMEOUT_MS, Math.round(Number(source.timeoutMs) || DEFAULT_TIMEOUT_MS))),
    listenModel: pickModel(listen.model || source.listenModel, SUPPORTED_LISTEN_MODELS, DEFAULT_LISTEN_MODEL),
    refineModel: pickModel(refine.model || source.refineModel, SUPPORTED_REFINE_MODELS, DEFAULT_REFINE_MODEL),
    aiStages: {
      listen: { prompt: String(listen.prompt || DEFAULT_LISTEN_PROMPT), params: normalizeParams(listen.params) },
      refine: { prompt: String(refine.prompt || DEFAULT_REFINE_PROMPT), params: normalizeParams(refine.params) },
    },
  };
}

function buildStageDefaults() {
  return {
    listen: { model: DEFAULT_LISTEN_MODEL, prompt: DEFAULT_LISTEN_PROMPT, params: {} },
    refine: { model: DEFAULT_REFINE_MODEL, prompt: DEFAULT_REFINE_PROMPT, params: {} },
  };
}

async function recommend(request, _assets, overrides) {
  const deps = Object.assign({
    now: Date.now,
    normalizeUsage,
    requestOmniInputAudio,
    requestTextCompareJson,
  }, overrides || {});
  const startedAt = deps.now();
  const listenStartedAt = deps.now();
  const listenResponse = await deps.requestOmniInputAudio(
    { audioDataUrl: request.audioDataUrl, aiOptions: request.aiStages.listen.params },
    { systemPrompt: request.aiStages.listen.prompt, userPrompt: "请听写这段完整音频。" },
    { model: request.listenModel, timeoutMs: request.timeoutMs }
  );
  const listenText = String(listenResponse.rawText == null ? "" : listenResponse.rawText);
  const listenMs = Math.max(0, deps.now() - listenStartedAt);
  const refineStartedAt = deps.now();
  const refineResponse = await deps.requestTextCompareJson(
    { heardText: listenText, pageText: "", aiOptions: request.aiStages.refine.params },
    { systemPrompt: request.aiStages.refine.prompt, userPrompt: "请整理以下泸州话听音草稿：\n" + listenText },
    { model: request.refineModel, timeoutMs: request.timeoutMs, heardText: listenText }
  );
  const refineRawText = String(refineResponse.rawText == null ? "" : refineResponse.rawText);
  const refinedText = extractRefinedText(refineRawText);
  const refineMs = Math.max(0, deps.now() - refineStartedAt);
  const models = {
    listenModel: text(listenResponse.model) || request.listenModel,
    refineModel: text(refineResponse.model) || request.refineModel,
  };
  const usage = {
    listen: deps.normalizeUsage(listenResponse.usage),
    refine: deps.normalizeUsage(refineResponse.usage),
  };
  return {
    listenText,
    refinedText,
    usage,
    cost: estimateProjectCost({
      listen: { modelId: models.listenModel, usage: usage.listen, outputMode: "text" },
      refine: { modelId: models.refineModel, usage: usage.refine },
    }),
    timing: { listenMs, refineMs, totalMs: Math.max(0, deps.now() - startedAt) },
    models,
    raw: { listen: listenText, refine: refineRawText },
    debug: { lexicon: false },
  };
}

function createDefaultsPayload() {
  return {
    success: true,
    scriptId: SCRIPT_ID,
    defaults: { timeoutMs: DEFAULT_TIMEOUT_MS, stages: buildStageDefaults() },
    supportedModels: { listen: SUPPORTED_LISTEN_MODELS.slice(), refine: SUPPORTED_REFINE_MODELS.slice() },
    supportedParams: {
      temperature: true, top_p: true, max_tokens: true, max_completion_tokens: true,
      presence_penalty: true, frequency_penalty: true, seed: true, stop: true, enable_thinking: false,
    },
    contract: { stages: ["listen", "refine"], lexicon: false, writeMode: "manual-fill" },
  };
}

function createHealthPayload() {
  return Object.assign({}, createDefaultsPayload(), { route: "shujiajia/luzhou-helper/ai/recommend" });
}

function buildRecommendSuccessBody(context) {
  const result = context?.execution?.projectResult || context?.data || {};
  return Object.assign({ success: true, requestId: text(context?.requestId || context?.normalizedRequest?.requestId) }, result);
}

function buildRecommendErrorBody(context) {
  const error = context?.error || {};
  const safeMessage = sanitizeProviderErrorSummary(error.safeMessage || error.message)
    .replace(/https?:\/\/\S+/gi, "[url-redacted]");
  return {
    success: false,
    requestId: text(context?.requestId || error.requestId),
    code: text(error.code) || "ai-recommend-failed",
    message: safeMessage || "泸州话 AI 识别失败。",
  };
}

module.exports = {
  SCRIPT_ID,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REFINE_MODEL,
  SUPPORTED_LISTEN_MODELS,
  SUPPORTED_REFINE_MODELS,
  buildAssetsContext() { return {}; },
  buildRecommendErrorBody,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  createHttpError,
  normalizeRecommendRequest,
  recommend,
};
