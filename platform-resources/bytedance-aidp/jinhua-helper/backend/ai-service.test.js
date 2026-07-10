"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const aiService = require("./ai-service");

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
