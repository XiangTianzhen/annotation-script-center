"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const profileModule = require(resolveRepo("scripts", "package-crx-build-profile.js"));
const { buildManifestForRelease, buildReleaseProfile, buildReleaseProfiles } = profileModule;

test("1.0 release profile emits only versioned public artifacts", function () {
  const profile = buildReleaseProfile("1.0.0");
  assert.equal(profile.crxFilename, "annotation-script-center-v1.0.0.crx");
  assert.equal(profile.zipFilename, "annotation-script-center-v1.0.0.zip");
  assert.equal(profile.includeZip, true);
  assert.equal(profile.includeUpdateXml, true);
  assert.equal(profile.includeLatestJson, true);
  assert.equal("channel" in profile, false);
});

test("release profiles contain one public profile", function () {
  assert.deepEqual(buildReleaseProfiles("1.0.0"), [buildReleaseProfile("1.0.0")]);
});

test("release manifest omits version_name", function () {
  const manifest = buildManifestForRelease({
    name: "标注脚本中心",
    version_name: "preview",
    host_permissions: ["https://example.test/*"],
  });

  assert.equal(manifest.version_name || "", "");
  assert.deepEqual(manifest.host_permissions, ["https://example.test/*"]);
});

test("release profile module exposes only the public build API", function () {
  assert.deepEqual(
    Object.keys(profileModule).sort(),
    ["buildManifestForRelease", "buildReleaseProfile", "buildReleaseProfiles"]
  );
});
