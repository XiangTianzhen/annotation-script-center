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
    recognitionMode: "two_stage",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
    singleModel: "qwen3.5-omni-flash",
    enableThinking: false,
  });
  assert.equal(
    normalized.runtimeContext.normalizedRecommendRequest.taskItemId,
    "item-1"
  );
  assert.equal(
    normalized.runtimeContext.dataBakerRequest.collectId,
    "task-1"
  );
});

test("Aishell adapter builds recommend success body", function () {
  const responseBody = adapter.buildRecommendSuccessBody({
    normalizedRequest: {
      requestId: "request-1",
    },
    execution: {
      projectResult: {
        taskItemId: "item-1",
        recommendedText: "推荐文本",
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    requestId: "request-1",
    data: {
      taskItemId: "item-1",
      recommendedText: "推荐文本",
    },
  });
});

test("Aishell adapter builds recommend error body", function () {
  const error = new Error("Aishell 闽南语助手请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-2";
  error.providerStatus = 500;
  error.summary = "上游请求失败";

  const responseBody = adapter.buildRecommendErrorBody({
    error,
    requestId: "request-2",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-2");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.scriptId, adapter.scriptId);
  assert.equal(responseBody.providerStatus, 500);
  assert.equal(responseBody.summary, "上游请求失败");
});
