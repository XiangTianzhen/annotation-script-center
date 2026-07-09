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
        <p>未解锁时会统一回到这个页面，不再靠旧版页面内条件拼装切换。</p>
      </div>
    </section>

    <section class="admin-auth-gate">
      <h3>输入管理员密码</h3>
      <p>会话恢复仍然沿用原有 `sessionStorage + chrome.storage.session` 语义。</p>

      <label class="field-card">
        <strong>管理员密码</strong>
        <input
          v-model="password"
          type="password"
          placeholder="请输入管理员密码"
          @keyup.enter="submit"
        />
      </label>

      <label class="field-card field-toggle">
        <input v-model="remember" type="checkbox" />
        <span>记住本次会话</span>
      </label>

      <div class="field-actions">
        <button type="button" class="primary-button" :disabled="authStore.unlocking" @click="submit">
          {{ authStore.unlocking ? "校验中..." : "进入系统管理" }}
        </button>
      </div>

      <p v-if="authStore.message" class="status-text">
        {{ authStore.message }}
      </p>
    </section>
  </div>
</template>
