import { describe, expect, test } from "vitest";
import {
  formatShortcut,
  getScriptFieldGroups,
  getScriptJsonPathLabel,
  getShortcutFromKeyboardEvent,
} from "@/services/script-settings";

describe("script-settings helpers", () => {
  test("returns known json path labels", () => {
    expect(getScriptJsonPathLabel("dataBakerRoundOneQuality")).toBe(
      "platforms.dataBaker.scripts.roundOneQuality"
    );
  });

  test("builds field groups for supported scripts", () => {
    globalThis.ASREdgeConstants = {
      DATABAKER_PAGE_SIZE_OPTIONS: ["20条/页", "50条/页"],
      DATABAKER_AI_PIPELINE_MODE_OPTIONS: [
        { value: "two_stage", label: "双模型" },
      ],
    };
    const groups = getScriptFieldGroups("dataBakerRoundOneQuality");
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].fields.some((field) => field.path === "defaultPageSize")).toBe(true);
  });

  test("formats keyboard shortcuts consistently", () => {
    expect(
      formatShortcut({
        ctrl: true,
        alt: false,
        shift: true,
        meta: false,
        key: "K",
        button: null,
      })
    ).toBe("Ctrl + Shift + K");
  });

  test("captures keyboard shortcuts and ignores modifier-only keys", () => {
    expect(
      getShortcutFromKeyboardEvent({
        key: "K",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      })
    ).toEqual({
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
      key: "K",
      button: null,
    });
    expect(
      getShortcutFromKeyboardEvent({
        key: "Control",
      })
    ).toBe(false);
  });
});
