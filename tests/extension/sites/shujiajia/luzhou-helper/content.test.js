"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const content = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "content.js"));

function flushAsyncWork() {
  return new Promise((resolve) => setImmediate(resolve));
}

const VALID_MARK_URL = "https://www.shujiajia.com/workbench/piece/mark.html?taskId=10000593-2026090100034&executeClass=TAG_PIECE";

test("supported mark-page URL requires the exact HTTPS route, taskId, and TAG_PIECE class", () => {
  assert.equal(content.isSupportedMarkPageUrl(VALID_MARK_URL), true);
  assert.equal(content.isSupportedMarkPageUrl(`${VALID_MARK_URL}&foo=bar`), true);
  for (const rawUrl of [
    "http://www.shujiajia.com/workbench/piece/mark.html?taskId=1&executeClass=TAG_PIECE",
    "https://shujiajia.com/workbench/piece/mark.html?taskId=1&executeClass=TAG_PIECE",
    "https://www.shujiajia.com/workbench/piece/mark.html/extra?taskId=1&executeClass=TAG_PIECE",
    "https://www.shujiajia.com/workbench/piece/mark.html?executeClass=TAG_PIECE",
    "https://www.shujiajia.com/workbench/piece/mark.html?taskId=%20&executeClass=TAG_PIECE",
    "https://www.shujiajia.com/workbench/piece/mark.html?taskId=1&executeClass=OTHER",
    "not-a-url",
  ]) assert.equal(content.isSupportedMarkPageUrl(rawUrl), false, rawUrl);
});

test("cancellable delay resolves only after its timer and reports cancellation", async () => {
  let timerCallback;
  let cleared = false;
  const controller = new AbortController();
  const pending = content.waitForDelay(2500, {
    signal: controller.signal,
    setTimeout(callback, delay) { assert.equal(delay, 2500); timerCallback = callback; return 7; },
    clearTimeout(id) { assert.equal(id, 7); cleared = true; },
  });
  let settled = false;
  pending.then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  timerCallback();
  assert.equal(await pending, true);
  assert.equal(cleared, false);

  const cancelController = new AbortController();
  const cancelled = content.waitForDelay(2500, {
    signal: cancelController.signal,
    setTimeout() { return 9; },
    clearTimeout(id) { assert.equal(id, 9); cleared = true; },
  });
  cancelController.abort();
  assert.equal(await cancelled, false);
  assert.equal(cleared, true);

  controller.abort();
  const alreadyCancelled = content.waitForDelay(2500, {
    signal: controller.signal,
    setTimeout() { throw new Error("an aborted signal must not schedule a timer"); },
  });
  assert.equal(await alreadyCancelled, false);
});

test("audio status messages stay sanitized and guide recognition failures", async () => {
  const listeners = {};
  const messages = [];
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage(value) { messages.push(value); }, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_STATUS, payload: { contextId: "", code: "identity-unavailable", ignored: "https://storage.invalid/private.wav?v=1" } }, origin: "" });
  const relayed = [];
  listeners.message({
    source: { postMessage(message) { relayed.push(message); } },
    data: { source: content.constants.SOURCE, type: content.constants.REQUEST_AUDIO, payload: {} },
    origin: "",
  });
  const result = await runtime.actions.recognizeWhole();
  assert.equal(result.code, "audio-not-captured");
  assert.equal(messages.at(-1), "未取得当前条目身份，请刷新页面后重试");
  assert.equal(messages.join(" ").includes("storage.invalid"), false);
  assert.equal(messages.join(" ").includes("?v=1"), false);
  assert.deepEqual(relayed, [{ source: content.constants.SOURCE, type: content.constants.AUDIO_STATUS, payload: { contextId: "", code: "identity-unavailable" } }]);
});

test("disabled boot clears the dormant page-world execute snapshot", () => {
  const messages = [];
  const windowLike = {
    location: { origin: "https://www.shujiajia.com" },
    postMessage(message, origin) { messages.push({ message, origin }); },
  };

  const enabled = content.settleObserverBeforeBoot({
    platforms: { shujiajia: { enabled: false, scripts: { luzhouHelper: { enabled: true } } } },
  }, windowLike);

  assert.equal(enabled, false);
  assert.deepEqual(messages, [{
    message: { source: content.constants.SOURCE, type: content.constants.OBSERVER_DISABLE, payload: {} },
    origin: "https://www.shujiajia.com",
  }]);
});

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
    source: frameWindow,
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
      async createWholeSegment() { await adapterOptions.trustedInput({ action: "shift-drag" }); return { ok: false, code: "draw-not-triggered", pageChanged: false }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  await runtime.actions.createWholeSegment();
  assert.equal(typeof adapterOptions.trustedInput, "function");
  assert.equal(trustedCalls, 1);
});

test("whole-segment failure messages preserve generated segments for manual review", () => {
  assert.equal(content.formatWholeSegmentFailure("debugger-attach-failed"), "浏览器可信拖拽不可用，可能正被开发者工具占用");
  assert.equal(content.formatWholeSegmentFailure("draw-not-triggered"), "平台未生成段落，请刷新页面后重试");
  assert.equal(content.formatWholeSegmentFailure("segment-boundary-unavailable"), "已生成段落，但暂时读取不到边界，请人工检查");
  assert.equal(content.formatWholeSegmentFailure("segment-boundary-incomplete"), "新段落未覆盖完整音频，已保留段落，请人工检查");
});

test("runtime keeps a generated but incomplete segment dirty without reporting rollback", async () => {
  const messages = [];
  const runtime = content.createRuntime({
    window: { addEventListener() {} }, document: {}, settings: { enabled: true, shortcuts: {} },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: false, code: "segment-boundary-incomplete", pageChanged: true, pageRestored: false }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage(value) { messages.push(value); } },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  const result = await runtime.actions.createWholeSegment();
  assert.equal(result.code, "segment-boundary-incomplete");
  assert.equal(runtime.getState().dirty, true);
  assert.equal(messages.at(-1), "新段落未覆盖完整音频，已保留段落，请人工检查");
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
      findSelectedTranscriptInput: () => ({}),
      fillTranscript({ state }) { state.dirty = true; return { ok: true }; },
      submitFromPage(state) { messages.push(state.dirty ? "blocked" : "submitted"); return { ok: !state.dirty }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  runtime.setRecognitionResult({ dialectText: "结果" });
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

test("recognition uses captured audio without requiring any paragraph layout", async () => {
  let called = false;
  const listeners = {};
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {}, settings: { enabled: true, aiRecommendEnabled: true, shortcuts: {} },
    segmentController: {
      verifyWholeSegment: () => { throw new Error("recognition must not inspect paragraphs"); },
    },
    aiClient: { async recognize() { called = true; return { dialectText: "直接识别" }; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  const result = await runtime.actions.recognizeWhole();
  assert.equal(result.ok, true);
  assert.equal(called, true);
  assert.equal(runtime.getState().result.dialectText, "直接识别");
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

test("recognition success auto-fills the matching current item when enabled", async () => {
  const listeners = {};
  const fills = [];
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: true, shortcuts: {} },
    segmentController: { verifyWholeSegment: () => { throw new Error("recognition must not inspect paragraphs"); } },
    aiClient: { async recognize() { return { dialectText: "识别结果" }; } },
    dataApi: {
      findSingleTranscriptInput: () => ({ id: "current-input" }),
      fillTranscript({ input, text }) { fills.push({ input, text }); return { ok: true }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

  const result = await runtime.actions.recognizeWhole();

  assert.equal(result.ok, true);
  assert.deepEqual(fills, [{ input: { id: "current-input" }, text: "识别结果" }]);
  assert.equal(runtime.getState().dirty, true);
});

test("automatic fill failure preserves the recognition result without marking the page dirty", async () => {
  const listeners = {};
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: true, shortcuts: {} },
    segmentController: { verifyWholeSegment: () => { throw new Error("recognition must not inspect paragraphs"); } },
    aiClient: { async recognize() { return { dialectText: "保留结果" }; } },
    dataApi: {
      findSingleTranscriptInput: () => null,
      fillTranscript: () => ({ ok: false, code: "input-unavailable" }),
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

  const result = await runtime.actions.recognizeWhole();

  assert.equal(result.ok, true);
  assert.deepEqual(result.fillResult, { ok: false, code: "auto-fill-single-segment-required" });
  assert.equal(runtime.getState().result.dialectText, "保留结果");
  assert.equal(runtime.getState().dirty, false);
});

test("recognition success keeps the result without filling when auto-fill is disabled", async () => {
  const listeners = {};
  let fillCalls = 0;
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: false, shortcuts: {} },
    segmentController: { verifyWholeSegment: () => ({ ok: true }) },
    aiClient: { async recognize() { return { dialectText: "仅展示结果" }; } },
    dataApi: { fillTranscript() { fillCalls += 1; return { ok: true }; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

  const result = await runtime.actions.recognizeWhole();

  assert.equal(result.ok, true);
  assert.equal(fillCalls, 0);
  assert.equal(runtime.getState().result.dialectText, "仅展示结果");
  assert.equal(runtime.getState().dirty, false);
});

test("recognition diagnostics survive failure, clear on success, and reset after switching items", async () => {
  const listeners = {};
  const errorStates = [];
  let calls = 0;
  const failurePayload = {
    success: false,
    requestId: "request-400",
    code: "provider-http-error",
    message: "Qwen 接口请求失败（HTTP 400）。",
    providerStatus: 400,
    rawResponse: { provider: "qwen", responseBody: { error: { code: "invalid_parameter" } } },
  };
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: false, shortcuts: {} },
    aiClient: {
      async recognize() {
        calls += 1;
        if (calls === 1) {
          const error = new Error(failurePayload.message);
          error.code = failurePayload.code;
          error.requestId = failurePayload.requestId;
          error.payload = failurePayload;
          throw error;
        }
        return { dialectText: "新识别文本" };
      },
    },
    panel: {
      ensureMounted() { return true; },
      setActions() {},
      setMessage() {},
      setResult() {},
      setError(value) { errorStates.push(value); },
    },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  runtime.setRecognitionResult({ dialectText: "旧识别文本" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

  const failed = await runtime.actions.recognizeWhole();
  assert.equal(failed.ok, false);
  assert.equal(runtime.getState().result.dialectText, "旧识别文本");
  assert.equal(runtime.getState().error, failurePayload);
  assert.equal(errorStates.at(-1), failurePayload);

  const succeeded = await runtime.actions.recognizeWhole();
  assert.equal(succeeded.ok, true);
  assert.equal(runtime.getState().error, null);
  assert.equal(errorStates.at(-1), null);

  runtime.setRecognitionResult({ dialectText: "保留到切题前" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:next" } }, origin: "" });
  assert.equal(runtime.getState().result, null);
  assert.equal(runtime.getState().error, null);
  assert.equal(errorStates.at(-1), null);
});

test("automatic fill rechecks the switch immediately before writing", async () => {
  const listeners = {};
  let settingsReads = 0;
  let fillCalls = 0;
  const enabledSettings = { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: true, shortcuts: {} };
  const disabledAutoFillSettings = { ...enabledSettings, aiRecommendAutoFillEnabled: false };
  globalThis.ASREdgeStorage = {
    async getSettings() {
      settingsReads += 1;
      const script = settingsReads >= 3 ? disabledAutoFillSettings : enabledSettings;
      return { platforms: { shujiajia: { enabled: true, scripts: { luzhouHelper: script } } } };
    },
  };
  try {
    const runtime = content.createRuntime({
      window: { addEventListener(type, fn) { listeners[type] = fn; } },
      document: {}, settings: enabledSettings,
      segmentController: { verifyWholeSegment: () => ({ ok: true }) },
      aiClient: { async recognize() { return { dialectText: "不应自动填入" }; } },
      dataApi: {
        findSingleTranscriptInput: () => ({}),
        fillTranscript() { fillCalls += 1; return { ok: true }; },
      },
      panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
      shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
    });
    await runtime.start();
    listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
    listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

    const result = await runtime.actions.recognizeWhole();

    assert.equal(result.ok, true);
    assert.equal(fillCalls, 0);
    assert.equal(runtime.getState().result.dialectText, "不应自动填入");
  } finally {
    delete globalThis.ASREdgeStorage;
  }
});

test("duplicate recognition triggers for the same item start only one AI request", async () => {
  const listeners = {};
  let recognitionCalls = 0;
  let resolveRecognition;
  const runtime = content.createRuntime({
    window: { addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: { enabled: true, aiRecommendEnabled: true, aiRecommendAutoFillEnabled: false, shortcuts: {} },
    segmentController: { verifyWholeSegment: () => ({ ok: true }) },
    aiClient: {
      recognize() {
        recognitionCalls += 1;
        if (recognitionCalls === 1) return new Promise((resolve) => { resolveRecognition = resolve; });
        return Promise.resolve({ refinedText: "重复结果" });
      },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });

  const first = runtime.actions.recognizeWhole();
  await Promise.resolve();
  const duplicate = await runtime.actions.recognizeWhole();

  assert.equal(recognitionCalls, 1);
  assert.deepEqual(duplicate, { ok: false, code: "recognition-in-progress" });
  resolveRecognition({ refinedText: "唯一结果" });
  assert.equal((await first).ok, true);
  assert.equal(runtime.getState().result.refinedText, "唯一结果");
});

test("editor runtime delays the initial and later contexts and draws each context only once", async () => {
  const listeners = {};
  const delays = [];
  const releases = [];
  const messages = [];
  let drawCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    waitForDelay(delayMs, options) {
      delays.push(delayMs);
      return new Promise((resolve) => {
        releases.push(() => resolve(options.signal?.aborted !== true));
      });
    },
    settings: {
      enabled: true,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoCreateWholeSegmentDelayMs: 500,
      autoRecognizeAfterWholeSegmentEnabled: false,
      shortcuts: {},
    },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { drawCalls += 1; return { ok: true, code: "whole-segment-created", pageChanged: true }; },
    },
    panel: {
      ensureMounted() { return true; },
      setActions() {}, setMessage(value) { messages.push(value); },
    },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();

  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:first" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(drawCalls, 0);
  assert.deepEqual(delays, [500]);
  assert.equal(messages.at(-1), "将在 0.5 秒后自动划段");
  releases[0]();
  await flushAsyncWork();
  assert.equal(drawCalls, 1);

  const next = { data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" };
  listeners.message(next);
  listeners.message(next);
  await flushAsyncWork();
  assert.equal(drawCalls, 1);
  assert.deepEqual(delays, [500, 500]);
  releases[1]();
  await flushAsyncWork();
  assert.equal(drawCalls, 2);
});

test("invalid outer URL prevents automatic drawing without affecting manual drawing", async () => {
  const listeners = {};
  let drawCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: "https://www.shujiajia.com/workbench/piece/other.html?taskId=1&executeClass=TAG_PIECE" },
    settings: { enabled: true, autoCreateWholeSegmentOnNewItemEnabled: true, shortcuts: {} },
    waitForDelay() { throw new Error("invalid outer URLs must not schedule"); },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { drawCalls += 1; return { ok: true }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:first" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(drawCalls, 0);
  await runtime.actions.createWholeSegment();
  assert.equal(drawCalls, 1);
});

test("automatic drawing rechecks the outer URL after the fixed delay", async () => {
  const listeners = {};
  const documentLike = { referrer: VALID_MARK_URL };
  let releaseDelay;
  let drawCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: documentLike,
    settings: { enabled: true, autoCreateWholeSegmentOnNewItemEnabled: true, shortcuts: {} },
    waitForDelay() { return new Promise((resolve) => { releaseDelay = resolve; }); },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { drawCalls += 1; return { ok: false, code: "waveform-unavailable" }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  await flushAsyncWork();
  documentLike.referrer = "https://www.shujiajia.com/workbench/piece/other.html?taskId=1&executeClass=TAG_PIECE";
  releaseDelay(true);
  await flushAsyncWork();
  assert.equal(drawCalls, 0);
});

test("automatic drawing accepts a configured zero-millisecond delay", async () => {
  const listeners = {};
  const delays = [];
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    settings: { enabled: true, autoCreateWholeSegmentOnNewItemEnabled: true, autoCreateWholeSegmentDelayMs: 0, shortcuts: {} },
    waitForDelay: async (delayMs) => { delays.push(delayMs); return true; },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: false, code: "waveform-unavailable" }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  await flushAsyncWork();
  assert.deepEqual(delays, [0]);
});

test("switching items cancels the previous fixed delay", async () => {
  const listeners = {};
  const signals = [];
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    settings: { enabled: true, autoCreateWholeSegmentOnNewItemEnabled: true, shortcuts: {} },
    waitForDelay(_delay, options) {
      signals.push(options.signal);
      return new Promise((resolve) => options.signal.addEventListener("abort", () => resolve(false), { once: true }));
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  for (const contextId of ["task:first", "task:second", "task:third"]) {
    listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId } }, origin: "" });
    await flushAsyncWork();
  }
  assert.equal(signals.length, 3);
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, true);
  assert.equal(signals[2].aborted, false);
  runtime.stop();
});

test("top frame never runs new-item auto-draw", async () => {
  const listeners = {};
  let drawCalls = 0;
  const windowLike = { addEventListener(type, fn) { listeners[type] = fn; } };
  windowLike.top = windowLike;
  const runtime = content.createRuntime({
    window: windowLike,
    document: {},
    settings: { enabled: true, autoCreateWholeSegmentOnNewItemEnabled: true, shortcuts: {} },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { drawCalls += 1; return { ok: true }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:first" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(drawCalls, 0);
});

test("successful auto-draw waits for matching audio before recognizing", async () => {
  const listeners = {};
  let recognitionCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    waitForDelay: async () => true,
    settings: {
      enabled: true,
      aiRecommendEnabled: true,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: true,
      shortcuts: {},
    },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: true, code: "whole-segment-created", pageChanged: true }; },
      verifyWholeSegment() { return { ok: true }; },
    },
    aiClient: { async recognize() { recognitionCalls += 1; return { refinedText: "当前题结果" }; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(recognitionCalls, 0);

  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:second", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(recognitionCalls, 1);
  assert.equal(runtime.getState().result.refinedText, "当前题结果");
});

test("successful helper-button draw also starts enabled automatic recognition", async () => {
  const listeners = {};
  let recognitionCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: {},
    settings: {
      enabled: true,
      aiRecommendEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: true,
      shortcuts: {},
    },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: true, code: "whole-segment-created", pageChanged: true }; },
      verifyWholeSegment() { return { ok: true }; },
    },
    aiClient: { async recognize() { recognitionCalls += 1; return { refinedText: "按钮结果" }; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:item" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:item", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  await runtime.actions.createWholeSegment();
  await flushAsyncWork();
  assert.equal(recognitionCalls, 1);
});

test("audio failure cancels queued recognition for the current context", async () => {
  const listeners = {};
  let recognitionCalls = 0;
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    waitForDelay: async () => true,
    settings: {
      enabled: true,
      aiRecommendEnabled: true,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: true,
      shortcuts: {},
    },
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: true, code: "whole-segment-created", pageChanged: true }; },
      verifyWholeSegment() { return { ok: true }; },
    },
    aiClient: { async recognize() { recognitionCalls += 1; return {}; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(runtime.getState().pendingAutoRecognitionContextId, "task:second");
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_STATUS, payload: { contextId: "task:second", code: "download-failed" } }, origin: "" });
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:second", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(recognitionCalls, 0);
});

test("disabling automatic recognition cancels its queued call before audio arrives", async (t) => {
  const listeners = {};
  let storageListener = null;
  let recognitionCalls = 0;
  let settingsRoot = {
    platforms: { shujiajia: { enabled: true, scripts: { luzhouHelper: {
      enabled: true,
      aiRecommendEnabled: true,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: true,
      shortcuts: {},
    } } } },
  };
  globalThis.ASREdgeStorage = { async getSettings() { return settingsRoot; } };
  globalThis.chrome = { storage: { onChanged: {
    addListener(fn) { storageListener = fn; },
    removeListener() {},
  } } };
  t.after(() => {
    delete globalThis.ASREdgeStorage;
    delete globalThis.chrome;
  });
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    waitForDelay: async () => true,
    settings: settingsRoot.platforms.shujiajia.scripts.luzhouHelper,
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { return { ok: true, code: "whole-segment-created", pageChanged: true }; },
      verifyWholeSegment() { return { ok: true }; },
    },
    aiClient: { async recognize() { recognitionCalls += 1; return {}; } },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(runtime.getState().pendingAutoRecognitionContextId, "task:second");

  settingsRoot = { platforms: { shujiajia: { enabled: true, scripts: { luzhouHelper: {
    enabled: true,
    aiRecommendEnabled: true,
    autoCreateWholeSegmentOnNewItemEnabled: true,
    autoRecognizeAfterWholeSegmentEnabled: false,
    shortcuts: {},
  } } } } };
  await storageListener({}, "local");
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.AUDIO_READY, payload: { contextId: "task:second", audioDataUrl: "data:audio/wav;base64,AAAA" } }, origin: "" });
  await flushAsyncWork();
  assert.equal(recognitionCalls, 0);
});

test("disabling new-item auto-draw while waiting for the fixed delay prevents trusted drawing", async (t) => {
  const listeners = {};
  let storageListener = null;
  let releaseDelay;
  let drawCalls = 0;
  let settingsRoot = {
    platforms: { shujiajia: { enabled: true, scripts: { luzhouHelper: {
      enabled: true,
      autoCreateWholeSegmentOnNewItemEnabled: true,
      autoRecognizeAfterWholeSegmentEnabled: false,
      shortcuts: {},
    } } } },
  };
  globalThis.ASREdgeStorage = { async getSettings() { return settingsRoot; } };
  globalThis.chrome = { storage: { onChanged: {
    addListener(fn) { storageListener = fn; },
    removeListener() {},
  } } };
  t.after(() => {
    delete globalThis.ASREdgeStorage;
    delete globalThis.chrome;
  });
  const runtime = content.createRuntime({
    window: { top: {}, addEventListener(type, fn) { listeners[type] = fn; } },
    document: { referrer: VALID_MARK_URL },
    waitForDelay(_delay, options) {
      return new Promise((resolve) => {
        releaseDelay = () => resolve(options.signal?.aborted !== true);
      });
    },
    settings: settingsRoot.platforms.shujiajia.scripts.luzhouHelper,
    segmentController: {
      createDomAdapter() { return {}; },
      async createWholeSegment() { drawCalls += 1; return { ok: true }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();
  listeners.message({ data: { source: content.constants.SOURCE, type: content.constants.CONTEXT_READY, payload: { contextId: "task:second" } }, origin: "" });
  await flushAsyncWork();

  settingsRoot = { platforms: { shujiajia: { enabled: true, scripts: { luzhouHelper: {
    enabled: true,
    autoCreateWholeSegmentOnNewItemEnabled: false,
    autoRecognizeAfterWholeSegmentEnabled: false,
    shortcuts: {},
  } } } } };
  await storageListener({}, "local");
  releaseDelay();
  await flushAsyncWork();
  assert.equal(drawCalls, 0);
});

test("overlap actions click the native symbols and mark the current item dirty", async () => {
  const symbols = [];
  const runtime = content.createRuntime({
    window: { addEventListener() {} },
    document: {},
    settings: { enabled: true, shortcuts: {} },
    dataApi: {
      clickOverlapSymbol(symbol) { symbols.push(symbol); return { ok: true, code: "clicked" }; },
    },
    panel: { ensureMounted() { return true; }, setActions() {}, setMessage() {}, setResult() {} },
    shortcuts: { createRuntime() { return { start() {}, stop() {} }; } },
  });
  await runtime.start();

  assert.equal((await runtime.actions.insertOverlapStart()).ok, true);
  assert.equal((await runtime.actions.insertOverlapEnd()).ok, true);
  assert.deepEqual(symbols, ["[OVERLAP/]", "[/OVERLAP]"]);
  assert.equal(runtime.getState().dirty, true);
});
