"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const controller = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "whole-segment-controller.js"));

test("Peaks.js adapter reads the selected segment boundary text instead of Wavesurfer regions", () => {
  const rows = [{
    querySelector(selector) {
      return selector.includes("placeholder") ? {} : null;
    },
    getAttribute() { return null; },
    dataset: {},
  }];
  const leaves = [
    { childElementCount: 0, textContent: "0.152/4.215S" },
    { childElementCount: 0, textContent: "段落: 1  区域: [0.003, 4.212]  时长: 4.209S" },
  ];
  const waveform = {
    disabled: false,
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({ left: 0, right: 843, top: 10, width: 843, height: 172 }),
  };
  const doc = {
    querySelector(selector) {
      if (selector === ".audio-peaks .waveform") return waveform;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "tbody tr") return rows;
      if (selector === "body *") return leaves;
      return [];
    },
  };

  const adapter = controller.createDomAdapter(doc);
  assert.deepEqual(adapter.getSegments(), [{ startMs: 3, endMs: 4212 }]);
});

test("Peaks.js adapter reads the live Chinese-bracket boundary without a comma", () => {
  const row = { querySelector: () => ({}), getAttribute: () => null, dataset: {} };
  const boundary = { childElementCount: 3, textContent: "段落:1区域:【0.005   4.210】时长:4.205S" };
  const waveform = { disabled: false, getClientRects: () => [{}], getBoundingClientRect: () => ({ width: 843 }) };
  const doc = {
    querySelector: (selector) => selector === ".audio-peaks .waveform" ? waveform : null,
    querySelectorAll(selector) {
      if (selector === "tbody tr") return [row];
      if (selector === "body *") return [boundary];
      return [];
    },
  };
  assert.deepEqual(controller.createDomAdapter(doc).getSegments(), [{ startMs: 5, endMs: 4210 }]);
});

test("DOM adapter delegates only whole-waveform drawing to trusted input", async () => {
  const requests = [];
  const waveform = {
    disabled: false,
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({ left: 4, right: 804, top: 20, width: 800, height: 160 }),
  };
  const doc = {
    querySelector(selector) {
      if (selector === ".audio-peaks .waveform") return waveform;
      return null;
    },
    querySelectorAll() { return []; },
  };
  const adapter = controller.createDomAdapter(doc, {
    trustedInput(request) { requests.push(request); return Promise.resolve({ ok: true }); },
  });

  await adapter.dragWholeWaveform();
  assert.deepEqual(requests, [
    { action: "shift-drag", startX: 5, startY: 100, endX: 803, endY: 100 },
  ]);
  assert.equal(adapter.rollbackWholeSegment, undefined);
});

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

test("whole-segment controller accepts boundary error equal to two waveform pixels", async () => {
  let segments = [];
  let dragCount = 0;
  let activationCount = 0;
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    activateDrawTool: async () => { activationCount += 1; },
    dragWholeWaveform: async () => { dragCount += 1; segments = [{ startMs: 10, endMs: 3990 }]; },
  });
  assert.equal(result.ok, true);
  assert.equal(activationCount, 1);
  assert.equal(dragCount, 1);
  assert.equal(result.segmentCount, 1);
});

test("whole-segment controller preserves an incomplete generated segment without deleting it", async () => {
  let segments = [];
  let dragCount = 0;
  const result = await controller.createWholeSegment({
    getSegments: () => segments,
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    dragWholeWaveform: async () => { dragCount += 1; segments = [{ startMs: 100, endMs: 3900 }]; },
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "segment-boundary-incomplete");
  assert.equal(result.pageChanged, true);
  assert.equal(result.pageRestored, false);
  assert.equal(dragCount, 1);
  assert.deepEqual(segments, [{ startMs: 100, endMs: 3900 }]);
});

test("whole-segment controller preserves trusted input failure reason", async () => {
  const result = await controller.createWholeSegment({
    getSegments: () => [],
    getAudioDurationMs: () => 4000,
    getWaveformWidth: () => 800,
    dragWholeWaveform: async () => { throw new Error("debugger-attach-failed"); },
  });
  assert.equal(result.code, "debugger-attach-failed");
  assert.equal(result.pageChanged, false);
});
