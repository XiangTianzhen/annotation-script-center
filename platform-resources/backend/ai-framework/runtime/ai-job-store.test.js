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

test("ai job store evicts oldest terminal jobs before rejecting new jobs", function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 60000,
    timeoutMs: 60000,
    maxSize: 2,
    pollIntervalMs: 1000,
  });

  const firstJob = store.createJob({
    requestId: "req-evict-1",
    routeKey: "review-current",
  });
  store.markJobSucceeded(firstJob.jobId, {
    responseBody: {
      success: true,
      data: {
        recommendedText: "first",
      },
    },
  });

  const secondJob = store.createJob({
    requestId: "req-evict-2",
    routeKey: "review-current",
  });
  store.markJobFailed(secondJob.jobId, {
    errorBody: {
      success: false,
      code: "provider-http-error",
      message: "second failed",
    },
  });

  const thirdJob = store.createJob({
    requestId: "req-evict-3",
    routeKey: "review-current",
  });

  assert.equal(thirdJob.status, "pending");
  assert.throws(function () {
    store.getJob(firstJob.jobId);
  }, /后端任务不存在或已过期/);
  assert.equal(store.getJob(secondJob.jobId).status, "failed");

  store.markJobFailed(thirdJob.jobId, {
    errorBody: {
      success: false,
      code: "cleanup",
      message: "cleanup",
    },
  });
});

test("ai job store snapshot exposes capacity usage", function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 60000,
    timeoutMs: 60000,
    maxSize: 3,
    pollIntervalMs: 1000,
  });

  const pendingJob = store.createJob({
    requestId: "req-snapshot-1",
    routeKey: "review-current",
  });
  const runningJob = store.createJob({
    requestId: "req-snapshot-2",
    routeKey: "review-current",
  });
  store.markJobRunning(runningJob.jobId);
  const succeededJob = store.createJob({
    requestId: "req-snapshot-3",
    routeKey: "review-current",
  });
  store.markJobSucceeded(succeededJob.jobId, {
    responseBody: {
      success: true,
      data: {
        recommendedText: "done",
      },
    },
  });

  const snapshot = store.getSnapshot();

  assert.equal(snapshot.pendingCount, 1);
  assert.equal(snapshot.runningCount, 1);
  assert.equal(snapshot.succeededCount, 1);
  assert.equal(snapshot.usedCount, 3);
  assert.equal(snapshot.availableCount, 0);
  assert.equal(snapshot.isFull, true);
  assert.equal(snapshot.utilizationPercent, 100);
  assert.equal(snapshot.capacity, 3);
  assert.equal(pendingJob.status, "pending");

  store.markJobFailed(pendingJob.jobId, {
    errorBody: {
      success: false,
      code: "cleanup",
      message: "cleanup",
    },
  });
  store.markJobFailed(runningJob.jobId, {
    errorBody: {
      success: false,
      code: "cleanup",
      message: "cleanup",
    },
  });
});
