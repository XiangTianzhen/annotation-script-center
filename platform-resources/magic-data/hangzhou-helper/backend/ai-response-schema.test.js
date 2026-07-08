"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const schemaModule = require("./ai-response-schema.js");

test("Magic Data Hangzhou listen response normalizes pureDialectGuess", function () {
  const result = schemaModule.normalizeListenResponse({
    heardDialectText: "杭州话内容",
    heardMandarinMeaning: "普通话意思",
    isValidAudio: true,
    genderGuess: "女",
    ageRangeGuess: "19-25",
    pureDialectGuess: "纯方言",
    confidence: 0.88,
  });

  assert.equal(result.pureDialectGuess, "纯方言");
});

test("Magic Data Hangzhou listen response maps boolean pureDialectGuess to readable labels", function () {
  const pureDialectResult = schemaModule.normalizeListenResponse({
    pureDialectGuess: true,
  });
  const accentedMandarinResult = schemaModule.normalizeListenResponse({
    pureDialectGuess: false,
  });

  assert.equal(pureDialectResult.pureDialectGuess, "纯方言");
  assert.equal(accentedMandarinResult.pureDialectGuess, "口音普通话");
});

test("Magic Data Hangzhou rule-first comparison includes pureDialect speaker check", function () {
  const result = schemaModule.normalizeRuleFirstComparison(
    {
      speakerCheck: {
        pureDialect: {
          isCorrect: false,
          suggestedValue: "纯方言",
          reason: "音频主体为纯方言发声。",
          confidence: 0.79,
        },
      },
      recommendations: {
        dialectText: "杭州话文本",
        mandarinText: "普通话文本",
        summary: "需要调整纯方言属性。",
      },
      overall: {
        reviewConclusion: "need_review",
        shouldReview: true,
        summary: "需要调整纯方言属性。",
      },
      textRuleCheck: {
        speakerAttributeIssues: ["音频主体为纯方言发声。"],
      },
      confidence: 0.79,
    },
    {
      platformDialectText: "杭州话文本",
      platformMandarinText: "普通话文本",
      speaker: {
        gender: "女",
        ageRange: "19-25",
        pureDialect: "口音普通话",
      },
    },
    {
      heardDialectText: "杭州话文本",
      heardMandarinMeaning: "普通话文本",
      genderGuess: "女",
      ageRangeGuess: "19-25",
      pureDialectGuess: "纯方言",
      confidence: 0.79,
    }
  );

  assert.equal(result.speakerCheck.pureDialect.platformValue, "口音普通话");
  assert.equal(result.speakerCheck.pureDialect.suggestedValue, "纯方言");
  assert.equal(result.speakerCheck.pureDialect.isCorrect, false);
  assert.equal(result.speakerCheck.pureDialect.reason, "音频主体为纯方言发声。");
});
