"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

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
