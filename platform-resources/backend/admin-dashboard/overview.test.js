"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildAdminDashboardOverview,
} = require("./overview");

test("admin dashboard overview aggregates today totals, pools and failures", function () {
  const overview = buildAdminDashboardOverview({
    now: "2026-05-31T10:00:00.000Z",
    adminAuthConfigured: true,
    sessionTtlSeconds: 1800,
    statsWindow: {
      days: 14,
      label: "最近14天",
      from: "2026-05-18",
      to: "2026-05-31",
    },
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
    scriptSummaries: [
      {
        id: "dataBakerRoundOneQuality",
        label: "标贝易采一检质检",
        service: "data-baker-round-one-quality-ai-recommend",
        today: {
          fileCount: 1,
          totals: {
            totalCalls: 12,
            successCalls: 10,
            failedCalls: 2,
            totalTokens: 2400,
          },
          byDate: [
            { date: "2026-05-31", totalCalls: 12, successCalls: 10, failedCalls: 2, totalTokens: 2400 },
          ],
          byOperator: [
            { aiUsageOperatorName: "傅成林", totalCalls: 12, successCalls: 10, failedCalls: 2, totalTokens: 2400 },
          ],
          byErrorCode: [
            { errorCode: "provider-rate-limited", totalCalls: 2 },
          ],
        },
        allTime: {
          fileCount: 2,
          totals: {
            totalCalls: 20,
            successCalls: 17,
            failedCalls: 3,
            totalTokens: 4000,
          },
          byDate: [
            { date: "2026-05-30", totalCalls: 8, successCalls: 7, failedCalls: 1, totalTokens: 1600 },
            { date: "2026-05-31", totalCalls: 12, successCalls: 10, failedCalls: 2, totalTokens: 2400 },
          ],
          byOperator: [
            { aiUsageOperatorName: "傅成林", totalCalls: 20, successCalls: 17, failedCalls: 3, totalTokens: 4000 },
          ],
          byErrorCode: [
            { errorCode: "provider-rate-limited", totalCalls: 3 },
          ],
        },
      },
      {
        id: "abakaAiTaskPageCapture",
        label: "Task21助手",
        service: "abaka-ai-task21-ai-analysis",
        today: {
          fileCount: 1,
          totals: {
            totalCalls: 5,
            successCalls: 5,
            failedCalls: 0,
            totalTokens: 1000,
          },
          byDate: [
            { date: "2026-05-31", totalCalls: 5, successCalls: 5, failedCalls: 0, totalTokens: 1000 },
          ],
          byOperator: [
            { aiUsageOperatorName: "王小明", totalCalls: 5, successCalls: 5, failedCalls: 0, totalTokens: 1000 },
          ],
          byErrorCode: [],
        },
        allTime: {
          fileCount: 1,
          totals: {
            totalCalls: 5,
            successCalls: 5,
            failedCalls: 0,
            totalTokens: 1000,
          },
          byDate: [
            { date: "2026-05-31", totalCalls: 5, successCalls: 5, failedCalls: 0, totalTokens: 1000 },
          ],
          byOperator: [
            { aiUsageOperatorName: "王小明", totalCalls: 5, successCalls: 5, failedCalls: 0, totalTokens: 1000 },
          ],
          byErrorCode: [],
        },
      },
    ],
  });

  assert.equal(overview.success, true);
  assert.equal(overview.data.stats.today.totalCalls, 17);
  assert.equal(overview.data.stats.today.failedCalls, 2);
  assert.equal(overview.data.stats.today.totalTokens, 3400);
  assert.equal(overview.data.stats.window.label, "最近14天");
  assert.equal(overview.data.stats.window.from, "2026-05-18");
  assert.equal(overview.data.runtime.queue.activePools[0].utilizationPercent, 40);
  assert.deepEqual(overview.data.stats.failures[0], {
    errorCode: "provider-rate-limited",
    totalCalls: 2,
  });
  assert.equal(overview.data.downloads.projectDataDatasets.length, 1);
  assert.equal(overview.data.downloads.aiCallLogDatasets.length, 1);
});
