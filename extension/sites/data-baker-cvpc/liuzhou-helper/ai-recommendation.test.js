"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "ai-recommendation.js");

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouAiRecommendation;
  return require(modulePath);
}

function installAudioHarness() {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalAudioContext = globalThis.AudioContext;
  const originalOfflineAudioContext = globalThis.OfflineAudioContext;
  const originalWebkitOfflineAudioContext = globalThis.webkitOfflineAudioContext;

  const calls = [];
  const fakeWindow = {
    setTimeout: function () {
      return 1;
    },
    clearTimeout: function () {},
  };

  class FakeAudioContext {
    async decodeAudioData() {
      return {
        duration: 12,
        sampleRate: 48000,
        numberOfChannels: 1,
        getChannelData: function () {
          return new Float32Array(48000);
        },
      };
    }

    close() {
      return Promise.resolve();
    }
  }

  class FakeOfflineAudioContext {
    constructor(_channels, length, sampleRate) {
      this.length = length;
      this.sampleRate = sampleRate;
      this.destination = {};
    }

    createBufferSource() {
      return {
        connect: function () {},
        start: function () {},
      };
    }

    async startRendering() {
      return {
        length: this.length,
        sampleRate: this.sampleRate,
        numberOfChannels: 1,
        getChannelData: function () {
          return new Float32Array(Math.max(1, this.length || 1)).fill(0.2);
        }.bind(this),
      };
    }
  }

  globalThis.window = fakeWindow;
  globalThis.AudioContext = FakeAudioContext;
  globalThis.OfflineAudioContext = FakeOfflineAudioContext;
  globalThis.webkitOfflineAudioContext = FakeOfflineAudioContext;
  globalThis.fetch = async function (url, options) {
    calls.push({
      url: String(url || ""),
      method: String(options?.method || "GET").toUpperCase(),
      body: options?.body || "",
    });
    if (String(url).indexOf("/clip-cache/upload") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            success: true,
            clipId: "clip-1",
            audioUrl:
              "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/clip-cache/files/clip-1.wav",
            expiresAt: "2099-01-01T00:00:00.000Z",
          };
        },
      };
    }
    if (String(url).indexOf("/ai/recommend") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            success: true,
            dialectText: "柳州话。",
            mandarinText: "普通话。",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          };
        },
      };
    }
    return {
      ok: true,
      arrayBuffer: async function () {
        return new Uint8Array([1, 2, 3, 4]).buffer;
      },
    };
  };

  return {
    calls,
    restore: function () {
      globalThis.fetch = originalFetch;
      globalThis.window = originalWindow;
      globalThis.AudioContext = originalAudioContext;
      globalThis.OfflineAudioContext = originalOfflineAudioContext;
      globalThis.webkitOfflineAudioContext = originalWebkitOfflineAudioContext;
    },
  };
}

test("liuzhou ai recommend fails closed when selectedRange is missing", async function () {
  const moduleApi = loadModule();
  const runtime = moduleApi.createRuntime({
    endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
    clipCacheUploadEndpoint:
      "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/clip-cache/upload",
  });

  await assert.rejects(
    function () {
      return runtime.recommend({
        audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
        selectionKey: "sample.mp3|0|4171",
      });
    },
    /开始\/结束时间/
  );
});

test("liuzhou ai recommend reuses uploaded clip cache for the same selectionKey before expiry", async function () {
  const moduleApi = loadModule();
  const harness = installAudioHarness();

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
      clipCacheUploadEndpoint:
        "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/clip-cache/upload",
      aiUsageOperatorName: "测试员",
    });
    const context = {
      audioUrl: "https://oss.example.com/sample.mp3?Signature=audio",
      selectionKey: "sample.mp3|18565|35677",
      selectedRange: {
        startMs: 18565,
        endMs: 35677,
        durationMs: 17112,
      },
      selectedEntry: {
        name: "sample.mp3",
      },
      fieldContext: {},
      editorContext: {},
    };

    const first = await runtime.recommend(context);
    const second = await runtime.recommend(context);

    assert.equal(first.success, true);
    assert.equal(second.success, true);

    const audioFetchCount = harness.calls.filter(function (call) {
      return call.url.indexOf("oss.example.com/sample.mp3") >= 0;
    }).length;
    const uploadCount = harness.calls.filter(function (call) {
      return call.url.indexOf("/clip-cache/upload") >= 0;
    }).length;
    const recommendCount = harness.calls.filter(function (call) {
      return call.url.indexOf("/ai/recommend") >= 0;
    }).length;

    assert.equal(audioFetchCount, 1);
    assert.equal(uploadCount, 1);
    assert.equal(recommendCount, 2);
  } finally {
    harness.restore();
  }
});
