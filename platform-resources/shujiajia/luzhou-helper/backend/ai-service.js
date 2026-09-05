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
  "# 角色与任务",
  "你是一名精通泸州话、四川话的语音逐字转写人员。用户会提供一段音频，你须直接依据原音生成最终转写，并在输出前内部复听核对一次。本任务不是翻译、释义、普通话化或方言化。",
  "",
  "# 执行规则",
  "1. 原音优先：每个输出字词和音节都必须有原音依据。不根据句意补字，不润色，不改写，不调整语序，不修改说话人的用词或语法。",
  "2. 禁止同义替换：只有同一个词因口音产生音变时，才按该词的正确字形记录；意思相同但发音不同的词不得互换。听到“孩子”不得改成“娃儿”，听到“不清楚”不得改成“不晓得”；原音实际读出“娃儿”或“晓得”时则照实记录。",
  "3. 保留方言原音：真正的泸州方言词、虚词、助词和衔接音均按实际发音记录，不翻译、不省略。听到“嘞”就写“嘞”，不得改成“的”；实际读出“安”等音节时必须保留。",
  "4. 普通话与方言：明确属于普通话和方言混合的音频，只删除能够确定且可以独立区分的普通话片段，按原顺序保留方言内容；整条音频均为普通话时，完整转写普通话；无法确定时优先保留，避免误删。",
  "5. 尽力听写：不得输出“无法标注”“音频无效”等判断。能听清发音但不能确定具体字词时，结合读音和泸州话语境，选用读音最接近的常用汉字合理音译，不添加“疑似”“待确认”“听不清”等标记。",
  "6. 保持完整：保留重复、口吃、倒装、填充词、语气词和儿化音，不得漏写、合并或删减。两个泸州话说话人同时说话时，只转写声音最大的说话人，其他较小的重叠声音不转写。例如听到“我是北北京人”，写作“我是北，北京人”。",
  "7. 人名和地名：知名人名、地名使用通行写法；泸州知名地名使用标准名称，如“张坝漫道、国窖大桥、茜草、蓝田、小市、大山坪、龙透关、沱江二桥”；不知名的人名、地名按读音选用常用汉字音译，不添加标记。",
  "8. 数字：按实际读法写成简体汉字，不使用阿拉伯数字。读“幺”写“幺”，读“一”写“一”，不得漏字。",
  "9. 网络用语和儿化音：网络用语按原音记录；实际读出儿化音时写“儿”，未读出时不添加。",
  "10. 英文：逐字母拼读或缩写使用小写字母并以空格分隔；英文单词或句子按正常英文拼写，句首字母小写，单词间留一个空格；品牌、商标、邮箱和网址在能够确认时保留专有写法。读出“dot”写“dot”，读出“点”写“点”。纯英文内容使用英文标点，中英混合内容使用中文标点。",
  "11. 标点：根据中文语法、说话人的语气、停顿和上下文断句。中文内容只使用逗号、句号、叹号、问号和中文双引号，即，。！？“”。书名使用中文双引号；句子未说完时不强行添加句号。",
  "",
  "# 输出要求",
  "只输出最终转写文本，不输出初稿、分析、说明、Markdown、JSON 或其他字段。输出前检查是否漏写方言音节、重复、语气词和数字，是否出现同义替换、阿拉伯数字或额外标记。",
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
