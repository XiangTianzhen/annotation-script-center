<script setup>
import { computed, onMounted } from "vue";
import AdminPageFrame from "@/components/admin/AdminPageFrame.vue";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const dashboard = computed(() => adminStore.dashboard || {});
const queuePools = computed(() => dashboard.value?.runtime?.queue?.activePools || []);
const taskStore = computed(() => dashboard.value?.runtime?.jobs || {});
const runtimeLogs = computed(() => dashboard.value?.runtimeLogs?.items || []);
const logsSummary = computed(() => dashboard.value?.logsSummary || {});
const recent24Hours = computed(() => logsSummary.value?.recent24Hours || {});
const latestFailure = computed(() => logsSummary.value?.latestFailure || null);
const runtimeLogNote = computed(() => {
  if (String(dashboard.value?.runtimeLogs?.errorMessage || "").trim()) {
    return "最近运行日志加载失败，请稍后手动刷新。";
  }
  const limit = Number(dashboard.value?.runtimeLogs?.limit || 20) || 20;
  const retentionDays = Number(logsSummary.value?.retentionDays || dashboard.value?.runtimeLogs?.retentionDays || 7) || 7;
  return `默认显示近 ${limit} 条后台运行日志，文件日志保留 ${retentionDays} 天`;
});
const logSummaryNote = computed(() => {
  const retentionDays = Number(logsSummary.value?.retentionDays || dashboard.value?.runtimeLogs?.retentionDays || 7) || 7;
  return `最近 24 小时汇总，文件日志保留 ${retentionDays} 天`;
});
const overviewStatus = computed(() => {
  if (adminStore.dashboardLoading) {
    return "正在加载系统仪表盘...";
  }
  if (adminStore.dashboardError) {
    return adminStore.dashboardError;
  }
  const generatedAt = String(dashboard.value?.generatedAt || "").trim();
  const retentionDays = Number(logsSummary.value?.retentionDays || dashboard.value?.runtimeLogs?.retentionDays || 7) || 7;
  if (generatedAt) {
    return `系统仪表盘已更新：${generatedAt}；日志保留 ${retentionDays} 天。`;
  }
  return "管理员会话有效，可直接查看仪表盘。";
});

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value || 0) || 0);
}

function formatDateTimeLabel(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(/\//g, "-");
}

function getRuntimeLogLevelText(level) {
  const normalizedLevel = String(level || "").trim().toLowerCase();
  if (normalizedLevel === "success") {
    return "成功";
  }
  if (normalizedLevel === "warn") {
    return "警告";
  }
  if (normalizedLevel === "error") {
    return "失败";
  }
  return "信息";
}

function getRuntimeLogLevelClass(level) {
  const normalizedLevel = String(level || "").trim().toLowerCase();
  if (normalizedLevel === "success") {
    return "enabled";
  }
  if (normalizedLevel === "warn") {
    return "pending";
  }
  if (normalizedLevel === "error") {
    return "disabled";
  }
  return "info";
}

const poolCards = computed(() => {
  const cards = [];
  const taskCapacity = Number(taskStore.value?.capacity || taskStore.value?.maxSize || 0) || 0;
  const taskUsedCount = Number(taskStore.value?.usedCount || 0) || 0;
  if (taskCapacity > 0 || taskUsedCount > 0) {
    const runningCount = Number(taskStore.value?.runningCount || taskStore.value?.activeCount || 0) || 0;
    const pendingCount = Number(taskStore.value?.pendingCount || 0) || 0;
    const succeededCount = Number(taskStore.value?.succeededCount || 0) || 0;
    const failedCount = Number(taskStore.value?.failedCount || 0) || 0;
    const availableCount = Math.max(
      0,
      Number(taskStore.value?.availableCount || taskCapacity - taskUsedCount) || 0
    );
    const ratio = Math.max(0, Math.min(100, Number(taskStore.value?.utilizationPercent || 0) || 0));
    const isFull = taskStore.value?.isFull === true || (taskCapacity > 0 && taskUsedCount >= taskCapacity);
    cards.push({
      id: "task-store",
      name: "AI 任务池",
      note: "短请求建 job 会先进入这里；如果返回 ai-job-store-full，说明任务池已满，不等于模型上游并发已满。",
      state: isFull ? "full" : taskUsedCount > 0 ? "busy" : "idle",
      statusText: isFull ? "任务池已满" : taskUsedCount <= 0 ? "当前空闲" : `总占用 ${ratio}%`,
      ratio,
      usedCount: taskUsedCount,
      capacity: taskCapacity,
      stats: [
        { label: "总占用", value: `${formatNumber(taskUsedCount)} 个` },
        { label: "运行中", value: `${formatNumber(runningCount)} 个` },
        { label: "待启动", value: `${formatNumber(pendingCount)} 个` },
        { label: "已保留成功", value: `${formatNumber(succeededCount)} 个` },
        { label: "已保留失败", value: `${formatNumber(failedCount)} 个` },
        { label: "池容量", value: `${formatNumber(taskCapacity)} 个` },
        { label: "剩余可接收", value: `${formatNumber(availableCount)} 个` },
      ],
    });
  }

  queuePools.value.forEach((pool) => {
    const ratio = Math.max(0, Math.min(100, Number(pool?.utilizationPercent || 0) || 0));
    const capacity = Number(pool?.capacity || pool?.totalCapacity || 0) || 0;
    const activeCount = Number(pool?.activeCount || 0) || 0;
    const pendingCount = Number(pool?.pendingCount || 0) || 0;
    const usedCount = Number(pool?.usedCount || activeCount + pendingCount) || 0;
    const availableCount = Math.max(0, Number(pool?.availableCount || capacity - usedCount) || 0);
    cards.push({
      id: pool?.id || pool?.name || pool?.label || pool?.displayName,
      name: pool?.displayName || pool?.groupName || pool?.label || pool?.name || "unknown",
      note: "总占用 = 正在调用上游 + 等待发起；后端按顺序排队，每 50ms 发起 1 个请求。",
      state: pool?.isFull ? "full" : usedCount > 0 ? "busy" : "idle",
      statusText: pool?.isFull ? "后端池已满" : usedCount <= 0 ? "当前空闲" : `总占用 ${ratio}%`,
      ratio,
      usedCount,
      capacity,
      stats: [
        { label: "总占用", value: `${formatNumber(usedCount)} 个` },
        { label: "正在调用上游", value: `${formatNumber(activeCount)} 个` },
        { label: "等待发起", value: `${formatNumber(pendingCount)} 个` },
        { label: "池容量", value: `${formatNumber(capacity)} 个` },
        { label: "剩余可接收", value: `${formatNumber(availableCount)} 个` },
      ],
    });
  });

  return cards;
});

const logSummaryCards = computed(() => [
  {
    label: "最近 24 小时成功",
    value: formatNumber(recent24Hours.value?.successCount || 0),
    note: "已写入文件的成功事件数量。",
  },
  {
    label: "最近 24 小时警告",
    value: formatNumber(recent24Hours.value?.warnCount || 0),
    note: "需要人工关注但未中断流程的事件。",
  },
  {
    label: "最近 24 小时失败",
    value: formatNumber(recent24Hours.value?.errorCount || 0),
    note: "接口失败、鉴权失败和下载失败等错误事件。",
  },
  {
    label: "最近一条失败",
    value: latestFailure.value ? getRuntimeLogLevelText(latestFailure.value?.level) : "无",
    note: latestFailure.value
      ? `${formatDateTimeLabel(latestFailure.value?.createdAt)} · ${String(latestFailure.value?.scope || "backend").trim()} · ${String(latestFailure.value?.message || "运行失败").trim()}`
      : "近 7 天内暂未记录失败或警告事件。",
    highlight: true,
  },
]);

const runtimeLogItems = computed(() =>
  runtimeLogs.value.map((item) => ({
    id: item?.id || item?.timestamp || item?.message,
    level: String(item?.level || "info").trim().toLowerCase(),
    levelText: getRuntimeLogLevelText(item?.level),
    levelClass: getRuntimeLogLevelClass(item?.level),
    scope: String(item?.scope || item?.category || "backend").trim() || "backend",
    action: String(item?.action || "").trim(),
    timestamp: formatDateTimeLabel(item?.createdAt || item?.timestamp),
    message: String(item?.message || item?.summary || "运行事件").trim() || "运行事件",
    requestId: String(item?.requestId || "").trim(),
  }))
);

async function load() {
  await adminStore.loadDashboard(settingsStore.settings || {}, authStore.session);
}

onMounted(load);
</script>

<template>
  <AdminPageFrame
    title="系统仪表盘"
    description="这里展示模型池占用、最近 24 小时日志统计和最近运行日志；页面每 60 秒自动刷新一次，也可手动刷新。"
  >
      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>模型池占用</strong>
          <span>按顺序排队，每 50ms 发起 1 个请求</span>
        </div>
        <div id="admin-overview-pools" class="pool-card-grid">
          <div v-if="poolCards.length <= 0" class="field-card">
            <strong>当前暂无活跃池</strong>
            <span>统一后端未返回活跃任务池数据。</span>
          </div>
          <article
            v-for="pool in poolCards"
            :key="pool.id"
            class="pool-card"
            :data-pool-state="pool.state"
          >
            <div class="pool-card-head">
              <div>
                <h4 class="pool-card-name">{{ pool.name }}</h4>
                <p class="pool-card-note">{{ pool.note }}</p>
              </div>
              <span class="pool-card-status">{{ pool.statusText }}</span>
            </div>
            <div class="pool-progress">
              <div class="pool-progress-bar" :style="{ width: `${pool.ratio}%` }"></div>
            </div>
            <div class="pool-progress-meta">
              <strong>{{ pool.ratio }}%</strong>
              <span>已使用 {{ pool.usedCount }} / {{ pool.capacity }}</span>
            </div>
            <div class="pool-stat-grid">
              <div v-for="stat in pool.stats" :key="stat.label" class="pool-stat">
                <span class="pool-stat-label">{{ stat.label }}</span>
                <strong>{{ stat.value }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>日志统计概况</strong>
          <span id="admin-overview-log-summary-note">{{ logSummaryNote }}</span>
        </div>
        <div id="admin-overview-log-summary" class="admin-summary-grid">
          <article
            v-for="item in logSummaryCards"
            :key="item.label"
            class="public-summary-card"
            :class="{ 'admin-log-highlight': item.highlight }"
          >
            <span class="summary-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <span class="summary-note">{{ item.note }}</span>
          </article>
        </div>
      </section>

      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>最近运行日志</strong>
          <span id="admin-overview-runtime-logs-note">{{ runtimeLogNote }}</span>
        </div>
        <div id="admin-overview-runtime-logs" class="admin-runtime-log-list">
          <div v-if="runtimeLogItems.length <= 0" class="field-card">
            <strong>暂无运行日志</strong>
            <span>当前响应未返回近期日志列表。</span>
          </div>
          <article
            v-for="item in runtimeLogItems"
            :key="item.id"
            class="admin-runtime-log-item"
            :data-log-level="item.level"
          >
            <div class="admin-runtime-log-head">
              <div class="admin-runtime-log-tags">
                <span class="pill" :class="item.levelClass">{{ item.levelText }}</span>
                <strong>{{ item.scope }}</strong>
                <span v-if="item.action" class="admin-runtime-log-action">{{ item.action }}</span>
              </div>
              <time>{{ item.timestamp }}</time>
            </div>
            <p class="admin-runtime-log-message">{{ item.message }}</p>
            <div v-if="item.requestId" class="admin-runtime-log-meta">requestId: {{ item.requestId }}</div>
          </article>
        </div>
      </section>

      <div id="admin-overview-status" class="status-text">{{ overviewStatus }}</div>
  </AdminPageFrame>
</template>
