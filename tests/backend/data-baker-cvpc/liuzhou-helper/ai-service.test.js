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
