"use strict";

const fs = require("fs");
const path = require("path");

const HAKKA_XLSX_PATH = path.join(__dirname, "..", "lexicon", "客家话-正字表.xlsx");
const HAKKA_CSV_PATH = path.join(__dirname, "..", "lexicon", "hakka-lexicon.csv");
const DEFAULT_LIMIT = 30;

let cachedState = null;
let warnedMissing = false;
let warnedError = false;

function normalizeText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function parsePriority(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 9999;
}

function splitTerms(value) {
  const text = normalizeText(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[、，,；;\/\s]+/)
    .map(normalizeText)
    .filter(Boolean);
}

function parseCsvRecords(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some(function (value) { return normalizeText(value); })) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some(function (value) { return normalizeText(value); })) {
    rows.push(row);
  }
  return rows;
}

function parseLexiconCsv(text) {
  const rows = parseCsvRecords(text);
  if (!rows.length) {
    return [];
  }
  const headers = rows[0].map(normalizeHeader);
  return rows
    .slice(1)
    .map(function (cells) {
      const row = {};
      headers.forEach(function (header, index) {
        if (header) {
          row[header] = normalizeText(cells[index]);
        }
      });
      const unifiedText = row["语料统一用字"] || row["统一用字"] || "";
      const mandarinText = row["普通话"] || row["对应华语"] || "";
      if (!unifiedText && !mandarinText) {
        return null;
      }
      return {
        serial: row["序号"] || "",
        phonetic: row["注音"] || "",
        unified: unifiedText,
        acceptable: row["其他可接受的写法"] || row["可接受写法"] || "",
        dictionaryRef: row["辞典将来用字参考"] || row["辞典参考"] || "",
        mandarin: mandarinText,
        priority: parsePriority(row["优先级"]),
      };
    })
    .filter(Boolean);
}

function getLexiconState() {
  if (cachedState) {
    return cachedState;
  }
  if (!fs.existsSync(HAKKA_CSV_PATH)) {
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn("[MagicData][hakka][ai] 客家话词表 CSV 缺失，复核将降级为无词表模式。", {
        xlsxExists: fs.existsSync(HAKKA_XLSX_PATH),
      });
    }
    cachedState = {
      enabled: false,
      status: "missing",
      rows: [],
      source: fs.existsSync(HAKKA_XLSX_PATH) ? "xlsx-only" : "none",
    };
    return cachedState;
  }

  try {
    const text = fs.readFileSync(HAKKA_CSV_PATH, "utf8");
    cachedState = {
      enabled: true,
      status: "ready",
      rows: parseLexiconCsv(text),
      source: "csv",
    };
  } catch (error) {
    if (!warnedError) {
      warnedError = true;
      console.warn("[MagicData][hakka][ai] 客家话词表 CSV 读取失败，复核将降级为无词表模式。", {
        message: error && error.message ? error.message : String(error),
      });
    }
    cachedState = {
      enabled: false,
      status: "error",
      rows: [],
      source: "csv",
    };
  }
  return cachedState;
}

function getEntryTerms(entry) {
  const unifiedTerms = splitTerms(entry.unified);
  const acceptableTerms = splitTerms(entry.acceptable);
  return unifiedTerms.concat(acceptableTerms).filter(Boolean);
}

function normalizeLimit(value) {
  const number = Number(value || DEFAULT_LIMIT);
  if (!Number.isFinite(number)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(100, Math.round(number)));
}

function buildLexiconContext(input) {
  const request = input && typeof input === "object" ? input : {};
  const state = getLexiconState();
  if (!state.enabled || state.status !== "ready") {
    return {
      enabled: false,
      status: state.status,
      matchedCount: 0,
      matches: [],
      text: "",
    };
  }

  const targetText = [
    normalizeText(request.platformDialectText),
    normalizeText(request.platformMandarinText),
    normalizeText(request.heardDialectText),
  ]
    .filter(Boolean)
    .join("\n");

  const limit = normalizeLimit(request.limit);
  const matches = state.rows
    .filter(function (entry) {
      const terms = getEntryTerms(entry);
      return terms.some(function (term) {
        return term && targetText.indexOf(term) >= 0;
      });
    })
    .map(function (entry) {
      const terms = getEntryTerms(entry);
      const maxTermLength = terms.reduce(function (maxLength, term) {
        return Math.max(maxLength, term.length);
      }, 0);
      return Object.assign({}, entry, { maxTermLength });
    })
    .sort(function (left, right) {
      if (right.maxTermLength !== left.maxTermLength) {
        return right.maxTermLength - left.maxTermLength;
      }
      return left.priority - right.priority;
    });

  const limitedMatches = matches.slice(0, limit).map(function (entry) {
    return {
      serial: entry.serial,
      unified: entry.unified,
      acceptable: entry.acceptable,
      mandarin: entry.mandarin,
      priority: entry.priority,
      note:
        entry.acceptable && entry.unified
          ? "命中可接受写法时可保留，但建议统一为语料统一用字。"
          : "",
    };
  });

  const contextText = limitedMatches
    .map(function (entry) {
      return [
        "- 统一用字：" + entry.unified,
        entry.acceptable ? "可接受写法：" + entry.acceptable : "",
        entry.mandarin ? "普通话：" + entry.mandarin : "",
        entry.priority !== 9999 ? "优先级：" + String(entry.priority) : "",
      ]
        .filter(Boolean)
        .join("；");
    })
    .join("\n");

  return {
    enabled: true,
    status: "ready",
    matchedCount: matches.length,
    matches: limitedMatches,
    text: contextText,
  };
}

module.exports = {
  HAKKA_CSV_PATH,
  HAKKA_XLSX_PATH,
  buildLexiconContext,
  getLexiconState,
  parseLexiconCsv,
};
