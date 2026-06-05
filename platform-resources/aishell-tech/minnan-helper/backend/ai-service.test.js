"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  createDefaultsPayload,
  createHealthPayload,
  normalizeRecommendRequest,
} = require("./ai-service");
const { normalizeRecognitionStrategy } = require("./config");
const { createRecommendPipeline } = require("./pipeline");
const {
  parseLexiconCsv,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const aishellLexiconPath = path.join(__dirname, "reference", "minnan-lexicon.csv");

function createDeferred() {
  let resolve = null;
  let reject = null;
  const promise = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

function createBaseRequest(overrides) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return Object.assign(
    {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "路况良好，主要是高速和省道，跟着导航走即可。",
      existingMarkText: "",
      duration: 1800,
      itemNumber: 1,
      recognitionStrategy: "audio_first_reference",
      frontConcurrency: 5,
      concurrencyModelType: "omni",
      aiStages: {
        convert: {
          model: "qwen3.5-plus",
          prompt: "convert-prompt",
          params: {},
        },
        listen: {
          model: "fun-asr",
          prompt: "listen-prompt",
          params: {},
        },
        compare: {
          family: "qwen",
          model: "qwen3.5-plus",
          prompt: "compare-prompt",
          params: {},
          adoptionThreshold: 0.75,
        },
      },
      convertModel: "qwen3.5-plus",
      listenModel: "fun-asr",
      compareFamily: "qwen",
      compareModel: "qwen3.5-plus",
      modelMode: "three_stage_parallel",
      pipelineMode: "fun_asr_text_compare",
    },
    source
  );
}

test("Aishell defaults expose standalone convert/listen/compare stages", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};

  assert.equal(defaults.modelMode, "three_stage_parallel");
  assert.equal(defaults.recognitionStrategy, "audio_first_reference");
  assert.equal(defaults.stages?.convert?.model, "qwen3.5-plus");
  assert.equal(defaults.stages?.listen?.model, "qwen3.5-omni-flash");
  assert.equal(defaults.stages?.compare?.family, "qwen");
  assert.equal(defaults.stages?.compare?.qwenModel, "qwen3.5-plus");
  assert.equal(defaults.stages?.compare?.omniModel, "qwen3.5-omni-flash");
  assert.equal(defaults.stages?.compare?.adoptionThreshold, 0.75);
  assert.equal(defaults.compareFamily, "qwen");
  assert.equal(defaults.compareModel, "qwen3.5-plus");
  assert.equal(defaults.promptProfiles, undefined);
  assert.equal(defaults.modelModeOptions, undefined);
  assert.equal(defaults.recognitionStrategyOptions, undefined);
});

test("Aishell health and defaults expose stage defaults instead of model方案", function () {
  const defaultsPayload = createDefaultsPayload();
  const healthPayload = createHealthPayload();

  assert.equal(defaultsPayload.defaults?.stages?.compare?.adoptionThreshold, 0.75);
  assert.equal(healthPayload.stages?.compare?.adoptionThreshold, 0.75);
  assert.equal(healthPayload.compareFamily, "qwen");
  assert.equal(
    Array.isArray(healthPayload.stages?.compare?.familyOptions),
    true
  );
});

test("Aishell config normalizes legacy recognition strategies to audio-first", function () {
  assert.equal(
    normalizeRecognitionStrategy("audio_first_reference", "mandarin_to_dialect"),
    "audio_first_reference"
  );
  assert.equal(
    normalizeRecognitionStrategy("mandarin_to_dialect", "audio_first_reference"),
    "audio_first_reference"
  );
  assert.equal(
    normalizeRecognitionStrategy("direct_dialect", "audio_first_reference"),
    "audio_first_reference"
  );
});

test("Aishell normalizeRecommendRequest maps aiStages into standalone stage config", function () {
  const request = normalizeRecommendRequest({
    taskId: "task-2",
    packageId: "package-2",
    taskItemId: "item-2",
    fileName: "2.wav",
    audioUrl: "https://example.com/audio-2.wav",
    referenceText: "请把命中的词替换成闽南语写法。",
    aiStages: {
      convert: {
        model: "qwen3.6-plus",
        prompt: "convert prompt",
        params: {
          temperature: 0.2,
        },
      },
      listen: {
        model: "fun-asr",
        prompt: "listen prompt",
        params: {
          top_p: 0.9,
        },
      },
      compare: {
        family: "omni",
        model: "qwen3.5-omni-flash",
        prompt: "omni compare prompt",
        params: {
          max_tokens: 256,
        },
        adoptionThreshold: 0.812,
      },
    },
  });

  assert.equal(request.convertModel, "qwen3.6-plus");
  assert.equal(request.listenModel, "fun-asr");
  assert.equal(request.compareFamily, "omni");
  assert.equal(request.compareModel, "qwen3.5-omni-flash");
  assert.equal(request.pipelineMode, "fun_asr_omni_compare");
  assert.equal(request.aiStages?.convert?.params?.temperature, 0.2);
  assert.equal(request.aiStages?.listen?.params?.top_p, 0.9);
  assert.equal(request.aiStages?.compare?.params?.max_tokens, 256);
  assert.equal(request.aiStages?.compare?.adoptionThreshold, 0.812);
});

test("Aishell convert/qwen/omni prompts are split and convert prompt enforces strict replacement", function () {
  const defaults = createDefaultsPayload().defaults || {};

  assert.match(defaults.stages?.convert?.prompt || "", /保留 pageText 原文/);
  assert.match(defaults.stages?.convert?.prompt || "", /不要强行转换/);
  assert.match(defaults.stages?.convert?.prompt || "", /convertedText/);
  assert.match(defaults.stages?.compare?.qwenPrompt || "", /convertedText/);
  assert.match(defaults.stages?.compare?.qwenPrompt || "", /convertPairs/);
  assert.match(defaults.stages?.compare?.omniPrompt || "", /再次听音频/);
});

test("Aishell pipeline runs convert and listen in parallel before qwen compare", async function () {
  let currentNow = 1000;
  let qwenCallCount = 0;
  let compareStarted = false;
  const convertDeferred = createDeferred();
  const listenDeferred = createDeferred();
  const stageOrder = [];

  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 5;
      return currentNow;
    },
    enqueueTask: async function (groupName, task) {
      stageOrder.push(groupName);
      return {
        value: await task(),
        queueMeta: {
          groupName,
          queueWaitMs: 0,
          retryCount: 0,
          durationMs: 0,
          activeCount: 1,
          maxConcurrent: 4,
        },
      };
    },
    requestFunAsrRecognition: async function () {
      return listenDeferred.promise;
    },
    requestCompare: async function (_providerInput, prompt, _comparisonText, options) {
      qwenCallCount += 1;
      if (qwenCallCount === 1) {
        return convertDeferred.promise;
      }
      compareStarted = true;
      assert.match(prompt?.userPrompt || "", /convertedText/);
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-plus"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      if (options?.stage === "convert") {
        return {
          convertedText: "路况良好，主要是高速甲省道，甲着导航行即可。",
          confidence: 0.88,
          needHumanReview: false,
        };
      }
      return {
        recommendedText: "路况良好，主要是高速同省道，甲导航行即可。",
        decision: "use_heard_text",
        changePoints: [],
        confidence: 0.86,
        needHumanReview: false,
        correctionConfidence: 0.61,
        candidateDecisions: [
          {
            sourceText: "和",
            candidateText: "甲",
            heardFragment: "同",
            applyCandidate: false,
            confidence: 0.61,
            reason: "音频证据不足，保留听音文本。",
          },
        ],
      };
    },
    normalizeCompareResponse: function (modelJson) {
      return {
        recommendedText: modelJson.recommendedText,
        decision: modelJson.decision,
        changePoints: modelJson.changePoints,
        confidence: modelJson.confidence,
        needHumanReview: modelJson.needHumanReview,
      };
    },
    normalizeConvertResponse: function (modelJson) {
      return {
        convertedText: modelJson.convertedText,
        confidence: modelJson.confidence,
        needHumanReview: modelJson.needHumanReview,
      };
    },
    applyLexiconRewrite: function (text, options) {
      assert.equal(options?.mode, "off");
      return {
        text,
        changed: false,
        changes: [],
      };
    },
    normalizeUsage: function (value) {
      return value && typeof value === "object" ? value : {};
    },
  });

  const runPromise = pipeline.run(
    createBaseRequest({
      listenModel: "fun-asr",
      compareFamily: "qwen",
      compareModel: "qwen3.5-plus",
      pipelineMode: "fun_asr_text_compare",
      concurrencyModelType: "fun-asr",
    }),
    {
      requestId: "req-parallel-qwen",
      startedAtMs: 1000,
      timeoutMs: 60000,
    }
  );

  await Promise.resolve();
  assert.equal(compareStarted, false);

  convertDeferred.resolve({
    rawText: "{}",
    model: "qwen3.5-plus",
    usage: {},
  });
  await Promise.resolve();
  assert.equal(compareStarted, false);

  listenDeferred.resolve({
    heardText: "路况良好，主要是高速同省道，甲导航行即可。",
    confidence: 0.93,
    usage: {},
  });

  const result = await runPromise;

  assert.equal(compareStarted, true);
  assert.equal(result.data?.convertedText, "路况良好，主要是高速甲省道，甲着导航行即可。");
  assert.equal(result.data?.recommendedText, "路况良好，主要是高速同省道，甲导航行即可。");
  assert.equal(result.data?.needHumanReview, true);
  assert.equal(result.meta?.models?.convertModel, "qwen3.5-plus");
  assert.equal(result.meta?.models?.listenModel, "fun-asr");
  assert.equal(result.meta?.models?.compareModelFamily, "qwen");
  assert.equal(result.meta?.models?.compareModel, "qwen3.5-plus");
  assert.equal(typeof result.meta?.timing?.convertDurationMs, "number");
  assert.deepEqual(Object.keys(result.meta?.usage || {}).includes("convert"), true);
  assert.equal(qwenCallCount, 2);
  assert.deepEqual(stageOrder.slice(0, 2), ["aishell_text_compare", "aishell_fun_asr"]);
});

test("Aishell omni compare re-reads audio after the standalone listen stage", async function () {
  let currentNow = 2000;
  let qwenCallCount = 0;
  let omniCallCount = 0;
  const parseStages = [];
  const prompts = [];

  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 7;
      return currentNow;
    },
    enqueueTask: async function (groupName, task) {
      return {
        value: await task(),
        queueMeta: {
          groupName,
          queueWaitMs: 0,
          retryCount: 0,
          durationMs: 0,
          activeCount: 1,
          maxConcurrent: 4,
        },
      };
    },
    requestCompare: async function (_providerInput, prompt, _comparisonText, options) {
      qwenCallCount += 1;
      prompts.push(prompt);
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-plus"),
        usage: {},
      };
    },
    requestOmniInputAudio: async function (_providerInput, prompt, options) {
      omniCallCount += 1;
      prompts.push(prompt);
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-omni-flash"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      if (options?.stage === "convert") {
        return {
          convertedText: "路况良好，主要是高速甲省道，甲着导航行即可。",
          confidence: 0.9,
          needHumanReview: false,
        };
      }
      if (options?.stage === "listen") {
        return {
          heardText: "路况良好，主要是高速佮省道，缀着导航行即可。",
          confidence: 0.91,
          needHumanReview: false,
        };
      }
      return {
        heardText: "路况良好，主要是高速佮省道，缀着导航行即可。",
        recommendedText: "路况良好，主要是高速甲省道，缀着导航行即可。",
        decision: "use_mixed_segments",
        changePoints: ["第一个差异项采用转换文本，第二个差异项保留听音文本。"],
        confidence: 0.93,
        needHumanReview: false,
        correctionConfidence: 0.93,
        candidateDecisions: [
          {
            sourceText: "和",
            candidateText: "甲",
            heardFragment: "佮",
            applyCandidate: true,
            confidence: 0.93,
            reason: "发音接近，采用转换文本。",
          },
        ],
      };
    },
    applyLexiconRewrite: function (text, options) {
      assert.equal(options?.mode, "off");
      return {
        text,
        changed: false,
        changes: [],
      };
    },
    normalizeUsage: function (value) {
      return value && typeof value === "object" ? value : {};
    },
  });

  const result = await pipeline.run(
    createBaseRequest({
      listenModel: "qwen3.5-omni-flash",
      compareFamily: "omni",
      compareModel: "qwen3.5-omni-flash",
      pipelineMode: "omni_omni_compare",
    }),
    {
      requestId: "req-omni-compare",
      startedAtMs: 2000,
      timeoutMs: 60000,
    }
  );

  assert.equal(qwenCallCount, 1);
  assert.equal(omniCallCount, 2);
  assert.match(prompts[2]?.userPrompt || "", /convertedText/);
  assert.equal(result.data?.convertedText, "路况良好，主要是高速甲省道，甲着导航行即可。");
  assert.equal(result.data?.recommendedText, "路况良好，主要是高速甲省道，缀着导航行即可。");
  assert.equal(result.meta?.models?.compareModelFamily, "omni");
  assert.equal(result.meta?.models?.compareModel, "qwen3.5-omni-flash");
  assert.deepEqual(parseStages, ["convert", "listen", "omni_compare"]);
});

test("Aishell Minnan lexicon remains parseable and keeps key high-confidence entries", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const rows = parseLexiconCsv(aishellLexicon);

  assert.equal(Array.isArray(rows), true);
  assert.equal(rows.length > 0, true);
  assert.match(aishellLexicon, /阮、（咱）lan/);
  assert.match(aishellLexicon, /逐个、逐家/);
});
