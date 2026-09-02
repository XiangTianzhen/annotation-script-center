"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const panel = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "ui-panel.js"));
const { JSDOM } = require(resolveRepo("frontend", "options-app", "node_modules", "jsdom"));

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

test("panel mounts both floating surfaces under body without changing native form-tabs", () => {
  const dom = new JSDOM("<body><div class='form-tabs'><button><span>段落属性</span></button><div class='border-line'></div></div></body>");
  const document = dom.window.document;
  const nativeChildren = document.querySelector(".form-tabs").children.length;
  const runtime = panel.createPanel({ document });

  assert.equal(runtime.ensureMounted(), true);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-helper]").parentElement, document.body);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-drawer]").parentElement, document.body);
  assert.equal(document.querySelector(".form-tabs").children.length, nativeChildren);
});

test("panel restores its body-level surfaces after a platform subtree rerender", async () => {
  const dom = new JSDOM("<body><div class='form-tabs'><span>段落属性</span></div></body>", { pretendToBeVisual: true });
  const document = dom.window.document;
  const runtime = panel.createPanel({ document, MutationObserver: dom.window.MutationObserver });
  assert.equal(runtime.ensureMounted(), true);

  document.querySelector("[data-asc-shujiajia-luzhou-helper]").remove();
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0));

  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-helper]")?.parentElement, document.body);
  runtime.remove();
});
