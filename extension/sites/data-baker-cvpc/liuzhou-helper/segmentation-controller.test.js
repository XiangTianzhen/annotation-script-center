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
  const requests = [];
  const previewResponse =
    settings.previewResponse ||
    {
      success: true,
      data: {
        proposedSegments: [],
        changes: [],
      },
      meta: {},
    };

  globalThis.fetch = async function (url, requestOptions) {
    requests.push({
      url: String(url || ""),
      method: String(requestOptions?.method || "GET").toUpperCase(),
      body: requestOptions?.body || "",
    });
    return {
      ok: true,
      json: async function () {
        return previewResponse;
      },
    };
  };

  return {
    requests,
    restore: function () {
      globalThis.fetch = originalFetch;
    },
  };
}

test("CVPC segmentation controller only forwards audio url and configured silence rules to preview endpoint", async function () {
  const moduleApi = loadModule();
  const harness = installHarness({
    previewResponse: {
      success: true,
      data: {
        proposedSegments: [
          { startMs: 0, endMs: 4171 },
          { startMs: 17554, endMs: 35221 },
        ],
        changes: [],
      },
      meta: {
        previewMode: "whole-audio-fallback",
        applyAllowed: false,
        analysisSource: "backend-python-audio-url",
        analysisMeta: {
          frameCount: 7281,
          rawSilentRangeCount: 30,
          silentRangeCount: 26,
          thresholdDbfs: -27,
        },
        rules: {},
      },
    },
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
      contextPaddingMs: 200,
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      audioDurationMs: 218030,
      currentSegments: [
        { uniqueId: "segment-1", sourceSegmentNumber: 1, startMs: 0, endMs: 4171 },
      ],
    });

    const request = harness.requests.find(function (item) {
      return item.url.indexOf("/segment/preview") >= 0;
    });
    const body = JSON.parse(request.body);
    assert.equal(body.audioUrl, "https://oss.example.com/sample.mp3?Signature=audio");
    assert.deepEqual(body.rules, {
      silenceThresholdDbfs: -27,
      minSilenceMs: 400,
      contextPaddingMs: 200,
    });
    assert.equal(Object.prototype.hasOwnProperty.call(body, "silentRanges"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(body, "existingSegments"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(body, "audioDurationMs"), false);
    assert.equal(preview.meta.previewMode, "whole-audio-fallback");
    assert.equal(preview.meta.applyAllowed, false);
    assert.equal(preview.meta.analysisSource, "backend-python-audio-url");
    assert.deepEqual(preview.analysisMeta, {
      frameCount: 7281,
      rawSilentRangeCount: 30,
      silentRangeCount: 26,
      thresholdDbfs: -27,
    });
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller exposes selected threshold unit in preview meta", async function () {
  const moduleApi = loadModule();
  const harness = installHarness({
    previewResponse: {
      success: true,
      data: {
        proposedSegments: [{ startMs: 0, endMs: 4171 }],
        changes: [],
      },
      meta: {
        previewMode: "whole-audio-fallback",
        applyAllowed: false,
        analysisSource: "backend-python-audio-url",
        analysisMeta: {
          frameCount: 24,
          rawSilentRangeCount: 1,
          silentRangeCount: 1,
          windowMs: 30,
          smoothingFrameRadius: 1,
          maxSpeechBridgeMs: 180,
          channelCount: 2,
          audioDurationMs: 720,
          thresholdDbfs: -27,
          sampleRate: 24000,
          decoder: "miniaudio",
        },
        rules: {},
      },
    },
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -27,
      silenceThresholdUnit: "ratio",
      contextPaddingMs: 200,
    });

    const preview = await runtime.preview({
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
    });

    assert.equal(preview.meta.rules.silenceThresholdDbfs, -27);
    assert.equal(preview.meta.rules.silenceThresholdUnit, "ratio");
    assert.equal(preview.meta.rules.silenceThresholdValue, 4.47);
    assert.equal(preview.meta.rules.contextPaddingMs, 200);
    assert.equal(preview.analysisMeta.decoder, "miniaudio");
  } finally {
    harness.restore();
  }
});

test("CVPC segmentation controller surfaces backend preview failure", async function () {
  const moduleApi = loadModule();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function () {
    return {
      ok: false,
      json: async function () {
        return {
          success: false,
          message: "后端下载当前音频失败，请确认平台音频 URL 仍然有效。",
        };
      },
    };
  };

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/segment/preview",
      silenceThresholdDbfs: -40,
    });

    await assert.rejects(
      runtime.preview({
        audioUrl: "https://oss.example.com/sample.mp3?Signature=expired",
      }),
      /后端下载当前音频失败/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
