"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRuntime,
  ensureChineseSentencePunctuation,
  extractSavedMarkText,
  extractAuthTokenFromUnknown,
  findAuthTokenInEntries,
  isSaveCompletionState,
  createRateLimitedTaskScheduler,
  removeTextSpaces,
} = require("./data-api.js");

test("extractAuthTokenFromUnknown reads bearer token from nested json string", function () {
  const token = extractAuthTokenFromUnknown(
    JSON.stringify({
      auth: {
        authorization: "Bearer aaa.bbb.ccc",
      },
    }),
    0,
    new WeakSet()
  );

  assert.equal(token, "aaa.bbb.ccc");
});

test("findAuthTokenInEntries prefers token-like storage values", function () {
  const token = findAuthTokenInEntries([
    {
      key: "userInfo",
      value: JSON.stringify({
        profile: {
          token: "zzz.yyy.xxx",
        },
      }),
    },
    {
      key: "misc",
      value: "not-a-token",
    },
  ]);

  assert.equal(token, "zzz.yyy.xxx");
});

test("removeTextSpaces removes full-width and half-width spaces", function () {
  assert.equal(removeTextSpaces(" 昨晚 去 公园　散步 "), "昨晚去公园散步");
});

test("ensureChineseSentencePunctuation appends chinese full stop when missing", function () {
  assert.equal(ensureChineseSentencePunctuation("昨晚去公园散步"), "昨晚去公园散步。");
  assert.equal(ensureChineseSentencePunctuation("昨晚去公园散步？"), "昨晚去公园散步？");
});

test("extractSavedMarkText parses mark json string and direct text", function () {
  assert.equal(
    extractSavedMarkText({
      mark: "{\"text\":\"阮欲去看电影。\"}",
    }),
    "阮欲去看电影。"
  );
  assert.equal(
    extractSavedMarkText({
      mark: {
        text: "阮欲去看电影。",
      },
    }),
    "阮欲去看电影。"
  );
  assert.equal(
    extractSavedMarkText({
      text: "阮欲去看电影。",
    }),
    "阮欲去看电影。"
  );
});

test("isSaveCompletionState returns true when selected index advances", function () {
  assert.equal(
    isSaveCompletionState(1, {
      selectedIndex: 2,
      previousItemFinished: false,
    }),
    true
  );
});

test("isSaveCompletionState returns true when previous item becomes finished", function () {
  assert.equal(
    isSaveCompletionState(4, {
      selectedIndex: 4,
      previousItemFinished: true,
    }),
    true
  );
  assert.equal(
    isSaveCompletionState(4, {
      selectedIndex: 4,
      previousItemFinished: false,
    }),
    false
  );
});

test("createRateLimitedTaskScheduler spaces task start time by staggerMs", async function () {
  const startTimes = [];
  const scheduler = createRateLimitedTaskScheduler({
    concurrency: 2,
    staggerMs: 50,
  });

  const tasks = Array.from({ length: 4 }).map(function (_value, index) {
    return scheduler.run(function () {
      startTimes.push({
        index: index,
        at: Date.now(),
      });
      return Promise.resolve(index);
    });
  });

  const values = await Promise.all(tasks);
  assert.deepEqual(values, [0, 1, 2, 3]);
  assert.equal(startTimes.length, 4);
  for (let index = 1; index < startTimes.length; index += 1) {
    assert.ok(
      startTimes[index].at - startTimes[index - 1].at >= 40,
      "expected stagger between dispatched requests"
    );
  }
});

test("createRuntime exposes createRateLimitedTaskScheduler for content runtime", function () {
  const runtime = createRuntime();

  assert.equal(typeof runtime.createRateLimitedTaskScheduler, "function");
  assert.equal(typeof runtime.extractSavedMarkText, "function");
});
