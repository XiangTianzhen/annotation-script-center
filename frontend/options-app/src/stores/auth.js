import { defineStore } from "pinia";
import {
  clearAdminSession,
  isAdminSessionExpired,
  persistAdminSession,
  restoreAdminSession,
  unlockAdminSession,
} from "@/services/admin-service";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    session: null,
    restoring: false,
    unlocking: false,
    message: "",
    tone: "neutral",
  }),
  getters: {
    isUnlocked(state) {
      return !isAdminSessionExpired(state.session);
    },
  },
  actions: {
    async restore() {
      this.restoring = true;
      try {
        this.session = await restoreAdminSession();
      } finally {
        this.restoring = false;
      }
      return this.session;
    },
    setStatus(message, tone = "neutral") {
      this.message = String(message || "");
      this.tone = String(tone || "neutral");
    },
    async unlock(settings, password, operatorName, remember) {
      this.unlocking = true;
      this.setStatus("正在校验管理员密码...", "pending");
      try {
        const result = await unlockAdminSession(settings, password, operatorName, remember);
        if (!result.response.ok || result.body?.success !== true) {
          const message =
            String(result.body?.message || "").trim() || "管理员鉴权失败，请稍后重试。";
          this.setStatus(message, "error");
          return false;
        }
        this.session = await persistAdminSession(result.body?.data || {}, remember);
        this.setStatus("验证成功，正在进入系统管理。", "success");
        return true;
      } catch (error) {
        this.setStatus("登录失败：" + (error?.message || String(error)), "error");
        return false;
      } finally {
        this.unlocking = false;
      }
    },
    async logout() {
      this.session = null;
      await clearAdminSession();
      this.setStatus("已退出系统管理登录。", "warning");
    },
  },
});
