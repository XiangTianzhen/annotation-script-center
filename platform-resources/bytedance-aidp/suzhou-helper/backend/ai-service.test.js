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
