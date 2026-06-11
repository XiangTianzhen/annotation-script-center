"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getPricingCatalog,
  getModelPricing,
  estimateProjectCost,
  estimateStageCost,
} = require("./model-pricing");

test("model pricing catalog records official source metadata", function () {
  const catalog = getPricingCatalog();

  assert.equal(catalog.currency, "CNY");
  assert.equal(catalog.region, "中国内地 / 华北2（北京）");
  assert.equal(catalog.sourceUrl, "https://help.aliyun.com/zh/model-studio/model-pricing");
  assert.equal(
    catalog.modelListUrl,
    "https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market/all"
  );
  assert.match(String(catalog.verifiedAt || ""), /^2026-06-11T/);
});

test("estimateStageCost supports qwen3.5-omni-plus with audio detail pricing", function () {
  const stage = estimateStageCost({
    modelId: "qwen3.5-omni-plus",
    usage: {
      promptTokens: 466,
      completionTokens: 53,
      totalTokens: 519,
      raw: {
        prompt_tokens_details: {
          text_tokens: 10,
          audio_tokens: 456,
        },
      },
    },
    outputMode: "text",
  });

  assert.equal(stage.pricingStatus, "estimated");
  assert.equal(stage.hasPriceData, true);
  assert.equal(stage.hasUsageDetail, true);
  assert.equal(stage.inputPriceLabel, "文本/图片/视频 7 元/百万Token；音频 53 元/百万Token");
  assert.equal(stage.outputPriceLabel, "文本 40 元/百万Token");
  assert.equal(stage.estimatedCostCny, 0.026358);
});

test("estimateStageCost supports qwen3.5-omni-flash with audio detail pricing", function () {
  const stage = estimateStageCost({
    modelId: "qwen3.5-omni-flash",
    usage: {
      promptTokens: 466,
      completionTokens: 53,
      totalTokens: 519,
      raw: {
        prompt_tokens_details: {
          text_tokens: 10,
          audio_tokens: 456,
        },
      },
    },
    outputMode: "text",
  });

  assert.equal(stage.pricingStatus, "estimated");
  assert.equal(stage.inputPriceLabel, "文本/图片/视频 2.2 元/百万Token；音频 18 元/百万Token");
  assert.equal(stage.outputPriceLabel, "文本 13.3 元/百万Token");
  assert.equal(stage.estimatedCostCny, 0.008935);
});

test("estimateStageCost selects qwen3.5-plus tier by prompt token length", function () {
  const stage = estimateStageCost({
    modelId: "qwen3.5-plus",
    usage: {
      promptTokens: 200000,
      completionTokens: 114,
      totalTokens: 200114,
    },
  });

  assert.equal(stage.pricingStatus, "estimated");
  assert.equal(stage.inputPriceLabel, "128K<Token≤256K：2 元/百万Token");
  assert.equal(stage.outputPriceLabel, "128K<Token≤256K：12 元/百万Token");
  assert.equal(stage.estimatedCostCny, 0.401368);
});

test("estimateStageCost selects qwen3.5-flash tier by prompt token length", function () {
  const stage = estimateStageCost({
    modelId: "qwen3.5-flash",
    usage: {
      promptTokens: 300000,
      completionTokens: 114,
      totalTokens: 300114,
    },
  });

  assert.equal(stage.pricingStatus, "estimated");
  assert.equal(stage.inputPriceLabel, "256K<Token≤1M：1.2 元/百万Token");
  assert.equal(stage.outputPriceLabel, "256K<Token≤1M：12 元/百万Token");
  assert.equal(stage.estimatedCostCny, 0.361368);
});

test("estimateStageCost returns missing source when model is not configured", function () {
  const stage = estimateStageCost({
    modelId: "qwen-max",
    usage: {
      promptTokens: 10,
      completionTokens: 2,
      totalTokens: 12,
    },
  });

  assert.equal(getModelPricing("qwen-max"), null);
  assert.equal(stage.pricingStatus, "missing_source");
  assert.equal(stage.hasPriceData, false);
  assert.equal(stage.hasUsageDetail, false);
  assert.equal(stage.reason, "没有数据源");
  assert.equal(stage.estimatedCostCny, null);
});

test("estimateProjectCost keeps available stages and totals known estimates", function () {
  const result = estimateProjectCost({
    listen: {
      modelId: "qwen3.5-omni-flash",
      usage: {
        promptTokens: 466,
        completionTokens: 53,
        totalTokens: 519,
        raw: {
          prompt_tokens_details: {
            text_tokens: 10,
            audio_tokens: 456,
          },
        },
      },
      outputMode: "text",
    },
    refine: {
      modelId: "qwen-max",
      usage: {
        promptTokens: 3216,
        completionTokens: 114,
        totalTokens: 3330,
      },
    },
  });

  assert.equal(result.listen.pricingStatus, "estimated");
  assert.equal(result.refine.pricingStatus, "missing_source");
  assert.equal(result.totalEstimatedCostCny, 0.008935);
  assert.match(result.note, /仅汇总可估算阶段/);
});
