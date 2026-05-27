"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ensureChineseSentencePunctuation,
  extractAuthTokenFromUnknown,
  findAuthTokenInEntries,
  isSaveCompletionState,
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
