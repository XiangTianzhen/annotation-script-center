"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { buildCurrentResultDiagnostics } = require("./diagnostics.js");

test("Aishell Vietnamese diagnostics show estimated cost when present", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        usage: {
          promptTokens: 145,
          completionTokens: 8,
          totalTokens: 153,
        },
        cost: {
          recognize: {
            estimatedCostCny: 0.002345,
          },
          totalEstimatedCostCny: 0.002345,
        },
      },
    },
    {}
  );
  const row = diagnostics.rows.find(function (item) {
    return item[0] === "预估人民币";
  });

  assert.deepEqual(row, ["预估人民币", "0.002345 元"]);
});

test("Aishell Vietnamese diagnostics show no-data-source cost reason", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        cost: {
          recognize: {
            reason: "没有数据源",
          },
          totalEstimatedCostCny: null,
        },
      },
    },
    {}
  );
  const row = diagnostics.rows.find(function (item) {
    return item[0] === "预估人民币";
  });

  assert.deepEqual(row, ["预估人民币", "没有数据源"]);
});
