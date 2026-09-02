"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const controller = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "whole-segment-controller.js"));

test("whole-segment controller refuses to change a page that already has a segment", async () => {
  let dragged = false;
  const result = await controller.createWholeSegment({
    getSegments: () => [{ startMs: 0, endMs: 1000 }],
    dragWholeWaveform: async () => { dragged = true; },
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "segments-exist");
  assert.equal(dragged, false);
});

test("whole-segment controller draws once and verifies one-pixel boundary tolerance", async () => {
  let segments = [];
  let dragCount = 0;
  let activationCount = 0;
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4215,
    getWaveformWidth: () => 843,
    activateDrawTool: async () => { activationCount += 1; },
    dragWholeWaveform: async () => { dragCount += 1; segments = [{ startMs: 3, endMs: 4212 }]; },
  });
  assert.equal(result.ok, true);
  assert.equal(activationCount, 1);
  assert.equal(dragCount, 1);
  assert.equal(result.segmentCount, 1);
});

test("whole-segment controller reports failed verification without a second drag", async () => {
  let segments = [];
  let dragCount = 0;
  let rollbackCount = 0;
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    dragWholeWaveform: async () => { dragCount += 1; segments = [{ startMs: 100, endMs: 3900 }]; },
    rollbackWholeSegment: async () => { rollbackCount += 1; segments = []; },
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "boundary-verification-failed");
  assert.equal(result.pageChanged, true);
  assert.equal(result.pageRestored, true);
  assert.equal(dragCount, 1);
  assert.equal(rollbackCount, 1);
  assert.deepEqual(segments, []);
});

test("whole-segment controller reports a dirty page when rollback cannot restore it", async () => {
  let segments = [];
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    dragWholeWaveform: async () => { segments = [{ startMs: 200, endMs: 3800 }]; },
    rollbackWholeSegment: async () => {},
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "rollback-failed");
  assert.equal(result.pageChanged, true);
  assert.equal(result.pageRestored, false);
});

test("whole-segment controller normalizes a rollback exception as an unrestored dirty page", async () => {
  let segments = [];
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    dragWholeWaveform: async () => { segments = [{ startMs: 200, endMs: 3800 }]; },
    rollbackWholeSegment: async () => { throw new Error("delete failed"); },
  });
  assert.equal(result.code, "rollback-failed");
  assert.equal(result.pageChanged, true);
  assert.equal(result.pageRestored, false);
});
