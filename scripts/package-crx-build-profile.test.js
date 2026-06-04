"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildBuildMetaContent,
  buildManifestForChannel,
  buildReleaseProfile,
  buildReleaseProfiles,
} = require("./package-crx-build-profile");

test("public profile keeps versioned public artifacts", function () {
  const profile = buildReleaseProfile("public", "0.4.0");
  assert.equal(profile.channel, "public");
  assert.equal(profile.crxFilename, "annotation-script-center-v0.4.0.crx");
  assert.equal(profile.zipFilename, "annotation-script-center-v0.4.0.zip");
  assert.equal(profile.includeZip, true);
  assert.equal(profile.includeUpdateXml, true);
  assert.equal(profile.includeLatestJson, true);
});

test("beta profile emits single beta zip and no public metadata", function () {
  const profile = buildReleaseProfile("beta", "0.4.0");
  assert.equal(profile.channel, "beta");
  assert.equal(profile.crxFilename, "");
  assert.equal(profile.zipFilename, "annotation-script-center-beta.zip");
  assert.equal(profile.includeZip, true);
  assert.equal(profile.includeUpdateXml, false);
  assert.equal(profile.includeLatestJson, false);
});

test("default release mode emits both public and beta profiles", function () {
  const profiles = buildReleaseProfiles("", "0.4.0");
  assert.equal(Array.isArray(profiles), true);
  assert.equal(profiles.length, 2);
  assert.deepEqual(
    profiles.map(function (profile) {
      return profile.channel;
    }),
    ["public", "beta"]
  );
  assert.deepEqual(
    profiles.map(function (profile) {
      return profile.crxFilename || profile.zipFilename;
    }),
    ["annotation-script-center-v0.4.0.crx", "annotation-script-center-beta.zip"]
  );
});

test("public manifest strips beta marker and beta hosts", function () {
  const manifest = buildManifestForChannel(
    {
      name: "标注脚本中心",
      host_permissions: [
        "https://label-cloud.lightwheel.net/*",
        "https://script.xiangtianzhen.store/*",
      ],
    },
    "public"
  );

  assert.equal(manifest.version_name || "", "");
  assert.deepEqual(manifest.host_permissions, ["https://script.xiangtianzhen.store/*"]);
});

test("beta manifest keeps beta marker and beta host permissions", function () {
  const manifest = buildManifestForChannel(
    {
      name: "标注脚本中心",
      host_permissions: [
        "https://label-cloud.lightwheel.net/*",
        "https://script.xiangtianzhen.store/*",
      ],
    },
    "beta"
  );

  assert.equal(manifest.version_name, "beta");
  assert.deepEqual(manifest.host_permissions, [
    "https://label-cloud.lightwheel.net/*",
    "https://script.xiangtianzhen.store/*",
  ]);
});

test("beta build meta content keeps hidden beta features by default", function () {
  const content = buildBuildMetaContent({
    releaseChannel: "beta",
    betaUnlockPasswordSha256: "abc123",
    betaBackendBaseUrl: "https://beta.example.test",
  });

  assert.match(content, /releaseChannel:\s*"beta"/);
  assert.match(content, /betaFeaturesVisibleByDefault:\s*false/);
  assert.match(content, /betaUnlockPasswordSha256:\s*"abc123"/);
  assert.match(content, /betaBackendBaseUrl:\s*"https:\/\/beta\.example\.test"/);
});
