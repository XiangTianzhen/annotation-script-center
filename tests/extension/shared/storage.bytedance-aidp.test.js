"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const constantsModulePath = resolveRepo("extension", "shared", "constants.js");
const storageModulePath = resolveRepo("extension", "shared", "storage.js");

function loadStorageApi(initialSettings) {
  delete require.cache[constantsModulePath];
  delete require.cache[storageModulePath];
  delete globalThis.ASREdgeConstants;
  delete globalThis.ASREdgeStorage;

  const constants = require(constantsModulePath);
  const store = {
    [constants.STORAGE_KEY]: initialSettings || {},
  };

  globalThis.ASREdgeConstants = constants;
  globalThis.chrome = {
    runtime: {
      id: "test-extension",
      lastError: null,
    },
    storage: {
      local: {
        get: function (key, callback) {
          const result = {};
          if (typeof key === "string") {
            result[key] = store[key];
          }
          callback(result);
        },
        set: function (payload, callback) {
          Object.keys(payload || {}).forEach(function (key) {
            store[key] = payload[key];
          });
          callback();
        },
      },
    },
  };

  require(storageModulePath);

  return {
    constants,
    storage: globalThis.ASREdgeStorage,
    cleanup: function () {
      delete require.cache[constantsModulePath];
      delete require.cache[storageModulePath];
      delete globalThis.ASREdgeConstants;
      delete globalThis.ASREdgeStorage;
      delete globalThis.chrome;
    },
  };
}

test("ByteDance AIDP storage defaults expose promoted helper settings", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const suzhouScript = settings.platforms.bytedanceAidp.scripts.suzhouHelper;
    const jinhuaScript = settings.platforms.bytedanceAidp.scripts.jinhuaHelper;
    const taizhouScript = settings.platforms.bytedanceAidp.scripts.taizhouHelper;

    assert.equal(settings.meta.schemaVersion, 33);
    assert.deepEqual(Object.keys(settings.platforms).sort(), [
      "bytedanceAidp",
      "dataBakerCvpc",
      "magicData",
    ]);
    assert.deepEqual(Object.keys(settings.platforms.bytedanceAidp.scripts).sort(), [
      "jinhuaHelper",
      "suzhouHelper",
      "taizhouHelper",
    ]);
    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(
      settings.platforms.bytedanceAidp.activeScriptId,
      "bytedanceAidpSuzhouHelper"
    );
    assert.equal(suzhouScript.id, "bytedanceAidpSuzhouHelper");
    assert.equal(suzhouScript.enabled, true);
    assert.equal(suzhouScript.platformAiEnabled, false);
    assert.equal(suzhouScript.segmentContextPaddingMs, 300);
    assert.equal(suzhouScript.segmentSilenceThresholdDbfs, -31);
    assert.equal(suzhouScript.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(suzhouScript.segmentPreviewAutoApplyEnabled, true);
    assert.equal(suzhouScript.aiRecommendEnabled, true);
    assert.equal(suzhouScript.aiRecommendAutoFillEnabled, true);
    assert.equal(
      suzhouScript.aiRecommendEndpoint,
      harness.constants.BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_SERVER_ENDPOINT
    );
    assert.equal(suzhouScript.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(suzhouScript.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(suzhouScript.aiRecommendListenPrompt, "");
    assert.equal(suzhouScript.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(suzhouScript.aiRecommendRefinePrompt, "");
    assert.equal(suzhouScript.defaultPlaybackRate, 1);
    assert.equal(suzhouScript.fixedWaveZoom, 2);
    assert.equal(suzhouScript.contractMode, "dom-guarded");
    assert.equal(suzhouScript.shortcuts.togglePlayPause, null);
    assert.equal(suzhouScript.shortcuts.playSelection, null);
    assert.equal(suzhouScript.shortcuts.jumpToFirstFrame, null);
    assert.equal(suzhouScript.shortcuts.deleteCurrentSelection, null);
    assert.equal(suzhouScript.shortcuts.clearSegments, null);
    assert.equal(suzhouScript.shortcuts.previewSegments, null);
    assert.equal(suzhouScript.shortcuts.applyPreviewSegments, null);
    assert.equal(jinhuaScript.id, "bytedanceAidpJinhuaHelper");
    assert.equal(jinhuaScript.enabled, false);
    assert.equal(jinhuaScript.platformAiEnabled, false);
    assert.equal(jinhuaScript.segmentContextPaddingMs, 300);
    assert.equal(jinhuaScript.segmentSilenceThresholdDbfs, -31);
    assert.equal(jinhuaScript.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(jinhuaScript.segmentPreviewAutoApplyEnabled, true);
    assert.equal(jinhuaScript.aiRecommendEnabled, false);
    assert.equal(jinhuaScript.aiRecommendAutoFillEnabled, true);
    assert.equal(
      jinhuaScript.aiRecommendEndpoint,
      harness.constants.BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_SERVER_ENDPOINT
    );
    assert.equal(jinhuaScript.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(jinhuaScript.aiRecommendOmniModel, "qwen3.5-omni-plus");
    assert.equal(jinhuaScript.aiRecommendOmniPrompt, "");
    assert.equal(jinhuaScript.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(jinhuaScript.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(jinhuaScript.contractMode, "dom-guarded");
    assert.equal(jinhuaScript.shortcuts.togglePlayPause, null);
    assert.equal(taizhouScript.id, "bytedanceAidpTaizhouHelper");
    assert.equal(taizhouScript.enabled, false);
    assert.equal(taizhouScript.aiRecommendEnabled, false);
    assert.equal(
      taizhouScript.aiRecommendEndpoint,
      harness.constants.BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_SERVER_ENDPOINT
    );
    assert.equal(taizhouScript.aiRecommendOmniModel, "qwen3.5-omni-plus");
    assert.equal(taizhouScript.aiRecommendOmniPrompt, "");
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage retains strict thinking choices for Jinhua and Taizhou", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.patchSettings({
      platforms: {
        bytedanceAidp: {
          scripts: {
            suzhouHelper: { aiRecommendEnableThinking: true },
            jinhuaHelper: { aiRecommendEnableThinking: true },
            taizhouHelper: { aiRecommendEnableThinking: true },
          },
        },
      },
    });
    const scripts = settings.platforms.bytedanceAidp.scripts;

    assert.equal(scripts.suzhouHelper.aiRecommendEnableThinking, false);
    assert.equal(scripts.jinhuaHelper.aiRecommendEnableThinking, true);
    assert.equal(scripts.taizhouHelper.aiRecommendEnableThinking, true);

    const reloadedScripts = (await harness.storage.getSettings()).platforms.bytedanceAidp.scripts;
    assert.equal(reloadedScripts.jinhuaHelper.aiRecommendEnableThinking, true);
    assert.equal(reloadedScripts.taizhouHelper.aiRecommendEnableThinking, true);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage clamps suzhou helper segment padding threshold playback rate and wave zoom", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            platformAiEnabled: false,
            segmentContextPaddingMs: 999,
            segmentSilenceThresholdDbfs: -100,
            mergeContiguousSuggestedSegmentsEnabled: false,
            aiRecommendEnabled: false,
            aiRecommendAutoFillEnabled: false,
            aiRecommendRequestTimeoutMs: 999999,
            aiRecommendListenModel: "invalid-listen-model",
            aiRecommendRefineModel: "invalid-refine-model",
            defaultPlaybackRate: 1.1,
            fixedWaveZoom: 2.5,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, false);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.aiRecommendEnabled, false);
    assert.equal(script.aiRecommendAutoFillEnabled, false);
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.defaultPlaybackRate, 1);
    assert.equal(script.fixedWaveZoom, 2);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage preserves every runtime preset, boundary and supported model", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 30 },
    platforms: {
      bytedanceAidp: {
        scripts: {
          jinhuaHelper: {
            segmentSilenceThresholdDbfs: -80,
            aiRecommendRequestTimeoutMs: 1000,
            aiRecommendListenModel: "qwen3.5-omni-plus",
            aiRecommendRefineModel: "qwen3.5-flash",
            defaultPlaybackRate: 1.75,
            fixedWaveZoom: 10,
          },
        },
      },
    },
  });

  try {
    const script = (await harness.storage.getSettings()).platforms.bytedanceAidp.scripts.jinhuaHelper;
    assert.equal(script.segmentSilenceThresholdDbfs, -80);
    assert.equal(script.aiRecommendRequestTimeoutMs, 1000);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-plus");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-flash");
    assert.equal(script.defaultPlaybackRate, 1.75);
    assert.equal(script.fixedWaveZoom, 10);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates Jinhua listen model to Omni and retains inactive two-stage values", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 30 },
    platforms: {
      bytedanceAidp: {
        scripts: {
          jinhuaHelper: {
            aiRecommendListenModel: "qwen3.5-omni-flash",
            aiRecommendListenPrompt: "旧听音 Prompt",
            aiRecommendListenTemperature: "0.2",
            aiRecommendRefineModel: "qwen3.5-flash",
            aiRecommendRefinePrompt: "旧收口 Prompt",
            aiRecommendAutoFillEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.jinhuaHelper;

    assert.equal(settings.meta.schemaVersion, 33);
    assert.equal(script.aiRecommendOmniModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendOmniPrompt, "");
    assert.equal(script.aiRecommendOmniTemperature, "");
    assert.equal(script.aiRecommendListenPrompt, "旧听音 Prompt");
    assert.equal(script.aiRecommendListenTemperature, "0.2");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-flash");
    assert.equal(script.aiRecommendRefinePrompt, "旧收口 Prompt");
    assert.equal(script.aiRecommendAutoFillEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates schema 30 Jinhua-only settings with Taizhou disabled", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 30 },
    platforms: { bytedanceAidp: {
      enabled: true,
      activeScriptId: "bytedanceAidpJinhuaHelper",
      scripts: { jinhuaHelper: { enabled: true } },
    } },
  });

  try {
    const settings = await harness.storage.getSettings();
    const aidp = settings.platforms.bytedanceAidp;
    assert.equal(settings.meta.schemaVersion, 33);
    assert.equal(aidp.activeScriptId, "bytedanceAidpJinhuaHelper");
    assert.equal(aidp.scripts.jinhuaHelper.enabled, true);
    assert.equal(aidp.scripts.suzhouHelper.enabled, false);
    assert.equal(aidp.scripts.taizhouHelper.enabled, false);
    assert.equal(aidp.scripts.taizhouHelper.aiRecommendEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates the Taizhou listen model to the single Omni field without reusing two-stage prompts", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 31 },
    platforms: { bytedanceAidp: { scripts: { taizhouHelper: {
      aiRecommendListenModel: "qwen3.5-omni-flash",
      aiRecommendListenPrompt: "旧听音 Prompt",
      aiRecommendRefinePrompt: "旧收口 Prompt",
      aiRecommendListenTemperature: "0.2",
    } } } },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.taizhouHelper;
    assert.equal(settings.meta.schemaVersion, 33);
    assert.equal(script.aiRecommendOmniModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendOmniPrompt, "");
    assert.equal(script.aiRecommendOmniTemperature, "");
    assert.equal(Object.hasOwn(script, "aiRecommendListenPrompt"), false);
    assert.equal(Object.hasOwn(script, "aiRecommendRefinePrompt"), false);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage keeps explicitly enabled Jinhua for missing or invalid legacy active IDs", async function () {
  for (const activeScriptId of [undefined, "legacy-unknown-aidp-helper"]) {
    const bytedanceAidp = { enabled: true, scripts: { jinhuaHelper: { enabled: true } } };
    if (activeScriptId !== undefined) bytedanceAidp.activeScriptId = activeScriptId;
    const harness = loadStorageApi({ meta: { schemaVersion: 30 }, platforms: { bytedanceAidp } });
    try {
      const settings = await harness.storage.getSettings();
      const aidp = settings.platforms.bytedanceAidp;
      assert.equal(settings.meta.schemaVersion, 33, String(activeScriptId));
      assert.equal(aidp.activeScriptId, "bytedanceAidpJinhuaHelper", String(activeScriptId));
      assert.equal(aidp.scripts.jinhuaHelper.enabled, true, String(activeScriptId));
      assert.equal(aidp.scripts.suzhouHelper.enabled, false, String(activeScriptId));
      assert.equal(aidp.scripts.taizhouHelper.enabled, false, String(activeScriptId));
    } finally {
      harness.cleanup();
    }
  }
});

test("ByteDance AIDP storage preserves both stages of generation parameter overrides", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        scripts: {
          suzhouHelper: {
            aiRecommendListenTemperature: "0.2",
            aiRecommendListenTopP: "0.7",
            aiRecommendListenMaxTokens: "2048",
            aiRecommendListenMaxCompletionTokens: "512",
            aiRecommendListenPresencePenalty: "-0.3",
            aiRecommendListenFrequencyPenalty: "0.4",
            aiRecommendListenSeed: "123",
            aiRecommendListenStopSequences: " END \nEND\nSTOP ",
            aiRecommendRefineTemperature: "0.1",
            aiRecommendRefineTopP: "0.8",
            aiRecommendRefineMaxTokens: "1200",
            aiRecommendRefineMaxCompletionTokens: "600",
            aiRecommendRefinePresencePenalty: "0",
            aiRecommendRefineFrequencyPenalty: "0",
            aiRecommendRefineSeed: "456",
            aiRecommendRefineStopSequences: "DONE\nDONE",
          },
        },
      },
    },
  });

  try {
    const script = (await harness.storage.getSettings()).platforms.bytedanceAidp.scripts.suzhouHelper;
    assert.equal(script.aiRecommendListenTemperature, "0.2");
    assert.equal(script.aiRecommendListenTopP, "0.7");
    assert.equal(script.aiRecommendListenMaxTokens, "2048");
    assert.equal(script.aiRecommendListenMaxCompletionTokens, "512");
    assert.equal(script.aiRecommendListenPresencePenalty, "-0.3");
    assert.equal(script.aiRecommendListenFrequencyPenalty, "0.4");
    assert.equal(script.aiRecommendListenSeed, "123");
    assert.equal(script.aiRecommendListenStopSequences, "END\nSTOP");
    assert.equal(script.aiRecommendRefineTemperature, "0.1");
    assert.equal(script.aiRecommendRefineTopP, "0.8");
    assert.equal(script.aiRecommendRefineMaxTokens, "1200");
    assert.equal(script.aiRecommendRefineMaxCompletionTokens, "600");
    assert.equal(script.aiRecommendRefinePresencePenalty, "0");
    assert.equal(script.aiRecommendRefineFrequencyPenalty, "0");
    assert.equal(script.aiRecommendRefineSeed, "456");
    assert.equal(script.aiRecommendRefineStopSequences, "DONE");
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates legacy platform AI visibility to hidden-by-default", async function () {
  const harness = loadStorageApi({
    meta: {
      schemaVersion: 24,
    },
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            platformAiEnabled: true,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.meta.schemaVersion, harness.constants.SCHEMA_VERSION);
    assert.equal(script.platformAiEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates legacy padding default and seeds new segmentation fields", async function () {
  const harness = loadStorageApi({
    meta: {
      schemaVersion: 25,
    },
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            segmentContextPaddingMs: 500,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.meta.schemaVersion, harness.constants.SCHEMA_VERSION);
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.shortcuts.togglePlayPause, null);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage clears historical default Space shortcut state during migration", async function () {
  const harness = loadStorageApi({
    meta: {
      schemaVersion: 27,
    },
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            shortcuts: {
              togglePlayPause: {
                ctrl: false,
                alt: false,
                shift: false,
                meta: false,
                key: "Space",
                button: null,
              },
            },
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.meta.schemaVersion, harness.constants.SCHEMA_VERSION);
    assert.equal(script.shortcuts.togglePlayPause, null);
    assert.equal(script.shortcuts.playSelection, null);
    assert.equal(script.shortcuts.applyPreviewSegments, null);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage keeps explicit Space shortcut when other custom shortcuts exist", async function () {
  const harness = loadStorageApi({
    meta: {
      schemaVersion: 27,
    },
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            segmentPreviewAutoApplyEnabled: false,
            shortcuts: {
              togglePlayPause: {
                ctrl: false,
                alt: false,
                shift: false,
                meta: false,
                key: "Space",
                button: null,
              },
              playSelection: {
                ctrl: true,
                alt: false,
                shift: false,
                meta: false,
                key: "p",
                button: null,
              },
            },
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(script.segmentPreviewAutoApplyEnabled, false);
    assert.deepEqual(script.shortcuts.togglePlayPause, {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: "Space",
      button: null,
    });
    assert.deepEqual(script.shortcuts.playSelection, {
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
      key: "p",
      button: null,
    });
    assert.equal(script.shortcuts.applyPreviewSegments, null);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP setScriptEnabled keeps platform AI preference while toggling runtime", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        activeScriptId: "bytedanceAidpSuzhouHelper",
        scripts: {
          suzhouHelper: {
            enabled: true,
            platformAiEnabled: false,
          },
          jinhuaHelper: {
            enabled: false,
            platformAiEnabled: false,
            aiRecommendEnabled: false,
          },
        },
      },
    },
  });

  try {
    let settings = await harness.storage.setScriptEnabled("bytedanceAidpSuzhouHelper", false);
    let script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, false);
    assert.equal(settings.platforms.bytedanceAidp.activeScriptId, "");
    assert.equal(script.enabled, false);
    assert.equal(script.platformAiEnabled, false);
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.aiRecommendEnabled, true);
    assert.equal(script.shortcuts.togglePlayPause, null);

    settings = await harness.storage.setScriptEnabled("bytedanceAidpSuzhouHelper", true);
    script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(settings.platforms.bytedanceAidp.activeScriptId, "bytedanceAidpSuzhouHelper");
    assert.equal(script.enabled, true);
    assert.equal(script.platformAiEnabled, false);
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.aiRecommendEnabled, true);
    assert.equal(script.shortcuts.togglePlayPause, null);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP setScriptEnabled switches active script to jinhua and disables suzhou", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        activeScriptId: "bytedanceAidpSuzhouHelper",
        scripts: {
          suzhouHelper: {
            enabled: true,
            platformAiEnabled: false,
            aiRecommendEnabled: true,
          },
          jinhuaHelper: {
            enabled: false,
            platformAiEnabled: false,
            aiRecommendEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.setScriptEnabled("bytedanceAidpJinhuaHelper", true);
    const suzhouScript = settings.platforms.bytedanceAidp.scripts.suzhouHelper;
    const jinhuaScript = settings.platforms.bytedanceAidp.scripts.jinhuaHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(settings.platforms.bytedanceAidp.activeScriptId, "bytedanceAidpJinhuaHelper");
    assert.equal(suzhouScript.enabled, false);
    assert.equal(suzhouScript.aiRecommendEnabled, true);
    assert.equal(jinhuaScript.enabled, true);
    assert.equal(jinhuaScript.aiRecommendEnabled, false);
    assert.equal(jinhuaScript.segmentContextPaddingMs, 300);
    assert.equal(jinhuaScript.segmentSilenceThresholdDbfs, -31);
    assert.equal(jinhuaScript.shortcuts.togglePlayPause, null);
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP setScriptEnabled activates taizhou and disables both existing helpers", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        activeScriptId: "bytedanceAidpJinhuaHelper",
        scripts: {
          suzhouHelper: { enabled: false },
          jinhuaHelper: { enabled: true },
          taizhouHelper: { enabled: false, aiRecommendEnabled: false },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.setScriptEnabled("bytedanceAidpTaizhouHelper", true);
    const scripts = settings.platforms.bytedanceAidp.scripts;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(settings.platforms.bytedanceAidp.activeScriptId, "bytedanceAidpTaizhouHelper");
    assert.equal(scripts.suzhouHelper.enabled, false);
    assert.equal(scripts.jinhuaHelper.enabled, false);
    assert.equal(scripts.taizhouHelper.enabled, true);
    assert.equal(scripts.taizhouHelper.aiRecommendEnabled, false);
  } finally {
    harness.cleanup();
  }
});
