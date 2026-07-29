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

  return {
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
    messages,
  };
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
