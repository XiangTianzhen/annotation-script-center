"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createRuntime } = require("./ai-recommendation.js");

function createFetchOk(payload) {
  return async function fetchOk() {
    return {
      ok: true,
      status: 200,
      json: async function () {
        return payload;
      },
    };
  };
}

test("Aishell ai-recommendation retries server endpoint after local fetch failure", async function () {
  const calls = [];
  const runtime = createRuntime({
    endpoint: "http://127.0.0.1:3333/api/aishell-tech/minnan-helper/ai/recommend",
    settings: {
      meta: {
        aiUsageOperatorName: "张三",
        backendEndpointMode: "local",
      },
    },
    fetchImpl: async function fetchImpl(url) {
      calls.push(String(url || ""));
      if (calls.length === 1) {
        throw new TypeError("Failed to fetch");
      }
      return createFetchOk({
        success: true,
        data: {
          recommendedText: "阮爱你。",
          debug: {},
        },
      }).apply(null, arguments);
    },
  });

  const result = await runtime.recommend({
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "我爱你。",
  });

  assert.deepEqual(calls, [
    "http://127.0.0.1:3333/api/aishell-tech/minnan-helper/ai/recommend",
    "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend",
  ]);
  assert.equal(result.debug.clientBackendMode, "server");
  assert.equal(result.debug.clientFallbackUsed, true);
  assert.equal(
    result.debug.clientBackendEndpoint,
    "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend"
  );
});

test("Aishell ai-recommendation exposes endpoint details for network failures", async function () {
  const runtime = createRuntime({
    endpoint: "http://127.0.0.1:3333/api/aishell-tech/minnan-helper/ai/recommend",
    settings: {
      meta: {
        aiUsageOperatorName: "张三",
        backendEndpointMode: "local",
      },
    },
    fetchImpl: async function fetchImpl() {
      throw new TypeError("Failed to fetch");
    },
  });

  await assert.rejects(
    runtime.recommend({
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "clip-1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "我爱你。",
    }),
    function (error) {
      assert.equal(
        error.message,
        "本机后端连接失败，且回退服务器接口也失败。请检查本机服务是否启动，或在 options 首页把后端接口地址切回服务器。"
      );
      assert.equal(error.code, "network-disconnected");
      assert.equal(error.rawResponse.backendMode, "local");
      assert.equal(error.rawResponse.endpoint, "http://127.0.0.1:3333/api/aishell-tech/minnan-helper/ai/recommend");
      assert.equal(error.rawResponse.fallbackEndpoint, "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend");
      assert.equal(error.rawResponse.originalErrorName, "TypeError");
      assert.match(String(error.rawResponse.originalErrorMessage || ""), /Failed to fetch/);
      return true;
    }
  );
});

test("Aishell ai-recommendation reports extension context invalidated explicitly", async function () {
  const runtime = createRuntime({
    endpoint: "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend",
    settings: {
      meta: {
        aiUsageOperatorName: "张三",
        backendEndpointMode: "server",
      },
    },
    fetchImpl: async function fetchImpl() {
      throw new TypeError("Extension context invalidated.");
    },
  });

  await assert.rejects(
    runtime.recommend({
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "clip-1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "我爱你。",
    }),
    function (error) {
      assert.equal(error.code, "extension-context-invalidated");
      assert.equal(error.message, "扩展上下文已失效，请刷新当前业务页面后重试。");
      assert.equal(error.rawResponse.backendMode, "server");
      assert.equal(error.rawResponse.endpoint, "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend");
      return true;
    }
  );
});

test("Aishell ai-recommendation probes health when server-mode recommend fetch fails", async function () {
  const calls = [];
  const runtime = createRuntime({
    endpoint: "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend",
    settings: {
      meta: {
        aiUsageOperatorName: "张三",
        backendEndpointMode: "server",
      },
    },
    fetchImpl: async function fetchImpl(url) {
      calls.push(String(url || ""));
      if (String(url || "").indexOf("/health") >= 0) {
        return {
          ok: true,
          status: 200,
          json: async function () {
            return {
              success: true,
            };
          },
        };
      }
      throw new TypeError("Failed to fetch");
    },
  });

  await assert.rejects(
    runtime.recommend({
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "clip-1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "我爱你。",
    }),
    function (error) {
      assert.equal(
        error.message,
        "服务器 health 可达，但 AI recommend 请求在网络层被中断。请检查 Nginx 反向代理、PM2 进程状态和后端日志。"
      );
      assert.deepEqual(calls, [
        "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend",
        "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend/health",
      ]);
      assert.equal(error.rawResponse.backendMode, "server");
      assert.equal(error.rawResponse.healthCheck.ok, true);
      assert.equal(error.rawResponse.healthCheck.statusCode, 200);
      return true;
    }
  );
});
