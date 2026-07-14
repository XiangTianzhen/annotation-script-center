"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const contentModulePath = resolveRepo("extension", "sites", "bytedance-aidp", "taizhou-helper", "content.js");
const shortcutsModulePath = resolveRepo("extension", "sites", "bytedance-aidp", "taizhou-helper", "shortcuts.js");

function loadContentModule() {
  delete require.cache[contentModulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouContent;
  delete globalThis.__ASREdgeBytedanceAidpTaizhouInstalled;
  return require(contentModulePath);
}

function loadShortcutsModule() {
  delete require.cache[shortcutsModulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouShortcuts;
  return require(shortcutsModulePath);
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
    this.scrollTop = Number.isFinite(Number(source.scrollTop)) ? Number(source.scrollTop) : 0;
    this.scrollLeft = Number.isFinite(Number(source.scrollLeft)) ? Number(source.scrollLeft) : 0;
    this.scrollHeight = Number.isFinite(Number(source.scrollHeight)) ? Number(source.scrollHeight) : 0;
    this.clientHeight = Number.isFinite(Number(source.clientHeight)) ? Number(source.clientHeight) : 0;
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

  removeEventListener(type) {
    this._listeners.delete(String(type || ""));
  }

  focus() {
    this._focused = true;
    if (this.ownerDocument) {
      this.ownerDocument.activeElement = this;
    }
  }

  click() {
    const listener = this._listeners.get("click");
    if (typeof listener === "function") {
      listener.call(this, { type: "click", bubbles: true });
    }
  }

  appendChild(child) {
    if (!child) {
      return child;
    }
    if (child.parentElement && child.parentElement !== this) {
      if (typeof child.parentElement.removeChild === "function") {
        child.parentElement.removeChild(child);
      }
    }
    child.parentElement = this;
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument || (this.tagName === "DOCUMENT" ? this : null);
    this.children.push(child);
    return child;
  }

  insertBefore(child, referenceChild) {
    if (!child) {
      return child;
    }
    if (!referenceChild || !this.children.includes(referenceChild)) {
      return this.appendChild(child);
    }
    if (child.parentElement && child.parentElement !== this) {
      if (typeof child.parentElement.removeChild === "function") {
        child.parentElement.removeChild(child);
      }
    }
    const targetIndex = this.children.indexOf(referenceChild);
    child.parentElement = this;
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument || (this.tagName === "DOCUMENT" ? this : null);
    this.children.splice(targetIndex, 0, child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index < 0) {
      return child;
    }
    this.children.splice(index, 1);
    if (child) {
      child.parentElement = null;
      child.parentNode = null;
    }
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

function createAidpSegmentTableRow(segmentNumber) {
  const pauseButton = new FakeElement({
    tagName: "button",
    text: "暂停",
  });
  return new FakeElement({
    tagName: "tr",
    children: [
      new FakeElement({
        tagName: "td",
        text: String(segmentNumber),
      }),
      new FakeElement({
        tagName: "td",
        text: "起：0:0" + String(segmentNumber) + ".000 终：0:0" + String(segmentNumber) + ".500",
      }),
      new FakeElement({
        tagName: "td",
        children: [
          new FakeElement({
            tagName: "textarea",
            value: "",
          }),
        ],
      }),
      new FakeElement({
        tagName: "td",
        children: [
          new FakeElement({
            tagName: "select",
          }),
        ],
      }),
      new FakeElement({
        tagName: "td",
        text: "播放选段",
      }),
      new FakeElement({
        tagName: "td",
        children: [pauseButton],
      }),
    ],
  });
}

function createAidpEmptyStateRow() {
  return new FakeElement({
    tagName: "tr",
    children: [
      new FakeElement({
        tagName: "td",
        attributes: {
          colspan: "6",
        },
        text: "暂无数据",
      }),
    ],
  });
}

function createAidpVirtualSegmentTableRow(segmentNumber) {
  return new FakeElement({
    className: "arco-table-tr",
    children: [
      new FakeElement({
        className: "arco-table-td",
        children: [new FakeElement({ className: "arco-table-cell", text: String(segmentNumber) })],
      }),
      new FakeElement({
        className: "arco-table-td",
        children: [
          new FakeElement({
            className: "arco-table-cell",
            text: "起：0:0" + String(segmentNumber) + ".000 终：0:0" + String(segmentNumber) + ".500",
          }),
        ],
      }),
      new FakeElement({
        className: "arco-table-td",
        children: [
          new FakeElement({
            className: "arco-table-cell",
            children: [new FakeElement({ tagName: "textarea", value: "" })],
          }),
        ],
      }),
      new FakeElement({
        className: "arco-table-td",
        children: [
          new FakeElement({
            className: "arco-table-cell",
            children: [
              new FakeElement({
                tagName: "div",
                attributes: {
                  role: "combobox",
                },
                text: "目标方言",
              }),
            ],
          }),
        ],
      }),
      new FakeElement({
        className: "arco-table-td",
        children: [
          new FakeElement({
            className: "arco-table-cell",
            children: [new FakeElement({ tagName: "button", text: "播放选段" })],
          }),
        ],
      }),
      new FakeElement({
        className: "arco-table-td",
        children: [
          new FakeElement({
            className: "arco-table-cell",
            children: [new FakeElement({ tagName: "button", text: "暂停" })],
          }),
        ],
      }),
    ],
  });
}

function createAidpVirtualSegmentTable(rows) {
  return new FakeElement({
    className: "arco-table arco-table-virtualized",
    children: [
      new FakeElement({
        className: "arco-table-header",
        children: [
          new FakeElement({
            tagName: "table",
            children: [
              new FakeElement({
                tagName: "tr",
                className: "arco-table-tr",
                children: [
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "序号" }),
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "区间" }),
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "转写文本" }),
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "语言种类" }),
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "音频段" }),
                  new FakeElement({ tagName: "th", className: "arco-table-th", text: "操作" }),
                ],
              }),
            ],
          }),
        ],
      }),
      new FakeElement({
        className: "arco-table-body",
        children: [
          new FakeElement({
            className: "arco-table-body-inner",
            children: Array.isArray(rows) ? rows : [],
          }),
        ],
      }),
    ],
  });
}

function createAidpNativeSegmentContainer() {
  return new FakeElement({
    className: "neeko-container",
    children: [
      new FakeElement({
        className: "arco-table",
        children: [
          new FakeElement({
            className: "arco-table-header",
            children: [
              new FakeElement({ tagName: "span", text: "序号" }),
              new FakeElement({ tagName: "span", text: "区间" }),
              new FakeElement({ tagName: "span", text: "转写文本" }),
              new FakeElement({ tagName: "span", text: "语言种类" }),
              new FakeElement({ tagName: "span", text: "音频段" }),
              new FakeElement({ tagName: "span", text: "操作" }),
            ],
          }),
          new FakeElement({
            className: "arco-table-body",
            children: [
              new FakeElement({
                className: "arco-table-tr",
                children: [
                  new FakeElement({
                    className: "arco-table-td",
                    children: [
                      new FakeElement({
                        tagName: "textarea",
                        className: "arco-textarea neeko-input-textarea",
                        value: "",
                      }),
                    ],
                  }),
                  new FakeElement({
                    className: "arco-table-td",
                    children: [
                      new FakeElement({
                        tagName: "button",
                        text: "播放选段",
                      }),
                    ],
                  }),
                  new FakeElement({
                    className: "arco-table-td",
                    children: [
                      new FakeElement({
                        tagName: "button",
                        text: "暂停",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createAidpWaveWorkbench() {
  return new FakeElement({
    className: "wave-workbench-shell",
    children: [
      new FakeElement({
        className: "neeko-wavesurfer-warper neeko-wavesurfer",
        children: [
          new FakeElement({ tagName: "span", text: "播放速度" }),
          new FakeElement({ tagName: "span", text: "总时长" }),
        ],
      }),
    ],
  });
}

function createAidpOuterWrapperWithWaveAndTable() {
  const innerTableContainer = createAidpNativeSegmentContainer();
  const outerWrapper = new FakeElement({
    className: "neeko-container detail-stage-shell",
    children: [createAidpWaveWorkbench(), innerTableContainer],
  });
  return {
    outerWrapper,
    innerTableContainer,
  };
}

test("ByteDance AIDP content derives hide policy from script settings", function () {
  const contentModule = loadContentModule();
  const policy = contentModule.__testOnly.resolveRuntimePolicy({
    platforms: {
      bytedanceAidp: {
        enabled: true,
        scripts: {
          taizhouHelper: {
            enabled: false,
            platformAiEnabled: true,
          },
        },
      },
    },
  });

  assert.equal(policy.runtimeAccessible, false);
  assert.equal(policy.platformAiEnabled, true);
  assert.equal(policy.shouldHidePlatformAi, false);
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

test("ByteDance AIDP taizhou content only restores AI nodes hidden by the same runtime", function () {
  const contentModule = loadContentModule();
  const insightNode = createFakeNode("none", "important");
  insightNode.setAttribute("data-asc-platform-ai-hidden", "true");
  insightNode.setAttribute("data-asc-platform-ai-hidden-by", "bytedanceAidpSuzhouHelper");

  contentModule.__testOnly.applyPlatformAiVisibility([insightNode], false);

  assert.equal(insightNode.style.getPropertyValue("display"), "none");
  assert.equal(insightNode.style.getPropertyPriority("display"), "important");
  assert.equal(insightNode.getAttribute("data-asc-platform-ai-hidden"), "true");
  assert.equal(
    insightNode.getAttribute("data-asc-platform-ai-hidden-by"),
    "bytedanceAidpSuzhouHelper"
  );
});

test("ByteDance AIDP taizhou content source does not retain suzhou script config keys", function () {
  const source = fs.readFileSync(contentModulePath, "utf8");

  assert.doesNotMatch(source, /suzhouHelper/);
});

test("ByteDance AIDP taizhou content keeps runtime identifiers separate from Jinhua", function () {
  const source = fs.readFileSync(contentModulePath, "utf8");

  assert.match(source, /BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID/);
  assert.match(source, /BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS/);
  assert.match(source, /BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_SERVER_ENDPOINT/);
  assert.match(source, /TAIZHOU_PANEL_ROOT_ATTR/);
  assert.doesNotMatch(source, /Jinhua|JINHUA|jinhua/);
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

test("ByteDance AIDP content does not treat task extra info toolbar as floating AI", function () {
  const contentModule = loadContentModule();
  const operationToolbar = new FakeElement({
    className: "operation-time-container-r2k2ZW",
    style: {
      position: "fixed",
      top: "24px",
      right: "24px",
      width: "180px",
      height: "48px",
    },
    rect: {
      top: 24,
      left: 1640,
      right: 1820,
      bottom: 72,
      width: 180,
      height: 48,
    },
    children: [
      new FakeElement({
        className: "task-extra-info-JjjRoP",
        children: [
          new FakeElement({ tagName: "span", text: "最近暂存时间：" }),
          new FakeElement({ tagName: "span", text: "07-07 14:40:19" }),
          new FakeElement({ tagName: "button", text: "暂存" }),
          new FakeElement({ tagName: "svg" }),
          new FakeElement({ tagName: "span", text: "重置" }),
        ],
      }),
    ],
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [operationToolbar],
    }),
  ]);

  const targets = contentModule.__testOnly.findPlatformAiTargets(root);

  assert.deepEqual(targets, []);
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

test("ByteDance AIDP content matches management routes for account-switch header UI", function () {
  const contentModule = loadContentModule();

  assert.equal(contentModule.__testOnly.isManagementPagePathname("/management"), true);
  assert.equal(contentModule.__testOnly.isManagementPagePathname("/management/governance/team"), true);
  assert.equal(contentModule.__testOnly.isManagementPagePathname("/management/task-v2?page=1"), true);
  assert.equal(
    contentModule.__testOnly.isManagementPagePathname(
      "/management/task-v2/7632228385175129882/mark-v3/1"
    ),
    true
  );
  assert.equal(
    contentModule.__testOnly.isManagementPagePathname("/workspace/home"),
    false
  );
});

test("ByteDance AIDP content mounts the task-v2 account switch control into the header user area only once", function () {
  const contentModule = loadContentModule();
  const avatarTrigger = new FakeElement({
    tagName: "button",
    className: "aidp-foundation-avatar aidp-foundation-avatar-circle",
    text: "头像",
  });
  const userInfo = new FakeElement({
    className: "frame-user-info-yRAnfL",
    children: [
      new FakeElement({
        tagName: "span",
        className: "help-icon-RpIVBN",
      }),
      new FakeElement({
        tagName: "span",
        className: "aidp-foundation-badge user-message-T1njNS",
      }),
      avatarTrigger,
    ],
  });
  const pageRoot = new FakeElement({
    className: "page-root",
    children: [
      new FakeElement({
        tagName: "header",
        className: "aidp-foundation-layout-header frame-header-CsvDkf",
        children: [
          new FakeElement({
            className: "frame-logo-daSnmi",
          }),
          userInfo,
        ],
      }),
      new FakeElement({
        tagName: "main",
        attributes: {
          role: "main",
        },
      }),
    ],
  });
  const root = createFakeDocument([pageRoot]);

  const firstMount = contentModule.__testOnly.ensureAccountSwitchBar(root, function () {});
  const secondMount = contentModule.__testOnly.ensureAccountSwitchBar(root, function () {});
  const bars = userInfo.querySelectorAll("[data-asc-aidp-account-switch-bar='true']");
  const button = root.querySelector("[data-asc-aidp-account-switch-button='true']");

  assert.equal(bars.length, 1);
  assert.ok(button);
  assert.equal(button.textContent, "切换账号");
  assert.equal(firstMount.created, true);
  assert.equal(secondMount.created, false);
  assert.equal(userInfo.children[userInfo.children.length - 2], bars[0]);
  assert.equal(userInfo.children[userInfo.children.length - 1], avatarTrigger);
  assert.equal(
    root.querySelectorAll("[role='main'] [data-asc-aidp-account-switch-bar='true']").length,
    0
  );
});

test("ByteDance AIDP content does not mount the task-v2 account switch control when the header user area is missing", function () {
  const contentModule = loadContentModule();
  const pageRoot = new FakeElement({
    className: "page-root",
    children: [
      new FakeElement({
        tagName: "main",
        attributes: {
          role: "main",
        },
      }),
    ],
  });
  const root = createFakeDocument([pageRoot]);

  const mountResult = contentModule.__testOnly.ensureAccountSwitchBar(root, function () {});

  assert.equal(mountResult.created, false);
  assert.equal(mountResult.node, null);
  assert.equal(root.querySelectorAll("[data-asc-aidp-account-switch-bar='true']").length, 0);
});

test("ByteDance AIDP content requests resetting AIDP login state through the new runtime message", async function () {
  const contentModule = loadContentModule();
  const previousChrome = globalThis.chrome;
  const sent = [];
  globalThis.chrome = {
    runtime: {
      sendMessage(message, callback) {
        sent.push(message);
        callback({
          ok: true,
          result: {
            ok: true,
            clearedCount: 4,
          },
        });
      },
      lastError: null,
    },
  };

  try {
    const result = await contentModule.__testOnly.requestAidpLoginStateReset({
      url: "https://aidp.bytedance.com/management/governance/team",
    });

    assert.deepEqual(sent, [
      {
        type: "ASR_EDGE_RESET_AIDP_LOGIN_STATE",
        url: "https://aidp.bytedance.com/management/governance/team",
      },
    ]);
    assert.equal(result.ok, true);
  } finally {
    globalThis.chrome = previousChrome;
  }
});

test("ByteDance AIDP content switches account by resetting login state and reloading the page", async function () {
  const contentModule = loadContentModule();
  const calls = [];

  const result = await contentModule.__testOnly.runAccountSwitchFlow(null, {
    confirm: function () {
      return true;
    },
    resetLoginState: async function (payload) {
      calls.push({
        type: "reset",
        payload: payload,
      });
      return {
        ok: true,
        clearedCount: 4,
      };
    },
    reloadPage: function () {
      calls.push({
        type: "reload",
      });
    },
    url: "https://aidp.bytedance.com/management/task-v2?page=1",
  });

  assert.deepEqual(calls, [
    {
      type: "reset",
      payload: {
        url: "https://aidp.bytedance.com/management/task-v2?page=1",
      },
    },
    {
      type: "reload",
    },
  ]);
  assert.equal(result.ok, true);
  assert.match(result.message, /已重置登录态|已清除登录态/);
});

test("ByteDance AIDP content does not reload the page when resetting login state fails", async function () {
  const contentModule = loadContentModule();
  const calls = [];

  const result = await contentModule.__testOnly.runAccountSwitchFlow(null, {
    confirm: function () {
      return true;
    },
    resetLoginState: async function () {
      calls.push("reset");
      return {
        ok: false,
        message: "没有权限清理站点储存。",
      };
    },
    reloadPage: function () {
      calls.push("reload");
    },
    url: "https://aidp.bytedance.com/management/task-v2?page=1",
  });

  assert.deepEqual(calls, ["reset"]);
  assert.equal(result.ok, false);
  assert.equal(result.message, "没有权限清理站点储存。");
});

test("ByteDance AIDP content cancels account switch before resetting login state", async function () {
  const contentModule = loadContentModule();
  const calls = [];

  const result = await contentModule.__testOnly.runAccountSwitchFlow(null, {
    confirm: function () {
      return false;
    },
    resetLoginState: async function () {
      calls.push("reset");
      return {
        ok: true,
      };
    },
    reloadPage: function () {
      calls.push("reload");
    },
  });

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "cancelled");
});

test("ByteDance AIDP content resolves helper config with custom padding playback rate and wave zoom", function () {
  const contentModule = loadContentModule();
  const config = contentModule.__testOnly.resolveHelperConfig({
    platforms: {
      bytedanceAidp: {
        scripts: {
          taizhouHelper: {
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

test("ByteDance AIDP content resolves Taizhou AI config with normalized Omni params", function () {
  const contentModule = loadContentModule();
  const config = contentModule.__testOnly.resolveHelperConfig({
    meta: {
      aiUsageOperatorName: "张三",
    },
    platforms: {
      bytedanceAidp: {
        scripts: {
          taizhouHelper: {
            aiRecommendEnabled: true,
            aiRecommendEndpoint: "http://127.0.0.1:3333/api/bytedance-aidp/taizhou-helper/ai/recommend",
            aiRecommendRequestTimeoutMs: 999999,
            aiRecommendOmniModel: "qwen3.5-omni-flash",
            aiRecommendOmniPrompt: "omni prompt",
            aiRecommendOmniTopP: 0.6,
            aiRecommendOmniMaxTokens: 888,
            aiRecommendOmniTemperature: 0.2,
            aiRecommendOmniStopSequences: "甲\n乙",
          },
        },
      },
    },
  });

  assert.equal(config.aiRecommendEnabled, true);
  assert.equal(config.aiRecommendRequestTimeoutMs, 60000);
  assert.equal(config.aiOmni.model, "qwen3.5-omni-flash");
  assert.equal(config.aiOmni.prompt, "omni prompt");
  assert.equal(config.aiOmni.params.top_p, 0.6);
  assert.equal(config.aiOmni.params.max_tokens, 888);
  assert.equal(config.aiOmni.params.temperature, 0.2);
  assert.deepEqual(config.aiOmni.params.stop, ["甲", "乙"]);
  assert.equal(Object.hasOwn(config, "aiStages"), false);
  assert.equal(config.aiUsageOperatorName, "张三");
});

test("ByteDance AIDP content stops playback rate sync without focus fallback when option click alone does not update the label", async function () {
  const contentModule = loadContentModule();
  let optionClickCount = 0;
  let enterConfirmCount = 0;
  const setPlaybackLabel = function (label) {
    const inputNode = playbackSelect.querySelector(".arco-select-view-input");
    const valueNode = playbackSelect.querySelector(".arco-select-view-value");
    inputNode.value = label;
    valueNode.textContent = label;
  };
  const playbackOption = new FakeElement({
    className: "arco-select-option",
    text: "1.50倍速",
  });
  playbackOption.addEventListener("click", function () {
    optionClickCount += 1;
    playbackSelect._pendingPlaybackLabel = "1.50倍速";
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
  playbackSelect.addEventListener("keydown", function (event) {
    if (event?.key === "Enter" && this._pendingPlaybackLabel) {
      enterConfirmCount += 1;
      setPlaybackLabel(this._pendingPlaybackLabel);
      this._pendingPlaybackLabel = "";
    }
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
          playbackOption,
        ],
      }),
    ],
  });
  const root = createFakeDocument([waveRoot]);

  const result = await contentModule.__testOnly.syncPlaybackRateControl(root, 1.5, {
    scopeKey: "detail-1",
  });

  assert.equal(result.changed, true);
  assert.equal(result.confirmed, false);
  assert.equal(optionClickCount, 1);
  assert.equal(enterConfirmCount, 0);
  assert.equal(playbackSelect._focused, undefined);
  assert.equal(contentModule.__testOnly.getPlaybackComboboxLabel(playbackSelect), "1.00倍速");
  assert.equal(result.reason, "confirmation-missed");
});

test("ByteDance AIDP content applies fixed zoom by clicking platform zoom-in button until target is reached", async function () {
  const contentModule = loadContentModule();
  let zoomInClicks = 0;
  const zoomInput = new FakeElement({
    tagName: "input",
    attributes: {
      role: "spinbutton",
      "aria-valuenow": "1",
    },
    value: "1",
  });
  const zoomInButton = new FakeElement({
    className: "zoom-in-button",
  });
  zoomInButton.addEventListener("click", function () {
    zoomInClicks += 1;
    const nextValue = String(Number(zoomInput.getAttribute("aria-valuenow")) + 1);
    zoomInput.setAttribute("aria-valuenow", nextValue);
    zoomInput.value = nextValue;
  });
  const zoomOutButton = new FakeElement({
    className: "zoom-out-button",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      children: [
        new FakeElement({
          className: "btns-operation",
          children: [
            new FakeElement({
              className: "zoom-control-group",
              children: [zoomOutButton, zoomInput, zoomInButton],
            }),
          ],
        }),
      ],
    }),
  ]);

  const result = await contentModule.__testOnly.syncWaveZoomControl(root, 3);

  assert.equal(result.confirmed, true);
  assert.equal(zoomInClicks, 2);
  assert.equal(zoomInput.getAttribute("aria-valuenow"), "3");
});

test("ByteDance AIDP content reads wave zoom from aria-valuenow before input value and clicks zoom-out until target is reached", async function () {
  const contentModule = loadContentModule();
  let zoomOutClicks = 0;
  const zoomInput = new FakeElement({
    tagName: "input",
    attributes: {
      role: "spinbutton",
      "aria-valuenow": "4",
    },
    value: "9",
  });
  const zoomOutButton = new FakeElement({
    className: "zoom-out-button",
  });
  zoomOutButton.addEventListener("click", function () {
    zoomOutClicks += 1;
    const nextValue = String(Number(zoomInput.getAttribute("aria-valuenow")) - 1);
    zoomInput.setAttribute("aria-valuenow", nextValue);
    zoomInput.value = nextValue;
  });
  const zoomInButton = new FakeElement({
    className: "zoom-in-button",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      children: [
        new FakeElement({
          className: "btns-operation",
          children: [
            new FakeElement({
              className: "zoom-control-group",
              children: [zoomOutButton, zoomInput, zoomInButton],
            }),
          ],
        }),
      ],
    }),
  ]);

  const result = await contentModule.__testOnly.syncWaveZoomControl(root, 2);

  assert.equal(result.confirmed, true);
  assert.equal(zoomOutClicks, 2);
  assert.equal(zoomInput.getAttribute("aria-valuenow"), "2");
  assert.equal(zoomInput.value, "2");
});

test("ByteDance AIDP content only auto-syncs fixed zoom once per page for the same target", async function () {
  const contentModule = loadContentModule();
  let zoomInClicks = 0;
  const zoomInput = new FakeElement({
    tagName: "input",
    attributes: {
      role: "spinbutton",
      "aria-valuenow": "1",
    },
    value: "1",
  });
  const zoomOutButton = new FakeElement({
    className: "zoom-out-button",
  });
  const zoomInButton = new FakeElement({
    className: "zoom-in-button",
  });
  zoomInButton.addEventListener("click", function () {
    zoomInClicks += 1;
    const nextValue = String(Number(zoomInput.getAttribute("aria-valuenow")) + 1);
    zoomInput.setAttribute("aria-valuenow", nextValue);
    zoomInput.value = nextValue;
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      children: [
        new FakeElement({
          className: "btns-operation",
          children: [
            new FakeElement({
              className: "zoom-control-group",
              children: [zoomOutButton, zoomInput, zoomInButton],
            }),
          ],
        }),
      ],
    }),
  ]);

  const firstChanged = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1,
    fixedWaveZoom: 3,
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 80);
  });

  zoomInput.setAttribute("aria-valuenow", "1.5");
  zoomInput.value = "1.5";
  const clickCountAfterFirstSync = zoomInClicks;

  const secondChanged = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1,
    fixedWaveZoom: 3,
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 50);
  });

  assert.equal(firstChanged, true);
  assert.equal(secondChanged, false);
  assert.equal(zoomInClicks, clickCountAfterFirstSync);
});

test("ByteDance AIDP content only auto-syncs playback rate once per page scope", async function () {
  const contentModule = loadContentModule();
  let optionClickCount = 0;
  const playbackOption = new FakeElement({
    className: "arco-select-option",
    text: "1.50倍速",
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
  const setPlaybackLabel = function (label) {
    playbackSelect.querySelector(".arco-select-view-input").value = label;
    playbackSelect.querySelector(".arco-select-view-value").textContent = label;
  };
  playbackOption.addEventListener("click", function () {
    optionClickCount += 1;
    setPlaybackLabel("1.50倍速");
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      children: [
        new FakeElement({
          className: "wave-toolbar",
          children: [
            new FakeElement({ tagName: "span", text: "播放速度" }),
            playbackSelect,
            new FakeElement({ tagName: "span", text: "总时长" }),
            playbackOption,
          ],
        }),
      ],
    }),
  ]);

  const firstChanged = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1.5,
    fixedWaveZoom: 2,
    playbackScopeKey: "detail-1",
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 60);
  });

  setPlaybackLabel("1.00倍速");
  const clickCountAfterFirstSync = optionClickCount;

  const secondChanged = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1.5,
    fixedWaveZoom: 2,
    playbackScopeKey: "detail-1",
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 40);
  });

  const thirdChanged = contentModule.__testOnly.applyWaveToolSettings(root, {
    defaultPlaybackRate: 1.5,
    fixedWaveZoom: 2,
    playbackScopeKey: "detail-2",
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 60);
  });

  assert.equal(firstChanged, true);
  assert.equal(secondChanged, false);
  assert.equal(optionClickCount, clickCountAfterFirstSync + 1);
  assert.equal(thirdChanged, true);
  assert.equal(contentModule.__testOnly.getPlaybackComboboxLabel(playbackSelect), "1.50倍速");
});

test("ByteDance AIDP content parses wave elapsed time from the workbench text", function () {
  const contentModule = loadContentModule();
  assert.equal(
    contentModule.__testOnly.parseWaveElapsedTimeMs("1:00.400播放速度1.00倍速总时长1:18.738"),
    60400
  );
  assert.equal(contentModule.__testOnly.parseWaveElapsedTimeMs("0:07.47"), 7470);
  assert.equal(contentModule.__testOnly.parseWaveElapsedTimeMs(""), null);
});

test("ByteDance AIDP content detects active wave playback from advancing elapsed time", function () {
  const contentModule = loadContentModule();
  const originalDateNow = Date.now;
  let fakeNow = 1000;
  Date.now = function () {
    return fakeNow;
  };
  const root = createFakeDocument([
    new FakeElement({
      className: "neeko-wavesurfer-warper neeko-wavesurfer",
      text: "0:00.000播放速度1.00倍速总时长1:18.738",
    }),
  ]);

  try {
    assert.equal(contentModule.__testOnly.isWavePlaybackActive(root), false);
    fakeNow = 2200;
    root._ownText = "0:01.200播放速度1.00倍速总时长1:18.738";
    assert.equal(contentModule.__testOnly.isWavePlaybackActive(root), true);
    fakeNow = 4300;
    assert.equal(contentModule.__testOnly.isWavePlaybackActive(root), true);
    fakeNow = 5000;
    assert.equal(contentModule.__testOnly.isWavePlaybackActive(root), false);
  } finally {
    Date.now = originalDateNow;
  }
});

test("ByteDance AIDP content defers playback-sensitive decorations while wave time is advancing", function () {
  const contentModule = loadContentModule();
  const originalDateNow = Date.now;
  let fakeNow = 1000;
  Date.now = function () {
    return fakeNow;
  };
  const waveRoot = new FakeElement({
    className: "neeko-wavesurfer-warper neeko-wavesurfer",
    text: "0:00.000播放速度1.00倍速总时长1:18.738",
  });
  const root = createFakeDocument([
    new FakeElement({
      attributes: {
        id: "conbination-wrap",
      },
      children: [
        waveRoot,
        createAidpVirtualSegmentTable([
          createAidpVirtualSegmentTableRow(1),
          createAidpVirtualSegmentTableRow(2),
        ]),
      ],
    }),
  ]);

  try {
    contentModule.__testOnly.setRuntimePolicyForTest({
      runtimeAccessible: true,
    });
    assert.equal(contentModule.__testOnly.isWavePlaybackActive(root), false);
    fakeNow = 2200;
    waveRoot._ownText = "0:01.200播放速度1.00倍速总时长1:18.738";
    const result = contentModule.__testOnly.syncPlaybackSensitiveDecorations(root, {
      playbackScopeKey: "detail-1",
    });

    assert.deepEqual(result, {
      changed: false,
      deferred: true,
    });
    assert.equal(root.querySelectorAll("[data-asc-segment-recognize-button='true']").length, 0);
  } finally {
    Date.now = originalDateNow;
  }
});

test("ByteDance AIDP content playback scroll guard restores non-user table and detail scrolling", function () {
  const contentModule = loadContentModule();
  const originalDateNow = Date.now;
  let fakeNow = 1000;
  Date.now = function () {
    return fakeNow;
  };
  const virtualTable = createAidpVirtualSegmentTable([
    createAidpVirtualSegmentTableRow(1),
    createAidpVirtualSegmentTableRow(2),
  ]);
  const tableBody = virtualTable.querySelector(".arco-table-body");
  tableBody.scrollTop = 340;
  const detailWrap = new FakeElement({
    attributes: {
      id: "conbination-wrap",
    },
    scrollTop: 120,
    children: [virtualTable],
  });
  const root = createFakeDocument([detailWrap]);

  try {
    const result = contentModule.__testOnly.syncPlaybackScrollGuard(root, {
      playing: true,
    });
    assert.equal(result.active, true);

    tableBody.scrollTop = 390;
    tableBody.dispatchEvent({
      type: "scroll",
      target: tableBody,
    });
    detailWrap.scrollTop = 180;
    detailWrap.dispatchEvent({
      type: "scroll",
      target: detailWrap,
    });

    assert.equal(tableBody.scrollTop, 340);
    assert.equal(detailWrap.scrollTop, 120);
  } finally {
    Date.now = originalDateNow;
  }
});

test("ByteDance AIDP content playback scroll guard keeps user wheel scrolling and updates the baseline", function () {
  const contentModule = loadContentModule();
  const originalDateNow = Date.now;
  let fakeNow = 1000;
  Date.now = function () {
    return fakeNow;
  };
  const virtualTable = createAidpVirtualSegmentTable([
    createAidpVirtualSegmentTableRow(1),
    createAidpVirtualSegmentTableRow(2),
  ]);
  const tableBody = virtualTable.querySelector(".arco-table-body");
  tableBody.scrollTop = 340;
  const detailWrap = new FakeElement({
    attributes: {
      id: "conbination-wrap",
    },
    scrollTop: 120,
    children: [virtualTable],
  });
  const root = createFakeDocument([detailWrap]);

  try {
    contentModule.__testOnly.syncPlaybackScrollGuard(root, {
      playing: true,
    });

    fakeNow = 1200;
    tableBody.dispatchEvent({
      type: "wheel",
      target: tableBody,
    });
    tableBody.scrollTop = 390;
    tableBody.dispatchEvent({
      type: "scroll",
      target: tableBody,
    });
    assert.equal(tableBody.scrollTop, 390);

    fakeNow = 2600;
    tableBody.scrollTop = 450;
    tableBody.dispatchEvent({
      type: "scroll",
      target: tableBody,
    });
    assert.equal(tableBody.scrollTop, 390);
  } finally {
    Date.now = originalDateNow;
  }
});

test("ByteDance AIDP content playback scroll guard releases control after playback stops", function () {
  const contentModule = loadContentModule();
  const virtualTable = createAidpVirtualSegmentTable([
    createAidpVirtualSegmentTableRow(1),
    createAidpVirtualSegmentTableRow(2),
  ]);
  const tableBody = virtualTable.querySelector(".arco-table-body");
  tableBody.scrollTop = 340;
  const detailWrap = new FakeElement({
    attributes: {
      id: "conbination-wrap",
    },
    scrollTop: 120,
    children: [virtualTable],
  });
  const root = createFakeDocument([detailWrap]);

  contentModule.__testOnly.syncPlaybackScrollGuard(root, {
    playing: true,
  });
  contentModule.__testOnly.syncPlaybackScrollGuard(root, {
    playing: false,
  });
  assert.equal(contentModule.__testOnly.getPlaybackScrollGuardState().active, false);

  tableBody.scrollTop = 410;
  tableBody.dispatchEvent({
    type: "scroll",
    target: tableBody,
  });
  detailWrap.scrollTop = 170;
  detailWrap.dispatchEvent({
    type: "scroll",
    target: detailWrap,
  });

  assert.equal(tableBody.scrollTop, 410);
  assert.equal(detailWrap.scrollTop, 170);
});

test("ByteDance AIDP content injects clear-segments button into the detail header action group", function () {
  const contentModule = loadContentModule();
  let clicked = 0;
  const headerActionGroup = new FakeElement({
    className: "operation-group-btn-GcvnvK",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "item-info-Gr9sCs",
      children: [
        new FakeElement({
          className: "item-content-YPvk0h",
          children: [
            new FakeElement({
              className: "agent-wrapper-g36cL8",
              children: [headerActionGroup],
            }),
          ],
        }),
      ],
    }),
  ]);

  const inserted = contentModule.__testOnly.ensureClearSegmentsButton(root, function () {
    clicked += 1;
  });
  const button = headerActionGroup.querySelector("[data-asc-clear-segments-button='true']");

  assert.equal(inserted, true);
  assert.equal(root.querySelector("[data-asc-toolbar-action-group='true']"), null);
  assert.equal(button.getAttribute("data-asc-clear-segments-button"), "true");
  button.click();
  assert.equal(clicked, 1);
});

test("ByteDance AIDP content injects fill-language-kind button next to clear button in the detail header", function () {
  const contentModule = loadContentModule();
  let filled = 0;
  const headerActionGroup = new FakeElement({
    className: "operation-group-btn-GcvnvK",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "item-info-Gr9sCs",
      children: [
        new FakeElement({
          className: "item-content-YPvk0h",
          children: [
            new FakeElement({
              className: "agent-wrapper-g36cL8",
              children: [headerActionGroup],
            }),
          ],
        }),
      ],
    }),
  ]);

  contentModule.__testOnly.ensureClearSegmentsButton(root, function () {});
  const inserted = contentModule.__testOnly.ensureFillLanguageKindsButton(
    root,
    function () {
      filled += 1;
    }
  );
  const clearButton = headerActionGroup.querySelector("[data-asc-clear-segments-button='true']");
  const fillButton = headerActionGroup.querySelector("[data-asc-fill-language-kind-button='true']");

  assert.equal(inserted, true);
  assert.equal(root.querySelector("[data-asc-toolbar-action-group='true']"), null);
  assert.equal(clearButton.getAttribute("data-asc-clear-segments-button"), "true");
  assert.equal(fillButton.getAttribute("data-asc-fill-language-kind-button"), "true");
  assert.equal(fillButton.textContent, "填充语言种类");
  fillButton.click();
  assert.equal(filled, 1);
});

test("ByteDance AIDP content injects per-row recognize buttons once and keeps a single recognize header", function () {
  const contentModule = loadContentModule();
  const rowOne = createAidpSegmentTableRow(1);
  const rowTwo = createAidpSegmentTableRow(2);
  const table = new FakeElement({
    tagName: "table",
    children: [
      new FakeElement({
        tagName: "tr",
        children: [
          new FakeElement({ tagName: "th", text: "序号" }),
          new FakeElement({ tagName: "th", text: "区间" }),
          new FakeElement({ tagName: "th", text: "转写文本" }),
          new FakeElement({ tagName: "th", text: "语音种类" }),
          new FakeElement({ tagName: "th", text: "音频段" }),
          new FakeElement({ tagName: "th", text: "操作" }),
        ],
      }),
      rowOne,
      rowTwo,
    ],
  });
  const root = createFakeDocument([table]);

  const firstInserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(
    root,
    function () {}
  );
  const secondInserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(
    root,
    function () {}
  );
  const recognizeButtons = root.querySelectorAll("[data-asc-segment-recognize-button='true']");

  assert.equal(firstInserted, true);
  assert.equal(secondInserted, false);
  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-header='true']").length, 1);
  assert.equal(recognizeButtons.length, 2);
  assert.equal(recognizeButtons[0].textContent, "识别音频");
  assert.equal(recognizeButtons[1].textContent, "识别音频");
});

test("ByteDance AIDP content restores protected scroll containers after injecting row recognize buttons", function () {
  const contentModule = loadContentModule();
  const virtualTable = createAidpVirtualSegmentTable([
    createAidpVirtualSegmentTableRow(1),
    createAidpVirtualSegmentTableRow(2),
  ]);
  const tableBody = virtualTable.querySelector(".arco-table-body");
  tableBody.scrollTop = 540;
  const detailWrap = new FakeElement({
    attributes: {
      id: "conbination-wrap",
    },
    scrollTop: 960,
    children: [virtualTable],
  });
  const root = createFakeDocument([detailWrap]);

  const inserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(root, function () {});

  assert.equal(inserted, true);
  assert.equal(detailWrap.scrollTop, 960);
  assert.equal(tableBody.scrollTop, 540);
});

test("ByteDance AIDP content does not inject recognize header or buttons for empty segment tables", function () {
  const contentModule = loadContentModule();
  const table = new FakeElement({
    tagName: "table",
    children: [
      new FakeElement({
        tagName: "tr",
        children: [
          new FakeElement({ tagName: "th", text: "序号" }),
          new FakeElement({ tagName: "th", text: "区间" }),
          new FakeElement({ tagName: "th", text: "转写文本" }),
          new FakeElement({ tagName: "th", text: "语音种类" }),
          new FakeElement({ tagName: "th", text: "音频段" }),
          new FakeElement({ tagName: "th", text: "操作" }),
        ],
      }),
      createAidpEmptyStateRow(),
    ],
  });
  const root = createFakeDocument([table]);

  const inserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(root, function () {});

  assert.equal(inserted, false);
  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-header='true']").length, 0);
  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-button='true']").length, 0);
});

test("ByteDance AIDP content removes recognize header after segment table returns to empty state", function () {
  const contentModule = loadContentModule();
  const headerRow = new FakeElement({
    tagName: "tr",
    children: [
      new FakeElement({ tagName: "th", text: "序号" }),
      new FakeElement({ tagName: "th", text: "区间" }),
      new FakeElement({ tagName: "th", text: "转写文本" }),
      new FakeElement({ tagName: "th", text: "语音种类" }),
      new FakeElement({ tagName: "th", text: "音频段" }),
      new FakeElement({ tagName: "th", text: "操作" }),
    ],
  });
  const table = new FakeElement({
    tagName: "table",
    children: [headerRow, createAidpSegmentTableRow(1)],
  });
  const root = createFakeDocument([table]);

  contentModule.__testOnly.ensureSegmentRecognizeButtons(root, function () {});
  table.children = [headerRow, createAidpEmptyStateRow()];
  table.children.forEach(function (child) {
    child.parentElement = table;
    child.ownerDocument = root;
  });

  contentModule.__testOnly.ensureSegmentRecognizeButtons(root, function () {});

  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-header='true']").length, 0);
  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-button='true']").length, 0);
});

test("ByteDance AIDP content row recognize button dispatches the matching segment number", function () {
  const contentModule = loadContentModule();
  const clickedSegments = [];
  const rowOne = createAidpSegmentTableRow(1);
  const rowTwo = createAidpSegmentTableRow(2);
  const table = new FakeElement({
    tagName: "table",
    children: [
      new FakeElement({
        tagName: "tr",
        children: [
          new FakeElement({ tagName: "th", text: "序号" }),
          new FakeElement({ tagName: "th", text: "区间" }),
          new FakeElement({ tagName: "th", text: "转写文本" }),
          new FakeElement({ tagName: "th", text: "语音种类" }),
          new FakeElement({ tagName: "th", text: "音频段" }),
          new FakeElement({ tagName: "th", text: "操作" }),
        ],
      }),
      rowOne,
      rowTwo,
    ],
  });
  const root = createFakeDocument([table]);

  contentModule.__testOnly.ensureSegmentRecognizeButtons(root, function (segmentNumber) {
    clickedSegments.push(segmentNumber);
  });
  const recognizeButtons = root.querySelectorAll("[data-asc-segment-recognize-button='true']");

  recognizeButtons[1].click();

  assert.deepEqual(clickedSegments, [2]);
});



test("ByteDance AIDP content injects per-row recognize buttons into Arco virtualized segment rows", function () {
  const contentModule = loadContentModule();
  const clickedSegments = [];
  const root = createFakeDocument([
    createAidpVirtualSegmentTable([
      createAidpVirtualSegmentTableRow(1),
      createAidpVirtualSegmentTableRow(2),
    ]),
  ]);

  const firstInserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(
    root,
    function (segmentNumber) {
      clickedSegments.push(segmentNumber);
    }
  );
  const secondInserted = contentModule.__testOnly.ensureSegmentRecognizeButtons(
    root,
    function () {}
  );
  const recognizeButtons = root.querySelectorAll("[data-asc-segment-recognize-button='true']");

  recognizeButtons[1].click();

  assert.equal(firstInserted, true);
  assert.equal(secondInserted, false);
  assert.equal(root.querySelectorAll("[data-asc-segment-recognize-header='true']").length, 1);
  assert.equal(recognizeButtons.length, 2);
  assert.deepEqual(clickedSegments, [2]);
});

test("ByteDance AIDP content builds request context from the specified segment number", function () {
  const contentModule = loadContentModule();
  const requestContext = contentModule.__testOnly.buildSegmentRequestContext(
    {
      selectionKey: "item-1",
      audioUrl: "https://audio.example.test/demo.mp3",
      activeSegmentNumber: 1,
      currentSegments: [
        {
          segmentNumber: 1,
          startMs: 0,
          endMs: 1200,
          text: "",
          language: "目标方言",
        },
        {
          segmentNumber: 2,
          startMs: 1300,
          endMs: 2200,
          text: "原文本",
          language: "目标方言",
        },
      ],
    },
    2
  );

  assert.equal(requestContext.segmentNumber, 2);
  assert.equal(requestContext.selection.startMs, 1300);
  assert.equal(requestContext.selection.endMs, 2200);
  assert.equal(requestContext.selection.durationMs, 900);
  assert.equal(requestContext.currentText, "原文本");
  assert.equal(requestContext.currentLanguage, "目标方言");
});

test("ByteDance AIDP content fills only empty language-kind comboboxes with target dialect", async function () {
  const contentModule = loadContentModule();
  const emptyValue = new FakeElement({
    className: "arco-select-view-value",
    text: "请选择",
  });
  const emptyCombobox = new FakeElement({
    className: "arco-select arco-select-single",
    attributes: {
      role: "combobox",
    },
    children: [emptyValue],
  });
  const existingValue = new FakeElement({
    className: "arco-select-view-value",
    text: "普通话",
  });
  const existingCombobox = new FakeElement({
    className: "arco-select arco-select-single",
    attributes: {
      role: "combobox",
    },
    children: [existingValue],
  });
  const tableRoot = new FakeElement({
    className: "segment-table",
    children: [
      new FakeElement({ tagName: "span", text: "区间" }),
      new FakeElement({ tagName: "span", text: "转写文本" }),
      new FakeElement({ tagName: "span", text: "语言种类" }),
      emptyCombobox,
      existingCombobox,
    ],
  });
  const option = new FakeElement({
    className: "arco-select-option",
    attributes: {
      role: "option",
    },
    text: "目标方言",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [tableRoot, option],
    }),
  ]);

  option.addEventListener("click", function () {
    emptyValue.textContent = "目标方言";
  });

  const result = await contentModule.__testOnly.fillEmptyLanguageKinds(root);

  assert.deepEqual(result, {
    ok: true,
    filledCount: 1,
  });
  assert.equal(emptyValue.textContent, "目标方言");
  assert.equal(existingValue.textContent, "普通话");
});

test("ByteDance AIDP content scopes target dialect lookup to the active combobox popup", async function () {
  const contentModule = loadContentModule();
  const emptyValueOne = new FakeElement({
    className: "arco-select-view-value",
    text: "请选择",
  });
  const emptyValueTwo = new FakeElement({
    className: "arco-select-view-value",
    text: "请选择",
  });
  const comboboxOne = new FakeElement({
    className: "arco-select arco-select-single",
    attributes: {
      role: "combobox",
      "aria-controls": "popup-one",
      "aria-expanded": "false",
    },
    children: [emptyValueOne],
  });
  const comboboxTwo = new FakeElement({
    className: "arco-select arco-select-single",
    attributes: {
      role: "combobox",
      "aria-controls": "popup-two",
      "aria-expanded": "false",
    },
    children: [emptyValueTwo],
  });
  const popupOne = new FakeElement({
    className: "arco-select-popup",
    attributes: {
      id: "popup-one",
      "aria-hidden": "false",
    },
    children: [
      new FakeElement({
        className: "arco-select-option",
        attributes: {
          role: "option",
        },
        text: "目标方言",
      }),
    ],
  });
  const popupTwo = new FakeElement({
    className: "arco-select-popup",
    attributes: {
      id: "popup-two",
      "aria-hidden": "true",
    },
    children: [
      new FakeElement({
        className: "arco-select-option",
        attributes: {
          role: "option",
        },
        text: "目标方言",
      }),
    ],
  });
  const tableRoot = new FakeElement({
    className: "segment-table",
    children: [
      new FakeElement({ tagName: "span", text: "区间" }),
      new FakeElement({ tagName: "span", text: "转写文本" }),
      new FakeElement({ tagName: "span", text: "语言种类" }),
      comboboxOne,
      comboboxTwo,
    ],
  });
  const pageRoot = new FakeElement({
    className: "page-root",
    children: [tableRoot, popupOne],
  });
  const root = createFakeDocument([pageRoot]);
  const optionOne = popupOne.children[0];
  const optionTwo = popupTwo.children[0];

  comboboxOne.addEventListener("click", function () {
    comboboxOne.setAttribute("aria-expanded", "true");
    popupOne.setAttribute("aria-hidden", "false");
  });
  optionOne.addEventListener("click", function () {
    emptyValueOne.textContent = "目标方言";
    comboboxOne.setAttribute("aria-expanded", "false");
    popupOne.setAttribute("aria-hidden", "true");
  });
  comboboxTwo.addEventListener("click", function () {
    comboboxTwo.setAttribute("aria-expanded", "true");
    popupTwo.setAttribute("aria-hidden", "false");
    if (!pageRoot.children.includes(popupTwo)) {
      pageRoot.appendChild(popupTwo);
    }
  });
  optionTwo.addEventListener("click", function () {
    emptyValueTwo.textContent = "目标方言";
    comboboxTwo.setAttribute("aria-expanded", "false");
    popupTwo.setAttribute("aria-hidden", "true");
  });

  const result = await contentModule.__testOnly.fillEmptyLanguageKinds(root);

  assert.deepEqual(result, {
    ok: true,
    filledCount: 2,
  });
  assert.equal(emptyValueOne.textContent, "目标方言");
  assert.equal(emptyValueTwo.textContent, "目标方言");
  assert.equal(comboboxTwo.getAttribute("aria-expanded"), "false");
});

test("ByteDance AIDP content fill-language-kind action fails closed when target dialect option is ambiguous", async function () {
  const contentModule = loadContentModule();
  const emptyValue = new FakeElement({
    className: "arco-select-view-value",
    text: "请选择",
  });
  const emptyCombobox = new FakeElement({
    className: "arco-select arco-select-single",
    attributes: {
      role: "combobox",
      "aria-expanded": "false",
    },
    children: [emptyValue],
  });
  const tableRoot = new FakeElement({
    className: "segment-table",
    children: [
      new FakeElement({ tagName: "span", text: "区间" }),
      new FakeElement({ tagName: "span", text: "转写文本" }),
      new FakeElement({ tagName: "span", text: "语言种类" }),
      emptyCombobox,
    ],
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [
        tableRoot,
        new FakeElement({
          className: "arco-select-option",
          attributes: {
            role: "option",
          },
          text: "目标方言",
        }),
        new FakeElement({
          className: "arco-select-option",
          attributes: {
            role: "option",
          },
          text: "目标方言",
        }),
      ],
    }),
  ]);

  emptyCombobox.addEventListener("click", function () {
    emptyCombobox.setAttribute("aria-expanded", "true");
  });
  emptyCombobox.addEventListener("keydown", function (event) {
    if (String(event?.key || "") === "Escape") {
      emptyCombobox.setAttribute("aria-expanded", "false");
    }
  });

  const result = await contentModule.__testOnly.fillEmptyLanguageKinds(root);

  assert.deepEqual(result, {
    ok: false,
    filledCount: 0,
    reason: "missing-target-option",
  });
  assert.equal(emptyValue.textContent, "请选择");
  assert.equal(emptyCombobox.getAttribute("aria-expanded"), "false");
  assert.equal("syncEmptyLanguageKinds" in contentModule.__testOnly, false);
});

test("ByteDance AIDP content auto-applies generated preview when enabled", async function () {
  const contentModule = loadContentModule();
  let cleared = 0;
  let renderedPreview = 0;
  let reloadCount = 0;
  const statusMessages = [];
  const autoApplyResult = await contentModule.__testOnly.maybeAutoApplyPreview(
    {
      config: {
        segmentPreviewAutoApplyEnabled: true,
      },
      dataApi: {
        applySegmentPreview: async function () {
          return {
            ok: true,
            message: "已通过平台暂存接口应用分段建议，请刷新页面复核。",
          };
        },
      },
      segment: {
        clearPreview: function () {
          cleared += 1;
        },
      },
      ui: {
        renderPreview: function (value) {
          if (value === null) {
            renderedPreview += 1;
          }
        },
        setStatus: function (message) {
          statusMessages.push(String(message || ""));
        },
      },
      scheduleReload: function () {
        reloadCount += 1;
      },
    },
    {
      proposedSegments: [{ startMs: 1000, endMs: 2000 }],
    }
  );

  assert.deepEqual(autoApplyResult, {
    attempted: true,
    ok: true,
    result: {
      ok: true,
      message: "已通过平台暂存接口应用分段建议，请刷新页面复核。",
    },
  });
  assert.equal(cleared, 1);
  assert.equal(renderedPreview, 1);
  assert.equal(reloadCount, 1);
  assert.equal(statusMessages[0], "已通过平台暂存接口应用分段建议，请刷新页面复核。");
});

test("ByteDance AIDP content keeps preview when auto-apply is disabled", async function () {
  const contentModule = loadContentModule();
  const autoApplyResult = await contentModule.__testOnly.maybeAutoApplyPreview(
    {
      config: {
        segmentPreviewAutoApplyEnabled: false,
      },
      dataApi: {
        applySegmentPreview: async function () {
          throw new Error("should not run");
        },
      },
    },
    {
      proposedSegments: [{ startMs: 1000, endMs: 2000 }],
    }
  );

  assert.deepEqual(autoApplyResult, {
    attempted: false,
    ok: false,
    reason: "disabled",
  });
});

test("ByteDance AIDP single recognition fills the textarea with the exact listenText", async function () {
  const contentModule = loadContentModule();
  const fillCalls = [];
  const statusCalls = [];
  const runtime = {
    dataApi: {
      async fillCurrentRegionTextIntoDom(payload) {
        fillCalls.push(payload);
        return { ok: true, message: "已填入。", filledCount: 1, skippedCount: 0 };
      },
    },
    ui: {
      setStatus(message, tone) {
        statusCalls.push({ message, tone });
      },
    },
  };

  const result = await contentModule.__testOnly.fillCurrentRecommendation(runtime, {
    segmentNumber: 2,
    listenText: "  台州听音 3！！！  ",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(fillCalls, [{ segmentNumber: 2, listenText: "  台州听音 3！！！  " }]);
  assert.equal(statusCalls.at(-1).tone, "success");
});

test("ByteDance AIDP empty listenText never writes the textarea", async function () {
  const contentModule = loadContentModule();
  let writeCount = 0;
  const result = await contentModule.__testOnly.fillCurrentRecommendation(
    {
      dataApi: {
        async fillCurrentRegionTextIntoDom() {
          writeCount += 1;
          return { ok: true, filledCount: 1 };
        },
      },
      ui: { setStatus() {} },
    },
    { segmentNumber: 1, listenText: "" }
  );

  assert.equal(result.filledCount, 0);
  assert.equal(writeCount, 0);
});

test("ByteDance AIDP content exposes exactly the expected shortcut action handlers", async function () {
  const contentModule = loadContentModule();
  const calls = [];
  const actions = contentModule.__testOnly.createShortcutActions({
    onTogglePlayPause: function () {
      calls.push("togglePlayPause");
      return true;
    },
    onPlaySelection: function () {
      calls.push("playSelection");
      return true;
    },
    onJumpToFirstFrame: function () {
      calls.push("jumpToFirstFrame");
      return true;
    },
    onDeleteCurrentSelection: function () {
      calls.push("deleteCurrentSelection");
      return true;
    },
    onClearSegments: function () {
      calls.push("clearSegments");
      return Promise.resolve();
    },
    onPreviewSegments: function () {
      calls.push("previewSegments");
      return Promise.resolve();
    },
    onApplyPreviewSegments: function () {
      calls.push("applyPreviewSegments");
      return Promise.resolve();
    },
  });

  assert.deepEqual(Object.keys(actions).sort(), [
    "applyPreviewSegments",
    "clearSegments",
    "deleteCurrentSelection",
    "jumpToFirstFrame",
    "playSelection",
    "previewSegments",
    "togglePlayPause",
  ]);

  await actions.togglePlayPause();
  await actions.playSelection();
  await actions.jumpToFirstFrame();
  await actions.deleteCurrentSelection();
  await actions.clearSegments();
  await actions.previewSegments();
  await actions.applyPreviewSegments();

  assert.deepEqual(calls, [
    "togglePlayPause",
    "playSelection",
    "jumpToFirstFrame",
    "deleteCurrentSelection",
    "clearSegments",
    "previewSegments",
    "applyPreviewSegments",
  ]);
});

test("ByteDance AIDP content keeps header helper buttons on a single line", function () {
  const contentModule = loadContentModule();
  const headerActionGroup = new FakeElement({
    className: "operation-group-btn-GcvnvK",
  });
  const root = createFakeDocument([
    new FakeElement({
      className: "item-info-Gr9sCs",
      children: [
        new FakeElement({
          className: "item-content-YPvk0h",
          children: [
            new FakeElement({
              className: "agent-wrapper-g36cL8",
              children: [headerActionGroup],
            }),
          ],
        }),
      ],
    }),
  ]);

  contentModule.__testOnly.ensureClearSegmentsButton(root, function () {});
  contentModule.__testOnly.ensureFillLanguageKindsButton(root, function () {});
  contentModule.__testOnly.ensureHideAuxiliaryZoneButton(root, function () {});

  const clearButton = headerActionGroup.querySelector("[data-asc-clear-segments-button='true']");
  const fillButton = headerActionGroup.querySelector("[data-asc-fill-language-kind-button='true']");
  const hideButton = headerActionGroup.querySelector(
    "[data-asc-hide-auxiliary-zone-button='true']"
  );

  assert.ok(headerActionGroup);
  assert.equal(headerActionGroup.style.display, "inline-flex");
  assert.equal(headerActionGroup.style.gap, "8px");
  assert.equal(hideButton.textContent, "隐藏辅助区");
  assert.equal(clearButton.style.getPropertyValue("white-space") || clearButton.style.whiteSpace, "nowrap");
  assert.equal(fillButton.style.getPropertyValue("white-space") || fillButton.style.whiteSpace, "nowrap");
  assert.equal(hideButton.style.getPropertyValue("white-space") || hideButton.style.whiteSpace, "nowrap");
});

test("ByteDance AIDP content hides both panel root and native segment table container together", function () {
  const contentModule = loadContentModule();
  const panelRoot = new FakeElement({
    attributes: {
      "data-asc-bytedance-aidp-taizhou-panel": "true",
    },
  });
  const wrapped = createAidpOuterWrapperWithWaveAndTable();
  const nativeContainer = wrapped.innerTableContainer;
  const outerWrapper = wrapped.outerWrapper;
  const waveWorkbench = outerWrapper.querySelector(".neeko-wavesurfer-warper");
  const root = createFakeDocument([
    new FakeElement({
      className: "page-root",
      children: [panelRoot, outerWrapper],
    }),
  ]);

  assert.equal(contentModule.__testOnly.findNativeSegmentTableContainer(root), nativeContainer);

  contentModule.__testOnly.setTaizhouAuxiliaryZonesHidden(root, true);
  assert.equal(
    panelRoot.style.getPropertyValue("display") || panelRoot.style.display,
    "none"
  );
  assert.equal(
    nativeContainer.style.getPropertyValue("display") || nativeContainer.style.display,
    "none"
  );
  assert.notEqual(
    outerWrapper.style.getPropertyValue("display") || outerWrapper.style.display,
    "none"
  );
  assert.notEqual(
    waveWorkbench.style.getPropertyValue("display") || waveWorkbench.style.display,
    "none"
  );

  contentModule.__testOnly.setTaizhouAuxiliaryZonesHidden(root, false);
  assert.notEqual(
    panelRoot.style.getPropertyValue("display") || panelRoot.style.display,
    "none"
  );
  assert.notEqual(
    nativeContainer.style.getPropertyValue("display") || nativeContainer.style.display,
    "none"
  );
  assert.notEqual(
    outerWrapper.style.getPropertyValue("display") || outerWrapper.style.display,
    "none"
  );
  assert.notEqual(
    waveWorkbench.style.getPropertyValue("display") || waveWorkbench.style.display,
    "none"
  );
});

test("ByteDance AIDP batch controller writes every non-empty original listenText once", async function () {
  const contentModule = loadContentModule();
  const writeCalls = [];
  const currentContext = {
    audioUrl: "https://example.test/audio.m4a",
    selectionKey: "selection-2",
    currentSignature: "signature-2",
    taskId: "task-2",
    itemId: "item-2",
    entryId: "entry-2",
    templateID: "template-2",
    currentSegments: [
      { segmentNumber: 1, startMs: 0, endMs: 1200, text: "", language: "目标方言" },
      { segmentNumber: 2, startMs: 1200, endMs: 2400, text: "", language: "目标方言" },
    ],
  };
  const controller = contentModule.__testOnly.createBatchRecommendController({
    dataApi: {
      async getCurrentContext() { return currentContext; },
      async writeBatchRegionTexts(payload) {
        writeCalls.push(payload);
        return { ok: true, message: "已写回 2 段。", writtenCount: 2, skippedCount: 0 };
      },
    },
    ai: {
      createSharedAudioSource(audioUrl) { return { audioUrl }; },
      async recommendForSegment(requestContext) {
        const number = Number(requestContext.segmentNumber || 0) || 0;
        return {
          selectionKey: currentContext.selectionKey,
          segmentNumber: number,
          listenText: number === 1 ? "  第1段听音  " : "第2段听音",
        };
      },
    },
    ui: { renderBatchState() {}, setStatus() {} },
  });

  const result = await controller.start([1, 2]);

  assert.equal(result.ok, true);
  assert.equal(writeCalls.length, 1);
  assert.deepEqual(writeCalls[0].updates, [
    { segmentNumber: 1, listenText: "  第1段听音  " },
    { segmentNumber: 2, listenText: "第2段听音" },
  ]);
  assert.equal(result.writtenCount, 2);
});

test("ByteDance AIDP stopped batch keeps returned listenText out of platform writeback", async function () {
  const contentModule = loadContentModule();
  const writes = [];
  const context = {
    audioUrl: "https://example.test/audio.m4a",
    selectionKey: "stopped",
    currentSignature: "stopped-signature",
    currentSegments: [{ segmentNumber: 1, startMs: 0, endMs: 1000, text: "", language: "" }],
  };
  let started;
  let resolveRecognition;
  const controller = contentModule.__testOnly.createBatchRecommendController({
    dataApi: {
      async getCurrentContext() { return context; },
      async writeBatchRegionTexts(payload) { writes.push(payload); return { ok: true, writtenCount: 1 }; },
    },
    ai: {
      createSharedAudioSource() { return {}; },
      recommendForSegment() {
        return new Promise((resolve) => { started = resolve; }).then(() => ({ segmentNumber: 1, listenText: "返回文本" }));
      },
    },
    ui: { renderBatchState() {}, setStatus() {} },
  });
  const pending = controller.start([1]);
  for (let index = 0; index < 4 && !started; index += 1) {
    await Promise.resolve();
  }
  assert.equal(typeof started, "function");
  assert.equal(controller.stop(), true);
  started();
  const result = await pending;
  assert.equal(result.stopRequested, true);
  assert.equal(writes.length, 0);
});

test("ByteDance AIDP shortcuts runtime ignores editable targets and triggers Space play-pause toggle", function () {
  const shortcutsModule = loadShortcutsModule();
  const windowListeners = new Map();
  const fakeWindow = {
    addEventListener(type, listener) {
      windowListeners.set(String(type || ""), listener);
    },
    removeEventListener(type) {
      windowListeners.delete(String(type || ""));
    },
  };
  const activeInput = {
    tagName: "INPUT",
    isContentEditable: false,
    closest() {
      return null;
    },
  };
  const activeBody = {
    tagName: "DIV",
    isContentEditable: false,
    closest() {
      return null;
    },
  };
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  let triggered = 0;
  globalThis.window = fakeWindow;
  globalThis.document = {
    activeElement: activeInput,
  };

  try {
    const runtime = shortcutsModule.createRuntime({
      shortcuts: {
        togglePlayPause: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "Space",
          button: null,
        },
      },
      actions: {
        togglePlayPause() {
          triggered += 1;
        },
      },
    });
    runtime.bind();
    const listener = windowListeners.get("keydown");
    assert.ok(listener);

    let prevented = 0;
    listener({
      key: " ",
      code: "Space",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: activeInput,
      preventDefault() {
        prevented += 1;
      },
      stopPropagation() {},
    });
    assert.equal(triggered, 0);
    assert.equal(prevented, 0);

    globalThis.document.activeElement = activeBody;
    listener({
      key: " ",
      code: "Space",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      target: activeBody,
      preventDefault() {
        prevented += 1;
      },
      stopPropagation() {},
    });
    assert.equal(triggered, 1);
    assert.equal(prevented, 1);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
