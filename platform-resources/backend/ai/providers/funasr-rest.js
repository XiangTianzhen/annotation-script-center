"use strict";

const { TextDecoder } = require("util");

const {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrRestConfig,
} = require("../config");
const {
  createAudioUrlUnavailableError,
  createProviderHttpError,
  createTimeoutError,
  isAudioUrlLikelyUnavailable,
} = require("../errors");
const { sanitizeProviderErrorSummary } = require("../sanitizer");

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: false });
const MOCK_TEXT = "mock 听音文本";
const PENDING_STATUS_SET = new Set(["", "PENDING", "RUNNING", "UNKNOWN", "SUBMITTED"]);
const SUCCESS_STATUS_SET = new Set(["SUCCEEDED", "SUCCESS"]);
const FAILURE_STATUS_SET = new Set(["FAILED", "FAIL", "CANCELED", "CANCELLED"]);

function createError(message, code, statusCode, summary) {
  const error = new Error(message);
  error.code = code || "";
  error.statusCode = Number(statusCode) || 500;
  if (summary) {
    error.summary = sanitizeProviderErrorSummary(summary);
  }
  return error;
}

function decodeUtf8Buffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length <= 0) {
    return "";
  }
  return UTF8_DECODER.decode(buffer);
}

function isHeardTextLikelyMojibake(text) {
  const value = String(text || "").trim();
  if (!value) {
    return false;
  }
  const replacementCount = (value.match(/\uFFFD/g) || []).length;
  if (replacementCount >= 3) {
    return true;
  }
  if (replacementCount >= 1 && value.length <= 32) {
    return true;
  }
  return replacementCount > 0 && replacementCount / Math.max(value.length, 1) >= 0.08;
}

function normalizeTaskStatus(value) {
  return String(value || "").trim().toUpperCase();
}

function extractApiBaseHost(apiBase) {
  try {
    return new URL(String(apiBase || "")).host || "";
  } catch (error) {
    return "";
  }
}

function extractTaskId(payload) {
  const output = payload && typeof payload.output === "object" ? payload.output : {};
  return String(output.task_id || output.taskId || payload?.task_id || payload?.taskId || "").trim();
}

function extractTaskStatus(payload) {
  const output = payload && typeof payload.output === "object" ? payload.output : {};
  return normalizeTaskStatus(output.task_status || output.taskStatus || payload?.task_status || payload?.taskStatus || "");
}

function extractProviderMessage(payload, fallbackText) {
  const output = payload && typeof payload.output === "object" ? payload.output : {};
  return String(
    output.message ||
      output.task_message ||
      output.taskMessage ||
      payload?.message ||
      payload?.code ||
      fallbackText ||
      ""
  ).trim();
}

function extractProviderCode(payload) {
  const output = payload && typeof payload.output === "object" ? payload.output : {};
  return String(output.code || payload?.code || "").trim();
}

function createInvalidFunAsrModelError(summary) {
  return createError("Fun-ASR 模型名应为 fun-asr。", "invalid-fun-asr-model", 400, summary);
}

function createTaskMissingError(summary) {
  return createError("Fun-ASR REST 提交任务成功，但未返回 task_id。", "fun-asr-task-id-missing", 502, summary);
}

function createEmptyTextError(summary) {
  return createError("Fun-ASR 未返回可用转写文本。", "fun-asr-empty-text", 502, summary);
}

function createMojibakeError(summary) {
  return createError(
    "Fun-ASR 返回文本疑似编码异常，请检查 REST 结果文件编码。",
    "fun-asr-mojibake-text",
    502,
    summary
  );
}

function createForbiddenError(summary, rawStatus) {
  const error = createError(
    "Fun-ASR 调用被拒绝。可能是 DashScope 权限/地域未开通、API Key 无权限，或平台音频 URL 无法被 Fun-ASR 服务访问。",
    "fun-asr-forbidden",
    403,
    summary
  );
  error.providerStatus = 403;
  error.rawStatus = String(rawStatus || "").trim();
  return error;
}

function isInvalidModelSummary(code, summary) {
  const lowered = String(code || summary || "").toLowerCase();
  return lowered.indexOf("model") >= 0 && (
    lowered.indexOf("invalid") >= 0 ||
    lowered.indexOf("not found") >= 0 ||
    lowered.indexOf("unsupported") >= 0 ||
    lowered.indexOf("illegal") >= 0
  );
}

function isDownloadFailedSummary(code, summary) {
  const lowered = String(code || "").toLowerCase() + " " + String(summary || "").toLowerCase();
  return lowered.indexOf("invalidfile.downloadfailed") >= 0 || isAudioUrlLikelyUnavailable(lowered);
}

async function readResponsePayload(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text || "{}");
  } catch (error) {
    payload = null;
  }
  return {
    status: Number(response.status) || 0,
    text,
    payload,
  };
}

async function fetchWithTimeout(url, options, timeoutMs, timeoutMessage) {
  if (typeof fetch !== "function") {
    throw new Error("当前 Node 运行时不支持 fetch。");
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(function () {
        controller.abort();
      }, Math.max(1000, Number(timeoutMs) || 60000))
    : null;
  try {
    return await fetch(url, Object.assign({}, options || {}, {
      signal: controller ? controller.signal : undefined,
    }));
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createTimeoutError(timeoutMessage);
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function classifyRestFailure(statusCode, payload, fallbackText, rawStatus) {
  const summary = sanitizeProviderErrorSummary(extractProviderMessage(payload, fallbackText));
  const providerCode = extractProviderCode(payload);
  if (isInvalidModelSummary(providerCode, summary)) {
    throw createInvalidFunAsrModelError(summary);
  }
  if (statusCode === 403) {
    if (isDownloadFailedSummary(providerCode, summary)) {
      throw createAudioUrlUnavailableError(
        "Fun-ASR 调用被拒绝。当前更像是平台音频 URL 对模型服务不可访问。",
        403,
        rawStatus
      );
    }
    throw createForbiddenError(summary, rawStatus);
  }
  if (isDownloadFailedSummary(providerCode, summary)) {
    throw createAudioUrlUnavailableError(
      "Fun-ASR 无法访问当前音频链接，请确认平台 audioUrl 对模型服务可访问。",
      statusCode || 403,
      rawStatus
    );
  }
  throw createProviderHttpError(
    statusCode || 502,
    summary,
    "Fun-ASR REST 调用失败（HTTP " + String(statusCode || 502) + "）。"
  );
}

async function submitTask(audioUrl, model, config, options) {
  const requestId = String(options?.requestId || options?.traceId || "").trim();
  const startedAt = Date.now();
  console.info("[FunASR][REST] submit start", {
    requestId,
    model,
    apiBaseHost: extractApiBaseHost(config.apiBase),
    timeoutMs: config.timeoutMs,
  });
  const response = await fetchWithTimeout(
    config.apiBase + "/services/audio/asr/transcription",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.apiKey,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model,
        input: {
          file_urls: [audioUrl],
        },
        parameters: {
          language_hints: Array.isArray(config.languageHints) && config.languageHints.length > 0
            ? config.languageHints.slice(0, 8)
            : ["zh"],
        },
      }),
    },
    config.timeoutMs,
    "Fun-ASR 提交任务超时。"
  );
  const body = await readResponsePayload(response);
  const statusCode = body.status;
  const taskId = extractTaskId(body.payload);
  const rawStatus = extractTaskStatus(body.payload) || "SUBMITTED";
  console.info("[FunASR][REST] submit finish", {
    requestId,
    durationMs: Math.max(0, Date.now() - startedAt),
    success: response.ok && Boolean(taskId),
    rawStatus,
  });
  if (!response.ok) {
    classifyRestFailure(statusCode, body.payload, body.text, rawStatus);
  }
  if (!taskId) {
    throw createTaskMissingError(body.text);
  }
  return {
    taskId,
    rawStatus,
    payload: body.payload || {},
  };
}

async function pollTask(taskId, config, options) {
  const requestId = String(options?.requestId || options?.traceId || "").trim();
  const startedAt = Date.now();
  const deadlineAt = Date.now() + Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  let lastPayload = null;
  let lastStatus = "SUBMITTED";
  console.info("[FunASR][REST] poll start", {
    requestId,
    taskId,
    pollIntervalMs: config.pollIntervalMs,
  });
  while (Date.now() <= deadlineAt) {
    const remainingMs = Math.max(1000, deadlineAt - Date.now());
    const response = await fetchWithTimeout(
      config.apiBase + "/tasks/" + encodeURIComponent(taskId),
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + config.apiKey,
        },
      },
      remainingMs,
      "Fun-ASR 查询任务超时。"
    );
    const body = await readResponsePayload(response);
    const rawStatus = extractTaskStatus(body.payload) || lastStatus;
    lastPayload = body.payload || {};
    lastStatus = rawStatus;
    if (!response.ok) {
      classifyRestFailure(body.status, body.payload, body.text, rawStatus);
    }
    if (SUCCESS_STATUS_SET.has(rawStatus)) {
      console.info("[FunASR][REST] poll finish", {
        requestId,
        taskId,
        durationMs: Math.max(0, Date.now() - startedAt),
        success: true,
        rawStatus,
      });
      return {
        payload: lastPayload,
        rawStatus,
      };
    }
    if (FAILURE_STATUS_SET.has(rawStatus)) {
      console.info("[FunASR][REST] poll finish", {
        requestId,
        taskId,
        durationMs: Math.max(0, Date.now() - startedAt),
        success: false,
        rawStatus,
      });
      classifyRestFailure(502, body.payload, body.text, rawStatus);
    }
    if (!PENDING_STATUS_SET.has(rawStatus)) {
      console.info("[FunASR][REST] poll finish", {
        requestId,
        taskId,
        durationMs: Math.max(0, Date.now() - startedAt),
        success: false,
        rawStatus,
      });
      classifyRestFailure(502, body.payload, body.text, rawStatus);
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, config.pollIntervalMs);
    });
  }
  console.info("[FunASR][REST] poll finish", {
    requestId,
    taskId,
    durationMs: Math.max(0, Date.now() - startedAt),
    success: false,
    rawStatus: lastStatus || "TIMEOUT",
  });
  const timeoutError = createTimeoutError("Fun-ASR 等待识别结果超时。");
  timeoutError.rawStatus = lastStatus;
  throw timeoutError;
}

function pickResultRecord(results, audioUrl) {
  const list = Array.isArray(results) ? results : [];
  const exact = list.find(function (item) {
    return String(item?.file_url || item?.fileUrl || "").trim() === String(audioUrl || "").trim();
  });
  return exact || list[0] || null;
}

function extractTranscriptionUrl(payload, audioUrl) {
  const output = payload && typeof payload.output === "object" ? payload.output : {};
  const resultRecord = pickResultRecord(output.results, audioUrl);
  if (resultRecord) {
    return String(resultRecord.transcription_url || resultRecord.transcriptionUrl || "").trim();
  }
  return String(output.transcription_url || output.transcriptionUrl || "").trim();
}

function extractHeardText(payload) {
  const directText = String(
    payload?.text ||
      payload?.output?.text ||
      ""
  ).trim();
  if (directText) {
    return directText;
  }
  const candidates = [];
  ["transcripts", "sentences", "segments", "utterances"].forEach(function (key) {
    const items = Array.isArray(payload?.[key]) ? payload[key] : [];
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
  return candidates.join("").trim();
}

function tryDecodeBytes(buffer, encoding) {
  try {
    if (encoding === "utf-8-sig") {
      const text = Buffer.from(buffer).toString("utf8");
      return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    }
    if (encoding === "utf-8") {
      return Buffer.from(buffer).toString("utf8");
    }
    if (encoding === "gb18030") {
      try {
        return new TextDecoder("gb18030", { fatal: false }).decode(buffer);
      } catch (error) {
        return null;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

function parseTranscriptionPayload(buffer) {
  const utf8SigText = tryDecodeBytes(buffer, "utf-8-sig");
  if (utf8SigText !== null) {
    try {
      return JSON.parse(utf8SigText || "{}");
    } catch (error) {
      // continue
    }
  }
  const utf8Text = tryDecodeBytes(buffer, "utf-8");
  if (utf8Text !== null) {
    try {
      return JSON.parse(utf8Text || "{}");
    } catch (error) {
      if (isHeardTextLikelyMojibake(utf8Text) || utf8Text.indexOf("\uFFFD") >= 0) {
        const gbText = tryDecodeBytes(buffer, "gb18030");
        if (gbText !== null) {
          return JSON.parse(gbText || "{}");
        }
      }
    }
  }
  const gbText = tryDecodeBytes(buffer, "gb18030");
  if (gbText !== null) {
    try {
      return JSON.parse(gbText || "{}");
    } catch (error) {
      // continue
    }
  }
  throw createError("Fun-ASR 结果文件 JSON 解析失败。", "fun-asr-transcription-json-invalid", 502);
}

async function downloadTranscriptionPayload(transcriptionUrl, timeoutMs) {
  const response = await fetchWithTimeout(
    transcriptionUrl,
    { method: "GET" },
    timeoutMs,
    "Fun-ASR 下载转写结果超时。"
  );
  if (!response.ok) {
    const text = await response.text();
    classifyRestFailure(response.status, null, text, "");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return parseTranscriptionPayload(buffer);
}

async function requestFunAsrRecognitionRest(input, options) {
  const config = getFunAsrRestConfig();
  const model = String(options?.model || config.model || DEFAULT_FUN_ASR_MODEL).trim() || DEFAULT_FUN_ASR_MODEL;
  const requestId = String(options?.requestId || options?.traceId || "").trim();
  if (config.mockEnabled) {
    return {
      model,
      heardText: String(input?.pageText || "").trim() || MOCK_TEXT,
      confidence: 0.82,
      usage: {},
      mock: true,
      taskId: "mock-task",
      rawStatus: "MOCK",
      simplifiedChineseNormalized: false,
      simplifiedChineseSource: "",
    };
  }
  if (!config.hasApiKey) {
    throw createError("缺少 DASHSCOPE_API_KEY。", "missing-api-key", 503);
  }
  const audioUrl = String(input?.audioUrl || "").trim();
  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  const submitResult = await submitTask(audioUrl, model, Object.assign({}, config, { timeoutMs }), {
    requestId,
  });
  const pollResult = await pollTask(
    submitResult.taskId,
    Object.assign({}, config, { timeoutMs }),
    {
      requestId,
      timeoutMs,
    }
  );
  const transcriptionUrl = extractTranscriptionUrl(pollResult.payload, audioUrl);
  let heardText = "";
  if (transcriptionUrl) {
    const transcriptPayload = await downloadTranscriptionPayload(transcriptionUrl, timeoutMs);
    heardText = extractHeardText(transcriptPayload);
  }
  if (!heardText) {
    heardText = extractHeardText(pollResult.payload?.output || {});
  }
  heardText = String(heardText || "").trim();
  if (!heardText) {
    throw createEmptyTextError(String(pollResult.rawStatus || ""));
  }
  if (isHeardTextLikelyMojibake(heardText)) {
    throw createMojibakeError(String(pollResult.rawStatus || ""));
  }
  return {
    model,
    heardText,
    confidence: 0,
    usage: {},
    mock: false,
    taskId: submitResult.taskId,
    rawStatus: pollResult.rawStatus,
    simplifiedChineseNormalized: false,
    simplifiedChineseSource: "",
  };
}

async function requestFunAsrRecognition(input, options) {
  return requestFunAsrRecognitionRest(input, options);
}

module.exports = {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrRestConfig,
  requestFunAsrRecognition,
  requestFunAsrRecognitionRest,
};
