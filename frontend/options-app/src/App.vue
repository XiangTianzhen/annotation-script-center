<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import TopToast from "@/components/base/TopToast.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import { isScriptRuntimeAccessible } from "@/services/globals";

const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();

const aiUsageOperatorDraft = ref("");
const aiUsageOperatorStatus = ref("");
const savingAiUsageOperator = ref(false);

watch(
  () => settingsStore.settings?.meta?.aiUsageOperatorName,
  (value) => {
    aiUsageOperatorDraft.value = String(value || "");
  },
  { immediate: true }
);

const enabledCount = computed(
  () =>
    scriptsStore.visibleScripts.filter((scriptId) =>
      isScriptRuntimeAccessible(scriptId, settingsStore.settings || {})
    ).length
);

const backendModeLabel = computed(() => {
  const mode = String(settingsStore.settings?.meta?.backendEndpointMode || "server").trim().toLowerCase();
  if (mode === "local") {
    return "本机";
  }
  if (mode === "beta") {
    return "Beta";
  }
  return "服务器";
});

const currentViewMeta = computed(() => {
  if (route.path.startsWith("/downloads")) {
    return {
      name: "脚本下载中心",
      note: "集中查看扩展版本分发入口和当前发布包。",
    };
  }
  if (route.path.startsWith("/admin")) {
    return {
      name: "系统管理",
      note: "管理后端根地址、导出入口和系统概况。",
    };
  }
  if (route.path.startsWith("/script/")) {
    return {
      name: "脚本详情",
      note: "当前页面只处理单个脚本设置、快捷键和高级 JSON。",
    };
  }
  return {
    name: "功能面板",
    note: "默认展示平台与脚本状态，只保留启停和详情入口。",
  };
});

function isActivePath(path) {
  return route.path === path;
}

async function saveAiUsageOperator() {
  savingAiUsageOperator.value = true;
  aiUsageOperatorStatus.value = "正在保存使用人...";
  try {
    await settingsStore.persistPatch({
      meta: {
        aiUsageOperatorName: String(aiUsageOperatorDraft.value || "").trim(),
      },
    });
    aiUsageOperatorStatus.value = "AI 调用使用人已保存。";
    appStore.showToast("AI 调用使用人已保存。", "success");
  } catch (error) {
    aiUsageOperatorStatus.value = "保存失败：" + (error?.message || String(error));
    appStore.showToast(error?.message || String(error), "error");
  } finally {
    savingAiUsageOperator.value = false;
  }
}
</script>

<template>
  <main class="page">
    <div class="workspace-shell">
      <aside class="workspace-sidebar">
        <div class="workspace-brand">
          <span class="workspace-brand-mark">
            <img
              id="workspace-brand-icon"
              class="workspace-brand-icon"
              src="../../../extension/assets/brand/asc-logo.svg"
              alt="标注脚本中心图标"
            />
          </span>
          <div class="workspace-brand-copy">
            <strong id="workspace-brand-title">{{ appStore.extensionName }}</strong>
            <span id="workspace-version">v{{ appStore.version }}</span>
            <div id="workspace-beta-status" class="status-text hidden" aria-hidden="true"></div>
            <button id="workspace-beta-exit" class="ghost-button hidden" type="button">
              退出内测模式
            </button>
          </div>
        </div>

        <nav class="workspace-nav" aria-label="功能导航">
          <RouterLink
            class="workspace-nav-button"
            :class="{ active: isActivePath('/center') }"
            to="/center"
          >
            功能面板
          </RouterLink>
          <RouterLink
            class="workspace-nav-button"
            :class="{ active: isActivePath('/downloads') }"
            to="/downloads"
          >
            脚本下载中心
          </RouterLink>
          <RouterLink
            class="workspace-nav-button"
            :class="{ active: route.path.startsWith('/admin') }"
            :to="authStore.isUnlocked ? '/admin/overview' : '/admin/unlock'"
          >
            系统管理
          </RouterLink>
        </nav>

        <section class="workspace-side-card">
          <span class="workspace-side-label">当前视图</span>
          <strong id="workspace-view-name">{{ currentViewMeta.name }}</strong>
          <p id="workspace-view-note" class="workspace-side-copy">
            {{ currentViewMeta.note }}
          </p>
        </section>

        <section class="workspace-side-card workspace-side-card-muted">
          <span class="workspace-side-label">AI 调用使用人</span>
          <strong id="workspace-ai-usage-operator-title">全局 AI 调用身份</strong>
          <p class="workspace-side-copy">
            这里统一保存当前扩展使用 AI 时的调用人姓名。点击按钮后才会写入本地缓存。
          </p>
          <div class="workspace-side-form">
            <input
              id="workspace-ai-usage-operator-input"
              v-model="aiUsageOperatorDraft"
              type="text"
              maxlength="40"
              placeholder="填写真实姓名"
            />
            <div class="field-actions">
              <button
                id="workspace-ai-usage-operator-save"
                class="primary-button"
                type="button"
                :disabled="savingAiUsageOperator"
                @click="saveAiUsageOperator"
              >
                {{ savingAiUsageOperator ? "保存中..." : "保存使用人" }}
              </button>
            </div>
            <div id="workspace-ai-usage-operator-status" class="status-text">
              {{ aiUsageOperatorStatus }}
            </div>
          </div>
        </section>

        <section class="workspace-side-card workspace-side-card-dark">
          <span class="workspace-side-label">运行概况</span>
          <div class="workspace-side-list">
            <div><span>当前版本</span><strong id="workspace-version-compact">v{{ appStore.version }}</strong></div>
            <div><span>后端模式</span><strong id="workspace-backend-mode">{{ backendModeLabel }}</strong></div>
            <div><span>AI 调用使用人</span><strong id="workspace-ai-usage-operator">{{ settingsStore.settings?.meta?.aiUsageOperatorName || "未设置" }}</strong></div>
            <div><span>当前生效</span><strong id="workspace-enabled-count">{{ enabledCount }}</strong></div>
            <div><span>平台 / 脚本</span><strong id="workspace-library-count">{{ scriptsStore.visiblePlatforms.length }} / {{ scriptsStore.visibleScripts.length }}</strong></div>
          </div>
        </section>
      </aside>

      <section class="workspace-stage">
        <RouterView />
      </section>
    </div>

    <TopToast
      :message="appStore.toast.message"
      :tone="appStore.toast.tone"
      :visible="appStore.toast.visible"
    />
  </main>
</template>
