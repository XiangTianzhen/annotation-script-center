"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo("extension", "sites", "bytedance-aidp", "taizhou-helper", "data-api.js");
const OBSERVER_SOURCE = "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER";
const RECEIVE_TYPE = "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT";
const SUBMIT_TYPE = "BYTEDANCE_AIDP_SUBMIT_SNAPSHOT";
const SEARCH_ITEM_TYPE = "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT";

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouDataApi;
  return require(modulePath);
}

function createFakeWindow() {
  const listeners = new Map();
  return {
    addEventListener: function (type, listener) {
      listeners.set(String(type || ""), listener);
    },
    removeEventListener: function (type, listener) {
      const key = String(type || "");
      if (listeners.get(key) === listener) {
        listeners.delete(key);
      }
    },
    emitMessage: function (data, origin) {
      const listener = listeners.get("message");
      if (!listener) {
        throw new Error("message listener not installed");
      }
      listener({
        origin: origin || "https://aidp.bytedance.com",
        data,
      });
    },
  };
}

class FakeElement {
  constructor(options) {
    const source = options || {};
    this.nodeType = 1;
    this.tagName = String(source.tagName || "div").toUpperCase();
    this.className = String(source.className || "");
    this.children = [];
    this.parentElement = null;
    this.parentNode = null;
    this.ownerDocument = null;
    this.value = source.value !== undefined ? String(source.value) : "";
    this._listeners = new Map();
    this._attrs = new Map();
    this._text = String(source.text || "");
    Object.entries(source.attributes || {}).forEach(([name, value]) => {
      this.setAttribute(name, value);
    });
    (source.children || []).forEach((child) => {
      this.appendChild(child);
    });
  }

  appendChild(child) {
    child.parentElement = this;
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    child.parentElement = null;
    child.parentNode = null;
    return child;
  }

  addEventListener(type, listener) {
    this._listeners.set(String(type || ""), listener);
  }

  dispatchEvent(event) {
    const listener = this._listeners.get(String(event?.type || ""));
    if (typeof listener === "function") {
      listener.call(this, event);
    }
    return true;
  }

  focus() {
    if (this.ownerDocument) {
      this.ownerDocument.activeElement = this;
    }
  }

  blur() {
    if (this.ownerDocument && this.ownerDocument.activeElement === this) {
      this.ownerDocument.activeElement = null;
    }
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

  matches(selector) {
    return String(selector || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => {
        if (item.startsWith(".")) {
          return String(this.className || "")
            .split(/\s+/)
            .filter(Boolean)
            .includes(item.slice(1));
        }
        const attrMatch = item.match(/^\[([^=\]]+)=['"](.+)['"]\]$/);
        if (attrMatch) {
          return String(this.getAttribute(attrMatch[1]) || "") === attrMatch[2];
        }
        return String(this.tagName || "").toLowerCase() === item.toLowerCase();
      });
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

  get textContent() {
    return this._text + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._text = String(value || "");
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
    const element = new FakeElement({ tagName: tagName });
    element.ownerDocument = documentNode;
    return element;
  };
  return documentNode;
}

function createAidpSegmentTableRow(segmentNumber, value) {
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
            value: value || "",
          }),
        ],
      }),
      new FakeElement({
        tagName: "td",
        children: [new FakeElement({ tagName: "select" })],
      }),
    ],
  });
}

function createAidpArcoVirtualRow(segmentNumber, value) {
  return new FakeElement({
    tagName: "div",
    className: "arco-table-tr",
    attributes: {
      "data-neeko-table-row-key": "region_" + String(segmentNumber),
    },
    children: [
      new FakeElement({
        tagName: "div",
        className: "arco-table-td arco-table-col-fixed-left arco-table-col-fixed-left-last",
        children: [
          new FakeElement({
            tagName: "div",
            className: "arco-table-cell",
            children: [
              new FakeElement({
                tagName: "span",
                text: String(segmentNumber),
              }),
            ],
          }),
        ],
      }),
      new FakeElement({
        tagName: "div",
        className: "arco-table-td",
        children: [
          new FakeElement({
            tagName: "div",
            className: "arco-table-cell",
            children: [
              new FakeElement({
                tagName: "textarea",
                className: "arco-textarea neeko-input-textarea",
                value: value || "",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createBaseReceivePayload(regionOverrides) {
  const regions = Array.isArray(regionOverrides)
    ? regionOverrides
    : [
        {
          no: 1,
          id: "region_a",
          start: 1.307281,
          end: 3.023912,
          disabled: false,
        },
      ];
  return {
    Items: [
      {
        Item: {
          ItemID: "7656690377962016562",
          Content: JSON.stringify({
            id: "44696080",
            audio: "https://audio.example.com/sample.mp3?signature=masked",
            uttid: "44696080",
          }),
        },
        TempAnswer: {
          Content: JSON.stringify({
            item: {
              id: "44696080",
            },
            templateID: "7628929157338042146",
            type: "neeko",
            data: {
              regions: regions,
              discard: "保留",
              duration: 22.0125,
              valid_duration: 1.716631,
            },
            dataMap: {
              regions: regions,
              discard: "保留",
              duration: 22.0125,
              valid_duration: 1.716631,
            },
            itemID: "7656690377962016562",
            isAbandoned: false,
          }),
        },
      },
    ],
  };
}

function createBaseSubmitPayload() {
  return {
    url: "https://aidp.bytedance.com/api/dispatch/SubmitTempItemAnswer?msToken=masked&a_bogus=masked",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "x-secsdk-csrf-token": "csrf-token",
    },
    body: {
      AuditAnswers: [
        {
          ItemID: "7656690377962016562",
          Content: JSON.stringify({
            item: {
              id: "44696080",
            },
            templateID: "7628929157338042146",
            type: "neeko",
            data: {
              regions: [
                {
                  no: 1,
                  id: "region_a",
                  start: 1.307281,
                  end: 3.023912,
                  disabled: false,
                },
              ],
              discard: "保留",
              duration: 22.0125,
              valid_duration: 1.716631,
            },
            dataMap: {
              regions: [
                {
                  no: 1,
                  id: "region_a",
                  start: 1.307281,
                  end: 3.023912,
                  disabled: false,
                },
              ],
              discard: "保留",
              duration: 22.0125,
              valid_duration: 1.716631,
            },
            itemID: "7656690377962016562",
            isAbandoned: false,
          }),
          ControlData: JSON.stringify({
            Discard: false,
            extraAnswer: [],
          }),
        },
      ],
      NodeID: "1",
      StagingTime: "604800",
      TaskID: "7632228385175129882",
    },
  };
}

function createSubmitPayloadWithRegions(regionOverrides) {
  const payload = createBaseSubmitPayload();
  const regions = Array.isArray(regionOverrides)
    ? regionOverrides
    : JSON.parse(payload.body.AuditAnswers[0].Content).data.regions;
  const nextContent = JSON.parse(payload.body.AuditAnswers[0].Content);
  nextContent.data.regions = regions;
  nextContent.dataMap.regions = regions;
  payload.body.AuditAnswers[0].Content = JSON.stringify(nextContent);
  return payload;
}

function emitReceive(windowLike, payload) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: RECEIVE_TYPE,
      payload: {
        url: "https://aidp.bytedance.com/api/dispatch/Receive",
        response: payload,
      },
    },
    "https://aidp.bytedance.com"
  );
}

function emitSubmit(windowLike, payload) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: SUBMIT_TYPE,
      payload: payload,
    },
    "https://aidp.bytedance.com"
  );
}

function emitSearchItem(windowLike, payload) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: SEARCH_ITEM_TYPE,
      payload: payload,
    },
    "https://aidp.bytedance.com"
  );
}

function createRuntimeHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const moduleApi = loadModule();
  const windowLike = createFakeWindow();
  const fetchCalls = [];
  const runtime = moduleApi.createRuntime({
    window: windowLike,
    document: settings.document,
    location: {
      origin: "https://aidp.bytedance.com",
      href:
        "https://aidp.bytedance.com/management/task-v2/7632228385175129882/mark-v3/1?from_pathname=%2Ftask-v2%3Fpage%3D1",
      pathname: "/management/task-v2/7632228385175129882/mark-v3/1",
      search: "?from_pathname=%2Ftask-v2%3Fpage%3D1",
    },
    fetch: async function (url, requestOptions) {
      fetchCalls.push({
        url: String(url || ""),
        method: String(requestOptions?.method || "GET").toUpperCase(),
        headers: Object.assign({}, requestOptions?.headers || {}),
        body: String(requestOptions?.body || ""),
      });
      return {
        ok: true,
        json: async function () {
          return {
            BaseResp: {
              StatusCode: 0,
              StatusMessage: "",
            },
          };
        },
      };
    },
    readCurrentTableState:
      settings.readCurrentTableState ||
      function () {
        return {
          rows: [
            {
              segmentNumber: 1,
              text: "",
              language: "",
            },
          ],
          hasUnsafeData: false,
          unsafeReason: "",
        };
      },
    now: settings.now,
    searchContextTtlMs: settings.searchContextTtlMs,
  });

  emitReceive(windowLike, createBaseReceivePayload(settings.receiveRegions));
  emitSubmit(
    windowLike,
    settings.submitPayload || createSubmitPayloadWithRegions(settings.submitRegions)
  );

  return {
    runtime,
    windowLike,
    fetchCalls,
  };
}

test("AIDP data api builds current context from observer receive snapshot", async function () {
  const harness = createRuntimeHarness();
  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.taskId, "7632228385175129882");
  assert.equal(context.itemId, "7656690377962016562");
  assert.equal(context.entryId, "44696080");
  assert.equal(
    context.audioUrl,
    "https://audio.example.com/sample.mp3?signature=masked"
  );
  assert.equal(context.audioDurationMs, 22013);
  assert.equal(context.currentSegments.length, 1);
  assert.equal(context.currentSegments[0].startMs, 1307);
  assert.equal(context.currentSegments[0].endMs, 3024);
  assert.equal(context.selectionKey, "7656690377962016562");
});

test("AIDP data api exposes a safe full-item import context only for matching Receive ItemID", async function () {
  const harness = createRuntimeHarness();
  emitSearchItem(harness.windowLike, {
    sourceItemId: "7656690377962016562",
    referenceText: "  完整题目文本  ",
    audioUrl: " https://media.example.test/audio?signature=masked ",
    videoUrl: "https://media.example.test/video?signature=masked",
    authorization: "must-not-keep",
    user: { email: "private@example.test" },
    rawResponse: { Tenant: "must-not-keep" },
  });

  const context = await harness.runtime.getRecordingImportContext();

  assert.deepEqual(context, {
    ok: true,
    sourceItemId: "7656690377962016562",
    referenceText: "完整题目文本",
    audioUrl: "https://media.example.test/audio?signature=masked",
    videoUrl: "https://media.example.test/video?signature=masked",
  });
  assert.doesNotMatch(
    JSON.stringify(context),
    /authorization|private@example|Tenant|rawResponse|must-not-keep/i
  );
});

test("AIDP data api distinguishes waiting, stale and empty Search Item contexts", async function () {
  let now = 1000;
  const harness = createRuntimeHarness({
    now: function () {
      return now;
    },
    searchContextTtlMs: 5000,
  });

  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: false,
    reason: "waiting",
    message: "正在等待当前完整题目数据，请稍后重试。",
  });

  emitSearchItem(harness.windowLike, {
    sourceItemId: "different-item",
    referenceText: "不允许错题导入",
    audioUrl: "",
    videoUrl: "",
  });
  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: false,
    reason: "stale",
    message: "当前完整题目数据与页面题目不一致，请等待页面数据刷新后重试。",
  });

  emitSearchItem(harness.windowLike, {
    sourceItemId: "7656690377962016562",
    referenceText: "   ",
    audioUrl: "",
    videoUrl: "   ",
  });
  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: false,
    reason: "empty",
    message: "当前完整题目没有可导入的文字、音频或视频参考内容。",
  });

  emitSearchItem(harness.windowLike, {
    sourceItemId: "7656690377962016562",
    referenceText: "有效内容",
    audioUrl: "",
    videoUrl: "",
  });
  now = 7001;
  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: false,
    reason: "expired",
    message: "当前完整题目数据已过期，请等待页面重新加载后重试。",
  });
});

test("AIDP data api applies preview through SubmitTempItemAnswer with rebuilt regions", async function () {
  const harness = createRuntimeHarness();
  const preview = {
    proposedSegments: [
      {
        sourceSegmentNumber: 1,
        startMs: 1307,
        endMs: 2023,
      },
      {
        sourceSegmentNumber: 1,
        startMs: 2300,
        endMs: 3024,
      },
    ],
    sourceSegments: [
      {
        regionId: "region_a",
        segmentNumber: 1,
        startMs: 1307,
        endMs: 3024,
      },
    ],
    selectionKey: "7656690377962016562",
  };

  const result = await harness.runtime.applySegmentPreview(preview);
  const request = harness.fetchCalls[0];
  const body = JSON.parse(request.body);
  const answer = JSON.parse(body.AuditAnswers[0].Content);

  assert.deepEqual(result, {
    ok: true,
    message: "已通过平台暂存接口应用分段建议，请刷新页面复核。",
  });
  assert.equal(
    request.url,
    "https://aidp.bytedance.com/api/dispatch/SubmitTempItemAnswer?msToken=masked&a_bogus=masked"
  );
  assert.equal(request.headers["x-secsdk-csrf-token"], "csrf-token");
  assert.equal(body.NodeID, "1");
  assert.equal(body.StagingTime, "604800");
  assert.equal(body.TaskID, "7632228385175129882");
  assert.equal(answer.data.duration, 22.0125);
  assert.equal(answer.data.discard, "保留");
  assert.equal(answer.data.regions.length, 2);
  assert.equal(answer.data.regions[0].no, 1);
  assert.match(answer.data.regions[0].id, /^region_/);
  assert.equal(answer.data.regions[0].start, 1.307);
  assert.equal(answer.data.regions[0].end, 2.023);
  assert.equal(answer.data.regions[0].ms, "目标方言");
  assert.equal(answer.data.regions[1].start, 2.3);
  assert.equal(answer.data.regions[1].end, 3.024);
  assert.equal(answer.data.regions[1].ms, "目标方言");
  assert.equal(answer.data.valid_duration, 1.44);
  assert.equal(answer.dataMap.regions.length, 2);
  assert.equal(answer.dataMap.regions[0].ms, "目标方言");
});

test("AIDP data api stops auto-apply when current rows already contain text or language values", async function () {
  const harness = createRuntimeHarness({
    readCurrentTableState: function () {
      return {
        rows: [
          {
            segmentNumber: 1,
            text: "已有转写",
            language: "",
          },
        ],
        hasUnsafeData: true,
        unsafeReason: "当前分段表里已有文本或语音种类，自动应用可能覆盖现有标注。",
      };
    },
  });
  const result = await harness.runtime.applySegmentPreview({
    proposedSegments: [
      {
        sourceSegmentNumber: 1,
        startMs: 1307,
        endMs: 2023,
      },
    ],
    sourceSegments: [
      {
        regionId: "region_a",
        segmentNumber: 1,
        startMs: 1307,
        endMs: 3024,
      },
    ],
    selectionKey: "7656690377962016562",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前分段表里已有文本或语音种类，自动应用可能覆盖现有标注。",
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api keeps fail-closed behavior when current structured regions already contain language values", async function () {
  const harness = createRuntimeHarness({
    submitRegions: [
      {
        no: 1,
        id: "region_a",
        start: 1.307281,
        end: 3.023912,
        disabled: false,
        ms: "普通话",
      },
    ],
  });
  const result = await harness.runtime.applySegmentPreview({
    proposedSegments: [
      {
        sourceSegmentNumber: 1,
        startMs: 1307,
        endMs: 2023,
      },
    ],
    sourceSegments: [
      {
        regionId: "region_a",
        segmentNumber: 1,
        startMs: 1307,
        endMs: 3024,
      },
    ],
    selectionKey: "7656690377962016562",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前分段表里已有文本或语音种类，自动应用可能覆盖现有标注。",
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api treats changed live segments as stale preview", async function () {
  const harness = createRuntimeHarness({
    submitRegions: [
      {
        no: 1,
        id: "region_new",
        start: 1.5,
        end: 3.1,
        disabled: false,
      },
    ],
  });
  const result = await harness.runtime.applySegmentPreview({
    proposedSegments: [
      {
        sourceSegmentNumber: 1,
        startMs: 1307,
        endMs: 2023,
      },
    ],
    sourceSegments: [
      {
        regionId: "region_a",
        segmentNumber: 1,
        startMs: 1307,
        endMs: 3024,
      },
    ],
    selectionKey: "7656690377962016562",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前页面分段状态已变化，旧分段建议已失效，请重新生成。",
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api clears current regions through SubmitTempItemAnswer after confirmation path", async function () {
  const harness = createRuntimeHarness();

  const result = await harness.runtime.clearCurrentSegments();
  const request = harness.fetchCalls[0];
  const body = JSON.parse(request.body);
  const answer = JSON.parse(body.AuditAnswers[0].Content);

  assert.deepEqual(result, {
    ok: true,
    message: "已通过平台暂存接口应用分段建议，请刷新页面复核。",
  });
  assert.equal(answer.data.regions.length, 0);
  assert.equal(answer.dataMap.regions.length, 0);
  assert.equal(answer.data.discard, "保留");
  assert.equal(answer.data.duration, 22.0125);
  assert.equal(answer.data.valid_duration, 0);
});

test("AIDP data api fills only empty region languages through SubmitTempItemAnswer", async function () {
  const harness = createRuntimeHarness({
    submitRegions: [
      {
        no: 1,
        id: "region_a",
        start: 1.263,
        end: 2.401,
        disabled: false,
        ms: "普通话",
      },
      {
        no: 2,
        id: "region_b",
        start: 3.261,
        end: 4.951,
        disabled: false,
        ms: "",
      },
      {
        no: 3,
        id: "region_c",
        start: 5.673,
        end: 7.224,
        disabled: false,
      },
      {
        no: 4,
        id: "region_d",
        start: 8.438,
        end: 9.114,
        disabled: false,
        ms: "目标方言",
      },
    ],
  });

  const result = await harness.runtime.fillEmptyRegionLanguages();
  const request = harness.fetchCalls[0];
  const body = JSON.parse(request.body);
  const answer = JSON.parse(body.AuditAnswers[0].Content);

  assert.deepEqual(result, {
    ok: true,
    message: "已通过平台暂存接口填充空语言种类，请刷新页面复核。",
    filledCount: 2,
  });
  assert.equal(answer.data.regions[0].ms, "普通话");
  assert.equal(answer.data.regions[1].ms, "目标方言");
  assert.equal(answer.data.regions[2].ms, "目标方言");
  assert.equal(answer.data.regions[3].ms, "目标方言");
  assert.equal(answer.dataMap.regions[1].ms, "目标方言");
  assert.equal(answer.dataMap.regions[2].ms, "目标方言");
});

test("AIDP data api skips language fill when current regions already all have values", async function () {
  const harness = createRuntimeHarness({
    submitRegions: [
      {
        no: 1,
        id: "region_a",
        start: 1.263,
        end: 2.401,
        disabled: false,
        ms: "普通话",
      },
      {
        no: 2,
        id: "region_b",
        start: 3.261,
        end: 4.951,
        disabled: false,
        ms: "目标方言",
      },
    ],
  });

  const result = await harness.runtime.fillEmptyRegionLanguages();

  assert.deepEqual(result, {
    ok: false,
    message: "当前没有空的语言种类需要填充。",
    filledCount: 0,
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api still clears current regions when table already contains text or language values", async function () {
  const harness = createRuntimeHarness({
    readCurrentTableState: function () {
      return {
        rows: [
          {
            segmentNumber: 1,
            text: "已有文本",
            language: "目标方言",
          },
        ],
        hasUnsafeData: true,
        unsafeReason: "当前分段表里已有文本或语音种类，自动应用可能覆盖现有标注。",
      };
    },
  });

  const result = await harness.runtime.clearCurrentSegments();
  const request = harness.fetchCalls[0];
  const body = JSON.parse(request.body);
  const answer = JSON.parse(body.AuditAnswers[0].Content);

  assert.deepEqual(result, {
    ok: true,
    message: "已通过平台暂存接口应用分段建议，请刷新页面复核。",
  });
  assert.equal(answer.data.regions.length, 0);
  assert.equal(answer.dataMap.regions.length, 0);
  assert.equal(answer.data.discard, "保留");
});



test("AIDP data api fills the target segment textarea through DOM events without fetch", async function () {
  const rowOne = createAidpSegmentTableRow(1, "旧内容一");
  const rowTwo = createAidpSegmentTableRow(2, "");
  const documentLike = createFakeDocument([
    new FakeElement({
      tagName: "table",
      children: [
        new FakeElement({
          tagName: "tr",
          children: [
            new FakeElement({ tagName: "th", text: "序号" }),
            new FakeElement({ tagName: "th", text: "区间" }),
            new FakeElement({ tagName: "th", text: "转写文本" }),
            new FakeElement({ tagName: "th", text: "语音种类" }),
          ],
        }),
        rowOne,
        rowTwo,
      ],
    }),
  ]);
  const textarea = rowTwo.querySelector("textarea");
  const eventTypes = [];
  ["beforeinput", "input", "change", "compositionend"].forEach(function (type) {
    textarea.addEventListener(type, function (event) {
      eventTypes.push(String(event?.type || ""));
    });
  });
  const harness = createRuntimeHarness({
    document: documentLike,
  });

  const result = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 2,
    listenText: "  原始听音 3、2、1！！！  ",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已填入第 2 段输入框，请继续复核或暂存。",
    filledCount: 1,
    skippedCount: 0,
  });
  assert.equal(textarea.value, "  原始听音 3、2、1！！！  ");
  assert.deepEqual(eventTypes, ["beforeinput", "input", "change", "compositionend"]);
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api directly writes original listenText even when a legacy guard is supplied", async function () {
  const rowOne = createAidpSegmentTableRow(1, "人工已有内容");
  const documentLike = createFakeDocument([
    new FakeElement({
      tagName: "table",
      children: [
        new FakeElement({
          tagName: "tr",
          children: [
            new FakeElement({ tagName: "th", text: "序号" }),
            new FakeElement({ tagName: "th", text: "区间" }),
            new FakeElement({ tagName: "th", text: "转写文本" }),
            new FakeElement({ tagName: "th", text: "语音种类" }),
          ],
        }),
        rowOne,
      ],
    }),
  ]);
  const textarea = rowOne.querySelector("textarea");
  const harness = createRuntimeHarness({
    document: documentLike,
  });
  const requestContext = await harness.runtime.getCurrentContext();

  const guardedResult = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 1,
    listenText: "原始听音直接写入",
    autoFillGuard: {
      selectionKey: requestContext.selectionKey,
      currentSignature: requestContext.currentSignature,
      onlyFillEmpty: true,
    },
  });

  assert.equal(guardedResult.ok, true);
  assert.equal(guardedResult.filledCount, 1);
  assert.equal(guardedResult.skippedCount, 0);
  assert.equal(textarea.value, "原始听音直接写入");

  const explicitResult = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 1,
    listenText: "再次原样写入",
  });

  assert.equal(explicitResult.ok, true);
  assert.equal(explicitResult.filledCount, 1);
  assert.equal(textarea.value, "再次原样写入");
});


test("AIDP data api fills the target textarea inside Arco virtual table rows", async function () {
  const rowOne = createAidpArcoVirtualRow(1, "旧内容一");
  const rowTwo = createAidpArcoVirtualRow(2, "");
  const documentLike = createFakeDocument([
    new FakeElement({
      tagName: "div",
      className: "arco-table",
      children: [
        new FakeElement({
          tagName: "div",
          className: "arco-table-body",
          children: [rowOne, rowTwo],
        }),
      ],
    }),
  ]);
  const textarea = rowTwo.querySelector("textarea");
  const harness = createRuntimeHarness({
    document: documentLike,
  });

  const result = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 2,
    listenText: "原始听音二",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "已填入第 2 段输入框，请继续复核或暂存。",
    filledCount: 1,
    skippedCount: 0,
  });
  assert.equal(textarea.value, "原始听音二");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api blurs the textarea after a successful DOM fill", async function () {
  const rowOne = createAidpArcoVirtualRow(1, "");
  const documentLike = createFakeDocument([
    new FakeElement({
      tagName: "div",
      className: "arco-table",
      children: [
        new FakeElement({
          tagName: "div",
          className: "arco-table-body",
          children: [rowOne],
        }),
      ],
    }),
  ]);
  const textarea = rowOne.querySelector("textarea");
  const harness = createRuntimeHarness({
    document: documentLike,
  });

  const result = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 1,
    listenText: "原始听音后失焦",
  });

  assert.equal(result.ok, true);
  assert.equal(textarea.value, "原始听音后失焦");
  assert.equal(documentLike.activeElement, null);
});

test("AIDP data api skips DOM fill when the generated text is empty", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([
      new FakeElement({
        tagName: "table",
        children: [createAidpSegmentTableRow(1, "")],
      }),
    ]),
  });

  const result = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 1,
    listenText: "",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "当前段 AI 结果为空，未填入任何文本。",
    filledCount: 0,
    skippedCount: 1,
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api fails DOM fill when the target textarea is missing", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([
      new FakeElement({
        tagName: "table",
        children: [createAidpSegmentTableRow(1, "")],
      }),
    ]),
  });

  const result = await harness.runtime.fillCurrentRegionTextIntoDom({
    segmentNumber: 3,
    listenText: "不会写入",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "当前没有找到第 3 段输入框，请重新画段后再试。",
    filledCount: 0,
    skippedCount: 0,
  });
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api batch write merges successful non-empty txt updates in one submit", async function () {
  const harness = createRuntimeHarness({
    submitRegions: [
      {
        no: 1,
        id: "region_a",
        start: 1.263,
        end: 2.401,
        disabled: false,
        ms: "目标方言",
      },
      {
        no: 2,
        id: "region_b",
        start: 3.261,
        end: 4.951,
        disabled: false,
        ms: "目标方言",
        txt: "保留原文",
      },
      {
        no: 3,
        id: "region_c",
        start: 5.673,
        end: 7.224,
        disabled: false,
        ms: "目标方言",
      },
    ],
  });
  const initialContext = await harness.runtime.getCurrentContext();

  const result = await harness.runtime.writeBatchRegionTexts({
    selectionKey: initialContext.selectionKey,
    currentSignature: initialContext.currentSignature,
    updates: [
      {
        segmentNumber: 1,
        listenText: "  第一段原文  ",
      },
      {
        segmentNumber: 2,
        listenText: "",
      },
      {
        segmentNumber: 3,
        listenText: "第三段原文",
      },
    ],
  });
  const request = harness.fetchCalls[0];
  const body = JSON.parse(request.body);
  const answer = JSON.parse(body.AuditAnswers[0].Content);
  const expectedCurrentSignature = answer.data.regions
    .map(function (region) {
      return [
        Number(region.no || 0) || 0,
        Math.round(Number(region.start || 0) * 1000),
        Math.round(Number(region.end || 0) * 1000),
        String(region.txt || ""),
        String(region.ms || ""),
      ].join(":");
    })
    .join("|");

  assert.deepEqual(result, {
    ok: true,
    message: "已通过平台暂存接口批量写回原始听音文本，请刷新页面复核。",
    writtenCount: 2,
    skippedCount: 1,
    expectedCurrentSignature,
  });
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(answer.data.regions[0].txt, "  第一段原文  ");
  assert.equal(answer.data.regions[1].txt, "保留原文");
  assert.equal(answer.data.regions[2].txt, "第三段原文");
  assert.equal(answer.data.regions[0].ms, "目标方言");
  assert.equal(answer.data.regions[1].ms, "目标方言");
  assert.equal(answer.data.regions[2].ms, "目标方言");
});

test("AIDP data api prefers a later same-millisecond external receive after local batch writeback", async function (t) {
  const originalDateNow = Date.now;
  Date.now = function () {
    return 1720960000000;
  };
  t.after(function () {
    Date.now = originalDateNow;
  });

  const initialRegions = [
    {
      no: 1,
      id: "region_a",
      start: 1,
      end: 2,
      disabled: false,
      ms: "目标方言",
    },
  ];
  const externalRegions = [
    {
      no: 1,
      id: "region_a",
      start: 1,
      end: 2.5,
      disabled: false,
      ms: "目标方言",
      txt: "外部变更",
    },
  ];
  const harness = createRuntimeHarness({
    receiveRegions: initialRegions,
    submitRegions: initialRegions,
  });
  const initialContext = await harness.runtime.getCurrentContext();
  const writeResult = await harness.runtime.writeBatchRegionTexts({
    selectionKey: initialContext.selectionKey,
    currentSignature: initialContext.currentSignature,
    updates: [
      {
        segmentNumber: 1,
        listenText: "本地安全写回",
      },
    ],
  });

  emitReceive(harness.windowLike, createBaseReceivePayload(externalRegions));
  const currentContext = await harness.runtime.getCurrentContext();

  assert.equal(writeResult.ok, true);
  assert.equal(
    writeResult.expectedCurrentSignature,
    "1:1000:2000:本地安全写回:目标方言"
  );
  assert.equal(
    currentContext.currentSignature,
    "1:1000:2500:外部变更:目标方言"
  );
});
