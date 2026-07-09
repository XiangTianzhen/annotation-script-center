<script setup>
import { computed } from "vue";
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
        <p>继续沿用共享 settings 里的 `meta.backendEndpointMode` 和 `meta.backendBaseUrls`，不改已有存储字段。</p>
      </div>
    </section>

    <section class="admin-tab-panel">
      <div class="admin-panel-head">
        <div>
          <strong>当前模式</strong>
          <p>保存后会继续作用于下载中心、系统管理与脚本详情。</p>
        </div>
      </div>

      <div class="segmented-control">
        <button
          type="button"
          class="segmented-button"
          :class="{ active: draft.backendEndpointMode === 'server' }"
          @click="draft.backendEndpointMode = 'server'"
        >
          Server
        </button>
        <button
          type="button"
          class="segmented-button"
          :class="{ active: draft.backendEndpointMode === 'local' }"
          @click="draft.backendEndpointMode = 'local'"
        >
          Local
        </button>
        <button
          v-if="betaVisible"
          type="button"
          class="segmented-button"
          :class="{ active: draft.backendEndpointMode === 'beta' }"
          @click="draft.backendEndpointMode = 'beta'"
        >
          Beta
        </button>
      </div>

      <div class="detail-grid two">
        <label class="field-card">
          <strong>Server 根地址</strong>
          <input v-model="draft.backendBaseUrls.server" type="text" />
        </label>
        <label class="field-card">
          <strong>Local 根地址</strong>
          <input v-model="draft.backendBaseUrls.local" type="text" />
        </label>
        <label v-if="betaVisible" class="field-card">
          <strong>Beta 根地址</strong>
          <input v-model="draft.backendBaseUrls.beta" type="text" />
        </label>
        <label class="field-card">
          <strong>AI 调用操作人</strong>
          <input v-model="draft.aiUsageOperatorName" type="text" />
        </label>
      </div>

      <div class="field-actions">
        <button type="button" class="primary-button" @click="save">保存后端设置</button>
      </div>
    </section>
  </div>
</template>
