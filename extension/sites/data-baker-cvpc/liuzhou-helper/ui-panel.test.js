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
    this._textContent = "";
    this._innerHTML = "";
    this.type = "";
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    child.isConnected = true;
    this.children.push(child);
    return child;
  }

  insertBefore(child, referenceNode) {
    if (!referenceNode || this.children.indexOf(referenceNode) < 0) {
      return this.appendChild(child);
    }
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    const index = this.children.indexOf(referenceNode);
    child.parentNode = this;
    child.isConnected = true;
    this.children.splice(index, 0, child);
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

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  addEventListener(type, listener) {
    this.eventListeners[type] = listener;
  }

  dispatchEvent(event) {
    const listener = this.eventListeners[String(event?.type || "")];
    if (typeof listener === "function") {
      listener.call(this, event);
    }
    return true;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return collectDescendants(this).filter(function (node) {
      return matchesSelectorChain(node, selector);
    });
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (matchesSelectorChain(current, selector)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  get textContent() {
    return [
      this._textContent || "",
      this.children.map(function (child) {
        return child.textContent || "";
      }).join(" "),
    ]
      .join(" ")
      .trim();
  }

  set textContent(value) {
    this._textContent = String(value || "");
  }

  get innerHTML() {
    return this._innerHTML || "";
  }

  set innerHTML(value) {
    this._innerHTML = String(value || "");
    this._textContent = String(value || "").replace(/<[^>]+>/g, " ");
  }
}

function collectDescendants(root) {
  const result = [];
  (function visit(node) {
    (node.children || []).forEach(function (child) {
      result.push(child);
      visit(child);
    });
  })(root);
  return result;
}

function matchesSimpleSelector(node, selector) {
  const current = String(selector || "").trim();
  if (!current) {
    return false;
  }
  if (current === "*") {
    return true;
  }
  if (/^[a-z]+$/i.test(current)) {
    return node.tagName === current.toUpperCase();
  }
  if (/^\.[\w-]+$/.test(current)) {
    return String(node.className || "")
      .split(/\s+/)
      .filter(Boolean)
      .indexOf(current.slice(1)) >= 0;
  }
  if (/^\.[\w-]+\.[\w-]+$/.test(current)) {
    return current
      .split(".")
      .filter(Boolean)
      .every(function (className) {
        return (
          String(node.className || "")
            .split(/\s+/)
            .filter(Boolean)
            .indexOf(className) >= 0
        );
      });
  }
  if (current === "[contenteditable='true']") {
    return String(node.attributes.contenteditable || "").toLowerCase() === "true";
  }
  if (current === "[role='textbox']") {
    return String(node.attributes.role || "").toLowerCase() === "textbox";
  }
  return false;
}

function matchesSelectorChain(node, selector) {
  return String(selector || "")
    .split(",")
    .some(function (part) {
      const segments = part
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (segments.length === 0) {
        return false;
      }
      let currentNode = node;
      for (let index = segments.length - 1; index >= 0; index -= 1) {
        if (!currentNode || !matchesSimpleSelector(currentNode, segments[index])) {
          return false;
        }
        if (index > 0) {
          currentNode = currentNode.parentNode;
          while (currentNode && !matchesSimpleSelector(currentNode, segments[index - 1])) {
            currentNode = currentNode.parentNode;
          }
          if (!currentNode) {
            return false;
          }
          index -= 1;
        }
      }
      return true;
    });
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
  return root ? root.textContent : "";
}

function findAttrNode(root, attrName) {
  return findNode(root, function (node) {
    return Boolean(node && typeof node.hasAttribute === "function" && node.hasAttribute(attrName));
  });
}

function createHarness() {
  const body = new FakeNode("body");
  const head = new FakeNode("head");

  const globalPanel = new FakeNode("div");
  globalPanel.className = "Label_top right1";
  const panelTitle = new FakeNode("span");
  panelTitle.className = "label_title";
  panelTitle.textContent = "全局标注";
  const nativeValidity = new FakeNode("div");
  nativeValidity.className = "field-block validity-block";
  const nativeValidityLabel = new FakeNode("div");
  nativeValidityLabel.className = "item-name";
  nativeValidityLabel.textContent = "是否有效（Valid or Not）";
  const nativeValidityValue = new FakeNode("div");
  nativeValidityValue.className = "w-[100%]";
  const nativeRadioGroup = new FakeNode("div");
  nativeRadioGroup.className = "el-radio-group";
  const validLabel = new FakeNode("label");
  validLabel.className = "el-radio";
  validLabel.textContent = "是（Valid）";
  const invalidLabel = new FakeNode("label");
  invalidLabel.className = "el-radio";
  invalidLabel.textContent = "否（Invalid）";
  nativeRadioGroup.appendChild(validLabel);
  nativeRadioGroup.appendChild(invalidLabel);
  nativeValidityValue.appendChild(nativeRadioGroup);
  nativeValidity.appendChild(nativeValidityLabel);
  nativeValidity.appendChild(nativeValidityValue);

  const mandarinFieldBlock = new FakeNode("div");
  mandarinFieldBlock.className = "field-block mandarin-block";
  const mandarinLabel = new FakeNode("div");
  mandarinLabel.className = "item-name";
  mandarinLabel.textContent = "普通话顺滑";
  const mandarinValue = new FakeNode("div");
  mandarinValue.className = "w-[100%]";
  const mandarinEditor = new FakeNode("div");
  mandarinEditor.className = "tiptap ProseMirror";
  mandarinEditor.setAttribute("contenteditable", "true");
  mandarinEditor.setAttribute("role", "textbox");
  mandarinValue.appendChild(mandarinEditor);
  mandarinFieldBlock.appendChild(mandarinLabel);
  mandarinFieldBlock.appendChild(mandarinValue);

  globalPanel.appendChild(panelTitle);
  globalPanel.appendChild(nativeValidity);
  globalPanel.appendChild(mandarinFieldBlock);

  const bottomRight = new FakeNode("div");
  bottomRight.className = "bottom-right";
  const nativeSplitButton = new FakeNode("button");
  nativeSplitButton.textContent = "开启拆分";
  const nativeMergeButton = new FakeNode("button");
  nativeMergeButton.textContent = "合并段落";
  bottomRight.appendChild(nativeSplitButton);
  bottomRight.appendChild(nativeMergeButton);

  body.appendChild(globalPanel);
  body.appendChild(bottomRight);

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
      if (selector === "body") {
        return body;
      }
      return body.querySelector(selector);
    },
    querySelectorAll: function (selector) {
      if (selector === "body *") {
        return collectDescendants(body);
      }
      return body.querySelectorAll(selector);
    },
  };

  return {
    body,
    bottomRight,
    document,
    globalPanel,
    mandarinFieldBlock,
    nativeMergeButton,
    nativeSplitButton,
    nativeValidity,
  };
}

test("CVPC ui panel mount tolerates document.body being unavailable before editor hosts are ready", function () {
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

    const text = collectText(harness.globalPanel);
    assert.match(text, /柳州话脚本 Beta/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel mounts assistant below native global validity area and prepends segment buttons", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();

    const globalText = collectText(harness.globalPanel);
    assert.match(globalText, /是否有效（Valid or Not）/);
    assert.doesNotMatch(globalText, /设为 Valid/);
    assert.doesNotMatch(globalText, /设为 Invalid/);
    assert.match(collectText(harness.nativeValidity), /未填写补 Valid/);
    assert.match(collectText(harness.mandarinFieldBlock), /当前段 AI 推荐/);
    assert.match(collectText(harness.mandarinFieldBlock), /填入当前推荐/);
    assert.match(collectText(harness.mandarinFieldBlock), /生成画段建议/);
    assert.match(collectText(harness.mandarinFieldBlock), /应用当前建议/);
    assert.match(collectText(harness.mandarinFieldBlock), /当前画段建议/);
    assert.match(collectText(harness.mandarinFieldBlock), /当前段 AI 推荐结果/);

    assert.equal(harness.bottomRight.children[0], harness.nativeSplitButton);
    assert.equal(harness.bottomRight.children[1], harness.nativeMergeButton);
    assert.doesNotMatch(collectText(harness.bottomRight), /生成画段建议/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders current audio and selected range inside the global annotation card", function () {
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
      selectedRange: {
        startMs: 18565,
        endMs: 35677,
        durationMs: 17112,
      },
    });

    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const text = collectText(panelNode);
    assert.match(text, /当前音频地址/);
    assert.match(text, /sample\.mp3/);
    assert.match(text, /observer/);
    assert.match(text, /18\.565 秒/);
    assert.match(text, /35\.677 秒/);
    assert.match(text, /17\.112 秒/);
    assert.doesNotMatch(text, /当前画段建议/);
    assert.doesNotMatch(text, /当前段 AI 推荐结果/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders preview and recommendation results inside the middle AI area", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderPreview({
      items: [
        {
          startMs: 0,
          endMs: 4171,
          reason: "静音过长",
          needsHumanReview: true,
        },
      ],
    });
    runtime.renderRecommendation({
      success: true,
      dialectText: "柳州话推荐",
      mandarinText: "普通话推荐",
      specialTags: ["口语化"],
      needHumanReview: false,
      notes: ["人工确认"],
    });

    const middleText = collectText(harness.mandarinFieldBlock);
    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const rightText = collectText(panelNode);
    assert.match(middleText, /建议 1/);
    assert.match(middleText, /柳州话推荐/);
    assert.match(middleText, /普通话推荐/);
    assert.match(middleText, /口语化/);
    assert.match(middleText, /人工确认/);
    assert.doesNotMatch(rightText, /柳州话推荐/);
    assert.doesNotMatch(rightText, /建议 1/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});
