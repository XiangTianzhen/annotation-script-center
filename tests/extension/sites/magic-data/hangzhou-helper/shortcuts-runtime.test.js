"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveRepo } = require("#repo-paths");

require(resolveRepo(
  "extension",
  "sites",
  "magic-data",
  "hangzhou-helper",
  "shortcuts-runtime.js"
));

test("Magic Data hangzhou shortcut actions include toggle auto run", function () {
  const actionDefinitions =
    globalThis.__ASREdgeMagicDataHangzhouShortcuts?.ACTION_DEFINITIONS || [];

  assert.equal(
    actionDefinitions.some(function (item) {
      return item?.key === "toggleAutoRun";
    }),
    true
  );
});
