"use strict";

const assert = require("assert");
const test = require("node:test");

const { createRecommendPipeline } = require("./pipeline");

function createNormalizedRequest(overrides) {
  return Object.assign(
    {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "clip-1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "平台参考文本",
      existingMarkText: "",
      itemNumber: 1,
      duration: 15.2,
      modelMode: "two_stage",
      pipelineMode: "qwen_omni_compare",
      recognitionStrategy: "mandarin_to_dialect",
      listenModel: "qwen3.5-omni-flash",
      compareModel: "qwen3.5-plus",
      singleModel: "qwen3.5-omni-flash",
      aiOptions: {
        listenPrompt: "listen prompt",
        comparePrompt: "compare prompt",
      },
      frontConcurrency: 15,
      concurrencyModelType: "omni",
    },
    overrides || {}
  );
}

test("Aishell pipeline returns independent success contract for two-stage requests", async function () {
  const queueCalls = [];
  const listenOptions = [];
  const compareOptions = [];
  const pipeline = createRecommendPipeline({
    enqueueTask: async function enqueueTask(groupName, task) {
      queueCalls.push(groupName);
      return {
        value: await task(),
        queueMeta: {
          groupName,
          queueWaitMs: 15,
          retryCount: 0,
          activeCount: 1,
          maxConcurrent: 2,
        },
      };
    },
    requestOmniInputAudio: async function requestOmniInputAudio(_input, _prompt, options) {
      listenOptions.push(options);
      return {
        model: "qwen3.5-omni-flash",
        rawText: JSON.stringify({
          heardText: "阮爱你。",
          confidence: 0.92,
          needHumanReview: false,
        }),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          total_tokens: 120,
        },
      };
    },
    requestCompare: async function requestCompare(_input, _prompt, _heardText, options) {
      compareOptions.push(options);
      return {
        model: "qwen3.5-plus",
        rawText: JSON.stringify({
          recommendedText: "阮爱你。",
          decision: "use_heard_text",
          changePoints: ["按实际发声修正"],
          confidence: 0.91,
          needHumanReview: false,
        }),
        usage: {
          prompt_tokens: 80,
          completion_tokens: 30,
          total_tokens: 110,
        },
      };
    },
    buildLexiconContext: function buildLexiconContext() {
      return {
        enabled: true,
        matchedCount: 2,
        items: [],
        text: "词表上下文",
      };
    },
    buildListenPrompt: function buildListenPrompt() {
      return {
        systemPrompt: "listen system",
        userPrompt: "listen user",
      };
    },
    buildComparePrompt: function buildComparePrompt() {
      return {
        systemPrompt: "compare system",
        userPrompt: "compare user",
      };
    },
    parseModelJsonText: function parseModelJsonText(text) {
      return JSON.parse(text);
    },
    normalizeListenResponse: function normalizeListenResponse(modelJson) {
      return modelJson;
    },
    normalizeCompareResponse: function normalizeCompareResponse(modelJson) {
      return modelJson;
    },
    normalizeUsage: function normalizeUsage(usage) {
      return {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        raw: usage,
      };
    },
    normalizeRecommendedText: function normalizeRecommendedText(text) {
      return text;
    },
    applyLexiconRewrite: function applyLexiconRewrite(text) {
      return {
        text,
        changed: false,
        changes: [],
      };
    },
    now: (function () {
      let current = 1000;
      return function now() {
        current += 100;
        return current;
      };
    })(),
  });

  const result = await pipeline.run(createNormalizedRequest({
    enableThinking: true,
    aiOptions: {
      listenPrompt: "listen prompt",
      comparePrompt: "compare prompt",
      enable_thinking: true,
    },
  }), {
    requestId: "request-1",
    signal: null,
  });

  assert.deepEqual(queueCalls, ["aishell_qwen_omni", "aishell_text_compare"]);
  assert.equal(listenOptions[0]?.enableThinking, false);
  assert.equal(compareOptions[0]?.enableThinking, false);
  assert.equal(result.data.recommendedText, "阮爱你。");
  assert.equal(result.meta.requestId, "request-1");
  assert.equal(result.meta.stage, "complete");
  assert.equal(result.meta.models.listenModel, "qwen3.5-omni-flash");
  assert.equal(result.meta.models.compareModel, "qwen3.5-plus");
  assert.equal(result.meta.queue.totalQueueWaitMs, 30);
  assert.equal(result.meta.retryCount, 0);
  assert.equal(result.meta.cancelled, false);
  assert.equal(result.cacheEntry.key.length > 10, true);
});

test("Aishell pipeline maps aborted listen stage to retry-disabled error", async function () {
  const abortError = new Error("当前任务超过60s，请重新请求。");
  abortError.code = "aborted";
  abortError.statusCode = 504;

  const pipeline = createRecommendPipeline({
    enqueueTask: async function enqueueTask(groupName, task) {
      void groupName;
      return {
        value: await task(),
        queueMeta: {
          groupName: "aishell_qwen_omni",
          queueWaitMs: 0,
          retryCount: 0,
          activeCount: 1,
          maxConcurrent: 2,
        },
      };
    },
    requestOmniInputAudio: async function requestOmniInputAudio() {
      throw abortError;
    },
    requestCompare: async function requestCompare() {
      throw new Error("should not run");
    },
    buildLexiconContext: function buildLexiconContext() {
      return { enabled: false, matchedCount: 0, items: [], text: "" };
    },
    buildListenPrompt: function buildListenPrompt() {
      return { systemPrompt: "listen system", userPrompt: "listen user" };
    },
    buildComparePrompt: function buildComparePrompt() {
      return { systemPrompt: "compare system", userPrompt: "compare user" };
    },
    parseModelJsonText: JSON.parse,
    normalizeListenResponse: function normalizeListenResponse(modelJson) {
      return modelJson;
    },
    normalizeCompareResponse: function normalizeCompareResponse(modelJson) {
      return modelJson;
    },
    normalizeUsage: function normalizeUsage() {
      return {};
    },
    normalizeRecommendedText: function normalizeRecommendedText(text) {
      return text;
    },
    applyLexiconRewrite: function applyLexiconRewrite(text) {
      return { text, changed: false, changes: [] };
    },
  });

  await assert.rejects(
    pipeline.run(createNormalizedRequest(), {
      requestId: "request-2",
      signal: null,
    }),
    function (error) {
      assert.equal(error.code, "aborted");
      assert.equal(error.stage, "listen");
      assert.equal(error.retryable, false);
      assert.equal(error.meta.requestId, "request-2");
      return true;
    }
  );
});
