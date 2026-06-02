"use strict";

const { ADMIN_SESSION_TTL_SECONDS, getAdminAuthConfig, isAdminAuthConfigured } = require("../admin-auth");
const { buildAsyncJobRuntimeMeta } = require("../ai-framework/runtime/ai-runtime-meta");
const { listAiCallLogDatasets } = require("../ai-call-log-download/routes");
const { listProjectDataDownloadDatasets } = require("../project-data-download/routes");

const SCRIPT_DOWNLOAD_CENTER_URL = "https://script.xiangtianzhen.store/downloads/";

function normalizeText(value) {
  return String(value || "").trim();
}

function toPoolDisplayName(groupName) {
  const text = normalizeText(groupName);
  return text.indexOf("model:") === 0 ? text.slice("model:".length) : text;
}

function normalizeRuntime(runtime) {
  const source = runtime && typeof runtime === "object" ? runtime : {};
  const queue = source.queue && typeof source.queue === "object" ? source.queue : {};
  const activePools = Array.isArray(queue.activePools) ? queue.activePools : [];
  return {
    jobs: source.jobs && typeof source.jobs === "object" ? source.jobs : {},
    queue: {
      keyStrategy: normalizeText(queue.keyStrategy) || "concrete-model-name",
      defaultModelPool:
        queue.defaultModelPool && typeof queue.defaultModelPool === "object"
          ? queue.defaultModelPool
          : {},
      activePools: activePools
        .map(function mapPool(pool) {
          const activeCount = Number(pool.activeCount || 0) || 0;
          const pendingCount = Number(pool.pendingCount || 0) || 0;
          const capacity = Number(pool.totalCapacity || pool.maxConcurrent || 0) || 0;
          const usedCount = Number(pool.usedCount || activeCount + pendingCount) || 0;
          const availableCount = Math.max(
            0,
            Number(pool.availableCount || capacity - usedCount) || 0
          );
          return Object.assign({}, pool, {
            displayName: toPoolDisplayName(pool.groupName),
            capacity,
            usedCount,
            availableCount,
            isFull: pool.isFull === true || (capacity > 0 && usedCount >= capacity),
            utilizationPercent:
              capacity > 0
                ? Math.round((usedCount / capacity) * 100)
                : 0,
          });
        })
        .sort(function sortPools(left, right) {
          if (Number(left.activeCount || 0) !== Number(right.activeCount || 0)) {
            return Number(right.activeCount || 0) - Number(left.activeCount || 0);
          }
          return String(left.displayName || "").localeCompare(String(right.displayName || ""));
        }),
    },
  };
}

function buildAdminDashboardOverview(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    success: true,
    data: {
      generatedAt: normalizeText(source.now) || new Date().toISOString(),
      backend: {
        service: "platform-resources-backend",
        status: source.adminAuthConfigured === false ? "auth-not-configured" : "ready",
        adminAuthConfigured: source.adminAuthConfigured !== false,
        sessionTtlSeconds:
          Number.isFinite(Number(source.sessionTtlSeconds)) && Number(source.sessionTtlSeconds) > 0
            ? Math.floor(Number(source.sessionTtlSeconds))
            : ADMIN_SESSION_TTL_SECONDS,
      },
      runtime: normalizeRuntime(source.runtime),
      downloads: Object.assign(
        {
          scriptCenterUrl: SCRIPT_DOWNLOAD_CENTER_URL,
          projectDataDatasets: [],
          aiCallLogDatasets: [],
        },
        source.downloads && typeof source.downloads === "object" ? source.downloads : {}
      ),
    },
  };
}

function createLiveAdminDashboardOverview(options) {
  const config = options && typeof options === "object" ? options : {};
  return buildAdminDashboardOverview({
    now: new Date().toISOString(),
    adminAuthConfigured: isAdminAuthConfigured(getAdminAuthConfig()),
    sessionTtlSeconds: ADMIN_SESSION_TTL_SECONDS,
    runtime: buildAsyncJobRuntimeMeta({
      includeQueueSnapshots: true,
    }),
    downloads: {
      scriptCenterUrl: SCRIPT_DOWNLOAD_CENTER_URL,
      projectDataDatasets: listProjectDataDownloadDatasets(config.projectDataDownload || {}),
      aiCallLogDatasets: listAiCallLogDatasets(config.aiCallLogDownload || {}),
    },
  });
}

module.exports = {
  buildAdminDashboardOverview,
  createLiveAdminDashboardOverview,
};
