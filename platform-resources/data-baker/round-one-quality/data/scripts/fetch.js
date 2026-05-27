"use strict";

const fs = require("fs");
const path = require("path");
const { resolveDataBakerExportPaths } = require("../adapter");

function readLatestExportSnapshot(options) {
  const paths = resolveDataBakerExportPaths(options && typeof options === "object" ? options : {});
  return {
    paths,
    exists: {
      latestCsv: fs.existsSync(paths.latestCsvPath),
      latestMetaJson: fs.existsSync(paths.latestMetaPath),
      latestRawJson: fs.existsSync(paths.latestRawPath),
      historyDir: Boolean(paths.historyDirPath) && fs.existsSync(paths.historyDirPath),
    },
  };
}

function listHistoryCsvFiles(options) {
  const snapshot = readLatestExportSnapshot(options && typeof options === "object" ? options : {});
  const historyDir = snapshot.paths.historyDirPath;
  if (!historyDir || !fs.existsSync(historyDir)) {
    return [];
  }
  return fs
    .readdirSync(historyDir)
    .map(function (name) {
      const filePath = path.join(historyDir, name);
      const stat = fs.statSync(filePath);
      return {
        name: name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .filter(function (entry) {
      return /\.csv$/i.test(entry.name);
    })
    .sort(function (a, b) {
      return String(b.modifiedAt).localeCompare(String(a.modifiedAt));
    });
}

module.exports = {
  listHistoryCsvFiles,
  readLatestExportSnapshot,
};
