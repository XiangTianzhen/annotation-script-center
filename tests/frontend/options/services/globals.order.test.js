import { describe, expect, test } from "vitest";
import { getVisiblePlatformLibrary } from "@/services/globals";

describe("getVisiblePlatformLibrary order", () => {
  test("respects saved public center platform order from settings meta", () => {
    globalThis.ASREdgeConstants = {
      PLATFORM_LIBRARY: {
        alpha: { id: "alpha", label: "Alpha" },
        second: { id: "second", label: "Second" },
        gamma: { id: "gamma", label: "Gamma" },
      },
      SCRIPT_LIBRARY: {
        a1: { id: "a1", platformId: "alpha" },
        b1: { id: "b1", platformId: "second" },
        g1: { id: "g1", platformId: "gamma" },
      },
      isPlatformVisible() {
        return true;
      },
      isScriptVisible() {
        return true;
      },
    };

    const result = getVisiblePlatformLibrary({
      meta: {
        publicCenterPlatformOrder: ["gamma", "alpha"],
      },
    });

    expect(result.visiblePlatforms).toEqual(["gamma", "alpha", "second"]);
  });
});
