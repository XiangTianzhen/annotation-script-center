"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const modulePath = path.resolve(__dirname, "content.js");

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeHaitianUtransAudioDownloadHelper;
  delete globalThis.__ASREdgeHaitianUtransAudioDownloadHelperInstalled;
  return require(modulePath);
}

test("uTrans helper only matches worker work detail pages", function () {
  const helperModule = loadModule();

  assert.equal(
    helperModule.__testOnly.isTargetPageUrl(
      "http://123.56.253.145:10070/index.php?d=worker&c=work&uid=49844&project_id=127&process_id=507&task_id=696596"
    ),
    true
  );
  assert.equal(
    helperModule.__testOnly.isTargetPageUrl(
      "http://123.56.253.145:10070/index.php?d=worker&c=audio&m=audio_path&projectid=127&batchid=12&audioid=998"
    ),
    false
  );
  assert.equal(
    helperModule.__testOnly.isTargetPageUrl("http://123.56.253.145:10070/index.php?d=admin&c=work"),
    false
  );
});

test("uTrans helper resolves audio request context from url, hidden inputs and visible filename", function () {
  const helperModule = loadModule();

  const context = helperModule.__testOnly.resolveAudioRequestContext({
    href: "http://123.56.253.145:10070/index.php?d=worker&c=work&uid=49844&project_id=127&process_id=507&task_id=696596",
    hiddenFields: {
      batchid: "b-2001",
      audioid: "a-3009",
    },
    audioCandidates: [],
    visibleTexts: ["当前音频：session-001.wav"],
  });

  assert.deepEqual(context, {
    ok: true,
    projectId: "127",
    batchId: "b-2001",
    audioId: "a-3009",
    fileName: "session-001.wav",
    downloadUrl:
      "http://123.56.253.145:10070/index.php?d=worker&c=audio&m=audio_path&projectid=127&batchid=b-2001&audioid=a-3009",
  });
});

test("uTrans helper falls back to audio-id based wav filename", function () {
  const helperModule = loadModule();

  const context = helperModule.__testOnly.resolveAudioRequestContext({
    href: "http://123.56.253.145:10070/index.php?d=worker&c=work&uid=49844&project_id=127",
    hiddenFields: {
      batchid: "b-2001",
      audioid: "a-3009",
    },
    audioCandidates: [],
    visibleTexts: ["当前任务详情"],
  });

  assert.equal(context.ok, true);
  assert.equal(context.fileName, "audio-a-3009.wav");
});
