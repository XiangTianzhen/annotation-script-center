"use strict";

const DEFAULT_SILENCE_THRESHOLD_DBFS = -27;
const DEFAULT_MIN_SILENCE_MS = 400;
const DEFAULT_CONTEXT_PADDING_MS = 100;
const DEFAULT_SEGMENT_SCOPE = "existing-segments-incremental";
const WHOLE_AUDIO_REBUILD_SCOPE = "whole-audio-rebuild-preview";
const MIN_SEGMENT_MS = 100;
const PREVIEW_MODE_INCREMENTAL = "incremental";
const PREVIEW_MODE_WHOLE_AUDIO_FALLBACK = "whole-audio-fallback";

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

function normalizeRules(source) {
  const input = source && typeof source === "object" ? source : {};
  return {
    silenceThresholdDbfs: normalizeDbfsThreshold(
      input.silenceThresholdDbfs,
      DEFAULT_SILENCE_THRESHOLD_DBFS
    ),
    minSilenceMs: Math.max(
      DEFAULT_MIN_SILENCE_MS,
      Math.round(toFiniteNumber(input.minSilenceMs, DEFAULT_MIN_SILENCE_MS))
    ),
    contextPaddingMs: Math.max(
      0,
      Math.round(toFiniteNumber(input.contextPaddingMs, DEFAULT_CONTEXT_PADDING_MS))
    ),
    segmentScope: normalizeSegmentScope(
      input.segmentScope || input.scope || DEFAULT_SEGMENT_SCOPE
    ),
  };
}

function normalizeSegmentPreviewRequest(body) {
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
  return {
    audioUrl,
    audioDurationMs,
    editorContext: source.editorContext && typeof source.editorContext === "object"
      ? source.editorContext
      : {},
    silentRanges: normalizeSilentRanges(source.silentRanges),
    existingSegments: normalizeExistingSegments(
      source.existingSegments ||
        source.currentSegments ||
        source.editorContext?.existingSegments ||
        []
    ),
    rules: normalizeRules(source.rules),
    segmentScope: normalizeSegmentScope(
      source.segmentScope || source.scope || source.rules?.segmentScope
    ),
  };
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

function padSpeechRanges(segment, speechRanges, rules) {
  const padded = speechRanges
    .map(function (range) {
      return {
        startMs: clamp(range.startMs - rules.contextPaddingMs, segment.startMs, segment.endMs),
        endMs: clamp(range.endMs + rules.contextPaddingMs, segment.startMs, segment.endMs),
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

function buildSegmentChange(segment, silentRanges, rules) {
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
  const suggestedSegments = padSpeechRanges(segment, speechRanges, rules);
  if (suggestedSegments.length <= 1) {
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
      splitSuppressed: true,
    };
  }

  return {
    proposedSegments: suggestedSegments.map(function (range) {
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
      suggestedSegments: suggestedSegments.map(function (range) {
        return {
          startMs: range.startMs,
          endMs: range.endMs,
        };
      }),
    },
    matchedInternalSilence: true,
    splitSuppressed: false,
  };
}

function resolvePreviewMode(segmentScope) {
  return segmentScope === WHOLE_AUDIO_REBUILD_SCOPE
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
  if (stats.splitSuppressed === true) {
    return "insufficient-split";
  }
  return "no-internal-hit";
}

function buildSegmentPreview(input) {
  const request = normalizeSegmentPreviewRequest(input);
  const effectiveSegments = buildEffectiveSegments(request);
  const changes = [];
  const proposedSegments = [];
  let matchedInternalSilence = false;
  let splitSuppressed = false;

  effectiveSegments.forEach(function (segment) {
    const result = buildSegmentChange(segment, request.silentRanges, request.rules);
    proposedSegments.push.apply(proposedSegments, result.proposedSegments);
    if (result.change) {
      changes.push(result.change);
    }
    matchedInternalSilence = matchedInternalSilence || result.matchedInternalSilence === true;
    splitSuppressed = splitSuppressed || result.splitSuppressed === true;
  });

  proposedSegments.sort(function (left, right) {
    return left.startMs - right.startMs;
  });

  const previewMode = resolvePreviewMode(request.segmentScope);
  const emptyReason = resolveEmptyReason(request, {
    changeCount: changes.length,
    matchedInternalSilence,
    splitSuppressed,
  });

  return {
    success: true,
    data: {
      proposedSegments,
      changes,
    },
    meta: {
      source: request.segmentScope || DEFAULT_SEGMENT_SCOPE,
      previewMode: previewMode,
      applyAllowed: previewMode === PREVIEW_MODE_INCREMENTAL && changes.length > 0,
      emptyReason: emptyReason,
      rules: {
        silenceThresholdDbfs: request.rules.silenceThresholdDbfs,
        minSilenceMs: request.rules.minSilenceMs,
        contextPaddingMs: request.rules.contextPaddingMs,
        segmentScope: request.segmentScope || request.rules.segmentScope || DEFAULT_SEGMENT_SCOPE,
      },
      contractMode: "dom-guarded-manual-save",
    },
  };
}

function createSegmentHealthPayload() {
  return {
    success: true,
    route: "data-baker-cvpc/liuzhou-helper/segment/preview",
    rules: {
      silenceThresholdDbfs: DEFAULT_SILENCE_THRESHOLD_DBFS,
      minSilenceMs: DEFAULT_MIN_SILENCE_MS,
      contextPaddingMs: DEFAULT_CONTEXT_PADDING_MS,
      segmentScope: DEFAULT_SEGMENT_SCOPE,
      minSegmentMs: MIN_SEGMENT_MS,
    },
    supportedScopes: {
      default: DEFAULT_SEGMENT_SCOPE,
      values: [DEFAULT_SEGMENT_SCOPE, WHOLE_AUDIO_REBUILD_SCOPE],
      previewOnly: [WHOLE_AUDIO_REBUILD_SCOPE],
    },
    contract: {
      mode: "dom-guarded-manual-save",
      writeContractCaptured: "page-dom-only",
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
  WHOLE_AUDIO_REBUILD_SCOPE,
  buildSegmentPreview,
  createHttpError,
  createSegmentHealthPayload,
  normalizeExistingSegments,
  normalizeSegmentPreviewRequest,
  normalizeSilentRanges,
};
