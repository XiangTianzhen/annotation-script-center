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
  const defaultBytes = new Uint8Array([1, 2, 3, 4]);
  const streamChunks = Array.isArray(source.chunks)
    ? source.chunks
    : [source.bytes instanceof Uint8Array ? source.bytes : defaultBytes];
  let streamIndex = 0;
  return {
    ok: source.ok !== false,
    status: source.status || (source.ok === false ? 500 : 200),
    headers: headers(source.headers),
    body: {
      getReader() {
        return {
          async read() {
            if (streamIndex >= streamChunks.length) {
              return { done: true, value: undefined };
            }
            const value = streamChunks[streamIndex];
            streamIndex += 1;
            return { done: false, value };
          },
          async cancel() {
            source.onCancel?.();
          },
        };
      },
      async cancel() {
        source.onCancel?.();
      },
    },
    async arrayBuffer() {
      source.onArrayBuffer?.();
      return defaultBytes.buffer;
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
    async findTaizhouRecordingSyncMapping(taskCode, sourceItemId) {
      return (
        mappings.find(
          (item) =>
            item.recordingTaskCode === String(taskCode || "").trim() &&
            item.sourceItemId === String(sourceItemId || "").trim()
        ) || null
      );
    },
    async saveTaizhouRecordingSyncMapping(mapping) {
      const index = mappings.findIndex(
        (item) =>
          item.recordingTaskCode === mapping.recordingTaskCode &&
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
              recordingImportTaskCode: Object.prototype.hasOwnProperty.call(
                source,
                "taskCode"
              )
                ? source.taskCode
                : "T000001",
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

test("Taizhou recording integration imports an explicit safe item context", async function () {
  const harness = createRuntime({
    context: {
      ok: false,
      message: "the current-page context must not be read",
    },
  });

  const result = await harness.runtime.importItemContext({
    sourceItemId: " source-explicit ",
    referenceText: " explicit text ",
    audioUrl: " https://aidp.example.test/audio ",
    videoUrl: "",
    operatorEmail: "must-not-be-forwarded@example.test",
    requestUrl: "https://aidp.example.test/private?token=secret",
  });

  assert.equal(result.ok, true);
  assert.equal(result.kind, "created");
  assert.equal(harness.calls.length, 1);
  assert.deepEqual(JSON.parse(harness.calls[0].body), {
    recordingTaskCode: "T000001",
    sourceItemId: "source-explicit",
    referenceText: "explicit text",
    referenceAudioUrl: "https://aidp.example.test/audio",
    referenceVideoUrl: null,
  });
  assert.deepEqual(harness.storage.mappings, [
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-explicit",
      recordingItemId: "recording-item-1",
      itemCode: "T000001-0000001",
      syncToken: "sync-token-1",
      updatedAt: 1721780000000,
    },
  ]);
});

test("Taizhou recording integration rejects invalid explicit item contexts before calling the backend", async function () {
  const cases = [
    {
      taskCode: "",
      context: {
        sourceItemId: "source-no-task",
        referenceText: "text",
      },
    },
    {
      context: {
        sourceItemId: " ",
        referenceText: "text",
      },
    },
    {
      context: {
        sourceItemId: "source-empty",
        referenceText: " ",
        audioUrl: "",
        videoUrl: null,
      },
    },
  ];

  for (const testCase of cases) {
    const harness = createRuntime(testCase);
    const result = await harness.runtime.importItemContext(testCase.context);

    assert.equal(result.ok, false);
    assert.equal(typeof result.message, "string");
    assert.notEqual(result.message.trim(), "");
    assert.equal(harness.calls.length, 0);
    assert.deepEqual(harness.storage.mappings, []);
  }
});

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
  assert.equal(result.kind, "created");
  assert.deepEqual(result.initialResult, {
    sourceItemId: "source-item-1",
    itemCode: "T000001-0000001",
    status: "AVAILABLE",
  });
  assert.equal(result.mapping.itemCode, "T000001-0000001");
  assert.equal(harness.calls.length, 1);
  assert.equal(
    harness.calls[0].url,
    "https://script-center.example.test/api/bytedance-aidp/taizhou-helper/recording-items"
  );
  assert.deepEqual(JSON.parse(harness.calls[0].body), {
    recordingTaskCode: "T000001",
    sourceItemId: "source-item-1",
    referenceText: "完整题目文本",
    referenceAudioUrl: null,
    referenceVideoUrl: null,
  });
  assert.equal("Idempotency-Key" in harness.calls[0].headers, false);
  assert.deepEqual(Object.keys(harness.storage.mappings[0]).sort(), [
    "itemCode",
    "recordingItemId",
    "recordingTaskCode",
    "sourceItemId",
    "syncToken",
    "updatedAt",
  ]);
});

test("Taizhou recording integration inspects locally but sends manual imports to the authoritative backend", async function () {
  const existing = {
    recordingTaskCode: "T000001",
    sourceItemId: "source-item-1",
    recordingItemId: "recording-item-1",
    itemCode: "T000001-0000001",
    syncToken: "sync-token-1",
    updatedAt: 1,
  };
  const harness = createRuntime({
    storage: createStorageHarness([existing]),
    fetch(call) {
      assert.equal(call.url.endsWith("/recording-items"), true);
      return response({
        status: 200,
        json: {
          syncToken: "sync-token-authoritative",
          item: {
            itemId: "recording-item-authoritative",
            taskId: "internal-task-id",
            itemCode: "T000001-0000019",
            status: "AVAILABLE",
          },
        },
      });
    },
  });

  const inspected = await harness.runtime.inspectCurrentItem();
  const imported = await harness.runtime.importCurrentItem();

  assert.equal(inspected.ok, true);
  assert.equal(inspected.current, true);
  assert.deepEqual(inspected.mapping, existing);
  assert.equal(imported.ok, true);
  assert.equal(imported.kind, "replayed");
  assert.equal(imported.mapping.recordingItemId, "recording-item-authoritative");
  assert.equal(imported.mapping.itemCode, "T000001-0000019");
  assert.equal(imported.mapping.syncToken, "sync-token-authoritative");
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.storage.mappings.length, 1);
  assert.equal(
    harness.storage.mappings[0].recordingItemId,
    "recording-item-authoritative"
  );
});

test("Taizhou recording integration recovers a missing local mapping during manual refresh", async function () {
  const harness = createRuntime({
    fetch(call) {
      assert.equal(
        call.url.endsWith("/recording-items/result/recover"),
        true
      );
      return response({
        status: 200,
        json: {
          syncToken: "sync-token-recovered",
          itemId: "recording-item-recovered",
          itemCode: "T000001-0000720",
          status: "AVAILABLE",
          updatedAt: "2026-08-03T01:00:00Z",
          text: null,
          audioAvailable: false,
        },
      });
    },
  });

  const result = await harness.runtime.refreshCurrentResult();

  assert.deepEqual(result, {
    sourceItemId: "source-item-1",
    itemCode: "T000001-0000720",
    status: "AVAILABLE",
    updatedAt: "2026-08-03T01:00:00Z",
    text: null,
    audioAvailable: false,
  });
  assert.equal(harness.calls.length, 1);
  assert.deepEqual(JSON.parse(harness.calls[0].body), {
    recordingTaskCode: "T000001",
    sourceItemId: "source-item-1",
    referenceText: "完整题目文本",
    referenceAudioUrl: null,
    referenceVideoUrl: null,
  });
  assert.deepEqual(harness.storage.mappings, [
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-item-1",
      recordingItemId: "recording-item-recovered",
      itemCode: "T000001-0000720",
      syncToken: "sync-token-recovered",
      updatedAt: 1721780000000,
    },
  ]);
});

test("Taizhou recording integration keeps automatic entry recovery disabled without a local mapping", async function () {
  const harness = createRuntime();

  const result = await harness.runtime.autoRefreshForCurrentItem("source-item-1");

  assert.equal(result, null);
  assert.equal(harness.calls.length, 0);
});

test("Taizhou recording integration keeps a normal empty result when read-only recovery finds no server mapping", async function () {
  const harness = createRuntime({
    fetch(call) {
      assert.equal(
        call.url.endsWith("/recording-items/result/recover"),
        true
      );
      return response({
        ok: false,
        status: 404,
        json: {
          code: "RECORDING_MAPPING_NOT_FOUND",
          message: "录音同步映射不存在。",
        },
      });
    },
  });

  const result = await harness.runtime.refreshCurrentResult();

  assert.deepEqual(result, {
    notImported: true,
    sourceItemId: "source-item-1",
  });
  assert.equal(harness.calls.length, 1);
  assert.equal(
    harness.calls.some((call) => call.url.endsWith("/recording-items")),
    false
  );
});

test("Taizhou recording integration suppresses a stale recovery error after switching items", async function () {
  let releaseRecovery;
  let markRecoveryStarted;
  const recoveryGate = new Promise((resolve) => {
    releaseRecovery = resolve;
  });
  const recoveryStarted = new Promise((resolve) => {
    markRecoveryStarted = resolve;
  });
  const harness = createRuntime({
    fetch: async function (call) {
      assert.equal(
        call.url.endsWith("/recording-items/result/recover"),
        true
      );
      markRecoveryStarted();
      await recoveryGate;
      return response({
        ok: false,
        status: 503,
        json: {
          code: "RECORDING_PLATFORM_UNAVAILABLE",
          message: "录音平台暂时不可用。",
        },
      });
    },
  });

  const staleRecovery = harness.runtime.refreshCurrentResult();
  await recoveryStarted;
  assert.equal(
    await harness.runtime.autoRefreshForCurrentItem("source-item-2"),
    null
  );
  releaseRecovery();

  assert.equal(await staleRecovery, null);
  assert.deepEqual(harness.storage.mappings, []);
});

test("Taizhou recording result reports a missing remote item without creating data", async function () {
  const harness = createRuntime({
    storage: createStorageHarness([
      {
        recordingTaskCode: "T000001",
        sourceItemId: "source-item-1",
        recordingItemId: "recording-item-missing",
        itemCode: "T000001-0000019",
        syncToken: "sync-token-missing",
        updatedAt: 1,
      },
    ]),
    fetch(call) {
      assert.equal(call.url.endsWith("/recording-items/result"), true);
      return response({
        ok: false,
        status: 404,
        json: {
          success: false,
          code: "RECORDING_PLATFORM_QUERY_FAILED",
          message: "录音结果查询失败。",
          upstream: {
            code: "TASK_ITEM_NOT_FOUND",
            message: "任务条目不存在",
          },
        },
      });
    },
  });

  await assert.rejects(
    harness.runtime.refreshCurrentResult(),
    /原录音条目已不存在，请点击添加数据重新创建/
  );
  assert.equal(harness.calls.length, 1);
  assert.equal(
    harness.calls.some((call) => call.url.endsWith("/recording-items")),
    false
  );
});

test("Taizhou recording integration preserves the create response status and identifies server replay", async function () {
  const harness = createRuntime({
    fetch(call) {
      assert.equal(call.url.endsWith("/recording-items"), true);
      return response({
        status: 200,
        json: {
          syncToken: "sync-token-replay",
          item: {
            itemId: "recording-item-replay",
            taskId: "internal-task-id",
            itemCode: "T000001-0000009",
            status: "COMPLETED",
          },
        },
      });
    },
  });

  const result = await harness.runtime.importCurrentItem();

  assert.equal(result.ok, true);
  assert.equal(result.kind, "replayed");
  assert.deepEqual(result.initialResult, {
    sourceItemId: "source-item-1",
    itemCode: "T000001-0000009",
    status: "COMPLETED",
  });
  assert.equal(harness.storage.mappings.length, 1);
  assert.equal(harness.calls.length, 1);
});

test("Taizhou recording integration forwards URLs without downloading or uploading media and supports all reference combinations", async function () {
  const cases = [
    { referenceText: "文字", audioUrl: "", videoUrl: "" },
    { referenceText: "", audioUrl: "https://aidp.example.test/audio", videoUrl: "" },
    { referenceText: "", audioUrl: "", videoUrl: "https://aidp.example.test/video" },
    {
      referenceText: "文字",
      audioUrl: "https://aidp.example.test/audio",
      videoUrl: "",
    },
    {
      referenceText: "文字",
      audioUrl: "",
      videoUrl: "https://aidp.example.test/video",
    },
    {
      referenceText: "",
      audioUrl: "https://aidp.example.test/audio",
      videoUrl: "https://aidp.example.test/video",
    },
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
        assert.equal(call.url.endsWith("/recording-items"), true);
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

    assert.equal(harness.calls.length, 1);
    const createCall = harness.calls.find((call) =>
      call.url.endsWith("/recording-items")
    );
    assert.ok(createCall);
    const createBody = JSON.parse(createCall.body);
    assert.equal(createBody.referenceText, context.referenceText || null);
    assert.equal(createBody.referenceAudioUrl, context.audioUrl || null);
    assert.equal(createBody.referenceVideoUrl, context.videoUrl || null);
    assert.doesNotMatch(JSON.stringify(harness.storage.mappings), /aidp\.example/);
  }
});

test("Taizhou recording integration deduplicates concurrent clicks and lets the backend verify later imports", async function () {
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
              "/api/bytedance-aidp/taizhou-helper/recording-items/audio/eyJ0YXNrSWQiOiJ0YXNrLTEifQ.dGVzdC1zaWduYXR1cmU",
          },
        });
      }
      createCount += 1;
      return response({
        status: createCount === 1 ? 201 : 200,
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
  assert.equal(repeated.kind, "replayed");
  assert.equal(createCount, 2);
  assert.equal(resultCount, 2);
  assert.equal(autoFirst.status, "COMPLETED");
  assert.deepEqual(autoSecond, autoFirst);
  assert.equal(manual.text, "录音完成文本");
  assert.equal(
    manual.audioUrl,
    "https://script-center.example.test/api/bytedance-aidp/taizhou-helper/recording-items/audio/eyJ0YXNrSWQiOiJ0YXNrLTEifQ.dGVzdC1zaWduYXR1cmU"
  );
  const resultCalls = harness.calls.filter((call) =>
    call.url.endsWith("/recording-items/result")
  );
  assert.deepEqual(
    resultCalls.map((call) => JSON.parse(call.body)),
    [{ syncToken: "sync-token-1" }, { syncToken: "sync-token-1" }]
  );
});

test("Taizhou recording integration retries the same URL payload after deterministic 4xx and 5xx", async function () {
  let createAttempt = 0;
  const harness = createRuntime({
    context: {
      ok: true,
      sourceItemId: "source-retry-classification",
      referenceText: "",
      audioUrl: "https://aidp.example.test/audio",
      videoUrl: "",
    },
    fetch(call) {
      if (call.url.endsWith("/recording-items")) {
        createAttempt += 1;
        if (createAttempt === 1) {
          return response({
            ok: false,
            status: 422,
            json: { code: "REFERENCE_TYPE_NOT_ENABLED" },
          });
        }
        if (createAttempt === 2) {
          return response({
            ok: false,
            status: 503,
            json: { code: "UPSTREAM_UNAVAILABLE" },
          });
        }
        return response({
          status: 201,
          json: {
            syncToken: "sync-token-retried",
            item: {
              itemId: "recording-item-retried",
              itemCode: "T000001-0000002",
            },
          },
        });
      }
      throw new Error("unexpected call");
    },
  });

  assert.equal((await harness.runtime.importCurrentItem()).ok, false);
  assert.equal((await harness.runtime.importCurrentItem()).ok, false);
  assert.equal((await harness.runtime.importCurrentItem()).ok, true);

  assert.equal(harness.calls.length, 3);
  const bodies = harness.calls.map((call) => JSON.parse(call.body));
  assert.equal(new Set(bodies.map(JSON.stringify)).size, 1);
  assert.equal(
    bodies[0].referenceAudioUrl,
    "https://aidp.example.test/audio"
  );
});

test("Taizhou recording import keeps the captured A source when the current item switches to B", async function () {
  const storage = createStorageHarness();
  let releaseCreate;
  let markCreateStarted;
  const createGate = new Promise((resolve) => {
    releaseCreate = resolve;
  });
  const createStarted = new Promise((resolve) => {
    markCreateStarted = resolve;
  });
  const harness = createRuntime({
    storage,
    context: {
      ok: true,
      sourceItemId: "source-a",
      referenceText: "A 的完整题目",
      audioUrl: "",
      videoUrl: "",
    },
    fetch: async function (call) {
      if (!call.url.endsWith("/recording-items")) {
        throw new Error("unexpected call");
      }
      markCreateStarted();
      await createGate;
      return response({
        status: 201,
        json: {
          syncToken: "sync-a",
          item: {
            itemId: "recording-a",
            itemCode: "T000001-0000003",
          },
        },
      });
    },
  });

  const importA = harness.runtime.importCurrentItem();
  await createStarted;
  assert.equal(
    await harness.runtime.autoRefreshForCurrentItem("source-b"),
    null
  );
  releaseCreate();
  const result = await importA;

  assert.equal(result.ok, true);
  assert.equal(result.current, false);
  assert.equal(result.mapping.sourceItemId, "source-a");
  assert.equal(result.mapping.recordingTaskCode, "T000001");
  assert.equal(storage.mappings.length, 1);
  assert.equal(storage.mappings[0].sourceItemId, "source-a");
  const createCall = harness.calls.find((call) =>
    call.url.endsWith("/recording-items")
  );
  assert.equal(JSON.parse(createCall.body).sourceItemId, "source-a");
});

test("Taizhou recording integration drops stale A result and queries again after A-B-A entry", async function () {
  const storage = createStorageHarness([
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-a",
      recordingItemId: "recording-a",
      itemCode: "T000001-0000001",
      syncToken: "sync-a",
      updatedAt: 1,
    },
  ]);
  let releaseFirstA;
  let markFirstAStarted;
  const firstAGate = new Promise((resolve) => {
    releaseFirstA = resolve;
  });
  const firstAStarted = new Promise((resolve) => {
    markFirstAStarted = resolve;
  });
  let resultCount = 0;
  const harness = createRuntime({
    storage,
    fetch: async function (call) {
      if (!call.url.endsWith("/recording-items/result")) {
        throw new Error("unexpected call");
      }
      resultCount += 1;
      if (resultCount === 1) {
        markFirstAStarted();
        await firstAGate;
      }
      return response({
        json: {
          itemCode: "T000001-0000001",
          status: "COMPLETED",
          text: resultCount === 1 ? "过期 A" : "重新进入 A",
          audioAvailable: false,
        },
      });
    },
  });

  const slowA = harness.runtime.autoRefreshForCurrentItem("source-a");
  await firstAStarted;
  assert.equal(
    await harness.runtime.autoRefreshForCurrentItem("source-b"),
    null
  );
  releaseFirstA();
  assert.equal(await slowA, null);

  const reenteredA =
    await harness.runtime.autoRefreshForCurrentItem("source-a");
  assert.equal(reenteredA.text, "重新进入 A");
  assert.deepEqual(
    await harness.runtime.autoRefreshForCurrentItem("source-a"),
    reenteredA
  );
  assert.equal(resultCount, 2);
});

test("Taizhou recording integration suppresses a stale A result error after switching to B", async function () {
  const storage = createStorageHarness([
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-a",
      recordingItemId: "recording-a",
      itemCode: "T000001-0000001",
      syncToken: "sync-a",
      updatedAt: 1,
    },
  ]);
  let releaseA;
  let markAStarted;
  const aGate = new Promise((resolve) => {
    releaseA = resolve;
  });
  const aStarted = new Promise((resolve) => {
    markAStarted = resolve;
  });
  const harness = createRuntime({
    storage,
    fetch: async function (call) {
      if (!call.url.endsWith("/recording-items/result")) {
        throw new Error("unexpected call");
      }
      markAStarted();
      await aGate;
      return response({
        ok: false,
        status: 503,
        json: { code: "UPSTREAM_UNAVAILABLE" },
      });
    },
  });

  const slowA = harness.runtime.autoRefreshForCurrentItem("source-a");
  await aStarted;
  assert.equal(
    await harness.runtime.autoRefreshForCurrentItem("source-b"),
    null
  );
  releaseA();
  assert.equal(await slowA, null);
});

test("Taizhou recording integration only accepts a two-segment base64url result audio token", async function () {
  const storage = createStorageHarness([
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-item-1",
      recordingItemId: "recording-item-1",
      itemCode: "T000001-0000001",
      syncToken: "sync-token-1",
      updatedAt: 1,
    },
  ]);
  const audioUrls = [
    "/api/bytedance-aidp/taizhou-helper/recording-items/audio/eyJ0YXNrSWQiOiJ0YXNrLTEifQ.dGVzdC1zaWduYXR1cmU",
    "https://evil.example.test/audio",
    "/api/bytedance-aidp/taizhou-helper/recording-items/audio/single-segment",
    "/api/bytedance-aidp/taizhou-helper/recording-items/audio/one.two.three",
    "/api/bytedance-aidp/taizhou-helper/recording-items/audio/one.two?download=1",
    "/api/bytedance-aidp/taizhou-helper/recording-items/audio/one.two#fragment",
    "/api/public/recording-media/unexpected",
  ];
  let callIndex = 0;
  const harness = createRuntime({
    storage,
    fetch(call) {
      if (!call.url.endsWith("/recording-items/result")) {
        throw new Error("unexpected call");
      }
      const audioUrl = audioUrls[callIndex];
      callIndex += 1;
      return response({
        json: {
          status: "COMPLETED",
          audioAvailable: true,
          audioUrl,
        },
      });
    },
  });

  const valid =
    await harness.runtime.autoRefreshForCurrentItem("source-item-1");
  const rejected = [];
  for (let index = 1; index < audioUrls.length; index += 1) {
    rejected.push(await harness.runtime.refreshCurrentResult());
  }
  assert.equal(
    valid.audioUrl,
    "https://script-center.example.test/api/bytedance-aidp/taizhou-helper/recording-items/audio/eyJ0YXNrSWQiOiJ0YXNrLTEifQ.dGVzdC1zaWduYXR1cmU"
  );
  assert.equal(
    rejected.every((result) => !("audioUrl" in result)),
    true
  );
});
