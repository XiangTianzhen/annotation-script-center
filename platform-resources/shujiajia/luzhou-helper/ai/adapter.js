"use strict";

const service = require("../backend/ai-service");
const { aiCallLogger } = require("../backend/ai-call-log");

module.exports = {
  projectId: "shujiajia/luzhou-helper",
  platform: "shujiajia",
  scriptId: service.SCRIPT_ID,
  routeKey: "recommend",
  aiCallLogger,
  baseDir: __dirname,
  assets: {},
  normalizeInput(body) {
    return { input: service.normalizeRecommendRequest(body || {}), runtimeContext: {} };
  },
  async buildAssetsContext() {
    return {};
  },
  run(context) {
    return service.recommend(context?.normalizedRequest?.input || {}, {});
  },
  exposeProjectResult(result) {
    return result && typeof result === "object" ? result : null;
  },
};
