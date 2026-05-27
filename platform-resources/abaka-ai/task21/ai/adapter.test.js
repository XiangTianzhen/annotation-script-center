"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

function restoreEnv(name, value) {
  if (typeof value === "string") {
    process.env[name] = value;
    return;
  }
  delete process.env[name];
}

test("Task21 adapter normalizes analyze request into framework payload", function () {
  const originalEnv = {
    allowClientModelOverride: process.env.ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE,
    allowedVisionModels: process.env.ABAKA_TASK21_AI_ALLOWED_VISION_MODELS,
    allowedOcrModels: process.env.ABAKA_TASK21_AI_ALLOWED_OCR_MODELS,
    allowedReasoningModels: process.env.ABAKA_TASK21_AI_ALLOWED_REASONING_MODELS,
    allowedSingleModels: process.env.ABAKA_TASK21_AI_ALLOWED_SINGLE_MODELS,
  };

  process.env.ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE = "true";
  process.env.ABAKA_TASK21_AI_ALLOWED_VISION_MODELS = "qwen3.6-plus";
  process.env.ABAKA_TASK21_AI_ALLOWED_OCR_MODELS = "qwen3-vl-flash";
  process.env.ABAKA_TASK21_AI_ALLOWED_REASONING_MODELS = "qwen3.5-flash";
  process.env.ABAKA_TASK21_AI_ALLOWED_SINGLE_MODELS = "qwen3.6-flash";

  try {
    const normalized = adapter.normalizeInput({
      target: "overall",
      debug: true,
      context: {
        imageATexts: "A",
        imageBTexts: "B",
        targetRemovalTextHints: ["TEXT_A"],
        currentValues: {
          same_font: "true",
        },
        route: {
          taskId: "task-21",
        },
      },
      images: [
        {
          fieldName: "image_a",
          dataUrl: "data:image/png;base64,AAA",
        },
        {
          fieldName: "image_b",
          imageUrl: "https://example.com/b.png",
        },
        {
          fieldName: "image_b_removed",
          imageUrl: "https://example.com/c.png",
        },
      ],
      options: {
        analysisMode: "two_stage",
        visionModel: "qwen3.6-plus",
        ocrEnabled: true,
        ocrModel: "qwen3-vl-flash",
        reasoningModel: "qwen3.5-flash",
        singleModel: "qwen3.6-flash",
        enableThinking: false,
        timeoutMs: 45000,
      },
    });

    assert.equal(normalized.input.target, "overall");
    assert.equal(normalized.input.debug, true);
    assert.equal(normalized.input.context.imageATexts, "A");
    assert.equal(normalized.input.context.imageBTexts, "B");
    assert.equal(normalized.input.context.route.taskId, "task-21");
    assert.equal(normalized.input.images.length, 3);
    assert.equal(normalized.input.images[0].fieldName, "image_a");
    assert.equal(normalized.input.images[1].fieldName, "image_b");
    assert.equal(normalized.input.images[2].fieldName, "image_b_removed");
    assert.equal(normalized.projectOptions.analysisMode, "two_stage");
    assert.equal(normalized.projectOptions.visionModel, "qwen3.6-plus");
    assert.equal(normalized.projectOptions.ocrEnabled, true);
    assert.equal(normalized.projectOptions.ocrModel, "qwen3-vl-flash");
    assert.equal(normalized.projectOptions.reasoningModel, "qwen3.5-flash");
    assert.equal(normalized.projectOptions.singleModel, "qwen3.6-flash");
    assert.equal(normalized.projectOptions.enableThinking, false);
    assert.equal(normalized.projectOptions.timeoutMs, 45000);
    assert.equal(normalized.projectOptions.allowClientModelOverride, true);
  } finally {
    restoreEnv(
      "ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE",
      originalEnv.allowClientModelOverride
    );
    restoreEnv("ABAKA_TASK21_AI_ALLOWED_VISION_MODELS", originalEnv.allowedVisionModels);
    restoreEnv("ABAKA_TASK21_AI_ALLOWED_OCR_MODELS", originalEnv.allowedOcrModels);
    restoreEnv(
      "ABAKA_TASK21_AI_ALLOWED_REASONING_MODELS",
      originalEnv.allowedReasoningModels
    );
    restoreEnv("ABAKA_TASK21_AI_ALLOWED_SINGLE_MODELS", originalEnv.allowedSingleModels);
  }
});

test("Task21 adapter builds legacy success body", function () {
  const responseBody = adapter.buildAnalyzeSuccessBody({
    execution: {
      pipelineResult: {
        requestId: "req-1",
        target: "same_font",
        analysisMode: "two_stage",
        result: {
          same_font: {
            choice: "true",
          },
        },
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    requestId: "req-1",
    target: "same_font",
    analysisMode: "two_stage",
    result: {
      same_font: {
        choice: "true",
      },
    },
  });
});

test("Task21 adapter builds legacy error body", function () {
  const error = new Error("Task21 AI analyze 请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-8";
  error.summary = "上游请求失败";
  error.elapsedMs = 1234;

  const responseBody = adapter.buildAnalyzeErrorBody({
    error,
    requestId: "request-8",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-8");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.message, "Task21 AI analyze 请求失败。");
  assert.equal(responseBody.summary, "上游请求失败");
  assert.equal(responseBody.elapsedMs, 1234);
});
