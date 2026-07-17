"use strict";

const { authenticateAdminRequest, getAdminAuthConfig } = require("../admin-auth");
const { createDashscopeKeySlotStore } = require("../dashscope-key-slots");
const { appendRuntimeLog } = require("../runtime-log-store");
const { sendJson } = require("../response");

const STATUS_PATH = "/api/admin/ai-key-slots";
const ACTIVE_PATH = "/api/admin/ai-key-slots/active";
const MAX_BODY_BYTES = 64 * 1024;

function createRequestId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("请求体超过限制。"));
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function sendError(response, statusCode, code, message, requestId) {
  sendJson(response, statusCode, {
    success: false,
    code,
    message,
    requestId,
  });
}

function authenticateRouteRequest(request, response, requestId, scope) {
  const authResult = authenticateAdminRequest({
    request,
    authConfig: getAdminAuthConfig(),
  });
  if (authResult.ok) {
    return authResult;
  }
  const code = authResult.code === "admin-auth-not-configured"
    ? "admin-ai-key-slots-auth-not-configured"
    : authResult.code === "admin-auth-missing"
      ? "admin-ai-key-slots-token-missing"
      : authResult.code;
  appendRuntimeLog({
    level: "warn",
    scope,
    action: "auth_failed",
    message: "服务器 AI 密钥管理接口鉴权失败",
    requestId,
    details: { code },
  });
  sendError(
    response,
    code === "admin-ai-key-slots-auth-not-configured" ? 500 : 401,
    code,
    authResult.message,
    requestId
  );
  return null;
}

function resolveSafeError(error) {
  const code = normalizeText(error?.code) || "admin-ai-key-slots-request-failed";
  const statusCode = Number(error?.statusCode);
  const message = normalizeText(error?.message) || "服务器 AI 密钥状态处理失败。";
  return {
    code,
    message,
    statusCode: Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 500,
  };
}

function registerAdminAiKeySlotRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  const store = config.store && typeof config.store.getSummary === "function"
    ? config.store
    : createDashscopeKeySlotStore();

  router.get(STATUS_PATH, function ({ request, response }) {
    const requestId = createRequestId();
    const authResult = authenticateRouteRequest(
      request,
      response,
      requestId,
      "admin.ai_key_slots.status"
    );
    if (!authResult) {
      return;
    }
    try {
      sendJson(response, 200, {
        success: true,
        data: store.getSummary(),
        requestId,
      });
    } catch (error) {
      const safeError = resolveSafeError(error);
      appendRuntimeLog({
        level: "error",
        scope: "admin.ai_key_slots.status",
        action: "read_failed",
        message: "服务器 AI 密钥状态读取失败",
        requestId,
        details: { code: safeError.code },
      });
      sendError(response, safeError.statusCode, safeError.code, safeError.message, requestId);
    }
  });

  router.post(ACTIVE_PATH, async function ({ request, response }) {
    const requestId = createRequestId();
    const authResult = authenticateRouteRequest(
      request,
      response,
      requestId,
      "admin.ai_key_slots.switch"
    );
    if (!authResult) {
      return;
    }
    try {
      const body = JSON.parse((await readRequestBody(request)) || "{}");
      const before = store.getSummary();
      const after = store.setActiveSlot(normalizeText(body?.slotId));
      appendRuntimeLog({
        level: "success",
        scope: "admin.ai_key_slots.switch",
        action: "switch",
        message: "服务器 AI 密钥槽位已切换",
        requestId,
        details: {
          fromSlotId: before.activeSlotId,
          toSlotId: after.activeSlotId,
          operatorName: normalizeText(authResult.payload?.operatorName) || "未设置",
        },
      });
      sendJson(response, 200, {
        success: true,
        data: after,
        requestId,
      });
    } catch (error) {
      const safeError = resolveSafeError(error);
      appendRuntimeLog({
        level: "warn",
        scope: "admin.ai_key_slots.switch",
        action: "switch_failed",
        message: "服务器 AI 密钥槽位切换失败",
        requestId,
        details: { code: safeError.code },
      });
      sendError(response, safeError.statusCode, safeError.code, safeError.message, requestId);
    }
  });
}

module.exports = {
  ACTIVE_PATH,
  STATUS_PATH,
  registerAdminAiKeySlotRoutes,
};
