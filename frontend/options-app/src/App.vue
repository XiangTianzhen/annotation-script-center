<script setup>
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import TopToast from "@/components/base/TopToast.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";

const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const scriptsStore = useScriptsStore();

const platformGroups = computed(() =>
  scriptsStore.visiblePlatforms
    .map((platformId) => {
      const platform = scriptsStore.platformMap[platformId];
      const scripts = scriptsStore.visibleScripts
        .map((scriptId) => scriptsStore.scriptMap[scriptId])
        .filter((script) => script?.platformId === platformId);
      return {
        ...platform,
        scripts,
      };
    })
    .filter((group) => group.scripts.length > 0)
);

function isActivePath(path) {
  return route.path === path;
}
</script>

<template>
  <div class="options-app-shell">
    <aside class="options-side-nav">
      <div class="options-brand">
        <p class="options-brand-kicker">Annotation Script Center</p>
        <h1>{{ appStore.extensionName }}</h1>
        <p class="options-brand-meta">v{{ appStore.version }}</p>
      </div>

      <nav class="options-main-nav">
        <RouterLink
          class="options-nav-link"
          :class="{ 'is-active': isActivePath('/center') }"
          to="/center"
        >
          设置中心
        </RouterLink>
        <RouterLink
          class="options-nav-link"
          :class="{ 'is-active': isActivePath('/downloads') }"
          to="/downloads"
        >
          下载中心
        </RouterLink>
        <RouterLink
          class="options-nav-link"
          :class="{ 'is-active': route.path.startsWith('/admin') }"
          :to="authStore.isUnlocked ? '/admin/overview' : '/admin/unlock'"
        >
          系统管理
        </RouterLink>
      </nav>

      <section class="options-side-section">
        <p class="options-side-title">脚本详情</p>
        <div class="options-script-links">
          <div
            v-for="group in platformGroups"
            :key="group.id"
            class="options-script-group"
          >
            <p class="options-script-group-title">{{ group.label }}</p>
            <RouterLink
              v-for="script in group.scripts"
              :key="script.id"
              class="options-script-link"
              :class="{ 'is-active': route.params.scriptId === script.id }"
              :to="`/script/${script.id}`"
            >
              {{ script.shortLabel || script.label }}
            </RouterLink>
          </div>
        </div>
      </section>
    </aside>

    <main class="options-main-stage">
      <RouterView />
    </main>

    <TopToast
      :message="appStore.toast.message"
      :tone="appStore.toast.tone"
      :visible="appStore.toast.visible"
    />
  </div>
</template>
