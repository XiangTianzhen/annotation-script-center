"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("Hakka adapter normalizes review request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    pageType: "asrmarkCheck",
    taskItemId: "task-1",
    samplingRecordId: "sample-1",
    audioUrl: "https://example.com/audio.wav",
    platformDialectText: "客家话文本",
    platformMandarinText: "普通话文本",
    modelMode: "two_stage",
    recognitionStrategy: "direct_dialect",
    listenModel: "qwen3.5-omni-flash",
    compareModel: "qwen3.5-flash",
    speaker: {
      gender: "female",
      ageRange: "adult",
    },
  });

  assert.deepEqual(normalized.input, {
    pageType: "asrmarkCheck",
    taskItemId: "task-1",
    samplingRecordId: "sample-1",
    projectName: "",
    audioUrl: "https://example.com/audio.wav",
    audioDuration: null,
    effectiveStartTime: null,
    effectiveEndTime: null,
    effectiveTime: null,
    platformDialectText: "客家话文本",
    platformMandarinText: "普通话文本",
    speaker: {
      gender: "female",
      ageRange: "adult",
    },
    recognitionMode: "two_stage",
    reviewMode: "rule_first",
  });
  assert.equal(normalized.projectOptions.modelMode, "two_stage");
  assert.equal(normalized.projectOptions.recognitionStrategy, "direct_dialect");
  assert.equal(normalized.projectOptions.listenModel, "qwen3.5-omni-flash");
  assert.equal(normalized.projectOptions.compareModel, "qwen3.5-flash");
  assert.equal(
    normalized.runtimeContext.normalizedReviewRequest.taskItemId,
    "task-1"
  );
});

test("Hakka adapter builds legacy success body", function () {
  const responseBody = adapter.buildReviewSuccessBody({
    execution: {
      pipelineResult: {
        data: {
          overall: {
            summary: "正常",
          },
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
  });
});

test("Hakka adapter builds legacy error body", function () {
  const error = new Error("Magic Data AI review-current 请求失败。");
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
  assert.equal(responseBody.message, "Magic Data AI review-current 请求失败。");
  assert.equal(responseBody.summary, "上游请求失败");
  assert.equal("scriptId" in responseBody, false);
});
