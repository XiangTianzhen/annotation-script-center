"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiCallLogModulePath = resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "taizhou-helper",
  "backend",
  "ai-call-log.js"
);

test("Taizhou AI call log uses one Omni stage and its own environment variable", function () {
  const source = fs.readFileSync(aiCallLogModulePath, "utf8");

  assert.match(source, /BYTEDANCE_AIDP_TAIZHOU_AI_CALL_LOG_DIR/);
  assert.match(source, /key: "omni"/);
  assert.match(source, /header: "全模态模型"/);
  assert.doesNotMatch(source, /key: "listen"/);
  assert.doesNotMatch(source, /key: "refine"/);
  assert.doesNotMatch(source, /listenModel/);
  assert.doesNotMatch(source, /refineModel/);
  assert.doesNotMatch(source, /Jinhua|JINHUA|jinhua/);
});
