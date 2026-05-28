"use strict";

const crypto = require("crypto");

const { sendJson: defaultSendJson } = require("../../../backend/response");
const {
  assertAiUsageOperatorName,
  buildAiCallLogSummaryPayload,
} = require("../../../backend/ai-call-log");
const {
  aiCallLogger: defaultAiCallLogger,
  appendAishellAiCallLogSafe: defaultAppendAishellAiCallLogSafe,
} = require("../data/ai-call-log");
const {
  buildRecommendCacheKey: defaultBuildRecommendCacheKey,
  getCachedRecommendResult: defaultGetCachedRecommendResult,
  setCachedRecommendResult: defaultSetCachedRecommendResult,
} = require("./cache");
const { parseTimeoutMs: defaultParseTimeoutMs } = require("./config");
const {
  createClientDisconnectedError: defaultCreateClientDisconnectedError,
  normalizeLifecycleAbort: defaultNormalizeLifecycleAbort,
} = require("./errors");
const { createRecommendPipeline: defaultCreateRecommendPipeline } = require("./pipeline");
const {
  buildRecommendErrorBody: defaultBuildRecommendErrorBody,
  buildRecommendSuccessBody: defaultBuildRecommendSuccessBody,
  createDefaultsPayload: defaultCreateDefaultsPayload,
  createHealthPayload: defaultCreateHealthPayload,
  normalizeRecommendRequest: defaultNormalizeRecommendRequest,
  SCRIPT_ID,
} = require("./ai-service");

const AI_BASE_PATH = "/api/aishell-tech/minnan-helper/ai/recommend";
const AI_HEALTH_PATH = AI_BASE_PATH + "/health";
const AI_DEFAULTS_PATH = AI_BASE_PATH + "/defaults";
const AI_LOG_SUMMARY_PATH = AI_BASE_PATH + "/logs/summary";
const MAX_BODY_BYTES = 3 * 1024 * 1024;

function createRequestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = String(code || "request-failed");
  return error;
}

function readRequestBody(request, signal, normalizeLifecycleAbortFn) {
  return new Promise(function (resolve, reject) {
    if (signal && signal.aborted === true) {
      reject(normalizeLifecycleAbortFn(signal.reason, { stage: "queue" }));
      return;
    }
    let body = "";
    const onAbort = function () {
      cleanup();
      reject(normalizeLifecycleAbortFn(signal.reason, { stage: "queue" }));
      try {
        request.destroy();
      } catch (_error) {
        // Ignore destroy failure.
      }
    };
    const onData = function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        cleanup();
        const error = createHttpError(413, "请求体超过 3MB。", "payload-too-large");
        reject(error);
        request.destroy();
      }
    };
    const onEnd = function () {
      cleanup();
      resolve(body);
    };
    const onError = function (error) {
      cleanup();
      reject(error);
    };

    function cleanup() {
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onError);
      if (signal && typeof signal.removeEventListener === "function") {
        signal.removeEventListener("abort", onAbort);
      }
    }

    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
    if (signal && typeof signal.addEventListener === "function") {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function createLifecycleController(request, response, timeoutMs, requestId, createClientDisconnectedErrorFn) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  if (!controller) {
    return {
      signal: null,
      cleanup: function cleanup() {},
    };
  }
  let completed = false;
  const timer = setTimeout(function () {
    if (completed) {
      return;
    }
    controller.abort({
      code: "aborted",
      statusCode: 504,
      message: "当前同步请求超过 60s，已取消。",
      requestId,
    });
  }, Math.max(1000, Number(timeoutMs) || 60000));

  const onRequestClosed = function () {
    if (completed || response.writableEnded === true) {
      return;
    }
    controller.abort(createClientDisconnectedErrorFn(requestId, { requestId }));
  };

  request.on("aborted", onRequestClosed);
  response.on("close", onRequestClosed);

  return {
    signal: controller.signal,
    cleanup: function cleanup() {
      completed = true;
      clearTimeout(timer);
      request.off("aborted", onRequestClosed);
      response.off("close", onRequestClosed);
    },
  };
}

function waitForResponseOutcome(response) {
  return new Promise(function (resolve) {
    let settled = false;
    const finish = function (outcome) {
      if (settled) {
        return;
      }
      settled = true;
      response.off("finish", onFinish);
      response.off("close", onClose);
      response.off("error", onError);
      resolve(outcome);
    };
    const onFinish = function () {
      finish("finish");
    };
    const onClose = function () {
      finish(response.writableFinished === true ? "finish" : "close");
    };
    const onError = function () {
      finish("error");
    };
    response.on("finish", onFinish);
    response.on("close", onClose);
    response.on("error", onError);
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

function buildCacheKeyParts(request) {
  return {
    taskItemId: request.taskItemId,
    audioUrl: request.audioUrl,
    referenceText: request.referenceText,
    modelMode: request.modelMode,
    recognitionStrategy: request.recognitionStrategy,
    pipelineMode: request.pipelineMode,
    listenModel: request.listenModel,
    compareModel: request.compareModel,
    singleModel: request.singleModel,
    listenPrompt: request.aiOptions?.listenPrompt,
    comparePrompt: request.aiOptions?.comparePrompt,
  };
}

function buildCachedSuccessResult(cachedResult, requestId) {
  const result = cloneJson(cachedResult || {});
  const originalRequestId = normalizeText(result?.meta?.requestId);
  result.meta = Object.assign({}, result.meta || {}, {
    requestId,
    stage: normalizeText(result?.meta?.stage || "complete") || "complete",
    cache: Object.assign({}, result?.meta?.cache || {}, {
      hit: true,
      sourceRequestId: originalRequestId,
    }),
  });
  return result;
}

function createRecommendRouteRuntime(overrides) {
  const deps = Object.assign(
    {
      aiCallLogger: defaultAiCallLogger,
      appendAishellAiCallLogSafe: defaultAppendAishellAiCallLogSafe,
      buildRecommendCacheKey: defaultBuildRecommendCacheKey,
      buildRecommendErrorBody: defaultBuildRecommendErrorBody,
      buildRecommendSuccessBody: defaultBuildRecommendSuccessBody,
      createClientDisconnectedError: defaultCreateClientDisconnectedError,
      createDefaultsPayload: defaultCreateDefaultsPayload,
      createHealthPayload: defaultCreateHealthPayload,
      createRecommendPipeline: defaultCreateRecommendPipeline,
      createRequestId,
      getCachedRecommendResult: defaultGetCachedRecommendResult,
      normalizeLifecycleAbort: defaultNormalizeLifecycleAbort,
      normalizeRecommendRequest: defaultNormalizeRecommendRequest,
      parseTimeoutMs: defaultParseTimeoutMs,
      sendJson: defaultSendJson,
      setCachedRecommendResult: defaultSetCachedRecommendResult,
    },
    overrides || {}
  );
  const pipeline = deps.pipeline && typeof deps.pipeline.run === "function"
    ? deps.pipeline
    : deps.createRecommendPipeline();

  function appendSuccessLog(requestId, normalizedRequest, result) {
    deps.appendAishellAiCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      normalizedRequest,
      result,
    });
  }

  function appendErrorLog(requestId, normalizedRequest, error) {
    deps.appendAishellAiCallLogSafe({
      createdAt: new Date().toISOString(),
      requestId,
      normalizedRequest,
      error,
    });
  }

  async function handleRecommend(routeContext) {
    const context = routeContext && typeof routeContext === "object" ? routeContext : {};
    const request = context.request;
    const response = context.response;
    let requestId = deps.createRequestId();
    let normalizedRequest = null;
    const timeoutMs = deps.parseTimeoutMs();
    const lifecycle = createLifecycleController(
      request,
      response,
      timeoutMs,
      requestId,
      deps.createClientDisconnectedError
    );

    try {
      const rawBody = await readRequestBody(request, lifecycle.signal, deps.normalizeLifecycleAbort);
      let body = {};
      try {
        body = JSON.parse(rawBody || "{}");
      } catch (_error) {
        throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
      }
      requestId = normalizeText(body.requestId) || requestId;
      assertAiUsageOperatorName(body);
      normalizedRequest = deps.normalizeRecommendRequest(body);

      const cacheKey = deps.buildRecommendCacheKey(buildCacheKeyParts(normalizedRequest));
      const cachedResult = deps.getCachedRecommendResult(cacheKey);
      if (cachedResult) {
        const responseBody = deps.buildRecommendSuccessBody(
          buildCachedSuccessResult(cachedResult, requestId)
        );
        const outcomePromise = waitForResponseOutcome(response);
        deps.sendJson(response, 200, responseBody);
        const outcome = await outcomePromise;
        if (outcome === "finish") {
          appendSuccessLog(requestId, normalizedRequest, responseBody.data ? {
            data: responseBody.data,
            meta: responseBody.meta,
          } : cachedResult);
        }
        return;
      }

      const pipelineResult = await pipeline.run(normalizedRequest, {
        requestId,
        timeoutMs,
        signal: lifecycle.signal,
        startedAtMs: Date.now(),
      });
      const responseBody = deps.buildRecommendSuccessBody(pipelineResult);
      const outcomePromise = waitForResponseOutcome(response);
      deps.sendJson(response, 200, responseBody);
      const outcome = await outcomePromise;
      if (outcome === "finish" && lifecycle.signal?.aborted !== true) {
        deps.setCachedRecommendResult(cacheKey, {
          data: responseBody.data,
          meta: Object.assign({}, responseBody.meta, {
            cache: Object.assign({}, responseBody.meta.cache || {}, {
              hit: false,
              sourceRequestId: "",
            }),
          }),
        });
        appendSuccessLog(requestId, normalizedRequest, {
          data: responseBody.data,
          meta: responseBody.meta,
        });
        return;
      }
      appendErrorLog(
        requestId,
        normalizedRequest,
        deps.createClientDisconnectedError(requestId, {
          requestId,
          stage: "post_process",
          cancelled: true,
        })
      );
    } catch (error) {
      const statusCode = Math.max(400, Number(error?.statusCode || error?.providerStatus || 500));
      error.requestId = normalizeText(error?.requestId || requestId);
      if (!error.meta || typeof error.meta !== "object") {
        error.meta = {
          requestId,
        };
      }
      appendErrorLog(requestId, normalizedRequest, error);
      if (response.destroyed === true || lifecycle.signal?.aborted === true && statusCode === 499) {
        return;
      }
      deps.sendJson(response, statusCode, deps.buildRecommendErrorBody({
        error,
        requestId,
      }));
    } finally {
      lifecycle.cleanup();
    }
  }

  function registerAiRoutes(router) {
    router.get(AI_HEALTH_PATH, function ({ response }) {
      deps.sendJson(response, 200, deps.createHealthPayload());
    });

    router.get(AI_DEFAULTS_PATH, function ({ response }) {
      deps.sendJson(response, 200, deps.createDefaultsPayload());
    });

    router.post(AI_BASE_PATH, function (routeContext) {
      return handleRecommend(routeContext);
    });
    router.get(AI_LOG_SUMMARY_PATH, function ({ response, query }) {
      deps.sendJson(
        response,
        200,
        buildAiCallLogSummaryPayload({
          service: "aishell-tech-minnan-helper-ai-recommend",
          scriptId: SCRIPT_ID,
          logger: deps.aiCallLogger,
          query,
        })
      );
    });
  }

  return {
    handleRecommend,
    registerAiRoutes,
  };
}

const defaultRouteRuntime = createRecommendRouteRuntime();
const handleRecommend = defaultRouteRuntime.handleRecommend;
const registerAiRoutes = defaultRouteRuntime.registerAiRoutes;

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  AI_LOG_SUMMARY_PATH,
  createRecommendRouteRuntime,
  handleRecommend,
  registerAiRoutes,
};
