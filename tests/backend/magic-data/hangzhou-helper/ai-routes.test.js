"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const routesModule = require(resolveRepo(
  "platform-resources",
  "magic-data",
  "hangzhou-helper",
  "backend",
  "ai-routes.js"
));
const aiClient = require(resolveRepo(
  "platform-resources",
  "magic-data",
  "hangzhou-helper",
  "backend",
  "ai-client-qwen.js"
));

test("Magic Data Hangzhou success lexicon meta reports prompt-reference stage counts", function () {
  const helper = routesModule.__test__?.buildReviewLexiconMeta;
  assert.equal(typeof helper, "function");

  const result = helper(
    {
      enabled: true,
      status: "ready",
      rowCount: 264,
      stages: {
        listen: { enabled: true, contextEntryCount: 2 },
        refine: { enabled: false, contextEntryCount: 0 },
      },
    },
    "prompt_reference_only"
  );

  assert.deepEqual(result, {
    enabled: true,
    status: "ready",
    rowCount: 264,
    mode: "prompt_reference_only",
    stages: {
      listen: { enabled: true, contextEntryCount: 2 },
      refine: { enabled: false, contextEntryCount: 0 },
    },
    lexiconMatches: [],
    conversionWarnings: [],
  });
});

test("Magic Data Hangzhou stage generation is applied to the provider request body", function () {
  const requestBody = {
    temperature: 0.1,
    top_p: 0.8,
    max_tokens: 1200,
  };
  aiClient.__test__.applyAiOptionsToRequestBody(requestBody, {
    temperature: 0.3,
    top_p: 0.6,
    max_tokens: 900,
    stop: ["结束"],
  });
  assert.equal(requestBody.temperature, 0.3);
  assert.equal(requestBody.top_p, 0.6);
  assert.equal(requestBody.max_tokens, 900);
  assert.deepEqual(requestBody.stop, ["结束"]);
});

test("Magic Data Hangzhou response normalization keeps final suggestion fields unchanged when lexicon is absent", function () {
  const helper = routesModule.__test__?.applyFinalDialectNormalizationToResponseData;
  assert.equal(typeof helper, "function");

  const responseData = {
    dialectTextCheck: {
      suggestedValue: "涯系嘅",
    },
    recommendations: {
      dialectText: "没给这很",
      mandarinText: "不用改",
      summary: "自由文本不改",
    },
    audioCheck: {
      heardDialectText: "涯系嘅没给这很",
    },
    recognitionConvert: null,
  };

  const result = helper(responseData, {
    rewriteMode: "exact",
  });

  assert.equal(result.dialectTextCheck.suggestedValue, "涯系嘅");
  assert.equal(result.recommendations.dialectText, "没给这很");
  assert.equal(result.audioCheck.heardDialectText, "涯系嘅没给这很");
  assert.equal(result.recommendations.summary, "自由文本不改");
  assert.equal(result.recommendations.mandarinText, "不用改");
});

test("Magic Data Hangzhou recognition convert response keeps convertedDialectText unchanged when lexicon is absent", function () {
  const helper = routesModule.__test__?.applyFinalDialectNormalizationToResponseData;
  assert.equal(typeof helper, "function");

  const responseData = {
    dialectTextCheck: {
      suggestedValue: "涯系",
    },
    recommendations: {
      dialectText: "涯系嘅",
      mandarinText: "普通话",
      summary: "总结",
    },
    audioCheck: {
      heardDialectText: "涯系嘅",
    },
    recognitionConvert: {
      recognitionStrategy: "mandarin_to_dialect",
      pipelineMode: "recognition_convert",
      recognizedMandarinText: "我是那个人",
      convertedDialectText: "涯系嘅个人",
      lexiconMatches: [],
      conversionWarnings: [],
    },
  };

  const result = helper(responseData, {
    rewriteMode: "exact",
  });

  assert.equal(result.recognitionConvert.convertedDialectText, "涯系嘅个人");
  assert.equal(result.audioCheck.heardDialectText, "涯系嘅");
});
