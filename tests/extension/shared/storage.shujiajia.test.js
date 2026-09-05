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

test("Shujiajia schema 43 defaults separate initial and next automatic whole-segment delays", async () => {
  const harness = load({ meta: { schemaVersion: 36 } });
  try {
    const settings = await harness.storage.getSettings();
    const script = settings.platforms.shujiajia.scripts.luzhouHelper;
    assert.equal(settings.meta.schemaVersion, 43);
    assert.equal(harness.constants.SHUJIAJIA_LUZHOU_HELPER_SCRIPT_ID, "shujiajiaLuzhouHelper");
    assert.equal(settings.platforms.shujiajia.enabled, true);
    assert.equal(script.enabled, false);
    assert.equal(script.aiRecommendListenModel, "qwen3.5-omni-flash");
    assert.equal(script.aiRecommendRefineModel, "qwen3.5-plus");
    assert.equal(script.aiRecommendRequestTimeoutMs, 60000);
    assert.equal(script.autoCreateWholeSegmentOnNewItemEnabled, false);
    assert.equal(script.autoCreateWholeSegmentInitialDelayMs, 2500);
    assert.equal(script.autoCreateWholeSegmentNextDelayMs, 500);
    assert.equal("autoCreateWholeSegmentDelayMs" in script, false);
    assert.equal(script.autoRecognizeAfterWholeSegmentEnabled, false);
    assert.equal(script.aiRecommendAutoFillEnabled, true);
    assert.deepEqual(script.shortcuts, {});
  } finally {
    harness.cleanup();
  }
});

test("Shujiajia schema 43 migration adds both delay defaults and preserves automation choices and five helper shortcuts", async () => {
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
    assert.equal(script.autoCreateWholeSegmentInitialDelayMs, 2500);
    assert.equal(script.autoCreateWholeSegmentNextDelayMs, 500);
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

test("Shujiajia initial and next automatic whole-segment delays accept 500 through 5000 milliseconds", async () => {
  const cases = [
    ["autoCreateWholeSegmentInitialDelayMs", "autoCreateWholeSegmentNextDelayMs", 500, [[500, 500], [5000, 5000], [499, 2500], [5001, 2500], [null, 2500], ["", 2500], ["4200", 4200]]],
    ["autoCreateWholeSegmentNextDelayMs", "autoCreateWholeSegmentInitialDelayMs", 2500, [[500, 500], [5000, 5000], [499, 500], [5001, 500], [null, 500], ["", 500], ["4200", 4200]]],
  ];
  for (const [field, otherField, otherDefault, values] of cases) {
    for (const [input, expected] of values) {
      const harness = load({
        meta: { schemaVersion: 43 },
        platforms: { shujiajia: { scripts: { luzhouHelper: { [field]: input } } } },
      });
      try {
        const script = (await harness.storage.getSettings()).platforms.shujiajia.scripts.luzhouHelper;
        assert.equal(script[field], expected, `${field}:${input}`);
        assert.equal(script[otherField], otherDefault);
      } finally {
        harness.cleanup();
      }
    }
  }
});

test("schema 43 migrates the legacy single delay to next delay and supplies the initial delay", async () => {
  for (const [input, expected] of [[500, 500], [2500, 2500], [4200, 4200], [0, 500], [50000, 500]]) {
    const harness = load({
      meta: { schemaVersion: 42 },
      platforms: { shujiajia: { scripts: { luzhouHelper: { autoCreateWholeSegmentDelayMs: input } } } },
    });
    try {
      const settings = await harness.storage.getSettings();
      const script = settings.platforms.shujiajia.scripts.luzhouHelper;
      assert.equal(settings.meta.schemaVersion, 43);
      assert.equal(script.autoCreateWholeSegmentInitialDelayMs, 2500, String(input));
      assert.equal(script.autoCreateWholeSegmentNextDelayMs, expected, String(input));
      assert.equal("autoCreateWholeSegmentDelayMs" in script, false);
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
