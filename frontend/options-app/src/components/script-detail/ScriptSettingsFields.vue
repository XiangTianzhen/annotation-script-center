<script setup>
import BaseSelect from "@/components/base/BaseSelect.vue";
import InlineHelpDot from "@/components/base/InlineHelpDot.vue";
import { deepGet } from "@/utils/clone";

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update-field"]);

function getFieldValue(field) {
  if (field.kind === "boolean") {
    return Boolean(deepGet(props.modelValue, field.path, field.defaultValue ?? false));
  }
  return deepGet(props.modelValue, field.path, field.defaultValue ?? "");
}

function isFieldVisible(field) {
  const condition = field?.visibleWhen;
  if (!condition || typeof condition !== "object") return true;
  const current = deepGet(props.modelValue, condition.path, undefined);
  if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
    return current === condition.equals;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) {
    return current !== condition.notEquals;
  }
  if (Array.isArray(condition.in)) {
    return condition.in.includes(current);
  }
  if (condition.truthy === true) return Boolean(current);
  if (condition.truthy === false) return !current;
  return true;
}

function emitFieldValue(field, value) {
  let nextValue = value;
  if (field.valueType === "number" && value !== "") {
    const numeric = Number(value);
    nextValue = Number.isFinite(numeric) ? numeric : value;
  }
  emit("update-field", field, nextValue);
}

function fieldRange(field, key) {
  if (!field?.ranges) return field?.[key];
  const unit = String(props.modelValue?.segmentSilenceThresholdUnit || "db");
  return field.ranges?.[unit]?.[key] ?? field?.[key];
}

function gridClass(group) {
  const layout = ["single", "two", "three"].includes(group?.layout)
    ? group.layout
    : "two";
  return `settings-field-grid ${layout}`;
}
</script>

<template>
  <div class="script-settings-groups">
    <section
      v-for="group in groups"
      :key="group.key || group.title"
      class="script-settings-group"
    >
      <div v-if="group.title" class="script-settings-group-head">
        <strong>{{ group.title }}</strong>
        <span v-if="group.description">{{ group.description }}</span>
      </div>

      <div :class="gridClass(group)">
        <template v-for="field in group.fields || []" :key="field.path || field.label">
          <div
            v-if="field.kind === 'notice' && isFieldVisible(field)"
            class="field-card field-card-notice"
            :data-field-path="field.path || null"
          >
            <strong class="field-title-row">
              <span>{{ field.label }}</span>
              <InlineHelpDot v-if="field.help" :text="field.help" />
            </strong>
            <span v-for="line in field.lines || []" :key="line">{{ line }}</span>
          </div>

          <label
            v-else-if="field.kind === 'boolean' && isFieldVisible(field)"
            class="field-card"
            :class="{ 'is-disabled': field.disabled }"
            :data-field-path="field.path"
          >
            <strong class="field-title-row">
              <span>{{ field.label }}</span>
              <InlineHelpDot :text="field.help" />
            </strong>
            <span class="field-toggle switch-field">
              <input
                type="checkbox"
                :checked="Boolean(getFieldValue(field))"
                :disabled="field.disabled === true"
                @change="emitFieldValue(field, $event.target.checked)"
              />
              <span class="switch-slider" aria-hidden="true"></span>
              <span class="switch-text">
                {{ field.disabled ? "固定关闭" : Boolean(getFieldValue(field)) ? "开启" : "关闭" }}
              </span>
            </span>
          </label>

          <label
            v-else-if="isFieldVisible(field)"
            class="field-card"
            :class="{
              'field-card-textarea': field.kind === 'textarea',
              'is-disabled': field.disabled,
            }"
            :data-field-path="field.path"
          >
            <strong class="field-title-row">
              <span>{{ field.label }}</span>
              <InlineHelpDot :text="field.help" />
            </strong>

            <BaseSelect
              v-if="field.kind === 'select'"
              :model-value="String(getFieldValue(field) ?? '')"
              :options="field.options || []"
              :placeholder="field.placeholder || ''"
              :disabled="field.disabled === true"
              :custom="true"
              @update:model-value="emitFieldValue(field, $event)"
            />

            <textarea
              v-else-if="field.kind === 'textarea'"
              :rows="field.rows || 8"
              :maxlength="field.maxLength || null"
              :placeholder="field.placeholder || ''"
              :disabled="field.disabled === true"
              :value="String(getFieldValue(field) ?? '')"
              @input="emitFieldValue(field, $event.target.value)"
            />

            <input
              v-else
              :type="field.kind === 'color' ? 'color' : field.kind === 'number' ? 'number' : 'text'"
              :min="fieldRange(field, 'min')"
              :max="fieldRange(field, 'max')"
              :step="fieldRange(field, 'step')"
              :placeholder="field.placeholder || ''"
              :disabled="field.disabled === true"
              :value="getFieldValue(field)"
              @input="emitFieldValue(field, $event.target.value)"
            />
          </label>
        </template>
      </div>
    </section>
  </div>
</template>
