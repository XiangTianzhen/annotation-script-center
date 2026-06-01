"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildAdminDashboardOverview,
} = require("./overview");

test("admin dashboard overview only returns pool occupancy payload", function () {
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
          defaultMaxConcurrent: 15,
        },
        activePools: [
          {
            groupName: "model:qwen3.5-omni-flash",
            activeCount: 6,
            pendingCount: 3,
            maxConcurrent: 15,
          },
          {
            groupName: "model:qwen3.5-plus",
            activeCount: 2,
            pendingCount: 0,
            maxConcurrent: 15,
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
  });

  assert.equal(overview.success, true);
  assert.equal(overview.data.generatedAt, "2026-06-02T10:00:00.000Z");
  assert.equal(overview.data.backend.status, "ready");
  assert.equal(overview.data.runtime.queue.activePools[0].displayName, "qwen3.5-omni-flash");
  assert.equal(overview.data.runtime.queue.activePools[0].utilizationPercent, 40);
  assert.equal(overview.data.downloads.projectDataDatasets.length, 1);
  assert.equal(overview.data.downloads.aiCallLogDatasets.length, 1);
  assert.equal("stats" in overview.data, false);
});
