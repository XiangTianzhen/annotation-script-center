"use strict";

const assert = require("assert");
const test = require("node:test");

const service = require("./ai-service");

test("Aishell ai-service normalizes request into independent backend payload", function () {
  const normalized = service.normalizeRecommendRequest({
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "平台参考文本",
    existingMarkText: "已有标注",
    duration: 15.2,
    modelMode: "two_stage",
    listenModel: "fun-asr",
    compareModel: "qwen3.5-plus",
    batchRunId: "batch-1",
    batchItemIndex: 3,
    batchProcessKey: "item:item-1",
    clientRequestId: "client-1",
    frontConcurrency: 25,
    aiUsageOperatorName: "张三",
    platformUserName: "ASmnbz001",
    platformUserId: "user-1",
    aiOptions: {
      comparePrompt: "prompt",
    },
  });

  assert.equal(normalized.taskId, "task-1");
  assert.equal(normalized.packageId, "package-1");
  assert.equal(normalized.taskItemId, "item-1");
  assert.equal(normalized.duration, 15.2);
  assert.equal(normalized.modelMode, "two_stage");
  assert.equal(normalized.recognitionStrategy, "mandarin_to_dialect");
  assert.equal(normalized.pipelineMode, "fun_asr_compare");
  assert.equal(normalized.aiUsageOperatorName, "张三");
  assert.equal(normalized.platformUserName, "ASmnbz001");
  assert.equal(normalized.platformUserId, "user-1");
  assert.equal(normalized.listenModel, "fun-asr");
  assert.equal(normalized.compareModel, "qwen3.5-plus");
  assert.equal(normalized.clientRequestId, "client-1");
  assert.equal(normalized.dataBakerRequest, undefined);
  assert.ok(normalized.aiOptions.listenPrompt);
  assert.equal(normalized.aiOptions.comparePrompt, "prompt");
});

test("Aishell ai-service keeps direct dialect strategy and direct prompts", function () {
  const normalized = service.normalizeRecommendRequest({
    taskId: "task-2",
    packageId: "package-2",
    taskItemId: "item-2",
    fileName: "clip-2.wav",
    audioUrl: "https://example.com/audio-2.wav",
    referenceText: "页面预测闽南语文本",
    recognitionStrategy: "direct_dialect",
    aiOptions: {},
  });

  assert.equal(normalized.modelMode, "two_stage");
  assert.equal(normalized.recognitionStrategy, "direct_dialect");
  assert.equal(normalized.pipelineMode, "qwen_omni_compare");
  assert.match(normalized.aiOptions.listenPrompt, /闽南语/);
  assert.match(normalized.aiOptions.comparePrompt, /闽南语/);
});

test("Aishell ai-service default prompts require simplified chinese output", function () {
  const defaults = service.createDefaultsPayload();
  const mandarinProfile = defaults.defaults?.promptProfiles?.mandarin_to_dialect || {};
  const directProfile = defaults.defaults?.promptProfiles?.direct_dialect || {};

  assert.match(String(mandarinProfile.comparePrompt || ""), /简体/);
  assert.match(String(mandarinProfile.comparePrompt || ""), /recommendedText/);
  assert.match(String(directProfile.listenPrompt || ""), /简体/);
  assert.match(String(directProfile.comparePrompt || ""), /简体/);
});

test("Aishell ai-service forces thinking off even when request asks for true", function () {
  const normalized = service.normalizeRecommendRequest({
    taskId: "task-thinking",
    packageId: "package-thinking",
    taskItemId: "item-thinking",
    fileName: "thinking.wav",
    audioUrl: "https://example.com/thinking.wav",
    referenceText: "页面文本",
    enableThinking: true,
    aiOptions: {
      enable_thinking: true,
    },
  });

  assert.equal(normalized.enableThinking, false);
  assert.equal(normalized.aiOptions.enable_thinking, false);
});

test("Aishell ai-service builds success response with data and meta contract", function () {
  const responseBody = service.buildRecommendSuccessBody({
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
  assert.equal(responseBody.meta.cancelled, false);
});

test("Aishell ai-service builds error response with error and meta contract", function () {
  const error = new Error("Aishell 闽南语助手请求失败。");
  error.code = "provider-http-error";
  error.stage = "compare";
  error.requestId = "request-2";
  error.providerStatus = 500;
  error.providerCode = "provider-error";
  error.retryable = true;
  error.meta = {
    requestId: "request-2",
    timing: {
      totalDurationMs: 1200,
    },
  };

  const responseBody = service.buildRecommendErrorBody({
    error,
    requestId: "request-2",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.error.code, "provider-http-error");
  assert.equal(responseBody.error.message, "Aishell 闽南语助手请求失败。");
  assert.equal(responseBody.error.stage, "compare");
  assert.equal(responseBody.error.retryable, true);
  assert.equal(responseBody.error.providerStatus, 500);
  assert.equal(responseBody.error.providerCode, "provider-error");
  assert.equal(responseBody.meta.requestId, "request-2");
  assert.equal(responseBody.meta.timing.totalDurationMs, 1200);
});

test("Aishell ai-service exposes health and defaults payloads", function () {
  const health = service.createHealthPayload();
  const defaults = service.createDefaultsPayload();

  assert.equal(health.success, true);
  assert.equal(health.scriptId, service.SCRIPT_ID);
  assert.ok(Number(health.timeoutMs) >= 1000);
  assert.equal(health.recognitionStrategy, "mandarin_to_dialect");
  assert.ok(Array.isArray(health.recognitionStrategyOptions));
  assert.equal(health.queue?.groups?.qwen_omni?.name, "aishell_qwen_omni");
  assert.equal(defaults.success, true);
  assert.equal(defaults.scriptId, service.SCRIPT_ID);
  assert.ok(defaults.defaults);
  assert.ok(Array.isArray(defaults.defaults.listenModelOptions));
  assert.equal(defaults.defaults.modelMode, "two_stage");
  assert.equal(defaults.defaults.recognitionStrategy, "mandarin_to_dialect");
  assert.ok(Array.isArray(defaults.defaults.recognitionStrategyOptions));
  assert.match(String(defaults.defaults.listenPrompt || ""), /普通话/);
});
