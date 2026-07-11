<script setup>
import { computed, ref } from "vue";
import AdminPageFrame from "@/components/admin/AdminPageFrame.vue";
import { useAdminStore } from "@/stores/admin";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const scriptsStore = useScriptsStore();
const configExpanded = ref(true);

const draft = computed(() => adminStore.backendDraft || {
  backendEndpointMode: "server",
  backendBaseUrls: { server: "", local: "" },
});

const currentModeLabel = computed(() => {
  const mode = String(draft.value.backendEndpointMode || "server").trim().toLowerCase();
  if (mode === "local") {
    return "本机";
  }
  return "服务器";
});
const effectiveBaseUrl = computed(() => {
  const mode = String(draft.value.backendEndpointMode || "server").trim().toLowerCase();
  if (mode === "local") {
    return String(draft.value.backendBaseUrls?.local || "").trim();
  }
  return String(draft.value.backendBaseUrls?.server || "").trim();
});

function setMode(mode) {
  draft.value.backendEndpointMode = mode;
}

async function save() {
  await adminStore.saveBackendDraft(settingsStore, appStore);
  scriptsStore.sync(settingsStore.settings || {});
}
</script>

<template>
  <AdminPageFrame
    title="后端设置"
    description="统一维护 Server / Local 两套后端根地址；AI 调用使用人与全局摘要统一放在左侧侧栏中管理。"
  >
      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>后端地址</strong>
          <span>保存后所有运行时 API 与下载入口都会跟随当前模式切换</span>
        </div>

        <div id="admin-backend-card-slot">
          <section class="home-endpoint-card hero-command-card">
            <strong>后端根地址</strong>
            <span class="home-endpoint-help">该设置统一控制所有脚本的后端请求和下载入口；前端只保存两套根地址，再从当前模式派生 `/api/...` 与 `/downloads/...`。</span>

            <div class="segmented-control" role="tablist" aria-label="后端模式切换">
              <button
                type="button"
                class="segmented-button"
                :class="{ active: draft.backendEndpointMode === 'server' }"
                @click="setMode('server')"
              >
                服务器
              </button>
              <button
                type="button"
                class="segmented-button"
                :class="{ active: draft.backendEndpointMode === 'local' }"
                @click="setMode('local')"
              >
                本机
              </button>
            </div>

            <div class="status-text">
              当前生效：{{ currentModeLabel }}{{ effectiveBaseUrl ? `（${effectiveBaseUrl}）` : "" }}
            </div>

            <div class="field-actions">
              <button
                type="button"
                class="ghost-button"
                @click="configExpanded = !configExpanded"
              >
                {{ configExpanded ? "折叠根地址配置" : "展开根地址配置" }}
              </button>
            </div>

            <div v-if="configExpanded" class="home-endpoint-config-panel">
              <label class="home-endpoint-row">
                <span>Server 根地址</span>
                <input v-model="draft.backendBaseUrls.server" type="text" />
              </label>
              <label class="home-endpoint-row">
                <span>Local 根地址</span>
                <input v-model="draft.backendBaseUrls.local" type="text" />
              </label>
            </div>

            <div class="field-actions">
              <button type="button" class="primary-button" @click="save">保存后端根地址</button>
            </div>
          </section>
        </div>
      </section>
  </AdminPageFrame>
</template>
