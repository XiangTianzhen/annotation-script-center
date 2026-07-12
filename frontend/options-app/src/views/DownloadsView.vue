<script setup>
import { computed, onMounted } from "vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import { useDownloadsStore } from "@/stores/downloads";
import { useSettingsStore } from "@/stores/settings";

const downloadsStore = useDownloadsStore();
const settingsStore = useSettingsStore();

const releaseItems = computed(() =>
  Array.isArray(downloadsStore.releases?.items) ? downloadsStore.releases.items : []
);

const selectedRelease = computed(() => {
  return (
    releaseItems.value.find((item) => item.version === downloadsStore.selectedVersion) ||
    releaseItems.value[0] ||
    null
  );
});

const latestRelease = computed(() => {
  return releaseItems.value.find((item) => item.isLatest) || releaseItems.value[0] || null;
});
const releaseOptions = computed(() =>
  releaseItems.value.map((item) => ({
    value: item.version,
    label: item.isLatest ? `v${item.version}（最新版）` : `v${item.version}`,
  }))
);
const selectedVersionModel = computed({
  get() {
    return String(downloadsStore.selectedVersion || releaseItems.value[0]?.version || "");
  },
  set(value) {
    downloadsStore.selectVersion(String(value || ""));
  },
});

const historyCount = computed(() =>
  Math.max(0, releaseItems.value.length - (latestRelease.value ? 1 : 0))
);

const releaseSource = computed(() =>
  downloadsStore.releases && typeof downloadsStore.releases === "object"
    ? downloadsStore.releases.source || {}
    : {}
);

function openReleaseUrl(url) {
  const target = String(url || "").trim();
  if (!target) {
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}

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
            这里集中分发 ZIP 扩展包。默认展示最新版，历史版本可通过下拉框切换。
          </p>
        </div>
      </div>

      <div v-if="downloadsStore.loading" class="admin-surface-card">
        <strong>正在读取版本列表</strong>
        <span class="summary-note">如果持续为空，请稍后手动刷新或直接打开外部目录。</span>
      </div>

      <div v-else-if="downloadsStore.error" class="admin-surface-card">
        <strong>版本列表加载失败</strong>
        <span class="summary-note">{{ downloadsStore.error }}</span>
      </div>

      <template v-else>
        <div id="public-download-summary" class="public-summary-strip">
          <article class="public-summary-card">
            <span class="summary-label">推荐版本</span>
            <strong>{{ latestRelease ? `v${latestRelease.version}` : "读取中" }}</strong>
            <span class="summary-note">下载并解压最新版 ZIP，通过浏览器开发者模式加载。</span>
          </article>
          <article class="public-summary-card">
            <span class="summary-label">历史版本</span>
            <strong>{{ historyCount }}</strong>
            <span class="summary-note">如需回退或保留旧版本，可从下拉框切换到历史版本。</span>
          </article>
          <article class="public-summary-card">
            <span class="summary-label">下载方式</span>
            <strong>仅 ZIP</strong>
            <span class="summary-note">仅提供手动下载、解压并加载的扩展包。</span>
          </article>
        </div>

        <section id="public-script-release-panel" class="admin-surface-card">
          <div class="admin-card-head">
            <strong>扩展版本下载</strong>
            <span>默认推荐最新版，历史版本可通过下拉框切换。</span>
          </div>

          <div v-if="releaseItems.length <= 0" class="status-text">
            正在读取版本列表；如果持续为空，请稍后手动刷新或直接打开外部目录。
          </div>

          <template v-else>
            <div v-if="selectedRelease" class="download-release-layout">
              <article class="download-release-highlight">
                <span class="summary-label">当前可分发最新版</span>
                <strong>{{ latestRelease ? `v${latestRelease.version}` : "未知版本" }}</strong>
                <span class="summary-note">发布时间：{{ latestRelease?.createdAt || "未知" }}</span>
                <p class="workspace-side-copy">
                  下载 ZIP 后先解压，再在 Chrome 或 Edge 的扩展管理页开启开发者模式并选择“加载已解压的扩展程序”。
                </p>
              </article>

              <div class="download-release-selector">
                <label class="project-download-row" for="public-release-version-select">
                  <span>选择下载版本</span>
                  <BaseSelect
                    id="public-release-version-select"
                    v-model="selectedVersionModel"
                    :options="releaseOptions"
                    :custom="true"
                  />
                </label>

                <div class="download-release-current">
                  <div class="admin-runtime-list">
                    <div>
                      <strong>当前选择</strong>
                      <span>{{ `v${selectedRelease.version}` }}</span>
                    </div>
                    <div>
                      <strong>可下载格式</strong>
                      <span>仅 ZIP</span>
                    </div>
                    <div>
                      <strong>版本时间</strong>
                      <span>{{ selectedRelease.createdAt || "未知" }}</span>
                    </div>
                  </div>

                  <div class="download-release-actions">
                    <button
                      v-if="selectedRelease.zipUrl"
                      type="button"
                      class="primary-button"
                      @click="openReleaseUrl(selectedRelease.zipUrl)"
                    >
                      下载 ZIP
                    </button>
                    <button
                      type="button"
                      class="ghost-button"
                      @click="openReleaseUrl(releaseSource.directoryIndexUrl)"
                    >
                      查看外部目录
                    </button>
                  </div>

                  <div class="status-text">
                    如最新版本暂未出现，请稍后刷新，或通过外部目录确认服务器分发目录是否已经更新。
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
      </template>
    </section>
  </section>
</template>
