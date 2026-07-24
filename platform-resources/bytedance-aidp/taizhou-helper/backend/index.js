"use strict";

const { registerAiRoutes } = require("./ai-routes");
const {
  registerRecordingIntegrationRoutes,
} = require("./recording-integration");
const { registerSegmentRoutes } = require("./segment-routes");

function registerRoutes(router, options) {
  registerAiRoutes(router);
  registerSegmentRoutes(router);
  registerRecordingIntegrationRoutes(
    router,
    options && typeof options === "object"
      ? options.recordingIntegration || {}
      : {}
  );
}

module.exports = {
  registerRoutes,
};
