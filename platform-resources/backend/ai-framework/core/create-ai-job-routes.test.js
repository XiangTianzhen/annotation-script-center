"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  createAiJobStore,
} = require("../runtime/ai-job-store");
const {
  createAiJobRouteHandlers,
} = require("./create-ai-job-routes");

function createRequest(body) {
  return {
    on(eventName, handler) {
      if (eventName === "data") {
        handler(Buffer.from(body, "utf8"));
        return;
      }
      if (eventName === "end") {
        process.nextTick(handler);
      }
    },
    destroy() {},
  };
}

function createResponse() {
  return {
    statusCode: 0,
    body: "",
    headers: {},
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers || {};
    },
    end(body) {
      this.body = String(body || "");
    },
  };
}

test("createAiJobRouteHandlers creates a job and exposes succeeded result", async function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 60000,
    timeoutMs: 60000,
    maxSize: 10,
    pollIntervalMs: 1000,
  });
  const handlers = createAiJobRouteHandlers(
    {
      platform: "magic-data",
      scriptId: "magicDataMinnanAssistant",
      routeKey: "review-current",
    },
    {
      jobStore: store,
      run() {
        return {
          data: {
            recommendedText: "测试结果",
          },
        };
      },
      createSuccessBody() {
        return {
          success: true,
          data: {
            recommendedText: "测试结果",
          },
        };
      },
      createErrorBody(context) {
        return {
          success: false,
          code: context?.error?.code || "request-error",
          message: context?.error?.message || "失败",
        };
      },
    }
  );

  const createResponseNode = createResponse();
  await handlers.handleCreateJob({
    pathname: "/api/magic-data/minnan-helper/ai/review-current/jobs",
    request: createRequest(
      JSON.stringify({
        requestId: "req-job-1",
        aiUsageOperatorName: "张三",
        taskItemId: "TASK-1",
      })
    ),
    response: createResponseNode,
  });

  const createBody = JSON.parse(createResponseNode.body);
  assert.equal(createResponseNode.statusCode, 202);
  assert.equal(createBody.status, "pending");
  assert.ok(createBody.jobId);

  await new Promise(function (resolve) {
    setTimeout(resolve, 10);
  });

  const detailResponse = createResponse();
  await handlers.handleGetJobStatus({
    response: detailResponse,
    params: {
      jobId: createBody.jobId,
    },
  });

  const detailBody = JSON.parse(detailResponse.body);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(detailBody.status, "succeeded");
  assert.deepEqual(detailBody.data, {
    success: true,
    data: {
      recommendedText: "测试结果",
    },
  });
});
