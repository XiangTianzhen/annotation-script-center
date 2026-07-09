<script setup>
import { computed, onMounted, ref } from "vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import {
  loadAiCallLogOptions,
  loadProjectDataDownloadOptions,
} from "@/services/admin-service";
import { getProjectDownloadSupplierHelper } from "@/services/globals";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const adminStore = useAdminStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const supplierHelper = getProjectDownloadSupplierHelper();

const projectDatasets = ref([]);
const aiDatasets = ref([]);
const projectDataset = ref("");
const projectSupplier = ref("__all__");
const projectOperator = ref(settingsStore.settings?.meta?.aiUsageOperatorName || "");
const aiDataset = ref("");
const aiOperator = ref(settingsStore.settings?.meta?.aiUsageOperatorName || "");
const dateFrom = ref("");
const dateTo = ref("");
const projectStatus = ref("");
const aiStatus = ref("");

const currentProjectDataset = computed(
  () => projectDatasets.value.find((item) => item.id === projectDataset.value) || null
);

const supplierState = computed(() => {
  const builder =
    typeof supplierHelper.buildProjectDownloadSupplierState === "function"
      ? supplierHelper.buildProjectDownloadSupplierState
      : (dataset) => ({
          showRow: Array.isArray(dataset?.suppliers) && dataset.suppliers.length > 0,
          options: (dataset?.suppliers || []).map((item) => ({ value: item, label: item })),
        });
  return builder(currentProjectDataset.value || {});
});

async function loadOptions() {
  const [projectResult, aiResult] = await Promise.all([
    loadProjectDataDownloadOptions(settingsStore.settings || {}),
    loadAiCallLogOptions(settingsStore.settings || {}),
  ]);
  projectDatasets.value =
    projectResult.response.ok && projectResult.body?.success === true
      ? projectResult.body.data || []
      : [];
  aiDatasets.value =
    aiResult.response.ok && aiResult.body?.success === true
      ? aiResult.body.data || []
      : [];
  projectDataset.value = projectDatasets.value[0]?.id || "";
  aiDataset.value =
    aiDatasets.value.find((item) => item.hasData !== false)?.id ||
    aiDatasets.value[0]?.id ||
    "";
}

async function requestProjectExport() {
  projectStatus.value = "正在申请短期下载链接...";
  const result = await adminStore.requestProjectDownload(
    settingsStore.settings || {},
    authStore.session,
    {
      dataset: projectDataset.value,
      supplier: projectSupplier.value,
      operatorName: projectOperator.value,
    }
  );
  if (result.authFailed) {
    projectStatus.value = "管理员会话已失效，请重新登录。";
    return;
  }
  if (!result.response.ok || result.body?.success !== true) {
    projectStatus.value = result.body?.message || "项目数据导出失败。";
    return;
  }
  adminStore.triggerDownload(result.body.data?.downloadUrl || "");
  projectStatus.value = "下载链接已生成，已在新窗口打开。";
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
  <div class="admin-workspace admin-stage">
    <section class="admin-stage-banner">
      <div class="admin-stage-copy">
        <strong>系统导出</strong>
        <p>项目数据导出和 AI 调用日志导出继续走原有后台接口与下载链路。</p>
      </div>
    </section>

    <div class="admin-download-grid">
      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>项目数据导出</strong>
          <span>供应商逻辑仍然复用现有共享 helper，不额外改动字段契约。</span>
        </div>

        <label class="field-card">
          <strong>数据类型</strong>
          <BaseSelect v-model="projectDataset" :options="projectDatasets.map((item) => ({ value: item.id, label: item.label }))" />
        </label>

        <label v-if="supplierState.showRow" class="field-card">
          <strong>供应商</strong>
          <BaseSelect v-model="projectSupplier" :options="supplierState.options" />
        </label>

        <label class="field-card">
          <strong>获取人姓名</strong>
          <input v-model="projectOperator" type="text" />
        </label>

        <div class="field-actions">
          <button type="button" class="primary-button" @click="requestProjectExport">导出项目数据</button>
        </div>
        <p v-if="projectStatus" class="status-text">{{ projectStatus }}</p>
      </section>

      <section class="admin-surface-card">
        <div class="admin-card-head">
          <strong>AI 调用记录导出</strong>
          <span>日期范围与脚本类型继续走原有后台选项接口。</span>
        </div>

        <label class="field-card">
          <strong>脚本类型</strong>
          <BaseSelect v-model="aiDataset" :options="aiDatasets.map((item) => ({ value: item.id, label: item.label }))" />
        </label>

        <label class="field-card">
          <strong>获取人姓名</strong>
          <input v-model="aiOperator" type="text" />
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
          <button type="button" class="primary-button" @click="requestAiExport">导出 AI 调用记录</button>
        </div>
        <p v-if="aiStatus" class="status-text">{{ aiStatus }}</p>
      </section>
    </div>
  </div>
</template>
