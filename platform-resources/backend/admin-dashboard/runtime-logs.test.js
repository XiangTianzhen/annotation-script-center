"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { appendRuntimeLog, clearRuntimeLogsForTest } = require("../runtime-log-store");
const { buildAdminDashboardRuntimeLogs } = require("./runtime-logs");

test("admin dashboard runtime logs payload exposes recent entries", function () {
  clearRuntimeLogsForTest();
  appendRuntimeLog({
    createdAt: "2026-06-02T09:30:00.000Z",
    level: "warn",
    scope: "admin.project_data_download",
    action: "request_failed",
    message: "项目数据下载失败",
  });

  const payload = buildAdminDashboardRuntimeLogs({
    limit: 5,
  });

  assert.equal(payload.success, true);
  assert.equal(Array.isArray(payload.data.items), true);
  assert.equal(payload.data.items.length, 1);
  assert.equal(payload.data.items[0].scope, "admin.project_data_download");
  clearRuntimeLogsForTest();
});
