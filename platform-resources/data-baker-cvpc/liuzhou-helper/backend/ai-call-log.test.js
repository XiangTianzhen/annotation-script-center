"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { readCsvObjects } = require("../../../backend/ai-call-log/csv-writer");

const modulePath = require.resolve("./ai-call-log");

function loadAiCallLogModule(tempDir) {
  process.env.DATABAKER_CVPC_AI_CALL_LOG_DIR = tempDir;
  delete require.cache[modulePath];
  return require(modulePath);
}

function createLogContext() {
  return {
    createdAt: "2026-06-11T10:11:12.000Z",
    requestId: "req-liuzhou-1",
    rawBody: {
      aiUsageOperatorName: "tester",
      platformUserName: "cvpc-user",
      platformUserId: "cvpc-001",
    },
    normalizedRequest: {
      requestId: "req-liuzhou-1",
      input: {
        listenModel: "qwen3.5-omni-flash",
        refineModel: "qwen3.5-plus",
        selectionKey: "seg-1",
        startMs: 1000,
        endMs: 4200,
        editorContext: {
          query: {
            projectId: "proj-1",
            taskId: "task-1",
            processId: "proc-1",
            dataId: "data-1",
            jobId: "job-1",
          },
          selectedEntry: {
            name: "demo.wav",
            entryIndex: 4,
          },
        },
      },
    },
    execution: {
      projectResult: {
        models: {
          listenModel: "qwen3.5-omni-flash",
          refineModel: "qwen3.5-plus",
        },
        usage: {
          listen: {
            promptTokens: 466,
            completionTokens: 53,
            totalTokens: 519,
          },
          refine: {
            promptTokens: 3216,
            completionTokens: 114,
            totalTokens: 3330,
          },
        },
        cost: {
          listen: {
            pricingStatus: "estimated",
            inputPriceLabel: "文本/图片/视频 2.2 元/百万Token；音频 18 元/百万Token",
            outputPriceLabel: "文本 13.3 元/百万Token",
            estimatedCostCny: 0.008935,
          },
          refine: {
            pricingStatus: "estimated",
            inputPriceLabel: "0<Token≤128K：0.8 元/百万Token",
            outputPriceLabel: "0<Token≤128K：4.8 元/百万Token",
            estimatedCostCny: 0.00312,
          },
          totalEstimatedCostCny: 0.012055,
        },
      },
    },
  };
}

test("liuzhou ai-call-log schema includes staged token and pricing columns", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "liuzhou-ai-log-schema-"));
  const { aiCallLogger } = loadAiCallLogModule(tempDir);
  const keys = aiCallLogger.schema.map(function (column) {
    return column.key;
  });

  [
    "listenPromptTokens",
    "listenCompletionTokens",
    "listenTotalTokens",
    "refinePromptTokens",
    "refineCompletionTokens",
    "refineTotalTokens",
    "listenEstimatedCostCny",
    "refineEstimatedCostCny",
    "totalEstimatedCostCny",
    "listenPricingStatus",
    "refinePricingStatus",
    "listenInputPrice",
    "listenOutputPrice",
    "refineInputPrice",
    "refineOutputPrice",
  ].forEach(function (key) {
    assert.equal(keys.includes(key), true, key);
  });
});

test("liuzhou ai-call-log writes staged token and cost columns while keeping total token columns", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "liuzhou-ai-log-row-"));
  const { aiCallLogger, appendAiCallLog } = loadAiCallLogModule(tempDir);

  appendAiCallLog(createLogContext());

  const csvFiles = fs.readdirSync(tempDir).filter(function (fileName) {
    return /\.csv$/i.test(fileName);
  });
  assert.equal(csvFiles.length, 1);

  const rows = readCsvObjects(path.join(tempDir, csvFiles[0]), aiCallLogger.schema);
  assert.equal(rows.length, 1);

  const row = rows[0];
  assert.equal(row.promptTokens, "3682");
  assert.equal(row.completionTokens, "167");
  assert.equal(row.totalTokens, "3849");
  assert.equal(row.listenPromptTokens, "466");
  assert.equal(row.listenCompletionTokens, "53");
  assert.equal(row.listenTotalTokens, "519");
  assert.equal(row.refinePromptTokens, "3216");
  assert.equal(row.refineCompletionTokens, "114");
  assert.equal(row.refineTotalTokens, "3330");
  assert.equal(row.listenEstimatedCostCny, "0.008935");
  assert.equal(row.refineEstimatedCostCny, "0.003120");
  assert.equal(row.totalEstimatedCostCny, "0.012055");
  assert.equal(row.listenPricingStatus, "estimated");
  assert.equal(row.refinePricingStatus, "estimated");
  assert.equal(row.listenInputPrice, "文本/图片/视频 2.2 元/百万Token；音频 18 元/百万Token");
  assert.equal(row.listenOutputPrice, "文本 13.3 元/百万Token");
  assert.equal(row.refineInputPrice, "0<Token≤128K：0.8 元/百万Token");
  assert.equal(row.refineOutputPrice, "0<Token≤128K：4.8 元/百万Token");
});
