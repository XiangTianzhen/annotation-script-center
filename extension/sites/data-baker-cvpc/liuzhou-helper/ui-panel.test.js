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

function findButtonByText(root, text) {
  return findNode(root, function (node) {
    return node instanceof FakeNode && node.tagName === "BUTTON" && collectText(node) === String(text || "");
  });
}

function findRecommendItemByTitle(root, title) {
  return findNode(root, function (node) {
    return (
      node instanceof FakeNode &&
      String(node.className || "").indexOf("recommend-item") >= 0 &&
      collectText(node).indexOf(String(title || "")) >= 0
    );
  });
}

function findNodeByClass(root, className) {
  return findNode(root, function (node) {
    return (
      node instanceof FakeNode &&
      String(node.className || "")
        .split(/\s+/)
        .filter(Boolean)
        .indexOf(String(className || "")) >= 0
    );
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
  const labelContent = new FakeNode("div");
  labelContent.className = "label_title_border2";
  const asrLabelWrap = new FakeNode("div");
  asrLabelWrap.className = "asr_label";
  const fieldGroup = new FakeNode("div");
  fieldGroup.setAttribute("data-v-fd55b986", "");
  const nativeValidity = new FakeNode("div");
  nativeValidity.setAttribute("style", "padding-left: 10px;");
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

  const dialectFieldBlock = new FakeNode("div");
  dialectFieldBlock.setAttribute("style", "padding-left: 10px;");
  dialectFieldBlock.className = "field-block dialect-block";
  const dialectLabel = new FakeNode("div");
  dialectLabel.className = "item-name";
  dialectLabel.textContent = "标注文本";
  const dialectValue = new FakeNode("div");
  dialectValue.className = "w-[100%]";
  const dialectEditor = new FakeNode("div");
  dialectEditor.className = "tiptap ProseMirror";
  dialectEditor.setAttribute("contenteditable", "true");
  dialectEditor.setAttribute("role", "textbox");
  dialectValue.appendChild(dialectEditor);
  dialectFieldBlock.appendChild(dialectLabel);
  dialectFieldBlock.appendChild(dialectValue);

  const mandarinFieldBlock = new FakeNode("div");
  mandarinFieldBlock.setAttribute("style", "padding-left: 10px;");
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
  fieldGroup.appendChild(nativeValidity);
  fieldGroup.appendChild(dialectFieldBlock);
  fieldGroup.appendChild(mandarinFieldBlock);
  asrLabelWrap.appendChild(fieldGroup);
  labelContent.appendChild(asrLabelWrap);
  globalPanel.appendChild(labelContent);

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
    dialectFieldBlock,
    bottomRight,
    document,
    fieldGroup,
    globalPanel,
    labelContent,
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

    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    assert.equal(panelNode.parentNode, harness.labelContent);
    assert.match(collectText(harness.nativeValidity), /是否有效（Valid or Not）/);
    assert.doesNotMatch(collectText(harness.nativeValidity), /未填写补 Valid/);
    assert.match(collectText(middleNode), /当前段 AI 推荐/);
    assert.match(collectText(middleNode), /未填写补 Valid/);
    assert.match(collectText(middleNode), /生成画段建议/);
    assert.match(collectText(middleNode), /应用当前建议/);
    assert.match(collectText(middleNode), /当前画段建议/);
    assert.match(collectText(middleNode), /特殊标签/);
    assert.doesNotMatch(collectText(middleNode), /设为 Valid/);
    assert.doesNotMatch(collectText(middleNode), /设为 Invalid/);
    assert.equal(middleNode.parentNode, harness.fieldGroup);
    assert.equal(harness.fieldGroup.children[1], middleNode);
    assert.notEqual(middleNode.parentNode, harness.mandarinFieldBlock);
    assert.notEqual(middleNode.parentNode, harness.dialectFieldBlock);
    assert.doesNotMatch(collectText(panelNode), /当前段 AI 推荐结果/);
    assert.doesNotMatch(collectText(panelNode), /建议 1/);

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
      currentSegmentNumber: 3,
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
    const summary = findNodeByClass(panelNode, "audio-url-summary");
    const text = collectText(summary);
    assert.match(collectText(panelNode), /当前音频地址/);
    assert.match(text, /文件/);
    assert.match(text, /sample\.mp3/);
    assert.match(text, /来源/);
    assert.match(text, /observer/);
    assert.match(text, /当前第 3 段/);
    assert.match(text, /当前段：\s*开始 18\.565 秒/);
    assert.match(text, /结束 35\.677 秒/);
    assert.match(text, /截取 17\.112 秒/);
    assert.doesNotMatch(text, /；/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel hides field recommendation areas when no AI result is available", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation(null);

    assert.doesNotMatch(collectText(harness.dialectFieldBlock), /当前还没有柳州话 AI 推荐结果/);
    assert.doesNotMatch(collectText(harness.mandarinFieldBlock), /当前还没有普通话 AI 推荐结果/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders split preview summary by changes, keeps heard dialect text in additional info, and shows only two final cards in fields", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;
  const applyTargets = [];

  try {
    const runtime = uiModule.createRuntime({
      onApplyRecommendationText: function (target) {
        applyTargets.push(target);
      },
    });
    runtime.mount();
    runtime.renderPreview({
      changes: [
        {
          sourceSegmentNumber: 4,
          originalStartMs: 95999,
          originalEndMs: 127250,
          reason: "silence>=400ms",
          suggestedSegments: [
            {
              startMs: 95999,
              endMs: 110100,
            },
            {
              startMs: 111800,
              endMs: 127250,
            },
          ],
        },
      ],
      meta: {
        rules: {
          silenceThresholdDbfs: -27,
          minSilenceMs: 400,
          contextPaddingMs: 100,
        },
      },
    });
    runtime.renderRecommendation({
      success: true,
      audioDialectText: "听音柳州话",
      refinedDialectText: "修正柳州话",
      refinedMandarinText: "整理普通话",
      audioMandarinText: "整理普通话",
      usage: {
        listen: {
          promptTokens: 10,
          completionTokens: 6,
          totalTokens: 16,
        },
        refine: {
          promptTokens: 4,
          completionTokens: 3,
          totalTokens: 7,
        },
      },
      specialTags: ["口语化"],
      needHumanReview: false,
      notes: ["人工确认"],
      timing: {
        totalMs: 1234,
      },
      models: {
        listenModel: "qwen3.5-omni-flash",
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const dialectText = collectText(harness.dialectFieldBlock);
    const mandarinText = collectText(harness.mandarinFieldBlock);
    const middleText = collectText(middleNode);
    assert.match(middleText, /静音 >= 0\.4s，阈值 -27 dB，前后补偿 0\.1s/);
    assert.match(middleText, /原第 4 段/);
    assert.match(middleText, /原时间：95\.999 秒 - 127\.25 秒/);
    assert.match(middleText, /将拆为 2 段/);
    assert.match(middleText, /子段 1：95\.999 秒 - 110\.1 秒/);
    assert.match(middleText, /子段 2：111\.8 秒 - 127\.25 秒/);
    assert.match(middleText, /口语化/);
    assert.match(middleText, /人工确认/);
    assert.match(middleText, /音频听出的柳州话文本/);
    assert.match(middleText, /听音柳州话/);
    assert.match(middleText, /AI 返回原始内容/);
    assert.match(middleText, /Token 用量/);
    assert.match(middleText, /总输入 14/);
    assert.match(middleText, /总输出 9/);
    assert.match(middleText, /总计 23/);
    assert.match(middleText, /listen：输入 10，输出 6，总计 16/);
    assert.match(middleText, /refine：输入 4，输出 3，总计 7/);
    assert.match(middleText, /"listenModel": "qwen3\.5-omni-flash"/);
    assert.doesNotMatch(middleText, /音频的柳州话文本/);
    assert.doesNotMatch(middleText, /修正后的柳州话文本/);
    assert.doesNotMatch(middleText, /整理后的普通话文本/);
    assert.doesNotMatch(collectText(panelNode), /听音柳州话/);
    assert.doesNotMatch(collectText(panelNode), /建议 1/);
    assert.match(dialectText, /修正后的柳州话文本/);
    assert.match(dialectText, /修正柳州话/);
    assert.match(mandarinText, /整理后的普通话文本/);
    assert.match(mandarinText, /整理普通话/);
    assert.doesNotMatch(dialectText, /音频的柳州话文本/);
    assert.doesNotMatch(mandarinText, /音频的普通话文本/);
    const dialectCard = findRecommendItemByTitle(harness.dialectFieldBlock, "修正后的柳州话文本");
    const textWrap = findNodeByClass(dialectCard, "recommend-item-body");
    const actionWrap = findNodeByClass(dialectCard, "recommend-item-action");
    assert.ok(textWrap);
    assert.ok(actionWrap);
    const metaDetails = findNodeByClass(middleNode, "meta-details");
    assert.ok(metaDetails);
    assert.equal(metaDetails.hasAttribute("open"), false);

    const refinedDialectCard = findRecommendItemByTitle(harness.dialectFieldBlock, "修正后的柳州话文本");
    const refinedMandarinCard = findRecommendItemByTitle(harness.mandarinFieldBlock, "整理后的普通话文本");
    findButtonByText(refinedDialectCard, "填入标注文本").dispatchEvent({ type: "click" });
    findButtonByText(refinedMandarinCard, "填入普通话顺滑").dispatchEvent({ type: "click" });

    assert.deepEqual(applyTargets, [
      "refinedDialectText",
      "refinedMandarinText",
    ]);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders empty split-preview state when no silence hit is found", function () {
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
      changes: [],
      meta: {
        rules: {
          silenceThresholdDbfs: -38,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /静音 >= 0\.4s，阈值 -38 dB，前后补偿 0\.1s/);
    assert.match(middleText, /当前音频没有命中可拆分静音，保持现有段不变/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders ratio threshold summary", function () {
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
      changes: [],
      meta: {
        rules: {
          silenceThresholdDbfs: -27,
          silenceThresholdUnit: "ratio",
          silenceThresholdValue: 4.47,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /静音 >= 0\.4s，阈值 4\.47%，约 -27 dB，前后补偿 0\.1s/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});
