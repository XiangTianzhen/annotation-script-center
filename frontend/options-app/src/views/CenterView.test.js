import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CenterView from "@/views/CenterView.vue";
import { useAppStore } from "@/stores/app";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";

vi.mock("vue-router", () => ({
  useRouter() {
    return {
      push: vi.fn(),
    };
  },
}));

describe("CenterView legacy workbench", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const appStore = useAppStore();
    appStore.showToast = vi.fn();

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        publicCenterPlatformOrder: ["beta", "alpha"],
      },
    };

    const scriptsStore = useScriptsStore();
    scriptsStore.platformLibrary = {
      alpha: {
        id: "alpha",
        label: "Alpha",
        description: "Alpha 平台",
      },
      beta: {
        id: "beta",
        label: "Beta",
        description: "Beta 平台",
      },
    };
    scriptsStore.scriptLibrary = {
      a1: {
        id: "a1",
        label: "Alpha Script",
        description: "Alpha 脚本说明",
        platformId: "alpha",
      },
      b1: {
        id: "b1",
        label: "Beta Script",
        description: "Beta 脚本说明",
        platformId: "beta",
      },
    };
    scriptsStore.visiblePlatforms = ["beta", "alpha"];
    scriptsStore.visibleScripts = ["a1", "b1"];
  });

  test("shows legacy edit-order toolbar and ordered platform sections", () => {
    const wrapper = mount(CenterView);
    const sections = wrapper.findAll(".platform-section.platform-module");

    expect(wrapper.find("#public-center-edit-toggle").exists()).toBe(true);
    expect(wrapper.text()).toContain("编辑顺序");
    expect(sections).toHaveLength(2);
    expect(sections[0].attributes("data-platform-id")).toBe("beta");
    expect(sections[1].attributes("data-platform-id")).toBe("alpha");
  });
});
