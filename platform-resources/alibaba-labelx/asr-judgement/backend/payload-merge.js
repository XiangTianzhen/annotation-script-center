"use strict";

const { CSV_COLUMNS } = require("./csv-columns");
const {
  cleanCsvValue,
  cleanHealthyCsvValue,
  isCorruptedText,
  preferHealthyText,
  resolveSupplierInfo,
} = require("../../supplier-utils");

const BASE_PATCH_COLUMNS = new Set([
  "任务名称",
  "供应商",
  "任务ID",
  "分包ID",
  "题数",
  "有效时长(秒)",
]);
const ROLE_SPECIFIC_COLUMNS = new Set([
  "标注员1子任务ID",
  "标注员2子任务ID",
  "标注员3子任务ID",
  "审核子任务ID",
  "标注员1",
  "标注员2",
  "标注员3",
  "审核员",
  "标注员1领取时间",
  "标注员1提交时间",
  "标注员2领取时间",
  "标注员2提交时间",
  "标注员3领取时间",
  "标注员3提交时间",
  "审核领取时间",
  "审核提交时间",
  "标注员1是否完成",
  "标注员2是否完成",
  "标注员3是否完成",
  "审核是否完成",
]);
const QUALITY_CRITICAL_COLUMNS = new Set([
  "任务名称",
  "标注员1",
  "标注员2",
  "标注员3",
  "审核员",
  "供应商",
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
  const text = cleanCsvValue(value);
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

function findLabelSlot(row, subTaskId) {
  const slots = [1, 2, 3];
  const existing = slots.find(function (slot) {
    return row["标注员" + slot + "子任务ID"] === subTaskId;
  });
  if (existing) {
    return existing;
  }

  const emptySlot = slots.find(function (slot) {
    return !row["标注员" + slot + "子任务ID"];
  });
  if (!emptySlot) {
    throw new Error("同一供应商分包超过 3 个标注员子任务，已拒绝覆盖现有槽位。");
  }
  return emptySlot;
}

function applyRoleRecord(row, roleRecord, payload) {
  const role = String(roleRecord?.role || "").toLowerCase();
  const subTaskId = cleanCsvValue(roleRecord?.subTaskId || "");
  if (role !== "label" && role !== "audit") {
    throw new Error("payload roleRecord.role 必须为 label 或 audit。");
  }
  if (!subTaskId) {
    throw new Error("payload roleRecord.subTaskId 不能为空。");
  }

  if (role === "audit") {
    row["审核子任务ID"] = subTaskId;
    row["审核员"] = preferHealthyText(
      cleanCsvValue(roleRecord.userName || roleRecord.userId || ""),
      row["审核员"] || ""
    );
    row["审核领取时间"] = cleanCsvValue(roleRecord.receiveTime || "");
    row["审核提交时间"] = cleanCsvValue(roleRecord.submitTime || "");
    row["审核是否完成"] =
      normalizeCompletedValue(roleRecord.completed) ||
      (payload?.rawKeys?.status ? "已完成" : "未完成");
    return;
  }

  const slot = findLabelSlot(row, subTaskId);
  row["标注员" + slot + "子任务ID"] = subTaskId;
  row["标注员" + slot] = preferHealthyText(
    cleanCsvValue(roleRecord.userName || roleRecord.userId || ""),
    row["标注员" + slot] || ""
  );
  row["标注员" + slot + "领取时间"] = cleanCsvValue(roleRecord.receiveTime || "");
  row["标注员" + slot + "提交时间"] = cleanCsvValue(roleRecord.submitTime || "");
  row["标注员" + slot + "是否完成"] =
    normalizeCompletedValue(roleRecord.completed) ||
    (payload?.rawKeys?.status ? "已完成" : "未完成");
}

function getBatchId(payload, patch, roleRecord) {
  return cleanCsvValue(
    payload?.mergeKey?.batchId || roleRecord?.batchId || patch?.["分包ID"] || ""
  );
}

function resolveRowSupplier(payload, patch, existingRow) {
  const fallbackPatch = Object.assign({}, patch || {});
  if (!fallbackPatch["供应商"] && existingRow?.["供应商"]) {
    fallbackPatch["供应商"] = existingRow["供应商"];
  }
  return resolveSupplierInfo({
    payload: payload,
    supplier: payload?.supplier,
    vendor: payload?.vendor,
    csvPatch: fallbackPatch,
    taskName:
      fallbackPatch["任务名称"] ||
      payload?.rawKeys?.taskName ||
      payload?.taskName ||
      payload?.name ||
      "",
  });
}

function createMergeRowId(supplierKey, batchId) {
  return String(supplierKey || "unknown-supplier") + "::" + String(batchId || "");
}

function applyBasePatch(row, patch, csvColumns) {
  Object.keys(patch).forEach(function (key) {
    if (csvColumns.indexOf(key) < 0) {
      return;
    }
    if (ROLE_SPECIFIC_COLUMNS.has(key) || !BASE_PATCH_COLUMNS.has(key)) {
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
    const normalizedValue = cleanCsvValue(value);
    if (normalizedValue !== "") {
      if (QUALITY_CRITICAL_COLUMNS.has(key)) {
        row[key] = preferHealthyText(normalizedValue, row[key] || "");
        return;
      }
      row[key] = normalizedValue;
    }
  });
}

function applyPayloadToRows(payload, rowsByMergeRowId, csvColumns) {
  const patch = payload && typeof payload.csvPatch === "object" ? payload.csvPatch : {};
  const roleRecord = payload && typeof payload.roleRecord === "object" ? payload.roleRecord : {};
  const batchId = getBatchId(payload || {}, patch, roleRecord);
  if (!batchId) {
    throw new Error("payload 缺少 mergeKey.batchId / 分包ID。");
  }

  const supplierInfo = resolveRowSupplier(payload || {}, patch, null);
  const mergeRowId = createMergeRowId(supplierInfo.key, batchId);
  const existingRow = rowsByMergeRowId[mergeRowId] || {};
  const row = Object.assign(createEmptyRow(csvColumns), existingRow);
  const stableSupplierInfo = resolveRowSupplier(payload || {}, patch, row);

  applyBasePatch(row, patch, csvColumns);
  row["供应商"] = cleanHealthyCsvValue(
    preferHealthyText(stableSupplierInfo.name || "", row["供应商"] || "")
  );
  if (isCorruptedText(row["供应商"])) {
    row["供应商"] = "";
  }
  row["任务名称"] = cleanHealthyCsvValue(row["任务名称"] || "");
  row["分包ID"] = cleanCsvValue(batchId);
  applyRoleRecord(row, roleRecord, payload || {});

  rowsByMergeRowId[mergeRowId] = row;
  return {
    mergeRowId: mergeRowId,
    batchId: batchId,
    supplierName: row["供应商"],
  };
}

function mergeUploadPayload(payload, store) {
  const csvColumns = store.csvColumns || CSV_COLUMNS;
  const rowsByMergeRowId = store.loadRows();
  const result = applyPayloadToRows(payload, rowsByMergeRowId, csvColumns);
  store.saveRows(rowsByMergeRowId);
  store.writeCsv(rowsByMergeRowId);
  store.appendUploadEvent(payload);

  const paths = store.getPaths();
  return {
    supplier: result.supplierName,
    batchId: result.batchId,
    rowCount: Object.keys(rowsByMergeRowId).length,
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
  const rowsByMergeRowId = store.loadRows();
  const results = payloads.map(function (item) {
    const result = applyPayloadToRows(item, rowsByMergeRowId, csvColumns);
    store.appendUploadEvent(item);
    return result;
  });
  store.saveRows(rowsByMergeRowId);
  store.writeCsv(rowsByMergeRowId);

  const paths = store.getPaths();
  return {
    batchCount: results.length,
    results: results.map(function (item) {
      return {
        supplier: item.supplierName,
        batchId: item.batchId,
      };
    }),
    rowCount: Object.keys(rowsByMergeRowId).length,
    rowsPath: paths.rowsPath,
    eventsPath: paths.eventsPath,
  };
}

module.exports = {
  ROLE_SPECIFIC_COLUMNS,
  applyBasePatch,
  applyPayloadToRows,
  applyRoleRecord,
  createEmptyRow,
  createMergeRowId,
  findLabelSlot,
  formatDuration,
  mergeUploadPayload,
  mergeUploadPayloads,
  normalizeCompletedValue,
  normalizePayloads,
  resolveRowSupplier,
};
