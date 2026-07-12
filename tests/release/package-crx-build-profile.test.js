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

test("release manifest cannot carry a beta version marker", function () {
  const manifest = buildManifestForRelease({
    name: "标注脚本中心",
    version_name: "beta",
    host_permissions: ["https://example.test/*"],
  });

  assert.equal(manifest.version_name || "", "");
  assert.deepEqual(manifest.host_permissions, ["https://example.test/*"]);
});

test("release profile module exposes no beta or build-meta API", function () {
  assert.equal(profileModule.buildBuildMetaContent, undefined);
  assert.equal(profileModule.buildManifestForChannel, undefined);
  assert.equal(profileModule.normalizeReleaseChannel, undefined);
  assert.equal(profileModule.normalizeReleaseBuildMode, undefined);
});
