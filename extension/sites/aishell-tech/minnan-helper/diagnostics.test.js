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
      debug: {
        requestId: "request-1",
        debugId: "debug-1",
        frontConcurrencyNormalized: 15,
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
      debug: {
        requestId: "request-659",
        debugId: "debug-659",
        frontConcurrencyNormalized: 15,
      },
    },
    saveResult: {
      ok: false,
      message: "后端连接中断，请稍后重试。",
      responseBody: {
        code: "network-disconnected",
      },
    },
  });

  assert.equal(failure.displayName, "第 659 条 AS-mn-102_001_2059431320014164968.wav");
  assert.equal(failure.stageLabel, createStageLabel("save_current"));
  assert.equal(failure.detailRows.find((row) => row[0] === "失败阶段")[1], "保存当前条");
  assert.equal(failure.detailRows.find((row) => row[0] === "前端并发")[1], "15");
  assert.equal(failure.detailRows.find((row) => row[0] === "Token")[1], "输入 100 / 输出 20 / 合计 120");
  assert.equal(failure.rawJson.stage, "save_current");
  assert.equal(failure.rawJson.saveResult.responseBody.code, "network-disconnected");
});
