"use strict";

const { authenticateAdminRequest, getAdminAuthConfig } = require("../admin-auth");
const { sendJson } = require("../response");
const { createLiveAdminDashboardOverview } = require("./overview");

const OVERVIEW_PATH = "/api/admin/dashboard/overview";

function createRequestId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function sendError(response, statusCode, code, message, requestId) {
  sendJson(response, statusCode, {
    success: false,
    code,
    message,
    requestId,
  });
}

function registerAdminDashboardRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  router.get(OVERVIEW_PATH, function ({ request, response }) {
    const requestId = createRequestId();
    const authResult = authenticateAdminRequest({
      request,
      authConfig: getAdminAuthConfig(),
    });
    if (!authResult.ok) {
      const code = authResult.code === "admin-auth-not-configured"
        ? "admin-dashboard-auth-not-configured"
        : authResult.code === "admin-auth-missing"
          ? "admin-dashboard-token-missing"
          : authResult.code;
      sendError(
        response,
        code === "admin-dashboard-auth-not-configured" ? 500 : 401,
        code,
        authResult.message,
        requestId
      );
      return;
    }

    sendJson(response, 200, createLiveAdminDashboardOverview(config));
  });
}

module.exports = {
  OVERVIEW_PATH,
  registerAdminDashboardRoutes,
};
