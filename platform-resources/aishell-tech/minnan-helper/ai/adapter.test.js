"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("Aishell adapter normalizes recommend request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "平台参考文本",
    existingMarkText: "已有标注",
    duration: 12.5,
    recognitionMode: "two_stage",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
  });

  assert.deepEqual(normalized.input, {
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "平台参考文本",
    existingMarkText: "已有标注",
    duration: 12.5,
  });
  assert.deepEqual(normalized.projectOptions, {
    modelMode: "two_stage",
    recognitionStrategy: "mandarin_to_dialect",
    pipelineMode: "fun_asr_compare",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
    singleModel: "qwen3.5-omni-flash",
    enableThinking: false,
  });
  assert.equal(
    normalized.runtimeContext.normalizedRecommendRequest.taskItemId,
    "item-1"
  );
  assert.equal(normalized.runtimeContext.normalizedRecommendRequest.pipelineMode, "fun_asr_compare");
});

test("Aishell adapter builds recommend success body", function () {
  const responseBody = adapter.buildRecommendSuccessBody({
    requestId: "request-1",
    data: {
      taskItemId: "item-1",
      recommendedText: "推荐文本",
    },
    meta: {
      requestId: "request-1",
      stage: "complete",
      models: {
        modelMode: "two_stage",
      },
    },
  });

  assert.equal(responseBody.success, true);
  assert.equal(responseBody.data.taskItemId, "item-1");
  assert.equal(responseBody.data.recommendedText, "推荐文本");
  assert.equal(responseBody.meta.requestId, "request-1");
  assert.equal(responseBody.meta.stage, "complete");
  assert.equal(responseBody.meta.models.modelMode, "two_stage");
});

test("Aishell adapter builds recommend error body", function () {
  const error = new Error("Aishell 闽南语助手请求失败。");
  error.code = "provider-http-error";
  error.stage = "listen";
  error.requestId = "request-2";
  error.providerStatus = 500;
  error.providerCode = "provider-error";
  error.retryable = true;
  error.meta = {
    requestId: "request-2",
  };

  const responseBody = adapter.buildRecommendErrorBody({
    error,
    requestId: "request-2",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.error.code, "provider-http-error");
  assert.equal(responseBody.error.message, "Aishell 闽南语助手请求失败。");
  assert.equal(responseBody.error.stage, "listen");
  assert.equal(responseBody.error.retryable, true);
  assert.equal(responseBody.error.providerStatus, 500);
  assert.equal(responseBody.error.providerCode, "provider-error");
  assert.equal(responseBody.meta.requestId, "request-2");
});
