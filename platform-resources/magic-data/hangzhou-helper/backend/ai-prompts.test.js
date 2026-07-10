"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const lexiconModule = require("./ai-lexicon.js");
const promptsModule = require("./ai-prompts.js");

test("Magic Data Hangzhou direct listen prompt is blind to platform text and lexicon", function () {
  const prompt = promptsModule.buildListenPrompt(
    {
      taskItemId: "task-blind-listen",
      samplingRecordId: "sampling-blind-listen",
      projectName: "杭州话项目",
      speaker: {
        gender: "平台性别不应进入盲听",
        ageRange: "平台年龄不应进入盲听",
        pureDialect: "平台方言属性不应进入盲听",
      },
      platformDialectText: "平台杭州话基线不应进入盲听",
      platformMandarinText: "平台普通话基线不应进入盲听",
    },
    {
      text: "- 统一用字：词表内容不应进入盲听；普通话：词表释义不应进入盲听",
    }
  );

  assert.match(prompt.userPrompt, /只根据音频实际发声记录杭州话文本/);
  assert.doesNotMatch(prompt.userPrompt, /平台杭州话基线不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /平台普通话基线不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /平台性别不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /平台年龄不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /平台方言属性不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /词表内容不应进入盲听/);
  assert.doesNotMatch(prompt.userPrompt, /词表释义不应进入盲听/);
});

test("Magic Data Hangzhou dialect-to-Mandarin context does not reverse-match Mandarin meaning", function () {
  const context = lexiconModule.buildLexiconContext({
    heardDialectText: "我现在去上班",
    matchDirection: "dialect_to_mandarin",
  });

  assert.equal(
    context.matches.some(function (entry) {
      return entry.unified === "葛毛" && entry.mandarin === "现在";
    }),
    false
  );
  assert.doesNotMatch(context.text, /统一用字：葛毛；普通话：现在/);
});

test("Magic Data Hangzhou dialect-to-Mandarin context keeps heard dialect matches", function () {
  const context = lexiconModule.buildLexiconContext({
    heardDialectText: "我葛毛去上班",
    matchDirection: "dialect_to_mandarin",
  });

  assert.equal(
    context.matches.some(function (entry) {
      return entry.unified === "葛毛" && entry.mandarin === "现在";
    }),
    true
  );
  assert.match(context.text, /统一用字：葛毛；普通话：现在/);
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
  assert.match(prompt.userPrompt, /音频实际发声 > 听音杭州话文本 > 平台文本/);
  assert.match(prompt.userPrompt, /音频听到“现在”时，杭州话文本必须保留“现在”，不得仅因词表中“现在”对应“葛毛”而改成“葛毛”/);
  assert.match(prompt.userPrompt, /只有实际听到对应杭州话读音并命中杭州话词形时，才允许采用“葛毛”等词表规范字形/);
});

test("Magic Data Hangzhou recognition conversion still maps Mandarin to dialect", function () {
  const result = lexiconModule.convertMandarinToDialectByLexicon("我现在去上班", {
    rewriteMode: "exact",
  });

  assert.match(result.convertedDialectText, /葛毛/);
  assert.equal(
    result.lexiconMatches.some(function (entry) {
      return entry.mandarin === "现在" && entry.dialect === "葛毛";
    }),
    true
  );
});
