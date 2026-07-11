"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const {
  DEFAULT_SEGMENT_SCOPE,
  PREVIEW_MODE_INCREMENTAL,
  PREVIEW_MODE_WHOLE_AUDIO_FALLBACK,
  WHOLE_AUDIO_REBUILD_SCOPE,
  buildSegmentPreview,
  createSegmentHealthPayload,
} = require(resolveRepo(
  "platform-resources",
  "data-baker-cvpc",
  "liuzhou-helper",
  "backend",
  "segment-service.js"
));

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

test("segment preview uses backend audio analyzer when the request only provides audioUrl and threshold", async function () {
  const calls = [];
  const payload = await buildSegmentPreview(
    {
      audioUrl: "https://example.com/a.mp3",
      rules: {
        silenceThresholdDbfs: -40,
      },
    },
    {
      analyzeAudio: async function (input) {
        calls.push(input);
        return {
          audioDurationMs: 6000,
          silentRanges: [
            { startMs: 1200, endMs: 1800 },
            { startMs: 3000, endMs: 3600 },
          ],
          analysisSource: "backend-python-audio-url",
          analysisMeta: {
            frameCount: 200,
            rawSilentRangeCount: 3,
            silentRangeCount: 2,
            decoder: "miniaudio",
          },
        };
      },
    }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].audioUrl, "https://example.com/a.mp3");
  assert.equal(calls[0].silenceThresholdDbfs, -40);
  assert.equal(payload.success, true);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_WHOLE_AUDIO_FALLBACK);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.analysisSource, "backend-python-audio-url");
  assert.deepEqual(payload.meta.analysisMeta, {
    frameCount: 200,
    rawSilentRangeCount: 3,
    silentRangeCount: 2,
    decoder: "miniaudio",
  });
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [
      [0, 1400],
      [1600, 3200],
      [3400, 6000],
    ]
  );
});

test("segment preview reports no-silence when backend analysis returns no silent ranges", async function () {
  const payload = await buildSegmentPreview(
    {
      audioUrl: "https://example.com/a.mp3",
      rules: {
        silenceThresholdDbfs: -27,
      },
    },
    {
      analyzeAudio: async function () {
        return {
          audioDurationMs: 9000,
          silentRanges: [],
          analysisSource: "backend-python-audio-url",
        };
      },
    }
  );

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.changes, []);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_WHOLE_AUDIO_FALLBACK);
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "no-silence");
});

test("segment preview keeps existing segments unchanged when no internal silence hit is found", async function () {
  const payload = await buildSegmentPreview({
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
    segmentScope: DEFAULT_SEGMENT_SCOPE,
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
});

test("segment preview splits an existing segment when an internal silence lasts at least 400ms", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5500 }],
    rules: {
      silenceThresholdDbfs: -27,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
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
        { startMs: 4000, endMs: 5200 },
        { startMs: 5300, endMs: 7000 },
      ],
    },
  ]);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, true);
  assert.equal(payload.meta.emptyReason, "");
});

test("segment preview visible-long-silence profile preserves a silence core instead of swallowing an obvious long silence", async function () {
  const payload = await buildSegmentPreview(
    {
      audioUrl: "https://example.com/a.mp3",
      audioDurationMs: 9000,
      existingSegments: [createSegment()],
      silentRanges: [{ startMs: 5000, endMs: 5800 }],
      rules: {
        silenceThresholdDbfs: -31,
        contextPaddingMs: 500,
      },
      segmentScope: DEFAULT_SEGMENT_SCOPE,
    },
    {
      segmentationProfile: "visible-long-silence",
    }
  );

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "segment-1",
      sourceSegmentNumber: 1,
      originalStartMs: 4000,
      originalEndMs: 7000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 4000, endMs: 5240 },
        { startMs: 5560, endMs: 7000 },
      ],
    },
  ]);
  assert.equal(payload.meta.previewMode, PREVIEW_MODE_INCREMENTAL);
  assert.equal(payload.meta.applyAllowed, true);
});

test("segment preview merges contiguous suggested segments back to the source segment by default", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5408 }],
    rules: {
      silenceThresholdDbfs: -31,
      contextPaddingMs: 200,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.deepEqual(payload.data.changes, []);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [[4000, 7000]]
  );
  assert.equal(payload.meta.applyAllowed, false);
  assert.equal(payload.meta.emptyReason, "contiguous-merged");
  assert.equal(payload.meta.rules.mergeContiguousSuggestedSegmentsEnabled, true);
});

test("segment preview keeps current pure split behavior when contiguous merge is disabled", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5408 }],
    rules: {
      silenceThresholdDbfs: -31,
      contextPaddingMs: 200,
    },
    editorContext: {
      mergeContiguousSuggestedSegmentsEnabled: false,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "segment-1",
      sourceSegmentNumber: 1,
      originalStartMs: 4000,
      originalEndMs: 7000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 4000, endMs: 5200 },
        { startMs: 5208, endMs: 7000 },
      ],
    },
  ]);
  assert.equal(payload.meta.applyAllowed, true);
  assert.equal(payload.meta.rules.mergeContiguousSuggestedSegmentsEnabled, false);
});

test("segment preview merges chain-contiguous suggestions from the same source segment into one run", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 5000,
    existingSegments: [
      createSegment({
        startMs: 0,
        endMs: 4000,
      }),
    ],
    silentRanges: [
      { startMs: 1000, endMs: 1408 },
      { startMs: 2500, endMs: 2908 },
    ],
    rules: {
      silenceThresholdDbfs: -31,
      contextPaddingMs: 200,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.deepEqual(payload.data.changes, []);
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [[0, 4000]]
  );
  assert.equal(payload.meta.emptyReason, "contiguous-merged");
});

test("segment preview does not merge suggestions when the visible gap is larger than tolerance", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 9000,
    existingSegments: [createSegment()],
    silentRanges: [{ startMs: 5000, endMs: 5420 }],
    rules: {
      silenceThresholdDbfs: -31,
      contextPaddingMs: 200,
    },
    segmentScope: DEFAULT_SEGMENT_SCOPE,
  });

  assert.deepEqual(payload.data.changes, [
    {
      sourceUniqueId: "segment-1",
      sourceSegmentNumber: 1,
      originalStartMs: 4000,
      originalEndMs: 7000,
      reason: "silence>=400ms",
      suggestedSegments: [
        { startMs: 4000, endMs: 5200 },
        { startMs: 5220, endMs: 7000 },
      ],
    },
  ]);
  assert.equal(payload.meta.applyAllowed, true);
});

test("segment preview reports insufficient-split when internal silence leaves no usable child segments", async function () {
  const payload = await buildSegmentPreview({
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

test("segment preview supports explicit whole-audio rebuild mode as preview-only output", async function () {
  const payload = await buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 6000,
    existingSegments: [
      createSegment({
        uniqueId: "segment-1",
        sourceSegmentNumber: 1,
        startMs: 0,
        endMs: 2000,
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
  assert.deepEqual(
    payload.data.proposedSegments.map(function (item) {
      return [item.startMs, item.endMs];
    }),
    [
      [0, 1400],
      [1600, 3200],
      [3400, 6000],
    ]
  );
});

test("segment health exposes backend analysis defaults for CVPC preview", function () {
  const payload = createSegmentHealthPayload();

  assert.equal(payload.success, true);
  assert.deepEqual(payload.rules, {
    silenceThresholdDbfs: -27,
    minSilenceMs: 400,
    contextPaddingMs: 200,
    segmentScope: "existing-segments-incremental",
    minSegmentMs: 100,
    analysisWindowMs: 30,
    smoothingFrameRadius: 1,
    maxSpeechBridgeMs: 180,
    contiguousMergeToleranceMs: 10,
  });
  assert.deepEqual(payload.supportedScopes, {
    default: "existing-segments-incremental",
    values: ["existing-segments-incremental", "whole-audio-rebuild-preview"],
    previewOnly: ["whole-audio-rebuild-preview"],
  });
  assert.deepEqual(payload.contract, {
    mode: "dom-guarded-manual-save",
    writeContractCaptured: "page-dom-only",
    analysisSource: "backend-python-audio-url",
  });
});
