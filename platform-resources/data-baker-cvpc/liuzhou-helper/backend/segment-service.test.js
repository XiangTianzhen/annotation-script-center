"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildSegmentPreview,
  createSegmentHealthPayload,
} = require("./segment-service");

function createSegment(overrides) {
  return Object.assign(
    {
      uniqueId: "segment-1",
      sourceSegmentNumber: 1,
      startMs: 4000,
      endMs: 7000,
    },
    overrides || {}
  );
}

test("segment preview keeps existing segments unchanged when no qualifying silence is found", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [
      createSegment({
        uniqueId: "segment-1",
        sourceSegmentNumber: 1,
        startMs: 0,
        endMs: 2000,
      }),
      createSegment({
        uniqueId: "segment-2",
        sourceSegmentNumber: 2,
        startMs: 2500,
        endMs: 5000,
      }),
    ],
    silentRanges: [
      { startMs: 600, endMs: 900 },
      { startMs: 3200, endMs: 3550 },
    ],
    rules: {
      silenceThresholdDbfs: -40,
    },
    segmentScope: "existing-segments-incremental",
  });

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.changes, []);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return {
        sourceUniqueId: item.sourceUniqueId,
        startMs: item.startMs,
        endMs: item.endMs,
      };
    }),
    [
      { sourceUniqueId: "segment-1", startMs: 0, endMs: 2000 },
      { sourceUniqueId: "segment-2", startMs: 2500, endMs: 5000 },
    ]
  );
  assert.deepEqual(payload.meta.rules, {
    silenceThresholdDbfs: -40,
    minSilenceMs: 400,
    contextPaddingMs: 100,
    segmentScope: "existing-segments-incremental",
  });
  assert.equal(payload.meta.contractMode, "dom-guarded-manual-save");
});

test("segment preview splits an existing segment when an internal silence lasts at least 400ms", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5500 }],
    rules: {
      silenceThresholdDbfs: -40,
    },
    segmentScope: "existing-segments-incremental",
  });

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "segment-1",
      sourceSegmentNumber: 1,
      originalStartMs: 4000,
      originalEndMs: 7000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 4000, endMs: 5100 },
        { startMs: 5400, endMs: 7000 },
      ],
    },
  ]);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return {
        sourceUniqueId: item.sourceUniqueId,
        startMs: item.startMs,
        endMs: item.endMs,
      };
    }),
    [
      { sourceUniqueId: "segment-1", startMs: 4000, endMs: 5100 },
      { sourceUniqueId: "segment-1", startMs: 5400, endMs: 7000 },
    ]
  );
});

test("segment preview does not split when silence is shorter than 400ms", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5399 }],
    rules: {
      silenceThresholdDbfs: -40,
    },
    segmentScope: "existing-segments-incremental",
  });

  assert.deepEqual(payload.data.changes, []);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [[4000, 7000]]
  );
});

test("segment preview produces multiple child segments for multiple qualifying silences in one source segment", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 12000,
    existingSegments: [
      createSegment({
        startMs: 1000,
        endMs: 5000,
      }),
    ],
    silentRanges: [
      { startMs: 2000, endMs: 2450 },
      { startMs: 3200, endMs: 3800 },
    ],
    rules: {
      silenceThresholdDbfs: -40,
    },
    segmentScope: "existing-segments-incremental",
  });

  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "segment-1",
      sourceSegmentNumber: 1,
      originalStartMs: 1000,
      originalEndMs: 5000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 1000, endMs: 2100 },
        { startMs: 2350, endMs: 3300 },
        { startMs: 3700, endMs: 5000 },
      ],
    },
  ]);
});

test("segment health exposes the new CVPC preview defaults", function () {
  const payload = createSegmentHealthPayload();

  assert.equal(payload.success, true);
  assert.deepEqual(payload.rules, {
    silenceThresholdDbfs: -40,
    minSilenceMs: 400,
    contextPaddingMs: 100,
    segmentScope: "existing-segments-incremental",
    minSegmentMs: 100,
  });
  assert.deepEqual(payload.contract, {
    mode: "dom-guarded-manual-save",
    writeContractCaptured: "page-dom-only",
  });
});
