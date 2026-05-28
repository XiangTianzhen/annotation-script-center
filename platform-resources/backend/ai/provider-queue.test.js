"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  __private__,
  buildModelQueueKey,
  getGroupSettings,
  getModelQueuePolicy,
} = require("./provider-queue");
const { ProviderQueue } = __private__;

function createDeferred() {
  let resolve = null;
  let reject = null;
  const promise = new Promise(function (innerResolve, innerReject) {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

test("provider queue builds shared queue key from concrete model name", function () {
  assert.equal(buildModelQueueKey("qwen3.5-omni-flash"), "model:qwen3.5-omni-flash");
  assert.equal(buildModelQueueKey(" qwen3.5-plus "), "model:qwen3.5-plus");
});

test("provider queue uses model defaults of 20 req/s and 15 concurrency", function () {
  const settings = getGroupSettings(buildModelQueueKey("qwen3.5-omni-flash"));

  assert.equal(settings.rpm, 1200);
  assert.equal(settings.intervalMs, 50);
  assert.equal(settings.maxConcurrent, 15);
  assert.equal(settings.maxSize, 9999);
  assert.equal(settings.pendingTimeoutMs, 0);
  assert.equal(settings.groupName, "model:qwen3.5-omni-flash");
});

test("provider queue exposes shared model pool policy", function () {
  const policy = getModelQueuePolicy();

  assert.equal(policy.keyStrategy, "concrete-model-name");
  assert.equal(policy.defaultRpm, 1200);
  assert.equal(policy.dispatchIntervalMs, 50);
  assert.equal(policy.defaultMaxConcurrent, 15);
  assert.equal(policy.maxSize, 9999);
  assert.equal(policy.pendingTimeoutMs, 0);
});

test("provider queue keeps different model pools isolated when one pool is full", async function () {
  const plusQueue = new ProviderQueue(buildModelQueueKey("qwen3.5-omni-plus"), {
    getSettings() {
      return {
        groupName: buildModelQueueKey("qwen3.5-omni-plus"),
        rpm: 1200,
        intervalMs: 50,
        maxConcurrent: 1,
        maxSize: 1,
        retryMax: 0,
        retryBaseDelayMs: 10,
        retryMaxDelayMs: 10,
        pendingTimeoutMs: 120000,
      };
    },
  });
  const flashQueue = new ProviderQueue(buildModelQueueKey("qwen3.5-omni-flash"), {
    getSettings() {
      return {
        groupName: buildModelQueueKey("qwen3.5-omni-flash"),
        rpm: 1200,
        intervalMs: 50,
        maxConcurrent: 1,
        maxSize: 1,
        retryMax: 0,
        retryBaseDelayMs: 10,
        retryMaxDelayMs: 10,
        pendingTimeoutMs: 120000,
      };
    },
  });
  const blocker = createDeferred();
  const pendingStarted = createDeferred();
  const activeStarted = createDeferred();
  let activePromise = null;
  let pendingPromise = null;

  try {
    activePromise = plusQueue.enqueue(function () {
      activeStarted.resolve();
      return blocker.promise;
    });
    await activeStarted.promise;

    pendingPromise = plusQueue.enqueue(function () {
      pendingStarted.resolve();
      return "plus-pending";
    });

    await assert.rejects(
      plusQueue.enqueue(function () {
        return "plus-overflow";
      }),
      function (error) {
        assert.equal(error.code, "provider-queue-full");
        return true;
      }
    );

    const flashResult = await flashQueue.enqueue(function () {
      return "flash-ok";
    });

    assert.equal(flashResult.value, "flash-ok");

    blocker.resolve("plus-active");
    const activeResult = await activePromise;
    assert.equal(activeResult.value, "plus-active");

    const pendingResult = await pendingPromise;
    assert.equal(pendingResult.value, "plus-pending");
    await pendingStarted.promise;
  } finally {
    blocker.resolve("plus-active");
    if (activePromise) {
      await activePromise.catch(function () {});
    }
    if (pendingPromise) {
      await pendingPromise.catch(function () {});
    }
  }
});

test("provider queue fails items that wait more than 120s without starting", async function () {
  const blocker = createDeferred();
  let pendingTaskCalled = false;
  const queue = new ProviderQueue(buildModelQueueKey("qwen3.5-omni-plus"), {
    getSettings() {
      return {
        groupName: buildModelQueueKey("qwen3.5-omni-plus"),
        rpm: 1200,
        intervalMs: 50,
        maxConcurrent: 1,
        maxSize: 5,
        retryMax: 0,
        retryBaseDelayMs: 10,
        retryMaxDelayMs: 10,
        pendingTimeoutMs: 20,
      };
    },
  });

  const activePromise = queue.enqueue(function () {
    return blocker.promise;
  });
  const pendingPromise = queue.enqueue(function () {
    pendingTaskCalled = true;
    return "should-not-start";
  });

  await assert.rejects(pendingPromise, function (error) {
    assert.equal(error.code, "provider-queue-pending-timeout");
    assert.equal(error.statusCode, 504);
    assert.match(error.message, /未开始执行/);
    return true;
  });
  assert.equal(pendingTaskCalled, false);

  blocker.resolve("done");
  await activePromise;
});
