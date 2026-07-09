<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import BaseField from "@/components/base/BaseField.vue";
import SectionCard from "@/components/base/SectionCard.vue";
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
  <div class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Admin Gate</p>
      <div class="page-title-row">
        <div>
          <h2>系统管理解锁</h2>
          <p class="page-subtitle">
            `/admin/*` 现在全部走 hash 路由守卫。未解锁时会统一回到这个页面，不再靠旧版条件拼装切换。
          </p>
        </div>
      </div>
    </section>

    <SectionCard title="输入管理员密码" description="会话恢复仍然沿用原有 sessionStorage + chrome.storage.session 语义。">
      <div class="field-stack">
        <BaseField label="管理员密码">
          <input
            v-model="password"
            class="base-input"
            type="password"
            placeholder="请输入管理员密码"
            @keyup.enter="submit"
          />
        </BaseField>

        <label class="option-row">
          <span>记住本次会话</span>
          <input v-model="remember" type="checkbox" />
        </label>

        <div class="button-row">
          <button type="button" class="button" :disabled="authStore.unlocking" @click="submit">
            {{ authStore.unlocking ? "校验中..." : "进入系统管理" }}
          </button>
        </div>

        <p v-if="authStore.message" class="field-note">
          {{ authStore.message }}
        </p>
      </div>
    </SectionCard>
  </div>
</template>
