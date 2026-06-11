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

test("CVPC shortcuts runtime supports legacy shifted digit shortcuts for invalid and fillAllValid", function () {
  const shortcutModule = loadShortcutModule();
  const harness = createWindowHarness();
  const previousWindow = globalThis.window;
  let invalidTriggered = 0;
  let fillAllValidTriggered = 0;

  globalThis.window = harness.window;

  try {
    const runtime = shortcutModule.createRuntime({
      shortcuts: {
        invalid: {
          alt: true,
          shift: true,
          key: "2",
        },
        fillAllValid: {
          alt: true,
          shift: true,
          key: "3",
        },
      },
      actions: {
        invalid: function () {
          invalidTriggered += 1;
        },
        fillAllValid: function () {
          fillAllValidTriggered += 1;
        },
      },
    });

    runtime.bind();
    harness.triggerKeydown({
      altKey: true,
      shiftKey: true,
      key: "@",
      code: "Digit2",
    });
    harness.triggerKeydown({
      altKey: true,
      shiftKey: true,
      key: "#",
      code: "Digit3",
    });

    assert.equal(invalidTriggered, 1);
    assert.equal(fillAllValidTriggered, 1);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("CVPC shortcuts runtime supports dedicated fill actions for dialect and mandarin fields", function () {
  const shortcutModule = loadShortcutModule();
  const harness = createWindowHarness();
  const previousWindow = globalThis.window;
  let applyDialectTextTriggered = 0;
  let applyMandarinTextTriggered = 0;

  globalThis.window = harness.window;

  try {
    const runtime = shortcutModule.createRuntime({
      shortcuts: {
        applyDialectText: {
          alt: true,
          key: "d",
        },
        applyMandarinText: {
          alt: true,
          key: "m",
        },
      },
      actions: {
        applyDialectText: function () {
          applyDialectTextTriggered += 1;
        },
        applyMandarinText: function () {
          applyMandarinTextTriggered += 1;
        },
      },
    });

    runtime.bind();
    harness.triggerKeydown({
      altKey: true,
      key: "d",
      code: "KeyD",
    });
    harness.triggerKeydown({
      altKey: true,
      key: "m",
      code: "KeyM",
    });

    assert.equal(applyDialectTextTriggered, 1);
    assert.equal(applyMandarinTextTriggered, 1);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("CVPC shortcuts runtime supports common label actions with recorded shortcuts", function () {
  const shortcutModule = loadShortcutModule();
  const harness = createWindowHarness();
  const previousWindow = globalThis.window;
  let labelSpkTriggered = 0;
  let labelSilenceTriggered = 0;

  globalThis.window = harness.window;

  try {
    const runtime = shortcutModule.createRuntime({
      shortcuts: {
        labelSpk: {
          alt: true,
          key: "s",
        },
        labelSilence: {
          alt: true,
          shift: true,
          key: "l",
        },
      },
      actions: {
        labelSpk: function () {
          labelSpkTriggered += 1;
        },
        labelSilence: function () {
          labelSilenceTriggered += 1;
        },
      },
    });

    runtime.bind();
    harness.triggerKeydown({
      altKey: true,
      key: "s",
      code: "KeyS",
    });
    harness.triggerKeydown({
      altKey: true,
      shiftKey: true,
      key: "L",
      code: "KeyL",
    });

    assert.equal(labelSpkTriggered, 1);
    assert.equal(labelSilenceTriggered, 1);
  } finally {
    globalThis.window = previousWindow;
  }
});
