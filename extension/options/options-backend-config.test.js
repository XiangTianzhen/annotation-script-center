"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("options backend panel exposes three root url inputs and generic mode labels", function () {
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(html, /id="home-endpoint-server-url"/);
  assert.match(html, /id="home-endpoint-local-url"/);
  assert.match(html, /id="home-endpoint-beta-url"/);
  assert.match(html, />服务器</);
  assert.match(html, />本机</);
  assert.match(html, />Beta</);
  assert.match(html, /id="home-endpoint-expand-toggle"/);
  assert.match(html, /id="home-endpoint-config-panel"/);
  assert.match(script, /backendBaseUrls/);
  assert.match(script, /buildDownloadUrl/);
  assert.match(script, /backendConfigExpanded/);
});
