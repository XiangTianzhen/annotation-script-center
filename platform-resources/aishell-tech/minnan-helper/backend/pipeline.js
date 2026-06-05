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
  DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD,
  DEFAULT_FUN_ASR_MODEL,
  DEFAULT_OMNI_MODEL,
  derivePipelineMode,
  normalizeRecognitionStrategy,
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

function isAudioFirstReferenceStrategy(request) {
  return normalizeRecognitionStrategy(request?.recognitionStrategy, "mandarin_to_dialect") ===
    "audio_first_reference";
}

function normalizeAudioFirstReferenceCorrectionThreshold(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_AUDIO_FIRST_REFERENCE_CORRECTION_THRESHOLD;
  }
  return Math.max(0, Math.min(1, Number(number.toFixed(3))));
}

function normalizeCorrectionConfidence(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.max(0, Math.min(1, Number(number.toFixed(3))));
}

function normalizeCandidatePairs(changes) {
  const source = Array.isArray(changes) ? changes : [];
  const seen = new Set();
  const result = [];
  source.forEach(function (item) {
    const sourceText = normalizeText(item?.sourceText || item?.from);
    const candidateText = normalizeText(item?.candidateText || item?.to);
    const pairSource = normalizeText(item?.source) || "csv";
    if (!sourceText || !candidateText || sourceText === candidateText) {
      return;
    }
    const key = [sourceText, candidateText, pairSource].join("\u0000");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push({
      sourceText,
      candidateText,
      source: pairSource === "base" ? "base" : "csv",
    });
  });
  return result;
}

function normalizeAudioFirstReferenceCandidateResponse(modelJson, deps, referenceText) {
  const source = modelJson && typeof modelJson === "object" ? modelJson : {};
  const fallbackText = normalizeText(referenceText);
  const candidateText = deps.normalizeRecommendedText(
    source.candidateText || source.lexiconCandidateText || source.recommendedText || fallbackText
  );
  const candidatePairs = normalizeCandidatePairs(source.candidatePairs || source.changes);
  return {
    enabled: Boolean(candidateText),
    lexiconCandidateText: candidateText,
    candidatePairs,
    candidateDiffCount: candidatePairs.length,
    confidence: normalizeCorrectionConfidence(source.confidence),
    needHumanReview: source.needHumanReview === true,
  };
}

function normalizeCandidateDecisions(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(0, 20)
    .map(function (item) {
      const source = item && typeof item === "object" ? item : {};
      return {
        sourceText: normalizeText(source.sourceText),
        candidateText: normalizeText(source.candidateText),
        heardFragment: normalizeText(source.heardFragment),
        applyCandidate: source.applyCandidate === true,
        confidence: normalizeCorrectionConfidence(source.confidence),
        reason: normalizeText(source.reason).slice(0, 240),
      };
    })
    .filter(function (item) {
      return item.sourceText || item.candidateText || item.heardFragment;
    });
}

function buildAudioFirstReferenceMeta(compareJson, correctionContext, correctionThreshold) {
  const source = compareJson && typeof compareJson === "object" ? compareJson : {};
  const context = correctionContext && typeof correctionContext === "object" ? correctionContext : {};
  return {
    candidateText: normalizeText(context.lexiconCandidateText),
    candidatePairs: Array.isArray(context.candidatePairs) ? context.candidatePairs : [],
    candidateConfidence: normalizeCorrectionConfidence(context.confidence),
    candidateNeedHumanReview: context.needHumanReview === true,
    correctionThreshold: normalizeAudioFirstReferenceCorrectionThreshold(correctionThreshold),
    correctionConfidence: normalizeCorrectionConfidence(source.correctionConfidence),
    candidateDecisions: normalizeCandidateDecisions(source.candidateDecisions),
  };
}

function resolveAudioFirstReferenceCompareResult(input) {
  const source = input && typeof input === "object" ? input : {};
  const normalizedCompare =
    source.normalizedCompare && typeof source.normalizedCompare === "object"
      ? source.normalizedCompare
      : {};
  const heardText = normalizeText(source.heardText);
  const meta = source.meta && typeof source.meta === "object" ? source.meta : {};
  const candidatePairs = Array.isArray(meta.candidatePairs) ? meta.candidatePairs : [];
  const candidateDecisions = Array.isArray(meta.candidateDecisions) ? meta.candidateDecisions : [];
  const correctionConfidence = normalizeCorrectionConfidence(meta.correctionConfidence);
  const correctionThreshold = normalizeAudioFirstReferenceCorrectionThreshold(
    meta.correctionThreshold
  );
  const normalizedRecommendedText = normalizeText(normalizedCompare.recommendedText);
  const candidateText = normalizeText(meta.candidateText);
  const correctionAttempted =
    Boolean(candidateText) &&
    normalizedRecommendedText &&
    normalizedRecommendedText !== heardText;
  const shouldKeepHeardText =
    correctionAttempted === true &&
    correctionConfidence !== null &&
    correctionConfidence < correctionThreshold;

  return {
    recommendedText: shouldKeepHeardText === true
      ? heardText
      : normalizedCompare.recommendedText,
    needHumanReview:
      normalizedCompare.needHumanReview === true ||
      (candidatePairs.length > 0 &&
        correctionConfidence !== null &&
        correctionConfidence < correctionThreshold) ||
      (candidateDecisions.length > 0 &&
        candidateDecisions.some(function (item) {
          return item.applyCandidate !== true && item.confidence !== null && item.confidence < correctionThreshold;
        })),
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

function createCandidatePrompt(request, lexiconContext) {
  const candidateInput = {
    pageText: request.referenceText,
    fileName: request.fileName,
    duration: request.duration,
    itemNumber: request.itemNumber,
  };
  const promptLines = [request.aiOptions?.candidatePrompt || ""];
  if (lexiconContext?.text) {
    promptLines.push("词表上下文：", lexiconContext.text);
  }
  promptLines.push("输入：", JSON.stringify(candidateInput, null, 2));
  return createPromptObject(
    "你是 Aishell 闽南语词表转写助手。你必须只输出 JSON，不要输出 Markdown 或额外解释。",
    promptLines.join("\n")
  );
}

function createComparePrompt(request, heardText, lexiconContext, correctionContext) {
  const compareInput = {
    pageText: request.referenceText,
    heardText,
    fileName: request.fileName,
    duration: request.duration,
    itemNumber: request.itemNumber,
  };
  const promptLines = [request.aiOptions?.comparePrompt || ""];
  if (lexiconContext?.text) {
    promptLines.push("词表上下文：", lexiconContext.text);
  }
  if (isAudioFirstReferenceStrategy(request) && correctionContext?.enabled === true) {
    compareInput.lexiconCandidateText = correctionContext.lexiconCandidateText;
    compareInput.candidatePairs = Array.isArray(correctionContext.candidatePairs)
      ? correctionContext.candidatePairs
      : [];
    compareInput.candidateDiffCount = Number(correctionContext.candidateDiffCount || 0) || 0;
    compareInput.audioFirstReferenceCorrectionThreshold =
      normalizeAudioFirstReferenceCorrectionThreshold(
        request.aiOptions?.audioFirstReferenceCorrectionThreshold
      );
    promptLines.push(
      "词表候选校正：",
      JSON.stringify(
        {
          lexiconCandidateText: compareInput.lexiconCandidateText,
          candidatePairs: compareInput.candidatePairs,
          candidateDiffCount: compareInput.candidateDiffCount,
          audioFirstReferenceCorrectionThreshold:
            compareInput.audioFirstReferenceCorrectionThreshold,
        },
        null,
        2
      )
    );
  }
  promptLines.push(
    "输入：",
    JSON.stringify(compareInput, null, 2)
  );
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

function resolveLexiconRewriteMode(recognitionStrategy) {
  return normalizeRecognitionStrategy(recognitionStrategy, "mandarin_to_dialect") ===
    "audio_first_reference"
    ? "off"
    : "aggressive";
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
      buildCandidatePrompt: createCandidatePrompt,
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
      let candidateDurationMs = 0;
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
        candidatePrompt: request.aiOptions?.candidatePrompt,
        listenPrompt: request.aiOptions?.listenPrompt,
        comparePrompt: request.aiOptions?.comparePrompt,
        audioFirstReferenceCandidatePromptVersion:
          normalizeRecognitionStrategy(request.recognitionStrategy, "audio_first_reference") ===
          "audio_first_reference"
            ? "text-model-v1"
            : "",
        audioFirstReferenceCorrectionThreshold:
          request.aiOptions?.audioFirstReferenceCorrectionThreshold,
      });

      const timing = {
        listenDurationMs: 0,
        candidateDurationMs: 0,
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
      let audioFirstReferenceMeta = null;
      let activeListenModel = normalizeText(request.listenModel) || DEFAULT_OMNI_MODEL;
      let activeCompareModel = normalizeText(request.compareModel);
      let activeSingleModel = normalizeText(request.singleModel) || DEFAULT_OMNI_MODEL;
      const lexiconRewriteMode = resolveLexiconRewriteMode(request.recognitionStrategy);
      let lexicon = {
        enabled: false,
        rewriteMode: lexiconRewriteMode,
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
            mode: lexiconRewriteMode,
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
          rewriteMode: lexiconRewriteMode,
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

      ensureNotAborted(signal, requestId, queueMetas, timing, request, "candidate");

      const lexiconContext = deps.buildLexiconContext({
        pageText: request.referenceText,
        heardText,
        limit: 60,
      });
      let correctionContext = null;
      if (isAudioFirstReferenceStrategy(request)) {
        const candidatePrompt = deps.buildCandidatePrompt(request, lexiconContext);
        const candidateStartedAt = deps.now();
        const candidateResult = await runQueuedTask("aishell_text_compare", "candidate", function () {
          return deps.requestCompare(providerInput, candidatePrompt, "", {
            model: activeCompareModel,
            timeoutMs: getRemainingTimeoutMs(startedAtMs, timeoutMs),
            enableThinking: false,
            signal,
            stage: "candidate",
          });
        }, {
          modelName: activeCompareModel,
        });
        candidateDurationMs = Math.max(0, deps.now() - candidateStartedAt);
        timing.candidateDurationMs = candidateDurationMs;
        const candidateJson = deps.parseModelJsonText(candidateResult.rawText, {
          requestId,
          stage: "candidate",
          model: candidateResult.model,
        });
        correctionContext = normalizeAudioFirstReferenceCandidateResponse(
          candidateJson,
          deps,
          request.referenceText
        );
      }
      ensureNotAborted(signal, requestId, queueMetas, timing, request, "compare");
      const comparePrompt = deps.buildComparePrompt(
        request,
        heardText,
        lexiconContext,
        correctionContext
      );
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
      if (isAudioFirstReferenceStrategy(request)) {
        audioFirstReferenceMeta = buildAudioFirstReferenceMeta(
          compareJson,
          correctionContext,
          request.aiOptions?.audioFirstReferenceCorrectionThreshold
        );
      }
      const resolvedCompare = isAudioFirstReferenceStrategy(request)
        ? resolveAudioFirstReferenceCompareResult({
            normalizedCompare,
            heardText,
            meta: audioFirstReferenceMeta,
          })
        : normalizedCompare;
      const rewriteState = deps.applyLexiconRewrite(
        deps.normalizeRecommendedText(resolvedCompare.recommendedText),
        {
          mode: lexiconRewriteMode,
        }
      );
      changePoints = Array.isArray(normalizedCompare.changePoints) ? normalizedCompare.changePoints : [];
      decision = normalizeText(normalizedCompare.decision);
      needHumanReview =
        resolvedCompare.needHumanReview === true ||
        rewriteState.changed === true;
      compareConfidence = Number(normalizedCompare.confidence || 0) || 0;
      compareUsage = deps.normalizeUsage(compareResult.usage || {});
      lexicon = {
        enabled: lexiconContext.enabled === true,
        rewriteMode: lexiconRewriteMode,
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
          audioFirstReference: audioFirstReferenceMeta,
        },
      };
    },
    buildErrorMeta,
  };
}

module.exports = {
  createRecommendPipeline,
};
