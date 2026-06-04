"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildAdminDashboardOverview,
} = require("./overview");

test("admin dashboard overview returns pool occupancy and runtime log summary payload", function () {
  const overview = buildAdminDashboardOverview({
    now: "2026-06-02T10:00:00.000Z",
    adminAuthConfigured: true,
    sessionTtlSeconds: 1800,
    runtime: {
      jobs: {
        activeCount: 2,
        pendingCount: 1,
      },
      queue: {
        keyStrategy: "concrete-model-name",
        defaultModelPool: {
          defaultRpm: 1200,
          defaultCapacity: 999,
          defaultMaxConcurrent: 999,
        },
        activePools: [
          {
            groupName: "model:qwen3.5-omni-flash",
            activeCount: 6,
            pendingCount: 3,
            maxConcurrent: 999,
            totalCapacity: 999,
          },
          {
            groupName: "model:qwen3.5-plus",
            activeCount: 2,
            pendingCount: 0,
            maxConcurrent: 999,
            totalCapacity: 999,
          },
        ],
      },
    },
    downloads: {
      scriptCenterUrl: "https://script.xiangtianzhen.store/downloads/",
      projectDataDatasets: [
        { id: "asr-judgement-statistics", label: "ASR 快判统计数据" },
      ],
      aiCallLogDatasets: [
        { id: "abaka-task21-ai", label: "Abaka Task21 AI 调用记录", hasData: true },
      ],
    },
    logsSummary: {
      retentionDays: 7,
      recent24Hours: {
        successCount: 3,
        warnCount: 1,
        errorCount: 2,
      },
      latestFailure: {
        createdAt: "2026-06-02T09:59:00.000Z",
        level: "error",
        scope: "admin.project_data_download",
        message: "项目数据下载失败",
        requestId: "req-1",
      },
    },
  });

  assert.equal(overview.success, true);
  assert.equal(overview.data.generatedAt, "2026-06-02T10:00:00.000Z");
  assert.equal(overview.data.backend.status, "ready");
  assert.equal(overview.data.runtime.queue.activePools[0].displayName, "qwen3.5-omni-flash");
  assert.equal(overview.data.runtime.queue.defaultModelPool.defaultCapacity, 999);
  assert.equal(overview.data.runtime.queue.activePools[0].capacity, 999);
  assert.equal(overview.data.runtime.queue.activePools[0].usedCount, 9);
  assert.equal(overview.data.runtime.queue.activePools[0].availableCount, 990);
  assert.equal(overview.data.runtime.queue.activePools[0].isFull, false);
  assert.equal(overview.data.runtime.queue.activePools[0].utilizationPercent, 1);
  assert.equal(overview.data.downloads.projectDataDatasets.length, 1);
  assert.equal(overview.data.downloads.aiCallLogDatasets.length, 1);
  assert.equal(overview.data.logsSummary.retentionDays, 7);
  assert.equal(overview.data.logsSummary.recent24Hours.warnCount, 1);
  assert.equal(overview.data.logsSummary.latestFailure.scope, "admin.project_data_download");
  assert.equal("stats" in overview.data, false);
});
