<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <section class="section-card">
    <div v-if="title || description" class="card-title-row">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description" class="page-subtitle">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
