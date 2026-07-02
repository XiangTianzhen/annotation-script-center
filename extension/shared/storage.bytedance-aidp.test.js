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

test("ByteDance AIDP storage defaults expose beta suzhou helper settings", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(script.id, "bytedanceAidpSuzhouHelper");
    assert.equal(script.enabled, true);
    assert.equal(script.platformAiEnabled, false);
    assert.equal(script.contractMode, "dom-guarded");
  } finally {
    harness.cleanup();
  }
});

test("ByteDance AIDP storage migrates legacy visible-by-default config to hidden-by-default", async function () {
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

test("ByteDance AIDP setScriptEnabled keeps platform AI preference while toggling runtime", async function () {
  const harness = loadStorageApi({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
            platformAiEnabled: false,
          },
        },
      },
    },
  });

  try {
    let settings = await harness.storage.setScriptEnabled("bytedanceAidpSuzhouHelper", false);
    let script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, false);
    assert.equal(script.enabled, false);
    assert.equal(script.platformAiEnabled, false);

    settings = await harness.storage.setScriptEnabled("bytedanceAidpSuzhouHelper", true);
    script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(script.enabled, true);
    assert.equal(script.platformAiEnabled, false);
  } finally {
    harness.cleanup();
  }
});
