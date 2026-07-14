"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo("extension", "sites", "bytedance-aidp", "taizhou-helper", "ui-panel.js");

function loadUiPanelModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouUiPanel;
  require(modulePath);
  return globalThis.ASREdgeBytedanceAidpTaizhouUiPanel;
}

class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.className = "";
    this.eventListeners = {};
    this.isConnected = false;
    this._textContent = "";
    this._innerHTML = "";
    this.type = "";
    this.id = "";
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
    const key = String(name);
    const text = String(value);
    this.attributes[key] = text;
    if (key === "class") {
      this.className = text;
    }
    if (key === "id") {
      this.id = text;
    }
  }

  getAttribute(name) {
    const key = String(name);
    if (key === "class") {
      return this.className || "";
    }
    if (key === "id") {
      return this.id || "";
    }
    return this.attributes[key] || "";
  }

  removeAttribute(name) {
    const key = String(name);
    delete this.attributes[key];
    if (key === "class") {
      this.className = "";
    }
    if (key === "id") {
      this.id = "";
    }
  }

  addEventListener(type, listener) {
    const key = String(type || "");
    const existing = this.eventListeners[key];
    if (typeof existing === "function" && Array.isArray(existing._handlers)) {
      existing._handlers.push(listener);
      return;
    }
    const handlers = [listener];
    const dispatcher = (event) => {
      handlers.slice().forEach((handler) => {
        if (typeof handler === "function") {
          handler.call(this, event);
        }
      });
    };
    dispatcher._handlers = handlers;
    this.eventListeners[key] = dispatcher;
  }

  click() {
    const listener = this.eventListeners.click;
    if (typeof listener === "function") {
      listener.call(this, {
        type: "click",
        bubbles: true,
        target: this,
        stopPropagation() {},
      });
    }
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return collectDescendants(this).filter(function (node) {
      return matchesSelector(node, selector);
    });
  }

  get nextSibling() {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.children.indexOf(this);
    return index >= 0 ? this.parentNode.children[index + 1] || null : null;
  }

  get textContent() {
    return [this._textContent || "", this.children.map((child) => child.textContent || "").join(" ")]
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

function matchesSelector(node, selector) {
  return String(selector || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .some(function (item) {
      if (item === ".neeko-wavesurfer-warper.neeko-wavesurfer") {
        return ["neeko-wavesurfer-warper", "neeko-wavesurfer"].every(function (className) {
          return String(node.className || "")
            .split(/\s+/)
            .filter(Boolean)
            .includes(className);
        });
      }
      if (item === "div" || item === "section" || item === "article") {
        return node.tagName === item.toUpperCase();
      }
      if (/^\.[\w-]+$/.test(item)) {
        return String(node.className || "")
          .split(/\s+/)
          .filter(Boolean)
          .includes(item.slice(1));
      }
      if (/^\[[^=\]]+=['"][^'"]+['"]\]$/.test(item)) {
        const match = item.match(/^\[([^=\]]+)=['"](.+)['"]\]$/);
        return String(node.getAttribute(match[1]) || "") === match[2];
      }
      return false;
    });
}

function createHarness() {
  const body = new FakeNode("body");
  const head = new FakeNode("head");
  const waveAnchor = new FakeNode("div");
  waveAnchor.className = "neeko-wavesurfer-warper neeko-wavesurfer";
  body.appendChild(waveAnchor);

  const documentListeners = {};
  const document = {
    body,
    head,
    documentElement: body,
    createElement(tagName) {
      return new FakeNode(tagName);
    },
    getElementById(id) {
      return [head, body].flatMap(collectDescendants).find(function (node) {
        return node.id === id;
      }) || null;
    },
    querySelector(selector) {
      if (selector === "body") {
        return body;
      }
      return body.querySelector(selector);
    },
    querySelectorAll(selector) {
      if (selector === "body *") {
        return collectDescendants(body);
      }
      return body.querySelectorAll(selector);
    },
    addEventListener(type, listener) {
      documentListeners[String(type || "")] = listener;
    },
    dispatch(type, event) {
      const listener = documentListeners[String(type || "")];
      if (typeof listener === "function") {
        listener.call(this, event || { type });
      }
    },
  };

  return {
    body,
    head,
    waveAnchor,
    document,
  };
}

function findNode(root, predicate) {
  return collectDescendants(root).find(predicate) || null;
}

function findMountedPanelRoot(root) {
  return findNode(root, function (node) {
    return Object.prototype.hasOwnProperty.call(node.attributes || {}, "data-asc-bytedance-aidp-taizhou-panel");
  });
}

test("AIDP taizhou ui panel keeps current-audio and AI sections collapsed by default and supports shared toggles", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    assert.ok(panelRoot);

    const collapseButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("展开当前音频信息");
    });
    const aiCollapseButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("展开AI信息");
    });
    const allButtons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON";
    });
    const summaryCard = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("summary-card");
    });
    const aiInfoCard = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("info-card");
    });
    const tooltipButton = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("tooltip-dot");
    });
    const tooltipAnchor = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("tooltip-anchor");
    });

    assert.ok(collapseButton);
    assert.ok(aiCollapseButton);
    assert.ok(summaryCard);
    assert.ok(aiInfoCard);
    assert.ok(tooltipButton);
    assert.ok(tooltipAnchor);
    assert.equal(allButtons.filter(function (node) {
      return /当前音频信息/.test(node.textContent);
    }).length, 1);
    assert.equal(collapseButton.className, "collapse-toggle");
    assert.equal(aiCollapseButton.className, "collapse-toggle");
    assert.equal(summaryCard.style.display, "none");
    assert.equal(aiInfoCard.style.display, "none");
    assert.equal(tooltipButton.textContent, "?");
    assert.equal(tooltipButton.getAttribute("data-icon"), "");

    tooltipAnchor.eventListeners.mouseenter({ type: "mouseenter", target: tooltipAnchor });
    assert.equal(tooltipAnchor.getAttribute("data-hover"), "true");
    tooltipAnchor.eventListeners.mouseleave({ type: "mouseleave", target: tooltipAnchor });
    assert.equal(tooltipAnchor.getAttribute("data-hover"), "");
    tooltipButton.click();
    assert.equal(tooltipAnchor.getAttribute("data-open"), "true");
    harness.document.dispatch("click", { type: "click", target: harness.body });
    assert.equal(tooltipAnchor.getAttribute("data-open"), "");

    runtime.renderAudioContext({
      entryId: "7656690377962016562",
      templateID: "7628929157338042146",
      audioDurationMs: 22012,
      currentSegments: [{}, {}],
      audioUrl: "https://example.test/audio.m4a",
    });

    collapseButton.click();
    assert.notEqual(summaryCard.style.display, "none");
    assert.match(collapseButton.textContent, /折叠当前音频信息/);
    assert.match(summaryCard.textContent, /7656690377962016562/);
    assert.match(summaryCard.textContent, /7628929157338042146/);
    assert.match(summaryCard.textContent, /https:\/\/example\.test\/audio\.m4a/);

    aiCollapseButton.click();
    assert.notEqual(aiInfoCard.style.display, "none");
    assert.match(aiCollapseButton.textContent, /折叠AI信息/);
    runtime.setStatus("已就绪", "success");
    const statusNode = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("status");
    });
    assert.ok(statusNode);
    assert.equal(statusNode.getAttribute("data-tone"), "success");

    collapseButton.click();
    assert.equal(summaryCard.style.display, "none");
    assert.match(collapseButton.textContent, /展开当前音频信息/);

    runtime.renderAudioContext({
      entryId: "44696080",
      templateID: "template-updated",
      audioDurationMs: 15000,
      currentSegments: [{}],
      audioUrl: "https://example.test/updated.m4a",
    });

    collapseButton.click();
    assert.notEqual(summaryCard.style.display, "none");
    assert.match(summaryCard.textContent, /44696080/);
    assert.match(summaryCard.textContent, /template-updated/);
    assert.match(summaryCard.textContent, /updated\.m4a/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel exposes visibility methods without rendering an external toggle button", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const toggleButton = findNode(harness.body, function (node) {
      return (
        node.tagName === "BUTTON" &&
        node.getAttribute("data-taizhou-panel-visibility-toggle") === "true"
      );
    });
    const panelRoot = findMountedPanelRoot(harness.body);

    assert.ok(panelRoot);
    assert.equal(toggleButton, null);
    assert.equal(typeof runtime.isPanelHidden, "function");
    assert.equal(typeof runtime.setPanelHidden, "function");
    assert.equal(runtime.isPanelHidden(), false);
    assert.notEqual(panelRoot.style.display, "none");

    runtime.setPanelHidden(true);
    assert.equal(runtime.isPanelHidden(), true);
    assert.equal(panelRoot.style.display, "none");

    runtime.setPanelHidden(false);
    assert.equal(runtime.isPanelHidden(), false);
    assert.notEqual(panelRoot.style.display, "none");
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel switches preview buttons from settings-only auto-apply state", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({
      segmentPreviewAutoApplyEnabled: true,
    });
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    const allButtons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON";
    });
    const previewCollapseButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("展开分段建议");
    });
    const previewList = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("preview-list");
    });

    assert.ok(previewCollapseButton);
    assert.ok(previewList);
    assert.equal(previewList.style.display, "none");
    assert.equal(
      allButtons.some(function (node) {
        return node.textContent.includes("生成分段并应用");
      }),
      true
    );
    assert.equal(
      allButtons.some(function (node) {
        return node.textContent.includes("应用分段建议");
      }),
      false
    );

    runtime.setSegmentPreviewAutoApplyEnabled(false);
    const updatedButtons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON";
    });
    assert.equal(
      updatedButtons.some(function (node) {
        return node.textContent.includes("生成分段并应用");
      }),
      false
    );
    assert.equal(
      updatedButtons.some(function (node) {
        return node.textContent.includes("生成分段建议");
      }),
      true
    );
    assert.equal(
      updatedButtons.some(function (node) {
        return node.textContent.includes("应用分段建议");
      }),
      true
    );

    previewCollapseButton.click();
    assert.notEqual(previewList.style.display, "none");
    assert.match(previewCollapseButton.textContent, /折叠分段建议/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel renders Mandarin transcript wording and AI return copy action", async function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousNavigator = globalThis.navigator;
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let copiedText = "";
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async function (text) {
          copiedText = String(text || "");
        },
      },
    },
  });

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    runtime.renderCurrentRecommendation({
      segmentNumber: 2,
      listenText: "阿拉等会去吃饭。",
      finalMandarinText: "我们等会去吃饭。",
    });
    runtime.renderAiMeta({
      models: {
        omniModel: "qwen3.5-omni-plus",
      },
      usage: {
        omni: {
          input_tokens: 11,
          output_tokens: 22,
          total_tokens: 33,
        },
      },
      cost: {
        omni: {
          estimatedCostCny: 0.001,
        },
      },
      raw: {
        omni: "{\"listenText\":\"阿拉等会去吃饭。\",\"finalMandarinText\":\"我们等会去吃饭。\"}",
      },
      debug: {
        reason: "unit-test",
      },
    });

    assert.match(panelRoot.textContent, /最终普通话翻译/);
    assert.match(panelRoot.textContent, /原始听音/);
    assert.match(panelRoot.textContent, /第 2 段/);
    assert.match(panelRoot.textContent, /全模态模型/);
    assert.match(panelRoot.textContent, /全模态输入Token/);
    assert.match(panelRoot.textContent, /全模态预估人民币/);
    assert.match(panelRoot.textContent, /AI返回内容/);
    assert.match(panelRoot.textContent, /复制内容/);
    assert.match(panelRoot.textContent, /"raw":/);
    assert.match(panelRoot.textContent, /"omni":/);
    assert.match(panelRoot.textContent, /unit-test/);
    const copyButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("复制内容");
    });
    assert.ok(copyButton);
    copyButton.click();
    await Promise.resolve();
    assert.match(copiedText, /"raw":/);
    assert.match(copiedText, /"reason": "unit-test"/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
    if (navigatorDescriptor) {
      Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    } else if (previousNavigator === undefined) {
      delete globalThis.navigator;
    } else {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: previousNavigator,
      });
    }
  }
});

test("AIDP taizhou ui panel shows review warning tags and force-fill action for blocked current recommendation", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;
  const forceFillCalls = [];

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({
      onForceFillCurrent() {
        forceFillCalls.push("force-fill");
      },
    });
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    runtime.renderCurrentRecommendation({
      segmentNumber: 5,
      listenText: "这一段像在唱歌。",
      finalMandarinText: "这一段像在唱歌，但是还能听出歌词。",
      isSinging: true,
      isNonTaizhouDialect: true,
      blockAutoFill: true,
    });
    runtime.renderAiMeta({
      debug: {
        reason: "blocked",
      },
    });

    assert.match(panelRoot.textContent, /唱歌/);
    assert.match(panelRoot.textContent, /非台州话/);
    assert.match(panelRoot.textContent, /默认不自动填入/);

    const forceFillButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("强制填入当前段");
    });
    assert.ok(forceFillButton);
    forceFillButton.click();
    assert.deepEqual(forceFillCalls, ["force-fill"]);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel removes current-segment section and keeps preview-batch above audio-meta", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    const panelText = panelRoot.textContent;
    const buttons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON";
    });

    assert.doesNotMatch(panelText, /当前段识别/);
    assert.doesNotMatch(panelText, /写回当前段/);
    assert.equal(
      buttons.some(function (node) {
        return node.textContent.includes("当前段识别");
      }),
      false
    );

    assert.match(panelText, /分段建议/);
    assert.match(panelText, /批量识别/);
    assert.match(panelText, /当前音频信息/);
    assert.match(panelText, /AI信息/);

    assert.ok(panelText.indexOf("分段建议") < panelText.indexOf("当前音频信息"));
    assert.ok(panelText.indexOf("批量识别") < panelText.indexOf("当前音频信息"));
    assert.ok(panelText.indexOf("当前音频信息") < panelText.indexOf("AI信息"));
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel toggles batch selection with a normal click without reverting on the trailing click event", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    runtime.renderBatchSelection({
      totalSegments: 3,
      resetSelection: true,
    });

    const batchButtonTwo = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-segment-number") === "2";
    });
    const batchAllButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-all") === "true";
    });

    assert.ok(batchButtonTwo);
    assert.ok(batchAllButton);
    assert.equal(panelRoot.textContent.includes("当前选择："), false);

    batchButtonTwo.eventListeners.mousedown({ type: "mousedown", bubbles: true });
    batchButtonTwo.click();

    assert.equal(batchButtonTwo.getAttribute("data-selected"), "false");
    assert.equal(batchAllButton.getAttribute("data-selected"), "false");
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel uses a single batch primary button that follows auto-fill and running states", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({
      aiRecommendAutoFillEnabled: true,
    });
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    runtime.renderBatchSelection({
      totalSegments: 4,
      resetSelection: true,
    });

    let primaryButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-primary-action") === "true";
    });
    assert.ok(primaryButton);
    assert.equal(primaryButton.textContent, "批量识别并填入");
    assert.equal(panelRoot.textContent.includes("当前没有批量任务。"), false);

    runtime.renderBatchState({
      isRunning: true,
      phaseText: "批量识别进行中",
      totalCount: 4,
      concurrency: 5,
      succeededCount: 1,
      failedCount: 0,
      skippedCount: 0,
    });
    primaryButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-primary-action") === "true";
    });
    assert.ok(primaryButton);
    assert.equal(primaryButton.textContent, "停止批量");

    runtime.setAiRecommendAutoFillEnabled(false);
    runtime.renderBatchState({
      isRunning: false,
      hasPendingFill: false,
      phaseText: "",
      totalCount: 4,
      concurrency: 5,
      succeededCount: 0,
      failedCount: 0,
      skippedCount: 0,
    });
    primaryButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-primary-action") === "true";
    });
    assert.ok(primaryButton);
    assert.equal(primaryButton.textContent, "批量识别");

    runtime.renderBatchState({
      isRunning: false,
      hasPendingFill: true,
      phaseText: "",
      totalCount: 4,
      concurrency: 5,
      succeededCount: 3,
      failedCount: 0,
      skippedCount: 1,
      reviewCount: 1,
    });
    primaryButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-primary-action") === "true";
    });
    assert.ok(primaryButton);
    assert.equal(primaryButton.textContent, "强制填入");
    assert.match(panelRoot.textContent, /待复核 1/);
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});

test("AIDP taizhou ui panel renders batch AI tabs and switches the active segment by click", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = findMountedPanelRoot(harness.body);
    const selections = [];
    runtime.renderBatchResultTabs({
      items: [
        { segmentNumber: 1 },
        { segmentNumber: 2 },
        { segmentNumber: 4 },
      ],
      activeSegmentNumber: 2,
      onSelect(segmentNumber) {
        selections.push(segmentNumber);
      },
    });

    const tabButtons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON" && node.getAttribute("data-batch-result-segment");
    });
    assert.deepEqual(
      tabButtons.map(function (node) {
        return node.textContent;
      }),
      ["1", "2", "4"]
    );
    const activeButton = findNode(panelRoot, function (node) {
      return (
        node.tagName === "BUTTON" &&
        node.getAttribute("data-batch-result-segment") === "2"
      );
    });
    assert.ok(activeButton);
    assert.equal(activeButton.getAttribute("data-selected"), "true");

    const firstButton = findNode(panelRoot, function (node) {
      return (
        node.tagName === "BUTTON" &&
        node.getAttribute("data-batch-result-segment") === "1"
      );
    });
    assert.ok(firstButton);
    firstButton.click();
    assert.deepEqual(selections, [1]);

    runtime.renderBatchResultTabs({
      items: [],
      activeSegmentNumber: 0,
      onSelect() {},
    });
    assert.equal(
      collectDescendants(panelRoot).some(function (node) {
        return node.tagName === "BUTTON" && node.getAttribute("data-batch-result-segment");
      }),
      false
    );
  } finally {
    globalThis.document = previousDocument;
    globalThis.HTMLElement = previousHTMLElement;
  }
});
