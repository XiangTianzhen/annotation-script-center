"use strict";

const { registerSegmentRoutes } = require("./segment-routes");

function registerRoutes(router, options) {
  void options;
  registerSegmentRoutes(router);
}

module.exports = {
  registerRoutes,
};
