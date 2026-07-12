import { defineStore } from "pinia";
import {
  loadSettings,
  patchSettings,
  saveProjectSettings,
  saveSettings,
  setScriptEnabled,
} from "@/services/storage-service";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: null,
    loading: false,
    saving: false,
    error: "",
  }),
  getters: {
    hasSettings(state) {
      return Boolean(state.settings);
    },
  },
  actions: {
    async hydrate() {
      this.loading = true;
      this.error = "";
      try {
        this.settings = await loadSettings();
      } catch (error) {
        this.error = error?.message || String(error);
      } finally {
        this.loading = false;
      }
      return this.settings;
    },
    async persist(nextSettings) {
      this.saving = true;
      this.error = "";
      try {
        this.settings = await saveSettings(nextSettings);
        return this.settings;
      } catch (error) {
        this.error = error?.message || String(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },
    async persistPatch(nextPatch) {
      this.saving = true;
      this.error = "";
      try {
        this.settings = await patchSettings(nextPatch);
        return this.settings;
      } catch (error) {
        this.error = error?.message || String(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },
    async toggleScript(scriptId, enabled) {
      this.saving = true;
      this.error = "";
      try {
        this.settings = await setScriptEnabled(scriptId, enabled);
        return this.settings;
      } catch (error) {
        this.error = error?.message || String(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },
    async persistProject(projectId, patch) {
      this.saving = true;
      this.error = "";
      try {
        this.settings = await saveProjectSettings(projectId, patch);
        return this.settings;
      } catch (error) {
        this.error = error?.message || String(error);
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});
