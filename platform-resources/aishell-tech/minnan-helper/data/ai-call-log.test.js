"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CSV_COLUMNS,
  appendAishellAiCallLog,
  buildAishellAiCallLogRow,
  getAishellAiCallLogFilePath,
} = require("./ai-call-log.js");

test("buildAishellAiCallLogRow prefers prompt and completion tokens over total token", function () {
  const row = buildAishellAiCallLogRow({
    createdAt: "2026-05-28T08:00:00.000Z",
    requestId: "request-1",
    normalizedRequest: {
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      aiUsageOperatorName: "张三",
      platformUserName: "ASmnbz001",
      platformUserId: "",
      modelMode: "two_stage",
      recognitionStrategy: "mandarin_to_dialect",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "",
    },
    result: {
      usage: {
        promptTokens: 120,
        completionTokens: 18,
        totalTokens: 138,
      },
      timing: {
        totalDurationMs: 2100,
      },
    },
  });

  assert.equal(row.promptTokens, "120");
  assert.equal(row.completionTokens, "18");
  assert.equal(row.totalTokens, "");
  assert.equal(row.platformId, "aishellTech");
  assert.equal(row.scriptId, "aishellTechMinnanAssistant");
  assert.equal(row.taskId, "task-1");
  assert.equal(row.platformUserName, "ASmnbz001");
  assert.equal(row.success, "true");
});

test("appendAishellAiCallLog writes a daily csv file under the provided data directory", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aishell-ai-log-"));
  const filePath = getAishellAiCallLogFilePath(tempDir, "2026-05-28T08:00:00.000Z");

  appendAishellAiCallLog({
    logDir: tempDir,
    createdAt: "2026-05-28T08:00:00.000Z",
    requestId: "request-2",
    normalizedRequest: {
      taskId: "task-2",
      packageId: "package-2",
      taskItemId: "item-2",
      aiUsageOperatorName: "李四",
      platformUserName: "ASmnbz002",
      platformUserId: "",
      modelMode: "two_stage",
      recognitionStrategy: "direct_dialect",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "",
    },
    error: {
      code: "provider-rate-limited",
      message: "上游模型限流",
      rawResponse: {
        providerCode: "limit_burst_rate",
      },
    },
    durationMs: 3000,
  });

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.trim().split(/\r?\n/);

  assert.equal(lines.length, 2);
  assert.equal(lines[0].split(",").length, CSV_COLUMNS.length);
  assert.match(text, /provider-rate-limited/);
  assert.match(text, /ASmnbz002/);
});
