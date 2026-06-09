"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
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

function createTempLexiconJsonFromCsv() {
  const rows = parseLexiconCsv(fs.readFileSync(aishellLexiconPath, "utf8"));
  const document = {
    schemaVersion: "1",
    language: "minnan",
    mode: "rule_lexicon",
    sourceFiles: ["reference/minnan-lexicon.csv"],
    updatedAt: "2026-06-09T00:00:00.000Z",
    entries: rows.map(function (row, index) {
      return {
        id: row.id || "aishell-mn-" + String(index + 1).padStart(4, "0"),
        normalized: row.suggested,
        display: row.suggested,
        mandarin: row.mandarin,
        aliases: [],
        notes: [],
        tags: ["aishell-test-fixture"],
      };
    }),
  };
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-aishell-lexicon-"));
  const jsonPath = path.join(tempDir, "minnan-lexicon.json");
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), "utf8");
  return jsonPath;
}

process.env.ASC_AISHELL_MINNAN_LEXICON_JSON_PATH = createTempLexiconJsonFromCsv();

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

test("Aishell normalizeRecommendRequest keeps standalone omni compare pipeline mode", function () {
  const request = normalizeRecommendRequest({
    taskId: "task-merged",
    packageId: "package-merged",
    taskItemId: "item-merged",
    fileName: "merged.wav",
    audioUrl: "https://example.com/audio-merged.wav",
    referenceText: "老板沿导航前进即可。",
    aiStages: {
      convert: {
        model: "qwen3.5-plus",
        prompt: "convert prompt",
        params: {},
      },
      listen: {
        model: "qwen3.5-omni-flash",
        prompt: "listen prompt",
        params: {},
      },
      compare: {
        family: "omni",
        model: "qwen3.5-omni-flash",
        prompt: "omni compare prompt",
        params: {},
        adoptionThreshold: 0.75,
      },
    },
  });

  assert.equal(request.listenModel, "qwen3.5-omni-flash");
  assert.equal(request.compareFamily, "omni");
  assert.equal(request.compareModel, "qwen3.5-omni-flash");
  assert.equal(request.pipelineMode, "omni_omni_compare");
});

test("Aishell convert/qwen/omni prompts reflect ambiguity fallback and standalone compare semantics", function () {
  const defaults = createDefaultsPayload().defaults || {};

  assert.match(defaults.stages?.convert?.prompt || "", /只能在冲突片段内做选择/);
  assert.match(defaults.stages?.convert?.prompt || "", /resolvedSegments/);
  assert.doesNotMatch(defaults.stages?.convert?.prompt || "", /词表原始CSV附件|词表原始 CSV 文本块附件/);
  assert.match(defaults.stages?.compare?.qwenPrompt || "", /convertedText/);
  assert.match(defaults.stages?.compare?.qwenPrompt || "", /convertPairs/);
  assert.match(defaults.stages?.compare?.omniPrompt || "", /heardText/);
  assert.doesNotMatch(defaults.stages?.compare?.omniPrompt || "", /不要拆成两轮推理/);
});

test("Aishell pipeline keeps convert rule-based when unambiguous and waits for listen before qwen compare", async function () {
  let currentNow = 1000;
  let qwenCallCount = 0;
  let compareStarted = false;
  const listenDeferred = createDeferred();
  const stageOrder = [];
  const parseStages = [];

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
      compareStarted = true;
      assert.match(prompt?.userPrompt || "", /convertedText/);
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-plus"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      return {
        recommendedText: "头家沿导航前进即可。",
        decision: "use_heard_or_converted_text",
        changePoints: [],
        confidence: 0.96,
        needHumanReview: false,
        correctionConfidence: 0.96,
        candidateDecisions: [],
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

  const runPromise = pipeline.run(
    createBaseRequest({
      referenceText: "老板沿导航前进即可。",
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

  listenDeferred.resolve({
    heardText: "头家沿导航前进即可。",
    confidence: 0.93,
    usage: {},
  });

  const result = await runPromise;

  assert.equal(compareStarted, true);
  assert.equal(result.data?.convertedText, "头家沿导航前进即可。");
  assert.equal(result.data?.recommendedText, "头家沿导航前进即可。");
  assert.equal(result.data?.needHumanReview, false);
  assert.equal(result.meta?.models?.convertModel, "qwen3.5-plus");
  assert.equal(result.meta?.models?.listenModel, "fun-asr");
  assert.equal(result.meta?.models?.compareModelFamily, "qwen");
  assert.equal(result.meta?.models?.compareModel, "qwen3.5-plus");
  assert.equal(typeof result.meta?.timing?.convertDurationMs, "number");
  assert.equal(Number(result.meta?.usage?.convert?.totalTokens || 0), 0);
  assert.equal(qwenCallCount, 1);
  assert.deepEqual(stageOrder, ["aishell_fun_asr", "aishell_text_compare"]);
  assert.deepEqual(parseStages, ["compare"]);
});

test("Aishell convert stage only calls AI for ambiguous segments", async function () {
  let currentNow = 2000;
  let qwenCallCount = 0;
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
    requestFunAsrRecognition: async function () {
      return {
        heardText: "即阵会使出发。",
        confidence: 0.91,
        usage: {},
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
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      if (options?.stage === "convert") {
        return {
          resolvedSegments: [
            {
              segmentIndex: 0,
              selectedText: "即阵",
            },
            {
              segmentIndex: 1,
              selectedText: "会使",
            },
          ],
          convertedText: "即阵会使出发。",
          confidence: 0.82,
          needHumanReview: false,
        };
      }
      return {
        recommendedText: "即阵会使出发。",
        decision: "use_converted_text",
        changePoints: [],
        confidence: 0.9,
        needHumanReview: false,
        correctionConfidence: 0.9,
        candidateDecisions: [],
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
    createBaseRequest({
      referenceText: "现在可以出发。",
      listenModel: "fun-asr",
      compareFamily: "qwen",
      compareModel: "qwen3.5-plus",
      pipelineMode: "fun_asr_text_compare",
    }),
    {
      requestId: "req-convert-ambiguous",
      startedAtMs: 2000,
      timeoutMs: 60000,
    }
  );

  assert.equal(qwenCallCount, 2);
  assert.match(prompts[0]?.userPrompt || "", /ambiguousSegments/);
  assert.match(prompts[0]?.userPrompt || "", /candidateOptions/);
  assert.doesNotMatch(prompts[0]?.userPrompt || "", /词表原始CSV附件|词表原始 CSV 文本块附件/);
  assert.equal(result.data?.convertedText, "即阵会使出发。");
  assert.equal(result.data?.recommendedText, "即阵会使出发。");
  assert.deepEqual(parseStages, ["convert", "compare"]);
});

test("Aishell keeps standalone listen plus omni compare even when models match", async function () {
  let currentNow = 3000;
  let qwenCallCount = 0;
  let omniCallCount = 0;
  const parseStages = [];
  const prompts = [];
  const stageOrder = [];

  const pipeline = createRecommendPipeline({
    now: function () {
      currentNow += 7;
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
    requestCompare: async function () {
      qwenCallCount += 1;
      return {
        rawText: "{}",
        model: "qwen3.5-plus",
        usage: {},
      };
    },
    requestOmniInputAudio: async function (_providerInput, prompt, options) {
      omniCallCount += 1;
      prompts.push(prompt);
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-omni-flash"),
        usage: {
          promptTokens: 12,
          completionTokens: 6,
          totalTokens: 18,
        },
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      return {
        heardText: "头家沿导航前进即可。",
        recommendedText: "头家沿导航前进即可。",
        decision: "use_heard_text",
        changePoints: [],
        confidence: 0.94,
        needHumanReview: false,
        correctionConfidence: 0.94,
        candidateDecisions: [],
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
      referenceText: "老板沿导航前进即可。",
      listenModel: "qwen3.5-omni-flash",
      compareFamily: "omni",
      compareModel: "qwen3.5-omni-flash",
      pipelineMode: "omni_omni_compare",
    }),
    {
      requestId: "req-omni-merged",
      startedAtMs: 3000,
      timeoutMs: 60000,
    }
  );

  assert.equal(qwenCallCount, 0);
  assert.equal(omniCallCount, 2);
  assert.match(prompts[1]?.userPrompt || "", /convertedText/);
  assert.equal(result.data?.convertedText, "头家沿导航前进即可。");
  assert.equal(result.data?.heardText, "头家沿导航前进即可。");
  assert.equal(result.data?.recommendedText, "头家沿导航前进即可。");
  assert.equal(result.meta?.models?.pipelineMode, "omni_omni_compare");
  assert.deepEqual(result.meta?.execution?.mergedStages, []);
  assert.equal(Number(result.meta?.usage?.compare?.totalTokens || 0), 18);
  assert.deepEqual(stageOrder, ["aishell_qwen_omni", "aishell_qwen_omni"]);
  assert.deepEqual(parseStages, ["listen", "omni_compare"]);
});

test("Aishell still keeps standalone listen plus omni compare when models differ", async function () {
  let qwenCallCount = 0;
  let omniCallCount = 0;
  const parseStages = [];

  const pipeline = createRecommendPipeline({
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
    requestCompare: async function () {
      qwenCallCount += 1;
      return {
        rawText: "{}",
        model: "qwen3.5-plus",
        usage: {},
      };
    },
    requestOmniInputAudio: async function (_providerInput, _prompt, options) {
      omniCallCount += 1;
      return {
        rawText: "{}",
        model: String(options?.model || "qwen3.5-omni-flash"),
        usage: {},
      };
    },
    parseModelJsonText: function (_rawText, options) {
      parseStages.push(options?.stage || "");
      if (options?.stage === "listen") {
        return {
          heardText: "头家沿导航前进即可。",
          confidence: 0.93,
          needHumanReview: false,
        };
      }
      return {
        heardText: "头家沿导航前进即可。",
        recommendedText: "头家沿导航前进即可。",
        decision: "use_heard_text",
        changePoints: [],
        confidence: 0.94,
        needHumanReview: false,
        correctionConfidence: 0.94,
        candidateDecisions: [],
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
      referenceText: "老板沿导航前进即可。",
      listenModel: "qwen3.5-omni-flash",
      compareFamily: "omni",
      compareModel: "qwen3.5-omni-plus",
      pipelineMode: "omni_omni_compare",
    }),
    {
      requestId: "req-omni-split",
      startedAtMs: 4000,
      timeoutMs: 60000,
    }
  );

  assert.equal(qwenCallCount, 0);
  assert.equal(omniCallCount, 2);
  assert.equal(result.meta?.models?.pipelineMode, "omni_omni_compare");
  assert.deepEqual(parseStages, ["listen", "omni_compare"]);
});

test("Aishell Minnan lexicon remains parseable and keeps key high-confidence entries", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const rows = parseLexiconCsv(aishellLexicon);

  assert.equal(Array.isArray(rows), true);
  assert.equal(rows.length > 0, true);
  assert.match(aishellLexicon, /阮、（咱）lan/);
  assert.match(aishellLexicon, /逐个、逐家/);
});
