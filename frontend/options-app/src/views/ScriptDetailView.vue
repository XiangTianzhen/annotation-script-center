<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BaseField from "@/components/base/BaseField.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSwitch from "@/components/base/BaseSwitch.vue";
import BaseTextarea from "@/components/base/BaseTextarea.vue";
import SectionCard from "@/components/base/SectionCard.vue";
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
  return deepGet(draftConfig.value || {}, field.path, field.kind === "boolean" ? false : "");
}

function setFieldValue(field, value) {
  const next = clone(draftConfig.value || {});
  deepSet(next, field.path, value);
  draftConfig.value = next;
  jsonText.value = JSON.stringify(next, null, 2);
}

function coerceValue(field, rawValue) {
  if (field.kind === "number") {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      return "";
    }
    const numeric = Number(rawValue);
    return Number.isFinite(numeric) ? numeric : "";
  }
  return rawValue;
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
  <div v-if="script" class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Script Detail</p>
      <div class="page-title-row">
        <div>
          <h2>{{ script.label }}</h2>
          <p class="page-subtitle">
            {{ script.description }}
          </p>
        </div>
        <span class="status-badge" :class="runtimeEnabled ? 'is-enabled' : 'is-warning'">
          {{ runtimeEnabled ? "当前启用" : "当前未启用" }}
        </span>
      </div>
    </section>

    <div class="detail-grid two-column">
      <div class="page-stack">
        <SectionCard title="运行时状态" description="脚本启停仍然以共享 storage 为真实值源。">
          <BaseSwitch
            :model-value="runtimeEnabled"
            label="启用当前脚本"
            :help="runtimeEnabled ? '关闭后不再注入或展示对应脚本能力。' : '启用后会继续沿用旧版脚本的运行时逻辑。'"
            @update:model-value="toggleScriptEnabled"
          />
        </SectionCard>

        <SectionCard
          v-for="group in fieldGroups"
          :key="group.title"
          :title="group.title"
        >
          <div class="field-stack">
            <template v-for="field in group.fields" :key="field.path">
              <BaseSwitch
                v-if="field.kind === 'boolean'"
                :model-value="Boolean(getFieldValue(field))"
                :label="field.label"
                :help="field.help || ''"
                @update:model-value="(value) => setFieldValue(field, value)"
              />

              <BaseField v-else :label="field.label" :help="field.help || ''">
                <BaseSelect
                  v-if="field.kind === 'select'"
                  :model-value="String(getFieldValue(field) ?? '')"
                  :options="field.options || []"
                  :custom="true"
                  @update:model-value="(value) => setFieldValue(field, value)"
                />
                <BaseTextarea
                  v-else-if="field.kind === 'textarea'"
                  :model-value="String(getFieldValue(field) ?? '')"
                  @update:model-value="(value) => setFieldValue(field, value)"
                />
                <input
                  v-else
                  class="base-input"
                  :type="field.kind === 'number' ? 'number' : 'text'"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :value="getFieldValue(field)"
                  @input="(event) => setFieldValue(field, coerceValue(field, event.target.value))"
                />
              </BaseField>
            </template>
          </div>
        </SectionCard>

        <SectionCard
          v-if="shortcutActions.length > 0"
          title="快捷键"
          description="录制逻辑已迁到 Vue 组件，保存时仍直接写回原有 shortcuts 字段。"
        >
          <ShortcutEditor
            :model-value="draftConfig.shortcuts || {}"
            :actions="shortcutActions"
            @update:model-value="(value) => setFieldValue({ path: 'shortcuts' }, value)"
          />
        </SectionCard>
      </div>

      <div class="page-stack">
        <SectionCard title="脚本说明" :description="script.note || '暂无额外说明。'">
          <div class="field-stack">
            <div class="info-row">
              <strong>脚本 ID</strong>
              <span class="inline-meta">{{ script.id }}</span>
            </div>
            <div class="info-row">
              <strong>能力范围</strong>
              <span class="inline-meta">{{ script.capabilityScope || "未标注" }}</span>
            </div>
            <div class="info-row">
              <strong>匹配路由</strong>
              <span class="inline-meta">{{ script.matchUrl || "当前脚本没有显式 matchUrl" }}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="高级 JSON 编辑"
          :description="getScriptJsonPathLabel(scriptId)"
        >
          <div class="json-editor-stack">
            <BaseTextarea v-model="jsonText" :rows="18" placeholder="当前脚本配置 JSON" />
            <div class="button-row wrap">
              <button type="button" class="button" :disabled="saving" @click="saveForm">
                {{ saving ? "保存中..." : "保存当前表单" }}
              </button>
              <button type="button" class="ghost-button" :disabled="saving" @click="saveJson">
                从 JSON 覆盖保存
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  </div>

  <div v-else class="page-stack">
    <div class="empty-state">
      <div class="empty-copy">
        <strong>脚本不存在或当前版本不可见</strong>
        <p>该脚本不会再停留在旧 query 路由里，当前会直接回到新的 hash 路由体系。</p>
      </div>
    </div>
  </div>
</template>
