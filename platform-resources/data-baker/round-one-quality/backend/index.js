"use strict";

const { registerAiRoutes } = require("./ai-routes");
const { registerExportRoutes } = require("./export-routes");

function registerRoutes(router) {
  registerAiRoutes(router);
  registerExportRoutes(router);
}

module.exports = {
  registerRoutes,
};
