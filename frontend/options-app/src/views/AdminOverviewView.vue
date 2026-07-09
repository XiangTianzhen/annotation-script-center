<script setup>
import { onMounted } from "vue";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

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
        <p>这里读取管理员仪表盘和近期运行日志，继续承接旧版 overview 的总览定位。</p>
      </div>
    </section>

    <section class="admin-tab-panel">
      <div class="admin-panel-head">
        <div>
          <strong>运行状态</strong>
          <p>统一后端返回的 dashboard 会直接显示在这里。</p>
        </div>
      </div>

      <div v-if="adminStore.dashboardLoading" class="admin-surface-card">
        <strong>正在加载系统概况</strong>
        <span>稍等片刻，我们正在请求管理员仪表盘。</span>
      </div>

      <div v-else-if="adminStore.dashboardError" class="admin-surface-card">
        <strong>系统概况加载失败</strong>
        <span>{{ adminStore.dashboardError }}</span>
      </div>

      <template v-else>
        <div class="admin-summary-grid">
          <div class="public-summary-card">
            <span class="summary-label">管理员会话</span>
            <strong>已解锁</strong>
            <span class="summary-note">当前路由守卫已经通过管理员鉴权。</span>
          </div>
          <div class="public-summary-card">
            <span class="summary-label">概况原始数据</span>
            <strong>{{ adminStore.dashboard ? "已加载" : "暂无" }}</strong>
            <span class="summary-note">后续可以继续把统计卡拆成更细的 Vue 组件。</span>
          </div>
        </div>

        <section class="admin-surface-card">
          <div class="admin-card-head">
            <strong>原始数据快照</strong>
            <span>作为迁移期兜底视图，避免旧管理功能因为面板未细拆而暂时缺席。</span>
          </div>
          <label class="field-card">
            <strong>dashboard JSON</strong>
            <textarea
              :value="JSON.stringify(adminStore.dashboard || {}, null, 2)"
              rows="18"
              readonly
            />
          </label>
        </section>
      </template>
    </section>
  </div>
</template>
