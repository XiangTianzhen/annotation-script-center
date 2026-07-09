<script setup>
import { computed, onMounted } from "vue";
import SectionCard from "@/components/base/SectionCard.vue";
import { useDownloadsStore } from "@/stores/downloads";
import { useSettingsStore } from "@/stores/settings";

const downloadsStore = useDownloadsStore();
const settingsStore = useSettingsStore();

const selectedRelease = computed(() => {
  const items = Array.isArray(downloadsStore.releases?.items) ? downloadsStore.releases.items : [];
  return (
    items.find((item) => item.version === downloadsStore.selectedVersion) ||
    items[0] ||
    null
  );
});

onMounted(async () => {
  if (!downloadsStore.releases && !downloadsStore.loading) {
    await downloadsStore.hydrate(settingsStore.settings || {});
  }
});
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <p class="page-eyebrow">Downloads</p>
      <div class="page-title-row">
        <div>
          <h2>下载中心</h2>
          <p class="page-subtitle">
            新路由下继续保留公开下载中心，不混入脚本详情页的自定义下拉样式。这里直接读取统一后端的版本列表。
          </p>
        </div>
      </div>
    </section>

    <SectionCard title="版本列表" description="CRX 与 ZIP 仍然沿用现有发布目录与后端聚合逻辑。">
      <div v-if="downloadsStore.loading" class="empty-state">
        <div class="empty-copy">
          <strong>正在加载版本列表</strong>
          <p>稍等片刻，我们正在从统一后端读取下载中心数据。</p>
        </div>
      </div>

      <div v-else-if="downloadsStore.error" class="empty-state">
        <div class="empty-copy">
          <strong>版本列表加载失败</strong>
          <p>{{ downloadsStore.error }}</p>
        </div>
      </div>

      <div v-else class="download-grid">
        <article
          v-for="item in downloadsStore.releases?.items || []"
          :key="item.version"
          class="option-row"
        >
          <div class="asset-copy">
            <strong>v{{ item.version }}</strong>
            <p>发布时间：{{ item.createdAt || "未知" }}</p>
            <span
              class="status-badge"
              :class="item.isLatest ? 'is-enabled' : 'is-info'"
            >
              {{ item.isLatest ? "最新版本" : "历史版本" }}
            </span>
          </div>
          <div class="button-row wrap">
            <button
              type="button"
              class="soft-button"
              @click="downloadsStore.selectVersion(item.version)"
            >
              查看详情
            </button>
            <a
              v-if="item.crxUrl"
              class="button"
              :href="item.crxUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              下载 CRX
            </a>
            <a
              v-if="item.zipUrl"
              class="ghost-button"
              :href="item.zipUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              下载 ZIP
            </a>
          </div>
        </article>
      </div>
    </SectionCard>

    <SectionCard
      v-if="selectedRelease"
      :title="`当前查看：v${selectedRelease.version}`"
      description="用于替代旧下载页的右侧详情区。"
    >
      <div class="field-stack">
        <div class="info-row">
          <strong>是否最新</strong>
          <span class="status-badge" :class="selectedRelease.isLatest ? 'is-enabled' : 'is-info'">
            {{ selectedRelease.isLatest ? "是" : "否" }}
          </span>
        </div>
        <div class="info-row">
          <strong>CRX 下载</strong>
          <a
            v-if="selectedRelease.crxUrl"
            class="ghost-button"
            :href="selectedRelease.crxUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            打开链接
          </a>
          <span v-else class="inline-meta">暂无</span>
        </div>
        <div class="info-row">
          <strong>ZIP 下载</strong>
          <a
            v-if="selectedRelease.zipUrl"
            class="ghost-button"
            :href="selectedRelease.zipUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            打开链接
          </a>
          <span v-else class="inline-meta">暂无</span>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
