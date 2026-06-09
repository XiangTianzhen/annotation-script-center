"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const jobClient = require("./ai-job-client.js");

function createAbortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

test("runJobLifecycle aborts before create request completes when external signal is cancelled", async function () {
  const controller = new AbortController();
  let sawSignal = false;

  const lifecyclePromise = jobClient.runJobLifecycle({
    endpoint: "https://example.com/api/magic-data/hakka-helper/ai/review-current",
    timeoutMs: 1000,
    signal: controller.signal,
    fetchImpl: function (_url, requestInit) {
      sawSignal = requestInit?.signal === controller.signal;
      return new Promise(function (_resolve, reject) {
        requestInit?.signal?.addEventListener(
          "abort",
          function () {
            reject(createAbortError());
          },
          { once: true }
        );
      });
    },
  });

  controller.abort();

  await assert.rejects(lifecyclePromise, function (error) {
    assert.equal(sawSignal, true);
    assert.equal(error?.code, "user-aborted");
    assert.equal(error?.phase, "create");
    return true;
  });
});

test("runJobLifecycle aborts during poll delay before issuing the next poll request", async function () {
  const controller = new AbortController();
  let fetchCount = 0;

  const lifecyclePromise = jobClient.runJobLifecycle({
    endpoint: "https://example.com/api/magic-data/hakka-helper/ai/review-current",
    timeoutMs: 1000,
    pollIntervalMs: 200,
    signal: controller.signal,
    fetchImpl: async function () {
      fetchCount += 1;
      return {
        ok: true,
        async text() {
          return JSON.stringify({
            success: true,
            jobId: "job-1",
            status: "running",
          });
        },
      };
    },
  });

  await new Promise(function (resolve) {
    setTimeout(resolve, 20);
  });
  controller.abort();

  await assert.rejects(lifecyclePromise, function (error) {
    assert.equal(error?.code, "user-aborted");
    assert.equal(error?.phase, "poll");
    assert.equal(fetchCount, 1);
    return true;
  });
});
