"use strict";

const {
  createRateLimitError,
  isProviderRateLimitedError,
  normalizeAbortError,
} = require("./errors");

const DEFAULT_QUEUE_MAX_SIZE = 9999;
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_QWEN_BURST_RETRY_MAX = 0;
const DEFAULT_RETRY_BASE_DELAY_MS = 1200;
const DEFAULT_RETRY_MAX_DELAY_MS = 12000;
const DEFAULT_MODEL_QUEUE_RPM = 1200;
const DEFAULT_MODEL_QUEUE_MAX_CONCURRENT = 15;
const DEFAULT_MODEL_QUEUE_PENDING_TIMEOUT_MS = 0;
const MODEL_QUEUE_KEY_PREFIX = "model:";
const DEFAULT_GROUP_SETTINGS = {
  qwen_omni: {
    rpmEnv: "DATABAKER_AI_QWEN_OMNI_RPM_LIMIT",
    rpm: 45,
    concurrencyEnv: "DATABAKER_AI_QWEN_OMNI_CONCURRENCY",
    maxConcurrent: 3,
  },
  fun_asr: {
    rpmEnv: "DATABAKER_AI_FUN_ASR_RPM_LIMIT",
    rpm: 500,
    concurrencyEnv: "DATABAKER_AI_FUN_ASR_CONCURRENCY",
    maxConcurrent: 2,
  },
  text_compare: {
    rpmEnv: "DATABAKER_AI_TEXT_RPM_LIMIT",
    rpm: 500,
    concurrencyEnv: "DATABAKER_AI_TEXT_CONCURRENCY",
    maxConcurrent: 5,
  },
};
const queueRegistry = new Map();

function isAbortSignalAborted(signal) {
  return Boolean(signal && signal.aborted === true);
}

function createQueueAbortError(signal) {
  return normalizeAbortError(signal?.reason, "当前任务超过60s，请重新请求。", "aborted", 504);
}

function delay(ms, signal) {
  return new Promise(function (resolve, reject) {
    if (isAbortSignalAborted(signal)) {
      reject(createQueueAbortError(signal));
      return;
    }
    const timer = setTimeout(function () {
      if (signal && typeof signal.removeEventListener === "function" && onAbort) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, Math.max(0, Number(ms) || 0));
    const onAbort = function () {
      clearTimeout(timer);
      if (signal && typeof signal.removeEventListener === "function") {
        signal.removeEventListener("abort", onAbort);
      }
      reject(createQueueAbortError(signal));
    };
    if (signal && typeof signal.addEventListener === "function") {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function parsePositiveInteger(value, fallback, min, max) {
  const numericValue = Math.floor(Number(value));
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numericValue));
}

function normalizeModelText(value) {
  return String(value || "").trim();
}

function normalizeModelEnvSegment(value) {
  return normalizeModelText(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function isModelQueueKey(groupName) {
  return String(groupName || "").trim().toLowerCase().indexOf(MODEL_QUEUE_KEY_PREFIX) === 0;
}

function buildModelQueueKey(modelName) {
  const normalizedModel = normalizeModelText(modelName);
  if (!normalizedModel) {
    return MODEL_QUEUE_KEY_PREFIX + "unknown";
  }
  return MODEL_QUEUE_KEY_PREFIX + normalizedModel;
}

function getGlobalQueueMaxSize() {
  return parsePositiveInteger(
    process.env.ASC_AI_QUEUE_MAX_SIZE || process.env.DATABAKER_AI_QUEUE_MAX_SIZE,
    DEFAULT_QUEUE_MAX_SIZE,
    1,
    20000
  );
}

function getGlobalPendingTimeoutMs() {
  const rawValue = process.env.ASC_AI_QUEUE_PENDING_TIMEOUT_MS || process.env.DATABAKER_AI_QUEUE_PENDING_TIMEOUT_MS;
  return normalizePendingTimeoutMs(rawValue, DEFAULT_MODEL_QUEUE_PENDING_TIMEOUT_MS);
}

function normalizePendingTimeoutMs(rawValue, fallback) {
  if (String(rawValue || "").trim() === "") {
    return Number(fallback) > 0 ? Number(fallback) : 0;
  }
  const numericValue = Math.floor(Number(rawValue));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }
  return Math.max(1000, Math.min(30 * 60 * 1000, numericValue));
}

function getGlobalRetryMax() {
  return parsePositiveInteger(
    process.env.ASC_AI_PROVIDER_RETRY_MAX || process.env.DATABAKER_AI_PROVIDER_RETRY_MAX,
    DEFAULT_RETRY_MAX,
    0,
    10
  );
}

function getRetryBaseDelayMs() {
  return parsePositiveInteger(
    process.env.ASC_AI_PROVIDER_RETRY_BASE_DELAY_MS || process.env.DATABAKER_AI_PROVIDER_RETRY_BASE_DELAY_MS,
    DEFAULT_RETRY_BASE_DELAY_MS,
    100,
    60000
  );
}

function getRetryMaxDelayMs() {
  return parsePositiveInteger(
    process.env.ASC_AI_PROVIDER_RETRY_MAX_DELAY_MS || process.env.DATABAKER_AI_PROVIDER_RETRY_MAX_DELAY_MS,
    DEFAULT_RETRY_MAX_DELAY_MS,
    100,
    120000
  );
}

function getGroupRetryMax(groupName) {
  if (isModelQueueKey(groupName)) {
    return parsePositiveInteger(
      process.env.ASC_AI_QWEN_BURST_RETRY_MAX || process.env.DATABAKER_AI_QWEN_BURST_RETRY_MAX,
      DEFAULT_QWEN_BURST_RETRY_MAX,
      0,
      10
    );
  }
  if (groupName === "qwen_omni" || groupName === "text_compare") {
    return parsePositiveInteger(
      process.env.DATABAKER_AI_QWEN_BURST_RETRY_MAX,
      DEFAULT_QWEN_BURST_RETRY_MAX,
      0,
      10
    );
  }
  return getGlobalRetryMax();
}

function getGroupRetryBaseDelayMs(groupName) {
  if (isModelQueueKey(groupName)) {
    return parsePositiveInteger(
      process.env.ASC_AI_QWEN_BURST_RETRY_BASE_MS || process.env.DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS,
      getRetryBaseDelayMs(),
      100,
      60000
    );
  }
  if (groupName === "qwen_omni" || groupName === "text_compare") {
    return parsePositiveInteger(
      process.env.DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS,
      getRetryBaseDelayMs(),
      100,
      60000
    );
  }
  return getRetryBaseDelayMs();
}

function getModelQueueSettings(groupName) {
  const normalizedKey = buildModelQueueKey(String(groupName || "").replace(/^model:/i, ""));
  const modelName = normalizedKey.slice(MODEL_QUEUE_KEY_PREFIX.length);
  const envSegment = normalizeModelEnvSegment(modelName);
  const rpm = parsePositiveInteger(
    process.env["ASC_AI_MODEL_QUEUE_" + envSegment + "_RPM_LIMIT"] ||
      process.env.ASC_AI_MODEL_QUEUE_DEFAULT_RPM_LIMIT,
    DEFAULT_MODEL_QUEUE_RPM,
    1,
    10000
  );
  const maxConcurrent = parsePositiveInteger(
    process.env["ASC_AI_MODEL_QUEUE_" + envSegment + "_CONCURRENCY"] ||
      process.env.ASC_AI_MODEL_QUEUE_DEFAULT_CONCURRENCY,
    DEFAULT_MODEL_QUEUE_MAX_CONCURRENT,
    1,
    20
  );
  const rawPendingTimeoutMs =
    process.env["ASC_AI_MODEL_QUEUE_" + envSegment + "_PENDING_TIMEOUT_MS"] ||
    process.env.ASC_AI_MODEL_QUEUE_DEFAULT_PENDING_TIMEOUT_MS ||
    process.env.ASC_AI_QUEUE_PENDING_TIMEOUT_MS ||
    process.env.DATABAKER_AI_QUEUE_PENDING_TIMEOUT_MS;
  const pendingTimeoutMs =
    String(rawPendingTimeoutMs || "").trim() === ""
      ? DEFAULT_MODEL_QUEUE_PENDING_TIMEOUT_MS
      : normalizePendingTimeoutMs(rawPendingTimeoutMs, DEFAULT_MODEL_QUEUE_PENDING_TIMEOUT_MS);
  return {
    groupName: normalizedKey,
    rpm,
    intervalMs: Math.max(1, Math.ceil(60000 / rpm)),
    maxConcurrent,
    maxSize: getGlobalQueueMaxSize(),
    pendingTimeoutMs,
    retryMax: getGroupRetryMax(normalizedKey),
    retryBaseDelayMs: getGroupRetryBaseDelayMs(normalizedKey),
    retryMaxDelayMs: getRetryMaxDelayMs(),
  };
}

function getModelQueuePolicy() {
  const settings = getModelQueueSettings(MODEL_QUEUE_KEY_PREFIX + "default");
  return {
    keyStrategy: "concrete-model-name",
    defaultRpm: settings.rpm,
    dispatchIntervalMs: settings.intervalMs,
    defaultMaxConcurrent: settings.maxConcurrent,
    maxSize: settings.maxSize,
    pendingTimeoutMs: settings.pendingTimeoutMs,
    retryMax: settings.retryMax,
    retryBaseDelayMs: settings.retryBaseDelayMs,
    retryMaxDelayMs: settings.retryMaxDelayMs,
  };
}

function getGroupSettings(groupName) {
  if (isModelQueueKey(groupName)) {
    return getModelQueueSettings(groupName);
  }
  const preset = DEFAULT_GROUP_SETTINGS[groupName] || DEFAULT_GROUP_SETTINGS.text_compare;
  const rpm = parsePositiveInteger(process.env[preset.rpmEnv], preset.rpm, 1, 10000);
  const maxConcurrent = parsePositiveInteger(
    process.env[preset.concurrencyEnv],
    preset.maxConcurrent,
    1,
    20
  );
  return {
    groupName,
    rpm,
    intervalMs: Math.max(1, Math.ceil(60000 / rpm)),
    maxConcurrent,
    maxSize: getGlobalQueueMaxSize(),
    pendingTimeoutMs: getGlobalPendingTimeoutMs(),
    retryMax: getGroupRetryMax(groupName),
    retryBaseDelayMs: getGroupRetryBaseDelayMs(groupName),
    retryMaxDelayMs: getRetryMaxDelayMs(),
  };
}

function createQueueOverflowError(groupName, settings) {
  const error = new Error("后端 AI 任务队列已满，请稍后重试。");
  error.code = "provider-queue-full";
  error.statusCode = 503;
  error.groupName = groupName;
  error.queue = {
    groupName,
    maxSize: settings.maxSize,
  };
  return error;
}

function formatDurationLabel(durationMs) {
  const safeDurationMs = Math.max(0, Number(durationMs) || 0);
  if (safeDurationMs >= 1000 && safeDurationMs % 1000 === 0) {
    return String(Math.floor(safeDurationMs / 1000)) + "s";
  }
  if (safeDurationMs >= 1000) {
    return (safeDurationMs / 1000).toFixed(1).replace(/\.0$/, "") + "s";
  }
  return String(safeDurationMs) + "ms";
}

function createQueuePendingTimeoutError(groupName, settings, item) {
  const pendingTimeoutMs = Math.max(1, Number(settings?.pendingTimeoutMs) || 0);
  const error = new Error(
    "排队超过" + formatDurationLabel(pendingTimeoutMs) + "未开始执行，任务已失败。"
  );
  error.code = "provider-queue-pending-timeout";
  error.statusCode = 504;
  error.groupName = groupName;
  error.queue = {
    groupName,
    maxSize: Number(settings?.maxSize || 0) || DEFAULT_QUEUE_MAX_SIZE,
    pendingTimeoutMs,
  };
  error.queueMeta = {
    groupName,
    queueWaitMs: Math.max(0, Date.now() - Number(item?.enqueuedAt || 0)),
    retryCount: 0,
    retryDelaysMs: [],
    queuedAt: Number(item?.enqueuedAt || 0),
    startedAt: 0,
    activeCount: 0,
    maxConcurrent: Number(settings?.maxConcurrent || 0) || 0,
  };
  return error;
}

function createBackoffDelayMs(attemptIndex, settings) {
  const baseDelayMs = Math.min(
    settings.retryMaxDelayMs,
    settings.retryBaseDelayMs * Math.pow(2, attemptIndex)
  );
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.max(100, Math.round(baseDelayMs * jitter));
}

class ProviderQueue {
  constructor(groupName, options) {
    this.groupName = groupName;
    this.options = options && typeof options === "object" ? options : {};
    this.items = [];
    this.activeCount = 0;
    this.scheduled = false;
    this.nextAvailableAt = 0;
    this.stats = {
      enqueuedCount: 0,
      completedCount: 0,
      failedCount: 0,
      retriedCount: 0,
      overflowCount: 0,
      abortedCount: 0,
      pendingTimeoutCount: 0,
      lastStartedAt: 0,
      lastFinishedAt: 0,
    };
  }

  getSettings() {
    if (typeof this.options.getSettings === "function") {
      return this.options.getSettings(this.groupName);
    }
    return getGroupSettings(this.groupName);
  }

  getSnapshot() {
    const settings = this.getSettings();
    return {
      groupName: this.groupName,
      rpm: settings.rpm,
      intervalMs: settings.intervalMs,
      maxSize: settings.maxSize,
      pendingTimeoutMs: settings.pendingTimeoutMs,
      retryMax: settings.retryMax,
      pendingCount: this.items.length,
      activeCount: this.activeCount,
      maxConcurrent: settings.maxConcurrent,
      processing: this.activeCount > 0,
      nextAvailableAt: this.nextAvailableAt || 0,
      stats: Object.assign({}, this.stats),
    };
  }

  enqueue(task, options) {
    const settings = this.getSettings();
    const signal = options?.signal;
    if (isAbortSignalAborted(signal)) {
      return Promise.reject(createQueueAbortError(signal));
    }
    if (this.items.length >= settings.maxSize) {
      this.stats.overflowCount += 1;
      return Promise.reject(createQueueOverflowError(this.groupName, settings));
    }
    const queue = this;
    return new Promise(function (resolve, reject) {
      const item = {
        task,
        options: options || {},
        resolve,
        reject,
        enqueuedAt: Date.now(),
        signal,
        started: false,
        abortHandler: null,
        pendingTimeoutTimer: null,
      };
      if (settings.pendingTimeoutMs > 0) {
        item.pendingTimeoutTimer = setTimeout(function () {
          if (item.started) {
            return;
          }
          const index = queue.items.indexOf(item);
          if (index < 0) {
            return;
          }
          queue.items.splice(index, 1);
          queue.clearPendingItem(item);
          queue.stats.failedCount += 1;
          queue.stats.pendingTimeoutCount += 1;
          reject(createQueuePendingTimeoutError(queue.groupName, settings, item));
          queue.schedule();
        }, Math.max(1, Number(settings.pendingTimeoutMs) || DEFAULT_MODEL_QUEUE_PENDING_TIMEOUT_MS));
      }
      if (signal && typeof signal.addEventListener === "function") {
        item.abortHandler = function () {
          if (item.started) {
            return;
          }
          const index = queue.items.indexOf(item);
          if (index >= 0) {
            queue.items.splice(index, 1);
          }
          queue.clearPendingItem(item);
          queue.stats.abortedCount += 1;
          reject(createQueueAbortError(signal));
          queue.schedule();
        };
        signal.addEventListener("abort", item.abortHandler, { once: true });
      }
      queue.items.push(item);
      queue.stats.enqueuedCount += 1;
      queue.schedule();
    });
  }

  schedule() {
    if (this.scheduled) {
      return;
    }
    this.scheduled = true;
    const queue = this;
    setTimeout(function () {
      queue.scheduled = false;
      void queue.processLoop();
    }, 0);
  }

  async processLoop() {
    const settings = this.getSettings();
    while (this.items.length > 0 && this.activeCount < settings.maxConcurrent) {
      const waitBeforeStartMs = Math.max(0, this.nextAvailableAt - Date.now());
      if (waitBeforeStartMs > 0) {
        setTimeout(this.schedule.bind(this), waitBeforeStartMs);
        return;
      }

      const item = this.items.shift();
      if (!item) {
        return;
      }
      this.clearPendingItem(item);
      if (isAbortSignalAborted(item.signal)) {
        this.stats.abortedCount += 1;
        item.reject(createQueueAbortError(item.signal));
        continue;
      }
      item.started = true;
      this.startItem(item, settings);
    }
  }

  startItem(item, settings) {
    const queueStartedAt = Date.now();
    this.stats.lastStartedAt = queueStartedAt;
    this.activeCount += 1;
    this.nextAvailableAt = queueStartedAt + settings.intervalMs;
    const queueMeta = {
      groupName: this.groupName,
      queueWaitMs: Math.max(0, queueStartedAt - item.enqueuedAt),
      retryCount: 0,
      retryDelaysMs: [],
      queuedAt: item.enqueuedAt,
      startedAt: queueStartedAt,
      activeCount: this.activeCount,
      maxConcurrent: settings.maxConcurrent,
    };
    console.info("[AIQueue] start", {
      groupName: this.groupName,
      activeCount: this.activeCount,
      maxConcurrent: settings.maxConcurrent,
      pendingCount: this.items.length,
      queueWaitMs: queueMeta.queueWaitMs,
    });

    const queue = this;
    (async function () {
      try {
        const value = await queue.executeWithRetry(
          item.task,
          settings,
          queueMeta,
          item.signal,
          item.options
        );
        queueMeta.finishedAt = Date.now();
        queueMeta.durationMs = Math.max(0, queueMeta.finishedAt - queueStartedAt);
        queue.stats.completedCount += 1;
        item.resolve({ value, queueMeta });
      } catch (error) {
        queueMeta.finishedAt = Date.now();
        queueMeta.durationMs = Math.max(0, queueMeta.finishedAt - queueStartedAt);
        if (error?.code === "ai-job-timeout" || error?.code === "aborted") {
          queue.stats.abortedCount += 1;
        } else {
          queue.stats.failedCount += 1;
        }
        error.queueMeta = Object.assign({}, queueMeta);
        item.reject(error);
      } finally {
        queue.stats.lastFinishedAt = Date.now();
        queue.activeCount = Math.max(0, queue.activeCount - 1);
        console.info("[AIQueue] finish", {
          groupName: queue.groupName,
          activeCount: queue.activeCount,
          maxConcurrent: settings.maxConcurrent,
          durationMs: Math.max(0, Number(queueMeta.durationMs) || 0),
          retryCount: Math.max(0, Number(queueMeta.retryCount) || 0),
        });
        queue.schedule();
      }
    })();
    this.schedule();
  }

  async executeWithRetry(task, settings, queueMeta, signal, options) {
    let lastError = null;
    for (let attempt = 0; attempt <= settings.retryMax; attempt += 1) {
      if (isAbortSignalAborted(signal)) {
        throw createQueueAbortError(signal);
      }
      try {
        return await task();
      } catch (error) {
        if (error?.code === "ai-job-timeout" || error?.code === "aborted") {
          throw error;
        }
        lastError = error;
        if (!isProviderRateLimitedError(error) || attempt >= settings.retryMax) {
          break;
        }
        const retryDelayMs = createBackoffDelayMs(attempt, settings);
        queueMeta.retryCount += 1;
        queueMeta.retryDelaysMs.push(retryDelayMs);
        this.stats.retriedCount += 1;
        if (typeof options?.onRetry === "function") {
          try {
            options.onRetry({
              attemptIndex: attempt + 1,
              delayMs: retryDelayMs,
              error,
              groupName: this.groupName,
            });
          } catch (callbackError) {
            console.warn("[AIQueue] retry hook failed", String(callbackError?.message || callbackError));
          }
        }
        await delay(retryDelayMs, signal);
      }
    }
    if (isProviderRateLimitedError(lastError)) {
      if (
        lastError.code === "provider-rate-limited" ||
        lastError.code === "qwen-burst-rate-limited"
      ) {
        throw lastError;
      }
      const rateLimitError = createRateLimitError(lastError.summary || lastError.message || "", {
        code: "provider-rate-limited",
        message: "上游模型限流，后端已重试仍失败，请稍后重试。",
        providerCode: String(lastError.providerCode || "").trim(),
        providerStatus: Number(lastError.providerStatus || lastError.statusCode) || 429,
      });
      if (lastError.debugRawAiResponse) {
        rateLimitError.debugRawAiResponse = lastError.debugRawAiResponse;
      }
      if (lastError.debugId) {
        rateLimitError.debugId = lastError.debugId;
        rateLimitError.hasRawAiDebug = lastError.hasRawAiDebug === true;
        rateLimitError.rawAiDebug = lastError.rawAiDebug || null;
      }
      throw rateLimitError;
    }
    throw lastError;
  }

  clearPendingItem(item) {
    if (!item || typeof item !== "object") {
      return;
    }
    if (item.pendingTimeoutTimer) {
      clearTimeout(item.pendingTimeoutTimer);
      item.pendingTimeoutTimer = null;
    }
    if (item.abortHandler && item.signal && typeof item.signal.removeEventListener === "function") {
      item.signal.removeEventListener("abort", item.abortHandler);
    }
    item.abortHandler = null;
  }
}

function getOrCreateQueue(groupName) {
  const key = isModelQueueKey(groupName)
    ? buildModelQueueKey(String(groupName || "").replace(/^model:/i, ""))
    : String(groupName || "text_compare");
  if (!queueRegistry.has(key)) {
    queueRegistry.set(key, new ProviderQueue(key));
  }
  return queueRegistry.get(key);
}

async function enqueueProviderTask(groupName, task, options) {
  return getOrCreateQueue(groupName).enqueue(task, options || {});
}

function getQueueSnapshots() {
  const keys = queueRegistry.size > 0
    ? Array.from(queueRegistry.keys())
    : Object.keys(DEFAULT_GROUP_SETTINGS);
  return keys.map(function (groupName) {
    return getOrCreateQueue(groupName).getSnapshot();
  });
}

module.exports = {
  DEFAULT_GROUP_SETTINGS,
  buildModelQueueKey,
  createQueueOverflowError,
  enqueueProviderTask,
  getGroupSettings,
  getModelQueuePolicy,
  getQueueSnapshots,
  getGlobalQueueMaxSize,
  getGlobalPendingTimeoutMs,
  getGlobalRetryMax,
  __private__: {
    ProviderQueue,
    createQueuePendingTimeoutError,
  },
};
