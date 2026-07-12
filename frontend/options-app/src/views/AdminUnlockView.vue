<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const password = ref("");
const remember = ref(false);

async function submit() {
  const operatorName = settingsStore.settings?.meta?.aiUsageOperatorName || "";
  const success = await authStore.unlock(
    settingsStore.settings || {},
    password.value,
    operatorName,
    remember.value
  );
  if (success) {
    password.value = "";
    await router.replace("/admin/overview");
  }
}
</script>

<template>
  <div class="admin-workspace">
    <section class="hero hero-compact hero-mode-admin admin-page-hero">
      <div class="hero-top">
        <div>
          <span class="hero-kicker">SYSTEM MANAGEMENT</span>
          <h1>标注脚本中心</h1>
          <p class="summary-note">系统管理解锁</p>
          <p>系统管理统一承载后端设置、数据导出与系统仪表盘；进入前需要管理员密码验证。</p>
        </div>
      </div>
    </section>

    <section class="admin-auth-gate">
      <h3>输入系统管理密码</h3>
      <p>系统管理页会复用下载鉴权密码。会话恢复仍然沿用原有 `sessionStorage + chrome.storage.session` 语义。</p>

      <label class="admin-auth-field">
        <span>管理员密码</span>
        <input
          id="admin-password-input"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          @keyup.enter="submit"
        />
      </label>

      <label class="field-card field-toggle">
        <input id="admin-remember-session" v-model="remember" type="checkbox" />
        <span>记住本次浏览器会话</span>
      </label>

      <div class="field-actions">
        <button
          id="admin-unlock-button"
          type="button"
          class="primary-button"
          :disabled="authStore.unlocking"
          @click="submit"
        >
          {{ authStore.unlocking ? "校验中..." : "进入系统管理" }}
        </button>
      </div>

      <div id="admin-auth-status" class="status-text">{{ authStore.message }}</div>
    </section>
  </div>
</template>
