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
    fetch: async function () {
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
