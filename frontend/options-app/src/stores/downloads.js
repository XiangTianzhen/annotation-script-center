import { defineStore } from "pinia";
import { loadDownloadCenterReleases } from "@/services/admin-service";

export const useDownloadsStore = defineStore("downloads", {
  state: () => ({
    releases: null,
    loading: false,
    error: "",
    selectedVersion: "",
  }),
  actions: {
    async hydrate(settings) {
      this.loading = true;
      this.error = "";
      try {
        const result = await loadDownloadCenterReleases(settings || {});
        if (!result.response.ok || result.body?.success !== true) {
          this.error = "下载中心版本列表加载失败。";
          this.releases = null;
          return null;
        }
        this.releases = result.body.data || {};
        this.selectedVersion = String(this.releases?.latestVersion || "");
        return this.releases;
      } catch (error) {
        this.error = error?.message || String(error);
        this.releases = null;
        return null;
      } finally {
        this.loading = false;
      }
    },
    selectVersion(version) {
      this.selectedVersion = String(version || "");
    },
  },
});
