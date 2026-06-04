"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("beta unlock uses brand image click target and keeps page hint hidden", function () {
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(html, /id="workspace-brand-icon"/);
  assert.match(script, /getElement\("workspace-brand-icon"\)/);
  assert.doesNotMatch(script, /连续点击左上角品牌区 7 次后可输入 beta 口令/);
});
