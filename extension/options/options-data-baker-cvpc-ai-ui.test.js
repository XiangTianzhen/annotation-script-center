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
  assert.match(script, /data-baker-cvpc-ai-listen-include-lexicon-reference/);
  assert.match(script, /data-baker-cvpc-ai-refine-prompt/);
  assert.match(script, /data-baker-cvpc-segment-silence-threshold-dbfs/);
  assert.match(script, /data-baker-cvpc-segment-silence-threshold-unit/);
  assert.match(script, /data-baker-cvpc-segment-context-padding-ms/);
  assert.match(script, /data-baker-cvpc-segment-preview-auto-apply-enabled/);
  assert.match(html, /静音阈值/);
  assert.match(html, /前后补偿时长/);
  assert.match(html, /生成后自动应用当前建议/);
  assert.match(html, /默认按 dB；也可切换成平台常见的 % \/ Val/);
  assert.match(html, /默认 0\.2 秒，范围 0 ~ 1\.5 秒/);
  assert.match(script, /文本修正/);
  assert.doesNotMatch(script, /data-baker-cvpc-ai-compare-family-select/);
  assert.doesNotMatch(script, /data-baker-cvpc-qualified-autofill-concurrency/);
  assert.match(script, /附带词表参考（听音辅助）/);
  assert.match(script, /默认关闭。关闭后 listen 只按当前段音频听写；开启后才附带词表参考片段。/);
  assert.match(script, /4\.47% 约等于 -27 dB/);
  assert.match(script, /1464 Val 约等于 -27 dB/);
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
