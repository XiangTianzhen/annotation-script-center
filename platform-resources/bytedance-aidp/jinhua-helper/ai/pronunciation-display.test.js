"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { toJinhuaPronunciationDisplay } = require("./pronunciation-display");

test("Jinhua pronunciation display removes tones and approximates IPA as ASCII", function () {
  assert.equal(toJinhuaPronunciationDisplay("ȵiəʔ21diu14"), "nie diu");
  assert.equal(toJinhuaPronunciationDisplay("ɕiŋ334"), "xing");
  assert.equal(toJinhuaPronunciationDisplay("thia33lɛ55"), "thia le");
});

test("Jinhua pronunciation display handles multi-syllable and punctuation samples", function () {
  assert.equal(
    toJinhuaPronunciationDisplay("thia33kiu535tɕhiəʔ4ȵiəʔ21diu14"),
    "thia kiu qie nie diu"
  );
  assert.equal(
    toJinhuaPronunciationDisplay("a.noŋ535biŋ31dʑiɑŋ14？b.Ǿɑ535fəʔ4。"),
    "a nong bing jiang? b a fe."
  );
});
