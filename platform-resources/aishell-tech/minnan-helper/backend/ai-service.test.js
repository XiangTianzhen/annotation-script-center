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
  assert.equal(defaults.candidateModel, "qwen3.5-plus");
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

  assert.equal(defaults.candidatePrompt, profiles.audio_first_reference?.candidatePrompt);
  assert.equal(defaults.listenPrompt, profiles.audio_first_reference?.listenPrompt);
  assert.equal(defaults.comparePrompt, profiles.audio_first_reference?.comparePrompt);
  assert.deepEqual(Object.keys(profiles), ["audio_first_reference"]);
  assert.equal(strategyOptions.length, 1);
  assert.equal(
    strategyOptions.some(function (item) {
      return item?.value === "audio_first_reference";
    }),
    true
  );
  assert.match(defaults.candidatePrompt || "", /闽南话|闽南语/);
  assert.match(defaults.candidatePrompt || "", /词表附件|CSV/);
  assert.match(defaults.candidatePrompt || "", /语境/);
  assert.match(defaults.listenPrompt || "", /按实际发音输出 heardText/);
  assert.match(defaults.comparePrompt || "", /differenceSegments/);
  assert.match(defaults.comparePrompt || "", /candidateDecisions/);
});

test("Aishell audio-first strategy builds AI lexicon candidate text before compare", async function () {
  let currentNow = 2000;
  let compareCallCount = 0;
  let capturedCandidatePrompt = null;
  let capturedCorrectionContext = null;
  let capturedCandidateModel = "";
  let capturedCompareModel = "";
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
    requestCompare: async function (_providerInput, prompt, _comparisonText, options) {
      compareCallCount += 1;
      if (compareCallCount === 1) {
        capturedCandidatePrompt = prompt;
        capturedCandidateModel = String(options?.model || "");
      } else {
        capturedCompareModel = String(options?.model || "");
      }
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-plus"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      if (options?.stage === "candidate") {
        return {
          lexiconCandidateText: "路况良好，主要是高速甲省道，甲着导航行即可。",
          confidence: 0.88,
          needHumanReview: false,
        };
      }
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
    normalizeCandidateResponse: function (modelJson) {
      return {
        lexiconCandidateText: modelJson.lexiconCandidateText,
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
  assert.match(capturedCandidatePrompt?.userPrompt || "", /词表上下文/);
  assert.equal(capturedCandidateModel, "qwen3.5-plus");
  assert.equal(capturedCompareModel, "qwen3.5-plus");
  assert.equal(
    Array.isArray(capturedCorrectionContext?.differenceSegments),
    true
  );
  assert.equal(capturedCorrectionContext?.differenceSegments?.length, 2);
  assert.equal(
    capturedCorrectionContext?.differenceSegments?.[0]?.candidateText,
    "甲"
  );
  assert.equal(
    capturedCorrectionContext?.differenceSegments?.[0]?.heardFragment,
    "同"
  );
  assert.equal(result.data?.recommendedText, "路况良好，主要是高速同省道，甲导航行即可。");
  assert.equal(result.data?.needHumanReview, true);
  assert.equal(result.data?.lexicon?.rewriteMode, "off");
  assert.equal(result.meta?.audioFirstReference?.correctionThreshold, 0.75);
  assert.equal(result.meta?.audioFirstReference?.correctionConfidence, 0.61);
  assert.match(capturedCandidatePrompt?.userPrompt || "", /词表相关词条/);
  assert.match(capturedCandidatePrompt?.userPrompt || "", /词表原始CSV附件/);
  assert.equal(compareCallCount, 2);
  assert.deepEqual(parseStages, ["candidate", "compare"]);
});

test("Aishell audio-first strategy can mix candidate and heard text by diff segment", async function () {
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
        heardText: "路况良好，主要是高速佮省道，缀着导航行即可。",
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
      if (options?.stage === "candidate") {
        return {
          lexiconCandidateText: "路况良好，主要是高速甲省道，甲着导航行即可。",
          confidence: 0.91,
          needHumanReview: false,
        };
      }
      return {
        recommendedText: "路况良好，主要是高速甲省道，缀着导航行即可。",
        decision: "use_mixed_segments",
        changePoints: ["第一个差异项采用词表候选，第二个差异项保留听音文本。"],
        confidence: 0.92,
        needHumanReview: false,
        correctionConfidence: 0.92,
        candidateDecisions: [
          {
            sourceText: "和",
            candidateText: "甲",
            heardFragment: "佮",
            applyCandidate: true,
            confidence: 0.92,
            reason: "词表标准写法与音频接近，采用候选文本。",
          },
          {
            sourceText: "跟",
            candidateText: "甲着",
            heardFragment: "缀着",
            applyCandidate: false,
            confidence: 0.95,
            reason: "听音文本已经正确，不应回退到候选文本。",
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
    normalizeCandidateResponse: function (modelJson) {
      return {
        lexiconCandidateText: modelJson.lexiconCandidateText,
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

  assert.equal(result.data?.recommendedText, "路况良好，主要是高速甲省道，缀着导航行即可。");
  assert.equal(result.data?.needHumanReview, false);
  assert.equal(result.meta?.audioFirstReference?.correctionConfidence, 0.92);
  assert.equal(result.meta?.audioFirstReference?.candidateText, "路况良好，主要是高速甲省道，甲着导航行即可。");
  assert.equal(compareCallCount, 2);
});

test("Aishell audio-first omni path reuses compare prompt as Omni judgement and skips compare model", async function () {
  let currentNow = 4000;
  let compareCallCount = 0;
  let omniCallCount = 0;
  let capturedCandidatePrompt = null;
  let capturedOmniPrompt = null;
  let capturedCandidateModel = "";
  const parseStages = [];
  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 7;
      return currentNow;
    },
    enqueueTask: async function (_groupName, task) {
      return {
        value: await task(),
        queueMeta: {
          groupName: "aishell_qwen_omni",
          queueWaitMs: 0,
          retryCount: 0,
          durationMs: 0,
          activeCount: 1,
          maxConcurrent: 4,
        },
      };
    },
    requestCompare: async function (_providerInput, prompt, _comparisonText, options) {
      compareCallCount += 1;
      capturedCandidatePrompt = prompt;
      capturedCandidateModel = String(options?.model || "");
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-plus"),
        usage: {},
      };
    },
    requestOmniInputAudio: async function (_providerInput, prompt, options) {
      omniCallCount += 1;
      capturedOmniPrompt = prompt;
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-omni-flash"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      if (options?.stage === "candidate") {
        return {
          lexiconCandidateText: "路况良好，主要是高速甲省道，甲着导航行即可。",
          confidence: 0.9,
          needHumanReview: false,
        };
      }
      return {
        heardText: "路况良好，主要是高速佮省道，缀着导航行即可。",
        recommendedText: "路况良好，主要是高速甲省道，缀着导航行即可。",
        decision: "use_mixed_segments",
        changePoints: ["第一个差异项采用候选，第二个差异项保留听音。"],
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
            reason: "发音接近但标准写法应采用甲。",
          },
          {
            sourceText: "跟",
            candidateText: "甲着",
            heardFragment: "缀着",
            applyCandidate: false,
            confidence: 0.96,
            reason: "听音文本已经正确，保留缀着。",
          },
        ],
      };
    },
  });

  const result = await pipeline.run(
    {
      taskId: "task-4",
      packageId: "package-4",
      taskItemId: "item-4",
      fileName: "4.wav",
      audioUrl: "https://example.com/audio-4.wav",
      referenceText: "路况良好，主要是高速和省道，跟着导航走即可。",
      existingMarkText: "",
      duration: 1800,
      itemNumber: 4,
      modelMode: "two_stage",
      pipelineMode: "qwen_omni_compare",
      recognitionStrategy: "audio_first_reference",
      listenModel: "qwen3.5-omni-flash",
      compareModel: "qwen3.5-plus",
      singleModel: "",
      aiOptions: {
        candidatePrompt: "candidate-prompt",
        comparePrompt: "omni-judge-prompt",
        audioFirstReferenceCorrectionThreshold: 0.75,
      },
      frontConcurrency: 5,
      concurrencyModelType: "omni",
    },
    {
      requestId: "req-audio-first-omni-two-stage",
      startedAtMs: 4000,
      timeoutMs: 60000,
    }
  );

  assert.equal(compareCallCount, 1);
  assert.equal(omniCallCount, 1);
  assert.equal(capturedCandidateModel, "qwen3.5-plus");
  assert.match(capturedCandidatePrompt?.userPrompt || "", /词表原始CSV附件/);
  assert.match(capturedOmniPrompt?.userPrompt || "", /omni-judge-prompt/);
  assert.match(capturedOmniPrompt?.userPrompt || "", /词表候选校正/);
  assert.equal(result.data?.recommendedText, "路况良好，主要是高速甲省道，缀着导航行即可。");
  assert.equal(result.meta?.models?.compareModel, "");
  assert.deepEqual(parseStages, ["candidate", "omni_judge"]);
});

test("Aishell Minnan lexicon stays byte-for-byte aligned with DataBaker reference", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const dataBakerLexicon = fs.readFileSync(dataBakerLexiconPath, "utf8");

  assert.equal(aishellLexicon, dataBakerLexicon);
});
