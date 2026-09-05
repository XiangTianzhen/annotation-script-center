"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const observer = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "page-world", "network-observer.js"));

function createFakeXhrClass() {
  return class FakeXMLHttpRequest {
    constructor() {
      this.listeners = new Map();
      this.status = 0;
      this.response = null;
      this.responseText = "";
      this.responseHeaders = {};
      this.sendCount = 0;
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    open(method, url) {
      this.method = method;
      this.url = url;
    }

    send() {
      this.sendCount += 1;
      this.dispatch("loadstart");
      this.dispatch("load");
    }

    dispatch(type) {
      for (const listener of this.listeners.get(type) || []) listener.call(this, { type });
    }

    getResponseHeader(name) {
      return this.responseHeaders[String(name || "").toLowerCase()] || "";
    }
  };
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

test("execute request URL supplies taskId when response body only has detail dataId", async () => {
  const messages = [];
  const calls = [];
  const sourceUrl = "https://storage.shujiajia.com/store/audio.wav?v=1";
  const instance = observer.createObserver({
    emit: (message) => messages.push(message),
    fetchAudio: async (url) => {
      calls.push(url);
      return { ok: true, headers: { get: () => "audio/wav" }, arrayBuffer: async () => Uint8Array.from([1]).buffer };
    },
  });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task-safe&executeClass=TAG_PIECE", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item-safe", fileFolder: sourceUrl } } }) }),
  }, { method: "GET" });

  assert.deepEqual(calls, [sourceUrl]);
  assert.deepEqual(messages.map((message) => message.type), [observer.constants.CONTEXT_READY, observer.constants.AUDIO_READY]);
  assert.equal(messages[0].payload.contextId, "task-safe:item-safe");
  assert.equal(JSON.stringify(messages).includes("?v=1"), false);
});

test("execute identity and audio failures emit only safe status codes", async () => {
  const cases = [
    { url: "/web-task-alone-api/task/piece/execute", detail: { dataId: "item", fileFolder: "https://storage.shujiajia.com/store/audio.wav" }, code: "identity-unavailable" },
    { url: "/web-task-alone-api/task/piece/execute?taskId=task", detail: { fileFolder: "https://storage.shujiajia.com/store/audio.wav" }, code: "identity-unavailable" },
    { url: "/web-task-alone-api/task/piece/execute?taskId=task", detail: { dataId: "item", fileFolder: "https://example.invalid/private.wav?v=1" }, code: "source-invalid" },
  ];
  for (const fixture of cases) {
    const messages = [];
    const instance = observer.createObserver({ emit: (message) => messages.push(message), fetchAudio: async () => { throw new Error("must not fetch"); } });
    instance.enable({});
    await instance.captureResponse(fixture.url, {
      ok: true,
      clone: () => ({ json: async () => ({ data: { detail: fixture.detail } }) }),
    }, { method: "GET" });
    const status = messages.find((message) => message.type === observer.constants.AUDIO_STATUS);
    assert.equal(status?.payload.code, fixture.code);
    assert.deepEqual(Object.keys(status.payload).sort(), ["code", "contextId"]);
    assert.equal(JSON.stringify(status).includes("private.wav"), false);
    assert.equal(JSON.stringify(status).includes("?v=1"), false);
  }
});

test("direct audio download failures expose distinct safe status codes", async () => {
  const fixtures = [
    { response: { ok: false, headers: { get: () => "audio/wav" } }, code: "download-failed" },
    { response: { ok: true, headers: { get: () => "text/html" }, arrayBuffer: async () => Uint8Array.from([1]).buffer }, code: "unsupported-audio" },
    { response: { ok: true, headers: { get: (name) => name.toLowerCase() === "content-length" ? String(10 * 1024 * 1024 + 1) : "audio/wav" }, arrayBuffer: async () => { throw new Error("must not read"); } }, code: "audio-too-large" },
    { error: new Error("internal-error-detail"), code: "download-failed" },
  ];
  for (let index = 0; index < fixtures.length; index += 1) {
    const messages = [];
    const fixture = fixtures[index];
    const instance = observer.createObserver({
      emit: (message) => messages.push(message),
      fetchAudio: async () => { if (fixture.error) throw fixture.error; return fixture.response; },
    });
    instance.enable({});
    await instance.captureResponse(`/web-task-alone-api/task/piece/execute?taskId=task-${index}`, {
      ok: true,
      clone: () => ({ json: async () => ({ data: { detail: { dataId: `item-${index}`, fileFolder: "https://storage.shujiajia.com/store/audio.wav?v=1" } } }) }),
    }, { method: "GET" });
    const status = messages.find((message) => message.type === observer.constants.AUDIO_STATUS);
    assert.equal(status?.payload.code, fixture.code);
    assert.equal(JSON.stringify(status).includes("?v=1"), false);
    assert.equal(JSON.stringify(status).includes("internal-error-detail"), false);
  }
});

test("observer emits audio bytes without exposing the source URL", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  instance.setContext("task:item");
  messages.length = 0;
  await instance.captureResponse("https://storage.invalid/private/audio.wav", {
    ok: true,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? "audio/wav" : "" },
    clone() { return { arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer }; },
  });
  assert.equal(messages[0].type, observer.constants.AUDIO_READY);
  assert.equal(messages[0].payload.contextId, "task:item");
  assert.equal(messages[0].payload.audioDataUrl, "data:audio/wav;base64,AQID");
  assert.equal(JSON.stringify(messages[0]).includes("storage.invalid"), false);
});

test("observer emits only a matching successful temporary-save state", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  instance.setContext("task:item");
  messages.length = 0;
  instance.setSaveIntent({ contextId: "task:item", dirtyToken: "v1" });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute/tempsave", { ok: false, status: 500, headers: { get: () => "" } });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute/tempsave", { ok: true, status: 200, headers: { get: () => "application/json" }, clone: () => ({ json: async () => ({ success: true }) }) });
  assert.deepEqual(messages, [{ source: observer.constants.SOURCE, type: observer.constants.TEMP_SAVE_SUCCEEDED, payload: { ok: true, contextId: "task:item", dirtyToken: "v1" } }]);
});

test("observer installs a dormant request wrapper before explicit enable", () => {
  const originalFetch = async () => ({ ok: true });
  const windowLike = { fetch: originalFetch, addEventListener() {} };
  const instance = observer.createObserver({ emit() {} });
  instance.installController(windowLike);
  assert.notEqual(windowLike.fetch, originalFetch);
  const wrappedFetch = windowLike.fetch;
  instance.enable(windowLike);
  assert.equal(windowLike.fetch, wrappedFetch);
});

test("XHR observation preserves native send and ignores unrelated platform requests", async () => {
  const messages = [];
  const FakeXMLHttpRequest = createFakeXhrClass();
  const nativeSend = FakeXMLHttpRequest.prototype.send;
  const windowLike = { XMLHttpRequest: FakeXMLHttpRequest, addEventListener() {} };
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });

  instance.installController(windowLike);

  assert.equal(FakeXMLHttpRequest.prototype.send, nativeSend);
  const xhr = new FakeXMLHttpRequest();
  xhr.status = 200;
  xhr.response = { templateTypes: [] };
  xhr.open("GET", "https://template.shujiajia.com/dist/templateTypeSummary.json");
  xhr.send();
  await flushAsyncWork();

  assert.equal(xhr.sendCount, 1);
  assert.equal(Object.keys(xhr).some((key) => key.startsWith("__ascShujiajia")), false);
  assert.deepEqual(messages, []);
});

test("XHR observation handles reused instances once per execute response", async () => {
  const messages = [];
  const FakeXMLHttpRequest = createFakeXhrClass();
  const windowLike = { XMLHttpRequest: FakeXMLHttpRequest, addEventListener() {} };
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  await instance.enable(windowLike);
  const xhr = new FakeXMLHttpRequest();

  xhr.status = 200;
  xhr.response = { data: { detail: { dataId: "first" } } };
  xhr.open("GET", "/web-task-alone-api/task/piece/execute?taskId=task");
  xhr.send();
  await flushAsyncWork();
  xhr.response = { data: { detail: { dataId: "second" } } };
  xhr.open("GET", "/web-task-alone-api/task/piece/execute?taskId=task");
  xhr.send();
  await flushAsyncWork();

  assert.deepEqual(
    messages.filter((message) => message.type === observer.constants.CONTEXT_READY).map((message) => message.payload.contextId),
    ["task:first", "task:second"]
  );
});

test("XHR observation confirms only a matching successful temporary save", async () => {
  const messages = [];
  const FakeXMLHttpRequest = createFakeXhrClass();
  const windowLike = { XMLHttpRequest: FakeXMLHttpRequest, addEventListener() {} };
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  await instance.enable(windowLike);
  instance.setContext("task:item");
  messages.length = 0;
  instance.setSaveIntent({ contextId: "task:item", dirtyToken: "save-1" });
  const xhr = new FakeXMLHttpRequest();
  xhr.status = 200;
  xhr.response = { success: true };

  xhr.open("POST", "/web-task-alone-api/task/piece/execute/tempsave");
  xhr.send();
  await flushAsyncWork();

  assert.deepEqual(messages, [{
    source: observer.constants.SOURCE,
    type: observer.constants.TEMP_SAVE_SUCCEEDED,
    payload: { ok: true, contextId: "task:item", dirtyToken: "save-1" },
  }]);
});

test("XHR observation drops audio whose load started on the previous item", async () => {
  const messages = [];
  const FakeXMLHttpRequest = createFakeXhrClass();
  const windowLike = { XMLHttpRequest: FakeXMLHttpRequest, addEventListener() {} };
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  await instance.enable(windowLike);
  instance.setContext("task:old");
  messages.length = 0;
  const xhr = new FakeXMLHttpRequest();
  xhr.status = 200;
  xhr.response = Uint8Array.from([1, 2, 3]).buffer;
  xhr.responseHeaders["content-type"] = "audio/wav";

  xhr.open("GET", "https://storage.shujiajia.com/store/old.wav");
  xhr.dispatch("loadstart");
  instance.setContext("task:new");
  messages.length = 0;
  xhr.dispatch("load");
  await flushAsyncWork();

  assert.deepEqual(messages, []);
});

test("observer consumes the latest execute snapshot after delayed enable", async () => {
  const messages = [];
  const calls = [];
  const sourceUrl = "https://storage.shujiajia.com/store/delayed.wav?redacted=1";
  const instance = observer.createObserver({
    emit: (message) => messages.push(message),
    fetchAudio: async (url) => {
      calls.push(url);
      return {
        ok: true,
        headers: { get: () => "audio/wav" },
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
      };
    },
  });

  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "delayed", fileFolder: sourceUrl } } }) }),
  }, { method: "GET" });

  assert.deepEqual(messages, []);
  assert.deepEqual(calls, []);
  await instance.enable({});

  assert.deepEqual(calls, [sourceUrl]);
  assert.deepEqual(messages.map((message) => message.type), [observer.constants.CONTEXT_READY, observer.constants.AUDIO_READY]);
  assert.equal(JSON.stringify(messages).includes("storage.shujiajia.com"), false);
  assert.equal(JSON.stringify(messages).includes("redacted=1"), false);
});

test("observer clears a dormant execute snapshot when disabled", async () => {
  let fetchCount = 0;
  const instance = observer.createObserver({
    emit() {},
    fetchAudio: async () => {
      fetchCount += 1;
      return { ok: true, headers: { get: () => "audio/wav" }, arrayBuffer: async () => Uint8Array.from([1]).buffer };
    },
  });

  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "discarded", fileFolder: "https://storage.shujiajia.com/store/discarded.wav" } } }) }),
  }, { method: "GET" });
  instance.disable();
  await instance.enable({});

  assert.equal(fetchCount, 0);
});

test("observer does not restore an in-flight dormant snapshot after disable", async () => {
  let resolveJson;
  let fetchCount = 0;
  const instance = observer.createObserver({
    emit() {},
    fetchAudio: async () => {
      fetchCount += 1;
      return { ok: true, headers: { get: () => "audio/wav" }, arrayBuffer: async () => Uint8Array.from([1]).buffer };
    },
  });
  const pendingCapture = instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: () => new Promise((resolve) => { resolveJson = resolve; }) }),
  }, { method: "GET" });
  await Promise.resolve();
  instance.disable();
  resolveJson({ data: { detail: { dataId: "stale", fileFolder: "https://storage.shujiajia.com/store/stale.wav" } } });
  await pendingCapture;
  await instance.enable({});

  assert.equal(fetchCount, 0);
});

test("observer derives a new item context from the execute response and clears stale audio", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item" } } }) }),
  });
  assert.deepEqual(messages, [
    { source: observer.constants.SOURCE, type: observer.constants.CONTEXT_READY, payload: { contextId: "task:item" } },
    { source: observer.constants.SOURCE, type: observer.constants.AUDIO_STATUS, payload: { contextId: "task:item", code: "source-invalid" } },
  ]);
  assert.equal(instance.getLatestAudioDataUrl(), "");
});

test("observer does not accept HTTP-only temporary-save success", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  instance.setContext("task:item");
  messages.length = 0;
  instance.setSaveIntent({ contextId: "task:item", dirtyToken: "v1" });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute/tempsave", {
    ok: true,
    clone: () => ({ json: async () => ({ success: false, code: 500 }) }),
  });
  assert.deepEqual(messages, []);
});

test("observer drops an audio response whose request started on the previous item", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  instance.setContext("task:old");
  messages.length = 0;
  instance.setContext("task:new");
  messages.length = 0;
  await instance.captureResponse("https://storage.invalid/private/audio.wav", {
    ok: true,
    headers: { get: () => "audio/wav" },
    clone: () => ({ arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer }),
  }, { method: "GET", requestContextId: "task:old" });
  assert.deepEqual(messages, []);
});

test("observer never derives current item context from POST execute responses", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "submitted-item" } }) }),
  }, { method: "POST" });
  assert.deepEqual(messages, []);
});

test("observer fetches the confirmed execute fileFolder in page world and emits only audio bytes", async () => {
  const messages = [];
  const calls = [];
  const sourceUrl = "https://storage.shujiajia.com/store/redacted.wav?redacted=1";
  const instance = observer.createObserver({
    emit: (message) => messages.push(message),
    fetchAudio: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        headers: { get: (name) => name.toLowerCase() === "content-type" ? "application/octet-stream" : "" },
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
      };
    },
  });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item", fileFolder: sourceUrl } } }) }),
  }, { method: "GET" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, sourceUrl);
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].options.referrerPolicy, "no-referrer");
  assert.deepEqual(messages.map((message) => message.type), [observer.constants.CONTEXT_READY, observer.constants.AUDIO_READY]);
  assert.equal(messages[1].payload.audioDataUrl, "data:audio/wav;base64,AQID");
  assert.equal(JSON.stringify(messages).includes("storage.shujiajia.com"), false);
  assert.equal(JSON.stringify(messages).includes("redacted=1"), false);
});

test("observer rejects fileFolder values outside the confirmed HTTPS storage host", async () => {
  const sourceUrls = [
    "http://storage.shujiajia.com/store/redacted.wav",
    "https://example.invalid/store/redacted.wav",
    "/store/redacted.wav",
  ];
  for (let index = 0; index < sourceUrls.length; index += 1) {
    const sourceUrl = sourceUrls[index];
    let fetchCount = 0;
    const messages = [];
    const instance = observer.createObserver({
      emit: (message) => messages.push(message),
      fetchAudio: async () => { fetchCount += 1; throw new Error("must not fetch"); },
    });
    instance.enable({});
    await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
      ok: true,
      clone: () => ({ json: async () => ({ data: { detail: { dataId: "item-" + index, fileFolder: sourceUrl } } }) }),
    }, { method: "GET" });
    assert.equal(fetchCount, 0);
    assert.deepEqual(messages.map((message) => message.type), [observer.constants.CONTEXT_READY, observer.constants.AUDIO_STATUS]);
    assert.equal(messages.at(-1).payload.code, "source-invalid");
  }
});

test("observer discards a direct audio fetch that finishes after the item changes", async () => {
  const messages = [];
  let finishOldFetch;
  const instance = observer.createObserver({
    emit: (message) => messages.push(message),
    fetchAudio: () => new Promise((resolve) => { finishOldFetch = resolve; }),
  });
  instance.enable({});
  const pending = instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "old", fileFolder: "https://storage.shujiajia.com/store/old.wav" } } }) }),
  }, { method: "GET" });
  await Promise.resolve();
  await Promise.resolve();
  instance.setContext("task:new");
  finishOldFetch({
    ok: true,
    headers: { get: () => "audio/wav" },
    arrayBuffer: async () => Uint8Array.from([1]).buffer,
  });
  await pending;
  assert.equal(messages.filter((message) => message.type === observer.constants.AUDIO_READY).length, 0);
});

test("observer discards a direct audio failure that arrives after disable", async () => {
  const messages = [];
  let rejectFetch;
  const instance = observer.createObserver({
    emit: (message) => messages.push(message),
    fetchAudio: () => new Promise((_resolve, reject) => { rejectFetch = reject; }),
  });
  instance.enable({});
  const pending = instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item", fileFolder: "https://storage.shujiajia.com/store/audio.wav" } } }) }),
  }, { method: "GET" });
  await Promise.resolve();
  await Promise.resolve();
  instance.disable();
  rejectFetch(new Error("late failure"));
  await pending;

  assert.equal(messages.some((message) => message.type === observer.constants.AUDIO_STATUS), false);
});

test("observer requests fileFolder only once for the same current context", async () => {
  let fetchCount = 0;
  const instance = observer.createObserver({
    emit() {},
    fetchAudio: async () => {
      fetchCount += 1;
      return { ok: true, headers: { get: () => "audio/wav" }, arrayBuffer: async () => Uint8Array.from([1]).buffer };
    },
  });
  instance.enable({});
  const response = () => ({
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item", fileFolder: "https://storage.shujiajia.com/store/item.wav" } } }) }),
  });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", response(), { method: "GET" });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", response(), { method: "GET" });
  assert.equal(fetchCount, 1);
});

test("observer rejects failed, non-audio, and oversized direct audio responses", async () => {
  const fixtures = [
    { ok: false, headers: { get: () => "audio/wav" }, arrayBuffer: async () => Uint8Array.from([1]).buffer },
    { ok: true, headers: { get: (name) => name.toLowerCase() === "content-type" ? "text/html" : "" }, arrayBuffer: async () => Uint8Array.from([1]).buffer },
    { ok: true, headers: { get: (name) => name.toLowerCase() === "content-length" ? String(10 * 1024 * 1024 + 1) : "audio/wav" }, arrayBuffer: async () => { throw new Error("oversized response body must not be read"); } },
  ];
  for (let index = 0; index < fixtures.length; index += 1) {
    const messages = [];
    const instance = observer.createObserver({
      emit: (message) => messages.push(message),
      fetchAudio: async () => fixtures[index],
    });
    instance.enable({});
    await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
      ok: true,
      clone: () => ({ json: async () => ({ data: { detail: { dataId: String(index), fileFolder: "https://storage.shujiajia.com/store/redacted.wav" } } }) }),
    }, { method: "GET" });
    assert.equal(messages.some((message) => message.type === observer.constants.AUDIO_READY), false);
  }
});

test("observer ignores an execute response without fileFolder", async () => {
  let fetchCount = 0;
  const instance = observer.createObserver({
    emit() {},
    fetchAudio: async () => { fetchCount += 1; return null; },
  });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute?taskId=task", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { detail: { dataId: "item" } } }) }),
  }, { method: "GET" });
  assert.equal(fetchCount, 0);
});
