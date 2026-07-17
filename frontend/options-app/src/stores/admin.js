import { defineStore } from "pinia";
import {
  loadAiKeySlots,
  requestAdminJson,
  switchAiKeySlot,
} from "@/services/admin-service";
import { buildBackendUrl, getConstants } from "@/services/globals";
import { clone } from "@/utils/clone";

function normalizeText(value) {
  return String(value || "").trim();
}

function getAiKeySlotErrorMessage(result, fallbackMessage) {
  if (Number(result?.response?.status) === 404) {
    return "服务器尚未部署双密钥接口，无法保存。";
  }
  return normalizeText(result?.body?.message || fallbackMessage);
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
    aiKeySlots: null,
    aiKeySlotsLoading: false,
    aiKeySlotsError: "",
    aiKeySlotSwitchingId: "",
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
              return { server: "", local: "" };
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
    async loadAiKeySlots(settings, session) {
      this.aiKeySlotsLoading = true;
      this.aiKeySlotsError = "";
      try {
        const result = await loadAiKeySlots(settings || {}, session);
        if (result.authFailed) {
          this.aiKeySlotsError = "管理员会话已失效，请重新输入密码。";
          return { authFailed: true };
        }
        if (!result.response?.ok || result.body?.success !== true) {
          this.aiKeySlotsError = getAiKeySlotErrorMessage(result, "服务器 AI 密钥状态加载失败。");
          return null;
        }
        this.aiKeySlots = result.body.data || null;
        return this.aiKeySlots;
      } catch (error) {
        this.aiKeySlotsError = "服务器 AI 密钥状态加载失败。";
        return null;
      } finally {
        this.aiKeySlotsLoading = false;
      }
    },
    async switchAiKeySlot(settings, session, slotId) {
      const targetSlotId = normalizeText(slotId);
      if (!targetSlotId) {
        return null;
      }
      this.aiKeySlotSwitchingId = targetSlotId;
      this.aiKeySlotsError = "";
      try {
        const result = await switchAiKeySlot(settings || {}, session, targetSlotId);
        if (result.authFailed) {
          this.aiKeySlotsError = "管理员会话已失效，请重新输入密码。";
          return { authFailed: true };
        }
        if (!result.response?.ok || result.body?.success !== true) {
          this.aiKeySlotsError = getAiKeySlotErrorMessage(result, "服务器 AI 密钥切换失败。");
          return null;
        }
        this.aiKeySlots = result.body.data || null;
        return this.aiKeySlots;
      } catch (error) {
        this.aiKeySlotsError = "服务器 AI 密钥切换失败。";
        return null;
      } finally {
        this.aiKeySlotSwitchingId = "";
      }
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
