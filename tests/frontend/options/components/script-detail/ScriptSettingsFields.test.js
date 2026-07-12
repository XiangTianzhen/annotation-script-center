import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import ScriptSettingsFields from "@/components/script-detail/ScriptSettingsFields.vue";
import { getScriptFieldGroups } from "@/services/script-settings";

describe("ScriptSettingsFields", () => {
  const groups = [
    {
      key: "base",
      title: "基础设置",
      fields: [
        { kind: "boolean", path: "enabled", label: "启用" },
        {
          kind: "select",
          path: "mode",
          label: "模型方案",
          options: [
            { value: "two_stage", label: "双模型" },
            { value: "omni_single", label: "单模型" },
          ],
        },
        {
          kind: "text",
          path: "listenModel",
          label: "听音模型",
          visibleWhen: { path: "mode", equals: "two_stage" },
        },
        {
          kind: "text",
          path: "singleModel",
          label: "单模型",
          visibleWhen: { path: "mode", equals: "omni_single" },
        },
        { kind: "boolean", path: "thinking", label: "思考开关", disabled: true },
      ],
    },
  ];

  test("renders subgroups, visibleWhen fields and fixed disabled controls", async () => {
    const wrapper = mount(ScriptSettingsFields, {
      props: {
        groups,
        modelValue: { enabled: true, mode: "two_stage", thinking: false },
      },
    });

    expect(wrapper.text()).toContain("基础设置");
    expect(wrapper.find('[data-field-path="listenModel"]').exists()).toBe(true);
    expect(wrapper.find('[data-field-path="singleModel"]').exists()).toBe(false);
    expect(wrapper.find('[data-field-path="thinking"] input').attributes("disabled")).toBeDefined();

    await wrapper.setProps({
      modelValue: { enabled: true, mode: "omni_single", thinking: false },
    });
    expect(wrapper.find('[data-field-path="listenModel"]').exists()).toBe(false);
    expect(wrapper.find('[data-field-path="singleModel"]').exists()).toBe(true);
  });

  test("emits field metadata and the raw edited value", async () => {
    const wrapper = mount(ScriptSettingsFields, {
      props: {
        groups,
        modelValue: { enabled: false, mode: "two_stage" },
      },
    });
    await wrapper.find('[data-field-path="enabled"] input').setValue(true);
    expect(wrapper.emitted("update-field")[0]).toEqual([
      expect.objectContaining({ path: "enabled" }),
      true,
    ]);
  });

  test("applies the real Hangzhou single and two-stage model visibility contract", async () => {
    const aiGroups = getScriptFieldGroups("magicDataHangzhouAssistant").find(
      (section) => section.key === "ai"
    ).groups;
    const wrapper = mount(ScriptSettingsFields, {
      props: {
        groups: aiGroups,
        modelValue: {
          aiReviewModelMode: "two_stage",
          aiReviewEnableThinking: false,
        },
      },
    });

    expect(wrapper.find('[data-field-path="aiReviewListenModel"]').exists()).toBe(true);
    expect(wrapper.find('[data-field-path="aiReviewCompareModel"]').exists()).toBe(true);
    expect(wrapper.find('[data-field-path="aiReviewSingleModel"]').exists()).toBe(false);

    await wrapper.setProps({
      modelValue: {
        aiReviewModelMode: "omni_single",
        aiReviewRecognitionStrategy: "mandarin_to_dialect",
        aiReviewEnableThinking: false,
      },
    });
    expect(wrapper.find('[data-field-path="aiReviewListenModel"]').exists()).toBe(false);
    expect(wrapper.find('[data-field-path="aiReviewCompareModel"]').exists()).toBe(false);
    expect(wrapper.find('[data-field-path="aiReviewSingleModel"]').exists()).toBe(true);
  });
});
