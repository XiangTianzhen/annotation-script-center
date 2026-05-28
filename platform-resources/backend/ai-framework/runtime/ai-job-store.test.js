"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  createAiJobStore,
  getDefaultAiJobStoreConfig,
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

test("ai job store only applies 60s timeout after a job starts running", function () {
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 60000,
    timeoutMs: 60000,
    maxSize: 10,
    pollIntervalMs: 1000,
  });

  const job = store.createJob({
    requestId: "req-running-timeout",
    routeKey: "review-current",
  });

  store.handleTimeout(job.jobId);
  assert.equal(store.getJob(job.jobId).status, "pending");

  store.markJobRunning(job.jobId);
  store.handleTimeout(job.jobId);
  assert.equal(store.getJob(job.jobId).status, "failed");
  assert.deepEqual(store.getJob(job.jobId).errorBody, {
    success: false,
    code: "ai-job-timeout",
    message: "当前任务超过60s，请重新请求。",
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

test("ai job store defaults to 9999 capacity and keeps failed records for 1 minute", function () {
  const originalJobMaxSize = process.env.ASC_AI_JOB_MAX_SIZE;
  const originalLegacyJobMaxSize = process.env.DATABAKER_AI_JOB_MAX_SIZE;
  const originalFailedRetention = process.env.ASC_AI_JOB_FAILED_RETENTION_MS;
  const originalLegacyFailedRetention = process.env.DATABAKER_AI_JOB_FAILED_RETENTION_MS;
  delete process.env.ASC_AI_JOB_MAX_SIZE;
  delete process.env.DATABAKER_AI_JOB_MAX_SIZE;
  delete process.env.ASC_AI_JOB_FAILED_RETENTION_MS;
  delete process.env.DATABAKER_AI_JOB_FAILED_RETENTION_MS;

  try {
    const config = getDefaultAiJobStoreConfig();
    assert.equal(config.maxSize, 9999);
    assert.equal(config.failedRetentionMs, 60000);
    assert.equal(config.timeoutMs, 60000);
  } finally {
    if (originalJobMaxSize === undefined) {
      delete process.env.ASC_AI_JOB_MAX_SIZE;
    } else {
      process.env.ASC_AI_JOB_MAX_SIZE = originalJobMaxSize;
    }
    if (originalLegacyJobMaxSize === undefined) {
      delete process.env.DATABAKER_AI_JOB_MAX_SIZE;
    } else {
      process.env.DATABAKER_AI_JOB_MAX_SIZE = originalLegacyJobMaxSize;
    }
    if (originalFailedRetention === undefined) {
      delete process.env.ASC_AI_JOB_FAILED_RETENTION_MS;
    } else {
      process.env.ASC_AI_JOB_FAILED_RETENTION_MS = originalFailedRetention;
    }
    if (originalLegacyFailedRetention === undefined) {
      delete process.env.DATABAKER_AI_JOB_FAILED_RETENTION_MS;
    } else {
      process.env.DATABAKER_AI_JOB_FAILED_RETENTION_MS = originalLegacyFailedRetention;
    }
  }
});

test("ai job store marks pending-timeout failures as failed for 1 minute before expiring", function () {
  let currentTime = 1000;
  const store = createAiJobStore({
    enabled: true,
    ttlMs: 30 * 60 * 1000,
    timeoutMs: 60000,
    maxSize: 10,
    pollIntervalMs: 1000,
    failedRetentionMs: 60000,
    now() {
      return currentTime;
    },
  });

  const job = store.createJob({
    requestId: "req-3",
    routeKey: "review-current",
  });

  store.markJobFailed(job.jobId, {
    errorBody: {
      success: false,
      code: "provider-queue-pending-timeout",
      message: "排队超过120s未开始执行，任务已失败。",
    },
    retentionMs: 60000,
  });

  assert.equal(store.getJob(job.jobId).status, "failed");

  currentTime += 59000;
  assert.equal(store.getJob(job.jobId).status, "failed");

  currentTime += 2000;
  const expired = store.getJob(job.jobId);
  assert.equal(expired.status, "expired");
  assert.equal(store.getSnapshot().activeCount, 0);
  assert.equal(store.getSnapshot().failedCount, 0);
  assert.equal(store.getSnapshot().expiredCount, 1);
});
