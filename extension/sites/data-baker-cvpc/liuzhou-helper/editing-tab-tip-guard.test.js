"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "editing-tab-tip-guard.js");
const guardApi = require(modulePath);

class FakeNode {
  constructor(tagName, text) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.textContent = String(text || "");
    this.children = [];
    this.parentNode = null;
    this.removed = false;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    this.removed = true;
    if (!this.parentNode) {
      return;
    }
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) {
      this.parentNode.children.splice(index, 1);
    }
    this.parentNode = null;
  }

  querySelectorAll(selector) {
    const results = [];
    const isTipsSelector = selector === ".tips";

    function visit(node) {
      if (isTipsSelector && String(node.tagName || "").toLowerCase() === "div" && /\btips\b/.test(node.className || "")) {
        results.push(node);
      }
      node.children.forEach(visit);
    }

    this.children.forEach(visit);
    return results;
  }
}

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
  }

  observe(target) {
    this.target = target;
  }

  disconnect() {
    this.disconnected = true;
  }

  emit(records) {
    this.callback(records);
  }
}

function createTipsNode(text) {
  const node = new FakeNode("div", text);
  node.className = "tips";
  return node;
}

function createHarness() {
  const body = new FakeNode("body", "");
  const document = {
    body,
    documentElement: body,
    querySelectorAll: body.querySelectorAll.bind(body),
  };
  return { body, document };
}

test("guard removes matching editing-tab tips during initial scan when enabled", function () {
  const harness = createHarness();
  const blockedTip = createTipsNode("您正在编辑该作业,不能打开新的Tab页");
  harness.body.appendChild(blockedTip);

  const guard = guardApi.createEditingTabTipGuard({
    document: harness.document,
    MutationObserver: FakeMutationObserver,
  });

  guard.start();

  assert.equal(blockedTip.removed, true);
});

test("guard removes matching paused-state tips during initial scan when enabled", function () {
  const harness = createHarness();
  const blockedTip = createTipsNode("系统进入暂停状态");
  harness.body.appendChild(blockedTip);

  const guard = guardApi.createEditingTabTipGuard({
    document: harness.document,
    MutationObserver: FakeMutationObserver,
  });

  guard.start();

  assert.equal(blockedTip.removed, true);
});

test("guard keeps matching editing-tab tips when that toggle is disabled", function () {
  const harness = createHarness();
  const blockedTip = createTipsNode("您正在编辑该作业,不能打开新的Tab页");
  harness.body.appendChild(blockedTip);

  const guard = guardApi.createEditingTabTipGuard({
    document: harness.document,
    MutationObserver: FakeMutationObserver,
    blockNewTabEditingTips: false,
  });

  guard.start();

  assert.equal(blockedTip.removed, false);
});

test("guard keeps paused-state tips when that toggle is disabled", function () {
  const harness = createHarness();
  const blockedTip = createTipsNode("系统进入暂停状态");
  harness.body.appendChild(blockedTip);

  const guard = guardApi.createEditingTabTipGuard({
    document: harness.document,
    MutationObserver: FakeMutationObserver,
    blockPauseStateTips: false,
  });

  guard.start();

  assert.equal(blockedTip.removed, false);
});

test("guard ignores non-matching tips and removes only enabled matching tips from mutations", function () {
  const harness = createHarness();
  const safeTip = createTipsNode("普通提示：请先保存页面");
  const blockedTabTip = createTipsNode("您正在编辑该作业,不能打开新的Tab页");
  const blockedPauseTip = createTipsNode("系统进入暂停状态");
  harness.body.appendChild(safeTip);

  const guard = guardApi.createEditingTabTipGuard({
    document: harness.document,
    MutationObserver: FakeMutationObserver,
    blockPauseStateTips: false,
  });

  guard.start();
  guard.observer.emit([
    {
      addedNodes: [blockedTabTip, blockedPauseTip],
    },
  ]);

  assert.equal(safeTip.removed, false);
  assert.equal(blockedTabTip.removed, true);
  assert.equal(blockedPauseTip.removed, false);
});
