"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const panel = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "ui-panel.js"));

test("result view exposes both stage text token totals and CNY estimate", () => {
  const view = panel.buildResultView({
    listenText: "原始听写",
    refinedText: "泸州话整理",
    usage: { listen: { totalTokens: 12 }, refine: { totalTokens: 9 } },
    cost: { totalEstimatedCostCny: 0.001234 },
  });
  assert.equal(view.listenText, "原始听写");
  assert.equal(view.refinedText, "泸州话整理");
  assert.equal(view.usageText, "听音 12 / 整理 9 / 总计 21 Token");
  assert.equal(view.costText, "预估人民币 0.001234 元");
});

test("panel action inventory excludes temporary-save and submit buttons", () => {
  assert.deepEqual(panel.PANEL_ACTIONS, ["createWholeSegment", "recognizeWhole", "toggleDrawer", "fillRecognition"]);
});
