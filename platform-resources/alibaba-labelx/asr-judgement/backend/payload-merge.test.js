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

test("judgement force replace reuses the exact username plus subTaskId slot and preserves others", function () {
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
            userName: "标注员二",
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
  assert.equal(result.failedCount, 0);
  assert.equal(savedRows[mergeRowId]["标注员1_P"], "标注员一");
  assert.equal(savedRows[mergeRowId]["标注员2_P"], "标注员二");
  assert.equal(savedRows[mergeRowId]["标注员2提交时间"], "2026-06-04 09:12:00");
  assert.equal(savedRows[mergeRowId]["标注员3_P"], "标注员三");
  assert.equal(savedRows[mergeRowId]["审核员_P"], "审核员甲");
}
);

test("judgement same username with different subTaskId is rejected", function () {
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

  const result = mergeUploadPayloads(
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
            subTaskId: "label-new",
            userName: "已有标注员",
            receiveTime: "2026-06-02 07:00:00",
            submitTime: "2026-06-02 07:06:00",
            completed: "已完成",
          },
          rawKeys: {},
        },
      ],
    },
    store
  );

  assert.equal(result.failedCount, 1);
  assert.equal(result.acceptedCount, 0);
  assert.equal(
    result.failures[0].message,
    "标注员用户名已存在，但子任务ID不一致，已拒绝覆盖现有槽位。"
  );
});

test("judgement same subTaskId with different username is rejected", function () {
  const mergeRowId = createMergeRowId("棋燊", "batch-11");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例快判任务",
      "任务ID": "task-11",
      "分包ID": "batch-11",
      "题数": "6",
      "有效时长(秒)_S": "60",
      "供应商": "棋燊",
      "标注员1子任务ID": "label-dup",
      "标注员1_P": "原标注员",
      "标注员1领取时间": "2026-06-01 07:00:00",
      "标注员1提交时间": "2026-06-01 07:06:00",
      "标注员1是否完成": "已完成",
    },
  });

  const result = mergeUploadPayloads(
    {
      payloads: [
        {
          mergeKey: { batchId: "batch-11" },
          csvPatch: {
            "任务名称": "示例快判任务",
            "任务ID": "task-11",
            "分包ID": "batch-11",
            "供应商": "棋燊",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-dup",
            userName: "新标注员",
            receiveTime: "2026-06-02 07:00:00",
            submitTime: "2026-06-02 07:06:00",
            completed: "已完成",
          },
          rawKeys: {},
        },
      ],
    },
    store
  );

  assert.equal(result.failedCount, 1);
  assert.equal(result.acceptedCount, 0);
  assert.equal(
    result.failures[0].message,
    "标注员子任务ID已存在，但用户名不一致，已拒绝覆盖现有槽位。"
  );
});

test("judgement new label user fills the first empty slot", function () {
  const mergeRowId = createMergeRowId("棋燊", "batch-12");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例快判任务",
      "任务ID": "task-12",
      "分包ID": "batch-12",
      "题数": "7",
      "有效时长(秒)_S": "70",
      "供应商": "棋燊",
      "标注员1子任务ID": "label-1",
      "标注员1_P": "标注员一",
      "标注员1领取时间": "2026-06-01 09:00:00",
      "标注员1提交时间": "2026-06-01 09:10:00",
      "标注员1是否完成": "已完成",
    },
  });

  const result = mergeUploadPayloads(
    {
      payloads: [
        {
          mergeKey: { batchId: "batch-12" },
          csvPatch: {
            "任务名称": "示例快判任务",
            "任务ID": "task-12",
            "分包ID": "batch-12",
            "供应商": "棋燊",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-2",
            userName: "标注员二",
            receiveTime: "2026-06-03 09:00:00",
            submitTime: "2026-06-03 09:12:00",
            completed: "已完成",
          },
          rawKeys: {},
        },
      ],
    },
    store
  );

  const savedRows = store.getSavedRows();
  assert.equal(result.failedCount, 0);
  assert.equal(savedRows[mergeRowId]["标注员2子任务ID"], "label-2");
  assert.equal(savedRows[mergeRowId]["标注员2_P"], "标注员二");
});

test("judgement fourth different label user is rejected when slots are full", function () {
  const mergeRowId = createMergeRowId("棋燊", "batch-13");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例快判任务",
      "任务ID": "task-13",
      "分包ID": "batch-13",
      "题数": "8",
      "有效时长(秒)_S": "80",
      "供应商": "棋燊",
      "标注员1子任务ID": "label-1",
      "标注员1_P": "标注员一",
      "标注员2子任务ID": "label-2",
      "标注员2_P": "标注员二",
      "标注员3子任务ID": "label-3",
      "标注员3_P": "标注员三",
    },
  });

  const result = mergeUploadPayloads(
    {
      payloads: [
        {
          mergeKey: { batchId: "batch-13" },
          csvPatch: {
            "任务名称": "示例快判任务",
            "任务ID": "task-13",
            "分包ID": "batch-13",
            "供应商": "棋燊",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-4",
            userName: "标注员四",
            receiveTime: "2026-06-03 09:00:00",
            submitTime: "2026-06-03 09:12:00",
            completed: "已完成",
          },
          rawKeys: {},
        },
      ],
    },
    store
  );

  assert.equal(result.failedCount, 1);
  assert.equal(
    result.failures[0].message,
    "同一供应商分包超过 3 个标注员子任务，已拒绝覆盖现有槽位。"
  );
});
