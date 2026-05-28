"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createRollingBatchWindow } = require("./batch-window.js");

test("createRollingBatchWindow fills initial request window and refills only after consume", function () {
  const tasks = ["A", "B", "C", "D", "E"];
  const windowState = createRollingBatchWindow(tasks, 2);

  assert.deepEqual(windowState.takeUntilCapacity(), ["A", "B"]);
  assert.deepEqual(windowState.takeUntilCapacity(), []);
  assert.deepEqual(windowState.markConsumed(), ["C"]);
  assert.deepEqual(windowState.markConsumed(), ["D"]);
  assert.deepEqual(windowState.markConsumed(), ["E"]);
  assert.deepEqual(windowState.markConsumed(), []);
  assert.equal(windowState.getSnapshot().done, false);
  assert.deepEqual(windowState.markConsumed(), []);
  assert.equal(windowState.getSnapshot().done, true);
});

test("createRollingBatchWindow normalizes invalid concurrency to 1", function () {
  const windowState = createRollingBatchWindow(["A", "B"], 0);

  assert.deepEqual(windowState.takeUntilCapacity(), ["A"]);
  assert.deepEqual(windowState.markConsumed(), ["B"]);
  assert.equal(windowState.getSnapshot().concurrency, 1);
});
