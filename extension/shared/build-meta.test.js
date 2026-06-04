"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

test("source build meta defaults unpacked extension to beta test mode", function () {
  const modulePath = path.resolve(__dirname, "build-meta.js");
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBuildMeta;

  require(modulePath);

  assert.equal(globalThis.ASREdgeBuildMeta?.releaseChannel, "beta");
  assert.equal(globalThis.ASREdgeBuildMeta?.betaFeaturesVisibleByDefault, false);
  assert.equal(globalThis.ASREdgeBuildMeta?.betaBackendBaseUrl, "http://47.109.197.170:3333");

  delete require.cache[modulePath];
  delete globalThis.ASREdgeBuildMeta;
});
