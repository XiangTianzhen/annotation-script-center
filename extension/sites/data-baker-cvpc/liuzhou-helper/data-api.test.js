"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "data-api.js");
const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
const OBSERVER_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
const MISSING_AUDIO_MESSAGE =
  "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";

function loadDataApiModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi;
  return require(modulePath);
}

class FakeElement {}
class FakeInputElement extends FakeElement {}
class FakeTextareaElement extends FakeElement {}

function createDataApiHarness(options) {
  const settings = options && typeof options === "object" ? options : {};
  const listeners = new Map();
  const location = {
    origin: "https://cvpc.data-baker.com",
    hostname: "cvpc.data-baker.com",
    pathname: "/app/editor/asr/",
    search:
      "?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
    href:
      "https://cvpc.data-baker.com/app/editor/asr/?project_id=1453&task_id=12099&process_id=4946&data_id=17896&job_id=1520&terminal=group@1134",
  };
  const topAudio =
    settings.topAudioUrl
      ? {
          currentSrc: settings.topAudioUrl,
          src: settings.topAudioUrl,
        }
      : null;
  const iframeAudio =
    settings.iframeAudioUrl
      ? {
          currentSrc: settings.iframeAudioUrl,
          src: settings.iframeAudioUrl,
        }
      : null;
  const iframeNode =
    settings.iframeAudioUrl
      ? {
          contentDocument: {
            querySelector: function (selector) {
              return selector === "audio" ? iframeAudio : null;
            },
          },
        }
      : null;

  const document = {
    querySelectorAll: function (selector) {
      if (selector === "body *") {
        return (settings.visibleEntryNames || []).map(function (name) {
          return { textContent: name };
        });
      }
      if (selector === ".el-form-item, .ant-form-item, label, div") {
        return [];
      }
      return [];
    },
    querySelector: function (selector) {
      if (selector === "audio") {
        return topAudio;
      }
      if (selector === "#iframeBox iframe#myIframe, #iframeBox iframe") {
        return iframeNode;
      }
      return null;
    },
  };

  const windowObject = {
    addEventListener: function (type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener: function (type, listener) {
      if (listeners.get(type) === listener) {
        listeners.delete(type);
      }
    },
  };

  const performance = {
    getEntriesByType: function (type) {
      if (type !== "resource") {
        return [];
      }
      return (settings.performanceEntries || []).map(function (name) {
        return { name };
      });
    },
  };

  const metaPayload = settings.metaPayload;
  const fetchCalls = [];
  async function fetchStub(url) {
    fetchCalls.push(String(url || ""));
    return {
      ok: true,
      json: async function () {
        return {
          code: 0,
          data: metaPayload,
        };
      },
    };
  }

  return {
    dependencies: {
      window: windowObject,
      document,
      location,
      performance,
      fetch: fetchStub,
      HTMLElement: FakeElement,
      HTMLInputElement: FakeInputElement,
      HTMLTextAreaElement: FakeTextareaElement,
    },
    fetchCalls,
    dispatchObserverMessage: function (payload) {
      const listener = listeners.get("message");
      if (typeof listener !== "function") {
        throw new Error("message listener not installed");
      }
      listener({
        source: windowObject,
        origin: location.origin,
        data: {
          source: OBSERVER_SOURCE,
          type: OBSERVER_TYPE,
          payload,
        },
      });
    },
  };
}

function createMetaPayload(entries) {
  return {
    datas: entries,
    anns: [
      {
        entry_id: entries[0]?.entry_id || 1,
        entry_index: entries[0]?.entry_index || 1,
        ann_data: {
          moments: [
            {
              startMs: 0,
              endMs: 1350,
            },
          ],
        },
        audio_duration: 5.2,
      },
    ],
    template: {
      attrs: [],
      entry_attrs: [],
      moment_attrs: [],
    },
  };
}

test("CVPC data api prefers observer-supplied signed audio url for the current entry", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-b.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
        audioUrl: "https://meta.example.com/sample-a.mp3",
      },
      {
        entry_id: 2,
        entry_index: 2,
        name: "sample-b.mp3",
        content: "databaker/data/sample-b.mp3",
        audioUrl: "https://meta.example.com/sample-b.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage({
    relativePath: "databaker/data/sample-b.mp3",
    fileName: "sample-b.mp3",
    audioUrl: "https://oss.example.com/databaker/data/sample-b.mp3?Signature=observer",
    at: Date.now(),
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://oss.example.com/databaker/data/sample-b.mp3?Signature=observer"
  );
  assert.equal(context.audioUrlSource, "observer");
});

test("CVPC data api falls back to direct meta audio url when observer cache is missing", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
        audioUrl: "https://meta.example.com/databaker/data/sample-a.mp3?Signature=meta",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://meta.example.com/databaker/data/sample-a.mp3?Signature=meta"
  );
  assert.equal(context.audioUrlSource, "meta");
});

test("CVPC data api falls back through top-level audio, performance, and iframe audio in order", async function () {
  const dataApiModule = loadDataApiModule();

  let harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    topAudioUrl: "https://player.example.com/databaker/data/sample-a.mp3?Signature=dom",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  let runtime = dataApiModule.createRuntime(harness.dependencies);
  let context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "dom-audio");
  assert.match(context.audioUrl, /Signature=dom/);

  harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    performanceEntries: [
      "https://static.example.com/ignore.js",
      "https://cdn.example.com/databaker/data/sample-a.mp3?Signature=perf",
    ],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  runtime = dataApiModule.createRuntime(harness.dependencies);
  context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "performance");
  assert.match(context.audioUrl, /Signature=perf/);

  harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    iframeAudioUrl: "https://iframe.example.com/databaker/data/sample-a.mp3?Signature=iframe",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });
  runtime = dataApiModule.createRuntime(harness.dependencies);
  context = await runtime.getEditorContext({ force: true });
  assert.equal(context.audioUrlSource, "iframe-audio");
  assert.match(context.audioUrl, /Signature=iframe/);
});

test("CVPC data api does not reuse stale observer mapping after visible entry switches", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-b.mp3"],
    topAudioUrl: "https://player.example.com/databaker/data/sample-b.mp3?Signature=dom",
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
      {
        entry_id: 2,
        entry_index: 2,
        name: "sample-b.mp3",
        content: "databaker/data/sample-b.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  harness.dispatchObserverMessage({
    relativePath: "databaker/data/sample-a.mp3",
    fileName: "sample-a.mp3",
    audioUrl: "https://oss.example.com/databaker/data/sample-a.mp3?Signature=observer-a",
    at: Date.now(),
  });

  const context = await runtime.getEditorContext({ force: true });

  assert.equal(
    context.audioUrl,
    "https://player.example.com/databaker/data/sample-b.mp3?Signature=dom"
  );
  assert.equal(context.audioUrlSource, "dom-audio");
});

test("CVPC data api returns a fixed hint message when no signed audio url can be resolved", async function () {
  const dataApiModule = loadDataApiModule();
  const harness = createDataApiHarness({
    visibleEntryNames: ["sample-a.mp3"],
    metaPayload: createMetaPayload([
      {
        entry_id: 1,
        entry_index: 1,
        name: "sample-a.mp3",
        content: "databaker/data/sample-a.mp3",
      },
    ]),
  });

  const runtime = dataApiModule.createRuntime(harness.dependencies);
  const context = await runtime.getEditorContext({ force: true });

  assert.equal(context.audioUrl, "");
  assert.equal(context.audioUrlSource, "");
  assert.equal(context.audioUrlHintMessage, MISSING_AUDIO_MESSAGE);
});
