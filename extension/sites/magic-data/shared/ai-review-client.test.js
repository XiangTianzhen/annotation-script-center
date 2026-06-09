"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SCRIPT_PATH = path.join(__dirname, "ai-review-client.js");
const SCRIPT_SOURCE = fs.readFileSync(SCRIPT_PATH, "utf8");

function loadClientRuntime(options) {
  const config = options && typeof options === "object" ? options : {};
  const runtimeContext = {
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch:
      typeof config.fetch === "function"
        ? config.fetch
        : async function () {
            throw new Error("fetch should not be called in this test");
          },
    chrome: {
      runtime: {
        id: "test-extension",
        getManifest() {
          return {
            version: "0.4.0-test",
          };
        },
      },
    },
    ASREdgeStorage: {
      async getSettings() {
        return {
          meta: {
            aiUsageOperatorName: "tester",
          },
        };
      },
    },
    ASREdgeAiJobClient: config.jobClient,
    globalThis: null,
  };
  runtimeContext.globalThis = runtimeContext;
  vm.runInNewContext(SCRIPT_SOURCE, runtimeContext, {
    filename: SCRIPT_PATH,
  });
  return runtimeContext.__ASREdgeMagicDataAnnotatorAiReviewClient;
}

test("reviewCurrent unwraps succeeded job payload to the normalized review result", async function () {
  const expectedData = {
    requestId: "req-1",
    reviewConclusion: "pass",
    shouldReview: false,
    recommendations: {
      summary: "所有字段检查通过。",
    },
  };
  const client = loadClientRuntime({
    jobClient: {
      async runJobLifecycle(input) {
        const fakeJobBody = {
          success: true,
          status: "succeeded",
          data: {
            success: true,
            data: expectedData,
          },
        };
        return {
          data: input.mapSuccess(fakeJobBody),
        };
      },
    },
  });

  const result = await client.reviewCurrent(
    {
      taskItemId: "170384861",
      audioUrl: "https://example.com/audio.wav",
      clientVersion: "0.4.0-test",
    },
    {
      timeoutMs: 5000,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
    }
  );

  assert.equal(result.data.reviewConclusion, "pass");
  assert.equal(result.data.shouldReview, false);
  assert.equal(result.data.recommendations.summary, "所有字段检查通过。");
  assert.deepEqual(result.data, expectedData);
});

test("reviewCurrent maps job cancellation to user-aborted when external signal is aborted", async function () {
  const controller = new AbortController();
  const client = loadClientRuntime({
    jobClient: {
      async runJobLifecycle(input) {
        assert.equal(input.signal, controller.signal);
        return new Promise(function (_resolve, reject) {
          if (input.signal.aborted) {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
            return;
          }
          input.signal.addEventListener(
            "abort",
            function () {
              const error = new Error("Aborted");
              error.name = "AbortError";
              reject(error);
            },
            { once: true }
          );
        });
      },
    },
  });

  const pending = client.reviewCurrent(
    {
      taskItemId: "170384861",
      audioUrl: "https://example.com/audio.wav",
      clientVersion: "0.4.0-test",
    },
    {
      timeoutMs: 5000,
      signal: controller.signal,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
    }
  );

  setTimeout(function () {
    controller.abort();
  }, 10);

  await assert.rejects(pending, function (error) {
    assert.equal(error?.code, "user-aborted");
    return true;
  });
});

test("reviewCurrent maps fetch cancellation to user-aborted when external signal is aborted", async function () {
  const controller = new AbortController();
  let sawSignal = false;
  const client = loadClientRuntime({
    fetch: function (_url, requestInit) {
      sawSignal = Boolean(requestInit?.signal && typeof requestInit.signal.addEventListener === "function");
      return new Promise(function (_resolve, reject) {
        if (requestInit?.signal?.aborted) {
          const error = new Error("Aborted");
          error.name = "AbortError";
          reject(error);
          return;
        }
        requestInit?.signal?.addEventListener(
          "abort",
          function () {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          },
          { once: true }
        );
      });
    },
  });

  const pending = client.reviewCurrent(
    {
      taskItemId: "170384861",
      audioUrl: "https://example.com/audio.wav",
      clientVersion: "0.4.0-test",
    },
    {
      timeoutMs: 5000,
      signal: controller.signal,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
    }
  );

  controller.abort();

  await assert.rejects(pending, function (error) {
    assert.equal(error?.code, "user-aborted");
    return true;
  });
}, {
  timeout: 2000,
});
