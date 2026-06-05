"use strict";

const aiService = require("../backend/ai-service");

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
  projectId: "data-baker-cvpc/liuzhou-helper",
  platform: "data-baker-cvpc",
  scriptId: aiService.SCRIPT_ID,
  routeKey: "recommend",
  baseDir: __dirname,
  assets: {
    ruleText: {
      path: "assets/liuzhou-rules.md",
    },
    lexiconCsv: {
      path: "assets/liuzhou-pronunciation-reference.csv",
    },
  },
  normalizeInput,
  buildAssetsContext,
  run,
  exposeProjectResult,
};
