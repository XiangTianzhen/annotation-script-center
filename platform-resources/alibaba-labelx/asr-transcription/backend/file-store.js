"use strict";

const fs = require("fs");
const path = require("path");
const { CSV_COLUMNS } = require("./csv-columns");
const { writeMergedCsv } = require("./csv-writer");
const {
  UNKNOWN_SUPPLIER_NAME,
  resolveSupplierInfo,
  sanitizeSupplierPathSegment,
} = require("../../supplier-utils");

const SUPPLIERS_DIR_NAME = "suppliers";
const MERGED_CSV_FILE_NAME = "statistics-merged.csv";

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(function (line) {
      return line.trim() !== "";
    });
  if (lines.length <= 1) {
    return {};
  }

  const headers = parseCsvLine(lines[0]);
  const batchIdIndex = headers.indexOf("分包ID");
  if (batchIdIndex < 0) {
    return {};
  }

  const rowsByBatchId = {};
  lines.slice(1).forEach(function (line) {
    const cells = parseCsvLine(line);
    const batchId = String(cells[batchIdIndex] || "").trim();
    if (!batchId) {
      return;
    }
    const row = {};
    headers.forEach(function (header, index) {
      row[header] = cells[index] || "";
    });
    rowsByBatchId[batchId] = row;
  });
  return rowsByBatchId;
}

function createEmptyRow(csvColumns) {
  const row = {};
  (csvColumns || CSV_COLUMNS).forEach(function (column) {
    row[column] = "";
  });
  return row;
}

function createMergeRowId(supplierKey, batchId) {
  return String(supplierKey || "unknown-supplier") + "::" + String(batchId || "");
}

function resolveRowSupplier(row, fallbackSupplierName) {
  const fallbackName = String(fallbackSupplierName || "").trim();
  const patch = Object.assign({}, row || {});
  if (!patch["供应商"] && fallbackName && fallbackName !== UNKNOWN_SUPPLIER_NAME) {
    patch["供应商"] = fallbackName;
  }
  return resolveSupplierInfo({
    csvPatch: patch,
    taskName: patch["任务名称"] || "",
  });
}

function createStatisticsStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "..", "statistics-data");
  const suppliersDir = path.join(dataDir, SUPPLIERS_DIR_NAME);
  const rowsPath = path.join(dataDir, "statistics-rows.json");
  const eventsPath = path.join(dataDir, "statistics-upload-events.jsonl");
  const legacyCsvPath = path.join(dataDir, MERGED_CSV_FILE_NAME);
  const csvColumns = Array.isArray(config.csvColumns) ? config.csvColumns : CSV_COLUMNS;
  const persistRowsJson = config.persistRowsJson === true;
  const persistUploadEvents = config.persistUploadEvents === true;

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(suppliersDir, { recursive: true });
  }

  function getSupplierCsvPathBySafeName(safeSupplierName) {
    const safeName = sanitizeSupplierPathSegment(safeSupplierName || UNKNOWN_SUPPLIER_NAME);
    return path.join(suppliersDir, safeName, MERGED_CSV_FILE_NAME);
  }

  function listSupplierDirs() {
    if (!fs.existsSync(suppliersDir)) {
      return [];
    }
    return fs
      .readdirSync(suppliersDir, { withFileTypes: true })
      .filter(function (entry) {
        return entry.isDirectory();
      })
      .map(function (entry) {
        return entry.name;
      });
  }

  function readRowsFromSupplierCsv(csvPath, fallbackSupplierName) {
    const rows = readCsvRows(csvPath);
    const rowsByMergeRowId = {};
    Object.keys(rows).forEach(function (batchId) {
      const row = Object.assign(createEmptyRow(csvColumns), rows[batchId] || {});
      const supplierInfo = resolveRowSupplier(row, fallbackSupplierName);
      row["供应商"] = String(supplierInfo.name || UNKNOWN_SUPPLIER_NAME);
      row["分包ID"] = String(batchId || row["分包ID"] || "");
      const mergeRowId = createMergeRowId(supplierInfo.key, row["分包ID"]);
      rowsByMergeRowId[mergeRowId] = row;
    });
    return rowsByMergeRowId;
  }

  function loadRows() {
    ensureDataDir();
    const rowsByMergeRowId = {};

    listSupplierDirs().forEach(function (safeSupplierName) {
      const supplierCsvPath = getSupplierCsvPathBySafeName(safeSupplierName);
      const rows = readRowsFromSupplierCsv(supplierCsvPath, safeSupplierName);
      Object.keys(rows).forEach(function (mergeRowId) {
        rowsByMergeRowId[mergeRowId] = rows[mergeRowId];
      });
    });

    if (fs.existsSync(legacyCsvPath)) {
      const legacyRows = readRowsFromSupplierCsv(legacyCsvPath, UNKNOWN_SUPPLIER_NAME);
      Object.keys(legacyRows).forEach(function (mergeRowId) {
        if (!rowsByMergeRowId[mergeRowId]) {
          rowsByMergeRowId[mergeRowId] = legacyRows[mergeRowId];
        }
      });
    }

    if (Object.keys(rowsByMergeRowId).length > 0) {
      return rowsByMergeRowId;
    }
    return readJsonFile(rowsPath, {});
  }

  function saveRows(rowsByMergeRowId) {
    if (!persistRowsJson) {
      return;
    }
    ensureDataDir();
    writeJsonFile(rowsPath, rowsByMergeRowId || {});
  }

  function writeCsv(rowsByMergeRowId) {
    ensureDataDir();
    const grouped = {};

    Object.keys(rowsByMergeRowId || {}).forEach(function (mergeRowId) {
      const row = Object.assign(createEmptyRow(csvColumns), rowsByMergeRowId[mergeRowId] || {});
      const batchId = String(row["分包ID"] || "").trim();
      if (!batchId) {
        return;
      }
      const supplierInfo = resolveRowSupplier(row, UNKNOWN_SUPPLIER_NAME);
      const safeSupplierName = sanitizeSupplierPathSegment(supplierInfo.safeName || supplierInfo.name);
      if (!grouped[safeSupplierName]) {
        grouped[safeSupplierName] = {
          supplierName: supplierInfo.name || UNKNOWN_SUPPLIER_NAME,
          rowsByBatchId: {},
        };
      }
      row["供应商"] = grouped[safeSupplierName].supplierName;
      grouped[safeSupplierName].rowsByBatchId[batchId] = row;
    });

    Object.keys(grouped).forEach(function (safeSupplierName) {
      const supplierCsvPath = getSupplierCsvPathBySafeName(safeSupplierName);
      fs.mkdirSync(path.dirname(supplierCsvPath), { recursive: true });
      writeMergedCsv(supplierCsvPath, grouped[safeSupplierName].rowsByBatchId, csvColumns);
    });
  }

  function appendUploadEvent(payload) {
    if (!persistUploadEvents) {
      return;
    }
    ensureDataDir();
    fs.appendFileSync(eventsPath, JSON.stringify(payload) + "\n", "utf8");
  }

  function listSuppliers() {
    ensureDataDir();
    const suppliers = listSupplierDirs()
      .map(function (safeSupplierName) {
        const csvPath = getSupplierCsvPathBySafeName(safeSupplierName);
        const rowsByBatchId = readCsvRows(csvPath);
        const firstBatchId = Object.keys(rowsByBatchId)[0];
        const firstRow = firstBatchId ? rowsByBatchId[firstBatchId] : {};
        const supplierInfo = resolveRowSupplier(firstRow, safeSupplierName);
        return {
          supplier: supplierInfo.name || UNKNOWN_SUPPLIER_NAME,
          safeSupplier: safeSupplierName,
          rowCount: Object.keys(rowsByBatchId).length,
          csvPath: csvPath,
        };
      });

    if (suppliers.length === 0 && fs.existsSync(legacyCsvPath)) {
      const legacyRowsByBatchId = readCsvRows(legacyCsvPath);
      const legacyGrouped = {};
      Object.keys(legacyRowsByBatchId).forEach(function (batchId) {
        const row = legacyRowsByBatchId[batchId] || {};
        const supplierInfo = resolveRowSupplier(row, UNKNOWN_SUPPLIER_NAME);
        const safeSupplierName = sanitizeSupplierPathSegment(
          supplierInfo.safeName || supplierInfo.name
        );
        if (!legacyGrouped[safeSupplierName]) {
          legacyGrouped[safeSupplierName] = {
            supplier: supplierInfo.name || UNKNOWN_SUPPLIER_NAME,
            safeSupplier: safeSupplierName,
            rowCount: 0,
            csvPath: legacyCsvPath,
          };
        }
        legacyGrouped[safeSupplierName].rowCount += 1;
      });
      return Object.keys(legacyGrouped)
        .map(function (safeSupplierName) {
          return legacyGrouped[safeSupplierName];
        })
        .sort(function (left, right) {
          return String(left.supplier || "").localeCompare(
            String(right.supplier || ""),
            "zh-Hans-CN"
          );
        });
    }

    return suppliers.sort(function (left, right) {
      return String(left.supplier || "").localeCompare(String(right.supplier || ""), "zh-Hans-CN");
    });
  }

  function getPaths() {
    return {
      dataDir: dataDir,
      suppliersDir: suppliersDir,
      legacyCsvPath: legacyCsvPath,
      rowsPath: persistRowsJson ? rowsPath : "",
      eventsPath: persistUploadEvents ? eventsPath : "",
      csvPath: "",
    };
  }

  return {
    csvColumns: csvColumns,
    ensureDataDir: ensureDataDir,
    loadRows: loadRows,
    saveRows: saveRows,
    writeCsv: writeCsv,
    appendUploadEvent: appendUploadEvent,
    listSuppliers: listSuppliers,
    getSupplierCsvPathBySafeName: getSupplierCsvPathBySafeName,
    getPaths: getPaths,
  };
}

module.exports = {
  MERGED_CSV_FILE_NAME,
  SUPPLIERS_DIR_NAME,
  createStatisticsStore,
  parseCsvLine,
  readCsvRows,
  readJsonFile,
  writeJsonFile,
};
