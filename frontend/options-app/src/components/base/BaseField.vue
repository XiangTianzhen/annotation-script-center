<script setup>
defineProps({
  label: {
    type: String,
    default: "",
  },
  help: {
    type: String,
    default: "",
  },
  note: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <label class="field-block">
    <span v-if="label" class="field-label">{{ label }}</span>
    <span v-if="help" class="field-help">{{ help }}</span>
    <div class="field-control">
      <slot />
    </div>
    <span v-if="note" class="field-note">{{ note }}</span>
  </label>
</template>
