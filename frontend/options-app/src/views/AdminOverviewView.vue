<script setup>
import { computed, onMounted } from "vue";
import AdminTabStrip from "@/components/admin/AdminTabStrip.vue";
import AdminToolbar from "@/components/admin/AdminToolbar.vue";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const dashboard = computed(() => adminStore.dashboard || {});
const queuePools = computed(() => dashboard.value?.runtime?.queue?.activePools || []);
const runtimeLogs = computed(() => dashboard.value?.runtimeLogs?.items || []);
const logsSummary = computed(() => dashboard.value?.logsSummary || {});
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
const logSummaryCards = computed(() => [
  {
    label: "日志保留",
    value: `${Number(logsSummary.value?.retentionDays || dashboard.value?.runtimeLogs?.retentionDays || 7) || 7} 天`,
    note: "当前运行日志默认按统一后端保留策略展示。",
  },
  {
    label: "最近日志条数",
    value: String(Array.isArray(runtimeLogs.value) ? runtimeLogs.value.length : 0),
    note: "默认显示最近返回的后台运行日志。",
  },
  {
    label: "最近 24 小时汇总",
    value: String(Number(logsSummary.value?.totalCount || logsSummary.value?.count || 0) || 0),
    note: "用于快速确认近期整体日志活跃情况。",
  },
]);

async function load() {
  await adminStore.loadDashboard(settingsStore.settings || {}, authStore.session);
}

onMounted(load);
</script>

<template>
  <div class="admin-workspace admin-stage">
    <section class="admin-stage-banner">
      <div class="admin-stage-copy">
        <strong>系统概况</strong>
        <p>系统管理统一承载后端设置、数据导出与系统仪表盘；这里继续沿用旧版 overview 的总览壳层。</p>
      </div>
    </section>

    <section class="admin-tab-panel admin-content">
      <AdminToolbar />
      <AdminTabStrip />

      <div class="admin-panel-head">
        <div>
          <h3>系统仪表盘</h3>
          <p>这里展示模型池占用、最近 24 小时日志统计和最近运行日志；页面每 60 秒自动刷新一次，也可手动刷新。</p>
        </div>
      </div>

      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>模型池占用</strong>
          <span>按顺序排队，每 50ms 发起 1 个请求</span>
        </div>
        <div id="admin-overview-pools" class="pool-stat-grid">
          <div v-if="queuePools.length <= 0" class="field-card">
            <strong>当前暂无活跃池</strong>
            <span>统一后端未返回活跃任务池数据。</span>
          </div>
          <div
            v-for="pool in queuePools"
            :key="pool.id || pool.name || pool.label"
            class="field-card"
          >
            <strong>{{ pool.label || pool.name || pool.id || "未命名池" }}</strong>
            <span>运行中：{{ pool.runningCount || 0 }}</span>
            <span>待启动：{{ pool.pendingCount || 0 }}</span>
          </div>
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
          <div v-if="runtimeLogs.length <= 0" class="field-card">
            <strong>暂无运行日志</strong>
            <span>当前响应未返回近期日志列表。</span>
          </div>
          <article
            v-for="item in runtimeLogs"
            :key="item.id || item.timestamp || item.message"
            class="admin-runtime-log-item"
          >
            <div class="admin-runtime-log-head">
              <strong>{{ item.level || "INFO" }}</strong>
              <span>{{ item.timestamp || item.createdAt || "" }}</span>
            </div>
            <p>{{ item.message || item.summary || "无日志内容" }}</p>
          </article>
        </div>
      </section>

      <div id="admin-overview-status" class="status-text">{{ overviewStatus }}</div>
    </section>
  </div>
</template>
