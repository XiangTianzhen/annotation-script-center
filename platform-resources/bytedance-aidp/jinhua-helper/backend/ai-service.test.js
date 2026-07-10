"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadProjectAssets } = require("../../../backend/ai-framework/loaders/project-assets");
const adapter = require("../ai/adapter");
const aiService = require("./ai-service");

const EXPECTED_JINHUA_LEXICON_ROWS = 991;

function createAudioRequest(overrides) {
  return aiService.normalizeRecommendRequest(
    Object.assign(
      {
        audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
        startMs: 0,
        endMs: 1000,
        fieldContext: {
          text: "",
        },
      },
      overrides || {}
    )
  );
}

function createPromptCaptureDeps(captured, listenPayload) {
  let nowValue = 0;
  return {
    now: function () {
      nowValue += 25;
      return nowValue;
    },
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function (_payload, prompt, options) {
      captured.listenPrompt = prompt;
      return {
        model: options.model,
        rawText: JSON.stringify(
          listenPayload || {
            listenText: "",
            isSinging: false,
            isNonJinhuaDialect: false,
            needHumanReview: false,
            notes: [],
          }
        ),
        usage: {},
      };
    },
    requestTextCompareJson: async function (_payload, prompt, options) {
      captured.refinePrompt = prompt;
      return {
        model: options.model,
        rawText: JSON.stringify({
          finalMandarinText: "测试文本。",
          isSinging: false,
          isNonJinhuaDialect: false,
          blockAutoFill: false,
          needHumanReview: false,
          notes: [],
        }),
        usage: {},
      };
    },
  };
}

function loadJinhuaAssetsContext() {
  return aiService.buildAssetsContext(loadProjectAssets(adapter));
}

test("Jinhua ai service trims obvious stutter repeats to at most three copies", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "这这这这这个事情我晓得。",
  });

  assert.equal(result.finalMandarinText, "这这这个事情我晓得。");
});

test("Jinhua ai service keeps meaningful repeated clauses instead of globally deduping", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "吃得，吃得我肚子痛。",
  });

  assert.equal(result.finalMandarinText, "吃得，吃得我肚子痛。");
});

test("Jinhua ai service keeps particles and laughter in the final Mandarin hearing transcript", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "啊哈哈哈，我晓得了。",
  });

  assert.equal(result.finalMandarinText, "啊哈哈哈，我晓得了。");
});

test("Jinhua ai service returns empty string for silence or completely unintelligible results", function () {
  const silent = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "纯静音",
  });
  const unclear = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "完全听不清",
  });

  assert.equal(silent.finalMandarinText, "");
  assert.equal(unclear.finalMandarinText, "");
});

test("Jinhua ai service converts Arabic digits to Chinese numerals and keeps only allowed punctuation", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "他说：今天有3个问题；先看1、2、3!",
  });

  assert.equal(result.finalMandarinText, "他说，今天有三个问题，先看一，二，三！");
});

test("Jinhua ai service preserves unknown-entity wrappers with Chinese punctuation", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "##阿布公司##?",
  });

  assert.equal(result.finalMandarinText, "##阿布公司##？");
});

test("Jinhua ai service defaults split listen-stage judgement fields from refine-stage formatting fields", function () {
  const payload = aiService.createDefaultsPayload();
  const listenPrompt = String(payload.defaults?.stages?.listen?.prompt || "");
  const refinePrompt = String(payload.defaults?.stages?.refine?.prompt || "");

  assert.match(
    listenPrompt,
    /listenText, isSinging, isNonJinhuaDialect, needHumanReview, notes/
  );
  assert.doesNotMatch(listenPrompt, /不要使用阿拉伯数字/);
  assert.doesNotMatch(listenPrompt, /口吃式/);
  assert.match(
    refinePrompt,
    /finalMandarinText, isSinging, isNonJinhuaDialect, blockAutoFill, needHumanReview, notes/
  );
  assert.match(refinePrompt, /不要使用阿拉伯数字/);
  assert.match(refinePrompt, /前日/);
});

test("Jinhua ai service keeps two-stage models as the default mode", function () {
  const request = aiService.normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
    startMs: 0,
    endMs: 1000,
  });

  assert.equal(request.modelMode, "two_stage");
  assert.equal(request.listenModel, "qwen3.5-omni-flash");
  assert.equal(request.refineModel, "qwen3.5-plus");
});

test("Jinhua ai service expert mode forces both stages to qwen3.5-omni-plus", function () {
  const request = aiService.normalizeRecommendRequest({
    modelMode: "expert_omni_plus",
    audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
    aiStages: {
      listen: {
        model: "qwen3.5-omni-flash",
      },
      refine: {
        model: "qwen3.5-plus",
      },
    },
    startMs: 0,
    endMs: 1000,
  });

  assert.equal(request.modelMode, "expert_omni_plus");
  assert.equal(request.listenModel, "qwen3.5-omni-plus");
  assert.equal(request.refineModel, "qwen3.5-omni-plus");
  assert.equal(request.aiStages.listen.model, "qwen3.5-omni-plus");
  assert.equal(request.aiStages.refine.model, "qwen3.5-omni-plus");
});

test("Jinhua ai service defaults expose supported model modes", function () {
  const payload = aiService.createDefaultsPayload();

  assert.equal(payload.defaults.modelMode, "two_stage");
  assert.deepEqual(payload.supportedModelModes, ["two_stage", "expert_omni_plus"]);
  assert.ok(payload.supportedModels.refine.includes("qwen3.5-omni-plus"));
});

test("Jinhua ai service builds runtime lexicon rows from JSON as the primary source", function () {
  const assetsContext = loadJinhuaAssetsContext();

  assert.equal(assetsContext.lexiconStatus, "ready");
  assert.equal(assetsContext.lexiconRowCount, EXPECTED_JINHUA_LEXICON_ROWS);
  assert.equal(assetsContext.lexiconContextLimit, 24);
  assert.equal(assetsContext.lexiconRows.length, EXPECTED_JINHUA_LEXICON_ROWS);
});

test("Jinhua ai service health exposes lexicon runtime metadata", function () {
  const payload = aiService.createHealthPayload(loadJinhuaAssetsContext());

  assert.equal(payload.reference.lexiconSource, "jinhua-lexicon.json");
  assert.equal(payload.reference.lexiconStatus, "ready");
  assert.equal(payload.reference.lexiconRowCount, EXPECTED_JINHUA_LEXICON_ROWS);
  assert.equal(payload.reference.lexiconContextLimit, 24);
});

test("Jinhua listen prompt includes matched JSON lexicon context from field text", async function () {
  const assetsContext = loadJinhuaAssetsContext();
  const captured = {};
  await aiService.recommend(
    createAudioRequest({
      fieldContext: {
        text: "今朝日头很大。",
      },
    }),
    assetsContext,
    createPromptCaptureDeps(captured)
  );

  const userPrompt = String(captured.listenPrompt?.userPrompt || "");
  assert.match(userPrompt, /金华话差异词表上下文/);
  assert.match(userPrompt, /方言正字：日头；普通话：太阳；分类：词汇；发音：ȵiəʔ21diu14/);
});

test("Jinhua refine prompt includes matched JSON lexicon context from listen text", async function () {
  const assetsContext = loadJinhuaAssetsContext();
  const captured = {};
  await aiService.recommend(
    createAudioRequest({
      fieldContext: {
        text: "zzzz-no-lexicon-match",
      },
    }),
    assetsContext,
    createPromptCaptureDeps(captured, {
      listenText: "星很亮。",
      isSinging: false,
      isNonJinhuaDialect: false,
      needHumanReview: false,
      notes: [],
    })
  );

  const userPrompt = String(captured.refinePrompt?.userPrompt || "");
  assert.match(userPrompt, /金华话词义转普通话参考/);
  assert.match(userPrompt, /方言正字：星；普通话：星星；分类：词汇；发音：ɕiŋ334/);
});

test("Jinhua lexicon context does not expand the full table when there is no match", async function () {
  const assetsContext = loadJinhuaAssetsContext();
  const captured = {};
  await aiService.recommend(
    createAudioRequest({
      fieldContext: {
        text: "zzzz-no-lexicon-match",
      },
    }),
    assetsContext,
    createPromptCaptureDeps(captured, {
      listenText: "yyyy-no-lexicon-match",
      isSinging: false,
      isNonJinhuaDialect: false,
      needHumanReview: false,
      notes: [],
    })
  );

  assert.doesNotMatch(String(captured.listenPrompt?.userPrompt || ""), /金华话差异词表上下文/);
  assert.doesNotMatch(String(captured.refinePrompt?.userPrompt || ""), /金华话词义转普通话参考/);
  assert.doesNotMatch(String(captured.refinePrompt?.userPrompt || ""), /方言正字：日头/);
});

test("Jinhua CSV reference is not used as a runtime lexicon fallback", function () {
  const assetsContext = aiService.buildAssetsContext({
    ruleText: "",
    lexiconJson: null,
    lexiconReferenceCsv: "分类,普通话,方言正字【标注参考这列】,发音\n词汇,太阳,日头,nie",
  });

  assert.equal(assetsContext.lexiconStatus, "missing");
  assert.equal(assetsContext.lexiconRowCount, 0);
  assert.equal(assetsContext.lexiconRows.length, 0);
});

test("Jinhua ai service keeps transcript text while blocking auto-fill for singing results", async function () {
  const request = aiService.normalizeRecommendRequest({
    modelMode: "expert_omni_plus",
    requestId: "req-jinhua-singing",
    audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
    startMs: 0,
    endMs: 1800,
    segmentNumber: 2,
    fieldContext: {
      text: "",
    },
    editorContext: {
      query: {
        taskId: "task-1",
      },
    },
  });
  let nowValue = 0;
  const result = await aiService.recommend(
    request,
    {
      rulesText: "fake rules",
    },
    {
      now: function () {
        nowValue += 25;
        return nowValue;
      },
      normalizeUsage: function (usage) {
        return usage || {};
      },
      requestOmniInputAudio: async function (_payload, _prompt, options) {
        return {
          model: options.model,
          rawText: JSON.stringify({
            listenText: "这一段像在唱歌。",
            isSinging: true,
            isNonJinhuaDialect: false,
            needHumanReview: false,
            notes: ["听音阶段识别为唱歌"],
          }),
          usage: {
            total_tokens: 10,
          },
        };
      },
      requestTextCompareJson: async function (_payload, _prompt, options) {
        return {
          model: options.model,
          rawText: JSON.stringify({
            finalMandarinText: "这一段像在唱歌，但是还是能听出歌词。",
            isSinging: true,
            isNonJinhuaDialect: false,
            blockAutoFill: true,
            needHumanReview: true,
            notes: ["收口阶段要求人工复核"],
          }),
          usage: {
            total_tokens: 20,
          },
        };
      },
    }
  );

  assert.equal(result.listenText, "这一段像在唱歌。");
  assert.equal(result.finalMandarinText, "这一段像在唱歌，但是还是能听出歌词。");
  assert.equal(result.isSinging, true);
  assert.equal(result.isNonJinhuaDialect, false);
  assert.equal(result.blockAutoFill, true);
  assert.equal(result.needHumanReview, true);
  assert.equal(result.models.modelMode, "expert_omni_plus");
  assert.equal(result.models.listenModel, "qwen3.5-omni-plus");
  assert.equal(result.models.refineModel, "qwen3.5-omni-plus");
  assert.deepEqual(result.notes, ["听音阶段识别为唱歌", "收口阶段要求人工复核"]);
});
