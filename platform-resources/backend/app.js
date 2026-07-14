"use strict";

const http = require("http");
const { createRouter } = require("./router");
const { sendJson } = require("./response");
const { registerProjectRoutes } = require("./registry");

function createPlatformResourcesServer(options) {
  const router = createRouter();

  router.get("/", function ({ response }) {
    sendJson(response, 200, {
      success: true,
      service: "platform-resources-backend",
      projects: [
        "data-baker-cvpc/liuzhou-helper",
        "bytedance-aidp/suzhou-helper",
        "bytedance-aidp/jinhua-helper",
        "bytedance-aidp/taizhou-helper",
        "magic-data/hangzhou-helper",
        "admin/session",
        "admin/dashboard",
        "admin/dashboard/runtime-logs",
        "admin/download-center",
        "admin/ai-call-log",
      ],
    });
  });

  registerProjectRoutes(router, options || {});

  return http.createServer(function (request, response) {
    void router.handle(request, response);
  });
}

module.exports = {
  createPlatformResourcesServer,
};
