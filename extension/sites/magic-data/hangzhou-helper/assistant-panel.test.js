"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const panelModule = require("./assistant-panel.js");

test("resolveFillAllSuggestionsOutcome treats Hangzhou no-op fills as success", function () {
  const helper = panelModule.__test__?.resolveFillAllSuggestionsOutcome;
  assert.equal(typeof helper, "function");

  const result = helper(0, []);

  assert.deepEqual(result, {
    ok: true,
    noChanges: true,
    appliedCount: 0,
    message: "无需填入，保持当前内容。",
  });
});

test("buildSpeakerDetailRows includes pure dialect judgement rows", function () {
  const helper = panelModule.__test__?.buildSpeakerDetailRows;
  assert.equal(typeof helper, "function");

  const rows = helper({
    gender: {
      isCorrect: true,
      platformValue: "女",
      suggestedValue: "女",
      reason: "",
      confidence: 0.92,
    },
    ageRange: {
      isCorrect: true,
      platformValue: "19-25",
      suggestedValue: "19-25",
      reason: "",
      confidence: 0.81,
    },
    pureDialect: {
      isCorrect: false,
      platformValue: "口音普通话",
      suggestedValue: "纯方言",
      reason: "音频实际更接近纯方言发声。",
      confidence: 0.77,
    },
  });

  assert.ok(Array.isArray(rows));
  assert.equal(rows[10][0], "纯方言判断");
  assert.match(String(rows[10][1]), /错误/);
  assert.equal(rows[11][1], "口音普通话");
  assert.equal(rows[12][1], "纯方言");
  assert.equal(rows[13][1], "音频实际更接近纯方言发声。");
  assert.equal(rows[14][1], "0.77");
});
