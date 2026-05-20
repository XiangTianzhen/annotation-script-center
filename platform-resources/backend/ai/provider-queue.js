"use strict";

const {
  createRateLimitError,
  isProviderRateLimitedError,
  normalizeAbortError,
} = require("./errors");

const DEFAULT_QUEUE_MAX_SIZE = 600;
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1200;
const DEFAULT_RETRY_MAX_DELAY_MS = 12000;
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

function getGlobalQueueMaxSize() {
  return parsePositiveInteger(process.env.DATABAKER_AI_QUEUE_MAX_SIZE, DEFAULT_QUEUE_MAX_SIZE, 1, 5000);
}

function getGlobalRetryMax() {
  return parsePositiveInteger(process.env.DATABAKER_AI_PROVIDER_RETRY_MAX, DEFAULT_RETRY_MAX, 0, 10);
}

function getRetryBaseDelayMs() {
  return parsePositiveInteger(
    process.env.DATABAKER_AI_PROVIDER_RETRY_BASE_DELAY_MS,
    DEFAULT_RETRY_BASE_DELAY_MS,
    100,
    60000
  );
}

function getRetryMaxDelayMs() {
  return parsePositiveInteger(
    process.env.DATABAKER_AI_PROVIDER_RETRY_MAX_DELAY_MS,
    DEFAULT_RETRY_MAX_DELAY_MS,
    100,
    120000
  );
}

function getGroupSettings(groupName) {
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
    retryMax: getGlobalRetryMax(),
    retryBaseDelayMs: getRetryBaseDelayMs(),
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

function createBackoffDelayMs(attemptIndex, settings) {
  const baseDelayMs = Math.min(
    settings.retryMaxDelayMs,
    settings.retryBaseDelayMs * Math.pow(2, attemptIndex)
  );
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.max(100, Math.round(baseDelayMs * jitter));
}

class ProviderQueue {
  constructor(groupName) {
    this.groupName = groupName;
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
      lastStartedAt: 0,
      lastFinishedAt: 0,
    };
  }

  getSettings() {
    return getGroupSettings(this.groupName);
  }

  getSnapshot() {
    const settings = this.getSettings();
    return {
      groupName: this.groupName,
      rpm: settings.rpm,
      intervalMs: settings.intervalMs,
      maxSize: settings.maxSize,
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
        resolve,
        reject,
        enqueuedAt: Date.now(),
        signal,
        started: false,
        abortHandler: null,
      };
      if (signal && typeof signal.addEventListener === "function") {
        item.abortHandler = function () {
          if (item.started) {
            return;
          }
          const index = queue.items.indexOf(item);
          if (index >= 0) {
            queue.items.splice(index, 1);
          }
          queue.stats.abortedCount += 1;
          reject(createQueueAbortError(signal));
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
      if (item.abortHandler && item.signal && typeof item.signal.removeEventListener === "function") {
        item.signal.removeEventListener("abort", item.abortHandler);
      }
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
        const value = await queue.executeWithRetry(item.task, settings, queueMeta, item.signal);
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

  async executeWithRetry(task, settings, queueMeta, signal) {
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
        await delay(retryDelayMs, signal);
      }
    }
    if (isProviderRateLimitedError(lastError)) {
      throw createRateLimitError(lastError.summary || lastError.message || "");
    }
    throw lastError;
  }
}

function getOrCreateQueue(groupName) {
  const key = String(groupName || "text_compare");
  if (!queueRegistry.has(key)) {
    queueRegistry.set(key, new ProviderQueue(key));
  }
  return queueRegistry.get(key);
}

async function enqueueProviderTask(groupName, task, options) {
  return getOrCreateQueue(groupName).enqueue(task, options || {});
}

function getQueueSnapshots() {
  return Object.keys(DEFAULT_GROUP_SETTINGS).map(function (groupName) {
    return getOrCreateQueue(groupName).getSnapshot();
  });
}

module.exports = {
  DEFAULT_GROUP_SETTINGS,
  createQueueOverflowError,
  enqueueProviderTask,
  getGroupSettings,
  getQueueSnapshots,
  getGlobalQueueMaxSize,
  getGlobalRetryMax,
};
