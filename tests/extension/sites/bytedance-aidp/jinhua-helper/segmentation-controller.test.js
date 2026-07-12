"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo(
  "extension",
  "sites",
  "bytedance-aidp",
  "jinhua-helper",
  "segmentation-controller.js"
);

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpJinhuaSegmentation;
  return require(modulePath);
}

function installFetchHarness(responsePayload) {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async function (url, options) {
    requests.push({
      url: String(url || ""),
      method: String(options?.method || "GET").toUpperCase(),
      headers: Object.assign({}, options?.headers || {}),
      body: String(options?.body || ""),
    });
    return {
      ok: true,
      json: async function () {
        return responsePayload;
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

test("AIDP segmentation controller forwards audio, duration, existing segments, and incremental scope", async function () {
  const moduleApi = loadModule();
  const harness = installFetchHarness({
    success: true,
    data: {
      proposedSegments: [
        {
          sourceSegmentNumber: 1,
          startMs: 1307,
          endMs: 2023,
        },
        {
          sourceSegmentNumber: 1,
          startMs: 2300,
          endMs: 3024,
        },
      ],
      changes: [
        {
          sourceSegmentNumber: 1,
          originalStartMs: 1307,
          originalEndMs: 3024,
          suggestedSegments: [
            { startMs: 1307, endMs: 2023 },
            { startMs: 2300, endMs: 3024 },
          ],
        },
      ],
    },
    meta: {
      previewMode: "incremental",
      applyAllowed: true,
      rules: {},
    },
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/bytedance-aidp/jinhua-helper/segment/preview",
      silenceThresholdDbfs: -31,
      contextPaddingMs: 400,
    });

    const context = {
      audioUrl: "https://audio.example.com/sample.mp3?signature=masked",
      audioDurationMs: 22013,
      currentSegments: [
        {
          regionId: "region_a",
          segmentNumber: 1,
          startMs: 1307,
          endMs: 3024,
        },
      ],
      selectionKey: "7656690377962016562",
    };

    const preview = await runtime.preview(context);
    const request = harness.requests[0];
    const body = JSON.parse(request.body);

    assert.equal(request.method, "POST");
    assert.equal(
      request.url,
      "https://script.example.com/api/bytedance-aidp/jinhua-helper/segment/preview"
    );
    assert.equal(body.audioUrl, context.audioUrl);
    assert.equal(body.audioDurationMs, 22013);
    assert.equal(body.segmentScope, "existing-segments-incremental");
    assert.deepEqual(body.existingSegments, [
      {
        uniqueId: "region_a",
        sourceSegmentNumber: 1,
        startMs: 1307,
        endMs: 3024,
      },
    ]);
    assert.deepEqual(body.rules, {
      silenceThresholdDbfs: -31,
      minSilenceMs: 400,
      contextPaddingMs: 400,
    });
    assert.deepEqual(body.editorContext, {
      mergeContiguousSuggestedSegmentsEnabled: true,
    });
    assert.equal(preview.meta.previewMode, "incremental");
    assert.equal(preview.selectionKey, "7656690377962016562");
    assert.deepEqual(preview.sourceSegments, context.currentSegments);
  } finally {
    harness.restore();
  }
});

test("AIDP segmentation controller surfaces backend preview errors", async function () {
  const moduleApi = loadModule();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function () {
    return {
      ok: false,
      json: async function () {
        return {
          success: false,
          message: "后端下载当前音频失败。",
        };
      },
    };
  };

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/bytedance-aidp/jinhua-helper/segment/preview",
    });

    await assert.rejects(
      runtime.preview({
        audioUrl: "https://audio.example.com/sample.mp3?signature=masked",
      }),
      /后端下载当前音频失败/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("AIDP segmentation controller defaults context padding to 300ms and silence threshold to -31 dBFS", async function () {
  const moduleApi = loadModule();
  const harness = installFetchHarness({
    success: true,
    data: {
      proposedSegments: [],
      changes: [],
    },
    meta: {},
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/bytedance-aidp/jinhua-helper/segment/preview",
    });

    await runtime.preview({
      audioUrl: "https://audio.example.com/sample.mp3?signature=masked",
      audioDurationMs: 22013,
      currentSegments: [],
    });

    const body = JSON.parse(harness.requests[0].body);

    assert.equal(body.rules.silenceThresholdDbfs, -31);
    assert.equal(body.rules.contextPaddingMs, 300);
    assert.equal(body.editorContext.mergeContiguousSuggestedSegmentsEnabled, true);
  } finally {
    harness.restore();
  }
});

test("AIDP segmentation controller forwards configured silence threshold zero padding and merge toggle", async function () {
  const moduleApi = loadModule();
  const harness = installFetchHarness({
    success: true,
    data: {
      proposedSegments: [],
      changes: [],
    },
    meta: {},
  });

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/bytedance-aidp/jinhua-helper/segment/preview",
      silenceThresholdDbfs: -37,
      contextPaddingMs: 0,
      mergeContiguousSuggestedSegmentsEnabled: false,
    });

    await runtime.preview({
      audioUrl: "https://audio.example.com/sample.mp3?signature=masked",
      audioDurationMs: 22013,
      currentSegments: [],
    });

    const body = JSON.parse(harness.requests[0].body);

    assert.equal(body.rules.silenceThresholdDbfs, -37);
    assert.equal(body.rules.contextPaddingMs, 0);
    assert.equal(body.editorContext.mergeContiguousSuggestedSegmentsEnabled, false);
  } finally {
    harness.restore();
  }
});

