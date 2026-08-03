"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const { createRouter } = require(resolveRepo(
  "platform-resources",
  "backend",
  "router.js"
));
const {
  createRecordingIntegration,
  registerRecordingIntegrationRoutes,
  __test__,
} = require(resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "taizhou-helper",
  "backend",
  "recording-integration.js"
));

const CREATE_PATH =
  "/api/bytedance-aidp/taizhou-helper/recording-items";
const RECOVER_PATH =
  "/api/bytedance-aidp/taizhou-helper/recording-items/result/recover";

function jsonResponse(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      { "content-type": "application/json; charset=utf-8" },
      headers || {}
    ),
  });
}

function writeConfig(configPath, overrides) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      Object.assign(
        {
          baseUrl: "https://recording.example.test",
          apiKey: "test-server-key",
          allowedTaskCodes: ["T000001"],
          tokenSecret: "test-token-secret-at-least-thirty-two-characters",
        },
        overrides || {}
      )
    )
  );
}

async function createFixture(t, options) {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "asc-recording-url-integration-")
  );
  const configPath = path.join(rootDir, "config.json");
  const runtimeDir = path.join(rootDir, "runtime");
  writeConfig(configPath, options?.config);
  options?.prepareRuntime?.({ rootDir, configPath, runtimeDir });
  const upstreamCalls = [];
  const fetchImpl =
    options?.fetchImpl ||
    (async function (url, requestOptions) {
      upstreamCalls.push({
        url: String(url),
        method: String(requestOptions?.method || "GET").toUpperCase(),
        headers: { ...(requestOptions?.headers || {}) },
        body: requestOptions?.body,
      });
      if (String(url).endsWith("/audio")) {
        return new Response(Buffer.from("protected-audio"), {
          status: 206,
          headers: {
            "content-type": "audio/wav",
            "content-length": "15",
            "content-range": "bytes 0-14/15",
            "accept-ranges": "bytes",
          },
        });
      }
      if ((requestOptions?.method || "GET") === "GET") {
        return jsonResponse(200, {
          itemId: "recording-item-1",
          itemCode: "T000001-0000001",
          status: "COMPLETED",
          updatedAt: "2026-07-25T01:00:00Z",
          text: "完成文本",
          audioAvailable: true,
        });
      }
      return jsonResponse(201, {
        itemId: "recording-item-1",
        taskId: "task-allowed",
        itemCode: "T000001-0000001",
        status: "AVAILABLE",
        createdAt: "2026-07-25T00:00:00Z",
      });
    });
  const integration = createRecordingIntegration({
    configPath,
    runtimeDir,
    fetchImpl,
    now: options?.now || (() => Date.parse("2026-07-25T00:00:00Z")),
    removeDirectorySync: options?.removeDirectorySync,
    upstreamTimeoutMs: options?.upstreamTimeoutMs,
  });
  const router = createRouter();
  registerRecordingIntegrationRoutes(router, { integration });
  const server = http.createServer((request, response) =>
    router.handle(request, response)
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    integration.close?.();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });
  return {
    rootDir,
    runtimeDir,
    integration,
    upstreamCalls,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  };
}

async function postJson(baseUrl, body) {
  return fetch(baseUrl + CREATE_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function recoverJson(baseUrl, body) {
  return fetch(baseUrl + RECOVER_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function bodyJson(response) {
  return JSON.parse(await response.text());
}

function fullBody(overrides) {
  return Object.assign(
    {
      recordingTaskCode: "T000001",
      sourceItemId: "source-1",
      referenceText: "参考文本",
      referenceAudioUrl: "https://media.example.test/audio?token=secret",
      referenceVideoUrl: "https://media.example.test/video?token=secret",
    },
    overrides || {}
  );
}

test("private config accepts HTTPS and loopback HTTP only", function () {
  const common = {
    apiKey: "key",
    allowedTaskCodes: ["T000001"],
    tokenSecret: "x".repeat(32),
  };
  assert.ok(
    __test__.validateConfig({
      ...common,
      baseUrl: "https://recording.example.test/",
    })
  );
  for (const baseUrl of [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://[::1]:8080",
  ]) {
    assert.ok(__test__.validateConfig({ ...common, baseUrl }));
  }
  for (const baseUrl of [
    "http://recording.example.test",
    "http://0.0.0.0:8080",
    "https://user:pass@recording.example.test",
  ]) {
    assert.equal(__test__.validateConfig({ ...common, baseUrl }), null);
  }
});

test("create forwards task code, source binding and every reference combination without media requests", async (t) => {
  const fixture = await createFixture(t);
  const cases = [
    { referenceText: "文字", referenceAudioUrl: null, referenceVideoUrl: null },
    { referenceText: null, referenceAudioUrl: "https://media.example.test:443/a?x=%2f", referenceVideoUrl: null },
    { referenceText: null, referenceAudioUrl: null, referenceVideoUrl: "https://media.example.test/v" },
    { referenceText: "文字", referenceAudioUrl: "https://media.example.test/a", referenceVideoUrl: null },
    { referenceText: "文字", referenceAudioUrl: null, referenceVideoUrl: "https://media.example.test/v" },
    { referenceText: null, referenceAudioUrl: "https://media.example.test/a", referenceVideoUrl: "https://media.example.test/v" },
    { referenceText: "文字", referenceAudioUrl: "https://media.example.test/a", referenceVideoUrl: "https://media.example.test/v" },
  ];
  for (const [index, references] of cases.entries()) {
    const response = await postJson(
      fixture.baseUrl,
      fullBody({ sourceItemId: `source-${index}`, ...references })
    );
    assert.equal(response.status, 201);
  }
  assert.equal(fixture.upstreamCalls.length, cases.length);
  for (const [index, call] of fixture.upstreamCalls.entries()) {
    assert.equal(call.method, "POST");
    assert.equal(
      call.url,
      "https://recording.example.test/api/integrations/tasks/by-code/T000001/items"
    );
    assert.deepEqual(JSON.parse(call.body), {
      ...Object.fromEntries(
        Object.entries(cases[index]).filter(([, value]) => value)
      ),
      sourcePlatform: "BYTEDANCE_AIDP",
      sourceItemId: `source-${index}`,
    });
    assert.equal(call.headers["X-API-Key"], "test-server-key");
    assert.match(call.headers["Idempotency-Key"], /^[a-f0-9]{64}$/);
  }
  assert.equal(
    new Set(
      fixture.upstreamCalls.map(
        (call) => call.headers["Idempotency-Key"]
      )
    ).size,
    cases.length
  );
});

test("request rejects unknown fields, empty references, disallowed tasks and unsafe URLs", async (t) => {
  const fixture = await createFixture(t);
  const cases = [
    [fullBody({ extra: true }), 400, "UNKNOWN_FIELD"],
    [fullBody({ referenceText: null, referenceAudioUrl: null, referenceVideoUrl: null }), 422, "ITEM_REFERENCE_REQUIRED"],
    [fullBody({ recordingTaskCode: "T999999" }), 403, "RECORDING_TASK_NOT_ALLOWED"],
    [fullBody({ referenceAudioUrl: 123 }), 400, "INVALID_FIELD_TYPE"],
    [fullBody({ referenceAudioUrl: "http://media.example.test/a" }), 422, "REMOTE_URL_INVALID"],
    [fullBody({ referenceAudioUrl: "/relative" }), 422, "REMOTE_URL_INVALID"],
    [fullBody({ referenceAudioUrl: "https://user:pass@media.example.test/a" }), 422, "REMOTE_URL_INVALID"],
  ];
  for (const [requestBody, expectedStatus, expectedCode] of cases) {
    const response = await postJson(fixture.baseUrl, requestBody);
    assert.equal(response.status, expectedStatus);
    assert.equal((await bodyJson(response)).code, expectedCode);
  }
  assert.equal(fixture.upstreamCalls.length, 0);
});

test("read-only recovery returns an existing result and never creates a recording item", async (t) => {
  const fixture = await createFixture(t);
  const createdResponse = await postJson(fixture.baseUrl, fullBody());
  assert.equal(createdResponse.status, 201);

  const recoveredResponse = await recoverJson(fixture.baseUrl, fullBody());
  assert.equal(recoveredResponse.status, 200);
  const recovered = await bodyJson(recoveredResponse);

  assert.equal(recovered.itemId, "recording-item-1");
  assert.equal(recovered.itemCode, "T000001-0000001");
  assert.equal(recovered.status, "COMPLETED");
  assert.equal(recovered.text, "完成文本");
  assert.equal(recovered.audioAvailable, true);
  assert.match(recovered.syncToken, /^[A-Za-z0-9_-]+$/);
  assert.equal(
    fixture.upstreamCalls.filter((call) => call.method === "POST").length,
    1
  );
  assert.equal(
    fixture.upstreamCalls.filter((call) => call.method === "GET").length,
    1
  );
});

test("read-only recovery fails closed when the server mapping is absent or mismatched", async (t) => {
  await t.test("absent mapping", async (t) => {
    const fixture = await createFixture(t);
    const recoveredResponse = await recoverJson(fixture.baseUrl, fullBody());
    assert.equal(recoveredResponse.status, 404);
    assert.equal(
      (await bodyJson(recoveredResponse)).code,
      "RECORDING_MAPPING_NOT_FOUND"
    );
    assert.equal(fixture.upstreamCalls.length, 0);
    assert.deepEqual(fixture.integration.getSnapshot().mappings, {});
  });

  await t.test("reference fingerprint mismatch", async (t) => {
    const fixture = await createFixture(t);
    assert.equal((await postJson(fixture.baseUrl, fullBody())).status, 201);
    const before = fixture.integration.getSnapshot();

    const recoveredResponse = await recoverJson(
      fixture.baseUrl,
      fullBody({ referenceText: "被改动的参考文本" })
    );

    assert.equal(recoveredResponse.status, 409);
    assert.equal(
      (await bodyJson(recoveredResponse)).code,
      "SOURCE_ITEM_CONTENT_CONFLICT"
    );
    assert.deepEqual(fixture.integration.getSnapshot(), before);
    assert.equal(
      fixture.upstreamCalls.filter((call) => call.method === "POST").length,
      1
    );
  });

  await t.test("disallowed task", async (t) => {
    const fixture = await createFixture(t);
    const recoveredResponse = await recoverJson(
      fixture.baseUrl,
      fullBody({ recordingTaskCode: "T999999" })
    );
    assert.equal(recoveredResponse.status, 403);
    assert.equal(
      (await bodyJson(recoveredResponse)).code,
      "RECORDING_TASK_NOT_ALLOWED"
    );
    assert.equal(fixture.upstreamCalls.length, 0);
    assert.deepEqual(fixture.integration.getSnapshot().mappings, {});
  });

  for (const status of [404, 503]) {
    await t.test(`upstream ${status}`, async (t) => {
      let method = "";
      let upstreamCount = 0;
      const fixture = await createFixture(t, {
        async fetchImpl(_url, requestOptions) {
          method = String(requestOptions?.method || "GET").toUpperCase();
          upstreamCount += 1;
          if (method === "POST") {
            return jsonResponse(201, {
              itemId: "recording-item-1",
              taskId: "task-allowed",
              itemCode: "T000001-0000001",
              status: "AVAILABLE",
              createdAt: "2026-07-25T00:00:00Z",
            });
          }
          return jsonResponse(status, {
            code: status === 404 ? "TASK_ITEM_NOT_FOUND" : "TEMPORARY",
            message: status === 404 ? "任务条目不存在" : "暂时不可用",
          });
        },
      });
      assert.equal((await postJson(fixture.baseUrl, fullBody())).status, 201);
      const before = fixture.integration.getSnapshot();

      const recoveredResponse = await recoverJson(fixture.baseUrl, fullBody());

      assert.equal(recoveredResponse.status, status === 404 ? 404 : 503);
      const recovered = await bodyJson(recoveredResponse);
      assert.equal(recovered.code, "RECORDING_PLATFORM_QUERY_FAILED");
      assert.equal(
        recovered.upstream.code,
        status === 404 ? "TASK_ITEM_NOT_FOUND" : "TEMPORARY"
      );
      assert.equal(method, "GET");
      assert.equal(upstreamCount, 2);
      assert.deepEqual(fixture.integration.getSnapshot(), before);
    });
  }
});

test("retryable upstream failures retain one mapping while deterministic 4xx clears it", async (t) => {
  let attempt = 0;
  const fixture = await createFixture(t, {
    async fetchImpl() {
      attempt += 1;
      if (attempt === 1) {
        return jsonResponse(503, { code: "TEMPORARY" });
      }
      return jsonResponse(422, { code: "REFERENCE_TYPE_NOT_ENABLED" });
    },
  });
  const retryable = await postJson(fixture.baseUrl, fullBody());
  assert.equal(retryable.status, 503);
  assert.equal(
    Object.values(fixture.integration.getSnapshot().mappings)[0].status,
    "RETRYABLE"
  );
  const rejected = await postJson(fixture.baseUrl, fullBody());
  assert.equal(rejected.status, 422);
  assert.equal(
    (await bodyJson(rejected)).code,
    "RECORDING_PLATFORM_REJECTED"
  );
  assert.deepEqual(fixture.integration.getSnapshot().mappings, {});
});

test("same source replays by stable fingerprint and changed URL conflicts without storing secrets", async (t) => {
  const fixture = await createFixture(t);
  const first = await postJson(fixture.baseUrl, fullBody());
  const replay = await postJson(
    fixture.baseUrl,
    fullBody({
      referenceText: " 参考文本 ",
      referenceAudioUrl: "https://media.example.test/audio?token=secret",
    })
  );
  const conflict = await postJson(
    fixture.baseUrl,
    fullBody({ referenceAudioUrl: "https://media.example.test/other" })
  );
  assert.equal(first.status, 201);
  assert.equal(replay.status, 200);
  const firstBody = await bodyJson(first);
  const replayBody = await bodyJson(replay);
  assert.equal(
    firstBody.syncToken,
    replayBody.syncToken
  );
  assert.equal(conflict.status, 409);
  assert.equal((await bodyJson(conflict)).code, "SOURCE_ITEM_CONTENT_CONFLICT");
  assert.deepEqual(
    fixture.upstreamCalls.map((call) => call.method),
    ["POST", "GET"]
  );
  const serialized = JSON.stringify(fixture.integration.getSnapshot());
  assert.doesNotMatch(serialized, /参考文本|media\.example|token=secret/);
  assert.match(serialized, /requestFingerprint/);
});

test("missing completed mapping is recreated with a new operation key", async (t) => {
  const upstreamCalls = [];
  let createCount = 0;
  const fixture = await createFixture(t, {
    async fetchImpl(url, requestOptions) {
      const call = {
        url: String(url),
        method: String(requestOptions?.method || "GET").toUpperCase(),
        headers: { ...(requestOptions?.headers || {}) },
        body: requestOptions?.body,
      };
      upstreamCalls.push(call);
      if (call.method === "GET") {
        return jsonResponse(404, {
          code: "TASK_ITEM_NOT_FOUND",
          message: "任务条目不存在",
        });
      }
      createCount += 1;
      return jsonResponse(201, {
        itemId: `recording-item-${createCount}`,
        taskId: "task-allowed",
        itemCode: `T000001-${String(createCount).padStart(7, "0")}`,
        status: "AVAILABLE",
        createdAt: "2026-07-25T00:00:00Z",
      });
    },
  });

  const first = await postJson(fixture.baseUrl, fullBody());
  const recreated = await postJson(fixture.baseUrl, fullBody());
  const recreatedBody = await bodyJson(recreated);
  const createCalls = upstreamCalls.filter((call) => call.method === "POST");

  assert.equal(first.status, 201);
  assert.equal(recreated.status, 201);
  assert.equal(recreatedBody.item.itemId, "recording-item-2");
  assert.equal(recreatedBody.item.itemCode, "T000001-0000002");
  assert.deepEqual(
    upstreamCalls.map((call) => call.method),
    ["POST", "GET", "POST"]
  );
  assert.equal(createCalls.length, 2);
  assert.match(createCalls[0].headers["Idempotency-Key"], /^[a-f0-9]{64}$/);
  assert.match(createCalls[1].headers["Idempotency-Key"], /^[a-f0-9]{64}$/);
  assert.notEqual(
    createCalls[0].headers["Idempotency-Key"],
    createCalls[1].headers["Idempotency-Key"]
  );
});

test("completed mapping is retained when verification fails without a missing-item response", async (t) => {
  for (const status of [401, 429, 503]) {
    await t.test(`upstream ${status}`, async (subtest) => {
      const upstreamCalls = [];
      const fixture = await createFixture(subtest, {
        async fetchImpl(url, requestOptions) {
          const call = {
            url: String(url),
            method: String(requestOptions?.method || "GET").toUpperCase(),
            headers: { ...(requestOptions?.headers || {}) },
            body: requestOptions?.body,
          };
          upstreamCalls.push(call);
          if (call.method === "GET") {
            return jsonResponse(status, {
              code: status === 401 ? "INVALID_INTEGRATION_API_KEY" : "TEMPORARY",
            });
          }
          return jsonResponse(201, {
            itemId: "recording-item-1",
            taskId: "task-allowed",
            itemCode: "T000001-0000001",
            status: "AVAILABLE",
            createdAt: "2026-07-25T00:00:00Z",
          });
        },
      });
      const first = await postJson(fixture.baseUrl, fullBody());
      assert.equal(first.status, 201);
      const originalMapping = Object.values(
        fixture.integration.getSnapshot().mappings
      )[0];
      const originalOperationKey = originalMapping.operationKey;

      const verification = await postJson(fixture.baseUrl, fullBody());
      const retainedMapping = Object.values(
        fixture.integration.getSnapshot().mappings
      )[0];

      assert.equal(verification.status, status >= 500 ? 503 : status);
      assert.equal(
        (await bodyJson(verification)).code,
        "RECORDING_PLATFORM_QUERY_FAILED"
      );
      assert.deepEqual(
        upstreamCalls.map((call) => call.method),
        ["POST", "GET"]
      );
      assert.equal(retainedMapping.recordingItemId, "recording-item-1");
      assert.equal(retainedMapping.itemCode, "T000001-0000001");
      assert.equal(retainedMapping.operationKey, originalOperationKey);
    });
  }
});

test("removed upload and public reference media routes return 404", async (t) => {
  const fixture = await createFixture(t);
  const upload = await fetch(
    fixture.baseUrl +
      "/api/bytedance-aidp/taizhou-helper/recording-media/audio",
    { method: "POST", body: Buffer.from("bytes") }
  );
  const publicGet = await fetch(
    fixture.baseUrl + "/api/public/recording-media/opaque"
  );
  const publicHead = await fetch(
    fixture.baseUrl + "/api/public/recording-media/opaque",
    { method: "HEAD" }
  );
  assert.equal(upload.status, 404);
  assert.equal(publicGet.status, 404);
  assert.equal(publicHead.status, 404);
});

test("valid v1 state drops task-id mappings, media fields and removes only fixed old directories", async (t) => {
  const fixture = await createFixture(t, {
    prepareRuntime({ runtimeDir }) {
      fs.mkdirSync(path.join(runtimeDir, "temp"), { recursive: true });
      fs.mkdirSync(path.join(runtimeDir, "media"), { recursive: true });
      fs.writeFileSync(path.join(runtimeDir, "temp", "stale.part"), "x");
      fs.writeFileSync(path.join(runtimeDir, "media", "old.bin"), "x");
      fs.writeFileSync(
        path.join(runtimeDir, "state.json"),
        JSON.stringify({
          version: 1,
          uploads: { unsafe: { relativePath: "../../outside" } },
          media: { unsafe: { relativePath: "../../outside" } },
          mappings: {
            safe: {
              mappingKey: "safe",
              requestFingerprint: "a".repeat(64),
              taskId: "task-allowed",
              sourceItemId: "source-old",
              operationKey: "stable-operation",
              uploadIds: { audio: "old-upload" },
              mediaIds: { audio: "old-media" },
              recordingItemId: "recording-old",
              itemCode: "T000001-0000009",
              status: "COMPLETED",
              createdAt: 1,
              updatedAt: 2,
            },
          },
        })
      );
    },
  });
  const snapshot = fixture.integration.getSnapshot();
  assert.equal(snapshot.version, 3);
  assert.deepEqual(snapshot.mappings, {});
  assert.equal("uploads" in snapshot, false);
  assert.equal("media" in snapshot, false);
  assert.equal(fs.existsSync(path.join(fixture.runtimeDir, "temp")), false);
  assert.equal(fs.existsSync(path.join(fixture.runtimeDir, "media")), false);
});

test("v2 state keeps only mappings that already contain a task code", async (t) => {
  const fixture = await createFixture(t, {
    prepareRuntime({ runtimeDir }) {
      fs.mkdirSync(runtimeDir, { recursive: true });
      fs.writeFileSync(
        path.join(runtimeDir, "state.json"),
        JSON.stringify({
          version: 2,
          mappings: {
            legacy: {
              mappingKey: "legacy",
              taskId: "task-allowed",
              sourceItemId: "source-old",
            },
            compatible: {
              mappingKey: "compatible",
              requestFingerprint: "b".repeat(64),
              taskCode: "T000001",
              sourceItemId: "source-compatible",
              operationKey: "stable-compatible-operation",
              recordingItemId: "recording-compatible",
              itemCode: "T000001-0000010",
              status: "COMPLETED",
              createdAt: 3,
              updatedAt: 4,
            },
          },
        })
      );
    },
  });
  const snapshot = fixture.integration.getSnapshot();
  assert.equal(snapshot.version, 3);
  assert.deepEqual(Object.keys(snapshot.mappings), ["compatible"]);
  assert.equal(snapshot.mappings.compatible.taskCode, "T000001");
});

test("corrupt state with runtime data fails closed and migration deletion failure stops startup", function () {
  const missingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "asc-missing-state-"));
  const missingConfig = path.join(missingRoot, "config.json");
  const missingRuntime = path.join(missingRoot, "runtime");
  writeConfig(missingConfig);
  fs.mkdirSync(path.join(missingRuntime, "media"), { recursive: true });
  fs.writeFileSync(path.join(missingRuntime, "media", "unknown"), "x");
  assert.throws(
    () =>
      createRecordingIntegration({
        configPath: missingConfig,
        runtimeDir: missingRuntime,
      }),
    /状态|迁移/
  );
  fs.rmSync(missingRoot, { recursive: true, force: true });

  const firstRoot = fs.mkdtempSync(path.join(os.tmpdir(), "asc-corrupt-state-"));
  const firstConfig = path.join(firstRoot, "config.json");
  const firstRuntime = path.join(firstRoot, "runtime");
  writeConfig(firstConfig);
  fs.mkdirSync(path.join(firstRuntime, "media"), { recursive: true });
  fs.writeFileSync(path.join(firstRuntime, "media", "unknown"), "x");
  fs.writeFileSync(path.join(firstRuntime, "state.json"), "{bad");
  assert.throws(
    () =>
      createRecordingIntegration({
        configPath: firstConfig,
        runtimeDir: firstRuntime,
      }),
    /状态|迁移/
  );
  fs.rmSync(firstRoot, { recursive: true, force: true });

  const secondRoot = fs.mkdtempSync(path.join(os.tmpdir(), "asc-delete-fail-"));
  const secondConfig = path.join(secondRoot, "config.json");
  const secondRuntime = path.join(secondRoot, "runtime");
  writeConfig(secondConfig);
  fs.mkdirSync(path.join(secondRuntime, "temp"), { recursive: true });
  fs.writeFileSync(
    path.join(secondRuntime, "state.json"),
    JSON.stringify({ version: 1, uploads: {}, media: {}, mappings: {} })
  );
  assert.throws(
    () =>
      createRecordingIntegration({
        configPath: secondConfig,
        runtimeDir: secondRuntime,
        removeDirectorySync() {
          throw new Error("private path must not escape");
        },
      }),
    /迁移/
  );
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(secondRuntime, "state.json"), "utf8"))
      .version,
    1
  );
  fs.rmSync(secondRoot, { recursive: true, force: true });
});

test("result lookup remains protected and completed audio is proxied with Range", async (t) => {
  const fixture = await createFixture(t);
  const created = await bodyJson(
    await postJson(fixture.baseUrl, fullBody())
  );
  const result = await fetch(
    fixture.baseUrl +
      "/api/bytedance-aidp/taizhou-helper/recording-items/result",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ syncToken: created.syncToken }),
    }
  );
  assert.equal(result.status, 200);
  const resultBody = await bodyJson(result);
  assert.equal(resultBody.text, "完成文本");
  assert.equal(resultBody.audioAvailable, true);
  assert.match(resultBody.audioUrl, /recording-items\/audio\/[^/]+\.[^/]+$/);

  const audio = await fetch(fixture.baseUrl + resultBody.audioUrl, {
    headers: { Range: "bytes=0-14" },
  });
  assert.equal(audio.status, 206);
  assert.equal(await audio.text(), "protected-audio");
  const audioCall = fixture.upstreamCalls.at(-1);
  assert.equal(audioCall.headers.Range, "bytes=0-14");
  assert.equal(audioCall.headers["X-API-Key"], "test-server-key");
});
