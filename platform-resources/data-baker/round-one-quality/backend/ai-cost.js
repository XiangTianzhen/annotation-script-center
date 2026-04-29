"use strict";

const ESTIMATE_NOTE = "按当前 qwen3.5-omni-flash + qwen3.5-plus 测试估算，可后续按百炼账单调整。";
const EFFECTIVE_REVENUE_CNY_PER_HOUR = 350;

const TOKEN_PRICE_CNY_PER_1K = {
  listenPrompt: 0.018,
  listenCompletion: 0.0133,
  comparePrompt: 0.0008,
  compareCompletion: 0.002,
};

function safeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundMoney(value) {
  return Number(safeNumber(value).toFixed(6));
}

function estimateTokenCost(usage, promptPrice, completionPrice) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = safeNumber(source.promptTokens || source.prompt_tokens);
  const completionTokens = safeNumber(source.completionTokens || source.completion_tokens);
  return (promptTokens / 1000) * promptPrice + (completionTokens / 1000) * completionPrice;
}

function estimateCost(input) {
  const effectiveTime = safeNumber(input?.effectiveTime);
  const listenUsage = input?.listenUsage && typeof input.listenUsage === "object" ? input.listenUsage : {};
  const compareUsage = input?.compareUsage && typeof input.compareUsage === "object" ? input.compareUsage : {};
  const effectiveRevenueCny = (effectiveTime / 3600) * EFFECTIVE_REVENUE_CNY_PER_HOUR;
  const listenCost = estimateTokenCost(
    listenUsage,
    TOKEN_PRICE_CNY_PER_1K.listenPrompt,
    TOKEN_PRICE_CNY_PER_1K.listenCompletion
  );
  const compareCost = estimateTokenCost(
    compareUsage,
    TOKEN_PRICE_CNY_PER_1K.comparePrompt,
    TOKEN_PRICE_CNY_PER_1K.compareCompletion
  );
  const estimatedCostCny = listenCost + compareCost;
  const totalTokens = safeNumber(listenUsage.totalTokens) + safeNumber(compareUsage.totalTokens);
  const note = totalTokens > 0
    ? ESTIMATE_NOTE
    : ESTIMATE_NOTE + " 模型 usage 未返回或未解析，成本可能低估。";

  return {
    estimatedCostCny: roundMoney(estimatedCostCny),
    effectiveRevenueCny: roundMoney(effectiveRevenueCny),
    grossProfitCny: roundMoney(effectiveRevenueCny - estimatedCostCny),
    note,
  };
}

module.exports = {
  EFFECTIVE_REVENUE_CNY_PER_HOUR,
  ESTIMATE_NOTE,
  TOKEN_PRICE_CNY_PER_1K,
  estimateCost,
};
