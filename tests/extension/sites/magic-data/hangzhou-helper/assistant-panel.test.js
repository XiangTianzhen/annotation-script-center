"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveRepo } = require("#repo-paths");

const panelModule = require(resolveRepo(
  "extension",
  "sites",
  "magic-data",
  "hangzhou-helper",
  "assistant-panel.js"
));

test("buildAiStagesPayload creates independent listen refine and single contracts", function () {
  const helper = panelModule.__test__?.buildAiStagesPayload;
  assert.equal(typeof helper, "function");

  const stages = helper({
    aiReviewListenModel: "qwen3.5-omni-flash",
    aiReviewListenPrompt: "听音主提示",
    aiReviewListenTemperature: "0.2",
    aiReviewListenIncludeLexiconReference: false,
    aiReviewListenLexiconPrompt: "听音词表提示",
    aiReviewCompareModel: "qwen3.5-flash",
    aiReviewComparePrompt: "普通话整理提示",
    aiReviewCompareTopP: "0.7",
    aiReviewCompareIncludeLexiconReference: true,
    aiReviewCompareLexiconPrompt: "整理词表提示",
    aiReviewSingleModel: "qwen3.5-omni-flash",
    aiReviewSinglePrompt: "单模型提示",
    aiReviewSingleMaxTokens: "1200",
    aiReviewSingleIncludeLexiconReference: true,
    aiReviewSingleLexiconPrompt: "单模型词表提示",
  });

  assert.deepEqual(stages.listen, {
    model: "qwen3.5-omni-flash",
    prompt: "听音主提示",
    generation: { temperature: 0.2 },
    lexicon: { enabled: false, prompt: "听音词表提示" },
  });
  assert.equal(stages.refine.generation.top_p, 0.7);
  assert.equal(stages.refine.lexicon.enabled, true);
  assert.equal(stages.single.generation.max_tokens, 1200);
});

test("resolveFillAllSuggestionsOutcome treats Hangzhou no-op fills as success", function () {
  const helper = panelModule.__test__?.resolveFillAllSuggestionsOutcome;
  assert.equal(typeof helper, "function");

  const result = helper(0, []);

  assert.deepEqual(result, {
    ok: true,
    noChanges: true,
    appliedCount: 0,
    message: "无需填入，保持当前内容。",
  });
});

test("buildSpeakerDetailRows includes pure dialect judgement rows", function () {
  const helper = panelModule.__test__?.buildSpeakerDetailRows;
  assert.equal(typeof helper, "function");

  const rows = helper({
    gender: {
      isCorrect: true,
      platformValue: "女",
      suggestedValue: "女",
      reason: "",
      confidence: 0.92,
    },
    ageRange: {
      isCorrect: true,
      platformValue: "19-25",
      suggestedValue: "19-25",
      reason: "",
      confidence: 0.81,
    },
    pureDialect: {
      isCorrect: false,
      platformValue: "口音普通话",
      suggestedValue: "纯方言",
      reason: "音频实际更接近纯方言发声。",
      confidence: 0.77,
    },
  });

  assert.ok(Array.isArray(rows));
  assert.equal(rows[10][0], "纯方言判断");
  assert.match(String(rows[10][1]), /错误/);
  assert.equal(rows[11][1], "口音普通话");
  assert.equal(rows[12][1], "纯方言");
  assert.equal(rows[13][1], "音频实际更接近纯方言发声。");
  assert.equal(rows[14][1], "0.77");
});

test("normalizePureDialectOptionValue maps boolean-like values to labels", function () {
  const helper = panelModule.__test__?.normalizePureDialectOptionValue;
  assert.equal(typeof helper, "function");

  assert.equal(helper(true), "纯方言");
  assert.equal(helper(false), "口音普通话");
  assert.equal(helper("true"), "纯方言");
  assert.equal(helper("false"), "口音普通话");
});

test("buildSpeakerDetailRows normalizes boolean pure dialect values for display", function () {
  const helper = panelModule.__test__?.buildSpeakerDetailRows;
  assert.equal(typeof helper, "function");

  const rows = helper({
    pureDialect: {
      isCorrect: false,
      platformValue: false,
      suggestedValue: true,
      reason: "音频更像纯方言。",
      confidence: 0.63,
    },
  });

  assert.equal(rows[11][1], "口音普通话");
  assert.equal(rows[12][1], "纯方言");
});
