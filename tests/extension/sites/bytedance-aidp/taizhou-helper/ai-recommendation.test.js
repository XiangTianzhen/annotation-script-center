"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo(
  "extension",
  "sites",
  "bytedance-aidp",
  "taizhou-helper",
  "ai-recommendation.js"
);

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouAiRecommendation;
  return require(modulePath);
}

class FakeAudioContext {
  async decodeAudioData() {
    return { duration: 2 };
  }

  async close() {}
}

class FakeOfflineAudioContext {
  constructor(_channels, _frameLength, sampleRate) {
    this.destination = {};
    this.sampleRate = sampleRate;
  }

  createBufferSource() {
    return {
      connect() {},
      start() {},
    };
  }

  async startRendering() {
    return {
      sampleRate: this.sampleRate,
      getChannelData() {
        return new Float32Array(32);
      },
    };
  }
}

test("Taizhou recommendation keeps the audio clip pipeline and posts one Omni config", async function () {
  const previousFetch = globalThis.fetch;
  const previousAudioContext = globalThis.AudioContext;
  const previousOfflineAudioContext = globalThis.OfflineAudioContext;
  const requests = [];
  globalThis.AudioContext = FakeAudioContext;
  globalThis.OfflineAudioContext = FakeOfflineAudioContext;
  globalThis.fetch = async function (url, options) {
    requests.push({ url, options });
    if (!options) {
      return {
        ok: true,
        arrayBuffer: async function () {
          return new ArrayBuffer(8);
        },
      };
    }
    return {
      ok: true,
      json: async function () {
        return {
          success: true,
          listenText: "原始听音",
        };
      },
    };
  };

  try {
    const module = loadModule();
    const runtime = module.createRuntime({
      endpoint: "https://backend.example.test/taizhou",
      timeoutMs: 60000,
      aiUsageOperatorName: "张三",
      aiOmni: {
        model: "qwen3.5-omni-plus",
        enableThinking: true,
        prompt: "单次全模态 Prompt",
        params: { temperature: 0.1, stop: ["END"] },
      },
    });
    const result = await runtime.recommend({
      audioUrl: "https://audio.example.test/item.wav",
      selectionKey: "segment-1",
      selectedRange: { startMs: 100, endMs: 800, durationMs: 700 },
      segmentNumber: 2,
      fieldContext: { text: "" },
      editorContext: { taskId: "task-1" },
    });

    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, "https://audio.example.test/item.wav");
    assert.equal(requests[1].url, "https://backend.example.test/taizhou");
    const body = JSON.parse(requests[1].options.body);
    assert.match(body.audioDataUrl, /^data:audio\/wav;base64,/);
    assert.deepEqual(body.aiOmni, {
      model: "qwen3.5-omni-plus",
      enableThinking: true,
      prompt: "单次全模态 Prompt",
      params: { temperature: 0.1, stop: ["END"] },
    });
    assert.equal(Object.hasOwn(body, "aiStages"), false);
    assert.equal(result.listenText, "原始听音");
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.AudioContext = previousAudioContext;
    globalThis.OfflineAudioContext = previousOfflineAudioContext;
    delete require.cache[modulePath];
    delete globalThis.ASREdgeBytedanceAidpTaizhouAiRecommendation;
  }
});
