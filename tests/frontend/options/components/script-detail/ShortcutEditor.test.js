import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import ShortcutEditor from "@/components/script-detail/ShortcutEditor.vue";

describe("ShortcutEditor", () => {
  test("rejects a shortcut already assigned to another action", async () => {
    const wrapper = mount(ShortcutEditor, {
      props: {
        actions: [
          { key: "recognizeWhole", label: "识别" },
          { key: "insertOverlapStart", label: "重叠说话前" },
        ],
        modelValue: {
          recognizeWhole: { key: "k", ctrl: true, alt: false, shift: false, meta: false },
        },
      },
    });

    await wrapper.findAll("button")[2].trigger("click");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.text()).toContain("该快捷键已用于「识别」");
    wrapper.unmount();
  });
});
