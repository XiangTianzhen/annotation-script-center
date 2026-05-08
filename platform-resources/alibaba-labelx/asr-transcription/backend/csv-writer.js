"use strict";

const fs = require("fs");

function escapeCsvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function writeMergedCsv(filePath, rowsByBatchId, csvColumns) {
  const rows = Object.keys(rowsByBatchId)
    .sort()
    .map(function (batchId) {
      return rowsByBatchId[batchId] || {};
    });

  const lines = [csvColumns.map(escapeCsvCell).join(",")].concat(
    rows.map(function (row) {
      return csvColumns
        .map(function (column) {
          return escapeCsvCell(row[column]);
        })
        .join(",");
    })
  );

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

module.exports = {
  escapeCsvCell,
  writeMergedCsv,
};
