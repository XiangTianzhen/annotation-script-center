"use strict";

const UNKNOWN_SUPPLIER_NAME = "未识别供应商";
const KNOWN_SUPPLIERS = ["棋燊", "希尔贝壳"];
const SENSITIVE_SUPPLIER_PATTERN =
  /(https?:\/\/|cookie|authorization|access[_-]?token|bearer|signature=|ossaccesskeyid=)/i;

function normalizeSupplierName(value) {
  const text = String(value || "").replace(/[\r\n\t]+/g, " ").trim();
  return text || UNKNOWN_SUPPLIER_NAME;
}

function getSupplierKey(value) {
  const normalized = normalizeSupplierName(value);
  if (!normalized || normalized === UNKNOWN_SUPPLIER_NAME) {
    return "unknown-supplier";
  }
  return normalized.replace(/\s+/g, "").toLowerCase();
}

function sanitizeSupplierPathSegment(value) {
  const normalized = normalizeSupplierName(value);
  if (!normalized || normalized === UNKNOWN_SUPPLIER_NAME) {
    return UNKNOWN_SUPPLIER_NAME;
  }
  if (SENSITIVE_SUPPLIER_PATTERN.test(normalized)) {
    return UNKNOWN_SUPPLIER_NAME;
  }
  const safe = normalized
    .replace(/[\/\\:\*\?"<>\|]/g, "_")
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .trim();
  return safe || UNKNOWN_SUPPLIER_NAME;
}

function inferSupplierFromTaskName(taskName) {
  const text = String(taskName || "").trim();
  if (!text) {
    return { name: UNKNOWN_SUPPLIER_NAME, source: "fallback" };
  }

  for (let index = 0; index < KNOWN_SUPPLIERS.length; index += 1) {
    const known = KNOWN_SUPPLIERS[index];
    if (text.indexOf(known) >= 0) {
      return { name: known, source: "task-name-rule" };
    }
  }

  const separatorMatch = text.match(/^(.+?)[\-－—]/);
  if (separatorMatch && separatorMatch[1] && separatorMatch[1].trim()) {
    return { name: separatorMatch[1].trim(), source: "task-name-prefix" };
  }

  const plainAsrIndex = text.indexOf("中文普通话");
  if (plainAsrIndex > 0) {
    const prefix = text.slice(0, plainAsrIndex).trim();
    if (prefix) {
      return { name: prefix, source: "task-name-prefix" };
    }
  }

  return { name: UNKNOWN_SUPPLIER_NAME, source: "fallback" };
}

function extractSupplierValue(value) {
  if (value && typeof value === "object") {
    return value.name || value.label || value.value || "";
  }
  return value || "";
}

function resolveSupplierInfo(input) {
  const options = input && typeof input === "object" ? input : {};
  const payload = options.payload && typeof options.payload === "object" ? options.payload : {};
  const csvPatch = options.csvPatch && typeof options.csvPatch === "object" ? options.csvPatch : {};

  const payloadCandidates = [
    extractSupplierValue(payload.supplier),
    extractSupplierValue(payload.vendor),
    extractSupplierValue(options.supplier),
    extractSupplierValue(options.vendor),
  ];
  for (let index = 0; index < payloadCandidates.length; index += 1) {
    const candidate = String(payloadCandidates[index] || "").trim();
    if (!candidate) {
      continue;
    }
    const name = normalizeSupplierName(candidate);
    const safeName = sanitizeSupplierPathSegment(name);
    const finalName = safeName === UNKNOWN_SUPPLIER_NAME ? UNKNOWN_SUPPLIER_NAME : name;
    return {
      key: getSupplierKey(finalName),
      name: finalName,
      safeName: safeName,
      source: "payload",
    };
  }

  const csvSupplier = String(csvPatch["供应商"] || "").trim();
  if (csvSupplier) {
    const name = normalizeSupplierName(csvSupplier);
    const safeName = sanitizeSupplierPathSegment(name);
    const finalName = safeName === UNKNOWN_SUPPLIER_NAME ? UNKNOWN_SUPPLIER_NAME : name;
    return {
      key: getSupplierKey(finalName),
      name: finalName,
      safeName: safeName,
      source: "csv-patch",
    };
  }

  const inferred = inferSupplierFromTaskName(
    options.taskName || options.name || csvPatch["任务名称"] || ""
  );
  const inferredName = normalizeSupplierName(inferred.name);
  const inferredSafe = sanitizeSupplierPathSegment(inferredName);
  const finalName = inferredSafe === UNKNOWN_SUPPLIER_NAME ? UNKNOWN_SUPPLIER_NAME : inferredName;
  return {
    key: getSupplierKey(finalName),
    name: finalName,
    safeName: inferredSafe,
    source: inferred.source || "fallback",
  };
}

module.exports = {
  KNOWN_SUPPLIERS,
  UNKNOWN_SUPPLIER_NAME,
  getSupplierKey,
  inferSupplierFromTaskName,
  normalizeSupplierName,
  resolveSupplierInfo,
  sanitizeSupplierPathSegment,
};
