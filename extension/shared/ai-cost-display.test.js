"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildCostRows,
  formatEstimatedCostCny,
  resolveTotalEstimatedCostLabel,
} = require("./ai-cost-display.js");

test("formatEstimatedCostCny trims trailing zeros", function () {
  assert.equal(formatEstimatedCostCny(0.001762), "0.001762 元");
  assert.equal(formatEstimatedCostCny(0.00234), "0.00234 元");
});

test("buildCostRows supports multi-stage rows and no-source fallback", function () {
  const rows = buildCostRows({
    cost: {
      listen: {
        estimatedCostCny: 0.001762,
      },
      compare: {
        reason: "没有数据源",
      },
    },
    stageDefinitions: [
      {
        key: "listen",
        label: "听音预估人民币",
      },
      {
        key: "compare",
        label: "比较预估人民币",
      },
    ],
    totalLabel: "总预估人民币",
  });

  assert.deepEqual(rows, [
    ["听音预估人民币", "0.001762 元"],
    ["比较预估人民币", "没有数据源"],
    ["总预估人民币", "没有数据源"],
  ]);
});

test("buildCostRows supports single-stage fallback to total estimate", function () {
  const rows = buildCostRows({
    cost: {
      totalEstimatedCostCny: 0.002345,
    },
    stageDefinitions: [
      {
        key: "recommend",
        label: "预估人民币",
        fallbackToTotal: true,
      },
    ],
  });

  assert.deepEqual(rows, [["预估人民币", "0.002345 元"]]);
});

test("resolveTotalEstimatedCostLabel falls back to pricing note when no stage reason exists", function () {
  assert.equal(
    resolveTotalEstimatedCostLabel(
      {
        note: "价格按官方公开文档估算；当前阶段没有可估算数据。",
      },
      ["listen", "compare"]
    ),
    "价格按官方公开文档估算；当前阶段没有可估算数据。"
  );
});
