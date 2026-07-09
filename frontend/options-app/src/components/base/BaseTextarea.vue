<script setup>
const model = defineModel({
  type: String,
  default: "",
});

defineProps({
  rows: {
    type: Number,
    default: 8,
  },
  placeholder: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <textarea
    v-model="model"
    class="base-textarea"
    :rows="rows"
    :placeholder="placeholder"
  />
</template>
