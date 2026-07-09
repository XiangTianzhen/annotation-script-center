<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BaseSelect from "@/components/base/BaseSelect.vue";
import ShortcutEditor from "@/components/script-detail/ShortcutEditor.vue";
import { isScriptRuntimeAccessible } from "@/services/globals";
import {
  getScriptConfig,
  getScriptFieldGroups,
  getScriptJsonPathLabel,
  getScriptShortcutActions,
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
const jsonText = ref("");
const draftConfig = ref({});

const scriptId = computed(() => String(route.params.scriptId || "").trim());
const script = computed(() => scriptsStore.getScript(scriptId.value));
const fieldGroups = computed(() => getScriptFieldGroups(scriptId.value));
const shortcutActions = computed(() => getScriptShortcutActions(scriptId.value));
const runtimeEnabled = computed(() =>
  isScriptRuntimeAccessible(scriptId.value, settingsStore.settings || {})
);
const runtimeStatusText = computed(() => (runtimeEnabled.value ? "当前启用" : "当前未启用"));
const runtimeStatusTone = computed(() => (runtimeEnabled.value ? "enabled" : "disabled"));
const workbenchSingle = computed(() => shortcutActions.value.length === 0);

function syncDraftFromSettings() {
  const nextConfig = getScriptConfig(settingsStore.settings || {}, scriptId.value);
  draftConfig.value = nextConfig;
  jsonText.value = JSON.stringify(nextConfig, null, 2);
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
  jsonText.value = JSON.stringify(next, null, 2);
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

function resolveGroupGridClass(group) {
  if (group.layout === "single") {
    return "detail-grid single";
  }
  if (group.layout === "three") {
    return "detail-grid three";
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

async function saveJson() {
  try {
    draftConfig.value = JSON.parse(jsonText.value || "{}");
  } catch (error) {
    appStore.showToast("JSON 解析失败：" + (error?.message || String(error)), "error");
    return;
  }
  await saveForm();
}

async function toggleScriptEnabled() {
  await settingsStore.toggleScript(scriptId.value, !runtimeEnabled.value);
  scriptsStore.sync(settingsStore.settings || {});
  syncDraftFromSettings();
  appStore.showToast(runtimeEnabled.value ? "脚本已启用。" : "脚本已关闭。", "success");
}
</script>

<template>
  <section v-if="script" class="detail-shell">
    <div class="detail-top">
      <div class="detail-title">
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
        <button id="detail-toggle-button" class="primary-button" type="button" @click="toggleScriptEnabled">
          {{ runtimeEnabled ? "关闭脚本" : "启用脚本" }}
        </button>
        <button class="secondary-button" type="button" :disabled="saving" @click="saveForm">
          {{ saving ? "保存中..." : "保存设置" }}
        </button>
      </div>
      <p id="detail-script-note" class="detail-note">
        {{ script.note || "脚本详情页继续沿用共享 storage 作为真实值源。" }}
      </p>
    </section>

    <div class="detail-workbench" :class="{ 'is-single': workbenchSingle }">
      <div class="detail-track detail-track-primary">
        <section
          v-for="group in fieldGroups"
          :key="group.title"
          class="detail-panel detail-panel-base"
        >
          <div class="detail-section-head">
            <div>
              <strong>{{ group.title }}</strong>
              <span v-if="group.description">{{ group.description }}</span>
            </div>
          </div>

          <div :class="resolveGroupGridClass(group)">
            <template v-for="field in group.fields" :key="field.path || field.label">
              <div v-if="field.kind === 'notice'" class="field-card">
                <strong>{{ field.label }}</strong>
                <span v-for="line in field.lines || []" :key="line">{{ line }}</span>
              </div>

              <label v-else-if="field.kind === 'boolean'" class="field-card">
                <strong>{{ field.label }}</strong>
                <span v-if="field.help">{{ field.help }}</span>
                <span class="field-toggle">
                  <input
                    type="checkbox"
                    :checked="Boolean(getFieldValue(field))"
                    @change="(event) => setFieldValue(field, event.target.checked)"
                  />
                  <span>{{ Boolean(getFieldValue(field)) ? "已开启" : "未开启" }}</span>
                </span>
              </label>

              <label v-else class="field-card">
                <strong>{{ field.label }}</strong>
                <span v-if="field.help">{{ field.help }}</span>

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
                  :rows="field.rows || 6"
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

      <div class="detail-track detail-track-secondary">
        <section class="detail-panel detail-panel-base">
          <div class="detail-section-head">
            <div>
              <strong>脚本说明</strong>
              <span>{{ script.note || "暂无额外说明。" }}</span>
            </div>
          </div>
          <div class="detail-grid single">
            <div class="field-card">
              <strong>脚本 ID</strong>
              <span>{{ script.id }}</span>
            </div>
            <div class="field-card">
              <strong>能力范围</strong>
              <span>{{ script.capabilityScope || "未标注" }}</span>
            </div>
            <div class="field-card">
              <strong>配置路径</strong>
              <span>{{ getScriptJsonPathLabel(scriptId) || "当前脚本未配置 JSON 路径" }}</span>
            </div>
          </div>
        </section>

        <section
          v-if="shortcutActions.length > 0"
          class="detail-panel detail-shortcut-panel"
        >
          <div class="detail-section-head">
            <div>
              <strong>快捷键</strong>
              <span>录制逻辑已经迁到 Vue 组件，但保存后的字段口径继续保持旧版结构。</span>
            </div>
          </div>
          <ShortcutEditor
            :model-value="draftConfig.shortcuts || {}"
            :actions="shortcutActions"
            @update:model-value="(value) => setFieldValue({ path: 'shortcuts' }, value)"
          />
        </section>

        <section class="detail-panel detail-panel-base">
          <div class="detail-section-head">
            <div>
              <strong>高级 JSON 编辑</strong>
              <span>{{ getScriptJsonPathLabel(scriptId) }}</span>
            </div>
          </div>
          <div class="detail-grid single">
            <label class="field-card">
              <strong>当前脚本配置 JSON</strong>
              <textarea
                rows="18"
                :value="jsonText"
                @input="(event) => (jsonText = event.target.value)"
              />
            </label>
          </div>
          <div class="field-actions">
            <button type="button" class="primary-button" :disabled="saving" @click="saveForm">
              {{ saving ? "保存中..." : "保存当前表单" }}
            </button>
            <button type="button" class="ghost-button" :disabled="saving" @click="saveJson">
              从 JSON 覆盖保存
            </button>
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
