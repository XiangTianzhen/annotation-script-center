"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

test("manifest injects Magic Data Hangzhou helper runtime files", function () {
  const manifest = JSON.parse(
    fs.readFileSync(resolveRepo("extension", "manifest.json"), "utf8")
  );
  const magicDataScript = manifest.content_scripts.find(function (item) {
    return (
      Array.isArray(item.matches) &&
      item.matches.includes("https://work.magicdatatech.com/*") &&
      Array.isArray(item.js) &&
      item.js.includes("shared/constants.js")
    );
  });

  assert.ok(magicDataScript);
  assert.match(JSON.stringify(magicDataScript.js), /sites\/magic-data\/hangzhou-helper\/shortcuts-runtime\.js/);
  assert.match(JSON.stringify(magicDataScript.js), /sites\/magic-data\/hangzhou-helper\/assistant-panel\.js/);
  assert.match(JSON.stringify(magicDataScript.js), /sites\/magic-data\/hangzhou-helper\/content\.js/);
});
