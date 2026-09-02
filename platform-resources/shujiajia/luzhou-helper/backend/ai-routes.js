"use strict";

const { sendJson } = require("../../../backend/response");
const { createAiRoute } = require("../../../backend/ai-framework/core/create-ai-route");
const adapter = require("../ai/adapter");
const service = require("./ai-service");

const AI_BASE_PATH = "/api/shujiajia/luzhou-helper/ai/recommend";

function registerAiRoutes(router) {
  router.get(AI_BASE_PATH + "/health", ({ response }) => {
    sendJson(response, 200, service.createHealthPayload());
  });
  router.get(AI_BASE_PATH + "/defaults", ({ response }) => {
    sendJson(response, 200, service.createDefaultsPayload());
  });
  router.post(AI_BASE_PATH, createAiRoute(adapter, {
    maxBodyBytes: 15 * 1024 * 1024,
    createSuccessBody(context) {
      return service.buildRecommendSuccessBody({
        requestId: context.normalizedRequest?.requestId,
        execution: context.execution,
      });
    },
    createErrorBody: service.buildRecommendErrorBody,
  }));
}

module.exports = { AI_BASE_PATH, registerAiRoutes };
