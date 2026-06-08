"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  __testOnly,
  buildAssetsContext,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
  recommend,
} = require("./ai-service");

function createBaseRequest(overrides) {
  return Object.assign(
    {
      audioUrl:
        "https://example.com/api/data-baker-cvpc/liuzhou-helper/clip-cache/files/testclip1234567890abcd.wav",
      startMs: 0,
      endMs: 4171,
      fieldContext: {
        dialectText: "",
        mandarinText: "",
      },
      editorContext: {
        selectedEntry: {
          name: "sample.wav",
        },
      },
      aiStages: {
        listen: {
          model: "qwen3.5-omni-flash",
          prompt: "listen prompt",
          params: {
            temperature: 0.1,
          },
        },
        refine: {
          model: "qwen3.5-plus",
          prompt: "refine prompt",
          params: {
            max_tokens: 512,
          },
        },
      },
      timeoutMs: 60000,
    },
    overrides || {}
  );
}

test("liuzhou defaults and health expose staged listen/refine defaults", function () {
  const defaultsPayload = createDefaultsPayload();
  const healthPayload = createHealthPayload({
    rulesText: "规则一",
    lexiconRows: [{}],
  });

  assert.equal(defaultsPayload.defaults?.timeoutMs, 60000);
  assert.equal(defaultsPayload.defaults?.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(defaultsPayload.defaults?.stages?.refine?.model, "qwen3.5-plus");
  assert.deepEqual(defaultsPayload.supportedModels, {
    listen: ["qwen3.5-omni-plus", "qwen3.5-omni-flash", "fun-asr"],
    refine: ["qwen3.5-plus", "qwen3.5-flash"],
  });
  assert.equal(healthPayload.defaults?.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(healthPayload.defaults?.stages?.refine?.model, "qwen3.5-plus");
  assert.equal(healthPayload.reference?.lexiconRowCount, 1);
});

test("liuzhou normalizeRecommendRequest maps aiStages into standalone listen/refine config", function () {
  const request = normalizeRecommendRequest({
    audioUrl: "https://example.com/current.wav",
    startMs: 18565,
    endMs: 35677,
    aiRecommendModel: "qwen3.5-omni-plus",
    aiStages: {
      listen: {
        model: "fun-asr",
        prompt: "listen override",
        params: {
          top_p: 0.9,
        },
      },
      refine: {
        model: "qwen3.5-flash",
        prompt: "refine override",
        params: {
          max_tokens: 256,
        },
      },
    },
  });

  assert.equal(request.listenModel, "fun-asr");
  assert.equal(request.refineModel, "qwen3.5-flash");
  assert.equal(request.aiStages?.listen?.prompt, "listen override");
  assert.equal(request.aiStages?.listen?.params?.top_p, 0.9);
  assert.equal(request.aiStages?.refine?.prompt, "refine override");
  assert.equal(request.aiStages?.refine?.params?.max_tokens, 256);
});

test("liuzhou success body keeps three texts plus compatibility aliases", function () {
  const body = buildRecommendSuccessBody({
    requestId: "req-1",
    data: {
      audioDialectText: "听音柳州话。",
      audioMandarinText: "听音普通话。",
      refinedDialectText: "修正柳州话。",
      specialTags: ["#um", "<SPK/>"],
      needHumanReview: true,
      notes: [" 第一条 "],
      timing: {
        totalMs: 3210,
      },
      models: {
        listenModel: "qwen3.5-omni-flash",
        refineModel: "qwen3.5-plus",
      },
    },
  });

  assert.deepEqual(body, {
    success: true,
    requestId: "req-1",
    audioDialectText: "听音柳州话。",
    audioMandarinText: "听音普通话。",
    refinedDialectText: "修正柳州话。",
    dialectText: "修正柳州话。",
    mandarinText: "听音普通话。",
    specialTags: ["#um", "<SPK/>"],
    needHumanReview: true,
    notes: ["第一条"],
    timing: {
      totalMs: 3210,
    },
    models: {
      listenModel: "qwen3.5-omni-flash",
      refineModel: "qwen3.5-plus",
    },
  });
});

test("liuzhou recommend runs listen plus refine stages and returns three texts", async function () {
  const result = await recommend(
    normalizeRecommendRequest(createBaseRequest()),
    buildAssetsContext({
      lexiconCsv: "柳州话读音,柳州字转写用字,释义\nlau1,柳,柳树",
      ruleText: "规则一",
    }),
    {
      now: function () {
        return 1000;
      },
      readClip: function (clipId) {
        assert.equal(clipId, "testclip1234567890abcd");
        return {
          buffer: Buffer.from("RIFFmock"),
          metadata: {
            clipId,
          },
        };
      },
      parseModelJsonText: function (rawText) {
        return JSON.parse(rawText);
      },
      requestOmniInputAudio: async function (_input, prompt, options) {
        assert.equal(typeof prompt.systemPrompt, "string");
        return {
          rawText: JSON.stringify({
            audioDialectText: "听音柳州话",
            audioMandarinText: "听音普通话",
            specialTags: ["#um"],
            needHumanReview: false,
            notes: ["听音备注"],
          }),
          model: String(options?.model || "qwen3.5-omni-flash"),
          usage: {
            prompt_tokens: 10,
            completion_tokens: 6,
            total_tokens: 16,
          },
          durationMs: 1200,
        };
      },
      requestTextCompareJson: async function (_input, prompt, options) {
        assert.match(prompt.userPrompt || "", /听音柳州话/);
        assert.equal(options?.stage, "refine");
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正柳州话",
            needHumanReview: false,
            notes: ["修正备注"],
          }),
          model: String(options?.model || "qwen3.5-plus"),
          usage: {
            prompt_tokens: 4,
            completion_tokens: 3,
            total_tokens: 7,
          },
          durationMs: 800,
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "听音柳州话。");
  assert.equal(result.audioMandarinText, "听音普通话。");
  assert.equal(result.refinedDialectText, "修正柳州话。");
  assert.deepEqual(result.specialTags, ["#um"]);
  assert.deepEqual(result.notes, ["听音备注", "修正备注"]);
  assert.equal(result.models?.listenModel, "qwen3.5-omni-flash");
  assert.equal(result.models?.refineModel, "qwen3.5-plus");
});

test("liuzhou recommend keeps dual audio outputs when listen model is fun-asr", async function () {
  const stageCalls = [];
  const result = await recommend(
    normalizeRecommendRequest(
      createBaseRequest({
        aiStages: {
          listen: {
            model: "fun-asr",
            prompt: "listen prompt",
            params: {},
          },
          refine: {
            model: "qwen3.5-plus",
            prompt: "refine prompt",
            params: {},
          },
        },
      })
    ),
    buildAssetsContext({
      lexiconCsv: "柳州话读音,柳州字转写用字,释义\nlau1,柳,柳树",
      ruleText: "规则一",
    }),
    {
      now: function () {
        return 1000;
      },
      readClip: function (clipId) {
        assert.equal(clipId, "testclip1234567890abcd");
        return {
          buffer: Buffer.from("RIFFmock"),
          metadata: {
            clipId,
          },
        };
      },
      parseModelJsonText: function (rawText) {
        return JSON.parse(rawText);
      },
      requestFunAsrRecognition: async function () {
        return {
          heardText: "FUN 听音结果",
          model: "fun-asr",
          usage: {},
        };
      },
      requestTextCompareJson: async function (_input, prompt, options) {
        stageCalls.push(String(options?.stage || ""));
        if (options?.stage === "listen_text_bridge") {
          assert.match(prompt.userPrompt || "", /FUN 听音结果/);
          return {
            rawText: JSON.stringify({
              audioDialectText: "桥接柳州话",
              audioMandarinText: "桥接普通话",
              specialTags: [],
              needHumanReview: false,
              notes: ["桥接备注"],
            }),
            model: "qwen3.5-plus",
            usage: {},
          };
        }
        return {
          rawText: JSON.stringify({
            refinedDialectText: "桥接修正柳州话",
            needHumanReview: false,
            notes: ["修正备注"],
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.deepEqual(stageCalls, ["listen_text_bridge", "refine"]);
  assert.equal(result.audioDialectText, "桥接柳州话。");
  assert.equal(result.audioMandarinText, "桥接普通话。");
  assert.equal(result.refinedDialectText, "桥接修正柳州话。");
  assert.equal(result.models?.listenModel, "fun-asr");
  assert.equal(result.models?.refineModel, "qwen3.5-plus");
});

test("liuzhou recommend fails with explicit clip error when temporary audio file is missing", async function () {
  await assert.rejects(
    function () {
      return recommend(
        normalizeRecommendRequest(createBaseRequest()),
        buildAssetsContext({
          lexiconCsv: "",
          ruleText: "规则一",
        }),
        {
          readClip: function (clipId) {
            assert.equal(clipId, "testclip1234567890abcd");
            return null;
          },
        }
      );
    },
    function (error) {
      assert.equal(error.code, "clip-audio-unavailable");
      assert.match(error.message, /临时音频文件不存在/);
      return true;
    }
  );
});

test("liuzhou recommend rejects non clip-cache audio url before running stages", async function () {
  await assert.rejects(
    function () {
      return recommend(
        normalizeRecommendRequest(
          createBaseRequest({
            audioUrl: "https://example.com/audio/current.wav",
          })
        ),
        buildAssetsContext({
          lexiconCsv: "",
          ruleText: "规则一",
        }),
        {}
      );
    },
    function (error) {
      assert.equal(error.code, "invalid-clip-audio-url");
      assert.match(error.message, /audioUrl 必须是当前段临时音频文件地址/);
      return true;
    }
  );
});

test("liuzhou listen normalization keeps punctuation and allowed tags", function () {
  const output = __testOnly.normalizeListenStageOutput({
    audioDialectText: "《挨卵》啊?",
    audioMandarinText: "这个；要顺一下!",
    specialTags: ["#um", "<Bad/>", "<SPK/>"],
    notes: ["  第一条  ", "", "第二条"],
  });

  assert.equal(output.audioDialectText, "挨卵啊？");
  assert.equal(output.audioMandarinText, "这个，要顺一下！");
  assert.deepEqual(output.specialTags, ["#um", "<SPK/>"]);
  assert.deepEqual(output.notes, ["第一条", "第二条"]);
});
