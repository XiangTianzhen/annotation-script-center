"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiService = require(resolveRepo(
  "platform-resources",
  "data-baker-cvpc",
  "liuzhou-helper",
  "backend",
  "ai-service.js"
));

test("Liuzhou defaults enable independent lexicon references for both stages", function () {
  const stages = aiService.createDefaultsPayload().defaults.stages;
  assert.equal(stages.listen.lexicon.enabled, true);
  assert.match(stages.listen.lexicon.prompt, /真实读音/);
  assert.equal(stages.refine.lexicon.enabled, true);
  assert.match(stages.refine.lexicon.prompt, /普通话/);
});

test("Liuzhou request normalizes stage generation and lexicon contracts", function () {
  const request = aiService.normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,AA==",
    aiStages: {
      listen: {
        generation: { temperature: 0.2 },
        lexicon: { enabled: false, prompt: "听音词表提示" },
      },
      refine: {
        generation: { top_p: 0.7 },
        lexicon: { enabled: true, prompt: "整理词表提示" },
      },
    },
  });

  assert.equal(request.aiStages.listen.params.temperature, 0.2);
  assert.deepEqual(request.aiStages.listen.lexicon, { enabled: false, prompt: "听音词表提示" });
  assert.equal(request.aiStages.refine.params.top_p, 0.7);
  assert.equal(request.aiStages.refine.lexicon.enabled, true);
});

test("Liuzhou lexicon context only includes relevant JSON entries and never rewrites text in code", function () {
  const assetsContext = aiService.buildAssetsContext({
    lexiconJson: {
      schemaVersion: "1.0",
      language: "柳州话",
      mode: "prompt_reference_only",
      sourceFiles: [],
      updatedAt: "2026-07-17",
      entries: Array.from({ length: 35 }, function (_item, index) {
        return {
          id: "entry-" + index,
          normalized: "词" + index,
          display: "词" + index,
          mandarin: "意思" + index,
          aliases: [],
          notes: [],
          tags: [],
          attributes: {},
        };
      }),
    },
  });

  assert.deepEqual(aiService.__testOnly.buildRelevantLexiconContext(assetsContext, ["完全无关"]), []);
  assert.equal(
    aiService.__testOnly.buildRelevantLexiconContext(
      assetsContext,
      [Array.from({ length: 35 }, (_item, index) => "词" + index).join(" ")]
    ).length,
    30
  );
  assert.equal(aiService.__testOnly.buildMandarinDraftFromLexicon(assetsContext, "词1去。"), "词1去。");
});

test("normalizeRefineStageOutput normalizes final dialect standard forms for high-frequency Liuzhou words", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    refinedDialectText: "更要紧去啊。",
    refinedMandarinText: "这样更要紧去啊。",
  });

  assert.equal(result.refinedDialectText, "哏要紧克啊。");
  assert.deepEqual(result.refinedDialectTokens, [{ type: "text", content: "哏要紧克啊。" }]);
});

test("normalizeRefineStageOutput normalizes 去 and 哩 only on the final dialect answer", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    refinedDialectText: "我困困哩没想去。",
    refinedMandarinText: "我这几天没得空，我困困的没想去。",
  });

  assert.equal(result.refinedDialectText, "我困困滴没想克。");
  assert.deepEqual(result.refinedDialectTokens, [{ type: "text", content: "我困困滴没想克。" }]);
});

test("normalizeRefineStageOutput smooths Mandarin disfluencies but keeps meaningful repeated clauses", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    refinedDialectText:
      "所以讲我在家里面一天，那个，这个这个女婿一天煮那种辣辣辣辣辣滴，整得我吃得，吃得我都肚子都痛完克。",
    refinedMandarinText:
      "所以说我在家里面一天，那个，这个这个女婿一天煮那种辣辣辣辣的，弄得我吃得，吃得我肚子都痛完了。",
  });

  assert.equal(
    result.refinedMandarinText,
    "所以说我在家里面一天，那个，这个女婿一天煮那种辣的，弄得我吃得，吃得我肚子都痛完了。"
  );
  assert.match(result.refinedMandarinText, /吃得，吃得/);
});

test("normalizeRefineStageOutput preserves inline tags while normalizing surrounding final dialect text", function () {
  const result = aiService.__testOnly.normalizeRefineStageOutput({
    refinedDialectText: "更要紧去#ah。",
    refinedMandarinText: "这样更要紧去啊。",
  });

  assert.equal(result.refinedDialectText, "哏要紧克#ah。");
  assert.deepEqual(result.refinedDialectTokens, [
    { type: "text", content: "哏要紧克" },
    { type: "tag", content: "#ah" },
    { type: "text", content: "。" },
  ]);
});
