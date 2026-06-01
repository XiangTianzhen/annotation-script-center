"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  appendRuntimeLog,
  clearRuntimeLogsForTest,
  listRuntimeLogs,
} = require("./runtime-log-store");

test("runtime log store returns latest entries first and honors limit", function () {
  clearRuntimeLogsForTest();
  appendRuntimeLog({
    createdAt: "2026-06-02T10:00:00.000Z",
    level: "info",
    scope: "admin.dashboard",
    action: "read",
    message: "first",
  });
  appendRuntimeLog({
    createdAt: "2026-06-02T10:01:00.000Z",
    level: "success",
    scope: "admin.session",
    action: "unlock_success",
    message: "second",
    details: {
      ok: true,
    },
  });

  const items = listRuntimeLogs({
    limit: 1,
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].message, "second");
  assert.equal(items[0].level, "success");
  assert.equal(items[0].details.ok, "true");
  clearRuntimeLogsForTest();
});
