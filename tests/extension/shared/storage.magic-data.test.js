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

test("Magic Data storage defaults expose only the promoted Hangzhou helper", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const platform = settings.platforms.magicData;
    const hangzhouScript = platform.scripts.hangzhouHelper;

    assert.equal(settings.meta.schemaVersion, 32);
    assert.deepEqual(Object.keys(settings.platforms).sort(), [
      "bytedanceAidp",
      "dataBakerCvpc",
      "magicData",
    ]);
    assert.equal(platform.enabled, true);
    assert.equal(platform.activeScriptId, "");
    assert.deepEqual(Object.keys(platform.scripts), ["hangzhouHelper"]);
    assert.equal(hangzhouScript.id, "magicDataHangzhouAssistant");
    assert.equal(hangzhouScript.enabled, false);
    assert.equal(hangzhouScript.aiReviewEnabled, false);
    assert.equal(hangzhouScript.aiReviewModelMode, "two_stage");
    assert.equal(hangzhouScript.aiReviewRecognitionStrategy, "direct_dialect");
    assert.equal(hangzhouScript.aiReviewListenModel, "qwen3.5-omni-flash");
    assert.equal(hangzhouScript.aiReviewCompareModel, "qwen3.5-flash");
    assert.equal(hangzhouScript.aiReviewSingleModel, "qwen3.5-omni-flash");
    assert.equal(hangzhouScript.showHeardText, true);
    assert.equal(hangzhouScript.showEstimatedIncome, true);
    assert.equal(hangzhouScript.aiReviewRequestTimeoutMs, 60000);
    assert.deepEqual(hangzhouScript.shortcuts, {});
    assert.equal(
      settings.scriptCenter.projects.magicDataHangzhouAssistant.enabled,
      false
    );
    assert.equal(
      settings.scriptCenter.projects.magicDataHangzhouAssistant.aiReviewEnabled,
      false
    );
  } finally {
    harness.cleanup();
  }
});

test("Magic Data setScriptEnabled activates the sole Hangzhou helper and drops retired scripts", async function () {
  const harness = loadStorageApi({
    platforms: {
      magicData: {
        enabled: true,
        activeScriptId: "magicDataAnnotatorAiReview",
        scripts: {
          hakkaHelper: {
            enabled: true,
            aiReviewEnabled: true,
          },
          minnanHelper: {
            enabled: false,
            aiReviewEnabled: false,
          },
          hangzhouHelper: {
            enabled: false,
            aiReviewEnabled: false,
          },
        },
      },
    },
  });

  try {
    const settings = await harness.storage.setScriptEnabled(
      "magicDataHangzhouAssistant",
      true
    );
    const platform = settings.platforms.magicData;
    const hangzhouScript = platform.scripts.hangzhouHelper;

    assert.equal(platform.enabled, true);
    assert.equal(platform.activeScriptId, "magicDataHangzhouAssistant");
    assert.deepEqual(Object.keys(platform.scripts), ["hangzhouHelper"]);
    assert.equal(hangzhouScript.enabled, true);
    assert.equal(hangzhouScript.aiReviewEnabled, true);
    assert.equal(hangzhouScript.aiReviewModelMode, "two_stage");
    assert.equal(hangzhouScript.aiReviewRecognitionStrategy, "direct_dialect");
    assert.equal(
      settings.scriptCenter.projects.magicDataHangzhouAssistant.enabled,
      true
    );
    assert.equal(
      settings.scriptCenter.projects.magicDataHangzhouAssistant.aiReviewEnabled,
      true
    );
  } finally {
    harness.cleanup();
  }
});

test("Magic Data storage migrates old model and recognition enum values", async function () {
  const harness = loadStorageApi({
    platforms: {
      magicData: {
        scripts: {
          hangzhouHelper: {
            aiReviewModelMode: "single",
            aiReviewRecognitionStrategy: "mandarin_bridge",
          },
        },
      },
    },
  });

  try {
    const script = (await harness.storage.getSettings()).platforms.magicData.scripts.hangzhouHelper;
    assert.equal(script.aiReviewModelMode, "omni_single");
    assert.equal(script.aiReviewRecognitionStrategy, "mandarin_to_dialect");
  } finally {
    harness.cleanup();
  }
});

test("Magic Data storage preserves current enums and always disables thinking", async function () {
  const harness = loadStorageApi({
    meta: { schemaVersion: 30 },
    platforms: {
      magicData: {
        scripts: {
          hangzhouHelper: {
            aiReviewModelMode: "omni_single",
            aiReviewRecognitionStrategy: "mandarin_to_dialect",
            aiReviewEnableThinking: true,
            enableThinking: true,
          },
        },
      },
    },
  });

  try {
    const script = (await harness.storage.getSettings()).platforms.magicData.scripts.hangzhouHelper;
    assert.equal(script.aiReviewModelMode, "omni_single");
    assert.equal(script.aiReviewRecognitionStrategy, "mandarin_to_dialect");
    assert.equal(script.aiReviewEnableThinking, false);
    assert.equal(script.enableThinking, false);
  } finally {
    harness.cleanup();
  }
});
