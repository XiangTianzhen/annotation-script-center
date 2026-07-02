"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "ui-panel.js");

function loadUiPanelModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpSuzhouUiPanel;
  require(modulePath);
  return globalThis.ASREdgeBytedanceAidpSuzhouUiPanel;
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

  addEventListener(type, listener) {
    this.eventListeners[String(type || "")] = listener;
  }

  click() {
    const listener = this.eventListeners.click;
    if (typeof listener === "function") {
      listener.call(this, { type: "click", bubbles: true });
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

test("AIDP suzhou ui panel keeps current-audio section collapsed by default and supports single expand-collapse toggle", function () {
  const harness = createHarness();
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.document = harness.document;
  globalThis.HTMLElement = FakeNode;

  try {
    const module = loadUiPanelModule();
    const runtime = module.createRuntime({});
    assert.equal(runtime.mount(), true);

    const panelRoot = harness.waveAnchor.nextSibling;
    assert.ok(panelRoot);

    const collapseButton = findNode(panelRoot, function (node) {
      return node.tagName === "BUTTON" && node.textContent.includes("展开当前音频");
    });
    const allButtons = collectDescendants(panelRoot).filter(function (node) {
      return node.tagName === "BUTTON";
    });
    const summaryCard = findNode(panelRoot, function (node) {
      return String(node.className || "").split(/\s+/).includes("summary-card");
    });

    assert.ok(collapseButton);
    assert.ok(summaryCard);
    assert.equal(allButtons.filter(function (node) {
      return /当前音频/.test(node.textContent);
    }).length, 1);
    assert.equal(summaryCard.style.display, "none");

    runtime.renderAudioContext({
      entryId: "7656690377962016562",
      templateID: "7628929157338042146",
      audioDurationMs: 22012,
      currentSegments: [{}, {}],
      audioUrl: "https://example.test/audio.m4a",
    });

    collapseButton.click();
    assert.notEqual(summaryCard.style.display, "none");
    assert.match(collapseButton.textContent, /折叠当前音频/);
    assert.match(summaryCard.textContent, /7656690377962016562/);
    assert.match(summaryCard.textContent, /7628929157338042146/);
    assert.match(summaryCard.textContent, /https:\/\/example\.test\/audio\.m4a/);

    collapseButton.click();
    assert.equal(summaryCard.style.display, "none");
    assert.match(collapseButton.textContent, /展开当前音频/);

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
