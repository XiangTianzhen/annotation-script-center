"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const manifestPath = resolveRepo("extension", "manifest.json");
const serviceWorkerPath = resolveRepo("extension", "background", "service-worker.js");

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
    debugger: source.debugger || null,
  };
  const loaded = require(serviceWorkerPath);
  loaded.__runtimeListeners = runtimeListeners;
  return loaded;
}

test("manifest grants cookies, browsingData, and debugger permissions for the approved AIDP actions", function () {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.ok(Array.isArray(manifest.permissions));
  assert.ok(manifest.permissions.includes("cookies"));
  assert.ok(manifest.permissions.includes("browsingData"));
  assert.ok(manifest.permissions.includes("debugger"));
});

test("background dispatches exactly one debugger mouse click for the current node 17 quality-submit item", async function () {
  const calls = [];
  const worker = loadServiceWorkerModule({
    debugger: {
      attach: async function (target, version) {
        calls.push({ type: "attach", target: target, version: version });
      },
      sendCommand: async function (target, command, params) {
        calls.push({ type: "command", target: target, command: command, params: params });
      },
      detach: async function (target) {
        calls.push({ type: "detach", target: target });
      },
    },
  });

  const result = await worker.__testOnly.triggerAidpInternalQualityDebuggerClick(
    {
      type: worker.__testOnly.AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE,
      action: "submit",
      itemId: "item-17",
      x: 220,
      y: 65,
    },
    {
      frameId: 0,
      tab: {
        id: 42,
        url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17",
      },
    }
  );

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [
    { type: "attach", target: { tabId: 42 }, version: "1.3" },
    {
      type: "command",
      target: { tabId: 42 },
      command: "Input.dispatchMouseEvent",
      params: {
        type: "mousePressed",
        x: 220,
        y: 65,
        button: "left",
        buttons: 1,
        clickCount: 1,
      },
    },
    {
      type: "command",
      target: { tabId: 42 },
      command: "Input.dispatchMouseEvent",
      params: {
        type: "mouseReleased",
        x: 220,
        y: 65,
        button: "left",
        buttons: 0,
        clickCount: 1,
      },
    },
    { type: "detach", target: { tabId: 42 } },
  ]);
});

test("background reports a safe attach failure instead of treating a rejected debugger session as a click", async function () {
  const worker = loadServiceWorkerModule({
    debugger: {
      attach: async function () {
        throw new Error("attach rejected");
      },
      sendCommand: async function () {
        throw new Error("must not dispatch input without attaching");
      },
      detach: async function () {},
    },
  });

  const result = await worker.__testOnly.triggerAidpInternalQualityDebuggerClick(
    {
      type: worker.__testOnly.AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE,
      action: "quality-ok-radio",
      itemId: "item-17",
      x: 220,
      y: 65,
    },
    {
      frameId: 0,
      tab: {
        id: 42,
        url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17",
      },
    }
  );

  assert.deepEqual(result, { ok: false, reason: "debugger-attach-failed" });
});

test("background dispatches a guarded Shift drag with continuous trusted mouse movement", async function () {
  const calls = [];
  const worker = loadServiceWorkerModule({
    debugger: {
      attach: async function () { calls.push({ type: "attach" }); },
      sendCommand: async function (_target, command, params) { calls.push({ type: "command", command, params }); },
      detach: async function () { calls.push({ type: "detach" }); },
    },
  });
  const result = await worker.__testOnly.triggerShujiajiaTrustedInput({
    type: worker.__testOnly.SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE,
    action: "shift-drag",
    startX: 101,
    startY: 210,
    endX: 899,
    endY: 210,
  }, {
    frameId: 0,
    tab: { id: 9, url: "https://www.shujiajia.com/workbench/piece/mark.html?taskId=redacted", width: 1000, height: 700 },
  });

  assert.deepEqual(result, { ok: true });
  const commands = calls.filter((item) => item.type === "command");
  assert.equal(commands[0].params.type, "mouseMoved");
  assert.equal(commands[1].params.type, "mousePressed");
  assert.equal(commands.at(-1).params.type, "mouseReleased");
  assert.ok(commands.slice(2, -1).length >= 8);
  assert.ok(commands.every((item) => item.command === "Input.dispatchMouseEvent"));
  assert.ok(commands.every((item) => item.params.modifiers === 8));
  assert.equal(calls.at(-1).type, "detach");
});

test("background rejects Shujiajia trusted input outside the top mark page or viewport", async function () {
  const worker = loadServiceWorkerModule({ debugger: {} });
  const base = {
    type: worker.__testOnly.SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE,
    action: "shift-drag",
    startX: 10, startY: 20, endX: 800, endY: 20,
  };
  assert.equal(worker.__testOnly.getShujiajiaTrustedInputTarget(base, {
    frameId: 1,
    tab: { id: 9, url: "https://www.shujiajia.com/workbench/piece/mark.html", width: 900, height: 700 },
  }), null);
  assert.equal(worker.__testOnly.getShujiajiaTrustedInputTarget(base, {
    frameId: 0,
    tab: { id: 9, url: "https://example.com/workbench/piece/mark.html", width: 900, height: 700 },
  }), null);
  assert.equal(worker.__testOnly.getShujiajiaTrustedInputTarget({ ...base, endX: 901 }, {
    frameId: 0,
    tab: { id: 9, url: "https://www.shujiajia.com/workbench/piece/mark.html", width: 900, height: 700 },
  }), null);
});

test("background rejects trusted Delete requests for Shujiajia", async function () {
  const commands = [];
  const worker = loadServiceWorkerModule({
    debugger: {
      attach: async function () {},
      sendCommand: async function (_target, command, params) { commands.push({ command, params }); },
      detach: async function () {},
    },
  });
  const result = await worker.__testOnly.triggerShujiajiaTrustedInput({
    type: worker.__testOnly.SHUJIAJIA_TRUSTED_INPUT_MESSAGE_TYPE,
    action: "delete",
  }, {
    frameId: 0,
    tab: { id: 9, url: "https://www.shujiajia.com/workbench/piece/mark.html", width: 1000, height: 700 },
  });
  assert.deepEqual(result, { ok: false, reason: "trusted-input-unavailable" });
  assert.deepEqual(commands, []);
});

test("background refuses debugger quality-submit clicks outside the exact current node 17 page", async function () {
  const calls = [];
  const worker = loadServiceWorkerModule({
    debugger: {
      attach: async function () {
        calls.push("attach");
      },
      sendCommand: async function () {
        calls.push("command");
      },
      detach: async function () {
        calls.push("detach");
      },
    },
  });
  const message = {
    type: worker.__testOnly.AIDP_INTERNAL_QUALITY_DEBUGGER_CLICK_MESSAGE_TYPE,
    action: "submit",
    itemId: "item-17",
    x: 220,
    y: 65,
  };

  for (const sender of [
    { frameId: 1, tab: { id: 42, url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17" } },
    { frameId: 0, tab: { id: 42, url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/14?itemID=item-17" } },
    { frameId: 0, tab: { id: 42, url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=other" } },
    { frameId: 0, tab: { id: 42, url: "https://example.test/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17" } },
  ]) {
    const result = await worker.__testOnly.triggerAidpInternalQualityDebuggerClick(message, sender);
    assert.equal(result.ok, false);
  }
  const wrongTypeResult = await worker.__testOnly.triggerAidpInternalQualityDebuggerClick(
    Object.assign({}, message, { type: "ASR_EDGE_UNRELATED_MESSAGE" }),
    {
      frameId: 0,
      tab: {
        id: 42,
        url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17",
      },
    }
  );
  assert.equal(wrongTypeResult.ok, false);
  const wrongActionResult = await worker.__testOnly.triggerAidpInternalQualityDebuggerClick(
    Object.assign({}, message, { action: "unrelated-control" }),
    {
      frameId: 0,
      tab: {
        id: 42,
        url: "https://aidp.bytedance.com/management/task-v2/task-a/mark-package/package-a/17?itemID=item-17",
      },
    }
  );
  assert.equal(wrongActionResult.ok, false);
  assert.deepEqual(calls, []);
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
