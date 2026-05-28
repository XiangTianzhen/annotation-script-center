"use strict";

const {
  isProviderRateLimitedError,
  normalizeAbortError,
} = require("../../../backend/ai/errors");
const { getQueueGroupSettings } = require("./config");

const queueRegistry = new Map();

function isAbortSignalAborted(signal) {
  return Boolean(signal && signal.aborted === true);
}

function createQueueAbortError(signal) {
  return normalizeAbortError(signal?.reason, "当前同步请求已取消。", "aborted", 504);
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

function createQueueOverflowError(groupName, settings) {
  const error = new Error("Aishell AI 队列已满，请稍后重试。");
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
    return getQueueGroupSettings(this.groupName);
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
        if (error?.code === "aborted" || error?.code === "client-disconnected") {
          queue.stats.abortedCount += 1;
        } else {
          queue.stats.failedCount += 1;
        }
        error.queueMeta = Object.assign({}, queueMeta);
        item.reject(error);
      } finally {
        queue.stats.lastFinishedAt = Date.now();
        queue.activeCount = Math.max(0, queue.activeCount - 1);
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
        lastError = error;
        if (!isProviderRateLimitedError(error) || attempt >= settings.retryMax) {
          throw error;
        }
        queueMeta.retryCount += 1;
        this.stats.retriedCount += 1;
        const delayMs = createBackoffDelayMs(attempt, settings);
        queueMeta.retryDelaysMs.push(delayMs);
        await delay(delayMs, signal);
      }
    }
    throw lastError || new Error("Aishell provider queue execute failed.");
  }
}

function getQueue(groupName) {
  const name = String(groupName || "").trim() || "aishell_text_compare";
  if (!queueRegistry.has(name)) {
    queueRegistry.set(name, new ProviderQueue(name));
  }
  return queueRegistry.get(name);
}

function enqueueTask(groupName, task, options) {
  return getQueue(groupName).enqueue(task, options);
}

function getQueueSnapshots() {
  return Array.from(queueRegistry.values()).map(function (queue) {
    return queue.getSnapshot();
  });
}

module.exports = {
  enqueueTask,
  getQueue,
  getQueueSnapshots,
};
