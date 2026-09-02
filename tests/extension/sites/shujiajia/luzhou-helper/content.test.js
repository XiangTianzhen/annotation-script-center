"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const content = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "content.js"));

test("top-frame trusted input bridge accepts only bdIframe and translates drag coordinates", () => {
  const frameWindow = {};
  const iframe = {
    contentWindow: frameWindow,
    getBoundingClientRect: () => ({ left: 50, top: 120, width: 900, height: 600 }),
  };
  const documentLike = { querySelector: (selector) => selector === "#bdIframe" ? iframe : null };
  const message = content.buildTopTrustedInputMessage({
    source: frameWindow,
    data: {
      source: content.constants.SOURCE,
      type: content.constants.TRUSTED_INPUT_REQUEST,
      payload: { requestId: "req-1", action: "shift-drag", startX: 2, startY: 20, endX: 898, endY: 20 },
    },
  }, documentLike);

  assert.deepEqual(message, {
    type: content.constants.BACKGROUND_TRUSTED_INPUT,
    action: "shift-drag",
    startX: 52,
    startY: 140,
    endX: 948,
    endY: 140,
  });
  assert.equal(content.buildTopTrustedInputMessage({
    source: {},
    data: { source: content.constants.SOURCE, type: content.constants.TRUSTED_INPUT_REQUEST, payload: { requestId: "req-2", action: "delete" } },
  }, documentLike), null);
});

test("whole-segment action supplies the controller with the trusted input bridge", async () => {
  let adapterOptions = null;
  let trustedCalls = 0;
  const runtime = content.createRuntime({
    window: { addEventListener() {}, top: {} },
    document: {},
    settings: { enabled: true, shortcuts: {} },
    trustedInput: async () => { trustedCalls += 1; return { ok: true }; },
    segmentController: {
      createDomAdapter(_document, options) { adapterOptions = options; return {}; },
      async createWholeSegment() { await adapterOptions.trustedInput({ action: "delete" }); return { ok: false, code: "draw-not-triggered", pageChanged: false }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  await runtime.actions.createWholeSegment();
  assert.equal(typeof adapterOptions.trustedInput, "function");
  assert.equal(trustedCalls, 1);
});

test("whole-segment failure messages distinguish debugger, drawing, boundary, and rollback failures", () => {
  assert.equal(content.formatWholeSegmentFailure("debugger-attach-failed"), "浏览器可信拖拽不可用，可能正被开发者工具占用");
  assert.equal(content.formatWholeSegmentFailure("draw-not-triggered"), "平台未生成段落，请刷新页面后重试");
  assert.equal(content.formatWholeSegmentFailure("segment-boundary-unavailable"), "已生成段落，但暂时读取不到边界，请人工检查");
  assert.equal(content.formatWholeSegmentFailure("segment-boundary-incomplete"), "新段落未覆盖完整音频，已尝试回退");
  assert.equal(content.formatWholeSegmentFailure("rollback-failed"), "自动回退失败，页面可能仍有修改；请人工检查并暂存或刷新");
});

test("runtime keeps helper writes dirty until the matching native temporary save is observed", async () => {
  const messages = [];
  const listeners = {};
  const windowLike = { addEventListener(type, fn) { listeners[type] = fn; } };
  const runtime = content.createRuntime({
    window: windowLike,
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    dataApi: {
      findTranscriptInput: () => ({}),
      fillTranscript({ state }) { state.dirty = true; return { ok: true }; },
      submitFromPage(state) { messages.push(state.dirty ? "blocked" : "submitted"); return { ok: !state.dirty }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  runtime.setRecognitionResult({ refinedText: "结果" });
  await runtime.actions.fillRecognition();
  await runtime.actions.submitNext();
  assert.equal(runtime.getState().dirty, true);
  assert.deepEqual(messages, ["blocked"]);
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  const dirtyToken = runtime.getState().dirtyToken;
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.TEMP_SAVE_SUCCEEDED, payload: { ok: true, contextId: "task:item", dirtyToken: "stale" } }, origin: "" });
  assert.equal(runtime.getState().dirty, true);
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.TEMP_SAVE_SUCCEEDED, payload: { ok: true, contextId: "task:item", dirtyToken } }, origin: "" });
  await runtime.actions.submitNext();
  assert.equal(runtime.getState().dirty, false);
  assert.deepEqual(messages, ["blocked", "submitted"]);
});

test("dirty state relayed from an iframe blocks submit in the top frame", async () => {
  const listeners = {};
  const windowLike = { location: { origin: "https://www.shujiajia.com" }, addEventListener(type, fn) { listeners[type] = fn; }, top: null };
  windowLike.top = windowLike;
  const runtime = content.createRuntime({
    window: windowLike, document: { querySelectorAll: () => [] }, settings: { enabled: true, shortcuts: {} },
    dataApi: { submitFromPage(state) { return { ok: !state.dirty, code: state.dirty ? "temporary-save-required" : "clicked" }; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.DIRTY_CHANGED, payload: { dirty: true, contextId: "task:item", dirtyToken: "v1" } }, origin: "https://www.shujiajia.com" });
  assert.equal(runtime.getState().dirty, true);
  assert.equal((await runtime.actions.submitNext()).code, "temporary-save-required");
});

test("recognition requires captured audio bytes and never guesses an audio URL", async () => {
  let called = false;
  const runtime = content.createRuntime({
    window: { addEventListener() {} }, document: {}, settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    aiClient: { async recognize() { called = true; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage(message) { runtime.lastMessage = message; }, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  const result = await runtime.actions.recognizeWhole();
  assert.equal(result.ok, false);
  assert.equal(result.code, "audio-not-captured");
  assert.equal(called, false);
});

test("recognition refuses captured audio until one full-boundary segment exists", async () => {
  let called = false;
  const listeners = {};
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {}, settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    segmentAdapter: { getSegments: () => [], getAudioDurationMs: () => 4215, getWaveformWidth: () => 843 },
    segmentController: {
      verifyWholeSegment: () => ({ ok: false, code: "whole-segment-required", segmentCount: 0 }),
    },
    aiClient: { async recognize() { called = true; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  const result = await runtime.actions.recognizeWhole();
  assert.equal(result.code, "whole-segment-required");
  assert.equal(called, false);
});

test("runtime rejects audio captured for a previous item", async () => {
  const listeners = {};
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } }, document: {}, settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:new" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:old", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  assert.equal(runtime.getState().audioDataUrl, "");
});

test("runtime discards an AI result when the page switches item during recognition", async () => {
  const listeners = {};
  let resolveRecognition;
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } }, document: {},
    settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    segmentController: { verifyWholeSegment: () => ({ ok: true }) },
    aiClient: { recognize: () => new Promise((resolve) => { resolveRecognition = resolve; }) },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:old" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:old", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  const pending = runtime.actions.recognizeWhole();
  await Promise.resolve();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:new" } }, origin: "" });
  resolveRecognition({ refinedText: "旧题结果" });
  const result = await pending;
  assert.equal(result.code, "stale-recognition-result");
  assert.equal(runtime.getState().result, null);
});
