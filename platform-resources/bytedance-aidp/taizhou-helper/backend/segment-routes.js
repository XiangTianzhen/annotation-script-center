"use strict";

const { sendJson } = require("../../../backend/response");
const {
  createHttpError,
  readRequestBody,
} = require("../../../backend/ai-framework/core/create-ai-route");
const segmentService = require("../../../data-baker-cvpc/liuzhou-helper/backend/segment-service");

const SEGMENT_BASE_PATH = "/api/bytedance-aidp/taizhou-helper/segment";
const AIDP_DEFAULT_SILENCE_THRESHOLD_DBFS = -31;

async function parseJsonBody(request) {
  const rawBody = await readRequestBody(request, 1024 * 1024);
  try {
    return JSON.parse(rawBody || "{}");
  } catch (_error) {
    throw createHttpError(400, "invalid-json", "请求体 JSON 解析失败。");
  }
}

function registerSegmentRoutes(router) {
  router.get(SEGMENT_BASE_PATH + "/health", function (context) {
    const payload = segmentService.createSegmentHealthPayload({
      route: "bytedance-aidp/taizhou-helper/segment/preview",
      defaultSilenceThresholdDbfs: AIDP_DEFAULT_SILENCE_THRESHOLD_DBFS,
      segmentationProfile: "visible-long-silence",
    });
    sendJson(context.response, 200, payload);
  });

  router.post(SEGMENT_BASE_PATH + "/preview", async function (context) {
    try {
      const body = await parseJsonBody(context.request);
      const payload = await segmentService.buildSegmentPreview(body, {
        defaultSilenceThresholdDbfs: AIDP_DEFAULT_SILENCE_THRESHOLD_DBFS,
        segmentationProfile: "visible-long-silence",
      });
      sendJson(context.response, 200, payload);
    } catch (error) {
      const statusCode = Math.max(400, Number(error && error.statusCode) || 500);
      sendJson(context.response, statusCode, {
        success: false,
        code: String((error && error.code) || "segment-preview-failed"),
        message: String((error && error.message) || "画段建议生成失败。"),
      });
    }
  });
}

module.exports = {
  SEGMENT_BASE_PATH,
  registerSegmentRoutes,
};
