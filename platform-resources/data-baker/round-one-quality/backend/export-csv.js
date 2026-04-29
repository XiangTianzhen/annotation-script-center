"use strict";

const fs = require("fs");
const path = require("path");

const SENSITIVE_KEY_PATTERN = /(token|cookie|authorization|signature|ossaccesskeyid)/i;

function toSafeFilePart(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key || ""));
}

function redactString(value) {
  return String(value || "")
    .replace(/(access_token=)([^&]+)/gi, "$1[redacted]")
    .replace(/(refresh_token=)([^&]+)/gi, "$1[redacted]")
    .replace(/(token=)([^&]+)/gi, "$1[redacted]")
    .replace(/(signature=)([^&]+)/gi, "$1[redacted]")
    .replace(/(ossaccesskeyid=)([^&]+)/gi, "$1[redacted]");
}

function sanitizeValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map(function (item) {
        return sanitizeValue(item);
      })
    );
  }
  if (value && typeof value === "object") {
    const result = {};
    Object.keys(value).forEach(function (key) {
      if (isSensitiveKey(key)) {
        return;
      }
      result[key] = sanitizeValue(value[key]);
    });
    return JSON.stringify(result);
  }
  return String(value);
}

function escapeCsvCell(value) {
  const text = String(value === undefined || value === null ? "" : value);
  const escaped = text.replace(/"/g, "\"\"");
  return '"' + escaped + '"';
}

const CSV_COLUMNS = [
  { header: "采集ID", keys: ["collectId"] },
  { header: "任务ID", keys: ["taskId"] },
  { header: "采集名称", keys: ["collectName"] },
  { header: "手机号", keys: ["mobile"] },
  { header: "状态值", keys: ["status"] },
  { header: "状态名称", keys: ["statusName"] },
  { header: "文本数量", keys: ["textNumber"] },
  { header: "提交人", keys: ["submitName"] },
  { header: "质检人", keys: ["checkName"] },
  { header: "验收人", keys: ["acceptCheckName"] },
  { header: "创建时间", keys: ["createTime", "createdTime"] },
  { header: "提交时间", keys: ["submitTime"] },
  { header: "更新时间", keys: ["updateTime", "updatedTime"] },
  { header: "记录ID", keys: ["id"] },
  { header: "文本内容", keys: ["audioText", "text"] },
  { header: "原始JSON", keys: ["__rawJson"] },
];

function pickValue(row, keys) {
  const source = row && typeof row === "object" && !Array.isArray(row) ? row : {};
  const list = Array.isArray(keys) ? keys : [];
  for (let index = 0; index < list.length; index += 1) {
    const key = list[index];
    if (key === "__rawJson") {
      return sanitizeValue(source);
    }
    const value = source[key];
    if (value !== undefined && value !== null && String(value) !== "") {
      return sanitizeValue(value);
    }
  }
  return "";
}

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(function (row) {
    return CSV_COLUMNS.map(function (column) {
      return pickValue(row, column.keys);
    });
  });
}

function ensureExportDir(baseDir) {
  const exportDir = path.join(String(baseDir || __dirname), "exports");
  fs.mkdirSync(exportDir, {
    recursive: true,
  });
  return exportDir;
}

function formatDateForName(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return String(yyyy) + mm + dd + "-" + hh + mi + ss;
}

function buildFileName(taskId, label, now) {
  const safeTaskId = toSafeFilePart(taskId || "task");
  const safeLabel = toSafeFilePart(label || "");
  const stamp = formatDateForName(now);
  if (safeLabel) {
    return "task-" + safeTaskId + "-" + safeLabel + "-" + stamp + ".csv";
  }
  return "task-" + safeTaskId + "-" + stamp + ".csv";
}

function writeExportCsv(taskId, rows, options) {
  const startedAt = new Date();
  const baseDir = options?.baseDir || __dirname;
  const exportDir = ensureExportDir(baseDir);
  const normalizedRows = normalizeRows(rows);
  const fileName = buildFileName(taskId, options?.fileLabel || "", startedAt);
  const filePath = path.join(exportDir, fileName);

  const headerLine = CSV_COLUMNS.map(function (column) {
    return escapeCsvCell(column.header);
  }).join(",");
  const rowLines = normalizedRows.map(function (row) {
    return row.map(escapeCsvCell).join(",");
  });
  const content = [headerLine].concat(rowLines).join("\r\n");

  fs.writeFileSync(filePath, "\uFEFF" + content, "utf8");
  const stat = fs.statSync(filePath);

  return {
    fileName,
    filePath,
    exportDir,
    rowCount: normalizedRows.length,
    columnCount: CSV_COLUMNS.length,
    fileSize: stat.size,
    createdAt: startedAt.toISOString(),
  };
}

module.exports = {
  CSV_COLUMNS,
  sanitizeValue,
  writeExportCsv,
};
