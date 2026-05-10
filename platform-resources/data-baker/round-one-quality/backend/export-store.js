"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_LATEST_FILE_NAME = "latest.csv";
const DEFAULT_META_FILE_NAME = "latest.json";
const DEFAULT_RAW_FILE_NAME = "latest-raw.json";
const DEFAULT_HISTORY_DIR_NAME = "history";
const DEFAULT_EVENTS_FILE_NAME = "upload-events.jsonl";

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
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .filter(function (line) {
      return line.trim() !== "";
    });
  if (lines.length <= 1) {
    return 0;
  }
  return lines.length - 1;
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch (error) {
    return "{}";
  }
}

function createExportStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "export-data");
  const latestCsvPath = path.join(dataDir, DEFAULT_LATEST_FILE_NAME);
  const latestMetaPath = path.join(dataDir, DEFAULT_META_FILE_NAME);
  const latestRawPath = path.join(dataDir, DEFAULT_RAW_FILE_NAME);
  const historyDirPath = path.join(dataDir, DEFAULT_HISTORY_DIR_NAME);
  const eventsPath = path.join(dataDir, DEFAULT_EVENTS_FILE_NAME);
  const persistHistory = config.persistHistory === true;
  const persistEvents = config.persistEvents === true;

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true });
    if (persistHistory) {
      fs.mkdirSync(historyDirPath, { recursive: true });
    }
  }

  function writeLatest(csvText, rawRecords, meta) {
    ensureDataDir();
    fs.writeFileSync(latestCsvPath, String(csvText || ""), "utf8");
    fs.writeFileSync(latestRawPath, JSON.stringify(Array.isArray(rawRecords) ? rawRecords : [], null, 2), "utf8");
    fs.writeFileSync(latestMetaPath, JSON.stringify(meta || {}, null, 2), "utf8");
  }

  function writeHistory(csvText, rawRecords, fileName) {
    if (!persistHistory) {
      return {
        csvPath: "",
        rawPath: "",
      };
    }
    ensureDataDir();
    const safeFileName = ensureCsvExtension(fileName, "history-export.csv");
    const historyCsvPath = path.join(historyDirPath, safeFileName);
    const rawFileName = safeFileName.replace(/\.csv$/i, ".raw.json");
    const historyRawPath = path.join(historyDirPath, rawFileName);
    fs.writeFileSync(historyCsvPath, String(csvText || ""), "utf8");
    fs.writeFileSync(historyRawPath, JSON.stringify(Array.isArray(rawRecords) ? rawRecords : [], null, 2), "utf8");
    return {
      csvPath: historyCsvPath,
      rawPath: historyRawPath,
    };
  }

  function appendEvent(eventPayload) {
    if (!persistEvents) {
      return;
    }
    ensureDataDir();
    fs.appendFileSync(eventsPath, safeJsonStringify(eventPayload) + "\n", "utf8");
  }

  function saveUpload(payload) {
    const fileName = ensureCsvExtension(payload?.fileName, "data-baker-round-one-quality-export.csv");
    const csvText = String(payload?.csvText || "");
    const rowCountFromPayload = Number(payload?.rowCount);
    const rowCount = Number.isFinite(rowCountFromPayload) && rowCountFromPayload >= 0
      ? Math.floor(rowCountFromPayload)
      : readCsvRowCount(csvText);
    const uploadedAt = new Date().toISOString();
    const rawRecords = Array.isArray(payload?.rawRecords)
      ? payload.rawRecords
      : Array.isArray(payload?.rawJson)
        ? payload.rawJson
        : [];
    const meta = {
      schemaVersion: 1,
      source: String(payload?.source || ""),
      project: String(payload?.project || ""),
      fileName: fileName,
      rowCount: rowCount,
      taskId: String(payload?.taskId || ""),
      exportedAt: String(payload?.exportedAt || ""),
      uploadedAt: uploadedAt,
      route: payload?.route && typeof payload.route === "object" ? payload.route : {},
      summary: payload?.summary && typeof payload.summary === "object" ? payload.summary : {},
    };

    writeLatest(csvText, rawRecords, meta);
    const history = writeHistory(
      csvText,
      rawRecords,
      uploadedAt.replace(/[^\dTZ:-]/g, "") + "-" + fileName
    );
    appendEvent({
      uploadedAt: uploadedAt,
      fileName: fileName,
      rowCount: rowCount,
      taskId: meta.taskId,
      latestCsvPath: latestCsvPath,
      rawJsonPath: latestRawPath,
      historyPath: history.csvPath,
      historyRawJsonPath: history.rawPath,
    });

    return {
      fileName: fileName,
      rowCount: rowCount,
      csvPath: latestCsvPath,
      rawJsonPath: latestRawPath,
      latestMetaPath: latestMetaPath,
      historyPath: history.csvPath,
      historyRawJsonPath: history.rawPath,
      uploadedAt: uploadedAt,
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
  MAX_CSV_BYTES: 20 * 1024 * 1024,
  createExportStore,
  ensureCsvExtension,
  readCsvRowCount,
  sanitizeFileName,
};
