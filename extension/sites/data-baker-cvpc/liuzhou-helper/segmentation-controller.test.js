"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "segmentation-controller.js");

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouSegmentation;
  return require(modulePath);
}

function installHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalAudioContext = globalThis.AudioContext;
  const originalWebkitAudioContext = globalThis.webkitAudioContext;

  const requests = [];
  const channels = Array.isArray(settings.channels) && settings.channels.length > 0
    ? settings.channels
    : [settings.samples || new Float32Array(600).fill(0.01)];
  const previewResponses = Array.isArray(settings.previewResponses)
    ? settings.previewResponses.slice()
    : [
        {
          success: true,
          data: {
            proposedSegments: [],
            changes: [],
          },
          meta: {},
        },
      ];

  class FakeAudioContext {
    async decodeAudioData() {
      return {
        sampleRate: settings.sampleRate || 1000,
        numberOfChannels: channels.length,
        getChannelData: function (index) {
          return channels[index] || channels[0];
        },
      };
    }

    close() {
      return Promise.resolve();
    }
  }

  globalThis.window = {
    AudioContext: FakeAudioContext,
    webkitAudioContext: FakeAudioContext,
  };
  globalThis.AudioContext = FakeAudioContext;
  globalThis.webkitAudioContext = FakeAudioContext;
  globalThis.fetch = async function (url, options) {
    requests.push({
      url: String(url || ""),
      method: String(options?.method || "GET").toUpperCase(),
      body: options?.body || "",
    });
    if (String(url || "").indexOf("/segment/preview") >= 0) {
      const nextPreviewResponse = previewResponses.length > 1
        ? previewResponses.shift()
        : previewResponses[0];
      return {
        ok: true,
        json: async function () {
          return nextPreviewResponse;
        },
      };
    }
    return {
      ok: true,
      arrayBuffer: async function () {
        return new ArrayBuffer(8);
      },
    };
  };

  return {
    requests,
    restore: function () {
      globalThis.fetch = originalFetch;
      globalThis.window = originalWindow;
      globalThis.AudioContext = originalAudioContext;
      globalThis.webkitAudioContext = originalWebkitAudioContext;
    },
  };
}

test("CVPC segmentation controller forwards threshold and fixed rules to preview endpoint", async function () {
  const moduleApi = loadModule();
  const low = 10 ** (-45 / 20);
  const high = 10 ** (-20 / 20);
  const samples = new Float32Array(720);
  samples.fill(high, 0, 120);
  samples.fill(low, 120, 570);
  samples.fill(high, 570);
  const harness = installHarness({ samples });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
    });

    await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [
        { uniqueId: "segment-1", sourceSegmentNumber: 1, startMs: 0, endMs: 4171 },
      ],
    });

    const request = harness.requests.find(function (item) {
      return item.url.indexOf("/segment/preview") >= 0;
    });
    const body = JSON.parse(request.body);
    assert.deepEqual(body.rules, {
      silenceThresholdDbfs: -27,
      minSilenceMs: 400,
      contextPaddingMs: 100,
    });
    assert.equal(body.segmentScope, "existing-segments-incremental");
    assert.equal(body.silentRanges.length, 1);
    assert.ok(body.silentRanges[0].endMs - body.silentRanges[0].startMs >= 400);
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller changes silence detection result when threshold changes", async function () {
  const moduleApi = loadModule();
  const medium = 10 ** (-45 / 20);
  const samples = new Float32Array(600).fill(medium);
  const harness = installHarness({ samples });

  try {
    const permissiveRuntime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
    });
    await permissiveRuntime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [],
    });

    const strictRuntime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -50,
    });
    await strictRuntime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [],
    });

    const previewBodies = harness.requests
      .filter(function (item) {
        return item.url.indexOf("/segment/preview") >= 0;
      })
      .map(function (item) {
        return JSON.parse(item.body);
      });

    assert.equal(previewBodies.length, 2);
    assert.equal(previewBodies[0].silentRanges.length, 1);
    assert.equal(previewBodies[1].silentRanges.length, 0);
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller retries with whole-audio rebuild preview when incremental preview stays empty", async function () {
  const moduleApi = loadModule();
  const low = 10 ** (-45 / 20);
  const high = 10 ** (-20 / 20);
  const samples = new Float32Array(720);
  samples.fill(high, 0, 120);
  samples.fill(low, 120, 570);
  samples.fill(high, 570);
  const harness = installHarness({
    samples,
    previewResponses: [
      {
        success: true,
        data: {
          proposedSegments: [{ startMs: 0, endMs: 4171 }],
          changes: [],
        },
        meta: {
          previewMode: "incremental",
          applyAllowed: false,
          emptyReason: "no-internal-hit",
        },
      },
      {
        success: true,
        data: {
          proposedSegments: [
            { startMs: 0, endMs: 4171 },
            { startMs: 17554, endMs: 35221 },
          ],
          changes: [
            {
              sourceSegmentNumber: 1,
              originalStartMs: 0,
              originalEndMs: 40000,
              suggestedSegments: [
                { startMs: 0, endMs: 4171 },
                { startMs: 17554, endMs: 35221 },
              ],
            },
          ],
        },
        meta: {
          previewMode: "whole-audio-fallback",
          applyAllowed: false,
          emptyReason: "",
        },
      },
    ],
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [
        { uniqueId: "segment-1", sourceSegmentNumber: 1, startMs: 0, endMs: 4171 },
        { uniqueId: "segment-2", sourceSegmentNumber: 2, startMs: 17554, endMs: 35221 },
      ],
    });

    const previewBodies = harness.requests
      .filter(function (item) {
        return item.url.indexOf("/segment/preview") >= 0;
      })
      .map(function (item) {
        return JSON.parse(item.body);
      });

    assert.equal(previewBodies.length, 2);
    assert.equal(previewBodies[0].segmentScope, "existing-segments-incremental");
    assert.equal(previewBodies[1].segmentScope, "whole-audio-rebuild-preview");
    assert.equal(preview.meta.previewMode, "whole-audio-fallback");
    assert.equal(preview.meta.applyAllowed, false);
    assert.equal(preview.meta.fallbackTriggered, true);
    assert.equal(preview.meta.incrementalEmptyReason, "no-internal-hit");
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller does not retry with whole-audio rebuild preview when no silence was detected", async function () {
  const moduleApi = loadModule();
  const high = 10 ** (-20 / 20);
  const samples = new Float32Array(600).fill(high);
  const harness = installHarness({ samples });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [
        { uniqueId: "segment-1", sourceSegmentNumber: 1, startMs: 0, endMs: 4171 },
      ],
    });

    const previewBodies = harness.requests.filter(function (item) {
      return item.url.indexOf("/segment/preview") >= 0;
    });
    assert.equal(previewBodies.length, 1);
    assert.equal(preview.analysisMeta.silentRangeCount, 0);
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller exposes selected threshold unit in preview meta", async function () {
  const moduleApi = loadModule();
  const low = 10 ** (-35 / 20);
  const high = 10 ** (-20 / 20);
  const samples = new Float32Array(720);
  samples.fill(high, 0, 120);
  samples.fill(low, 120, 570);
  samples.fill(high, 570);
  const harness = installHarness({ samples });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
      silenceThresholdUnit: "ratio",
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [],
    });

    assert.equal(preview.meta.rules.silenceThresholdDbfs, -27);
    assert.equal(preview.meta.rules.silenceThresholdUnit, "ratio");
    assert.equal(preview.meta.rules.silenceThresholdValue, 4.47);
    assert.deepEqual(preview.analysisMeta, {
      frameCount: 24,
      rawSilentRangeCount: 1,
      silentRangeCount: 1,
      windowMs: 30,
      smoothingFrameRadius: 1,
      maxSpeechBridgeMs: 180,
      channelCount: 1,
      audioDurationMs: 720,
      thresholdDbfs: -27,
    });
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller keeps one silence range when short speech blips appear inside near-silence", async function () {
  const moduleApi = loadModule();
  const low = 10 ** (-46 / 20);
  const high = 10 ** (-18 / 20);
  const samples = new Float32Array(900);
  samples.fill(high, 0, 120);
  samples.fill(low, 120, 690);
  samples.fill(high, 360, 420);
  samples.fill(high, 690);
  const harness = installHarness({ samples });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 18000,
      currentSegments: [],
    });

    const request = harness.requests.find(function (item) {
      return item.url.indexOf("/segment/preview") >= 0;
    });
    const body = JSON.parse(request.body);
    assert.equal(body.silentRanges.length, 1);
    assert.deepEqual(body.silentRanges[0], {
      startMs: 120,
      endMs: 690,
    });
    assert.equal(preview.analysisMeta.rawSilentRangeCount, 2);
    assert.equal(preview.analysisMeta.silentRangeCount, 1);
  } finally {
    harness.restore();
  }
});
