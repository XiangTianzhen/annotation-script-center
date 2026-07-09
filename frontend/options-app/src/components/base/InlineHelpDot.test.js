import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import InlineHelpDot from "@/components/base/InlineHelpDot.vue";

describe("InlineHelpDot global popover contract", () => {
  test("keeps a single visible popover when switching between help dots", async () => {
    const wrapper = mount({
      components: {
        InlineHelpDot,
      },
      template: `
        <div>
          <InlineHelpDot text="第一个帮助" />
          <InlineHelpDot text="第二个帮助" />
        </div>
      `,
      attachTo: document.body,
    });

    const dots = wrapper.findAll(".inline-help-dot");
    await dots[0].trigger("click");
    await dots[1].trigger("click");

    const visiblePopovers = Array.from(document.body.querySelectorAll(".inline-help-popover.visible"));
    expect(visiblePopovers).toHaveLength(1);
    expect(visiblePopovers[0].textContent).toContain("第二个帮助");

    wrapper.unmount();
  });
});
