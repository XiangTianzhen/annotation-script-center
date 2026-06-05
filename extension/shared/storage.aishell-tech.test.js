"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const constantsModulePath = path.resolve(__dirname, "constants.js");
const storageModulePath = path.resolve(__dirname, "storage.js");

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

test("Aishell storage defaults use the aligned Minnan standard", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const dataBakerScript = settings.platforms.dataBaker.scripts.roundOneQuality;
    const script = settings.platforms.aishellTech.scripts.minnanHelper;

    assert.equal(dataBakerScript.aiQualifiedAutofillConcurrency, 5);
    assert.equal(script.aiRecommendPipelineMode, "two_stage");
    assert.equal(script.aiRecommendRecognitionStrategy, "audio_first_reference");
    assert.equal(script.aiRecommendCompareModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendAudioFirstReferenceCorrectionThreshold, 0.75);
    assert.equal(script.aiQualifiedAutofillConcurrency, 5);
  } finally {
    harness.cleanup();
  }
});

test("Aishell storage upgrades legacy strategy values to audio-first", async function () {
  const harness = loadStorageApi({
    platforms: {
      aishellTech: {
        enabled: true,
        scripts: {
          minnanHelper: {
            id: "aishellTechMinnanAssistant",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendPipelineMode: "two_stage",
            aiRecommendRecognitionStrategy: "direct_dialect",
            aiRecommendListenModel: "qwen3.5-omni-flash",
            aiRecommendCompareModel: "qwen3.5-flash",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.aishellTech.scripts.minnanHelper;

    assert.equal(script.aiRecommendRecognitionStrategy, "audio_first_reference");
    assert.equal(script.aiRecommendCompareModel, "qwen3.5-flash");
  } finally {
    harness.cleanup();
  }
});

test("Aishell storage keeps customized model choices but still normalizes strategy to audio-first", async function () {
  const harness = loadStorageApi({
    platforms: {
      aishellTech: {
        enabled: true,
        scripts: {
          minnanHelper: {
            id: "aishellTechMinnanAssistant",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendPipelineMode: "two_stage",
            aiRecommendRecognitionStrategy: "direct_dialect",
            aiRecommendListenModel: "fun-asr",
            aiRecommendCompareModel: "qwen3.6-plus",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.aishellTech.scripts.minnanHelper;

    assert.equal(script.aiRecommendRecognitionStrategy, "audio_first_reference");
    assert.equal(script.aiRecommendCompareModel, "qwen3.6-plus");
  } finally {
    harness.cleanup();
  }
});

test("Aishell storage keeps audio-first recognition strategy untouched", async function () {
  const harness = loadStorageApi({
    platforms: {
      aishellTech: {
        enabled: true,
        scripts: {
          minnanHelper: {
            id: "aishellTechMinnanAssistant",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendPipelineMode: "two_stage",
            aiRecommendRecognitionStrategy: "audio_first_reference",
            aiRecommendAudioFirstReferenceCorrectionThreshold: 0.812,
            aiRecommendListenModel: "fun-asr",
            aiRecommendCompareModel: "qwen3.5-plus",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.aishellTech.scripts.minnanHelper;

    assert.equal(script.aiRecommendRecognitionStrategy, "audio_first_reference");
    assert.equal(script.aiRecommendCompareModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendAudioFirstReferenceCorrectionThreshold, 0.812);
  } finally {
    harness.cleanup();
  }
});

test("storage keeps customized legal autofill concurrency values untouched", async function () {
  const harness = loadStorageApi({
    platforms: {
      dataBaker: {
        enabled: true,
        scripts: {
          roundOneQuality: {
            id: "dataBakerRoundOneQuality",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendPipelineMode: "two_stage",
            aiRecommendListenModel: "qwen3.5-omni-flash",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
            aiQualifiedAutofillConcurrency: 12,
          },
        },
      },
      aishellTech: {
        enabled: true,
        scripts: {
          minnanHelper: {
            id: "aishellTechMinnanAssistant",
            enabled: true,
            aiRecommendEnabled: true,
            aiRecommendPipelineMode: "two_stage",
            aiRecommendRecognitionStrategy: "mandarin_to_dialect",
            aiRecommendListenModel: "fun-asr",
            aiRecommendSingleModel: "qwen3.5-omni-flash",
            aiQualifiedAutofillConcurrency: 9,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.getSettings();

    assert.equal(settings.platforms.dataBaker.scripts.roundOneQuality.aiQualifiedAutofillConcurrency, 12);
    assert.equal(settings.platforms.aishellTech.scripts.minnanHelper.aiQualifiedAutofillConcurrency, 9);
  } finally {
    harness.cleanup();
  }
});
