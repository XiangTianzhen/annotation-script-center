<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
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
const betaUnlockTapCount = ref(0);
const betaUnlockTimer = ref(null);

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

onBeforeUnmount(resetBetaUnlockTapSequence);
</script>

<template>
  <main class="page">
    <div class="workspace-stage-shell">
      <header class="workspace-topbar">
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

        <div class="workspace-topbar-side">
          <div class="workspace-topbar-facts">
            <span><strong id="workspace-backend-mode">{{ backendModeLabel }}</strong> 后端</span>
            <span><strong id="workspace-enabled-count">{{ enabledCount }}</strong> 已启用</span>
            <span><strong id="workspace-library-count">{{ scriptsStore.visiblePlatforms.length }} / {{ scriptsStore.visibleScripts.length }}</strong> 平台/脚本</span>
          </div>
          <nav class="workspace-topnav" aria-label="功能导航">
            <RouterLink
              class="workspace-topnav-button"
              :class="{ active: isActivePath('/center') }"
              to="/center"
            >
              功能面板
            </RouterLink>
            <RouterLink
              class="workspace-topnav-button"
              :class="{ active: isActivePath('/downloads') }"
              to="/downloads"
            >
              脚本下载中心
            </RouterLink>
            <RouterLink
              class="workspace-topnav-button"
              :class="{ active: route.path.startsWith('/admin') }"
              :to="authStore.isUnlocked ? '/admin/overview' : '/admin/unlock'"
            >
              系统管理
            </RouterLink>
          </nav>
        </div>
      </header>

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
