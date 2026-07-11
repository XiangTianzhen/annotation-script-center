import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "@/App.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

vi.mock("vue-router", () => ({
  RouterLink: {
    props: ["to"],
    template: '<a :data-to="to"><slot /></a>',
  },
  RouterView: {
    template: '<div class="router-view-stub"></div>',
  },
  useRoute() {
    return {
      path: "/center",
      params: {},
    };
  },
}));

describe("App legacy layout shell", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.ASREdgeConstants = {
      RELEASE_CHANNEL: "public",
    };
    globalThis.chrome = {
      runtime: {
        getManifest() {
          return {
            version: "0.4.0",
          };
        },
      },
    };

    const appStore = useAppStore();
    appStore.extensionName = "标注脚本中心";
    appStore.version = "0.4.0";

    const authStore = useAuthStore();
    authStore.session = null;

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        aiUsageOperatorName: "测试员",
        backendEndpointMode: "server",
      },
    };

    const scriptsStore = useScriptsStore();
    scriptsStore.platformLibrary = {
      alpha: {
        id: "alpha",
        label: "Alpha",
      },
    };
    scriptsStore.scriptLibrary = {
      alphaScript: {
        id: "alphaScript",
        label: "Alpha Script",
        shortLabel: "Alpha",
        platformId: "alpha",
      },
    };
    scriptsStore.visiblePlatforms = ["alpha"];
    scriptsStore.visibleScripts = ["alphaScript"];
  });

  test("renders the legacy sidebar shell instead of the top workspace header", () => {
    const wrapper = mount(App);

    expect(wrapper.find(".workspace-shell").exists()).toBe(true);
    expect(wrapper.find(".workspace-sidebar").exists()).toBe(true);
    expect(wrapper.find(".workspace-stage-shell").exists()).toBe(false);
    expect(wrapper.find(".workspace-topbar").exists()).toBe(false);
    expect(wrapper.find("#workspace-brand-title").text()).toContain("标注脚本中心");
    expect(wrapper.find("#workspace-view-name").text()).toContain("功能面板");
    expect(wrapper.find("#workspace-ai-usage-operator-input").exists()).toBe(true);
    expect(wrapper.find("#workspace-library-count").text()).toContain("1 / 1");
  });
});
