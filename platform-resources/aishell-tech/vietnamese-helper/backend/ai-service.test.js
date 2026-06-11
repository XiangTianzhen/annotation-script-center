"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
} = require("./ai-service");
const {
  createRecommendPipeline,
  normalizeVietnameseTranscriptionText,
} = require("./pipeline");

test("Aishell Vietnamese defaults expose single-stage Omni config", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};

  assert.equal(payload.success, true);
  assert.equal(defaults.singleModel, "qwen3.5-omni-flash");
  assert.equal(Array.isArray(defaults.singleModelOptions), true);
  assert.equal(defaults.stages?.recognize?.model, "qwen3.5-omni-flash");
  assert.match(defaults.singlePrompt || "", /越南语音频转写/);
  assert.equal(defaults.stages?.recognize?.prompt, defaults.singlePrompt);
  assert.equal(payload.supportedParams?.enable_thinking, false);
});

test("Aishell Vietnamese health payload exposes runtime and queue groups", function () {
  const payload = createHealthPayload();

  assert.equal(payload.success, true);
  assert.equal(payload.health?.scriptId, "aishellTechVietnameseAssistant");
  assert.equal(typeof payload.health?.timeoutMs, "number");
  assert.equal(typeof payload.health?.queueGroups, "object");
  assert.equal(Boolean(payload.health?.queueGroups?.qwen_omni), true);
  assert.equal(payload.defaults?.singleModel, "qwen3.5-omni-flash");
});

test("Aishell Vietnamese request normalization accepts only recognize stage", function () {
  const stopToken = "\\n\\n";
  const request = normalizeRecommendRequest({
    requestId: "req-1",
    taskId: "task-1",
    packageId: "package-1",
    taskItemId: "item-1",
    fileName: "1.wav",
    audioUrl: "https://example.com/audio.wav",
    referenceText: "Tiếng từ máy chiếu.",
    aiStages: {
      recognize: {
        model: "qwen3.5-omni-plus",
        prompt: "custom prompt",
        params: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 512,
          stop: [stopToken],
        },
      },
      compare: {
        model: "should-be-ignored",
      },
    },
  });

  assert.equal(request.modelMode, "omni_single");
  assert.equal(request.pipelineMode, "omni_single");
  assert.equal(request.recognitionStrategy, "vietnamese_transcription");
  assert.equal(request.singleModel, "qwen3.5-omni-plus");
  assert.equal(request.singlePrompt, "custom prompt");
  assert.deepEqual(request.aiStages, {
    recognize: {
      model: "qwen3.5-omni-plus",
      prompt: "custom prompt",
        params: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 512,
          stop: [stopToken],
        },
      },
    });
});

test("Aishell Vietnamese request normalization does not require referenceText", function () {
  const request = normalizeRecommendRequest({
    taskItemId: "item-2",
    audioUrl: "https://example.com/audio-2.wav",
    singleModel: "qwen3.5-omni-flash",
    aiOptions: {
      temperature: 0.2,
      max_tokens: 256,
    },
  });

  assert.equal(request.referenceText, "");
  assert.equal(request.singleModel, "qwen3.5-omni-flash");
  assert.equal(request.aiStages?.recognize?.params?.temperature, 0.2);
  assert.equal(request.aiStages?.recognize?.params?.max_tokens, 256);
});

test("Aishell Vietnamese text normalization keeps spaces and fixes punctuation", function () {
  assert.equal(
    normalizeVietnameseTranscriptionText("  Tiếng   từ máy chiếu  .  "),
    "Tiếng từ máy chiếu."
  );
  assert.equal(
    normalizeVietnameseTranscriptionText("Xin chào ,tôi là AI"),
    "Xin chào, tôi là AI."
  );
});

test("Aishell Vietnamese pipeline returns single-stage recognize result", async function () {
  const pipeline = createRecommendPipeline({
    enqueueTask: async function (groupName, task) {
      return {
        value: await task(),
        queueMeta: {
          groupName,
          queueWaitMs: 18,
          retryCount: 1,
          durationMs: 30,
          activeCount: 1,
          maxConcurrent: 4,
        },
      };
    },
    requestOmniInputAudio: async function () {
      return {
        rawText: "  Tiếng   từ máy chiếu  . ",
        usage: {
          prompt_tokens: 12,
          completion_tokens: 8,
          total_tokens: 20,
          prompt_tokens_details: {
            text_tokens: 2,
            audio_tokens: 10,
          },
        },
      };
    },
    createStageError: function (stage, error, meta) {
      const wrapped = error instanceof Error ? error : new Error(String(error || "失败"));
      wrapped.stage = stage;
      wrapped.meta = meta;
      return wrapped;
    },
  });

  const result = await pipeline.run(
    normalizeRecommendRequest({
      requestId: "req-3",
      taskId: "task-3",
      packageId: "package-3",
      taskItemId: "item-3",
      audioUrl: "https://example.com/audio-3.wav",
      referenceText: "",
    }),
    {
      requestId: "req-3",
      startedAtMs: Date.now() - 50,
      timeoutMs: 60000,
    }
  );

  assert.equal(result.recommendedText, "Tiếng từ máy chiếu.");
  assert.equal(result.meta?.models?.pipelineMode, "omni_single");
  assert.equal(result.meta?.models?.recognizeModel, "qwen3.5-omni-flash");
  assert.equal(result.meta?.usage?.promptTokens, 12);
  assert.equal(result.meta?.usage?.completionTokens, 8);
  assert.equal(result.meta?.usage?.totalTokens, 20);
  assert.equal(result.meta?.usage?.raw?.prompt_tokens_details?.audio_tokens, 10);
  assert.equal(result.meta?.cost?.recognize?.pricingStatus, "estimated");
  assert.equal(result.meta?.cost?.totalEstimatedCostCny, 0.000291);
  assert.equal(result.meta?.queue?.totalQueueWaitMs, 18);
  assert.deepEqual(result.meta?.queue?.groups, ["aishell_qwen_omni"]);
  assert.equal(result.meta?.retryCount, 1);
});
