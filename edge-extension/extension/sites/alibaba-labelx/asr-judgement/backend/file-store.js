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

function createStatisticsStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "..", "statistics-data");
  const rowsPath = path.join(dataDir, "statistics-rows.json");
  const eventsPath = path.join(dataDir, "statistics-upload-events.jsonl");
  const csvPath = path.join(dataDir, "statistics-merged.csv");
  const csvColumns = Array.isArray(config.csvColumns) ? config.csvColumns : CSV_COLUMNS;

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  function loadRows() {
    ensureDataDir();
    return readJsonFile(rowsPath, {});
  }

  function saveRows(rowsByBatchId) {
    ensureDataDir();
    writeJsonFile(rowsPath, rowsByBatchId || {});
  }

  function writeCsv(rowsByBatchId) {
    ensureDataDir();
    writeMergedCsv(csvPath, rowsByBatchId || {}, csvColumns);
  }

  function appendUploadEvent(payload) {
    ensureDataDir();
    fs.appendFileSync(eventsPath, JSON.stringify(payload) + "\n", "utf8");
  }

  function getPaths() {
    return {
      dataDir,
      rowsPath,
      eventsPath,
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
  readJsonFile,
  writeJsonFile,
};
