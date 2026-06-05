"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  createDefaultsPayload,
  createHealthPayload,
} = require("./ai-service");
const { normalizeRecognitionStrategy } = require("./config");
const { createRecommendPipeline } = require("./pipeline");

const aishellLexiconPath = path.join(__dirname, "reference", "minnan-lexicon.csv");
const dataBakerLexiconPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "data-baker",
  "round-one-quality",
  "backend",
  "reference",
  "minnan-lexicon.csv"
);

test("Aishell defaults align to the strict audio-first Minnan standard", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};

  assert.equal(defaults.modelMode, "two_stage");
  assert.equal(defaults.recognitionStrategy, "audio_first_reference");
  assert.equal(defaults.compareModel, "qwen3.5-plus");
  assert.equal(defaults.audioFirstReferenceCorrectionThreshold, 0.75);
  assert.equal(defaults.pipelineMode, "qwen_omni_compare");
});

test("Aishell health and defaults expose the audio-first correction threshold", function () {
  const defaultsPayload = createDefaultsPayload();
  const healthPayload = createHealthPayload();

  assert.equal(defaultsPayload.defaults?.audioFirstReferenceCorrectionThreshold, 0.75);
  assert.equal(healthPayload.audioFirstReferenceCorrectionThreshold, 0.75);
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

test("Aishell defaults expose only the strict audio-first prompt profile", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};
  const profiles = defaults.promptProfiles || {};
  const strategyOptions = defaults.recognitionStrategyOptions || [];

  assert.equal(defaults.listenPrompt, profiles.audio_first_reference?.listenPrompt);
  assert.equal(defaults.comparePrompt, profiles.audio_first_reference?.comparePrompt);
  assert.equal("candidatePrompt" in defaults, false);
  assert.equal("candidatePrompt" in (profiles.audio_first_reference || {}), false);
  assert.deepEqual(Object.keys(profiles), ["audio_first_reference"]);
  assert.equal(strategyOptions.length, 1);
  assert.equal(
    strategyOptions.some(function (item) {
      return item?.value === "audio_first_reference";
    }),
    true
  );
  assert.match(defaults.listenPrompt || "", /按实际发音输出 heardText/);
  assert.match(defaults.comparePrompt || "", /按词表与规则层严格生成/);
  assert.match(defaults.comparePrompt || "", /candidateDecisions/);
});

test("Aishell audio-first strategy builds strict lexicon candidate text before compare", async function () {
  let currentNow = 2000;
  let compareCallCount = 0;
  let capturedCorrectionContext = null;
  const parseStages = [];
  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 5;
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
    requestFunAsrRecognition: async function () {
      return {
        heardText: "路况良好，主要是高速同省道，甲导航行即可。",
        confidence: 0.93,
        usage: {},
      };
    },
    requestCompare: async function () {
      compareCallCount += 1;
      return {
        rawText: "{}",
        model: "qwen3.5-plus",
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      return {
        recommendedText: "路况良好，主要是高速甲省道，甲着导航行即可。",
        decision: "use_lexicon_candidate",
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
    buildComparePrompt: function (_request, _heardText, _lexiconContext, correctionContext) {
      capturedCorrectionContext = correctionContext;
      return {
        systemPrompt: "system",
        userPrompt: "user",
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
    {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "2.wav",
      audioUrl: "https://example.com/audio-2.wav",
      referenceText: "路况良好，主要是高速和省道，跟着导航走即可。",
      existingMarkText: "",
      duration: 1800,
      itemNumber: 2,
      modelMode: "two_stage",
      pipelineMode: "fun_asr_compare",
      recognitionStrategy: "audio_first_reference",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "",
      aiOptions: {
        audioFirstReferenceCorrectionThreshold: 0.75,
      },
      frontConcurrency: 5,
      concurrencyModelType: "fun-asr",
    },
    {
      requestId: "req-audio-first-low-confidence",
      startedAtMs: 2000,
      timeoutMs: 60000,
    }
  );

  assert.equal(
    capturedCorrectionContext?.lexiconCandidateText,
    "路况良好，主要是高速甲省道，甲着导航行即可。"
  );
  assert.deepEqual(
    (capturedCorrectionContext?.candidatePairs || []).slice().sort(function (left, right) {
      return left.sourceText.localeCompare(right.sourceText, "zh-Hans-CN");
    }),
    [
      { sourceText: "和", candidateText: "甲", source: "csv" },
      { sourceText: "跟", candidateText: "甲", source: "csv" },
      { sourceText: "走", candidateText: "行", source: "csv" },
    ].sort(function (left, right) {
      return left.sourceText.localeCompare(right.sourceText, "zh-Hans-CN");
    })
  );
  assert.equal(result.data?.recommendedText, "路况良好，主要是高速同省道，甲导航行即可。");
  assert.equal(result.data?.needHumanReview, true);
  assert.equal(result.data?.lexicon?.rewriteMode, "off");
  assert.equal(result.meta?.audioFirstReference?.correctionThreshold, 0.75);
  assert.equal(result.meta?.audioFirstReference?.correctionConfidence, 0.61);
  assert.equal(compareCallCount, 1);
  assert.deepEqual(parseStages, ["compare"]);
});

test("Aishell audio-first strategy can adopt lexicon candidate text above threshold", async function () {
  let currentNow = 3000;
  let compareCallCount = 0;
  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 5;
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
    requestFunAsrRecognition: async function () {
      return {
        heardText: "路况良好，主要是高速同省道，甲导航行即可。",
        confidence: 0.93,
        usage: {},
      };
    },
    requestCompare: async function () {
      compareCallCount += 1;
      return {
        rawText: "{}",
        model: "qwen3.5-plus",
        usage: {},
      };
    },
    parseModelJsonText: function () {
      return {
        recommendedText: "路况良好，主要是高速甲省道，甲着导航行即可。",
        decision: "use_lexicon_candidate",
        changePoints: [],
        confidence: 0.92,
        needHumanReview: false,
        correctionConfidence: 0.92,
        candidateDecisions: [
          {
            sourceText: "和",
            candidateText: "甲",
            heardFragment: "同",
            applyCandidate: true,
            confidence: 0.92,
            reason: "词表标准写法与音频接近，采用候选文本。",
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
    {
      taskId: "task-2",
      packageId: "package-2",
      taskItemId: "item-2",
      fileName: "3.wav",
      audioUrl: "https://example.com/audio-3.wav",
      referenceText: "路况良好，主要是高速和省道，跟着导航走即可。",
      existingMarkText: "",
      duration: 1800,
      itemNumber: 3,
      modelMode: "two_stage",
      pipelineMode: "fun_asr_compare",
      recognitionStrategy: "audio_first_reference",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "",
      aiOptions: {
        audioFirstReferenceCorrectionThreshold: 0.75,
      },
      frontConcurrency: 5,
      concurrencyModelType: "fun-asr",
    },
    {
      requestId: "req-audio-first-high-confidence",
      startedAtMs: 3000,
      timeoutMs: 60000,
    }
  );

  assert.equal(result.data?.recommendedText, "路况良好，主要是高速甲省道，甲着导航行即可。");
  assert.equal(result.data?.needHumanReview, false);
  assert.equal(result.meta?.audioFirstReference?.correctionConfidence, 0.92);
  assert.equal(compareCallCount, 1);
});

test("Aishell Minnan lexicon stays byte-for-byte aligned with DataBaker reference", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const dataBakerLexicon = fs.readFileSync(dataBakerLexiconPath, "utf8");

  assert.equal(aishellLexicon, dataBakerLexicon);
});
