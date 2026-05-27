"use strict";

const test = require("node:test");
const assert = require("assert");
const {
  normalizeAiUsageOperatorName,
  buildAiUsageRequestMeta,
  createMissingAiUsageOperatorError,
} = require("./ai-usage-meta");

test("normalizeAiUsageOperatorName trims and clamps the operator name", function () {
  assert.equal(normalizeAiUsageOperatorName("  张 三  "), "张 三");
  assert.equal(normalizeAiUsageOperatorName(""), "");
});

test("buildAiUsageRequestMeta keeps platform user fields optional", function () {
  assert.deepEqual(
    buildAiUsageRequestMeta({
      settings: { meta: { aiUsageOperatorName: "李四" } },
      platformUserName: "labelx-user",
      platformUserId: "",
    }),
    {
      aiUsageOperatorName: "李四",
      platformUserName: "labelx-user",
      platformUserId: "",
    }
  );
});

test("createMissingAiUsageOperatorError returns a stable code", function () {
  const error = createMissingAiUsageOperatorError();
  assert.equal(error.code, "missing-ai-usage-operator-name");
});
