"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("DataBaker adapter normalizes request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    collectId: "collect-1",
    itemId: "item-1",
    textId: "text-1",
    audioUrl: "https://example.com/audio.wav",
    pageText: "页面候选文本",
    recognitionMode: "two_stage",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
  });

  assert.deepEqual(normalized.input, {
    collectId: "collect-1",
    itemId: "item-1",
    textId: "text-1",
    audioUrl: "https://example.com/audio.wav",
    pageText: "页面候选文本",
    sentenceNumber: null,
  });
  assert.deepEqual(normalized.projectOptions, {
    recognitionMode: "two_stage",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
    singleModel: "qwen3.5-omni-flash",
  });
  assert.equal(
    normalized.runtimeContext.normalizedRecommendRequest.collectId,
    "collect-1"
  );
});

test("DataBaker adapter builds legacy recommend response body", function () {
  const responseBody = adapter.buildRecommendSuccessBody({
    normalizedRequest: {
      requestId: "request-6",
    },
    execution: {
      pipelineResult: {
        dedupeEnabled: true,
        joined: false,
        joinedInflight: false,
        dedupeKeyShort: "abc123",
        legacyOmniFastPath: true,
      },
      projectResult: {
        recommendedText: "推荐文本",
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    requestId: "request-6",
    data: {
      recommendedText: "推荐文本",
    },
    dedupe: {
      enabled: true,
      joined: false,
      joinedInflight: false,
      keyShort: "abc123",
    },
    routing: {
      legacyOmniFastPath: true,
      omniLegacyCommit: adapter.legacyOmniCommit,
    },
  });
});

test("DataBaker adapter builds legacy error body", function () {
  const error = new Error("DataBaker AI recommend 请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-7";
  error.providerStatus = 500;

  const responseBody = adapter.buildRecommendErrorBody({
    error,
    requestId: "request-7",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-7");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.providerStatus, 500);
});
