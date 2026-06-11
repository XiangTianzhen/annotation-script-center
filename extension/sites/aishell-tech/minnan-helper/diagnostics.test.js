"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { buildCurrentResultDiagnostics } = require("./diagnostics.js");

test("Aishell diagnostics includes lexicon status and mode row", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        lexicon: {
          status: "ready",
          rewriteMode: "off",
        },
      },
    },
    {}
  );
  const row = diagnostics.rows.find(function (item) {
    return item[0] === "词表状态与模式";
  });

  assert.deepEqual(row, [
    "词表状态与模式",
    "主词表已加载 / 固定携带 / 改写模式 off",
  ]);
});
