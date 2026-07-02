"use strict";

const segmentAudioPython = require("./segment-audio-python");

const DEFAULT_SILENCE_THRESHOLD_DBFS = -27;
const DEFAULT_MIN_SILENCE_MS = 400;
const DEFAULT_CONTEXT_PADDING_MS = 200;
const DEFAULT_SEGMENT_SCOPE = "existing-segments-incremental";
const WHOLE_AUDIO_REBUILD_SCOPE = "whole-audio-rebuild-preview";
const SEGMENTATION_PROFILE_DEFAULT = "default";
const SEGMENTATION_PROFILE_VISIBLE_LONG_SILENCE = "visible-long-silence";
const MIN_SEGMENT_MS = 100;
const PREVIEW_MODE_INCREMENTAL = "incremental";
const PREVIEW_MODE_WHOLE_AUDIO_FALLBACK = "whole-audio-fallback";
const ANALYSIS_WINDOW_MS = 30;
const ANALYSIS_SMOOTHING_FRAME_RADIUS = 1;
const ANALYSIS_MAX_SPEECH_BRIDGE_MS = 180;
const VISIBLE_LONG_SILENCE_MIN_MS = 500;
const VISIBLE_LONG_SILENCE_CORE_MIN_MS = 200;
const VISIBLE_LONG_SILENCE_CORE_MAX_MS = 320;
const DEFAULT_CONTIGUOUS_MERGE_TOLERANCE_MS = 10;

function normalizeText(value) {
  return String(value || "").trim();
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = normalizeText(code) || "request-failed";
  return error;
}

function normalizeDbfsThreshold(value, fallback) {
  const fallbackNumber = Number.isFinite(Number(fallback))
    ? Math.round(Number(fallback))
    : DEFAULT_SILENCE_THRESHOLD_DBFS;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallbackNumber;
  }
  const rounded = Math.round(numeric);
  if (rounded < -80 || rounded > -5) {
    return fallbackNumber;
  }
  return rounded;
}

function normalizeSegmentScope(value) {
  const normalized = normalizeText(value);
  if (normalized === WHOLE_AUDIO_REBUILD_SCOPE) {
    return WHOLE_AUDIO_REBUILD_SCOPE;
  }
  return DEFAULT_SEGMENT_SCOPE;
}

function normalizeBuildOptions(options) {
  const source = options && typeof options === "object" ? options : {};
  return {
    route: normalizeText(source.route) || "data-baker-cvpc/liuzhou-helper/segment/preview",
    segmentationProfile:
      normalizeText(source.segmentationProfile) === SEGMENTATION_PROFILE_VISIBLE_LONG_SILENCE
        ? SEGMENTATION_PROFILE_VISIBLE_LONG_SILENCE
        : SEGMENTATION_PROFILE_DEFAULT,
    defaultSilenceThresholdDbfs: normalizeDbfsThreshold(
      source.defaultSilenceThresholdDbfs,
      DEFAULT_SILENCE_THRESHOLD_DBFS
    ),
    mergeContiguousSuggestedSegmentsEnabled:
      source.mergeContiguousSuggestedSegmentsEnabled === false ? false : true,
    contiguousMergeToleranceMs: Math.max(
      0,
      Math.min(
        50,
        Math.round(
          toFiniteNumber(source.contiguousMergeToleranceMs, DEFAULT_CONTIGUOUS_MERGE_TOLERANCE_MS)
        )
      )
    ),
  };
}

function normalizeRangeItem(item) {
  const source = item && typeof item === "object" ? item : {};
  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, source.start || 0)));
  const endMs = Math.max(startMs, Math.round(toFiniteNumber(source.endMs, source.end || startMs)));
  return {
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    reason: normalizeText(source.reason),
  };
}

function normalizeSilentRanges(value) {
  return (Array.isArray(value) ? value : [])
    .map(normalizeRangeItem)
    .filter(function (item) {
      return item.endMs > item.startMs;
    })
    .sort(function (left, right) {
      return left.startMs - right.startMs;
    });
}

function normalizeExistingSegment(item, index) {
  const source = item && typeof item === "object" ? item : {};
  const startMs = Math.max(
    0,
    Math.round(
      toFiniteNumber(
        source.startMs,
        source.start || source.begin || source.from || source.offset || 0
      )
    )
  );
  const durationMs = Math.max(
    0,
    Math.round(toFiniteNumber(source.durationMs, source.duration || 0))
  );
  const endMs = Math.max(
    startMs,
    Math.round(
      toFiniteNumber(
        source.endMs,
        source.end || source.to || source.finish || (durationMs > 0 ? startMs + durationMs : startMs)
      )
    )
  );
  return {
    uniqueId: normalizeText(source.uniqueId || source.unique_id || source.id),
    sourceSegmentNumber: Math.max(
      1,
      Math.round(
        toFiniteNumber(
          source.sourceSegmentNumber,
          source.segmentNumber || source.index || source.order || index + 1
        )
      )
    ),
    startMs,
    endMs,
    kind: normalizeText(source.kind) || "speech",
    reason: normalizeText(source.reason) || "existing-segment",
    needsHumanReview: source.needsHumanReview !== false,
  };
}

function normalizeExistingSegments(value) {
  return (Array.isArray(value) ? value : [])
    .map(normalizeExistingSegment)
    .filter(function (item) {
      return item.endMs > item.startMs;
    })
    .sort(function (left, right) {
      return left.startMs - right.startMs;
    });
}

function normalizeRules(source, segmentScope, options) {
  const input = source && typeof source === "object" ? source : {};
  const buildOptions = normalizeBuildOptions(options);
  return {
    silenceThresholdDbfs: normalizeDbfsThreshold(
      input.silenceThresholdDbfs,
      buildOptions.defaultSilenceThresholdDbfs
    ),
    minSilenceMs: Math.max(
      DEFAULT_MIN_SILENCE_MS,
      Math.round(toFiniteNumber(input.minSilenceMs, DEFAULT_MIN_SILENCE_MS))
    ),
    contextPaddingMs: Math.max(
      0,
      Math.min(
        1500,
        Math.round(toFiniteNumber(input.contextPaddingMs, DEFAULT_CONTEXT_PADDING_MS))
      )
    ),
    segmentScope: normalizeSegmentScope(
      segmentScope || input.segmentScope || input.scope || DEFAULT_SEGMENT_SCOPE
    ),
  };
}

function normalizeSegmentPreviewRequest(body, options) {
  const source = body && typeof body === "object" ? body : {};
  const audioUrl = normalizeText(source.audioUrl);
  const audioDurationMs = Math.max(
    0,
    Math.round(toFiniteNumber(source.audioDurationMs, source.durationMs || source.duration || 0))
  );
  if (!audioUrl && audioDurationMs <= 0) {
    throw createHttpError(
      400,
      "segment/preview 至少需要 audioUrl 或 audioDurationMs。",
      "missing-audio-context"
    );
  }
  const existingSegments = normalizeExistingSegments(
    source.existingSegments ||
      source.currentSegments ||
      source.editorContext?.existingSegments ||
      []
  );
  const segmentScope = normalizeSegmentScope(
    source.segmentScope ||
      source.scope ||
      source.rules?.segmentScope ||
      (existingSegments.length > 0 ? DEFAULT_SEGMENT_SCOPE : WHOLE_AUDIO_REBUILD_SCOPE)
  );
  return {
    audioUrl,
    audioDurationMs,
    editorContext:
      source.editorContext && typeof source.editorContext === "object"
        ? source.editorContext
        : {},
    silentRanges: normalizeSilentRanges(source.silentRanges),
    existingSegments: existingSegments,
    rules: normalizeRules(source.rules, segmentScope, options),
    segmentScope: segmentScope,
  };
}

function resolveMergeContiguousSuggestedSegmentsEnabled(request, options) {
  if (request?.editorContext?.mergeContiguousSuggestedSegmentsEnabled === false) {
    return false;
  }
  const buildOptions = normalizeBuildOptions(options);
  return buildOptions.mergeContiguousSuggestedSegmentsEnabled !== false;
}

function rangesEquivalentToSourceSegment(ranges, segment, toleranceMs) {
  const sourceRanges = Array.isArray(ranges) ? ranges : [];
  if (sourceRanges.length !== 1 || !segment) {
    return false;
  }
  const range = sourceRanges[0];
  const tolerance = Math.max(0, Math.round(Number(toleranceMs || 0)) || 0);
  return (
    Math.abs(Math.round(Number(range.startMs || 0)) - Math.round(Number(segment.startMs || 0))) <=
      tolerance &&
    Math.abs(Math.round(Number(range.endMs || 0)) - Math.round(Number(segment.endMs || 0))) <=
      tolerance
  );
}

function mergeContiguousSuggestedRanges(ranges, toleranceMs) {
  const sourceRanges = (Array.isArray(ranges) ? ranges : [])
    .map(function (item) {
      return {
        startMs: Math.max(0, Math.round(Number(item?.startMs || 0) || 0)),
        endMs: Math.max(0, Math.round(Number(item?.endMs || 0) || 0)),
      };
    })
    .filter(function (item) {
      return item.endMs > item.startMs;
    })
    .sort(function (left, right) {
      return left.startMs - right.startMs;
    });
  if (sourceRanges.length <= 1) {
    return sourceRanges;
  }
  const maxGapMs = Math.max(0, Math.round(Number(toleranceMs || 0)) || 0);
  const merged = [Object.assign({}, sourceRanges[0])];
  for (let index = 1; index < sourceRanges.length; index += 1) {
    const current = sourceRanges[index];
    const previous = merged[merged.length - 1];
    if (Math.abs(current.startMs - previous.endMs) <= maxGapMs) {
      previous.endMs = Math.max(previous.endMs, current.endMs);
      continue;
    }
    merged.push(Object.assign({}, current));
  }
  return merged;
}

function mergeIntersectingRanges(ranges) {
  const source = Array.isArray(ranges) ? ranges.slice() : [];
  if (source.length <= 1) {
    return source;
  }
  const result = [Object.assign({}, source[0])];
  for (let index = 1; index < source.length; index += 1) {
    const current = source[index];
    const previous = result[result.length - 1];
    if (current.startMs <= previous.endMs) {
      previous.endMs = Math.max(previous.endMs, current.endMs);
      previous.durationMs = Math.max(0, previous.endMs - previous.startMs);
      previous.reason = previous.reason || current.reason;
      continue;
    }
    result.push(Object.assign({}, current));
  }
  return result;
}

function buildFallbackSegments(request) {
  if (request.existingSegments.length > 0) {
    return request.existingSegments.slice();
  }
  const audioDurationMs = resolveAudioDurationMs(request);
  if (audioDurationMs <= 0) {
    return [];
  }
  return [
    {
      uniqueId: "",
      sourceSegmentNumber: 1,
      startMs: 0,
      endMs: audioDurationMs,
      kind: "speech",
      reason: "full-audio-fallback",
      needsHumanReview: true,
    },
  ];
}

function resolveAudioDurationMs(request) {
  const existingEndMs = (Array.isArray(request?.existingSegments) ? request.existingSegments : []).reduce(
    function (max, item) {
      return Math.max(max, Math.round(Number(item?.endMs || 0)) || 0);
    },
    0
  );
  const silentEndMs = (Array.isArray(request?.silentRanges) ? request.silentRanges : []).reduce(
    function (max, item) {
      return Math.max(max, Math.round(Number(item?.endMs || 0)) || 0);
    },
    0
  );
  return Math.max(
    0,
    Math.round(Number(request?.audioDurationMs || 0)) || 0,
    existingEndMs,
    silentEndMs
  );
}

function buildWholeAudioRebuildSegments(request) {
  const audioDurationMs = resolveAudioDurationMs(request);
  if (audioDurationMs <= 0) {
    return [];
  }
  return [
    {
      uniqueId: "",
      sourceSegmentNumber: 1,
      startMs: 0,
      endMs: audioDurationMs,
      kind: "speech",
      reason: "whole-audio-fallback-source",
      needsHumanReview: true,
    },
  ];
}

function buildEffectiveSegments(request) {
  if (request.segmentScope === WHOLE_AUDIO_REBUILD_SCOPE) {
    return buildWholeAudioRebuildSegments(request);
  }
  return buildFallbackSegments(request);
}

function getAudioAnalyzer(options) {
  if (options && typeof options.analyzeAudio === "function") {
    return options.analyzeAudio;
  }
  return segmentAudioPython.analyzeAudioSegments;
}

async function resolveSilentRangesFromBackend(request, options) {
  if (request.silentRanges.length > 0 || !request.audioUrl) {
    return {
      silentRanges: request.silentRanges,
      audioDurationMs: request.audioDurationMs,
      analysisMeta: null,
      analysisSource: request.silentRanges.length > 0 ? "request-body" : "",
    };
  }
  const analyzer = getAudioAnalyzer(options);
  const analysisResult = await analyzer({
    audioUrl: request.audioUrl,
    silenceThresholdDbfs: request.rules.silenceThresholdDbfs,
    minSilenceMs: request.rules.minSilenceMs,
    windowMs: ANALYSIS_WINDOW_MS,
    smoothingFrameRadius: ANALYSIS_SMOOTHING_FRAME_RADIUS,
    maxSpeechBridgeMs: ANALYSIS_MAX_SPEECH_BRIDGE_MS,
    requestId: request.editorContext?.requestId || "",
  });
  return {
    silentRanges: normalizeSilentRanges(analysisResult?.silentRanges),
    audioDurationMs: Math.max(
      request.audioDurationMs,
      Math.round(Number(analysisResult?.audioDurationMs || 0)) || 0
    ),
    analysisMeta:
      analysisResult?.analysisMeta && typeof analysisResult.analysisMeta === "object"
        ? analysisResult.analysisMeta
        : null,
    analysisSource: normalizeText(analysisResult?.analysisSource) || "backend-python-audio-url",
  };
}

function buildInternalSilences(segment, silentRanges, rules) {
  const intersections = silentRanges
    .map(function (range) {
      const startMs = Math.max(segment.startMs, range.startMs);
      const endMs = Math.min(segment.endMs, range.endMs);
      return {
        startMs,
        endMs,
        durationMs: Math.max(0, endMs - startMs),
      };
    })
    .filter(function (range) {
      return (
        range.durationMs >= rules.minSilenceMs &&
        range.startMs > segment.startMs &&
        range.endMs < segment.endMs
      );
    })
    .sort(function (left, right) {
      return left.startMs - right.startMs;
    });
  return mergeIntersectingRanges(intersections);
}

function buildSpeechRanges(segment, silences) {
  const result = [];
  let cursorStart = segment.startMs;
  silences.forEach(function (silence) {
    if (silence.startMs - cursorStart >= MIN_SEGMENT_MS) {
      result.push({
        startMs: cursorStart,
        endMs: silence.startMs,
      });
    }
    cursorStart = Math.max(cursorStart, silence.endMs);
  });
  if (segment.endMs - cursorStart >= MIN_SEGMENT_MS) {
    result.push({
      startMs: cursorStart,
      endMs: segment.endMs,
    });
  }
  return result;
}

function resolveProtectedSilencePaddingAllowance(silence, rules, options) {
  const desiredPaddingMs = Math.max(0, Math.round(Number(rules?.contextPaddingMs || 0)) || 0);
  if (!silence) {
    return desiredPaddingMs;
  }
  const buildOptions = normalizeBuildOptions(options);
  if (
    buildOptions.segmentationProfile !== SEGMENTATION_PROFILE_VISIBLE_LONG_SILENCE ||
    silence.durationMs < VISIBLE_LONG_SILENCE_MIN_MS
  ) {
    return desiredPaddingMs;
  }
  const retainedSilenceCoreMs = clamp(
    Math.round(silence.durationMs * 0.4),
    VISIBLE_LONG_SILENCE_CORE_MIN_MS,
    VISIBLE_LONG_SILENCE_CORE_MAX_MS
  );
  const availablePaddingPerSideMs = Math.max(
    0,
    Math.floor((silence.durationMs - retainedSilenceCoreMs) / 2)
  );
  return Math.min(desiredPaddingMs, availablePaddingPerSideMs);
}

function padSpeechRanges(segment, speechRanges, silences, rules, options) {
  const padded = speechRanges
    .map(function (range, index) {
      const previousSilence = index > 0 ? silences[index - 1] : null;
      const nextSilence = index < silences.length ? silences[index] : null;
      return {
        startMs: clamp(
          range.startMs - resolveProtectedSilencePaddingAllowance(previousSilence, rules, options),
          segment.startMs,
          segment.endMs
        ),
        endMs: clamp(
          range.endMs + resolveProtectedSilencePaddingAllowance(nextSilence, rules, options),
          segment.startMs,
          segment.endMs
        ),
      };
    })
    .filter(function (range) {
      return range.endMs > range.startMs;
    });

  for (let index = 1; index < padded.length; index += 1) {
    const previous = padded[index - 1];
    const current = padded[index];
    if (previous.endMs <= current.startMs) {
      continue;
    }
    const midpoint = Math.round((previous.endMs + current.startMs) / 2);
    previous.endMs = midpoint;
    current.startMs = midpoint;
  }

  return padded.filter(function (range) {
    return range.endMs - range.startMs >= MIN_SEGMENT_MS;
  });
}

function buildSegmentChange(segment, silentRanges, rules, options) {
  const buildOptions = normalizeBuildOptions(options);
  const internalSilences = buildInternalSilences(segment, silentRanges, rules);
  if (internalSilences.length === 0) {
    return {
      proposedSegments: [
        {
          sourceUniqueId: segment.uniqueId,
          sourceSegmentNumber: segment.sourceSegmentNumber,
          originalStartMs: segment.startMs,
          originalEndMs: segment.endMs,
          startMs: segment.startMs,
          endMs: segment.endMs,
          kind: segment.kind,
          needsHumanReview: segment.needsHumanReview !== false,
          reason: segment.reason || "existing-segment",
        },
      ],
      change: null,
      matchedInternalSilence: false,
      splitSuppressed: false,
    };
  }

  const speechRanges = buildSpeechRanges(segment, internalSilences);
  const suggestedSegments = padSpeechRanges(
    segment,
    speechRanges,
    internalSilences,
    rules,
    buildOptions
  );
  const normalizedSuggestedSegments =
    resolveMergeContiguousSuggestedSegmentsEnabled(
      {
        editorContext: options?.editorContext,
      },
      buildOptions
    ) !== false
      ? mergeContiguousSuggestedRanges(
          suggestedSegments,
          buildOptions.contiguousMergeToleranceMs
        )
      : suggestedSegments;
  if (normalizedSuggestedSegments.length <= 1) {
    const mergedBackToSource = rangesEquivalentToSourceSegment(
      normalizedSuggestedSegments,
      segment,
      buildOptions.contiguousMergeToleranceMs
    );
    return {
      proposedSegments: [
        {
          sourceUniqueId: segment.uniqueId,
          sourceSegmentNumber: segment.sourceSegmentNumber,
          originalStartMs: segment.startMs,
          originalEndMs: segment.endMs,
          startMs: segment.startMs,
          endMs: segment.endMs,
          kind: segment.kind,
          needsHumanReview: true,
          reason: segment.reason || "existing-segment",
        },
      ],
      change: null,
      matchedInternalSilence: true,
      splitSuppressed: mergedBackToSource !== true,
      mergedBackToSource: mergedBackToSource,
    };
  }

  return {
    proposedSegments: normalizedSuggestedSegments.map(function (range) {
      return {
        sourceUniqueId: segment.uniqueId,
        sourceSegmentNumber: segment.sourceSegmentNumber,
        originalStartMs: segment.startMs,
        originalEndMs: segment.endMs,
        startMs: range.startMs,
        endMs: range.endMs,
        kind: segment.kind,
        needsHumanReview: true,
        reason: "silence>=400ms",
      };
    }),
    change: {
      sourceUniqueId: segment.uniqueId,
      sourceSegmentNumber: segment.sourceSegmentNumber,
      originalStartMs: segment.startMs,
      originalEndMs: segment.endMs,
      reason: "silence>=400ms",
      suggestedSegments: normalizedSuggestedSegments.map(function (range) {
        return {
          startMs: range.startMs,
          endMs: range.endMs,
        };
      }),
    },
    matchedInternalSilence: true,
    splitSuppressed: false,
    mergedBackToSource: false,
  };
}

function resolvePreviewMode(request) {
  return request.segmentScope === WHOLE_AUDIO_REBUILD_SCOPE || request.existingSegments.length <= 0
    ? PREVIEW_MODE_WHOLE_AUDIO_FALLBACK
    : PREVIEW_MODE_INCREMENTAL;
}

function resolveEmptyReason(request, summary) {
  const stats = summary && typeof summary === "object" ? summary : {};
  const changeCount = Math.max(0, Math.round(Number(stats.changeCount || 0)) || 0);
  if (changeCount > 0) {
    return "";
  }
  if ((Array.isArray(request?.silentRanges) ? request.silentRanges : []).length === 0) {
    return "no-silence";
  }
  if (stats.matchedInternalSilence !== true) {
    return "no-internal-hit";
  }
  if (stats.mergedBackToSource === true) {
    return "contiguous-merged";
  }
  if (stats.splitSuppressed === true) {
    return "insufficient-split";
  }
  return "no-internal-hit";
}

async function buildSegmentPreview(input, options) {
  const buildOptions = normalizeBuildOptions(options);
  const request = normalizeSegmentPreviewRequest(input, buildOptions);
  const effectiveBuildOptions = Object.assign({}, buildOptions, {
    editorContext: request.editorContext,
    mergeContiguousSuggestedSegmentsEnabled: resolveMergeContiguousSuggestedSegmentsEnabled(
      request,
      buildOptions
    ),
  });
  const resolvedAnalysis = await resolveSilentRangesFromBackend(request, options);
  const resolvedRequest = Object.assign({}, request, {
    audioDurationMs: resolvedAnalysis.audioDurationMs,
    silentRanges: resolvedAnalysis.silentRanges,
  });
  const effectiveSegments = buildEffectiveSegments(resolvedRequest);
  const changes = [];
  const proposedSegments = [];
  let matchedInternalSilence = false;
  let splitSuppressed = false;
  let mergedBackToSource = false;

  effectiveSegments.forEach(function (segment) {
    const result = buildSegmentChange(
      segment,
      resolvedRequest.silentRanges,
      resolvedRequest.rules,
      effectiveBuildOptions
    );
    proposedSegments.push.apply(proposedSegments, result.proposedSegments);
    if (result.change) {
      changes.push(result.change);
    }
    matchedInternalSilence = matchedInternalSilence || result.matchedInternalSilence === true;
    splitSuppressed = splitSuppressed || result.splitSuppressed === true;
    mergedBackToSource = mergedBackToSource || result.mergedBackToSource === true;
  });

  proposedSegments.sort(function (left, right) {
    return left.startMs - right.startMs;
  });

  const previewMode = resolvePreviewMode(resolvedRequest);
  const emptyReason = resolveEmptyReason(resolvedRequest, {
    changeCount: changes.length,
    matchedInternalSilence,
    splitSuppressed,
    mergedBackToSource,
  });

  return {
    success: true,
    data: {
      proposedSegments,
      changes,
    },
    meta: {
      source: resolvedRequest.segmentScope || DEFAULT_SEGMENT_SCOPE,
      previewMode: previewMode,
      applyAllowed:
        previewMode === PREVIEW_MODE_INCREMENTAL &&
        resolvedRequest.existingSegments.length > 0 &&
        changes.length > 0,
      emptyReason: emptyReason,
      analysisSource: resolvedAnalysis.analysisSource,
      analysisMeta: resolvedAnalysis.analysisMeta,
      rules: {
        silenceThresholdDbfs: resolvedRequest.rules.silenceThresholdDbfs,
        minSilenceMs: resolvedRequest.rules.minSilenceMs,
        contextPaddingMs: resolvedRequest.rules.contextPaddingMs,
        segmentScope:
          resolvedRequest.segmentScope ||
          resolvedRequest.rules.segmentScope ||
          DEFAULT_SEGMENT_SCOPE,
        mergeContiguousSuggestedSegmentsEnabled:
          effectiveBuildOptions.mergeContiguousSuggestedSegmentsEnabled !== false,
      },
      contractMode: "dom-guarded-manual-save",
    },
  };
}

function createSegmentHealthPayload(options) {
  const buildOptions = normalizeBuildOptions(options);
  return {
    success: true,
    route: buildOptions.route,
    rules: {
      silenceThresholdDbfs: buildOptions.defaultSilenceThresholdDbfs,
      minSilenceMs: DEFAULT_MIN_SILENCE_MS,
      contextPaddingMs: DEFAULT_CONTEXT_PADDING_MS,
      segmentScope: DEFAULT_SEGMENT_SCOPE,
      minSegmentMs: MIN_SEGMENT_MS,
      analysisWindowMs: ANALYSIS_WINDOW_MS,
      smoothingFrameRadius: ANALYSIS_SMOOTHING_FRAME_RADIUS,
      maxSpeechBridgeMs: ANALYSIS_MAX_SPEECH_BRIDGE_MS,
      contiguousMergeToleranceMs: DEFAULT_CONTIGUOUS_MERGE_TOLERANCE_MS,
    },
    supportedScopes: {
      default: DEFAULT_SEGMENT_SCOPE,
      values: [DEFAULT_SEGMENT_SCOPE, WHOLE_AUDIO_REBUILD_SCOPE],
      previewOnly: [WHOLE_AUDIO_REBUILD_SCOPE],
    },
    contract: {
      mode: "dom-guarded-manual-save",
      writeContractCaptured: "page-dom-only",
      analysisSource: "backend-python-audio-url",
    },
  };
}

module.exports = {
  DEFAULT_CONTEXT_PADDING_MS,
  DEFAULT_MIN_SILENCE_MS,
  DEFAULT_SEGMENT_SCOPE,
  DEFAULT_SILENCE_THRESHOLD_DBFS,
  MIN_SEGMENT_MS,
  PREVIEW_MODE_INCREMENTAL,
  PREVIEW_MODE_WHOLE_AUDIO_FALLBACK,
  SEGMENTATION_PROFILE_VISIBLE_LONG_SILENCE,
  WHOLE_AUDIO_REBUILD_SCOPE,
  buildSegmentPreview,
  createHttpError,
  createSegmentHealthPayload,
  normalizeExistingSegments,
  normalizeSegmentPreviewRequest,
  normalizeSilentRanges,
};
