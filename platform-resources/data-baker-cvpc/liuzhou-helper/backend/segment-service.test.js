"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildSegmentPreview,
} = require("./segment-service");

test("segment preview keeps one full-length suggestion when no silence data is available", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 3200,
  });

  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 1);
  assert.deepEqual(payload.data[0], {
    startMs: 0,
    endMs: 3200,
    kind: "speech",
    reason: "full-audio-fallback",
    needsHumanReview: true,
  });
  assert.equal(payload.meta.source, "silence-rules-preview");
  assert.equal(payload.meta.contractMode, "suggestion-only");
});

test("segment preview only force-splits when silence exceeds 1.5s or explicit safe split is provided", function () {
  const payload = buildSegmentPreview({
    audioUrl: "https://example.com/a.mp3",
    audioDurationMs: 6000,
    silentRanges: [
      { startMs: 900, endMs: 1200 },
      { startMs: 2200, endMs: 2900 },
      { startMs: 4100, endMs: 5900 },
    ],
  });

  assert.equal(payload.success, true);
  assert.deepEqual(payload.data, [
    {
      startMs: 0,
      endMs: 4250,
      kind: "speech",
      reason: "silence-over-1.5s",
      needsHumanReview: true,
    },
    {
      startMs: 5750,
      endMs: 6000,
      kind: "speech",
      reason: "tail-after-silence",
      needsHumanReview: true,
    },
  ]);
  assert.equal(payload.meta.silenceDbThreshold, -27);
  assert.equal(payload.meta.forceSplitAboveMs, 1500);
});
