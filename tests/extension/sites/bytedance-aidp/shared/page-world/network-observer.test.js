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
  FakeXhr.prototype.send = function () {};
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

test("shared AIDP network observer sends only the safe Search Item fields for fetch", async function () {
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

    assert.equal(windowLike.messages.length, 1);
    assert.deepEqual(windowLike.messages[0], {
      targetOrigin: "https://aidp.bytedance.com",
      message: {
        source: "ASR_EDGE_BYTEDANCE_AIDP_OBSERVER",
        type: "BYTEDANCE_AIDP_SEARCH_ITEM_SNAPSHOT",
        payload: {
          sourceItemId: "source-item-1",
          referenceText: "完整题目文本",
          audioUrl: "https://media.example.test/audio?signature=masked",
          videoUrl: "https://media.example.test/video?signature=masked",
        },
      },
    });
    assert.doesNotMatch(
      JSON.stringify(windowLike.messages),
      /private@example|private-tenant|Authorization|Cookie|Bearer|must-not-send/
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

    assert.equal(windowLike.messages.length, 1);
    assert.deepEqual(windowLike.messages[0].message.payload, {
      sourceItemId: "source-item-xhr",
      referenceText: "",
      audioUrl: "https://media.example.test/audio-xhr",
      videoUrl: "",
    });
    assert.doesNotMatch(JSON.stringify(windowLike.messages), /authorization|must-not-send/i);
  } finally {
    delete require.cache[modulePath];
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.ASREdgeBytedanceAidpNetworkObserverPage;
  }
});
