"use strict";

const { sendJson } = require("../../../backend/response");
const {
  DEFAULT_REQUEST_PARAMS,
  DEFAULT_COMPARE_MODEL,
  DEFAULT_LISTEN_MODEL,
  SUPPORTED_REQUEST_PARAMS,
  getClientConfig,
  requestCurrentSuggestion,
  sanitizeModelName,
} = require("./ai-client-qwen");
const { appendAiCallLog, getLogDir } = require("./ai-call-log");
const {
  buildPrompt,
  DEFAULT_COMPARE_TEMPLATE,
  DEFAULT_LISTEN_TEMPLATE,
  RULE_VERSION,
} = require("./ai-prompts");
const {
  DEFAULT_APPLY_ADVICE,
  normalizeSuggestionResponse,
  normalizeUsage,
  parseModelJsonText,
} = require("./ai-response-schema");

const AI_ROOT_PATH = "/api/alibaba-labelx/asr-transcription/ai";
const AI_BASE_PATH = AI_ROOT_PATH + "/suggest-current";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_ROOT_PATH + "/defaults";
const MAX_BODY_BYTES = 3 * 1024 * 1024;

function createRequestId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8);
  return String(yyyy) + mm + dd + "-" + hh + mi + ss + "-" + suffix;
}

function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code || "";
  return error;
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        const tooLargeError = createHttpError(413, "请求体超过 3MB。", "payload-too-large");
        reject(tooLargeError);
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function sanitizeErrorMessage(value) {
  return String(value || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(/(token|authorization|cookie|api[_-]?key|signature|ossaccesskeyid)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function parseAudioHostname(audioUrl) {
  try {
    return new URL(String(audioUrl || "")).hostname || "";
  } catch (error) {
    return "";
  }
}

function normalizeAudioFormat(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) {
    return "wav";
  }
  return text.slice(0, 12);
}

function normalizeAudioCandidates(value) {
  const source = Array.isArray(value) ? value : [];
  const dedup = new Set();
  const list = [];
  source.forEach(function (item, index) {
    const id = normalizeText(item?.id || "") || String.fromCharCode(97 + index);
    const url = normalizeText(item?.url || "");
    const format = normalizeAudioFormat(item?.format || "wav");
    if (!url || dedup.has(url)) {
      return;
    }
    dedup.add(url);
    list.push({ id, url, format, valid: isHttpUrl(url) });
  });
  return list.slice(0, 2);
}

function normalizeTextCandidates(value) {
  const source = Array.isArray(value) ? value : [];
  const dedup = new Set();
  const list = [];
  source.forEach(function (item, index) {
    const id = normalizeText(item?.id || "") || String.fromCharCode(97 + index);
    const text = String(item?.text || "").replace(/\s+/g, " ").trim();
    if (!text || dedup.has(text)) {
      return;
    }
    dedup.add(text);
    list.push({ id, text: text.slice(0, 2000) });
  });
  return list.slice(0, 2);
}

function normalizeSuggestRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const aiOptions = normalizeAiOptions(source.aiOptions);
  const rawAudioCandidates = normalizeAudioCandidates(source.audioCandidates);
  const validAudioCandidates = rawAudioCandidates.filter(function (item) {
    return item.valid === true;
  });
  const textCandidates = normalizeTextCandidates(source.textCandidates);
  const currentText = String(source.currentText || "").replace(/\s+/g, " ").trim().slice(0, 2000);

  const itemIndex = Number(source.itemIndex);
  if (source.itemIndex !== undefined && source.itemIndex !== null && source.itemIndex !== "" && !Number.isFinite(itemIndex)) {
    throw createHttpError(400, "itemIndex 必须是数字。", "invalid-item-index");
  }

  if (validAudioCandidates.length === 0 && textCandidates.length === 0 && !currentText) {
    throw createHttpError(
      400,
      "audioCandidates 与 textCandidates 不能同时为空。",
      "missing-input-candidates"
    );
  }

  return {
    taskItemId: normalizeText(source.taskItemId),
    itemIndex: Number.isFinite(itemIndex) ? itemIndex : 0,
    projectName: normalizeText(source.projectName),
    audioCandidates: validAudioCandidates,
    invalidAudioCount: rawAudioCandidates.length - validAudioCandidates.length,
    textCandidates,
    currentText,
    clientVersion: normalizeText(source.clientVersion),
    listenModel: sanitizeModelName(aiOptions.listenModel || source.listenModel, ""),
    compareModel: sanitizeModelName(aiOptions.compareModel || source.compareModel, ""),
    enableThinking:
      typeof aiOptions.enable_thinking === "boolean"
        ? aiOptions.enable_thinking === true
        : source.enableThinking === true,
    aiOptions,
  };
}

function normalizeNumberInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  if (number < min || number > max) {
    return null;
  }
  return number;
}

function normalizeIntegerInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const integerValue = Math.floor(number);
  if (integerValue < min || integerValue > max) {
    return null;
  }
  return integerValue;
}

function normalizePromptText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, 8000);
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
    if (!text || result.length >= 8 || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return result;
}

function normalizeAiOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const result = {};
  const listenPrompt = normalizePromptText(source.listenPrompt);
  const comparePrompt = normalizePromptText(source.comparePrompt);
  const listenModel = sanitizeModelName(source.listenModel, "");
  const compareModel = sanitizeModelName(source.compareModel, "");
  if (listenPrompt) {
    result.listenPrompt = listenPrompt;
  }
  if (comparePrompt) {
    result.comparePrompt = comparePrompt;
  }
  if (listenModel) {
    result.listenModel = listenModel;
  }
  if (compareModel) {
    result.compareModel = compareModel;
  }
  if (SUPPORTED_REQUEST_PARAMS.temperature === true) {
    const normalized = normalizeNumberInRange(source.temperature, 0, 2);
    if (normalized !== null) {
      result.temperature = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.top_p === true) {
    const normalized = normalizeNumberInRange(source.top_p, 0, 1);
    if (normalized !== null) {
      result.top_p = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.max_tokens === true) {
    const normalized = normalizeIntegerInRange(source.max_tokens, 1, 8192);
    if (normalized !== null) {
      result.max_tokens = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.max_completion_tokens === true) {
    const normalized = normalizeIntegerInRange(source.max_completion_tokens, 1, 8192);
    if (normalized !== null) {
      result.max_completion_tokens = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.presence_penalty === true) {
    const normalized = normalizeNumberInRange(source.presence_penalty, -2, 2);
    if (normalized !== null) {
      result.presence_penalty = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.frequency_penalty === true) {
    const normalized = normalizeNumberInRange(source.frequency_penalty, -2, 2);
    if (normalized !== null) {
      result.frequency_penalty = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.seed === true) {
    const normalized = normalizeIntegerInRange(source.seed, 0, 2147483647);
    if (normalized !== null) {
      result.seed = normalized;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.stop === true) {
    const stop = normalizeStopSequences(source.stop);
    if (stop.length > 0) {
      result.stop = stop;
    }
  }
  if (SUPPORTED_REQUEST_PARAMS.enable_thinking === true && typeof source.enable_thinking === "boolean") {
    result.enable_thinking = source.enable_thinking === true;
  }
  return result;
}

function resolveModelOverride(requestModel, defaultModel, config) {
  if (!config.allowClientModelOverride) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  const normalized = sanitizeModelName(requestModel, "");
  if (!normalized) {
    return sanitizeModelName(defaultModel, defaultModel);
  }
  return normalized;
}

function appendCallLogSafe(record) {
  try {
    appendAiCallLog(record);
  } catch (error) {
    console.warn("[ASR Transcription][ai] 调用日志写入失败", {
      requestId: record?.requestId,
      message: error?.message || String(error),
    });
  }
}

function buildHealthResponse() {
  const config = getClientConfig();
  return {
    success: true,
    service: "asr-transcription-ai-suggest-current",
    provider: "dashscope-qwen",
    ruleVersion: RULE_VERSION,
    status: config.hasApiKey || config.mockEnabled ? "ready" : "missing-api-key",
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
    compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
    allowClientModelOverride: config.allowClientModelOverride === true,
    enableThinkingDefault: config.enableThinkingDefault === true,
    timeoutMs: config.timeoutMs,
    callLogDir: getLogDir(),
  };
}

async function requestWithPossibleFallback(suggestRequest, prompt, models, config) {
  const hasAudio = Array.isArray(suggestRequest.audioCandidates) && suggestRequest.audioCandidates.length > 0;
  const hasTexts = Array.isArray(suggestRequest.textCandidates) && suggestRequest.textCandidates.length > 0;

  if (!hasAudio) {
    const compareResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.compareModel,
      includeAudio: false,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });
    return Object.assign({}, compareResult, {
      mode: "text-only",
      usedCompareModel: true,
    });
  }

  try {
    const listenResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.listenModel,
      includeAudio: true,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });
    return Object.assign({}, listenResult, {
      mode: "audio+text",
      usedCompareModel: false,
    });
  } catch (error) {
    if (!hasTexts) {
      throw error;
    }

    const fallbackResult = await requestCurrentSuggestion(suggestRequest, prompt, {
      model: models.compareModel,
      includeAudio: false,
      timeoutMs: config.timeoutMs,
      enableThinking: suggestRequest.enableThinking,
      aiOptions: suggestRequest.aiOptions,
    });

    return Object.assign({}, fallbackResult, {
      mode: "text-fallback",
      usedCompareModel: true,
      listenErrorCode: String(error?.code || ""),
      listenErrorMessage: sanitizeErrorMessage(error?.message || ""),
    });
  }
}

async function handleSuggestCurrent(request, response) {
  const startedAtMs = Date.now();
  let requestId = createRequestId();
  let suggestRequest = null;
  let config = null;
  let selectedModels = null;

  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }

    suggestRequest = normalizeSuggestRequest(body);
    requestId = normalizeText(body.requestId) || requestId;
    config = getClientConfig();

    if (!config.hasApiKey && !config.mockEnabled) {
      throw createHttpError(
        503,
        "后端未读取到 DASHSCOPE_API_KEY，请检查 config/env/ai.env 或环境变量。",
        "missing-api-key"
      );
    }

    selectedModels = {
      listenModel: resolveModelOverride(
        suggestRequest.listenModel,
        config.listenModel || DEFAULT_LISTEN_MODEL,
        config
      ),
      compareModel: resolveModelOverride(
        suggestRequest.compareModel,
        config.compareModel || DEFAULT_COMPARE_MODEL,
        config
      ),
    };

    const prompt = buildPrompt(suggestRequest);
    const modelResult = await requestWithPossibleFallback(suggestRequest, prompt, selectedModels, config);
    const modelJson = parseModelJsonText(modelResult.rawText, requestId);
    const normalized = normalizeSuggestionResponse(modelJson);

    if (suggestRequest.invalidAudioCount > 0 && normalized.riskFlags.indexOf("invalid_audio_candidate_detected") < 0) {
      normalized.riskFlags.push("invalid_audio_candidate_detected");
    }
    if (modelResult.mode === "text-fallback" && normalized.riskFlags.indexOf("audio_unavailable_fallback_text_compare") < 0) {
      normalized.riskFlags.push("audio_unavailable_fallback_text_compare");
    }

    const durationMs = Date.now() - startedAtMs;
    const responseData = {
      requestId,
      decision: normalized.decision,
      recommendedText: normalized.recommendedText,
      confidence: normalized.confidence,
      reasonSummary: normalized.reasonSummary,
      riskFlags: normalized.riskFlags,
      applyAdvice: DEFAULT_APPLY_ADVICE,
      models: {
        listenModel: selectedModels.listenModel,
        compareModel: selectedModels.compareModel,
      },
      usage: normalizeUsage(modelResult.usage),
      mock: modelResult.mock === true,
      timing: {
        durationMs,
      },
      thinking: {
        requested: suggestRequest.enableThinking === true,
        enableThinking: modelResult.enableThinking === true,
        fallbackUsed: modelResult.thinkingFallbackUsed === true,
        fallbackMode: modelResult.thinkingFallbackMode || "",
      },
    };

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: true,
      durationMs,
      model: selectedModels.listenModel,
      compareModel: selectedModels.compareModel,
      enableThinking: suggestRequest.enableThinking === true,
      thinkingFallbackUsed: modelResult.thinkingFallbackUsed === true,
      thinkingFallbackMode: modelResult.thinkingFallbackMode || "",
      audioHostnames: suggestRequest.audioCandidates.map(function (item) {
        return parseAudioHostname(item.url);
      }),
      textCandidateCount: suggestRequest.textCandidates.length,
      hasAudio: suggestRequest.audioCandidates.length > 0,
      decision: responseData.decision,
      confidence: responseData.confidence,
      mock: responseData.mock === true,
    });

    sendJson(response, 200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const responseBody = {
      success: false,
      code: normalizeText(error?.code || "internal-error") || "internal-error",
      message: sanitizeErrorMessage(error?.message || "AI 推荐请求失败。") || "AI 推荐请求失败。",
      requestId,
    };
    if (error?.code === "provider-http-error" && error?.summary) {
      responseBody.summary = sanitizeErrorMessage(error.summary).slice(0, 200);
    }

    appendCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      success: false,
      durationMs: Date.now() - startedAtMs,
      model: selectedModels?.listenModel || config?.listenModel || DEFAULT_LISTEN_MODEL,
      compareModel: selectedModels?.compareModel || config?.compareModel || DEFAULT_COMPARE_MODEL,
      enableThinking: suggestRequest?.enableThinking === true,
      audioHostnames: Array.isArray(suggestRequest?.audioCandidates)
        ? suggestRequest.audioCandidates.map(function (item) {
            return parseAudioHostname(item.url);
          })
        : [],
      textCandidateCount: Number(suggestRequest?.textCandidates?.length || 0),
      hasAudio: Array.isArray(suggestRequest?.audioCandidates) && suggestRequest.audioCandidates.length > 0,
      mock: Boolean(config?.mockEnabled),
      errorCode: responseBody.code,
      errorMessage: responseBody.message,
    });

    sendJson(response, statusCode, responseBody);
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });
  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    const config = getClientConfig();
    sendJson(response, 200, {
      success: true,
      service: "asr-transcription-ai-suggest-current",
      scriptId: "transcription",
      component: "asr-voice-ai",
      defaults: {
        listenModel: config.listenModel || DEFAULT_LISTEN_MODEL,
        compareModel: config.compareModel || DEFAULT_COMPARE_MODEL,
        reviewModel: "",
        timeoutMs: config.timeoutMs,
        enableThinking: config.enableThinkingDefault === true,
        temperature: DEFAULT_REQUEST_PARAMS.temperature,
        top_p: DEFAULT_REQUEST_PARAMS.top_p,
        max_tokens: DEFAULT_REQUEST_PARAMS.max_tokens,
        max_completion_tokens: DEFAULT_REQUEST_PARAMS.max_completion_tokens,
        presence_penalty: DEFAULT_REQUEST_PARAMS.presence_penalty,
        frequency_penalty: DEFAULT_REQUEST_PARAMS.frequency_penalty,
        seed: DEFAULT_REQUEST_PARAMS.seed,
        stop: DEFAULT_REQUEST_PARAMS.stop,
        listenPrompt: DEFAULT_LISTEN_TEMPLATE,
        comparePrompt: DEFAULT_COMPARE_TEMPLATE,
        reviewPrompt: "",
      },
      supportedParams: SUPPORTED_REQUEST_PARAMS,
      notes: {
        promptOverride: "Prompt 可在前端覆盖；空 override 使用后端默认。",
        responseFormat: "结构化输出由后端固定控制，前端不配置。",
      },
    });
  });

  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleSuggestCurrent(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleSuggestCurrent,
  normalizeSuggestRequest,
  registerAiRoutes,
};
