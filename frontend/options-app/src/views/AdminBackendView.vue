<script setup>
import { computed } from "vue";
import AdminTabStrip from "@/components/admin/AdminTabStrip.vue";
import AdminToolbar from "@/components/admin/AdminToolbar.vue";
import { canUseBetaFeatures } from "@/services/globals";
import { useAdminStore } from "@/stores/admin";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const scriptsStore = useScriptsStore();

const draft = computed(() => adminStore.backendDraft || {
  backendEndpointMode: "server",
  backendBaseUrls: { server: "", local: "", beta: "" },
  aiUsageOperatorName: "",
});

const betaVisible = computed(() => canUseBetaFeatures(settingsStore.settings || {}));

async function save() {
  await adminStore.saveBackendDraft(settingsStore, appStore);
  scriptsStore.sync(settingsStore.settings || {});
}
</script>

<template>
  <div class="admin-workspace admin-stage">
    <section class="admin-stage-banner">
      <div class="admin-stage-copy">
        <strong>后端与操作人配置</strong>
        <p>系统管理统一维护 server / local / beta 三套后端根地址；AI 调用使用人继续保留在左侧侧栏统一保存。</p>
      </div>
    </section>

    <section class="admin-tab-panel admin-content">
      <AdminToolbar />
      <AdminTabStrip />

      <div class="admin-panel-head">
        <div>
          <h3>后端设置</h3>
          <p>这里统一维护 server / local / beta 三套后端根地址；保存后所有运行时 API 与下载入口都会跟随当前模式切换。</p>
        </div>
      </div>

      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>后端根地址</strong>
          <span>保存后所有运行时 API 与下载入口都会跟随当前模式切换</span>
        </div>

        <div id="admin-backend-card-slot">
          <section class="home-endpoint-card hero-command-card">
            <strong>后端入口模式</strong>
            <span class="home-endpoint-help">继续沿用共享 settings 里的 `meta.backendEndpointMode` 和 `meta.backendBaseUrls`，不改已有存储字段。</span>

            <label class="project-download-row">
              <span>当前模式</span>
              <select v-model="draft.backendEndpointMode">
                <option value="server">Server</option>
                <option value="local">Local</option>
                <option v-if="betaVisible" value="beta">Beta</option>
              </select>
            </label>

            <div class="home-endpoint-config-panel">
              <label class="home-endpoint-row">
                <span>Server 根地址</span>
                <input v-model="draft.backendBaseUrls.server" type="text" />
              </label>
              <label class="home-endpoint-row">
                <span>Local 根地址</span>
                <input v-model="draft.backendBaseUrls.local" type="text" />
              </label>
              <label v-if="betaVisible" class="home-endpoint-row">
                <span>Beta 根地址</span>
                <input v-model="draft.backendBaseUrls.beta" type="text" />
              </label>
              <label class="home-endpoint-row">
                <span>AI 调用使用人</span>
                <input v-model="draft.aiUsageOperatorName" type="text" />
              </label>
            </div>

            <div class="field-actions">
              <button type="button" class="primary-button" @click="save">保存后端设置</button>
            </div>
          </section>
        </div>
      </section>
    </section>
  </div>
</template>
