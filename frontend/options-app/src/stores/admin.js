import { defineStore } from "pinia";
import { requestAdminJson } from "@/services/admin-service";
import { buildBackendUrl, getConstants } from "@/services/globals";
import { clone } from "@/utils/clone";

function normalizeText(value) {
  return String(value || "").trim();
}

function getDownloadClientInfo() {
  return {
    userAgent: normalizeText(globalThis.navigator?.userAgent || ""),
    href: normalizeText(globalThis.location?.href || ""),
  };
}

export const useAdminStore = defineStore("admin", {
  state: () => ({
    dashboard: null,
    dashboardLoading: false,
    dashboardError: "",
    backendDraft: null,
    projectDownloadStatus: "",
    aiCallLogStatus: "",
  }),
  actions: {
    syncDraft(settings) {
      const constants = getConstants();
      const getMode =
        typeof constants.getBackendEndpointModeFromSettings === "function"
          ? constants.getBackendEndpointModeFromSettings
          : function () {
              return "server";
            };
      const getBaseUrls =
        typeof constants.getBackendBaseUrlsFromSettings === "function"
          ? constants.getBackendBaseUrlsFromSettings
          : function () {
              return { server: "", local: "", beta: "" };
            };
      this.backendDraft = {
        backendEndpointMode: getMode(settings || {}),
        backendBaseUrls: clone(getBaseUrls(settings || {})),
      };
    },
    async loadDashboard(settings, session) {
      this.dashboardLoading = true;
      this.dashboardError = "";
      try {
        const [overview, runtimeLogs] = await Promise.all([
          requestAdminJson("/api/admin/dashboard/overview", settings || {}, session, {
            method: "GET",
          }),
          requestAdminJson("/api/admin/dashboard/runtime-logs?limit=20", settings || {}, session, {
            method: "GET",
          }),
        ]);
        if (overview.authFailed || runtimeLogs.authFailed) {
          this.dashboardError = "管理员会话已失效，请重新输入密码。";
          return null;
        }
        if (!overview.response.ok || overview.body?.success !== true) {
          this.dashboardError = normalizeText(overview.body?.message || "系统仪表盘加载失败。");
          return null;
        }
        this.dashboard = {
          ...(overview.body.data || {}),
          runtimeLogs:
            runtimeLogs.response?.ok && runtimeLogs.body?.success === true
              ? runtimeLogs.body.data || {}
              : {
                  items: [],
                  errorMessage: normalizeText(runtimeLogs.body?.message || "运行日志加载失败。"),
                },
        };
        return this.dashboard;
      } finally {
        this.dashboardLoading = false;
      }
    },
    async saveBackendDraft(settingsStore, appStore) {
      if (!this.backendDraft) {
        return false;
      }
      const nextPatch = {
        meta: {
          backendEndpointMode: this.backendDraft.backendEndpointMode,
          backendBaseUrls: clone(this.backendDraft.backendBaseUrls || {}),
        },
      };
      await settingsStore.persistPatch(nextPatch);
      this.syncDraft(settingsStore.settings);
      appStore.showToast("后端设置已保存。", "success");
      return true;
    },
    async requestProjectDownload(settings, session, payload) {
      return requestAdminJson("/api/admin/project-data-download/request", settings || {}, session, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          clientInfo: getDownloadClientInfo(),
        }),
      });
    },
    async requestAiCallLogDownload(settings, session, payload) {
      return requestAdminJson("/api/admin/ai-call-log/request", settings || {}, session, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          clientInfo: getDownloadClientInfo(),
        }),
      });
    },
    triggerDownload(url) {
      const anchor = document.createElement("a");
      anchor.href = buildBackendUrl(url, {});
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    },
  },
});
