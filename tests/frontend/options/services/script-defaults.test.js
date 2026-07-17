import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  applyScriptDraftFieldUpdate,
  hydrateScriptDraft,
  loadScriptDefaults,
  SCRIPT_DEFAULT_ENDPOINTS,
  serializeScriptDraft,
} from "@/services/script-defaults";

const SUZHOU_ID = "bytedanceAidpSuzhouHelper";
const JINHUA_ID = "bytedanceAidpJinhuaHelper";
const TAIZHOU_ID = "bytedanceAidpTaizhouHelper";
const CVPC_ID = "dataBakerCvpcLiuzhouAssistant";
const HANGZHOU_ID = "magicDataHangzhouAssistant";

function aidpPayload() {
  const params = {
    temperature: 0.1,
    top_p: 0.8,
    max_tokens: 1200,
    max_completion_tokens: null,
    presence_penalty: 0,
    frequency_penalty: 0,
    seed: null,
    stop: [],
  };
  return {
    success: true,
    defaults: {
      timeoutMs: 60000,
      stages: {
        listen: { model: "qwen3.5-omni-flash", prompt: "后端听音 Prompt", params },
        refine: { model: "qwen3.5-plus", prompt: "后端收口 Prompt", params },
      },
    },
    supportedModels: {
      listen: ["qwen3.5-omni-flash"],
      refine: ["qwen3.5-plus"],
    },
  };
}

function jinhuaOmniPayload() {
  return {
    success: true,
    defaults: {
      timeoutMs: 60000,
      omni: {
        model: "qwen3.5-omni-plus",
        prompt: "后端金华转写 Prompt",
        params: {
          temperature: 0.1,
          top_p: 0.8,
          max_tokens: 1200,
          stop: ["END", "STOP"],
        },
      },
    },
    supportedModels: {
      omni: ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
    },
  };
}

function taizhouOmniPayload() {
  return {
    success: true,
    defaults: {
      timeoutMs: 60000,
      omni: {
        model: "qwen3.5-omni-plus",
        prompt: "后端全模态 Prompt",
        params: {
          temperature: 0.1,
          top_p: 0.8,
          max_tokens: 1200,
          stop: ["END", "STOP"],
        },
      },
    },
    supportedModels: {
      omni: ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
    },
  };
}

describe("script defaults and draft adapters", () => {
  beforeEach(() => {
    globalThis.ASREdgeConstants = {
      buildBackendUrl(path) {
        return `https://backend.example.test${path}`;
      },
      DEFAULT_SETTINGS: { platforms: {} },
    };
  });

  test("loads and maps an AIDP two-stage defaults response", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => aidpPayload(),
    }));

    const state = await loadScriptDefaults(SUZHOU_ID, {}, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://backend.example.test/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults",
      expect.objectContaining({ method: "GET" })
    );
    expect(state.status).toBe("loaded");
    expect(state.config.aiRecommendRequestTimeoutMs).toBe(60000);
    expect(state.config.aiRecommendListenPrompt).toBe("后端听音 Prompt");
    expect(state.config.aiRecommendListenTemperature).toBe("0.1");
    expect(state.config.aiRecommendRefineMaxCompletionTokens).toBe("");
    expect(state.options.listenModels).toEqual([
      { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
    ]);
  });

  test("loads the Jinhua defaults route with the single Omni contract", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => jinhuaOmniPayload(),
    }));

    const state = await loadScriptDefaults(JINHUA_ID, {}, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://backend.example.test/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults",
      expect.objectContaining({ method: "GET" })
    );
    expect(state.status).toBe("loaded");
    expect(state.config.aiRecommendOmniModel).toBe("qwen3.5-omni-plus");
    expect(state.config.aiRecommendOmniPrompt).toBe("后端金华转写 Prompt");
    expect(state.config.aiRecommendOmniTemperature).toBe("0.1");
    expect(state.config.aiRecommendOmniStopSequences).toBe("END\nSTOP");
    expect(state.options.omniModels.map((item) => item.value)).toEqual([
      "qwen3.5-omni-plus",
      "qwen3.5-omni-flash",
    ]);
  });

  test("serializes Jinhua Omni defaults as empty overrides while retaining legacy storage fields", () => {
    const persisted = serializeScriptDraft(
      JINHUA_ID,
      {
        platformAiEnabled: true,
        segmentContextPaddingMs: 0.3,
        segmentSilenceThresholdDbfs: -31,
        aiRecommendRequestTimeoutMs: 60,
        aiRecommendOmniPrompt: "后端金华转写 Prompt",
        aiRecommendOmniTemperature: "0.1",
        aiRecommendOmniStopSequences: "END, STOP",
        aiRecommendListenPrompt: "旧听音 Prompt",
        aiRecommendRefinePrompt: "旧收口 Prompt",
      },
      {
        status: "loaded",
        config: {
          aiRecommendOmniPrompt: "后端金华转写 Prompt",
          aiRecommendOmniTemperature: "0.1",
          aiRecommendOmniStopSequences: "END\nSTOP",
        },
        options: {},
      }
    );

    expect(persisted.aiRecommendOmniPrompt).toBe("");
    expect(persisted.aiRecommendOmniTemperature).toBe("");
    expect(persisted.aiRecommendOmniStopSequences).toBe("");
    expect(persisted.aiRecommendListenPrompt).toBe("旧听音 Prompt");
    expect(persisted.aiRecommendRefinePrompt).toBe("旧收口 Prompt");
  });

  test("keeps a Jinhua custom prompt as a local override and restores it on hydration", () => {
    const defaults = {
      status: "loaded",
      config: {
        aiRecommendOmniPrompt: "后端金华转写 Prompt",
      },
      options: {},
    };
    const persisted = serializeScriptDraft(
      JINHUA_ID,
      {
        platformAiEnabled: true,
        segmentContextPaddingMs: 0.3,
        segmentSilenceThresholdDbfs: -31,
        aiRecommendRequestTimeoutMs: 60,
        aiRecommendOmniPrompt: "使用者自定义金华转写 Prompt",
      },
      defaults
    );

    expect(persisted.aiRecommendOmniPrompt).toBe("使用者自定义金华转写 Prompt");
    expect(
      hydrateScriptDraft(JINHUA_ID, persisted, defaults).aiRecommendOmniPrompt
    ).toBe("使用者自定义金华转写 Prompt");
  });

  test("clears the Jinhua prompt override when the user clears or restores the backend default", () => {
    const defaults = {
      status: "loaded",
      config: {
        aiRecommendOmniPrompt: "后端金华转写 Prompt",
      },
      options: {},
    };
    const baseDraft = {
      platformAiEnabled: true,
      segmentContextPaddingMs: 0.3,
      segmentSilenceThresholdDbfs: -31,
      aiRecommendRequestTimeoutMs: 60,
    };

    const cleared = serializeScriptDraft(
      JINHUA_ID,
      { ...baseDraft, aiRecommendOmniPrompt: "" },
      defaults
    );
    const restoredDefault = serializeScriptDraft(
      JINHUA_ID,
      { ...baseDraft, aiRecommendOmniPrompt: "后端金华转写 Prompt" },
      defaults
    );

    expect(cleared.aiRecommendOmniPrompt).toBe("");
    expect(restoredDefault.aiRecommendOmniPrompt).toBe("");
    expect(hydrateScriptDraft(JINHUA_ID, cleared, defaults).aiRecommendOmniPrompt)
      .toBe("后端金华转写 Prompt");
  });

  test("loads the Taizhou defaults route with the single Qwen Omni contract", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => taizhouOmniPayload(),
    }));

    const state = await loadScriptDefaults(TAIZHOU_ID, {}, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://backend.example.test/api/bytedance-aidp/taizhou-helper/ai/recommend/defaults",
      expect.objectContaining({ method: "GET" })
    );
    expect(state.status).toBe("loaded");
    expect(state.config.aiRecommendOmniModel).toBe("qwen3.5-omni-plus");
    expect(state.config.aiRecommendOmniPrompt).toBe("后端全模态 Prompt");
    expect(state.config.aiRecommendOmniTemperature).toBe("0.1");
    expect(state.config.aiRecommendOmniStopSequences).toBe("END\nSTOP");
    expect(state.options.omniModels.map((item) => item.value)).toEqual([
      "qwen3.5-omni-plus",
      "qwen3.5-omni-flash",
    ]);
    expect(state.config).not.toHaveProperty("aiRecommendListenPrompt");
    expect(state.config).not.toHaveProperty("aiRecommendRefinePrompt");
  });

  test("maps the CVPC flat stage parameters and stop sequences", async () => {
    const state = await loadScriptDefaults(
      CVPC_ID,
      {},
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          defaults: {
            timeoutMs: 60000,
            stages: {
              listen: {
                model: "qwen3.5-omni-flash",
                prompt: "柳州听音",
                includeLexiconReference: true,
                temperature: 0.15,
                top_p: 0.75,
                max_tokens: 1800,
                max_completion_tokens: 900,
                presence_penalty: -0.2,
                frequency_penalty: 0.3,
                seed: 17,
                stop: ["END", "STOP"],
              },
              refine: {
                model: "qwen3.5-plus",
                prompt: "柳州修正",
                temperature: 0.1,
                stop: ["DONE"],
              },
            },
          },
          supportedModels: {
            listen: ["qwen3.5-omni-flash"],
            refine: ["qwen3.5-plus"],
          },
        }),
      }))
    );

    expect(state.status).toBe("loaded");
    expect(state.config.aiRecommendListenIncludeLexiconReference).toBe(true);
    expect(state.config.aiRecommendListenTemperature).toBe("0.15");
    expect(state.config.aiRecommendListenMaxCompletionTokens).toBe("900");
    expect(state.config.aiRecommendListenStopSequences).toBe("END\nSTOP");
    expect(state.config.aiRecommendRefineStopSequences).toBe("DONE");
  });

  test("keeps the five existing defaults routes fixed", () => {
    expect(SCRIPT_DEFAULT_ENDPOINTS).toEqual({
      dataBakerCvpcLiuzhouAssistant:
        "/api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults",
      bytedanceAidpSuzhouHelper:
        "/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults",
      bytedanceAidpJinhuaHelper:
        "/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults",
      bytedanceAidpTaizhouHelper:
        "/api/bytedance-aidp/taizhou-helper/ai/recommend/defaults",
      magicDataHangzhouAssistant:
        "/api/magic-data/hangzhou-helper/ai/defaults",
    });
  });

  test("maps Hangzhou model options, prompts and generation defaults", async () => {
    const state = await loadScriptDefaults(
      HANGZHOU_ID,
      {},
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          defaults: {
            modelMode: "omni_single",
            modelModeOptions: [
              { value: "two_stage", label: "双模型" },
              { value: "omni_single", label: "单模型" },
            ],
            listenModel: "qwen3.5-omni-flash",
            listenModelOptions: ["qwen3.5-omni-flash"],
            compareModel: "qwen3.5-flash",
            compareModelOptions: ["qwen3.5-flash"],
            singleModel: "qwen3.5-omni-flash",
            singleModelOptions: ["qwen3.5-omni-flash"],
            timeoutMs: 60000,
            stages: {
              listen: {
                model: "qwen3.5-omni-flash",
                prompt: "杭州听音",
                generation: { temperature: 0.2, top_p: 0.7 },
                lexicon: { enabled: true, prompt: "听音词表提示" },
              },
              refine: {
                model: "qwen3.5-flash",
                prompt: "杭州普通话整理",
                generation: { temperature: 0.1 },
                lexicon: { enabled: false, prompt: "整理词表提示" },
              },
              single: {
                model: "qwen3.5-omni-flash",
                prompt: "杭州单模型",
                generation: { max_tokens: 1200 },
                lexicon: { enabled: true, prompt: "单模型词表提示" },
              },
            },
          },
        }),
      }))
    );

    expect(state.status).toBe("loaded");
    expect(state.config.aiReviewModelMode).toBe("omni_single");
    expect(state.config.aiReviewListenPrompt).toBe("杭州听音");
    expect(state.config.aiReviewComparePrompt).toBe("杭州普通话整理");
    expect(state.config.aiReviewSinglePrompt).toBe("杭州单模型");
    expect(state.config.aiReviewListenTemperature).toBe("0.2");
    expect(state.config.aiReviewCompareTemperature).toBe("0.1");
    expect(state.config.aiReviewSingleMaxTokens).toBe("1200");
    expect(state.config.aiReviewListenIncludeLexiconReference).toBe(true);
    expect(state.config.aiReviewCompareIncludeLexiconReference).toBe(false);
    expect(state.options.singleModels).toEqual([
      { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
    ]);
  });

  test("returns an editable local fallback when defaults cannot be fetched", async () => {
    const state = await loadScriptDefaults(
      CVPC_ID,
      {},
      vi.fn(async () => {
        throw new Error("offline");
      })
    );

    expect(state.status).toBe("fallback");
    expect(state.error).toContain("offline");
    expect(state.config.aiRecommendRequestTimeoutMs).toBe(60000);
    expect(state.options.listenModels.length).toBeGreaterThan(0);
  });

  test("local fallbacks expose every model supported by the retained two-stage backends", async () => {
    const state = await loadScriptDefaults(
      SUZHOU_ID,
      {},
      vi.fn(async () => {
        throw new Error("offline");
      })
    );

    expect(state.options.listenModels.map((item) => item.value)).toEqual([
      "qwen3.5-omni-flash",
      "qwen3.5-omni-plus",
    ]);
    expect(state.options.refineModels.map((item) => item.value)).toEqual([
      "qwen3.5-plus",
      "qwen3.5-flash",
    ]);
  });

  test("Taizhou fallback exposes only the allowed Omni models with Plus selected", async () => {
    const state = await loadScriptDefaults(
      TAIZHOU_ID,
      {},
      vi.fn(async () => {
        throw new Error("offline");
      })
    );

    expect(state.config.aiRecommendOmniModel).toBe("qwen3.5-omni-plus");
    expect(state.options.omniModels.map((item) => item.value)).toEqual([
      "qwen3.5-omni-plus",
      "qwen3.5-omni-flash",
    ]);
    expect(state.config).not.toHaveProperty("aiRecommendListenModel");
  });

  test("serializes Taizhou Omni defaults as empty overrides", () => {
    const defaults = {
      status: "loaded",
      config: {
        aiRecommendOmniPrompt: "后端全模态 Prompt",
        aiRecommendOmniTemperature: "0.1",
        aiRecommendOmniStopSequences: "END\nSTOP",
      },
      options: {},
    };
    const persisted = serializeScriptDraft(
      TAIZHOU_ID,
      {
        platformAiEnabled: true,
        segmentContextPaddingMs: 0.3,
        segmentSilenceThresholdDbfs: -31,
        aiRecommendRequestTimeoutMs: 60,
        aiRecommendOmniPrompt: "后端全模态 Prompt",
        aiRecommendOmniTemperature: "0.1",
        aiRecommendOmniStopSequences: "END, STOP",
      },
      defaults
    );

    expect(persisted.aiRecommendOmniPrompt).toBe("");
    expect(persisted.aiRecommendOmniTemperature).toBe("");
    expect(persisted.aiRecommendOmniStopSequences).toBe("");
  });

  test("hydrates effective AIDP values and serializes backend defaults as empty overrides", () => {
    const defaults = {
      status: "loaded",
      config: {
        aiRecommendRequestTimeoutMs: 60000,
        aiRecommendListenPrompt: "后端听音 Prompt",
        aiRecommendListenTemperature: "0.1",
        aiRecommendListenStopSequences: "END\nSTOP",
        aiRecommendRefinePrompt: "后端收口 Prompt",
        aiRecommendRefineTemperature: "0.1",
      },
      options: {},
    };
    const draft = hydrateScriptDraft(
      SUZHOU_ID,
      {
        platformAiEnabled: false,
        segmentContextPaddingMs: 300,
        aiRecommendRequestTimeoutMs: 60000,
        aiRecommendListenPrompt: "",
        aiRecommendListenTemperature: "",
        aiRecommendListenStopSequences: "END, STOP",
        aiRecommendRefinePrompt: "用户收口 Prompt",
        aiRecommendRefineTemperature: "0.2",
      },
      defaults
    );

    expect(draft.platformAiEnabled).toBe(true);
    expect(draft.segmentContextPaddingMs).toBe(0.3);
    expect(draft.aiRecommendRequestTimeoutMs).toBe(60);
    expect(draft.aiRecommendListenPrompt).toBe("后端听音 Prompt");
    expect(draft.aiRecommendListenTemperature).toBe("0.1");

    const persisted = serializeScriptDraft(SUZHOU_ID, draft, defaults);
    expect(persisted.platformAiEnabled).toBe(false);
    expect(persisted.segmentContextPaddingMs).toBe(300);
    expect(persisted.aiRecommendRequestTimeoutMs).toBe(60000);
    expect(persisted.aiRecommendListenPrompt).toBe("");
    expect(persisted.aiRecommendListenTemperature).toBe("");
    expect(persisted.aiRecommendListenStopSequences).toBe("");
    expect(persisted.aiRecommendRefinePrompt).toBe("用户收口 Prompt");
    expect(persisted.aiRecommendRefineTemperature).toBe("0.2");
  });

  test("converts CVPC dB, percent and Val without changing the represented threshold", () => {
    const defaults = { status: "fallback", config: {}, options: {} };
    let draft = hydrateScriptDraft(
      CVPC_ID,
      {
        segmentSilenceThresholdUnit: "ratio",
        segmentSilenceThresholdDbfs: -20,
      },
      defaults
    );
    expect(draft.segmentSilenceThresholdDbfs).toBe(10);

    draft = applyScriptDraftFieldUpdate(
      CVPC_ID,
      draft,
      { path: "segmentSilenceThresholdUnit" },
      "value"
    );
    expect(draft.segmentSilenceThresholdDbfs).toBe(3277);

    const persisted = serializeScriptDraft(CVPC_ID, draft, defaults);
    expect(persisted.segmentSilenceThresholdUnit).toBe("value");
    expect(persisted.segmentSilenceThresholdDbfs).toBeCloseTo(-20, 2);
  });

  test("preserves Jinhua and Taizhou thinking preferences while keeping Suzhou disabled", () => {
    [JINHUA_ID, TAIZHOU_ID].forEach((scriptId) => {
      const enabledDraft = hydrateScriptDraft(
        scriptId,
        { aiRecommendEnableThinking: true, aiRecommendRequestTimeoutMs: 60000 },
        { status: "fallback", config: {}, options: {} }
      );
      expect(enabledDraft.aiRecommendEnableThinking).toBe(true);
      expect(
        serializeScriptDraft(scriptId, enabledDraft, {}).aiRecommendEnableThinking
      ).toBe(true);

      const invalidDraft = hydrateScriptDraft(
        scriptId,
        { aiRecommendEnableThinking: "true", aiRecommendRequestTimeoutMs: 60000 },
        { status: "fallback", config: {}, options: {} }
      );
      expect(invalidDraft.aiRecommendEnableThinking).toBe(false);
    });

    expect(
      hydrateScriptDraft(
        SUZHOU_ID,
        { aiRecommendEnableThinking: true, aiRecommendRequestTimeoutMs: 60000 },
        { status: "fallback", config: {}, options: {} }
      ).aiRecommendEnableThinking
    ).toBe(false);
  });

  test("normalizes Hangzhou model mode and keeps the retired recognition field untouched", () => {
    const draft = hydrateScriptDraft(
      HANGZHOU_ID,
      {
        aiReviewModelMode: "single",
        aiReviewRecognitionStrategy: "mandarin_bridge",
        aiReviewEnableThinking: true,
      },
      { status: "fallback", config: {}, options: {} }
    );
    expect(draft.aiReviewModelMode).toBe("omni_single");
    expect(draft.aiReviewRecognitionStrategy).toBe("mandarin_bridge");
    expect(serializeScriptDraft(HANGZHOU_ID, draft, {}).aiReviewEnableThinking).toBe(false);
  });

  test("clears Hangzhou stage prompt, generation and stop overrides that equal backend defaults", () => {
    const defaults = {
      status: "loaded",
      config: {
        aiReviewListenPrompt: "后端听音 Prompt",
        aiReviewComparePrompt: "后端比较 Prompt",
        aiReviewListenTemperature: "0.1",
        aiReviewListenStopSequences: "END\nSTOP",
      },
      options: {},
    };
    const persisted = serializeScriptDraft(
      HANGZHOU_ID,
      {
        aiReviewModelMode: "two_stage",
        aiReviewRequestTimeoutMs: 60000,
        aiReviewListenPrompt: "后端听音 Prompt",
        aiReviewComparePrompt: "用户比较 Prompt",
        aiReviewListenTemperature: "0.1",
        aiReviewListenStopSequences: "END, STOP",
      },
      defaults
    );

    expect(persisted.aiReviewListenPrompt).toBe("");
    expect(persisted.aiReviewComparePrompt).toBe("用户比较 Prompt");
    expect(persisted.aiReviewListenTemperature).toBe("");
    expect(persisted.aiReviewListenStopSequences).toBe("");
  });

  test("rejects invalid optional generation values before persistence", () => {
    expect(() =>
      serializeScriptDraft(
        SUZHOU_ID,
        {
          platformAiEnabled: true,
          segmentContextPaddingMs: 0.3,
          segmentSilenceThresholdDbfs: -31,
          aiRecommendRequestTimeoutMs: 60,
          aiRecommendListenTopP: "1.2",
        },
        { status: "fallback", config: {}, options: {} }
      )
    ).toThrow(/top_p.*0.*1/i);
  });

  test("enforces the same timeout and silence ranges as the AIDP runtime", () => {
    const baseDraft = {
      platformAiEnabled: true,
      segmentContextPaddingMs: 0.3,
      segmentSilenceThresholdDbfs: -31,
      aiRecommendRequestTimeoutMs: 60,
    };
    expect(() =>
      serializeScriptDraft(
        SUZHOU_ID,
        { ...baseDraft, aiRecommendRequestTimeoutMs: 0.5 },
        { status: "fallback", config: {}, options: {} }
      )
    ).toThrow(/请求超时时间.*1.*60/);
    expect(() =>
      serializeScriptDraft(
        SUZHOU_ID,
        { ...baseDraft, segmentSilenceThresholdDbfs: -81 },
        { status: "fallback", config: {}, options: {} }
      )
    ).toThrow(/静音阈值.*-80.*-5/);
  });

  test("preserves the CVPC runtime maximum padding and valid dB boundary", () => {
    const persisted = serializeScriptDraft(
      CVPC_ID,
      {
        segmentContextPaddingMs: 1.5,
        segmentSilenceThresholdUnit: "db",
        segmentSilenceThresholdDbfs: -80,
        aiRecommendRequestTimeoutMs: 60000,
      },
      { status: "fallback", config: {}, options: {} }
    );

    expect(persisted.segmentContextPaddingMs).toBe(1500);
    expect(persisted.segmentSilenceThresholdDbfs).toBe(-80);
  });
});
