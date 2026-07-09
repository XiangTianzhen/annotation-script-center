<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { getSharedSelect } from "@/services/globals";

const model = defineModel({
  type: [String, Number],
  default: "",
});

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "",
  },
  custom: {
    type: Boolean,
    default: false,
  },
});

const selectRef = ref(null);

const normalizedOptions = computed(() =>
  props.options.map((option) => {
    if (option && typeof option === "object") {
      return {
        value: String(option.value ?? ""),
        label: String(option.label ?? option.value ?? ""),
      };
    }
    return {
      value: String(option ?? ""),
      label: String(option ?? ""),
    };
  })
);

async function syncCustomState() {
  await nextTick();
  if (!props.custom || !selectRef.value) {
    return;
  }
  const sharedSelect = getSharedSelect();
  if (typeof sharedSelect.syncCustomSelects === "function") {
    sharedSelect.syncCustomSelects(selectRef.value);
  }
  if (typeof sharedSelect.syncCustomSelectState === "function") {
    sharedSelect.syncCustomSelectState(selectRef.value);
  }
}

onMounted(syncCustomState);
watch(
  () => [model.value, props.options, props.custom],
  () => {
    void syncCustomState();
  },
  { deep: true }
);
</script>

<template>
  <select
    ref="selectRef"
    v-model="model"
    class="base-native-select"
    :data-options-custom-select="custom ? 'true' : null"
    :data-options-placeholder="custom && placeholder ? placeholder : null"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option
      v-for="option in normalizedOptions"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>
