<script setup>
defineProps({
  message: {
    type: String,
    default: "",
  },
  tone: {
    type: String,
    default: "info",
  },
  visible: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible && message"
      class="options-toast"
      :class="{
        'is-success': tone === 'success',
        'is-error': tone === 'error',
        'is-warning': tone === 'warning',
      }"
    >
      {{ message }}
    </div>
  </transition>
</template>
