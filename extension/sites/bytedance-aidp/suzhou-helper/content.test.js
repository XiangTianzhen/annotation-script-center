"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const contentModulePath = path.resolve(__dirname, "content.js");

function loadContentModule() {
  delete require.cache[contentModulePath];
  delete globalThis.ASREdgeBytedanceAidpSuzhouContent;
  delete globalThis.__ASREdgeBytedanceAidpSuzhouInstalled;
  return require(contentModulePath);
}

function createFakeStyle(initialDisplay, initialPriority) {
  const state = {
    value: initialDisplay || "",
    priority: initialPriority || "",
  };
  return {
    setProperty: function (name, value, priority) {
      if (name !== "display") {
        return;
      }
      state.value = String(value || "");
      state.priority = String(priority || "");
    },
    getPropertyValue: function (name) {
      return name === "display" ? state.value : "";
    },
    getPropertyPriority: function (name) {
      return name === "display" ? state.priority : "";
    },
    removeProperty: function (name) {
      if (name !== "display") {
        return "";
      }
      const previous = state.value;
      state.value = "";
      state.priority = "";
      return previous;
    },
  };
}

function createFakeNode(initialDisplay, initialPriority) {
  const attrs = new Map();
  return {
    style: createFakeStyle(initialDisplay, initialPriority),
    setAttribute: function (name, value) {
      attrs.set(String(name), String(value));
    },
    getAttribute: function (name) {
      return attrs.has(String(name)) ? attrs.get(String(name)) : null;
    },
    removeAttribute: function (name) {
      attrs.delete(String(name));
    },
    hasAttribute: function (name) {
      return attrs.has(String(name));
    },
  };
}

test("ByteDance AIDP content derives hide policy from script settings", function () {
  const contentModule = loadContentModule();
  const policy = contentModule.__testOnly.resolveRuntimePolicy({
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

  assert.equal(policy.runtimeAccessible, true);
  assert.equal(policy.platformAiEnabled, false);
  assert.equal(policy.shouldHidePlatformAi, true);
});

test("ByteDance AIDP content hides and restores marked platform AI nodes", function () {
  const contentModule = loadContentModule();
  const triggerNode = createFakeNode("block", "");
  const insightNode = createFakeNode("", "");

  contentModule.__testOnly.applyPlatformAiVisibility([triggerNode, insightNode], true);

  assert.equal(triggerNode.style.getPropertyValue("display"), "none");
  assert.equal(triggerNode.style.getPropertyPriority("display"), "important");
  assert.equal(triggerNode.hasAttribute("data-asc-platform-ai-hidden"), true);
  assert.equal(insightNode.style.getPropertyValue("display"), "none");
  assert.equal(insightNode.style.getPropertyPriority("display"), "important");
  assert.equal(insightNode.hasAttribute("data-asc-platform-ai-hidden"), true);

  contentModule.__testOnly.applyPlatformAiVisibility([triggerNode, insightNode], false);

  assert.equal(triggerNode.style.getPropertyValue("display"), "block");
  assert.equal(triggerNode.hasAttribute("data-asc-platform-ai-hidden"), false);
  assert.equal(insightNode.style.getPropertyValue("display"), "");
  assert.equal(insightNode.hasAttribute("data-asc-platform-ai-hidden"), false);
});

test("ByteDance AIDP content only matches mark-v3 detail routes", function () {
  const contentModule = loadContentModule();

  assert.equal(
    contentModule.__testOnly.isDetailPagePathname(
      "/management/task-v2/7632228385175129882/mark-v3/1"
    ),
    true
  );
  assert.equal(
    contentModule.__testOnly.isDetailPagePathname("/management/task-v2?page=1"),
    false
  );
  assert.equal(
    contentModule.__testOnly.isDetailPagePathname("/management/task-v2"),
    false
  );
});
