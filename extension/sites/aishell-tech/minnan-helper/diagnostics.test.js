"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { buildCurrentResultDiagnostics } = require("./diagnostics.js");

test("Aishell diagnostics includes lexicon status and mode row", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        lexicon: {
          status: "ready",
          rewriteMode: "off",
        },
      },
    },
    {}
  );
  const row = diagnostics.rows.find(function (item) {
    return item[0] === "词表状态与模式";
  });

  assert.deepEqual(row, [
    "词表状态与模式",
    "主词表已加载 / 固定携带 / 改写模式 off",
  ]);
});

test("Aishell diagnostics includes stage estimated RMB rows", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        cost: {
          convert: {
            estimatedCostCny: 0.000512,
          },
          listen: {
            estimatedCostCny: 0.001762,
          },
          compare: {
            estimatedCostCny: 0.000114,
          },
          totalEstimatedCostCny: 0.002388,
        },
      },
    },
    {}
  );

  assert.deepEqual(
    diagnostics.rows.filter(function (item) {
      return /预估人民币/.test(item[0]);
    }),
    [
      ["转换预估人民币", "0.000512 元"],
      ["听音预估人民币", "0.001762 元"],
      ["比较预估人民币", "0.000114 元"],
      ["总预估人民币", "0.002388 元"],
    ]
  );
});

test("Aishell diagnostics shows no-source label when pricing is unavailable", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        cost: {
          convert: {
            reason: "没有数据源",
          },
        },
      },
    },
    {}
  );
  const totalRow = diagnostics.rows.find(function (item) {
    return item[0] === "总预估人民币";
  });

  assert.deepEqual(totalRow, ["总预估人民币", "没有数据源"]);
});
