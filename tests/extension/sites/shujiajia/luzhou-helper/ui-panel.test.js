"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const panel = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "ui-panel.js"));
const { JSDOM } = require(resolveRepo("frontend", "options-app", "node_modules", "jsdom"));

test("result view exposes one dialect text with single-stage tokens and CNY estimate", () => {
  const view = panel.buildResultView({
    dialectText: "泸州方言文本",
    usage: { listen: { promptTokens: 10, completionTokens: 2, totalTokens: 12 } },
    cost: { totalEstimatedCostCny: 0.001234 },
  });
  assert.equal(view.dialectText, "泸州方言文本");
  assert.equal(view.usageText, "输入 10 / 输出 2 / 总计 12 Token");
  assert.equal(view.costText, "预估人民币 0.001234 元");
});

test("panel action inventory excludes temporary-save and submit buttons", () => {
  assert.deepEqual(panel.PANEL_ACTIONS, ["createWholeSegment", "recognizeWhole", "fillRecognition"]);
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
  runtime.ensureMounted();
  assert.equal(document.querySelectorAll("[data-asc-shujiajia-luzhou-drawer]").length, 1);
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

test("recognition result stays visible without expand or close controls", () => {
  const dom = createPlatformDom();
  const document = dom.window.document;
  const runtime = panel.createPanel({ document });
  runtime.ensureMounted();

  const result = document.querySelector("[data-asc-shujiajia-luzhou-drawer]");
  assert.equal(result.hidden, false);
  assert.equal(document.body.textContent.includes("展开识别结果"), false);
  assert.equal(document.body.textContent.includes("关闭结果"), false);
  assert.equal(typeof runtime.toggleDrawer, "undefined");
  runtime.setResult({ dialectText: "泸州方言文本" });
  assert.equal(result.querySelector("[data-role='dialect']").textContent, "泸州方言文本");
  assert.equal(result.textContent.includes("原始听写"), false);
  assert.equal(result.textContent.includes("泸州话整理"), false);
  assert.equal(result.hidden, false);
  runtime.setResult(null);
  assert.equal(result.hidden, false);
  assert.equal(result.querySelector("[data-role='meta']").textContent, "尚未识别");
});

test("panel shows and copies detailed AI error diagnostics without clearing recognition text", async () => {
  const dom = createPlatformDom();
  const document = dom.window.document;
  const copied = [];
  const runtime = panel.createPanel({
    document,
    writeClipboard: async (value) => copied.push(value),
  });
  runtime.ensureMounted();
  runtime.setResult({ dialectText: "保留的识别文本" });
  runtime.setError({
    success: false,
    requestId: "request-400",
    code: "provider-http-error",
    message: "API Key 所属的阿里云账号存在欠费，导致访问被拒绝。",
    providerStatus: 400,
    providerCode: "invalid_parameter",
    summary: "audio format is invalid",
    rawResponse: {
      provider: "qwen",
      model: "qwen3.5-omni-flash",
      stage: "omni_single",
      providerStatus: 400,
      responseBody: { error: { code: "invalid_parameter", message: "audio format is invalid" } },
    },
  });

  const drawer = document.querySelector("[data-asc-shujiajia-luzhou-drawer]");
  const diagnostic = drawer.querySelector("[data-role='error-diagnostic']");
  assert.equal(diagnostic.hidden, false);
  assert.match(diagnostic.textContent, /AI 错误诊断/);
  assert.match(diagnostic.textContent, /HTTP 400/);
  assert.match(diagnostic.textContent, /invalid_parameter/);
  assert.match(diagnostic.textContent, /request-400/);
  assert.match(diagnostic.textContent, /错误说明：API Key 所属的阿里云账号存在欠费/);
  assert.match(diagnostic.textContent, /上游原文：audio format is invalid/);
  assert.match(diagnostic.querySelector("[data-role='error-raw']").textContent, /audio format is invalid/);
  assert.equal(drawer.querySelector("[data-role='dialect']").textContent, "保留的识别文本");

  diagnostic.querySelector("[data-role='copy-error']").click();
  await Promise.resolve();
  assert.equal(copied.length, 1);
  assert.match(copied[0], /"providerCode": "invalid_parameter"/);

  runtime.setError(null);
  assert.equal(diagnostic.hidden, true);
});

test("zero-segment layout uses extension-owned fallback hosts", () => {
  const dom = new JSDOM("<body><div class='form-tabs'><div class='border-line'></div></div><div class='operate-container'><div class='paragraph'></div></div></body>");
  const document = dom.window.document;
  const runtime = panel.createPanel({ document });

  assert.equal(runtime.ensureMounted(), true);
  const controls = document.querySelector("[data-asc-shujiajia-luzhou-helper]");
  assert.equal(controls.parentElement, document.querySelector(".form-tabs"));
  assert.equal(controls.previousElementSibling, document.querySelector(".border-line"));
  const fallback = document.querySelector("[data-asc-shujiajia-luzhou-result-host]");
  assert.ok(fallback);
  assert.equal(fallback.nextElementSibling, document.querySelector(".paragraph"));
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-drawer]").parentElement, fallback);
});

test("panel migrates fallback nodes to primary hosts without duplication", async () => {
  const dom = new JSDOM("<body><div class='form-tabs'><div class='border-line'></div></div><div class='operate-container'><div class='paragraph'></div></div></body>", { pretendToBeVisual: true });
  const document = dom.window.document;
  const runtime = panel.createPanel({ document, MutationObserver: dom.window.MutationObserver });
  runtime.ensureMounted();

  const tabs = document.createElement("div");
  tabs.className = "tabs-container";
  document.querySelector(".form-tabs").appendChild(tabs);
  const transfer = document.createElement("div");
  transfer.className = "transfer";
  document.querySelector(".operate-container").insertBefore(transfer, document.querySelector(".paragraph"));
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0));

  assert.equal(document.querySelectorAll("[data-asc-shujiajia-luzhou-helper]").length, 1);
  assert.equal(document.querySelectorAll("[data-asc-shujiajia-luzhou-drawer]").length, 1);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-helper]").parentElement, tabs);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-drawer]").parentElement, transfer);
  assert.equal(document.querySelector("[data-asc-shujiajia-luzhou-result-host]"), null);
  runtime.remove();
});
