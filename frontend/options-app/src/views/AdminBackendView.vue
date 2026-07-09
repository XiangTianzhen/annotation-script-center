<script setup>
import { computed } from "vue";
import BaseField from "@/components/base/BaseField.vue";
import SectionCard from "@/components/base/SectionCard.vue";
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
  <div class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Admin Backend</p>
      <div class="page-title-row">
        <div>
          <h2>后端与操作人配置</h2>
          <p class="page-subtitle">
            Vue 版继续沿用共享 settings 里的 `meta.backendEndpointMode` 和 `meta.backendBaseUrls`，不改已有存储字段。
          </p>
        </div>
      </div>
    </section>

    <SectionCard title="当前模式" description="保存后会写回共享 settings，并继续作用于下载中心、系统管理与脚本详情。">
      <div class="button-row wrap">
        <button
          type="button"
          class="soft-button"
          :class="{ button: draft.backendEndpointMode === 'server' }"
          @click="draft.backendEndpointMode = 'server'"
        >
          Server
        </button>
        <button
          type="button"
          class="soft-button"
          :class="{ button: draft.backendEndpointMode === 'local' }"
          @click="draft.backendEndpointMode = 'local'"
        >
          Local
        </button>
        <button
          v-if="betaVisible"
          type="button"
          class="soft-button"
          :class="{ button: draft.backendEndpointMode === 'beta' }"
          @click="draft.backendEndpointMode = 'beta'"
        >
          Beta
        </button>
      </div>
    </SectionCard>

    <SectionCard title="根地址与操作人" description="后续这里会继续拆得更细；当前先覆盖原生 options 最常用的后台配置入口。">
      <div class="field-stack">
        <BaseField label="Server 根地址">
          <input v-model="draft.backendBaseUrls.server" class="base-input" type="text" />
        </BaseField>
        <BaseField label="Local 根地址">
          <input v-model="draft.backendBaseUrls.local" class="base-input" type="text" />
        </BaseField>
        <BaseField v-if="betaVisible" label="Beta 根地址">
          <input v-model="draft.backendBaseUrls.beta" class="base-input" type="text" />
        </BaseField>
        <BaseField label="AI 调用操作人">
          <input v-model="draft.aiUsageOperatorName" class="base-input" type="text" />
        </BaseField>
        <div class="button-row">
          <button type="button" class="button" @click="save">保存后端设置</button>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
