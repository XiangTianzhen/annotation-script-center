import { beforeEach, describe, expect, test, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createHash, webcrypto } from "node:crypto";
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
    return {
      path: "/center",
      params: {},
    };
  },
}));

function createBetaHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

describe("App beta entry flow", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.chrome = {
      runtime: {
        getManifest() {
          return {
            version: "0.4.0",
          };
        },
      },
    };
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto,
    });

    const appStore = useAppStore();
    appStore.extensionName = "标注脚本中心";
    appStore.version = "0.4.0";
    appStore.showToast = vi.fn();

    const authStore = useAuthStore();
    authStore.session = null;

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        betaUnlocked: false,
        betaUnlockedAt: null,
        backendEndpointMode: "server",
      },
    };
    settingsStore.persistPatch = vi.fn(async (patch) => {
      settingsStore.settings = {
        ...settingsStore.settings,
        meta: {
          ...(settingsStore.settings?.meta || {}),
          ...(patch?.meta || {}),
        },
      };
      return settingsStore.settings;
    });

    const scriptsStore = useScriptsStore();
    scriptsStore.platformLibrary = {
      alpha: {
        id: "alpha",
        label: "Alpha",
      },
    };
    scriptsStore.scriptLibrary = {
      alphaScript: {
        id: "alphaScript",
        label: "Alpha Script",
        shortLabel: "Alpha",
        platformId: "alpha",
      },
    };
    scriptsStore.visiblePlatforms = ["alpha"];
    scriptsStore.visibleScripts = ["alphaScript"];
    scriptsStore.sync = vi.fn();
  });

  test("keeps beta exit hidden on public builds", () => {
    globalThis.ASREdgeConstants = {
      RELEASE_CHANNEL: "public",
      canUseBetaFeatures() {
        return false;
      },
    };

    const wrapper = mount(App);
    expect(wrapper.find("#workspace-beta-exit").classes()).toContain("hidden");
  });

  test("unlocks beta mode after seven brand taps in beta channel", async () => {
    const password = "beta-pass";
    const passwordHash = createBetaHash(password);
    globalThis.ASREdgeConstants = {
      RELEASE_CHANNEL: "beta",
      BETA_FEATURES_VISIBLE_BY_DEFAULT: false,
      BETA_UNLOCK_PASSWORD_SHA256: passwordHash,
      canUseBetaFeatures(settings) {
        return settings?.meta?.betaUnlocked === true;
      },
    };
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        subtle: {
          digest: vi.fn(async () => Uint8Array.from(Buffer.from(passwordHash, "hex")).buffer),
        },
      },
    });
    globalThis.prompt = vi.fn(() => password);
    globalThis.alert = vi.fn();

    const wrapper = mount(App);
    const brandIcon = wrapper.find("#workspace-brand-icon");

    for (let index = 0; index < 7; index += 1) {
      await brandIcon.trigger("click");
    }

    await flushPromises();

    const settingsStore = useSettingsStore();
    const appStore = useAppStore();
    expect(globalThis.prompt).toHaveBeenCalledTimes(1);
    expect(settingsStore.persistPatch).toHaveBeenCalledTimes(1);
    expect(settingsStore.persistPatch).toHaveBeenCalledWith({
      meta: expect.objectContaining({
        betaUnlocked: true,
      }),
    });
    expect(settingsStore.settings.meta.betaUnlocked).toBe(true);
    expect(appStore.showToast).toHaveBeenCalledWith("已进入内测模式。", "success");
  });

  test("exits beta mode and falls back to server backend", async () => {
    globalThis.ASREdgeConstants = {
      RELEASE_CHANNEL: "beta",
      BETA_FEATURES_VISIBLE_BY_DEFAULT: false,
      canUseBetaFeatures(settings) {
        return settings?.meta?.betaUnlocked === true;
      },
    };

    const settingsStore = useSettingsStore();
    settingsStore.settings = {
      meta: {
        betaUnlocked: true,
        betaUnlockedAt: "2026-07-09T12:00:00.000Z",
        backendEndpointMode: "beta",
      },
    };

    const wrapper = mount(App);
    await wrapper.find("#workspace-beta-exit").trigger("click");
    await flushPromises();

    expect(settingsStore.persistPatch).toHaveBeenCalledWith({
      meta: {
        betaUnlocked: false,
        betaUnlockedAt: null,
        backendEndpointMode: "server",
      },
    });
    expect(settingsStore.settings.meta.backendEndpointMode).toBe("server");
  });
});
