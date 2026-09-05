"use strict";

const {
  requestOmniInputAudio,
  sanitizeProviderErrorSummary,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const { sanitizeProviderDebugPayload } = require("../../../backend/ai/sanitizer");
const { normalizeUsage } = require("../../../backend/ai/model-response-utils");
const { estimateProjectCost } = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "shujiajiaLuzhouHelper";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_LISTEN_MODEL = "qwen3.5-omni-flash";
const SUPPORTED_LISTEN_MODELS = ["qwen3.5-omni-flash", "qwen3.5-omni-plus"];
const DEFAULT_LISTEN_PROMPT = [
  "你是泸州话音频识别助手。",
  "只根据音频直接输出可填入标注框的泸州方言文本，保留泸州话口语、语气词和重复，不转成普通话、不解释、不扩写。",
  "只修正明显的同音误识别、空格与中文标点。",
  "无法确认的内容用【听不清】标记；纯静音返回空字符串。",
  "只输出泸州方言文本，不输出解释、Markdown 或 JSON。",
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

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const audioDataUrl = text(source.audioDataUrl);
  if (!/^data:audio\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(audioDataUrl)) {
    throw createHttpError(400, "仅支持有效的 audioDataUrl 音频输入。", "invalid-audio-data-url");
  }
  const aiStages = source.aiStages && typeof source.aiStages === "object" ? source.aiStages : {};
  const listen = aiStages.listen && typeof aiStages.listen === "object" ? aiStages.listen : {};
  return {
    audioDataUrl,
    requestId: text(source.requestId).slice(0, 120),
    timeoutMs: Math.max(1000, Math.min(DEFAULT_TIMEOUT_MS, Math.round(Number(source.timeoutMs) || DEFAULT_TIMEOUT_MS))),
    listenModel: pickModel(listen.model || source.listenModel, SUPPORTED_LISTEN_MODELS, DEFAULT_LISTEN_MODEL),
    aiStages: {
      listen: { prompt: String(listen.prompt || DEFAULT_LISTEN_PROMPT), params: normalizeParams(listen.params) },
    },
  };
}

function buildStageDefaults() {
  return {
    listen: { model: DEFAULT_LISTEN_MODEL, prompt: DEFAULT_LISTEN_PROMPT, params: {} },
  };
}

async function recommend(request, _assets, overrides) {
  const deps = Object.assign({
    now: Date.now,
    normalizeUsage,
    requestOmniInputAudio,
  }, overrides || {});
  const startedAt = deps.now();
  const listenStartedAt = deps.now();
  const listenResponse = await deps.requestOmniInputAudio(
    { audioDataUrl: request.audioDataUrl, aiOptions: request.aiStages.listen.params },
    { systemPrompt: request.aiStages.listen.prompt, userPrompt: "请听写这段完整音频。" },
    { model: request.listenModel, timeoutMs: request.timeoutMs }
  );
  const dialectText = String(listenResponse.rawText == null ? "" : listenResponse.rawText).trim();
  const listenMs = Math.max(0, deps.now() - listenStartedAt);
  const models = {
    listenModel: text(listenResponse.model) || request.listenModel,
  };
  const usage = {
    listen: deps.normalizeUsage(listenResponse.usage),
  };
  return {
    dialectText,
    refinedText: dialectText,
    usage,
    cost: estimateProjectCost({
      listen: { modelId: models.listenModel, usage: usage.listen, outputMode: "text" },
    }),
    timing: { listenMs, totalMs: Math.max(0, deps.now() - startedAt) },
    models,
    raw: { listen: dialectText },
    debug: { lexicon: false },
  };
}

function createDefaultsPayload() {
  return {
    success: true,
    scriptId: SCRIPT_ID,
    defaults: { timeoutMs: DEFAULT_TIMEOUT_MS, stages: buildStageDefaults() },
    supportedModels: { listen: SUPPORTED_LISTEN_MODELS.slice() },
    supportedParams: {
      temperature: true, top_p: true, max_tokens: true, max_completion_tokens: true,
      presence_penalty: true, frequency_penalty: true, seed: true, stop: true, enable_thinking: false,
    },
    contract: { stages: ["listen"], lexicon: false, writeMode: "optional-auto-fill" },
  };
}

function createHealthPayload() {
  return Object.assign({}, createDefaultsPayload(), { route: "shujiajia/luzhou-helper/ai/recommend" });
}

function buildRecommendSuccessBody(context) {
  const result = context?.execution?.projectResult || context?.data || {};
  return Object.assign({ success: true, requestId: text(context?.requestId || context?.normalizedRequest?.requestId) }, result);
}

function readProviderCode(rawResponse, fallback) {
  const direct = text(fallback || rawResponse?.providerCode);
  if (direct) return direct;
  let responseBody = rawResponse?.responseBody;
  if (typeof responseBody === "string") {
    try { responseBody = JSON.parse(responseBody); } catch (_error) { responseBody = null; }
  }
  if (!responseBody || typeof responseBody !== "object") return "";
  return text(responseBody.error?.code || responseBody.code);
}

function normalizeProviderRawResponse(value) {
  if (!value || typeof value !== "object") return null;
  const source = Object.assign({}, value);
  if (typeof source.responseBody === "string") {
    try { source.responseBody = JSON.parse(source.responseBody); } catch (_error) {}
  }
  return sanitizeProviderDebugPayload(source, { textLimit: 20000 });
}

function buildRecommendErrorBody(context) {
  const error = context?.error || {};
  const safeMessage = sanitizeProviderErrorSummary(error.safeMessage || error.message)
    .replace(/https?:\/\/\S+/gi, "[url-redacted]");
  const body = {
    success: false,
    requestId: text(context?.requestId || error.requestId),
    code: text(error.code) || "ai-recommend-failed",
    message: safeMessage || "泸州话 AI 识别失败。",
  };
  const rawResponse = normalizeProviderRawResponse(error.debugRawAiResponse);
  const providerStatus = Number(error.providerStatus || rawResponse?.providerStatus) || 0;
  const providerCode = readProviderCode(rawResponse, error.providerCode);
  const summary = sanitizeProviderErrorSummary(error.summary || "");
  if (providerStatus) body.providerStatus = providerStatus;
  if (providerCode) body.providerCode = providerCode;
  if (summary) body.summary = summary;
  if (rawResponse) body.rawResponse = rawResponse;
  return body;
}

module.exports = {
  SCRIPT_ID,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_LISTEN_MODEL,
  SUPPORTED_LISTEN_MODELS,
  buildAssetsContext() { return {}; },
  buildRecommendErrorBody,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  createHttpError,
  normalizeRecommendRequest,
  recommend,
};
