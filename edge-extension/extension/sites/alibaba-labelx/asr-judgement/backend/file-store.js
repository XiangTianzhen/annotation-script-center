"use strict";

const fs = require("fs");
const path = require("path");
const { CSV_COLUMNS } = require("./csv-columns");
const { writeMergedCsv } = require("./csv-writer");

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

function createStatisticsStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "..", "statistics-data");
  const rowsPath = path.join(dataDir, "statistics-rows.json");
  const eventsPath = path.join(dataDir, "statistics-upload-events.jsonl");
  const csvPath = path.join(dataDir, "statistics-merged.csv");
  const csvColumns = Array.isArray(config.csvColumns) ? config.csvColumns : CSV_COLUMNS;
  const persistRowsJson = config.persistRowsJson === true;
  const persistUploadEvents = config.persistUploadEvents === true;

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  function loadRows() {
    ensureDataDir();
    const rowsFromCsv = readCsvRows(csvPath);
    if (Object.keys(rowsFromCsv).length > 0 || fs.existsSync(csvPath)) {
      return rowsFromCsv;
    }
    return readJsonFile(rowsPath, {});
  }

  function saveRows(rowsByBatchId) {
    if (!persistRowsJson) {
      return;
    }
    ensureDataDir();
    writeJsonFile(rowsPath, rowsByBatchId || {});
  }

  function writeCsv(rowsByBatchId) {
    ensureDataDir();
    writeMergedCsv(csvPath, rowsByBatchId || {}, csvColumns);
  }

  function appendUploadEvent(payload) {
    if (!persistUploadEvents) {
      return;
    }
    ensureDataDir();
    fs.appendFileSync(eventsPath, JSON.stringify(payload) + "\n", "utf8");
  }

  function getPaths() {
    return {
      dataDir,
      rowsPath: persistRowsJson ? rowsPath : "",
      eventsPath: persistUploadEvents ? eventsPath : "",
      csvPath,
    };
  }

  return {
    csvColumns,
    ensureDataDir,
    loadRows,
    saveRows,
    writeCsv,
    appendUploadEvent,
    getPaths,
  };
}

module.exports = {
  createStatisticsStore,
  parseCsvLine,
  readCsvRows,
  readJsonFile,
  writeJsonFile,
};
