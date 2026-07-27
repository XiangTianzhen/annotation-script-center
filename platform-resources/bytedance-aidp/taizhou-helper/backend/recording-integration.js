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
const STATE_VERSION = 3;
const SOURCE_PLATFORM = "BYTEDANCE_AIDP";
const DEFAULT_AUDIO_TOKEN_TTL_MS = 120 * 1000;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60 * 1000;
const DEFAULT_MAX_UPSTREAM_JSON_BYTES = 256 * 1024;
const ITEM_FIELDS = new Set([
  "recordingTaskCode",
  "sourceItemId",
  "referenceText",
  "referenceAudioUrl",
  "referenceVideoUrl",
]);
const SAFE_MAPPING_FIELDS = new Set([
  "mappingKey",
  "requestFingerprint",
  "taskCode",
  "taskId",
  "sourceItemId",
  "operationKey",
  "recordingItemId",
  "itemCode",
  "status",
  "recordingCreatedAt",
  "createdAt",
  "updatedAt",
  "syncTokenHash",
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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function randomOpaqueId() {
  return crypto.randomBytes(24).toString("base64url");
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sanitizeIdentifier(value, maxLength, fallback) {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.:-]/g, "")
    .slice(0, maxLength);
  return sanitized || fallback || "";
}

function parseUrl(value) {
  try {
    return new URL(normalizeText(value));
  } catch (_error) {
    return null;
  }
}

function hasSafeAuthority(parsed) {
  return Boolean(parsed?.hostname) && !parsed.username && !parsed.password;
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

function isSafeBaseUrl(value) {
  const parsed = parseUrl(value);
  if (!hasSafeAuthority(parsed)) {
    return false;
  }
  if (parsed.protocol === "https:") {
    return true;
  }
  return parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname);
}

function normalizeHttpsReference(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  const parsed = parseUrl(normalized);
  if (
    !hasSafeAuthority(parsed) ||
    parsed.protocol !== "https:"
  ) {
    throw new IntegrationError(
      422,
      "REMOTE_URL_INVALID",
      "参考媒体地址必须是不含用户信息的绝对 HTTPS URL。"
    );
  }
  return normalized;
}

function canonicalizeHttpsReference(value) {
  const normalized = normalizeText(value);
  return normalized ? parseUrl(normalized).toString() : "";
}

function validateConfig(candidate) {
  const source =
    candidate && typeof candidate === "object" && !Array.isArray(candidate)
      ? candidate
      : {};
  const baseUrl = normalizeText(source.baseUrl).replace(/\/+$/, "");
  const apiKey = normalizeText(source.apiKey);
  const tokenSecret = normalizeText(source.tokenSecret);
  const allowedTaskCodes = Array.isArray(source.allowedTaskCodes)
    ? Array.from(
        new Set(source.allowedTaskCodes.map(normalizeText).filter(Boolean))
      )
    : [];
  if (
    !isSafeBaseUrl(baseUrl) ||
    !apiKey ||
    allowedTaskCodes.length === 0 ||
    tokenSecret.length < 32
  ) {
    return null;
  }
  return { baseUrl, apiKey, allowedTaskCodes, tokenSecret };
}

function readPrivateConfig(configPath) {
  try {
    return validateConfig(JSON.parse(fs.readFileSync(configPath, "utf8")));
  } catch (_error) {
    return null;
  }
}

function createEmptyState() {
  return { version: STATE_VERSION, mappings: {} };
}

function sanitizeMapping(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  const mapping = {};
  for (const field of SAFE_MAPPING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(candidate, field)) {
      mapping[field] = candidate[field];
    }
  }
  if (
    !normalizeText(mapping.mappingKey) ||
    !normalizeText(mapping.taskCode) ||
    !normalizeText(mapping.sourceItemId)
  ) {
    return null;
  }
  return mapping;
}

function sanitizeMappings(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  const mappings = {};
  for (const [key, value] of Object.entries(candidate)) {
    const mapping = sanitizeMapping(value);
    if (!mapping) {
      return null;
    }
    mappings[key] = mapping;
  }
  return mappings;
}

function sanitizeLegacyMappings(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  const mappings = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    if (!normalizeText(value.taskCode)) {
      continue;
    }
    const mapping = sanitizeMapping(value);
    if (!mapping) {
      return null;
    }
    mappings[key] = mapping;
  }
  return mappings;
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

function resolveFixedLegacyDirectory(runtimeDir, name) {
  const resolvedRuntime = path.resolve(runtimeDir);
  const resolvedTarget = path.resolve(resolvedRuntime, name);
  if (
    !["temp", "media"].includes(name) ||
    resolvedTarget === resolvedRuntime ||
    path.dirname(resolvedTarget) !== resolvedRuntime
  ) {
    throw new IntegrationError(
      503,
      "RECORDING_INTEGRATION_STATE_MIGRATION_FAILED",
      "录音集成状态迁移失败。"
    );
  }
  return resolvedTarget;
}

function loadState(options) {
  const statePath = options.statePath;
  const runtimeDir = options.runtimeDir;
  const removeDirectorySync =
    options.removeDirectorySync ||
    ((target) => fs.rmSync(target, { recursive: true, force: true }));
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      try {
        if (fs.readdirSync(runtimeDir).length > 0) {
          throw new IntegrationError(
            503,
            "RECORDING_INTEGRATION_STATE_INVALID",
            "录音集成状态缺失且运行目录非空，已安全停止。"
          );
        }
      } catch (directoryError) {
        if (directoryError?.code !== "ENOENT") {
          throw directoryError;
        }
      }
      return createEmptyState();
    }
    throw new IntegrationError(
      503,
      "RECORDING_INTEGRATION_STATE_INVALID",
      "录音集成状态损坏，已安全停止。"
    );
  }
  if (parsed.version === STATE_VERSION) {
    const mappings = sanitizeMappings(parsed?.mappings);
    if (!mappings) {
      throw new IntegrationError(
        503,
        "RECORDING_INTEGRATION_STATE_INVALID",
        "录音集成状态损坏，已安全停止。"
      );
    }
    return { version: STATE_VERSION, mappings };
  }
  if (parsed.version === 2) {
    const mappings = sanitizeLegacyMappings(parsed?.mappings);
    if (!mappings) {
      throw new IntegrationError(
        503,
        "RECORDING_INTEGRATION_STATE_INVALID",
        "录音集成状态损坏，已安全停止。"
      );
    }
    const migrated = { version: STATE_VERSION, mappings };
    atomicWriteJson(statePath, migrated);
    return migrated;
  }
  if (
    parsed.version !== 1 ||
    !parsed.uploads ||
    Array.isArray(parsed.uploads) ||
    !parsed.media ||
    Array.isArray(parsed.media)
  ) {
    throw new IntegrationError(
      503,
      "RECORDING_INTEGRATION_STATE_INVALID",
      "录音集成状态版本无效，已安全停止。"
    );
  }
  const mappings = sanitizeLegacyMappings(parsed.mappings);
  if (!mappings) {
    throw new IntegrationError(
      503,
      "RECORDING_INTEGRATION_STATE_INVALID",
      "录音集成状态损坏，已安全停止。"
    );
  }
  try {
    for (const name of ["temp", "media"]) {
      const target = resolveFixedLegacyDirectory(runtimeDir, name);
      if (fs.existsSync(target)) {
        removeDirectorySync(target);
      }
    }
    const migrated = { version: STATE_VERSION, mappings };
    atomicWriteJson(statePath, migrated);
    return migrated;
  } catch (error) {
    if (error instanceof IntegrationError) {
      throw error;
    }
    throw new IntegrationError(
      503,
      "RECORDING_INTEGRATION_STATE_MIGRATION_FAILED",
      "录音集成状态迁移失败，已安全停止。"
    );
  }
}

function validateExactObject(body, allowedFields) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new IntegrationError(400, "INVALID_REQUEST", "请求体必须是 JSON 对象。");
  }
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      throw new IntegrationError(400, "UNKNOWN_FIELD", "请求包含未知字段。");
    }
  }
}

function validateStringFields(body, requiredFields, optionalFields) {
  for (const field of requiredFields) {
    if (typeof body[field] !== "string") {
      throw new IntegrationError(
        400,
        "INVALID_FIELD_TYPE",
        "请求字段类型无效。"
      );
    }
  }
  for (const field of optionalFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== "string"
    ) {
      throw new IntegrationError(
        400,
        "INVALID_FIELD_TYPE",
        "请求字段类型无效。"
      );
    }
  }
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
      } else {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (exceeded) {
        reject(new IntegrationError(413, "REQUEST_TOO_LARGE", "请求体超过限制。"));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (_error) {
        reject(new IntegrationError(400, "MALFORMED_JSON", "JSON 请求体格式错误。"));
      }
    });
    request.on("error", () =>
      reject(new IntegrationError(400, "REQUEST_READ_FAILED", "请求体读取失败。"))
    );
  });
}

async function readLimitedJsonResponse(response, maxBytes) {
  const limit = normalizePositiveInteger(maxBytes, DEFAULT_MAX_UPSTREAM_JSON_BYTES);
  if (!response.body) {
    return {};
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      throw new IntegrationError(
        503,
        "RECORDING_PLATFORM_INVALID_RESPONSE",
        "录音平台响应超过安全限制。"
      );
    }
    chunks.push(Buffer.from(value));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch (_error) {
    throw new IntegrationError(
      503,
      "RECORDING_PLATFORM_INVALID_RESPONSE",
      "录音平台返回了无效响应。"
    );
  }
}

function toSafeUpstreamSummary(body, fallbackMessage) {
  return {
    code: sanitizeIdentifier(body?.code, 64, "UPSTREAM_ERROR"),
    message: normalizeText(body?.message).slice(0, 160) || fallbackMessage,
  };
}

function createRecordingIntegration(options) {
  const deps = options && typeof options === "object" ? options : {};
  const configPath = path.resolve(deps.configPath || DEFAULT_CONFIG_PATH);
  const runtimeDir = path.resolve(deps.runtimeDir || DEFAULT_RUNTIME_DIR);
  const statePath = path.join(runtimeDir, "state.json");
  const fetchImpl =
    typeof deps.fetchImpl === "function" ? deps.fetchImpl : globalThis.fetch;
  const now = typeof deps.now === "function" ? deps.now : Date.now;
  const audioTokenTtlMs = normalizePositiveInteger(
    deps.audioTokenTtlMs,
    DEFAULT_AUDIO_TOKEN_TTL_MS
  );
  const upstreamTimeoutMs = normalizePositiveInteger(
    deps.upstreamTimeoutMs,
    DEFAULT_UPSTREAM_TIMEOUT_MS
  );
  const maxUpstreamJsonBytes = normalizePositiveInteger(
    deps.maxUpstreamJsonBytes,
    DEFAULT_MAX_UPSTREAM_JSON_BYTES
  );
  const state = loadState({
    statePath,
    runtimeDir,
    removeDirectorySync: deps.removeDirectorySync,
  });
  const mappingFlights = new Map();

  function persistState() {
    atomicWriteJson(statePath, state);
  }

  function getConfig() {
    const config = readPrivateConfig(configPath);
    if (!config) {
      throw new IntegrationError(
        503,
        "RECORDING_INTEGRATION_NOT_CONFIGURED",
        "录音平台集成未配置。"
      );
    }
    return config;
  }

  function assertAllowedTask(config, taskCode) {
    const normalized = normalizeText(taskCode);
    if (!config.allowedTaskCodes.includes(normalized)) {
      throw new IntegrationError(
        403,
        "RECORDING_TASK_NOT_ALLOWED",
        "目标录音任务不在服务器允许列表中。"
      );
    }
    return normalized;
  }

  function mappingKeyFor(taskCode, sourceItemId) {
    return hashText(
      ["bytedance-aidp/taizhou-helper", taskCode, sourceItemId].join("\n")
    );
  }

  function newOperationKey(mappingKey) {
    return hashText(`${mappingKey}\n${randomOpaqueId()}`);
  }

  function requestFingerprintFor(referenceText, audioUrl, videoUrl) {
    return hashText(
      JSON.stringify({
        referenceText,
        referenceAudioUrl: audioUrl,
        referenceVideoUrl: videoUrl,
      })
    );
  }

  function issueSyncToken(mapping, config) {
    const token = crypto
      .createHmac("sha256", config.tokenSecret)
      .update("recording-sync-token\0")
      .update(mapping.mappingKey)
      .digest("base64url");
    const tokenHash = hashText(token);
    if (mapping.syncTokenHash !== tokenHash) {
      mapping.syncTokenHash = tokenHash;
      mapping.updatedAt = now();
      persistState();
    }
    return token;
  }

  function toItemSummary(mapping) {
    return {
      itemId: mapping.recordingItemId,
      taskId: mapping.taskId,
      taskCode: mapping.taskCode,
      itemCode: mapping.itemCode,
      status: mapping.status,
      createdAt: mapping.recordingCreatedAt || null,
    };
  }

  async function fetchUpstreamJson(url, requestOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);
    timeout.unref?.();
    try {
      const response = await fetchImpl(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      return {
        response,
        body: await readLimitedJsonResponse(response, maxUpstreamJsonBytes),
      };
    } catch (error) {
      if (error instanceof IntegrationError) {
        throw error;
      }
      throw new IntegrationError(
        503,
        "RECORDING_PLATFORM_UNAVAILABLE",
        "录音平台暂时不可用，请使用相同来源条目重试。"
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchRecordingItem(mapping, config) {
    return fetchUpstreamJson(
      `${config.baseUrl}/api/integrations/items/${encodeURIComponent(
        mapping.recordingItemId
      )}`,
      {
        method: "GET",
        headers: { "X-API-Key": config.apiKey },
      }
    );
  }

  function recordingQueryFailure(upstream) {
    return new IntegrationError(
      upstream.response.status >= 500 ? 503 : upstream.response.status,
      "RECORDING_PLATFORM_QUERY_FAILED",
      "录音结果查询失败。",
      {
        upstream: toSafeUpstreamSummary(
          upstream.body,
          "录音结果查询失败。"
        ),
      }
    );
  }

  async function createRecordingItem(body) {
    const config = getConfig();
    validateExactObject(body, ITEM_FIELDS);
    validateStringFields(
      body,
      ["recordingTaskCode", "sourceItemId"],
      ["referenceText", "referenceAudioUrl", "referenceVideoUrl"]
    );
    const taskCode = assertAllowedTask(config, body.recordingTaskCode);
    const sourceItemId = normalizeText(body.sourceItemId);
    if (!sourceItemId) {
      throw new IntegrationError(
        422,
        "SOURCE_ITEM_ID_REQUIRED",
        "sourceItemId 不能为空。"
      );
    }
    const referenceText = normalizeText(body.referenceText);
    const referenceAudioUrl = normalizeHttpsReference(body.referenceAudioUrl);
    const referenceVideoUrl = normalizeHttpsReference(body.referenceVideoUrl);
    if (!referenceText && !referenceAudioUrl && !referenceVideoUrl) {
      throw new IntegrationError(
        422,
        "ITEM_REFERENCE_REQUIRED",
        "至少需要一种非空参考内容。"
      );
    }
    const mappingKey = mappingKeyFor(taskCode, sourceItemId);
    const requestFingerprint = requestFingerprintFor(
      referenceText,
      canonicalizeHttpsReference(referenceAudioUrl),
      canonicalizeHttpsReference(referenceVideoUrl)
    );
    const existingMapping = state.mappings[mappingKey];
    if (
      existingMapping?.requestFingerprint &&
      existingMapping.requestFingerprint !== requestFingerprint
    ) {
      throw new IntegrationError(
        409,
        "SOURCE_ITEM_CONTENT_CONFLICT",
        "相同来源条目的参考内容与首次请求不一致。"
      );
    }
    const existingFlight = mappingFlights.get(mappingKey);
    if (existingFlight) {
      if (existingFlight.requestFingerprint !== requestFingerprint) {
        throw new IntegrationError(
          409,
          "SOURCE_ITEM_CONTENT_CONFLICT",
          "相同来源条目的参考内容与进行中请求不一致。"
        );
      }
      return existingFlight.promise;
    }

    const flightPromise = (async () => {
      let mapping = state.mappings[mappingKey];
      if (mapping?.recordingItemId) {
        const upstream = await fetchRecordingItem(mapping, config);
        if (upstream.response.ok) {
          mapping.status =
            normalizeText(upstream.body.status) || mapping.status;
          mapping.itemCode =
            normalizeText(upstream.body.itemCode) || mapping.itemCode;
          mapping.updatedAt = now();
          persistState();
          return {
            replayed: true,
            syncToken: issueSyncToken(mapping, config),
            item: toItemSummary(mapping),
          };
        }
        const upstreamCode = sanitizeIdentifier(
          upstream.body?.code,
          64,
          ""
        );
        if (
          upstream.response.status !== 404 ||
          upstreamCode !== "TASK_ITEM_NOT_FOUND"
        ) {
          throw recordingQueryFailure(upstream);
        }
        mapping.taskId = null;
        mapping.operationKey = newOperationKey(mappingKey);
        mapping.recordingItemId = null;
        mapping.itemCode = null;
        mapping.status = "PENDING";
        mapping.recordingCreatedAt = null;
        mapping.updatedAt = now();
        persistState();
      }
      if (!mapping) {
        mapping = {
          mappingKey,
          requestFingerprint,
          taskCode,
          taskId: null,
          sourceItemId,
          operationKey: newOperationKey(mappingKey),
          recordingItemId: null,
          itemCode: null,
          status: "PENDING",
          recordingCreatedAt: null,
          createdAt: now(),
          updatedAt: now(),
        };
        state.mappings[mappingKey] = mapping;
        persistState();
      } else if (!mapping.requestFingerprint) {
        mapping.requestFingerprint = requestFingerprint;
        persistState();
      }

      const upstreamBody = {};
      if (referenceText) upstreamBody.referenceText = referenceText;
      if (referenceAudioUrl) upstreamBody.referenceAudioUrl = referenceAudioUrl;
      if (referenceVideoUrl) upstreamBody.referenceVideoUrl = referenceVideoUrl;
      upstreamBody.sourcePlatform = SOURCE_PLATFORM;
      upstreamBody.sourceItemId = sourceItemId;
      let upstream;
      try {
        upstream = await fetchUpstreamJson(
          `${config.baseUrl}/api/integrations/tasks/by-code/${encodeURIComponent(
            taskCode
          )}/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": config.apiKey,
              "Idempotency-Key": mapping.operationKey,
            },
            body: JSON.stringify(upstreamBody),
          }
        );
      } catch (error) {
        mapping.status = "RETRYABLE";
        mapping.updatedAt = now();
        persistState();
        throw error;
      }
      if (!upstream.response.ok) {
        const upstreamCode = sanitizeIdentifier(upstream.body?.code, 64, "");
        const retryable =
          upstream.response.status === 408 ||
          upstream.response.status === 429 ||
          upstream.response.status >= 500 ||
          (upstream.response.status === 409 &&
            upstreamCode === "OPERATION_IN_PROGRESS");
        if (retryable) {
          mapping.status = "RETRYABLE";
          mapping.updatedAt = now();
          persistState();
          throw new IntegrationError(
            upstream.response.status === 409 ? 409 : 503,
            upstream.response.status === 409
              ? "RECORDING_PLATFORM_IN_PROGRESS"
              : "RECORDING_PLATFORM_UNAVAILABLE",
            "录音平台暂时不可用，请使用相同来源条目重试。",
            {
              upstream: toSafeUpstreamSummary(
                upstream.body,
                "录音平台暂时不可用。"
              ),
            }
          );
        }
        delete state.mappings[mappingKey];
        persistState();
        throw new IntegrationError(
          upstream.response.status,
          "RECORDING_PLATFORM_REJECTED",
          "录音平台拒绝了条目创建请求。",
          {
            upstream: toSafeUpstreamSummary(
              upstream.body,
              "录音平台拒绝了请求。"
            ),
          }
        );
      }
      const recordingItemId = normalizeText(upstream.body.itemId);
      const itemCode = normalizeText(upstream.body.itemCode);
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
      mapping.taskId = normalizeText(upstream.body.taskId) || null;
      mapping.itemCode = itemCode;
      mapping.status = normalizeText(upstream.body.status) || "AVAILABLE";
      mapping.recordingCreatedAt = normalizeText(upstream.body.createdAt) || null;
      mapping.updatedAt = now();
      persistState();
      return {
        replayed: false,
        syncToken: issueSyncToken(mapping, config),
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

  function signAudioToken(mapping, config) {
    const payload = Buffer.from(
      JSON.stringify({
        itemId: mapping.recordingItemId,
        taskCode: mapping.taskCode,
        exp: now() + audioTokenTtlMs,
        nonce: randomOpaqueId(),
      })
    ).toString("base64url");
    const signature = crypto
      .createHmac("sha256", config.tokenSecret)
      .update(payload)
      .digest("base64url");
    return `${payload}.${signature}`;
  }

  function verifyAudioToken(token, config) {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) return null;
    const expected = crypto
      .createHmac("sha256", config.tokenSecret)
      .update(parts[0])
      .digest("base64url");
    if (!safeEqual(parts[1], expected)) return null;
    try {
      const payload = JSON.parse(
        Buffer.from(parts[0], "base64url").toString("utf8")
      );
      if (
        !normalizeText(payload.itemId) ||
        !normalizeText(payload.taskCode) ||
        !Number.isFinite(payload.exp) ||
        payload.exp < now()
      ) {
        return null;
      }
      return payload;
    } catch (_error) {
      return null;
    }
  }

  async function queryRecordingResult(syncToken) {
    const config = getConfig();
    const mapping = findMappingBySyncToken(syncToken);
    if (!mapping) {
      throw new IntegrationError(401, "SYNC_TOKEN_INVALID", "同步凭证无效。");
    }
    assertAllowedTask(config, mapping.taskCode);
    const upstream = await fetchRecordingItem(mapping, config);
    if (!upstream.response.ok) {
      throw recordingQueryFailure(upstream);
    }
    mapping.status = normalizeText(upstream.body.status) || mapping.status;
    mapping.updatedAt = now();
    persistState();
    const audioAvailable =
      mapping.status === "COMPLETED" && upstream.body.audioAvailable === true;
    const result = {
      itemId: mapping.recordingItemId,
      itemCode: normalizeText(upstream.body.itemCode) || mapping.itemCode,
      status: mapping.status,
      updatedAt: normalizeText(upstream.body.updatedAt) || null,
      text:
        mapping.status === "COMPLETED" &&
        typeof upstream.body.text === "string"
          ? upstream.body.text
          : null,
      audioAvailable,
    };
    if (audioAvailable) {
      result.audioUrl =
        `${ROUTE_PREFIX}/recording-items/audio/` +
        signAudioToken(mapping, config);
    }
    return result;
  }

  async function proxyRecordingAudio(request, response, token) {
    const config = getConfig();
    const payload = verifyAudioToken(token, config);
    if (!payload) {
      throw new IntegrationError(
        401,
        "AUDIO_TOKEN_INVALID",
        "音频播放凭证无效或已过期。"
      );
    }
    assertAllowedTask(config, payload.taskCode);
    const headers = { "X-API-Key": config.apiKey };
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
    const abort = () => controller.abort();
    request.once("aborted", abort);
    response.once("close", abort);
    try {
      let upstream;
      try {
        upstream = await fetchImpl(
          `${config.baseUrl}/api/integrations/items/${encodeURIComponent(
            payload.itemId
          )}/audio`,
          { method: "GET", headers, signal: controller.signal }
        );
      } catch (_error) {
        throw new IntegrationError(
          503,
          "RECORDING_PLATFORM_UNAVAILABLE",
          timedOut ? "录音读取超时。" : "录音平台暂时不可用。"
        );
      }
      const responseHeaders = {
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      };
      for (const name of [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
      ]) {
        const value = upstream.headers.get(name);
        if (value) responseHeaders[name] = value;
      }
      if (upstream.status === 416) {
        response.writeHead(416, responseHeaders);
        response.end();
        return;
      }
      if (!upstream.ok) {
        throw new IntegrationError(
          upstream.status >= 500 ? 503 : upstream.status,
          "RECORDING_AUDIO_PROXY_FAILED",
          "录音读取失败。"
        );
      }
      response.writeHead(upstream.status, responseHeaders);
      if (!upstream.body) {
        response.end();
        return;
      }
      await new Promise((resolve, reject) => {
        const stream = Readable.fromWeb(upstream.body);
        stream.once("error", reject);
        response.once("finish", resolve);
        stream.pipe(response);
      });
    } finally {
      clearTimeout(timeout);
      request.removeListener("aborted", abort);
      response.removeListener("close", abort);
    }
  }

  return {
    createRecordingItem,
    queryRecordingResult,
    proxyRecordingAudio,
    close() {},
    getSnapshot() {
      return JSON.parse(JSON.stringify(state));
    },
  };
}

function sendIntegrationError(response, error) {
  if (response.headersSent || response.writableEnded) {
    if (!response.destroyed) response.destroy();
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
  return integration;
}

module.exports = {
  IntegrationError,
  createRecordingIntegration,
  registerRecordingIntegrationRoutes,
  __test__: {
    isSafeBaseUrl,
    canonicalizeHttpsReference,
    normalizeHttpsReference,
    readPrivateConfig,
    resolveFixedLegacyDirectory,
    validateConfig,
  },
};
