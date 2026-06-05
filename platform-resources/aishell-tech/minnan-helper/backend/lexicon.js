"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  parseLexiconCsv,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const LEXICON_PATH = path.join(__dirname, "reference", "minnan-lexicon.csv");

let cachedLexiconState = null;

function normalizeText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLexiconTerm(value) {
  return normalizeText(value)
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[（(][^、，,；;／/\s]*/g, "")
    .replace(/[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹḿ]+/gi, "")
    .replace(/\d+/g, "")
    .replace(/[-_.：:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLexiconTerms(value) {
  const text = cleanLexiconTerm(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[、，,；;／/\s]+/)
    .map(cleanLexiconTerm)
    .filter(Boolean);
}

function uniqueTerms(values) {
  const result = [];
  (Array.isArray(values) ? values : []).forEach(function (item) {
    const text = normalizeText(item);
    if (!text || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return result;
}

function parseStructuredLexiconRows(text) {
  return parseLexiconCsv(text)
    .map(function (row) {
      const id = normalizeText(row?.id);
      const suggested = normalizeText(row?.suggested);
      const mandarin = normalizeText(row?.mandarin);
      const suggestedVariants = uniqueTerms(splitLexiconTerms(suggested));
      const mandarinVariants = uniqueTerms(splitLexiconTerms(mandarin));
      if (!suggestedVariants.length || !mandarinVariants.length) {
        return null;
      }
      return {
        id,
        suggested,
        mandarin,
        rawRow: {
          id,
          suggested,
          mandarin,
        },
        suggestedVariants,
        mandarinVariants,
      };
    })
    .filter(Boolean);
}

function buildLexiconState(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const indexByMandarin = new Map();
  safeRows.forEach(function (row) {
    row.mandarinVariants.forEach(function (variant) {
      const list = indexByMandarin.get(variant) || [];
      list.push(row);
      indexByMandarin.set(variant, list);
    });
  });
  const mandarinVariants = Array.from(indexByMandarin.keys()).sort(function (left, right) {
    return right.length - left.length || left.localeCompare(right, "zh-Hans-CN");
  });
  return {
    exists: safeRows.length > 0,
    rowCount: safeRows.length,
    rows: safeRows,
    indexByMandarin,
    mandarinVariants,
  };
}

function getLexiconState() {
  if (cachedLexiconState) {
    return cachedLexiconState;
  }
  try {
    const text = fs.readFileSync(LEXICON_PATH, "utf8");
    cachedLexiconState = buildLexiconState(parseStructuredLexiconRows(text));
  } catch (_error) {
    cachedLexiconState = buildLexiconState([]);
  }
  return cachedLexiconState;
}

function findMatchesAt(referenceText, startIndex, state) {
  const sourceText = String(referenceText || "");
  if (!sourceText || !state?.indexByMandarin || !Array.isArray(state?.mandarinVariants)) {
    return [];
  }
  const matches = [];
  state.mandarinVariants.forEach(function (variant) {
    if (!variant || !sourceText.startsWith(variant, startIndex)) {
      return;
    }
    const rows = state.indexByMandarin.get(variant) || [];
    if (!rows.length) {
      return;
    }
    matches.push({
      start: startIndex,
      end: startIndex + variant.length,
      sourceText: variant,
      mandarinVariant: variant,
      rows,
      candidateOptions: uniqueTerms(
        rows.flatMap(function (row) {
          return row.suggestedVariants;
        })
      ),
      entryIds: uniqueTerms(
        rows.map(function (row) {
          return row.id;
        })
      ),
    });
  });
  return matches.sort(function (left, right) {
    const lengthDelta = (right.end - right.start) - (left.end - left.start);
    if (lengthDelta !== 0) {
      return lengthDelta;
    }
    return left.sourceText.localeCompare(right.sourceText, "zh-Hans-CN");
  });
}

function buildRuleFirstConvertPlan(referenceText, customState) {
  const sourceText = String(referenceText || "");
  const state = customState && typeof customState === "object" ? customState : getLexiconState();
  const fragments = [];
  const ambiguousSegments = [];
  const matchedEntries = [];
  const seenMatchedEntryKeys = new Set();
  let cursor = 0;

  while (cursor < sourceText.length) {
    const matches = findMatchesAt(sourceText, cursor, state);
    if (!matches.length) {
      fragments.push({
        type: "plain",
        text: sourceText[cursor],
        sourceText: sourceText[cursor],
        start: cursor,
        end: cursor + 1,
      });
      cursor += 1;
      continue;
    }

    const longestLength = matches.reduce(function (maxLength, item) {
      return Math.max(maxLength, item.end - item.start);
    }, 0);
    const longestMatches = matches.filter(function (item) {
      return item.end - item.start === longestLength;
    });
    const selectedMatch = longestMatches[0];
    const candidateOptions = uniqueTerms(
      longestMatches.flatMap(function (item) {
        return item.candidateOptions;
      })
    );
    const entryIds = uniqueTerms(
      longestMatches.flatMap(function (item) {
        return item.entryIds;
      })
    );
    const matchedMandarinVariants = uniqueTerms(
      longestMatches.map(function (item) {
        return item.mandarinVariant;
      })
    );
    const sharedFragmentBase = {
      sourceText: selectedMatch.sourceText,
      start: selectedMatch.start,
      end: selectedMatch.end,
      entryIds,
      candidateOptions,
      matchedMandarinVariants,
    };

    longestMatches.forEach(function (item) {
      item.rows.forEach(function (row) {
        const key = String(row.id || "") + "\u0000" + selectedMatch.sourceText;
        if (seenMatchedEntryKeys.has(key)) {
          return;
        }
        seenMatchedEntryKeys.add(key);
        matchedEntries.push({
          id: row.id,
          suggested: row.suggested,
          mandarin: row.mandarin,
          rawRow: row.rawRow,
          suggestedVariants: row.suggestedVariants.slice(),
          mandarinVariants: row.mandarinVariants.slice(),
        });
      });
    });

    if (candidateOptions.length > 1) {
      const segmentIndex = ambiguousSegments.length;
      const ambiguousSegment = Object.assign({}, sharedFragmentBase, {
        segmentIndex,
        currentText: selectedMatch.sourceText,
        reason:
          longestMatches.length > 1 ? "overlapping_conflict" : "multiple_candidate_options",
      });
      ambiguousSegments.push(ambiguousSegment);
      fragments.push(
        Object.assign(
          {
            type: "ambiguous",
            text: selectedMatch.sourceText,
          },
          ambiguousSegment
        )
      );
      cursor = selectedMatch.end;
      continue;
    }

    fragments.push(
      Object.assign(
        {
          type: "fixed",
          text: candidateOptions[0] || selectedMatch.sourceText,
        },
        sharedFragmentBase
      )
    );
    cursor = selectedMatch.end;
  }

  return {
    referenceText: sourceText,
    convertedText: fragments
      .map(function (fragment) {
        return fragment.text;
      })
      .join(""),
    fragments,
    ambiguousSegments,
    matchedEntries,
    matchedCount: matchedEntries.length,
    requiresModelFallback: ambiguousSegments.length > 0,
  };
}

function composeResolvedConvertText(plan, resolvedSegments) {
  const safePlan = plan && typeof plan === "object" ? plan : {};
  const fragments = Array.isArray(safePlan.fragments) ? safePlan.fragments : [];
  if (!fragments.length) {
    return String(safePlan.convertedText || safePlan.referenceText || "");
  }
  const segmentChoiceMap = new Map();
  (Array.isArray(resolvedSegments) ? resolvedSegments : []).forEach(function (item) {
    const source = item && typeof item === "object" ? item : {};
    const segmentIndex = Number.isFinite(Number(source.segmentIndex))
      ? Math.floor(Number(source.segmentIndex))
      : Number.isFinite(Number(source.index))
        ? Math.floor(Number(source.index))
        : -1;
    if (segmentIndex < 0) {
      return;
    }
    const selectedText = normalizeText(
      source.selectedText || source.chosenText || source.resolvedText || source.text
    );
    if (!selectedText) {
      return;
    }
    segmentChoiceMap.set(segmentIndex, selectedText);
  });
  return fragments
    .map(function (fragment) {
      if (fragment?.type !== "ambiguous") {
        return String(fragment?.text || "");
      }
      const segmentIndex = Number(fragment.segmentIndex);
      const selectedText = segmentChoiceMap.get(segmentIndex);
      if (
        selectedText &&
        Array.isArray(fragment.candidateOptions) &&
        fragment.candidateOptions.indexOf(selectedText) >= 0
      ) {
        return selectedText;
      }
      return String(fragment.currentText || fragment.text || fragment.sourceText || "");
    })
    .join("");
}

module.exports = {
  LEXICON_PATH,
  buildRuleFirstConvertPlan,
  composeResolvedConvertText,
  getLexiconState,
};
