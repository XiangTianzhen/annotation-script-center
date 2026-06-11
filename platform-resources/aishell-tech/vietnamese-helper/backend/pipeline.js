"use strict";

const { estimateProjectCost } = require("../../../backend/ai/model-pricing");
const { requestOmniInputAudio } = require("./dashscope-omni-client");
const { createStageError } = require("./errors");
const { enqueueTask } = require("./queue");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeQueueMeta(queueMeta) {
  const source = queueMeta && typeof queueMeta === "object" ? queueMeta : {};
  return {
    groupName: normalizeText(source.groupName),
    queueWaitMs: Math.max(0, Number(source.queueWaitMs) || 0),
    retryCount: Math.max(0, Number(source.retryCount) || 0),
    durationMs: Math.max(0, Number(source.durationMs) || 0),
    activeCount: Math.max(0, Number(source.activeCount) || 0),
    maxConcurrent: Math.max(0, Number(source.maxConcurrent) || 0),
  };
}

function unwrapQueuedTaskResult(result, fallbackGroupName) {
  if (result && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, "value")) {
    return {
      value: result.value,
      queueMeta: normalizeQueueMeta(result.queueMeta || {
        groupName: fallbackGroupName,
      }),
    };
  }
  return {
    value: result,
    queueMeta: normalizeQueueMeta(
      result && typeof result === "object"
        ? Object.assign(
            {
              groupName: fallbackGroupName,
            },
            result.queueMeta || {}
          )
        : {
            groupName: fallbackGroupName,
          }
    ),
  };
}

function normalizeVietnameseTranscriptionText(text) {
  const value = String(text || "").replace(/[\s\u3000]+/g, " ").trim();
  if (!value) {
    return "";
  }
  const normalized = value
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ")
    .replace(/([,.;:!?])\s+/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return /[.!?…]$/.test(normalized) ? normalized : normalized + ".";
}

function createPromptObject(systemPrompt, userPrompt) {
  return {
    systemPrompt: String(systemPrompt || "").trim(),
    userPrompt: String(userPrompt || "").trim(),
  };
}

function buildRecognizePrompt(request) {
  const promptText = normalizeText(request?.singlePrompt);
  if (promptText) {
    return createPromptObject("", promptText);
  }
  const referenceText = normalizeText(request?.referenceText);
  const existingMarkText = normalizeText(request?.existingMarkText);
  const lines = [
    "你正在处理越南语音频转写。",
    "只输出最终越南语转写文本，不要输出 JSON、Markdown、解释、前缀或引号。",
    "保留越南语重音字符和正常单词空格。",
    "按越南语书写习惯处理标点与空格：去掉标点前多余空格，标点后保持单个空格。",
    "不要翻译成中文，不要改写成其他语言，不要补充词表写法。",
    "如果句末缺少终止标点，请补英文句号。",
    referenceText ? "页面原始文本（仅作上下文参考，不要照抄）： " + referenceText : "",
    existingMarkText ? "当前页面已有文本（仅作参考）： " + existingMarkText : "",
  ].filter(Boolean);
  return createPromptObject("", lines.join("\n"));
}

function normalizeUsage(usage) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = Number(source.prompt_tokens || source.input_tokens || source.promptTokens || 0) || 0;
  const completionTokens =
    Number(source.completion_tokens || source.output_tokens || source.completionTokens || 0) || 0;
  const totalTokens = Number(source.total_tokens || source.totalTokens || 0) || 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: totalTokens || promptTokens + completionTokens,
  };
}

function buildUsageMeta(model, usage) {
  const normalizedUsage = normalizeUsage(usage);
  const cost = estimateProjectCost({
    recognize: {
      modelId: normalizeText(model),
      usage: {
        inputTokens: normalizedUsage.promptTokens,
        outputTokens: normalizedUsage.completionTokens,
        totalTokens: normalizedUsage.totalTokens,
      },
    },
  });
  return {
    promptTokens: normalizedUsage.promptTokens,
    completionTokens: normalizedUsage.completionTokens,
    totalTokens: normalizedUsage.totalTokens,
    estimatedCostCny:
      Number.isFinite(Number(cost?.totalEstimatedCostCny)) && Number(cost.totalEstimatedCostCny) > 0
        ? Number(Number(cost.totalEstimatedCostCny).toFixed(6))
        : "",
  };
}

function createRecommendPipeline(overrides) {
  const deps = Object.assign(
    {
      enqueueTask,
      requestOmniInputAudio,
      createStageError,
    },
    overrides || {}
  );

  async function run(request, runtime) {
    const normalizedRequest = request && typeof request === "object" ? request : {};
    const context = runtime && typeof runtime === "object" ? runtime : {};
    const requestId = normalizeText(context.requestId);
    const signal = context.signal || null;
    const startedAtMs = Number(context.startedAtMs) || Date.now();
    const recognizeStartedAt = Date.now();

    try {
      const queuedRecognizeResult = await deps.enqueueTask(
        "aishell_qwen_omni",
        function () {
          return deps.requestOmniInputAudio(
            {
              audioUrl: normalizedRequest.audioUrl,
              aiOptions: normalizedRequest.requestParams || {},
            },
            buildRecognizePrompt(normalizedRequest),
            {
              model: normalizedRequest.singleModel,
              stage: "recognize",
              timeoutMs: context.timeoutMs,
              signal,
            }
          );
        },
        {
          modelName: normalizedRequest.singleModel,
          signal,
        }
      );
      const recognizeEntry = unwrapQueuedTaskResult(queuedRecognizeResult, "aishell_qwen_omni");
      const recognizeResult =
        recognizeEntry.value && typeof recognizeEntry.value === "object" ? recognizeEntry.value : {};
      const queueMeta = recognizeEntry.queueMeta;
      const recognizeDurationMs = Date.now() - recognizeStartedAt;
      const recommendedText = normalizeVietnameseTranscriptionText(recognizeResult.rawText);
      if (!recommendedText) {
        throw deps.createStageError("recognize", {
          code: "empty-transcription",
          statusCode: 502,
          message: "Omni 未返回可用的越南语转写文本。",
        }, {
          requestId,
        });
      }

      const usage = buildUsageMeta(normalizedRequest.singleModel, recognizeResult.usage);
      return {
        recommendedText,
        referenceText: normalizedRequest.referenceText,
        meta: {
          requestId,
          stage: "complete",
          models: {
            pipelineMode: "omni_single",
            recognizeModel: normalizedRequest.singleModel,
            singleModel: normalizedRequest.singleModel,
          },
          timing: {
            totalDurationMs: Date.now() - startedAtMs,
            recognizeDurationMs,
          },
          usage,
          queue: {
            totalQueueWaitMs: queueMeta.queueWaitMs,
            groups: [queueMeta.groupName || "aishell_qwen_omni"],
          },
          cache: {
            hit: false,
            sourceRequestId: "",
          },
          retryCount: queueMeta.retryCount,
          cancelled: false,
        },
      };
    } catch (error) {
      throw deps.createStageError("recognize", error, {
        requestId,
      });
    }
  }

  return {
    run,
  };
}

module.exports = {
  createRecommendPipeline,
  normalizeVietnameseTranscriptionText,
};
