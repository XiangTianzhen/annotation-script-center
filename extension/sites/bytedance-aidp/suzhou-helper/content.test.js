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

function createFakeStyle(initialState, initialPriority) {
  const state = new Map();
  if (typeof initialState === "string") {
    state.set("display", {
      value: String(initialState || ""),
      priority: String(initialPriority || ""),
    });
  } else if (initialState && typeof initialState === "object") {
    Object.keys(initialState).forEach(function (name) {
      const value = initialState[name];
      state.set(String(name), {
        value: String(value || ""),
        priority: String(name === "display" ? initialPriority || "" : ""),
      });
    });
  }
  return {
    setProperty: function (name, value, priority) {
      state.set(String(name), {
        value: String(value || ""),
        priority: String(priority || ""),
      });
    },
    getPropertyValue: function (name) {
      return state.get(String(name))?.value || "";
    },
    getPropertyPriority: function (name) {
      return state.get(String(name))?.priority || "";
    },
    removeProperty: function (name) {
      const key = String(name);
      const previous = state.get(key)?.value || "";
      state.delete(key);
      return previous;
    },
  };
}

function createFakeNode(initialDisplay, initialPriority) {
  const attrs = new Map();
  return {
    nodeType: 1,
    tagName: "DIV",
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

function matchesSimpleSelector(node, selector) {
  const text = String(selector || "").trim();
  if (!text) {
    return false;
  }

  if (text.startsWith(".")) {
    const className = text.slice(1);
    return String(node.className || "")
      .split(/\s+/)
      .filter(Boolean)
      .includes(className);
  }

  const classContainsMatch = text.match(/^\[class\*=['"](.+)['"]\]$/);
  if (classContainsMatch) {
    return String(node.className || "").includes(classContainsMatch[1]);
  }

  const attrEqualsMatch = text.match(/^\[([^=\]]+)=['"](.+)['"]\]$/);
  if (attrEqualsMatch) {
    return String(node.getAttribute(attrEqualsMatch[1]) || "") === attrEqualsMatch[2];
  }

  return String(node.tagName || "").toLowerCase() === text.toLowerCase();
}

class FakeElement {
  constructor(options) {
    const source = options || {};
    this.nodeType = 1;
    this.tagName = String(source.tagName || "div").toUpperCase();
    this.className = String(source.className || "");
    this.style = createFakeStyle(source.style || {});
    this._attrs = new Map();
    this._ownText = String(source.text || "");
    this.value = source.value !== undefined ? String(source.value) : "";
    this._rect = Object.assign(
      {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
      },
      source.rect || {}
    );
    this.children = [];
    this.parentElement = null;
    this._listeners = new Map();
    if (this.className) {
      this._attrs.set("class", this.className);
    }
    Object.entries(source.attributes || {}).forEach(([name, value]) => {
      this.setAttribute(name, value);
    });
    (source.children || []).forEach((child) => {
      this.appendChild(child);
    });
  }

  dispatchEvent(event) {
    this._lastEvent = event;
    const listener = this._listeners.get(String(event?.type || ""));
    if (typeof listener === "function") {
      listener.call(this, event);
    }
    return true;
  }

  addEventListener(type, listener) {
    this._listeners.set(String(type || ""), listener);
  }

  click() {
    const listener = this._listeners.get("click");
    if (typeof listener === "function") {
      listener.call(this, { type: "click", bubbles: true });
    }
  }

  appendChild(child) {
    child.parentElement = this;
    child.ownerDocument = this.ownerDocument || (this.tagName === "DOCUMENT" ? this : null);
    this.children.push(child);
    return child;
  }

  get childNodes() {
    return this.children.slice();
  }

  get textContent() {
    return this._ownText + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._ownText = String(value || "");
  }

  setAttribute(name, value) {
    const key = String(name);
    const text = String(value);
    if (key === "class") {
      this.className = text;
    }
    this._attrs.set(key, text);
  }

  getAttribute(name) {
    const key = String(name);
    if (key === "class") {
      return this.className || null;
    }
    return this._attrs.has(key) ? this._attrs.get(key) : null;
  }

  removeAttribute(name) {
    const key = String(name);
    if (key === "class") {
      this.className = "";
    }
    this._attrs.delete(key);
  }

  hasAttribute(name) {
    const key = String(name);
    if (key === "class") {
      return Boolean(this.className);
    }
    return this._attrs.has(key);
  }

  matches(selector) {
    return String(selector || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => matchesSimpleSelector(this, item));
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (child.matches(selector)) {
          results.push(child);
        }
        visit(child);
      });
    };
    visit(this);
    return results;
  }

  getBoundingClientRect() {
    return Object.assign({}, this._rect);
  }
}

function createFakeDocument(children) {
  const documentNode = new FakeElement({
    tagName: "document",
    children: Array.isArray(children) ? children : [],
  });
  documentNode.ownerDocument = documentNode;
  (function assignOwner(node) {
    node.ownerDocument = documentNode;
    node.children.forEach(assignOwner);
  })(documentNode);
  documentNode.createElement = function (tagName) {
    const element = new FakeElement({
      tagName: tagName,
    });
    element.ownerDocument = documentNode;
    return element;
  };
  return documentNode;
}

function createFakeIframe(contentChildren) {
  const iframe = new FakeElement({
    tagName: "iframe",
  });
  iframe.contentDocument = createFakeDocument(contentChildren);
  return iframe;
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

test("ByteDance AIDP content re-hides nodes when platform rewrites display on a marked node", function () {
  const contentModule = loadContentModule();
  const insightNode = createFakeNode("", "");

  contentModule.__testOnly.applyPlatformAiVisibility([insightNode], true);
  insightNode.style.setProperty("display", "block", "important");

  contentModule.__testOnly.applyPlatformAiVisibility([insightNode], true);

  assert.equal(insightNode.style.getPropertyValue("display"), "none");
  assert.equal(insightNode.style.getPropertyPriority("display"), "important");
  assert.equal(insightNode.hasAttribute("data-asc-platform-ai-hidden"), true);
});

test("ByteDance AIDP content falls back to semantic AI insight anchors", function () {
  const contentModule = loadContentModule();
  const insightCard = new FakeElement({
    className: "platform-panel",
    children: [
      new FakeElement({
        className: "panel-header",
        children: [new FakeElement({ tagName: "span", text: "AI 洞察" })],
      }),
      new FakeElement({ tagName: "span", text: "统计周期：06-25 00:00 至 07-01 17:04" }),
      new FakeElement({ tagName: "span", text: "立即生成" }),
      new FakeElement({ tagName: "span", text: "前往数据看板" }),
    ],
  });
  const taskList = new FakeElement({
    className: "task-list-panel",
    children: [new FakeElement({ tagName: "span", text: "未提交" })],
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "left-sidebar",
      children: [insightCard, taskList],
    }),
  ]);

  const targets = contentModule.__testOnly.findPlatformAiTargets(root);

  assert.deepEqual(targets, [insightCard]);
});

test("ByteDance AIDP content normalizes trigger nodes to outer floating wrapper", function () {
  const contentModule = loadContentModule();
  const triggerNode = new FakeElement({
    className: "trigger-wrapper-RlG7Dx",
    style: {
      position: "absolute",
      bottom: "0px",
      right: "0px",
      width: "48px",
      height: "48px",
    },
    rect: {
      top: 820,
      left: 1760,
      right: 1808,
      bottom: 868,
      width: 48,
      height: 48,
    },
    children: [new FakeElement({ tagName: "svg" })],
  });
  const floatingRoot = new FakeElement({
    className: "assistant-shell",
    style: {
      position: "fixed",
      bottom: "24px",
      right: "20px",
      width: "80px",
      height: "80px",
    },
    rect: {
      top: 800,
      left: 1740,
      right: 1820,
      bottom: 880,
      width: 80,
      height: 80,
    },
    children: [triggerNode],
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [
        new FakeElement({
          className: "main-workspace",
          children: [new FakeElement({ tagName: "span", text: "转写文本" })],
        }),
        floatingRoot,
      ],
    }),
  ]);

  const targets = contentModule.__testOnly.findPlatformAiTargets(root);

  assert.deepEqual(targets, [floatingRoot]);
});

test("ByteDance AIDP content finds a class-less bottom-right floating assistant candidate", function () {
  const contentModule = loadContentModule();
  const floatingAvatar = new FakeElement({
    className: "chat-avatar-shell",
    style: {
      position: "fixed",
      bottom: "28px",
      right: "24px",
      width: "72px",
      height: "72px",
    },
    rect: {
      top: 804,
      left: 1744,
      right: 1816,
      bottom: 876,
      width: 72,
      height: 72,
    },
    children: [new FakeElement({ tagName: "img" })],
  });
  const oversizedToolbar = new FakeElement({
    className: "global-toolbar",
    style: {
      position: "fixed",
      bottom: "0px",
      right: "0px",
      width: "640px",
      height: "88px",
    },
    rect: {
      top: 792,
      left: 1200,
      right: 1840,
      bottom: 880,
      width: 640,
      height: 88,
    },
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [
        new FakeElement({
          className: "segment-table",
          children: [new FakeElement({ tagName: "span", text: "语音种类" })],
        }),
        oversizedToolbar,
        floatingAvatar,
      ],
    }),
  ]);

  const targets = contentModule.__testOnly.findPlatformAiTargets(root);

  assert.deepEqual(targets, [floatingAvatar]);
});

test("ByteDance AIDP content also finds targets inside same-origin iframes", function () {
  const contentModule = loadContentModule();
  const insightCard = new FakeElement({
    className: "insight-container-Hn0Gna",
    children: [
      new FakeElement({
        tagName: "span",
        text: "AI 洞察",
      }),
    ],
  });
  const iframeRoot = createFakeIframe([
    new FakeElement({
      className: "inner-shell",
      children: [insightCard],
    }),
  ]);
  const root = createFakeDocument([
    new FakeElement({
      className: "page-shell",
      children: [iframeRoot],
    }),
  ]);

  const targets = contentModule.__testOnly.findPlatformAiTargets(root);

  assert.deepEqual(targets, [insightCard]);
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

test("ByteDance AIDP content resolves helper config with custom padding playback rate and wave zoom", function () {
  const contentModule = loadContentModule();
  const config = contentModule.__testOnly.resolveHelperConfig({
    platforms: {
      bytedanceAidp: {
        scripts: {
          suzhouHelper: {
            segmentContextPaddingMs: 400,
            defaultPlaybackRate: 1.25,
            fixedWaveZoom: 2.5,
          },
        },
      },
    },
  });

  assert.equal(config.segmentContextPaddingMs, 400);
  assert.equal(config.defaultPlaybackRate, 1.25);
  assert.equal(config.fixedWaveZoom, 2);
});

test("ByteDance AIDP content applies playback rate and fixed zoom to wave controls", function () {
  const contentModule = loadContentModule();
  let clickedLabel = "";
  const playbackOption = new FakeElement({
    className: "arco-select-option",
    text: "1.50倍速",
  });
  playbackOption.addEventListener("click", function () {
    clickedLabel = "1.50倍速";
  });
  const playbackSelect = new FakeElement({
    className: "arco-select arco-select-single arco-select-size-default",
    attributes: {
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
    },
    children: [
      new FakeElement({
        className: "arco-select-view",
        children: [
          new FakeElement({
            tagName: "input",
            className: "arco-select-view-input arco-select-hidden",
            value: "1.00倍速",
          }),
          new FakeElement({
            tagName: "span",
            className: "arco-select-view-value",
            text: "1.00倍速",
          }),
        ],
      }),
    ],
  });
  const zoomInput = new FakeElement({
    tagName: "input",
    attributes: {
      role: "spinbutton",
    },
    value: "1",
  });
  const waveRoot = new FakeElement({
    className: "neeko-wavesurfer-warper neeko-wavesurfer",
    children: [
      new FakeElement({
        className: "wave-toolbar",
        children: [
          new FakeElement({ tagName: "span", text: "播放速度" }),
          playbackSelect,
          new FakeElement({ tagName: "span", text: "总时长" }),
          zoomInput,
          playbackOption,
        ],
      }),
    ],
  });
  const root = createFakeDocument([waveRoot]);

  const changed = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1.5,
    fixedWaveZoom: 2,
  });

  assert.equal(changed, true);
  assert.equal(clickedLabel, "1.50倍速");
  assert.equal(zoomInput.value, "2");
});

test("ByteDance AIDP content injects clear-segments button into play toolbar", function () {
  const contentModule = loadContentModule();
  let clicked = 0;
  const playToolbar = new FakeElement({
    className: "btns-play",
    children: [new FakeElement({ tagName: "svg" })],
  });
  const waveRoot = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      children: [
        new FakeElement({
          className: "wave-toolbar",
          children: [playToolbar],
        }),
      ],
    }),
  ]);

  const inserted = contentModule.__testOnly.ensureClearSegmentsButton(waveRoot, function () {
    clicked += 1;
  });
  const button = playToolbar.children[playToolbar.children.length - 1];

  assert.equal(inserted, true);
  assert.equal(button.getAttribute("data-asc-clear-segments-button"), "true");
  button.click();
  assert.equal(clicked, 1);
});
