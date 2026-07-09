<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  { to: "/admin/overview", label: "仪表盘", match: "/admin/overview" },
  { to: "/admin/backend", label: "后端设置", match: "/admin/backend" },
  { to: "/admin/exports", label: "数据导出", match: "/admin/exports" },
];

const activePath = computed(() => String(route.path || ""));
</script>

<template>
  <nav class="admin-tab-strip" aria-label="系统管理页签">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      class="admin-nav-button"
      :class="{ active: activePath === tab.match }"
      :to="tab.to"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
