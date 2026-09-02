"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const shortcuts = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "shortcuts.js"));

test("shortcut runtime ignores editable targets", async () => {
  let count = 0;
  const handled = await shortcuts.handleKeydown({
    key: "p", ctrlKey: true, target: { tagName: "TEXTAREA" }, preventDefault() {},
  }, { togglePlayPause: { key: "p", ctrl: true } }, { togglePlayPause: () => { count += 1; } });
  assert.equal(handled, false);
  assert.equal(count, 0);
});

test("shortcut runtime invokes only the matching configured action", async () => {
  const calls = [];
  let prevented = false;
  const handled = await shortcuts.handleKeydown({
    key: "r", altKey: true, target: { tagName: "DIV" }, preventDefault() { prevented = true; },
  }, {
    recognizeWhole: { key: "r", alt: true },
    submitNext: null,
  }, {
    recognizeWhole: () => calls.push("recognizeWhole"),
    submitNext: () => calls.push("submitNext"),
  });
  assert.equal(handled, true);
  assert.equal(prevented, true);
  assert.deepEqual(calls, ["recognizeWhole"]);
});

test("configured fill-recognition shortcut invokes the existing fill action", async () => {
  const calls = [];
  const handled = await shortcuts.handleKeydown({
    key: "f", altKey: true, target: { tagName: "DIV" }, preventDefault() {},
  }, {
    fillRecognition: { key: "f", alt: true },
  }, {
    fillRecognition: () => calls.push("fillRecognition"),
  });
  assert.equal(handled, true);
  assert.deepEqual(calls, ["fillRecognition"]);
});
