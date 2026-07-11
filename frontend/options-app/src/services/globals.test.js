import { describe, expect, test } from "vitest";
import {
  buildPlatformEntryDescriptor,
  getVisiblePlatformLibrary,
  isScriptRuntimeAccessible,
  splitPlatformDisplayAddress,
} from "@/services/globals";

describe("globals helpers", () => {
  test("getVisiblePlatformLibrary returns visible id arrays", () => {
    globalThis.ASREdgeConstants = {
      PLATFORM_LIBRARY: {
        alpha: { id: "alpha", label: "Alpha" },
        hidden: { id: "hidden", label: "Hidden" },
      },
      SCRIPT_LIBRARY: {
        a1: { id: "a1", platformId: "alpha" },
        b1: { id: "b1", platformId: "hidden" },
      },
      isPlatformVisible(platformId) {
        return platformId !== "hidden";
      },
      isScriptVisible(scriptId) {
        return scriptId !== "b1";
      },
    };

    const result = getVisiblePlatformLibrary({});
    expect(result.visiblePlatforms).toEqual(["alpha"]);
    expect(result.visibleScripts).toEqual(["a1"]);
  });

  test("buildPlatformEntryDescriptor keeps explicit entry url", () => {
    const descriptor = buildPlatformEntryDescriptor({
      displayHost: "example.com",
      entryUrl: "https://example.com/app",
    });
    expect(descriptor).toEqual({
      displayHost: "example.com",
      entryUrl: "https://example.com/app",
    });
  });

  test("splitPlatformDisplayAddress keeps the host intact and moves long paths to a second line", () => {
    expect(
      splitPlatformDisplayAddress("aidp.bytedance.com/management/task-v2")
    ).toEqual({
      host: "aidp.bytedance.com",
      path: "/management/task-v2",
    });
    expect(
      splitPlatformDisplayAddress("https://cvpc.data-baker.com/app/editor/asr/")
    ).toEqual({
      host: "cvpc.data-baker.com",
      path: "/app/editor/asr",
    });
    expect(splitPlatformDisplayAddress("work.magicdatatech.com")).toEqual({
      host: "work.magicdatatech.com",
      path: "",
    });
  });

  test("isScriptRuntimeAccessible delegates to shared constants", () => {
    globalThis.ASREdgeConstants = {
      isScriptRuntimeAccessible(scriptId) {
        return scriptId === "a1";
      },
    };

    expect(isScriptRuntimeAccessible("a1", {})).toBe(true);
    expect(isScriptRuntimeAccessible("b1", {})).toBe(false);
  });
});
