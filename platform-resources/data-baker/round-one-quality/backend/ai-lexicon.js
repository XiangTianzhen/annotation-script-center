"use strict";

const fs = require("fs");
const path = require("path");

const MINNAN_LEXICON_PATH = path.join(__dirname, "..", "ai", "minnan-lexicon.csv");
const DEFAULT_CONTEXT_LIMIT = 40;

const BASE_ENTRIES = [
  { mandarin: "我/我们", suggested: "阮、咱" },
  { mandarin: "你/你们", suggested: "汝、恁" },
  { mandarin: "他/她/它/他们/她们", suggested: "伊、因" },
  { mandarin: "这位", suggested: "即个" },
  { mandarin: "现在", suggested: "即阵" },
  { mandarin: "的", suggested: "诶" },
  { mandarin: "很", suggested: "真" },
  { mandarin: "喜欢", suggested: "欢喜" },
  { mandarin: "吃", suggested: "食" },
  { mandarin: "整天", suggested: "规日" },
  { mandarin: "门儿清", suggested: "门理清" },
  { mandarin: "那些事儿", suggested: "迄代志" },
];

let lexiconCache = null;
let warnedMissing = false;
let warnedReadFailure = false;

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

function parseCsvRecords(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const records = [];
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

    if (char === "\r" || char === "\n") {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some(function (value) { return normalizeText(value); })) {
        records.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some(function (value) { return normalizeText(value); })) {
    records.push(row);
  }

  return records;
}

function parseLexiconCsv(text) {
  const records = parseCsvRecords(text);
  if (records.length < 2) {
    return [];
  }

  const headers = records[0].map(normalizeHeader);
  return records
    .slice(1)
    .map(function (record) {
      const row = {};
      headers.forEach(function (header, index) {
        if (header) {
          row[header] = normalizeText(record[index]);
        }
      });

      const id = normalizeText(row["编号"]);
      const suggested = normalizeText(row["建议用字"]);
      const mandarin = normalizeText(row["对应华语"]);
      if (!suggested || !mandarin) {
        return null;
      }

      return {
        id,
        suggested,
        mandarin,
      };
    })
    .filter(Boolean);
}

function getLexiconState() {
  if (lexiconCache) {
    return lexiconCache;
  }

  if (!fs.existsSync(MINNAN_LEXICON_PATH)) {
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn("[DataBaker][round-one-quality][ai] 闽南方言词表不存在，已跳过词表上下文。", {
        fileName: path.basename(MINNAN_LEXICON_PATH),
      });
    }
    lexiconCache = {
      exists: false,
      rows: [],
    };
    return lexiconCache;
  }

  try {
    const text = fs.readFileSync(MINNAN_LEXICON_PATH, "utf8");
    lexiconCache = {
      exists: true,
      rows: parseLexiconCsv(text),
    };
  } catch (error) {
    if (!warnedReadFailure) {
      warnedReadFailure = true;
      console.warn("[DataBaker][round-one-quality][ai] 闽南方言词表读取失败，已跳过词表上下文。", {
        fileName: path.basename(MINNAN_LEXICON_PATH),
        message: error && error.message ? error.message : String(error),
      });
    }
    lexiconCache = {
      exists: false,
      rows: [],
    };
  }

  return lexiconCache;
}

function loadMinnanLexicon() {
  return getLexiconState().rows.slice();
}

function normalizeLimit(value) {
  const number = Number(value || DEFAULT_CONTEXT_LIMIT);
  if (!Number.isFinite(number)) {
    return DEFAULT_CONTEXT_LIMIT;
  }
  return Math.max(1, Math.min(120, Math.round(number)));
}

function getEntryKey(entry) {
  return normalizeText(entry.mandarin) + "\u0000" + normalizeText(entry.suggested);
}

function splitTerms(value) {
  const text = normalizeText(value);
  if (!text) {
    return [];
  }
  const parts = text
    .split(/[、，,；;\/\s]+/)
    .map(normalizeText)
    .filter(Boolean);
  if (parts.indexOf(text) < 0) {
    parts.unshift(text);
  }
  return parts;
}

function entryMatchesText(entry, text) {
  const source = normalizeText(text);
  if (!source) {
    return false;
  }
  const terms = splitTerms(entry.mandarin).concat(splitTerms(entry.suggested));
  return terms.some(function (term) {
    return term && source.indexOf(term) >= 0;
  });
}

function formatEntry(entry) {
  return "- 对应华语：" + normalizeText(entry.mandarin) + "；建议用字：" + normalizeText(entry.suggested);
}

function getFirstSuggestedTerm(value) {
  return normalizeText(value)
    .split(/[、，,；;\/\s]+/)
    .map(normalizeText)
    .filter(Boolean)[0] || "";
}

function addRewriteRule(rules, seen, mandarin, suggested, source) {
  const to = getFirstSuggestedTerm(suggested);
  if (!to) {
    return;
  }

  splitTerms(mandarin).forEach(function (from) {
    if (!from || from === to) {
      return;
    }
    const key = from + "\u0000" + to;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    rules.push({
      from,
      to,
      source,
      reason: "命中闽南方言词表",
    });
  });
}

function buildRewriteRules() {
  const state = getLexiconState();
  const rules = [];
  const seen = new Set();

  BASE_ENTRIES.forEach(function (entry) {
    addRewriteRule(rules, seen, entry.mandarin, entry.suggested, "base");
  });

  state.rows.forEach(function (entry) {
    addRewriteRule(rules, seen, entry.mandarin, entry.suggested, "csv");
  });

  return rules.sort(function (left, right) {
    return right.from.length - left.from.length;
  });
}

function countOccurrences(text, searchText) {
  if (!searchText) {
    return 0;
  }
  let count = 0;
  let index = 0;
  while (index < text.length) {
    const foundIndex = text.indexOf(searchText, index);
    if (foundIndex < 0) {
      break;
    }
    count += 1;
    index = foundIndex + searchText.length;
  }
  return count;
}

function applyLexiconRewrite(text, options) {
  const source = options && typeof options === "object" ? options : {};
  const mode = String(source.mode || "aggressive").trim() || "aggressive";
  const originalText = String(text || "");
  if (mode === "off" || !originalText) {
    return {
      text: originalText,
      changed: false,
      changes: [],
    };
  }

  let rewrittenText = originalText;
  const changes = [];
  buildRewriteRules().forEach(function (rule) {
    if (!rule.from || !rule.to || rewrittenText.indexOf(rule.from) < 0) {
      return;
    }
    if (rewrittenText.indexOf(rule.to) >= 0) {
      return;
    }

    const occurrenceCount = countOccurrences(rewrittenText, rule.from);
    if (occurrenceCount <= 0) {
      return;
    }

    rewrittenText = rewrittenText.split(rule.from).join(rule.to);
    for (let index = 0; index < occurrenceCount; index += 1) {
      changes.push({
        from: rule.from,
        to: rule.to,
        source: rule.source,
        reason: rule.reason,
      });
    }
  });

  return {
    text: rewrittenText,
    changed: rewrittenText !== originalText,
    changes,
  };
}

function buildLexiconContext(options) {
  const source = options && typeof options === "object" ? options : {};
  const state = getLexiconState();
  if (!state.exists) {
    return {
      enabled: false,
      matchedCount: 0,
      items: [],
      text: "",
    };
  }

  const limit = normalizeLimit(source.limit);
  const targetText = [source.pageText, source.heardText].map(normalizeText).filter(Boolean).join("\n");
  const items = [];
  const seen = new Set();

  BASE_ENTRIES.forEach(function (entry) {
    const key = getEntryKey(entry);
    if (!seen.has(key)) {
      seen.add(key);
      items.push({
        mandarin: entry.mandarin,
        suggested: entry.suggested,
        source: "base",
      });
    }
  });

  const matchedRows = state.rows.filter(function (entry) {
    return entryMatchesText(entry, targetText);
  });

  matchedRows.forEach(function (entry) {
    if (items.length >= limit) {
      return;
    }
    const key = getEntryKey(entry);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    items.push({
      id: entry.id,
      mandarin: entry.mandarin,
      suggested: entry.suggested,
      source: "csv",
    });
  });

  return {
    enabled: true,
    matchedCount: matchedRows.length,
    items,
    text: items.map(formatEntry).join("\n"),
  };
}

module.exports = {
  MINNAN_LEXICON_PATH,
  applyLexiconRewrite,
  buildLexiconContext,
  loadMinnanLexicon,
  parseLexiconCsv,
};
