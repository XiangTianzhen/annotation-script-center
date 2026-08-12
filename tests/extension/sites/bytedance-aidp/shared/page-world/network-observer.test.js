"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo(
  "extension",
  "sites",
  "bytedance-aidp",
  "shared",
  "page-world",
  "network-observer.js"
);

function createFakeWindow(options) {
  const source = options || {};
  const messages = [];
  const messageListeners = new Map();
  function FakeXhr() {
    this._listeners = new Map();
    this.responseText = "";
  }
  FakeXhr.prototype.open = function () {};
  FakeXhr.prototype.send = source.xhrSend || function () {};
  FakeXhr.prototype.setRequestHeader = function () {};
  FakeXhr.prototype.addEventListener = function (type, listener) {
    this._listeners.set(String(type || ""), listener);
  };
  FakeXhr.prototype.emit = function (type) {
    this._listeners.get(String(type || ""))?.call(this);
  };

  const windowLike = {
    location: {
      href: "https://aidp.bytedance.com/management/task-v2/1/mark-v3/1",
      origin: "https://aidp.bytedance.com",
    },
    fetch:
      source.fetch ||
      function fetchStub() {
        return Promise.resolve({
          clone() {
            return {
              text() {
                return Promise.resolve("{}");
              },
            };
          },
        });
      },
    XMLHttpRequest: FakeXhr,
    postMessage(message, targetOrigin) {
      messages.push({ message, targetOrigin });
    },
    addEventListener(type, listener) {
      messageListeners.set(String(type || ""), listener);
    },
    removeEventListener(type, listener) {
      const key = String(type || "");
      if (messageListeners.get(key) === listener) {
        messageListeners.delete(key);
      }
    },
    emitMessage(data, origin) {
      messageListeners.get("message")?.({
        data,
        origin: origin || "https://aidp.bytedance.com",
        source: windowLike,
      });
    },
    messages,
  };
  return windowLike;
}

function loadObserverModule(windowLike) {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  globalThis.window = windowLike;
  globalThis.location = windowLike.location;
  return require(modulePath);
}

test("shared AIDP network observer exports generic constants and installs only once per page", function () {
  const windowLike = createFakeWindow();

  try {
    const firstModule = loadObserverModule(windowLike);
    const wrappedFetch = windowLike.fetch;
    const wrappedOpen = windowLike.XMLHttpRequest.prototype.open;

    assert.equal(
      firstModule.constants.SOURCE,
      "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER"
    );
    assert.equal(
      firstModule.constants.RECEIVE_TYPE,
      "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT"
    );
    assert.equal(
      firstModule.constants.SUBMIT_TYPE,
      "BYTEDANCE_AIDP_SUBMIT_SNAPSHOT"
    );
    assert.equal(
      firstModule.constants.SEARCH_ITEM_TYPE,
      "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT"
    );
    assert.equal(
      firstModule.constants.SEARCH_MODIFY_ITEM_TYPE,
      "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT"
    );
    assert.equal(
      firstModule.constants.SEARCH_MODIFY_ITEM_REPLAY_REQUEST_TYPE,
      "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT_REQUEST"
    );
    assert.equal(windowLike.__ASREdgeBytedanceAidpNetworkObserverInstalled, true);

    const secondModule = loadObserverModule(windowLike);

    assert.equal(windowLike.fetch, wrappedFetch);
    assert.equal(windowLike.XMLHttpRequest.prototype.open, wrappedOpen);
    assert.equal(
      secondModule.constants.SOURCE,
      "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER"
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer sends safe fields for every Search Item fetch entry", async function () {
  const searchResponse = {
    Data: [
      {
        ItemID: "source-item-1",
        Content: JSON.stringify({
          asr_text: "  完整题目文本  ",
          audio: "https://media.example.test/audio?signature=masked",
          video: "https://media.example.test/video?signature=masked",
          user: { name: "不得发送" },
          email: "private@example.test",
          Tenant: "private-tenant",
        }),
        User: { Name: "不得发送" },
        Email: "private@example.test",
      },
      {
        ItemID: "source-item-2",
        Content: JSON.stringify({
          asr_text: "  第二条完整题目文本  ",
          audio: "https://media.example.test/audio-2?signature=masked",
          video: "https://media.example.test/video-2?signature=masked",
          user: { name: "仍然不得发送" },
        }),
        Users: [{ Email: "second-private@example.test" }],
      },
    ],
    Authorization: "Bearer must-not-send",
  };
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify(searchResponse);
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch(
      "https://aidp.bytedance.com/dispatcher/search_item/category",
      {
        headers: {
          Cookie: "must-not-send",
          Authorization: "Bearer must-not-send",
        },
      }
    );
    await new Promise((resolve) => setImmediate(resolve));

    const searchMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT";
    });
    assert.deepEqual(searchMessage, {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT",
        payload: {
          items: [
            {
              sourceItemId: "source-item-1",
              referenceText: "完整题目文本",
              audioUrl: "https://media.example.test/audio?signature=masked",
              videoUrl: "https://media.example.test/video?signature=masked",
            },
            {
              sourceItemId: "source-item-2",
              referenceText: "第二条完整题目文本",
              audioUrl: "https://media.example.test/audio-2?signature=masked",
              videoUrl: "https://media.example.test/video-2?signature=masked",
            },
          ],
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(windowLike.messages),
      /private@example|second-private@example|private-tenant|Authorization|Cookie|Bearer|must-not-send/
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer captures and sanitizes Search Item XHR responses", function () {
  const windowLike = createFakeWindow();

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open(
      "POST",
      "https://aidp.bytedance.com/dispatcher/search_item/category?query=masked"
    );
    xhr.send("{}");
    xhr.responseText = JSON.stringify({
      Data: [
        {
          ItemID: "source-item-xhr",
          Content: JSON.stringify({
            asr_text: "",
            audio: "https://media.example.test/audio-xhr",
            video: "",
            authorization: "must-not-send",
          }),
        },
      ],
    });
    xhr.emit("load");

    const searchMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT";
    });
    assert.deepEqual(searchMessage.message.payload, {
      items: [
        {
          sourceItemId: "source-item-xhr",
          referenceText: "",
          audioUrl: "https://media.example.test/audio-xhr",
          videoUrl: "",
        },
      ],
    });
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /authorization|must-not-send/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer associates SearchModifyItem fetch request scope with sanitized items", async function () {
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify({
                Total: 562,
                Items: [
                  {
                    ItemID: "modify-item-1",
                    TaskID: "task-1",
                    NodeID: 4,
                    Content: JSON.stringify({
                      asr_text: "  台州话参考文本  ",
                      audio: "https://media.example.test/audio?signature=masked",
                      video: "https://media.example.test/video?signature=masked",
                      operator: { email: "private@example.test" },
                    }),
                    Operator: { Email: "private@example.test" },
                  },
                  {
                    ItemID: "invalid-json",
                    TaskID: "task-1",
                    NodeID: 4,
                    Content: "{not-json",
                  },
                  {
                    ItemID: "empty-content",
                    TaskID: "task-1",
                    NodeID: 4,
                    Content: JSON.stringify({ asr_text: " ", audio: "", video: "" }),
                  },
                ],
                Users: [{ Email: "response-private@example.test" }],
              });
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch(
      "https://aidp.bytedance.com/api/dispatch/SearchModifyItem?msToken=must-not-send",
      {
        method: "POST",
        headers: {
          Cookie: "must-not-send",
          Authorization: "Bearer must-not-send",
        },
        body: JSON.stringify({
          Filter: { TaskID: "task-1", NodeID: 14, Direction: 0 },
          PageRequest: { PageNo: 2, PageSize: 10 },
          Private: { Email: "request-private@example.test" },
        }),
      }
    );
    await new Promise((resolve) => setImmediate(resolve));

    const entry = windowLike.messages.find(function (candidate) {
      return candidate.message.type === "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT";
    });
    assert.equal(Number.isFinite(entry?.message?.payload?.capturedAt), true);
    assert.deepEqual(entry, {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT",
        payload: {
          taskId: "task-1",
          filterNodeId: 14,
          direction: 0,
          pageNo: 2,
          pageSize: 10,
          capturedAt: entry.message.payload.capturedAt,
          items: [
            {
              sourceItemId: "modify-item-1",
              taskId: "task-1",
              nodeId: 4,
              referenceText: "台州话参考文本",
              audioUrl: "https://media.example.test/audio?signature=masked",
              videoUrl: "https://media.example.test/video?signature=masked",
            },
          ],
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(entry),
      /msToken|must-not-send|Authorization|Cookie|Private|Operator|private@example|request-private|response-private/i
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer associates SearchModifyItem XHR body without exposing private fields", function () {
  const windowLike = createFakeWindow();

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open(
      "POST",
      "https://aidp.bytedance.com/api/dispatch/SearchModifyItem?a_bogus=must-not-send"
    );
    xhr.setRequestHeader("Authorization", "Bearer must-not-send");
    xhr.send(JSON.stringify({
      Filter: { TaskID: "task-xhr", NodeID: 14, Direction: 1 },
      PageRequest: { PageNo: 0, PageSize: 10 },
      User: { Email: "request-xhr-private@example.test" },
    }));
    xhr.responseText = JSON.stringify({
      Items: [
        {
          ItemID: "modify-item-xhr",
          TaskID: "task-xhr",
          NodeID: 4,
          Content: JSON.stringify({
            asr_text: "",
            audio: "https://media.example.test/audio-xhr",
            video: "",
            Authorization: "must-not-send",
          }),
          Advice: "private-advice",
        },
      ],
      PackageBackInfo: { User: { Email: "response-xhr-private@example.test" } },
    });
    xhr.emit("load");

    const entry = windowLike.messages.find(function (candidate) {
      return candidate.message.type === "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT";
    });
    assert.equal(Number.isFinite(entry?.message?.payload?.capturedAt), true);
    assert.deepEqual(entry?.message?.payload, {
      taskId: "task-xhr",
      filterNodeId: 14,
      direction: 1,
      pageNo: 0,
      pageSize: 10,
      capturedAt: entry.message.payload.capturedAt,
      items: [
        {
          sourceItemId: "modify-item-xhr",
          taskId: "task-xhr",
          nodeId: 4,
          referenceText: "",
          audioUrl: "https://media.example.test/audio-xhr",
          videoUrl: "",
        },
      ],
    });
    assert.doesNotMatch(
      JSON.stringify(entry),
      /a_bogus|must-not-send|Authorization|Advice|PackageBackInfo|request-xhr-private|response-xhr-private/i
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer replays only the latest sanitized SearchModifyItem snapshot", async function () {
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify({
                Items: [{
                  ItemID: "modify-replay",
                  TaskID: "task-replay",
                  NodeID: 4,
                  Content: JSON.stringify({
                    asr_text: "重放文本",
                    audio: "https://media.example.test/replay",
                    video: "",
                  }),
                  Operator: { Email: "private@example.test" },
                }],
              });
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch(
      "https://aidp.bytedance.com/api/dispatch/SearchModifyItem?msToken=must-not-send",
      {
        method: "POST",
        body: JSON.stringify({
          Filter: { TaskID: "task-replay", NodeID: 14, Direction: 0 },
          PageRequest: { PageNo: 0, PageSize: 10 },
        }),
      }
    );
    await new Promise((resolve) => setImmediate(resolve));

    windowLike.emitMessage({
      source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
      type: "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT_REQUEST",
    });
    windowLike.emitMessage(
      {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT_REQUEST",
      },
      "https://attacker.example.test"
    );

    const snapshots = windowLike.messages.filter(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_SEARCH_MODIFY_ITEM_SNAPSHOT";
    });
    assert.equal(snapshots.length, 2);
    assert.deepEqual(snapshots[1], snapshots[0]);
    assert.doesNotMatch(
      JSON.stringify(snapshots),
      /msToken|must-not-send|Operator|private@example/i
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer publishes count-only lifecycle for every fetch settlement", async function () {
  let resolveFetch = null;
  const windowLike = createFakeWindow({
    fetch: function () {
      return new Promise(function (resolve) {
        resolveFetch = resolve;
      });
    },
  });

  try {
    loadObserverModule(windowLike);
    const request = windowLike.fetch(
      "https://aidp.bytedance.com/api/dispatch/Defer?authorization=must-not-send"
    );

    assert.deepEqual(windowLike.messages.at(-1), {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_NETWORK_ACTIVITY",
        payload: {
          pendingCount: 1,
          activitySequence: 1,
        },
      },
    });

    resolveFetch({ ok: true });
    await request;
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(windowLike.messages.at(-1), {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_NETWORK_ACTIVITY",
        payload: {
          pendingCount: 0,
          activitySequence: 2,
        },
      },
    });
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /Defer|authorization|must-not-send/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer settles XHR activity on loadend", function () {
  const windowLike = createFakeWindow();

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open("POST", "https://aidp.bytedance.com/api/dispatch/Defer");
    xhr.send("sensitive-body");
    xhr.emit("loadend");

    assert.deepEqual(
      windowLike.messages.map((entry) => entry.message),
      [
        {
          source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
          type: "BYTEDANCE_AIDP_NETWORK_ACTIVITY",
          payload: { pendingCount: 1, activitySequence: 1 },
        },
        {
          source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
          type: "BYTEDANCE_AIDP_NETWORK_ACTIVITY",
          payload: { pendingCount: 0, activitySequence: 2 },
        },
      ]
    );
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /Defer|sensitive-body/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer settles rejected fetch activity", async function () {
  const windowLike = createFakeWindow({
    fetch: function () {
      return Promise.reject(new Error("network rejected"));
    },
  });

  try {
    loadObserverModule(windowLike);
    await assert.rejects(
      windowLike.fetch("https://aidp.bytedance.com/api/dispatch/Defer"),
      /network rejected/
    );
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(
      windowLike.messages.map((entry) => entry.message.payload),
      [
        { pendingCount: 1, activitySequence: 1 },
        { pendingCount: 0, activitySequence: 2 },
      ]
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer settles a canceled fetch without exposing its details", async function () {
  const cancellation = Object.assign(new Error("request canceled"), { name: "AbortError" });
  const windowLike = createFakeWindow({
    fetch: function () {
      return Promise.reject(cancellation);
    },
  });

  try {
    loadObserverModule(windowLike);
    await assert.rejects(
      windowLike.fetch("https://aidp.bytedance.com/api/dispatch/Defer?request=private"),
      cancellation
    );
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(
      windowLike.messages.map((entry) => entry.message.payload),
      [
        { pendingCount: 1, activitySequence: 1 },
        { pendingCount: 0, activitySequence: 2 },
      ]
    );
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /request=private|AbortError/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer settles XHR timeout through loadend", function () {
  const windowLike = createFakeWindow();

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open("GET", "https://aidp.bytedance.com/api/dispatch/Defer");
    xhr.send();
    xhr.emit("timeout");
    assert.deepEqual(windowLike.messages.at(-1).message.payload, {
      pendingCount: 1,
      activitySequence: 1,
    });

    xhr.emit("loadend");
    assert.deepEqual(windowLike.messages.at(-1).message.payload, {
      pendingCount: 0,
      activitySequence: 2,
    });
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer settles a synchronous XHR send exception", function () {
  const windowLike = createFakeWindow({
    xhrSend: function () {
      throw new Error("send failed");
    },
  });

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open("POST", "https://aidp.bytedance.com/api/dispatch/Defer");
    assert.throws(function () {
      xhr.send("private body");
    }, /send failed/);

    assert.deepEqual(
      windowLike.messages.map((entry) => entry.message.payload),
      [
        { pendingCount: 1, activitySequence: 1 },
        { pendingCount: 0, activitySequence: 2 },
      ]
    );
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /private body|send failed/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer sends only the current Receive snapshot fields for fetch", async function () {
  const itemContent = JSON.stringify({
    audio: "https://media.example.test/audio?signature=masked",
    video: "https://media.example.test/video?signature=masked",
  });
  const tempAnswerContent = JSON.stringify({
    itemID: "item-receive-fetch",
    data: {
      regions: [{ id: "region-receive-fetch", no: 1, start: 0, end: 1 }],
    },
  });
  const receiveResponse = {
    PackageID: "private-package",
    Items: [{
      PackageID: "private-package",
      Item: {
        ItemID: "item-receive-fetch",
        Content: itemContent,
        Users: [{ Email: "private@example.test" }],
      },
      TempAnswer: {
        Content: tempAnswerContent,
        TimeStamp: "private-timestamp",
      },
      Answer: "private-answer",
      AuditHistory: [{ User: { Email: "audit-private@example.test" } }],
    }],
    BaseResp: { StatusCode: 0 },
  };
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify(receiveResponse);
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch(
      "https://aidp.bytedance.com/api/dispatch/Receive?msToken=must-not-send"
    );
    await new Promise((resolve) => setImmediate(resolve));

    const receiveMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT";
    });
    assert.deepEqual(receiveMessage, {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT",
        payload: {
          snapshotVersion: 1,
          response: {
            Items: [{
              Item: {
                ItemID: "item-receive-fetch",
                Content: itemContent,
              },
              TempAnswer: {
                Content: tempAnswerContent,
              },
            }],
          },
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(receiveMessage),
      /msToken|must-not-send|private-package|private@example|audit-private|private-answer|private-timestamp|BaseResp/
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer sends only the current Receive snapshot fields for XHR", function () {
  const itemContent = JSON.stringify({ audio: "https://media.example.test/audio-xhr" });
  const tempAnswerContent = JSON.stringify({
    itemID: "item-receive-xhr",
    dataMap: {
      regions: [{ id: "region-receive-xhr", no: 2, start: 1, end: 2 }],
    },
  });
  const windowLike = createFakeWindow();

  try {
    loadObserverModule(windowLike);
    const xhr = new windowLike.XMLHttpRequest();
    xhr.open(
      "POST",
      "https://aidp.bytedance.com/api/dispatch/Receive?authorization=must-not-send"
    );
    xhr.send("private-request-body");
    xhr.responseText = JSON.stringify({
      Data: {
        Items: [{
          Item: {
            ItemID: "item-receive-xhr",
            Content: itemContent,
            User: { Email: "private-xhr@example.test" },
          },
          TempAnswer: {
            Content: tempAnswerContent,
            ItemID: "private-temp-answer-item-id",
          },
          AuditHistory: [{ User: { Email: "audit-xhr@example.test" } }],
        }],
      },
      Authorization: "must-not-send",
    });
    xhr.emit("load");

    const receiveMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT";
    });
    assert.deepEqual(receiveMessage?.message?.payload, {
      snapshotVersion: 1,
      response: {
        Data: {
          Items: [{
            Item: {
              ItemID: "item-receive-xhr",
              Content: itemContent,
            },
            TempAnswer: {
              Content: tempAnswerContent,
            },
          }],
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(receiveMessage),
      /authorization|must-not-send|private-request-body|private-xhr|audit-xhr|private-temp-answer-item-id/i
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer preserves and sanitizes lowercase Receive data.items containers", async function () {
  const itemContent = JSON.stringify({ audio: "https://media.example.test/audio-lowercase" });
  const tempAnswerContent = JSON.stringify({
    itemID: "item-receive-lowercase",
    data: { regions: [{ id: "region-receive-lowercase", no: 3, start: 2, end: 3 }] },
  });
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify({
                data: {
                  items: [{
                    Item: {
                      ItemID: "item-receive-lowercase",
                      Content: itemContent,
                      User: { Email: "private-lowercase@example.test" },
                    },
                    TempAnswer: {
                      Content: tempAnswerContent,
                      AuditHistory: [{ User: { Email: "audit-lowercase@example.test" } }],
                    },
                  }],
                },
              });
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch("https://aidp.bytedance.com/api/dispatch/Receive?opaque=must-not-send");
    await new Promise((resolve) => setImmediate(resolve));

    const receiveMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_RECEIVE_SNAPSHOT";
    });
    assert.deepEqual(receiveMessage?.message?.payload, {
      snapshotVersion: 1,
      response: {
        data: {
          items: [{
            Item: {
              ItemID: "item-receive-lowercase",
              Content: itemContent,
            },
            TempAnswer: {
              Content: tempAnswerContent,
            },
          }],
        },
      },
    });
    assert.doesNotMatch(JSON.stringify(receiveMessage), /opaque|must-not-send|private-lowercase|audit-lowercase/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer publishes a GetWorkItem response without request credentials", async function () {
  const workItemResponse = [{
    Item: {
      ItemID: "item-1",
      Content: JSON.stringify({ audio: "https://media.example.test/audio?signature=masked" }),
    },
    Answer: JSON.stringify({
      data: {
        regions: [{ id: "region-a", no: 1, start: 0, end: 1 }],
      },
    }),
    AuditHistory: [{ User: { Email: "private@example.test" } }],
  }];
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify(workItemResponse);
            },
          };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch(
      "https://aidp.bytedance.com/api/dispatch/GetWorkItem?msToken=must-not-send",
      { headers: { Cookie: "must-not-send", Authorization: "must-not-send" } }
    );
    await new Promise((resolve) => setImmediate(resolve));

    const message = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT";
    });
    const capturedAt = message?.message?.payload?.capturedAt;
    assert.equal(Number.isFinite(capturedAt), true);
    assert.ok(capturedAt > 0);
    assert.deepEqual(message, {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT",
        payload: {
          capturedAt: capturedAt,
          response: [{
            Item: workItemResponse[0].Item,
            Answer: workItemResponse[0].Answer,
          }],
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(message),
      /msToken|Cookie|Authorization|must-not-send|AuditHistory|private@example/
    );
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer upgrades a legacy install flag so GetWorkItem stays observable", async function () {
  const workItemResponse = [{
    Item: {
      ItemID: "item-legacy",
      Content: JSON.stringify({ audio: "https://media.example.test/audio?signature=masked" }),
    },
    Answer: JSON.stringify({ data: { regions: [{ id: "region-legacy", no: 1, start: 0, end: 1 }] } }),
  }];
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return {
            async text() {
              return JSON.stringify(workItemResponse);
            },
          };
        },
      };
    },
  });
  windowLike.__ASREdgeBytedanceAidpNetworkObserverInstalled = true;

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch("https://aidp.bytedance.com/api/dispatch/GetWorkItem?opaque=masked");
    await new Promise((resolve) => setImmediate(resolve));

    const workItemMessage = windowLike.messages.find(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT";
    });
    assert.equal(workItemMessage?.message?.payload?.response?.[0]?.Item?.ItemID, "item-legacy");
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});

test("shared AIDP network observer replays only the sanitized latest GetWorkItem snapshot on request", async function () {
  const workItemResponse = [{
    Item: {
      ItemID: "item-1",
      Content: JSON.stringify({ audio: "https://media.example.test/audio?signature=masked" }),
    },
    Answer: JSON.stringify({ data: { regions: [{ id: "region-a", no: 1, start: 0, end: 1 }] } }),
    AuditHistory: [{ User: { Email: "private@example.test" } }],
  }];
  const windowLike = createFakeWindow({
    fetch: async function () {
      return {
        clone() {
          return { text: async function () { return JSON.stringify(workItemResponse); } };
        },
      };
    },
  });

  try {
    loadObserverModule(windowLike);
    await windowLike.fetch("https://aidp.bytedance.com/api/dispatch/GetWorkItem?msToken=must-not-send");
    await new Promise((resolve) => setImmediate(resolve));
    windowLike.emitMessage({
      source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
      type: "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT_REQUEST",
    });

    const snapshots = windowLike.messages.filter(function (entry) {
      return entry.message.type === "BYTEDANCE_AIDP_WORK_ITEM_SNAPSHOT";
    });
    assert.equal(snapshots.length, 2);
    assert.deepEqual(snapshots[1], snapshots[0]);
    assert.equal(Number.isFinite(snapshots[1].message.payload.capturedAt), true);
    assert.doesNotMatch(JSON.stringify(snapshots[1]), /msToken|AuditHistory|private@example/);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});
