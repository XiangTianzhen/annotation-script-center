"use strict";

const { sendJson } = require("../../../backend/response");
const {
  SCRIPT_ID,
  createDefaultsPayload,
  createHealthPayload,
  readRequestBody,
  reviewCurrent,
} = require("./ai-service");

const AI_BASE_PATH = "/api/magic-data/minnan-helper/ai/review-current";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = "/api/magic-data/minnan-helper/ai/defaults";

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

function normalizeText(value) {
  return String(value || "").trim();
}

async function handleReviewCurrent(request, response) {
  let requestId = createRequestId();
  try {
    const rawBody = await readRequestBody(request);
    let body = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch (error) {
      const parseError = new Error("请求体 JSON 解析失败。");
      parseError.code = "invalid-json";
      parseError.statusCode = 400;
      throw parseError;
    }

    requestId = normalizeText(body?.requestId) || requestId;
    const result = await reviewCurrent(body, requestId);
    sendJson(response, 200, {
      success: true,
      data: result?.data || {},
      cache: result?.cache || { hit: false },
      backend: result?.backend || {},
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const code = normalizeText(error?.code) || (statusCode >= 500 ? "internal-error" : "request-error");
    const message = normalizeText(error?.message || "Magic Data 闽南语助手请求失败。").slice(0, 240);
    const responseBody = {
      success: false,
      requestId: normalizeText(error?.requestId || requestId),
      code,
      message,
      scriptId: SCRIPT_ID,
    };
    const summary = normalizeText(error?.summary || "");
    if (summary) {
      responseBody.summary = summary.slice(0, 200);
    }
    sendJson(response, statusCode, responseBody);
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
    return handleReviewCurrent(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleReviewCurrent,
  registerAiRoutes,
};

