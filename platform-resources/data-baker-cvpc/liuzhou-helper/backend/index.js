"use strict";

const { registerAiRoutes } = require("./ai-routes");
const { registerClipCacheRoutes } = require("./clip-cache-routes");
const { registerSegmentRoutes } = require("./segment-routes");

function registerRoutes(router, options) {
  void options;
  registerAiRoutes(router);
  registerClipCacheRoutes(router);
  registerSegmentRoutes(router);
}

module.exports = {
  registerRoutes,
};
