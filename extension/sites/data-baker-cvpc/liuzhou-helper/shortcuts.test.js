"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "shortcuts.js");

function loadShortcutModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts;
  require(modulePath);
  return globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts;
}

function createWindowHarness() {
  const listeners = new Map();
  return {
    window: {
      addEventListener: function (type, listener) {
        listeners.set(type, listener);
      },
      removeEventListener: function (type, listener) {
        if (listeners.get(type) === listener) {
          listeners.delete(type);
        }
      },
    },
    triggerKeydown: function (event) {
      const listener = listeners.get("keydown");
      if (typeof listener === "function") {
        listener(
          Object.assign(
            {
              altKey: false,
              shiftKey: false,
              ctrlKey: false,
              metaKey: false,
              preventDefault: function () {},
              stopPropagation: function () {},
            },
            event || {}
          )
        );
      }
    },
  };
}

test("CVPC shortcuts runtime does not bind any action when shortcuts are empty", function () {
  const shortcutModule = loadShortcutModule();
  const harness = createWindowHarness();
  const previousWindow = globalThis.window;
  let previewTriggered = 0;

  globalThis.window = harness.window;

  try {
    const runtime = shortcutModule.createRuntime({
      shortcuts: {},
      actions: {
        preview: function () {
          previewTriggered += 1;
        },
      },
    });

    runtime.bind();
    harness.triggerKeydown({
      altKey: true,
      shiftKey: true,
      key: "4",
    });

    assert.equal(previewTriggered, 0);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("CVPC shortcuts runtime only triggers configured actions", function () {
  const shortcutModule = loadShortcutModule();
  const harness = createWindowHarness();
  const previousWindow = globalThis.window;
  let previewTriggered = 0;

  globalThis.window = harness.window;

  try {
    const runtime = shortcutModule.createRuntime({
      shortcuts: {
        preview: {
          alt: true,
          shift: true,
          key: "4",
        },
      },
      actions: {
        preview: function () {
          previewTriggered += 1;
        },
      },
    });

    runtime.bind();
    harness.triggerKeydown({
      altKey: true,
      shiftKey: true,
      key: "4",
    });

    assert.equal(previewTriggered, 1);
    assert.deepEqual(runtime.defaults, {});
  } finally {
    globalThis.window = previousWindow;
  }
});
