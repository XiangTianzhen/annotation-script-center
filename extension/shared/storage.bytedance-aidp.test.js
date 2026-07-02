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
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.defaultPlaybackRate, 1);
    assert.equal(script.fixedWaveZoom, 2);
    assert.equal(script.contractMode, "dom-guarded");
    assert.equal(script.shortcuts.togglePlayPause, null);
    assert.equal(script.shortcuts.playSelection, null);
    assert.equal(script.shortcuts.jumpToFirstFrame, null);
    assert.equal(script.shortcuts.deleteCurrentSelection, null);
    assert.equal(script.shortcuts.clearSegments, null);
    assert.equal(script.shortcuts.previewSegments, null);
    assert.equal(script.shortcuts.applyPreviewSegments, null);
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
    assert.equal(script.defaultPlaybackRate, 1);
    assert.equal(script.fixedWaveZoom, 2);
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
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.shortcuts.togglePlayPause, null);

    settings = await harness.storage.setScriptEnabled("bytedanceAidpSuzhouHelper", true);
    script = settings.platforms.bytedanceAidp.scripts.suzhouHelper;

    assert.equal(settings.platforms.bytedanceAidp.enabled, true);
    assert.equal(script.enabled, true);
    assert.equal(script.platformAiEnabled, false);
    assert.equal(script.segmentContextPaddingMs, 300);
    assert.equal(script.segmentSilenceThresholdDbfs, -31);
    assert.equal(script.mergeContiguousSuggestedSegmentsEnabled, true);
    assert.equal(script.segmentPreviewAutoApplyEnabled, true);
    assert.equal(script.shortcuts.togglePlayPause, null);
  } finally {
    harness.cleanup();
  }
});
