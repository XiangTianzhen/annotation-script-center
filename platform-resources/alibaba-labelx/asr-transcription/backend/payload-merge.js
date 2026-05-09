"use strict";

const { CSV_COLUMNS } = require("./csv-columns");
const BASE_PATCH_COLUMNS = new Set([
  "任务名称",
  "任务ID",
  "分包ID",
  "题数",
  "有效时长(秒)",
]);
const ROLE_SPECIFIC_COLUMNS = new Set([
  "标注子任务ID",
  "审核子任务ID",
  "标注员",
  "审核员",
  "标注领取时间",
  "标注提交时间",
  "审核领取时间",
  "审核提交时间",
  "标注是否完成",
  "审核是否完成",
]);

function createEmptyRow(csvColumns) {
  const row = {};
  (csvColumns || CSV_COLUMNS).forEach(function (column) {
    row[column] = "";
  });
  return row;
}

function formatDuration(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "";
  }
  return numeric.toFixed(4).replace(/\.?0+$/, "");
}

function normalizeCompletedValue(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text === "已完成") {
    return "已完成";
  }
  if (
    text === "未完成" ||
    text === "false" ||
    text === "0" ||
    text === "待完成" ||
    text === "待提交"
  ) {
    return "未完成";
  }
  if (text === "true" || text === "1") {
    return "已完成";
  }
  return text;
}

function inferCompleted(role, roleRecord, payload) {
  const hasSubmitTime = Boolean(
    roleRecord?.submitTime ||
      payload?.rawKeys?.gmtCommit ||
      payload?.rawKeys?.commitTime ||
      payload?.rawKeys?.submitTime
  );
  if (hasSubmitTime) {
    return "已完成";
  }

  const statusValue =
    roleRecord?.status !== undefined
      ? roleRecord.status
      : payload?.rawKeys?.status !== undefined
        ? payload.rawKeys.status
        : "";
  const numericStatus = Number(statusValue);
  if (Number.isFinite(numericStatus)) {
    return numericStatus > 0 ? "已完成" : "未完成";
  }

  return "未完成";
}

function applyRoleRecord(row, roleRecord, patch, payload) {
  const role = String(roleRecord?.role || "").toLowerCase();
  if (role !== "label" && role !== "audit") {
    throw new Error("payload roleRecord.role 必须为 label 或 audit。");
  }

  if (role === "audit") {
    if (roleRecord?.subTaskId) {
      row["审核子任务ID"] = String(roleRecord.subTaskId);
    }
    if (roleRecord?.userName || roleRecord?.userId) {
      row["审核员"] = String(roleRecord.userName || roleRecord.userId || "");
    }
    if (roleRecord?.receiveTime) {
      row["审核领取时间"] = String(roleRecord.receiveTime);
    }
    if (roleRecord?.submitTime) {
      row["审核提交时间"] = String(roleRecord.submitTime);
    }
    row["审核是否完成"] =
      normalizeCompletedValue(roleRecord?.completed) || inferCompleted(role, roleRecord, payload);
    return;
  }

  if (roleRecord?.subTaskId) {
    row["标注子任务ID"] = String(roleRecord.subTaskId);
  }
  if (roleRecord?.userName || roleRecord?.userId) {
    row["标注员"] = String(roleRecord.userName || roleRecord.userId || "");
  }
  if (roleRecord?.receiveTime) {
    row["标注领取时间"] = String(roleRecord.receiveTime);
  }
  if (roleRecord?.submitTime) {
    row["标注提交时间"] = String(roleRecord.submitTime);
  }
  row["标注是否完成"] =
    normalizeCompletedValue(roleRecord?.completed) || inferCompleted(role, roleRecord, payload);
}

function getBatchId(payload, patch, roleRecord) {
  return String(
    payload?.mergeKey?.batchId || roleRecord?.batchId || patch?.["分包ID"] || ""
  ).trim();
}

function applyBasePatch(row, patch, csvColumns) {
  Object.keys(patch).forEach(function (key) {
    if (csvColumns.indexOf(key) < 0) {
      return;
    }
    if (ROLE_SPECIFIC_COLUMNS.has(key)) {
      return;
    }
    if (!BASE_PATCH_COLUMNS.has(key)) {
      return;
    }
    if (key === "有效时长(秒)") {
      const normalizedDuration = formatDuration(patch[key]);
      if (normalizedDuration !== "") {
        row[key] = normalizedDuration;
      }
      return;
    }
    const value = patch[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      row[key] = String(value);
    }
  });
}

function applyPayloadToRows(payload, rowsByBatchId, csvColumns) {
  const patch = payload && typeof payload.csvPatch === "object" ? payload.csvPatch : {};
  const roleRecord = payload && typeof payload.roleRecord === "object" ? payload.roleRecord : {};
  const batchId = getBatchId(payload || {}, patch, roleRecord);
  if (!batchId) {
    throw new Error("payload 缺少 mergeKey.batchId / 分包ID。");
  }

  const row = Object.assign(createEmptyRow(csvColumns), rowsByBatchId[batchId] || {});
  applyBasePatch(row, patch, csvColumns);
  applyRoleRecord(row, roleRecord, patch, payload || {});
  rowsByBatchId[batchId] = row;

  return {
    batchId: batchId,
    row: row,
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
  BASE_PATCH_COLUMNS,
  ROLE_SPECIFIC_COLUMNS,
  applyBasePatch,
  applyPayloadToRows,
  applyRoleRecord,
  createEmptyRow,
  formatDuration,
  inferCompleted,
  mergeUploadPayloads,
  normalizeCompletedValue,
  normalizePayloads,
};
