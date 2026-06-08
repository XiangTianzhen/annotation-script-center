"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const CLIP_CACHE_BASE_PATH = "/api/data-baker-cvpc/liuzhou-helper/clip-cache";
const DEFAULT_CLIP_TTL_MS = 60 * 60 * 1000;
const DEFAULT_MAX_CLIP_BYTES = 10 * 1024 * 1024;
const DEFAULT_RUNTIME_DIR = path.join(__dirname, "..", "data", "runtime", "clip-cache");
const ALLOWED_CONTENT_TYPES = ["audio/wav", "audio/x-wav", "audio/wave"];

function normalizeText(value) {
  return String(value || "").trim();
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = normalizeText(code) || "request-failed";
  return error;
}

function getRuntimeDir(options) {
  const source = options && typeof options === "object" ? options : {};
  return normalizeText(source.runtimeDir) || DEFAULT_RUNTIME_DIR;
}

function getTtlMs(options) {
  const source = options && typeof options === "object" ? options : {};
  return Math.max(1000, Math.round(toFiniteNumber(source.ttlMs, DEFAULT_CLIP_TTL_MS)));
}

function getNowMs(options) {
  const source = options && typeof options === "object" ? options : {};
  if (typeof source.nowMs === "function") {
    return Math.max(0, Math.round(toFiniteNumber(source.nowMs(), Date.now())));
  }
  return Date.now();
}

function ensureRuntimeDir(runtimeDir) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  return runtimeDir;
}

function isAllowedContentType(contentType) {
  return ALLOWED_CONTENT_TYPES.indexOf(normalizeText(contentType).toLowerCase()) >= 0;
}

function normalizeClipPayload(input) {
  const source = input && typeof input === "object" ? input : {};
  const clipBase64 = normalizeText(source.clipBase64).replace(/\s+/g, "");
  if (!clipBase64) {
    throw createHttpError(400, "缺少 clipBase64。", "missing-clip-base64");
  }
  const contentType = normalizeText(source.contentType).toLowerCase();
  if (!isAllowedContentType(contentType)) {
    throw createHttpError(400, "contentType 只支持 audio/wav。", "invalid-clip-content-type");
  }
  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, 0)));
  const endMs = Math.max(startMs, Math.round(toFiniteNumber(source.endMs, startMs)));
  if (endMs <= startMs) {
    throw createHttpError(400, "片段结束时间必须大于开始时间。", "invalid-clip-range");
  }
  return {
    clipBase64,
    contentType,
    sourceFileName: path.basename(normalizeText(source.sourceFileName) || "clip.wav"),
    sourceAudioUrlHash: normalizeText(source.sourceAudioUrlHash),
    startMs,
    endMs,
  };
}

function decodeBase64Clip(clipBase64, maxClipBytes) {
  const normalized = normalizeText(clipBase64).replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw createHttpError(400, "clipBase64 不是合法的 base64。", "invalid-clip-base64");
  }
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.length || buffer.length > Math.max(1024, maxClipBytes || DEFAULT_MAX_CLIP_BYTES)) {
    throw createHttpError(400, "clipBase64 大小不合法。", "invalid-clip-size");
  }
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw createHttpError(400, "当前只接受浏览器裁好的 WAV。", "invalid-clip-format");
  }
  return buffer;
}

function getMetadataPath(runtimeDir, clipId) {
  return path.join(runtimeDir, clipId + ".json");
}

function getAudioPath(runtimeDir, clipId) {
  return path.join(runtimeDir, clipId + ".wav");
}

function removeClipFiles(runtimeDir, clipId) {
  fs.rmSync(getMetadataPath(runtimeDir, clipId), { force: true });
  fs.rmSync(getAudioPath(runtimeDir, clipId), { force: true });
}

function readMetadata(runtimeDir, clipId) {
  try {
    const raw = fs.readFileSync(getMetadataPath(runtimeDir, clipId), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function purgeExpiredClips(options) {
  const runtimeDir = ensureRuntimeDir(getRuntimeDir(options));
  const nowMs = getNowMs(options);
  let removedCount = 0;

  fs.readdirSync(runtimeDir)
    .filter(function (fileName) {
      return /\.json$/i.test(fileName);
    })
    .forEach(function (fileName) {
      const clipId = fileName.replace(/\.json$/i, "");
      const metadata = readMetadata(runtimeDir, clipId);
      const expiresAtMs = Math.round(toFiniteNumber(metadata?.expiresAtMs, 0));
      if (!metadata || expiresAtMs <= nowMs) {
        removeClipFiles(runtimeDir, clipId);
        removedCount += 1;
      }
    });

  return {
    runtimeDir,
    removedCount,
  };
}

function buildPublicAudioUrl(clipId, publicBaseUrl) {
  return normalizeText(publicBaseUrl).replace(/\/+$/, "") +
    CLIP_CACHE_BASE_PATH +
    "/files/" +
    clipId +
    ".wav";
}

function saveClip(input, options) {
  const source = normalizeClipPayload(input);
  const runtimeDir = ensureRuntimeDir(getRuntimeDir(options));
  const publicBaseUrl = normalizeText(options?.publicBaseUrl);
  if (!publicBaseUrl) {
    throw createHttpError(500, "未解析到 clip-cache 对外地址。", "missing-public-base-url");
  }

  purgeExpiredClips(options);
  const buffer = decodeBase64Clip(source.clipBase64, options?.maxClipBytes || DEFAULT_MAX_CLIP_BYTES);
  const clipId = crypto.randomBytes(12).toString("hex");
  const createdAtMs = getNowMs(options);
  const expiresAtMs = createdAtMs + getTtlMs(options);
  const metadata = {
    clipId,
    contentType: "audio/wav",
    sourceFileName: source.sourceFileName,
    sourceAudioUrlHash: source.sourceAudioUrlHash,
    startMs: source.startMs,
    endMs: source.endMs,
    createdAt: new Date(createdAtMs).toISOString(),
    createdAtMs,
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresAtMs,
    sizeBytes: buffer.length,
  };

  fs.writeFileSync(getAudioPath(runtimeDir, clipId), buffer);
  fs.writeFileSync(getMetadataPath(runtimeDir, clipId), JSON.stringify(metadata, null, 2), "utf8");

  return {
    success: true,
    clipId,
    audioUrl: buildPublicAudioUrl(clipId, publicBaseUrl),
    expiresAt: metadata.expiresAt,
  };
}

function readClip(clipId, options) {
  const normalizedClipId = normalizeText(clipId).replace(/[^a-z0-9]/gi, "");
  if (!normalizedClipId) {
    return null;
  }
  const runtimeDir = ensureRuntimeDir(getRuntimeDir(options));
  purgeExpiredClips(options);

  const metadata = readMetadata(runtimeDir, normalizedClipId);
  if (!metadata) {
    return null;
  }
  if (Math.round(toFiniteNumber(metadata.expiresAtMs, 0)) <= getNowMs(options)) {
    removeClipFiles(runtimeDir, normalizedClipId);
    return null;
  }

  const audioPath = getAudioPath(runtimeDir, normalizedClipId);
  if (!fs.existsSync(audioPath)) {
    removeClipFiles(runtimeDir, normalizedClipId);
    return null;
  }

  return {
    buffer: fs.readFileSync(audioPath),
    contentType: "audio/wav",
    metadata,
  };
}

function createHealthPayload(options) {
  const runtimeDir = ensureRuntimeDir(getRuntimeDir(options));
  purgeExpiredClips(options);
  const fileCount = fs.readdirSync(runtimeDir).filter(function (fileName) {
    return /\.json$/i.test(fileName);
  }).length;
  return {
    success: true,
    route: "data-baker-cvpc/liuzhou-helper/clip-cache",
    ttlMs: getTtlMs(options),
    runtimeDir,
    fileCount,
    contract: {
      fileFormat: "wav",
      mode: "temporary-cache",
    },
  };
}

purgeExpiredClips();

module.exports = {
  ALLOWED_CONTENT_TYPES,
  CLIP_CACHE_BASE_PATH,
  DEFAULT_CLIP_TTL_MS,
  DEFAULT_MAX_CLIP_BYTES,
  DEFAULT_RUNTIME_DIR,
  createHealthPayload,
  createHttpError,
  purgeExpiredClips,
  readClip,
  saveClip,
};
