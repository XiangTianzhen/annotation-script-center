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

test("configured whole-segment shortcut invokes the guarded draw action", async () => {
  const calls = [];
  const handled = await shortcuts.handleKeydown({
    key: "d", shiftKey: true, target: { tagName: "DIV" }, preventDefault() {},
  }, {
    createWholeSegment: { key: "d", shift: true },
  }, {
    createWholeSegment: () => calls.push("createWholeSegment"),
  });
  assert.equal(handled, true);
  assert.deepEqual(calls, ["createWholeSegment"]);
});

test("overlap shortcuts remain active in the focused transcript input", async () => {
  const calls = [];
  const target = {
    tagName: "INPUT",
    classList: { contains(name) { return name === "transfer-input"; } },
    getAttribute(name) { return name === "placeholder" ? "请输入转写内容" : ""; },
  };
  const handled = await shortcuts.handleKeydown({
    key: "[", altKey: true, target, preventDefault() {},
  }, {
    insertOverlapStart: { key: "[", alt: true },
  }, {
    insertOverlapStart: () => calls.push("insertOverlapStart"),
  });
  assert.equal(handled, true);
  assert.deepEqual(calls, ["insertOverlapStart"]);
});

test("duplicate shortcut assignments fail closed instead of invoking the first action", async () => {
  const calls = [];
  const handled = await shortcuts.handleKeydown({
    key: "k", ctrlKey: true, target: { tagName: "DIV" }, preventDefault() {},
  }, {
    recognizeWhole: { key: "k", ctrl: true },
    insertOverlapStart: { key: "k", ctrl: true },
  }, {
    recognizeWhole: () => calls.push("recognizeWhole"),
    insertOverlapStart: () => calls.push("insertOverlapStart"),
  });
  assert.equal(handled, false);
  assert.deepEqual(calls, []);
});
