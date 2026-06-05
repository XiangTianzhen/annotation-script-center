"use strict";

const SILENCE_DB_THRESHOLD = -27;
const SILENCE_KEEP_MS = 150;
const SILENCE_SKIP_MS = 400;
const SILENCE_FORCE_SPLIT_MS = 1500;
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

function normalizeRangeItem(item) {
  const source = item && typeof item === "object" ? item : {};
  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, source.start || 0)));
  const endMs = Math.max(startMs, Math.round(toFiniteNumber(source.endMs, source.end || startMs)));
  return {
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    safeToSplit: source.safeToSplit === true,
    forceSplit: source.forceSplit === true,
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
    startMs,
    endMs,
    kind: normalizeText(source.kind) || "speech",
    reason: normalizeText(source.reason) || "existing-segment",
    needsHumanReview: source.needsHumanReview !== false,
    sourceIndex: index,
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
  };
}

function pushSegment(result, startMs, endMs, reason) {
  const normalizedStart = Math.max(0, Math.round(startMs));
  const normalizedEnd = Math.max(normalizedStart, Math.round(endMs));
  if (normalizedEnd - normalizedStart < MIN_SEGMENT_MS) {
    return;
  }
  result.push({
    startMs: normalizedStart,
    endMs: normalizedEnd,
    kind: "speech",
    reason: normalizeText(reason) || "silence-rule-preview",
    needsHumanReview: true,
  });
}

function mergeTinyTailSegments(segments) {
  const source = Array.isArray(segments) ? segments.slice() : [];
  if (source.length <= 1) {
    return source;
  }
  const result = [];
  source.forEach(function (segment) {
    const current = Object.assign({}, segment);
    const previous = result[result.length - 1];
    if (previous && current.endMs - current.startMs < MIN_SEGMENT_MS * 2) {
      previous.endMs = current.endMs;
      previous.reason = previous.reason + "+merge-short-tail";
      previous.needsHumanReview = true;
      return;
    }
    result.push(current);
  });
  return result;
}

function buildPreviewSegments(request) {
  if (request.existingSegments.length > 0) {
    return request.existingSegments.map(function (segment) {
      return Object.assign({}, segment, {
        reason: segment.reason || "existing-segment",
      });
    });
  }

  const durationMs = Math.max(0, request.audioDurationMs);
  if (durationMs <= 0) {
    return [];
  }

  const segments = [];
  let cursorStart = 0;
  request.silentRanges.forEach(function (range) {
    if (range.durationMs < SILENCE_SKIP_MS) {
      return;
    }

    const mustSplit = range.durationMs > SILENCE_FORCE_SPLIT_MS;
    const shouldSplit = mustSplit || range.safeToSplit === true || range.forceSplit === true;
    if (!shouldSplit) {
      return;
    }

    const segmentEnd = clamp(range.startMs + SILENCE_KEEP_MS, cursorStart + MIN_SEGMENT_MS, durationMs);
    pushSegment(
      segments,
      cursorStart,
      segmentEnd,
      mustSplit ? "silence-over-1.5s" : "silence-0.4s-1.5s-safe-split"
    );
    cursorStart = clamp(range.endMs - SILENCE_KEEP_MS, segmentEnd, durationMs);
  });

  pushSegment(
    segments,
    cursorStart,
    durationMs,
    segments.length > 0 ? "tail-after-silence" : "full-audio-fallback"
  );
  return mergeTinyTailSegments(segments);
}

function buildSegmentPreview(input) {
  const request = normalizeSegmentPreviewRequest(input);
  return {
    success: true,
    data: buildPreviewSegments(request),
    meta: {
      source:
        request.existingSegments.length > 0 ? "existing-segments-normalized" : "silence-rules-preview",
      silenceDbThreshold: SILENCE_DB_THRESHOLD,
      noSplitBelowMs: SILENCE_SKIP_MS,
      forceSplitAboveMs: SILENCE_FORCE_SPLIT_MS,
      keepContextMs: SILENCE_KEEP_MS,
      contractMode: "suggestion-only",
    },
  };
}

function createSegmentHealthPayload() {
  return {
    success: true,
    route: "data-baker-cvpc/liuzhou-helper/segment/preview",
    rules: {
      silenceDbThreshold: SILENCE_DB_THRESHOLD,
      noSplitBelowMs: SILENCE_SKIP_MS,
      conditionalSplitMinMs: SILENCE_SKIP_MS,
      conditionalSplitMaxMs: SILENCE_FORCE_SPLIT_MS,
      forceSplitAboveMs: SILENCE_FORCE_SPLIT_MS,
      keepContextMs: SILENCE_KEEP_MS,
      minSegmentMs: MIN_SEGMENT_MS,
    },
    contract: {
      mode: "suggestion-only",
      writeContractCaptured: false,
    },
  };
}

module.exports = {
  SILENCE_DB_THRESHOLD,
  SILENCE_KEEP_MS,
  SILENCE_SKIP_MS,
  SILENCE_FORCE_SPLIT_MS,
  MIN_SEGMENT_MS,
  buildSegmentPreview,
  createHttpError,
  createSegmentHealthPayload,
  normalizeExistingSegments,
  normalizeSegmentPreviewRequest,
  normalizeSilentRanges,
};
