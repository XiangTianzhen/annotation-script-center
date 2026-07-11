"use strict";

const { loadDefaultEnvFiles } = require("./env-loader");
const { createPlatformResourcesServer } = require("./app");
const { getServerConfig } = require("./config");
const { appendRuntimeLog } = require("./runtime-log-store");

loadDefaultEnvFiles();

const config = getServerConfig();
const server = createPlatformResourcesServer();

server.listen(config.port, config.host, function () {
  const baseUrl = "http://" + config.host + ":" + String(config.port);
  appendRuntimeLog({
    level: "success",
    scope: "backend.server",
    action: "listen",
    message: "platform-resources 后端已启动",
    details: { baseUrl },
  });
  console.info("[Platform Resources][backend] listening on " + baseUrl);
  [
    "/api/data-baker-cvpc/liuzhou-helper/ai/recommend/health",
    "/api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults",
    "/api/bytedance-aidp/suzhou-helper/ai/recommend/health",
    "/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults",
    "/api/bytedance-aidp/jinhua-helper/ai/recommend/health",
    "/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults",
    "/api/magic-data/hangzhou-helper/ai/review-current/health",
    "/api/magic-data/hangzhou-helper/ai/defaults",
    "/api/admin/session/unlock",
    "/api/admin/dashboard/overview",
    "/api/admin/dashboard/runtime-logs",
    "/api/admin/download-center/releases",
    "/api/admin/ai-call-log/options",
    "/api/admin/ai-call-log/request",
    "/api/admin/ai-call-log/file?token=...",
  ].forEach(function (route) {
    console.info("[Platform Resources][backend] " + baseUrl + route);
  });
});

module.exports = server;
