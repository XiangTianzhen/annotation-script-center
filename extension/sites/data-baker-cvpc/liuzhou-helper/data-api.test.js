"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "data-api.js");
const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
const OBSERVER_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
const META_TYPE = "DATABAKER_CVPC_LIUZHOU_META_SNAPSHOT";
const MISSING_AUDIO_MESSAGE =
  "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";

function loadDataApiModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi;
  return require(modulePath);
}

class FakeElement {}
class FakeInputElement extends FakeElement {}
class FakeTextareaElement extends FakeElement {}

class RichFakeElement {
  constructor(tagName, options) {
    const settings = options && typeof options === "object" ? options : {};
    this.tagName = String(tagName || "div").toUpperCase();
    this.parentNode = null;
    this.children = [];
    this.attributes = {};
    this.className = settings.className || "";
    this.style = settings.style || "";
    this._textContent = settings.textContent || "";
    this._innerHTML = settings.innerHTML || "";
    this.type = settings.type || "";
    this.value = settings.value || "";
    this.checked = settings.checked === true;
    this.eventListeners = {};
    this.clickCount = 0;
    this.focusCount = 0;
    this.blurCount = 0;
    this.onClick = typeof settings.onClick === "function" ? settings.onClick : null;
    this.onTextContentChange =
      typeof settings.onTextContentChange === "function" ? settings.onTextContentChange : null;
    this.onValueChange = typeof settings.onValueChange === "function" ? settings.onValueChange : null;
    Object.keys(settings.attributes || {}).forEach(
      function (name) {
        this.setAttribute(name, settings.attributes[name]);
      }.bind(this)
    );
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, referenceNode) {
    if (!referenceNode) {
      return this.appendChild(child);
    }
    const index = this.children.indexOf(referenceNode);
    if (index < 0) {
      return this.appendChild(child);
    }
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.splice(index, 0, child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    child.parentNode = null;
    return child;
  }

  setAttribute(name, value) {
    const key = String(name || "");
    const text = String(value || "");
    this.attributes[key] = text;
    if (key === "class") {
      this.className = text;
    }
    if (key === "type") {
      this.type = text;
    }
    if (key === "value") {
      this.value = text;
    }
  }

  getAttribute(name) {
    return this.attributes[String(name || "")] || "";
  }

  addEventListener(type, listener) {
    const key = String(type || "");
    if (!this.eventListeners[key]) {
      this.eventListeners[key] = [];
    }
    this.eventListeners[key].push(listener);
  }

  dispatchEvent(event) {
    const type = String(event?.type || "");
    (this.eventListeners[type] || []).forEach(function (listener) {
      listener.call(this, event);
    }, this);
    return true;
  }

  focus() {
    this.focusCount += 1;
  }

  blur() {
    this.blurCount += 1;
  }

  click() {
    this.clickCount += 1;
    if (this.onClick) {
      this.onClick();
    }
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

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return collectDescendants(this).filter(function (node) {
      return matchesSelectorChain(node, selector);
    });
  }

  get textContent() {
    return [
      this._textContent,
      this.children.map(function (child) {
        return child.textContent || "";
      }).join(" "),
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  set textContent(value) {
    this._textContent = String(value || "");
    this._innerHTML = "";
    if (this.onTextContentChange) {
      this.onTextContentChange(this._textContent);
    }
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(value) {
    this.textContent = value;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value || "");
    this._textContent = String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (this.onTextContentChange) {
      this.onTextContentChange(this._textContent);
    }
  }
}

class RichFakeInputElement extends RichFakeElement {
  constructor(options) {
    super("input", options);
  }
}

class RichFakeTextareaElement extends RichFakeElement {
  constructor(options) {
    super("textarea", options);
  }
}

class RichFakeEditableElement extends RichFakeElement {
  constructor(options) {
    super("div", Object.assign({ attributes: { contenteditable: "true", role: "textbox" } }, options));
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
  if (current === "body") {
    return node.tagName === "BODY";
  }
  if (/^[a-z]+$/i.test(current)) {
    return node.tagName === current.toUpperCase();
  }
  if (current === "input[type='text']") {
    return node.tagName === "INPUT" && String(node.type || "").toLowerCase() === "text";
  }
  if (current === "input:not([type])") {
    return node.tagName === "INPUT" && !String(node.type || "").trim();
  }
  if (current === "[contenteditable='true']") {
    return String(node.getAttribute("contenteditable")).toLowerCase() === "true";
  }
  if (current === "[role='textbox']") {
    return String(node.getAttribute("role")).toLowerCase() === "textbox";
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

function createDataApiHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const state = {
    selectionText: String(settings.selectionText || ""),
    visibleEntryNames: Array.isArray(settings.visibleEntryNames)
      ? settings.visibleEntryNames.slice()
      : [],
  };
  const listeners = new Map();
  const location = {
    origin: "https://cvpc.data-baker.com",
    hostname: "cvpc.data-baker.com",
    pathname: "/app/editor/asr/",
    search:
      "?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
    href:
      "https://cvpc.data-baker.com/app/editor/asr/?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
  };
  const topAudio =
    settings.topAudioUrl
      ? {
          currentSrc: settings.topAudioUrl,
          src: settings.topAudioUrl,
        }
      : null;
  const iframeAudio =
    settings.iframeAudioUrl
      ? {
          currentSrc: settings.iframeAudioUrl,
          src: settings.iframeAudioUrl,
        }
      : null;
  const iframeNode =
    settings.iframeAudioUrl
      ? {
          contentDocument: {
            querySelector: function (selector) {
              return selector === "audio" ? iframeAudio : null;
            },
          },
        }
      : null;

  const document = {
    querySelectorAll: function (selector) {
      if (selector === "body *") {
        return state.visibleEntryNames.map(function (name) {
          return { textContent: name };
        });
      }
      if (selector === ".el-form-item, .ant-form-item, label, div") {
        return [];
      }
      return [];
    },
    querySelector: function (selector) {
      if (selector === ".xaudio_time") {
        return state.selectionText
          ? {
              textContent: state.selectionText,
            }
          : null;
      }
      if (selector === "audio") {
        return topAudio;
      }
      if (selector === "#iframeBox iframe#myIframe, #iframeBox iframe") {
        return iframeNode;
      }
      return null;
    },
  };

  const windowObject = {
    addEventListener: function (type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener: function (type, listener) {
      if (listeners.get(type) === listener) {
        listeners.delete(type);
      }
    },
  };

  const performance = {
    getEntriesByType: function (type) {
      if (type !== "resource") {
        return [];
      }
      return (settings.performanceEntries || []).map(function (name) {
        return { name };
      });
    },
  };

  const metaPayload = settings.metaPayload;
  const fetchCalls = [];
  async function fetchStub(url) {
    fetchCalls.push(String(url || ""));
    if (settings.fetchStatus) {
      return {
        ok: settings.fetchStatus >= 200 && settings.fetchStatus < 300,
        json: async function () {
          return {
            code: settings.fetchStatus,
            message: "failed",
          };
        },
      };
    }
    return {
      ok: true,
      json: async function () {
        return {
          code: settings.responseCode ?? 0,
          data: metaPayload,
        };
      },
    };
  }

  return {
    dependencies: {
      window: windowObject,
      document,
      location,
      performance,
      fetch: fetchStub,
      HTMLElement: FakeElement,
      HTMLInputElement: FakeInputElement,
      HTMLTextAreaElement: FakeTextareaElement,
    },
    fetchCalls,
    setSelectionText: function (value) {
      state.selectionText = String(value || "");
    },
    setVisibleEntryNames: function (names) {
      state.visibleEntryNames = Array.isArray(names) ? names.slice() : [];
    },
    dispatchObserverMessage: function (payload, type, sourceWindow) {
      const listener = listeners.get("message");
      if (typeof listener !== "function") {
        throw new Error("message listener not installed");
      }
      listener({
        source: sourceWindow || windowObject,
        origin: location.origin,
        data: {
          source: OBSERVER_SOURCE,
          type: type || OBSERVER_TYPE,
          payload,
        },
      });
    },
  };
}

function createMetaPayload(entries) {
  return {
    datas: entries,
    anns: [
      {
        entry_id: entries[0]?.entry_id || 1,
        entry_index: entries[0]?.entry_index || 1,
        ann_data: {
          moments: [
            {
              startMs: 0,
              endMs: 1350,
            },
          ],
        },
        audio_duration: 5.2,
      },
    ],
    template: {
      attrs: [],
      entry_attrs: [],
      moment_attrs: [],
    },
  };
}

function createInteractiveDataApiHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const segmentStates = Array.isArray(settings.segmentStates)
    ? settings.segmentStates.map(function (segment) {
        return {
          validity: segment.validity || "missing",
          dialectText: String(segment.dialectText || ""),
          mandarinText: String(segment.mandarinText || ""),
        };
      })
    : [{ validity: "missing", dialectText: "", mandarinText: "" }];
  let currentSegmentIndex = Number(settings.currentSegmentIndex || 0);
  const failSelectIndices = new Set(
    Array.isArray(settings.failSelectIndices) ? settings.failSelectIndices.map(Number) : []
  );
  const visibleEntryName = String(settings.visibleEntryName || "sample-a.mp3");
  const body = new RichFakeElement("body");
  const head = new RichFakeElement("head");
  const visibleEntryNode = new RichFakeElement("div", { textContent: visibleEntryName });
  const xaudioTimeNode = new RichFakeElement("div", {
    className: "xaudio_time",
    textContent: String(settings.selectionText || "开始：0 秒 结束：4.171 秒 截取：4.171 秒"),
  });
  const listContent = new RichFakeElement("div", { className: "list-content" });
  const formRoot = new RichFakeElement("div", { className: "label_title_border" });
  const validityBlock = new RichFakeElement("div", { className: "field-block validity-block" });
  const validityLabelRow = new RichFakeElement("div", {
    className: "item-name",
    textContent: "是否有效（Valid or Not）",
  });
  const validityValueHost = new RichFakeElement("div", { className: "w-[100%]" });
  const radioGroup = new RichFakeElement("div", { className: "el-radio-group" });
  const validLabel = new RichFakeElement("label", { className: "el-radio" });
  const validInput = new RichFakeInputElement({ type: "radio", value: "valid" });
  const validText = new RichFakeElement("span", { textContent: "是（Valid）" });
  validLabel.appendChild(validInput);
  validLabel.appendChild(validText);
  const invalidLabel = new RichFakeElement("label", { className: "el-radio" });
  const invalidInput = new RichFakeInputElement({ type: "radio", value: "invalid" });
  const invalidText = new RichFakeElement("span", { textContent: "否（Invalid）" });
  invalidLabel.appendChild(invalidInput);
  invalidLabel.appendChild(invalidText);
  radioGroup.appendChild(validLabel);
  radioGroup.appendChild(invalidLabel);
  validityValueHost.appendChild(radioGroup);
  validityBlock.appendChild(validityLabelRow);
  validityBlock.appendChild(validityValueHost);

  const dialectBlock = new RichFakeElement("div", { className: "field-block dialect-block" });
  const dialectLabelRow = new RichFakeElement("div", {
    className: "item-name",
    textContent: "标注文本",
  });
  const dialectValueHost = new RichFakeElement("div", { className: "w-[100%]" });
  const dialectEditor = new RichFakeEditableElement({
    className: "tiptap ProseMirror",
    onTextContentChange: function (text) {
      segmentStates[currentSegmentIndex].dialectText = String(text || "");
    },
  });
  dialectValueHost.appendChild(dialectEditor);
  dialectBlock.appendChild(dialectLabelRow);
  dialectBlock.appendChild(dialectValueHost);

  const mandarinBlock = new RichFakeElement("div", { className: "field-block mandarin-block" });
  const mandarinLabelRow = new RichFakeElement("div", {
    className: "item-name",
    textContent: "普通话顺滑",
  });
  const mandarinValueHost = new RichFakeElement("div", { className: "w-[100%]" });
  const mandarinEditor = new RichFakeEditableElement({
    className: "tiptap ProseMirror",
    onTextContentChange: function (text) {
      segmentStates[currentSegmentIndex].mandarinText = String(text || "");
    },
  });
  mandarinValueHost.appendChild(mandarinEditor);
  mandarinBlock.appendChild(mandarinLabelRow);
  mandarinBlock.appendChild(mandarinValueHost);

  formRoot.appendChild(validityBlock);
  formRoot.appendChild(dialectBlock);
  formRoot.appendChild(mandarinBlock);

  body.appendChild(visibleEntryNode);
  body.appendChild(xaudioTimeNode);
  body.appendChild(listContent);
  body.appendChild(formRoot);

  const segmentNodes = segmentStates.map(function (_segment, index) {
    const itemWrap = new RichFakeElement("div");
    const itemNode = new RichFakeElement("div", {
      className: "grey-seg segment-content",
      textContent: String(index + 1),
      onClick: function () {
        if (failSelectIndices.has(index)) {
          return;
        }
        currentSegmentIndex = index;
        refreshSegmentView();
      },
    });
    itemWrap.appendChild(itemNode);
    listContent.appendChild(itemWrap);
    return itemNode;
  });

  function refreshSegmentView() {
    segmentNodes.forEach(function (node, index) {
      node.setAttribute("data-selected", index === currentSegmentIndex ? "true" : "false");
      node.style =
        index === currentSegmentIndex
          ? "border: 1px solid rgb(82, 106, 255); color: rgb(82, 106, 255);"
          : "";
    });
    const current = segmentStates[currentSegmentIndex] || {
      validity: "missing",
      dialectText: "",
      mandarinText: "",
    };
    validInput.checked = current.validity === "valid";
    invalidInput.checked = current.validity === "invalid";
    validLabel.className = validInput.checked ? "el-radio is-checked" : "el-radio";
    invalidLabel.className = invalidInput.checked ? "el-radio is-checked" : "el-radio";
    dialectEditor.textContent = current.dialectText || "";
    mandarinEditor.textContent = current.mandarinText || "";
  }

  validLabel.onClick = function () {
    segmentStates[currentSegmentIndex].validity = "valid";
    refreshSegmentView();
  };
  invalidLabel.onClick = function () {
    segmentStates[currentSegmentIndex].validity = "invalid";
    refreshSegmentView();
  };
  validText.onClick = validLabel.onClick;
  invalidText.onClick = invalidLabel.onClick;

  refreshSegmentView();

  const fetchCalls = [];
  async function fetchStub(url) {
    const requestUrl = String(url || "");
    fetchCalls.push(requestUrl);
    if (requestUrl.indexOf("/httpapi/annotation/annos") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: 200,
            data:
              settings.annosPayload ||
              buildAnnosPayloadFromSegments(segmentStates),
          };
        },
      };
    }
    if (requestUrl.indexOf("/httpapi/annotation/meta") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: settings.responseCode ?? 0,
            data:
              settings.metaPayload ||
              createMetaPayload([
                {
                  entry_id: 1,
                  entry_index: 1,
                  name: visibleEntryName,
                  content: "databaker/data/" + visibleEntryName,
                },
              ]),
          };
        },
      };
    }
    throw new Error("unexpected fetch: " + requestUrl);
  }

  const document = {
    body,
    head,
    documentElement: body,
    querySelectorAll: function (selector) {
      if (selector === "body *") {
        return collectDescendants(body);
      }
      return body.querySelectorAll(selector);
    },
    querySelector: function (selector) {
      if (selector === "body") {
        return body;
      }
      return body.querySelector(selector);
    },
    createElement: function (tagName) {
      return new RichFakeElement(tagName);
    },
  };

  return {
    dependencies: {
      window: {
        addEventListener: function () {},
        removeEventListener: function () {},
      },
      document,
      location: {
        origin: "https://cvpc.data-baker.com",
        hostname: "cvpc.data-baker.com",
        pathname: "/app/editor/asr/",
        search:
          "?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
      },
      performance: {
        getEntriesByType: function () {
          return [];
        },
      },
      fetch: fetchStub,
      HTMLElement: RichFakeElement,
      HTMLInputElement: RichFakeInputElement,
      HTMLTextAreaElement: RichFakeTextareaElement,
    },
    fetchCalls,
    segmentNodes,
    segmentStates,
    validLabel,
    invalidLabel,
    dialectEditor,
    mandarinEditor,
    getCurrentSegmentIndex: function () {
      return currentSegmentIndex;
    },
  };
}

function buildAnnosPayloadFromSegments(segmentStates) {
  const states = Array.isArray(segmentStates) ? segmentStates : [];
  const result = [
    {
      entry_index: 1,
      entry_id: 1,
      unique_id: "entry-scope",
      ann_scope: "entry",
      ann_data: {
        attrs: [],
      },
      status: "valid",
    },
  ];
  states.forEach(function (segment, index) {
    const validity = segment?.validity || "missing";
    let values = [];
    if (validity === "valid") {
      values = [{ unique_id: "valid-id", name: "是（Valid）" }];
    } else if (validity === "invalid") {
      values = [{ unique_id: "invalid-id", name: "否（Invalid）" }];
    }
    result.push({
      entry_index: 1,
      entry_id: 1,
      unique_id: "instance-" + String(index + 1),
      ann_scope: "instance",
      ann_data: {
        attrs: values.length
          ? [
              {
                unique_id: "attr-validity",
                name: "是否有效（Valid or Not）",
                values,
                input_type: "radio",
              },
            ]
          : [],
      },
      status: "valid",
    });
  });
  return result;
}

test("CVPC data api prefers observer-supplied signed audio url for the current entry", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-b.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
        audioUrl: "https://meta.example.com/sample-a.mp3",
      },
      {
        entry_id: 2,
        entry_index: 2,
        name: "sample-b.mp3",
        content: "databaker/data/sample-b.mp3",
        audioUrl: "https://meta.example.com/sample-b.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage({
    relativePath: "databaker/data/sample-b.mp3",
    fileName: "sample-b.mp3",
    audioUrl: "https://oss.example.com/databaker/data/sample-b.mp3?Signature=observer",
    at: Date.now(),
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://oss.example.com/databaker/data/sample-b.mp3?Signature=observer"
  );
  assert.equal(context.audioUrlSource, "observer");
});

test("CVPC data api exposes live selectedRange and selectionKey from xaudio_time", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    selectionText:
      "总时长：218.03 秒 总截取：106.975 秒 未截取：111.054 秒 开始：18.565 秒 结束：35.677 秒 截取：17.112 秒",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
        audioUrl: "https://meta.example.com/databaker/data/sample-a.mp3?Signature=meta",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.deepEqual(context.selectedRange, {
    startMs: 18565,
    endMs: 35677,
    durationMs: 17112,
  });
  assert.equal(context.selectionKey, "sample-a.mp3|18565|35677");
});

test("CVPC data api live selection snapshot changes with visible entry and xaudio_time", function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const firstSnapshot = runtime.getLiveSelectionSnapshot();
  assert.deepEqual(firstSnapshot.selectedRange, {
    startMs: 0,
    endMs: 4171,
    durationMs: 4171,
  });
  assert.equal(firstSnapshot.selectionKey, "sample-a.mp3|0|4171");

  harness.setVisibleEntryNames(["sample-b.mp3"]);
  harness.setSelectionText("开始：18.565 秒 结束：35.677 秒 截取：17.112 秒");

  const secondSnapshot = runtime.getLiveSelectionSnapshot();
  assert.deepEqual(secondSnapshot.selectedRange, {
    startMs: 18565,
    endMs: 35677,
    durationMs: 17112,
  });
  assert.equal(secondSnapshot.selectionKey, "sample-b.mp3|18565|35677");
});

test("CVPC data api rejects stale recommendation when live selectionKey has changed", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.setSelectionText("开始：18.565 秒 结束：35.677 秒 截取：17.112 秒");

  const result = await runtime.fillCurrentSegmentRecommendation({
    selectionKey: "sample-a.mp3|0|4171",
    dialectText: "旧结果",
    mandarinText: "旧结果",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前段已切换，旧推荐已失效，请重新生成当前段 AI 推荐。",
  });
});

test("CVPC data api falls back to direct meta audio url when observer cache is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
        audioUrl: "https://meta.example.com/databaker/data/sample-a.mp3?Signature=meta",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://meta.example.com/databaker/data/sample-a.mp3?Signature=meta"
  );
  assert.equal(context.audioUrlSource, "meta");
});

test("CVPC data api uses bridged page meta when its own meta request is unauthorized", async function () {
  const dataApiModule = loadDataApiModule();
  const metaPayload = createMetaPayload([
    {
      entry_id: 249783,
      entry_index: 1,
      name: "sample.mp3",
      content: "databaker/data/17896/sample.mp3",
    },
  ]);
  const harness = createDataApiHarness({
    fetchStatus: 401,
    visibleEntryNames: ["sample.mp3"],
    metaPayload: null,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      meta: metaPayload,
      query: {
        project_id: "1453",
        task_id: "12099",
        process_id: "4946",
        data_id: "17896",
        job_id: "1520",
      },
      at: Date.now(),
    },
    META_TYPE
  );
  harness.dispatchObserverMessage({
    relativePath: "databaker/data/17896/sample.mp3",
    fileName: "sample.mp3",
    audioUrl: "https://oss.example.com/databaker/data/17896/sample.mp3?Signature=observer",
    at: Date.now(),
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.selectedEntry.name, "sample.mp3");
  assert.equal(
    context.audioUrl,
    "https://oss.example.com/databaker/data/17896/sample.mp3?Signature=observer"
  );
  assert.equal(context.audioUrlSource, "observer");
});

test("CVPC data api accepts same-origin iframe audio candidate and matches it with bridged meta", async function () {
  const dataApiModule = loadDataApiModule();
  const metaPayload = createMetaPayload([
    {
      entry_id: 249783,
      entry_index: 1,
      name: "sample.mp3",
      content: "databaker/data/17896/sample.mp3",
    },
  ]);
  const harness = createDataApiHarness({
    fetchStatus: 401,
    visibleEntryNames: ["sample.mp3"],
    metaPayload: null,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      meta: metaPayload,
      query: {
        project_id: "1453",
        task_id: "12099",
        process_id: "4946",
        data_id: "17896",
        job_id: "1520",
      },
      at: Date.now(),
    },
    META_TYPE
  );
  harness.dispatchObserverMessage(
    {
      relativePath: "databaker/data/17896/sample.mp3",
      fileName: "sample.mp3",
      audioUrl: "https://oss.example.com/databaker/data/17896/sample.mp3?Signature=iframe",
      at: Date.now(),
    },
    OBSERVER_TYPE,
    {}
  );

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://oss.example.com/databaker/data/17896/sample.mp3?Signature=iframe"
  );
  assert.equal(context.audioUrlSource, "observer");
});

test("CVPC data api falls back through top-level audio, performance, and iframe audio in order", async function () {
  const dataApiModule = loadDataApiModule();

  let harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    topAudioUrl: "https://player.example.com/databaker/data/sample-a.mp3?Signature=dom",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  let runtime = dataApiModule.createRuntime(harness.dependencies);
  let context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "dom-audio");
  assert.match(context.audioUrl, /Signature=dom/);

  harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    performanceEntries: [
      "https://static.example.com/ignore.js",
      "https://cdn.example.com/databaker/data/sample-a.mp3?Signature=perf",
    ],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  runtime = dataApiModule.createRuntime(harness.dependencies);
  context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "performance");
  assert.match(context.audioUrl, /Signature=perf/);

  harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    iframeAudioUrl: "https://iframe.example.com/databaker/data/sample-a.mp3?Signature=iframe",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  runtime = dataApiModule.createRuntime(harness.dependencies);
  context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "iframe-audio");
  assert.match(context.audioUrl, /Signature=iframe/);
});

test("CVPC data api does not reuse stale observer mapping after visible entry switches", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-b.mp3"],
    topAudioUrl: "https://player.example.com/databaker/data/sample-b.mp3?Signature=dom",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
      {
        entry_id: 2,
        entry_index: 2,
        name: "sample-b.mp3",
        content: "databaker/data/sample-b.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage({
    relativePath: "databaker/data/sample-a.mp3",
    fileName: "sample-a.mp3",
    audioUrl: "https://oss.example.com/databaker/data/sample-a.mp3?Signature=observer-a",
    at: Date.now(),
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://player.example.com/databaker/data/sample-b.mp3?Signature=dom"
  );
  assert.equal(context.audioUrlSource, "dom-audio");
});

test("CVPC data api returns a fixed hint message when no signed audio url can be resolved", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.audioUrl, "");
  assert.equal(context.audioUrlSource, "");
  assert.equal(context.audioUrlHintMessage, MISSING_AUDIO_MESSAGE);
});

test("CVPC data api does not re-click current validity when the current segment is already valid", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    segmentStates: [{ validity: "valid" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.setCurrentValidity(true);

  assert.deepEqual(result, {
    ok: true,
    message: "当前段已是 Valid，无需重复点击。",
    skipped: true,
  });
  assert.equal(harness.validLabel.clickCount, 0);
  assert.equal(harness.segmentStates[0].validity, "valid");
});

test("CVPC data api writes recommendation into contenteditable editors", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentRecommendation({
    selectionKey: "sample-a.mp3|0|4171",
    audioMandarinText: "听音普通话",
    refinedDialectText: "修正柳州话",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已尝试把当前段 AI 建议填入页面；如页面未同步，请刷新后复核。",
  });
  assert.equal(harness.dialectEditor.textContent, "修正柳州话");
  assert.equal(harness.mandarinEditor.textContent, "听音普通话");
});

test("CVPC data api writes staged recommendation text into the requested field only", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const dialectResult = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "听音柳州话",
  });

  assert.deepEqual(dialectResult, {
    ok: true,
    message: "已尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。",
  });
  assert.equal(harness.dialectEditor.textContent, "听音柳州话");
  assert.equal(harness.mandarinEditor.textContent, "");

  const mandarinResult = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "mandarin",
    text: "听音普通话",
  });

  assert.deepEqual(mandarinResult, {
    ok: true,
    message: "已尝试把当前段建议填入普通话顺滑；如页面未同步，请刷新后复核。",
  });
  assert.equal(harness.dialectEditor.textContent, "听音柳州话");
  assert.equal(harness.mandarinEditor.textContent, "听音普通话");
});

test("CVPC data api fillAllValid only reports stats when all instance validity fields are already filled", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    segmentStates: [
      { validity: "valid" },
      { validity: "invalid" },
      { validity: "valid" },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillUnresolvedSegmentsValid();

  assert.deepEqual(result, {
    ok: true,
    message: "当前音频共 3 段：已填 Valid 2 段，已填 Invalid 1 段，未填写 0 段；无需补写。",
    filledCount: 0,
    stats: {
      total: 3,
      valid: 2,
      invalid: 1,
      missing: 0,
    },
  });
  assert.equal(harness.validLabel.clickCount, 0);
});

test("CVPC data api fillAllValid selects missing segments in order and marks them valid", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    segmentStates: [
      { validity: "valid" },
      { validity: "missing" },
      { validity: "invalid" },
      { validity: "missing" },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillUnresolvedSegmentsValid();

  assert.deepEqual(result, {
    ok: true,
    message: "当前音频共 4 段：已填 Valid 1 段，已填 Invalid 1 段，补写 2 段。",
    filledCount: 2,
    stats: {
      total: 4,
      valid: 1,
      invalid: 1,
      missing: 2,
    },
    processedIndexes: [2, 4],
  });
  assert.equal(harness.segmentNodes[1].clickCount, 1);
  assert.equal(harness.segmentNodes[3].clickCount, 1);
  assert.equal(harness.validLabel.clickCount, 2);
  assert.equal(harness.segmentStates[1].validity, "valid");
  assert.equal(harness.segmentStates[3].validity, "valid");
});

test("CVPC data api fillAllValid stops when the target segment does not switch successfully", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    segmentStates: [{ validity: "missing" }, { validity: "missing" }],
    failSelectIndices: [1],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillUnresolvedSegmentsValid();

  assert.deepEqual(result, {
    ok: false,
    message: "第 2 段切换失败，已补写 1 段。当前音频共 2 段：已填 Valid 0 段，已填 Invalid 0 段，未填写 2 段。",
    filledCount: 1,
    failedIndex: 2,
    stats: {
      total: 2,
      valid: 0,
      invalid: 0,
      missing: 2,
    },
    processedIndexes: [1],
  });
  assert.equal(harness.segmentStates[0].validity, "valid");
  assert.equal(harness.segmentStates[1].validity, "missing");
});
