<script setup>
import AdminTabStrip from "@/components/admin/AdminTabStrip.vue";
import AdminToolbar from "@/components/admin/AdminToolbar.vue";

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
  <div class="admin-workspace admin-stage">
    <section class="hero hero-compact hero-mode-admin admin-page-hero">
      <div class="hero-top">
        <div>
          <span class="hero-kicker">SYSTEM MANAGEMENT</span>
          <h1>标注脚本中心</h1>
          <p>系统管理统一承载后端设置、数据导出与系统仪表盘；进入前需要管理员密码验证。</p>
        </div>
      </div>
    </section>

    <AdminToolbar />
    <AdminTabStrip />

    <section class="admin-tab-panel admin-content">
      <div class="admin-panel-head">
        <div>
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
        </div>
      </div>
      <slot />
    </section>
  </div>
</template>
