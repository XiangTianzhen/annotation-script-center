"use strict";

const { authenticateAdminRequest, getAdminAuthConfig } = require("../admin-auth");
const { appendRuntimeLog } = require("../runtime-log-store");
const { sendJson } = require("../response");
const { loadAdminDownloadCenterReleases } = require("./releases");

const RELEASES_PATH = "/api/admin/download-center/releases";

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

function authenticateRequest(request, response, requestId) {
  const authResult = authenticateAdminRequest({
    request,
    authConfig: getAdminAuthConfig(),
  });
  if (authResult.ok) {
    return true;
  }
  const code =
    authResult.code === "admin-auth-not-configured"
      ? "admin-download-center-auth-not-configured"
      : authResult.code === "admin-auth-missing"
        ? "admin-download-center-token-missing"
        : authResult.code;
  appendRuntimeLog({
    level: "warn",
    scope: "admin.download-center.releases",
    action: "auth_failed",
    message: "下载中心版本列表鉴权失败",
    requestId,
    details: {
      code,
    },
  });
  sendError(
    response,
    code === "admin-download-center-auth-not-configured" ? 500 : 401,
    code,
    authResult.message,
    requestId
  );
  return false;
}

function registerAdminDownloadCenterRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  router.get(RELEASES_PATH, async function ({ request, response }) {
    const requestId = createRequestId();
    if (!authenticateRequest(request, response, requestId)) {
      return;
    }
    try {
      const data = await loadAdminDownloadCenterReleases(config);
      appendRuntimeLog({
        level: "info",
        scope: "admin.download-center.releases",
        action: "read",
        message: "脚本下载版本列表已刷新",
        requestId,
        details: {
          latestVersion: data.latestVersion,
          items: Array.isArray(data.items) ? data.items.length : 0,
          usedFallback: data?.source?.usedFallback === true,
        },
      });
      sendJson(response, 200, {
        success: true,
        data,
        requestId,
      });
    } catch (error) {
      appendRuntimeLog({
        level: "error",
        scope: "admin.download-center.releases",
        action: "read_failed",
        message: "脚本下载版本列表加载失败",
        requestId,
        details: {
          error: error && error.message ? error.message : String(error),
        },
      });
      sendError(
        response,
        502,
        "admin-download-center-releases-unavailable",
        error && error.message ? error.message : "脚本下载版本列表加载失败。",
        requestId
      );
    }
  });
}

module.exports = {
  RELEASES_PATH,
  registerAdminDownloadCenterRoutes,
};
