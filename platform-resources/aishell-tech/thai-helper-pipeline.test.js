"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "thai-helper", "backend", "pipeline.js");

function loadModule() {
  delete require.cache[modulePath];
  return require(modulePath);
}

test("Aishell Thai speed normalization maps aliases and rejects unknown labels", function () {
  const pipeline = loadModule();

  assert.equal(pipeline.normalizeThaiRecommendedSpeed("慢"), "慢");
  assert.equal(pipeline.normalizeThaiRecommendedSpeed("中速"), "正常");
  assert.equal(pipeline.normalizeThaiRecommendedSpeed("正常"), "正常");
  assert.equal(pipeline.normalizeThaiRecommendedSpeed("快速"), "快");
  assert.throws(function () {
    pipeline.normalizeThaiRecommendedSpeed("特别快");
  }, /语速|speed/i);
});
