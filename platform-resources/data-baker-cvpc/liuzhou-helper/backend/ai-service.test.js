"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  __testOnly,
  buildAssetsContext,
  buildRecommendErrorBody,
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

function createLexiconAssetsContext(entries) {
  return buildAssetsContext({
    lexiconJson: {
      schemaVersion: "1",
      language: "liuzhou_dialect",
      mode: "rule_lexicon",
      sourceFiles: ["assets/liuzhou-pronunciation-reference.csv"],
      updatedAt: "2026-06-09T00:00:00.000Z",
      entries: Array.isArray(entries) ? entries : [],
    },
    ruleText: "规则一",
  });
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
  assert.equal(defaultsPayload.defaults?.stages?.listen?.includeLexiconReference, false);
  assert.equal(defaultsPayload.defaults?.stages?.refine?.model, "qwen3.5-plus");
  assert.deepEqual(defaultsPayload.supportedModels, {
    listen: ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
    refine: ["qwen3.5-plus", "qwen3.5-flash"],
  });
  assert.equal(healthPayload.defaults?.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(healthPayload.defaults?.stages?.listen?.includeLexiconReference, false);
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
          attributes: {
            pronunciation: "ǎi",
            usageContext: "被动含义",
          },
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
    attributes: {
      pronunciation: "ǎi",
      usageContext: "被动含义",
    },
  });
});

test("liuzhou buildAssetsContext keeps lexicon attributes and parses reference csv as prompt-only rows", function () {
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
          normalized: "闹隆",
          display: "闹隆",
          mandarin: "热闹兴旺",
          aliases: ["闹拢"],
          notes: ["常见口语"],
          tags: ["commerce"],
          attributes: {
            pronunciation: "nao long",
          },
        },
      ],
    },
    lexiconReferenceCsv: [
      "柳州话读音,柳州字转写用字,释义",
      "nao long,闹隆,生意火爆；热闹",
      ",青辣椒,青辣椒",
    ].join("\n"),
    ruleText: "规则一",
  });

  assert.equal(assetsContext.lexiconRows[0].attributes?.pronunciation, "nao long");
  assert.deepEqual(assetsContext.referenceRows, [
    {
      pronunciation: "nao long",
      dialectWord: "闹隆",
      meaning: "生意火爆；热闹",
      aliases: [],
      source: "liuzhou-pronunciation-reference.csv",
    },
    {
      pronunciation: "",
      dialectWord: "青辣椒",
      meaning: "青辣椒",
      aliases: [],
      source: "liuzhou-pronunciation-reference.csv",
    },
  ]);
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
        includeLexiconReference: true,
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
  assert.equal(request.aiStages?.listen?.includeLexiconReference, true);
  assert.equal(request.aiStages?.listen?.params?.top_p, 0.9);
  assert.equal(request.aiStages?.refine?.prompt, "refine override");
  assert.equal(request.aiStages?.refine?.params?.max_tokens, 256);
});

test("liuzhou listen prompt omits rules and editor context when lexicon reference is disabled", async function () {
  let capturedPrompt = null;
  await recommend(
    normalizeRecommendRequest(
      createBaseRequest({
        aiStages: {
          listen: {
            model: "qwen3.5-omni-flash",
            prompt: "listen prompt",
            includeLexiconReference: false,
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
      requestOmniInputAudio: async function (_input, prompt) {
        capturedPrompt = prompt;
        return {
          rawText: JSON.stringify({
            audioDialectText: "柳",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-omni-flash",
          usage: {},
          durationMs: 100,
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正柳州话",
            refinedMandarinText: "整理普通话",
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-plus",
          usage: {},
          durationMs: 50,
        };
      },
    }
  );

  assert.equal(typeof capturedPrompt?.userPrompt, "string");
  assert.doesNotMatch(capturedPrompt.userPrompt, /项目规则摘要/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /词表参考/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /fieldContext/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /selectedEntry/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /startMs/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /endMs/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /durationMs/);
});

test("liuzhou listen prompt only restores lexicon reference when enabled", async function () {
  let capturedPrompt = null;
  await recommend(
    normalizeRecommendRequest(
      createBaseRequest({
        aiStages: {
          listen: {
            model: "qwen3.5-omni-flash",
            prompt: "listen prompt",
            includeLexiconReference: true,
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
      requestOmniInputAudio: async function (_input, prompt) {
        capturedPrompt = prompt;
        return {
          rawText: JSON.stringify({
            audioDialectText: "柳",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-omni-flash",
          usage: {},
          durationMs: 100,
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正柳州话",
            refinedMandarinText: "整理普通话",
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-plus",
          usage: {},
          durationMs: 50,
        };
      },
    }
  );

  assert.equal(typeof capturedPrompt?.userPrompt, "string");
  assert.match(capturedPrompt.userPrompt, /词表参考/);
  assert.match(capturedPrompt.userPrompt, /柳树/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /项目规则摘要/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /fieldContext/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /selectedEntry/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /startMs/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /endMs/);
  assert.doesNotMatch(capturedPrompt.userPrompt, /durationMs/);
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
      audioDialectTokens: [
        { type: "text", content: "听音" },
        { type: "tag", content: "#eh" },
        { type: "text", content: "柳州话。" },
      ],
      refinedDialectText: "修正柳州话。",
      refinedDialectTokens: [
        { type: "text", content: "修正" },
        { type: "tag", content: "<SPK/>" },
        { type: "text", content: "柳州话。" },
      ],
      refinedMandarinText: "整理普通话。",
      audioMandarinText: "整理普通话。",
      candidateAlternatives: [
        {
          dialectText: "听音柳州话。",
          mandarinText: "听音普通话。",
          reason: "原始听音",
        },
        {
          dialectText: "近音柳州话。",
          mandarinText: "近音普通话。",
          reason: "近音候选",
        },
      ],
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
      usage: {
        listen: {
          promptTokens: 10,
          completionTokens: 6,
          totalTokens: 16,
        },
        refine: {
          promptTokens: 4,
          completionTokens: 3,
          totalTokens: 7,
        },
      },
    },
  });

  assert.deepEqual(body, {
    success: true,
    requestId: "req-1",
    audioDialectText: "听音柳州话。",
    audioDialectTokens: [
      { type: "text", content: "听音" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "柳州话。" },
    ],
    audioMandarinText: "整理普通话。",
    refinedDialectText: "修正柳州话。",
    refinedDialectTokens: [
      { type: "text", content: "修正" },
      { type: "tag", content: "<SPK/>" },
      { type: "text", content: "柳州话。" },
    ],
    refinedMandarinText: "整理普通话。",
    dialectText: "修正柳州话。",
    mandarinText: "整理普通话。",
    candidateAlternatives: [
      {
        dialectText: "听音柳州话。",
        dialectTokens: [{ type: "text", content: "听音柳州话。" }],
        mandarinText: "听音普通话。",
        reason: "原始听音",
      },
      {
        dialectText: "近音柳州话。",
        dialectTokens: [{ type: "text", content: "近音柳州话。" }],
        mandarinText: "近音普通话。",
        reason: "近音候选",
      },
    ],
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
    usage: {
      listen: {
        promptTokens: 10,
        completionTokens: 6,
        totalTokens: 16,
      },
      refine: {
        promptTokens: 4,
        completionTokens: 3,
        totalTokens: 7,
      },
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
            attributes: {
              pronunciation: "liu",
            },
          },
          {
            id: "lz-002",
            normalized: "扭",
            display: "扭",
            mandarin: "扭动",
            aliases: [],
            notes: [],
            tags: [],
            attributes: {
              pronunciation: "niu",
            },
          },
          {
            id: "lz-003",
            normalized: "柳州",
            display: "柳州",
            mandarin: "柳州",
            aliases: [],
            notes: [],
            tags: [],
            attributes: {
              pronunciation: "liu zhou",
            },
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
        assert.match(prompt.systemPrompt || "", /#um/);
        assert.match(prompt.systemPrompt || "", /<SPK\/>/);
        assert.match(prompt.systemPrompt || "", /candidatePhrases/);
        assert.equal(input.audioDataUrl, "data:audio/wav;base64,UklGRg==");
        assert.equal(input.audioUrl, "");
        return {
          rawText: JSON.stringify({
            audioDialectText: "柳#um",
            candidatePhrases: ["扭#um", "柳州#um"],
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
        assert.match(prompt.userPrompt || "", /"audioDialectText": "柳#um。"/);
        assert.match(prompt.userPrompt || "", /"candidatePhrases": \[/);
        assert.match(prompt.userPrompt || "", /扭#um。/);
        assert.match(prompt.userPrompt || "", /柳树/);
        assert.equal(options?.stage, "refine");
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正#ah柳州话",
            refinedMandarinText: "整理普通话",
            candidateAlternatives: [
              {
                dialectText: "柳#um",
                mandarinText: "柳树",
                reason: "原始听音",
              },
              {
                dialectText: "扭#um",
                mandarinText: "扭动",
                reason: "近音候选",
              },
            ],
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

  assert.equal(result.audioDialectText, "柳#um。");
  assert.equal(result.audioMandarinText, "啊整理普通话。");
  assert.equal(result.refinedDialectText, "修正#ah柳州话。");
  assert.equal(result.refinedMandarinText, "啊整理普通话。");
  assert.deepEqual(result.audioDialectTokens, [
    { type: "text", content: "柳" },
    { type: "tag", content: "#um" },
    { type: "text", content: "。" },
  ]);
  assert.deepEqual(result.refinedDialectTokens, [
    { type: "text", content: "修正" },
    { type: "tag", content: "#ah" },
    { type: "text", content: "柳州话。" },
  ]);
  assert.deepEqual(result.specialTags, ["#ah", "#um"]);
  assert.deepEqual(result.candidateAlternatives, [
    {
      dialectText: "柳#um。",
      dialectTokens: [
        { type: "text", content: "柳" },
        { type: "tag", content: "#um" },
        { type: "text", content: "。" },
      ],
      mandarinText: "柳树。",
      reason: "原始听音",
    },
    {
      dialectText: "扭#um。",
      dialectTokens: [
        { type: "text", content: "扭" },
        { type: "tag", content: "#um" },
        { type: "text", content: "。" },
      ],
      mandarinText: "扭动。",
      reason: "近音候选",
    },
    {
      dialectText: "柳州#um。",
      dialectTokens: [
        { type: "text", content: "柳州" },
        { type: "tag", content: "#um" },
        { type: "text", content: "。" },
      ],
      mandarinText: "柳州。",
      reason: "听音近音候选",
    },
  ]);
  assert.deepEqual(result.notes, ["听音备注", "修正备注"]);
  assert.equal(result.models?.listenModel, "qwen3.5-omni-flash");
  assert.equal(result.models?.refineModel, "qwen3.5-plus");
  assert.equal(result.needHumanReview, true);
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
            audioDialectText: "听音#eh柳州话",
          }),
          model: "qwen3.5-omni-flash",
          usage: {},
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "修正#eh柳州话",
            refinedMandarinText: "整理普通话",
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "听音#eh柳州话。");
  assert.equal(result.audioMandarinText, "诶整理普通话。");
  assert.equal(result.refinedDialectText, "修正#eh柳州话。");
  assert.equal(result.refinedMandarinText, "诶整理普通话。");
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

test("liuzhou recommend infers eh tag from hesitation and restores mandarin particle", async function () {
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
            audioDialectText: "呃，身材又好哩。",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-omni-plus",
          usage: {},
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "#eh，身材又好哩。",
            refinedMandarinText: "身材又好呢。",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "#eh，身材又好哩。");
  assert.deepEqual(result.audioDialectTokens, [
    { type: "tag", content: "#eh" },
    { type: "text", content: "，身材又好哩。" },
  ]);
  assert.equal(result.audioMandarinText, "诶，身材又好呢。");
  assert.equal(result.refinedDialectText, "#eh，身材又好哩。");
  assert.deepEqual(result.refinedDialectTokens, [
    { type: "tag", content: "#eh" },
    { type: "text", content: "，身材又好哩。" },
  ]);
  assert.equal(result.refinedMandarinText, "诶，身材又好呢。");
  assert.deepEqual(result.specialTags, ["#eh"]);
});

test("liuzhou recommend converts repeated laughter into spk tags", async function () {
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
            audioDialectText: "呵呵呵呵，你没够机会你，呵呵呵。",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-omni-plus",
          usage: {},
        };
      },
      requestTextCompareJson: async function () {
        return {
          rawText: JSON.stringify({
            refinedDialectText: "呵呵呵呵，你没够机会你，呵呵呵。",
            refinedMandarinText: "你不够机会。",
            specialTags: [],
            needHumanReview: false,
            notes: [],
          }),
          model: "qwen3.5-plus",
          usage: {},
        };
      },
    }
  );

  assert.equal(result.audioDialectText, "<SPK/>你没够机会你<SPK/>。");
  assert.deepEqual(result.audioDialectTokens, [
    { type: "tag", content: "<SPK/>" },
    { type: "text", content: "你没够机会你" },
    { type: "tag", content: "<SPK/>" },
    { type: "text", content: "。" },
  ]);
  assert.equal(result.refinedDialectText, "<SPK/>你没够机会你<SPK/>。");
  assert.deepEqual(result.refinedDialectTokens, [
    { type: "tag", content: "<SPK/>" },
    { type: "text", content: "你没够机会你" },
    { type: "tag", content: "<SPK/>" },
    { type: "text", content: "。" },
  ]);
  assert.equal(result.refinedMandarinText, "你不够机会。");
  assert.deepEqual(result.specialTags, ["<SPK/>"]);
});

test("liuzhou listen normalization keeps punctuation and allowed tags without fabricating mandarin text", function () {
  const output = __testOnly.normalizeListenStageOutput({
    audioDialectText: "《挨卵》#um啊?",
    specialTags: ["#um", "<Bad/>", "<SPK/>"],
    notes: ["  第一条  ", "", "第二条"],
  });

  assert.equal(output.audioDialectText, "挨卵#um啊？");
  assert.equal(output.audioMandarinText, "");
  assert.deepEqual(output.audioDialectTokens, [
    { type: "text", content: "挨卵" },
    { type: "tag", content: "#um" },
    { type: "text", content: "啊？" },
  ]);
  assert.deepEqual(output.specialTags, ["#um", "<SPK/>"]);
  assert.deepEqual(output.notes, ["第一条", "第二条"]);
});

test("liuzhou listen normalization removes unsupported tags and flags manual review", function () {
  const output = __testOnly.normalizeListenStageOutput({
    audioDialectText: "走路<Bad/>望望",
    specialTags: [],
    notes: [],
  });

  assert.equal(output.audioDialectText, "走路望望。");
  assert.deepEqual(output.audioDialectTokens, [
    { type: "text", content: "走路望望。" },
  ]);
  assert.equal(output.needHumanReview, true);
  assert.match(output.notes.join(" "), /不支持/);
});

test("liuzhou listen normalization removes duplicated punctuation around tags", function () {
  const output = __testOnly.normalizeListenStageOutput({
    audioDialectText: "都七十岁了，#eh，明日古稀了",
    specialTags: [],
    notes: [],
  });

  assert.equal(output.audioDialectText, "都七十岁了#eh，明日古稀了。");
  assert.deepEqual(output.audioDialectTokens, [
    { type: "text", content: "都七十岁了" },
    { type: "tag", content: "#eh" },
    { type: "text", content: "，明日古稀了。" },
  ]);
  assert.equal(output.needHumanReview, true);
  assert.match(output.notes.join(" "), /重复标点/);
});

test("liuzhou buildRecommendErrorBody exposes sanitized debug fields for frontend additional info", function () {
  const body = buildRecommendErrorBody({
    requestId: "request-1",
    error: {
      code: "model-json-parse-failed",
      safeMessage: "模型输出 JSON 解析失败，可查看原始 AI 返回。",
      debugRawJson: {
        rawResponseText: "{\"audioDialectText\":\"示例\"}",
        authorization: "<redacted>",
      },
      debugRawAiResponse: {
        rawText: "{\"audioDialectText\":\"示例\"}",
        signedAudioUrl: "<redacted>",
      },
      usage: {
        total_tokens: 12,
      },
      models: {
        listenModel: "qwen3.5-omni-flash",
      },
      timing: {
        totalMs: 3210,
      },
      specialTags: ["#um"],
      needHumanReview: true,
      notes: ["保守处理"],
      audioDialectText: "原始柳州话",
      audioDialectTokens: [
        { type: "text", content: "原始" },
        { type: "tag", content: "#hmm" },
        { type: "text", content: "柳州话" },
      ],
    },
  });

  assert.deepEqual(body, {
    success: false,
    requestId: "request-1",
    code: "model-json-parse-failed",
    message: "模型输出 JSON 解析失败，可查看原始 AI 返回。",
    rawResponse: {
      rawText: "{\"audioDialectText\":\"示例\"}",
      signedAudioUrl: "<redacted>",
    },
    debugRawJson: {
      rawResponseText: "{\"audioDialectText\":\"示例\"}",
      authorization: "<redacted>",
    },
    usage: {
      total_tokens: 12,
    },
    models: {
      listenModel: "qwen3.5-omni-flash",
    },
    timing: {
      totalMs: 3210,
    },
    specialTags: ["#um"],
    needHumanReview: true,
    notes: ["保守处理"],
    audioDialectText: "原始柳州话",
    audioDialectTokens: [
      { type: "text", content: "原始" },
      { type: "tag", content: "#hmm" },
      { type: "text", content: "柳州话" },
    ],
    audioMandarinText: "",
    refinedDialectText: "原始柳州话",
    refinedDialectTokens: [
      { type: "text", content: "原始" },
      { type: "tag", content: "#hmm" },
      { type: "text", content: "柳州话" },
    ],
    refinedMandarinText: "",
    dialectText: "原始柳州话",
    mandarinText: "",
  });
});

test("liuzhou buildRecommendErrorBody maps qwen data inspection failures to readable risk-control message", function () {
  const body = buildRecommendErrorBody({
    requestId: "request-risk-1",
    error: {
      code: "provider-http-error",
      message: "Qwen SSE 返回错误。",
      debugRawAiResponse: {
        provider: "qwen",
        providerCode: "data_inspection_failed",
        providerStatus: 429,
        error: {
          code: "data_inspection_failed",
          message: "<400> InternalError.Algo.DataInspectionFailed: Output data may contain inappropriate content.",
        },
      },
    },
  });

  assert.equal(body.success, false);
  assert.equal(body.requestId, "request-risk-1");
  assert.equal(body.code, "provider-http-error");
  assert.equal(body.message, "Qwen 输出触发内容风控（内容审查拦截），请人工复核或重试。");
  assert.equal(body.rawResponse.providerCode, "data_inspection_failed");
});

test("liuzhou recommend keeps fallback dialect and mandarin texts when listen stage JSON parse fails", async function () {
  await assert.rejects(
    async function () {
      await recommend(
        normalizeRecommendRequest(createBaseRequest()),
        createLexiconAssetsContext([
          {
            id: "lz-001",
            normalized: "娃仔",
            display: "娃仔",
            mandarin: "小孩",
            aliases: [],
            notes: [],
            tags: [],
          },
        ]),
        {
          requestOmniInputAudio: async function () {
            return {
              rawText: "娃仔",
              model: "qwen3.5-omni-flash",
              usage: {
                prompt_tokens: 15,
                completion_tokens: 8,
                total_tokens: 23,
              },
              durationMs: 320,
            };
          },
          requestTextCompareJson: async function () {
            throw new Error("refine should not run after listen parse failure");
          },
        }
      );
    },
    function (error) {
      const body = buildRecommendErrorBody({
        requestId: "listen-fallback",
        error: error,
      });

      assert.equal(body.code, "model-json-parse-failed");
      assert.equal(body.audioDialectText, "娃仔。");
      assert.equal(body.audioMandarinText, "小孩。");
      assert.equal(body.refinedDialectText, "娃仔。");
      assert.equal(body.refinedMandarinText, "小孩。");
      assert.equal(body.dialectText, "娃仔。");
      assert.equal(body.mandarinText, "小孩。");
      assert.deepEqual(body.audioDialectTokens, [{ type: "text", content: "娃仔。" }]);
      assert.deepEqual(body.refinedDialectTokens, [{ type: "text", content: "娃仔。" }]);
      assert.equal(body.needHumanReview, true);
      assert.match(body.notes.join(" "), /保守兜底/);
      assert.equal(body.models?.listenModel, "qwen3.5-omni-flash");
      assert.equal(body.usage?.listen?.totalTokens, 23);
      assert.equal(body.timing?.listenMs >= 0, true);
      assert.equal(body.debugRawJson?.rawModelText, "娃仔");
      assert.equal(body.rawResponse?.rawText, "娃仔");
      assert.doesNotMatch(JSON.stringify(body), /authorization/i);
      return true;
    }
  );
});

test("liuzhou recommend keeps listen fallback texts when refine stage JSON parse fails", async function () {
  await assert.rejects(
    async function () {
      await recommend(
        normalizeRecommendRequest(createBaseRequest()),
        createLexiconAssetsContext([
          {
            id: "lz-001",
            normalized: "娃仔",
            display: "娃仔",
            mandarin: "小孩",
            aliases: [],
            notes: [],
            tags: [],
          },
        ]),
        {
          requestOmniInputAudio: async function () {
            return {
              rawText: JSON.stringify({
                audioDialectText: "娃仔",
                needHumanReview: false,
                notes: ["听音成功"],
              }),
              model: "qwen3.5-omni-flash",
              usage: {
                prompt_tokens: 12,
                completion_tokens: 5,
                total_tokens: 17,
              },
              durationMs: 280,
            };
          },
          requestTextCompareJson: async function () {
            return {
              rawText: "普通自由文本，不是 JSON",
              model: "qwen3.5-plus",
              usage: {
                prompt_tokens: 22,
                completion_tokens: 9,
                total_tokens: 31,
              },
              durationMs: 410,
            };
          },
        }
      );
    },
    function (error) {
      const body = buildRecommendErrorBody({
        requestId: "refine-fallback",
        error: error,
      });

      assert.equal(body.code, "model-json-parse-failed");
      assert.equal(body.audioDialectText, "娃仔。");
      assert.equal(body.audioMandarinText, "小孩。");
      assert.equal(body.refinedDialectText, "娃仔。");
      assert.equal(body.refinedMandarinText, "小孩。");
      assert.equal(body.dialectText, "娃仔。");
      assert.equal(body.mandarinText, "小孩。");
      assert.deepEqual(body.audioDialectTokens, [{ type: "text", content: "娃仔。" }]);
      assert.deepEqual(body.refinedDialectTokens, [{ type: "text", content: "娃仔。" }]);
      assert.equal(body.needHumanReview, true);
      assert.match(body.notes.join(" "), /听音成功/);
      assert.match(body.notes.join(" "), /保守兜底/);
      assert.equal(body.models?.listenModel, "qwen3.5-omni-flash");
      assert.equal(body.models?.refineModel, "qwen3.5-plus");
      assert.equal(body.usage?.listen?.totalTokens, 17);
      assert.equal(body.usage?.refine?.totalTokens, 31);
      assert.equal(body.debugRawJson?.rawModelText, "普通自由文本，不是 JSON");
      assert.equal(body.rawResponse?.rawText, "普通自由文本，不是 JSON");
      assert.doesNotMatch(JSON.stringify(body), /Signature=/);
      return true;
    }
  );
});
