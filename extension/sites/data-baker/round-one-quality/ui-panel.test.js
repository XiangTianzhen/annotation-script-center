"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const panelModule = require("./ui-panel.js");

test("DataBaker result rows include lexicon status and mode", function () {
  const helper = panelModule.__test__?.buildResultRows;
  assert.equal(typeof helper, "function");

  const rows = helper({
    pageText: "页面文本",
    heardText: "听音文本",
    recommendedText: "推荐文本。",
    isChanged: true,
    listenConfidence: 0.9,
    compareConfidence: 0.8,
    model: {
      listen: "fun-asr",
      compare: "qwen3.5-plus",
    },
    pipelineMode: "fun_asr_compare",
    decision: "minor_edit",
    requestId: "req-1",
    lexicon: {
      status: "ready",
      rewriteMode: "aggressive",
    },
  });
  const row = rows.find(function (item) {
    return item[0] === "词表状态与模式";
  });

  assert.deepEqual(row, [
    "词表状态与模式",
    "主词表已加载 / 固定携带 / 改写模式 aggressive",
  ]);
});
