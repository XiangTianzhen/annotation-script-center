"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo("extension", "popup", "popup.js");

class FakeElement {
  constructor(id) {
    this.id = id;
    this.textContent = "";
    this.className = "";
    this.disabled = false;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(String(type || ""), listener);
  }

  click() {
    const listener = this.listeners.get("click");
    if (typeof listener === "function") {
      listener.call(this, { type: "click" });
    }
  }
}

function createDocument() {
  const ids = [
    "extension-name",
    "stage-label",
    "detected-title",
    "detected-description",
    "detected-status-pill",
    "open-script-settings",
    "popup-status",
  ];
  const elements = new Map(
    ids.map(function (id) {
      return [id, new FakeElement(id)];
    })
  );
  let domReadyListener = null;
  return {
    title: "",
    getElementById(id) {
      return elements.get(id) || null;
    },
    addEventListener(type, listener) {
      if (String(type || "") === "DOMContentLoaded") {
        domReadyListener = listener;
      }
    },
    async dispatchDOMContentLoaded() {
      if (typeof domReadyListener === "function") {
        await domReadyListener();
      }
    },
  };
}

function createChrome(activeUrl) {
  const createdUrls = [];
  return {
    createdUrls,
    tabs: {
      query(_queryInfo, callback) {
        callback([
          {
            id: 7,
            url: activeUrl,
          },
        ]);
      },
      create(input) {
        createdUrls.push(String(input?.url || ""));
      },
      sendMessage(_tabId, _message, callback) {
        callback({ ok: false, error: "not-needed" });
      },
    },
    runtime: {
      getURL(value) {
        return "chrome-extension://test/" + String(value || "");
      },
      lastError: null,
    },
  };
}

async function flushTasks() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
}

function loadPopup(documentLike, chromeLike, storageLike) {
  delete require.cache[modulePath];
  globalThis.document = documentLike;
  globalThis.chrome = chromeLike;
  globalThis.window = {
    close() {},
  };
  globalThis.ASREdgeConstants = {
    EXTENSION_NAME: "标注脚本中心",
    STAGE_LABEL: "脚本中心",
    MESSAGE_TYPES: {
      PANEL_PING: "ASR_EDGE_SETTINGS_PANEL_PING",
    },
    BYTEDANCE_AIDP_PLATFORM: {
      host: "aidp.bytedance.com",
    },
    BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID: "bytedanceAidpSuzhouHelper",
    BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID: "bytedanceAidpJinhuaHelper",
    MAGIC_DATA_HANGZHOU_SCRIPT_ID: "magicDataHangzhouAssistant",
    DATA_BAKER_CVPC_PLATFORM: {
      host: "cvpc.databaker.com",
    },
    DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID: "dataBakerCvpcLiuzhouAssistant",
    SCRIPT_LIBRARY: {
      bytedanceAidpSuzhouHelper: {
        label: "苏州话脚本",
      },
      bytedanceAidpJinhuaHelper: {
        label: "金华话脚本",
      },
      magicDataHangzhouAssistant: {
        label: "杭州话脚本",
      },
      dataBakerCvpcLiuzhouAssistant: {
        label: "柳州话脚本",
      },
    },
    PLATFORM_LIBRARY: {
      bytedanceAidp: {
        label: "ByteDance AIDP",
      },
      magicData: {
        label: "Magic Data ANNOTATOR",
      },
      dataBakerCvpc: {
        label: "DataBaker CVPC",
      },
    },
    isScriptVisible() {
      return true;
    },
    isScriptRuntimeAccessible() {
      return true;
    },
  };
  globalThis.ASREdgeStorage = storageLike;
  require(modulePath);
}

test("popup shows the detected Suzhou script and toggles enable state via setScriptEnabled", async function () {
  const documentLike = createDocument();
  const toggleCalls = [];
  const chromeLike = createChrome(
    "https://aidp.bytedance.com/management/task-v2/7632228385175129882/mark-v3/1?from_pathname=%2Ftask-v2%3Fpage%3D1"
  );
  let settings = {
    platforms: {
      bytedanceAidp: {
        enabled: false,
        scripts: {
          suzhouHelper: {
            enabled: false,
            platformAiEnabled: false,
            segmentPreviewAutoApplyEnabled: true,
          },
        },
      },
    },
  };
  const storageLike = {
    async getSettings() {
      return settings;
    },
    async setScriptEnabled(scriptId, enabled) {
      toggleCalls.push({
        scriptId,
        enabled,
      });
      settings = {
        platforms: {
          bytedanceAidp: {
            enabled: enabled,
            scripts: {
              suzhouHelper: {
                enabled: enabled,
                platformAiEnabled: false,
                segmentPreviewAutoApplyEnabled: true,
              },
            },
          },
        },
      };
      return settings;
    },
  };

  loadPopup(
    documentLike,
    chromeLike,
    storageLike
  );

  await documentLike.dispatchDOMContentLoaded();
  await flushTasks();

  assert.equal(documentLike.getElementById("detected-title").textContent, "苏州话脚本");
  assert.equal(documentLike.getElementById("detected-description").textContent, "运行状态：未启用");
  assert.equal(documentLike.getElementById("detected-status-pill").textContent, "未启用");
  assert.equal(documentLike.getElementById("popup-status").textContent, "");

  documentLike.getElementById("detected-status-pill").click();
  await flushTasks();

  assert.deepEqual(toggleCalls, [
    {
      scriptId: "bytedanceAidpSuzhouHelper",
      enabled: true,
    },
  ]);
  assert.equal(documentLike.getElementById("detected-status-pill").textContent, "已启用");

  documentLike.getElementById("stage-label").click();
  documentLike.getElementById("open-script-settings").click();

  assert.deepEqual(chromeLike.createdUrls, [
    "chrome-extension://test/options/options.html#/center",
    "chrome-extension://test/options/options.html#/script/bytedanceAidpSuzhouHelper",
  ]);
});
test("popup shows the detected Jinhua script when AIDP activeScriptId switches to jinhua", async function () {
  const documentLike = createDocument();
  const toggleCalls = [];
  const chromeLike = createChrome(
    "https://aidp.bytedance.com/management/task-v2/7632228385175129882/mark-v3/1?from_pathname=%2Ftask-v2%3Fpage%3D1"
  );
  let settings = {
    platforms: {
      bytedanceAidp: {
        enabled: true,
        activeScriptId: "bytedanceAidpJinhuaHelper",
        scripts: {
          suzhouHelper: {
            enabled: false,
            aiRecommendEnabled: false,
          },
          jinhuaHelper: {
            enabled: true,
            aiRecommendEnabled: true,
            platformAiEnabled: false,
            segmentPreviewAutoApplyEnabled: true,
          },
        },
      },
    },
  };
  const storageLike = {
    async getSettings() {
      return settings;
    },
    async setScriptEnabled(scriptId, enabled) {
      toggleCalls.push({
        scriptId,
        enabled,
      });
      settings = {
        platforms: {
          bytedanceAidp: {
            enabled: enabled,
            activeScriptId: enabled ? "bytedanceAidpJinhuaHelper" : "",
            scripts: {
              suzhouHelper: {
                enabled: false,
                aiRecommendEnabled: false,
              },
              jinhuaHelper: {
                enabled: enabled,
                aiRecommendEnabled: enabled,
                platformAiEnabled: false,
                segmentPreviewAutoApplyEnabled: true,
              },
            },
          },
        },
      };
      return settings;
    },
  };

  loadPopup(documentLike, chromeLike, storageLike);

  await documentLike.dispatchDOMContentLoaded();
  await flushTasks();

  assert.equal(documentLike.getElementById("detected-title").textContent, "金华话脚本");
  assert.equal(documentLike.getElementById("detected-description").textContent, "运行状态：详情页命中（平台 AI 已隐藏）");
  assert.equal(documentLike.getElementById("detected-status-pill").textContent, "已启用");

  documentLike.getElementById("open-script-settings").click();

  assert.deepEqual(toggleCalls, []);
  assert.deepEqual(chromeLike.createdUrls, [
    "chrome-extension://test/options/options.html#/script/bytedanceAidpJinhuaHelper",
  ]);
});
test("popup shows the detected Hangzhou script when Magic Data activeScriptId switches to hangzhou", async function () {
  const documentLike = createDocument();
  const chromeLike = createChrome(
    "https://work.magicdatatech.com/#/asrmark?taskItemId=task-1"
  );
  const storageLike = {
    async getSettings() {
      return {
        platforms: {
          magicData: {
            enabled: true,
            activeScriptId: "magicDataHangzhouAssistant",
            scripts: {
              hangzhouHelper: {
                enabled: true,
                aiReviewEnabled: true,
              },
            },
          },
        },
        scriptCenter: {
          projects: {
            magicDataHangzhouAssistant: {
              enabled: true,
              aiReviewEnabled: true,
            },
          },
        },
      };
    },
    async setScriptEnabled() {
      throw new Error("not-needed");
    },
  };

  loadPopup(documentLike, chromeLike, storageLike);

  await documentLike.dispatchDOMContentLoaded();
  await flushTasks();

  assert.equal(documentLike.getElementById("detected-title").textContent, "杭州话脚本");
  assert.equal(documentLike.getElementById("detected-status-pill").textContent, "已启用");
  assert.equal(
    documentLike.getElementById("detected-description").textContent,
    "运行状态：已支持"
  );

  documentLike.getElementById("open-script-settings").click();

  assert.deepEqual(chromeLike.createdUrls, [
    "chrome-extension://test/options/options.html#/script/magicDataHangzhouAssistant",
  ]);
});
// End of popup contract tests.
