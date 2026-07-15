import { createRequire } from "node:module";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ScriptDetailView from "@/views/ScriptDetailView.vue";
import { useScriptsStore } from "@/stores/scripts";
import { useSettingsStore } from "@/stores/settings";
import { useAppStore } from "@/stores/app";

const require = createRequire(import.meta.url);
const { resolveRepo } = require("#repo-paths");
const sharedConstants = require(resolveRepo("extension", "shared", "constants.js"));

const routeState = vi.hoisted(() => ({
  scriptId: "bytedanceAidpJinhuaHelper",
}));

const loadDefaultsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/script-defaults", async () => {
  const actual = await vi.importActual("@/services/script-defaults");
  return {
    ...actual,
    loadScriptDefaults: loadDefaultsMock,
  };
});

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

describe("ScriptDetailView 1.0 layout", () => {
  beforeEach(() => {
    routeState.scriptId = "bytedanceAidpJinhuaHelper";
    setActivePinia(createPinia());
    globalThis.ASREdgeConstants = {
      ...sharedConstants,
      isScriptRuntimeAccessible() {
        return true;
      },
    };

    loadDefaultsMock.mockReset();
    loadDefaultsMock.mockResolvedValue({
      status: "loaded",
      config: {
        aiRecommendRequestTimeoutMs: 60000,
        aiRecommendListenPrompt: "后端听音 Prompt",
        aiRecommendRefinePrompt: "后端收口 Prompt",
      },
      options: {},
      error: "",
    });

    const appStore = useAppStore();
    appStore.showToast = vi.fn();

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      platforms: {
        bytedanceAidp: {
          activeScriptId: "bytedanceAidpJinhuaHelper",
          scripts: {
            suzhouHelper: {
              enabled: false,
              aiRecommendEnabled: true,
            },
            jinhuaHelper: {
              enabled: true,
              aiRecommendEnabled: true,
            },
            taizhouHelper: {
              enabled: false,
              aiRecommendEnabled: true,
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
    };
    scriptsStore.scriptLibrary = {
      bytedanceAidpJinhuaHelper: {
        id: "bytedanceAidpJinhuaHelper",
        label: "金华话脚本",
        description: "测试描述",
        note: "测试说明",
        platformId: "bytedanceAidp",
      },
      bytedanceAidpSuzhouHelper: {
        id: "bytedanceAidpSuzhouHelper",
        label: "苏州话脚本",
        description: "测试描述",
        note: "测试说明",
        platformId: "bytedanceAidp",
      },
      bytedanceAidpTaizhouHelper: {
        id: "bytedanceAidpTaizhouHelper",
        label: "台州话脚本",
        description: "测试描述",
        note: "测试说明",
        platformId: "bytedanceAidp",
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

  test("shows the backend defaults load result in the AI heading", async () => {
    const wrapper = mount(ScriptDetailView);
    expect(wrapper.text()).toContain("正在读取后端默认配置");
    await flushPromises();
    expect(wrapper.find(".defaults-status").text()).toContain("已读取后端默认配置");
  });

  test("does not overwrite a dirty prompt when defaults finish loading later", async () => {
    let resolveDefaults;
    loadDefaultsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDefaults = resolve;
      })
    );
    const wrapper = mount(ScriptDetailView);
    const prompt = wrapper.find('[data-field-path="aiRecommendListenPrompt"] textarea');
    await prompt.setValue("用户尚未保存的 Prompt");

    resolveDefaults({
      status: "loaded",
      config: { aiRecommendListenPrompt: "稍后到达的后端 Prompt" },
      options: {},
      error: "",
    });
    await flushPromises();

    expect(wrapper.find('[data-field-path="aiRecommendListenPrompt"] textarea').element.value).toBe(
      "用户尚未保存的 Prompt"
    );
  });

  test.each([
    ["bytedanceAidpSuzhouHelper", "suzhouHelper"],
    ["bytedanceAidpJinhuaHelper", "jinhuaHelper"],
    ["bytedanceAidpTaizhouHelper", "taizhouHelper"],
  ])(
    "keeps %s AI settings visible until save, then supports showing it again",
    async (currentScriptId, branchKey) => {
    routeState.scriptId = currentScriptId;
    const settingsStore = useSettingsStore();
    settingsStore.persistPatch = vi.fn(async (patch) => {
      const nextBranch = patch.platforms.bytedanceAidp.scripts[branchKey];
      settingsStore.settings = {
        ...settingsStore.settings,
        platforms: {
          ...settingsStore.settings.platforms,
          bytedanceAidp: {
            ...settingsStore.settings.platforms.bytedanceAidp,
            scripts: {
              ...settingsStore.settings.platforms.bytedanceAidp.scripts,
              [branchKey]: {
                ...settingsStore.settings.platforms.bytedanceAidp.scripts[branchKey],
                ...nextBranch,
              },
            },
          },
        },
      };
      return settingsStore.settings;
    });

    const wrapper = mount(ScriptDetailView);
    await flushPromises();
    await wrapper.find('[data-field-path="aiRecommendEnabled"] input').setValue(false);
    expect(wrapper.find(".detail-ai-panel").exists()).toBe(true);

    await wrapper.find(".detail-actions .secondary-button").trigger("click");
    await flushPromises();
    expect(wrapper.find(".detail-ai-panel").exists()).toBe(false);

    await wrapper.find('[data-field-path="aiRecommendEnabled"] input').setValue(true);
    expect(wrapper.find(".detail-ai-panel").exists()).toBe(false);
    await wrapper.find(".detail-actions .secondary-button").trigger("click");
    await flushPromises();
    expect(wrapper.find(".detail-ai-panel").exists()).toBe(true);
  });

  test("rejects an invalid generation value without partially persisting settings", async () => {
    const settingsStore = useSettingsStore();
    settingsStore.persistPatch = vi.fn();
    const wrapper = mount(ScriptDetailView);
    await flushPromises();

    await wrapper
      .find('[data-field-path="aiRecommendListenTopP"] input')
      .setValue("1.2");
    await wrapper.find(".detail-actions .secondary-button").trigger("click");
    await flushPromises();

    expect(settingsStore.persistPatch).not.toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toMatch(/top_p.*0.*1/i);
  });

  test("keeps the form editable and saveable when defaults use the local fallback", async () => {
    loadDefaultsMock.mockResolvedValue({
      status: "fallback",
      config: {},
      options: {},
      error: "offline",
    });
    const settingsStore = useSettingsStore();
    settingsStore.persistPatch = vi.fn(async () => settingsStore.settings);
    const wrapper = mount(ScriptDetailView);
    await flushPromises();

    expect(wrapper.find(".defaults-status").text()).toContain("使用本地回退");
    await wrapper.find(".detail-actions .secondary-button").trigger("click");
    await flushPromises();

    expect(settingsStore.persistPatch).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  test("rehydrates the draft from the normalized storage result after save", async () => {
    const settingsStore = useSettingsStore();
    settingsStore.persistPatch = vi.fn(async (patch) => {
      settingsStore.settings = {
        ...settingsStore.settings,
        platforms: {
          ...settingsStore.settings.platforms,
          bytedanceAidp: {
            ...settingsStore.settings.platforms.bytedanceAidp,
            scripts: {
              ...settingsStore.settings.platforms.bytedanceAidp.scripts,
              jinhuaHelper: {
                ...settingsStore.settings.platforms.bytedanceAidp.scripts.jinhuaHelper,
                ...patch.platforms.bytedanceAidp.scripts.jinhuaHelper,
                aiRecommendListenPrompt: "storage normalized prompt",
              },
            },
          },
        },
      };
      return settingsStore.settings;
    });
    const wrapper = mount(ScriptDetailView);
    await flushPromises();

    const prompt = wrapper.find('[data-field-path="aiRecommendListenPrompt"] textarea');
    await prompt.setValue("user prompt");
    await wrapper.find(".detail-actions .secondary-button").trigger("click");
    await flushPromises();

    expect(
      wrapper.find('[data-field-path="aiRecommendListenPrompt"] textarea').element.value
    ).toBe("storage normalized prompt");
  });

});
