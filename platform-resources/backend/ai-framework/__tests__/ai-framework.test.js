"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter } = require("events");
const test = require("node:test");

const {
  createNormalizedRequest,
} = require("../contracts/normalized-request");
const {
  createNormalizedResponse,
} = require("../contracts/normalized-response");
const { loadProjectAssets } = require("../loaders/project-assets");
const {
  executeProjectPipeline,
} = require("../runtime/execute-project-pipeline");
const {
  createProjectAiRegistry,
} = require("../registry/project-ai-registry");
const { createAiRoute } = require("../core/create-ai-route");

function createMockResponse() {
  return {
    statusCode: 0,
    headers: null,
    body: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.body = body || "";
    },
  };
}

function createJsonRequest(body) {
  const request = new EventEmitter();
  request.method = "POST";
  request.url = "/api/test";

  process.nextTick(function emitBody() {
    if (typeof body === "string") {
      request.emit("data", body);
    } else {
      request.emit("data", JSON.stringify(body || {}));
    }
    request.emit("end");
  });

  return request;
}

test("createNormalizedRequest fills framework metadata", function () {
  const normalized = createNormalizedRequest({
    requestId: "request-1",
    platform: "magic-data",
    scriptId: "hakka-helper",
    routeKey: "review-current",
    input: {
      itemId: "row-1",
    },
    projectOptions: {
      listenModel: "qwen3.5-omni-flash",
    },
  });

  assert.equal(normalized.requestId, "request-1");
  assert.equal(normalized.platform, "magic-data");
  assert.equal(normalized.scriptId, "hakka-helper");
  assert.equal(normalized.routeKey, "review-current");
  assert.deepEqual(normalized.input, {
    itemId: "row-1",
  });
  assert.deepEqual(normalized.projectOptions, {
    listenModel: "qwen3.5-omni-flash",
  });
  assert.deepEqual(normalized.debugOptions, {});
  assert.deepEqual(normalized.runtimeContext, {});
});

test("createNormalizedResponse keeps public response fields stable", function () {
  const normalized = createNormalizedResponse({
    success: true,
    requestId: "request-2",
    platform: "data-baker",
    scriptId: "round-one-quality",
    routeKey: "recommend",
    models: {
      listenModel: "fun-asr",
    },
    usage: {
      inputTokens: 10,
    },
    notes: ["framework-ready"],
    projectResult: {
      recommendedText: "测试文本",
    },
  });

  assert.equal(normalized.success, true);
  assert.equal(normalized.requestId, "request-2");
  assert.equal(normalized.platform, "data-baker");
  assert.equal(normalized.scriptId, "round-one-quality");
  assert.equal(normalized.routeKey, "recommend");
  assert.deepEqual(normalized.models, {
    listenModel: "fun-asr",
  });
  assert.deepEqual(normalized.usage, {
    inputTokens: 10,
  });
  assert.deepEqual(normalized.notes, ["framework-ready"]);
  assert.deepEqual(normalized.projectResult, {
    recommendedText: "测试文本",
  });
});

test("loadProjectAssets supports inline and file-backed assets", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-ai-framework-"));
  const promptPath = path.join(tempDir, "prompt.md");
  fs.writeFileSync(promptPath, "# prompt", "utf8");

  const assets = loadProjectAssets(
    {
      baseDir: tempDir,
      assets: {
        prompt: {
          path: "prompt.md",
        },
        rules: {
          inline: "rule-text",
        },
      },
    },
    {}
  );

  assert.equal(assets.prompt, "# prompt");
  assert.equal(assets.rules, "rule-text");
});

test("executeProjectPipeline orchestrates adapter hooks around a runner", async function () {
  const callOrder = [];
  const result = await executeProjectPipeline({
    adapter: {
      async buildAssetsContext(normalizedRequest, assets) {
        callOrder.push("buildAssetsContext");
        return {
          input: normalizedRequest.input,
          assets,
        };
      },
      async postProcessResult(pipelineResult) {
        callOrder.push("postProcessResult");
        return Object.assign({}, pipelineResult, {
          postProcessed: true,
        });
      },
      async exposeProjectResult(postProcessed) {
        callOrder.push("exposeProjectResult");
        return {
          recommendedText: postProcessed.recommendedText,
          postProcessed: postProcessed.postProcessed,
        };
      },
    },
    normalizedRequest: createNormalizedRequest({
      platform: "data-baker",
      scriptId: "round-one-quality",
      routeKey: "recommend",
      input: {
        pageText: "你好",
      },
    }),
    assets: {
      prompt: "# prompt",
    },
    runner: async function runner(context) {
      callOrder.push("runner");
      return {
        recommendedText: context.normalizedRequest.input.pageText,
      };
    },
  });

  assert.deepEqual(callOrder, [
    "buildAssetsContext",
    "runner",
    "postProcessResult",
    "exposeProjectResult",
  ]);
  assert.deepEqual(result.projectResult, {
    recommendedText: "你好",
    postProcessed: true,
  });
});

test("createProjectAiRegistry registers and resolves adapters by projectId", function () {
  const registry = createProjectAiRegistry();
  const adapter = {
    projectId: "magic-data/hakka-helper",
  };

  registry.register(adapter);

  assert.equal(registry.get("magic-data/hakka-helper"), adapter);
  assert.deepEqual(registry.list(), [adapter]);
});

test("createAiRoute parses JSON body and returns normalized response", async function () {
  const routeHandler = createAiRoute(
    {
      projectId: "magic-data/hakka-helper",
      platform: "magic-data",
      scriptId: "hakka-helper",
      routeKey: "review-current",
      assets: {
        prompt: {
          inline: "# prompt",
        },
      },
      normalizeInput(body) {
        return {
          input: {
            pageText: body.pageText,
          },
          projectOptions: {
            compareModel: body.compareModel,
          },
        };
      },
      exposeProjectResult(pipelineResult) {
        return {
          recommendedText: pipelineResult.recommendedText,
        };
      },
    },
    {
      run(context) {
        return {
          recommendedText: context.normalizedRequest.input.pageText,
        };
      },
    }
  );

  const request = createJsonRequest({
    requestId: "request-3",
    pageText: "客家话",
    compareModel: "qwen3.5-flash",
  });
  const response = createMockResponse();

  await routeHandler({
    method: "POST",
    pathname: "/api/magic-data/hakka-helper/ai/review-current",
    query: {},
    params: {},
    request,
    response,
  });

  assert.equal(response.statusCode, 200);
  assert.ok(response.headers["Content-Type"].includes("application/json"));
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    requestId: "request-3",
    platform: "magic-data",
    scriptId: "hakka-helper",
    routeKey: "review-current",
    models: null,
    usage: null,
    timing: null,
    cache: null,
    debug: null,
    notes: [],
    projectResult: {
      recommendedText: "客家话",
    },
  });
});

test("createAiRoute returns 400 for invalid JSON", async function () {
  const routeHandler = createAiRoute({
    projectId: "data-baker/round-one-quality",
    platform: "data-baker",
    scriptId: "round-one-quality",
  });
  const request = createJsonRequest("{");
  const response = createMockResponse();

  await routeHandler({
    method: "POST",
    pathname: "/api/data-baker/round-one-quality/ai/recommend",
    query: {},
    params: {},
    request,
    response,
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), {
    success: false,
    code: "invalid-json",
    message: "请求体 JSON 解析失败。",
    requestId: "",
  });
});

test("createAiRoute supports custom success and error body builders", async function () {
  const routeHandler = createAiRoute(
    {
      projectId: "data-baker/round-one-quality",
      platform: "data-baker",
      scriptId: "round-one-quality",
      normalizeInput(body) {
        return {
          input: {
            pageText: body.pageText,
          },
        };
      },
    },
    {
      run(context) {
        if (context.normalizedRequest.input.pageText === "fail") {
          const error = new Error("custom failure");
          error.statusCode = 422;
          error.code = "custom-failure";
          throw error;
        }
        return {
          recommendedText: context.normalizedRequest.input.pageText,
        };
      },
      createSuccessBody(context) {
        return {
          success: true,
          data: context.execution.pipelineResult,
          requestId: context.normalizedRequest.requestId,
        };
      },
      createErrorBody(context) {
        return {
          success: false,
          code: context.error.code,
          message: context.error.message,
          requestId: context.requestId,
        };
      },
    }
  );

  const successRequest = createJsonRequest({
    requestId: "request-4",
    pageText: "兼容返回",
  });
  const successResponse = createMockResponse();

  await routeHandler({
    method: "POST",
    pathname: "/api/data-baker/round-one-quality/ai/recommend",
    query: {},
    params: {},
    request: successRequest,
    response: successResponse,
  });

  assert.equal(successResponse.statusCode, 200);
  assert.deepEqual(JSON.parse(successResponse.body), {
    success: true,
    data: {
      recommendedText: "兼容返回",
    },
    requestId: "request-4",
  });

  const failRequest = createJsonRequest({
    requestId: "request-5",
    pageText: "fail",
  });
  const failResponse = createMockResponse();

  await routeHandler({
    method: "POST",
    pathname: "/api/data-baker/round-one-quality/ai/recommend",
    query: {},
    params: {},
    request: failRequest,
    response: failResponse,
  });

  assert.equal(failResponse.statusCode, 422);
  assert.deepEqual(JSON.parse(failResponse.body), {
    success: false,
    code: "custom-failure",
    message: "custom failure",
    requestId: "request-5",
  });
});
