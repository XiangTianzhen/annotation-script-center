"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const promptsModule = require(resolveRepo(
  "platform-resources",
  "magic-data",
  "hangzhou-helper",
  "backend",
  "ai-prompts.js"
));
const requestModule = require(resolveRepo(
  "platform-resources",
  "magic-data",
  "hangzhou-helper",
  "backend",
  "ai-review-request.js"
));

test("Magic Data Hangzhou request prioritizes stage contracts and retires recognition conversion", function () {
  const request = requestModule.normalizeReviewRequest({
    audioUrl: "https://audio.example.test/a.wav",
    platformDialectText: "阿拉去吃饭",
    recognitionStrategy: "mandarin_to_dialect",
    aiStages: {
      listen: {
        model: "qwen3.5-omni-flash",
        prompt: "听音主提示",
        generation: { temperature: 0.2 },
        lexicon: { enabled: false, prompt: "听音词表提示" },
      },
      refine: {
        model: "qwen3.5-flash",
        prompt: "普通话整理提示",
        generation: { top_p: 0.7 },
        lexicon: { enabled: true, prompt: "整理词表提示" },
      },
    },
  });

  assert.equal(request.recognitionStrategy, "direct_dialect");
  assert.equal(request.aiStages.listen.generation.temperature, 0.2);
  assert.equal(request.aiStages.listen.lexicon.enabled, false);
  assert.equal(request.aiStages.refine.prompt, "普通话整理提示");
});

test("Magic Data Hangzhou listen prompt only includes lexicon when its stage enables it", function () {
  const request = {
    taskItemId: "task-1",
    platformDialectText: "阿拉去吃饭",
    platformMandarinText: "我们去吃饭",
    aiStages: {
      listen: {
        prompt: "听音主提示",
        lexicon: { enabled: false, prompt: "听音词表提示" },
      },
    },
  };
  const disabled = promptsModule.buildListenPrompt(request, { text: "阿拉=我们" });
  assert.doesNotMatch(disabled.userPrompt, /阿拉=我们/);

  request.aiStages.listen.lexicon.enabled = true;
  const enabled = promptsModule.buildListenPrompt(request, { text: "阿拉=我们" });
  assert.match(enabled.userPrompt, /听音词表提示/);
  assert.match(enabled.userPrompt, /阿拉=我们/);
});

test("Magic Data Hangzhou listen prompt uses loose pure dialect judgement", function () {
  const prompt = promptsModule.buildListenPrompt(
    {
      taskItemId: "task-1",
      speaker: {
        pureDialect: "口音普通话",
      },
      platformDialectText: "阿拉去吃饭",
      platformMandarinText: "我们去吃饭",
    },
    {}
  );

  assert.match(prompt.userPrompt, /判断口径要明显从宽/);
  assert.match(prompt.userPrompt, /只要实际发声里出现明确杭州话\/方言字词、方言读法或方言表达，就优先判为 纯方言/);
  assert.match(prompt.userPrompt, /只有整段内容基本都是普通话表达、几乎没有方言字词或方言说法时，才判为 口音普通话/);
});

test("Magic Data Hangzhou compare prompt keeps loose pure dialect rule", function () {
  const prompt = promptsModule.buildComparePrompt(
    {
      reviewMode: "rule_first",
      rulesProfile: "hangzhou",
      speaker: {
        pureDialect: "口音普通话",
      },
      platformDialectText: "阿拉去吃饭",
      platformMandarinText: "我们去吃饭",
    },
    {
      heardDialectText: "阿拉去吃饭",
      heardMandarinMeaning: "我们去吃饭",
      pureDialectGuess: "纯方言",
    },
    {}
  );

  assert.match(prompt.userPrompt, /纯方言判断口径从宽/);
  assert.match(prompt.userPrompt, /只有整段几乎都在说普通话、没有明显方言表达时，才建议为 口音普通话/);
});
