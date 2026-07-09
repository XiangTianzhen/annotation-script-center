<script setup>
import { computed, onMounted } from "vue";
import { useDownloadsStore } from "@/stores/downloads";
import { useSettingsStore } from "@/stores/settings";

const downloadsStore = useDownloadsStore();
const settingsStore = useSettingsStore();

const selectedRelease = computed(() => {
  const items = Array.isArray(downloadsStore.releases?.items) ? downloadsStore.releases.items : [];
  return items.find((item) => item.version === downloadsStore.selectedVersion) || items[0] || null;
});

onMounted(async () => {
  if (!downloadsStore.releases && !downloadsStore.loading) {
    await downloadsStore.hydrate(settingsStore.settings || {});
  }
});
</script>

<template>
  <section class="detail-shell">
    <section class="detail-panel download-center-shell">
      <div class="detail-top download-center-top">
        <div class="detail-title">
          <h2>脚本下载中心</h2>
          <p class="detail-copy">
            这里集中分发扩展版本。默认展示最新版，历史版本会保留在同一工作台里查看。
          </p>
        </div>
      </div>

      <div v-if="downloadsStore.loading" class="admin-surface-card">
        <strong>正在加载版本列表</strong>
        <span class="summary-note">稍等片刻，我们正在从统一后端读取下载中心数据。</span>
      </div>

      <div v-else-if="downloadsStore.error" class="admin-surface-card">
        <strong>版本列表加载失败</strong>
        <span class="summary-note">{{ downloadsStore.error }}</span>
      </div>

      <template v-else>
        <div class="admin-summary-grid">
          <div class="public-summary-card">
            <span class="summary-label">可用版本</span>
            <strong>{{ downloadsStore.releases?.items?.length || 0 }}</strong>
            <span class="summary-note">统一后端返回的当前可下载版本总数。</span>
          </div>
          <div class="public-summary-card">
            <span class="summary-label">当前查看</span>
            <strong>{{ selectedRelease?.version || "-" }}</strong>
            <span class="summary-note">右侧详情会跟随当前选中的版本变化。</span>
          </div>
          <div class="public-summary-card">
            <span class="summary-label">最新版本</span>
            <strong>{{ downloadsStore.releases?.latestVersion || "-" }}</strong>
            <span class="summary-note">最新版本仍直接对接现有发布目录。</span>
          </div>
        </div>

        <div class="admin-download-grid">
          <section class="admin-surface-card">
            <div class="admin-card-head">
              <strong>版本列表</strong>
              <span>CRX 与 ZIP 继续沿用当前发布目录与后端聚合逻辑。</span>
            </div>

            <div class="admin-runtime-log-list">
              <article
                v-for="item in downloadsStore.releases?.items || []"
                :key="item.version"
                class="admin-runtime-log-item"
              >
                <div class="asset-copy">
                  <strong>v{{ item.version }}</strong>
                  <p>发布时间：{{ item.createdAt || "未知" }}</p>
                  <span class="status-badge" :class="item.isLatest ? 'is-enabled' : 'is-info'">
                    {{ item.isLatest ? "最新版本" : "历史版本" }}
                  </span>
                </div>
                <div class="field-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    @click="downloadsStore.selectVersion(item.version)"
                  >
                    查看详情
                  </button>
                  <a
                    v-if="item.crxUrl"
                    class="primary-button"
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
          </section>

          <section v-if="selectedRelease" class="admin-surface-card">
            <div class="admin-card-head">
              <strong>当前查看：v{{ selectedRelease.version }}</strong>
              <span>用于替代旧下载页的右侧详情区。</span>
            </div>

            <div class="admin-runtime-list detail-runtime-list">
              <div>
                <strong>是否最新</strong>
                <span>{{ selectedRelease.isLatest ? "是" : "否" }}</span>
              </div>
              <div>
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
                <span v-else>暂无</span>
              </div>
              <div>
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
                <span v-else>暂无</span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </section>
  </section>
</template>
