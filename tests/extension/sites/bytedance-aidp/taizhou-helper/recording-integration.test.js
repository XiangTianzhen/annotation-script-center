"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const modulePath = resolveRepo(
  "extension",
  "sites",
  "bytedance-aidp",
  "taizhou-helper",
  "recording-integration.js"
);

function loadModule() {
  delete require.cache[modulePath];
  delete globalThis.ASREdgeBytedanceAidpTaizhouRecordingIntegration;
  return require(modulePath);
}

function headers(values) {
  const normalized = Object.fromEntries(
    Object.entries(values || {}).map(([key, value]) => [
      String(key).toLowerCase(),
      String(value),
    ])
  );
  return {
    get(name) {
      return normalized[String(name || "").toLowerCase()] || null;
    },
  };
}

function response(options) {
  const source = options || {};
  return {
    ok: source.ok !== false,
    status: source.status || (source.ok === false ? 500 : 200),
    headers: headers(source.headers),
    async arrayBuffer() {
      return source.bytes || new Uint8Array([1, 2, 3, 4]).buffer;
    },
    async json() {
      return source.json || {};
    },
  };
}

function createStorageHarness(initialMappings) {
  const mappings = Array.isArray(initialMappings) ? initialMappings.slice() : [];
  return {
    mappings,
    async findTaizhouRecordingSyncMapping(taskId, sourceItemId) {
      return (
        mappings.find(
          (item) =>
            item.recordingTaskId === String(taskId || "").trim() &&
            item.sourceItemId === String(sourceItemId || "").trim()
        ) || null
      );
    },
    async saveTaizhouRecordingSyncMapping(mapping) {
      const index = mappings.findIndex(
        (item) =>
          item.recordingTaskId === mapping.recordingTaskId &&
          item.sourceItemId === mapping.sourceItemId
      );
      if (index >= 0) {
        mappings.splice(index, 1);
      }
      mappings.unshift({ ...mapping });
      return { ...mapping };
    },
  };
}

function createRuntime(options) {
  const source = options || {};
  const moduleApi = loadModule();
  const storage = source.storage || createStorageHarness();
  const calls = [];
  const runtime = moduleApi.createRuntime({
    dataApi: {
      async getRecordingImportContext() {
        return (
          source.context || {
            ok: true,
            sourceItemId: "source-item-1",
            referenceText: "完整题目文本",
            audioUrl: "",
            videoUrl: "",
          }
        );
      },
    },
    storage,
    settings: {
      platforms: {
        bytedanceAidp: {
          scripts: {
            taizhouHelper: {
              recordingImportTaskId: source.taskId || "internal-task-id",
            },
          },
        },
      },
    },
    buildBackendUrl(path) {
      return "https://script-center.example.test" + path;
    },
    now: source.now || (() => 1721780000000),
    fetch: async function (url, requestOptions) {
      const call = {
        url: String(url),
        method: String(requestOptions?.method || "GET").toUpperCase(),
        headers: { ...(requestOptions?.headers || {}) },
        body: requestOptions?.body,
        credentials: requestOptions?.credentials,
      };
      calls.push(call);
      if (typeof source.fetch === "function") {
        return source.fetch(call, calls);
      }
      return response({
        status: 201,
        json: {
          syncToken: "sync-token-1",
          item: {
            itemId: "recording-item-1",
            taskId: "internal-task-id",
            itemCode: "T000001-0000001",
            status: "AVAILABLE",
            createdAt: "2026-07-24T00:00:00Z",
          },
        },
      });
    },
  });
  return { moduleApi, runtime, storage, calls };
}

test("Taizhou recording integration creates a text-only full item and stores only the safe mapping", async function () {
  const harness = createRuntime({
    context: {
      ok: true,
      sourceItemId: "source-item-1",
      referenceText: "完整题目文本",
      audioUrl: "",
      videoUrl: "",
    },
  });

  const result = await harness.runtime.importCurrentItem();

  assert.equal(result.ok, true);
  assert.equal(result.mapping.itemCode, "T000001-0000001");
  assert.equal(harness.calls.length, 1);
  assert.equal(
    harness.calls[0].url,
    "https://script-center.example.test/api/bytedance-aidp/taizhou-helper/recording-items"
  );
  assert.deepEqual(JSON.parse(harness.calls[0].body), {
    recordingTaskId: "internal-task-id",
    sourceItemId: "source-item-1",
    referenceText: "完整题目文本",
    audioUploadId: null,
    videoUploadId: null,
  });
  assert.equal("Idempotency-Key" in harness.calls[0].headers, false);
  assert.deepEqual(Object.keys(harness.storage.mappings[0]).sort(), [
    "itemCode",
    "recordingItemId",
    "recordingTaskId",
    "sourceItemId",
    "syncToken",
    "updatedAt",
  ]);
});

test("Taizhou recording integration supports text, audio, video and combined references without forwarding login headers", async function () {
  const cases = [
    { referenceText: "文字", audioUrl: "", videoUrl: "" },
    { referenceText: "", audioUrl: "https://aidp.example.test/audio", videoUrl: "" },
    { referenceText: "", audioUrl: "", videoUrl: "https://aidp.example.test/video" },
    {
      referenceText: "文字",
      audioUrl: "https://aidp.example.test/audio",
      videoUrl: "https://aidp.example.test/video",
    },
  ];

  for (const [caseIndex, context] of cases.entries()) {
    const harness = createRuntime({
      context: {
        ok: true,
        sourceItemId: "source-" + String(caseIndex),
        ...context,
      },
      fetch(call) {
        if (call.url.startsWith("https://aidp.example.test/audio")) {
          return response({
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": "4",
            },
          });
        }
        if (call.url.startsWith("https://aidp.example.test/video")) {
          return response({
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": "4",
            },
          });
        }
        if (call.url.endsWith("/recording-media/audio")) {
          return response({ status: 201, json: { uploadId: "audio-upload" } });
        }
        if (call.url.endsWith("/recording-media/video")) {
          return response({ status: 201, json: { uploadId: "video-upload" } });
        }
        return response({
          status: 201,
          json: {
            syncToken: "sync-" + String(caseIndex),
            item: {
              itemId: "item-" + String(caseIndex),
              taskId: "internal-task-id",
              itemCode: "T000001-" + String(caseIndex + 1).padStart(7, "0"),
              status: "AVAILABLE",
            },
          },
        });
      },
    });

    const result = await harness.runtime.importCurrentItem();
    assert.equal(result.ok, true);

    const downloads = harness.calls.filter((call) =>
      call.url.startsWith("https://aidp.example.test/")
    );
    downloads.forEach((call) => {
      assert.equal(call.credentials, "include");
      assert.deepEqual(call.headers, {});
    });
    const uploads = harness.calls.filter((call) =>
      call.url.includes("/recording-media/")
    );
    uploads.forEach((call) => {
      assert.equal(call.headers["X-Recording-Task-Id"], "internal-task-id");
      assert.match(call.headers["Content-Type"], /^(audio|video)\//);
      assert.doesNotMatch(
        JSON.stringify(call.headers),
        /authorization|cookie|session|bearer/i
      );
    });
    const createCall = harness.calls.find((call) =>
      call.url.endsWith("/recording-items")
    );
    assert.ok(createCall);
    const createBody = JSON.parse(createCall.body);
    assert.equal(createBody.referenceText, context.referenceText || null);
    assert.equal(createBody.audioUploadId, context.audioUrl ? "audio-upload" : null);
    assert.equal(createBody.videoUploadId, context.videoUrl ? "video-upload" : null);
  }
});

test("Taizhou recording integration stops before item creation when any declared media fails", async function () {
  const harness = createRuntime({
    context: {
      ok: true,
      sourceItemId: "source-media-failure",
      referenceText: "文字",
      audioUrl: "https://aidp.example.test/audio",
      videoUrl: "https://aidp.example.test/video",
    },
    fetch(call) {
      if (call.url.endsWith("/recording-media/audio")) {
        return response({ status: 201, json: { uploadId: "audio-upload" } });
      }
      if (call.url.endsWith("/audio")) {
        return response({
          headers: { "Content-Type": "audio/mpeg", "Content-Length": "4" },
        });
      }
      if (call.url.endsWith("/video")) {
        return response({ ok: false, status: 403 });
      }
      throw new Error("创建接口不应被调用");
    },
  });

  const result = await harness.runtime.importCurrentItem();

  assert.equal(result.ok, false);
  assert.match(result.message, /视频|媒体|下载/);
  assert.equal(
    harness.calls.some((call) => call.url.endsWith("/recording-items")),
    false
  );
  assert.equal(harness.storage.mappings.length, 0);
});

test("Taizhou recording integration enforces the 100MB media limit from headers and actual bytes", async function () {
  const moduleApi = loadModule();
  const tooLarge = 100 * 1024 * 1024 + 1;

  await assert.rejects(
    moduleApi.__testOnly.downloadMedia(
      "audio",
      "https://aidp.example.test/audio",
      async function () {
        return response({
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(tooLarge),
          },
        });
      }
    ),
    /100MB/
  );
  await assert.rejects(
    moduleApi.__testOnly.downloadMedia(
      "video",
      "https://aidp.example.test/video",
      async function () {
        return response({
          headers: { "Content-Type": "video/mp4" },
          bytes: { byteLength: tooLarge },
        });
      }
    ),
    /100MB/
  );
});

test("Taizhou recording integration reuses duplicate imports and refreshes results once per entered item", async function () {
  const storage = createStorageHarness();
  let createCount = 0;
  let resultCount = 0;
  const harness = createRuntime({
    storage,
    fetch(call) {
      if (call.url.endsWith("/recording-items/result")) {
        resultCount += 1;
        return response({
          json: {
            itemId: "recording-item-1",
            itemCode: "T000001-0000001",
            status: "COMPLETED",
            updatedAt: "2026-07-24T01:00:00Z",
            text: "录音完成文本",
            audioAvailable: true,
            audioUrl:
              "/api/bytedance-aidp/taizhou-helper/recording-items/audio/signed-token",
          },
        });
      }
      createCount += 1;
      return response({
        status: 201,
        json: {
          syncToken: "sync-token-1",
          item: {
            itemId: "recording-item-1",
            taskId: "internal-task-id",
            itemCode: "T000001-0000001",
            status: "AVAILABLE",
          },
        },
      });
    },
  });

  const [first, second] = await Promise.all([
    harness.runtime.importCurrentItem(),
    harness.runtime.importCurrentItem(),
  ]);
  const repeated = await harness.runtime.importCurrentItem();
  const autoFirst = await harness.runtime.autoRefreshForCurrentItem("source-item-1");
  const autoSecond = await harness.runtime.autoRefreshForCurrentItem("source-item-1");
  const manual = await harness.runtime.refreshCurrentResult();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.replayed, true);
  assert.equal(createCount, 1);
  assert.equal(resultCount, 2);
  assert.equal(autoFirst.status, "COMPLETED");
  assert.equal(autoSecond, null);
  assert.equal(manual.text, "录音完成文本");
  assert.equal(
    manual.audioUrl,
    "https://script-center.example.test/api/bytedance-aidp/taizhou-helper/recording-items/audio/signed-token"
  );
  const resultCalls = harness.calls.filter((call) =>
    call.url.endsWith("/recording-items/result")
  );
  assert.deepEqual(
    resultCalls.map((call) => JSON.parse(call.body)),
    [{ syncToken: "sync-token-1" }, { syncToken: "sync-token-1" }]
  );
});
