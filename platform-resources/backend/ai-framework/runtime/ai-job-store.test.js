"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  createAiJobStore,
} = require("./ai-job-store");

test("ai job store creates a pending job and exposes status/debug hooks", function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 60000,
    timeoutMs: 60000,
    maxSize: 10,
    pollIntervalMs: 1000,
  });

  const job = store.createJob({
    requestId: "req-1",
    routeKey: "review-current",
    itemId: "ITEM-1",
  });

  assert.equal(job.status, "pending");
  assert.equal(job.requestId, "req-1");
  assert.equal(job.routeKey, "review-current");

  const signal = store.getJobSignal(job.jobId);
  assert.ok(signal);
  assert.equal(signal.aborted, false);

  store.markJobRunning(job.jobId);
  const running = store.getJob(job.jobId);
  assert.equal(running.status, "running");

  store.markJobSucceeded(job.jobId, {
    responseBody: {
      success: true,
      data: {
        recommendedText: "测试文本",
      },
    },
  });
  const succeeded = store.getJob(job.jobId);
  assert.equal(succeeded.status, "succeeded");
  assert.deepEqual(succeeded.responseBody, {
    success: true,
    data: {
      recommendedText: "测试文本",
    },
  });
});

test("ai job store preserves failure debug payload and expires old jobs", function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 10,
    timeoutMs: 60000,
    maxSize: 10,
    pollIntervalMs: 1000,
    now() {
      return 1000;
    },
  });

  const job = store.createJob({
    requestId: "req-2",
    routeKey: "suggest-current",
  });

  store.markJobFailed(job.jobId, {
    errorBody: {
      success: false,
      code: "provider-http-error",
      message: "模型失败",
    },
    debugPayload: {
      rawAiDebug: {
        message: "debug",
      },
    },
  });

  const failed = store.getJob(job.jobId);
  assert.equal(failed.status, "failed");
  assert.deepEqual(store.getJobDebug(job.jobId), {
    rawAiDebug: {
      message: "debug",
    },
  });

  store.cleanupExpired(2000);
  const expired = store.getJob(job.jobId);
  assert.equal(expired.status, "expired");
});
