"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const constantsPath = resolveRepo("extension", "shared", "constants.js");
const storagePath = resolveRepo("extension", "shared", "storage.js");

function load(initialSettings) {
  delete require.cache[constantsPath];
  delete require.cache[storagePath];
  delete globalThis.ASREdgeConstants;
  delete globalThis.ASREdgeStorage;
  const constants = require(constantsPath);
  const store = { [constants.STORAGE_KEY]: initialSettings || {} };
  globalThis.ASREdgeConstants = constants;
  globalThis.chrome = {
    runtime: { id: "test", lastError: null },
    storage: { local: {
      get(key, callback) { callback({ [key]: store[key] }); },
      set(payload, callback) { Object.assign(store, payload); callback(); },
    } },
  };
  require(storagePath);
  return {
    constants,
    storage: globalThis.ASREdgeStorage,
    cleanup() {
      delete require.cache[constantsPath];
      delete require.cache[storagePath];
      delete globalThis.ASREdgeConstants;
      delete globalThis.ASREdgeStorage;
      delete globalThis.chrome;
    },
  };
}

test("Shujiajia schema 42 defaults use a 500ms automatic whole-segment delay", async () => {
  const harness = load({ meta: { schemaVersion: 36 } });
  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.shujiajia.scripts.luzhouHelper;
    assert.equal(settings.meta.schemaVersion, 42);
    assert.equal(harness.constants.SHUJIAJIA_LUZHOU_HELPER_SCRIPT_ID, "shujiajiaLuzhouHelper");
    assert.equal(settings.platforms.shujiajia.enabled, true);
    assert.equal(script.enabled, false);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.autoCreateWholeSegmentOnNewItemEnabled, false);
    assert.equal(script.autoCreateWholeSegmentDelayMs, 500);
    assert.equal(script.autoRecognizeAfterWholeSegmentEnabled, false);
    assert.equal(script.aiRecommendAutoFillEnabled, true);
    assert.deepEqual(script.shortcuts, {});
  } finally {
    harness.cleanup();
  }
});

test("Shujiajia schema 42 migration adds the new 500ms delay and preserves automation choices and five helper shortcuts", async () => {
  const harness = load({
    meta: { schemaVersion: 39 },
    platforms: { shujiajia: { scripts: { luzhouHelper: {
      enabled: true,
      aiRecommendListenModel: "qwen3.5-omni-plus",
      aiRecommendRefineModel: "qwen3.5-flash",
      aiRecommendRequestTimeoutMs: 90000,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: true,
      aiRecommendAutoFillEnabled: false,
      shortcuts: {
        togglePlayPause: { key: "p", ctrl: true },
        createWholeSegment: { key: "d", shift: true },
        recognizeWhole: { key: "r", ctrl: true },
        fillRecognition: { key: "f", alt: true },
        insertOverlapStart: { key: "[", alt: true },
        insertOverlapEnd: { key: "]", alt: true },
        markEffective: { key: "1" },
        temporarySave: { key: "s", ctrl: true },
        submitNext: { key: "Enter", ctrl: true },
      },
    } } } },
  });
  try {
    const script = (await harness.storage.getSettings()).platforms.shujiajia.scripts.luzhouHelper;
    assert.equal(script.enabled, true);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-plus");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-flash");
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.autoCreateWholeSegmentOnNewItemEnabled, true);
    assert.equal(script.autoCreateWholeSegmentDelayMs, 500);
    assert.equal(script.autoRecognizeAfterWholeSegmentEnabled, true);
    assert.equal(script.aiRecommendAutoFillEnabled, true);
    assert.deepEqual(script.shortcuts, {
      createWholeSegment: { key: "d", shift: true },
      recognizeWhole: { key: "r", ctrl: true },
      fillRecognition: { key: "f", alt: true },
      insertOverlapStart: { key: "[", alt: true },
      insertOverlapEnd: { key: "]", alt: true },
    });
  } finally {
    harness.cleanup();
  }
});

test("schema 40 preserves an explicit disabled auto-fill choice", async () => {
  const harness = load({
    meta: { schemaVersion: 40 },
    platforms: { shujiajia: { scripts: { luzhouHelper: {
      aiRecommendAutoFillEnabled: false,
    } } } },
  });
  try {
    const script = (await harness.storage.getSettings()).platforms.shujiajia.scripts.luzhouHelper;
    assert.equal(script.aiRecommendAutoFillEnabled, false);
  } finally {
    harness.cleanup();
  }
});

test("Shujiajia automatic whole-segment delay accepts 0 through 50000 milliseconds", async () => {
  for (const [input, expected] of [[0, 0], [50000, 50000], [-1, 500], [50001, 500], [null, 500], ["", 500], ["4200", 4200]]) {
    const harness = load({
      meta: { schemaVersion: 42 },
      platforms: { shujiajia: { scripts: { luzhouHelper: { autoCreateWholeSegmentDelayMs: input } } } },
    });
    try {
      const script = (await harness.storage.getSettings()).platforms.shujiajia.scripts.luzhouHelper;
      assert.equal(script.autoCreateWholeSegmentDelayMs, expected, String(input));
    } finally {
      harness.cleanup();
    }
  }
});

test("schema 42 migrates only the previous 2500ms default and preserves other custom delays", async () => {
  for (const [input, expected] of [[2500, 500], [0, 0], [4200, 4200], [50000, 50000]]) {
    const harness = load({
      meta: { schemaVersion: 41 },
      platforms: { shujiajia: { scripts: { luzhouHelper: { autoCreateWholeSegmentDelayMs: input } } } },
    });
    try {
      const settings = await harness.storage.getSettings();
      assert.equal(settings.meta.schemaVersion, 42);
      assert.equal(settings.platforms.shujiajia.scripts.luzhouHelper.autoCreateWholeSegmentDelayMs, expected, String(input));
    } finally {
      harness.cleanup();
    }
  }
});

test("setScriptEnabled toggles the Shujiajia helper with auto-fill enabled by default", async () => {
  const harness = load({});
  try {
    const settings = await harness.storage.setScriptEnabled("shujiajiaLuzhouHelper", true);
    assert.equal(settings.platforms.shujiajia.enabled, true);
    assert.equal(settings.platforms.shujiajia.scripts.luzhouHelper.enabled, true);
    assert.equal(settings.platforms.shujiajia.scripts.luzhouHelper.aiRecommendEnabled, true);
    assert.equal(settings.platforms.shujiajia.scripts.luzhouHelper.aiRecommendAutoFillEnabled, true);
  } finally {
    harness.cleanup();
  }
});
