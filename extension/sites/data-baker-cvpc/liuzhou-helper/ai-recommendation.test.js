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
  let decodeCount = 0;
  const fakeWindow = {
    setTimeout: function () {
      return 1;
    },
    clearTimeout: function () {},
  };

  class FakeAudioContext {
    async decodeAudioData() {
      decodeCount += 1;
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
    if (String(url).indexOf("/ai/recommend") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            success: true,
            audioDialectText: "听音柳州话。",
            audioMandarinText: "听音普通话。",
            refinedDialectText: "修正柳州话。",
            dialectText: "修正柳州话。",
            mandarinText: "听音普通话。",
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
    getDecodeCount: function () {
      return decodeCount;
    },
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

test("liuzhou ai recommend sends current segment audio as base64 data url", async function () {
  const moduleApi = loadModule();
  const harness = installAudioHarness();

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
      aiUsageOperatorName: "测试员",
      aiStages: {
        listen: {
          model: "qwen3.5-omni-plus",
          prompt: "listen-prompt",
          includeLexiconReference: true,
          params: {
            temperature: 0.1,
            top_p: 0.8,
          },
        },
        refine: {
          model: "qwen3.5-plus",
          prompt: "refine-prompt",
          params: {
            max_tokens: 512,
          },
        },
      },
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
      platformUserName: "柳州标注员",
      platformUserId: "9527",
      fieldContext: {},
      editorContext: {},
    };

    const first = await runtime.recommend(context);
    const second = await runtime.recommend(context);

    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.equal(first.audioDialectText, "听音柳州话。");
    assert.equal(first.audioMandarinText, "听音普通话。");
    assert.equal(first.refinedDialectText, "修正柳州话。");

    const audioFetchCount = harness.calls.filter(function (call) {
      return call.url.indexOf("oss.example.com/sample.mp3") >= 0;
    }).length;
    const recommendCount = harness.calls.filter(function (call) {
      return call.url.indexOf("/ai/recommend") >= 0;
    }).length;
    const clipCacheCount = harness.calls.filter(function (call) {
      return call.url.indexOf("/clip-cache/") >= 0;
    }).length;

    assert.equal(audioFetchCount, 2);
    assert.equal(recommendCount, 2);
    assert.equal(clipCacheCount, 0);

    const recommendCall = harness.calls.find(function (call) {
      return call.url.indexOf("/ai/recommend") >= 0;
    });
    const requestBody = JSON.parse(recommendCall.body);
    assert.match(requestBody.audioDataUrl, /^data:audio\/wav;base64,/);
    assert.equal(requestBody.audioUrl, undefined);
    assert.equal(requestBody.aiUsageOperatorName, "测试员");
    assert.equal(requestBody.platformUserName, "柳州标注员");
    assert.equal(requestBody.platformUserId, "9527");
    assert.deepEqual(requestBody.aiStages, {
      listen: {
        model: "qwen3.5-omni-plus",
        prompt: "listen-prompt",
        includeLexiconReference: true,
        params: {
          temperature: 0.1,
          top_p: 0.8,
        },
      },
      refine: {
        model: "qwen3.5-plus",
        prompt: "refine-prompt",
        params: {
          max_tokens: 512,
        },
      },
    });
  } finally {
    harness.restore();
  }
});

test("liuzhou ai runtime shows lexicon warning from health payload once", async function () {
  const moduleApi = loadModule();
  const originalFetch = globalThis.fetch;
  const originalToast = globalThis.ASREdgeLexiconToast;
  const calls = [];

  globalThis.fetch = async function (url) {
    calls.push(String(url || ""));
    return {
      ok: true,
      json: async function () {
        return {
          success: true,
          reference: {
            lexiconStatus: "reference_only",
            lexiconWarning: "没有字词对应表",
          },
        };
      },
    };
  };
  globalThis.ASREdgeLexiconToast = {
    show: function (message, tone, durationMs) {
      calls.push(["toast", message, tone, durationMs].join(":"));
      return true;
    },
  };

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
    });
    const first = await runtime.notifyLexiconWarning();
    const second = await runtime.notifyLexiconWarning();

    assert.equal(first, true);
    assert.equal(second, false);
    assert.equal(
      calls.filter(function (item) {
        return String(item).indexOf("/health") >= 0;
      }).length,
      1
    );
    assert.ok(
      calls.some(function (item) {
        return String(item).indexOf("toast:没有字词对应表:warn:1000") >= 0;
      })
    );
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.ASREdgeLexiconToast = originalToast;
  }
});

test("liuzhou ai recommendForSegment reuses shared audio source across batch segments", async function () {
  const moduleApi = loadModule();
  const harness = installAudioHarness();

  try {
    const runtime = moduleApi.createRuntime({
      endpoint: "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
      aiUsageOperatorName: "测试员",
    });
    const sharedAudioSource = runtime.createSharedAudioSource(
      "https://oss.example.com/sample.mp3?Signature=batch"
    );

    const first = await runtime.recommendForSegment(
      {
        audioUrl: "https://oss.example.com/sample.mp3?Signature=batch",
        selectionKey: "sample.mp3|0|1200",
        startMs: 0,
        endMs: 1200,
        durationMs: 1200,
        segmentNumber: 1,
        uniqueId: "segment-1",
        platformUserName: "柳州标注员",
        platformUserId: "9527",
      },
      sharedAudioSource
    );
    const second = await runtime.recommendForSegment(
      {
        audioUrl: "https://oss.example.com/sample.mp3?Signature=batch",
        selectionKey: "sample.mp3|1800|3200",
        startMs: 1800,
        endMs: 3200,
        durationMs: 1400,
        segmentNumber: 2,
        uniqueId: "segment-2",
        platformUserName: "柳州标注员",
        platformUserId: "9527",
      },
      sharedAudioSource
    );

    assert.equal(first.selectionKey, "sample.mp3|0|1200");
    assert.equal(first.segmentNumber, 1);
    assert.equal(first.uniqueId, "segment-1");
    assert.equal(second.selectionKey, "sample.mp3|1800|3200");
    assert.equal(second.segmentNumber, 2);
    assert.equal(second.uniqueId, "segment-2");

    const audioFetchCount = harness.calls.filter(function (call) {
      return call.url.indexOf("oss.example.com/sample.mp3") >= 0;
    }).length;
    const recommendCount = harness.calls.filter(function (call) {
      return call.url.indexOf("/ai/recommend") >= 0;
    }).length;

    assert.equal(audioFetchCount, 1);
    assert.equal(harness.getDecodeCount(), 1);
    assert.equal(recommendCount, 2);
  } finally {
    harness.restore();
  }
});
