<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import InlineHelpDot from "@/components/base/InlineHelpDot.vue";
import ScriptSettingsFields from "@/components/script-detail/ScriptSettingsFields.vue";
import ShortcutEditor from "@/components/script-detail/ShortcutEditor.vue";
import {
  applyScriptDraftFieldUpdate,
  hydrateScriptDraft,
  loadScriptDefaults,
  serializeScriptDraft,
} from "@/services/script-defaults";
import { isScriptRuntimeAccessible } from "@/services/globals";
import {
  getScriptConfig,
  getScriptDetailSections,
  saveScriptConfig,
} from "@/services/script-settings";
import { clone } from "@/utils/clone";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const route = useRoute();
const appStore = useAppStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();

const saving = ref(false);
const draftDirty = ref(false);
const draftConfig = ref({});
const savedConfig = ref({});
const validationError = ref("");
const defaultsState = ref({ status: "loading", config: {}, options: {}, error: "" });
let defaultsLoadToken = 0;

const scriptId = computed(() => String(route.params.scriptId || "").trim());
const script = computed(() => scriptsStore.getScript(scriptId.value));
const detailSections = computed(() =>
  getScriptDetailSections(
    scriptId.value,
    savedConfig.value || {},
    defaultsState.value || {}
  )
);
const basicSection = computed(() =>
  detailSections.value.find((section) => section.key === "basic") || null
);
const aiSection = computed(() =>
  detailSections.value.find((section) => section.key === "ai") || null
);
const shortcutsSection = computed(() =>
  detailSections.value.find((section) => section.key === "shortcuts") || null
);
const primarySections = computed(() =>
  [basicSection.value, shortcutsSection.value].filter(Boolean)
);
const secondarySections = computed(() => [aiSection.value].filter(Boolean));
const runtimeEnabled = computed(() =>
  isScriptRuntimeAccessible(scriptId.value, settingsStore.settings || {})
);
const runtimeStatusText = computed(() => (runtimeEnabled.value ? "当前启用" : "当前未启用"));
const runtimeStatusTone = computed(() => (runtimeEnabled.value ? "enabled" : "disabled"));
const defaultsStatusText = computed(() => {
  if (defaultsState.value.status === "loaded") return "已读取后端默认配置";
  if (defaultsState.value.status === "fallback") return "使用本地回退";
  return "正在读取后端默认配置";
});
const defaultsStatusTitle = computed(() =>
  defaultsState.value.status === "fallback" && defaultsState.value.error
    ? defaultsState.value.error
    : defaultsStatusText.value
);

function readSavedConfig() {
  return getScriptConfig(settingsStore.settings || {}, scriptId.value);
}

function hydrateFromSaved(force = false) {
  savedConfig.value = readSavedConfig();
  if (force || draftDirty.value === false) {
    draftConfig.value = hydrateScriptDraft(
      scriptId.value,
      savedConfig.value,
      defaultsState.value
    );
  }
}

async function initializeScriptDetail() {
  const currentToken = ++defaultsLoadToken;
  draftDirty.value = false;
  validationError.value = "";
  defaultsState.value = { status: "loading", config: {}, options: {}, error: "" };
  hydrateFromSaved(true);
  const nextDefaults = await loadScriptDefaults(
    scriptId.value,
    settingsStore.settings || {}
  );
  if (currentToken !== defaultsLoadToken) return;
  defaultsState.value = nextDefaults;
  if (draftDirty.value === false) {
    draftConfig.value = hydrateScriptDraft(
      scriptId.value,
      savedConfig.value,
      defaultsState.value
    );
  }
}

watch(
  scriptId,
  () => {
    void initializeScriptDetail();
  },
  { immediate: true }
);

watch(
  () => settingsStore.settings,
  () => {
    hydrateFromSaved(false);
  },
  { deep: true }
);

function updateField(field, value) {
  draftConfig.value = applyScriptDraftFieldUpdate(
    scriptId.value,
    draftConfig.value,
    field,
    value
  );
  draftDirty.value = true;
  validationError.value = "";
}

async function saveForm() {
  saving.value = true;
  validationError.value = "";
  try {
    const persistedConfig = serializeScriptDraft(
      scriptId.value,
      draftConfig.value,
      defaultsState.value
    );
    await saveScriptConfig(settingsStore, scriptId.value, persistedConfig);
    const normalizedConfig = readSavedConfig();
    savedConfig.value = clone(normalizedConfig);
    draftDirty.value = false;
    draftConfig.value = hydrateScriptDraft(
      scriptId.value,
      normalizedConfig,
      defaultsState.value
    );
    scriptsStore.sync(settingsStore.settings || {});
    appStore.showToast("脚本设置已保存。", "success");
  } catch (error) {
    validationError.value = error?.message || String(error);
    appStore.showToast(validationError.value, "error");
  } finally {
    saving.value = false;
  }
}

async function toggleScriptEnabled() {
  try {
    const nextEnabled = !runtimeEnabled.value;
    await settingsStore.toggleScript(scriptId.value, nextEnabled);
    scriptsStore.sync(settingsStore.settings || {});
    savedConfig.value = readSavedConfig();
    if (draftDirty.value === false) {
      draftConfig.value = hydrateScriptDraft(
        scriptId.value,
        savedConfig.value,
        defaultsState.value
      );
    }
    appStore.showToast(nextEnabled ? "脚本已启用。" : "脚本已关闭。", "success");
  } catch (error) {
    appStore.showToast(error?.message || String(error), "error");
  }
}
</script>

<template>
  <section v-if="script" class="detail-shell">
    <div class="detail-top">
      <div class="detail-title">
        <a id="back-to-center" class="ghost-button detail-back-link" href="#/center">返回功能面板</a>
        <span class="hero-kicker">SCRIPT DETAIL</span>
        <h2 id="detail-script-name">{{ script.label }}</h2>
        <p id="detail-script-description" class="detail-copy">
          {{ script.description }}
        </p>
      </div>
      <div class="detail-meta">
        <span id="detail-script-status" class="pill" :class="runtimeStatusTone">
          {{ runtimeStatusText }}
        </span>
        <span id="detail-platform-pill" class="pill info">
          {{ scriptsStore.platformMap?.[script.platformId]?.label || script.platformId }}
        </span>
      </div>
    </div>

    <section id="detail-actions-panel" class="detail-panel detail-actions-panel">
      <div class="detail-actions">
        <button
          id="detail-toggle-button"
          :class="runtimeEnabled ? 'danger-button' : 'primary-button'"
          type="button"
          @click="toggleScriptEnabled"
        >
          {{ runtimeEnabled ? "关闭脚本" : "启用脚本" }}
        </button>
        <button class="secondary-button" type="button" :disabled="saving" @click="saveForm">
          {{ saving ? "保存中..." : "保存设置" }}
        </button>
      </div>
      <p id="detail-script-note" class="detail-note">
        {{ script.note || "当前页面用于编辑脚本专属设置；公共后端地址与数据导出仍统一走系统管理。" }}
      </p>
      <p v-if="validationError" class="detail-validation-error" role="alert">
        {{ validationError }}
      </p>
    </section>

    <div
      class="detail-workbench detail-workbench-legacy"
      :class="{ 'is-single': secondarySections.length <= 0 }"
    >
      <div class="detail-track detail-track-primary">
        <section
          v-for="section in primarySections"
          :key="section.key"
          class="detail-panel"
          :class="section.key === 'shortcuts' ? 'detail-shortcut-panel' : 'detail-panel-base'"
        >
          <div class="detail-section-head">
            <strong class="field-title-row">
              <span>{{ section.title }}</span>
              <InlineHelpDot :text="section.help" />
            </strong>
          </div>

          <ShortcutEditor
            v-if="section.key === 'shortcuts'"
            :model-value="draftConfig.shortcuts || {}"
            :actions="section.actions || []"
            @update:model-value="updateField({ path: 'shortcuts' }, $event)"
          />

          <ScriptSettingsFields
            v-else
            :groups="section.groups || []"
            :model-value="draftConfig"
            @update-field="updateField"
          />
        </section>
      </div>

      <div
        class="detail-track detail-track-secondary"
        :class="{ 'is-empty': secondarySections.length <= 0 }"
      >
        <section
          v-for="section in secondarySections"
          :key="section.key"
          class="detail-panel detail-ai-panel"
        >
          <div class="detail-section-head detail-ai-section-head">
            <strong class="field-title-row">
              <span>{{ section.title }}</span>
              <InlineHelpDot :text="section.help" />
            </strong>
            <span
              class="defaults-status"
              :class="`is-${defaultsState.status}`"
              :title="defaultsStatusTitle"
            >
              {{ defaultsStatusText }}
            </span>
          </div>

          <ScriptSettingsFields
            :groups="section.groups || []"
            :model-value="draftConfig"
            @update-field="updateField"
          />
        </section>
      </div>
    </div>

    <div id="detail-status" class="status-text">
      脚本设置保存后仍直接写回原有 `chrome.storage` 结构；如已打开业务页面未立即生效，请刷新页面。
    </div>
  </section>

  <div v-else class="fallback-error">
    脚本不存在或当前版本不可见，已从旧查询串路由切到新的 hash 路由体系。
  </div>
</template>
