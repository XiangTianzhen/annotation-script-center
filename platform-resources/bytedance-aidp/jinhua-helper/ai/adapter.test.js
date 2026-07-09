"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadProjectAssets } = require("../../../backend/ai-framework/loaders/project-assets");
const { validateBusinessLexiconDocument } = require("../../../backend/business-lexicon");
const adapter = require("./adapter");

test("ByteDance AIDP Jinhua adapter exposes full lexicon and pronunciation assets", function () {
  assert.equal(adapter.assets.lexiconJson.jsonPath, "assets/jinhua-lexicon.json");
  assert.equal(
    adapter.assets.lexiconReferenceCsv.path,
    "assets/jinhua-pronunciation-reference.csv"
  );

  const assets = loadProjectAssets(adapter);
  const lexicon = validateBusinessLexiconDocument(assets.lexiconJson);
  const pronunciationCsv = String(assets.lexiconReferenceCsv || "");

  assert.equal(lexicon.language, "金华话");
  assert.equal(lexicon.mode, "rule_lexicon");
  assert.ok(lexicon.entries.length >= 3000);
  assert.match(pronunciationCsv.split(/\r?\n/)[0], /来源类型,发音人,编号,金华话读音/);
  assert.ok(pronunciationCsv.split(/\r?\n/).length >= 3000);
});
