<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AdminPageFrame from "@/components/admin/AdminPageFrame.vue";
import { useAdminStore } from "@/stores/admin";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const appStore = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const settingsStore = useSettingsStore();
const scriptsStore = useScriptsStore();
const configExpanded = ref(true);

const draft = computed(() => adminStore.backendDraft || {
  backendEndpointMode: "server",
  backendBaseUrls: { server: "", local: "" },
});

const currentModeLabel = computed(() => {
  const mode = String(draft.value.backendEndpointMode || "server").trim().toLowerCase();
  if (mode === "local") {
    return "本机";
  }
  return "服务器";
});
const effectiveBaseUrl = computed(() => {
  const mode = String(draft.value.backendEndpointMode || "server").trim().toLowerCase();
  if (mode === "local") {
    return String(draft.value.backendBaseUrls?.local || "").trim();
  }
  return String(draft.value.backendBaseUrls?.server || "").trim();
});
const isServerMode = computed(() => String(draft.value.backendEndpointMode || "server").trim().toLowerCase() === "server");
const AI_KEY_SLOT_IDS = Object.freeze(["key-1", "key-2"]);
const AI_KEY_SLOT_NAMES = Object.freeze({
  "key-1": "吴",
  "key-2": "王",
});
const selectedAiKeySlotId = ref("");
const aiKeySlots = computed(() => {
  const slots = adminStore.aiKeySlots?.slots;
  return Array.isArray(slots) ? slots : [];
});
const activeAiKeySlotId = computed(() => {
  const activeSlot = aiKeySlots.value.find((slot) => slot?.active === true);
  const slotId = activeSlot?.id || adminStore.aiKeySlots?.activeSlotId;
  return AI_KEY_SLOT_IDS.includes(slotId) ? slotId : "";
});
const aiKeySlotChoices = computed(() => AI_KEY_SLOT_IDS.map((id) => {
  const slot = aiKeySlots.value.find((item) => item?.id === id);
  return {
    id,
    name: AI_KEY_SLOT_NAMES[id],
    configured: slot?.configured === true,
  };
}));
const selectedAiKeySlot = computed(() => aiKeySlotChoices.value.find(
  (slot) => slot.id === selectedAiKeySlotId.value
));
const activeAiKeySlotName = computed(() => AI_KEY_SLOT_NAMES[activeAiKeySlotId.value] || "未确认");
const canSaveAiKeySlot = computed(() => {
  const selectedSlot = selectedAiKeySlot.value;
  return selectedSlot?.configured === true
    && selectedSlot.id !== activeAiKeySlotId.value
    && activeAiKeySlotId.value !== ""
    && adminStore.aiKeySlotSwitchingId === "";
});

watch(activeAiKeySlotId, function (slotId) {
  if (slotId) {
    selectedAiKeySlotId.value = slotId;
  }
}, { immediate: true });

async function handleAuthFailure(result) {
  if (!result?.authFailed) {
    return false;
  }
  await authStore.logout();
  await router.replace({ name: "admin-unlock" });
  return true;
}

async function loadAiKeySlots() {
  if (!isServerMode.value) {
    return null;
  }
  const result = await adminStore.loadAiKeySlots(settingsStore.settings || {}, authStore.session);
  if (await handleAuthFailure(result)) {
    return null;
  }
  return result;
}

function selectAiKeySlot(slotId) {
  const slot = aiKeySlotChoices.value.find((item) => item.id === slotId);
  if (!slot?.configured || adminStore.aiKeySlotSwitchingId !== "") {
    return;
  }
  selectedAiKeySlotId.value = slotId;
}

async function saveAiKeySlot() {
  if (!canSaveAiKeySlot.value) {
    return;
  }
  const slotId = selectedAiKeySlotId.value;
  const result = await adminStore.switchAiKeySlot(
    settingsStore.settings || {},
    authStore.session,
    slotId
  );
  if (await handleAuthFailure(result)) {
    return;
  }
  if (result) {
    const refreshedSlots = await loadAiKeySlots();
    if (refreshedSlots) {
      appStore.showToast("已保存，当前使用" + (AI_KEY_SLOT_NAMES[slotId] || "目标密钥") + "。", "success");
    }
  }
}

function setMode(mode) {
  draft.value.backendEndpointMode = mode;
}

async function save() {
  await adminStore.saveBackendDraft(settingsStore, appStore);
  scriptsStore.sync(settingsStore.settings || {});
}

watch(isServerMode, function (serverMode) {
  if (serverMode) {
    void loadAiKeySlots();
  }
});

onMounted(function () {
  void loadAiKeySlots();
});
</script>

<template>
  <AdminPageFrame
    title="后端设置"
    description="统一维护 Server / Local 两套后端根地址；AI 调用使用人与全局摘要统一放在左侧侧栏中管理。"
  >
      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>后端地址</strong>
          <span>保存后所有运行时 API 与下载入口都会跟随当前模式切换</span>
        </div>

        <div id="admin-backend-card-slot">
          <section class="home-endpoint-card hero-command-card">
            <strong>后端根地址</strong>
            <span class="home-endpoint-help">该设置统一控制所有脚本的后端请求和下载入口；前端只保存两套根地址，再从当前模式派生 `/api/...` 与 `/downloads/...`。</span>

            <div class="segmented-control" role="tablist" aria-label="后端模式切换">
              <button
                type="button"
                class="segmented-button"
                :class="{ active: draft.backendEndpointMode === 'server' }"
                @click="setMode('server')"
              >
                服务器
              </button>
              <button
                type="button"
                class="segmented-button"
                :class="{ active: draft.backendEndpointMode === 'local' }"
                @click="setMode('local')"
              >
                本机
              </button>
            </div>

            <div class="status-text">
              当前生效：{{ currentModeLabel }}{{ effectiveBaseUrl ? `（${effectiveBaseUrl}）` : "" }}
            </div>

            <section v-if="isServerMode" id="admin-ai-key-slots" class="admin-ai-key-slots">
              <div v-if="adminStore.aiKeySlotsError" class="status-text" role="status">
                {{ adminStore.aiKeySlotsError }}
              </div>

              <template v-else>
                <div v-if="adminStore.aiKeySlotsLoading" class="status-text">
                  正在读取密钥状态...
                </div>

                <div class="admin-ai-key-switcher">
                  <div class="admin-ai-key-control">
                    <strong>AI 密钥</strong>
                    <div class="admin-ai-key-choice-group segmented-control" role="group" aria-label="AI 密钥选择">
                      <button
                        v-for="slot in aiKeySlotChoices"
                        :key="slot.id"
                        type="button"
                        class="segmented-button"
                        :class="{ active: selectedAiKeySlotId === slot.id }"
                        :data-ai-key-choice="slot.id"
                        :aria-pressed="selectedAiKeySlotId === slot.id ? 'true' : 'false'"
                        :disabled="!slot.configured || adminStore.aiKeySlotSwitchingId !== ''"
                        @click="selectAiKeySlot(slot.id)"
                      >
                        {{ slot.name }}
                      </button>
                    </div>
                    <span class="admin-ai-key-current">当前使用：{{ activeAiKeySlotName }}</span>
                  </div>
                  <button
                    type="button"
                    class="primary-button"
                    data-ai-key-save
                    :disabled="!canSaveAiKeySlot"
                    @click="saveAiKeySlot"
                  >
                    {{ adminStore.aiKeySlotSwitchingId ? "正在保存..." : "保存当前密钥" }}
                  </button>
                </div>
              </template>
            </section>

            <div class="field-actions">
              <button
                type="button"
                class="ghost-button"
                @click="configExpanded = !configExpanded"
              >
                {{ configExpanded ? "折叠根地址配置" : "展开根地址配置" }}
              </button>
            </div>

            <div v-if="configExpanded" class="home-endpoint-config-panel">
              <label class="home-endpoint-row">
                <span>Server 根地址</span>
                <input v-model="draft.backendBaseUrls.server" type="text" />
              </label>
              <label class="home-endpoint-row">
                <span>Local 根地址</span>
                <input v-model="draft.backendBaseUrls.local" type="text" />
              </label>
            </div>

            <div class="field-actions">
              <button type="button" class="primary-button" @click="save">保存后端根地址</button>
            </div>
          </section>
        </div>
      </section>
  </AdminPageFrame>
</template>
