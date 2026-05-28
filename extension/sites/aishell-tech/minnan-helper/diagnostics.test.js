"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildBatchFailureEntry,
  buildCurrentResultDiagnostics,
  createStageLabel,
} = require("./diagnostics.js");

test("buildCurrentResultDiagnostics exposes timing, models, concurrency and token summaries", function () {
  const diagnostics = buildCurrentResultDiagnostics(
    {
      meta: {
        requestId: "request-1",
        stage: "complete",
        models: {
          modelMode: "two_stage",
          recognitionStrategy: "mandarin_to_dialect",
          listenModel: "fun-asr",
          compareModel: "qwen3.5-plus",
          funAsrProvider: "rest",
        },
        usage: {
          promptTokens: 120,
          completionTokens: 36,
          totalTokens: 156,
        },
        timing: {
          listenDurationMs: 900,
          compareDurationMs: 700,
          totalDurationMs: 1800,
        },
        queue: {
          totalQueueWaitMs: 450,
          groups: [],
        },
        cache: {
          hit: true,
        },
        retryCount: 1,
        cancelled: false,
        debugId: "debug-1",
        debug: {
          frontConcurrencyNormalized: 15,
          clientBackendMode: "server",
          clientBackendEndpoint:
            "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend",
          clientFallbackUsed: true,
        },
      },
    },
    {
      fallbackFrontConcurrency: 20,
    }
  );

  assert.equal(diagnostics.rows.find((row) => row[0] === "AI耗时")[1], "1.8s（听音 900ms / 比较 700ms）");
  assert.equal(
    diagnostics.rows.find((row) => row[0] === "模型选择")[1],
    "听音 fun-asr / 比较 qwen3.5-plus"
  );
  assert.equal(diagnostics.rows.find((row) => row[0] === "前端并发")[1], "15");
  assert.equal(
    diagnostics.rows.find((row) => row[0] === "Token")[1],
    "输入 120 / 输出 36 / 合计 156"
  );
  assert.equal(diagnostics.rows.find((row) => row[0] === "FunASR")[1], "rest");
  assert.equal(diagnostics.rows.find((row) => row[0] === "排队等待")[1], "450ms");
  assert.equal(diagnostics.rows.find((row) => row[0] === "缓存命中")[1], "是");
  assert.equal(diagnostics.rows.find((row) => row[0] === "后端模式")[1], "server");
  assert.equal(
    diagnostics.rows.find((row) => row[0] === "后端地址")[1],
    "https://script.xiangtianzhen.store/api/aishell-tech/minnan-helper/ai/recommend"
  );
  assert.equal(diagnostics.rows.find((row) => row[0] === "自动回退")[1], "是");
});

test("buildBatchFailureEntry keeps stage label, diagnostics and raw json context", function () {
  const failure = buildBatchFailureEntry({
    task: {
      displayName: "第 659 条 AS-mn-102_001_2059431320014164968.wav",
      taskItemId: "item-659",
    },
    stage: "save_current",
    message: "后端连接中断，请稍后重试。",
    batchConcurrency: 15,
    result: {
      meta: {
        requestId: "request-659",
        stage: "compare",
        models: {
          modelMode: "two_stage",
          recognitionStrategy: "mandarin_to_dialect",
          listenModel: "fun-asr",
          compareModel: "qwen3.5-plus",
        },
        usage: {
          promptTokens: 100,
          completionTokens: 20,
          totalTokens: 120,
        },
        timing: {
          totalDurationMs: 2300,
        },
        queue: {
          totalQueueWaitMs: 180,
          groups: [],
        },
        cache: {
          hit: false,
        },
        cancelled: false,
        debugId: "debug-659",
        debug: {
          frontConcurrencyNormalized: 15,
        },
      },
    },
    saveResult: {
      ok: false,
      message: "后端连接中断，请稍后重试。",
      responseBody: {
        error: {
          code: "network-disconnected",
          stage: "compare",
        },
      },
    },
  });

  assert.equal(failure.displayName, "第 659 条 AS-mn-102_001_2059431320014164968.wav");
  assert.equal(failure.stageLabel, createStageLabel("save_current"));
  assert.equal(failure.detailRows.find((row) => row[0] === "失败阶段")[1], "保存当前条");
  assert.equal(failure.detailRows.find((row) => row[0] === "模型阶段")[1], "compare");
  assert.equal(failure.detailRows.find((row) => row[0] === "前端并发")[1], "15");
  assert.equal(failure.detailRows.find((row) => row[0] === "Token")[1], "输入 100 / 输出 20 / 合计 120");
  assert.equal(failure.rawJson.stage, "save_current");
  assert.equal(failure.rawJson.saveResult.responseBody.error.code, "network-disconnected");
});
