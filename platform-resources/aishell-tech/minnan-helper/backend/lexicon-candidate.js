"use strict";

const fs = require("fs");
const path = require("path");

const {
  __testOnly,
  normalizeToSimplifiedChinesePreservingLexicon,
  parseLexiconCsv,
  removeTextSpaces,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const { splitTerms } = __testOnly;

const LEXICON_CANDIDATE_RULE_VERSION = "strict-lexicon-v1";
const LEXICON_PATH = path.join(__dirname, "reference", "minnan-lexicon.csv");
const RULES_PATH = path.join(__dirname, "reference", "minnan-lexicon-rules.json");
const EXTRA_TRADITIONAL_TO_SIMPLIFIED_PHRASES = [
  ["導航", "导航"],
  ["路況", "路况"],
];
const EXTRA_TRADITIONAL_TO_SIMPLIFIED_MAP = {
  導: "导",
  況: "况",
};

let compiledCache = null;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeRuleText(value) {
  return String(value || "").trim();
}

function normalizeCandidateText(value) {
  const compacted = removeTextSpaces(String(value || ""));
  let normalized = compacted;
  EXTRA_TRADITIONAL_TO_SIMPLIFIED_PHRASES.forEach(function (entry) {
    const traditional = entry && entry[0];
    const simplified = entry && entry[1];
    if (!traditional || !simplified || normalized.indexOf(traditional) < 0) {
      return;
    }
    normalized = normalized.split(traditional).join(simplified);
  });
  normalized = normalized
    .split("")
    .map(function (char) {
      return EXTRA_TRADITIONAL_TO_SIMPLIFIED_MAP[char] || char;
    })
    .join("");
  return normalizeToSimplifiedChinesePreservingLexicon(normalized);
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return {};
  }
}

function loadLexiconRows() {
  if (!fs.existsSync(LEXICON_PATH)) {
    return [];
  }
  try {
    return parseLexiconCsv(fs.readFileSync(LEXICON_PATH, "utf8"));
  } catch (_error) {
    return [];
  }
}

function normalizeRuleEntry(entry, fallbackSource, fallbackReason) {
  const source = entry && typeof entry === "object" ? entry : {};
  const sourceText = normalizeRuleText(source.sourceText || source.from);
  const candidateText = normalizeRuleText(source.candidateText || source.to);
  if (!sourceText || !candidateText || sourceText === candidateText) {
    return null;
  }
  return {
    sourceText,
    candidateText,
    source: normalizeRuleText(source.source || fallbackSource || "csv") === "base" ? "base" : "csv",
    reason: normalizeRuleText(source.reason || fallbackReason || "命中 Aishell 词表规则层"),
    trackPair: source.trackPair !== false,
  };
}

function normalizePhraseGuard(value) {
  const text = normalizeRuleText(value);
  if (!text) {
    return null;
  }
  return {
    sourceText: text,
    candidateText: text,
    source: "csv",
    reason: "命中 Aishell 词表保护短语",
    trackPair: false,
  };
}

function createAutomaticTokenRule(entry) {
  const source = entry && typeof entry === "object" ? entry : {};
  const sourceTerms = splitTerms(source.mandarin);
  const candidateTerms = splitTerms(source.suggested);
  if (sourceTerms.length !== 1 || candidateTerms.length !== 1) {
    return null;
  }
  const sourceText = normalizeRuleText(sourceTerms[0]);
  const candidateText = normalizeRuleText(candidateTerms[0]);
  if (!sourceText || !candidateText || sourceText === candidateText || sourceText.length < 2) {
    return null;
  }
  return {
    sourceText,
    candidateText,
    source: "csv",
    reason: "命中 Aishell 词表自动安全规则",
    rowId: normalizeRuleText(source.id),
    trackPair: true,
  };
}

function compareRuleOrder(left, right) {
  const leftText = normalizeRuleText(left && left.sourceText);
  const rightText = normalizeRuleText(right && right.sourceText);
  if (rightText.length !== leftText.length) {
    return rightText.length - leftText.length;
  }
  return leftText.localeCompare(rightText, "zh-Hans-CN");
}

function compileRules(options) {
  const source = options && typeof options === "object" ? options : {};
  const lexiconRows = Array.isArray(source.lexiconRows) ? source.lexiconRows : [];
  const rawRules = source.rulesSpec && typeof source.rulesSpec === "object" ? source.rulesSpec : {};
  const disabledRowIds = new Set(
    Array.isArray(rawRules.disabledRowIds)
      ? rawRules.disabledRowIds.map(normalizeRuleText).filter(Boolean)
      : []
  );

  const phraseRules = [];
  const tokenRules = [];
  const explicitTokenSources = new Set();

  (Array.isArray(rawRules.phraseOverrides) ? rawRules.phraseOverrides : []).forEach(function (entry) {
    const normalized = normalizeRuleEntry(entry, "csv", "命中 Aishell 词表短语规则");
    if (normalized) {
      phraseRules.push(normalized);
    }
  });

  (Array.isArray(rawRules.phraseGuards) ? rawRules.phraseGuards : []).forEach(function (entry) {
    const normalized = normalizePhraseGuard(entry);
    if (normalized) {
      phraseRules.push(normalized);
    }
  });

  (Array.isArray(rawRules.tokenOverrides) ? rawRules.tokenOverrides : []).forEach(function (entry) {
    const normalized = normalizeRuleEntry(entry, "csv", "命中 Aishell 词表指定标准写法");
    if (!normalized) {
      return;
    }
    explicitTokenSources.add(normalized.sourceText);
    tokenRules.push(normalized);
  });

  lexiconRows.forEach(function (entry) {
    const rowId = normalizeRuleText(entry && entry.id);
    if (rowId && disabledRowIds.has(rowId)) {
      return;
    }
    const normalized = createAutomaticTokenRule(entry);
    if (!normalized || explicitTokenSources.has(normalized.sourceText)) {
      return;
    }
    tokenRules.push(normalized);
  });

  return {
    version:
      LEXICON_CANDIDATE_RULE_VERSION +
      ":" +
      String(Number(rawRules.version || 0) || 0),
    phraseRules: phraseRules.sort(compareRuleOrder),
    tokenRules: tokenRules.sort(compareRuleOrder),
  };
}

function getCompiledRules() {
  if (compiledCache) {
    return compiledCache;
  }
  compiledCache = compileRules({
    lexiconRows: loadLexiconRows(),
    rulesSpec: readJsonFile(RULES_PATH),
  });
  return compiledCache;
}

function scanWithRules(text, rules, usePlaceholders) {
  const sourceText = String(text || "");
  const compiledRules = Array.isArray(rules) ? rules : [];
  if (!sourceText || compiledRules.length === 0) {
    return {
      text: sourceText,
      appliedRules: [],
      replacements: [],
    };
  }
  let output = "";
  let cursor = 0;
  const appliedRules = [];
  const replacements = [];

  while (cursor < sourceText.length) {
    let matchedRule = null;
    for (let index = 0; index < compiledRules.length; index += 1) {
      const candidateRule = compiledRules[index];
      if (
        candidateRule &&
        candidateRule.sourceText &&
        sourceText.startsWith(candidateRule.sourceText, cursor)
      ) {
        matchedRule = candidateRule;
        break;
      }
    }
    if (!matchedRule) {
      output += sourceText[cursor];
      cursor += 1;
      continue;
    }
    if (usePlaceholders === true) {
      const token = "__ASC_AISHELL_LEXICON_CANDIDATE_" + String(replacements.length) + "__";
      output += token;
      replacements.push({
        token,
        value: matchedRule.candidateText,
      });
    } else {
      output += matchedRule.candidateText;
    }
    appliedRules.push(matchedRule);
    cursor += matchedRule.sourceText.length;
  }

  return {
    text: output,
    appliedRules,
    replacements,
  };
}

function restorePlaceholders(text, replacements) {
  let output = String(text || "");
  (Array.isArray(replacements) ? replacements : []).forEach(function (entry) {
    if (!entry || !entry.token) {
      return;
    }
    output = output.split(entry.token).join(String(entry.value || ""));
  });
  return output;
}

function normalizeCandidatePairs(appliedRules) {
  const source = Array.isArray(appliedRules) ? appliedRules : [];
  const seen = new Set();
  const result = [];
  source.forEach(function (entry) {
    const sourceText = normalizeRuleText(entry && entry.sourceText);
    const candidateText = normalizeRuleText(entry && entry.candidateText);
    if (!sourceText || !candidateText || sourceText === candidateText) {
      return;
    }
    if (entry && entry.trackPair === false) {
      return;
    }
    const pairSource = normalizeRuleText(entry && entry.source) === "base" ? "base" : "csv";
    const key = [sourceText, candidateText, pairSource].join("\u0000");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push({
      sourceText,
      candidateText,
      source: pairSource,
    });
  });
  return result;
}

function buildLexiconCandidateContext(pageText, options) {
  const sourceText = String(pageText || "");
  const overrides = options && typeof options === "object" ? options : {};
  const compiled =
    overrides.compiledRules && typeof overrides.compiledRules === "object"
      ? overrides.compiledRules
      : compileRules({
          lexiconRows: Array.isArray(overrides.lexiconRows) ? overrides.lexiconRows : loadLexiconRows(),
          rulesSpec: overrides.rulesSpec && typeof overrides.rulesSpec === "object"
            ? overrides.rulesSpec
            : readJsonFile(RULES_PATH),
        });
  const phraseResult = scanWithRules(sourceText, compiled.phraseRules, true);
  const tokenResult = scanWithRules(phraseResult.text, compiled.tokenRules, false);
  const candidateText = normalizeCandidateText(
    restorePlaceholders(tokenResult.text, phraseResult.replacements)
  );
  const candidatePairs = normalizeCandidatePairs(
    phraseResult.appliedRules.concat(tokenResult.appliedRules)
  );
  return {
    enabled: Boolean(candidateText),
    lexiconCandidateText: candidateText,
    candidatePairs,
    candidateDiffCount: candidatePairs.length,
    confidence: null,
    needHumanReview: false,
    ruleVersion: normalizeRuleText(compiled.version),
  };
}

function resetCompiledRulesCache() {
  compiledCache = null;
}

module.exports = {
  LEXICON_CANDIDATE_RULE_VERSION,
  LEXICON_PATH,
  RULES_PATH,
  buildLexiconCandidateContext,
  __testOnly: {
    compileRules,
    normalizeCandidateText,
    normalizeCandidatePairs,
    readJsonFile,
    resetCompiledRulesCache,
    scanWithRules,
  },
};
