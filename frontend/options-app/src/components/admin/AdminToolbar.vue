<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "@/stores/admin";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const adminStore = useAdminStore();
const appStore = useAppStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const refreshing = ref(false);

const endpointStatus = computed(() => {
  const mode = String(settingsStore.settings?.meta?.backendEndpointMode || "server").trim().toLowerCase();
  const baseUrls = settingsStore.settings?.meta?.backendBaseUrls || {};
  if (mode === "local") {
    return `当前后端入口：Local${baseUrls.local ? `（${baseUrls.local}）` : ""}`;
  }
  if (mode === "beta") {
    return `当前后端入口：Beta${baseUrls.beta ? `（${baseUrls.beta}）` : ""}`;
  }
  return `当前后端入口：Server${baseUrls.server ? `（${baseUrls.server}）` : ""}`;
});

async function refreshDashboard() {
  refreshing.value = true;
  try {
    const result = await adminStore.loadDashboard(settingsStore.settings || {}, authStore.session);
    if (result) {
      appStore.showToast("系统仪表盘已刷新。", "success");
      return;
    }
    appStore.showToast(adminStore.dashboardError || "系统仪表盘刷新失败。", "warning");
  } catch (error) {
    appStore.showToast(error?.message || String(error), "error");
  } finally {
    refreshing.value = false;
  }
}

async function logout() {
  await authStore.logout();
  await router.push("/admin/unlock");
}
</script>

<template>
  <div class="admin-toolbar field-actions">
    <span id="admin-stage-endpoint" class="status-text">{{ endpointStatus }}</span>
    <div class="field-actions">
      <button
        id="admin-refresh-dashboard"
        class="ghost-button"
        type="button"
        :disabled="refreshing"
        @click="refreshDashboard"
      >
        {{ refreshing ? "刷新中..." : "刷新数据" }}
      </button>
      <button
        id="admin-return-center"
        class="ghost-button"
        type="button"
        @click="router.push('/center')"
      >
        返回功能面板
      </button>
      <button
        id="admin-logout-button"
        class="secondary-button"
        type="button"
        @click="logout"
      >
        退出登录
      </button>
    </div>
  </div>
</template>
