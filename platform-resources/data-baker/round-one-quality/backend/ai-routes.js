"use strict";

const { sendJson } = require("../../../backend/response");
const {
  createDefaultsPayload,
  createHealthPayload,
  recommend,
} = require("./ai-service");

const AI_BASE_PATH = "/api/data-baker/round-one-quality/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
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
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleRecommend,
  registerAiRoutes,
};
