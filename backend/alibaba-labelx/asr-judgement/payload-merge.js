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

function applyPayloadToRows(payload, rowsByBatchId, csvColumns) {
  const patch = payload && typeof payload.csvPatch === "object" ? payload.csvPatch : {};
  const roleRecord = payload && typeof payload.roleRecord === "object" ? payload.roleRecord : {};
  const batchId = getBatchId(payload || {}, patch, roleRecord);
  if (!batchId) {
    throw new Error("payload 缺少 mergeKey.batchId / 分包ID。");
  }

  const row = Object.assign(createEmptyRow(csvColumns), rowsByBatchId[batchId] || {});

  Object.keys(patch).forEach(function (key) {
    if (csvColumns.indexOf(key) >= 0) {
      row[key] = String(patch[key] || "");
    }
  });

  applyRoleRecord(row, roleRecord);
  rowsByBatchId[batchId] = row;
  return {
    batchId,
    row,
  };
}

function mergeUploadPayload(payload, store) {
  const csvColumns = store.csvColumns || CSV_COLUMNS;
  const rowsByBatchId = store.loadRows();
  const result = applyPayloadToRows(payload, rowsByBatchId, csvColumns);
  store.saveRows(rowsByBatchId);
  store.writeCsv(rowsByBatchId);
  store.appendUploadEvent(payload);

  const paths = store.getPaths();
  return {
    batchId: result.batchId,
    rowCount: Object.keys(rowsByBatchId).length,
    csvPath: paths.csvPath,
    rowsPath: paths.rowsPath,
    eventsPath: paths.eventsPath,
  };
}

function normalizePayloads(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.payloads)) {
    return payload.payloads;
  }
  return [payload];
}

function mergeUploadPayloads(payload, store) {
  const payloads = normalizePayloads(payload).filter(function (item) {
    return item && typeof item === "object";
  });
  if (payloads.length === 0) {
    throw new Error("payloads 为空，无法合并统计数据。");
  }

  const csvColumns = store.csvColumns || CSV_COLUMNS;
  const rowsByBatchId = store.loadRows();
  const results = payloads.map(function (item) {
    const result = applyPayloadToRows(item, rowsByBatchId, csvColumns);
    store.appendUploadEvent(item);
    return result;
  });
  store.saveRows(rowsByBatchId);
  store.writeCsv(rowsByBatchId);

  const paths = store.getPaths();
  return {
    batchCount: results.length,
    results: results.map(function (item) {
      return {
        batchId: item.batchId,
        csvPath: paths.csvPath,
      };
    }),
    rowCount: Object.keys(rowsByBatchId).length,
    csvPath: paths.csvPath,
    rowsPath: paths.rowsPath,
    eventsPath: paths.eventsPath,
  };
}

module.exports = {
  applyRoleRecord,
  applyPayloadToRows,
  createEmptyRow,
  findLabelSlot,
  mergeUploadPayload,
  mergeUploadPayloads,
  normalizePayloads,
};
