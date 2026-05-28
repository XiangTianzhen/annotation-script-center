"use strict";

const assert = require("assert");
const test = require("node:test");

const service = require("./ai-service");

test("Aishell ai-service normalizes request and maps to DataBaker recommend payload", function () {
  const normalized = service.normalizeRecommendRequest({
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "clip-1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "平台参考文本",
    existingMarkText: "已有标注",
    duration: 15.2,
    recognitionMode: "two_stage",
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
  assert.equal(normalized.recognitionMode, "recognition_convert");
  assert.equal(normalized.aiUsageOperatorName, "张三");
  assert.equal(normalized.platformUserName, "ASmnbz001");
  assert.equal(normalized.platformUserId, "user-1");
  assert.equal(normalized.dataBakerRequest.collectId, "task-1");
  assert.equal(normalized.dataBakerRequest.itemId, "item-1");
  assert.equal(normalized.dataBakerRequest.textId, "package-1");
  assert.equal(normalized.dataBakerRequest.pageText, "平台参考文本");
  assert.equal(normalized.dataBakerRequest.annotatorName, "ASmnbz001");
  assert.equal(normalized.dataBakerRequest.aiUsageOperatorName, "张三");
  assert.equal(normalized.dataBakerRequest.platformUserName, "ASmnbz001");
  assert.equal(normalized.dataBakerRequest.platformUserId, "user-1");
  assert.equal(normalized.dataBakerRequest.recognitionMode, "two_stage");
  assert.equal(normalized.dataBakerRequest.batchRunId, "batch-1");
  assert.equal(normalized.dataBakerRequest.batchItemIndex, 3);
  assert.equal(normalized.dataBakerRequest.batchProcessKey, "item:item-1");
  assert.equal(normalized.dataBakerRequest.clientRequestId, "client-1");
  assert.ok(normalized.dataBakerRequest.aiOptions.listenPrompt);
  assert.ok(normalized.dataBakerRequest.aiOptions.comparePrompt);
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
  assert.equal(normalized.recognitionMode, "two_stage");
  assert.equal(normalized.dataBakerRequest.recognitionMode, "two_stage");
  assert.match(normalized.dataBakerRequest.aiOptions.listenPrompt, /闽南语/);
  assert.match(normalized.dataBakerRequest.aiOptions.comparePrompt, /闽南语/);
});

test("Aishell ai-service reshapes DataBaker result into recommend response body", function () {
  const transformed = service.transformRecommendResult(
    {
      requestId: "request-1",
      heardText: "阮爱你。",
      recommendedText: "阮爱你。",
      isChanged: true,
      needHumanReview: false,
      decision: "use_heard_text",
      changePoints: [{ summary: "按实际发声修正" }],
      model: {
        listen: "fun-asr",
        compare: "qwen3.5-plus",
      },
      modelSelection: {
        recognitionMode: "two_stage",
        singleModel: "",
        funAsrProvider: "rest",
      },
      usage: {
        totalTokens: 123,
        promptTokens: 100,
        completionTokens: 23,
      },
      timing: {
        listenDurationMs: 1000,
        compareDurationMs: 900,
        totalDurationMs: 2100,
      },
      runtime: {
        cache: {
          hit: false,
          sourceRequestId: "",
        },
        queue: {
          groups: [{ groupName: "fun_asr" }],
          totalQueueWaitMs: 30,
          totalRetryCount: 0,
        },
        concurrencyDiagnostic: {
          frontConcurrencyOriginal: 25,
          frontConcurrencyNormalized: 25,
          concurrencyModelType: "fun_asr",
        },
        funAsrProvider: "rest",
      },
      lexicon: {
        enabled: true,
        rewriteMode: "aggressive",
        rewriteChanged: false,
        matchedCount: 2,
        rewriteChanges: [],
      },
    },
    {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "clip-1.wav",
      referenceText: "我爱你。",
      existingMarkText: "",
      audioUrl: "https://example.com/audio.wav?signature=secret",
    }
  );

  assert.equal(transformed.taskItemId, "item-1");
  assert.equal(transformed.heardText, "阮爱你。");
  assert.equal(transformed.recommendedText, "阮爱你。");
  assert.equal(transformed.referenceText, "我爱你。");
  assert.equal(transformed.models.listenModel, "fun-asr");
  assert.equal(transformed.models.compareModel, "qwen3.5-plus");
  assert.equal(transformed.usage.totalTokens, 123);
  assert.equal(transformed.timing.totalDurationMs, 2100);
  assert.equal(transformed.debug.audioUrl, "https://example.com/<redacted>/audio.wav");
});

test("Aishell ai-service exposes health and defaults payloads", function () {
  const health = service.createHealthPayload();
  const defaults = service.createDefaultsPayload();

  assert.equal(health.success, true);
  assert.equal(health.scriptId, service.SCRIPT_ID);
  assert.ok(Number(health.timeoutMs) >= 1000);
  assert.equal(health.recognitionStrategy, "mandarin_to_dialect");
  assert.ok(Array.isArray(health.recognitionStrategyOptions));
  assert.equal(defaults.success, true);
  assert.equal(defaults.scriptId, service.SCRIPT_ID);
  assert.ok(defaults.defaults);
  assert.ok(Array.isArray(defaults.defaults.listenModelOptions));
  assert.equal(defaults.defaults.modelMode, "two_stage");
  assert.equal(defaults.defaults.recognitionStrategy, "mandarin_to_dialect");
  assert.ok(Array.isArray(defaults.defaults.recognitionStrategyOptions));
  assert.match(String(defaults.defaults.listenPrompt || ""), /普通话/);
});
