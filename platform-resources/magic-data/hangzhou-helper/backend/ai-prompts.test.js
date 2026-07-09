"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const promptsModule = require("./ai-prompts.js");

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
