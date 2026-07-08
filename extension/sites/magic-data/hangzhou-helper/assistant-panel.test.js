"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const panelModule = require("./assistant-panel.js");

test("resolveFillAllSuggestionsOutcome treats Hangzhou no-op fills as success", function () {
  const helper = panelModule.__test__?.resolveFillAllSuggestionsOutcome;
  assert.equal(typeof helper, "function");

  const result = helper(0, []);

  assert.deepEqual(result, {
    ok: true,
    noChanges: true,
    appliedCount: 0,
    message: "无需填入，保持当前内容。",
  });
});
