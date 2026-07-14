import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import {
  formatShortcut,
  getScriptConfig,
  getScriptDetailSections,
  getScriptFieldGroups,
  getScriptJsonPathLabel,
  getScriptShortcutActions,
  getShortcutFromKeyboardEvent,
  saveScriptConfig,
} from "@/services/script-settings";

const require = createRequire(import.meta.url);
const { resolveRepo } = require("#repo-paths");
const sharedConstants = require(resolveRepo("extension", "shared", "constants.js"));
const RETAINED = [
  "dataBakerCvpcLiuzhouAssistant",
  "bytedanceAidpSuzhouHelper",
  "bytedanceAidpJinhuaHelper",
  "bytedanceAidpTaizhouHelper",
  "magicDataHangzhouAssistant",
];

describe("script-settings helpers", () => {
  test("maps only the five 1.0 scripts into detail schemas", () => {
    globalThis.ASREdgeConstants = sharedConstants;
    RETAINED.forEach((scriptId) => {
      expect(getScriptJsonPathLabel(scriptId)).toBeTruthy();
      expect(getScriptFieldGroups(scriptId).length).toBeGreaterThan(0);
    });
    expect(getScriptJsonPathLabel("transcription")).toBe("");
    expect(getScriptFieldGroups("aishellTechCnEnShortDrama")).toEqual([]);
  });

  test("reads and saves a retained script branch", async () => {
    const settings = { platforms: { magicData: { scripts: { hangzhouHelper: { enabled: true } } } } };
    expect(getScriptConfig(settings, "magicDataHangzhouAssistant")).toEqual({ enabled: true });
    const calls = [];
    await saveScriptConfig({ persistPatch: async (patch) => calls.push(patch) }, "magicDataHangzhouAssistant", { enabled: false });
    expect(calls).toEqual([{ platforms: { magicData: { scripts: { hangzhouHelper: { enabled: false } } } } }]);
  });

  test("builds jinhua panels in the expected order", () => {
    globalThis.ASREdgeConstants = sharedConstants;
    const sections = getScriptDetailSections("bytedanceAidpJinhuaHelper", { aiRecommendEnabled: true });
    expect(sections.map((section) => section.key)).toEqual(["basic", "ai", "shortcuts"]);
    expect(sections[0].fields[0].kind).toBe("boolean");
  });

  test("uses the saved AI master switch for all AIDP detail panels", () => {
    ["bytedanceAidpSuzhouHelper", "bytedanceAidpJinhuaHelper", "bytedanceAidpTaizhouHelper"].forEach((scriptId) => {
      expect(
        getScriptDetailSections(scriptId, { aiRecommendEnabled: false }).some(
          (section) => section.key === "ai"
        )
      ).toBe(false);
      expect(
        getScriptDetailSections(scriptId, { aiRecommendEnabled: true }).some(
          (section) => section.key === "ai"
        )
      ).toBe(true);
    });
  });

  test("restores the complete five-script field contracts without dialect expert mode", () => {
    globalThis.ASREdgeConstants = sharedConstants;
    const contract = (scriptId) =>
      Object.fromEntries(
        getScriptFieldGroups(scriptId).flatMap((section) =>
          (section.groups || []).map((group) => [
            `${section.key}/${group.key}`,
            (group.fields || []).map((field) => field.path),
          ])
        )
      );
    const aidpExpected = {
      "basic/page-behavior": [
        "platformAiEnabled",
        "segmentPreviewAutoApplyEnabled",
        "aiRecommendEnabled",
        "mergeContiguousSuggestedSegmentsEnabled",
        "defaultPlaybackRate",
        "fixedWaveZoom",
        "segmentContextPaddingMs",
        "segmentSilenceThresholdDbfs",
      ],
      "ai/ai-base": [
        "aiRecommendAutoFillEnabled",
        "aiRecommendEnableThinking",
        "aiRecommendRequestTimeoutMs",
      ],
      "ai/listen": [
        "aiRecommendListenModel",
        "aiRecommendListenTemperature",
        "aiRecommendListenTopP",
        "aiRecommendListenMaxTokens",
        "aiRecommendListenMaxCompletionTokens",
        "aiRecommendListenPresencePenalty",
        "aiRecommendListenFrequencyPenalty",
        "aiRecommendListenSeed",
        "aiRecommendListenPrompt",
        "aiRecommendListenStopSequences",
      ],
      "ai/refine": [
        "aiRecommendRefineModel",
        "aiRecommendRefineTemperature",
        "aiRecommendRefineTopP",
        "aiRecommendRefineMaxTokens",
        "aiRecommendRefineMaxCompletionTokens",
        "aiRecommendRefinePresencePenalty",
        "aiRecommendRefineFrequencyPenalty",
        "aiRecommendRefineSeed",
        "aiRecommendRefinePrompt",
        "aiRecommendRefineStopSequences",
      ],
    };

    expect(contract("dataBakerCvpcLiuzhouAssistant")).toEqual({
      "basic/page-behavior": [
        "segmentPreviewEnabled",
        "segmentPreviewAutoApplyEnabled",
        "aiRecommendAutoFillEnabled",
        "recommendationValidityAutoCorrectEnabled",
        "blockNewTabEditingTips",
        "blockPauseStateTips",
        "segmentSilenceThresholdUnit",
        "segmentContextPaddingMs",
        "segmentSilenceThresholdDbfs",
      ],
      "ai/ai-base": [
        "aiRecommendEnabled",
        "aiRecommendEnableThinking",
        "aiRecommendRequestTimeoutMs",
      ],
      "ai/listen": [
        "aiRecommendListenIncludeLexiconReference",
        "aiRecommendListenModel",
        "aiRecommendListenTemperature",
        "aiRecommendListenTopP",
        "aiRecommendListenMaxTokens",
        "aiRecommendListenMaxCompletionTokens",
        "aiRecommendListenPresencePenalty",
        "aiRecommendListenFrequencyPenalty",
        "aiRecommendListenSeed",
        "aiRecommendListenPrompt",
        "aiRecommendListenStopSequences",
      ],
      "ai/refine": aidpExpected["ai/refine"],
    });
    expect(contract("bytedanceAidpSuzhouHelper")).toEqual(aidpExpected);
    expect(contract("bytedanceAidpJinhuaHelper")).toEqual(aidpExpected);
    expect(contract("bytedanceAidpTaizhouHelper")).toEqual({
      "basic/page-behavior": aidpExpected["basic/page-behavior"],
      "ai/ai-base": [
        "aiRecommendEnableThinking",
        "aiRecommendRequestTimeoutMs",
      ],
      "ai/omni": [
        "aiRecommendOmniModel",
        "aiRecommendOmniTemperature",
        "aiRecommendOmniTopP",
        "aiRecommendOmniMaxTokens",
        "aiRecommendOmniMaxCompletionTokens",
        "aiRecommendOmniPresencePenalty",
        "aiRecommendOmniFrequencyPenalty",
        "aiRecommendOmniSeed",
        "aiRecommendOmniPrompt",
        "aiRecommendOmniStopSequences",
      ],
    });

    const jinhuaFields = getScriptFieldGroups("bytedanceAidpJinhuaHelper").flatMap(
      (section) => (section.groups || []).flatMap((group) => group.fields || [])
    );
    expect(jinhuaFields.some((field) => /expert|专家/i.test(`${field.path} ${field.label}`))).toBe(false);

    expect(contract("magicDataHangzhouAssistant")).toEqual({
      "basic/assistant-note": ["hangzhouAiReviewNotice"],
      "ai/ai-base": [
        "aiReviewEnabled",
        "aiReviewEnableThinking",
        "showHeardText",
        "showEstimatedIncome",
        "aiReviewModelMode",
        "aiReviewRecognitionStrategy",
        "aiReviewListenModel",
        "aiReviewCompareModel",
        "aiReviewSingleModel",
        "aiReviewRequestTimeoutMs",
      ],
      "ai/prompt-params": [
        "aiReviewTemperature",
        "aiReviewTopP",
        "aiReviewMaxTokens",
        "aiReviewMaxCompletionTokens",
        "aiReviewPresencePenalty",
        "aiReviewFrequencyPenalty",
        "aiReviewSeed",
        "aiReviewListenPrompt",
        "aiReviewComparePrompt",
        "aiReviewStopSequences",
      ],
    });
  });

  test("orders each setting group as switches, selects, single-line fields, then textareas", () => {
    const priority = { boolean: 0, select: 1, number: 2, text: 2, textarea: 3, notice: 4 };
    RETAINED.forEach((scriptId) => {
      getScriptFieldGroups(scriptId).forEach((section) => {
        (section.groups || []).forEach((group) => {
          const actual = (group.fields || []).map((field) => priority[field.kind] ?? 9);
          expect(actual).toEqual([...actual].sort((left, right) => left - right));
        });
      });
    });
  });

  test("restores runtime-backed shortcut action counts", () => {
    globalThis.ASREdgeConstants = sharedConstants;
    expect(getScriptShortcutActions("dataBakerCvpcLiuzhouAssistant")).toHaveLength(18);
    expect(getScriptShortcutActions("bytedanceAidpSuzhouHelper")).toHaveLength(7);
    expect(getScriptShortcutActions("bytedanceAidpJinhuaHelper")).toHaveLength(7);
    expect(getScriptShortcutActions("bytedanceAidpTaizhouHelper")).toHaveLength(7);
    expect(getScriptShortcutActions("magicDataHangzhouAssistant")).toHaveLength(22);
  });

  test("describes dynamic hangzhou model fields and fixed thinking switches", () => {
    const fields = getScriptFieldGroups("magicDataHangzhouAssistant").flatMap((section) =>
      (section.groups || []).flatMap((group) => group.fields || [])
    );
    expect(fields.find((field) => field.path === "aiReviewListenModel")?.visibleWhen).toEqual({
      path: "aiReviewModelMode",
      equals: "two_stage",
    });
    expect(fields.find((field) => field.path === "aiReviewSingleModel")?.visibleWhen).toEqual({
      path: "aiReviewModelMode",
      equals: "omni_single",
    });
    expect(fields.find((field) => field.path === "aiReviewEnableThinking")?.disabled).toBe(true);
  });

  test("matches the retained runtime ranges, playback presets and model options", () => {
    const flattenFields = (scriptId) =>
      getScriptFieldGroups(scriptId).flatMap((section) =>
        (section.groups || []).flatMap((group) => group.fields || [])
      );
    const cvpc = flattenFields("dataBakerCvpcLiuzhouAssistant");
    const aidp = flattenFields("bytedanceAidpSuzhouHelper");

    expect(cvpc.find((field) => field.path === "segmentContextPaddingMs")?.max).toBe(1.5);
    expect(cvpc.find((field) => field.path === "segmentSilenceThresholdDbfs")?.ranges).toEqual({
      db: { min: -80, max: -5, step: 1 },
      ratio: { min: 0.01, max: 56.23, step: 0.01 },
      value: { min: 3, max: 18427, step: 1 },
    });
    expect(
      aidp.find((field) => field.path === "defaultPlaybackRate")?.options.map((item) => item.value)
    ).toEqual(["0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"]);
    expect(
      aidp.find((field) => field.path === "fixedWaveZoom")?.options.map((item) => item.value)
    ).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(aidp.find((field) => field.path === "segmentSilenceThresholdDbfs")).toMatchObject({
      min: -80,
      max: -5,
    });
    expect(aidp.find((field) => field.path === "aiRecommendRequestTimeoutMs")?.min).toBe(1);
  });

  test("formats and captures keyboard shortcuts", () => {
    expect(formatShortcut({ ctrl: true, shift: true, key: "K" })).toBe("Ctrl + Shift + K");
    expect(getShortcutFromKeyboardEvent({ key: "K", ctrlKey: true })).toEqual({
      ctrl: true, alt: false, shift: false, meta: false, key: "K", button: null,
    });
    expect(getShortcutFromKeyboardEvent({ key: "Control" })).toBe(false);
  });
});
