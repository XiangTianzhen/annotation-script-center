"use strict";

const UNKNOWN_SUPPLIER_NAME = "未识别供应商";
const KNOWN_SUPPLIERS = ["希尔贝壳", "棋燊"];
const SENSITIVE_SUPPLIER_PATTERN =
  /(https?:\/\/|cookie|authorization|access[_-]?token|bearer|signature=|ossaccesskeyid=)/i;

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\t\r\n\f\v]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCsvValue(value) {
  return normalizeWhitespace(value);
}

function safeDecodeText(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  try {
    return decodeURIComponent(text);
  } catch (error) {
    return text;
  }
}

function normalizeTaskNameForSupplier(value) {
  return normalizeWhitespace(safeDecodeText(value));
}

function compactTaskNameForSupplier(value) {
  return normalizeTaskNameForSupplier(value).replace(
    /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\s]+/g,
    ""
  );
}

function normalizeSupplierName(value) {
  const text = normalizeWhitespace(value);
  return text || UNKNOWN_SUPPLIER_NAME;
}

function isUnknownSupplierName(value) {
  const normalized = normalizeSupplierName(value);
  if (!normalized) {
    return true;
  }
  const compact = normalized.replace(/\s+/g, "").toLowerCase();
  return (
    normalized === UNKNOWN_SUPPLIER_NAME ||
    compact === "unknown-supplier" ||
    compact === "unknownsupplier"
  );
}

function getSupplierKey(value) {
  const normalized = normalizeSupplierName(value);
  if (isUnknownSupplierName(normalized)) {
    return "unknown-supplier";
  }
  return normalized.replace(/\s+/g, "").toLowerCase();
}

function sanitizeSupplierPathSegment(value) {
  const normalized = normalizeSupplierName(value);
  if (isUnknownSupplierName(normalized)) {
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
  const text = normalizeTaskNameForSupplier(taskName);
  if (!text) {
    return { name: UNKNOWN_SUPPLIER_NAME, source: "fallback" };
  }
  const compactText = compactTaskNameForSupplier(text);

  for (let index = 0; index < KNOWN_SUPPLIERS.length; index += 1) {
    const known = KNOWN_SUPPLIERS[index];
    if (text.indexOf(known) >= 0 || compactText.indexOf(known) >= 0) {
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
    const candidate = cleanCsvValue(payloadCandidates[index]);
    if (!candidate) {
      continue;
    }
    const name = normalizeSupplierName(candidate);
    if (isUnknownSupplierName(name)) {
      continue;
    }
    const safeName = sanitizeSupplierPathSegment(name);
    const finalName = safeName === UNKNOWN_SUPPLIER_NAME ? UNKNOWN_SUPPLIER_NAME : name;
    return {
      key: getSupplierKey(finalName),
      name: finalName,
      safeName: safeName,
      source: "payload",
    };
  }

  const csvSupplier = cleanCsvValue(csvPatch["供应商"] || "");
  if (csvSupplier) {
    const name = normalizeSupplierName(csvSupplier);
    if (!isUnknownSupplierName(name)) {
      const safeName = sanitizeSupplierPathSegment(name);
      const finalName = safeName === UNKNOWN_SUPPLIER_NAME ? UNKNOWN_SUPPLIER_NAME : name;
      return {
        key: getSupplierKey(finalName),
        name: finalName,
        safeName: safeName,
        source: "csv-patch",
      };
    }
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
  cleanCsvValue,
  getSupplierKey,
  inferSupplierFromTaskName,
  compactTaskNameForSupplier,
  isUnknownSupplierName,
  normalizeTaskNameForSupplier,
  normalizeSupplierName,
  resolveSupplierInfo,
  sanitizeSupplierPathSegment,
};
