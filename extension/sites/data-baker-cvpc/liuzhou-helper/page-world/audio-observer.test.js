"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "audio-observer.js");
const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
const OBSERVER_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";

function loadObserverModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouAudioObserverPage;
  return require(modulePath);
}

function createWindowHarness() {
  const postedMessages = [];
  return {
    window: {
      console: {
        log: function () {},
        info: function () {},
        debug: function () {},
        warn: function () {},
      },
      fetch: function () {
        throw new Error("fetch should not be called in observer unit tests");
      },
      postMessage: function (data, origin) {
        postedMessages.push({ data, origin });
      },
      XMLHttpRequest: function FakeXmlHttpRequest() {},
    },
    postedMessages,
  };
}

test("CVPC audio observer maps annotation meta relative content to captured signed audio url", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 249783,
            name: "20642_20643_20642_S0_segment_000001.mp3",
            content:
              "databaker/data/17896/0604_1_1780556161381/0604_1/20642_20643/20642_20643_20642_S0/20642_20643_20642_S0_segment_000001.mp3",
          },
        ],
      },
    })
  );
  observer.observeAudioUrl(
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/17896/0604_1_1780556161381/0604_1/20642_20643/20642_20643_20642_S0/20642_20643_20642_S0_segment_000001.mp3?OSSAccessKeyId=test&Signature=abc"
  );

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 1);
  assert.equal(
    snapshot.mappings[0].relativePath,
    "databaker/data/17896/0604_1_1780556161381/0604_1/20642_20643/20642_20643_20642_S0/20642_20643_20642_S0_segment_000001.mp3"
  );
  assert.equal(snapshot.mappings[0].fileName, "20642_20643_20642_S0_segment_000001.mp3");
  assert.match(snapshot.mappings[0].audioUrl, /OSSAccessKeyId=test/);
  assert.equal(harness.postedMessages.length, 1);
  assert.equal(harness.postedMessages[0].origin, "https://cvpc.data-baker.com");
  assert.equal(harness.postedMessages[0].data.source, OBSERVER_SOURCE);
  assert.equal(harness.postedMessages[0].data.type, OBSERVER_TYPE);
});

test("CVPC audio observer keeps the latest signed audio url for the same relative path", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 1,
            name: "sample.mp3",
            content: "databaker/data/sample.mp3",
          },
        ],
      },
    })
  );
  observer.observeAudioUrl(
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/sample.mp3?Expires=1&Signature=old"
  );
  observer.observeAudioUrl(
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/sample.mp3?Expires=2&Signature=new"
  );

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 1);
  assert.match(snapshot.mappings[0].audioUrl, /Signature=new/);
  assert.equal(harness.postedMessages.length, 2);
});

test("CVPC audio observer maps console printed audio url after meta is available", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 1,
            name: "sample.mp3",
            content: "databaker/data/sample.mp3",
          },
        ],
      },
    })
  );
  observer.observeConsoleArgs([
    "==========> gAudioUrl :",
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/sample.mp3?Signature=console",
  ]);

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 1);
  assert.match(snapshot.mappings[0].audioUrl, /Signature=console/);
  assert.equal(snapshot.mappings[0].fileName, "sample.mp3");
});

test("CVPC audio observer maps console printed audio url before meta arrives", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeConsoleArgs([
    "audio_url:",
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/sample.mp3?Signature=pending-console",
  ]);
  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 1,
            name: "sample.mp3",
            content: "databaker/data/sample.mp3",
          },
        ],
      },
    })
  );

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 1);
  assert.match(snapshot.mappings[0].audioUrl, /Signature=pending-console/);
});

test("CVPC audio observer installed console wrapper captures info audio url", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 1,
            name: "sample.mp3",
            content: "databaker/data/sample.mp3",
          },
        ],
      },
    })
  );
  observer.install();
  harness.window.console.info(
    "audio_url:",
    "https://databaker-cvpc.oss-cn-huhehaote.aliyuncs.com/databaker/data/sample.mp3?Signature=info-console"
  );

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 1);
  assert.match(snapshot.mappings[0].audioUrl, /Signature=info-console/);
});

test("CVPC audio observer ignores unmatched or non-audio urls", function () {
  const observerModule = loadObserverModule();
  const harness = createWindowHarness();
  const observer = observerModule.createObserver({
    window: harness.window,
    location: {
      origin: "https://cvpc.data-baker.com",
      href: "https://cvpc.data-baker.com/app/editor/asr/",
    },
  });

  observer.observeResponse(
    "https://cvpc.data-baker.com/httpapi/annotation/meta?project_id=1&task_id=2",
    JSON.stringify({
      code: 0,
      data: {
        datas: [
          {
            entry_id: 1,
            name: "sample.mp3",
            content: "databaker/data/sample.mp3",
          },
        ],
      },
    })
  );
  observer.observeAudioUrl("https://cvpc.data-baker.com/httpapi/platform_setting/view");
  observer.observeAudioUrl("https://example.com/static/app.js");
  observer.observeAudioUrl("https://oss.example.com/another-file.wav?Signature=no-match");

  const snapshot = observer.getSnapshot();

  assert.equal(snapshot.mappings.length, 0);
  assert.equal(harness.postedMessages.length, 0);
});
