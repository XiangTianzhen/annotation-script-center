"use strict";

const {
  SCRIPT_ID,
  normalizeRecommendRequest,
} = require("../backend/ai-service");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeInput(body) {
  const normalizedRecommendRequest = normalizeRecommendRequest(body || {});

  return {
    input: {
      taskId: normalizedRecommendRequest.taskId,
      packageId: normalizedRecommendRequest.packageId,
      taskItemId: normalizedRecommendRequest.taskItemId,
      fileName: normalizedRecommendRequest.fileName,
      audioUrl: normalizedRecommendRequest.audioUrl,
      referenceText: normalizedRecommendRequest.referenceText,
      existingMarkText: normalizedRecommendRequest.existingMarkText,
      duration: normalizedRecommendRequest.duration,
    },
    projectOptions: {
      recognitionMode: normalizedRecommendRequest.recognitionMode,
      listenModel: normalizedRecommendRequest.listenModel,
      compareModel: normalizedRecommendRequest.compareModel,
      singleModel: normalizedRecommendRequest.singleModel,
      enableThinking: normalizedRecommendRequest.enableThinking === true,
    },
    runtimeContext: {
      normalizedRecommendRequest,
      dataBakerRequest: normalizedRecommendRequest.dataBakerRequest,
    },
  };
}

function exposeProjectResult(pipelineResult) {
  if (pipelineResult && typeof pipelineResult === "object" && pipelineResult.data) {
    return pipelineResult.data;
  }
  return pipelineResult && typeof pipelineResult === "object" ? pipelineResult : null;
}

function buildRecommendSuccessBody(context) {
  return {
    success: true,
    requestId: normalizeText(context?.normalizedRequest?.requestId),
    data: context?.execution?.projectResult || null,
  };
}

function buildRecommendErrorBody(context) {
  const error = context?.error || {};
  const responseBody = {
    success: false,
    requestId: normalizeText(context?.requestId || error?.requestId),
    code: normalizeText(error?.code) || "request-error",
    message: normalizeText(error?.safeMessage || error?.message || "Aishell 闽南语助手请求失败。").slice(0, 240),
    scriptId: SCRIPT_ID,
  };
  if (Number(error?.providerStatus) > 0) {
    responseBody.providerStatus = Number(error.providerStatus);
  } else if (Number(error?.statusCode) > 0) {
    responseBody.providerStatus = Number(error.statusCode);
  }
  if (normalizeText(error?.providerCode)) {
    responseBody.providerCode = normalizeText(error.providerCode);
  }
  if (normalizeText(error?.summary)) {
    responseBody.summary = normalizeText(error.summary).slice(0, 200);
  }
  if (error?.hasRawAiDebug === true || normalizeText(error?.debugId)) {
    responseBody.hasRawAiDebug = true;
    responseBody.debugId = normalizeText(error?.debugId);
  }
  if (error?.debugRawJson && typeof error.debugRawJson === "object") {
    responseBody.hasDebugRawJson = true;
  }
  return responseBody;
}

module.exports = {
  projectId: "aishell-tech/minnan-helper",
  platform: "aishell-tech",
  scriptId: SCRIPT_ID,
  routeKey: "recommend",
  normalizeInput,
  exposeProjectResult,
  buildRecommendSuccessBody,
  buildRecommendErrorBody,
};
