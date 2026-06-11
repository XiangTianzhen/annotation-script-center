"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { aiCallLogger } = require("./ai-call-log");

test("Aishell Vietnamese AI call log row includes estimated cost columns", function () {
  const row = aiCallLogger.buildRow({
    createdAt: "2026-06-11T12:00:00.000Z",
    normalizedRequest: {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
    },
    result: {
      meta: {
        models: {
          pipelineMode: "omni_single",
          recognizeModel: "qwen3.5-omni-plus",
          singleModel: "qwen3.5-omni-plus",
        },
        usage: {
          promptTokens: 145,
          completionTokens: 8,
          totalTokens: 153,
          raw: {
            prompt_tokens_details: {
              text_tokens: 5,
              audio_tokens: 140,
            },
          },
        },
        cost: {
          recognize: {
            estimatedCostCny: 0.007742,
          },
          totalEstimatedCostCny: 0.007742,
        },
      },
    },
  });

  assert.equal(row.recognizePromptTokens, "145");
  assert.equal(row.recognizeCompletionTokens, "8");
  assert.equal(row.recognizeTotalTokens, "153");
  assert.equal(row.recognizeEstimatedCostCny, "0.007742");
  assert.equal(row.totalEstimatedCostCny, "0.007742");
});
