"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DEFAULT_SEGMENT_SCOPE,
  PREVIEW_MODE_INCREMENTAL,
  PREVIEW_MODE_WHOLE_AUDIO_FALLBACK,
  WHOLE_AUDIO_REBUILD_SCOPE,
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

test("segment preview reports no-silence when no silent ranges are provided", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [],
    rules: {
      silenceThresholdDbfs: -27,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.changes, []);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "no-silence");
});

test("segment preview keeps existing segments unchanged when no internal silence hit is found", function () {
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
      silenceThresholdDbfs: -27,
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
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "no-internal-hit");
  assert.deepEqual(payload.meta.rules, {
    silenceThresholdDbfs: -27,
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
      silenceThresholdDbfs: -27,
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
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, true);
  assert.equal(payload.meta.emptyReason, "");
});

test("segment preview does not split when silence is shorter than 400ms", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5399 }],
    rules: {
      silenceThresholdDbfs: -27,
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
  assert.equal(payload.meta.emptyReason, "no-internal-hit");
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
      silenceThresholdDbfs: -27,
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

test("segment preview reports insufficient-split when internal silence leaves no usable child segments", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [
      createSegment({
        startMs: 0,
        endMs: 450,
      }),
    ],
    silentRanges: [{ startMs: 25, endMs: 425 }],
    rules: {
      silenceThresholdDbfs: -27,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.deepEqual(payload.data.changes, []);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "insufficient-split");
});

test("segment preview supports whole-audio fallback rebuild as preview-only mode", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 6000,
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
      { startMs: 1200, endMs: 1800 },
      { startMs: 3000, endMs: 3600 },
    ],
    rules: {
      silenceThresholdDbfs: -27,
    },
    segmentScope: WHOLE_AUDIO_REBUILD_SCOPE,
  });

  assert.equal(payload.success, true);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_WHOLE_AUDIO_FALLBACK);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "");
  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "",
      sourceSegmentNumber: 1,
      originalStartMs: 0,
      originalEndMs: 6000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 0, endMs: 1300 },
        { startMs: 1700, endMs: 3100 },
        { startMs: 3500, endMs: 6000 },
      ],
    },
  ]);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [
      [0, 1300],
      [1700, 3100],
      [3500, 6000],
    ]
  );
});

test("segment health exposes the new CVPC preview defaults", function () {
  const payload = createSegmentHealthPayload();

  assert.equal(payload.success, true);
  assert.deepEqual(payload.rules, {
    silenceThresholdDbfs: -27,
    minSilenceMs: 400,
    contextPaddingMs: 100,
    segmentScope: "existing-segments-incremental",
    minSegmentMs: 100,
  });
  assert.deepEqual(payload.supportedScopes, {
    default: "existing-segments-incremental",
    values: ["existing-segments-incremental", "whole-audio-rebuild-preview"],
    previewOnly: ["whole-audio-rebuild-preview"],
  });
  assert.deepEqual(payload.contract, {
    mode: "dom-guarded-manual-save",
    writeContractCaptured: "page-dom-only",
  });
});
