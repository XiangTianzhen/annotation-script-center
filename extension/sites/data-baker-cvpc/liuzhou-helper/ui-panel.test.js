"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "ui-panel.js");

function loadUiPanelModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouUiPanel;
  require(modulePath);
  return globalThis.ASREdgeDataBakerCvpcLiuzhouUiPanel;
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, enabled) {
    if (enabled) {
      this.values.add(name);
    } else {
      this.values.delete(name);
    }
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.attributes = {};
    this.children = [];
    this.classList = new FakeClassList();
    this.className = "";
    this.eventListeners = {};
    this.isConnected = false;
    this.parentNode = null;
    this.style = {};
    this.textContent = "";
    this.type = "";
  }

  appendChild(child) {
    child.parentNode = this;
    child.isConnected = true;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    child.parentNode = null;
    child.isConnected = false;
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] || "";
  }

  addEventListener(type, listener) {
    this.eventListeners[type] = listener;
  }

  querySelector(selector) {
    if (selector === ".audio-url-box") {
      return findNode(this, function (node) {
        return String(node.className || "") === "audio-url-box";
      });
    }
    return null;
  }

  get innerHTML() {
    return this._innerHTML || "";
  }

  set innerHTML(value) {
    this._innerHTML = String(value || "");
    this.textContent = String(value || "").replace(/<[^>]+>/g, "");
  }
}

function findNode(root, predicate) {
  if (predicate(root)) {
    return root;
  }
  for (const child of root.children) {
    const matched = findNode(child, predicate);
    if (matched) {
      return matched;
    }
  }
  return null;
}

function collectText(root) {
  return [
    root.textContent || "",
    root.children.map(collectText).join(" "),
  ].join(" ");
}

function createHarness() {
  const body = new FakeNode("body");
  const head = new FakeNode("head");
  const document = {
    body,
    documentElement: body,
    head,
    createElement: function (tagName) {
      return new FakeNode(tagName);
    },
    getElementById: function () {
      return null;
    },
    querySelector: function (selector) {
      if (selector === ".page-top .top-right") {
        return null;
      }
      if (selector === "[data-asc-cvpc-liuzhou-toolbar-fallback]") {
        return findNode(body, function (node) {
          return Object.prototype.hasOwnProperty.call(
            node.attributes,
            "data-asc-cvpc-liuzhou-toolbar-fallback"
          );
        });
      }
      return null;
    },
  };
  return { body, document, head };
}

test("CVPC ui panel mount tolerates document.body being unavailable before page shell is ready", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    harness.document.body = null;
    harness.document.documentElement = harness.head;

    const runtime = uiModule.createRuntime({});
    assert.doesNotThrow(function () {
      runtime.mount();
    });

    harness.document.body = harness.body;
    harness.document.documentElement = harness.body;

    assert.doesNotThrow(function () {
      runtime.mount();
    });

    const text = collectText(harness.body);
    assert.match(text, /柳州话脚本 Beta/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders current audio url and source in the floating panel", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderAudioContext({
      audioUrl: "https://oss.example.com/databaker/data/sample.mp3?Signature=visible",
      audioUrlSource: "observer",
      selectedEntry: {
        name: "sample.mp3",
      },
    });

    const text = collectText(harness.body);
    assert.match(text, /当前音频地址/);
    assert.match(text, /sample\.mp3/);
    assert.match(text, /observer/);
    assert.match(text, /Signature=visible/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});
