"use strict";

const { sendJson } = require("../../../backend/response");
const {
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
  recommend,
} = require("./ai-service");
const {
  createAiRecommendJob,
  getAiRecommendJob,
  markAiRecommendJobFailed,
  markAiRecommendJobRunning,
  markAiRecommendJobSucceeded,
} = require("./ai-job-store");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
const AI_JOBS_PATH = AI_BASE_PATH + "/jobs";
const AI_JOB_DETAIL_PATH = AI_JOBS_PATH + "/:jobId";
const MAX_BODY_BYTES = 3 * 1024 * 1024;

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

async function handleRecommend(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      const invalidJsonError = new Error("请求体 JSON 解析失败。");
      invalidJsonError.statusCode = 400;
      invalidJsonError.code = "invalid-json";
      throw invalidJsonError;
    }
    const responseData = await recommend(body, body.requestId);
    sendJson(response, 200, {
      success: true,
      data: responseData,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const responseBody = {
      success: false,
      requestId: String(error?.requestId || ""),
      code: String(error?.code || ""),
      message: String(error?.safeMessage || error?.message || "DataBaker AI recommend 请求失败。").slice(0, 240),
    };
    if (Number(error?.providerStatus) > 0) {
      responseBody.providerStatus = Number(error.providerStatus);
    } else if (error?.code === "provider-rate-limited") {
      responseBody.providerStatus = 429;
    } else if (error?.code === "provider-http-error" && Number(error?.statusCode) > 0) {
      responseBody.providerStatus = Number(error.statusCode);
    }
    sendJson(response, statusCode, responseBody);
  }
}

function buildJobStatusBody(job) {
  const source = job && typeof job === "object" ? job : {};
  const base = {
    jobId: String(source.jobId || ""),
    status: String(source.status || "pending"),
    requestId: String(source.requestId || ""),
    itemId: String(source.itemId || ""),
    textId: String(source.textId || ""),
    sentenceNumber: Number(source.sentenceNumber) || 0,
    updatedAt: Number(source.updatedAt) || 0,
  };
  if (base.status === "succeeded") {
    return {
      success: true,
      jobId: base.jobId,
      status: "succeeded",
      data: source.result || null,
    };
  }
  if (base.status === "failed") {
    return {
      success: false,
      jobId: base.jobId,
      status: "failed",
      code: String(source.errorCode || ""),
      message: String(source.errorMessage || "DataBaker AI recommend 失败。").slice(0, 240),
      providerStatus: Number(source.providerStatus) > 0 ? Number(source.providerStatus) : undefined,
    };
  }
  return Object.assign({ success: true }, base);
}

function startRecommendJob(jobId, body, requestId) {
  Promise.resolve()
    .then(function () {
      markAiRecommendJobRunning(jobId);
      return recommend(body, requestId);
    })
    .then(function (responseData) {
      markAiRecommendJobSucceeded(jobId, {
        result: responseData,
        runtime: responseData?.runtime || null,
      });
    })
    .catch(function (error) {
      markAiRecommendJobFailed(jobId, {
        code: String(error?.code || ""),
        message: String(error?.safeMessage || error?.message || "DataBaker AI recommend 失败。").slice(0, 240),
        providerStatus: Number(error?.providerStatus) || Number(error?.statusCode) || 0,
        runtime: error?.runtime || null,
      });
    });
}

async function handleCreateRecommendJob(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      const invalidJsonError = new Error("请求体 JSON 解析失败。");
      invalidJsonError.statusCode = 400;
      invalidJsonError.code = "invalid-json";
      throw invalidJsonError;
    }
    const normalizedRequest = normalizeRecommendRequest(body);
    const requestId = String(body.requestId || "").trim() || "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const job = createAiRecommendJob({
      requestId,
      itemId: normalizedRequest.itemId,
      textId: normalizedRequest.textId,
      sentenceNumber: normalizedRequest.sentenceNumber,
    });
    sendJson(response, 200, {
      success: true,
      jobId: job.jobId,
      requestId,
      status: "pending",
    });
    startRecommendJob(job.jobId, body, requestId);
  } catch (error) {
    sendJson(response, Number(error?.statusCode) || 500, {
      success: false,
      code: String(error?.code || ""),
      message: String(error?.safeMessage || error?.message || "创建 DataBaker AI recommend job 失败。").slice(0, 240),
    });
  }
}

function handleGetRecommendJobStatus(_request, response, jobId) {
  try {
    const job = getAiRecommendJob(jobId);
    const responseBody = buildJobStatusBody(job);
    const statusCode = responseBody.status === "failed" ? 200 : 200;
    sendJson(response, statusCode, responseBody);
  } catch (error) {
    sendJson(response, Number(error?.statusCode) || 500, {
      success: false,
      code: String(error?.code || ""),
      message: String(error?.safeMessage || error?.message || "查询 DataBaker AI recommend job 失败。").slice(0, 240),
    });
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, createHealthPayload());
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
  router.get(AI_JOB_DETAIL_PATH, function ({ response, params }) {
    return handleGetRecommendJobStatus(null, response, params?.jobId);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  AI_JOBS_PATH,
  AI_JOB_DETAIL_PATH,
  buildJobStatusBody,
  handleCreateRecommendJob,
  handleGetRecommendJobStatus,
  handleRecommend,
  registerAiRoutes,
};
