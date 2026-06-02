"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  buildModelQueueKey,
  enqueueProviderTask,
  getGroupSettings,
  getModelQueuePolicy,
} = require("./provider-queue");

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise(function (innerResolve, innerReject) {
    resolve = innerResolve;
    reject = innerReject;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

test("provider queue builds shared queue key from concrete model name", function () {
  assert.equal(buildModelQueueKey("qwen3.5-omni-flash"), "model:qwen3.5-omni-flash");
  assert.equal(buildModelQueueKey(" qwen3.5-plus "), "model:qwen3.5-plus");
});

test("provider queue uses model defaults of 20 req/s and 999 total capacity", function () {
  const settings = getGroupSettings(buildModelQueueKey("qwen3.5-omni-flash"));

  assert.equal(settings.rpm, 1200);
  assert.equal(settings.intervalMs, 50);
  assert.equal(settings.maxConcurrent, 999);
  assert.equal(settings.totalCapacity, 999);
  assert.equal(settings.maxSize, 999);
  assert.equal(settings.groupName, "model:qwen3.5-omni-flash");
});

test("provider queue exposes shared model pool policy", function () {
  const policy = getModelQueuePolicy();

  assert.equal(policy.keyStrategy, "concrete-model-name");
  assert.equal(policy.defaultRpm, 1200);
  assert.equal(policy.dispatchIntervalMs, 50);
  assert.equal(policy.defaultCapacity, 999);
  assert.equal(policy.defaultMaxConcurrent, 999);
});

test("provider queue rejects the 1000th request when total model pool capacity is full", async function () {
  const previousDefaultCapacity = process.env.ASC_AI_MODEL_QUEUE_DEFAULT_CONCURRENCY;
  process.env.ASC_AI_MODEL_QUEUE_DEFAULT_CONCURRENCY = "3";
  const queueKey = buildModelQueueKey("test-capacity-" + Date.now());
  const deferreds = [createDeferred(), createDeferred(), createDeferred()];

  try {
    const acceptedTasks = deferreds.map(function (deferred) {
      return enqueueProviderTask(queueKey, function () {
        return deferred.promise;
      });
    });
    let overflowError = null;
    try {
      await enqueueProviderTask(queueKey, function () {
        return Promise.resolve("unexpected");
      });
    } catch (error) {
      overflowError = error;
    }

    assert.ok(overflowError);
    assert.equal(overflowError.code, "provider-queue-full");
    assert.equal(overflowError.message, "后端池已满，请稍后重试。");
    assert.equal(overflowError.queue.totalCapacity, 3);

    await wait(140);
    deferreds.forEach(function (deferred, index) {
      deferred.resolve("task-" + String(index + 1));
    });
    await Promise.all(acceptedTasks);
  } finally {
    if (previousDefaultCapacity) {
      process.env.ASC_AI_MODEL_QUEUE_DEFAULT_CONCURRENCY = previousDefaultCapacity;
    } else {
      delete process.env.ASC_AI_MODEL_QUEUE_DEFAULT_CONCURRENCY;
    }
  }
});

test("provider queue starts model requests in FIFO order with 50ms spacing", async function () {
  const queueKey = buildModelQueueKey("test-order-" + Date.now());
  const started = [];

  function createTask(label) {
    return function () {
      started.push({
        label,
        at: Date.now(),
      });
      return wait(10);
    };
  }

  await Promise.all([
    enqueueProviderTask(queueKey, createTask("A")),
    enqueueProviderTask(queueKey, createTask("B")),
    enqueueProviderTask(queueKey, createTask("C")),
  ]);

  assert.deepEqual(
    started.map(function (entry) {
      return entry.label;
    }),
    ["A", "B", "C"]
  );
  assert.ok(started[1].at - started[0].at >= 45);
  assert.ok(started[2].at - started[1].at >= 45);
});
