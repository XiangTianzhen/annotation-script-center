"use strict";

const aiService = require("../backend/ai-service");
const { aiCallLogger } = require("../backend/ai-call-log");

function normalizeInput(body) {
  return {
    input: aiService.normalizeRecommendRequest(body || {}),
    runtimeContext: {},
  };
}

async function buildAssetsContext(_normalizedRequest, assets) {
  return aiService.buildAssetsContext(assets);
}

async function run(context) {
  const source = context && typeof context === "object" ? context : {};
  return aiService.recommend(source.normalizedRequest?.input || {}, source.assetsContext || {});
}

function exposeProjectResult(result) {
  return result && typeof result === "object" ? result : null;
}

module.exports = {
  projectId: "bytedance-aidp/taizhou-helper",
  platform: "bytedance-aidp",
  scriptId: aiService.SCRIPT_ID,
  routeKey: "recommend",
  aiCallLogger,
  baseDir: __dirname,
  assets: {
    ruleText: {
      path: "assets/taizhou-rules.md",
      optional: true,
    },
  },
  normalizeInput,
  buildAssetsContext,
  run,
  exposeProjectResult,
};
