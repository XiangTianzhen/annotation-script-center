"use strict";

function normalizeConfidence(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numericValue));
}

function parseModelJsonText(rawText, requestId) {
  const source = String(rawText || "").trim();
  if (!source) {
    throw new Error("模型未返回文本结果。");
  }

  const withoutCodeFence = source
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const attempts = [withoutCodeFence];
  const firstBrace = withoutCodeFence.indexOf("{");
  const lastBrace = withoutCodeFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(withoutCodeFence.slice(firstBrace, lastBrace + 1));
  }

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      return JSON.parse(attempts[index]);
    } catch (error) {
      // try next candidate
    }
  }

  throw new Error(
    "模型输出 JSON 解析失败（requestId: " + String(requestId || "") + "）。"
  );
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(function (item) {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object") {
        return JSON.stringify(item);
      }
      return String(item || "").trim();
    })
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeChangePoints(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 30).map(function (item) {
    if (typeof item === "string") {
      return {
        summary: item.trim(),
      };
    }

    const source = item && typeof item === "object" ? item : {};
    return {
      type: String(source.type || "").trim(),
      pageText: String(source.pageText || source.before || "").trim(),
      heardText: String(source.heardText || source.after || "").trim(),
      summary: String(source.summary || source.reason || "").trim(),
    };
  });
}

function normalizeListenResponse(modelJson) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  const heardText = String(source.heardText || source.text || "").trim();
  if (!heardText && source.isValid !== false) {
    throw new Error("听音模型未返回 heardText。");
  }

  return {
    heardText,
    confidence: normalizeConfidence(source.confidence),
    isValid: source.isValid !== false,
    invalidReasons: normalizeStringArray(source.invalidReasons),
  };
}

function normalizeCompareResponse(modelJson, context) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  const pageText = String(context?.pageText || "");
  const heardText = String(context?.heardText || "");
  const recommendedText = String(
    source.recommendedText === undefined || source.recommendedText === null
      ? heardText || pageText
      : source.recommendedText
  ).trim();
  const decision = String(source.decision || "").trim() || "need_human_review";
  const confidence = normalizeConfidence(source.confidence);
  const needHumanReview =
    source.needHumanReview === true || confidence < 0.75 || !recommendedText;

  return {
    recommendedText,
    decision,
    changePoints: normalizeChangePoints(source.changePoints),
    confidence,
    needHumanReview,
  };
}

function normalizeUsage(usage) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = Number(source.prompt_tokens || source.input_tokens || 0);
  const completionTokens = Number(source.completion_tokens || source.output_tokens || 0);
  const totalTokens = Number(source.total_tokens || promptTokens + completionTokens || 0);

  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
    raw: source,
  };
}

function buildRecommendResponse(parts) {
  const listen = parts?.listen || {};
  const compare = parts?.compare || {};
  const request = parts?.request || {};
  const pageText = String(request.pageText || "");
  const recommendedText = String(compare.recommendedText || listen.heardText || pageText);
  const isChanged = recommendedText.trim() !== pageText.trim();
  const listenUsage = normalizeUsage(parts?.listenUsage);
  const compareUsage = normalizeUsage(parts?.compareUsage);

  return {
    recommendedText,
    heardText: String(listen.heardText || ""),
    pageText,
    isChanged,
    needHumanReview: compare.needHumanReview !== false || listen.isValid === false,
    listenConfidence: normalizeConfidence(listen.confidence),
    compareConfidence: normalizeConfidence(compare.confidence),
    decision: String(compare.decision || ""),
    changePoints: Array.isArray(compare.changePoints) ? compare.changePoints : [],
    invalidReasons: normalizeStringArray(listen.invalidReasons),
    model: {
      listen: String(parts?.listenModel || ""),
      compare: String(parts?.compareModel || ""),
    },
    usage: {
      listen: listenUsage,
      compare: compareUsage,
      totalTokens: listenUsage.totalTokens + compareUsage.totalTokens,
    },
    cost: parts?.cost || {
      estimatedCostCny: 0,
      effectiveRevenueCny: 0,
      grossProfitCny: 0,
    },
    requestId: String(parts?.requestId || ""),
  };
}

module.exports = {
  buildRecommendResponse,
  normalizeCompareResponse,
  normalizeConfidence,
  normalizeListenResponse,
  normalizeUsage,
  parseModelJsonText,
};
