"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildEmptyLocalBuildMetaContent,
  buildLocalBuildMetaContent,
} = require("./build-meta-local");

test("local build meta content injects beta unlock hash for unpacked extension", function () {
  const content = buildLocalBuildMetaContent({
    betaUnlockPasswordSha256: "abc123",
    betaBackendBaseUrl: "http://47.109.197.170:3333",
  });

  assert.match(content, /releaseChannel:\s*"beta"/);
  assert.match(content, /betaFeaturesVisibleByDefault:\s*false/);
  assert.match(content, /betaUnlockPasswordSha256:\s*"abc123"/);
  assert.match(content, /betaBackendBaseUrl:\s*"http:\/\/47\.109\.197\.170:3333"/);
});

test("empty local build meta content strips local override from packaged artifacts", function () {
  const content = buildEmptyLocalBuildMetaContent();

  assert.match(content, /ASREdgeBuildMeta/);
  assert.doesNotMatch(content, /betaUnlockPasswordSha256/);
});
