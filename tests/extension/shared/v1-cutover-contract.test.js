"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const extensionRoot = resolveRepo("extension");
const constantsPath = resolveRepo("extension", "shared", "constants.js");
const storagePath = resolveRepo("extension", "shared", "storage.js");
const manifestPath = path.join(extensionRoot, "manifest.json");

const RETAINED_PLATFORM_IDS = ["bytedanceAidp", "dataBakerCvpc", "magicData"];
const RETAINED_SCRIPT_IDS = [
  "bytedanceAidpJinhuaHelper",
  "bytedanceAidpSuzhouHelper",
  "bytedanceAidpTaizhouHelper",
  "dataBakerCvpcLiuzhouAssistant",
  "magicDataHangzhouAssistant",
];

function loadConstants() {
  delete require.cache[constantsPath];
  delete globalThis.ASREdgeConstants;
  return require(constantsPath);
}

function loadStorage(initialSettings) {
  const constants = loadConstants();
  delete require.cache[storagePath];
  delete globalThis.ASREdgeStorage;

  const store = {
    [constants.STORAGE_KEY]: initialSettings || {},
  };
  globalThis.chrome = {
    runtime: { id: "test-extension", lastError: null },
    storage: {
      local: {
        get(key, callback) {
          callback({ [key]: store[key] });
        },
        set(payload, callback) {
          Object.assign(store, payload || {});
          callback();
        },
      },
    },
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

test("1.0.0 catalog contains the five promoted scripts", function () {
  const constants = loadConstants();
  const platformIds = Object.values(constants.PLATFORM_LIBRARY)
    .map((item) => item.id)
    .sort();
  const scripts = Object.values(constants.SCRIPT_LIBRARY);
  const scriptIds = scripts.map((item) => item.id).sort();

  assert.deepEqual(platformIds, RETAINED_PLATFORM_IDS);
  assert.deepEqual(scriptIds, RETAINED_SCRIPT_IDS);
  assert.equal(scripts.every((item) => !("visibility" in item)), true);
  assert.equal(constants.SCHEMA_VERSION, 34);
});

test("1.0.0 constants expose only server and local backend modes", function () {
  const constants = loadConstants();

  assert.deepEqual(constants.DEFAULT_BACKEND_BASE_URLS, {
    server: "https://annotation-script-center.xiangtianzhen.store",
    local: "http://127.0.0.1:3333",
  });
  assert.equal(constants.normalizeBackendEndpointMode("unsupported", "local"), "server");
  assert.deepEqual(
    Object.keys(constants.DEFAULT_SETTINGS.meta.backendBaseUrls).sort(),
    ["local", "server"]
  );
});

test("1.0.0 runtime accessibility follows retained script enablement and AIDP three-way mutual exclusion", function () {
  const constants = loadConstants();
  const settings = cloneForRuntimeTest(constants.DEFAULT_SETTINGS);

  assert.equal(constants.isScriptRuntimeAccessible("dataBakerCvpcLiuzhouAssistant", {}), true);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpSuzhouHelper", {}), true);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpJinhuaHelper", {}), false);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpTaizhouHelper", {}), false);
  assert.equal(constants.isScriptRuntimeAccessible("magicDataHangzhouAssistant", {}), false);

  assert.equal(constants.isScriptRuntimeAccessible("dataBakerCvpcLiuzhouAssistant", settings), true);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpSuzhouHelper", settings), true);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpJinhuaHelper", settings), false);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpTaizhouHelper", settings), false);
  assert.equal(constants.isScriptRuntimeAccessible("magicDataHangzhouAssistant", settings), false);

  settings.platforms.bytedanceAidp.activeScriptId = "bytedanceAidpJinhuaHelper";
  settings.platforms.bytedanceAidp.scripts.suzhouHelper.enabled = false;
  settings.platforms.bytedanceAidp.scripts.jinhuaHelper.enabled = true;
  settings.platforms.bytedanceAidp.scripts.taizhouHelper.enabled = false;
  settings.platforms.magicData.activeScriptId = "magicDataHangzhouAssistant";
  settings.platforms.magicData.scripts.hangzhouHelper.enabled = true;
  settings.platforms.magicData.scripts.hangzhouHelper.aiReviewEnabled = true;

  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpSuzhouHelper", settings), false);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpJinhuaHelper", settings), true);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpTaizhouHelper", settings), false);

  settings.platforms.bytedanceAidp.activeScriptId = "bytedanceAidpTaizhouHelper";
  settings.platforms.bytedanceAidp.scripts.jinhuaHelper.enabled = false;
  settings.platforms.bytedanceAidp.scripts.taizhouHelper.enabled = true;
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpJinhuaHelper", settings), false);
  assert.equal(constants.isScriptRuntimeAccessible("bytedanceAidpTaizhouHelper", settings), true);
  assert.equal(constants.isScriptRuntimeAccessible("magicDataHangzhouAssistant", settings), true);
});

function cloneForRuntimeTest(value) {
  return JSON.parse(JSON.stringify(value));
}

test("1.0.0 settings normalization preserves retained settings and drops unknown state", async function () {
  const harness = loadStorage({
    meta: {
      schemaVersion: 31,
      backendEndpointMode: "server",
      backendBaseUrls: {
        server: "https://server.example.test",
        local: "http://127.0.0.1:4444",
      },
      aiUsageOperatorName: "测试人员",
      aiCallLogDownloadOperatorName: "日志人员",
      publicCenterPlatformOrder: ["unknownPlatform", "magicData", "bytedanceAidp", "dataBakerCvpc"],
      unknownMeta: "remove-me",
    },
    platforms: {
      dataBakerCvpc: {
        enabled: true,
        scripts: { liuzhouAssistant: { enabled: false, segmentContextPaddingMs: 360 } },
      },
      bytedanceAidp: {
        enabled: true,
        activeScriptId: "bytedanceAidpJinhuaHelper",
        scripts: {
          suzhouHelper: { enabled: false },
          jinhuaHelper: { enabled: true, segmentContextPaddingMs: 280 },
          taizhouHelper: { enabled: false },
        },
      },
      magicData: {
        enabled: true,
        activeScriptId: "magicDataHangzhouAssistant",
        scripts: {
          unknownHelper: { enabled: true },
          hangzhouHelper: { enabled: true, aiReviewRequestTimeoutMs: 45000 },
        },
      },
      unknownPlatform: { enabled: true },
    },
    unknownRoot: true,
  });

  try {
    const settings = await harness.storage.getSettings();
    assert.deepEqual(Object.keys(settings.platforms).sort(), RETAINED_PLATFORM_IDS);
    assert.equal(settings.meta.schemaVersion, 34);
    assert.equal(settings.meta.backendEndpointMode, "server");
    assert.deepEqual(settings.meta.backendBaseUrls, {
      server: "https://server.example.test",
      local: "http://127.0.0.1:4444",
    });
    assert.equal(settings.meta.aiUsageOperatorName, "测试人员");
    assert.equal(settings.meta.aiCallLogDownloadOperatorName, "日志人员");
    assert.deepEqual(settings.meta.publicCenterPlatformOrder, [
      "magicData",
      "bytedanceAidp",
      "dataBakerCvpc",
    ]);
    assert.equal(settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant.enabled, false);
    assert.equal(settings.platforms.bytedanceAidp.activeScriptId, "bytedanceAidpJinhuaHelper");
    assert.equal(settings.platforms.bytedanceAidp.scripts.jinhuaHelper.segmentContextPaddingMs, 280);
    assert.equal(settings.platforms.magicData.scripts.hangzhouHelper.aiReviewRequestTimeoutMs, 45000);
    assert.deepEqual(Object.keys(settings.platforms.magicData.scripts), ["hangzhouHelper"]);
    assert.equal("unknownMeta" in settings.meta, false);
    assert.equal("unknownRoot" in settings, false);
  } finally {
    harness.cleanup();
  }
});

test("1.0.0 manifest references every retained runtime", function () {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const scriptPaths = (manifest.content_scripts || []).flatMap((entry) => entry.js || []);
  const resourcePaths = (manifest.web_accessible_resources || []).flatMap(
    (entry) => entry.resources || []
  );
  const allPaths = scriptPaths.concat(resourcePaths);
  const joined = allPaths.join("\n");

  assert.equal(manifest.version, "1.1.0");
  assert.equal("update_url" in manifest, false);
  assert.match(joined, /sites\/data-baker-cvpc\/liuzhou-helper\//);
  assert.match(joined, /sites\/bytedance-aidp\/suzhou-helper\//);
  assert.match(joined, /sites\/bytedance-aidp\/jinhua-helper\//);
  assert.match(joined, /sites\/bytedance-aidp\/taizhou-helper\//);
  assert.match(joined, /sites\/magic-data\/hangzhou-helper\//);
  assert.doesNotMatch(
    joined,
    /build-meta|sites\/(?:alibaba-labelx|data-baker|abaka-ai|haitian-utrans|aishell-tech)\/|magic-data\/(?:hakka-helper|minnan-helper)\//
  );
  assert.equal(resourcePaths.length, 0);
  allPaths.forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(extensionRoot, relativePath)), true, relativePath);
  });
});
