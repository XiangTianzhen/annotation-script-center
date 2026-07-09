<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BaseSelect from "@/components/base/BaseSelect.vue";
import InlineHelpDot from "@/components/base/InlineHelpDot.vue";
import ShortcutEditor from "@/components/script-detail/ShortcutEditor.vue";
import { isScriptRuntimeAccessible } from "@/services/globals";
import {
  getScriptConfig,
  getScriptDetailSections,
  saveScriptConfig,
} from "@/services/script-settings";
import { clone, deepGet, deepSet } from "@/utils/clone";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

const route = useRoute();
const appStore = useAppStore();
const scriptsStore = useScriptsStore();
const settingsStore = useSettingsStore();

const saving = ref(false);
const draftConfig = ref({});

const scriptId = computed(() => String(route.params.scriptId || "").trim());
const script = computed(() => scriptsStore.getScript(scriptId.value));
const detailSections = computed(() =>
  getScriptDetailSections(scriptId.value, draftConfig.value || {})
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
const secondarySections = computed(() =>
  [aiSection.value].filter(Boolean)
);
const runtimeEnabled = computed(() =>
  isScriptRuntimeAccessible(scriptId.value, settingsStore.settings || {})
);
const runtimeStatusText = computed(() => (runtimeEnabled.value ? "当前启用" : "当前未启用"));
const runtimeStatusTone = computed(() => (runtimeEnabled.value ? "enabled" : "disabled"));

function syncDraftFromSettings() {
  draftConfig.value = getScriptConfig(settingsStore.settings || {}, scriptId.value);
}

watch(
  () => [scriptId.value, settingsStore.settings],
  () => {
    syncDraftFromSettings();
  },
  { immediate: true, deep: true }
);

function getFieldValue(field) {
  if (field.kind === "boolean") {
    return Boolean(deepGet(draftConfig.value || {}, field.path, false));
  }
  return deepGet(draftConfig.value || {}, field.path, field.defaultValue ?? "");
}

function setFieldValue(field, value) {
  const next = clone(draftConfig.value || {});
  deepSet(next, field.path, value);
  draftConfig.value = next;
}

function coerceValue(field, rawValue) {
  if (field.kind === "number" || field.valueType === "number") {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      return "";
    }
    const numeric = Number(rawValue);
    return Number.isFinite(numeric) ? numeric : "";
  }
  return rawValue;
}

function resolveGridClass(section) {
  if (section?.layout === "single") {
    return "detail-grid single";
  }
  return "detail-grid two";
}

async function saveForm() {
  saving.value = true;
  try {
    await saveScriptConfig(settingsStore, scriptId.value, draftConfig.value);
    scriptsStore.sync(settingsStore.settings || {});
    syncDraftFromSettings();
    appStore.showToast("脚本设置已保存。", "success");
  } catch (error) {
    appStore.showToast(error?.message || String(error), "error");
  } finally {
    saving.value = false;
  }
}

async function toggleScriptEnabled() {
  const nextEnabled = !runtimeEnabled.value;
  await settingsStore.toggleScript(scriptId.value, nextEnabled);
  scriptsStore.sync(settingsStore.settings || {});
  syncDraftFromSettings();
  appStore.showToast(nextEnabled ? "脚本已启用。" : "脚本已关闭。", "success");
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
    </section>

    <div class="detail-workbench detail-workbench-legacy" :class="{ 'is-single': secondarySections.length <= 0 }">
      <div class="detail-track detail-track-primary">
        <section
          v-for="section in primarySections"
          :key="section.key"
          class="detail-panel"
          :class="section.key === 'shortcuts' ? 'detail-shortcut-panel' : 'detail-panel-base'"
        >
          <div class="detail-section-head">
            <div>
              <strong class="field-title-row">
                <span>{{ section.title }}</span>
                <InlineHelpDot :text="section.help" />
              </strong>
            </div>
          </div>

          <ShortcutEditor
            v-if="section.key === 'shortcuts'"
            :model-value="draftConfig.shortcuts || {}"
            :actions="section.actions || []"
            @update:model-value="(value) => setFieldValue({ path: 'shortcuts' }, value)"
          />

          <div v-else :class="resolveGridClass(section)">
            <template v-for="field in section.fields" :key="field.path || field.label">
              <div v-if="field.kind === 'notice'" class="field-card field-card-notice">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                </strong>
                <span v-for="line in field.lines || []" :key="line">{{ line }}</span>
              </div>

              <label v-else-if="field.kind === 'boolean'" class="field-card">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                  <InlineHelpDot :text="field.help" />
                </strong>
                <span class="field-toggle switch-field">
                  <input
                    type="checkbox"
                    :checked="Boolean(getFieldValue(field))"
                    @change="(event) => setFieldValue(field, event.target.checked)"
                  />
                  <span class="switch-slider" aria-hidden="true"></span>
                  <span class="switch-text">{{ Boolean(getFieldValue(field)) ? "开启" : "关闭" }}</span>
                </span>
              </label>

              <label v-else class="field-card">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                  <InlineHelpDot :text="field.help" />
                </strong>

                <BaseSelect
                  v-if="field.kind === 'select'"
                  :model-value="String(getFieldValue(field) ?? '')"
                  :options="field.options || []"
                  :placeholder="field.placeholder || ''"
                  :custom="true"
                  @update:model-value="(value) => setFieldValue(field, coerceValue(field, value))"
                />

                <textarea
                  v-else-if="field.kind === 'textarea'"
                  :rows="field.rows || 8"
                  :placeholder="field.placeholder || ''"
                  :value="String(getFieldValue(field) ?? '')"
                  @input="(event) => setFieldValue(field, event.target.value)"
                />

                <input
                  v-else
                  :type="field.kind === 'color' ? 'color' : field.kind === 'number' ? 'number' : 'text'"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :placeholder="field.placeholder || ''"
                  :value="getFieldValue(field)"
                  @input="(event) => setFieldValue(field, coerceValue(field, event.target.value))"
                />
              </label>
            </template>
          </div>
        </section>
      </div>

      <div class="detail-track detail-track-secondary" :class="{ 'is-empty': secondarySections.length <= 0 }">
        <section
          v-for="section in secondarySections"
          :key="section.key"
          class="detail-panel detail-ai-panel"
        >
          <div class="detail-section-head">
            <div>
              <strong class="field-title-row">
                <span>{{ section.title }}</span>
                <InlineHelpDot :text="section.help" />
              </strong>
            </div>
          </div>

          <div :class="resolveGridClass(section)">
            <template v-for="field in section.fields" :key="field.path || field.label">
              <div v-if="field.kind === 'notice'" class="field-card field-card-notice">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                </strong>
                <span v-for="line in field.lines || []" :key="line">{{ line }}</span>
              </div>

              <label v-else-if="field.kind === 'boolean'" class="field-card">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                  <InlineHelpDot :text="field.help" />
                </strong>
                <span class="field-toggle switch-field">
                  <input
                    type="checkbox"
                    :checked="Boolean(getFieldValue(field))"
                    @change="(event) => setFieldValue(field, event.target.checked)"
                  />
                  <span class="switch-slider" aria-hidden="true"></span>
                  <span class="switch-text">{{ Boolean(getFieldValue(field)) ? "开启" : "关闭" }}</span>
                </span>
              </label>

              <label v-else class="field-card">
                <strong class="field-title-row">
                  <span>{{ field.label }}</span>
                  <InlineHelpDot :text="field.help" />
                </strong>

                <BaseSelect
                  v-if="field.kind === 'select'"
                  :model-value="String(getFieldValue(field) ?? '')"
                  :options="field.options || []"
                  :placeholder="field.placeholder || ''"
                  :custom="true"
                  @update:model-value="(value) => setFieldValue(field, coerceValue(field, value))"
                />

                <textarea
                  v-else-if="field.kind === 'textarea'"
                  :rows="field.rows || 8"
                  :placeholder="field.placeholder || ''"
                  :value="String(getFieldValue(field) ?? '')"
                  @input="(event) => setFieldValue(field, event.target.value)"
                />

                <input
                  v-else
                  :type="field.kind === 'color' ? 'color' : field.kind === 'number' ? 'number' : 'text'"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :placeholder="field.placeholder || ''"
                  :value="getFieldValue(field)"
                  @input="(event) => setFieldValue(field, coerceValue(field, event.target.value))"
                />
              </label>
            </template>
          </div>
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
