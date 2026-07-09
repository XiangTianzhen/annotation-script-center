<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import SectionCard from "@/components/base/SectionCard.vue";
import { buildPlatformEntryDescriptor, isScriptRuntimeAccessible } from "@/services/globals";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const appStore = useAppStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();

const platformGroups = computed(() =>
  scriptsStore.visiblePlatforms
    .map((platformId) => {
      const platform = scriptsStore.platformMap[platformId];
      const scripts = scriptsStore.visibleScripts
        .map((scriptId) => scriptsStore.scriptMap[scriptId])
        .filter((script) => script?.platformId === platformId)
        .map((script) => ({
          ...script,
          runtimeEnabled: isScriptRuntimeAccessible(script.id, settingsStore.settings || {}),
        }));
      return {
        ...platform,
        ...buildPlatformEntryDescriptor(platform),
        scripts,
      };
    })
    .filter((group) => group.scripts.length > 0)
);

const enabledCount = computed(
  () =>
    scriptsStore.visibleScripts.filter((scriptId) =>
      isScriptRuntimeAccessible(scriptId, settingsStore.settings || {})
    ).length
);

async function toggleScript(scriptId, enabled) {
  await settingsStore.toggleScript(scriptId, enabled);
  scriptsStore.sync(settingsStore.settings || {});
  appStore.showToast(enabled ? "脚本已启用。" : "脚本已关闭。", "success");
}
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Options Center</p>
      <div class="page-title-row">
        <div>
          <h2>设置中心</h2>
          <p class="page-subtitle">
            Vue 版 options 已接管统一入口。这里先负责平台级总览、脚本启停和进入各脚本详情；旧查询串路由已退场，后续细化都会继续收口到这个结构里。
          </p>
        </div>
        <div class="download-grid">
          <div class="info-row">
            <strong>{{ scriptsStore.visiblePlatforms.length }}</strong>
            <span class="inline-meta">可见平台</span>
          </div>
          <div class="info-row">
            <strong>{{ scriptsStore.visibleScripts.length }}</strong>
            <span class="inline-meta">可见脚本</span>
          </div>
          <div class="info-row">
            <strong>{{ enabledCount }}</strong>
            <span class="inline-meta">当前启用</span>
          </div>
        </div>
      </div>
    </section>

    <SectionCard
      v-for="group in platformGroups"
      :key="group.id"
      :title="group.label"
      :description="group.description"
    >
      <template #actions>
        <a
          v-if="group.entryUrl"
          class="ghost-button"
          :href="group.entryUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ group.displayHost || group.host || "打开平台" }}
        </a>
      </template>

      <div class="field-stack">
        <article
          v-for="script in group.scripts"
          :key="script.id"
          class="script-list-row"
        >
          <div class="script-list-copy">
            <h4>{{ script.label }}</h4>
            <p>{{ script.description }}</p>
            <span
              class="status-badge"
              :class="script.runtimeEnabled ? 'is-enabled' : 'is-warning'"
            >
              {{ script.runtimeEnabled ? "已启用" : "未启用" }}
            </span>
          </div>
          <div class="button-row wrap">
            <button
              type="button"
              class="button"
              @click="router.push(`/script/${script.id}`)"
            >
              打开设置
            </button>
            <button
              v-if="script.runtimeEnabled"
              type="button"
              class="danger-button"
              @click="toggleScript(script.id, false)"
            >
              关闭脚本
            </button>
            <button
              v-else
              type="button"
              class="ghost-button"
              @click="toggleScript(script.id, true)"
            >
              启用脚本
            </button>
          </div>
        </article>
      </div>
    </SectionCard>
  </div>
</template>
