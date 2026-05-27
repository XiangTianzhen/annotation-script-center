"use strict";

const { sendJson } = require("../../../backend/response");
const { createAiRoute } = require("../../../backend/ai-framework");
const aishellAdapter = require("../ai/adapter");
const {
  createDataBakerRequest,
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
  transformRecommendResult,
} = require("./ai-service");
const {
  recommend,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const AI_BASE_PATH = "/api/aishell-tech/minnan-helper/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";

const handleRecommend = createAiRoute(aishellAdapter, {
  async run(context) {
    const normalizedRecommendRequest =
      context?.normalizedRequest?.runtimeContext?.normalizedRecommendRequest ||
      normalizeRecommendRequest(context?.runtimeContext?.rawBody || {});
    const dataBakerRequest =
      context?.normalizedRequest?.runtimeContext?.dataBakerRequest ||
      normalizedRecommendRequest.dataBakerRequest ||
      createDataBakerRequest(normalizedRecommendRequest);
    const requestId = String(context?.normalizedRequest?.requestId || "").trim();
    const dataBakerResult = await recommend(dataBakerRequest, requestId, {});
    return {
      data: transformRecommendResult(dataBakerResult, normalizedRecommendRequest),
      upstream: {
        requestId: dataBakerResult?.requestId || "",
      },
    };
  },
  createSuccessBody(context) {
    return aishellAdapter.buildRecommendSuccessBody(context);
  },
  createErrorBody(context) {
    return aishellAdapter.buildRecommendErrorBody(context);
  },
});

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, createHealthPayload());
  });

  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    sendJson(response, 200, createDefaultsPayload());
  });

  router.post(AI_BASE_PATH, function (routeContext) {
    return handleRecommend(routeContext);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  handleRecommend,
  registerAiRoutes,
};
