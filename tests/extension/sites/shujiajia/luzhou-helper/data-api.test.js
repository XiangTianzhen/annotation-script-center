"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");
const { JSDOM } = require(resolveRepo("frontend", "options-app", "node_modules", "jsdom"));

const api = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "data-api.js"));

function control(text, extra = {}) {
  const events = [];
  return Object.assign({
    textContent: text,
    disabled: false,
    hidden: false,
    events,
    click() { events.push("click"); },
    dispatchEvent(event) { events.push(event.type); return true; },
    getClientRects() { return [1]; },
  }, extra);
}

test("fillTranscript dispatches native input change and blur and marks helper state dirty", () => {
  const input = control("", { value: "", tagName: "TEXTAREA", readOnly: false });
  const state = { dirty: false };
  const result = api.fillTranscript({ input, text: "泸州话结果", state, EventCtor: class { constructor(type) { this.type = type; } } });
  assert.equal(result.ok, true);
  assert.equal(input.value, "泸州话结果");
  assert.deepEqual(input.events, ["input", "change", "blur"]);
  assert.equal(state.dirty, true);
});

test("submitNext refuses helper-dirty state and clicks the unique native submit otherwise", () => {
  const submit = control("提交进入下一条");
  assert.equal(api.submitNext({ state: { dirty: true }, buttons: [submit] }).code, "temporary-save-required");
  assert.equal(submit.events.length, 0);
  assert.equal(api.submitNext({ state: { dirty: false }, buttons: [submit] }).ok, true);
  assert.deepEqual(submit.events, ["click"]);
});

test("clickUniqueVisibleControl fails closed on duplicate semantic controls", () => {
  const result = api.clickUniqueVisibleControl({ controls: [control("暂存"), control("暂存")], exactText: "暂存" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "ambiguous-control");
});

test("validity only queries the iframe document and cannot click the outer whole-task invalid button", () => {
  const effective = control("有效");
  const innerDocument = {
    querySelectorAll(selector) {
      assert.equal(selector, "label,button,[role='radio']");
      return [effective];
    },
  };
  const result = api.markValidity(true, innerDocument);
  assert.equal(result.ok, true);
  assert.deepEqual(effective.events, ["click"]);
});

function makeTranscriptDom(rowClasses = ["", "current-row", ""]) {
  const rows = rowClasses.map((className, index) => `<tr class="el-table__row ${className}"><td><input class="transfer-input" placeholder="请输入转写内容" data-index="${index + 1}"></td></tr>`).join("");
  const dom = new JSDOM(`<table class="el-table__body"><tbody>${rows}</tbody></table>`);
  dom.window.document.querySelectorAll("tr,input").forEach((node) => { node.getClientRects = () => [1]; });
  return dom.window.document;
}

test("manual transcript lookup returns only the input in the unique selected row", () => {
  const document = makeTranscriptDom();
  assert.equal(api.findSelectedTranscriptInput(document)?.dataset.index, "2");
  assert.equal(api.findSingleTranscriptInput(document), null);
});

test("manual transcript lookup fails closed without one selected row", () => {
  assert.equal(api.findSelectedTranscriptInput(makeTranscriptDom(["", "", ""])), null);
  assert.equal(api.findSelectedTranscriptInput(makeTranscriptDom(["current-row", "current-row", ""])), null);
});

test("automatic transcript lookup returns the only editable paragraph input", () => {
  const document = makeTranscriptDom(["current-row"]);
  assert.equal(api.findSingleTranscriptInput(document)?.dataset.index, "1");
  assert.equal(api.getTranscriptInputCount(document), 1);
});

test("transcript lookup rejects placeholder fallbacks and non-input transfer nodes", () => {
  const dom = new JSDOM(`
    <table><tbody>
      <tr class="el-table__row current-row">
        <td><input placeholder="请输入转写内容"></td>
        <td><div class="transfer-input">不是输入框</div></td>
      </tr>
    </tbody></table>
  `);
  dom.window.document.querySelectorAll("tr,input,div").forEach((node) => { node.getClientRects = () => [1]; });
  assert.equal(api.findSelectedTranscriptInput(dom.window.document), null);
  assert.equal(api.findSingleTranscriptInput(dom.window.document), null);
  assert.equal(api.getTranscriptInputCount(dom.window.document), 0);
});

test("native overlap symbol click requires the unique visible item in Category1", () => {
  const dom = new JSDOM("<div class='special-container with-group-head'><div class='symbol-group'><div class='symbol-group-head'><span class='symbol-group-title'>Category1（多选）</span></div><div class='special-list'><div class='symbol-item'><span class='key'>[OVERLAP/]</span></div><div class='symbol-item'><span class='key'>[/OVERLAP]</span></div></div></div></div>");
  const document = dom.window.document;
  document.querySelectorAll(".symbol-item").forEach((node) => { node.getClientRects = () => [1]; });
  let clicked = "";
  document.querySelectorAll(".symbol-item").forEach((node) => node.addEventListener("click", () => { clicked = node.textContent.trim(); }));

  assert.deepEqual(api.clickOverlapSymbol("[OVERLAP/]", document), { ok: true, code: "clicked" });
  assert.equal(clicked, "[OVERLAP/]");
  assert.equal(api.clickOverlapSymbol("[UNKNOWN]", document).code, "symbol-control-not-found");
});
