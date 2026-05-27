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
    aiOptions: {
      comparePrompt: "prompt",
    },
  });

  assert.equal(normalized.taskId, "task-1");
  assert.equal(normalized.packageId, "package-1");
  assert.equal(normalized.taskItemId, "item-1");
  assert.equal(normalized.duration, 15.2);
  assert.equal(normalized.dataBakerRequest.collectId, "task-1");
  assert.equal(normalized.dataBakerRequest.itemId, "item-1");
  assert.equal(normalized.dataBakerRequest.textId, "package-1");
  assert.equal(normalized.dataBakerRequest.pageText, "平台参考文本");
  assert.equal(normalized.dataBakerRequest.batchRunId, "batch-1");
  assert.equal(normalized.dataBakerRequest.batchItemIndex, 3);
  assert.equal(normalized.dataBakerRequest.batchProcessKey, "item:item-1");
  assert.equal(normalized.dataBakerRequest.clientRequestId, "client-1");
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
  assert.equal(defaults.success, true);
  assert.equal(defaults.scriptId, service.SCRIPT_ID);
  assert.ok(defaults.defaults);
  assert.ok(Array.isArray(defaults.defaults.listenModelOptions));
});
