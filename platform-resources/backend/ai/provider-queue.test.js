"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  buildModelQueueKey,
  getGroupSettings,
  getModelQueuePolicy,
} = require("./provider-queue");

test("provider queue builds shared queue key from concrete model name", function () {
  assert.equal(buildModelQueueKey("qwen3.5-omni-flash"), "model:qwen3.5-omni-flash");
  assert.equal(buildModelQueueKey(" qwen3.5-plus "), "model:qwen3.5-plus");
});

test("provider queue uses model defaults of 20 req/s and 15 concurrency", function () {
  const settings = getGroupSettings(buildModelQueueKey("qwen3.5-omni-flash"));

  assert.equal(settings.rpm, 1200);
  assert.equal(settings.intervalMs, 50);
  assert.equal(settings.maxConcurrent, 15);
  assert.equal(settings.groupName, "model:qwen3.5-omni-flash");
});

test("provider queue exposes shared model pool policy", function () {
  const policy = getModelQueuePolicy();

  assert.equal(policy.keyStrategy, "concrete-model-name");
  assert.equal(policy.defaultRpm, 1200);
  assert.equal(policy.dispatchIntervalMs, 50);
  assert.equal(policy.defaultMaxConcurrent, 15);
});
