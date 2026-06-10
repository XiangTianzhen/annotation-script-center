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
  const samples = settings.samples || new Float32Array(600).fill(0.01);

  class FakeAudioContext {
    async decodeAudioData() {
      return {
        sampleRate: settings.sampleRate || 1000,
        getChannelData: function () {
          return samples;
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
      return {
        ok: true,
        json: async function () {
          return {
            success: true,
            data: {
              proposedSegments: [],
              changes: [],
            },
            meta: {},
          };
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
  } finally {
    harness.restore();
  }
});
