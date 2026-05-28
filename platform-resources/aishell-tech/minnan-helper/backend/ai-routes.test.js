"use strict";

const assert = require("assert");
const EventEmitter = require("events");
const test = require("node:test");

const { createRecommendRouteRuntime } = require("./ai-routes");

function createFakeRequest(body) {
  const request = new EventEmitter();
  request.destroyed = false;
  request.destroy = function destroy() {
    request.destroyed = true;
  };
  setImmediate(function emitBody() {
    request.emit("data", Buffer.from(JSON.stringify(body || {}), "utf8"));
    request.emit("end");
  });
  return request;
}

function createFakeRequestWithCloseAfterEnd(body) {
  const request = createFakeRequest(body);
  setImmediate(function emitClose() {
    request.emit("close");
  });
  return request;
}

function createFakeResponse() {
  const response = new EventEmitter();
  response.destroyed = false;
  response.writableEnded = false;
  response.writableFinished = false;
  response.headers = null;
  response.statusCode = 0;
  response.payload = null;
  response.writeHead = function writeHead(statusCode, headers) {
    response.statusCode = statusCode;
    response.headers = headers;
  };
  response.end = function end(payload) {
    response.payload = payload;
  };
  return response;
}

function createNormalizedRequest() {
  return {
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "平台参考文本",
    existingMarkText: "",
    duration: 10,
    modelMode: "two_stage",
    recognitionStrategy: "mandarin_to_dialect",
    pipelineMode: "qwen_omni_compare",
    listenModel: "qwen3.5-omni-flash",
    compareModel: "qwen3.5-plus",
    singleModel: "",
    aiOptions: {
      listenPrompt: "listen",
      comparePrompt: "compare",
    },
  };
}

test("Aishell ai-routes writes success cache and log only after response finish", async function () {
  const logs = [];
  const cacheWrites = [];
  const runtime = createRecommendRouteRuntime({
    appendAishellAiCallLogSafe: function appendAishellAiCallLogSafe(entry) {
      logs.push(entry);
      return entry;
    },
    buildRecommendCacheKey: function buildRecommendCacheKey() {
      return "cache-key-1";
    },
    buildRecommendSuccessBody: function buildRecommendSuccessBody(result) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    },
    createRequestId: function createRequestId() {
      return "server-request-1";
    },
    getCachedRecommendResult: function getCachedRecommendResult() {
      return null;
    },
    normalizeRecommendRequest: function normalizeRecommendRequest() {
      return createNormalizedRequest();
    },
    parseTimeoutMs: function parseTimeoutMs() {
      return 120000;
    },
    pipeline: {
      run: async function run() {
        return {
          data: {
            taskItemId: "item-1",
            recommendedText: "推荐文本",
          },
          meta: {
            requestId: "client-request-1",
            stage: "complete",
            cache: {
              hit: false,
              sourceRequestId: "",
            },
          },
        };
      },
    },
    sendJson: function sendJson(response, statusCode, body) {
      response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify(body));
      response.writableEnded = true;
      response.writableFinished = true;
      response.emit("finish");
    },
    setCachedRecommendResult: function setCachedRecommendResult(key, value) {
      cacheWrites.push({ key, value });
    },
  });

  const request = createFakeRequest({
    requestId: "client-request-1",
  });
  const response = createFakeResponse();
  await runtime.handleRecommend({ request, response });

  assert.equal(response.statusCode, 200);
  assert.equal(cacheWrites.length, 1);
  assert.equal(cacheWrites[0].key, "cache-key-1");
  assert.equal(cacheWrites[0].value.data.recommendedText, "推荐文本");
  assert.equal(logs.length, 1);
  assert.equal(Boolean(logs[0].result), true);
  assert.equal(Boolean(logs[0].error), false);
});

test("Aishell ai-routes does not write success cache when response closes early", async function () {
  const logs = [];
  const cacheWrites = [];
  const runtime = createRecommendRouteRuntime({
    appendAishellAiCallLogSafe: function appendAishellAiCallLogSafe(entry) {
      logs.push(entry);
      return entry;
    },
    buildRecommendCacheKey: function buildRecommendCacheKey() {
      return "cache-key-2";
    },
    buildRecommendErrorBody: function buildRecommendErrorBody(payload) {
      return {
        success: false,
        error: {
          code: payload.error.code,
        },
        meta: payload.error.meta || {},
      };
    },
    buildRecommendSuccessBody: function buildRecommendSuccessBody(result) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    },
    createRequestId: function createRequestId() {
      return "server-request-2";
    },
    getCachedRecommendResult: function getCachedRecommendResult() {
      return null;
    },
    normalizeRecommendRequest: function normalizeRecommendRequest() {
      return createNormalizedRequest();
    },
    parseTimeoutMs: function parseTimeoutMs() {
      return 120000;
    },
    pipeline: {
      run: async function run() {
        return {
          data: {
            taskItemId: "item-1",
            recommendedText: "推荐文本",
          },
          meta: {
            requestId: "client-request-2",
            stage: "complete",
            cache: {
              hit: false,
              sourceRequestId: "",
            },
          },
        };
      },
    },
    sendJson: function sendJson(response, statusCode, body) {
      response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify(body));
      response.destroyed = true;
      response.writableEnded = false;
      response.writableFinished = false;
      response.emit("close");
    },
    setCachedRecommendResult: function setCachedRecommendResult(key, value) {
      cacheWrites.push({ key, value });
    },
  });

  const request = createFakeRequest({
    requestId: "client-request-2",
  });
  const response = createFakeResponse();
  await runtime.handleRecommend({ request, response });

  assert.equal(response.statusCode, 200);
  assert.equal(cacheWrites.length, 0);
  assert.equal(logs.length, 1);
  assert.equal(Boolean(logs[0].result), false);
  assert.equal(logs[0].error.code, "client-disconnected");
  assert.equal(logs[0].error.stage, "post_process");
});

test("Aishell ai-routes should not treat request close after body end as client disconnect", async function () {
  const logs = [];
  const runtime = createRecommendRouteRuntime({
    appendAishellAiCallLogSafe: function appendAishellAiCallLogSafe(entry) {
      logs.push(entry);
      return entry;
    },
    buildRecommendCacheKey: function buildRecommendCacheKey() {
      return "cache-key-3";
    },
    buildRecommendErrorBody: function buildRecommendErrorBody(payload) {
      return {
        success: false,
        error: {
          code: payload.error.code,
        },
        meta: payload.error.meta || {},
      };
    },
    buildRecommendSuccessBody: function buildRecommendSuccessBody(result) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    },
    createRequestId: function createRequestId() {
      return "server-request-3";
    },
    getCachedRecommendResult: function getCachedRecommendResult() {
      return null;
    },
    normalizeRecommendRequest: function normalizeRecommendRequest() {
      return createNormalizedRequest();
    },
    parseTimeoutMs: function parseTimeoutMs() {
      return 120000;
    },
    pipeline: {
      run: async function run() {
        await new Promise(function (resolve) {
          setTimeout(resolve, 5);
        });
        return {
          data: {
            taskItemId: "item-1",
            recommendedText: "推荐文本",
          },
          meta: {
            requestId: "client-request-3",
            stage: "complete",
            cache: {
              hit: false,
              sourceRequestId: "",
            },
          },
        };
      },
    },
    sendJson: function sendJson(response, statusCode, body) {
      response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify(body));
      response.writableEnded = true;
      response.writableFinished = true;
      response.emit("finish");
    },
    setCachedRecommendResult: function setCachedRecommendResult() {},
  });

  const request = createFakeRequestWithCloseAfterEnd({
    requestId: "client-request-3",
  });
  const response = createFakeResponse();
  await runtime.handleRecommend({ request, response });

  assert.equal(response.statusCode, 200);
  assert.equal(logs.length, 1);
  assert.equal(Boolean(logs[0].result), true);
  assert.equal(Boolean(logs[0].error), false);
});
