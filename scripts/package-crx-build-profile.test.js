"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildBuildMetaContent,
  buildManifestForChannel,
  buildReleaseProfile,
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

test("beta profile emits single beta crx and no public metadata", function () {
  const profile = buildReleaseProfile("beta", "0.4.0");
  assert.equal(profile.channel, "beta");
  assert.equal(profile.crxFilename, "annotation-script-center-beta.crx");
  assert.equal(profile.zipFilename, "");
  assert.equal(profile.includeZip, false);
  assert.equal(profile.includeUpdateXml, false);
  assert.equal(profile.includeLatestJson, false);
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

test("beta build meta content embeds unlock hash and backend base url", function () {
  const content = buildBuildMetaContent({
    releaseChannel: "beta",
    betaUnlockPasswordSha256: "abc123",
    betaBackendBaseUrl: "https://beta.example.test",
  });

  assert.match(content, /releaseChannel:\s*"beta"/);
  assert.match(content, /betaUnlockPasswordSha256:\s*"abc123"/);
  assert.match(content, /betaBackendBaseUrl:\s*"https:\/\/beta\.example\.test"/);
});
