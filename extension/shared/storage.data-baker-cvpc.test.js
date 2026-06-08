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

test("CVPC storage defaults expose beta liuzhou helper settings", async function () {
  const harness = loadStorageApi({});

  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant;

    assert.equal(settings.platforms.dataBakerCvpc.enabled, true);
    assert.equal(script.id, "dataBakerCvpcLiuzhouAssistant");
    assert.equal(script.enabled, true);
    assert.equal(script.segmentPreviewEnabled, true);
    assert.equal(script.aiRecommendEnabled, true);
    assert.equal(script.blockEditingTabTips, true);
    assert.equal(
      script.segmentPreviewEndpoint,
      "https://script.xiangtianzhen.store/api/data-baker-cvpc/liuzhou-helper/segment/preview"
    );
    assert.equal(
      script.aiRecommendEndpoint,
      "https://script.xiangtianzhen.store/api/data-baker-cvpc/liuzhou-helper/ai/recommend"
    );
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.aiRecommendModel, "qwen3.5-omni-flash");
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
            blockEditingTabTips: false,
            aiRecommendEndpoint:
              "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend",
            aiRecommendRequestTimeoutMs: "abc",
            aiRecommendModel: "  qwen3.5-omni-flash  ",
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
    assert.equal(script.segmentPreviewEnabled, false);
    assert.equal(
      script.segmentPreviewEndpoint,
      "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/segment/preview"
    );
    assert.equal(
      script.aiRecommendEndpoint,
      "http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend"
    );
    assert.equal(script.blockEditingTabTips, false);
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.aiRecommendModel, "qwen3.5-omni-flash");
    assert.equal(script.contractMode, "dom-guarded");
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
