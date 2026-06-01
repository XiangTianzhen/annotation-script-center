"use strict";

const { ADMIN_SESSION_TTL_SECONDS, getAdminAuthConfig, isAdminAuthConfigured } = require("../admin-auth");
const { buildAsyncJobRuntimeMeta } = require("../ai-framework/runtime/ai-runtime-meta");
const { listAiCallLogDatasets } = require("../ai-call-log-download/routes");
const { listProjectDataDownloadDatasets } = require("../project-data-download/routes");

const { aiCallLogger: dataBakerLogger } = require("../../data-baker/round-one-quality/backend/ai-call-log");
const { aiCallLogger: aishellLogger } = require("../../aishell-tech/minnan-helper/data/ai-call-log");
const { aiCallLogger: magicDataHakkaLogger } = require("../../magic-data/hakka-helper/backend/ai-call-log");
const { aiCallLogger: magicDataMinnanLogger } = require("../../magic-data/minnan-helper/backend/ai-call-log");
const { aiCallLogger: asrJudgementLogger } = require("../../alibaba-labelx/asr-judgement/backend/ai-call-log");
const { aiCallLogger: asrTranscriptionLogger } = require("../../alibaba-labelx/asr-transcription/backend/ai-call-log");
const { aiCallLogger: abakaTask21Logger } = require("../../abaka-ai/task21/backend/ai-call-log");

const SCRIPT_DOWNLOAD_CENTER_URL = "https://script.xiangtianzhen.store/downloads/";
const DASHBOARD_STATS_WINDOW_DAYS = 14;

const SCRIPT_SUMMARY_DEFINITIONS = [
  {
    id: "dataBakerRoundOneQuality",
    label: "标贝易采一检质检",
    service: "data-baker-round-one-quality-ai-recommend",
    logger: dataBakerLogger,
  },
  {
    id: "aishellTechMinnanAssistant",
    label: "希尔贝壳闽南语助手",
    service: "aishell-tech-minnan-helper-ai-recommend",
    logger: aishellLogger,
  },
  {
    id: "magicDataAnnotatorAiReview",
    label: "Magic Data 客家话助手",
    service: "magic-data-hakka-helper-ai-review-current",
    logger: magicDataHakkaLogger,
  },
  {
    id: "magicDataMinnanAssistant",
    label: "Magic Data 闽南语助手",
    service: "magic-data-minnan-helper-ai-review-current",
    logger: magicDataMinnanLogger,
  },
  {
    id: "judgement",
    label: "阿里ASR语音判别",
    service: "alibaba-labelx-asr-judgement-ai-suggest",
    logger: asrJudgementLogger,
  },
  {
    id: "transcription",
    label: "阿里ASR语音转写",
    service: "alibaba-labelx-asr-transcription-ai-suggest-current",
    logger: asrTranscriptionLogger,
  },
  {
    id: "abakaAiTaskPageCapture",
    label: "Task21助手",
    service: "abaka-ai-task21-ai-analysis",
    logger: abakaTask21Logger,
  },
];

function normalizeText(value) {
  return String(value || "").trim();
}

function createTotals(seed) {
  return Object.assign(
    {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    seed || {}
  );
}

function mergeTotals(target, source) {
  const bucket = target;
  const input = source && typeof source === "object" ? source : {};
  bucket.totalCalls += Number(input.totalCalls || 0) || 0;
  bucket.successCalls += Number(input.successCalls || 0) || 0;
  bucket.failedCalls += Number(input.failedCalls || 0) || 0;
  bucket.promptTokens += Number(input.promptTokens || 0) || 0;
  bucket.completionTokens += Number(input.completionTokens || 0) || 0;
  bucket.totalTokens += Number(input.totalTokens || 0) || 0;
  return bucket;
}

function mergeBucketList(map, items, keyName) {
  (Array.isArray(items) ? items : []).forEach(function mergeItem(item) {
    const key = normalizeText(item && item[keyName]);
    if (!key) {
      return;
    }
    if (!map.has(key)) {
      const seed = {};
      seed[keyName] = key;
      map.set(key, createTotals(seed));
    }
    mergeTotals(map.get(key), item);
  });
}

function toSortedBucketArray(map, keyName) {
  return Array.from(map.values())
    .sort(function sortBuckets(left, right) {
      if (Number(left.totalCalls || 0) !== Number(right.totalCalls || 0)) {
        return Number(right.totalCalls || 0) - Number(left.totalCalls || 0);
      }
      return String(left[keyName] || "").localeCompare(String(right[keyName] || ""));
    })
    .map(function cloneBucket(item) {
      return Object.assign({}, item);
    });
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
          const maxConcurrent = Number(pool.maxConcurrent || 0) || 0;
          const activeCount = Number(pool.activeCount || 0) || 0;
          return Object.assign({}, pool, {
            displayName: toPoolDisplayName(pool.groupName),
            utilizationPercent:
              maxConcurrent > 0
                ? Math.round((activeCount / maxConcurrent) * 100)
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
  const runtime = normalizeRuntime(source.runtime);
  const scriptSummaries = Array.isArray(source.scriptSummaries) ? source.scriptSummaries : [];
  const statsWindow =
    source.statsWindow && typeof source.statsWindow === "object"
      ? source.statsWindow
      : buildDashboardStatsWindow(new Date());
  const todayTotals = createTotals();
  const allTimeTotals = createTotals();
  const byDateMap = new Map();
  const byOperatorMap = new Map();
  const failureMap = new Map();

  const normalizedScripts = scriptSummaries.map(function mapSummary(item) {
    const today = item?.today && typeof item.today === "object" ? item.today : {};
    const allTime = item?.allTime && typeof item.allTime === "object" ? item.allTime : {};
    mergeTotals(todayTotals, today.totals || {});
    mergeTotals(allTimeTotals, allTime.totals || {});
    mergeBucketList(byDateMap, allTime.byDate, "date");
    mergeBucketList(byOperatorMap, allTime.byOperator, "aiUsageOperatorName");
    (Array.isArray(today.byErrorCode) ? today.byErrorCode : []).forEach(function mergeError(row) {
      const errorCode = normalizeText(row?.errorCode);
      if (!errorCode) {
        return;
      }
      failureMap.set(
        errorCode,
        (Number(failureMap.get(errorCode) || 0) || 0) + (Number(row.totalCalls || 0) || 0)
      );
    });

    return {
      id: normalizeText(item?.id),
      label: normalizeText(item?.label),
      service: normalizeText(item?.service),
      today: today,
      allTime: allTime,
    };
  });

  const failures = Array.from(failureMap.entries())
    .map(function toFailure(entry) {
      return {
        errorCode: entry[0],
        totalCalls: entry[1],
      };
    })
    .sort(function sortFailure(left, right) {
      if (right.totalCalls !== left.totalCalls) {
        return right.totalCalls - left.totalCalls;
      }
      return left.errorCode.localeCompare(right.errorCode);
    });

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
      runtime,
      downloads: Object.assign(
        {
          scriptCenterUrl: SCRIPT_DOWNLOAD_CENTER_URL,
          projectDataDatasets: [],
          aiCallLogDatasets: [],
        },
        source.downloads && typeof source.downloads === "object" ? source.downloads : {}
      ),
      stats: {
        window: {
          days: Number(statsWindow.days || DASHBOARD_STATS_WINDOW_DAYS) || DASHBOARD_STATS_WINDOW_DAYS,
          label: normalizeText(statsWindow.label) || "最近" + String(DASHBOARD_STATS_WINDOW_DAYS) + "天",
          from: normalizeText(statsWindow.from),
          to: normalizeText(statsWindow.to),
        },
        today: todayTotals,
        allTime: allTimeTotals,
        byDate: toSortedBucketArray(byDateMap, "date"),
        byOperator: toSortedBucketArray(byOperatorMap, "aiUsageOperatorName"),
        failures,
        scripts: normalizedScripts,
      },
    },
  };
}

function formatLocalDate(now) {
  const date = now instanceof Date ? now : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return yyyy + "-" + mm + "-" + dd;
}

function shiftDate(date, offsetDays) {
  const next = new Date(date instanceof Date ? date.getTime() : Date.now());
  next.setDate(next.getDate() + (Number(offsetDays || 0) || 0));
  return next;
}

function buildDashboardStatsWindow(now) {
  const current = now instanceof Date ? now : new Date();
  const to = formatLocalDate(current);
  const from = formatLocalDate(shiftDate(current, -(DASHBOARD_STATS_WINDOW_DAYS - 1)));
  return {
    days: DASHBOARD_STATS_WINDOW_DAYS,
    label: "最近" + String(DASHBOARD_STATS_WINDOW_DAYS) + "天",
    from,
    to,
  };
}

function buildScriptSummariesForDashboard(dateText, statsWindow) {
  const windowRange = statsWindow && typeof statsWindow === "object" ? statsWindow : {};
  return SCRIPT_SUMMARY_DEFINITIONS.map(function mapDefinition(definition) {
    const windowSummary = definition.logger.summarize({
      from: windowRange.from,
      to: windowRange.to,
    });
    return {
      id: definition.id,
      label: definition.label,
      service: definition.service,
      today: definition.logger.summarize({
        from: dateText,
        to: dateText,
      }),
      allTime: windowSummary,
    };
  });
}

function createLiveAdminDashboardOverview(options) {
  const config = options && typeof options === "object" ? options : {};
  const now = new Date();
  const today = formatLocalDate(now);
  const statsWindow = buildDashboardStatsWindow(now);
  return buildAdminDashboardOverview({
    now: now.toISOString(),
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
    statsWindow,
    scriptSummaries: buildScriptSummariesForDashboard(today, statsWindow),
  });
}

module.exports = {
  buildAdminDashboardOverview,
  createLiveAdminDashboardOverview,
};
