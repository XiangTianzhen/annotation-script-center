"use strict";

const { createCorsHeaders } = require("../../../backend/response");
const {
  createHttpError,
  readRequestBody,
} = require("../../../backend/ai-framework/core/create-ai-route");
const clipCacheService = require("./clip-cache-service");

const CLIP_CACHE_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

function normalizeText(value) {
  return String(value || "").trim();
}

function resolvePublicBaseUrl(request) {
  const headers = request?.headers || {};
  const forwardedProto = normalizeText(headers["x-forwarded-proto"]).split(",")[0];
  const forwardedHost = normalizeText(headers["x-forwarded-host"]).split(",")[0];
  const host = forwardedHost || normalizeText(headers.host);
  if (!host) {
    throw createHttpError(500, "missing-public-host", "未获取到 clip-cache 对外 host。");
  }
  const protocol = forwardedProto || (request?.socket?.encrypted ? "https" : "http");
  return protocol + "://" + host;
}

async function parseJsonBody(request) {
  const rawBody = await readRequestBody(request, CLIP_CACHE_UPLOAD_MAX_BYTES);
  try {
    return JSON.parse(rawBody || "{}");
  } catch (_error) {
    throw createHttpError(400, "invalid-json", "请求体 JSON 解析失败。");
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(
    statusCode,
    createCorsHeaders({
      "Content-Type": "application/json; charset=utf-8",
    })
  );
  response.end(JSON.stringify(body || {}));
}

function sendAudio(response, statusCode, clipRecord, headOnly) {
  response.writeHead(
    statusCode,
    createCorsHeaders({
      "Content-Type": clipRecord.contentType || "audio/wav",
      "Content-Length": String(clipRecord.buffer.length),
      "Cache-Control": "private, max-age=60",
    })
  );
  if (!headOnly) {
    response.end(clipRecord.buffer);
    return;
  }
  response.end();
}

function registerClipCacheRoutes(router) {
  router.get(clipCacheService.CLIP_CACHE_BASE_PATH + "/health", function (context) {
    sendJson(context.response, 200, clipCacheService.createHealthPayload());
  });

  router.post(clipCacheService.CLIP_CACHE_BASE_PATH + "/upload", async function (context) {
    try {
      const body = await parseJsonBody(context.request);
      const payload = clipCacheService.saveClip(body, {
        publicBaseUrl: resolvePublicBaseUrl(context.request),
      });
      sendJson(context.response, 200, payload);
    } catch (error) {
      const statusCode = Math.max(400, Number(error && error.statusCode) || 500);
      sendJson(context.response, statusCode, {
        success: false,
        code: normalizeText(error && error.code) || "clip-cache-upload-failed",
        message: normalizeText(error && error.message) || "clip-cache 上传失败。",
      });
    }
  });

  router.get(clipCacheService.CLIP_CACHE_BASE_PATH + "/files/:clipId.wav", function (context) {
    const clipRecord = clipCacheService.readClip(context.params?.clipId);
    if (!clipRecord) {
      sendJson(context.response, 404, {
        success: false,
        code: "clip-cache-not-found",
        message: "临时音频不存在或已过期。",
      });
      return;
    }
    sendAudio(context.response, 200, clipRecord, false);
  });

  router.head(clipCacheService.CLIP_CACHE_BASE_PATH + "/files/:clipId.wav", function (context) {
    const clipRecord = clipCacheService.readClip(context.params?.clipId);
    if (!clipRecord) {
      sendJson(context.response, 404, {
        success: false,
        code: "clip-cache-not-found",
        message: "临时音频不存在或已过期。",
      });
      return;
    }
    sendAudio(context.response, 200, clipRecord, true);
  });
}

module.exports = {
  registerClipCacheRoutes,
};
