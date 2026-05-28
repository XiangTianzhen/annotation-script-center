"use strict";

const test = require("node:test");
const assert = require("assert");
const {
  normalizeAiUsageOperatorName,
  buildAiUsageRequestMeta,
  createAiUsageOperatorSettingsPatch,
  assertAiUsageOperatorConfigured,
  appendAiUsageRequestMeta,
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

test("createAiUsageOperatorSettingsPatch stores the normalized name in settings.meta", function () {
  assert.deepEqual(createAiUsageOperatorSettingsPatch("  王 五  "), {
    meta: {
      aiUsageOperatorName: "王 五",
    },
  });
  assert.deepEqual(createAiUsageOperatorSettingsPatch(""), {
    meta: {
      aiUsageOperatorName: "",
    },
  });
});

test("assertAiUsageOperatorConfigured throws the stable missing-operator error", function () {
  assert.throws(
    function () {
      assertAiUsageOperatorConfigured({ aiUsageOperatorName: "" });
    },
    function (error) {
      return error && error.code === "missing-ai-usage-operator-name";
    }
  );
});

test("appendAiUsageRequestMeta appends normalized fields without mutating payload", function () {
  const payload = {
    foo: "bar",
  };
  const result = appendAiUsageRequestMeta(payload, {
    aiUsageOperatorName: "  王五  ",
    platformUserName: " labelx-user ",
    platformUserId: " user-1 ",
  });

  assert.deepEqual(payload, {
    foo: "bar",
  });
  assert.deepEqual(result, {
    foo: "bar",
    aiUsageOperatorName: "王五",
    platformUserName: "labelx-user",
    platformUserId: "user-1",
  });
});

test("createMissingAiUsageOperatorError returns a stable code", function () {
  const error = createMissingAiUsageOperatorError();
  assert.equal(error.code, "missing-ai-usage-operator-name");
});
