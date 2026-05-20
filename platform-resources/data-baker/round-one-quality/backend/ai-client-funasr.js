"use strict";

const DEFAULT_FUN_ASR_MODEL = "fun-asr";
const DEFAULT_POLL_INTERVAL_MS = 1200;

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function parseTimeoutMs() {
  const value = Number(process.env.DATABAKER_AI_TIMEOUT_MS || 120000);
  if (!Number.isFinite(value)) {
    return 120000;
  }
  return Math.max(1000, Math.min(300000, Math.floor(value)));
}

function isMockEnabled() {
  return String(process.env.DATABAKER_AI_MOCK || "").trim() === "1";
}

function parseLanguageHints() {
  const raw = String(process.env.DATABAKER_AI_FUN_ASR_LANGUAGE_HINTS || "zh").trim();
  const values = raw
    .split(/[,\s]+/)
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean)
    .slice(0, 8);
  return values.length > 0 ? values : ["zh"];
}

function getFunAsrClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1");
  const endpointOrigin = new URL(baseUrl).origin;
  const model = String(process.env.DATABAKER_AI_FUN_ASR_MODEL || DEFAULT_FUN_ASR_MODEL).trim();
  return {
    apiKey,
    endpointOrigin,
    model: model || DEFAULT_FUN_ASR_MODEL,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    languageHints: parseLanguageHints(),
    pollIntervalMs: Math.max(
      300,
      Math.min(10000, Math.floor(Number(process.env.DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS)))
    ),
  };
}

function sanitizeSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(/(access_token["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(signature["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(ossaccesskeyid["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(api[_-]?key["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function createProviderHttpError(statusCode, bodyText) {
  const error = new Error("Fun-ASR 接口请求失败（HTTP " + String(statusCode) + "）。");
  error.code = "provider-http-error";
  error.statusCode = statusCode;
  error.summary = sanitizeSummary(bodyText);
  return error;
}

function createAudioUrlUnavailableError(summaryText) {
  const error = new Error("Fun-ASR 无法访问当前音频链接，请确认平台 audioUrl 对模型服务可访问。");
  error.code = "fun-asr-audio-url-unreachable";
  error.statusCode = 502;
  error.summary = sanitizeSummary(summaryText);
  return error;
}

function isAudioUrlLikelyUnavailable(summaryText) {
  const text = String(summaryText || "").toLowerCase();
  return (
    text.indexOf("url") >= 0 &&
    (text.indexOf("access") >= 0 ||
      text.indexOf("403") >= 0 ||
      text.indexOf("404") >= 0 ||
      text.indexOf("forbidden") >= 0 ||
      text.indexOf("denied") >= 0 ||
      text.indexOf("download") >= 0)
  );
}

async function fetchJson(url, options) {
  if (typeof fetch !== "function") {
    throw new Error("当前 Node 运行时不支持 fetch。");
  }
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    if (isAudioUrlLikelyUnavailable(text)) {
      throw createAudioUrlUnavailableError(text);
    }
    throw createProviderHttpError(response.status, text);
  }
  try {
    return JSON.parse(text || "{}");
  } catch (error) {
    throw new Error("Fun-ASR 返回 JSON 解析失败。");
  }
}

function createAbortController(timeoutMs) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(function () {
        controller.abort();
      }, timeoutMs)
    : null;
  return { controller, timer };
}

function clearAbortTimer(state) {
  if (state && state.timer) {
    clearTimeout(state.timer);
  }
}

async function submitRecognitionTask(input, options) {
  const config = getFunAsrClientConfig();
  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  const abortState = createAbortController(timeoutMs);
  try {
    return await fetchJson(config.endpointOrigin + "/api/v1/services/audio/asr/transcription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: String(options?.model || config.model || DEFAULT_FUN_ASR_MODEL),
        input: {
          file_urls: [String(input?.audioUrl || "")],
        },
        parameters: {
          language_hints: config.languageHints,
        },
      }),
      signal: abortState.controller ? abortState.controller.signal : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Fun-ASR 请求超时。");
      timeoutError.code = "timeout";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearAbortTimer(abortState);
  }
}

function extractTaskId(payload) {
  return String(
    payload?.output?.task_id || payload?.output?.taskId || payload?.task_id || payload?.taskId || ""
  ).trim();
}

function extractTaskStatus(payload) {
  return String(
    payload?.output?.task_status || payload?.output?.taskStatus || payload?.task_status || payload?.taskStatus || ""
  )
    .trim()
    .toUpperCase();
}

function extractTaskSummary(payload) {
  return sanitizeSummary(
    payload?.output?.message ||
      payload?.output?.task_message ||
      payload?.output?.taskMessage ||
      payload?.message ||
      payload?.msg ||
      ""
  );
}

function extractTranscriptionUrl(payload) {
  const results = Array.isArray(payload?.output?.results) ? payload.output.results : [];
  const first = results[0] && typeof results[0] === "object" ? results[0] : {};
  return String(
    first.transcription_url ||
      first.transcriptionUrl ||
      payload?.output?.transcription_url ||
      payload?.output?.transcriptionUrl ||
      ""
  ).trim();
}

async function queryRecognitionTask(taskId, timeoutMs) {
  const config = getFunAsrClientConfig();
  const abortState = createAbortController(timeoutMs);
  try {
    return await fetchJson(config.endpointOrigin + "/api/v1/tasks/" + encodeURIComponent(taskId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      signal: abortState.controller ? abortState.controller.signal : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Fun-ASR 查询任务超时。");
      timeoutError.code = "timeout";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearAbortTimer(abortState);
  }
}

async function fetchTranscriptPayload(transcriptionUrl, timeoutMs) {
  const abortState = createAbortController(timeoutMs);
  try {
    return await fetchJson(String(transcriptionUrl || ""), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortState.controller ? abortState.controller.signal : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Fun-ASR 结果文件读取超时。");
      timeoutError.code = "timeout";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearAbortTimer(abortState);
  }
}

function extractTranscriptText(payload) {
  const directText = String(payload?.text || payload?.output?.text || "").trim();
  if (directText) {
    return directText;
  }

  const candidates = [];
  const collections = [payload?.transcripts, payload?.sentences, payload?.segments, payload?.utterances];
  collections.forEach(function (items) {
    if (!Array.isArray(items)) {
      return;
    }
    items.forEach(function (item) {
      if (!item || typeof item !== "object") {
        return;
      }
      const text = String(item.text || item.transcript || item.content || "").trim();
      if (text) {
        candidates.push(text);
      }
    });
  });

  if (candidates.length > 0) {
    return candidates.join("");
  }

  return "";
}

async function requestFunAsrRecognition(input, options) {
  const config = getFunAsrClientConfig();
  const model = String(options?.model || config.model || DEFAULT_FUN_ASR_MODEL).trim() || DEFAULT_FUN_ASR_MODEL;
  if (config.mockEnabled) {
    return {
      model,
      heardText: String(input?.pageText || "").trim() || "mock 听音文本",
      confidence: 0.82,
      usage: {},
      mock: true,
      taskId: "mock-task",
    };
  }
  if (!config.hasApiKey) {
    const error = new Error("missing-api-key");
    error.code = "missing-api-key";
    error.statusCode = 503;
    throw error;
  }

  const startedAt = Date.now();
  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  const deadlineAt = startedAt + timeoutMs;
  const submitPayload = await submitRecognitionTask(input, {
    model,
    timeoutMs,
  });
  const taskId = extractTaskId(submitPayload);
  if (!taskId) {
    throw new Error("Fun-ASR 未返回 taskId。");
  }

  let taskPayload = submitPayload;
  while (Date.now() < deadlineAt) {
    const taskStatus = extractTaskStatus(taskPayload);
    if (taskStatus === "SUCCEEDED" || taskStatus === "SUCCESS") {
      break;
    }
    if (taskStatus === "FAILED" || taskStatus === "FAIL" || taskStatus === "CANCELED") {
      const taskSummary = extractTaskSummary(taskPayload);
      if (isAudioUrlLikelyUnavailable(taskSummary)) {
        throw createAudioUrlUnavailableError(taskSummary);
      }
      const taskError = new Error("Fun-ASR 识别任务失败。" + (taskSummary ? " " + taskSummary : ""));
      taskError.code = "fun-asr-task-failed";
      taskError.statusCode = 502;
      taskError.summary = taskSummary;
      throw taskError;
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, config.pollIntervalMs);
    });
    taskPayload = await queryRecognitionTask(taskId, Math.max(1000, deadlineAt - Date.now()));
  }

  if (!(extractTaskStatus(taskPayload) === "SUCCEEDED" || extractTaskStatus(taskPayload) === "SUCCESS")) {
    const timeoutError = new Error("Fun-ASR 识别结果等待超时。");
    timeoutError.code = "timeout";
    timeoutError.statusCode = 504;
    throw timeoutError;
  }

  const transcriptionUrl = extractTranscriptionUrl(taskPayload);
  let heardText = "";
  if (transcriptionUrl) {
    const transcriptPayload = await fetchTranscriptPayload(
      transcriptionUrl,
      Math.max(1000, deadlineAt - Date.now())
    );
    heardText = extractTranscriptText(transcriptPayload);
  }
  if (!heardText) {
    heardText = extractTranscriptText(taskPayload);
  }
  if (!heardText) {
    throw new Error("Fun-ASR 未返回可用转写文本。");
  }

  return {
    model,
    heardText,
    confidence: 0,
    usage: {},
    mock: false,
    taskId,
  };
}

module.exports = {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrClientConfig,
  requestFunAsrRecognition,
};
