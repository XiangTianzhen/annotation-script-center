"use strict";

const assert = require("assert");
const test = require("node:test");

const {
  buildExistingResponseItems,
} = require("../labelx-existing-core");

test("LabelX existing core groups rows by batchId and evaluates items through adapter", function () {
  const items = [
    {
      batchId: "batch-1",
      role: "label",
      subTaskId: "label-1",
    },
    {
      batchId: "batch-2",
      role: "audit",
      subTaskId: "audit-2",
    },
  ];
  const rowsByMergeRowId = {
    "row-1": {
      "分包ID": "batch-1",
      labelId: "label-1",
      complete: "1",
    },
  };
  const adapter = {
    pickRow(rows, role, subTaskId) {
      return rows.find(function (row) {
        if (role === "audit") {
          return row.auditId === subTaskId;
        }
        return row.labelId === subTaskId;
      }) || rows[0] || null;
    },
    evaluateCompletion(row) {
      const complete = String(row?.complete || "") === "1";
      return {
        complete,
        missingFields: complete ? [] : ["示例字段"],
      };
    },
    getMissingFieldsForAbsentBatch(role) {
      return role === "audit" ? ["审核字段"] : ["标注字段"];
    },
  };

  const result = buildExistingResponseItems(items, rowsByMergeRowId, adapter);

  assert.deepEqual(result, [
    {
      batchId: "batch-1",
      role: "label",
      subTaskId: "label-1",
      exists: true,
      complete: true,
      missingFields: [],
    },
    {
      batchId: "batch-2",
      role: "audit",
      subTaskId: "audit-2",
      exists: false,
      complete: false,
      missingFields: ["审核字段"],
    },
  ]);
});

test("LabelX existing core normalizes check role to audit", function () {
  const adapter = {
    pickRow(rows) {
      return rows[0] || null;
    },
    evaluateCompletion() {
      return {
        complete: false,
        missingFields: ["审核子任务ID"],
      };
    },
    getMissingFieldsForAbsentBatch(role) {
      return role === "audit" ? ["审核子任务ID"] : ["标注子任务ID"];
    },
  };

  const result = buildExistingResponseItems(
    [
      {
        batchId: "batch-9",
        role: "check",
        subTaskId: "audit-9",
      },
    ],
    {},
    adapter
  );

  assert.deepEqual(result, [
    {
      batchId: "batch-9",
      role: "audit",
      subTaskId: "audit-9",
      exists: false,
      complete: false,
      missingFields: ["审核子任务ID"],
    },
  ]);
});
