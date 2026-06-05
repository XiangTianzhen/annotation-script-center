"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("Aishell options source uses standalone convert/listen/compare cards", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(script, /aishell-tech-ai-convert-model-select/);
  assert.match(script, /aishell-tech-ai-listen-model-select/);
  assert.match(script, /aishell-tech-ai-compare-family-select/);
  assert.match(script, /aishell-tech-ai-compare-qwen-prompt/);
  assert.match(script, /aishell-tech-ai-compare-omni-prompt/);
  assert.match(script, /Qwen 文本比较/);
  assert.match(script, /Omni 听音比较/);
});
