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
    return { path: "/center", params: {} };
  },
}));

describe("App 1.0 public shell", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.chrome = {
      runtime: {
        getManifest() {
          return { version: "1.0.0" };
        },
      },
    };
    globalThis.ASREdgeConstants = {
      isScriptRuntimeAccessible() {
        return true;
      },
    };

    const appStore = useAppStore();
    appStore.extensionName = "标注脚本中心";
    appStore.version = "1.0.0";
    appStore.showToast = vi.fn();

    useAuthStore().session = null;

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        backendEndpointMode: "server",
        aiUsageOperatorName: "",
      },
    };
    settingsStore.persistPatch = vi.fn(async () => settingsStore.settings);

    const scriptsStore = useScriptsStore();
    scriptsStore.platformLibrary = {
      dataBakerCvpc: { id: "dataBakerCvpc", label: "DataBaker CVPC" },
    };
    scriptsStore.scriptLibrary = {
      dataBakerCvpcLiuzhouAssistant: {
        id: "dataBakerCvpcLiuzhouAssistant",
        label: "柳州话脚本",
        shortLabel: "柳州话脚本",
        platformId: "dataBakerCvpc",
      },
    };
    scriptsStore.visiblePlatforms = ["dataBakerCvpc"];
    scriptsStore.visibleScripts = ["dataBakerCvpcLiuzhouAssistant"];
  });

  test("shows the current public version", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#workspace-version").text()).toBe("v1.0.0");
  });
});
