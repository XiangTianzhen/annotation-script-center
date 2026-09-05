"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const controller = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "whole-segment-controller.js"));

function flushAsyncWork() {
  return new Promise((resolve) => setImmediate(resolve));
}

function createAudioRegion(width = 843, height = 172) {
  return {
    isConnected: true,
    getClientRects: () => width > 0 && height > 0 ? [{}] : [],
    getBoundingClientRect: () => ({ width, height }),
  };
}

function createAudioRegionHarness(initialNodes) {
  let observerCallback = null;
  let disconnected = false;
  let nodes = Array.from(initialNodes || []);
  class FakeMutationObserver {
    constructor(callback) { observerCallback = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  return {
    document: {
      documentElement: {},
      defaultView: { MutationObserver: FakeMutationObserver, setTimeout, clearTimeout },
      querySelectorAll(selector) {
        assert.equal(selector, ".audio-peaks .waveform");
        return nodes.slice();
      },
    },
    replace(nextNodes) {
      nodes = Array.from(nextNodes || []);
      observerCallback?.([]);
    },
    wasDisconnected() { return disconnected; },
  };
}

test("audio readiness ignores the previous waveform until a fresh visible node is created", async () => {
  assert.equal(typeof controller.waitForFreshAudioRegion, "function", "controller must expose the DOM readiness gate");
  const previousNode = createAudioRegion();
  const nextNode = createAudioRegion();
  const harness = createAudioRegionHarness([previousNode]);
  let settled = false;
  const pending = controller.waitForFreshAudioRegion(harness.document, { previousNode, timeoutMs: 1000 })
    .then((value) => { settled = true; return value; });

  await flushAsyncWork();
  assert.equal(settled, false);
  harness.replace([nextNode]);

  assert.deepEqual(await pending, { status: "ready", node: nextNode });
  assert.equal(harness.wasDisconnected(), true);
});

test("audio readiness immediately accepts a fresh node created before the context message", async () => {
  const previousNode = createAudioRegion();
  const nextNode = createAudioRegion();
  const harness = createAudioRegionHarness([nextNode]);
  assert.deepEqual(
    await controller.waitForFreshAudioRegion(harness.document, { previousNode, timeoutMs: 1000 }),
    { status: "ready", node: nextNode }
  );
});

test("audio readiness rejects hidden, disconnected, and ambiguous waveform matches", async () => {
  const previousNode = createAudioRegion();
  const harness = createAudioRegionHarness([createAudioRegion(0, 172)]);
  const pending = controller.waitForFreshAudioRegion(harness.document, { previousNode, timeoutMs: 1000 });
  const disconnectedNode = createAudioRegion();
  disconnectedNode.isConnected = false;
  harness.replace([disconnectedNode]);
  const first = createAudioRegion();
  const second = createAudioRegion();
  harness.replace([first, second]);
  await flushAsyncWork();
  harness.replace([second]);
  assert.deepEqual(await pending, { status: "ready", node: second });
});

test("audio readiness times out and supports cancellation", async () => {
  const timeoutHarness = createAudioRegionHarness([]);
  assert.deepEqual(
    await controller.waitForFreshAudioRegion(timeoutHarness.document, { previousNode: null, timeoutMs: 5 }),
    { status: "timeout" }
  );

  const cancelHarness = createAudioRegionHarness([]);
  const abortController = new AbortController();
  const pending = controller.waitForFreshAudioRegion(cancelHarness.document, {
    previousNode: null,
    timeoutMs: 1000,
    signal: abortController.signal,
  });
  abortController.abort();
  assert.deepEqual(await pending, { status: "cancelled" });
  assert.equal(cancelHarness.wasDisconnected(), true);
});

test("automatic drawing waits until the editor waveform is ready", async () => {
  let readinessChecks = 0;
  const ready = await controller.waitForWaveformReady({
    getSegments: () => [],
    getAudioDurationMs: () => readinessChecks >= 2 ? 4215 : 0,
    getWaveformWidth: () => readinessChecks >= 2 ? 843 : 0,
  }, {
    timeoutMs: 1000,
    intervalMs: 1,
    sleep: async () => { readinessChecks += 1; },
  });
  assert.equal(ready, true);
  assert.equal(readinessChecks, 2);
});

test("waveform readiness stops polling after cancellation", async () => {
  const abortController = new AbortController();
  let sleepCalls = 0;
  const ready = await controller.waitForWaveformReady({
    getSegments: () => [],
    getAudioDurationMs: () => 0,
    getWaveformWidth: () => 0,
  }, {
    timeoutMs: 20,
    intervalMs: 1,
    signal: abortController.signal,
    sleep: async () => {
      sleepCalls += 1;
      abortController.abort();
    },
  });
  assert.equal(ready, false);
  assert.equal(sleepCalls, 1);
});

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
