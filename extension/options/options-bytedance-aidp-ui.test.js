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
  assert.match(html, /开关平台AI功能/);
  assert.match(html, /关闭后隐藏平台原生 AI 洞察面板和猫形浮动入口/);
  assert.match(script, /function getBytedanceAidpSuzhouConfig\(/);
  assert.match(script, /function applyBytedanceAidpForm\(/);
  assert.match(script, /async function saveBytedanceAidpSettings\(/);
  assert.match(script, /platformAiEnabled/);
  assert.match(script, /detail-bytedance-aidp-suzhou-panel/);
});
