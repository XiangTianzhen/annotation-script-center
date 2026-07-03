"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const aiService = require("./ai-service");

test("Suzhou ai service trims obvious stutter repeats to at most three copies", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "这这这这这个事情我晓得。",
  });

  assert.equal(result.finalMandarinText, "这这这个事情我晓得。");
});

test("Suzhou ai service keeps meaningful repeated clauses instead of globally deduping", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "吃得，吃得我肚子痛。",
  });

  assert.equal(result.finalMandarinText, "吃得，吃得我肚子痛。");
});

test("Suzhou ai service keeps particles and laughter in the final Mandarin hearing transcript", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "啊哈哈哈，我晓得了。",
  });

  assert.equal(result.finalMandarinText, "啊哈哈哈，我晓得了。");
});

test("Suzhou ai service returns empty string for silence or completely unintelligible results", function () {
  const silent = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "纯静音",
  });
  const unclear = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "完全听不清",
  });

  assert.equal(silent.finalMandarinText, "");
  assert.equal(unclear.finalMandarinText, "");
});

test("Suzhou ai service converts Arabic digits to Chinese numerals and keeps only allowed punctuation", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "他说：今天有3个问题；先看1、2、3!",
  });

  assert.equal(result.finalMandarinText, "他说，今天有三个问题，先看一，二，三！");
});

test("Suzhou ai service preserves unknown-entity wrappers with Chinese punctuation", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    finalMandarinText: "##阿布公司##?",
  });

  assert.equal(result.finalMandarinText, "##阿布公司##？");
});
