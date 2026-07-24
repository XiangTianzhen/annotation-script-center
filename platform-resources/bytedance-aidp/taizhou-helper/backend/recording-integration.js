"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { sendJson } = require("../../../backend/response");

const ROUTE_PREFIX = "/api/bytedance-aidp/taizhou-helper";
const DEFAULT_CONFIG_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "config",
  "secrets",
  "recording-platform-integration.json"
);
const DEFAULT_RUNTIME_DIR = path.resolve(
  __dirname,
  "runtime",
  "recording-integration"
);
const STATE_VERSION = 1;
const DEFAULT_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const DEFAULT_UPLOAD_TTL_MS = 60 * 60 * 1000;
const DEFAULT_AUDIO_TOKEN_TTL_MS = 120 * 1000;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60 * 1000;
const DEFAULT_MAX_UPSTREAM_JSON_BYTES = 256 * 1024;
const DEFAULT_UPLOAD_READ_TIMEOUT_MS = 120 * 1000;
const DEFAULT_MAINTENANCE_INTERVAL_MS = 60 * 1000;
const DEFAULT_STAGING_CLEANUP_SAFETY_MARGIN_MS = 5 * 1000;
const ITEM_FIELDS = new Set([
  "recordingTaskId",
  "sourceItemId",
  "referenceText",
  "audioUploadId",
  "videoUploadId",
]);

class IntegrationError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "IntegrationError";
    this.status = status;
    this.code = code;
    this.details = details || null;
  }
}

function createEmptyState() {
  return {
    version: STATE_VERSION,
    uploads: {},
    mappings: {},
    media: {},
  };
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function randomOpaqueId() {
  return crypto.randomBytes(24).toString("base64url");
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function sanitizeIdentifier(value, maxLength, fallback) {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.:-]/g, "")
    .slice(0, maxLength);
  return sanitized || fallback || "";
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isSafeHttpsUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch (error) {
    return false;
  }
}

function validateConfig(candidate) {
  const source =
    candidate && typeof candidate === "object" && !Array.isArray(candidate)
      ? candidate
      : {};
  const baseUrl = normalizeText(source.baseUrl).replace(/\/+$/, "");
  const apiKey = normalizeText(source.apiKey);
  const publicMediaBaseUrl = normalizeText(source.publicMediaBaseUrl).replace(
    /\/+$/,
    ""
  );
  const tokenSecret = normalizeText(source.tokenSecret);
  const allowedTaskIds = Array.isArray(source.allowedTaskIds)
    ? Array.from(
        new Set(source.allowedTaskIds.map(normalizeText).filter(Boolean))
      )
    : [];

  if (
    !isSafeHttpsUrl(baseUrl) ||
    !apiKey ||
    allowedTaskIds.length === 0 ||
    !isSafeHttpsUrl(publicMediaBaseUrl) ||
    tokenSecret.length < 32
  ) {
    return null;
  }
  return {
    baseUrl,
    apiKey,
    allowedTaskIds,
    publicMediaBaseUrl,
    tokenSecret,
  };
}

function readPrivateConfig(configPath) {
  try {
    return validateConfig(
      JSON.parse(fs.readFileSync(configPath, "utf8"))
    );
  } catch (error) {
    return null;
  }
}

function directoryContainsFiles(directoryPath) {
  try {
    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isFile()) {
        return true;
      }
      if (entry.isDirectory() && directoryContainsFiles(entryPath)) {
        return true;
      }
    }
  } catch (error) {
    return error?.code !== "ENOENT";
  }
  return false;
}

function readState(statePath, runtimeDir) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    if (
      parsed &&
      parsed.version === STATE_VERSION &&
      parsed.uploads &&
      !Array.isArray(parsed.uploads) &&
      parsed.mappings &&
      !Array.isArray(parsed.mappings) &&
      parsed.media &&
      !Array.isArray(parsed.media)
    ) {
      return { state: parsed, available: true };
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        state: createEmptyState(),
        available: !directoryContainsFiles(runtimeDir),
      };
    }
  }
  return { state: createEmptyState(), available: false };
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomOpaqueId()}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2) + "\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, filePath);
}

function createUploadLimiter(maxConcurrentUploads) {
  let active = 0;
  const limit = normalizePositiveInteger(maxConcurrentUploads, 2);
  return {
    tryAcquire() {
      if (active >= limit) {
        return false;
      }
      active += 1;
      return true;
    },
    release() {
      active = Math.max(0, active - 1);
    },
    get active() {
      return active;
    },
    get limit() {
      return limit;
    },
  };
}

function detectMedia(kind, contentType, bytes) {
  const mime = normalizeText(String(contentType || "").split(";")[0]).toLowerCase();
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  const isWave =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE";
  const isMp3 =
    buffer.length >= 3 &&
    (buffer.subarray(0, 3).toString("ascii") === "ID3" ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0));
  const isIsoMedia =
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp";
  const isWebm =
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3;

  if (
    kind === "audio" &&
    isWave &&
    (mime === "audio/wav" ||
      mime === "audio/x-wav" ||
      mime === "audio/wave")
  ) {
    return { extension: "wav", contentType: "audio/wav" };
  }
  if (kind === "audio" && isMp3 && mime === "audio/mpeg") {
    return { extension: "mp3", contentType: "audio/mpeg" };
  }
  if (
    kind === "audio" &&
    isIsoMedia &&
    (mime === "audio/mp4" || mime === "audio/x-m4a")
  ) {
    return { extension: "m4a", contentType: "audio/mp4" };
  }
  if (kind === "video" && isIsoMedia && mime === "video/mp4") {
    return { extension: "mp4", contentType: "video/mp4" };
  }
  if (kind === "video" && isWebm && mime === "video/webm") {
    return { extension: "webm", contentType: "video/webm" };
  }
  return null;
}

function parseSingleRange(value, size) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }
  if (!/^bytes=/.test(text) || text.includes(",")) {
    return false;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(text);
  if (!match || (!match[1] && !match[2])) {
    return false;
  }
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return false;
    }
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return false;
  }
  return {
    start,
    end: Math.min(end, size - 1),
  };
}

function readJsonBody(request, maxBytes) {
  const limit = normalizePositiveInteger(maxBytes, 1024 * 1024);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let exceeded = false;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        exceeded = true;
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (exceeded) {
        reject(
          new IntegrationError(413, "REQUEST_TOO_LARGE", "请求体超过限制。")
        );
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (error) {
        reject(
          new IntegrationError(400, "MALFORMED_JSON", "JSON 请求体格式错误。")
        );
      }
    });
    request.on("error", () => {
      reject(
        new IntegrationError(400, "REQUEST_READ_FAILED", "请求体读取失败。")
      );
    });
  });
}

function validateExactObject(body, allowedFields) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new IntegrationError(400, "INVALID_REQUEST", "请求体必须是 JSON 对象。");
  }
  const unknown = Object.keys(body).filter((key) => !allowedFields.has(key));
  if (unknown.length > 0) {
    throw new IntegrationError(400, "UNKNOWN_FIELD", "请求体包含未知字段。");
  }
}

async function readBoundedUpstreamJson(response, maxBytes) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw new IntegrationError(
      503,
      "RECORDING_PLATFORM_INVALID_RESPONSE",
      "录音平台返回了无效响应。"
    );
  }
  if (!response.body) {
    return {};
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }
      const chunk = Buffer.from(result.value);
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_INVALID_RESPONSE",
          "录音平台返回了无效响应。"
        );
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const text = Buffer.concat(chunks).toString("utf8");
    const body = text ? JSON.parse(text) : {};
    return body && typeof body === "object" ? body : {};
  } catch (error) {
    return {};
  }
}

async function readSafeUpstreamBody(response, maxBytes) {
  try {
    return await readBoundedUpstreamJson(
      response,
      normalizePositiveInteger(maxBytes, DEFAULT_MAX_UPSTREAM_JSON_BYTES)
    );
  } catch (error) {
    if (error instanceof IntegrationError) {
      throw error;
    }
    return {};
  }
}

function toSafeUpstreamSummary(body, message) {
  return {
    code: sanitizeIdentifier(body?.code, 64, "UPSTREAM_REQUEST_FAILED"),
    message: normalizeText(message) || "录音平台拒绝了请求。",
    requestId: sanitizeIdentifier(body?.requestId, 128, ""),
  };
}

function createRecordingIntegration(options) {
  const config = options && typeof options === "object" ? options : {};
  const configPath = path.resolve(config.configPath || DEFAULT_CONFIG_PATH);
  const runtimeDir = path.resolve(config.runtimeDir || DEFAULT_RUNTIME_DIR);
  const tempDir = path.join(runtimeDir, "temp");
  const mediaDir = path.join(runtimeDir, "media");
  const statePath = path.join(runtimeDir, "state.json");
  const fetchImpl = config.fetchImpl || global.fetch;
  const now = typeof config.now === "function" ? config.now : Date.now;
  const maxUploadBytes = normalizePositiveInteger(
    config.maxUploadBytes,
    DEFAULT_MAX_UPLOAD_BYTES
  );
  const uploadTtlMs = normalizePositiveInteger(
    config.uploadTtlMs,
    DEFAULT_UPLOAD_TTL_MS
  );
  const audioTokenTtlMs = normalizePositiveInteger(
    config.audioTokenTtlMs,
    DEFAULT_AUDIO_TOKEN_TTL_MS
  );
  const upstreamTimeoutMs = normalizePositiveInteger(
    config.upstreamTimeoutMs,
    DEFAULT_UPSTREAM_TIMEOUT_MS
  );
  const maxUpstreamJsonBytes = normalizePositiveInteger(
    config.maxUpstreamJsonBytes,
    DEFAULT_MAX_UPSTREAM_JSON_BYTES
  );
  const uploadReadTimeoutMs = normalizePositiveInteger(
    config.uploadReadTimeoutMs,
    DEFAULT_UPLOAD_READ_TIMEOUT_MS
  );
  const maintenanceIntervalMs = normalizePositiveInteger(
    config.maintenanceIntervalMs,
    Math.min(DEFAULT_MAINTENANCE_INTERVAL_MS, uploadTtlMs)
  );
  const stagingCleanupSafetyMarginMs = normalizePositiveInteger(
    config.stagingCleanupSafetyMarginMs,
    DEFAULT_STAGING_CLEANUP_SAFETY_MARGIN_MS
  );
  const removeFileSync =
    typeof config.removeFileSync === "function"
      ? config.removeFileSync
      : (filePath) => fs.rmSync(filePath, { force: true });
  const mkdirSync =
    typeof config.mkdirSync === "function" ? config.mkdirSync : fs.mkdirSync;
  const createReadStream =
    typeof config.createReadStream === "function"
      ? config.createReadStream
      : fs.createReadStream;
  const uploadLimiter = createUploadLimiter(config.maxConcurrentUploads);
  const mappingFlights = new Map();
  const activeStagingPaths = new Set();

  const stateLoad = readState(statePath, runtimeDir);
  let state = stateLoad.state;
  const stateAvailable = stateLoad.available;

  function assertStateAvailable() {
    if (!stateAvailable) {
      throw new IntegrationError(
        503,
        "RECORDING_INTEGRATION_STATE_UNAVAILABLE",
        "录音平台集成状态暂不可用。"
      );
    }
  }

  function persistState() {
    assertStateAvailable();
    atomicWriteJson(statePath, state);
  }

  function getConfig() {
    assertStateAvailable();
    const privateConfig = readPrivateConfig(configPath);
    if (!privateConfig) {
      throw new IntegrationError(
        503,
        "RECORDING_INTEGRATION_NOT_CONFIGURED",
        "录音平台集成暂不可用。"
      );
    }
    return privateConfig;
  }

  function assertAllowedTask(privateConfig, taskId) {
    const normalized = normalizeText(taskId);
    if (!normalized || !privateConfig.allowedTaskIds.includes(normalized)) {
      throw new IntegrationError(
        403,
        "RECORDING_TASK_NOT_ALLOWED",
        "目标录音任务未获服务器授权。"
      );
    }
    return normalized;
  }

  function resolveRuntimeFile(relativePath) {
    const normalized = normalizeText(relativePath);
    const absolute = path.resolve(runtimeDir, normalized);
    const runtimePrefix = runtimeDir.endsWith(path.sep)
      ? runtimeDir
      : runtimeDir + path.sep;
    if (!absolute.startsWith(runtimePrefix)) {
      throw new IntegrationError(404, "MEDIA_NOT_FOUND", "媒体不存在。");
    }
    return absolute;
  }

  function tryRemoveFile(filePath) {
    try {
      removeFileSync(filePath);
      return true;
    } catch (error) {
      return error?.code === "ENOENT";
    }
  }

  function reconcileRuntime() {
    if (!stateAvailable) {
      return;
    }
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(mediaDir, { recursive: true });
    const currentTime = now();
    let changed = false;

    for (const [uploadId, upload] of Object.entries(state.uploads)) {
      let filePath;
      try {
        filePath = resolveRuntimeFile(upload.relativePath);
      } catch (error) {
        delete state.uploads[uploadId];
        changed = true;
        continue;
      }
      if (!fs.existsSync(filePath)) {
        delete state.uploads[uploadId];
        changed = true;
        continue;
      }
      if (
        Number(upload.expiresAt) <= currentTime &&
        tryRemoveFile(filePath)
      ) {
        delete state.uploads[uploadId];
        changed = true;
      }
    }

    const mappedMediaIds = new Set();
    for (const mapping of Object.values(state.mappings)) {
      for (const mediaId of Object.values(mapping.mediaIds || {})) {
        if (mediaId) {
          mappedMediaIds.add(mediaId);
        }
      }
    }
    for (const [mediaId, media] of Object.entries(state.media)) {
      let filePath;
      try {
        filePath = resolveRuntimeFile(media.relativePath);
      } catch (error) {
        filePath = "";
      }
      if (
        filePath &&
        fs.existsSync(filePath) &&
        (media.cleanupPending === true ||
          (!mappedMediaIds.has(mediaId) && media.linked !== true))
      ) {
        if (tryRemoveFile(filePath)) {
          delete state.media[mediaId];
          changed = true;
        }
        continue;
      }
      if (filePath && fs.existsSync(filePath)) {
        continue;
      }
      delete state.media[mediaId];
      for (const mapping of Object.values(state.mappings)) {
        for (const kind of ["audio", "video"]) {
          if (mapping.mediaIds?.[kind] === mediaId) {
            mapping.mediaIds[kind] = null;
          }
        }
      }
      changed = true;
    }

    const referencedTempFiles = new Set(
      Object.values(state.uploads).map((upload) =>
        path.resolve(runtimeDir, upload.relativePath)
      )
    );
    for (const fileName of fs.readdirSync(tempDir)) {
      const filePath = path.join(tempDir, fileName);
      if (referencedTempFiles.has(filePath)) {
        continue;
      }
      if (fileName.endsWith(".uploading")) {
        if (activeStagingPaths.has(filePath)) {
          continue;
        }
        let stagingAgeMs;
        try {
          stagingAgeMs = currentTime - fs.statSync(filePath).mtimeMs;
        } catch (error) {
          continue;
        }
        if (
          stagingAgeMs <=
          uploadReadTimeoutMs + stagingCleanupSafetyMarginMs
        ) {
          continue;
        }
      }
      tryRemoveFile(filePath);
    }

    const referencedMediaFiles = new Set(
      Object.values(state.media).map((media) =>
        path.resolve(runtimeDir, media.relativePath)
      )
    );
    for (const fileName of fs.readdirSync(mediaDir)) {
      const filePath = path.join(mediaDir, fileName);
      if (!referencedMediaFiles.has(filePath)) {
        tryRemoveFile(filePath);
      }
    }
    for (const fileName of fs.readdirSync(runtimeDir)) {
      if (/^state\.json\..+\.tmp$/.test(fileName)) {
        tryRemoveFile(path.join(runtimeDir, fileName));
      }
    }

    if (changed) {
      persistState();
    }
  }

  async function cleanupExpiredUploads() {
    assertStateAvailable();
    const currentTime = now();
    let changed = false;
    for (const [uploadId, upload] of Object.entries(state.uploads)) {
      if (Number(upload.expiresAt) > currentTime) {
        continue;
      }
      if (!tryRemoveFile(resolveRuntimeFile(upload.relativePath))) {
        continue;
      }
      delete state.uploads[uploadId];
      changed = true;
    }
    if (changed) {
      persistState();
    }
  }

  function readUploadStream(request, fileDescriptor) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let totalBytes = 0;
      const contentHash = crypto.createHash("sha256");
      const headerChunks = [];
      let headerLength = 0;

      function removeListeners() {
        request.removeListener("data", onData);
        request.removeListener("end", onEnd);
        request.removeListener("error", onError);
        request.removeListener("aborted", onAborted);
      }

      function finish(error) {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        removeListeners();
        if (error) {
          request.pause?.();
          error.abortRequest = true;
          reject(error);
          return;
        }
        resolve({
          totalBytes,
          headerBytes: Buffer.concat(headerChunks),
          contentSha256: contentHash.digest("hex"),
        });
      }

      function onData(rawChunk) {
        const chunk = Buffer.from(rawChunk);
        totalBytes += chunk.length;
        if (totalBytes > maxUploadBytes) {
          finish(
            new IntegrationError(
              413,
              "MEDIA_TOO_LARGE",
              "媒体文件超过 100MB 限制。"
            )
          );
          return;
        }
        if (headerLength < 64) {
          const headerChunk = chunk.subarray(
            0,
            Math.min(64 - headerLength, chunk.length)
          );
          headerChunks.push(headerChunk);
          headerLength += headerChunk.length;
        }
        try {
          contentHash.update(chunk);
          fs.writeSync(fileDescriptor, chunk);
        } catch (error) {
          finish(
            new IntegrationError(
              500,
              "MEDIA_UPLOAD_FAILED",
              "媒体上传处理失败。"
            )
          );
        }
      }

      function onEnd() {
        finish();
      }

      function onError() {
        finish(
          new IntegrationError(
            400,
            "REQUEST_READ_FAILED",
            "请求体读取失败。"
          )
        );
      }

      function onAborted() {
        finish(
          new IntegrationError(
            400,
            "REQUEST_ABORTED",
            "媒体上传请求已中断。"
          )
        );
      }

      const timeout = setTimeout(() => {
        finish(
          new IntegrationError(
            408,
            "MEDIA_UPLOAD_TIMEOUT",
            "媒体上传读取超时。"
          )
        );
      }, uploadReadTimeoutMs);
      timeout.unref?.();
      request.on("data", onData);
      request.once("end", onEnd);
      request.once("error", onError);
      request.once("aborted", onAborted);
      request.resume?.();
    });
  }

  async function storeUpload(request, kind, taskId) {
    const privateConfig = getConfig();
    const normalizedKind = normalizeText(kind).toLowerCase();
    if (normalizedKind !== "audio" && normalizedKind !== "video") {
      throw new IntegrationError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "仅支持 audio 或 video 媒体。"
      );
    }
    const normalizedTaskId = assertAllowedTask(privateConfig, taskId);
    await cleanupExpiredUploads();

    if (!uploadLimiter.tryAcquire()) {
      throw new IntegrationError(
        409,
        "UPLOAD_CAPACITY_REACHED",
        "当前上传任务已达并发上限。"
      );
    }

    let stagingPath = "";
    let fileDescriptor = null;
    try {
      const declaredLength = Number(request.headers["content-length"]);
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > maxUploadBytes
      ) {
        const error = new IntegrationError(
          413,
          "MEDIA_TOO_LARGE",
          "媒体文件超过 100MB 限制。"
        );
        error.abortRequest = true;
        throw error;
      }

      const stagingName = `${randomOpaqueId()}.uploading`;
      stagingPath = path.join(tempDir, stagingName);
      activeStagingPaths.add(stagingPath);
      mkdirSync(tempDir, { recursive: true });
      fileDescriptor = fs.openSync(stagingPath, "wx", 0o600);
      const streamResult = await readUploadStream(request, fileDescriptor);
      fs.closeSync(fileDescriptor);
      fileDescriptor = null;

      const totalBytes = streamResult.totalBytes;
      if (totalBytes === 0) {
        throw new IntegrationError(422, "MEDIA_EMPTY", "媒体文件不能为空。");
      }

      const mediaType = detectMedia(
        normalizedKind,
        request.headers["content-type"],
        streamResult.headerBytes
      );
      if (!mediaType) {
        throw new IntegrationError(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "媒体 MIME 与文件内容不匹配或不受支持。"
        );
      }

      const uploadId = randomOpaqueId();
      const finalName = `${uploadId}.${mediaType.extension}`;
      const finalPath = path.join(tempDir, finalName);
      fs.renameSync(stagingPath, finalPath);
      activeStagingPaths.delete(stagingPath);
      stagingPath = "";
      state.uploads[uploadId] = {
        uploadId,
        taskId: normalizedTaskId,
        kind: normalizedKind,
        relativePath: path.join("temp", finalName),
        contentType: mediaType.contentType,
        extension: mediaType.extension,
        size: totalBytes,
        contentSha256: streamResult.contentSha256,
        createdAt: now(),
        expiresAt: now() + uploadTtlMs,
      };
      persistState();
      return { uploadId };
    } catch (error) {
      if (fileDescriptor !== null) {
        try {
          fs.closeSync(fileDescriptor);
        } catch (closeError) {
          // The limiter still releases in finally; reconciliation retries cleanup.
        }
        fileDescriptor = null;
      }
      if (stagingPath) {
        tryRemoveFile(stagingPath);
      }
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        500,
        "MEDIA_UPLOAD_FAILED",
        "媒体上传处理失败。"
      );
    } finally {
      try {
        if (fileDescriptor !== null) {
          fs.closeSync(fileDescriptor);
        }
      } finally {
        if (stagingPath) {
          activeStagingPaths.delete(stagingPath);
        }
        uploadLimiter.release();
      }
    }
  }

  function mappingKeyFor(taskId, sourceItemId) {
    return hashText(
      ["bytedance-aidp/taizhou-helper", taskId, sourceItemId].join("\n")
    );
  }

  function validateUpload(uploadId, expectedKind, taskId) {
    const normalizedId = normalizeText(uploadId);
    if (!normalizedId) {
      return null;
    }
    const upload = state.uploads[normalizedId];
    if (
      !upload ||
      upload.taskId !== taskId ||
      upload.kind !== expectedKind ||
      Number(upload.expiresAt) <= now()
    ) {
      throw new IntegrationError(
        422,
        "UPLOAD_REFERENCE_INVALID",
        "上传 ID 不存在、已过期或与任务及媒体类型不匹配。"
      );
    }
    return upload;
  }

  function bindUpload(upload) {
    if (!upload) {
      return null;
    }
    const mediaId = randomOpaqueId();
    const mediaName = `${mediaId}.${upload.extension}`;
    const targetRelativePath = path.join("media", mediaName);
    fs.mkdirSync(mediaDir, { recursive: true });
    fs.renameSync(
      resolveRuntimeFile(upload.relativePath),
      resolveRuntimeFile(targetRelativePath)
    );
    delete state.uploads[upload.uploadId];
    state.media[mediaId] = {
      mediaId,
      taskId: upload.taskId,
      kind: upload.kind,
      relativePath: targetRelativePath,
      contentType: upload.contentType,
      size: upload.size,
      contentSha256: upload.contentSha256,
      linked: false,
      createdAt: now(),
    };
    return mediaId;
  }

  function removeMappingMedia(mapping) {
    for (const mediaId of Object.values(mapping?.mediaIds || {})) {
      if (!mediaId) {
        continue;
      }
      const media = state.media[mediaId];
      if (media) {
        if (tryRemoveFile(resolveRuntimeFile(media.relativePath))) {
          delete state.media[mediaId];
        } else {
          media.cleanupPending = true;
        }
      }
    }
  }

  async function fetchUpstreamJson(url, requestOptions) {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, upstreamTimeoutMs);
    timeout.unref?.();
    try {
      const response = await fetchImpl(
        url,
        Object.assign({}, requestOptions || {}, { signal: controller.signal })
      );
      const body = await readBoundedUpstreamJson(
        response,
        maxUpstreamJsonBytes
      );
      return { response, body };
    } catch (error) {
      controller.abort();
      if (error instanceof IntegrationError) {
        throw error;
      }
      if (timedOut) {
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_UNAVAILABLE",
          "录音平台暂时不可用。"
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function issueSyncToken(mapping, privateConfig) {
    const token = crypto
      .createHmac("sha256", privateConfig.tokenSecret)
      .update("recording-sync-token\0")
      .update(mapping.mappingKey)
      .digest("base64url");
    const tokenHash = hashText(token);
    if (mapping.syncTokenHash !== tokenHash) {
      mapping.syncTokenHash = tokenHash;
      persistState();
    }
    return token;
  }

  function toItemSummary(mapping) {
    return {
      itemId: mapping.recordingItemId,
      taskId: mapping.taskId,
      itemCode: mapping.itemCode,
      status: mapping.status,
      createdAt: mapping.recordingCreatedAt || null,
    };
  }

  function mediaFingerprintDescriptor(kind, media) {
    if (!media) {
      return null;
    }
    return {
      kind,
      contentType: normalizeText(media.contentType),
      contentSha256: normalizeText(media.contentSha256),
    };
  }

  function resolveMediaReference(uploadId, expectedKind, taskId, mapping) {
    const normalizedId = normalizeText(uploadId);
    if (!normalizedId) {
      return { upload: null, media: null, descriptor: null };
    }
    const pendingUpload = state.uploads[normalizedId];
    if (pendingUpload) {
      const upload = validateUpload(normalizedId, expectedKind, taskId);
      return {
        upload,
        media: null,
        descriptor: mediaFingerprintDescriptor(expectedKind, upload),
      };
    }
    if (mapping?.uploadIds?.[expectedKind] === normalizedId) {
      const media = state.media[mapping.mediaIds?.[expectedKind]];
      if (media) {
        return {
          upload: null,
          media,
          descriptor: mediaFingerprintDescriptor(expectedKind, media),
        };
      }
    }
    throw new IntegrationError(
      422,
      "UPLOAD_REFERENCE_INVALID",
      "上传 ID 不存在、已过期或与任务及媒体类型不匹配。"
    );
  }

  function discardUploads(references) {
    let changed = false;
    for (const reference of references) {
      const upload = reference?.upload;
      if (!upload || !state.uploads[upload.uploadId]) {
        continue;
      }
      if (tryRemoveFile(resolveRuntimeFile(upload.relativePath))) {
        delete state.uploads[upload.uploadId];
        changed = true;
      }
    }
    if (changed) {
      persistState();
    }
  }

  function requestFingerprintFor(referenceText, audioDescriptor, videoDescriptor) {
    return hashText(
      JSON.stringify({
        referenceText,
        audio: audioDescriptor,
        video: videoDescriptor,
      })
    );
  }

  async function createRecordingItem(body) {
    const privateConfig = getConfig();
    validateExactObject(body, ITEM_FIELDS);
    if (
      typeof body.recordingTaskId !== "string" ||
      !body.recordingTaskId.trim()
    ) {
      throw new IntegrationError(
        422,
        "RECORDING_TASK_ID_REQUIRED",
        "recordingTaskId 必须是非空字符串。"
      );
    }
    const taskId = assertAllowedTask(privateConfig, body.recordingTaskId);
    const sourceItemId = normalizeText(body.sourceItemId);
    if (!sourceItemId) {
      throw new IntegrationError(
        422,
        "SOURCE_ITEM_ID_REQUIRED",
        "sourceItemId 不能为空。"
      );
    }
    const referenceText = normalizeText(body.referenceText);
    const audioUploadId = normalizeText(body.audioUploadId);
    const videoUploadId = normalizeText(body.videoUploadId);
    if (!referenceText && !audioUploadId && !videoUploadId) {
      throw new IntegrationError(
        422,
        "ITEM_REFERENCE_REQUIRED",
        "至少需要一种非空参考内容。"
      );
    }
    await cleanupExpiredUploads();

    const mappingKey = mappingKeyFor(taskId, sourceItemId);
    const existingMapping = state.mappings[mappingKey];
    const audioReference = resolveMediaReference(
      audioUploadId,
      "audio",
      taskId,
      existingMapping
    );
    const videoReference = resolveMediaReference(
      videoUploadId,
      "video",
      taskId,
      existingMapping
    );
    const freshReferences = [audioReference, videoReference];
    const requestFingerprint = requestFingerprintFor(
      referenceText,
      audioReference.descriptor,
      videoReference.descriptor
    );
    if (
      existingMapping?.requestFingerprint &&
      existingMapping.requestFingerprint !== requestFingerprint
    ) {
      discardUploads(freshReferences);
      throw new IntegrationError(
        409,
        "SOURCE_ITEM_CONTENT_CONFLICT",
        "相同来源条目的参考内容与首次请求不一致。"
      );
    }
    const existingFlight = mappingFlights.get(mappingKey);
    if (existingFlight) {
      if (existingFlight.requestFingerprint !== requestFingerprint) {
        discardUploads(freshReferences);
        throw new IntegrationError(
          409,
          "SOURCE_ITEM_CONTENT_CONFLICT",
          "相同来源条目的参考内容与进行中请求不一致。"
        );
      }
      discardUploads(freshReferences);
      return existingFlight.promise;
    }

    const flightPromise = (async () => {
      let mapping = state.mappings[mappingKey];
      if (mapping && !mapping.requestFingerprint) {
        mapping.requestFingerprint = requestFingerprint;
        persistState();
      }
      if (mapping?.recordingItemId) {
        discardUploads(freshReferences);
        return {
          replayed: true,
          syncToken: issueSyncToken(mapping, privateConfig),
          item: toItemSummary(mapping),
        };
      }

      if (!mapping) {
        const mediaIds = {
          audio: bindUpload(audioReference.upload),
          video: bindUpload(videoReference.upload),
        };
        mapping = {
          mappingKey,
          requestFingerprint,
          taskId,
          sourceItemId,
          operationKey: mappingKey,
          uploadIds: {
            audio: audioUploadId || null,
            video: videoUploadId || null,
          },
          mediaIds,
          recordingItemId: null,
          itemCode: null,
          status: "PENDING",
          createdAt: now(),
          updatedAt: now(),
        };
        state.mappings[mappingKey] = mapping;
        persistState();
      } else {
        let mappingChanged = false;
        for (const [kind, reference] of [
          ["audio", audioReference],
          ["video", videoReference],
        ]) {
          if (reference.upload && !mapping.mediaIds?.[kind]) {
            mapping.mediaIds = mapping.mediaIds || {};
            mapping.uploadIds = mapping.uploadIds || {};
            mapping.mediaIds[kind] = bindUpload(reference.upload);
            mapping.uploadIds[kind] = reference.upload.uploadId;
            mappingChanged = true;
          }
        }
        discardUploads(freshReferences);
        if (mappingChanged) {
          mapping.updatedAt = now();
          persistState();
        }
      }

      const upstreamBody = {};
      if (referenceText) {
        upstreamBody.referenceText = referenceText;
      }
      if (mapping.mediaIds.audio) {
        upstreamBody.referenceAudioUrl =
          `${privateConfig.publicMediaBaseUrl}/${mapping.mediaIds.audio}`;
      }
      if (mapping.mediaIds.video) {
        upstreamBody.referenceVideoUrl =
          `${privateConfig.publicMediaBaseUrl}/${mapping.mediaIds.video}`;
      }

      let response;
      let upstreamResponse;
      try {
        const upstreamResult = await fetchUpstreamJson(
          `${privateConfig.baseUrl}/api/integrations/tasks/${encodeURIComponent(
            taskId
          )}/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": privateConfig.apiKey,
              "Idempotency-Key": mapping.operationKey,
            },
            body: JSON.stringify(upstreamBody),
          }
        );
        response = upstreamResult.response;
        upstreamResponse = upstreamResult.body;
      } catch (error) {
        mapping.status = "RETRYABLE";
        mapping.updatedAt = now();
        persistState();
        if (error instanceof IntegrationError) {
          throw error;
        }
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_UNAVAILABLE",
          "录音平台暂时不可用，请使用相同来源条目重试。"
        );
      }

      if (!response.ok) {
        const upstreamCode = sanitizeIdentifier(
          upstreamResponse.code,
          64,
          ""
        );
        if (
          response.status === 408 ||
          response.status === 429 ||
          (response.status === 409 && upstreamCode === "OPERATION_IN_PROGRESS")
        ) {
          mapping.status = "RETRYABLE";
          mapping.updatedAt = now();
          persistState();
          throw new IntegrationError(
            response.status === 409 ? 409 : 503,
            response.status === 409
              ? "RECORDING_PLATFORM_IN_PROGRESS"
              : "RECORDING_PLATFORM_UNAVAILABLE",
            response.status === 409
              ? "录音平台正在处理相同操作，请稍后使用相同来源条目重试。"
              : "录音平台暂时不可用，请使用相同来源条目重试。",
            {
              upstream: toSafeUpstreamSummary(
                upstreamResponse,
                response.status === 409
                  ? "录音平台正在处理相同操作。"
                  : "录音平台暂时不可用。"
              ),
            }
          );
        }
        if (response.status >= 400 && response.status < 500) {
          removeMappingMedia(mapping);
          delete state.mappings[mappingKey];
          persistState();
          throw new IntegrationError(
            response.status,
            "RECORDING_PLATFORM_REJECTED",
            "录音平台拒绝了条目创建请求。",
            {
              upstream: toSafeUpstreamSummary(
                upstreamResponse,
                "录音平台拒绝了请求。"
              ),
            }
          );
        }
        mapping.status = "RETRYABLE";
        mapping.updatedAt = now();
        persistState();
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_UNAVAILABLE",
          "录音平台暂时不可用，请使用相同来源条目重试。"
        );
      }

      const recordingItemId = normalizeText(upstreamResponse.itemId);
      const itemCode = normalizeText(upstreamResponse.itemCode);
      if (!recordingItemId || !itemCode) {
        mapping.status = "RETRYABLE";
        mapping.updatedAt = now();
        persistState();
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_INVALID_RESPONSE",
          "录音平台返回了无效响应。"
        );
      }

      mapping.recordingItemId = recordingItemId;
      mapping.itemCode = itemCode;
      mapping.status = normalizeText(upstreamResponse.status) || "AVAILABLE";
      mapping.recordingCreatedAt =
        normalizeText(upstreamResponse.createdAt) || null;
      mapping.updatedAt = now();
      for (const mediaId of Object.values(mapping.mediaIds || {})) {
        if (mediaId && state.media[mediaId]) {
          state.media[mediaId].linked = true;
          state.media[mediaId].boundAt = now();
        }
      }
      persistState();
      return {
        replayed: false,
        syncToken: issueSyncToken(mapping, privateConfig),
        item: toItemSummary(mapping),
      };
    })();
    mappingFlights.set(mappingKey, {
      requestFingerprint,
      promise: flightPromise,
    });
    try {
      return await flightPromise;
    } finally {
      if (mappingFlights.get(mappingKey)?.promise === flightPromise) {
        mappingFlights.delete(mappingKey);
      }
    }
  }

  function findMappingBySyncToken(syncToken) {
    const tokenHash = hashText(normalizeText(syncToken));
    return Object.values(state.mappings).find(
      (mapping) =>
        mapping.recordingItemId &&
        mapping.syncTokenHash &&
        safeEqual(mapping.syncTokenHash, tokenHash)
    );
  }

  function signAudioToken(mapping, privateConfig) {
    const payload = Buffer.from(
      JSON.stringify({
        itemId: mapping.recordingItemId,
        taskId: mapping.taskId,
        exp: now() + audioTokenTtlMs,
        nonce: randomOpaqueId(),
      })
    ).toString("base64url");
    const signature = crypto
      .createHmac("sha256", privateConfig.tokenSecret)
      .update(payload)
      .digest("base64url");
    return `${payload}.${signature}`;
  }

  function verifyAudioToken(token, privateConfig) {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) {
      return null;
    }
    const expected = crypto
      .createHmac("sha256", privateConfig.tokenSecret)
      .update(parts[0])
      .digest("base64url");
    if (!safeEqual(parts[1], expected)) {
      return null;
    }
    try {
      const payload = JSON.parse(
        Buffer.from(parts[0], "base64url").toString("utf8")
      );
      if (
        !normalizeText(payload.itemId) ||
        !normalizeText(payload.taskId) ||
        !Number.isFinite(payload.exp) ||
        payload.exp < now()
      ) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  async function queryRecordingResult(syncToken) {
    const privateConfig = getConfig();
    const mapping = findMappingBySyncToken(syncToken);
    if (!mapping) {
      throw new IntegrationError(
        401,
        "SYNC_TOKEN_INVALID",
        "同步凭证无效。"
      );
    }
    assertAllowedTask(privateConfig, mapping.taskId);

    let response;
    let upstreamBody;
    try {
      const upstreamResult = await fetchUpstreamJson(
        `${privateConfig.baseUrl}/api/integrations/items/${encodeURIComponent(
          mapping.recordingItemId
        )}`,
        {
          method: "GET",
          headers: { "X-API-Key": privateConfig.apiKey },
        }
      );
      response = upstreamResult.response;
      upstreamBody = upstreamResult.body;
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        503,
        "RECORDING_PLATFORM_UNAVAILABLE",
        "录音平台暂时不可用。"
      );
    }
    if (!response.ok) {
      const summary = toSafeUpstreamSummary(
        upstreamBody,
        "录音结果查询失败。"
      );
      throw new IntegrationError(
        response.status >= 500 ? 503 : response.status,
        "RECORDING_PLATFORM_QUERY_FAILED",
        "录音结果查询失败。",
        { upstream: summary }
      );
    }

    mapping.status = normalizeText(upstreamBody.status) || mapping.status;
    mapping.updatedAt = now();
    persistState();
    const audioAvailable =
      mapping.status === "COMPLETED" && upstreamBody.audioAvailable === true;
    const result = {
      itemId: mapping.recordingItemId,
      itemCode: normalizeText(upstreamBody.itemCode) || mapping.itemCode,
      status: mapping.status,
      updatedAt: normalizeText(upstreamBody.updatedAt) || null,
      text:
        mapping.status === "COMPLETED" && typeof upstreamBody.text === "string"
          ? upstreamBody.text
          : null,
      audioAvailable,
    };
    if (audioAvailable) {
      result.audioUrl =
        `${ROUTE_PREFIX}/recording-items/audio/` +
        signAudioToken(mapping, privateConfig);
    }
    return result;
  }

  async function proxyRecordingAudio(request, response, token) {
    const privateConfig = getConfig();
    const payload = verifyAudioToken(token, privateConfig);
    if (!payload) {
      throw new IntegrationError(
        401,
        "AUDIO_TOKEN_INVALID",
        "音频播放凭证无效或已过期。"
      );
    }
    assertAllowedTask(privateConfig, payload.taskId);
    const headers = { "X-API-Key": privateConfig.apiKey };
    const requestedRange = normalizeText(request.headers.range);
    if (requestedRange) {
      if (requestedRange.includes(",")) {
        throw new IntegrationError(416, "INVALID_RANGE", "仅支持单个 Range。");
      }
      headers.Range = requestedRange;
    }
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, upstreamTimeoutMs);
    timeout.unref?.();
    const onClientClose = () => {
      if (!response.writableEnded) {
        controller.abort();
      }
    };
    const onRequestAborted = () => controller.abort();
    response.on("close", onClientClose);
    request.on("aborted", onRequestAborted);

    let upstreamResponse;
    try {
      upstreamResponse = await fetchImpl(
        `${privateConfig.baseUrl}/api/integrations/items/${encodeURIComponent(
          payload.itemId
        )}/audio`,
        { method: "GET", headers, signal: controller.signal }
      );
    } catch (error) {
      clearTimeout(timeout);
      response.removeListener("close", onClientClose);
      request.removeListener("aborted", onRequestAborted);
      throw new IntegrationError(
        503,
        "RECORDING_PLATFORM_UNAVAILABLE",
        timedOut ? "录音读取超时。" : "录音平台暂时不可用。"
      );
    }

    const responseHeaders = {};
    for (const headerName of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const value = upstreamResponse.headers.get(headerName);
      if (value) {
        responseHeaders[headerName] = value;
      }
    }
    responseHeaders["access-control-allow-origin"] = "*";
    responseHeaders["x-content-type-options"] = "nosniff";
    try {
      if (upstreamResponse.status === 416) {
        response.writeHead(416, responseHeaders);
        response.end();
        return;
      }
      if (!upstreamResponse.ok) {
        const upstreamBody = await readSafeUpstreamBody(upstreamResponse);
        throw new IntegrationError(
          upstreamResponse.status >= 500 ? 503 : upstreamResponse.status,
          "RECORDING_AUDIO_PROXY_FAILED",
          "录音读取失败。",
          {
            upstream: toSafeUpstreamSummary(
              upstreamBody,
              "录音读取失败。"
            ),
          }
        );
      }

      response.writeHead(upstreamResponse.status, responseHeaders);
      if (!upstreamResponse.body) {
        response.end();
        return;
      }
      await new Promise((resolve, reject) => {
        const stream = Readable.fromWeb(upstreamResponse.body);
        let settled = false;

        function finish(error) {
          if (settled) {
            return;
          }
          settled = true;
          controller.signal.removeEventListener("abort", onAbort);
          response.removeListener("finish", onFinish);
          response.removeListener("error", onResponseError);
          stream.removeListener("error", onStreamError);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }

        function onAbort() {
          stream.destroy();
          if (response.headersSent && !response.writableEnded) {
            response.destroy();
          }
          finish(
            new IntegrationError(
              503,
              "RECORDING_AUDIO_STREAM_ABORTED",
              timedOut ? "录音读取超时。" : "录音读取已取消。"
            )
          );
        }

        function onFinish() {
          finish();
        }

        function onResponseError() {
          finish(
            new IntegrationError(
              503,
              "RECORDING_AUDIO_STREAM_FAILED",
              "录音代理响应失败。"
            )
          );
        }

        function onStreamError() {
          finish(
            new IntegrationError(
              503,
              "RECORDING_AUDIO_STREAM_FAILED",
              "录音上游流读取失败。"
            )
          );
        }

        controller.signal.addEventListener("abort", onAbort, { once: true });
        response.once("finish", onFinish);
        response.once("error", onResponseError);
        stream.once("error", onStreamError);
        stream.pipe(response);
      });
    } finally {
      clearTimeout(timeout);
      response.removeListener("close", onClientClose);
      request.removeListener("aborted", onRequestAborted);
    }
  }

  function sendPublicMedia(request, response, mediaId, method) {
    assertStateAvailable();
    const media = state.media[normalizeText(mediaId)];
    if (!media || media.linked !== true) {
      throw new IntegrationError(404, "MEDIA_NOT_FOUND", "媒体不存在。");
    }
    let stat;
    let filePath;
    try {
      filePath = resolveRuntimeFile(media.relativePath);
      stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new Error("not-file");
      }
    } catch (error) {
      throw new IntegrationError(404, "MEDIA_NOT_FOUND", "媒体不存在。");
    }

    const range = parseSingleRange(request.headers.range, stat.size);
    if (range === false) {
      response.writeHead(416, {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${stat.size}`,
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      });
      response.end();
      return;
    }
    const status = range ? 206 : 200;
    const start = range ? range.start : 0;
    const end = range ? range.end : stat.size - 1;
    const headers = {
      "Content-Type": media.contentType,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };
    if (range) {
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    }
    if (method === "HEAD") {
      response.writeHead(status, headers);
      response.end();
      return;
    }
    let stream;
    try {
      stream = createReadStream(filePath, { start, end });
    } catch (error) {
      throw new IntegrationError(
        500,
        "PUBLIC_MEDIA_READ_FAILED",
        "媒体读取失败。"
      );
    }
    stream.once("error", () => {
      const safeError = new IntegrationError(
        500,
        "PUBLIC_MEDIA_READ_FAILED",
        "媒体读取失败。"
      );
      if (response.headersSent) {
        if (!response.destroyed) {
          response.destroy();
        }
        return;
      }
      sendIntegrationError(response, safeError);
    });
    response.once("close", () => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
    response.writeHead(status, headers);
    stream.pipe(response);
  }

  reconcileRuntime();
  const maintenanceTimer = setInterval(() => {
    try {
      reconcileRuntime();
    } catch (error) {
      // Maintenance is retried on the next interval without exposing local paths.
    }
  }, maintenanceIntervalMs);
  maintenanceTimer.unref?.();

  return {
    uploadLimiter,
    cleanupExpiredUploads,
    storeUpload,
    createRecordingItem,
    queryRecordingResult,
    proxyRecordingAudio,
    sendPublicMedia,
    close() {
      clearInterval(maintenanceTimer);
    },
    getSnapshot() {
      return JSON.parse(JSON.stringify(state));
    },
  };
}

function sendIntegrationError(response, error) {
  if (response.headersSent || response.writableEnded) {
    if (!response.destroyed) {
      response.destroy();
    }
    return;
  }
  const safeError =
    error instanceof IntegrationError
      ? error
      : new IntegrationError(
          500,
          "RECORDING_INTEGRATION_FAILED",
          "录音平台集成请求处理失败。"
        );
  const body = {
    success: false,
    code: safeError.code,
    message: safeError.message,
  };
  if (safeError.details?.upstream) {
    body.upstream = safeError.details.upstream;
  }
  sendJson(response, safeError.status, body);
}

function registerRecordingIntegrationRoutes(router, options) {
  const integration =
    options?.integration || createRecordingIntegration(options || {});

  router.post(`${ROUTE_PREFIX}/recording-media/:kind`, async function (context) {
    try {
      const result = await integration.storeUpload(
        context.request,
        context.params.kind,
        context.request.headers["x-recording-task-id"]
      );
      sendJson(context.response, 201, result);
    } catch (error) {
      if (error?.abortRequest) {
        context.response.once("finish", () => {
          if (!context.request.destroyed) {
            context.request.destroy();
          }
        });
      }
      sendIntegrationError(context.response, error);
    }
  });

  router.post(`${ROUTE_PREFIX}/recording-items`, async function (context) {
    try {
      const body = await readJsonBody(context.request);
      const result = await integration.createRecordingItem(body);
      sendJson(context.response, result.replayed ? 200 : 201, {
        syncToken: result.syncToken,
        item: result.item,
      });
    } catch (error) {
      sendIntegrationError(context.response, error);
    }
  });

  router.post(`${ROUTE_PREFIX}/recording-items/result`, async function (context) {
    try {
      const body = await readJsonBody(context.request);
      validateExactObject(body, new Set(["syncToken"]));
      const syncToken = normalizeText(body.syncToken);
      if (!syncToken) {
        throw new IntegrationError(
          422,
          "SYNC_TOKEN_REQUIRED",
          "syncToken 不能为空。"
        );
      }
      sendJson(
        context.response,
        200,
        await integration.queryRecordingResult(syncToken)
      );
    } catch (error) {
      sendIntegrationError(context.response, error);
    }
  });

  router.get(
    `${ROUTE_PREFIX}/recording-items/audio/:token`,
    async function (context) {
      try {
        await integration.proxyRecordingAudio(
          context.request,
          context.response,
          context.params.token
        );
      } catch (error) {
        sendIntegrationError(context.response, error);
      }
    }
  );

  function servePublicMedia(context) {
    try {
      integration.sendPublicMedia(
        context.request,
        context.response,
        context.params.mediaId,
        context.method
      );
    } catch (error) {
      sendIntegrationError(context.response, error);
    }
  }
  router.get("/api/public/recording-media/:mediaId", servePublicMedia);
  router.head("/api/public/recording-media/:mediaId", servePublicMedia);
  return integration;
}

module.exports = {
  IntegrationError,
  createRecordingIntegration,
  registerRecordingIntegrationRoutes,
  __test__: {
    createUploadLimiter,
    detectMedia,
    parseSingleRange,
    readPrivateConfig,
    validateConfig,
  },
};
