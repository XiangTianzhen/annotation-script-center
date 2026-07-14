"use strict";

const { registerAiRoutes } = require("./ai-routes");
const { registerSegmentRoutes } = require("./segment-routes");

function registerRoutes(router, options) {
  void options;
  registerAiRoutes(router);
  registerSegmentRoutes(router);
}

module.exports = {
  registerRoutes,
};
