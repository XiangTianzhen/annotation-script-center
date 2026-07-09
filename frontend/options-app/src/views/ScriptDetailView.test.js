import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ScriptDetailView from "@/views/ScriptDetailView.vue";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import { useAppStore } from "@/stores/app";

const routeState = vi.hoisted(() => ({
  scriptId: "bytedanceAidpJinhuaHelper",
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    useRoute() {
      return {
        params: routeState,
      };
    },
  };
});

describe("ScriptDetailView legacy layout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.ASREdgeConstants = {
      SCRIPT_LIBRARY: {},
      PLATFORM_LIBRARY: {},
      BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS: [
        { key: "togglePlayPause", label: "播放/暂停切换" },
      ],
    };

    const appStore = useAppStore();
    appStore.showToast = vi.fn();

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      platforms: {
        bytedanceAidp: {
          activeScriptId: "bytedanceAidpJinhuaHelper",
          scripts: {
            jinhuaHelper: {
              enabled: true,
              aiRecommendEnabled: true,
            },
          },
        },
        aishellTech: {
          scripts: {
            cnEnShortDrama: {
              enabled: true,
            },
          },
        },
      },
    };

    const scriptsStore = useScriptsStore();
    scriptsStore.platformLibrary = {
      bytedanceAidp: {
        id: "bytedanceAidp",
        label: "ByteDance AIDP",
      },
      aishellTech: {
        id: "aishellTech",
        label: "Aishell Tech",
      },
    };
    scriptsStore.scriptLibrary = {
      bytedanceAidpJinhuaHelper: {
        id: "bytedanceAidpJinhuaHelper",
        label: "金华话脚本",
        description: "测试描述",
        note: "测试说明",
        platformId: "bytedanceAidp",
      },
      aishellTechCnEnShortDrama: {
        id: "aishellTechCnEnShortDrama",
        label: "中英短剧脚本",
        description: "只读信息面板",
        note: "测试说明",
        platformId: "aishellTech",
      },
    };
  });

  test("renders the legacy three-panel layout with help dots for jinhua", () => {
    routeState.scriptId = "bytedanceAidpJinhuaHelper";
    const wrapper = mount(ScriptDetailView);

    expect(wrapper.find("#detail-script-name").text()).toContain("金华话脚本");
    expect(wrapper.findAll(".inline-help-dot").length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain("基础设置");
    expect(wrapper.text()).toContain("AI 设置");
    expect(wrapper.text()).toContain("快捷键");
    expect(wrapper.text()).not.toContain("高级 JSON 编辑");
  });

  test("hides empty panels for scripts without ai and shortcuts", () => {
    routeState.scriptId = "aishellTechCnEnShortDrama";
    const wrapper = mount(ScriptDetailView);

    expect(wrapper.text()).toContain("基础设置");
    expect(wrapper.text()).not.toContain("AI 设置");
    expect(wrapper.text()).not.toContain("快捷键");
  });
});
