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

function createPlatformDom(options = {}) {
  return new JSDOM("<body><div class='form-tabs'><button><span>段落属性</span></button><div class='tabs-container'><div class='role'></div><div class='el-reset'>是否有效</div></div></div><div class='operate-container'><div class='transfer'><div class='target-error'>段落信息</div><div class='divide-line'></div><div class='transfer-container'><div class='special-box'>Category1</div></div></div></div></body>", options);
}

test("panel mounts controls below validity and results below the native transfer editor", () => {
  const dom = createPlatformDom();
  const document = dom.window.document;
  const tabs = document.querySelector(".tabs-container");
  const transfer = document.querySelector(".transfer");
  const nativeTabsChildren = tabs.children.length;
  const nativeTransferChildren = transfer.children.length;
  const runtime = panel.createPanel({ document });

  assert.equal(runtime.ensureMounted(), true);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-helper]").parentElement, tabs);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-drawer]").parentElement, transfer);
  assert.equal(tabs.lastElementChild.hasAttribute("data-asc-shujiajia-luzhou-helper"), true);
  assert.equal(transfer.lastElementChild.hasAttribute("data-asc-shujiajia-luzhou-drawer"), true);
  assert.equal(tabs.children.length, nativeTabsChildren + 1);
  assert.equal(transfer.children.length, nativeTransferChildren + 1);
});

test("panel restores both native-area mounts after platform subtree rerender", async () => {
  const dom = createPlatformDom({ pretendToBeVisual: true });
  const document = dom.window.document;
  const runtime = panel.createPanel({ document, MutationObserver: dom.window.MutationObserver });
  assert.equal(runtime.ensureMounted(), true);

  document.querySelector(".tabs-container").outerHTML = "<div class='tabs-container'><div class='role'></div><div class='el-reset'>是否有效</div></div>";
  document.querySelector(".transfer").outerHTML = "<div class='transfer'><div class='target-error'></div><div class='divide-line'></div><div class='transfer-container'></div></div>";
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0));

  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-helper]")?.parentElement, document.querySelector(".tabs-container"));
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-drawer]")?.parentElement, document.querySelector(".transfer"));
  runtime.remove();
});

test("recognition result opens inline and remains user-collapsible", () => {
  const dom = createPlatformDom();
  const document = dom.window.document;
  const runtime = panel.createPanel({ document });
  runtime.ensureMounted();

  const result = document.querySelector("[data-asc-shujiajia-luzhou-drawer]");
  assert.equal(result.hidden, true);
  runtime.setResult({ listenText: "原始", refinedText: "整理" });
  assert.equal(result.hidden, false);
  runtime.toggleDrawer();
  assert.equal(result.hidden, true);
  runtime.toggleDrawer();
  assert.equal(result.hidden, false);
  runtime.setResult(null);
  assert.equal(result.hidden, true);
});
