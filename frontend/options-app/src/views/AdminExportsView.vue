<script setup>
import { computed, onMounted, ref } from "vue";
import AdminPageFrame from "@/components/admin/AdminPageFrame.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import { loadAiCallLogOptions } from "@/services/admin-service";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const aiDatasets = ref([]);
const aiDataset = ref("");
const aiOperator = ref(settingsStore.settings?.meta?.aiUsageOperatorName || "");
const dateFrom = ref("");
const dateTo = ref("");
const aiStatus = ref("");

const aiDatasetOptions = computed(() =>
  aiDatasets.value.map((item) => ({
    value: item.id,
    label: item.label,
  }))
);

const exportSummaryCards = computed(() => [
  {
    label: "AI 日志类型",
    value: String(aiDatasets.value.length),
    note: "按脚本类型和日期范围导出 AI 请求记录，便于排查和复盘。",
  },
  {
    label: "导出范围",
    value: "四脚本 AI 日志",
    note: "扩展版本下载位于公开脚本下载中心，这里只保留 AI 日志导出。",
  },
]);

async function loadOptions() {
  const aiResult = await loadAiCallLogOptions(settingsStore.settings || {});
  aiDatasets.value =
    aiResult.response.ok && aiResult.body?.success === true
      ? aiResult.body.data || []
      : [];
  aiDataset.value =
    aiDatasets.value.find((item) => item.hasData !== false)?.id ||
    aiDatasets.value[0]?.id ||
    "";
}

async function requestAiExport() {
  aiStatus.value = "正在申请 AI 日志下载链接...";
  const result = await adminStore.requestAiCallLogDownload(
    settingsStore.settings || {},
    authStore.session,
    {
      dataset: aiDataset.value,
      operatorName: aiOperator.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
    }
  );
  if (result.authFailed) {
    aiStatus.value = "管理员会话已失效，请重新登录。";
    return;
  }
  if (!result.response.ok || result.body?.success !== true) {
    aiStatus.value = result.body?.message || "AI 调用记录导出失败。";
    return;
  }
  adminStore.triggerDownload(result.body.data?.downloadUrl || "");
  aiStatus.value = "下载链接已生成，已在新窗口打开。";
}

onMounted(loadOptions);
</script>

<template>
  <AdminPageFrame
    title="数据导出"
    description="这里只保留四个正式脚本的 AI 请求记录导出；扩展版本下载位于公开脚本下载中心。"
  >
      <div id="admin-download-summary" class="admin-summary-grid">
        <article
          v-for="item in exportSummaryCards"
          :key="item.label"
          class="public-summary-card"
        >
          <span class="summary-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <span class="summary-note">{{ item.note }}</span>
        </article>
      </div>

      <div id="admin-download-grid" class="admin-download-grid">
        <section id="ai-call-log-download-panel" class="home-endpoint-card">
          <div class="admin-card-head">
            <strong>AI 调用记录导出</strong>
            <span>日期范围与脚本类型继续走原有后台选项接口。</span>
          </div>

          <label class="project-download-row">
            <span>脚本类型</span>
            <BaseSelect
              id="ai-call-log-dataset-select"
              v-model="aiDataset"
              :options="aiDatasetOptions"
              placeholder="请选择脚本类型"
              :custom="true"
            />
          </label>

          <label class="project-download-row">
            <span>获取人姓名</span>
            <input v-model="aiOperator" type="text" maxlength="60" placeholder="请输入获取人姓名" />
          </label>

          <div class="detail-grid two">
            <label class="field-card">
              <strong>开始日期</strong>
              <input v-model="dateFrom" type="date" />
            </label>
            <label class="field-card">
              <strong>结束日期</strong>
              <input v-model="dateTo" type="date" />
            </label>
          </div>

          <div class="field-actions">
            <button type="button" class="primary-button" @click="requestAiExport">导出记录</button>
          </div>
          <p v-if="aiStatus" class="status-text">{{ aiStatus }}</p>
        </section>
      </div>
  </AdminPageFrame>
</template>
