"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  createDefaultsPayload,
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

test("Aishell defaults align to DataBaker-style Minnan standard", function () {
  const payload = createDefaultsPayload();
  const defaults = payload.defaults || {};

  assert.equal(defaults.modelMode, "two_stage");
  assert.equal(defaults.recognitionStrategy, "mandarin_to_dialect");
  assert.equal(defaults.compareModel, "qwen3.5-plus");
  assert.equal(defaults.pipelineMode, "qwen_omni_compare");
});

test("Aishell config accepts the audio-first recognition strategy", function () {
  assert.equal(
    normalizeRecognitionStrategy("audio_first_reference", "mandarin_to_dialect"),
    "audio_first_reference"
  );
});

test("Aishell defaults expose independent prompt profiles for all recognition strategies", function () {
  const payload = createDefaultsPayload();
  const profiles = payload.defaults?.promptProfiles || {};
  const strategyOptions = payload.defaults?.recognitionStrategyOptions || [];

  assert.equal(
    profiles.mandarin_to_dialect?.listenPrompt,
    payload.defaults?.listenPrompt
  );
  assert.equal(
    profiles.mandarin_to_dialect?.comparePrompt,
    payload.defaults?.comparePrompt
  );
  assert.notEqual(
    profiles.mandarin_to_dialect?.listenPrompt,
    profiles.direct_dialect?.listenPrompt
  );
  assert.notEqual(
    profiles.mandarin_to_dialect?.comparePrompt,
    profiles.direct_dialect?.comparePrompt
  );
  assert.equal(
    strategyOptions.some(function (item) {
      return item?.value === "audio_first_reference";
    }),
    true
  );
  assert.equal(typeof profiles.audio_first_reference?.listenPrompt, "string");
  assert.equal(typeof profiles.audio_first_reference?.comparePrompt, "string");
  assert.match(
    profiles.audio_first_reference?.listenPrompt || "",
    /按实际发音输出 heardText/
  );
  assert.match(
    profiles.audio_first_reference?.comparePrompt || "",
    /如果某个词在音频里没有读出来，就不要补回/
  );
  assert.notEqual(
    profiles.audio_first_reference?.comparePrompt,
    profiles.direct_dialect?.comparePrompt
  );
});

test("Aishell audio-first strategy keeps lexicon context but disables aggressive rewrite", async function () {
  const rewriteModes = [];
  let currentNow = 1000;
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
        heardText: "拍着声音闷闷诶，纹路清晰的西瓜一般都挺甜。",
        confidence: 0.92,
        usage: {},
      };
    },
    requestCompare: async function () {
      return {
        rawText: "{}",
        model: "qwen3.5-plus",
        usage: {},
      };
    },
    parseModelJsonText: function () {
      return {};
    },
    normalizeCompareResponse: function () {
      return {
        recommendedText: "拍着声音闷闷诶，纹路清晰的西瓜一般都挺甜。",
        decision: "audio_first_reference",
        changePoints: [],
        confidence: 0.91,
        needHumanReview: false,
      };
    },
    buildLexiconContext: function () {
      return {
        enabled: true,
        text: "西瓜,西瓜",
        matchedCount: 1,
      };
    },
    applyLexiconRewrite: function (text, options) {
      rewriteModes.push(options?.mode || "");
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
      fileName: "1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "拍着声音闷闷的，纹路清晰的西瓜一般都挺甜的。",
      existingMarkText: "",
      duration: 1200,
      itemNumber: 1,
      modelMode: "two_stage",
      pipelineMode: "fun_asr_compare",
      recognitionStrategy: "audio_first_reference",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "",
      aiOptions: {},
      frontConcurrency: 5,
      concurrencyModelType: "fun-asr",
    },
    {
      requestId: "req-audio-first",
      startedAtMs: 1000,
      timeoutMs: 60000,
    }
  );

  assert.deepEqual(rewriteModes, ["off"]);
  assert.equal(result.data?.lexicon?.enabled, true);
  assert.equal(result.data?.lexicon?.rewriteMode, "off");
  assert.equal(result.meta?.models?.recognitionStrategy, "audio_first_reference");
});

test("Aishell Minnan lexicon stays byte-for-byte aligned with DataBaker reference", function () {
  const aishellLexicon = fs.readFileSync(aishellLexiconPath, "utf8");
  const dataBakerLexicon = fs.readFileSync(dataBakerLexiconPath, "utf8");

  assert.equal(aishellLexicon, dataBakerLexicon);
});
