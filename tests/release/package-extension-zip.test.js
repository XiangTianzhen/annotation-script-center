"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const zipScriptPath = resolveRepo("scripts", "package-extension-zip.js");
const retiredPaths = [
  resolveRepo("scripts", "package-crx-release.js"),
  resolveRepo("scripts", "package-crx-build-profile.js"),
  resolveRepo("config", "package-crx-release.json"),
];

test("ZIP-only release exposes one versioned ZIP packager and retires CRX files", function () {
  assert.equal(fs.existsSync(zipScriptPath), true);
  retiredPaths.forEach(function (filePath) {
    assert.equal(fs.existsSync(filePath), false, path.relative(resolveRepo(), filePath));
  });
});

test("ZIP-only packager exports the versioned filename contract", function () {
  delete require.cache[zipScriptPath];
  const packager = require(zipScriptPath);

  assert.equal(
    packager.buildZipFilename("1.0.0"),
    "annotation-script-center-v1.0.0.zip"
  );
  assert.deepEqual(Object.keys(packager).sort(), ["buildZipFilename", "packageExtensionZip"]);
});

test("ZIP-only release source contains no CRX signing or update metadata workflow", function () {
  const source = fs.readFileSync(zipScriptPath, "utf8");
  assert.doesNotMatch(source, /\.crx\b|update\.xml|crx-latest|KEY_PATH|privateKey|extensionId/i);
});
