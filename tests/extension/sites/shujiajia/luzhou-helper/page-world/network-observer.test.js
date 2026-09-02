"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const observer = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "page-world", "network-observer.js"));

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

test("observer derives a new item context from the execute response and clears stale audio", async () => {
  const messages = [];
  const instance = observer.createObserver({ emit: (message) => messages.push(message) });
  instance.enable({});
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "item" } }) }),
  });
  assert.deepEqual(messages, [{ source: observer.constants.SOURCE, type: observer.constants.CONTEXT_READY, payload: { contextId: "task:item" } }]);
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
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "item", detail: { fileFolder: sourceUrl } } }) }),
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
    await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
      ok: true,
      clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "item-" + index, detail: { fileFolder: sourceUrl } } }) }),
    }, { method: "GET" });
    assert.equal(fetchCount, 0);
    assert.deepEqual(messages.map((message) => message.type), [observer.constants.CONTEXT_READY]);
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
  const pending = instance.captureResponse("/web-task-alone-api/task/piece/execute", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "old", detail: { fileFolder: "https://storage.shujiajia.com/store/old.wav" } } }) }),
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
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "item", detail: { fileFolder: "https://storage.shujiajia.com/store/item.wav" } } }) }),
  });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", response(), { method: "GET" });
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", response(), { method: "GET" });
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
    await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
      ok: true,
      clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: String(index), detail: { fileFolder: "https://storage.shujiajia.com/store/redacted.wav" } } }) }),
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
  await instance.captureResponse("/web-task-alone-api/task/piece/execute", {
    ok: true,
    clone: () => ({ json: async () => ({ data: { taskId: "task", dataId: "item", detail: {} } }) }),
  }, { method: "GET" });
  assert.equal(fetchCount, 0);
});
