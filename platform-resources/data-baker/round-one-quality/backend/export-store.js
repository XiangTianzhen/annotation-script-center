"use strict";

const fs = require("fs");
const path = require("path");
const {
  EXPORT_ROW_KEY_FIELD_GROUPS,
  LEGACY_HEADER_ALIAS,
  TASK_ID_FIELD_GROUP,
} = require("../data/field-mappings");
const {
  appendUploadEventRecord,
  createUploadEventPayload,
  createUploadMeta,
  ensureExportRuntimeDirs,
  writeHistoryExportArtifacts,
  writeLatestExportArtifacts,
} = require("../data/scripts/persist");

const DEFAULT_LATEST_FILE_NAME = "latest.csv";
const DEFAULT_META_FILE_NAME = "latest.json";
const DEFAULT_RAW_FILE_NAME = "latest-raw.json";
const DEFAULT_HISTORY_DIR_NAME = "history";
const DEFAULT_EVENTS_FILE_NAME = "upload-events.jsonl";
const UTF8_BOM = "\uFEFF";

function sanitizeFileName(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  const cleaned = text
    .replace(/[\\\/]+/g, "-")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned;
}

function ensureCsvExtension(fileName, fallback) {
  const text = sanitizeFileName(fileName || "");
  const base = text || sanitizeFileName(fallback || "") || "data-baker-round-one-quality-export.csv";
  if (/\.csv$/i.test(base)) {
    return base;
  }
  return base + ".csv";
}

function readCsvRowCount(csvText) {
  const parsed = parseCsvText(csvText);
  return parsed.rows.length;
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch (error) {
    return "{}";
  }
}

function stripBom(text) {
  const value = String(text || "");
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function normalizeCsvHeaderName(header) {
  const value = stripBom(header).trim();
  return LEGACY_HEADER_ALIAS[value] || value;
}

function parseCsvText(csvText) {
  const text = stripBom(csvText);
  if (!text.trim()) {
    throw new Error("CSV 为空。");
  }
  const rows = [];
  let field = "";
  let record = [];
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      record.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  record.push(field);
  rows.push(record);

  const nonEmptyRows = rows.filter(function (row) {
    return row.some(function (cell) {
      return String(cell || "").trim() !== "";
    });
  });
  if (nonEmptyRows.length === 0) {
    throw new Error("CSV 无有效内容。");
  }
  const rawHeaders = nonEmptyRows[0].map(normalizeCsvHeaderName).filter(Boolean);
  if (rawHeaders.length === 0) {
    throw new Error("CSV 表头缺失或无法解析。");
  }
  const headers = [];
  const headerSet = new Set();
  for (let idx = 0; idx < rawHeaders.length; idx += 1) {
    const name = rawHeaders[idx];
    if (!name || headerSet.has(name)) {
      continue;
    }
    headers.push(name);
    headerSet.add(name);
  }
  if (headers.length === 0) {
    throw new Error("CSV 表头缺失或无法解析。");
  }
  const dataRows = [];
  for (let rowIndex = 1; rowIndex < nonEmptyRows.length; rowIndex += 1) {
    const sourceRow = nonEmptyRows[rowIndex];
    const rowObj = {};
    let hasValue = false;
    for (let col = 0; col < rawHeaders.length; col += 1) {
      const header = rawHeaders[col];
      if (!header) {
        continue;
      }
      const value = sourceRow[col] != null ? String(sourceRow[col]) : "";
      if (value.trim() !== "") {
        hasValue = true;
      }
      rowObj[header] = value;
    }
    if (hasValue) {
      dataRows.push(rowObj);
    }
  }
  return {
    headers,
    rows: dataRows,
  };
}

function toCsvCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function stringifyCsv(rows, headers) {
  const safeHeaders = (Array.isArray(headers) ? headers : []).filter(Boolean);
  if (safeHeaders.length === 0) {
    throw new Error("CSV 表头缺失或无法写出。");
  }
  const lines = [];
  lines.push(safeHeaders.map(toCsvCell).join(","));
  const list = Array.isArray(rows) ? rows : [];
  for (let i = 0; i < list.length; i += 1) {
    const row = list[i] || {};
    lines.push(
      safeHeaders
        .map(function (header) {
          return toCsvCell(row[header] == null ? "" : row[header]);
        })
        .join(",")
    );
  }
  return UTF8_BOM + lines.join("\n");
}

function readFirst(row, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = row && row[keys[i]] != null ? String(row[keys[i]]).trim() : "";
    if (value) {
      return value;
    }
  }
  return "";
}

function createCsvRowKey(row) {
  const textNumber = readFirst(row, EXPORT_ROW_KEY_FIELD_GROUPS.textNumber);
  if (textNumber) {
    return "textNumber:" + textNumber;
  }
  const fileName = readFirst(row, EXPORT_ROW_KEY_FIELD_GROUPS.fileName);
  const segmentNumber = readFirst(row, EXPORT_ROW_KEY_FIELD_GROUPS.segmentNumber);
  if (fileName && segmentNumber) {
    return "file+segment:" + fileName + "::" + segmentNumber;
  }
  if (fileName) {
    return "file:" + fileName;
  }
  const collector = readFirst(row, EXPORT_ROW_KEY_FIELD_GROUPS.collector);
  const mobile = readFirst(row, EXPORT_ROW_KEY_FIELD_GROUPS.mobile);
  if (collector && mobile && segmentNumber) {
    return "collector+mobile+segment:" + collector + "::" + mobile + "::" + segmentNumber;
  }
  return "fallback:" + safeJsonStringify(row);
}

function pickTaskIds(rows) {
  const set = new Set();
  const list = Array.isArray(rows) ? rows : [];
  for (let i = 0; i < list.length; i += 1) {
    const taskId = readFirst(list[i], TASK_ID_FIELD_GROUP);
    if (taskId) {
      set.add(taskId);
    }
  }
  return Array.from(set).sort();
}

function rowContentSignature(row, headers) {
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const obj = {};
  for (let i = 0; i < safeHeaders.length; i += 1) {
    const header = safeHeaders[i];
    obj[header] = row && row[header] != null ? String(row[header]) : "";
  }
  return safeJsonStringify(obj);
}

function mergeCsvRows(existingCsvText, incomingCsvText) {
  const existingParsed = existingCsvText && String(existingCsvText).trim() ? parseCsvText(existingCsvText) : { headers: [], rows: [] };
  const incomingParsed = parseCsvText(incomingCsvText);
  if (incomingParsed.rows.length === 0) {
    throw new Error("上传 CSV 无有效数据行。");
  }
  const headers = existingParsed.headers.slice();
  const headerSet = new Set(headers);
  if (headers.length === 0) {
    for (let i = 0; i < incomingParsed.headers.length; i += 1) {
      headers.push(incomingParsed.headers[i]);
      headerSet.add(incomingParsed.headers[i]);
    }
  } else {
    for (let i = 0; i < incomingParsed.headers.length; i += 1) {
      const header = incomingParsed.headers[i];
      if (!headerSet.has(header)) {
        headers.push(header);
        headerSet.add(header);
      }
    }
  }

  const map = new Map();
  const mergedRows = [];
  for (let i = 0; i < existingParsed.rows.length; i += 1) {
    const row = existingParsed.rows[i];
    const key = createCsvRowKey(row);
    const normalized = {};
    headers.forEach(function (header) {
      normalized[header] = row[header] != null ? String(row[header]) : "";
    });
    if (!map.has(key)) {
      map.set(key, mergedRows.length);
      mergedRows.push(normalized);
    } else {
      mergedRows[map.get(key)] = normalized;
    }
  }

  let addedRowCount = 0;
  let updatedRowCount = 0;
  let unchangedRowCount = 0;
  for (let i = 0; i < incomingParsed.rows.length; i += 1) {
    const row = incomingParsed.rows[i];
    const key = createCsvRowKey(row);
    const normalized = {};
    headers.forEach(function (header) {
      normalized[header] = row[header] != null ? String(row[header]) : "";
    });
    if (!map.has(key)) {
      map.set(key, mergedRows.length);
      mergedRows.push(normalized);
      addedRowCount += 1;
      continue;
    }
    const index = map.get(key);
    const before = rowContentSignature(mergedRows[index], headers);
    const after = rowContentSignature(normalized, headers);
    if (before === after) {
      unchangedRowCount += 1;
    } else {
      updatedRowCount += 1;
    }
    mergedRows[index] = normalized;
  }

  return {
    headers,
    mergedRows,
    existingRowCount: existingParsed.rows.length,
    incomingRowCount: incomingParsed.rows.length,
    rowCount: mergedRows.length,
    addedRowCount,
    updatedRowCount,
    unchangedRowCount,
    taskIds: pickTaskIds(mergedRows),
  };
}

function createRawRecordKey(record) {
  const textNumber = readFirst(record, EXPORT_ROW_KEY_FIELD_GROUPS.textNumber);
  if (textNumber) {
    return "textNumber:" + textNumber;
  }
  return "fallback:" + safeJsonStringify(record);
}

function mergeRawRecords(existingRecords, incomingRecords) {
  const base = Array.isArray(existingRecords) ? existingRecords : [];
  const incoming = Array.isArray(incomingRecords) ? incomingRecords : [];
  const map = new Map();
  const merged = [];
  for (let i = 0; i < base.length; i += 1) {
    const record = base[i];
    const key = createRawRecordKey(record);
    if (!map.has(key)) {
      map.set(key, merged.length);
      merged.push(record);
    } else {
      merged[map.get(key)] = record;
    }
  }
  for (let i = 0; i < incoming.length; i += 1) {
    const record = incoming[i];
    const key = createRawRecordKey(record);
    if (!map.has(key)) {
      map.set(key, merged.length);
      merged.push(record);
    } else {
      merged[map.get(key)] = record;
    }
  }
  return merged;
}

function resolveExportStorePaths(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "export-data");
  return {
    dataDir: dataDir,
    latestCsvPath: path.join(dataDir, DEFAULT_LATEST_FILE_NAME),
    latestMetaPath: path.join(dataDir, DEFAULT_META_FILE_NAME),
    latestRawPath: path.join(dataDir, DEFAULT_RAW_FILE_NAME),
    historyDirPath: path.join(dataDir, DEFAULT_HISTORY_DIR_NAME),
    eventsPath: path.join(dataDir, DEFAULT_EVENTS_FILE_NAME),
  };
}

function createExportStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const resolvedPaths = resolveExportStorePaths(config);
  const dataDir = resolvedPaths.dataDir;
  const latestCsvPath = resolvedPaths.latestCsvPath;
  const latestMetaPath = resolvedPaths.latestMetaPath;
  const latestRawPath = resolvedPaths.latestRawPath;
  const historyDirPath = resolvedPaths.historyDirPath;
  const eventsPath = resolvedPaths.eventsPath;
  const persistHistory = config.persistHistory === true;
  const persistEvents = config.persistEvents === true;

  function ensureDataDir() {
    ensureExportRuntimeDirs({
      dataDir: dataDir,
      historyDirPath: historyDirPath,
      includeHistory: persistHistory,
    });
  }

  function saveUpload(payload) {
    const fileName = ensureCsvExtension(payload?.fileName, "data-baker-round-one-quality-export.csv");
    const csvText = String(payload?.csvText || "");
    const uploadedAt = new Date().toISOString();
    const rawRecords = Array.isArray(payload?.rawRecords)
      ? payload.rawRecords
      : Array.isArray(payload?.rawJson)
        ? payload.rawJson
        : [];
    const warnings = [];
    let existingCsvText = "";
    if (fs.existsSync(latestCsvPath)) {
      existingCsvText = fs.readFileSync(latestCsvPath, "utf8");
    }
    let mergeResult;
    try {
      mergeResult = mergeCsvRows(existingCsvText, csvText);
    } catch (error) {
      if (existingCsvText && String(existingCsvText || "").trim()) {
        throw new Error("latest.csv 解析失败，已拒绝覆盖：" + (error && error.message ? error.message : String(error)));
      }
      throw error;
    }
    const mergedCsvText = stringifyCsv(mergeResult.mergedRows, mergeResult.headers);

    let existingRawRecords = [];
    if (fs.existsSync(latestRawPath)) {
      try {
        const rawText = fs.readFileSync(latestRawPath, "utf8");
        const parsedRaw = JSON.parse(rawText || "[]");
        existingRawRecords = Array.isArray(parsedRaw) ? parsedRaw : [];
      } catch (error) {
        warnings.push("latest-raw.json 解析失败，已忽略旧 rawRecords。");
      }
    }
    let mergedRawRecords = existingRawRecords;
    try {
      mergedRawRecords = mergeRawRecords(existingRawRecords, rawRecords);
    } catch (error) {
      warnings.push("rawRecords 合并失败，已保留旧 rawRecords。");
      mergedRawRecords = existingRawRecords;
    }

    const meta = createUploadMeta({
      payload: payload,
      fileName: fileName,
      uploadedAt: uploadedAt,
      mergeResult: mergeResult,
      warnings: warnings,
    });

    writeLatestExportArtifacts({
      latestCsvPath: latestCsvPath,
      latestRawPath: latestRawPath,
      latestMetaPath: latestMetaPath,
      csvText: mergedCsvText,
      rawRecords: mergedRawRecords,
      meta: meta,
    });
    const history = persistHistory
      ? writeHistoryExportArtifacts({
          historyDirPath: historyDirPath,
          fileName: uploadedAt.replace(/[^\dTZ:-]/g, "") + "-" + fileName,
          csvText: csvText,
          rawRecords: rawRecords,
        })
      : {
          csvPath: "",
          rawPath: "",
        };
    if (persistEvents) {
      appendUploadEventRecord({
        eventsPath: eventsPath,
        eventPayload: createUploadEventPayload({
          uploadedAt: uploadedAt,
          fileName: fileName,
          mergeResult: mergeResult,
          taskId: meta.taskId,
          latestCsvPath: latestCsvPath,
          latestRawPath: latestRawPath,
          historyPath: history.csvPath,
          historyRawJsonPath: history.rawPath,
        }),
      });
    }

    return {
      fileName: fileName,
      rowCount: mergeResult.rowCount,
      incomingRowCount: mergeResult.incomingRowCount,
      existingRowCount: mergeResult.existingRowCount,
      addedRowCount: mergeResult.addedRowCount,
      updatedRowCount: mergeResult.updatedRowCount,
      unchangedRowCount: mergeResult.unchangedRowCount,
      taskIds: mergeResult.taskIds,
      csvPath: latestCsvPath,
      rawJsonPath: latestRawPath,
      latestMetaPath: latestMetaPath,
      historyPath: history.csvPath,
      historyRawJsonPath: history.rawPath,
      uploadedAt: uploadedAt,
      warnings,
    };
  }

  function getPaths() {
    return {
      dataDir: dataDir,
      latestCsvPath: latestCsvPath,
      latestRawPath: latestRawPath,
      latestMetaPath: latestMetaPath,
      historyDirPath: persistHistory ? historyDirPath : "",
      eventsPath: persistEvents ? eventsPath : "",
    };
  }

  return {
    ensureDataDir,
    saveUpload,
    getPaths,
  };
}

module.exports = {
  DEFAULT_EVENTS_FILE_NAME,
  DEFAULT_HISTORY_DIR_NAME,
  DEFAULT_LATEST_FILE_NAME,
  DEFAULT_META_FILE_NAME,
  DEFAULT_RAW_FILE_NAME,
  MAX_CSV_BYTES: 20 * 1024 * 1024,
  createCsvRowKey,
  createExportStore,
  ensureCsvExtension,
  mergeCsvRows,
  normalizeCsvHeaderName,
  parseCsvText,
  readCsvRowCount,
  resolveExportStorePaths,
  sanitizeFileName,
  stringifyCsv,
};
