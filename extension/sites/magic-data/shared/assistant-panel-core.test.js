"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const panelModule = require("./assistant-panel-core.js");

test("Magic Data shared result rows include lexicon status and mode", function () {
  const helper = panelModule.__test__?.buildResultRows;
  assert.equal(typeof helper, "function");

  const rows = helper(
    {
      shouldReview: false,
      textRuleCheck: {},
      audioCheck: {},
      models: {
        listenModel: "qwen3.5-omni-flash",
        reviewModel: "qwen3.5-flash",
      },
      timing: {
        totalDurationMs: 1200,
      },
      lexicon: {
        status: "missing",
        rewriteMode: "off",
      },
    },
    {}
  );
  const row = rows.find(function (item) {
    return item[0] === "词表状态与模式";
  });

  assert.deepEqual(row, [
    "词表状态与模式",
    "主词表缺失 / 固定携带 / 改写模式 off",
  ]);
});
