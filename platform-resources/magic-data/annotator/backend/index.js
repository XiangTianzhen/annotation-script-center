"use strict";

const { registerRoutes: registerHakkaRoutes } = require("../../hakka-helper/backend");

function registerRoutes(router, options) {
  registerHakkaRoutes(router, options && typeof options === "object" ? options : {});
}

module.exports = {
  registerRoutes,
};
