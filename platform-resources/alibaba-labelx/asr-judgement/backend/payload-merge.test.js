"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { CSV_COLUMNS } = require("./csv-columns");
const { createMergeRowId, mergeUploadPayloads } = require("./payload-merge");

function createStore(initialRows) {
  let savedRows = null;
  const sourceRows = JSON.parse(JSON.stringify(initialRows || {}));
  return {
    csvColumns: CSV_COLUMNS,
    loadRows() {
      return JSON.parse(JSON.stringify(sourceRows));
    },
    saveRows(rows) {
      savedRows = JSON.parse(JSON.stringify(rows));
    },
    writeCsv() {},
    appendUploadEvent() {},
    getPaths() {
      return {
        rowsPath: "rows.json",
        eventsPath: "events.json",
      };
    },
    getSavedRows() {
      return savedRows;
    },
  };
}

test("judgement force replace only updates matched label slot and preserves other slots plus audit", function () {
  const mergeRowId = createMergeRowId("棋燊", "batch-9");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例快判任务",
      "任务ID": "task-9",
      "分包ID": "batch-9",
      "题数": "12",
      "有效时长(秒)_S": "98",
      "供应商": "棋燊",
      "标注员1子任务ID": "label-1",
      "标注员1_P": "标注员一",
      "标注员1领取时间": "2026-06-01 09:00:00",
      "标注员1提交时间": "2026-06-01 09:10:00",
      "标注员1是否完成": "已完成",
      "标注员2子任务ID": "label-2",
      "标注员2_P": "标注员二",
      "标注员2领取时间": "2026-06-01 09:20:00",
      "标注员2提交时间": "2026-06-01 09:30:00",
      "标注员2是否完成": "已完成",
      "标注员3子任务ID": "label-3",
      "标注员3_P": "标注员三",
      "标注员3领取时间": "2026-06-01 09:40:00",
      "标注员3提交时间": "2026-06-01 09:50:00",
      "标注员3是否完成": "已完成",
      "审核子任务ID": "audit-1",
      "审核员_P": "审核员甲",
      "审核领取时间": "2026-06-01 10:00:00",
      "审核提交时间": "2026-06-01 10:10:00",
      "审核是否完成": "已完成",
    },
  });

  const result = mergeUploadPayloads(
    {
      forceReplaceByBatchId: true,
      replaceMode: "batch",
      replaceBatchIds: ["batch-9"],
      payloads: [
        {
          mergeKey: { batchId: "batch-9" },
          csvPatch: {
            "任务名称": "示例快判任务",
            "任务ID": "task-9",
            "分包ID": "batch-9",
            "题数": "12",
            "有效时长(秒)_S": "100",
            "供应商": "棋燊",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-2",
            userName: "新标注员二",
            receiveTime: "2026-06-04 09:00:00",
            submitTime: "2026-06-04 09:12:00",
            completed: "已完成",
          },
          rawKeys: {
            status: 1,
          },
        },
      ],
    },
    store
  );

  const savedRows = store.getSavedRows();
  assert.equal(result.deletedRowCount, 0);
  assert.equal(savedRows[mergeRowId]["标注员1_P"], "标注员一");
  assert.equal(savedRows[mergeRowId]["标注员2_P"], "新标注员二");
  assert.equal(savedRows[mergeRowId]["标注员3_P"], "标注员三");
  assert.equal(savedRows[mergeRowId]["审核员_P"], "审核员甲");
  assert.equal(savedRows[mergeRowId]["审核提交时间"], "2026-06-01 10:10:00");
}
);

test("judgement empty role fields do not clear existing slot values", function () {
  const mergeRowId = createMergeRowId("棋燊", "batch-10");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例快判任务",
      "任务ID": "task-10",
      "分包ID": "batch-10",
      "题数": "5",
      "有效时长(秒)_S": "40",
      "供应商": "棋燊",
      "标注员2子任务ID": "label-keep",
      "标注员2_P": "已有标注员",
      "标注员2领取时间": "2026-06-01 07:00:00",
      "标注员2提交时间": "2026-06-01 07:06:00",
      "标注员2是否完成": "已完成",
    },
  });

  mergeUploadPayloads(
    {
      forceReplaceByBatchId: true,
      replaceMode: "batch",
      replaceBatchIds: ["batch-10"],
      payloads: [
        {
          mergeKey: { batchId: "batch-10" },
          csvPatch: {
            "任务名称": "示例快判任务",
            "任务ID": "task-10",
            "分包ID": "batch-10",
            "供应商": "棋燊",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-keep",
            userName: "",
            receiveTime: "",
            submitTime: "",
            completed: "",
          },
          rawKeys: {},
        },
      ],
    },
    store
  );

  const savedRows = store.getSavedRows();
  assert.equal(savedRows[mergeRowId]["标注员2_P"], "已有标注员");
  assert.equal(savedRows[mergeRowId]["标注员2领取时间"], "2026-06-01 07:00:00");
  assert.equal(savedRows[mergeRowId]["标注员2提交时间"], "2026-06-01 07:06:00");
  assert.equal(savedRows[mergeRowId]["标注员2是否完成"], "已完成");
}
);
