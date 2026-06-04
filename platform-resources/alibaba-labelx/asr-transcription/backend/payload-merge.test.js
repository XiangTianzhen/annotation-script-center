"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { CSV_COLUMNS } = require("./csv-columns");
const { createMergeRowId, mergeUploadPayloads } = require("./payload-merge");

function createStore(initialRows) {
  let savedRows = null;
  let writtenRows = null;
  const uploadEvents = [];
  const sourceRows = JSON.parse(JSON.stringify(initialRows || {}));
  return {
    csvColumns: CSV_COLUMNS,
    loadRows() {
      return JSON.parse(JSON.stringify(sourceRows));
    },
    saveRows(rows) {
      savedRows = JSON.parse(JSON.stringify(rows));
    },
    writeCsv(rows) {
      writtenRows = JSON.parse(JSON.stringify(rows));
    },
    appendUploadEvent(payload) {
      uploadEvents.push(payload);
    },
    getPaths() {
      return {
        rowsPath: "rows.json",
        eventsPath: "events.json",
      };
    },
    getSavedRows() {
      return savedRows;
    },
    getWrittenRows() {
      return writtenRows;
    },
    getUploadEvents() {
      return uploadEvents.slice();
    },
  };
}

test("transcription force replace only updates current label role and preserves audit columns", function () {
  const mergeRowId = createMergeRowId("希尔贝壳", "batch-1");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例转写任务",
      "任务ID": "task-1",
      "分包ID": "batch-1",
      "题数": "8",
      "有效时长(秒)_S": "120",
      "供应商": "希尔贝壳",
      "标注子任务ID": "label-old",
      "标注员_P": "旧标注员",
      "标注领取时间": "2026-06-01 10:00:00",
      "标注提交时间": "2026-06-01 10:30:00",
      "标注是否完成": "已完成",
      "审核子任务ID": "audit-old",
      "审核员_P": "旧审核员",
      "审核领取时间": "2026-06-01 11:00:00",
      "审核提交时间": "2026-06-01 11:20:00",
      "审核是否完成": "已完成",
    },
  });

  const result = mergeUploadPayloads(
    {
      forceReplaceByBatchId: true,
      replaceMode: "batch",
      replaceBatchIds: ["batch-1"],
      payloads: [
        {
          mergeKey: { batchId: "batch-1" },
          csvPatch: {
            "任务名称": "示例转写任务",
            "任务ID": "task-1",
            "分包ID": "batch-1",
            "题数": "8",
            "有效时长(秒)_S": "125",
            "供应商": "希尔贝壳",
          },
          roleRecord: {
            role: "label",
            subTaskId: "label-new",
            userName: "新标注员",
            receiveTime: "2026-06-04 09:00:00",
            submitTime: "2026-06-04 09:25:00",
            completed: "已完成",
          },
        },
      ],
    },
    store
  );

  const savedRows = store.getSavedRows();
  assert.equal(result.deletedRowCount, 0);
  assert.equal(result.rowCount, 1);
  assert.equal(savedRows[mergeRowId]["标注子任务ID"], "label-new");
  assert.equal(savedRows[mergeRowId]["标注员_P"], "新标注员");
  assert.equal(savedRows[mergeRowId]["审核子任务ID"], "audit-old");
  assert.equal(savedRows[mergeRowId]["审核员_P"], "旧审核员");
  assert.equal(savedRows[mergeRowId]["审核提交时间"], "2026-06-01 11:20:00");
}
);

test("transcription empty role fields do not clear existing label completion fields", function () {
  const mergeRowId = createMergeRowId("希尔贝壳", "batch-2");
  const store = createStore({
    [mergeRowId]: {
      "任务名称": "示例转写任务",
      "任务ID": "task-2",
      "分包ID": "batch-2",
      "题数": "3",
      "有效时长(秒)_S": "45",
      "供应商": "希尔贝壳",
      "标注子任务ID": "label-keep",
      "标注员_P": "已有标注员",
      "标注领取时间": "2026-06-01 08:00:00",
      "标注提交时间": "2026-06-01 08:10:00",
      "标注是否完成": "已完成",
    },
  });

  mergeUploadPayloads(
    {
      forceReplaceByBatchId: true,
      replaceMode: "batch",
      replaceBatchIds: ["batch-2"],
      payloads: [
        {
          mergeKey: { batchId: "batch-2" },
          csvPatch: {
            "任务名称": "示例转写任务",
            "任务ID": "task-2",
            "分包ID": "batch-2",
            "供应商": "希尔贝壳",
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
  assert.equal(savedRows[mergeRowId]["标注员_P"], "已有标注员");
  assert.equal(savedRows[mergeRowId]["标注领取时间"], "2026-06-01 08:00:00");
  assert.equal(savedRows[mergeRowId]["标注提交时间"], "2026-06-01 08:10:00");
  assert.equal(savedRows[mergeRowId]["标注是否完成"], "已完成");
}
);
