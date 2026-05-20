"use strict";

const crypto = require("crypto");

const DEFAULT_JOB_TTL_MS = 120000;
const DEFAULT_JOB_MAX_SIZE = 1000;
const DEFAULT_JOB_POLL_INTERVAL_MS = 1000;

function parseIntegerInRange(value, fallback, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, number));
}

function isAiJobsEnabled() {
  return String(process.env.DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED || "1").trim() !== "0";
}

function getAiJobStoreConfig() {
  return {
    enabled: isAiJobsEnabled(),
    ttlMs: parseIntegerInRange(
      process.env.DATABAKER_AI_JOB_TTL_MS,
      DEFAULT_JOB_TTL_MS,
      10000,
      24 * 60 * 60 * 1000
    ),
    maxSize: parseIntegerInRange(
      process.env.DATABAKER_AI_JOB_MAX_SIZE,
      DEFAULT_JOB_MAX_SIZE,
      1,
      10000
    ),
    pollIntervalMs: parseIntegerInRange(
      process.env.DATABAKER_AI_JOB_POLL_INTERVAL_MS,
      DEFAULT_JOB_POLL_INTERVAL_MS,
      200,
      10000
    ),
  };
}

function createStoreFullError() {
  const error = new Error("后端异步任务池已满，请稍后重试。");
  error.code = "ai-job-store-full";
  error.statusCode = 503;
  return error;
}

function createJobNotFoundError() {
  const error = new Error("后端任务不存在或已过期，请重试。");
  error.code = "ai-job-not-found";
  error.statusCode = 404;
  return error;
}

function createJobsDisabledError() {
  const error = new Error("当前后端未启用 Fun-ASR 异步任务接口。");
  error.code = "ai-jobs-disabled";
  error.statusCode = 503;
  return error;
}

function cloneJob(job) {
  return JSON.parse(JSON.stringify(job || null));
}

class DataBakerAiJobStore {
  constructor() {
    this.jobs = new Map();
  }

  getConfig() {
    return getAiJobStoreConfig();
  }

  cleanupExpired(now) {
    const currentTime = Number(now) || Date.now();
    const ttlMs = this.getConfig().ttlMs;
    const expiredJobIds = [];
    this.jobs.forEach(function (job, jobId) {
      if (!job || !job.updatedAt) {
        expiredJobIds.push(jobId);
        return;
      }
      if (currentTime - Number(job.updatedAt) > ttlMs) {
        expiredJobIds.push(jobId);
      }
    });
    expiredJobIds.forEach(
      function (jobId) {
        this.jobs.delete(jobId);
      }.bind(this)
    );
  }

  ensureCapacity() {
    this.cleanupExpired(Date.now());
    const config = this.getConfig();
    if (this.jobs.size < config.maxSize) {
      return;
    }
    const sortedJobs = Array.from(this.jobs.values()).sort(function (left, right) {
      return Number(left?.updatedAt || 0) - Number(right?.updatedAt || 0);
    });
    while (this.jobs.size >= config.maxSize && sortedJobs.length > 0) {
      const oldest = sortedJobs.shift();
      if (!oldest?.jobId) {
        continue;
      }
      this.jobs.delete(oldest.jobId);
    }
    if (this.jobs.size >= config.maxSize) {
      throw createStoreFullError();
    }
  }

  createJob(meta) {
    const config = this.getConfig();
    if (!config.enabled) {
      throw createJobsDisabledError();
    }
    this.ensureCapacity();
    const currentTime = Date.now();
    const source = meta && typeof meta === "object" ? meta : {};
    const jobId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");
    const job = {
      jobId,
      requestId: String(source.requestId || "").trim(),
      status: "pending",
      createdAt: currentTime,
      updatedAt: currentTime,
      startedAt: 0,
      finishedAt: 0,
      itemId: String(source.itemId || "").trim(),
      textId: String(source.textId || "").trim(),
      sentenceNumber: Number(source.sentenceNumber) || 0,
      result: null,
      errorCode: "",
      errorMessage: "",
      providerStatus: 0,
      runtime: null,
    };
    this.jobs.set(jobId, job);
    return cloneJob(job);
  }

  getJob(jobId) {
    this.cleanupExpired(Date.now());
    const normalizedJobId = String(jobId || "").trim();
    const job = this.jobs.get(normalizedJobId);
    if (!job) {
      throw createJobNotFoundError();
    }
    return cloneJob(job);
  }

  updateJob(jobId, updater) {
    const normalizedJobId = String(jobId || "").trim();
    const job = this.jobs.get(normalizedJobId);
    if (!job) {
      throw createJobNotFoundError();
    }
    updater(job);
    job.updatedAt = Date.now();
    this.jobs.set(normalizedJobId, job);
    return cloneJob(job);
  }

  markRunning(jobId) {
    return this.updateJob(jobId, function (job) {
      if (!job.startedAt) {
        job.startedAt = Date.now();
      }
      job.status = "running";
    });
  }

  markSucceeded(jobId, data) {
    const source = data && typeof data === "object" ? data : {};
    return this.updateJob(jobId, function (job) {
      job.status = "succeeded";
      job.finishedAt = Date.now();
      job.result = source.result || null;
      job.runtime = source.runtime || null;
      job.providerStatus = Number(source.providerStatus) || 0;
      job.errorCode = "";
      job.errorMessage = "";
    });
  }

  markFailed(jobId, errorLike) {
    const source = errorLike && typeof errorLike === "object" ? errorLike : {};
    return this.updateJob(jobId, function (job) {
      job.status = "failed";
      job.finishedAt = Date.now();
      job.result = null;
      job.runtime = source.runtime || null;
      job.providerStatus = Number(source.providerStatus) || 0;
      job.errorCode = String(source.code || "").trim();
      job.errorMessage = String(source.message || "DataBaker AI recommend 失败。").trim().slice(0, 240);
    });
  }

  getSnapshot() {
    this.cleanupExpired(Date.now());
    const config = this.getConfig();
    let pendingCount = 0;
    let runningCount = 0;
    let succeededCount = 0;
    let failedCount = 0;
    this.jobs.forEach(function (job) {
      if (!job) {
        return;
      }
      if (job.status === "pending") {
        pendingCount += 1;
      } else if (job.status === "running") {
        runningCount += 1;
      } else if (job.status === "succeeded") {
        succeededCount += 1;
      } else if (job.status === "failed") {
        failedCount += 1;
      }
    });
    const activeCount = pendingCount + runningCount;
    return {
      enabled: config.enabled,
      ttlMs: config.ttlMs,
      maxSize: config.maxSize,
      pollIntervalMs: config.pollIntervalMs,
      activeCount,
      pendingCount,
      runningCount,
      succeededCount,
      failedCount,
    };
  }
}

const jobStore = new DataBakerAiJobStore();

module.exports = {
  DEFAULT_JOB_MAX_SIZE,
  DEFAULT_JOB_POLL_INTERVAL_MS,
  DEFAULT_JOB_TTL_MS,
  createJobNotFoundError,
  createJobsDisabledError,
  createStoreFullError,
  createAiRecommendJob: jobStore.createJob.bind(jobStore),
  getAiJobStoreConfig,
  getAiJobStoreSnapshot: jobStore.getSnapshot.bind(jobStore),
  getAiRecommendJob: jobStore.getJob.bind(jobStore),
  markAiRecommendJobFailed: jobStore.markFailed.bind(jobStore),
  markAiRecommendJobRunning: jobStore.markRunning.bind(jobStore),
  markAiRecommendJobSucceeded: jobStore.markSucceeded.bind(jobStore),
};
