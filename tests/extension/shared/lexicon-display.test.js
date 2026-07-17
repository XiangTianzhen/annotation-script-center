"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const { formatLexiconStatusAndMode } = require(resolveRepo(
  "extension",
  "shared",
  "lexicon-display.js"
));

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

test("lexicon display formats independent liuzhou stage switches", function () {
  assert.equal(
    formatLexiconStatusAndMode(
      {
        status: "reference_only",
        stages: {
          listen: { enabled: false },
          refine: { enabled: true },
        },
      },
      {
        scriptType: "liuzhou",
      }
    ),
    "仅参考源 / 听音词表 关闭 / 普通话整理词表 开启"
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
