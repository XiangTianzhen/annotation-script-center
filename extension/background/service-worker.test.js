"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const manifestPath = path.resolve(__dirname, "..", "manifest.json");
const serviceWorkerPath = path.resolve(__dirname, "service-worker.js");

function loadServiceWorkerModule(overrides) {
  delete require.cache[serviceWorkerPath];
  const source = overrides && typeof overrides === "object" ? overrides : {};
  const runtimeListeners = {
    installed: null,
    startup: null,
    updateAvailable: null,
    message: null,
  };
  globalThis.importScripts = function () {};
  globalThis.ASREdgeConstants = {
    EXTENSION_NAME: "标注脚本中心",
  };
  globalThis.ASREdgeStorage = {
    patchSettings: async function () {
      return {
        stage: "test",
        platforms: {
          alibabaLabelx: {
            enabled: true,
          },
        },
      };
    },
    getSettings: async function () {
      return {};
    },
  };
  globalThis.chrome = {
    runtime: {
      getURL: function (value) {
        return String(value || "");
      },
      getManifest: function () {
        return {
          version: "0.4.0",
        };
      },
      requestUpdateCheck: async function () {
        return {
          status: "no_update",
        };
      },
      onInstalled: {
        addListener: function (listener) {
          runtimeListeners.installed = listener;
        },
      },
      onStartup: {
        addListener: function (listener) {
          runtimeListeners.startup = listener;
        },
      },
      onUpdateAvailable: {
        addListener: function (listener) {
          runtimeListeners.updateAvailable = listener;
        },
      },
      onMessage: {
        addListener: function (listener) {
          runtimeListeners.message = listener;
        },
      },
    },
    cookies: source.cookies || {
      getAll: async function () {
        return [];
      },
      remove: async function () {
        return null;
      },
    },
  };
  const loaded = require(serviceWorkerPath);
  loaded.__runtimeListeners = runtimeListeners;
  return loaded;
}

test("manifest grants cookies permission for direct account switching", function () {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.ok(Array.isArray(manifest.permissions));
  assert.ok(manifest.permissions.includes("cookies"));
});

test("background service worker clears AIDP, SSO, and partitioned third-party login cookies", async function () {
  const queried = [];
  const removed = [];
  const worker = loadServiceWorkerModule({
    cookies: {
      getAll: async function (details) {
        queried.push(details);
        if (
          details.url === "https://aidp.bytedance.com/" &&
          !details.partitionKey
        ) {
          return [
            {
              name: "AIDP_ADS_USER",
              domain: "aidp.bytedance.com",
              path: "/",
              secure: true,
              storeId: "0",
            },
            {
              name: "msToken",
              domain: ".bytedance.com",
              path: "/",
              secure: true,
              storeId: "0",
            },
          ];
        }
        if (
          details.url === "https://mpsso.jiyunhudong.com/" &&
          !details.partitionKey
        ) {
          return [
            {
              name: "sso_session",
              domain: "mpsso.jiyunhudong.com",
              path: "/",
              secure: true,
              storeId: "0",
            },
          ];
        }
        if (
          details.url === "https://accounts.feishu.cn/" &&
          !details.partitionKey
        ) {
          return [];
        }
        if (
          details.url === "https://accounts.feishu.cn/" &&
          details.partitionKey &&
          details.partitionKey.topLevelSite === "https://mpsso.jiyunhudong.com"
        ) {
          return [
            {
              name: "session",
              domain: ".feishu.cn",
              path: "/",
              secure: true,
              storeId: "0",
              partitionKey: {
                topLevelSite: "https://mpsso.jiyunhudong.com",
              },
            },
          ];
        }
        throw new Error("unexpected getAll query: " + JSON.stringify(details));
      },
      remove: async function (details) {
        removed.push(details);
        return {
          name: details.name,
        };
      },
    },
  });

  const result = await worker.__testOnly.clearCookiesForUrl("https://aidp.bytedance.com/");

  assert.equal(result.ok, true);
  assert.equal(result.clearedCount, 4);
  assert.deepEqual(queried, [
    {
      url: "https://aidp.bytedance.com/",
    },
    {
      url: "https://mpsso.jiyunhudong.com/",
    },
    {
      url: "https://accounts.feishu.cn/",
    },
    {
      url: "https://accounts.feishu.cn/",
      partitionKey: {
        topLevelSite: "https://mpsso.jiyunhudong.com",
      },
    },
  ]);
  assert.deepEqual(removed, [
    {
      url: "https://aidp.bytedance.com/",
      name: "AIDP_ADS_USER",
      storeId: "0",
    },
    {
      url: "https://bytedance.com/",
      name: "msToken",
      storeId: "0",
    },
    {
      url: "https://mpsso.jiyunhudong.com/",
      name: "sso_session",
      storeId: "0",
    },
    {
      url: "https://feishu.cn/",
      name: "session",
      storeId: "0",
      partitionKey: {
        topLevelSite: "https://mpsso.jiyunhudong.com",
      },
    },
  ]);
});
