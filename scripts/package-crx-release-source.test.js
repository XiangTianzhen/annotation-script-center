"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("package-crx-release sources local build meta stub from build-meta-local module", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "package-crx-release.js"), "utf8");

  assert.match(script, /require\("\.\/build-meta-local"\)/);
  assert.doesNotMatch(script, /buildEmptyLocalBuildMetaContent,\s*\n\s*buildBuildMetaContent,\s*\n[\s\S]*require\("\.\/package-crx-build-profile"\)/);
});
