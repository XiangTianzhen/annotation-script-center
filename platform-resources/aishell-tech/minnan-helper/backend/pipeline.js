"use strict";

const {
  requestCompare,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  requestOmniInputAudio,
} = require("./dashscope-omni-client");
const {
  requestFunAsrRecognition,
} = require("../../../backend/ai/providers/funasr");
const {
  applyLexiconRewrite,
  buildLexiconContext,
  normalizeCompareResponse,
  normalizeOmniSingleResponse,
  normalizeToSimplifiedChinesePreservingLexicon,
  normalizeUsage,
  parseModelJsonText,
  removeTextSpaces,
} = require("../../../data-baker/round-one-quality/backend/ai-service");
const { buildRecommendCacheKey } = require("./cache");
const {
  DEFAULT_FUN_ASR_MODEL,
  DEFAULT_OMNI_MODEL,
  derivePipelineMode,
} = require("./config");
const { createStageError } = require("./errors");
const { enqueueTask } = require("./queue");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function now() {
  return Date.now();
}

function createPromptObject(systemPrompt, userPrompt) {
  return {
    systemPrompt: String(systemPrompt || "").trim(),
    userPrompt: String(userPrompt || "").trim(),
  };
}

function createListenPrompt(request) {
  return createPromptObject(
    "你是 Aishell 闽南语听音助手。你必须只输出 JSON，不要输出 Markdown 或额外解释。",
    [
      request.aiOptions?.listenPrompt || "",
      "输入：",
      JSON.stringify(
        {
          pageText: request.referenceText,
          fileName: request.fileName,
          duration: request.duration,
          itemNumber: request.itemNumber,
        },
        null,
        2
      ),
    ].join("\n")
  );
}

function createComparePrompt(request, heardText, lexiconContext) {
  const promptLines = [
    request.aiOptions?.comparePrompt || "",
    "输入：",
    JSON.stringify(
      {
        pageText: request.referenceText,
        heardText,
        fileName: request.fileName,
        duration: request.duration,
        itemNumber: request.itemNumber,
      },
      null,
      2
    ),
  ];
  if (lexiconContext?.text) {
    promptLines.splice(1, 0, "词表上下文：", lexiconContext.text);
  }
  return createPromptObject(
    "你是 Aishell 闽南语推荐助手。你必须只输出 JSON，不要输出 Markdown 或额外解释。",
    promptLines.join("\n")
  );
}

function createOmniSinglePrompt(request, lexiconContext) {
  const promptLines = [
    request.aiOptions?.listenPrompt || "",
    "规则：一个请求直接完成听音、对比和推荐文本输出。",
    "输入：",
    JSON.stringify(
      {
        pageText: request.referenceText,
        fileName: request.fileName,
        duration: request.duration,
        itemNumber: request.itemNumber,
      },
      null,
      2
    ),
  ];
  if (lexiconContext?.text) {
    promptLines.splice(2, 0, "词表上下文：", lexiconContext.text);
  }
  return createPromptObject(
    "你是 Aishell 闽南语单模型推荐助手。你必须只输出 JSON，不要输出 Markdown 或额外解释。",
    promptLines.join("\n")
  );
}

function createProviderInput(request) {
  return {
    pageText: request.referenceText,
    readRequire: request.fileName,
    sentenceNumber: request.itemNumber,
    effectiveTime: request.duration,
    audioDuration: request.duration,
    audioUrl: request.audioUrl,
    aiOptions: request.aiOptions,
  };
}

function normalizeListenResponse(modelJson) {
  const heardText = normalizeToSimplifiedChinesePreservingLexicon(
    removeTextSpaces(String(modelJson?.heardText || ""))
  );
  return {
    heardText,
    confidence: Number(modelJson?.confidence || 0) || 0,
    needHumanReview: modelJson?.needHumanReview === true,
  };
}

function normalizeRecommendedText(text) {
  return normalizeToSimplifiedChinesePreservingLexicon(removeTextSpaces(String(text || "")));
}

function buildQueueMeta(queueMetas) {
  const groups = Array.isArray(queueMetas) ? queueMetas : [];
  return {
    groups: groups.map(function (item) {
      return {
        groupName: String(item?.groupName || ""),
        queueWaitMs: Math.max(0, Number(item?.queueWaitMs) || 0),
        retryCount: Math.max(0, Number(item?.retryCount) || 0),
        durationMs: Math.max(0, Number(item?.durationMs) || 0),
        activeCount: Math.max(0, Number(item?.activeCount) || 0),
        maxConcurrent: Math.max(0, Number(item?.maxConcurrent) || 0),
      };
    }),
    totalQueueWaitMs: groups.reduce(function (total, item) {
      return total + Math.max(0, Number(item?.queueWaitMs) || 0);
    }, 0),
  };
}

function buildRetryCount(queueMetas) {
  return (Array.isArray(queueMetas) ? queueMetas : []).reduce(function (total, item) {
    return total + Math.max(0, Number(item?.retryCount) || 0);
  }, 0);
}

function buildErrorMeta(requestId, queueMetas, timing, request, stage) {
  return {
    requestId: normalizeText(requestId),
    stage: normalizeText(stage) || "post_process",
    models: {
      modelMode: normalizeText(request?.modelMode),
      recognitionStrategy: normalizeText(request?.recognitionStrategy),
      pipelineMode: normalizeText(request?.pipelineMode),
      listenModel: normalizeText(request?.listenModel),
      compareModel: normalizeText(request?.compareModel),
      singleModel: normalizeText(request?.singleModel),
      funAsrProvider:
        normalizeText(request?.pipelineMode) === "fun_asr_compare" ? "rest" : "",
    },
    timing: Object.assign({}, timing),
    usage: {},
    queue: buildQueueMeta(queueMetas),
    cache: {
      hit: false,
      sourceRequestId: "",
    },
    debugId: "",
    retryCount: buildRetryCount(queueMetas),
    cancelled: false,
    debug: {
      frontConcurrencyOriginal: request?.frontConcurrency ?? null,
      frontConcurrencyNormalized: request?.frontConcurrency ?? null,
      concurrencyModelType: normalizeText(request?.concurrencyModelType),
    },
  };
}

function ensureNotAborted(signal, requestId, queueMetas, timing, request, stage) {
  if (signal && signal.aborted === true) {
    throw createStageError(stage, signal.reason || new Error("当前同步请求已取消。"), {
      requestId,
      request,
      stage,
      timing,
      queue: buildQueueMeta(queueMetas),
      retryCount: buildRetryCount(queueMetas),
      cancelled: true,
    });
  }
}

function withStageMeta(requestId, request, queueMetas, timing, stage, fn) {
  return Promise.resolve()
    .then(fn)
    .catch(function (error) {
      throw createStageError(stage, error, {
        requestId,
        request,
        stage,
        timing,
        queue: buildQueueMeta(queueMetas),
        retryCount: buildRetryCount(queueMetas),
        cancelled: error?.code === "aborted" || error?.code === "client-disconnected",
      });
    });
}

function getRemainingTimeoutMs(startedAtMs, timeoutMs) {
  return Math.max(1000, Number(timeoutMs) - Math.max(0, now() - startedAtMs));
}

function createRecommendPipeline(overrides) {
  const deps = Object.assign(
    {
      applyLexiconRewrite,
      buildComparePrompt: createComparePrompt,
      buildLexiconContext,
      buildListenPrompt: createListenPrompt,
      buildOmniSinglePrompt: createOmniSinglePrompt,
      enqueueTask,
      normalizeCompareResponse,
      normalizeListenResponse,
      normalizeOmniSingleResponse,
      normalizeRecommendedText,
      normalizeUsage,
      now,
      parseModelJsonText,
      requestCompare,
      requestFunAsrRecognition,
      requestOmniInputAudio,
    },
    overrides || {}
  );

  return {
    async run(normalizedRequest, runtimeOptions) {
      const request = normalizedRequest && typeof normalizedRequest === "object" ? normalizedRequest : {};
      const options = runtimeOptions && typeof runtimeOptions === "object" ? runtimeOptions : {};
      const requestId = normalizeText(options.requestId);
      const startedAtMs = Number(options.startedAtMs || deps.now());
      const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 60000);
      const signal = options.signal || null;
      const queueMetas = [];
      let listenDurationMs = 0;
      let compareDurationMs = 0;
      const pipelineMode = normalizeText(request.pipelineMode) ||
        derivePipelineMode(request.modelMode, request.listenModel, request.singleModel);
      const cacheKey = buildRecommendCacheKey({
        taskItemId: request.taskItemId,
        audioUrl: request.audioUrl,
        referenceText: request.referenceText,
        modelMode: request.modelMode,
        recognitionStrategy: request.recognitionStrategy,
        pipelineMode,
        listenModel: request.listenModel,
        compareModel: request.compareModel,
        singleModel: request.singleModel,
        listenPrompt: request.aiOptions?.listenPrompt,
        comparePrompt: request.aiOptions?.comparePrompt,
      });

      const timing = {
        listenDurationMs: 0,
        compareDurationMs: 0,
        totalDurationMs: 0,
      };

      const providerInput = createProviderInput(request);
      const runQueuedTask = async function runQueuedTask(groupName, stage, task, queueOptions) {
        const queued = await withStageMeta(
          requestId,
          request,
          queueMetas,
          Object.assign({}, timing),
          stage,
          function () {
            return deps.enqueueTask(groupName, task, Object.assign({ signal }, queueOptions || {}));
          }
        );
        queueMetas.push(queued.queueMeta || {});
        return queued.value;
      };

      ensureNotAborted(signal, requestId, queueMetas, timing, request, "queue");

      let heardText = "";
      let decision = "";
      let changePoints = [];
      let needHumanReview = false;
      let compareConfidence = 0;
      let listenConfidence = 0;
      let listenUsage = {};
      let compareUsage = {};
      let activeListenModel = normalizeText(request.listenModel) || DEFAULT_OMNI_MODEL;
      let activeCompareModel = normalizeText(request.compareModel);
      let activeSingleModel = normalizeText(request.singleModel) || DEFAULT_OMNI_MODEL;
      let lexicon = {
        enabled: false,
        rewriteMode: "aggressive",
        rewriteChanged: false,
        matchedCount: 0,
        rewriteChanges: [],
      };

      if (pipelineMode === "omni_single") {
        const lexiconContext = deps.buildLexiconContext({
          pageText: request.referenceText,
          heardText: "",
          limit: 60,
        });
        const prompt = deps.buildOmniSinglePrompt(request, lexiconContext);
        const stageStartedAt = deps.now();
        const omniSingleResult = await runQueuedTask("aishell_qwen_omni", "listen", function () {
          return deps.requestOmniInputAudio(providerInput, prompt, {
            model: activeSingleModel,
            timeoutMs: getRemainingTimeoutMs(startedAtMs, timeoutMs),
            enableThinking: false,
            signal,
          });
        }, {
          modelName: activeSingleModel,
        });
        listenDurationMs = Math.max(0, deps.now() - stageStartedAt);
        timing.listenDurationMs = listenDurationMs;

        const modelJson = deps.parseModelJsonText(omniSingleResult.rawText, {
          requestId,
          stage: "omni_single",
          model: omniSingleResult.model,
        });
        const normalizedSingle = deps.normalizeOmniSingleResponse(modelJson, {
          pageText: request.referenceText,
        });
        const rewriteState = deps.applyLexiconRewrite(
          deps.normalizeRecommendedText(normalizedSingle.recommendedText),
          {
            mode: "aggressive",
          }
        );
        heardText = normalizeText(normalizedSingle.heardText);
        decision = normalizeText(normalizedSingle.decision);
        changePoints = Array.isArray(normalizedSingle.changePoints) ? normalizedSingle.changePoints : [];
        needHumanReview = normalizedSingle.needHumanReview === true || rewriteState.changed === true;
        listenConfidence = Number(normalizedSingle.confidence || 0) || 0;
        compareConfidence = listenConfidence;
        listenUsage = deps.normalizeUsage(omniSingleResult.usage || {});
        compareUsage = {};
        lexicon = {
          enabled: lexiconContext.enabled === true,
          rewriteMode: "aggressive",
          rewriteChanged: rewriteState.changed === true,
          matchedCount: Number(lexiconContext.matchedCount || 0) || 0,
          rewriteChanges: Array.isArray(rewriteState.changes) ? rewriteState.changes : [],
        };

        timing.totalDurationMs = Math.max(0, deps.now() - startedAtMs);
        return {
          cacheEntry: {
            key: cacheKey,
          },
          data: {
            taskId: request.taskId,
            packageId: request.packageId,
            taskItemId: request.taskItemId,
            fileName: request.fileName,
            referenceText: request.referenceText,
            existingMarkText: request.existingMarkText,
            heardText,
            recommendedText: rewriteState.text,
            isChanged: normalizeText(rewriteState.text) !== normalizeText(request.referenceText),
            needHumanReview,
            decision,
            changePoints,
            lexicon,
          },
          meta: {
            requestId,
            stage: "complete",
            models: {
              modelMode: request.modelMode,
              recognitionStrategy: request.recognitionStrategy,
              pipelineMode,
              listenModel: "",
              compareModel: "",
              singleModel: activeSingleModel,
              funAsrProvider: "",
            },
            timing: Object.assign({}, timing),
            usage: {
              promptTokens: Number(listenUsage.promptTokens || 0) || 0,
              completionTokens: Number(listenUsage.completionTokens || 0) || 0,
              totalTokens: Number(listenUsage.totalTokens || 0) || 0,
              listen: listenUsage,
              compare: {},
            },
            queue: buildQueueMeta(queueMetas),
            cache: {
              hit: false,
              sourceRequestId: "",
            },
            debugId: "",
            retryCount: buildRetryCount(queueMetas),
            cancelled: false,
            debug: {
              frontConcurrencyOriginal: request.frontConcurrency ?? null,
              frontConcurrencyNormalized: request.frontConcurrency ?? null,
              concurrencyModelType: normalizeText(request.concurrencyModelType),
            },
          },
        };
      }

      if (pipelineMode === "fun_asr_compare") {
        activeListenModel = DEFAULT_FUN_ASR_MODEL;
        const listenStartedAt = deps.now();
        const funAsrResult = await runQueuedTask("aishell_fun_asr", "listen", function () {
          return deps.requestFunAsrRecognition(providerInput, {
            model: activeListenModel,
            timeoutMs: getRemainingTimeoutMs(startedAtMs, timeoutMs),
            requestId,
            signal,
          });
        }, {
          modelName: activeListenModel,
        });
        listenDurationMs = Math.max(0, deps.now() - listenStartedAt);
        timing.listenDurationMs = listenDurationMs;
        heardText = normalizeText(funAsrResult.heardText);
        listenConfidence = Number(funAsrResult.confidence || 0) || 0;
        listenUsage = deps.normalizeUsage(funAsrResult.usage || {});
      } else {
        const listenPrompt = deps.buildListenPrompt(request);
        const listenStartedAt = deps.now();
        const omniListenResult = await runQueuedTask("aishell_qwen_omni", "listen", function () {
          return deps.requestOmniInputAudio(providerInput, listenPrompt, {
            model: activeListenModel,
            timeoutMs: getRemainingTimeoutMs(startedAtMs, timeoutMs),
            enableThinking: false,
            signal,
          });
        }, {
          modelName: activeListenModel,
        });
        listenDurationMs = Math.max(0, deps.now() - listenStartedAt);
        timing.listenDurationMs = listenDurationMs;
        const listenJson = deps.parseModelJsonText(omniListenResult.rawText, {
          requestId,
          stage: "listen",
          model: omniListenResult.model,
        });
        const normalizedListen = deps.normalizeListenResponse(listenJson, {
          pageText: request.referenceText,
        });
        heardText = normalizeText(normalizedListen.heardText);
        listenConfidence = Number(normalizedListen.confidence || 0) || 0;
        listenUsage = deps.normalizeUsage(omniListenResult.usage || {});
      }

      ensureNotAborted(signal, requestId, queueMetas, timing, request, "compare");

      const lexiconContext = deps.buildLexiconContext({
        pageText: request.referenceText,
        heardText,
        limit: 60,
      });
      const comparePrompt = deps.buildComparePrompt(request, heardText, lexiconContext);
      const compareStartedAt = deps.now();
      const compareResult = await runQueuedTask("aishell_text_compare", "compare", function () {
        return deps.requestCompare(providerInput, comparePrompt, heardText, {
          model: activeCompareModel,
          timeoutMs: getRemainingTimeoutMs(startedAtMs, timeoutMs),
          enableThinking: false,
          signal,
        });
      }, {
        modelName: activeCompareModel,
      });
      compareDurationMs = Math.max(0, deps.now() - compareStartedAt);
      timing.compareDurationMs = compareDurationMs;

      const compareJson = deps.parseModelJsonText(compareResult.rawText, {
        requestId,
        stage: "compare",
        model: compareResult.model,
      });
      const normalizedCompare = deps.normalizeCompareResponse(compareJson, {
        pageText: request.referenceText,
        heardText,
      });
      const rewriteState = deps.applyLexiconRewrite(
        deps.normalizeRecommendedText(normalizedCompare.recommendedText),
        {
          mode: "aggressive",
        }
      );
      changePoints = Array.isArray(normalizedCompare.changePoints) ? normalizedCompare.changePoints : [];
      decision = normalizeText(normalizedCompare.decision);
      needHumanReview =
        normalizedCompare.needHumanReview === true ||
        rewriteState.changed === true;
      compareConfidence = Number(normalizedCompare.confidence || 0) || 0;
      compareUsage = deps.normalizeUsage(compareResult.usage || {});
      lexicon = {
        enabled: lexiconContext.enabled === true,
        rewriteMode: "aggressive",
        rewriteChanged: rewriteState.changed === true,
        matchedCount: Number(lexiconContext.matchedCount || 0) || 0,
        rewriteChanges: Array.isArray(rewriteState.changes) ? rewriteState.changes : [],
      };
      timing.totalDurationMs = Math.max(0, deps.now() - startedAtMs);

      return {
        cacheEntry: {
          key: cacheKey,
        },
        data: {
          taskId: request.taskId,
          packageId: request.packageId,
          taskItemId: request.taskItemId,
          fileName: request.fileName,
          referenceText: request.referenceText,
          existingMarkText: request.existingMarkText,
          heardText,
          recommendedText: rewriteState.text,
          isChanged: normalizeText(rewriteState.text) !== normalizeText(request.referenceText),
          needHumanReview,
          decision,
          changePoints,
          lexicon,
        },
        meta: {
          requestId,
          stage: "complete",
          models: {
            modelMode: request.modelMode,
            recognitionStrategy: request.recognitionStrategy,
            pipelineMode,
            listenModel: activeListenModel,
            compareModel: activeCompareModel,
            singleModel: "",
            funAsrProvider: pipelineMode === "fun_asr_compare" ? "rest" : "",
          },
          timing: Object.assign({}, timing),
          usage: {
            promptTokens:
              Number(listenUsage.promptTokens || 0) + Number(compareUsage.promptTokens || 0),
            completionTokens:
              Number(listenUsage.completionTokens || 0) + Number(compareUsage.completionTokens || 0),
            totalTokens:
              Number(listenUsage.totalTokens || 0) + Number(compareUsage.totalTokens || 0),
            listen: listenUsage,
            compare: compareUsage,
          },
          queue: buildQueueMeta(queueMetas),
          cache: {
            hit: false,
            sourceRequestId: "",
          },
          debugId: "",
          retryCount: buildRetryCount(queueMetas),
          cancelled: false,
          debug: {
            frontConcurrencyOriginal: request.frontConcurrency ?? null,
            frontConcurrencyNormalized: request.frontConcurrency ?? null,
            concurrencyModelType: normalizeText(request.concurrencyModelType),
          },
        },
      };
    },
    buildErrorMeta,
  };
}

module.exports = {
  createRecommendPipeline,
};
