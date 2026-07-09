import { defineStore } from "pinia";
import { getVisiblePlatformLibrary } from "@/services/globals";

function normalizeText(value) {
  return String(value || "").trim();
}

export const useScriptsStore = defineStore("scripts", {
  state: () => ({
    platformLibrary: {},
    scriptLibrary: {},
    visiblePlatforms: [],
    visibleScripts: [],
  }),
  getters: {
    scriptMap(state) {
      return state.scriptLibrary || {};
    },
    platformMap(state) {
      return state.platformLibrary || {};
    },
  },
  actions: {
    sync(settings) {
      const next = getVisiblePlatformLibrary(settings || {});
      this.platformLibrary = next.platformLibrary;
      this.scriptLibrary = next.scriptLibrary;
      this.visiblePlatforms = next.visiblePlatforms;
      this.visibleScripts = next.visibleScripts;
    },
    getScript(scriptId) {
      return this.scriptLibrary[normalizeText(scriptId)] || null;
    },
  },
});
