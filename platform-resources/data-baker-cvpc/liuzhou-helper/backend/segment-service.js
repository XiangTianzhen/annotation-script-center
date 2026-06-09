"use strict";

const DEFAULT_SILENCE_THRESHOLD_DBFS = -40;
const DEFAULT_MIN_SILENCE_MS = 400;
const DEFAULT_CONTEXT_PADDING_MS = 100;
const DEFAULT_SEGMENT_SCOPE = "existing-segments-incremental";
const MIN_SEGMENT_MS = 100;

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
    segmentScope:
      normalizeText(input.segmentScope || input.scope || DEFAULT_SEGMENT_SCOPE) ||
      DEFAULT_SEGMENT_SCOPE,
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
    segmentScope:
      normalizeText(source.segmentScope || source.scope || source.rules?.segmentScope) ||
      DEFAULT_SEGMENT_SCOPE,
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
  if (request.audioDurationMs <= 0) {
    return [];
  }
  return [
    {
      uniqueId: "",
      sourceSegmentNumber: 1,
      startMs: 0,
      endMs: request.audioDurationMs,
      kind: "speech",
      reason: "full-audio-fallback",
      needsHumanReview: true,
    },
  ];
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
  };
}

function buildSegmentPreview(input) {
  const request = normalizeSegmentPreviewRequest(input);
  const effectiveSegments = buildFallbackSegments(request);
  const changes = [];
  const proposedSegments = [];

  effectiveSegments.forEach(function (segment) {
    const result = buildSegmentChange(segment, request.silentRanges, request.rules);
    proposedSegments.push.apply(proposedSegments, result.proposedSegments);
    if (result.change) {
      changes.push(result.change);
    }
  });

  proposedSegments.sort(function (left, right) {
    return left.startMs - right.startMs;
  });

  return {
    success: true,
    data: {
      proposedSegments,
      changes,
    },
    meta: {
      source: "existing-segments-incremental",
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
  buildSegmentPreview,
  createHttpError,
  createSegmentHealthPayload,
  normalizeExistingSegments,
  normalizeSegmentPreviewRequest,
  normalizeSilentRanges,
};
