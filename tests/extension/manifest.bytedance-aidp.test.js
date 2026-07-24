"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

test("manifest injects the Taizhou recording integration before the content entry", function () {
  const manifest = JSON.parse(
    fs.readFileSync(resolveRepo("extension", "manifest.json"), "utf8")
  );
  const aidpEntry = manifest.content_scripts.find(
    (entry) =>
      Array.isArray(entry.matches) &&
      entry.matches.includes("https://aidp.bytedance.com/*") &&
      entry.world === "ISOLATED"
  );
  const recordingIndex = aidpEntry.js.indexOf(
    "sites/bytedance-aidp/taizhou-helper/recording-integration.js"
  );
  const contentIndex = aidpEntry.js.indexOf(
    "sites/bytedance-aidp/taizhou-helper/content.js"
  );

  assert.ok(recordingIndex >= 0);
  assert.ok(contentIndex > recordingIndex);
});
