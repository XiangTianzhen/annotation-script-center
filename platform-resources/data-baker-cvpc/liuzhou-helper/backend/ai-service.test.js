"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  __testOnly,
  buildRecommendSuccessBody,
} = require("./ai-service");

test("liuzhou ai normalization keeps only supported punctuation and strips book title marks", function () {
  const output = __testOnly.normalizeRecommendationOutput({
    dialectText: "《挨卵》啊?",
    mandarinText: "这个；要顺一下!",
    specialTags: ["#um", "<Bad/>", "<SPK/>"],
    notes: ["  第一条  ", "", "第二条"],
  });

  assert.equal(output.dialectText, "挨卵啊？");
  assert.equal(output.mandarinText, "这个，要顺一下！");
  assert.deepEqual(output.specialTags, ["#um", "<SPK/>"]);
  assert.deepEqual(output.notes, ["第一条", "第二条"]);
});

test("liuzhou ai normalization can recover supported tags from returned text", function () {
  const output = __testOnly.normalizeRecommendationOutput({
    dialectText: "#eh 这个。",
    mandarinText: "<SPK/> 好的。",
    specialTags: [],
  });

  assert.deepEqual(output.specialTags, ["#eh", "<SPK/>"]);
});

test("liuzhou ai success body keeps the public response schema", function () {
  const body = buildRecommendSuccessBody({
    requestId: "req-1",
    data: {
      dialectText: "柳州话。",
      mandarinText: "普通话。",
      specialTags: ["#um", "<SPK/>"],
      needHumanReview: true,
      notes: [" 第一条 "],
      timing: {
        totalMs: 3210,
      },
      models: {
        omniModel: "qwen3.5-omni-flash",
      },
    },
  });

  assert.deepEqual(body, {
    success: true,
    requestId: "req-1",
    dialectText: "柳州话。",
    mandarinText: "普通话。",
    specialTags: ["#um", "<SPK/>"],
    needHumanReview: true,
    notes: ["第一条"],
    timing: {
      totalMs: 3210,
    },
    models: {
      omniModel: "qwen3.5-omni-flash",
    },
  });
});
