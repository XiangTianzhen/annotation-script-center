"use strict";

const crypto = require("crypto");

const { sendJson } = require("../../../backend/response");
const { getInFlightDedupeHealth, runWithInFlightDedupe } = require("./ai-inflight-dedupe");
const {
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
  recommend,
} = require("./ai-service");
const {
  createAiRecommendJob,
  getAiRecommendJob,
  getAiRecommendJobDebug,
  getAiRecommendJobSignal,
  markAiRecommendJobFailed,
  markAiRecommendJobRunning,
  markAiRecommendJobSucceeded,
} = require("./ai-job-store");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
const AI_JOBS_PATH = AI_BASE_PATH + "/jobs";
const AI_JOB_DETAIL_PATH = AI_JOBS_PATH + "/:jobId";
const AI_JOB_DEBUG_PATH = AI_JOB_DETAIL_PATH + "/debug";
const MAX_BODY_BYTES = 3 * 1024 * 1024;

function createRequestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        const error = new Error("请求体超过 3MB。");
        error.statusCode = 413;
        error.code = "payload-too-large";
        reject(error);
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = String(code || "request-failed");
  return error;
}

function normalizeNullableInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return number;
}

function buildErrorResponseBody(error, fallbackMessage) {
  const responseBody = {
    success: false,
    requestId: String(error?.requestId || ""),
    code: String(error?.code || ""),
    message: String(error?.safeMessage || error?.message || fallbackMessage || "请求失败。").slice(0, 240),
  };
  if (Number(error?.providerStatus) > 0) {
    responseBody.providerStatus = Number(error.providerStatus);
  } else if (Number(error?.statusCode) > 0) {
    responseBody.providerStatus = Number(error.statusCode);
  }
  if (error?.debugRawJson && typeof error.debugRawJson === "object") {
    responseBody.hasDebugRawJson = true;
    responseBody.debugRawJson = error.debugRawJson;
  }
  return responseBody;
}

function buildHealthPayload() {
  const payload = createHealthPayload();
  payload.dedupe = getInFlightDedupeHealth();
  payload.notes = Object.assign({}, payload.notes || {}, {
    defaultResultMode: "sync-recommend",
    asyncJobsDefaultEnabled: false,
    requestStaggerMs: 30,
    inflightDedupe: "enabled-when-batchRunId-and-batchProcessKey-present",
  });
  return payload;
}

function buildJobStatusBody(jobLike) {
  const job = jobLike && typeof jobLike === "object" ? jobLike : {};
  return {
    success: true,
    jobId: String(job.jobId || ""),
    requestId: String(job.requestId || ""),
    status: String(job.status || "pending"),
    createdAt: normalizeNullableInteger(job.createdAt),
    updatedAt: normalizeNullableInteger(job.updatedAt),
    startedAt: normalizeNullableInteger(job.startedAt),
    finishedAt: normalizeNullableInteger(job.finishedAt),
    itemId: String(job.itemId || ""),
    textId: String(job.textId || ""),
    sentenceNumber: normalizeNullableInteger(job.sentenceNumber),
    hasDebugRawJson: job.hasDebugRawJson === true,
    providerStatus: normalizeNullableInteger(job.providerStatus),
    runtime: job.runtime && typeof job.runtime === "object" ? job.runtime : null,
    data: job.status === "succeeded" ? job.result || null : null,
    error:
      job.status === "failed"
        ? {
            code: String(job.errorCode || ""),
            message: String(job.errorMessage || "任务执行失败。"),
            providerStatus: normalizeNullableInteger(job.providerStatus),
          }
        : null,
  };
}

async function executeRecommendWithOptionalDedupe(requestBody, normalizedRequest, requestId, runtimeOptions) {
  const source = normalizedRequest && typeof normalizedRequest === "object"
    ? normalizedRequest
    : normalizeRecommendRequest(requestBody || {});
  return runWithInFlightDedupe(
    {
      batchRunId: source.batchRunId,
      batchProcessKey: source.batchProcessKey,
      recognitionMode: source.recognitionMode || source.pipelineMode,
      listenModel: source.listenModel || source.aiOptions?.listenModel,
      compareModel: source.compareModel || source.aiOptions?.compareModel,
      singleModel: source.singleModel || source.aiOptions?.singleModel,
    },
    function () {
      return recommend(requestBody || {}, requestId, runtimeOptions || {});
    },
    function (dedupeInfo) {
      console.info("[DataBaker][ai][dedupe] join inflight", {
        requestId,
        batchRunId: String(source.batchRunId || ""),
        batchProcessKey: String(source.batchProcessKey || ""),
        dedupeKeyShort: String(dedupeInfo?.keyShort || ""),
      });
    }
  );
}

async function handleRecommend(request, response) {
  let requestId = createRequestId();
  let normalizedRequest = null;
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }

    requestId = String(body.requestId || requestId);
    normalizedRequest = normalizeRecommendRequest(body);

    console.info("[DataBaker][round-one-quality][ai] recommend start", {
      requestId,
      itemId: String(normalizedRequest.itemId || ""),
      textId: String(normalizedRequest.textId || ""),
      sentenceNumber: normalizeNullableInteger(normalizedRequest.sentenceNumber),
      recognitionMode: String(normalizedRequest.recognitionMode || ""),
      pipelineMode: String(normalizedRequest.pipelineMode || ""),
      batchRunId: String(normalizedRequest.batchRunId || ""),
      batchItemIndex: normalizeNullableInteger(normalizedRequest.batchItemIndex),
      batchProcessKey: String(normalizedRequest.batchProcessKey || ""),
      clientRequestId: String(normalizedRequest.clientRequestId || ""),
    });

    const dedupeResult = await executeRecommendWithOptionalDedupe(body, normalizedRequest, requestId, {});
    const result = dedupeResult?.value || dedupeResult;
    sendJson(response, 200, {
      success: true,
      requestId,
      data: result,
      dedupe: {
        enabled: dedupeResult?.dedupeEnabled === true,
        joined: dedupeResult?.joined === true,
        joinedInflight: dedupeResult?.joinedInflight === true,
        keyShort: String(dedupeResult?.dedupeKeyShort || ""),
      },
    });
  } catch (error) {
    const statusCode = Math.max(400, Number(error?.statusCode) || 500);
    error.requestId = String(error?.requestId || requestId || "");
    sendJson(response, statusCode, buildErrorResponseBody(error, "DataBaker AI recommend 请求失败。"));
  }
}

async function runRecommendJob(jobId, requestBody, requestId) {
  let normalizedRequest = null;
  try {
    normalizedRequest = normalizeRecommendRequest(requestBody || {});
    markAiRecommendJobRunning(jobId);
    const signal = getAiRecommendJobSignal(jobId);
    const dedupeResult = await executeRecommendWithOptionalDedupe(
      requestBody || {},
      normalizedRequest,
      requestId,
      {
        signal,
        jobId,
        createdAt: new Date().toISOString(),
      }
    );
    const result = dedupeResult?.value || dedupeResult;
    markAiRecommendJobSucceeded(jobId, {
      result,
      providerStatus: normalizeNullableInteger(result?.providerStatus) || 200,
      runtime: result?.runtime || null,
    });
  } catch (error) {
    markAiRecommendJobFailed(jobId, {
      code: String(error?.code || "ai-recommend-job-failed"),
      message: String(error?.safeMessage || error?.message || "DataBaker AI recommend 失败。"),
      providerStatus: normalizeNullableInteger(error?.providerStatus || error?.statusCode),
      runtime: error?.runtime || null,
      debugRawJson: error?.debugRawJson || null,
    });
  }
}

async function handleCreateRecommendJob(request, response) {
  let requestId = createRequestId();
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }
    requestId = String(body.requestId || requestId);
    const normalizedRequest = normalizeRecommendRequest(body);
    const job = createAiRecommendJob({
      requestId,
      itemId: normalizedRequest.itemId,
      textId: normalizedRequest.textId,
      sentenceNumber: normalizedRequest.sentenceNumber,
    });
    sendJson(response, 202, buildJobStatusBody(job));
    Promise.resolve().then(function () {
      return runRecommendJob(job.jobId, body, requestId);
    });
  } catch (error) {
    const statusCode = Math.max(400, Number(error?.statusCode) || 500);
    error.requestId = String(error?.requestId || requestId || "");
    sendJson(response, statusCode, buildErrorResponseBody(error, "创建 AI recommend 异步任务失败。"));
  }
}

function handleGetRecommendJobStatus(_request, response, jobId) {
  try {
    const job = getAiRecommendJob(jobId);
    sendJson(response, 200, buildJobStatusBody(job));
  } catch (error) {
    const statusCode = Math.max(400, Number(error?.statusCode) || 500);
    sendJson(response, statusCode, buildErrorResponseBody(error, "查询 AI recommend 任务状态失败。"));
  }
}

function handleGetRecommendJobDebug(_request, response, jobId) {
  try {
    const debug = getAiRecommendJobDebug(jobId);
    sendJson(response, 200, {
      success: true,
      jobId: String(jobId || ""),
      debug,
    });
  } catch (error) {
    const statusCode = Math.max(400, Number(error?.statusCode) || 500);
    sendJson(response, statusCode, buildErrorResponseBody(error, "查询 AI recommend 调试信息失败。"));
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthPayload());
  });
  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    sendJson(response, 200, createDefaultsPayload());
  });
  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleRecommend(request, response);
  });
  router.post(AI_JOBS_PATH, function ({ request, response }) {
    return handleCreateRecommendJob(request, response);
  });
  router.get(AI_JOB_DEBUG_PATH, function ({ response, params }) {
    return handleGetRecommendJobDebug(null, response, params?.jobId);
  });
  router.get(AI_JOB_DETAIL_PATH, function ({ response, params }) {
    return handleGetRecommendJobStatus(null, response, params?.jobId);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  AI_JOBS_PATH,
  AI_JOB_DEBUG_PATH,
  AI_JOB_DETAIL_PATH,
  buildHealthPayload,
  buildJobStatusBody,
  handleCreateRecommendJob,
  handleGetRecommendJobDebug,
  handleGetRecommendJobStatus,
  handleRecommend,
  registerAiRoutes,
};
