"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { formatLexiconStatusAndMode } = require("./lexicon-display.js");

test("lexicon display formats default status and rewrite mode", function () {
  assert.equal(
    formatLexiconStatusAndMode(
      {
        status: "ready",
        rewriteMode: "aggressive",
      },
      {
        scriptType: "default",
      }
    ),
    "主词表已加载 / 固定携带 / 改写模式 aggressive"
  );
});

test("lexicon display formats liuzhou listen reference switch", function () {
  assert.equal(
    formatLexiconStatusAndMode(
      {
        status: "reference_only",
        listenReferenceEnabled: false,
      },
      {
        scriptType: "liuzhou",
      }
    ),
    "仅参考源 / 听音参考 关闭 / 文本修正固定携带"
  );
});

test("lexicon display returns empty string when lexicon payload is absent", function () {
  assert.equal(
    formatLexiconStatusAndMode(null, {
      scriptType: "default",
    }),
    ""
  );
});
