"use strict";

const { sendJson } = require("../../response");
const {
  createNormalizedRequest,
  createRequestId,
} = require("../contracts/normalized-request");
const {
  createNormalizedResponse,
} = require("../contracts/normalized-response");
const { loadProjectAssets } = require("../loaders/project-assets");
const {
  executeProjectPipeline,
} = require("../runtime/execute-project-pipeline");

const DEFAULT_MAX_BODY_BYTES = 3 * 1024 * 1024;

function normalizeString(value) {
  return String(value || "").trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createHttpError(statusCode, code, message) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = normalizeString(code) || "ai-framework-request-failed";
  return error;
}

function readRequestBody(request, maxBodyBytes) {
  const limit = Number(maxBodyBytes) > 0 ? Number(maxBodyBytes) : DEFAULT_MAX_BODY_BYTES;
  return new Promise(function readBody(resolve, reject) {
    let body = "";
    request.on("data", function handleChunk(chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > limit) {
        const error = createHttpError(413, "payload-too-large", "请求体超过限制。");
        reject(error);
        request.destroy();
      }
    });
    request.on("end", function handleEnd() {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function normalizeAdapterPayload(payload) {
  if (!isPlainObject(payload)) {
    return {
      input: {},
      projectOptions: {},
      debugOptions: {},
      runtimeContext: {},
    };
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "input") ||
    Object.prototype.hasOwnProperty.call(payload, "projectOptions") ||
    Object.prototype.hasOwnProperty.call(payload, "debugOptions") ||
    Object.prototype.hasOwnProperty.call(payload, "runtimeContext")
  ) {
    return {
      input: isPlainObject(payload.input) ? payload.input : {},
      projectOptions: isPlainObject(payload.projectOptions) ? payload.projectOptions : {},
      debugOptions: isPlainObject(payload.debugOptions) ? payload.debugOptions : {},
      runtimeContext: isPlainObject(payload.runtimeContext) ? payload.runtimeContext : {},
    };
  }

  return {
    input: payload,
    projectOptions: {},
    debugOptions: {},
    runtimeContext: {},
  };
}

function createErrorBody(error, requestId) {
  return {
    success: false,
    code: normalizeString(error && error.code),
    message: normalizeString(error && error.message) || "请求失败。",
    requestId: normalizeString((error && error.requestId) || requestId),
  };
}

function createAiRoute(adapter, options) {
  const source = adapter && typeof adapter === "object" ? adapter : {};
  const runtimeOptions = options && typeof options === "object" ? options : {};

  return async function handleAiRoute(routeContext) {
    const context = routeContext && typeof routeContext === "object" ? routeContext : {};
    const request = context.request;
    const response = context.response;
    let requestId = "";

    try {
      const rawBody = await readRequestBody(request, runtimeOptions.maxBodyBytes);
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(rawBody || "{}");
      } catch (_error) {
        throw createHttpError(400, "invalid-json", "请求体 JSON 解析失败。");
      }

      requestId = normalizeString(parsedBody.requestId) || createRequestId();

      const normalizedAdapterPayload = normalizeAdapterPayload(
        typeof source.normalizeInput === "function"
          ? await source.normalizeInput(parsedBody, context)
          : parsedBody
      );

      const normalizedRequest = createNormalizedRequest({
        requestId,
        platform: source.platform,
        scriptId: source.scriptId,
        routeKey: source.routeKey || context.pathname,
        input: normalizedAdapterPayload.input,
        projectOptions: normalizedAdapterPayload.projectOptions,
        debugOptions: normalizedAdapterPayload.debugOptions,
        runtimeContext: Object.assign({}, normalizedAdapterPayload.runtimeContext, {
          pathname: normalizeString(context.pathname),
          query: isPlainObject(context.query) ? context.query : {},
          params: isPlainObject(context.params) ? context.params : {},
        }),
      });

      const assets = loadProjectAssets(source, runtimeOptions.assetLoaderOptions || {});
      const runner = typeof runtimeOptions.run === "function" ? runtimeOptions.run : source.run;
      const execution = await executeProjectPipeline({
        adapter: source,
        normalizedRequest,
        assets,
        runtimeContext: {
          routeContext: context,
          rawBody: parsedBody,
        },
        runner,
      });

      sendJson(
        response,
        200,
        createNormalizedResponse({
          success: true,
          requestId: normalizedRequest.requestId,
          platform: normalizedRequest.platform,
          scriptId: normalizedRequest.scriptId,
          routeKey: normalizedRequest.routeKey,
          models: execution.models,
          usage: execution.usage,
          timing: execution.timing,
          cache: execution.cache,
          debug: execution.debug,
          notes: execution.notes,
          projectResult: execution.projectResult,
        })
      );
    } catch (error) {
      const statusCode = Math.max(400, Number(error && error.statusCode) || 500);
      sendJson(response, statusCode, createErrorBody(error, requestId));
    }
  };
}

module.exports = {
  createAiRoute,
  createErrorBody,
  createHttpError,
  readRequestBody,
};
