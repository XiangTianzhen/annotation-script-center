"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("Minnan adapter normalizes review request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    taskItemId: "task-1",
    samplingRecordId: "sample-1",
    audioUrl: "https://example.com/audio.wav",
    platformDialectText: "台语文本",
    platformMandarinText: "普通话文本",
    modelMode: "two_stage",
    recognitionStrategy: "direct_dialect",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
  });

  assert.deepEqual(normalized.input, {
    taskItemId: "task-1",
    samplingRecordId: "sample-1",
    audioUrl: "https://example.com/audio.wav",
    platformDialectText: "台语文本",
    platformMandarinText: "普通话文本",
    recognitionMode: "two_stage",
  });
  assert.equal(normalized.projectOptions.modelMode, "two_stage");
  assert.equal(normalized.projectOptions.recognitionStrategy, "direct_dialect");
  assert.equal(normalized.projectOptions.listenModel, "fun-asr");
  assert.equal(normalized.projectOptions.compareModel, "qwen3.5-plus");
  assert.equal(
    normalized.runtimeContext.normalizedReviewRequest.taskItemId,
    "task-1"
  );
});

test("Minnan adapter builds legacy success body", function () {
  const responseBody = adapter.buildReviewSuccessBody({
    execution: {
      pipelineResult: {
        data: {
          overall: {
            summary: "正常",
          },
        },
        cache: {
          hit: false,
        },
        backend: {
          baseUrl: "https://dashscope.aliyuncs.com",
        },
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    data: {
      overall: {
        summary: "正常",
      },
    },
    cache: {
      hit: false,
    },
    backend: {
      baseUrl: "https://dashscope.aliyuncs.com",
    },
  });
});

test("Minnan adapter builds legacy error body", function () {
  const error = new Error("Magic Data 闽南语助手请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-8";
  error.summary = "上游请求失败";

  const responseBody = adapter.buildReviewErrorBody({
    error,
    requestId: "request-8",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-8");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.scriptId, adapter.scriptId);
  assert.equal(responseBody.summary, "上游请求失败");
});
