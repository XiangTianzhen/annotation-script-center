"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  __testOnly,
  buildLexiconCandidateContext,
} = require("./lexicon-candidate");

test("strict lexicon candidate uses explicit rules and safe automatic csv rules", function () {
  const result = buildLexiconCandidateContext("路况良好，主要是高速和省道，跟着导航走即可。");

  assert.equal(result.lexiconCandidateText, "路况良好，主要是高速甲省道，甲着导航行即可。");
  assert.equal(result.lexiconCandidateText.includes("同省道"), false);
  assert.deepEqual(
    result.candidatePairs.slice().sort(function (left, right) {
      return left.sourceText.localeCompare(right.sourceText, "zh-Hans-CN");
    }),
    [
      { sourceText: "和", candidateText: "甲", source: "csv" },
      { sourceText: "跟", candidateText: "甲", source: "csv" },
      { sourceText: "走", candidateText: "行", source: "csv" },
    ].sort(function (left, right) {
      return left.sourceText.localeCompare(right.sourceText, "zh-Hans-CN");
    })
  );
});

test("strict lexicon candidate keeps guarded ambiguous phrases unchanged", function () {
  const result = buildLexiconCandidateContext("我和你一起去。");

  assert.equal(result.lexiconCandidateText.startsWith("我和你"), true);
  assert.equal(result.lexiconCandidateText.includes("我甲你"), false);
  assert.equal(result.lexiconCandidateText.includes("我参你"), false);
});

test("strict lexicon candidate normalizes non-lexicon text to simplified Chinese", function () {
  assert.equal(
    __testOnly.normalizeCandidateText("導航路況導甲阮"),
    "导航路况导甲阮"
  );
});
