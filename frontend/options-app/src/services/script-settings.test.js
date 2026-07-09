import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import {
  formatShortcut,
  getScriptConfig,
  getScriptFieldGroups,
  getScriptJsonPathLabel,
  getShortcutFromKeyboardEvent,
  saveScriptConfig,
} from "@/services/script-settings";

const require = createRequire(import.meta.url);
const sharedConstants = require("../../../../extension/shared/constants.js");

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

  test("covers the legacy script detail groups that are still visible in Vue options", () => {
    const transcriptionGroups = getScriptFieldGroups("transcription");
    const judgementGroups = getScriptFieldGroups("judgement");
    const lightwheelGroups = getScriptFieldGroups("lightwheelViewPanel");
    const cnEnShortDramaGroups = getScriptFieldGroups("aishellTechCnEnShortDrama");
    const haitianUtransGroups = getScriptFieldGroups("haitianUtransAudioDownloadHelper");

    expect(transcriptionGroups.length).toBeGreaterThan(0);
    expect(judgementGroups.length).toBeGreaterThan(0);
    expect(lightwheelGroups.length).toBeGreaterThan(0);
    expect(cnEnShortDramaGroups.length).toBeGreaterThan(0);
    expect(haitianUtransGroups.length).toBeGreaterThan(0);
  });

  test("keeps every visible shared script id mapped into the Vue detail schema", () => {
    globalThis.ASREdgeConstants = sharedConstants;

    Object.keys(sharedConstants.SCRIPT_LIBRARY).forEach((scriptId) => {
      expect(getScriptJsonPathLabel(scriptId)).toBeTruthy();
      expect(getScriptFieldGroups(scriptId).length).toBeGreaterThan(0);
    });
  });

  test("normalizes project shortcuts into a nested shortcuts draft", () => {
    globalThis.ASREdgeConstants = {
      TRANSCRIPTION_SHORTCUT_ACTIONS: [
        { key: "shortcutPlayPause", label: "播放 / 暂停" },
        { key: "shortcutFill", label: "快速填入" },
      ],
    };
    const config = getScriptConfig(
      {
        platforms: {
          alibabaLabelx: {
            scriptCenter: {
              projects: {
                transcription: {
                  asrConfig: {
                    autoPlay: true,
                    shortcutPlayPause: { key: "K" },
                    shortcutFill: { key: "F" },
                  },
                },
              },
            },
          },
        },
      },
      "transcription"
    );

    expect(config.shortcuts).toEqual({
      shortcutPlayPause: { key: "K" },
      shortcutFill: { key: "F" },
    });
    expect(config.shortcutPlayPause).toBeUndefined();
  });

  test("flattens project shortcuts back into the legacy payload on save", async () => {
    globalThis.ASREdgeConstants = {
      TRANSCRIPTION_SHORTCUT_ACTIONS: [
        { key: "shortcutPlayPause", label: "播放 / 暂停" },
        { key: "shortcutFill", label: "快速填入" },
      ],
    };
    const calls = [];
    const settingsStore = {
      async persistProject(projectId, patch) {
        calls.push({ projectId, patch });
        return patch;
      },
    };

    await saveScriptConfig(settingsStore, "transcription", {
      autoPlay: true,
      shortcuts: {
        shortcutPlayPause: { key: "K" },
        shortcutFill: { key: "F" },
      },
    });

    expect(calls).toEqual([
      {
        projectId: "transcription",
        patch: {
          autoPlay: true,
          shortcutPlayPause: { key: "K" },
          shortcutFill: { key: "F" },
        },
      },
    ]);
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
