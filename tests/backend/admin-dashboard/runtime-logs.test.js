"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const {
  appendRuntimeLog,
  clearRuntimeLogsForTest,
  configureRuntimeLogStoreForTest,
} = require(resolveRepo("platform-resources", "backend", "runtime-log-store.js"));
const { buildAdminDashboardRuntimeLogs } = require(resolveRepo(
  "platform-resources",
  "backend",
  "admin-dashboard",
  "runtime-logs.js"
));

const tempRuntimeDataDirs = [];

function createTempRuntimeDataDir(t) {
  const runtimeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-admin-runtime-logs-"));
  tempRuntimeDataDirs.push(runtimeDataDir);
  t.after(function () {
    clearRuntimeLogsForTest();
    fs.rmSync(runtimeDataDir, { force: true, recursive: true });
  });
  return runtimeDataDir;
}

test("admin dashboard runtime logs payload exposes recent entries", function (t) {
  clearRuntimeLogsForTest();
  const runtimeDataDir = createTempRuntimeDataDir(t);
  configureRuntimeLogStoreForTest({
    runtimeDataDir,
  });
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
  assert.equal(payload.data.retentionDays, 7);
  assert.equal(payload.data.limit, 5);
  assert.equal(payload.data.items[0].scope, "admin.project_data_download");
  clearRuntimeLogsForTest();
});

test("admin runtime log tests remove their temporary data directory", function () {
  const leakedDirectories = tempRuntimeDataDirs.filter((directory) => fs.existsSync(directory));
  try {
    assert.deepEqual(leakedDirectories, []);
  } finally {
    for (const directory of leakedDirectories) {
      fs.rmSync(directory, { force: true, recursive: true });
    }
  }
});
