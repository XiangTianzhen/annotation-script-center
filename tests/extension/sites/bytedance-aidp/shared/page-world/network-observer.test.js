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

function createFakeWindow() {
  function FakeXhr() {}
  FakeXhr.prototype.open = function () {};
  FakeXhr.prototype.send = function () {};
  FakeXhr.prototype.setRequestHeader = function () {};

  return {
    location: {
      href: "https://aidp.bytedance.com/management/task-v2/1/mark-v3/1",
      origin: "https://aidp.bytedance.com",
    },
    fetch: function fetchStub() {
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
    postMessage() {},
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
