"use strict";

const { createRateLimitError, isProviderRateLimitedError } = require("./errors");

const DEFAULT_QUEUE_MAX_SIZE = 200;
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1200;
const DEFAULT_RETRY_MAX_DELAY_MS = 12000;
const DEFAULT_GROUP_SETTINGS = {
  qwen_omni: {
    rpmEnv: "DATABAKER_AI_QWEN_OMNI_RPM_LIMIT",
    rpm: 45,
  },
  fun_asr: {
    rpmEnv: "DATABAKER_AI_FUN_ASR_RPM_LIMIT",
    rpm: 500,
  },
  text_compare: {
    rpmEnv: "DATABAKER_AI_TEXT_RPM_LIMIT",
    rpm: 500,
  },
};
const queueRegistry = new Map();

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, Math.max(0, Number(ms) || 0));
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
  return {
    groupName,
    rpm,
    intervalMs: Math.max(1, Math.ceil(60000 / rpm)),
    maxSize: getGlobalQueueMaxSize(),
    retryMax: getGlobalRetryMax(),
    retryBaseDelayMs: getRetryBaseDelayMs(),
    retryMaxDelayMs: getRetryMaxDelayMs(),
  };
}

function createQueueOverflowError(groupName, settings) {
  const error = new Error("后端 AI 排队已满，请稍后重试。");
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
    this.processing = false;
    this.nextAvailableAt = 0;
    this.stats = {
      enqueuedCount: 0,
      completedCount: 0,
      failedCount: 0,
      retriedCount: 0,
      overflowCount: 0,
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
      processing: this.processing,
      nextAvailableAt: this.nextAvailableAt || 0,
      stats: Object.assign({}, this.stats),
    };
  }

  enqueue(task) {
    const settings = this.getSettings();
    if (this.items.length >= settings.maxSize) {
      this.stats.overflowCount += 1;
      return Promise.reject(createQueueOverflowError(this.groupName, settings));
    }
    const queue = this;
    return new Promise(function (resolve, reject) {
      queue.items.push({
        task,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      });
      queue.stats.enqueuedCount += 1;
      queue.schedule();
    });
  }

  schedule() {
    if (this.processing) {
      return;
    }
    this.processing = true;
    const queue = this;
    setTimeout(function () {
      void queue.processLoop();
    }, 0);
  }

  async processLoop() {
    try {
      while (this.items.length > 0) {
        const settings = this.getSettings();
        const waitBeforeStartMs = Math.max(0, this.nextAvailableAt - Date.now());
        if (waitBeforeStartMs > 0) {
          await delay(waitBeforeStartMs);
        }

        const item = this.items.shift();
        if (!item) {
          continue;
        }

        const queueStartedAt = Date.now();
        this.stats.lastStartedAt = queueStartedAt;
        const queueMeta = {
          groupName: this.groupName,
          queueWaitMs: Math.max(0, queueStartedAt - item.enqueuedAt),
          retryCount: 0,
          retryDelaysMs: [],
          queuedAt: item.enqueuedAt,
          startedAt: queueStartedAt,
        };

        try {
          const value = await this.executeWithRetry(item.task, settings, queueMeta);
          queueMeta.finishedAt = Date.now();
          queueMeta.durationMs = Math.max(0, queueMeta.finishedAt - queueStartedAt);
          this.stats.completedCount += 1;
          item.resolve({ value, queueMeta });
        } catch (error) {
          queueMeta.finishedAt = Date.now();
          queueMeta.durationMs = Math.max(0, queueMeta.finishedAt - queueStartedAt);
          this.stats.failedCount += 1;
          error.queueMeta = Object.assign({}, queueMeta);
          item.reject(error);
        } finally {
          this.stats.lastFinishedAt = Date.now();
          this.nextAvailableAt = Date.now() + settings.intervalMs;
        }
      }
    } finally {
      this.processing = false;
      if (this.items.length > 0) {
        this.schedule();
      }
    }
  }

  async executeWithRetry(task, settings, queueMeta) {
    let lastError = null;
    for (let attempt = 0; attempt <= settings.retryMax; attempt += 1) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (!isProviderRateLimitedError(error) || attempt >= settings.retryMax) {
          break;
        }
        const retryDelayMs = createBackoffDelayMs(attempt, settings);
        queueMeta.retryCount += 1;
        queueMeta.retryDelaysMs.push(retryDelayMs);
        this.stats.retriedCount += 1;
        await delay(retryDelayMs);
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

async function enqueueProviderTask(groupName, task) {
  return getOrCreateQueue(groupName).enqueue(task);
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
