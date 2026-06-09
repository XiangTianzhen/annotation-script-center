"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("CVPC options source uses standalone listen/refine AI cards", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");

  assert.match(script, /data-baker-cvpc-ai-listen-model-select/);
  assert.match(script, /data-baker-cvpc-ai-refine-model-select/);
  assert.match(script, /data-baker-cvpc-ai-listen-prompt/);
  assert.match(script, /data-baker-cvpc-ai-refine-prompt/);
  assert.match(script, /data-baker-cvpc-segment-silence-threshold-dbfs/);
  assert.match(html, /静音阈值（dBFS）/);
  assert.match(html, /连续 0\.4 秒低于该阈值视为静音；前后自动补 0\.1 秒/);
  assert.match(script, /文本修正/);
  assert.doesNotMatch(script, /data-baker-cvpc-ai-compare-family-select/);
  assert.doesNotMatch(script, /data-baker-cvpc-qualified-autofill-concurrency/);
});

test("CVPC options source keeps listen model options on omni only", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const start = script.indexOf("const dataBakerCvpcListenModelOptions =");
  const end = script.indexOf("const dataBakerSingleModelOptions =", start);
  const block = start >= 0 && end > start ? script.slice(start, end) : "";

  assert.ok(block);
  assert.match(block, /qwen3\.5-omni-plus/);
  assert.match(block, /qwen3\.5-omni-flash/);
  assert.doesNotMatch(block, /fun-asr/);
});
