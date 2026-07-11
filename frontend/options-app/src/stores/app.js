import { defineStore } from "pinia";
import { getManifestName, getManifestVersion } from "@/services/globals";

export const useAppStore = defineStore("app", {
  state: () => ({
    extensionName: getManifestName(),
    version: getManifestVersion(),
    toast: {
      visible: false,
      message: "",
      tone: "info",
    },
    initialized: false,
  }),
  actions: {
    setInitialized(value) {
      this.initialized = value === true;
    },
    showToast(message, tone = "info") {
      this.toast.visible = true;
      this.toast.message = String(message || "");
      this.toast.tone = String(tone || "info");
      globalThis.clearTimeout?.(this._toastTimer);
      this._toastTimer = globalThis.setTimeout?.(() => {
        this.hideToast();
      }, 2400);
    },
    hideToast() {
      this.toast.visible = false;
    },
  },
});
