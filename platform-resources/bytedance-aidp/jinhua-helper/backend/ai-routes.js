"use strict";

const path = require("path");

const { sendJson } = require("../../../backend/response");
const { createAiRoute } = require("../../../backend/ai-framework/core/create-ai-route");
const { loadProjectAssets } = require("../../../backend/ai-framework/loaders/project-assets");
const adapter = require("../ai/adapter");
const aiService = require("./ai-service");

const AI_BASE_PATH = "/api/bytedance-aidp/jinhua-helper/ai/recommend";
const AI_RECOMMEND_MAX_BODY_BYTES = 15 * 1024 * 1024;

function createAssetContext() {
  return aiService.buildAssetsContext(
    loadProjectAssets(adapter, {
      baseDir: path.join(__dirname, "..", "ai"),
    })
  );
}

function registerAiRoutes(router) {
  router.get(AI_BASE_PATH + "/health", function (context) {
    sendJson(context.response, 200, aiService.createHealthPayload(createAssetContext()));
  });

  router.get(AI_BASE_PATH + "/defaults", function (context) {
    sendJson(context.response, 200, aiService.createDefaultsPayload());
  });

  router.post(
    AI_BASE_PATH,
    createAiRoute(adapter, {
      maxBodyBytes: AI_RECOMMEND_MAX_BODY_BYTES,
      createSuccessBody: function (context) {
        return aiService.buildRecommendSuccessBody({
          requestId: context.normalizedRequest?.requestId,
          execution: context.execution,
        });
      },
      createErrorBody: function (context) {
        return aiService.buildRecommendErrorBody(context);
      },
      assetLoaderOptions: {
        baseDir: path.join(__dirname, "..", "ai"),
      },
    })
  );
}

module.exports = {
  AI_BASE_PATH,
  registerAiRoutes,
};

