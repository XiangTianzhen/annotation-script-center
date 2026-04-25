"use strict";

const { CSV_COLUMNS } = require("./csv-columns");

function createEmptyRow(csvColumns) {
  const row = {};
  (csvColumns || CSV_COLUMNS).forEach(function (column) {
    row[column] = "";
  });
  return row;
}

function findLabelSlot(row, subTaskId) {
  const slots = [1, 2, 3];
  const existing = slots.find(function (slot) {
    return row["标注员" + slot + "子任务ID"] === subTaskId;
  });
  if (existing) {
    return existing;
  }

  return (
    slots.find(function (slot) {
      return !row["标注员" + slot + "子任务ID"];
    }) || 3
  );
}

function applyRoleRecord(row, roleRecord) {
  const role = String(roleRecord.role || "");
  const subTaskId = String(roleRecord.subTaskId || "");
  if (!subTaskId) {
    return;
  }

  if (role === "audit") {
    row["审核子任务ID"] = subTaskId;
    row["审核员"] = String(roleRecord.userName || roleRecord.userId || "");
    row["审核领取时间"] = String(roleRecord.receiveTime || "");
    row["审核提交时间"] = String(roleRecord.submitTime || "");
    row["审核是否完成"] = String(roleRecord.completed || "");
    return;
  }

  const slot = findLabelSlot(row, subTaskId);
  row["标注员" + slot + "子任务ID"] = subTaskId;
  row["标注员" + slot] = String(roleRecord.userName || roleRecord.userId || "");
  row["标注员" + slot + "领取时间"] = String(roleRecord.receiveTime || "");
  row["标注员" + slot + "提交时间"] = String(roleRecord.submitTime || "");
  row["标注员" + slot + "是否完成"] = String(roleRecord.completed || "");
}

function getBatchId(payload, patch, roleRecord) {
  return String(
    payload?.mergeKey?.batchId || roleRecord.batchId || patch["分包ID"] || ""
  ).trim();
}

function mergeUploadPayload(payload, store) {
  const csvColumns = store.csvColumns || CSV_COLUMNS;
  const patch = payload && typeof payload.csvPatch === "object" ? payload.csvPatch : {};
  const roleRecord = payload && typeof payload.roleRecord === "object" ? payload.roleRecord : {};
  const batchId = getBatchId(payload || {}, patch, roleRecord);
  if (!batchId) {
    throw new Error("payload 缺少 mergeKey.batchId / 分包ID。");
  }

  const rowsByBatchId = store.loadRows();
  const row = Object.assign(createEmptyRow(csvColumns), rowsByBatchId[batchId] || {});

  Object.keys(patch).forEach(function (key) {
    if (csvColumns.indexOf(key) >= 0) {
      row[key] = String(patch[key] || "");
    }
  });

  applyRoleRecord(row, roleRecord);
  rowsByBatchId[batchId] = row;
  store.saveRows(rowsByBatchId);
  store.writeCsv(rowsByBatchId);
  store.appendUploadEvent(payload);

  const paths = store.getPaths();
  return {
    batchId,
    rowCount: Object.keys(rowsByBatchId).length,
    csvPath: paths.csvPath,
    rowsPath: paths.rowsPath,
    eventsPath: paths.eventsPath,
  };
}

module.exports = {
  applyRoleRecord,
  createEmptyRow,
  findLabelSlot,
  mergeUploadPayload,
};
