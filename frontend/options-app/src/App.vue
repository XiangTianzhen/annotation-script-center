<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import TopToast from "@/components/base/TopToast.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import { canUseBetaFeatures, getConstants, isScriptRuntimeAccessible } from "@/services/globals";

const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();
const aiUsageOperatorDraft = ref("");
const aiUsageOperatorStatus = ref("");
const savingAiUsageOperator = ref(false);
const betaUnlockTapCount = ref(0);
const betaUnlockTimer = ref(null);

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

function isActivePath(path) {
  return route.path === path;
}

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
      note: "统一处理后端设置、数据导出、模型池状态与系统仪表盘。",
    };
  }
  if (route.path.startsWith("/script/")) {
    return {
      name: "脚本详情",
      note: "当前页面用于编辑脚本专属设置；公共后端地址与数据导出仍统一走系统管理。",
    };
  }
  return {
    name: "功能面板",
    note: "默认展示平台与脚本状态，只保留启停和详情入口。",
  };
});

const betaSettings = computed(() => {
  const constants = getConstants();
  return {
    releaseChannel: String(constants.RELEASE_CHANNEL || "").trim().toLowerCase(),
    visibleByDefault: constants.BETA_FEATURES_VISIBLE_BY_DEFAULT === true,
    passwordSha256: String(constants.BETA_UNLOCK_PASSWORD_SHA256 || "").trim().toLowerCase(),
  };
});

const betaExitVisible = computed(
  () =>
    canUseBetaFeatures(settingsStore.settings || {}) &&
    betaSettings.value.visibleByDefault === false
);

function resetBetaUnlockTapSequence() {
  betaUnlockTapCount.value = 0;
  if (betaUnlockTimer.value) {
    clearTimeout(betaUnlockTimer.value);
    betaUnlockTimer.value = null;
  }
}

async function sha256Hex(value) {
  const text = String(value || "");
  if (!text || !globalThis.crypto?.subtle || typeof TextEncoder !== "function") {
    return "";
  }
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

async function unlockBetaMode() {
  if (betaSettings.value.releaseChannel !== "beta") {
    return;
  }
  if (!betaSettings.value.passwordSha256) {
    globalThis.alert?.("当前 beta 包未配置口令，无法解锁。");
    return;
  }
  const password = globalThis.prompt?.("请输入 beta 口令");
  if (!String(password || "").trim()) {
    return;
  }
  const hashed = await sha256Hex(password);
  if (hashed !== betaSettings.value.passwordSha256) {
    globalThis.alert?.("beta 口令错误。");
    return;
  }
  await settingsStore.persistPatch({
    meta: {
      betaUnlocked: true,
      betaUnlockedAt: new Date().toISOString(),
    },
  });
  scriptsStore.sync(settingsStore.settings || {});
  appStore.showToast("已进入内测模式。", "success");
}

async function exitBetaMode() {
  const nextMeta = {
    betaUnlocked: false,
    betaUnlockedAt: null,
  };
  if (backendModeLabel.value === "Beta") {
    nextMeta.backendEndpointMode = "server";
  }
  await settingsStore.persistPatch({
    meta: nextMeta,
  });
  scriptsStore.sync(settingsStore.settings || {});
  appStore.showToast("已退出内测模式。", "success");
}

function registerBetaUnlockTap() {
  if (betaSettings.value.releaseChannel !== "beta" || canUseBetaFeatures(settingsStore.settings || {})) {
    return;
  }
  betaUnlockTapCount.value += 1;
  if (betaUnlockTimer.value) {
    clearTimeout(betaUnlockTimer.value);
  }
  betaUnlockTimer.value = setTimeout(() => {
    resetBetaUnlockTapSequence();
  }, 3000);
  if (betaUnlockTapCount.value >= 7) {
    resetBetaUnlockTapSequence();
    void unlockBetaMode();
  }
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

onBeforeUnmount(resetBetaUnlockTapSequence);
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
              @click="registerBetaUnlockTap"
            />
          </span>
          <div class="workspace-brand-copy">
            <strong id="workspace-brand-title">{{ appStore.extensionName }}</strong>
            <span id="workspace-version">v{{ appStore.version }}</span>
            <div
              id="workspace-beta-status"
              class="status-text"
              :class="{ hidden: !betaExitVisible }"
              :aria-hidden="String(!betaExitVisible)"
            >
              当前已进入 beta 隐藏能力模式
            </div>
            <button
              id="workspace-beta-exit"
              class="ghost-button"
              :class="{ hidden: !betaExitVisible }"
              type="button"
              @click="exitBetaMode"
            >
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
          <p id="workspace-view-note" class="workspace-side-copy">{{ currentViewMeta.note }}</p>
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
