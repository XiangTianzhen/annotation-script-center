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
