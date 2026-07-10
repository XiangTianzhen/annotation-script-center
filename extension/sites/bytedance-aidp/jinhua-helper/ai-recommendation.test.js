"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "ai-recommendation.js");

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpJinhuaAiRecommendation;
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

function installOfflineAudioHarness() {
  const originalOfflineAudioContext = globalThis.OfflineAudioContext;
  globalThis.OfflineAudioContext = function OfflineAudioContext(_channels, frameLength, sampleRate) {
    this.destination = {};
    this.createBufferSource = function () {
      return {
        connect: function () {},
        start: function () {},
      };
    };
    this.startRendering = async function () {
      return {
        sampleRate,
        getChannelData: function () {
          return new Float32Array(frameLength);
        },
      };
    };
  };
  return function restore() {
    globalThis.OfflineAudioContext = originalOfflineAudioContext;
  };
}

test("AIDP jinhua AI recommendation forwards configured model mode", async function () {
  const moduleApi = loadModule();
  const fetchHarness = installFetchHarness({
    success: true,
    listenText: "heard",
    finalMandarinText: "final",
    models: {
      modelMode: "expert_omni_plus",
      listenModel: "qwen3.5-omni-plus",
      refineModel: "qwen3.5-omni-plus",
    },
  });
  const restoreOfflineAudio = installOfflineAudioHarness();

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/bytedance-aidp/jinhua-helper/ai/recommend",
      aiUsageOperatorName: "tester",
      modelMode: "expert_omni_plus",
      aiStages: {
        listen: {
          model: "qwen3.5-omni-flash",
        },
        refine: {
          model: "qwen3.5-plus",
        },
      },
    });

    await runtime.recommendForSegment(
      {
        audioUrl: "https://audio.example.com/sample.wav?signature=masked",
        startMs: 0,
        endMs: 1000,
        selectionKey: "segment-1",
      },
      {
        getDecodedBuffer: async function () {
          return {
            duration: 1,
          };
        },
      }
    );

    const body = JSON.parse(fetchHarness.requests[0].body);

    assert.equal(body.modelMode, "expert_omni_plus");
    assert.equal(body.aiStages.listen.model, "qwen3.5-omni-flash");
    assert.equal(body.aiStages.refine.model, "qwen3.5-plus");
  } finally {
    restoreOfflineAudio();
    fetchHarness.restore();
  }
});
