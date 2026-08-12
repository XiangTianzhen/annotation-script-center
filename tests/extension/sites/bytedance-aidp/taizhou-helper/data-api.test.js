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
const SEARCH_MODIFY_ITEM_TYPE = "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT";
const WORK_ITEM_TYPE = "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT";
const NETWORK_ACTIVITY_TYPE = "BYTEDANCE_AIDP_NETWORK_ACTIVITY";
const RECEIVE_SNAPSHOT_VERSION = 1;

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouDataApi;
  return require(modulePath);
}

function createFakeWindow() {
  const listeners = new Map();
  const postedMessages = [];
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
    postMessage: function (data, targetOrigin) {
      postedMessages.push({ data, targetOrigin });
    },
    postedMessages: postedMessages,
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
    this.disabled = source.disabled === true;
    this.readOnly = source.readOnly === true;
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
            video: "https://video.example.com/sample.mp4?signature=masked",
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
        snapshotVersion: RECEIVE_SNAPSHOT_VERSION,
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

function emitSearchModifyItem(windowLike, payload) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: SEARCH_MODIFY_ITEM_TYPE,
      payload: payload,
    },
    "https://aidp.bytedance.com"
  );
}

function emitWorkItem(windowLike, payload, capturedAt) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: WORK_ITEM_TYPE,
      payload: {
        capturedAt:
          capturedAt === undefined ? Date.now() : Number(capturedAt),
        response: payload,
      },
    },
    "https://aidp.bytedance.com"
  );
}

function createRecordingWorkItem(itemId, content) {
  return {
    Item: {
      ItemID: itemId,
      Content: JSON.stringify(content || {}),
    },
    Answer: JSON.stringify({
      itemID: itemId,
      data: {
        regions: [],
      },
    }),
  };
}

function createRecordingReceivePayload(itemId, content) {
  return {
    Items: [
      {
        Item: {
          ItemID: itemId,
          Content: JSON.stringify(content || {}),
        },
        TempAnswer: {
          Content: JSON.stringify({
            itemID: itemId,
            data: {
              regions: [],
            },
          }),
        },
      },
    ],
  };
}

function emitNetworkActivity(windowLike, payload, origin) {
  windowLike.emitMessage(
    {
      source: OBSERVER_SOURCE,
      type: NETWORK_ACTIVITY_TYPE,
      payload: payload,
    },
    origin || "https://aidp.bytedance.com"
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
    location: settings.location || {
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

  if (settings.skipReceiveSnapshot !== true) {
    emitReceive(windowLike, createBaseReceivePayload(settings.receiveRegions));
  }
  if (settings.skipSubmitSnapshot !== true) {
    emitSubmit(
      windowLike,
      settings.submitPayload || createSubmitPayloadWithRegions(settings.submitRegions)
    );
  }

  return {
    runtime,
    windowLike,
    fetchCalls,
  };
}

test("AIDP data api asks the page observer to replay the latest GetWorkItem snapshot at startup", function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-1",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-1",
    },
  });

  assert.deepEqual(harness.windowLike.postedMessages, [{
    data: {
      source: OBSERVER_SOURCE,
      type: "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT_REQUEST",
    },
    targetOrigin: "https://aidp.bytedance.com",
  }]);
});

test("AIDP data api keeps node 17 check-package routes read-only", function () {
  const resolveRoute = loadModule().__testOnly.resolveDetailRoute;
  const scanRoute = resolveRoute({
    pathname: "/management/task-v2/task-17/scan-v3/17/item-17",
    search: "",
  });
  const packageRoute = resolveRoute({
    pathname: "/management/task-v2/task-17/mark-package/package-17/17",
    search: "?itemID=item-17",
  });

  assert.equal(scanRoute.pageType, "scan-v3");
  assert.equal(scanRoute.mode, "scan");
  assert.equal(scanRoute.readOnly, true);
  assert.equal(scanRoute.nodeId, "17");
  assert.equal(scanRoute.itemId, "item-17");

  assert.equal(packageRoute.pageType, "mark-package");
  assert.equal(packageRoute.mode, "scan");
  assert.equal(packageRoute.readOnly, true);
  assert.equal(packageRoute.nodeId, "17");
  assert.equal(packageRoute.packageId, "package-17");
  assert.equal(packageRoute.itemId, "item-17");
});

test("AIDP data api imports matching GetWorkItem on a node 17 package route", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-17/mark-package/package-17/17?itemID=item-17",
      pathname: "/management/task-v2/task-17/mark-package/package-17/17",
      search: "?itemID=item-17",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-17", {
      asr_text: "node 17 reference",
      audio: "https://media.example.test/node-17-audio",
      video: "",
    }),
  ], 1000);

  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: true,
    sourceItemId: "item-17",
    referenceText: "node 17 reference",
    audioUrl: "https://media.example.test/node-17-audio",
    videoUrl: "",
  });
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "item-17");
});

test("AIDP data api imports matching Receive on a node 17 scan-v3 route", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-17/scan-v3/17/item-17",
      pathname: "/management/task-v2/task-17/scan-v3/17/item-17",
      search: "",
    },
  });
  emitReceive(harness.windowLike, createRecordingReceivePayload("item-17", {
    asr_text: "  node 17 Receive reference  ",
    audio: " https://media.example.test/node-17-receive-audio ",
    video: "https://media.example.test/node-17-receive-video",
    cookie: "must-not-keep",
  }));

  const importContext = await harness.runtime.getRecordingImportContext();
  assert.deepEqual(importContext, {
    ok: true,
    sourceItemId: "item-17",
    referenceText: "node 17 Receive reference",
    audioUrl: "https://media.example.test/node-17-receive-audio",
    videoUrl: "https://media.example.test/node-17-receive-video",
  });
  assert.doesNotMatch(JSON.stringify(importContext), /cookie|must-not-keep/i);
});

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
    assert.equal(
      context.videoUrl,
      "https://video.example.com/sample.mp4?signature=masked"
    );
  assert.equal(context.audioDurationMs, 22013);
  assert.equal(context.currentSegments.length, 1);
  assert.equal(context.currentSegments[0].startMs, 1307);
  assert.equal(context.currentSegments[0].endMs, 3024);
  assert.equal(context.selectionKey, "7656690377962016562");
});

test("AIDP data api reads the current Receive ItemID independently from a newer Submit snapshot", async function () {
  const harness = createRuntimeHarness();
  const newerSubmitPayload = createBaseSubmitPayload();
  newerSubmitPayload.body.AuditAnswers[0].ItemID = "submit-snapshot-item";
  const newerSubmitAnswer = JSON.parse(newerSubmitPayload.body.AuditAnswers[0].Content);
  newerSubmitAnswer.itemID = "submit-snapshot-item";
  newerSubmitPayload.body.AuditAnswers[0].Content = JSON.stringify(newerSubmitAnswer);
  emitSubmit(harness.windowLike, newerSubmitPayload);

  assert.equal(await harness.runtime.getCurrentReceiveItemId(), "7656690377962016562");
});

test("AIDP data api exposes only same-origin page-network activity snapshots", function () {
  let currentTime = 100;
  const harness = createRuntimeHarness({
    now: function () {
      return currentTime;
    },
  });

  emitNetworkActivity(harness.windowLike, {
    pendingCount: 2,
    activitySequence: 4,
    url: "https://must-not-store.example.test/path",
  });
  assert.deepEqual(harness.runtime.getPageNetworkActivity?.(), {
    pendingCount: 2,
    lastActivityAt: 100,
    activitySequence: 4,
  });

  currentTime = 250;
  emitNetworkActivity(harness.windowLike, {
    pendingCount: 0,
    activitySequence: 5,
  });
  emitNetworkActivity(
    harness.windowLike,
    { pendingCount: 99, activitySequence: 6 },
    "https://untrusted.example.test"
  );

  assert.deepEqual(harness.runtime.getPageNetworkActivity?.(), {
    pendingCount: 0,
    lastActivityAt: 250,
    activitySequence: 5,
  });
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

test("AIDP data api selects the current Receive ItemID from a multi-item Search response", async function () {
  const harness = createRuntimeHarness();
  emitSearchItem(harness.windowLike, {
    items: [
      {
        sourceItemId: "different-item",
        referenceText: "第一条题目文本",
        audioUrl: "https://media.example.test/other-audio",
        videoUrl: "https://media.example.test/other-video",
      },
      {
        sourceItemId: "7656690377962016562",
        referenceText: "  当前第二条题目文本  ",
        audioUrl: " https://media.example.test/current-audio ",
        videoUrl: "https://media.example.test/current-video",
        user: { email: "private@example.test" },
        rawResponse: { authorization: "must-not-keep" },
      },
    ],
  });

  const context = await harness.runtime.getRecordingImportContext();

  assert.deepEqual(context, {
    ok: true,
    sourceItemId: "7656690377962016562",
    referenceText: "当前第二条题目文本",
    audioUrl: "https://media.example.test/current-audio",
    videoUrl: "https://media.example.test/current-video",
  });
  assert.doesNotMatch(
    JSON.stringify(context),
    /private@example|authorization|rawResponse|must-not-keep/i
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

test("AIDP data api prefers fresh Search Item on read-only scan-v3", async function () {
  let currentTime = 1000;
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => currentTime,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-scan/scan-v3/14/item-scan",
      pathname: "/management/task-v2/task-scan/scan-v3/14/item-scan",
      search: "",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-scan", {
      asr_text: "GetWorkItem 回退文本",
      audio: "https://media.example.test/work-audio",
      video: "https://media.example.test/work-video",
    }),
  ]);
  emitSearchItem(harness.windowLike, {
    sourceItemId: "item-scan",
    referenceText: "  Search Item 优先文本  ",
    audioUrl: " https://media.example.test/search-audio ",
    videoUrl: "https://media.example.test/search-video",
    authorization: "must-not-keep",
  });
  const context = await harness.runtime.getRecordingImportContext();
  assert.deepEqual(context, {
    ok: true,
    sourceItemId: "item-scan",
    referenceText: "Search Item 优先文本",
    audioUrl: "https://media.example.test/search-audio",
    videoUrl: "https://media.example.test/search-video",
  });
  assert.doesNotMatch(JSON.stringify(context), /GetWorkItem|authorization|must-not-keep/i);
});

test("AIDP data api falls back to fresh matching GetWorkItem Item.Content", async function () {
  let currentTime = 1000;
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => currentTime,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/mark-package/package-1/14?itemID=item-package",
      pathname: "/management/task-v2/task/mark-package/package-1/14",
      search: "?itemID=item-package",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-package", {
      asr_text: "  GetWorkItem 参考文本  ",
      audio: " https://media.example.test/work-audio ",
      video: "https://media.example.test/work-video",
      id: "entry-must-not-leak",
      authorization: "must-not-keep",
      customer: { email: "private@example.test" },
    }),
  ]);
  const context = await harness.runtime.getRecordingImportContext();
  assert.deepEqual(context, {
    ok: true,
    sourceItemId: "item-package",
    referenceText: "GetWorkItem 参考文本",
    audioUrl: "https://media.example.test/work-audio",
    videoUrl: "https://media.example.test/work-video",
  });
  assert.doesNotMatch(JSON.stringify(context), /entry-must-not-leak|authorization|private@example|customer/i);
});

test('AIDP data api imports a same-item fresh GetWorkItem fallback on scan-v3 without Search', async function () {
  let currentTime = 1000;
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => currentTime,
    searchContextTtlMs: 5000,
    location: {
      origin: 'https://aidp.bytedance.com',
      href: 'https://aidp.bytedance.com/management/task-v2/task-scan/scan-v3/14/item-scan',
      pathname: '/management/task-v2/task-scan/scan-v3/14/item-scan',
      search: '',
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem('item-scan', {
      asr_text: '  scan-v3 GetWorkItem 文本  ',
      audio: ' https://media.example.test/scan-work-audio ',
      video: 'https://media.example.test/scan-work-video',
    }),
  ], currentTime);

  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: true,
    sourceItemId: 'item-scan',
    referenceText: 'scan-v3 GetWorkItem 文本',
    audioUrl: 'https://media.example.test/scan-work-audio',
    videoUrl: 'https://media.example.test/scan-work-video',
  });
});

test('AIDP data api fails closed for a wrong Receive on scan-v3 without Search or GetWorkItem', async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: 'https://aidp.bytedance.com',
      href: 'https://aidp.bytedance.com/management/task-v2/task-scan/scan-v3/14/item-current',
      pathname: '/management/task-v2/task-scan/scan-v3/14/item-current',
      search: '',
    },
  });
  emitReceive(harness.windowLike, createRecordingReceivePayload('item-other', {
    asr_text: '不允许导入的错题 Receive 文本',
    audio: 'https://media.example.test/wrong-receive-audio',
  }));

  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.match(String(context.reason || ''), /^(waiting|stale)$/);
  assert.doesNotMatch(JSON.stringify(context), /错题 Receive|wrong-receive-audio/);
});

test("AIDP data api falls back to fresh Receive when Search is wrong or expired", async function () {
  let currentTime = 1000;
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => currentTime,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/scan-v3/14/item-current",
      pathname: "/management/task-v2/task/scan-v3/14/item-current",
      search: "",
    },
  });
  emitReceive(harness.windowLike, createRecordingReceivePayload("item-current", {
    asr_text: "Receive 回退文本",
    audio: "https://media.example.test/receive-audio",
    video: "https://media.example.test/receive-video",
    cookie: "must-not-keep",
  }));
  emitSearchItem(harness.windowLike, {
    sourceItemId: "item-other",
    referenceText: "不允许错题导入",
    audioUrl: "https://media.example.test/other-audio",
  });
  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: true,
    sourceItemId: "item-current",
    referenceText: "Receive 回退文本",
    audioUrl: "https://media.example.test/receive-audio",
    videoUrl: "https://media.example.test/receive-video",
  });
  emitSearchItem(harness.windowLike, {
    sourceItemId: "item-current",
    referenceText: "过期 Search 文本",
    audioUrl: "https://media.example.test/expired-audio",
  });
  currentTime = 7001;
  emitReceive(harness.windowLike, createRecordingReceivePayload("item-current", {
    asr_text: "新鲜 Receive 文本",
    audio: "https://media.example.test/fresh-audio",
  }));
  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: true,
    sourceItemId: "item-current",
    referenceText: "新鲜 Receive 文本",
    audioUrl: "https://media.example.test/fresh-audio",
    videoUrl: "",
  });
});

test("AIDP data api rejects a mismatched package snapshot", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-other", {
      asr_text: "不允许错题导入",
      audio: "https://media.example.test/other-audio",
    }),
  ]);
  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.match(String(context.reason || ""), /^(waiting|stale)$/);
  assert.doesNotMatch(JSON.stringify(context), /不允许错题导入|other-audio/);
});

test("AIDP data api rejects an expired package fallback snapshot", async function () {
  let currentTime = 1000;
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => currentTime,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-current", { asr_text: "已过期内容" }),
  ], 1000);
  currentTime = 7001;
  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.equal(context.reason, "expired");
  assert.doesNotMatch(JSON.stringify(context), /已过期内容/);
});

test("AIDP data api preserves GetWorkItem capture time when an old snapshot is replayed", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 7001,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-current", {
      asr_text: "旧回放不得导入",
      audio: "https://media.example.test/old-replay-audio",
    }),
  ], 1000);

  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.equal(context.reason, "expired");
  assert.doesNotMatch(JSON.stringify(context), /旧回放不得导入|old-replay-audio/);
});

test("AIDP data api rejects fallback content when all allowed fields are empty", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitWorkItem(harness.windowLike, [
    createRecordingWorkItem("item-current", {
      asr_text: "   ",
      audio: "",
      video: "   ",
      authorization: "must-not-keep",
    }),
  ]);
  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.equal(context.reason, "empty");
  assert.doesNotMatch(JSON.stringify(context), /authorization|must-not-keep/i);
});

test("AIDP data api resolves current automation ItemID on both package routes", async function () {
  const location = {
    origin: "https://aidp.bytedance.com",
    href: "https://aidp.bytedance.com/management/task-v2/task-1/scan-v3/14/item-1",
    pathname: "/management/task-v2/task-1/scan-v3/14/item-1",
    search: "",
  };
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location,
  });
  emitWorkItem(harness.windowLike, [createRecordingWorkItem("item-1", { asr_text: "one" })]);
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "item-1");
  location.href = "https://aidp.bytedance.com/management/task-v2/task-1/scan-v3/14/item-2";
  location.pathname = "/management/task-v2/task-1/scan-v3/14/item-2";
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "");
  emitReceive(harness.windowLike, createRecordingReceivePayload("item-2", { asr_text: "two" }));
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "item-2");
  location.href = "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-2/14?itemID=item-3";
  location.pathname = "/management/task-v2/task-1/mark-package/package-2/14";
  location.search = "?itemID=item-3";
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "");
  emitWorkItem(harness.windowLike, [createRecordingWorkItem("item-3", { asr_text: "three" })]);
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "item-3");
});

test("AIDP data api keeps automation scope stable per package", async function () {
  const location = {
    origin: "https://aidp.bytedance.com",
    href: "https://aidp.bytedance.com/management/task-v2/task-1/scan-v3/14/item-1",
    pathname: "/management/task-v2/task-1/scan-v3/14/item-1",
    search: "",
  };
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location,
  });
  const scanScope = await harness.runtime.getAutomationScopeKey();
  assert.match(scanScope, /scan-v3/i);
  assert.match(scanScope, /task-1/);
  assert.match(scanScope, /14/);
  assert.doesNotMatch(scanScope, /item-1/);
  location.href = "https://aidp.bytedance.com/management/task-v2/task-1/scan-v3/14/item-2";
  location.pathname = "/management/task-v2/task-1/scan-v3/14/item-2";
  assert.equal(await harness.runtime.getAutomationScopeKey(), scanScope);
  location.href = "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-2";
  location.pathname = "/management/task-v2/task-1/mark-package/package-1/14";
  location.search = "?itemID=item-2";
  const packageScope = await harness.runtime.getAutomationScopeKey();
  assert.notEqual(packageScope, scanScope);
  assert.match(packageScope, /mark-package/i);
  assert.match(packageScope, /task-1/);
  assert.match(packageScope, /package-1/);
  assert.match(packageScope, /14/);
  assert.doesNotMatch(packageScope, /item-2/);
  location.href = "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-2/14?itemID=item-3";
  location.pathname = "/management/task-v2/task-1/mark-package/package-2/14";
  const nextScope = await harness.runtime.getAutomationScopeKey();
  assert.notEqual(nextScope, packageScope);
  assert.match(nextScope, /package-2/);
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

test("AIDP data api builds a read-only mark-package context from GetWorkItem regions", async function () {
  const textarea = new FakeElement({ tagName: "textarea", value: "original text" });
  const row = new FakeElement({
    className: "arco-table-tr",
    attributes: { "data-neeko-table-row-key": "region-b" },
    children: [textarea],
  });
  const document = createFakeDocument([
    new FakeElement({ className: "arco-table-body", children: [row] }),
  ]);
  const harness = createRuntimeHarness({
    document,
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-b", segmentNumber: 2, text: "second", language: "" }],
        activeSegmentNumber: 2,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-1",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-1",
    },
  });
  emitWorkItem(harness.windowLike, [{
    Item: {
      ItemID: "item-1",
      Content: JSON.stringify({
        id: "entry-1",
        audio: "https://media.example.test/audio?signature=masked",
      }),
    },
    Answer: JSON.stringify({
      templateID: "template-1",
      itemID: "item-1",
      dataMap: {
        duration: 2.5,
        regions: [
          { id: "region-a", no: 1, start: 0, end: 1, txt: "first" },
          { id: "region-b", no: 2, start: 1, end: 2, txt: "second" },
        ],
      },
    }),
  }]);

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.readOnly, true);
  assert.equal(context.itemId, "item-1");
  assert.equal(context.audioUrl, "https://media.example.test/audio?signature=masked");
  assert.deepEqual(context.currentSegments.map((segment) => segment.regionId), ["region-b"]);
  assert.equal(context.currentSegments[0].segmentNumber, 2);
});

test("AIDP data api fails closed when read-only table rows do not match response region IDs", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-not-visible", segmentNumber: 1, text: "", language: "" }],
        activeSegmentNumber: 1,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-1",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-1",
    },
  });
  emitWorkItem(harness.windowLike, [{
    Item: { ItemID: "item-1", Content: JSON.stringify({ audio: "https://media.example.test/audio" }) },
    Answer: JSON.stringify({
      itemID: "item-1",
      data: { regions: [{ id: "region-a", no: 1, start: 0, end: 1 }] },
    }),
  }]);

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.readOnly, true);
  assert.deepEqual(context.currentSegments, []);
});

test("AIDP data api uses the Receive snapshot for a read-only mark-package when GetWorkItem is absent", async function () {
  const row = new FakeElement({
    className: "arco-table-tr",
    attributes: { "data-neeko-table-row-key": "region_a" },
  });
  const harness = createRuntimeHarness({
    document: createFakeDocument([
      new FakeElement({ className: "arco-table-body", children: [row] }),
    ]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region_a", segmentNumber: 1, text: "", language: "" }],
        activeSegmentNumber: 1,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=7656690377962016562",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=7656690377962016562",
    },
  });

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.readOnly, true);
  assert.equal(context.itemId, "7656690377962016562");
  assert.equal(context.audioUrl, "https://audio.example.com/sample.mp3?signature=masked");
  assert.deepEqual(context.currentSegments.map((segment) => segment.regionId), ["region_a"]);
});

test("AIDP data api falls back to the matching Receive snapshot when GetWorkItem lacks the current read-only item", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-current", segmentNumber: 1, text: "", language: "" }],
        activeSegmentNumber: 1,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitWorkItem(harness.windowLike, [{
    Item: { ItemID: "item-previous", Content: JSON.stringify({ audio: "https://media.example.test/previous" }) },
    Answer: JSON.stringify({
      itemID: "item-previous",
      data: { regions: [{ id: "region-previous", no: 1, start: 0, end: 1 }] },
    }),
  }]);
  emitReceive(harness.windowLike, {
    Items: [{
      Item: { ItemID: "item-current", Content: JSON.stringify({ audio: "https://media.example.test/current" }) },
      TempAnswer: {
        Content: JSON.stringify({
          itemID: "item-current",
          data: { regions: [{ id: "region-current", no: 1, start: 0, end: 1 }] },
        }),
      },
    }],
  });

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.itemId, "item-current");
  assert.equal(context.audioUrl, "https://media.example.test/current");
  assert.deepEqual(context.currentSegments.map((segment) => segment.regionId), ["region-current"]);
});

test("AIDP data api ignores unmarked legacy Receive messages on a read-only route", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-current", segmentNumber: 1, text: "", language: "" }],
        activeSegmentNumber: 1,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  harness.windowLike.emitMessage({
    source: OBSERVER_SOURCE,
    type: RECEIVE_TYPE,
    payload: {
      response: {
        Items: [{
          Item: { ItemID: "item-current", Content: JSON.stringify({ audio: "https://media.example.test/current" }) },
          TempAnswer: {
            Content: JSON.stringify({
              itemID: "item-current",
              data: { regions: [{ id: "region-current", no: 1, start: 0, end: 1 }] },
            }),
          },
        }],
      },
    },
  });

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.itemId, "");
  assert.equal(context.audioUrl, "");
  assert.deepEqual(context.currentSegments, []);
});

test("AIDP data api fails closed when a read-only mark-package route has no itemID", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-first", segmentNumber: 1, text: "", language: "" }],
        activeSegmentNumber: 1,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "",
    },
  });
  emitReceive(harness.windowLike, {
    Items: [{
      Item: { ItemID: "item-first", Content: JSON.stringify({ audio: "https://media.example.test/first" }) },
      TempAnswer: {
        Content: JSON.stringify({
          itemID: "item-first",
          data: { regions: [{ id: "region-first", no: 1, start: 0, end: 1 }] },
        }),
      },
    }],
  });

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.itemId, "");
  assert.equal(context.audioUrl, "");
  assert.deepEqual(context.currentSegments, []);
});

test("AIDP data api selects the matching Receive item for a read-only mark-package route", async function () {
  const harness = createRuntimeHarness({
    document: createFakeDocument([]),
    readCurrentTableState() {
      return {
        rows: [{ regionId: "region-current", segmentNumber: 2, text: "", language: "" }],
        activeSegmentNumber: 2,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    },
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-current",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-current",
    },
  });
  emitReceive(harness.windowLike, {
    Items: [
      {
        Item: { ItemID: "item-other", Content: JSON.stringify({ audio: "https://media.example.test/other" }) },
        TempAnswer: {
          Content: JSON.stringify({
            itemID: "item-other",
            data: { regions: [{ id: "region-other", no: 1, start: 0, end: 1 }] },
          }),
        },
      },
      {
        Item: { ItemID: "item-current", Content: JSON.stringify({ audio: "https://media.example.test/current" }) },
        TempAnswer: {
          Content: JSON.stringify({
            itemID: "item-current",
            data: { regions: [{ id: "region-current", no: 2, start: 1, end: 2 }] },
          }),
        },
      },
    ],
  });

  const context = await harness.runtime.getCurrentContext();

  assert.equal(context.itemId, "item-current");
  assert.equal(context.audioUrl, "https://media.example.test/current");
  assert.deepEqual(context.currentSegments.map((segment) => segment.regionId), ["region-current"]);
});

test("AIDP data api refuses every mark-package write path without changing the page or calling SubmitTempItemAnswer", async function () {
  const textarea = new FakeElement({ tagName: "textarea", value: "unchanged" });
  const harness = createRuntimeHarness({
    document: createFakeDocument([textarea]),
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/mark-package/package-1/14?itemID=item-1",
      pathname: "/management/task-v2/task-1/mark-package/package-1/14",
      search: "?itemID=item-1",
    },
  });
  emitWorkItem(harness.windowLike, [{
    Item: { ItemID: "item-1", Content: JSON.stringify({ audio: "https://media.example.test/audio" }) },
    Answer: JSON.stringify({
      itemID: "item-1",
      data: { regions: [{ id: "region-a", no: 1, start: 0, end: 1 }] },
    }),
  }]);
  const context = await harness.runtime.getCurrentContext();

  const results = await Promise.all([
    harness.runtime.applySegmentPreview({
      selectionKey: context.selectionKey,
      proposedSegments: [{ startMs: 0, endMs: 1000 }],
    }),
    harness.runtime.clearCurrentSegments(),
    harness.runtime.fillEmptyRegionLanguages(),
    harness.runtime.fillCurrentRegionTextIntoDom({ segmentNumber: 1, listenText: "new text" }),
    harness.runtime.writeBatchRegionTexts({
      selectionKey: context.selectionKey,
      currentSignature: context.currentSignature,
      updates: [{ segmentNumber: 1, listenText: "new text" }],
    }),
  ]);

  assert.equal(results.every((result) => result.reason === "read-only"), true);
  assert.equal(textarea.value, "unchanged");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api refuses every node 17 mark-package write path", async function () {
  const textarea = new FakeElement({ tagName: "textarea", value: "unchanged" });
  const harness = createRuntimeHarness({
    document: createFakeDocument([textarea]),
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-17/mark-package/package-17/17?itemID=item-17",
      pathname: "/management/task-v2/task-17/mark-package/package-17/17",
      search: "?itemID=item-17",
    },
  });
  emitWorkItem(harness.windowLike, [{
    Item: { ItemID: "item-17", Content: JSON.stringify({ audio: "https://media.example.test/audio" }) },
    Answer: JSON.stringify({
      itemID: "item-17",
      data: { regions: [{ id: "region-a", no: 1, start: 0, end: 1 }] },
    }),
  }]);
  const context = await harness.runtime.getCurrentContext();

  const results = await Promise.all([
    harness.runtime.applySegmentPreview({
      selectionKey: context.selectionKey,
      proposedSegments: [{ startMs: 0, endMs: 1000 }],
    }),
    harness.runtime.clearCurrentSegments(),
    harness.runtime.fillEmptyRegionLanguages(),
    harness.runtime.fillCurrentRegionTextIntoDom({ segmentNumber: 1, listenText: "new text" }),
    harness.runtime.writeBatchRegionTexts({
      selectionKey: context.selectionKey,
      currentSignature: context.currentSignature,
      updates: [{ segmentNumber: 1, listenText: "new text" }],
    }),
  ]);

  assert.equal(results.every((result) => result.reason === "read-only"), true);
  assert.equal(textarea.value, "unchanged");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api imports only allowed fields and refuses every node 17 scan-v3 write path", async function () {
  const textarea = new FakeElement({ tagName: "textarea", value: "unchanged" });
  const harness = createRuntimeHarness({
    document: createFakeDocument([textarea]),
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-17/scan-v3/17/item-17",
      pathname: "/management/task-v2/task-17/scan-v3/17/item-17",
      search: "",
    },
  });
  const workItem = createRecordingWorkItem("item-17", {
    asr_text: "  node 17 scan reference  ",
    audio: " https://media.example.test/node-17-scan-audio ",
    video: "https://media.example.test/node-17-scan-video",
    authorization: "must-not-keep",
    customer: { email: "private@example.test" },
  });
  workItem.Answer = JSON.stringify({
    itemID: "item-17",
    data: {
      regions: [{ id: "region-a", no: 1, start: 0, end: 1 }],
    },
  });
  emitWorkItem(harness.windowLike, [workItem], 1000);

  const importContext = await harness.runtime.getRecordingImportContext();
  assert.deepEqual(importContext, {
    ok: true,
    sourceItemId: "item-17",
    referenceText: "node 17 scan reference",
    audioUrl: "https://media.example.test/node-17-scan-audio",
    videoUrl: "https://media.example.test/node-17-scan-video",
  });
  assert.doesNotMatch(
    JSON.stringify(importContext),
    /authorization|must-not-keep|customer|private@example/i
  );

  const context = await harness.runtime.getCurrentContext();
  const results = await Promise.all([
    harness.runtime.applySegmentPreview({
      selectionKey: context.selectionKey,
      proposedSegments: [{ startMs: 0, endMs: 1000 }],
    }),
    harness.runtime.clearCurrentSegments(),
    harness.runtime.fillEmptyRegionLanguages(),
    harness.runtime.fillCurrentRegionTextIntoDom({ segmentNumber: 1, listenText: "new text" }),
    harness.runtime.writeBatchRegionTexts({
      selectionKey: context.selectionKey,
      currentSignature: context.currentSignature,
      updates: [{ segmentNumber: 1, listenText: "new text" }],
    }),
  ]);

  assert.equal(results.every((result) => result.reason === "read-only"), true);
  assert.equal(textarea.value, "unchanged");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api resolves modify-v2 as a read-only recording detail route", function () {
  const route = loadModule().__testOnly.resolveDetailRoute({
    pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
    search: "?direction=0&nextIndex=0&status=0",
  });

  assert.deepEqual(
    {
      taskId: route.taskId,
      pageType: route.pageType,
      mode: route.mode,
      readOnly: route.readOnly,
      nodeId: route.nodeId,
      itemId: route.itemId,
    },
    {
      taskId: "task-1",
      pageType: "modify-v2",
      mode: "modify",
      readOnly: true,
      nodeId: "4",
      itemId: "item-1",
    }
  );
});

test("AIDP data api imports the matching replayed SearchModifyItem snapshot on modify-v2", async function () {
  const location = {
    origin: "https://aidp.bytedance.com",
    href: "https://aidp.bytedance.com/management/task-v2/task-1/modify-v2/4/item-1?direction=0",
    pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
    search: "?direction=0",
  };
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location,
  });
  emitSearchModifyItem(harness.windowLike, {
    taskId: "task-1",
    filterNodeId: 14,
    direction: 0,
    pageNo: 0,
    pageSize: 10,
    capturedAt: 1000,
    items: [{
      sourceItemId: "item-1",
      taskId: "task-1",
      nodeId: 4,
      referenceText: "  revise reference  ",
      audioUrl: " https://media.example.test/revise-audio ",
      videoUrl: "",
    }],
  });

  assert.deepEqual(await harness.runtime.getRecordingImportContext(), {
    ok: true,
    sourceItemId: "item-1",
    referenceText: "revise reference",
    audioUrl: "https://media.example.test/revise-audio",
    videoUrl: "",
  });
  assert.equal(await harness.runtime.getCurrentAutomationItemId(), "item-1");
  assert.equal(
    harness.windowLike.postedMessages.some((entry) =>
      entry.data?.type === "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT_REQUEST"
    ),
    true
  );
});

test("AIDP data api exposes only the current revise list page import contexts", function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 1000,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/node/14/revise?page=1",
      pathname: "/management/task-v2/task-1/node/14/revise",
      search: "?page=1",
    },
  });
  emitSearchModifyItem(harness.windowLike, {
    taskId: "task-1",
    filterNodeId: 14,
    direction: 0,
    pageNo: 0,
    pageSize: 10,
    capturedAt: 1000,
    items: Array.from({ length: 12 }, (_, index) => ({
      sourceItemId: "item-" + String(index + 1),
      taskId: "task-1",
      nodeId: 4,
      referenceText: "text-" + String(index + 1),
      audioUrl: "",
      videoUrl: "",
    })),
  });

  const context = harness.runtime.getReviseListImportContext();
  assert.equal(context.ok, true);
  assert.equal(context.items.length, 10);
  assert.equal(context.scopeKey, "taskId=task-1|page=1");
  assert.equal(context.items[0].sourceItemId, "item-1");
  assert.equal(context.items[9].sourceItemId, "item-10");
});

test("AIDP data api rejects stale and wrong-task SearchModifyItem snapshots", async function () {
  const harness = createRuntimeHarness({
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    now: () => 7001,
    searchContextTtlMs: 5000,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/modify-v2/4/item-1",
      pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
      search: "",
    },
  });
  emitSearchModifyItem(harness.windowLike, {
    taskId: "other-task",
    filterNodeId: 14,
    pageNo: 0,
    pageSize: 10,
    capturedAt: 1000,
    items: [{ sourceItemId: "item-1", taskId: "other-task", nodeId: 4, referenceText: "wrong" }],
  });

  const context = await harness.runtime.getRecordingImportContext();
  assert.equal(context.ok, false);
  assert.ok(["stale", "expired"].includes(context.reason));
});

test("AIDP data api appends a completed recording result to the unique revise textarea", async function () {
  const textarea = new FakeElement({ tagName: "textarea", value: "原返修文本" });
  const harness = createRuntimeHarness({
    document: createFakeDocument([textarea]),
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/modify-v2/4/item-1",
      pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
      search: "",
    },
  });

  const result = await harness.runtime.appendRecordingResultIntoModifyDom({
    sourceItemId: "item-1",
    status: "COMPLETED",
    text: "审核完成文本",
  });

  assert.equal(result.ok, true);
  assert.equal(result.appended, true);
  assert.equal(textarea.value, "原返修文本\n审核完成文本");
  const repeated = await harness.runtime.appendRecordingResultIntoModifyDom({
    sourceItemId: "item-1",
    status: "COMPLETED",
    text: "审核完成文本",
  });
  assert.equal(repeated.ok, true);
  assert.equal(repeated.appended, false);
  assert.equal(repeated.reason, "already-present");
  assert.equal(textarea.value, "原返修文本\n审核完成文本");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api fails closed when a revise result is unsafe to append", async function () {
  const first = new FakeElement({ tagName: "textarea", value: "one" });
  const second = new FakeElement({ tagName: "textarea", value: "two" });
  const harness = createRuntimeHarness({
    document: createFakeDocument([first, second]),
    skipReceiveSnapshot: true,
    skipSubmitSnapshot: true,
    location: {
      origin: "https://aidp.bytedance.com",
      href: "https://aidp.bytedance.com/management/task-v2/task-1/modify-v2/4/item-1",
      pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
      search: "",
    },
  });

  for (const input of [
    { sourceItemId: "wrong-item", status: "COMPLETED", text: "text" },
    { sourceItemId: "item-1", status: "AVAILABLE", text: "text" },
    { sourceItemId: "item-1", status: "COMPLETED", text: "" },
  ]) {
    const result = await harness.runtime.appendRecordingResultIntoModifyDom(input);
    assert.equal(result.ok, false);
  }
  const ambiguous = await harness.runtime.appendRecordingResultIntoModifyDom({
    sourceItemId: "item-1",
    status: "COMPLETED",
    text: "text",
  });
  assert.equal(ambiguous.ok, false);
  assert.equal(ambiguous.reason, "textarea-ambiguous");
  assert.equal(first.value, "one");
  assert.equal(second.value, "two");
  assert.equal(harness.fetchCalls.length, 0);
});

test("AIDP data api refuses disabled and readonly revise textareas", async function () {
  for (const textarea of [
    new FakeElement({ tagName: "textarea", value: "disabled", disabled: true }),
    new FakeElement({ tagName: "textarea", value: "readonly", readOnly: true }),
  ]) {
    const harness = createRuntimeHarness({
      document: createFakeDocument([textarea]),
      skipReceiveSnapshot: true,
      skipSubmitSnapshot: true,
      location: {
        origin: "https://aidp.bytedance.com",
        href: "https://aidp.bytedance.com/management/task-v2/task-1/modify-v2/4/item-1",
        pathname: "/management/task-v2/task-1/modify-v2/4/item-1",
        search: "",
      },
    });

    const result = await harness.runtime.appendRecordingResultIntoModifyDom({
      sourceItemId: "item-1",
      status: "COMPLETED",
      text: "审核完成文本",
    });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "textarea-ambiguous");
    assert.equal(textarea.value === "disabled" || textarea.value === "readonly", true);
    assert.equal(harness.fetchCalls.length, 0);
  }
});
