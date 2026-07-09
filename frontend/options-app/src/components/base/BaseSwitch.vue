<script setup>
const model = defineModel({
  type: Boolean,
  default: false,
});

defineProps({
  label: {
    type: String,
    default: "",
  },
  help: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="switch-row">
    <div class="switch-copy">
      <strong>{{ label }}</strong>
      <p v-if="help">{{ help }}</p>
    </div>
    <button
      type="button"
      class="switch-button"
      :class="{ 'is-on': model }"
      :aria-pressed="String(model)"
      @click="model = !model"
    />
  </div>
</template>
