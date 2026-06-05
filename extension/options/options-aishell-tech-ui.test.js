"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("Aishell options source switches compare UI to Omni judgement wording", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(script, /Omni判断 Prompt（可选）/);
  assert.match(script, /差异比较 Prompt（可选）/);
  assert.match(script, /setFieldVisibility\("aishell-tech-ai-compare-model-field",\s*currentListenModel === "fun-asr"\)/);
  assert.match(script, /当前为 Omni 听音链路/);
});
