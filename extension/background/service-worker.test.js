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
    browsingData: Object.prototype.hasOwnProperty.call(source, "browsingData")
      ? source.browsingData
      : {
          remove: function (_options, _dataToRemove, callback) {
            if (typeof callback === "function") {
              callback();
            }
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

test("manifest grants cookies and browsingData permissions for direct account switching", function () {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.ok(Array.isArray(manifest.permissions));
  assert.ok(manifest.permissions.includes("cookies"));
  assert.ok(manifest.permissions.includes("browsingData"));
});

test("background service worker resets AIDP login state by clearing site storage before cookies", async function () {
  const calls = [];
  const queried = [];
  const removed = [];
  const worker = loadServiceWorkerModule({
    browsingData: {
      remove: function (options, dataToRemove, callback) {
        calls.push({
          type: "browsingData.remove",
          options: options,
          dataToRemove: dataToRemove,
        });
        if (typeof callback === "function") {
          callback();
        }
      },
    },
    cookies: {
      getAll: async function (details) {
        calls.push({
          type: "cookies.getAll",
          details: details,
        });
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
          ];
        }
        if (
          details.url === "https://bytedance.com/" &&
          !details.partitionKey
        ) {
          return [
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
        if (
          details.url === "https://api.feelgood.cn/" &&
          !details.partitionKey
        ) {
          return [
            {
              name: "fg_session",
              domain: "api.feelgood.cn",
              path: "/",
              secure: true,
              storeId: "0",
            },
          ];
        }
        throw new Error("unexpected getAll query: " + JSON.stringify(details));
      },
      remove: async function (details) {
        calls.push({
          type: "cookies.remove",
          details: details,
        });
        removed.push(details);
        return {
          name: details.name,
        };
      },
    },
  });

  const result = await worker.__testOnly.resetAidpLoginState(
    "https://aidp.bytedance.com/management/task-v2?page=1"
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0], {
    type: "browsingData.remove",
    options: {
      origins: [
        "https://aidp.bytedance.com",
        "https://mpsso.jiyunhudong.com",
      ],
    },
    dataToRemove: {
      cache: true,
      cacheStorage: true,
      cookies: true,
      fileSystems: true,
      indexedDB: true,
      localStorage: true,
      serviceWorkers: true,
      webSQL: true,
    },
  });
  assert.deepEqual(queried, [
    {
      url: "https://aidp.bytedance.com/",
    },
    {
      url: "https://bytedance.com/",
    },
    {
      url: "https://mpsso.jiyunhudong.com/",
    },
    {
      url: "https://accounts.feishu.cn/",
    },
    {
      url: "https://api.feelgood.cn/",
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
      url: "https://api.feelgood.cn/",
      name: "fg_session",
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
  assert.equal(result.clearedCount, 5);
});

test("background service worker fails closed when browsingData is unavailable", async function () {
  const worker = loadServiceWorkerModule({
    browsingData: null,
  });

  const result = await worker.__testOnly.resetAidpLoginState(
    "https://aidp.bytedance.com/management"
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "browsing-data-api-unavailable",
    message: "扩展当前没有可用的站点储存清理能力。",
    clearedCount: 0,
  });
});
