"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { buildLexiconResultMeta } = require("./ai-service.js");

test("DataBaker lexicon result meta includes source and reference file info", function () {
  assert.equal(typeof buildLexiconResultMeta, "function");

  const result = buildLexiconResultMeta(
    {
      status: "reference_only",
      source: "json",
      filePath: path.join("backend", "reference", "minnan-lexicon.json"),
      referenceFilePath: path.join("backend", "reference", "minnan-lexicon.csv"),
      rows: [],
      warningMessage: "没有字词对应表",
    },
    {
      enabled: false,
      rewriteMode: "aggressive",
      matchedCount: 0,
      rewriteChanged: false,
      rewriteChanges: [],
    }
  );

  assert.deepEqual(result, {
    enabled: false,
    status: "reference_only",
    source: "json",
    sourceFile: "minnan-lexicon.json",
    referenceSourceFile: "minnan-lexicon.csv",
    rowCount: 0,
    warningMessage: "没有字词对应表",
    rewriteMode: "aggressive",
    matchedCount: 0,
    rewriteChanged: false,
    rewriteChanges: [],
  });
});
