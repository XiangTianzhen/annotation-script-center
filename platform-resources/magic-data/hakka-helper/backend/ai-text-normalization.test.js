"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const hakkaLexicon = require("./ai-lexicon");
const hakkaRoutes = require("./ai-routes");

test("normalizeToSimplifiedChinesePreservingLexicon keeps hakka unified terms and simplifies ordinary chinese", function () {
  const normalizeToSimplifiedChinesePreservingLexicon =
    hakkaLexicon.normalizeToSimplifiedChinesePreservingLexicon;
  const input = "按呢聽講化學競賽輔導";
  const output =
    typeof normalizeToSimplifiedChinesePreservingLexicon === "function"
      ? normalizeToSimplifiedChinesePreservingLexicon(input)
      : "__missing_normalizer__";

  assert.equal(output, "按呢听讲化学竞赛辅导");
});

test("normalizeResponseTextFields simplifies hakka ai suggestion texts before frontend display", function () {
  const normalizeResponseTextFields = hakkaRoutes.normalizeResponseTextFields;
  const source = {
    dialectTextCheck: {
      suggestedValue: "聽講這個老師教得特別好。",
    },
    mandarinTextCheck: {
      suggestedValue: "這個老師輔導得特別好。",
    },
    audioCheck: {
      heardDialectText: "化學競賽嘞輔導班",
      heardMandarinMeaning: "聽說那個老師教得特別好。",
    },
    recommendations: {
      dialectText: "化學競賽嘞輔導班",
      mandarinText: "聽說那個老師教得特別好。",
    },
    listen: {
      heardDialectText: "化學競賽嘞輔導班",
      heardMandarinMeaning: "聽說那個老師教得特別好。",
    },
    comparison: {
      dialectLine: {
        aiText: "化學競賽嘞輔導班",
        recommendedText: "化學競賽嘞輔導班",
      },
      mandarinLine: {
        recommendedText: "聽說那個老師教得特別好。",
      },
    },
    recognitionConvert: {
      recognizedMandarinText: "聽說那個老師教得特別好。",
      convertedDialectText: "化學競賽嘞輔導班",
    },
  };
  const output =
    typeof normalizeResponseTextFields === "function"
      ? normalizeResponseTextFields(source)
      : { recommendations: { dialectText: "__missing_route_normalizer__" } };

  assert.equal(output.dialectTextCheck.suggestedValue, "听讲这个老师教得特别好。");
  assert.equal(output.mandarinTextCheck.suggestedValue, "这个老师辅导得特别好。");
  assert.equal(output.audioCheck.heardDialectText, "化学竞赛嘞辅导班");
  assert.equal(output.audioCheck.heardMandarinMeaning, "听说那个老师教得特别好。");
  assert.equal(output.recommendations.dialectText, "化学竞赛嘞辅导班");
  assert.equal(output.recommendations.mandarinText, "听说那个老师教得特别好。");
  assert.equal(output.listen.heardDialectText, "化学竞赛嘞辅导班");
  assert.equal(output.listen.heardMandarinMeaning, "听说那个老师教得特别好。");
  assert.equal(output.comparison.dialectLine.aiText, "化学竞赛嘞辅导班");
  assert.equal(output.comparison.dialectLine.recommendedText, "化学竞赛嘞辅导班");
  assert.equal(output.comparison.mandarinLine.recommendedText, "听说那个老师教得特别好。");
  assert.equal(output.recognitionConvert.recognizedMandarinText, "听说那个老师教得特别好。");
  assert.equal(output.recognitionConvert.convertedDialectText, "化学竞赛嘞辅导班");
});
