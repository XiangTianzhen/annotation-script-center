<script setup>
import { onMounted } from "vue";
import SectionCard from "@/components/base/SectionCard.vue";
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
  <div class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Admin Overview</p>
      <div class="page-title-row">
        <div>
          <h2>系统概况</h2>
          <p class="page-subtitle">
            这里读取管理员仪表盘和近期运行日志。当前版本先把结构迁完，后续可以继续把旧 overview 的统计卡拆成更细的 Vue 组件。
          </p>
        </div>
      </div>
    </section>

    <SectionCard title="运行状态" description="统一后端返回的 dashboard 会直接显示在这里。">
      <div v-if="adminStore.dashboardLoading" class="empty-state">
        <div class="empty-copy">
          <strong>正在加载系统概况</strong>
          <p>稍等片刻，我们正在请求管理员仪表盘。</p>
        </div>
      </div>

      <div v-else-if="adminStore.dashboardError" class="empty-state">
        <div class="empty-copy">
          <strong>系统概况加载失败</strong>
          <p>{{ adminStore.dashboardError }}</p>
        </div>
      </div>

      <div v-else class="download-grid">
        <div class="info-row">
          <strong>管理员会话</strong>
          <span class="status-badge is-enabled">已解锁</span>
        </div>
        <div class="info-row">
          <strong>概况原始数据</strong>
          <span class="inline-meta">
            {{ adminStore.dashboard ? "已加载" : "暂无" }}
          </span>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="原始数据快照" description="作为迁移期兜底视图，避免旧管理功能因为面板未细拆而暂时缺席。">
      <pre class="base-textarea">{{ JSON.stringify(adminStore.dashboard || {}, null, 2) }}</pre>
    </SectionCard>
  </div>
</template>
