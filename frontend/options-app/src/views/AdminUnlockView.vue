<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAdminStore } from "@/stores/admin";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();
const settingsStore = useSettingsStore();

const password = ref("");
const remember = ref(false);

async function submit() {
  const operatorName =
    adminStore.backendDraft?.aiUsageOperatorName ||
    settingsStore.settings?.meta?.aiUsageOperatorName ||
    "";
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
    <section class="admin-stage-banner">
      <div class="admin-stage-copy">
        <strong>系统管理解锁</strong>
        <p>进入系统管理前需要先输入密码。登录后当前浏览器会话内可直接查看仪表盘和发起导出。</p>
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
