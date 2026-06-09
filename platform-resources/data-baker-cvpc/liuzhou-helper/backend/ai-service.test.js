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
      audioDataUrl: "data:audio/wav;base64,UklGRg==",
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
    lexiconStatus: "ready",
  });

  assert.equal(defaultsPayload.defaults?.timeoutMs, 60000);
  assert.equal(defaultsPayload.defaults?.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(defaultsPayload.defaults?.stages?.refine?.model, "qwen3.5-plus");
  assert.deepEqual(defaultsPayload.supportedModels, {
    listen: ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
    refine: ["qwen3.5-plus", "qwen3.5-flash"],
  });
  assert.equal(healthPayload.defaults?.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(healthPayload.defaults?.stages?.refine?.model, "qwen3.5-plus");
  assert.equal(healthPayload.reference?.lexiconRowCount, 1);
  assert.equal(healthPayload.reference?.lexiconWarning, "");
});

test("liuzhou buildAssetsContext accepts json lexicon assets", function () {
  const assetsContext = buildAssetsContext({
    lexiconJson: {
      schemaVersion: "1",
      language: "liuzhou_dialect",
      mode: "rule_lexicon",
      sourceFiles: ["assets/liuzhou-pronunciation-reference.csv"],
      updatedAt: "2026-06-09T00:00:00.000Z",
      entries: [
        {
          id: "lz-001",
          normalized: "挨",
          display: "挨",
          mandarin: "被",
          aliases: [],
          notes: ["用于被动含义"],
          tags: ["function_word"],
        },
      ],
    },
    ruleText: "规则一",
  });

  assert.equal(assetsContext.lexiconRows.length, 1);
  assert.deepEqual(assetsContext.lexiconRows[0], {
    id: "lz-001",
    normalized: "挨",
    display: "挨",
    mandarin: "被",
    aliases: [],
    notes: ["用于被动含义"],
    tags: ["function_word"],
  });
});

test("liuzhou buildAssetsContext degrades to reference_only when only local csv remains", function () {
  const assetsContext = buildAssetsContext({
    lexiconReferenceCsv: "词,义\n挨,被\n",
    ruleText: "规则一",
  });

  assert.equal(assetsContext.lexiconStatus, "reference_only");
  assert.equal(assetsContext.lexiconWarning, "没有字词对应表");
  assert.deepEqual(assetsContext.lexiconRows, []);
});

test("liuzhou normalizeRecommendRequest maps aiStages into standalone listen/refine config", function () {
  const request = normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,UklGRg==",
    startMs: 18565,
    endMs: 35677,
    aiRecommendModel: "qwen3.5-omni-plus",
    aiStages: {
      listen: {
        model: "qwen3.5-omni-plus",
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

  assert.equal(request.listenModel, "qwen3.5-omni-plus");
  assert.equal(request.refineModel, "qwen3.5-flash");
  assert.equal(request.audioDataUrl, "data:audio/wav;base64,UklGRg==");
  assert.equal(request.aiStages?.listen?.prompt, "listen override");
  assert.equal(request.aiStages?.listen?.params?.top_p, 0.9);
  assert.equal(request.aiStages?.refine?.prompt, "refine override");
  assert.equal(request.aiStages?.refine?.params?.max_tokens, 256);
});

test("liuzhou normalizeRecommendRequest keeps whole-audio url path available", function () {
  const request = normalizeRecommendRequest({
    audioUrl: "https://example.com/current.wav",
    startMs: 0,
    endMs: 1000,
  });

  assert.equal(request.audioUrl, "https://example.com/current.wav");
  assert.equal(request.audioDataUrl, "");
});

test("liuzhou success body keeps three texts plus compatibility aliases", function () {
  const body = buildRecommendSuccessBody({
    requestId: "req-1",
    data: {
      audioDialectText: "听音柳州话。",
      refinedDialectText: "修正柳州话。",
      refinedMandarinText: "整理普通话。",
      audioMandarinText: "整理普通话。",
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
    audioMandarinText: "整理普通话。",
    refinedDialectText: "修正柳州话。",
    refinedMandarinText: "整理普通话。",
    dialectText: "修正柳州话。",
    mandarinText: "整理普通话。",
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

test("liuzhou recommend runs listen plus refine stages and returns heard dialect plus two final texts", async function () {
  const result = await recommend(
    normalizeRecommendRequest(
      createBaseRequest({
        fieldContext: {
          dialectText: "原页面柳州话",
          mandarinText: "原页面普通话",
        },
      })
    ),
    buildAssetsContext({
      lexiconJson: {
        schemaVersion: "1",
        language: "liuzhou_dialect",
        mode: "rule_lexicon",
        sourceFiles: ["assets/liuzhou-pronunciation-reference.csv"],
        updatedAt: "2026-06-09T00:00:00.000Z",
        entries: [
          {
            id: "lz-001",
            normalized: "柳",
            display: "柳",
            mandarin: "柳树",
            aliases: [],
            notes: [],
            tags: [],
          },
        ],
      },
      ruleText: "规则一",
    }),
    {
      now: function () {
        return 1000;
      },
      parseModelJsonText: function (rawText) {
        return JSON.parse(rawText);
      },
      requestOmniInputAudio: async function (input, prompt, options) {
        assert.equal(typeof prompt.systemPrompt, "string");
        assert.equal(input.audioDataUrl, "data:audio/wav;base64,UklGRg==");
        assert.equal(input.audioUrl, "");
        return {
          rawText: JSON.stringify({
            audioDialectText: "柳",
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
        assert.match(prompt.userPrompt || "", /"audioDialectText": "柳。"/);
        assert.match(prompt.userPrompt || "", /柳树/);
        assert.equal(options?.stage, "refine");
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正柳州话",
            refinedMandarinText: "整理普通话",
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

  assert.equal(result.audioDialectText, "柳。");
  assert.equal(result.audioMandarinText, "整理普通话。");
  assert.equal(result.refinedDialectText, "修正柳州话。");
  assert.equal(result.refinedMandarinText, "整理普通话。");
  assert.deepEqual(result.specialTags, ["#um"]);
  assert.deepEqual(result.notes, ["听音备注", "修正备注"]);
  assert.equal(result.models?.listenModel, "qwen3.5-omni-flash");
  assert.equal(result.models?.refineModel, "qwen3.5-plus");
});

test("liuzhou recommend accepts current-segment base64 audio without legacy clip preprocessing", async function () {
  const result = await recommend(
    normalizeRecommendRequest(createBaseRequest()),
    buildAssetsContext({
      lexiconJson: {
        schemaVersion: "1",
        language: "liuzhou_dialect",
        mode: "rule_lexicon",
        sourceFiles: [],
        updatedAt: "2026-06-09T00:00:00.000Z",
        entries: [],
      },
      ruleText: "规则一",
    }),
    {
      requestOmniInputAudio: async function () {
        return {
          rawText: JSON.stringify({
            audioDialectText: "听音柳州话",
          }),
          model: "qwen3.5-omni-flash",
          usage: {},
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正柳州话",
            refinedMandarinText: "整理普通话",
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "听音柳州话。");
  assert.equal(result.audioMandarinText, "整理普通话。");
  assert.equal(result.refinedDialectText, "修正柳州话。");
  assert.equal(result.refinedMandarinText, "整理普通话。");
});

test("liuzhou recommend keeps whole-audio url compatibility for omni listen stage", async function () {
  const result = await recommend(
    normalizeRecommendRequest(
      createBaseRequest({
        audioDataUrl: "",
        audioUrl: "https://example.com/current.wav",
      })
    ),
    buildAssetsContext({
      lexiconJson: {
        schemaVersion: "1",
        language: "liuzhou_dialect",
        mode: "rule_lexicon",
        sourceFiles: ["assets/liuzhou-pronunciation-reference.csv"],
        updatedAt: "2026-06-09T00:00:00.000Z",
        entries: [
          {
            id: "lz-001",
            normalized: "柳",
            display: "柳",
            mandarin: "柳树",
            aliases: [],
            notes: [],
            tags: [],
          },
        ],
      },
      ruleText: "规则一",
    }),
    {
      now: function () {
        return 1000;
      },
      parseModelJsonText: function (rawText) {
        return JSON.parse(rawText);
      },
      requestOmniInputAudio: async function (input, _prompt, options) {
        assert.equal(input.audioUrl, "https://example.com/current.wav");
        assert.equal(input.audioDataUrl, "");
        return {
          rawText: JSON.stringify({
            audioDialectText: "整音频柳州话",
            specialTags: [],
            needHumanReview: false,
            notes: ["听音备注"],
          }),
          model: String(options?.model || "qwen3.5-omni-flash"),
          usage: {},
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "整音频修正柳州话",
            refinedMandarinText: "整音频整理普通话",
            needHumanReview: false,
            notes: ["修正备注"],
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "整音频柳州话。");
  assert.equal(result.audioMandarinText, "整音频整理普通话。");
  assert.equal(result.refinedDialectText, "整音频修正柳州话。");
  assert.equal(result.refinedMandarinText, "整音频整理普通话。");
  assert.equal(result.models?.listenModel, "qwen3.5-omni-flash");
  assert.equal(result.models?.refineModel, "qwen3.5-plus");
});

test("liuzhou listen normalization keeps punctuation and allowed tags without fabricating mandarin text", function () {
  const output = __testOnly.normalizeListenStageOutput({
    audioDialectText: "《挨卵》啊?",
    specialTags: ["#um", "<Bad/>", "<SPK/>"],
    notes: ["  第一条  ", "", "第二条"],
  });

  assert.equal(output.audioDialectText, "挨卵啊？");
  assert.equal(output.audioMandarinText, "");
  assert.deepEqual(output.specialTags, ["#um", "<SPK/>"]);
  assert.deepEqual(output.notes, ["第一条", "第二条"]);
});
