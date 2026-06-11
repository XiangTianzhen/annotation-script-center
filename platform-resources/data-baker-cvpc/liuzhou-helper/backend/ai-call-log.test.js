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
            estimatedCostCny: 0.008935,
          },
          refine: {
            estimatedCostCny: 0.00312,
          },
          totalEstimatedCostCny: 0.012055,
        },
      },
    },
  };
}

test("liuzhou ai-call-log schema uses Chinese headers and keeps staged token plus cost columns", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "liuzhou-ai-log-schema-"));
  const { aiCallLogger } = loadAiCallLogModule(tempDir);
  const schemaMap = new Map(
    aiCallLogger.schema.map(function (column) {
      return [column.key, column.header];
    })
  );

  assert.equal(schemaMap.get("projectId"), "项目ID");
  assert.equal(schemaMap.get("taskId"), "任务ID");
  assert.equal(schemaMap.get("processId"), "流程ID");
  assert.equal(schemaMap.get("dataId"), "数据ID");
  assert.equal(schemaMap.get("jobId"), "作业ID");
  assert.equal(schemaMap.get("fileName"), "文件名");
  assert.equal(schemaMap.get("entryIndex"), "条目序号");
  assert.equal(schemaMap.get("selectionKey"), "选段键");
  assert.equal(schemaMap.get("segmentStartMs"), "片段开始毫秒");
  assert.equal(schemaMap.get("segmentEndMs"), "片段结束毫秒");
  assert.equal(schemaMap.get("listenModel"), "听音模型");
  assert.equal(schemaMap.get("refineModel"), "文本修正模型");
  assert.equal(schemaMap.get("listenPromptTokens"), "听音输入Token");
  assert.equal(schemaMap.get("listenCompletionTokens"), "听音输出Token");
  assert.equal(schemaMap.get("listenTotalTokens"), "听音总Token");
  assert.equal(schemaMap.get("refinePromptTokens"), "文本修正输入Token");
  assert.equal(schemaMap.get("refineCompletionTokens"), "文本修正输出Token");
  assert.equal(schemaMap.get("refineTotalTokens"), "文本修正总Token");
  assert.equal(schemaMap.get("listenEstimatedCostCny"), "听音预估人民币");
  assert.equal(schemaMap.get("refineEstimatedCostCny"), "文本修正预估人民币");
  assert.equal(schemaMap.get("totalEstimatedCostCny"), "总预估人民币");
  assert.equal(schemaMap.has("listenPricingStatus"), false);
  assert.equal(schemaMap.has("refinePricingStatus"), false);
  assert.equal(schemaMap.has("listenInputPrice"), false);
  assert.equal(schemaMap.has("listenOutputPrice"), false);
  assert.equal(schemaMap.has("refineInputPrice"), false);
  assert.equal(schemaMap.has("refineOutputPrice"), false);
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
  assert.equal(Object.prototype.hasOwnProperty.call(row, "listenPricingStatus"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "refinePricingStatus"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "listenInputPrice"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "listenOutputPrice"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "refineInputPrice"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, "refineOutputPrice"), false);
});

test("liuzhou ai-call-log leaves cost cells empty when pricing data is unavailable", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "liuzhou-ai-log-missing-cost-"));
  const { aiCallLogger, appendAiCallLog } = loadAiCallLogModule(tempDir);
  const context = createLogContext();
  context.execution.projectResult.cost = {
    listen: {
      pricingStatus: "missing_source",
      reason: "没有数据源",
      estimatedCostCny: null,
    },
    refine: {
      pricingStatus: "missing_source",
      reason: "没有数据源",
      estimatedCostCny: null,
    },
    totalEstimatedCostCny: null,
  };

  appendAiCallLog(context);

  const csvFiles = fs.readdirSync(tempDir).filter(function (fileName) {
    return /\.csv$/i.test(fileName);
  });
  const rows = readCsvObjects(path.join(tempDir, csvFiles[0]), aiCallLogger.schema);
  const row = rows[0];

  assert.equal(row.listenEstimatedCostCny, "");
  assert.equal(row.refineEstimatedCostCny, "");
  assert.equal(row.totalEstimatedCostCny, "");
});
