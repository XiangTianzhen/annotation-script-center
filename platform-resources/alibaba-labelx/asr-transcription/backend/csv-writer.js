"use strict";

const fs = require("fs");
const { UNKNOWN_SUPPLIER_NAME } = require("../../supplier-utils");

function escapeCsvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function collectDistinctSuppliers(rows) {
  const supplierSet = new Set();
  rows.forEach(function (row) {
    const supplierName = String(row?.["供应商"] || "").trim();
    if (!supplierName) {
      return;
    }
    supplierSet.add(supplierName);
  });
  return supplierSet;
}

function getOutputCsvColumns(baseColumns, rows) {
  const columns = Array.isArray(baseColumns) ? baseColumns.slice() : [];
  const columnsWithoutSupplier = columns.filter(function (column) {
    return column !== "供应商";
  });
  const suppliers = collectDistinctSuppliers(rows);
  if (suppliers.size > 1) {
    return columnsWithoutSupplier.concat("供应商");
  }
  if (suppliers.size === 1) {
    const onlySupplier = Array.from(suppliers)[0];
    if (onlySupplier && onlySupplier !== UNKNOWN_SUPPLIER_NAME) {
      return columnsWithoutSupplier;
    }
  }
  return columnsWithoutSupplier;
}

function writeMergedCsv(filePath, rowsByBatchId, csvColumns) {
  const rows = Object.keys(rowsByBatchId)
    .sort()
    .map(function (batchId) {
      return rowsByBatchId[batchId] || {};
    });
  const outputColumns = getOutputCsvColumns(csvColumns, rows);

  const lines = [outputColumns.map(escapeCsvCell).join(",")].concat(
    rows.map(function (row) {
      return outputColumns
        .map(function (column) {
          return escapeCsvCell(row[column]);
        })
        .join(",");
    })
  );

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

module.exports = {
  collectDistinctSuppliers,
  escapeCsvCell,
  getOutputCsvColumns,
  writeMergedCsv,
};
