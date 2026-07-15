"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiRecommendationModulePath = resolveRepo(
  "extension",
  "sites",
  "bytedance-aidp",
  "jinhua-helper",
  "ai-recommendation.js"
);

function loadAiRecommendationModule() {
  delete require.cache[aiRecommendationModulePath];
  delete globalThis.ASREdgeBytedanceAidpJinhuaAiRecommendation;
  return require(aiRecommendationModulePath);
}

test("ByteDance AIDP Jinhua AI request serializes the saved custom prompt without legacy aiStages", async function () {
  const moduleApi = loadAiRecommendationModule();
  const originalFetch = globalThis.fetch;
  const originalOfflineAudioContext = globalThis.OfflineAudioContext;
  const requestBodies = [];
  globalThis.fetch = async function (_url, options) {
    requestBodies.push(JSON.parse(String(options?.body || "{}")));
    return {
      ok: true,
      async json() {
        return {
          success: true,
          listenText: "金华话原始听音",
        };
      },
    };
  };
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
        sampleRate: sampleRate,
        getChannelData: function () {
          return new Float32Array(frameLength);
        },
      };
    };
  };

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.test/api/bytedance-aidp/jinhua-helper/ai/recommend",
      aiUsageOperatorName: "tester",
      aiOmni: {
        model: "qwen3.5-omni-plus",
        enableThinking: true,
        prompt: "使用者自定义金华转写 Prompt",
        params: {
          temperature: 0.2,
          max_tokens: 888,
        },
      },
      aiStages: {
        listen: {
          model: "must-not-serialize",
        },
        refine: {
          model: "must-not-serialize",
        },
      },
    });

    await runtime.recommendForSegment(
      {
        audioUrl: "https://audio.example.test/segment.m4a",
        startMs: 0,
        endMs: 1000,
        selectionKey: "segment-1",
      },
      {
        async getDecodedBuffer() {
          return { duration: 1 };
        },
      }
    );

    assert.equal(requestBodies.length, 1);
    assert.deepEqual(requestBodies[0].aiOmni, {
      model: "qwen3.5-omni-plus",
      enableThinking: true,
      prompt: "使用者自定义金华转写 Prompt",
      params: {
        temperature: 0.2,
        max_tokens: 888,
      },
    });
    assert.equal(Object.hasOwn(requestBodies[0], "aiStages"), false);
    assert.equal(JSON.stringify(requestBodies[0]).includes("aiStages"), false);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.OfflineAudioContext = originalOfflineAudioContext;
    delete require.cache[aiRecommendationModulePath];
    delete globalThis.ASREdgeBytedanceAidpJinhuaAiRecommendation;
  }
});
