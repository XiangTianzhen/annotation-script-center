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

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
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

  select() {
    return undefined;
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
    execCommand: function () {
      return true;
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
    assert.equal(harness.labelContent.children[0], panelNode);
    assert.match(collectText(harness.nativeValidity), /是否有效（Valid or Not）/);
    assert.doesNotMatch(collectText(harness.nativeValidity), /未填写补 Valid/);
    assert.match(collectText(middleNode), /柳州话 AI 识别助手/);
    assert.match(collectText(middleNode), /当前段识别/);
    assert.match(collectText(middleNode), /识别完成后自动填入/);
    assert.match(collectText(middleNode), /未填写补 Valid/);
    assert.match(collectText(middleNode), /生成分段建议/);
    assert.match(collectText(middleNode), /应用分段建议/);
    assert.match(collectText(middleNode), /生成后自动应用分段建议/);
    assert.match(collectText(middleNode), /分段建议/);
    assert.match(collectText(middleNode), /AI信息/);
    assert.match(collectText(middleNode), /特殊标签/);
    assert.doesNotMatch(collectText(middleNode), /设为 Valid/);
    assert.doesNotMatch(collectText(middleNode), /设为 Invalid/);
    assert.equal(middleNode.parentNode, harness.fieldGroup);
    assert.equal(harness.fieldGroup.children[1], middleNode);
    const autoApplyCheckbox = findNode(middleNode, function (node) {
      return node instanceof FakeNode && node.tagName === "INPUT" && node.type === "checkbox";
    });
    assert.ok(autoApplyCheckbox);
    assert.equal(autoApplyCheckbox.checked, true);
    assert.notEqual(middleNode.parentNode, harness.mandarinFieldBlock);
    assert.notEqual(middleNode.parentNode, harness.dialectFieldBlock);
    assert.doesNotMatch(collectText(panelNode), /当前段 AI 推荐结果/);
    assert.doesNotMatch(collectText(panelNode), /建议 1/);

    assert.equal(harness.bottomRight.children[0], harness.nativeSplitButton);
    assert.equal(harness.bottomRight.children[1], harness.nativeMergeButton);
    assert.doesNotMatch(collectText(harness.bottomRight), /生成分段建议/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel triggers recommendation auto-fill toggle callback and exposes setter", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const toggleCalls = [];
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({
      aiRecommendAutoFillEnabled: true,
      onToggleAiRecommendAutoFill: function (enabled) {
        toggleCalls.push(enabled);
      },
    });
    runtime.mount();

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const toggleRow = findNode(middleNode, function (node) {
      return node instanceof FakeNode && collectText(node).indexOf("识别完成后自动填入") >= 0;
    });
    const checkbox = findNode(toggleRow, function (node) {
      return node instanceof FakeNode && node.tagName === "INPUT" && node.type === "checkbox";
    });
    assert.ok(checkbox);
    assert.equal(checkbox.checked, true);

    checkbox.checked = false;
    checkbox.dispatchEvent({ type: "change" });
    assert.deepEqual(toggleCalls, [false]);

    runtime.setAiRecommendAutoFillEnabled(true);
    assert.equal(checkbox.checked, true);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders a refresh action next to status when requested", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  let clicked = 0;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.setStatus("当前段 AI 推荐失败：当前音频访问已失效，通常是页面 session 已过期；请刷新页面后重试。", "error", {
      action: {
        label: "刷新页面",
        onClick: function () {
          clicked += 1;
        },
      },
    });

    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const refreshButton = findButtonByText(panelNode, "刷新页面");
    assert.ok(refreshButton);
    assert.equal(refreshButton.style.display, "inline-flex");
    assert.match(collectText(panelNode), /当前音频访问已失效/);

    refreshButton.dispatchEvent({ type: "click" });
    assert.equal(clicked, 1);

    runtime.setStatus("普通提示", "");
    assert.equal(refreshButton.style.display, "none");
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

test("CVPC ui panel keeps additional info visible for failed recommendations with raw debug payload", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: false,
      message: "模型输出 JSON 解析失败，可查看原始 AI 返回。",
      debugRawJson: {
        rawResponseText: "{\"audioDialectText\":\"原始返回\"}",
      },
      rawResponse: {
        rawText: "{\"audioDialectText\":\"原始返回\"}",
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /AI信息/);
    assert.match(middleText, /AI 返回原始内容/);
    assert.match(middleText, /rawResponseText/);
    assert.match(middleText, /原始返回/);
    assert.doesNotMatch(collectText(harness.dialectFieldBlock), /修正后的柳州话文本/);
    assert.doesNotMatch(collectText(harness.mandarinFieldBlock), /整理后的普通话文本/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel keeps empty additional info rows when recommendation fields are missing", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: false,
      message: "仅返回错误消息",
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const metaDetails = findNodeByClass(middleNode, "meta-details");
    const metaBoxes = metaDetails ? metaDetails.querySelectorAll(".meta-box") : [];
    const middleText = collectText(middleNode);
    assert.ok(metaDetails);
    assert.ok(metaBoxes.length >= 6);
    assert.match(middleText, /音频听出的柳州话文本/);
    assert.match(middleText, /听音识别/);
    assert.match(middleText, /文本修正/);
    assert.match(middleText, /特殊标签/);
    assert.match(middleText, /需人工复核/);
    assert.match(middleText, /备注/);
    assert.match(middleText, /AI 返回原始内容/);
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
          contextPaddingMs: 200,
        },
      },
    });
    runtime.renderRecommendation({
      success: true,
      audioDialectText: "听音#eh柳州话",
      audioDialectTokens: [
        { type: "text", content: "听音" },
        { type: "tag", content: "#eh" },
        { type: "text", content: "柳州话" },
      ],
      refinedDialectText: "修正#ah柳州话",
      refinedDialectTokens: [
        { type: "text", content: "修正" },
        { type: "tag", content: "#ah" },
        { type: "text", content: "柳州话" },
      ],
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
      candidateAlternatives: [
        {
          dialectText: "听音#eh柳州话",
          mandarinText: "听音普通话",
          reason: "原始听音",
        },
        {
          dialectText: "近音柳州话",
          mandarinText: "近音普通话",
          reason: "近音候选",
        },
      ],
      specialTags: ["口语化"],
      needHumanReview: false,
      notes: ["人工确认"],
      timing: {
        totalMs: 1234,
      },
      models: {
        listenModel: "qwen3.5-omni-flash",
        refineModel: "qwen3.5-plus",
      },
      cost: {
        listen: {
          pricingStatus: "estimated",
          inputPriceLabel: "文本/图片/视频 2.2 元/百万Token；音频 18 元/百万Token",
          outputPriceLabel: "文本 13.3 元/百万Token",
          estimatedCostCny: 0.008935,
        },
        refine: {
          pricingStatus: "estimated",
          inputPriceLabel: "0<Token≤128K：0.8 元/百万Token",
          outputPriceLabel: "0<Token≤128K：4.8 元/百万Token",
          estimatedCostCny: 0.000017,
        },
        totalEstimatedCostCny: 0.008952,
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const panelNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-panel");
    const dialectText = collectText(harness.dialectFieldBlock);
    const mandarinText = collectText(harness.mandarinFieldBlock);
    const middleText = collectText(middleNode);
    assert.match(middleText, /静音 >= 0\.4s，阈值 -27 dB，前后补偿 0\.2s/);
    assert.match(middleText, /原第 4 段/);
    assert.match(middleText, /原时间：95\.999 秒 - 127\.25 秒/);
    assert.match(middleText, /将拆为 2 段/);
    assert.match(middleText, /子段 1：95\.999 秒 - 110\.1 秒/);
    assert.match(middleText, /子段 2：111\.8 秒 - 127\.25 秒/);
    assert.match(middleText, /口语化/);
    assert.match(middleText, /人工确认/);
    assert.match(middleText, /音频听出的柳州话文本/);
    assert.match(middleText, /听音/);
    assert.match(middleText, /#eh/);
    assert.match(middleText, /柳州话/);
    assert.match(middleText, /AI 返回原始内容/);
    assert.match(middleText, /AI信息/);
    assert.match(middleText, /听音识别/);
    assert.match(middleText, /文本修正/);
    assert.match(middleText, /近音候选参考/);
    assert.match(middleText, /听音#eh柳州话/);
    assert.match(middleText, /听音普通话/);
    assert.match(middleText, /原始听音/);
    assert.match(middleText, /近音柳州话/);
    assert.match(middleText, /近音普通话/);
    assert.match(middleText, /模型：qwen3\.5-omni-flash/);
    assert.match(middleText, /模型：qwen3\.5-plus/);
    assert.match(middleText, /输入：10/);
    assert.match(middleText, /输出：6/);
    assert.match(middleText, /输入：4/);
    assert.match(middleText, /输出：3/);
    assert.match(middleText, /输入单价：文本\/图片\/视频 2\.2 元\/百万Token；音频 18 元\/百万Token/);
    assert.match(middleText, /输出单价：文本 13\.3 元\/百万Token/);
    assert.match(middleText, /预估人民币：0\.008935 元/);
    assert.match(middleText, /输入单价：0<Token≤128K：0\.8 元\/百万Token/);
    assert.match(middleText, /输出单价：0<Token≤128K：4\.8 元\/百万Token/);
    assert.match(middleText, /预估人民币：0\.000017 元/);
    assert.match(middleText, /总预估人民币：0\.008952 元/);
    assert.match(middleText, /"audioDialectText": "听音#eh柳州话"/);
    assert.match(middleText, /"timing":/);
    assert.doesNotMatch(middleText, /总输入/);
    assert.doesNotMatch(middleText, /总输出/);
    assert.doesNotMatch(middleText, /总计/);
    assert.doesNotMatch(middleText, /音频的柳州话文本/);
    assert.doesNotMatch(middleText, /修正后的柳州话文本/);
    assert.doesNotMatch(middleText, /整理后的普通话文本/);
    assert.doesNotMatch(collectText(panelNode), /听音#eh柳州话/);
    assert.doesNotMatch(collectText(panelNode), /建议 1/);
    assert.doesNotMatch(dialectText, /近音普通话/);
    assert.doesNotMatch(dialectText, /原始听音/);
    assert.doesNotMatch(mandarinText, /近音普通话/);
    assert.match(dialectText, /修正后的柳州话文本/);
    assert.match(dialectText, /修正/);
    assert.match(dialectText, /#ah/);
    assert.match(dialectText, /柳州话/);
    assert.match(mandarinText, /整理后的普通话文本/);
    assert.match(mandarinText, /整理普通话/);
    assert.doesNotMatch(dialectText, /音频的柳州话文本/);
    assert.doesNotMatch(mandarinText, /音频的普通话文本/);
    const dialectCard = findRecommendItemByTitle(harness.dialectFieldBlock, "修正后的柳州话文本");
    const textWrap = findNodeByClass(dialectCard, "recommend-item-body");
    const actionWrap = findNodeByClass(dialectCard, "recommend-item-action");
    assert.ok(textWrap);
    assert.ok(actionWrap);
    assert.equal(dialectCard.querySelectorAll(".asc-tag-chip").length, 1);
    assert.equal(middleNode.querySelectorAll(".asc-tag-chip").length >= 2, true);
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

test("CVPC ui panel copies AI raw response with required prefix", async function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  let copiedText = "";
  harness.document.execCommand = function (command) {
    if (command !== "copy") {
      return false;
    }
    const textarea = harness.body.querySelector("textarea");
    copiedText = String(textarea?.value || "");
    return true;
  };
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: true,
      refinedDialectText: "修正柳州话",
      refinedMandarinText: "整理普通话",
      debugRawJson: {
        audioDialectText: "原始听音",
        note: "raw note",
      },
      usage: {
        listen: {
          promptTokens: 1,
          completionTokens: 1,
        },
        refine: {
          promptTokens: 1,
          completionTokens: 1,
        },
      },
      models: {
        listenModel: "qwen3.5-omni-flash",
        refineModel: "qwen3.5-plus",
      },
      cost: {
        listen: {
          inputPriceLabel: "文本/图片/视频 2.2 元/百万Token；音频 18 元/百万Token",
          outputPriceLabel: "文本 13.3 元/百万Token",
          estimatedCostCny: 0.000001,
          pricingStatus: "estimated",
        },
        refine: {
          inputPriceLabel: "0<Token≤128K：0.8 元/百万Token",
          outputPriceLabel: "0<Token≤128K：4.8 元/百万Token",
          estimatedCostCny: 0.000001,
          pricingStatus: "estimated",
        },
        totalEstimatedCostCny: 0.000002,
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const copyButton = findButtonByText(middleNode, "复制原始返回");
    assert.ok(copyButton);

    copyButton.dispatchEvent({ type: "click" });
    await Promise.resolve();

    assert.equal(
      copiedText,
      "AI返回原始内容为：" +
        JSON.stringify(
          {
            audioDialectText: "原始听音",
            note: "raw note",
          },
          null,
          2
        )
    );
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel shows 没有数据源 when pricing config is unavailable", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: true,
      refinedDialectText: "修正柳州话",
      refinedMandarinText: "整理普通话",
      usage: {
        listen: {
          promptTokens: 10,
          completionTokens: 6,
        },
        refine: {
          promptTokens: 4,
          completionTokens: 3,
        },
      },
      models: {
        listenModel: "qwen-max",
        refineModel: "qwen-plus",
      },
      cost: {
        listen: {
          pricingStatus: "missing_source",
          reason: "没有数据源",
          inputPriceLabel: "",
          outputPriceLabel: "",
          estimatedCostCny: null,
        },
        refine: {
          pricingStatus: "missing_source",
          reason: "没有数据源",
          inputPriceLabel: "",
          outputPriceLabel: "",
          estimatedCostCny: null,
        },
        totalEstimatedCostCny: null,
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /输入单价：没有数据源/);
    assert.match(middleText, /输出单价：没有数据源/);
    assert.match(middleText, /预估人民币：没有数据源/);
    assert.match(middleText, /总预估人民币：没有数据源/);
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
      analysisMeta: {
        frameCount: 80,
        rawSilentRangeCount: 0,
        silentRangeCount: 0,
      },
      meta: {
        rules: {
          silenceThresholdDbfs: -38,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /分段建议/);
    assert.match(middleText, /静音 >= 0\.4s，阈值 -38 dB，前后补偿 0\.2s/);
    assert.match(middleText, /当前音频没有命中可拆分静音，保持现有段不变/);
    assert.match(middleText, /本地静音检测未找到满足条件的连续静音/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel explains when local silence candidates exist but still do not produce a split", function () {
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
      analysisMeta: {
        frameCount: 120,
        rawSilentRangeCount: 3,
        silentRangeCount: 1,
      },
      meta: {
        rules: {
          silenceThresholdDbfs: -27,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /本地静音检测已找到 1 段满足条件的候选静音/);
    assert.match(middleText, /已自动合并短尖峰打断/);
    assert.match(middleText, /当前没有命中现有段内部/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel explains insufficient split when silence hits but still cannot form two child segments", function () {
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
      analysisMeta: {
        frameCount: 120,
        rawSilentRangeCount: 2,
        silentRangeCount: 2,
      },
      meta: {
        emptyReason: "insufficient-split",
        rules: {
          silenceThresholdDbfs: -27,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /本地静音检测已找到 2 段满足条件的候选静音/);
    assert.match(middleText, /命中了静音，但拆分后仍不足 2 段/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders whole-audio fallback preview with direct-save summary", function () {
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
      sourceSegments: [
        { startMs: 0, endMs: 4171 },
        { startMs: 18565, endMs: 35677 },
        { startMs: 60304, endMs: 82112 },
        { startMs: 98775, endMs: 129980 },
        { startMs: 140112, endMs: 179543 },
        { startMs: 198104, endMs: 213031 },
      ],
      proposedSegments: [
        { startMs: 0, endMs: 4171 },
        { startMs: 18565, endMs: 35677 },
      ],
      analysisMeta: {
        frameCount: 120,
        rawSilentRangeCount: 30,
        silentRangeCount: 26,
      },
      meta: {
        previewMode: "whole-audio-fallback",
        applyAllowed: false,
        analysisSource: "backend-python-audio-url",
        rules: {
          silenceThresholdDbfs: -27,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /后端已直接生成整条音频重切预览/);
    assert.match(middleText, /点击“应用分段建议”会先尝试直写平台保存接口/);
    assert.match(middleText, /原现有段数：6 段/);
    assert.match(middleText, /fallback 建议段数：2 段/);
    assert.match(middleText, /后端静音检测命中 26 段候选静音/);
    assert.match(middleText, /原始候选 30 段，已自动合并短尖峰打断/);
    assert.match(middleText, /建议段 1/);
    assert.match(middleText, /0 秒 - 4\.171 秒/);
    assert.match(middleText, /建议段 2/);
    assert.match(middleText, /18\.565 秒 - 35\.677 秒/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel renders backend whole-audio preview without source segment count", function () {
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
      proposedSegments: [
        { startMs: 0, endMs: 4171 },
        { startMs: 17554, endMs: 35221 },
      ],
      analysisMeta: {
        frameCount: 120,
        rawSilentRangeCount: 30,
        silentRangeCount: 26,
      },
      meta: {
        previewMode: "whole-audio-fallback",
        applyAllowed: false,
        analysisSource: "backend-python-audio-url",
        rules: {
          silenceThresholdDbfs: -40,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /后端整音频重切预览/);
    assert.match(
      middleText,
      /点击“应用分段建议”会先尝试直写平台保存接口；当前整音频预览直写失败时不会回退页面内分段/
    );
    assert.match(middleText, /当前模式：后端整音频分段/);
    assert.match(middleText, /建议段数：2 段/);
    assert.match(middleText, /静音 >= 0\.4s，阈值 -40 dB，前后补偿 0\.2s/);
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
    assert.match(middleText, /静音 >= 0\.4s，阈值 4\.47%，约 -27 dB，前后补偿 0\.2s/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel mounts batch controls and renders batch progress details", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const batchSelections = [];
  const stopSignals = [];
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({
      onBatchRecommend: function (selectionSpec) {
        batchSelections.push(selectionSpec);
      },
      onBatchStop: function () {
        stopSignals.push("stop");
      },
    });
    runtime.mount();
    runtime.renderBatchSelection({
      totalSegments: 7,
      resetSelection: true,
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    assert.match(collectText(middleNode), /批量识别并填入/);
    assert.match(collectText(middleNode), /停止批量/);
    assert.match(collectText(middleNode), /默认处理当前音频全部段/);
    assert.match(collectText(middleNode), /当前选择：全部段/);
    assert.ok(findButtonByText(middleNode, "全部"));
    assert.ok(findButtonByText(middleNode, "7"));

    const batchStartButton = findButtonByText(middleNode, "批量识别并填入");
    assert.equal(batchStartButton.getAttribute("data-accent"), "true");
    assert.equal(batchStartButton.hasAttribute("data-primary"), false);

    findButtonByText(middleNode, "1").dispatchEvent({ type: "mousedown" });
    findButtonByText(middleNode, "5").dispatchEvent({ type: "mousedown" });
    findButtonByText(middleNode, "6").dispatchEvent({ type: "mousedown" });
    batchStartButton.dispatchEvent({ type: "click" });
    findButtonByText(middleNode, "停止批量").dispatchEvent({ type: "click" });

    assert.deepEqual(batchSelections, ["2-4,7"]);
    assert.deepEqual(stopSignals, ["stop"]);

    runtime.renderBatchState({
      running: true,
      phaseText: "批量识别进行中",
      selectionSpec: "2-4,7",
      concurrency: 5,
      totalCount: 4,
      launchedCount: 3,
      activeAiCount: 2,
      succeededCount: 1,
      failedCount: 1,
      currentSegmentNumber: 4,
      failures: [
        {
          segmentNumber: 7,
          message: "请求失败",
        },
      ],
    });

    const batchText = collectText(middleNode);
    assert.match(batchText, /批量识别状态/);
    assert.match(batchText, /范围：2-4,7/);
    assert.match(batchText, /并发：5/);
    assert.match(batchText, /总数：4/);
    assert.match(batchText, /已发起：3/);
    assert.match(batchText, /进行中：2/);
    assert.match(batchText, /已成功：1/);
    assert.match(batchText, /已失败：1/);
    assert.match(batchText, /当前段：第 4 段/);
    assert.match(batchText, /失败清单/);
    assert.match(batchText, /第 7 段：\s*请求失败/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel batch selector supports drag selection updates", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const batchSelections = [];
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({
      onBatchRecommend: function (selectionSpec) {
        batchSelections.push(selectionSpec);
      },
    });
    runtime.mount();
    runtime.renderBatchSelection({
      totalSegments: 5,
      resetSelection: true,
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    findButtonByText(middleNode, "2").dispatchEvent({ type: "mousedown" });
    findButtonByText(middleNode, "3").dispatchEvent({ type: "mouseenter" });
    findButtonByText(middleNode, "4").dispatchEvent({ type: "mouseenter" });
    findButtonByText(middleNode, "批量识别并填入").dispatchEvent({ type: "click" });

    assert.deepEqual(batchSelections, ["1,5"]);
    assert.match(collectText(middleNode), /当前选择：1,5/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel shows fallback dialect and mandarin references inside AI info for failed recommendations", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: false,
      refinedDialectText: "fallback dialect",
      refinedMandarinText: "fallback mandarin",
      debugRawJson: {
        rawResponseText: "{\"audioDialectText\":\"raw fallback\"}",
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /fallback dialect/);
    assert.match(middleText, /fallback mandarin/);
    assert.match(middleText, /raw fallback/);
    assert.doesNotMatch(collectText(harness.dialectFieldBlock), /修正后的柳州话文本/);
    assert.doesNotMatch(collectText(harness.mandarinFieldBlock), /整理后的普通话文本/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("CVPC ui panel keeps smooth mandarin reference visible inside AI info for successful recommendations", function () {
  const uiModule = loadUiPanelModule();
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const runtime = uiModule.createRuntime({});
    runtime.mount();
    runtime.renderRecommendation({
      success: true,
      audioDialectText: "heard dialect",
      refinedDialectText: "refined dialect",
      refinedMandarinText: "smooth mandarin",
      models: {
        listenModel: "qwen3.5-omni-flash",
        refineModel: "qwen3.5-plus",
      },
      usage: {
        listen: {
          promptTokens: 1,
          completionTokens: 2,
          totalTokens: 3,
        },
        refine: {
          promptTokens: 4,
          completionTokens: 5,
          totalTokens: 9,
        },
      },
    });

    const middleNode = findAttrNode(harness.globalPanel, "data-asc-cvpc-liuzhou-middle-ai");
    const middleText = collectText(middleNode);
    assert.match(middleText, /smooth mandarin/);
    assert.match(middleText, /refined dialect/);
    assert.match(middleText, /模型：qwen3\.5-omni-flash/);
    assert.match(middleText, /模型：qwen3\.5-plus/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});
