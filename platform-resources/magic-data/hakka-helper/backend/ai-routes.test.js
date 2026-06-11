"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const routesModule = require("./ai-routes.js");

test("Magic Data Hakka success lexicon meta keeps rewrite mode", function () {
  const helper = routesModule.__test__?.buildReviewLexiconMeta;
  assert.equal(typeof helper, "function");

  const result = helper(
    {
      enabled: true,
      status: "ready",
      matchedCount: 2,
      matches: [{ suggested: "屋下" }],
    },
    "aggressive"
  );

  assert.deepEqual(result, {
    enabled: true,
    status: "ready",
    matchedCount: 2,
    matches: [{ suggested: "屋下" }],
    rewriteMode: "aggressive",
  });
});
