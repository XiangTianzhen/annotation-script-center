"use strict";

const assert = require("assert");
const test = require("node:test");

const provider = require("./qwen-openai-compatible");

test("shared qwen provider forces thinking off regardless of request and env", function () {
  const requestPreference = provider.resolveThinkingPreference(
    { enableThinking: true },
    { enableThinkingDefault: true }
  );
  const envPreference = provider.resolveThinkingPreference(
    {},
    { enableThinkingDefault: true }
  );

  assert.deepEqual(requestPreference, {
    source: "forced-off",
    enabled: false,
  });
  assert.deepEqual(envPreference, {
    source: "forced-off",
    enabled: false,
  });
});
