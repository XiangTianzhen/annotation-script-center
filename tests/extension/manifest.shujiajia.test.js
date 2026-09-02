"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

test("manifest injects Shujiajia observer and isolated helper in the required order", () => {
  const manifest = JSON.parse(fs.readFileSync(resolveRepo("extension", "manifest.json"), "utf8"));
  assert.equal(manifest.version, "1.2.0");
  const entries = manifest.content_scripts.filter((entry) => entry.matches?.includes("https://www.shujiajia.com/*"));
  const main = entries.find((entry) => entry.world === "MAIN");
  const isolated = entries.find((entry) => entry.world === "ISOLATED");
  assert.deepEqual(main.js, ["sites/shujiajia/luzhou-helper/page-world/network-observer.js"]);
  assert.equal(main.all_frames, true);
  assert.deepEqual(isolated.js.slice(-6), [
    "sites/shujiajia/luzhou-helper/data-api.js",
    "sites/shujiajia/luzhou-helper/ai-recommendation.js",
    "sites/shujiajia/luzhou-helper/whole-segment-controller.js",
    "sites/shujiajia/luzhou-helper/ui-panel.js",
    "sites/shujiajia/luzhou-helper/shortcuts.js",
    "sites/shujiajia/luzhou-helper/content.js",
  ]);
  assert.equal(isolated.all_frames, true);
});
