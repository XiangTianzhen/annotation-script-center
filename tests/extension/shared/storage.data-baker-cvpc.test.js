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

test("CVPC storage defaults expose promoted liuzhou helper settings", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.deepEqual(settings.meta.backendBaseUrls, {
      server: "https://annotation-script-center.xiangtianzhen.store",
      local: "http://127.0.0.1:3333",
    });
    assert.equal(settings.meta.schemaVersion, 33);
    assert.deepEqual(Object.keys(settings.platforms).sort(), [
      "bytedanceAidp",
      "dataBakerCvpc",
      "magicData",
    ]);
    assert.deepEqual(Object.keys(settings.platforms.dataBakerCvpc.scripts), [
      "liuzhouAssistant",
    ]);
    assert.equal(settings.platforms.dataBakerCvpc.enabled, true);
    assert.equal(script.id, "dataBakerCvpcLiuzhouAssistant");
    assert.equal(script.enabled, true);
    assert.equal(script.segmentPreviewEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.aiRecommendAutoFillEnabled, true);
    assert.equal(script.recommendationValidityAutoCorrectEnabled, true);
    assert.equal(script.segmentContextPaddingMs, 200);
    assert.equal(script.aiRecommendEnabled, true);
    assert.equal(script.blockNewTabEditingTips, true);
    assert.equal(script.blockPauseStateTips, true);
    assert.equal(
      script.segmentPreviewEndpoint,
      "https://annotation-script-center.xiangtianzhen.store/api/data-baker-cvpc/liuzhou-helper/segment/preview"
    );
    assert.equal(
      script.aiRecommendEndpoint,
      "https://annotation-script-center.xiangtianzhen.store/api/data-baker-cvpc/liuzhou-helper/ai/recommend"
    );
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.segmentSilenceThresholdDbfs, -27);
    assert.equal(script.segmentSilenceThresholdUnit, "db");
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendListenPrompt, "");
    assert.equal(script.aiRecommendListenIncludeLexiconReference, false);
    assert.equal(script.aiRecommendRefinePrompt, "");
    assert.equal(script.aiRecommendModel, undefined);
    assert.equal(script.contractMode, "dom-guarded");
    assert.deepEqual(script.shortcuts, {});
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes invalid values and preserves local endpoints", async function () {
  const harness = loadStorageApi({
    meta: {
      backendEndpointMode: "local",
    },
    platforms: {
      dataBakerCvpc: {
        enabled: true,
        scripts: {
          liuzhouAssistant: {
            id: "dataBakerCvpcLiuzhouAssistant",
            enabled: true,
            segmentPreviewEnabled: false,
            segmentPreviewEndpoint:
              "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/segment/preview",
            aiRecommendEnabled: true,
            blockNewTabEditingTips: false,
            blockPauseStateTips: true,
            aiRecommendEndpoint:
              "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
            aiRecommendRequestTimeoutMs: "abc",
            segmentSilenceThresholdDbfs: "-120",
            aiRecommendModel: "  qwen3.5-omni-plus  ",
            contractMode: "",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(settings.meta.backendEndpointMode, "local");
    assert.deepEqual(settings.meta.backendBaseUrls, {
      server: "https://annotation-script-center.xiangtianzhen.store",
      local: "http://127.0.0.1:3333",
    });
    assert.equal(script.segmentPreviewEnabled, false);
    assert.equal(
      script.segmentPreviewEndpoint,
      "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/segment/preview"
    );
    assert.equal(
      script.aiRecommendEndpoint,
      "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend"
    );
    assert.equal(script.blockNewTabEditingTips, false);
    assert.equal(script.blockPauseStateTips, true);
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.segmentSilenceThresholdDbfs, -27);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-plus");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.contractMode, "dom-guarded");
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes two-stage AI fields and legacy single model fallback", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            aiRecommendListenModel: "fun-asr",
            aiRecommendListenPrompt: "  listen prompt  ",
            aiRecommendListenIncludeLexiconReference: true,
            aiRecommendListenTemperature: "9",
            aiRecommendListenTopP: "0.9",
            aiRecommendListenMaxTokens: "4096",
            aiRecommendListenMaxCompletionTokens: "512",
            aiRecommendListenPresencePenalty: "-1.2",
            aiRecommendListenFrequencyPenalty: "2.8",
            aiRecommendListenSeed: "123",
            aiRecommendListenStopSequences: " END \nEND\n STOP ",
            aiRecommendRefineModel: "invalid-model",
            aiRecommendRefinePrompt: "  refine prompt  ",
            aiRecommendRefineTemperature: "0.3",
            aiRecommendRefineTopP: "0.7",
            aiRecommendRefineMaxTokens: "2048",
            aiRecommendRefineMaxCompletionTokens: "256",
            aiRecommendRefinePresencePenalty: "0.2",
            aiRecommendRefineFrequencyPenalty: "-0.6",
            aiRecommendRefineSeed: "456",
            aiRecommendRefineStopSequences: "DONE\nDONE\nSTOP",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendListenPrompt, "listen prompt");
    assert.equal(script.aiRecommendListenIncludeLexiconReference, true);
    assert.equal(script.aiRecommendListenTemperature, "2");
    assert.equal(script.aiRecommendListenTopP, "0.9");
    assert.equal(script.aiRecommendListenMaxTokens, "4096");
    assert.equal(script.aiRecommendListenMaxCompletionTokens, "512");
    assert.equal(script.aiRecommendListenPresencePenalty, "-1.2");
    assert.equal(script.aiRecommendListenFrequencyPenalty, "2");
    assert.equal(script.aiRecommendListenSeed, "123");
    assert.equal(script.aiRecommendListenStopSequences, "END\nSTOP");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendRefinePrompt, "refine prompt");
    assert.equal(script.aiRecommendRefineTemperature, "0.3");
    assert.equal(script.aiRecommendRefineTopP, "0.7");
    assert.equal(script.aiRecommendRefineMaxTokens, "2048");
    assert.equal(script.aiRecommendRefineMaxCompletionTokens, "256");
    assert.equal(script.aiRecommendRefinePresencePenalty, "0.2");
    assert.equal(script.aiRecommendRefineFrequencyPenalty, "-0.6");
    assert.equal(script.aiRecommendRefineSeed, "456");
    assert.equal(script.aiRecommendRefineStopSequences, "DONE\nSTOP");
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage keeps valid segment silence threshold dbfs overrides", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentSilenceThresholdDbfs: "-35",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentSilenceThresholdDbfs, -35);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage preserves runtime boundary settings and every supported model", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 30 },
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentContextPaddingMs: 1500,
            segmentSilenceThresholdDbfs: -80,
            aiRecommendListenModel: "qwen3.5-omni-plus",
            aiRecommendRefineModel: "qwen3.5-flash",
          },
        },
      },
    },
  });

  try {
    const script = (await harness.storage.getSettings()).platforms.dataBakerCvpc.scripts.liuzhouAssistant;
    assert.equal(script.segmentContextPaddingMs, 1500);
    assert.equal(script.segmentSilenceThresholdDbfs, -80);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-plus");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-flash");
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes silence threshold unit overrides", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentSilenceThresholdUnit: "ratio",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentSilenceThresholdUnit, "ratio");
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage preserves the value silence threshold unit", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentSilenceThresholdUnit: "value",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    assert.equal(
      settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant.segmentSilenceThresholdUnit,
      "value"
    );
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage falls back to db when silence threshold unit is invalid", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentSilenceThresholdUnit: "invalid",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentSilenceThresholdUnit, "db");
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage keeps explicit auto-apply override for segment preview", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentPreviewAutoApplyEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentPreviewAutoApplyEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage keeps explicit auto-fill override for AI recommendation", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            aiRecommendAutoFillEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.aiRecommendAutoFillEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage keeps explicit auto-correct override for recommendation validity", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            recommendationValidityAutoCorrectEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.recommendationValidityAutoCorrectEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage keeps valid segment context padding overrides", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentContextPaddingMs: 350,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentContextPaddingMs, 350);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes invalid segment context padding back to default 200ms", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentContextPaddingMs: 2000,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentContextPaddingMs, 200);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes invalid auto-apply values back to default true", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            segmentPreviewAutoApplyEnabled: 0,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes invalid auto-fill values back to default true", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            aiRecommendAutoFillEnabled: 0,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.aiRecommendAutoFillEnabled, true);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage normalizes invalid recommendation validity auto-correct values back to default true", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            recommendationValidityAutoCorrectEnabled: 0,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.recommendationValidityAutoCorrectEnabled, true);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage migrates legacy blockEditingTabTips into both new tip toggles", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            blockEditingTabTips: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(script.blockNewTabEditingTips, false);
    assert.equal(script.blockPauseStateTips, false);
    assert.equal("blockEditingTabTips" in script, false);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage setScriptEnabled toggles platform and helper flags together", async function () {
  const harness = loadStorageApi({});

  try {
    await harness.storage.setScriptEnabled("dataBakerCvpcLiuzhouAssistant", false);
    let settings = await harness.storage.getSettings();
    let script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(settings.platforms.dataBakerCvpc.enabled, false);
    assert.equal(script.enabled, false);
    assert.equal(script.segmentPreviewEnabled, false);
    assert.equal(script.aiRecommendEnabled, false);

    await harness.storage.setScriptEnabled("dataBakerCvpcLiuzhouAssistant", true);
    settings = await harness.storage.getSettings();
    script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(settings.platforms.dataBakerCvpc.enabled, true);
    assert.equal(script.enabled, true);
    assert.equal(script.segmentPreviewEnabled, true);
    assert.equal(script.aiRecommendEnabled, true);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage preserves explicit shortcut overrides without falling back to fixed defaults", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            shortcuts: {
              preview: {
                alt: true,
                shift: true,
                key: "4",
              },
            },
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.deepEqual(script.shortcuts, {
      preview: {
        alt: true,
        shift: true,
        key: "4",
      },
    });
    assert.equal(script.shortcuts.valid, undefined);
    assert.equal(script.shortcuts.invalid, undefined);
  } finally {
    harness.cleanup();
  }
});

test("CVPC storage preserves newly added field fill shortcuts as sparse overrides", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBakerCvpc: {
        scripts: {
          liuzhouAssistant: {
            shortcuts: {
              applyDialectText: {
                alt: true,
                key: "d",
              },
              applyMandarinText: {
                alt: true,
                key: "m",
              },
            },
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.deepEqual(script.shortcuts, {
      applyDialectText: {
        alt: true,
        key: "d",
      },
      applyMandarinText: {
        alt: true,
        key: "m",
      },
    });
    assert.equal(script.shortcuts.recommend, undefined);
    assert.equal(script.shortcuts.applyRecommend, undefined);
  } finally {
    harness.cleanup();
  }
});
