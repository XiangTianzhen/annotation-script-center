"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "data-api.js");
const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
const OBSERVER_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
const META_TYPE = "DATABAKER_CVPC_LIUZHOU_META_SNAPSHOT";
const AUTH_TYPE = "DATABAKER_CVPC_LIUZHOU_REQUEST_AUTH";
const STRUCTURED_FIELD_WRITE_REQUEST_TYPE =
  "DATABAKER_CVPC_LIUZHOU_WRITE_STRUCTURED_FIELD_REQUEST";
const STRUCTURED_FIELD_WRITE_RESPONSE_TYPE =
  "DATABAKER_CVPC_LIUZHOU_WRITE_STRUCTURED_FIELD_RESPONSE";
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
    this.clientWidth = Number(settings.clientWidth || 0) || 0;
    this.clientHeight = Number(settings.clientHeight || 0) || 0;
    this.scrollWidth = Number(settings.scrollWidth || this.clientWidth || 0) || 0;
    this.scrollHeight = Number(settings.scrollHeight || this.clientHeight || 0) || 0;
    this.boundingRect =
      settings.boundingRect && typeof settings.boundingRect === "object"
        ? Object.assign({ left: 0, top: 0, width: 0, height: 0 }, settings.boundingRect)
        : null;
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

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, String(name || ""));
  }

  removeAttribute(name) {
    delete this.attributes[String(name || "")];
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
    if (event && !event.target) {
      try {
        event.target = this;
      } catch (_error) {
        // Ignore read-only target on native Event objects in Node.
      }
    }
    if (event) {
      try {
        event.currentTarget = this;
      } catch (_error) {
        // Ignore read-only currentTarget on native Event objects in Node.
      }
    }
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

  getBoundingClientRect() {
    const rect = this.boundingRect || {
      left: 0,
      top: 0,
      width: Number(this.clientWidth || 0) || 0,
      height: Number(this.clientHeight || 0) || 0,
    };
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    };
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
  if (/^#[\w-]+$/.test(current)) {
    return String(node.getAttribute?.("id") || "") === current.slice(1);
  }
  if (/^[a-z][\w-]*#[\w-]+$/i.test(current)) {
    const parts = current.split("#");
    return (
      node.tagName === parts[0].toUpperCase() &&
      String(node.getAttribute?.("id") || "") === parts[1]
    );
  }
  if (/^[a-z]+$/i.test(current)) {
    return node.tagName === current.toUpperCase();
  }
  if (/^[a-z][\w-]*(\.[\w-]+)+$/i.test(current)) {
    const parts = current.split(".");
    const tagName = parts.shift();
    return (
      node.tagName === String(tagName || "").toUpperCase() &&
      parts.every(function (className) {
        return (
          String(node.className || "")
            .split(/\s+/)
            .filter(Boolean)
            .indexOf(className) >= 0
        );
      })
    );
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
  const userMetaPayload = settings.userMetaPayload || null;
  const fetchCalls = [];
  async function fetchStub(url) {
    const requestUrl = String(url || "");
    fetchCalls.push(requestUrl);
    if (requestUrl.indexOf("/httpapi/user/meta") >= 0) {
      if (settings.userMetaFetchStatus) {
        return {
          ok: settings.userMetaFetchStatus >= 200 && settings.userMetaFetchStatus < 300,
          json: async function () {
            return {
              code: settings.userMetaFetchStatus,
              message: "failed",
            };
          },
        };
      }
      return {
        ok: true,
        json: async function () {
          return {
            code: settings.userMetaResponseCode ?? 0,
            data: userMetaPayload,
          };
        },
      };
    }
    if (requestUrl.indexOf("/httpapi/annotation/annos") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: 200,
            data:
              settings.annosPayload ||
              buildAnnosPayloadFromMetaPayload(metaPayload),
          };
        },
      };
    }
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

function createUserMetaPayload(overrides) {
  return Object.assign(
    {
      user_id: 9527,
      name: "柳州标注员",
    },
    overrides || {}
  );
}

function createMetaPayload(entries, options) {
  const settings = options && typeof options === "object" ? options : {};
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
    template:
      settings.template ||
      {
        attrs: [],
        entry_attrs: [],
        moment_attrs: [],
      },
  };
}

function buildAnnosPayloadFromMetaPayload(metaPayload) {
  const meta = metaPayload && typeof metaPayload === "object" ? metaPayload : {};
  const entry = Array.isArray(meta.datas) ? meta.datas[0] || null : null;
  const ann = Array.isArray(meta.anns) ? meta.anns[0] || null : null;
  const moments = Array.isArray(ann?.ann_data?.moments) ? ann.ann_data.moments : [];
  const result = [];
  if (entry || ann) {
    result.push({
      entry_index: entry?.entry_index || ann?.entry_index || 1,
      entry_id: entry?.entry_id || ann?.entry_id || 1,
      unique_id: "entry-scope",
      ann_scope: "entry",
      ann_data: {
        attrs: [],
      },
      status: "valid",
    });
  }
  moments.forEach(function (moment, index) {
    const startMs = Number(moment?.startMs || 0) || 0;
    const endMs = Number(moment?.endMs || startMs) || startMs;
    result.push({
      entry_index: entry?.entry_index || ann?.entry_index || 1,
      entry_id: entry?.entry_id || ann?.entry_id || 1,
      unique_id: "segment-" + String(index + 1),
      ann_scope: "instance",
      start_second: startMs / 1000,
      end_second: endMs / 1000,
      ann_data: {
        attrs: [],
      },
      status: "valid",
    });
  });
  return result;
}

function createInteractiveDataApiHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const defaultCommonLabels = [
    "<SPK/>",
    "<NPS/>",
    "#um",
    "#hmm",
    "#ah",
    "#eh",
    "<Unintelligible>",
    "<Meaningless>",
    "<Silence>",
  ];
  const disabledCommonLabels = new Set(
    Array.isArray(settings.disabledCommonLabels)
      ? settings.disabledCommonLabels.map(function (item) {
          return String(item || "");
        })
      : []
  );
  const segmentStates = Array.isArray(settings.segmentStates)
    ? settings.segmentStates.map(function (segment) {
        return {
          validity: segment.validity || "missing",
          dialectText: String(segment.dialectText || ""),
          dialectEditorText: String(segment.dialectEditorText || ""),
          dialectModelValue: String(segment.dialectModelValue || ""),
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
  const dialectTextareaHost = new RichFakeElement("div", { className: "textarea_class" });
  const dialectEditor = new RichFakeEditableElement({
    className: "tiptap ProseMirror",
    onTextContentChange: function (text) {
      const modelValue = String(dialectTextareaHost.getAttribute("modelvalue") || "");
      segmentStates[currentSegmentIndex].dialectText = decodeStructuredDialectValue(modelValue) || String(text || "");
      segmentStates[currentSegmentIndex].dialectModelValue = modelValue;
    },
  });
  dialectTextareaHost.appendChild(dialectEditor);
  dialectValueHost.appendChild(dialectTextareaHost);
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

  const commonLabelRoot = new RichFakeElement("div", { className: "block_label" });
  const commonLabelButtons = {};
  const nativeTagReplayEnabled = settings.enableNativeTagReplay === true;
  let activeEditable = null;

  function updateDialectEditorFromStructuredItems(items) {
    const nextItems = Array.isArray(items) ? items : [];
    const nextModelValue = JSON.stringify(nextItems);
    dialectTextareaHost.setAttribute("modelvalue", nextModelValue);
    dialectEditor.innerHTML = buildStructuredDialectEditorHtml(nextItems);
    segmentStates[currentSegmentIndex].dialectModelValue = nextModelValue;
    segmentStates[currentSegmentIndex].dialectText = decodeStructuredDialectValue(nextModelValue);
  }

  function appendCommonLabelGroup(labelTexts) {
    const group = new RichFakeElement("div", { className: "common_label" });
    (Array.isArray(labelTexts) ? labelTexts : []).forEach(function (labelText) {
      const text = String(labelText || "");
      const disabled = disabledCommonLabels.has(text);
      const button = new RichFakeElement("button", {
        className: disabled
          ? "el-button el-button--small is-disabled common_label_show"
          : "el-button el-button--small common_label_show",
      });
      button.disabled = disabled;
      button.setAttribute("aria-disabled", disabled ? "true" : "false");
      if (disabled) {
        button.setAttribute("disabled", "disabled");
      }
      const span = new RichFakeElement("span", { textContent: text });
      button.appendChild(span);
      if (nativeTagReplayEnabled) {
        button.onClick = function () {
          if (activeEditable !== dialectEditor) {
            return;
          }
          const items = parseStructuredDialectItems(dialectTextareaHost.getAttribute("modelvalue"));
          items.push({
            type: "single",
            id: "native-tag-" + String(items.length + 1),
            content: text,
          });
          updateDialectEditorFromStructuredItems(items);
        };
      }
      group.appendChild(button);
      commonLabelButtons[text] = button;
    });
    commonLabelRoot.appendChild(group);
  }

  const commonLabels = Array.isArray(settings.commonLabels)
    ? settings.commonLabels.slice()
    : defaultCommonLabels.slice();
  appendCommonLabelGroup(
    commonLabels.filter(function (labelText) {
      return ["<SPK/>", "<NPS/>", "#um", "#hmm", "#ah", "#eh"].indexOf(labelText) >= 0;
    })
  );
  appendCommonLabelGroup(
    commonLabels.filter(function (labelText) {
      return ["<Unintelligible>", "<Meaningless>", "<Silence>"].indexOf(labelText) >= 0;
    })
  );

  body.appendChild(visibleEntryNode);
  body.appendChild(xaudioTimeNode);
  body.appendChild(listContent);
  body.appendChild(formRoot);
  body.appendChild(commonLabelRoot);

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
    dialectTextareaHost.setAttribute(
      "modelvalue",
      current.dialectModelValue || buildStructuredDialectValue(current.dialectText || "")
    );
    dialectEditor.textContent = current.dialectEditorText || current.dialectText || "";
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

  if (nativeTagReplayEnabled) {
    const originalDialectFocus = dialectEditor.focus.bind(dialectEditor);
    dialectEditor.focus = function () {
      activeEditable = dialectEditor;
      return originalDialectFocus();
    };
    const originalMandarinFocus = mandarinEditor.focus.bind(mandarinEditor);
    mandarinEditor.focus = function () {
      activeEditable = mandarinEditor;
      return originalMandarinFocus();
    };
  }

  const fetchCalls = [];
  const windowMessageListeners = [];
  const postedWindowMessages = [];
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
  const execCommandCalls = [];
  if (nativeTagReplayEnabled) {
    document.execCommand = function (command, _showUi, value) {
      const action = String(command || "");
      execCommandCalls.push({
        command: action,
        value: value,
      });
      if (activeEditable !== dialectEditor) {
        return false;
      }
      if (action === "insertText") {
        const items = parseStructuredDialectItems(dialectTextareaHost.getAttribute("modelvalue"));
        appendTextItemToStructuredDialectItems(items, value);
        updateDialectEditorFromStructuredItems(items);
        return true;
      }
      if (action === "delete") {
        updateDialectEditorFromStructuredItems([]);
        return true;
      }
      if (action === "selectAll") {
        return true;
      }
      return false;
    };
  }

  const windowObject = {
    addEventListener: function (type, listener) {
      if (String(type || "") !== "message" || typeof listener !== "function") {
        return;
      }
      if (windowMessageListeners.indexOf(listener) < 0) {
        windowMessageListeners.push(listener);
      }
    },
    removeEventListener: function (type, listener) {
      if (String(type || "") !== "message") {
        return;
      }
      const index = windowMessageListeners.indexOf(listener);
      if (index >= 0) {
        windowMessageListeners.splice(index, 1);
      }
    },
    postMessage: function (data, origin) {
      postedWindowMessages.push({ data, origin });
    },
  };

  return {
    dependencies: {
      window: windowObject,
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
    commonLabelButtons,
    validLabel,
    invalidLabel,
    dialectTextareaHost,
    dialectEditor,
    mandarinEditor,
    execCommandCalls,
    postedWindowMessages,
    dispatchWindowMessage: function (data, origin) {
      windowMessageListeners.slice().forEach(function (listener) {
        listener({
          type: "message",
          data: data,
          origin: origin || "https://cvpc.data-baker.com",
          source: windowObject,
        });
      });
    },
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

function buildStructuredDialectValue(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return JSON.stringify([
    {
      type: "text",
      content: String(value || ""),
    },
  ]);
}

function decodeStructuredDialectValue(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return text;
    }
    return parsed
      .map(function (item) {
        return String(item?.content || "");
      })
      .join("");
  } catch (_error) {
    return text;
  }
}

function parseStructuredDialectItems(value) {
  const text = String(value || "");
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function appendTextItemToStructuredDialectItems(items, content) {
  const nextText = String(content || "");
  if (!nextText) {
    return;
  }
  const list = Array.isArray(items) ? items : [];
  const previous = list[list.length - 1];
  if (previous && previous.type === "text") {
    previous.content = String(previous.content || "") + nextText;
    return;
  }
  list.push({
    type: "text",
    content: nextText,
  });
}

function escapeStructuredHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStructuredDialectEditorHtml(items) {
  const source = Array.isArray(items) ? items : [];
  const html = source
    .map(function (item, index) {
      if (!item || typeof item !== "object") {
        return "";
      }
      if (String(item.type || "").toLowerCase() === "single") {
        const tagId = String(item.id || "tag-" + String(index + 1));
        const content = String(item.content || "");
        return (
          '<span data-tag-id="' +
          tagId +
          '" data-tag-label="' +
          escapeStructuredHtml(content) +
          '" data-type="single" class="tiptap-tag biaoqian_tag single-tag" contenteditable="false">' +
          '<span class="tag-display">' +
          escapeStructuredHtml(content) +
          '</span><span class="tag-close biaoqian_tag_x" data-tag-close="true">×</span></span>'
        );
      }
      return escapeStructuredHtml(String(item.content || ""));
    })
    .join("");
  if (!html) {
    return '<p><br class="ProseMirror-trailingBreak"></p>';
  }
  return "<p>" + html + '<img class="ProseMirror-separator" alt=""><br class="ProseMirror-trailingBreak"></p>';
}

function formatRegionTitle(startMs, endMs) {
  function formatPart(value) {
    const totalMs = Math.max(0, Number(value || 0) || 0);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = ((totalMs % 60000) / 1000).toFixed(3).padStart(6, "0");
    return String(minutes) + ":" + seconds;
  }
  return formatPart(startMs) + "-" + formatPart(endMs);
}

function buildExactSegmentRows(segments) {
  const source = Array.isArray(segments) ? segments : [];
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
  source.forEach(function (segment, index) {
    result.push({
      entry_index: 1,
      entry_id: 1,
      unique_id: String(segment.uniqueId || "region-" + String(index + 1)),
      ann_scope: "instance",
      start_second: Number(segment.startMs || 0) / 1000,
      end_second: Number(segment.endMs || 0) / 1000,
      ann_data: {
        attrs: [],
      },
      status: "valid",
    });
  });
  return result;
}

function createBatchMomentTemplate() {
  return {
    attrs: [],
    entry_attrs: [
      {
        unique_id: "entry-validity",
        name: "是否有效（Valid or Not）",
        input_type: "radio",
      },
    ],
    moment_attrs: [
      {
        unique_id: "moment-validity",
        name: "是否有效（Valid or Not）",
        input_type: "radio",
      },
      {
        unique_id: "moment-dialect",
        name: "标注文本",
        input_type: "text",
      },
      {
        unique_id: "moment-mandarin",
        name: "普通话顺滑",
        input_type: "text",
      },
    ],
  };
}

function createBatchTextAnnosPayload(segments) {
  const source = Array.isArray(segments) ? segments : [];
  const result = [
    {
      entry_index: 1,
      entry_id: 1,
      unique_id: "entry-scope",
      ann_scope: "entry",
      ann_data: {
        attrs: [
          {
            unique_id: "entry-validity",
            name: "是否有效（Valid or Not）",
            values: [{ unique_id: "entry-valid", name: "是（Valid）" }],
            input_type: "radio",
          },
        ],
        attr_version: "v1",
      },
      source: "manual",
      status: "valid",
    },
  ];
  source.forEach(function (segment, index) {
    const dialectText = String(segment.dialectText || "");
    const mandarinText = String(segment.mandarinText || "");
    const validity = String(segment.validity || "valid");
    const validityValue =
      validity === "invalid"
        ? { unique_id: "invalid-id", name: "否（Invalid）" }
        : { unique_id: "valid-id", name: "是（Valid）" };
    result.push({
      entry_index: 1,
      entry_id: 1,
      unique_id: String(segment.uniqueId || "region-" + String(index + 1)),
      ann_scope: "instance",
      start_second: Number(segment.startMs || 0) / 1000,
      end_second: Number(segment.endMs || 0) / 1000,
      ann_data: {
        attrs: [
          {
            unique_id: "moment-validity",
            name: "是否有效（Valid or Not）",
            values: [validityValue],
            input_type: "radio",
          },
          {
            unique_id: "moment-dialect",
            name: "标注文本",
            values: ['[{"type":"text","content":"' + dialectText + '"}]'],
            input_type: "text",
          },
          {
            unique_id: "moment-mandarin",
            name: "普通话顺滑",
            values: [mandarinText],
            input_type: "text",
          },
        ],
        attr_version: "v2",
      },
      source: "manual",
      status: "valid",
      track_id: "-1",
      shape: "section",
      camera_name: "cam" + String(index + 1),
      asr_is_done: 1,
      is_update_position: 0,
      is_update_labelattr: 0,
    });
  });
  return result;
}

function createSegmentApplyHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const visibleEntryName = String(settings.visibleEntryName || "sample-a.mp3");
  const selectionText = String(
    settings.selectionText || "开始：0 秒 结束：4.171 秒 截取：4.171 秒"
  );
  const audioDurationMs = Number(settings.audioDurationMs || 10000) || 10000;
  const waveformWidth = Number(settings.waveformWidth || 1000) || 1000;
  const regionDefs = Array.isArray(settings.regions)
    ? settings.regions.map(function (segment, index) {
        return {
          uniqueId: String(segment.uniqueId || "region-" + String(index + 1)),
          startMs: Number(segment.startMs || 0) || 0,
          endMs: Number(segment.endMs || 0) || 0,
          segmentNumber: Number(segment.segmentNumber || index + 1) || index + 1,
        };
      })
    : [
        {
          uniqueId: "region-1",
          startMs: 0,
          endMs: 3000,
          segmentNumber: 1,
        },
      ];

  function msToPx(value) {
    return Math.round((Math.max(0, Number(value || 0) || 0) / audioDurationMs) * waveformWidth);
  }

  function pxToMs(value) {
    return Math.round((Math.max(0, Number(value || 0) || 0) / waveformWidth) * audioDurationMs);
  }

  const body = new RichFakeElement("body");
  const head = new RichFakeElement("head");
  const visibleEntryNode = new RichFakeElement("div", { textContent: visibleEntryName });
  const xaudioTimeNode = new RichFakeElement("div", {
    className: "xaudio_time",
    textContent: selectionText,
  });
  const splitButton = new RichFakeElement("button", {
    textContent: "开启拆分",
  });
  const iframeBox = new RichFakeElement("div", {
    attributes: { id: "iframeBox" },
  });
  const iframeNode = new RichFakeElement("iframe", {
    attributes: { id: "myIframe" },
  });

  body.appendChild(visibleEntryNode);
  body.appendChild(xaudioTimeNode);
  body.appendChild(splitButton);
  body.appendChild(iframeBox);
  iframeBox.appendChild(iframeNode);

  const iframeBody = new RichFakeElement("body");
  const iframeHead = new RichFakeElement("head");
  const waveWaveform = new RichFakeElement("div", {
    attributes: { id: "wave-waveform" },
    clientWidth: waveformWidth,
    scrollWidth: waveformWidth,
    boundingRect: {
      left: 20,
      top: 0,
      width: waveformWidth,
      height: 201,
    },
  });
  const rectWrapper = new RichFakeElement("rectwrapper", {
    clientWidth: waveformWidth,
    scrollWidth: waveformWidth,
    boundingRect: {
      left: 20,
      top: 0,
      width: waveformWidth,
      height: 201,
    },
  });
  const markpoints = new RichFakeElement("markpoints", {
    clientWidth: waveformWidth,
    scrollWidth: waveformWidth,
    boundingRect: {
      left: 20,
      top: 0,
      width: waveformWidth,
      height: 201,
    },
  });
  waveWaveform.appendChild(rectWrapper);
  rectWrapper.appendChild(markpoints);
  iframeBody.appendChild(waveWaveform);

  const iframeDocumentListeners = {};
  const iframeDocument = {
    body: iframeBody,
    head: iframeHead,
    documentElement: iframeBody,
    addEventListener: function (type, listener) {
      iframeDocumentListeners[String(type || "")] = listener;
    },
    removeEventListener: function (type, listener) {
      if (iframeDocumentListeners[String(type || "")] === listener) {
        delete iframeDocumentListeners[String(type || "")];
      }
    },
    dispatchEvent: function (event) {
      const listener = iframeDocumentListeners[String(event?.type || "")];
      if (typeof listener === "function") {
        listener.call(iframeDocument, event);
      }
      return true;
    },
    querySelectorAll: function (selector) {
      if (selector === "body *") {
        return collectDescendants(iframeBody);
      }
      return iframeBody.querySelectorAll(selector);
    },
    querySelector: function (selector) {
      if (selector === "body") {
        return iframeBody;
      }
      return iframeBody.querySelector(selector);
    },
    createElement: function (tagName) {
      return new RichFakeElement(tagName);
    },
  };
  iframeNode.contentDocument = iframeDocument;

  const regionStates = [];
  let splitMode = false;
  let dragState = null;

  function updateRegionNode(regionState) {
    const leftPx = msToPx(regionState.startMs);
    const rightPx = msToPx(regionState.endMs);
    const widthPx = Math.max(1, rightPx - leftPx);
    regionState.node.setAttribute(
      "style",
      [
        "position: absolute",
        "left: " + String(leftPx) + "px",
        "width: " + String(widthPx) + "px",
        "height: 201px",
        "top: 0px",
      ].join("; ")
    );
    regionState.node.style = {
      left: String(leftPx) + "px",
      width: String(widthPx) + "px",
      height: "201px",
      top: "0px",
    };
    regionState.node.boundingRect = {
      left: 20 + leftPx,
      top: 0,
      width: widthPx,
      height: 201,
    };
    regionState.node.setAttribute("title", formatRegionTitle(regionState.startMs, regionState.endMs));
    regionState.startHandle.boundingRect = {
      left: 20 + leftPx,
      top: 0,
      width: 3,
      height: 201,
    };
    regionState.endHandle.boundingRect = {
      left: 20 + leftPx + widthPx - 3,
      top: 0,
      width: 3,
      height: 201,
    };
  }

  function createWaveRegion(definition, index) {
    const regionNode = new RichFakeElement("region", {
      className: "waveform-region",
      attributes: {
        "data-id": String(definition.uniqueId),
      },
    });
    const closeButton = new RichFakeElement("button");
    const labelNode = new RichFakeElement("div", {
      textContent: String(definition.segmentNumber || index + 1),
    });
    const hiddenLabelNode = new RichFakeElement("div", {
      textContent: "",
    });
    const startHandle = new RichFakeElement("handle", {
      className: "waveform-handle waveform-handle-start",
    });
    const endHandle = new RichFakeElement("handle", {
      className: "waveform-handle waveform-handle-end",
    });
    const regionState = {
      uniqueId: String(definition.uniqueId),
      segmentNumber: Number(definition.segmentNumber || index + 1) || index + 1,
      startMs: Number(definition.startMs || 0) || 0,
      endMs: Number(definition.endMs || 0) || 0,
      node: regionNode,
      labelNode,
      startHandle,
      endHandle,
    };
    startHandle.addEventListener("pointerdown", function (event) {
      dragState = {
        kind: "resize",
        edge: "start",
        regionState,
        clientX: Number(event?.clientX || 0) || 0,
      };
    });
    startHandle.addEventListener("mousedown", function (event) {
      dragState = {
        kind: "resize",
        edge: "start",
        regionState,
        clientX: Number(event?.clientX || 0) || 0,
      };
    });
    endHandle.addEventListener("pointerdown", function (event) {
      dragState = {
        kind: "resize",
        edge: "end",
        regionState,
        clientX: Number(event?.clientX || 0) || 0,
      };
    });
    endHandle.addEventListener("mousedown", function (event) {
      dragState = {
        kind: "resize",
        edge: "end",
        regionState,
        clientX: Number(event?.clientX || 0) || 0,
      };
    });
    regionNode.appendChild(closeButton);
    regionNode.appendChild(labelNode);
    regionNode.appendChild(hiddenLabelNode);
    regionNode.appendChild(startHandle);
    regionNode.appendChild(endHandle);
    rectWrapper.appendChild(regionNode);
    regionStates.push(regionState);
    updateRegionNode(regionState);
    return regionState;
  }

  function normalizeRegionNumbers() {
    regionStates
      .slice()
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      })
      .forEach(function (regionState, index) {
        regionState.segmentNumber = index + 1;
        regionState.labelNode.textContent = String(index + 1);
      });
  }

  function finalizeResize(clientX) {
    if (!dragState || dragState.kind !== "resize") {
      return;
    }
    const positionPx = Math.max(
      0,
      Math.min(waveformWidth, Math.round((Number(clientX || 0) || 0) - 20))
    );
    const nextMs = pxToMs(positionPx);
    if (dragState.edge === "start") {
      dragState.regionState.startMs = Math.min(nextMs, dragState.regionState.endMs - 50);
    } else {
      dragState.regionState.endMs = Math.max(nextMs, dragState.regionState.startMs + 50);
    }
    updateRegionNode(dragState.regionState);
    normalizeRegionNumbers();
    dragState = null;
  }

  function finalizeCreate(clientX) {
    if (!dragState || dragState.kind !== "create") {
      return;
    }
    const startPx = Math.max(
      0,
      Math.min(waveformWidth, Math.round((Number(dragState.startClientX || 0) || 0) - 20))
    );
    const endPx = Math.max(
      0,
      Math.min(waveformWidth, Math.round((Number(clientX || 0) || 0) - 20))
    );
    const leftPx = Math.min(startPx, endPx);
    const rightPx = Math.max(startPx, endPx);
    if (rightPx - leftPx >= 1) {
      createWaveRegion(
        {
          uniqueId: "generated-" + String(regionStates.length + 1),
          startMs: pxToMs(leftPx),
          endMs: pxToMs(rightPx),
          segmentNumber: regionStates.length + 1,
        },
        regionStates.length
      );
      normalizeRegionNumbers();
    }
    dragState = null;
  }

  function attachWaveInteraction(node) {
    ["pointerup", "mouseup"].forEach(function (type) {
      node.addEventListener(type, function (event) {
        if (!dragState) {
          return;
        }
        if (dragState.kind === "resize") {
          finalizeResize(event?.clientX);
          return;
        }
        finalizeCreate(event?.clientX);
      });
    });
    ["pointerdown", "mousedown"].forEach(function (type) {
      node.addEventListener(type, function (event) {
        if (!splitMode) {
          return;
        }
        dragState = {
          kind: "create",
          startClientX: Number(event?.clientX || 0) || 0,
        };
      });
    });
  }

  attachWaveInteraction(markpoints);
  attachWaveInteraction(rectWrapper);

  regionDefs.forEach(createWaveRegion);
  normalizeRegionNumbers();

  splitButton.onClick = function () {
    splitMode = true;
  };

  const topDocument = {
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

  const metaPayload =
    settings.metaPayload ||
    {
      datas: [
        {
          entry_id: 1,
          entry_index: 1,
          name: visibleEntryName,
          content: "databaker/data/" + visibleEntryName,
        },
      ],
      anns: [
        {
          entry_id: 1,
          entry_index: 1,
          ann_data: {
            moments: regionDefs.map(function (segment) {
              return {
                startMs: segment.startMs,
                endMs: segment.endMs,
              };
            }),
          },
          audio_duration: audioDurationMs / 1000,
        },
      ],
      template: {
        attrs: [],
        entry_attrs: [],
        moment_attrs: [],
      },
    };
  const annosPayload = settings.annosPayload || buildExactSegmentRows(regionDefs);
  const fetchCalls = [];
  const fetchRequests = [];
  const listeners = new Map();

  async function fetchStub(url, init) {
    const requestUrl = String(url || "");
    fetchCalls.push(requestUrl);
    fetchRequests.push({
      url: requestUrl,
      init: init && typeof init === "object" ? init : {},
    });
    if (requestUrl.indexOf("/httpapi/annotation/annos") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: 200,
            data: annosPayload,
          };
        },
      };
    }
    if (requestUrl.indexOf("/httpapi/annotation/meta") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: 0,
            data: metaPayload,
          };
        },
      };
    }
    if (requestUrl.indexOf("/httpapi/user/meta") >= 0) {
      return {
        ok: true,
        json: async function () {
          return {
            code: 0,
            data: {
              user_id: 9527,
              name: "柳州标注员",
            },
          };
        },
      };
    }
    if (requestUrl.indexOf("/httpapi/annotation/save_increment") >= 0) {
      const statusCode = Number(settings.saveIncrementStatus ?? 200) || 200;
      return {
        ok: statusCode >= 200 && statusCode < 300,
        json: async function () {
          return settings.saveIncrementPayload || {
            code: statusCode,
            data: {
              status: statusCode >= 200 && statusCode < 300 ? "ok" : "failed",
            },
            msg: statusCode >= 200 && statusCode < 300 ? "" : "failed",
          };
        },
      };
    }
    throw new Error("unexpected fetch: " + requestUrl);
  }

  return {
    dependencies: {
      window: {
        addEventListener: function (type, listener) {
          listeners.set(type, listener);
        },
        removeEventListener: function (type, listener) {
          if (listeners.get(type) === listener) {
            listeners.delete(type);
          }
        },
      },
      document: topDocument,
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
    fetchRequests,
    iframeDocument,
    markpoints,
    splitButton,
    regionStates,
    setSelectionText: function (value) {
      xaudioTimeNode.textContent = String(value || "");
    },
    getLiveRegions: function () {
      return regionStates
        .slice()
        .sort(function (left, right) {
          return left.startMs - right.startMs;
        })
        .map(function (regionState) {
          return {
            uniqueId: regionState.uniqueId,
            startMs: regionState.startMs,
            endMs: regionState.endMs,
            segmentNumber: regionState.segmentNumber,
            title: regionState.node.getAttribute("title"),
          };
        });
    },
    dispatchObserverMessage: function (payload, type) {
      const listener = listeners.get("message");
      if (typeof listener !== "function") {
        throw new Error("message listener not installed");
      }
      listener({
        source: {},
        origin: "https://cvpc.data-baker.com",
        data: {
          source: OBSERVER_SOURCE,
          type: type || OBSERVER_TYPE,
          payload,
        },
      });
    },
  };
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

test("CVPC data api prefers the current header entry over left audio list items", async function () {
  const dataApiModule = loadDataApiModule();
  const metaPayload = createMetaPayload([
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
  ]);
  const body = new RichFakeElement("body");
  const audioListHost = new RichFakeElement("div", { className: "audio-list-host" });
  const audioListSearchWrap = new RichFakeElement("div");
  const audioListSearchInput = new RichFakeInputElement({
    attributes: {
      placeholder: "请输入音频名称",
    },
  });
  const audioListItem = new RichFakeElement("div", {
    textContent: "sample-b.mp3",
  });
  const currentEntryNode = new RichFakeElement("div", {
    textContent: "sample-a.mp3",
  });
  audioListSearchWrap.appendChild(audioListSearchInput);
  audioListSearchWrap.appendChild(audioListItem);
  audioListHost.appendChild(audioListSearchWrap);
  body.appendChild(audioListHost);
  body.appendChild(currentEntryNode);

  const fetchCalls = [];
  const runtime = dataApiModule.createRuntime({
    window: {
      addEventListener: function () {},
      removeEventListener: function () {},
    },
    document: {
      querySelectorAll: function (selector) {
        if (selector === "body *") {
          return collectDescendants(body);
        }
        if (selector === ".el-form-item, .ant-form-item, label, div") {
          return [];
        }
        return [];
      },
      querySelector: function (selector) {
        if (selector === 'input[placeholder="请输入音频名称"]') {
          return audioListSearchInput;
        }
        return null;
      },
    },
    location: {
      origin: "https://cvpc.data-baker.com",
      hostname: "cvpc.data-baker.com",
      pathname: "/app/editor/asr/",
      search:
        "?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
      href:
        "https://cvpc.data-baker.com/app/editor/asr/?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
    },
    performance: {
      getEntriesByType: function () {
        return [];
      },
    },
    fetch: async function (url) {
      const requestUrl = String(url || "");
      fetchCalls.push(requestUrl);
      if (requestUrl.indexOf("/httpapi/annotation/annos") >= 0) {
        return {
          ok: true,
          json: async function () {
            return {
              code: 200,
              data: buildAnnosPayloadFromMetaPayload(metaPayload),
            };
          },
        };
      }
      if (requestUrl.indexOf("/httpapi/user/meta") >= 0) {
        return {
          ok: true,
          json: async function () {
            return {
              code: 0,
              data: null,
            };
          },
        };
      }
      return {
        ok: true,
        json: async function () {
          return {
            code: 0,
            data: metaPayload,
          };
        },
      };
    },
    HTMLElement: FakeElement,
    HTMLInputElement: FakeInputElement,
    HTMLTextAreaElement: FakeTextareaElement,
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.selectedEntry.name, "sample-a.mp3");
  assert.ok(
    fetchCalls.some(function (requestUrl) {
      return requestUrl.indexOf("/httpapi/annotation/annos") >= 0;
    })
  );
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
    message: "当前段已切换，旧识别结果已失效，请重新执行当前段识别。",
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

test("CVPC data api exposes bridged user meta on editor context", async function () {
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
      meta: {
        user_id: 9527,
        name: "柳州标注员",
      },
      query: {},
      at: Date.now(),
    },
    META_TYPE
  );

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.platformUserName, "柳州标注员");
  assert.equal(context.platformUserId, "9527");
  assert.equal(context.platformUserMetaSource, "observer-user-meta");
});

test("CVPC data api falls back to direct user meta request when bridged user meta is missing", async function () {
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
    userMetaPayload: createUserMetaPayload(),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.platformUserName, "柳州标注员");
  assert.equal(context.platformUserId, "9527");
  assert.equal(context.platformUserMetaSource, "direct-user-meta");
  assert.ok(
    harness.fetchCalls.some(function (requestUrl) {
      return requestUrl.indexOf("/httpapi/user/meta") >= 0;
    })
  );
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

test("CVPC data api applies Meaningless invalid preset for standalone particle recommendations", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "旧普通话" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentRecommendation({
    selectionKey: "sample-a.mp3|0|4171",
    refinedDialectText: "#ah。",
    refinedDialectTokens: [
      { type: "tag", content: "#ah" },
      { type: "text", content: "。" },
    ],
    refinedMandarinText: "啊。",
    applyPreset: {
      validity: "invalid",
      dialectText: "<Meaningless>",
      dialectTokens: [{ type: "tag", content: "<Meaningless>" }],
      mandarinText: "",
    },
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已自动切换为 Invalid，并写入 <Meaningless> 标签；如页面未同步，请刷新后复核。",
  });
  assert.equal(harness.segmentStates[0].validity, "invalid");
  assert.equal(harness.mandarinEditor.textContent, "");
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.equal(structured.length, 1);
  assert.equal(structured[0].type, "single");
  assert.equal(structured[0].content, "<Meaningless>");
});

test("CVPC data api exposes current selected segment number in editor context", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    currentSegmentIndex: 2,
    segmentStates: [
      { validity: "missing", dialectText: "", mandarinText: "" },
      { validity: "missing", dialectText: "", mandarinText: "" },
      { validity: "missing", dialectText: "", mandarinText: "" },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.currentSegmentNumber, 3);
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

test("CVPC data api auto-corrects current validity to Valid before filling tagged dialect text", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "invalid", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
    recommendationValidityAutoCorrectEnabled: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.message, /已自动切换为 Valid/);
  assert.match(result.message, /填入标注文本/);
  assert.equal(harness.segmentStates[0].validity, "valid");
});

test("CVPC data api auto-corrects current validity from dialect reference before filling mandarin text", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "invalid", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "mandarin",
    text: "诶，身材又好呢。",
    validityReferenceText: "#eh，身材又好哩。",
    validityReferenceTokens: [
      { type: "tag", content: "#eh" },
      { type: "text", content: "，身材又好哩。" },
    ],
    recommendationValidityAutoCorrectEnabled: true,
  });

  assert.equal(result.ok, true);
  assert.match(result.message, /已自动切换为 Valid/);
  assert.match(result.message, /填入普通话顺滑/);
  assert.equal(harness.segmentStates[0].validity, "valid");
  assert.equal(harness.mandarinEditor.textContent, "诶，身材又好呢。");
});

test("CVPC data api cancels current write when validity correction confirm is rejected", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "invalid", dialectText: "旧文本", mandarinText: "" }],
  });
  let confirmCount = 0;
  harness.dependencies.window.confirm = function () {
    confirmCount += 1;
    return false;
  };

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
    recommendationValidityAutoCorrectEnabled: false,
  });

  assert.equal(result.ok, false);
  assert.match(result.message, /已取消本次写入/);
  assert.equal(confirmCount, 1);
  assert.equal(harness.segmentStates[0].validity, "invalid");
  assert.equal(harness.dialectEditor.textContent, "旧文本");
});

test("CVPC data api rejects current recommendation writes when valid and invalid tags conflict", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentRecommendation({
    selectionKey: "sample-a.mp3|0|4171",
    refinedDialectText: "#um<Meaningless>",
    refinedDialectTokens: [
      { type: "tag", content: "#um" },
      { type: "tag", content: "<Meaningless>" },
    ],
    refinedMandarinText: "嗯。",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "标签内容冲突，AI 结果有问题，已停止写入。",
  });
  assert.equal(harness.segmentStates[0].validity, "missing");
  assert.equal(harness.dialectEditor.textContent, "");
});

test("CVPC data api reads dialect field text from modelvalue without tag close noise", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    segmentStates: [
      {
        validity: "missing",
        dialectText: "都七十岁了#eh，明日古稀了。",
        dialectEditorText: "都七十岁了 #eh × ，明日古稀了。",
        dialectModelValue: buildStructuredDialectValue([
          { type: "text", content: "都七十岁了" },
          { type: "single", id: "tag-1", content: "#eh" },
          { type: "text", content: "，明日古稀了。" },
        ]),
        mandarinText: "都七十岁了，明日古稀了。",
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.fieldContext.dialectText, "都七十岁了#eh，明日古稀了。");
  assert.doesNotMatch(context.fieldContext.dialectText, /×/);
});

test("CVPC data api treats empty structured modelvalue as empty dialect text", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    segmentStates: [
      {
        validity: "missing",
        dialectText: "",
        dialectEditorText: "",
        dialectModelValue: "[]",
        mandarinText: "",
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.fieldContext.dialectText, "");
});

test("CVPC data api replays tagged dialect fill through native editor text insertion and page label buttons when available", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
    enableNativeTagReplay: true,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已自动切换为 Valid，并尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。",
  });
  assert.equal(harness.commonLabelButtons["#eh"].clickCount, 1);
  assert.equal(harness.postedWindowMessages.length, 0);
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.equal(structured.length, 3);
  assert.deepEqual(structured[0], { type: "text", content: "都七十岁了" });
  assert.equal(structured[1].type, "single");
  assert.equal(structured[1].content, "#eh");
  assert.deepEqual(structured[2], { type: "text", content: "，明日古稀了。" });
  assert.match(harness.dialectEditor.innerHTML, /data-tag-id=/);
});

test("CVPC data api writes structured dialect tags into current segment field", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已自动切换为 Valid，并尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。",
  });
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.equal(structured.length, 3);
  assert.deepEqual(structured[0], { type: "text", content: "都七十岁了" });
  assert.equal(structured[1].type, "single");
  assert.equal(structured[1].content, "#eh");
  assert.match(String(structured[1].id || ""), /./);
  assert.deepEqual(structured[2], { type: "text", content: "，明日古稀了。" });
  assert.match(harness.dialectEditor.innerHTML, /data-tag-id=/);
});

test("CVPC data api trims tag-adjacent spaces when writing structured dialect tags", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "他请探亲假你又，#ah 他又做他又。",
    tokens: [
      { type: "text", content: "他请探亲假你又，" },
      { type: "tag", content: "#ah" },
      { type: "text", content: " 他又做他又。" },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已自动切换为 Valid，并尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。",
  });
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.deepEqual(structured[0], { type: "text", content: "他请探亲假你又，" });
  assert.equal(structured[1].type, "single");
  assert.equal(structured[1].content, "#ah");
  assert.deepEqual(structured[2], { type: "text", content: "他又做他又。" });
  assert.doesNotMatch(harness.dialectEditor.innerHTML, /#ah<\/span><span class="tag-close[^>]*>×<\/span><\/span>\s+他又/);
});

test("CVPC data api restores structured dialect chips after editor rerender clears the visible content", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [{ validity: "missing", dialectText: "", mandarinText: "" }],
  });
  let scheduledClear = false;
  harness.dialectEditor.addEventListener("input", function () {
    if (scheduledClear) {
      return;
    }
    scheduledClear = true;
    setTimeout(function () {
      harness.dialectEditor.innerHTML = '<p><br class="ProseMirror-trailingBreak"></p>';
    }, 5);
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已自动切换为 Valid，并尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。",
  });
  await new Promise(function (resolve) {
    setTimeout(resolve, 120);
  });
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.equal(structured.length, 3);
  assert.match(harness.dialectEditor.innerHTML, /data-tag-id=/);
  assert.doesNotMatch(
    harness.dialectEditor.innerHTML,
    /^<p><br class="ProseMirror-trailingBreak"><\/p>$/
  );
});

test("CVPC data api requests MAIN-world structured field write before DOM resync", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    visibleEntryName: "sample-a.mp3",
    selectionText: "开始：0 秒 结束：4.171 秒 截取：4.171 秒",
    segmentStates: [
      {
        validity: "missing",
        dialectText: "旧文本",
        dialectEditorText: "旧文本",
        dialectModelValue: buildStructuredDialectValue("旧文本"),
        mandarinText: "",
      },
    ],
  });
  harness.dialectTextareaHost.setAttribute("id", "textarea-test-1");
  let rerenderScheduled = false;
  harness.dependencies.window.postMessage = function (data, origin) {
    harness.postedWindowMessages.push({ data, origin });
    if (!data || data.type !== STRUCTURED_FIELD_WRITE_REQUEST_TYPE) {
      return;
    }
    harness.segmentStates[0].dialectModelValue = data.payload.serializedModelValue;
    setTimeout(function () {
      harness.dispatchWindowMessage({
        source: OBSERVER_SOURCE,
        type: STRUCTURED_FIELD_WRITE_RESPONSE_TYPE,
        requestId: data.requestId,
        payload: {
          ok: true,
          appliedBy: "setupState.modelvalue",
          message: "",
        },
      });
    }, 0);
  };
  harness.dialectEditor.addEventListener("input", function () {
    if (rerenderScheduled) {
      return;
    }
    rerenderScheduled = true;
    setTimeout(function () {
      harness.dialectTextareaHost.setAttribute(
        "modelvalue",
        harness.segmentStates[0].dialectModelValue
      );
      harness.dialectEditor.innerHTML = '<p><br class="ProseMirror-trailingBreak"></p>';
    }, 5);
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillCurrentSegmentField({
    selectionKey: "sample-a.mp3|0|4171",
    targetField: "dialect",
    text: "都七十岁了#eh，明日古稀了。",
    tokens: [
      { type: "text", content: "都七十岁了" },
      { type: "tag", content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(harness.postedWindowMessages.length > 0, true);
  assert.equal(harness.postedWindowMessages[0].data.type, STRUCTURED_FIELD_WRITE_REQUEST_TYPE);
  await new Promise(function (resolve) {
    setTimeout(resolve, 120);
  });
  const structured = JSON.parse(harness.dialectTextareaHost.getAttribute("modelvalue"));
  assert.equal(structured.length, 3);
  assert.equal(structured[1].content, "#eh");
  assert.match(harness.dialectEditor.innerHTML, /data-tag-id=/);
});

test("CVPC data api falls back to live waveform apply when save_increment auth snapshot is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    audioDurationMs: 10000,
    waveformWidth: 1000,
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 3000,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 3000,
        endMs: 6000,
        segmentNumber: 2,
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    sourceSegments: [
      {
        uniqueId: "region-1",
        sourceSegmentNumber: 1,
        startMs: 0,
        endMs: 3000,
      },
      {
        uniqueId: "region-2",
        sourceSegmentNumber: 2,
        startMs: 3000,
        endMs: 6000,
      },
    ],
    changes: [
      {
        sourceUniqueId: "region-1",
        sourceSegmentNumber: 1,
        originalStartMs: 0,
        originalEndMs: 3000,
        reason: "silence>=400ms",
        suggestedSegments: [
          {
            startMs: 0,
            endMs: 1200,
          },
          {
            startMs: 1600,
            endMs: 3000,
          },
        ],
      },
    ],
    proposedSegments: [
      {
        startMs: 0,
        endMs: 1200,
      },
      {
        startMs: 1600,
        endMs: 3000,
      },
      {
        startMs: 3000,
        endMs: 6000,
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    appliedBy: "dom",
    message: "分段建议已写到页面，请人工复核后点击平台保存。",
  });
  assert.equal(harness.splitButton.clickCount, 1);
  assert.equal(
    harness.fetchCalls.some(function (requestUrl) {
      return requestUrl.indexOf("/httpapi/annotation/save_increment") >= 0;
    }),
    false
  );
  assert.deepEqual(harness.getLiveRegions(), [
    {
      uniqueId: "region-1",
      startMs: 0,
      endMs: 1200,
      segmentNumber: 1,
      title: "0:00.000-0:01.200",
    },
    {
      uniqueId: "generated-3",
      startMs: 1600,
      endMs: 3000,
      segmentNumber: 2,
      title: "0:01.600-0:03.000",
    },
    {
      uniqueId: "region-2",
      startMs: 3000,
      endMs: 6000,
      segmentNumber: 3,
      title: "0:03.000-0:06.000",
    },
  ]);
});

test("CVPC data api applies whole-audio preview through save_increment when auth snapshot is available", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    audioDurationMs: 6000,
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 3000,
        segmentNumber: 1,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      {
        template: {
          attrs: [],
          entry_attrs: [
            {
              unique_id: "entry-validity",
              name: "是否有效（Valid or Not）",
              input_type: "radio",
            },
          ],
          moment_attrs: [
            {
              unique_id: "moment-validity",
              name: "是否有效（Valid or Not）",
              input_type: "radio",
            },
            {
              unique_id: "moment-dialect",
              name: "标注文本",
              input_type: "text",
            },
            {
              unique_id: "moment-mandarin",
              name: "普通话顺滑",
              input_type: "text",
            },
          ],
        },
      }
    ),
    annosPayload: [
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "entry-scope",
        ann_scope: "entry",
        ann_data: {
          attrs: [
            {
              unique_id: "entry-validity",
              name: "是否有效（Valid or Not）",
              values: [{ unique_id: "entry-valid", name: "是（Valid）" }],
              input_type: "radio",
            },
          ],
          attr_version: "v1",
        },
        audio_duration: 6,
        section_duration: 3,
        source: "manual",
        status: "valid",
        version: "",
      },
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "region-1",
        ann_scope: "instance",
        start_second: 0,
        end_second: 3,
        ann_data: {
          attrs: [
            {
              unique_id: "moment-validity",
              name: "是否有效（Valid or Not）",
              values: [{ unique_id: "valid-id", name: "是（Valid）" }],
              input_type: "radio",
            },
            {
              unique_id: "moment-dialect",
              name: "标注文本",
              values: ['[{"type":"text","content":"原文本"}]'],
              input_type: "text",
            },
          ],
          attr_version: "v2",
        },
        source: "manual",
        status: "valid",
        track_id: "-1",
        shape: "section",
        camera_name: "camA",
        asr_is_done: 1,
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer test-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );
  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    meta: {
      previewMode: "whole-audio-fallback",
      applyAllowed: false,
    },
    changes: [
      {
        sourceSegmentNumber: 1,
        originalStartMs: 0,
        originalEndMs: 6000,
        suggestedSegments: [
          { startMs: 0, endMs: 1200 },
          { startMs: 1600, endMs: 3000 },
        ],
      },
    ],
    proposedSegments: [
      { startMs: 0, endMs: 1200 },
      { startMs: 1600, endMs: 3000 },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    appliedBy: "request",
    message: "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。",
  });
  assert.equal(harness.splitButton.clickCount, 0);
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  assert.equal(saveRequest.init.headers.authorization, "Bearer test-token");
  assert.equal(saveRequest.init.headers["baker-terminal"], "group@1134");
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.insert.length, 1);
  assert.equal(body.update.length, 2);
  assert.equal(body.delete.length, 0);
  assert.equal(body.project_id, "1453");
  assert.equal(body.task_id, "12099");
  assert.equal(body.process_id, "4946");
  assert.equal(body.job_id, "1520");
  assert.equal(body.data_id, "17896");
  assert.equal(body.update[0].unique_id, "region-1");
  assert.equal(body.update[0].start_second, 0);
  assert.equal(body.update[0].end_second, 1.2);
  assert.equal(body.insert[0].start_second, 1.6);
  assert.equal(body.insert[0].end_second, 3);
  const snapshot = JSON.parse(body.web_snapshot);
  assert.equal(snapshot.length, 3);
  assert.deepEqual(snapshot[0].ann_data.attrs, [
    { unique_id: "moment-validity", value: "valid-id" },
    { unique_id: "moment-dialect", value: '[{"type":"text","content":"原文本"}]' },
    { unique_id: "moment-mandarin", value: "" },
  ]);
  assert.deepEqual(snapshot[1].ann_data.attrs, [
    { unique_id: "moment-validity", value: "valid-id" },
    { unique_id: "moment-dialect", value: "" },
    { unique_id: "moment-mandarin", value: "" },
  ]);
});

test("CVPC data api whole-audio entry-only save body keeps generated unique_id values unique and avoids existing annos ids", async function () {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const originalDateNow = Date.now;
  const repeatedBytes = Uint8Array.from([
    0xde, 0xad, 0xbe, 0xef, 0x50, 0x75, 0x18, 0x90, 0xad, 0xae, 0x9f, 0xbe, 0xc9, 0x33, 0xf3, 0x33,
  ]);
  let fakeNow = 1781023383787;
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: function (target) {
        target.set(repeatedBytes.slice(0, target.length));
        return target;
      },
    },
  });
  Date.now = function () {
    const nextValue = fakeNow;
    fakeNow += 1;
    return nextValue;
  };

  try {
    const existingEntryUniqueId = "deadbeef-5075-1890-adae-9fbec933f333-1781023383787";
    const dataApiModule = loadDataApiModule();
    const harness = createSegmentApplyHarness({
      visibleEntryName: "sample-a.mp3",
      audioDurationMs: 6000,
      regions: [],
      metaPayload: createMetaPayload(
        [
          {
            entry_id: 1,
            entry_index: 1,
            name: "sample-a.mp3",
            content: "databaker/data/sample-a.mp3",
          },
        ],
        {
          template: {
            attrs: [],
            entry_attrs: [],
            moment_attrs: [],
          },
        }
      ),
      annosPayload: [
        {
          entry_index: 1,
          entry_id: 1,
          unique_id: existingEntryUniqueId,
          ann_scope: "entry",
          ann_data: {
            attrs: [],
            attr_version: "v1",
          },
          audio_duration: 6,
          section_duration: 0,
          source: "manual",
          status: "valid",
          version: "",
        },
      ],
    });

    const runtime = dataApiModule.createRuntime(harness.dependencies);
    harness.dispatchObserverMessage(
      {
        headers: {
          authorization: "Bearer test-token",
          "baker-terminal": "group@1134",
          "baker-lang": "zh",
        },
        path: "/httpapi/annotation/annos",
        at: Date.now(),
      },
      AUTH_TYPE
    );

    const result = await runtime.applySegmentPreview({
      selectionKey: "sample-a.mp3|0|4171",
      selectedEntryName: "sample-a.mp3",
      meta: {
        previewMode: "whole-audio-fallback",
        applyAllowed: false,
      },
      proposedSegments: [
        { startMs: 0, endMs: 1200 },
        { startMs: 1600, endMs: 3000 },
        { startMs: 3400, endMs: 6000 },
      ],
    });

    assert.deepEqual(result, {
      ok: true,
      appliedBy: "request",
      message: "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。",
    });
    const saveRequest = harness.fetchRequests.find(function (request) {
      return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
    });
    assert.ok(saveRequest);
    const body = JSON.parse(saveRequest.init.body);
    assert.equal(body.update.length, 1);
    assert.equal(body.insert.length, 3);
    assert.equal(body.delete.length, 0);
    const insertedUniqueIds = body.insert.map(function (row) {
      return row.unique_id;
    });
    assert.equal(new Set(insertedUniqueIds).size, 3);
    assert.equal(insertedUniqueIds.some(function (value) {
      return value === existingEntryUniqueId;
    }), false);
    const snapshotIds = JSON.parse(body.web_snapshot).map(function (row) {
      return row.unique_id;
    });
    assert.equal(snapshotIds.length, 4);
    assert.equal(new Set(snapshotIds).size, 4);
  } finally {
    Date.now = originalDateNow;
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalCryptoDescriptor);
    } else {
      delete globalThis.crypto;
    }
  }
});

test("CVPC data api rejects duplicate unique_id payload before sending save_increment", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    audioDurationMs: 3000,
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 3000,
        segmentNumber: 1,
      },
    ],
    annosPayload: [
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "region-1",
        ann_scope: "entry",
        ann_data: {
          attrs: [],
          attr_version: "v1",
        },
        audio_duration: 3,
        section_duration: 3,
        source: "manual",
        status: "valid",
        version: "",
      },
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "region-1",
        ann_scope: "instance",
        start_second: 0,
        end_second: 3,
        ann_data: {
          attrs: [],
          attr_version: "v1",
        },
        source: "manual",
        status: "valid",
        track_id: "-1",
        shape: "section",
        camera_name: "camA",
        asr_is_done: 1,
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer test-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    meta: {
      previewMode: "whole-audio-fallback",
      applyAllowed: false,
    },
    proposedSegments: [{ startMs: 0, endMs: 1200 }],
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前分段建议生成了重复 unique_id，已停止自动应用，请重新生成或人工处理。",
  });
  assert.equal(
    harness.fetchRequests.some(function (request) {
      return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
    }),
    false
  );
});

test("CVPC data api surfaces platform unique_id duplication failures without DOM fallback", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    audioDurationMs: 3000,
    saveIncrementStatus: 400,
    saveIncrementPayload: {
      code: 400,
      msg: "unique_id重复",
    },
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer test-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    meta: {
      previewMode: "whole-audio-fallback",
      applyAllowed: false,
    },
    proposedSegments: [{ startMs: 0, endMs: 1200 }],
  });

  assert.deepEqual(result, {
    ok: false,
    message:
      "平台保存接口返回 unique_id重复；这通常表示平台当前分段状态与本次直写保存体冲突，分段建议已保留，请刷新页面后重新生成或人工处理。",
  });
});

test("CVPC data api binds window.fetch before save_increment direct apply", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    audioDurationMs: 6000,
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 3000,
        segmentNumber: 1,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      {
        template: {
          attrs: [],
          entry_attrs: [
            {
              unique_id: "entry-validity",
              name: "是否有效（Valid or Not）",
              input_type: "radio",
            },
          ],
          moment_attrs: [
            {
              unique_id: "moment-validity",
              name: "是否有效（Valid or Not）",
              input_type: "radio",
            },
          ],
        },
      }
    ),
    annosPayload: [
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "entry-scope",
        ann_scope: "entry",
        ann_data: {
          attrs: [
            {
              unique_id: "entry-validity",
              name: "是否有效（Valid or Not）",
              values: [{ unique_id: "entry-valid", name: "是（Valid）" }],
              input_type: "radio",
            },
          ],
          attr_version: "v1",
        },
        audio_duration: 6,
        section_duration: 3,
        source: "manual",
        status: "valid",
        version: "",
      },
      {
        entry_index: 1,
        entry_id: 1,
        unique_id: "region-1",
        ann_scope: "instance",
        start_second: 0,
        end_second: 3,
        ann_data: {
          attrs: [
            {
              unique_id: "moment-validity",
              name: "是否有效（Valid or Not）",
              values: [{ unique_id: "valid-id", name: "是（Valid）" }],
              input_type: "radio",
            },
          ],
          attr_version: "v2",
        },
        source: "manual",
        status: "valid",
        track_id: "-1",
        shape: "section",
        camera_name: "camA",
        asr_is_done: 1,
      },
    ],
  });

  const originalFetch = harness.dependencies.fetch;
  const originalWindow = harness.dependencies.window;
  const windowLike = {
    addEventListener: originalWindow.addEventListener,
    removeEventListener: originalWindow.removeEventListener,
  };
  windowLike.fetch = async function (url, init) {
    if (this !== undefined && this !== windowLike) {
      throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
    }
    return originalFetch(url, init);
  };

  const runtime = dataApiModule.createRuntime(
    Object.assign({}, harness.dependencies, {
      window: windowLike,
      fetch: windowLike.fetch,
    })
  );
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer test-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    meta: {
      previewMode: "whole-audio-fallback",
      applyAllowed: false,
    },
    changes: [
      {
        sourceSegmentNumber: 1,
        originalStartMs: 0,
        originalEndMs: 3000,
        suggestedSegments: [{ startMs: 0, endMs: 1200 }],
      },
    ],
    proposedSegments: [{ startMs: 0, endMs: 1200 }],
  });

  assert.deepEqual(result, {
    ok: true,
    appliedBy: "request",
    message: "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。",
  });
});

test("CVPC data api rejects stale segment preview when current selection has changed", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.setSelectionText("开始：1 秒 结束：4.171 秒 截取：3.171 秒");
  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    sourceSegments: [
      {
        uniqueId: "region-1",
        sourceSegmentNumber: 1,
        startMs: 0,
        endMs: 3000,
      },
    ],
    changes: [
      {
        sourceUniqueId: "region-1",
        sourceSegmentNumber: 1,
        originalStartMs: 0,
        originalEndMs: 3000,
        reason: "silence>=400ms",
        suggestedSegments: [
          {
            startMs: 0,
            endMs: 1200,
          },
          {
            startMs: 1600,
            endMs: 3000,
          },
        ],
      },
    ],
    proposedSegments: [
      {
        startMs: 0,
        endMs: 1200,
      },
      {
        startMs: 1600,
        endMs: 3000,
      },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前音频或段选择已变化，旧分段建议已失效，请重新生成。",
  });
});

test("CVPC data api fails closed when live waveform no longer matches the preview snapshot", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 2800,
        segmentNumber: 1,
      },
    ],
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.applySegmentPreview({
    selectionKey: "sample-a.mp3|0|4171",
    selectedEntryName: "sample-a.mp3",
    sourceSegments: [
      {
        uniqueId: "region-1",
        sourceSegmentNumber: 1,
        startMs: 0,
        endMs: 3000,
      },
    ],
    changes: [
      {
        sourceUniqueId: "region-1",
        sourceSegmentNumber: 1,
        originalStartMs: 0,
        originalEndMs: 3000,
        reason: "silence>=400ms",
        suggestedSegments: [
          {
            startMs: 0,
            endMs: 1200,
          },
          {
            startMs: 1600,
            endMs: 3000,
          },
        ],
      },
    ],
    proposedSegments: [
      {
        startMs: 0,
        endMs: 1200,
      },
      {
        startMs: 1600,
        endMs: 3000,
      },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前页面分段状态已变化，旧分段建议已失效，请重新生成。",
  });
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
    processedIndexes: [],
  });
  assert.equal(harness.validLabel.clickCount, 0);
});

test("CVPC data api fillAllValid writes missing validity attrs through save_increment and preserves existing invalid rows", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const annosPayload = createBatchTextAnnosPayload([
    {
      uniqueId: "region-1",
      startMs: 0,
      endMs: 1200,
      dialectText: "缺失段一柳州话",
      mandarinText: "缺失段一普通话",
      validity: "valid",
    },
    {
      uniqueId: "region-2",
      startMs: 1500,
      endMs: 2600,
      dialectText: "无意义",
      mandarinText: "",
      validity: "invalid",
    },
    {
      uniqueId: "region-3",
      startMs: 3000,
      endMs: 4200,
      dialectText: "已填有效柳州话",
      mandarinText: "已填有效普通话",
      validity: "valid",
    },
    {
      uniqueId: "region-4",
      startMs: 4500,
      endMs: 5400,
      dialectText: "缺失段四柳州话",
      mandarinText: "缺失段四普通话",
      validity: "valid",
    },
  ]);
  annosPayload[1].ann_data.attrs = annosPayload[1].ann_data.attrs.filter(function (attr) {
    return attr.name !== "是否有效（Valid or Not）";
  });
  annosPayload[2].ann_data.attrs.push(annosPayload[2].ann_data.attrs.shift());
  annosPayload[4].ann_data.attrs.push(annosPayload[4].ann_data.attrs.shift());

  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
      {
        uniqueId: "region-3",
        startMs: 3000,
        endMs: 4200,
        segmentNumber: 3,
      },
      {
        uniqueId: "region-4",
        startMs: 4500,
        endMs: 5400,
        segmentNumber: 4,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: annosPayload,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer fill-valid-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );
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
    processedIndexes: [1, 4],
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  assert.equal(saveRequest.init.headers.authorization, "Bearer fill-valid-token");
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.insert.length, 0);
  assert.equal(body.delete.length, 0);
  assert.equal(body.update.length, 2);
  assert.deepEqual(
    body.update.map(function (row) {
      return row.unique_id;
    }),
    ["region-1", "region-4"]
  );
  assert.deepEqual(body.update[0].ann_data.attrs, [
    {
      unique_id: "moment-validity",
      name: "是否有效（Valid or Not）",
      values: [{ unique_id: "valid-id", name: "是（Valid）" }],
      input_type: "radio",
    },
    {
      unique_id: "moment-dialect",
      name: "标注文本",
      values: ['[{"type":"text","content":"缺失段一柳州话"}]'],
      input_type: "text",
    },
    {
      unique_id: "moment-mandarin",
      name: "普通话顺滑",
      values: ["缺失段一普通话"],
      input_type: "text",
    },
  ]);
  body.update.forEach(function (row) {
    assert.equal(row.ann_data.attrs[0].unique_id, "moment-validity");
  });
  const snapshot = JSON.parse(body.web_snapshot);
  const updatedSnapshotRow = snapshot.find(function (row) {
    return row.unique_id === "region-1";
  });
  assert.deepEqual(updatedSnapshotRow.ann_data.attrs, [
    { unique_id: "moment-validity", value: "valid-id" },
    { unique_id: "moment-dialect", value: '[{"type":"text","content":"缺失段一柳州话"}]' },
    { unique_id: "moment-mandarin", value: "缺失段一普通话" },
  ]);
  const invalidSnapshotRow = snapshot.find(function (row) {
    return row.unique_id === "region-2";
  });
  assert.deepEqual(invalidSnapshotRow.ann_data.attrs, [
    { unique_id: "moment-validity", value: "invalid-id" },
    { unique_id: "moment-dialect", value: '[{"type":"text","content":"无意义"}]' },
    { unique_id: "moment-mandarin", value: "" },
  ]);
});

test("CVPC data api fillAllValid fails closed when auth snapshot is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const annosPayload = createBatchTextAnnosPayload([
    {
      uniqueId: "region-1",
      startMs: 0,
      endMs: 1200,
      dialectText: "未填写一",
      mandarinText: "未填写一普通话",
      validity: "valid",
    },
    {
      uniqueId: "region-2",
      startMs: 1500,
      endMs: 2600,
      dialectText: "已填有效",
      mandarinText: "已填有效普通话",
      validity: "valid",
    },
    {
      uniqueId: "region-3",
      startMs: 3000,
      endMs: 4200,
      dialectText: "未填写三",
      mandarinText: "未填写三普通话",
      validity: "valid",
    },
  ]);
  annosPayload[1].ann_data.attrs = annosPayload[1].ann_data.attrs.filter(function (attr) {
    return attr.name !== "是否有效（Valid or Not）";
  });
  annosPayload[3].ann_data.attrs = annosPayload[3].ann_data.attrs.filter(function (attr) {
    return attr.name !== "是否有效（Valid or Not）";
  });

  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
      {
        uniqueId: "region-3",
        startMs: 3000,
        endMs: 4200,
        segmentNumber: 3,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: annosPayload,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.fillUnresolvedSegmentsValid();

  assert.deepEqual(result, {
    ok: false,
    message: "未获取到平台保存请求的访问凭据，已停止补写。当前音频共 3 段：已填 Valid 1 段，已填 Invalid 0 段，未填写 2 段。",
    filledCount: 0,
    stats: {
      total: 3,
      valid: 1,
      invalid: 0,
      missing: 2,
    },
    processedIndexes: [],
  });
  assert.equal(
    harness.fetchRequests.some(function (request) {
      return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
    }),
    false
  );
});

test("CVPC data api fillAllValid surfaces platform save failures without DOM fallback", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const annosPayload = createBatchTextAnnosPayload([
    {
      uniqueId: "region-1",
      startMs: 0,
      endMs: 1200,
      dialectText: "未填写一",
      mandarinText: "未填写一普通话",
      validity: "valid",
    },
    {
      uniqueId: "region-2",
      startMs: 1500,
      endMs: 2600,
      dialectText: "已填有效",
      mandarinText: "已填有效普通话",
      validity: "valid",
    },
  ]);
  annosPayload[1].ann_data.attrs = annosPayload[1].ann_data.attrs.filter(function (attr) {
    return attr.name !== "是否有效（Valid or Not）";
  });

  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: annosPayload,
    saveIncrementStatus: 500,
    saveIncrementPayload: {
      code: 500,
      msg: "平台保存失败",
    },
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer fill-valid-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );
  const result = await runtime.fillUnresolvedSegmentsValid();

  assert.deepEqual(result, {
    ok: false,
    message: "平台保存失败。当前音频共 2 段：已填 Valid 1 段，已填 Invalid 0 段，未填写 1 段。",
    filledCount: 0,
    stats: {
      total: 2,
      valid: 1,
      invalid: 0,
      missing: 1,
    },
    processedIndexes: [],
  });
  assert.equal(
    harness.fetchRequests.filter(function (request) {
      return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
    }).length,
    1
  );
});

test("CVPC data api getBatchSegments parses range selections and keeps stable segment metadata", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 900,
        dialectText: "第一段柳州话",
        mandarinText: "第一段普通话",
      },
      {
        uniqueId: "region-2",
        startMs: 1000,
        endMs: 2200,
        dialectText: "第二段柳州话",
        mandarinText: "第二段普通话",
      },
      {
        uniqueId: "region-3",
        startMs: 2500,
        endMs: 3800,
        dialectText: "第三段柳州话",
        mandarinText: "第三段普通话",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.getBatchSegments("2-3,2");

  assert.equal(result.totalSegments, 3);
  assert.equal(result.normalizedSelectionSpec, "2,3");
  assert.deepEqual(
    result.segments.map(function (segment) {
      return segment.segmentNumber;
    }),
    [2, 3]
  );
  assert.equal(result.segments[0].uniqueId, "region-2");
  assert.equal(result.segments[0].dialectText, "第二段柳州话");
  assert.equal(result.segments[0].mandarinText, "第二段普通话");
  assert.equal(result.segments[0].selectionKey, "sample-a.mp3|1000|2200");
  assert.equal(result.segments[1].uniqueId, "region-3");
});

test("CVPC data api applyBatchTextRecommendations only updates successful segments through save_increment", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
      {
        uniqueId: "region-3",
        startMs: 3000,
        endMs: 4200,
        segmentNumber: 3,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        dialectText: "原始2",
        mandarinText: "普通2",
      },
      {
        uniqueId: "region-3",
        startMs: 3000,
        endMs: 4200,
        dialectText: "原始3",
        mandarinText: "普通3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 3,
    results: [
      {
        uniqueId: "region-2",
        segmentNumber: 2,
        selectionKey: "sample-a.mp3|1500|2600",
        dialectText: "批量柳州话",
        mandarinText: "批量普通话",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  assert.equal(saveRequest.init.headers.authorization, "Bearer batch-token");
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.insert.length, 0);
  assert.equal(body.delete.length, 0);
  assert.equal(body.update.length, 1);
  assert.equal(body.update[0].unique_id, "region-2");
  const snapshot = JSON.parse(body.web_snapshot);
  assert.equal(snapshot.length, 4);
  const updatedSnapshotRow = snapshot.find(function (row) {
    return row.unique_id === "region-2";
  });
  assert.deepEqual(updatedSnapshotRow.ann_data.attrs, [
    { unique_id: "moment-validity", value: "valid-id" },
    { unique_id: "moment-dialect", value: '[{"type":"text","content":"批量柳州话"}]' },
    { unique_id: "moment-mandarin", value: "批量普通话" },
  ]);
});

test("CVPC data api applyBatchTextRecommendations writes structured dialect tag payloads", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 1,
    results: [
      {
        uniqueId: "region-1",
        segmentNumber: 1,
        selectionKey: "sample-a.mp3|0|1200",
        dialectText: "都七十岁了#eh，明日古稀了。",
        dialectTokens: [
          { type: "text", content: "都七十岁了" },
          { type: "tag", content: "#eh" },
          { type: "text", content: "，明日古稀了。" },
        ],
        mandarinText: "都七十岁了，明日古稀了。",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  const snapshot = JSON.parse(body.web_snapshot);
  const updatedSnapshotRow = snapshot.find(function (row) {
    return row.unique_id === "region-1";
  });
  assert.deepEqual(
    JSON.parse(
      updatedSnapshotRow.ann_data.attrs.find(function (attr) {
        return attr.unique_id === "moment-dialect";
      }).value
    ),
    [
      { type: "text", content: "都七十岁了" },
      { type: "single", id: JSON.parse(updatedSnapshotRow.ann_data.attrs.find(function (attr) { return attr.unique_id === "moment-dialect"; }).value)[1].id, content: "#eh" },
      { type: "text", content: "，明日古稀了。" },
    ]
  );
});

test("CVPC data api applyBatchTextRecommendations writes Meaningless invalid preset for standalone particle results", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
        validity: "valid",
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        dialectText: "原始2",
        mandarinText: "普通2",
        validity: "invalid",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 2,
    results: [
      {
        uniqueId: "region-1",
        segmentNumber: 1,
        selectionKey: "sample-a.mp3|0|1200",
        dialectText: "<Meaningless>",
        dialectTokens: [{ type: "tag", content: "<Meaningless>" }],
        mandarinText: "",
        validity: "invalid",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  const snapshot = JSON.parse(body.web_snapshot);
  const updatedSnapshotRow = snapshot.find(function (row) {
    return row.unique_id === "region-1";
  });
  assert.deepEqual(updatedSnapshotRow.ann_data.attrs, [
    { unique_id: "moment-validity", value: "invalid-id" },
    {
      unique_id: "moment-dialect",
      value: JSON.stringify([
        {
          type: "single",
          id: JSON.parse(
            updatedSnapshotRow.ann_data.attrs.find(function (attr) {
              return attr.unique_id === "moment-dialect";
            }).value
          )[0].id,
          content: "<Meaningless>",
        },
      ]),
    },
    { unique_id: "moment-mandarin", value: "" },
  ]);
});

test("CVPC data api applyBatchTextRecommendations skips conflict-tag segments and still saves the rest", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
        validity: "valid",
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        dialectText: "原始2",
        mandarinText: "普通2",
        validity: "valid",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 2,
    results: [
      {
        uniqueId: "region-1",
        segmentNumber: 1,
        selectionKey: "sample-a.mp3|0|1200",
        dialectText: "#um<Meaningless>",
        dialectTokens: [
          { type: "tag", content: "#um" },
          { type: "tag", content: "<Meaningless>" },
        ],
        mandarinText: "嗯。",
      },
      {
        uniqueId: "region-2",
        segmentNumber: 2,
        selectionKey: "sample-a.mp3|1500|2600",
        dialectText: "都七十岁了#eh，明日古稀了。",
        dialectTokens: [
          { type: "text", content: "都七十岁了" },
          { type: "tag", content: "#eh" },
          { type: "text", content: "，明日古稀了。" },
        ],
        mandarinText: "诶，明日古稀了。",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.savedCount, 1);
  assert.match(result.message, /跳过 1 段标签内容冲突结果/);
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.update.length, 1);
  assert.equal(body.update[0].unique_id, "region-2");
});

test("CVPC data api applyBatchTextRecommendations still saves when latest rows keep ranges but unique ids differ", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "latest-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "latest-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
      {
        uniqueId: "latest-3",
        startMs: 3000,
        endMs: 4200,
        segmentNumber: 3,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "latest-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
      },
      {
        uniqueId: "latest-2",
        startMs: 1500,
        endMs: 2600,
        dialectText: "原始2",
        mandarinText: "普通2",
      },
      {
        uniqueId: "latest-3",
        startMs: 3000,
        endMs: 4200,
        dialectText: "原始3",
        mandarinText: "普通3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 3,
    expectedUniqueIds: ["old-1", "old-2", "old-3"],
    results: [
      {
        uniqueId: "old-2",
        segmentNumber: 2,
        selectionKey: "sample-a.mp3|1500|2600",
        dialectText: "批量柳州话",
        mandarinText: "批量普通话",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.update[0].unique_id, "latest-2");
});

test("CVPC data api applyBatchTextRecommendations reuses text attr descriptors from sibling rows", async function () {
  const dataApiModule = loadDataApiModule();
  const template = {
    attrs: [],
    entry_attrs: [],
    moment_attrs: [],
  };
  const annosPayload = createBatchTextAnnosPayload([
    {
      uniqueId: "region-1",
      startMs: 0,
      endMs: 1200,
      dialectText: "原始1",
      mandarinText: "普通1",
    },
    {
      uniqueId: "region-2",
      startMs: 1500,
      endMs: 2600,
      dialectText: "",
      mandarinText: "",
    },
  ]);
  annosPayload[2].ann_data.attrs = [
    {
      unique_id: "moment-validity",
      name: "是否有效（Valid or Not）",
      values: [{ unique_id: "valid-id", name: "是（Valid）" }],
      input_type: "radio",
    },
  ];

  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 1500,
        endMs: 2600,
        segmentNumber: 2,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: annosPayload,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 2,
    results: [
      {
        uniqueId: "region-2",
        segmentNumber: 2,
        selectionKey: "sample-a.mp3|1500|2600",
        dialectText: "补写柳州话",
        mandarinText: "补写普通话",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.update[0].unique_id, "region-2");
  assert.deepEqual(body.update[0].ann_data.attrs, [
    {
      unique_id: "moment-validity",
      name: "是否有效（Valid or Not）",
      values: [{ unique_id: "valid-id", name: "是（Valid）" }],
      input_type: "radio",
    },
    {
      unique_id: "moment-dialect",
      name: "标注文本",
      input_type: "text",
      values: ['[{"type":"text","content":"补写柳州话"}]'],
    },
    {
      unique_id: "moment-mandarin",
      name: "普通话顺滑",
      input_type: "text",
      values: ["补写普通话"],
    },
  ]);
});

test("CVPC data api applyBatchTextRecommendations falls back to known text attrs when every segment is blank", async function () {
  const dataApiModule = loadDataApiModule();
  const template = {
    attrs: [],
    entry_attrs: [],
    moment_attrs: [],
  };
  const annosPayload = [
    {
      entry_index: 1,
      entry_id: 1,
      unique_id: "region-1",
      ann_scope: "instance",
      start_second: 9.18322163714696,
      end_second: 10.000498643689165,
      ann_data: {
        attrs: [
          {
            unique_id: "3f6ceb6b-b1ab-4cdb-aaea-f6910c41e70b",
            name: "是否有效（Valid or Not）",
            values: [{ unique_id: "7afb0829-9777-490a-8ce0-3b03de021ff3", name: "是（Valid）" }],
            input_type: "radio",
          },
        ],
        attr_version: "v1",
      },
      source: "manual",
      status: "valid",
      track_id: "-1",
      shape: "section",
      camera_name: "cam1",
      asr_is_done: 1,
      is_update_position: 0,
      is_update_labelattr: 1,
    },
    {
      entry_index: 1,
      entry_id: 1,
      unique_id: "region-2",
      ann_scope: "instance",
      start_second: 10.52058401148875,
      end_second: 12.957555449178235,
      ann_data: {
        attrs: [
          {
            unique_id: "3f6ceb6b-b1ab-4cdb-aaea-f6910c41e70b",
            name: "是否有效（Valid or Not）",
            values: [{ unique_id: "7afb0829-9777-490a-8ce0-3b03de021ff3", name: "是（Valid）" }],
            input_type: "radio",
          },
        ],
        attr_version: "v1",
      },
      source: "manual",
      status: "valid",
      track_id: "-1",
      shape: "section",
      camera_name: "cam2",
      asr_is_done: 1,
      is_update_position: 0,
      is_update_labelattr: 1,
    },
    {
      entry_index: 1,
      entry_id: 1,
      unique_id: "entry-scope",
      ann_scope: "entry",
      ann_data: {
        attrs: [],
        attr_version: "v1",
      },
      source: "manual",
      status: "valid",
    },
  ];

  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 9183,
        endMs: 10000,
        segmentNumber: 1,
      },
      {
        uniqueId: "region-2",
        startMs: 10521,
        endMs: 12958,
        segmentNumber: 2,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: annosPayload,
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage(
    {
      headers: {
        authorization: "Bearer batch-token",
        "baker-terminal": "group@1134",
        "baker-lang": "zh",
      },
      path: "/httpapi/annotation/annos",
      at: Date.now(),
    },
    AUTH_TYPE
  );

  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 2,
    results: [
      {
        uniqueId: "region-1",
        segmentNumber: 1,
        selectionKey: "sample-a.mp3|9183|10000",
        dialectText: "走路望望。",
        mandarinText: "走路看看。",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: true,
    savedCount: 1,
    message: "已通过平台保存接口写回 1 段批量识别结果，页面即将刷新。",
  });
  const saveRequest = harness.fetchRequests.find(function (request) {
    return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
  });
  assert.ok(saveRequest);
  const body = JSON.parse(saveRequest.init.body);
  assert.equal(body.update[0].unique_id, "region-1");
  assert.deepEqual(body.update[0].ann_data.attrs, [
    {
      unique_id: "3f6ceb6b-b1ab-4cdb-aaea-f6910c41e70b",
      name: "是否有效（Valid or Not）",
      values: [{ unique_id: "7afb0829-9777-490a-8ce0-3b03de021ff3", name: "是（Valid）" }],
      input_type: "radio",
    },
    {
      unique_id: "e274c2ef-0cf1-4ffd-89a9-b5ed1956f1b0",
      name: "标注文本",
      input_type: "text",
      values: ['[{"type":"text","content":"走路望望。"}]'],
    },
    {
      unique_id: "aa56b471-439c-40c8-a312-ffed964d20ad",
      name: "普通话顺滑",
      input_type: "text",
      values: ["走路看看。"],
    },
  ]);
});

test("CVPC data api applyBatchTextRecommendations fails closed when auth snapshot is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const template = createBatchMomentTemplate();
  const harness = createSegmentApplyHarness({
    visibleEntryName: "sample-a.mp3",
    regions: [
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        segmentNumber: 1,
      },
    ],
    metaPayload: createMetaPayload(
      [
        {
          entry_id: 1,
          entry_index: 1,
          name: "sample-a.mp3",
          content: "databaker/data/sample-a.mp3",
        },
      ],
      { template: template }
    ),
    annosPayload: createBatchTextAnnosPayload([
      {
        uniqueId: "region-1",
        startMs: 0,
        endMs: 1200,
        dialectText: "原始1",
        mandarinText: "普通1",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const result = await runtime.applyBatchTextRecommendations({
    selectedEntryName: "sample-a.mp3",
    expectedSegmentCount: 1,
    results: [
      {
        uniqueId: "region-1",
        segmentNumber: 1,
        selectionKey: "sample-a.mp3|0|1200",
        dialectText: "批量柳州话",
        mandarinText: "批量普通话",
      },
    ],
  });

  assert.deepEqual(result, {
    ok: false,
    message: "未获取到平台保存请求的访问凭据，已停止批量写回。",
  });
  assert.equal(
    harness.fetchRequests.some(function (request) {
      return request.url.indexOf("/httpapi/annotation/save_increment") >= 0;
    }),
    false
  );
});

test("CVPC data api applyCommonLabel clicks enabled common label button by exact text", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    commonLabels: ["<SPK/>", "#um"],
  });
  const runtime = dataApiModule.createRuntime(harness.dependencies);

  const result = await runtime.applyCommonLabel("<SPK/>");

  assert.deepEqual(result, {
    ok: true,
    message: "已点击标签按钮：<SPK/>。",
  });
  assert.equal(harness.commonLabelButtons["<SPK/>"].clickCount, 1);
  assert.equal(harness.commonLabelButtons["#um"].clickCount, 0);
});

test("CVPC data api applyCommonLabel fails when matched button is disabled", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    commonLabels: ["<Silence>"],
    disabledCommonLabels: ["<Silence>"],
  });
  const runtime = dataApiModule.createRuntime(harness.dependencies);

  const result = await runtime.applyCommonLabel("<Silence>");

  assert.deepEqual(result, {
    ok: false,
    message: "当前标签按钮不可用：<Silence>。",
  });
  assert.equal(harness.commonLabelButtons["<Silence>"].clickCount, 0);
});

test("CVPC data api applyCommonLabel fails when target label button is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createInteractiveDataApiHarness({
    commonLabels: ["<SPK/>"],
  });
  const runtime = dataApiModule.createRuntime(harness.dependencies);

  const result = await runtime.applyCommonLabel("<Meaningless>");

  assert.deepEqual(result, {
    ok: false,
    message: "未找到标签按钮：<Meaningless>。",
  });
});
