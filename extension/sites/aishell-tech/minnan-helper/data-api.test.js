"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractAuthTokenFromUnknown,
  findAuthTokenInEntries,
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
