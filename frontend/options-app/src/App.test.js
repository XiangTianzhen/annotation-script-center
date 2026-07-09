import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "@/App.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useScriptsStore } from "@/stores/scripts";

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

  test("renders the legacy workspace shell class contract", () => {
    const wrapper = mount(App);

    expect(wrapper.find(".workspace-shell").exists()).toBe(true);
    expect(wrapper.find(".workspace-sidebar").exists()).toBe(true);
    expect(wrapper.find(".workspace-stage").exists()).toBe(true);
    expect(wrapper.find("#workspace-brand-title").text()).toContain("标注脚本中心");
  });
});
