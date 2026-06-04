"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  createDefaultsPayload,
} = require("./ai-service");

const aishellLexiconPath = path.join(__dirname, "reference", "minnan-lexicon.csv");
const dataBakerLexiconPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "data-baker",
  "round-one-quality",
  "backend",
  "reference",
  "minnan-lexicon.csv"
);

test("Aishell defaults align to DataBaker-style Minnan standard", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};

  assert.equal(defaults.modelMode, "two_stage");
  assert.equal(defaults.recognitionStrategy, "mandarin_to_dialect");
  assert.equal(defaults.compareModel, "qwen3.5-plus");
  assert.equal(defaults.pipelineMode, "qwen_omni_compare");
});

test("Aishell defaults expose independent prompt profiles for both recognition strategies", function () {
  const payload = createDefaultsPayload();
  const profiles = payload.defaults?.promptProfiles || {};

  assert.equal(
    profiles.mandarin_to_dialect?.listenPrompt,
    payload.defaults?.listenPrompt
  );
  assert.equal(
    profiles.mandarin_to_dialect?.comparePrompt,
    payload.defaults?.comparePrompt
  );
  assert.notEqual(
    profiles.mandarin_to_dialect?.listenPrompt,
    profiles.direct_dialect?.listenPrompt
  );
  assert.notEqual(
    profiles.mandarin_to_dialect?.comparePrompt,
    profiles.direct_dialect?.comparePrompt
  );
});

test("Aishell Minnan lexicon stays byte-for-byte aligned with DataBaker reference", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const dataBakerLexicon = fs.readFileSync(dataBakerLexiconPath, "utf8");

  assert.equal(aishellLexicon, dataBakerLexicon);
});
