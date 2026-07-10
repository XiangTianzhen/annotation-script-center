"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { aiCallLogger } = require("./ai-call-log");

test("Jinhua AI call log records expert usage once as the combined stage", function () {
  const headers = aiCallLogger.schema.map(function (column) {
    return column.header;
  });
  const row = aiCallLogger.buildRow({
    requestId: "req-single-stage",
    success: true,
    normalizedRequest: {
      input: {
        segmentNumber: 3,
      },
    },
    execution: {
      projectResult: {
        models: {
          modelMode: "expert_omni_plus",
          singleModel: "qwen3.5-omni-plus",
        },
        usage: {
          single: {
            input_tokens: 12,
            output_tokens: 8,
            total_tokens: 20,
          },
        },
        cost: {
          single: {
            estimatedCostCny: 0.001234,
          },
        },
      },
    },
  });

  assert.ok(headers.includes("听音和收口模型"));
  assert.ok(headers.includes("听音和收口输入Token"));
  assert.ok(headers.includes("听音和收口输出Token"));
  assert.ok(headers.includes("听音和收口总Token"));
  assert.ok(headers.includes("听音和收口预估人民币"));
  assert.equal(row.singleModel, "qwen3.5-omni-plus");
  assert.equal(row.singlePromptTokens, "12");
  assert.equal(row.singleCompletionTokens, "8");
  assert.equal(row.singleTotalTokens, "20");
  assert.equal(row.singleEstimatedCostCny, "0.001234");
  assert.equal(row.listenPromptTokens, "");
  assert.equal(row.refinePromptTokens, "");
});
