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

test("Magic Data storage defaults expose Hangzhou helper as a hidden third script", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const platform = settings.platforms.magicData;
    const hakkaScript = platform.scripts.hakkaHelper;
    const minnanScript = platform.scripts.minnanHelper;
    const hangzhouScript = platform.scripts.hangzhouHelper;

    assert.equal(platform.enabled, true);
    assert.equal(platform.activeScriptId, "magicDataAnnotatorAiReview");
    assert.equal(hakkaScript.id, "magicDataAnnotatorAiReview");
    assert.equal(hakkaScript.enabled, true);
    assert.equal(hakkaScript.aiReviewEnabled, true);
    assert.equal(minnanScript.id, "magicDataMinnanAssistant");
    assert.equal(minnanScript.enabled, false);
    assert.equal(minnanScript.aiReviewEnabled, false);
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

test("Magic Data setScriptEnabled switches active script to Hangzhou and disables Hakka and Minnan", async function () {
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
    const hakkaScript = platform.scripts.hakkaHelper;
    const minnanScript = platform.scripts.minnanHelper;
    const hangzhouScript = platform.scripts.hangzhouHelper;

    assert.equal(platform.enabled, true);
    assert.equal(platform.activeScriptId, "magicDataHangzhouAssistant");
    assert.equal(hakkaScript.enabled, false);
    assert.equal(hakkaScript.aiReviewEnabled, false);
    assert.equal(minnanScript.enabled, false);
    assert.equal(minnanScript.aiReviewEnabled, false);
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
