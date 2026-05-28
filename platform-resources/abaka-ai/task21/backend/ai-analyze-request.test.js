"use strict";

const assert = require("assert");
const test = require("node:test");

const { resolveRuntimeOptions } = require("./ai-analyze-request");

test("Task21 runtime options force thinking off even if request and config ask for true", function () {
  const runtimeOptions = resolveRuntimeOptions(
    {
      target: "overall",
      enableThinking: true,
      options: {
        enableThinking: true,
      },
      debugConfig: {
        enableThinking: true,
      },
    },
    {
      timeoutMs: 120000,
      defaultEnableThinking: true,
    }
  );

  assert.equal(runtimeOptions.enableThinking, false);
  assert.equal(runtimeOptions.thinkingSource, "forced-off");
});
