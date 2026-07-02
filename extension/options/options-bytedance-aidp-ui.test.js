"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("ByteDance AIDP options source exposes the suzhou helper base panel", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");

  assert.match(html, /id="detail-bytedance-aidp-suzhou-panel"/);
  assert.match(html, /id="bytedance-aidp-platform-ai-enabled"/);
  assert.match(html, /id="save-bytedance-aidp-settings"/);
  assert.match(html, /隐藏平台AI功能/);
  assert.match(html, /默认勾选后隐藏平台原生 AI 洞察面板和猫形浮动入口/);
  assert.match(html, /勾选后在 `mark-v3` 详情页隐藏平台 AI 原生板块/);
  assert.match(script, /function getBytedanceAidpSuzhouConfig\(/);
  assert.match(script, /function applyBytedanceAidpForm\(/);
  assert.match(script, /async function saveBytedanceAidpSettings\(/);
  assert.match(script, /platformAiEnabled/);
  assert.match(script, /platformAiNode\.checked = config\.platformAiEnabled === false;/);
  assert.match(
    script,
    /platformAiEnabled:\s*!getElement\("bytedance-aidp-platform-ai-enabled"\)\.checked/
  );
  assert.match(script, /detail-bytedance-aidp-suzhou-panel/);
});
