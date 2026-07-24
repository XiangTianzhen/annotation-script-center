"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { PassThrough } = require("node:stream");
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
} = require(resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "taizhou-helper",
  "backend",
  "recording-integration.js"
));

const WAV_BYTES = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.alloc(4),
  Buffer.from("WAVEfmt "),
  Buffer.alloc(16),
]);
const MP4_BYTES = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from("ftyp"),
  Buffer.from("isom"),
  Buffer.alloc(12),
]);

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
          allowedTaskIds: ["task-allowed"],
          publicMediaBaseUrl:
            "https://annotation.example.test/api/public/recording-media",
          tokenSecret: "test-token-secret-at-least-thirty-two-characters",
        },
        overrides || {}
      )
    )
  );
}

function createFixture(t, options) {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "asc-recording-integration-")
  );
  const configPath = path.join(rootDir, "config.json");
  const runtimeDir = path.join(rootDir, "runtime");
  writeConfig(configPath);
  if (typeof options?.prepareRuntime === "function") {
    options.prepareRuntime({ rootDir, configPath, runtimeDir });
  }

  const upstreamCalls = [];
  const fetchImpl =
    options?.fetchImpl ||
    (async function (url, requestOptions) {
      upstreamCalls.push({
        url: String(url),
        options: requestOptions || {},
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
          updatedAt: "2026-07-24T02:00:00Z",
          text: "完成文本",
          audioAvailable: true,
        });
      }
      return jsonResponse(201, {
        itemId: "recording-item-1",
        taskId: "task-allowed",
        itemCode: "T000001-0000001",
        status: "AVAILABLE",
        createdAt: "2026-07-24T01:00:00Z",
      });
    });

  const clock = options?.clock || { value: Date.parse("2026-07-24T00:00:00Z") };
  const integration = createRecordingIntegration({
    configPath,
    runtimeDir,
    fetchImpl,
    maxUploadBytes: options?.maxUploadBytes || 1024,
    maxConcurrentUploads: options?.maxConcurrentUploads || 2,
    uploadTtlMs: options?.uploadTtlMs || 60 * 60 * 1000,
    audioTokenTtlMs: options?.audioTokenTtlMs || 120 * 1000,
    uploadReadTimeoutMs: options?.uploadReadTimeoutMs,
    upstreamTimeoutMs: options?.upstreamTimeoutMs,
    maxUpstreamJsonBytes: options?.maxUpstreamJsonBytes,
    maintenanceIntervalMs: options?.maintenanceIntervalMs,
    stagingCleanupSafetyMarginMs: options?.stagingCleanupSafetyMarginMs,
    removeFileSync: options?.removeFileSync,
    mkdirSync: options?.mkdirSync,
    createReadStream: options?.createReadStream,
    now: () => clock.value,
  });
  const router = createRouter();
  registerRecordingIntegrationRoutes(router, { integration });
  const server = http.createServer((request, response) =>
    router.handle(request, response)
  );

  t.after(async () => {
    integration.close?.();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        rootDir,
        configPath,
        runtimeDir,
        integration,
        upstreamCalls,
        clock,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

async function uploadMedia(baseUrl, kind, taskId, bytes, contentType) {
  return fetch(
    `${baseUrl}/api/bytedance-aidp/taizhou-helper/recording-media/${kind}`,
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "X-Recording-Task-Id": taskId,
      },
      body: bytes,
    }
  );
}

function createRawUploadStream(taskId, contentType) {
  const stream = new PassThrough();
  stream.headers = {
    "content-type": contentType,
    "x-recording-task-id": taskId,
  };
  return stream;
}

async function waitFor(predicate, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

function requestChunked(options) {
  return new Promise((resolve, reject) => {
    const request = http.request(options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        })
      );
    });
    request.on("error", reject);
    for (const chunk of options.chunks || []) {
      request.write(chunk);
    }
    request.end();
  });
}

test("missing or invalid private configuration fails safely without exposing values", async (t) => {
  const fixture = await createFixture(t);
  fs.rmSync(fixture.configPath, { force: true });

  const response = await uploadMedia(
    fixture.baseUrl,
    "audio",
    "task-allowed",
    WAV_BYTES,
    "audio/wav"
  );
  const body = await readJson(response);

  assert.equal(response.status, 503);
  assert.equal(body.code, "RECORDING_INTEGRATION_NOT_CONFIGURED");
  assert.doesNotMatch(JSON.stringify(body), /test-server-key|token-secret|config\.json/);
});

test("recording integration docs and template use the validated public media and token fields", function () {
  const docs = fs.readFileSync(
    resolveRepo("docs", "recording-platform-integration.md"),
    "utf8"
  );
  const template = JSON.parse(
    fs.readFileSync(
      resolveRepo(
        "config",
        "secrets",
        "recording-platform-integration.json.example"
      ),
      "utf8"
    )
  );

  assert.match(docs, /publicMediaBaseUrl/);
  assert.doesNotMatch(docs, /"publicBaseUrl"/);
  assert.match(docs, /tokenSecret/);
  assert.match(docs, /tokenSecret[^。\n]*32|32[^。\n]*tokenSecret/i);
  assert.equal(typeof template.publicMediaBaseUrl, "string");
  assert.equal(Object.hasOwn(template, "publicBaseUrl"), false);
  assert.equal(typeof template.tokenSecret, "string");
});

test("upload enforces allowlist, kind, MIME/magic, raw stream limit and CORS header", async (t) => {
  const fixture = await createFixture(t, { maxUploadBytes: 24 });

  const forbidden = await uploadMedia(
    fixture.baseUrl,
    "audio",
    "task-forbidden",
    WAV_BYTES,
    "audio/wav"
  );
  assert.equal(forbidden.status, 403);

  const wrongMagic = await uploadMedia(
    fixture.baseUrl,
    "audio",
    "task-allowed",
    Buffer.from("not-a-wave-file"),
    "audio/wav"
  );
  assert.equal(wrongMagic.status, 415);

  const wrongKind = await uploadMedia(
    fixture.baseUrl,
    "document",
    "task-allowed",
    WAV_BYTES,
    "audio/wav"
  );
  assert.equal(wrongKind.status, 415);

  const address = new URL(fixture.baseUrl);
  const tooLarge = await requestChunked({
    hostname: address.hostname,
    port: Number(address.port),
    path: "/api/bytedance-aidp/taizhou-helper/recording-media/video",
    method: "POST",
    headers: {
      "Content-Type": "video/mp4",
      "Transfer-Encoding": "chunked",
      "X-Recording-Task-Id": "task-allowed",
    },
    chunks: [MP4_BYTES, Buffer.alloc(16)],
  });
  assert.equal(tooLarge.status, 413);

  const preflight = await fetch(
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-media/audio`,
    { method: "OPTIONS" }
  );
  assert.match(
    preflight.headers.get("access-control-allow-headers") || "",
    /X-Recording-Task-Id/i
  );
});

test("validated uploads land atomically with opaque IDs and expire after one hour", async (t) => {
  const fixture = await createFixture(t, { uploadTtlMs: 1000 });
  const response = await uploadMedia(
    fixture.baseUrl,
    "audio",
    "task-allowed",
    WAV_BYTES,
    "audio/wav"
  );
  const body = await readJson(response);

  assert.equal(response.status, 201);
  assert.match(body.uploadId, /^[A-Za-z0-9_-]{24,}$/);
  assert.equal(Object.hasOwn(body, "path"), false);
  assert.equal(
    fixture.integration.getSnapshot().uploads[body.uploadId].contentSha256,
    crypto.createHash("sha256").update(WAV_BYTES).digest("hex")
  );
  assert.deepEqual(
    fs.readdirSync(path.join(fixture.runtimeDir, "temp")).filter((name) =>
      name.endsWith(".uploading")
    ),
    []
  );

  fixture.clock.value += 1001;
  await fixture.integration.cleanupExpiredUploads();
  assert.equal(
    fixture.integration.getSnapshot().uploads[body.uploadId],
    undefined
  );
  assert.equal(fs.readdirSync(path.join(fixture.runtimeDir, "temp")).length, 0);
});

test("upload limiter rejects a third simultaneous upload", async (t) => {
  const fixture = await createFixture(t);
  const first = fixture.integration.uploadLimiter.tryAcquire();
  const second = fixture.integration.uploadLimiter.tryAcquire();
  const third = fixture.integration.uploadLimiter.tryAcquire();

  assert.equal(first, true);
  assert.equal(second, true);
  assert.equal(third, false);
  fixture.integration.uploadLimiter.release();
  fixture.integration.uploadLimiter.release();
});

test("oversized and stalled streams release upload slots without waiting for request end", async (t) => {
  const fixture = await createFixture(t, {
    maxUploadBytes: 8,
    uploadReadTimeoutMs: 30,
  });

  const oversized = createRawUploadStream("task-allowed", "video/mp4");
  const oversizedOperation = fixture.integration
    .storeUpload(oversized, "video", "task-allowed")
    .then(
      () => ({ resolved: true }),
      (error) => ({ error })
    );
  oversized.write(Buffer.alloc(9));
  const oversizedResult = await Promise.race([
    oversizedOperation,
    new Promise((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), 150)
    ),
  ]);
  oversized.destroy();

  assert.equal(oversizedResult.timedOut, undefined);
  assert.equal(oversizedResult.error?.status, 413);
  assert.equal(fixture.integration.uploadLimiter.active, 0);
  assert.deepEqual(
    fs.existsSync(path.join(fixture.runtimeDir, "temp"))
      ? fs.readdirSync(path.join(fixture.runtimeDir, "temp"))
      : [],
    []
  );

  const stalled = createRawUploadStream("task-allowed", "audio/wav");
  const stalledOperation = fixture.integration
    .storeUpload(stalled, "audio", "task-allowed")
    .then(
      () => ({ resolved: true }),
      (error) => ({ error })
    );
  const stalledResult = await Promise.race([
    stalledOperation,
    new Promise((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), 150)
    ),
  ]);
  stalled.destroy();

  assert.equal(stalledResult.timedOut, undefined);
  assert.equal(stalledResult.error?.status, 408);
  assert.equal(fixture.integration.uploadLimiter.active, 0);
});

test("active slow staging survives maintenance ticks without cleanup attempts", async (t) => {
  let stagingCleanupAttempts = 0;
  const fixture = await createFixture(t, {
    uploadReadTimeoutMs: 200,
    maintenanceIntervalMs: 10,
    stagingCleanupSafetyMarginMs: 20,
    removeFileSync(filePath) {
      if (filePath.endsWith(".uploading")) {
        stagingCleanupAttempts += 1;
      }
      fs.rmSync(filePath, { force: true });
    },
  });
  const stream = createRawUploadStream("task-allowed", "audio/wav");
  const uploadPromise = fixture.integration.storeUpload(
    stream,
    "audio",
    "task-allowed"
  );

  stream.write(WAV_BYTES.subarray(0, 12));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const activeDuringMaintenance = fixture.integration.uploadLimiter.active;
  stream.end(WAV_BYTES.subarray(12));
  const uploaded = await uploadPromise.catch((error) => ({ error }));
  assert.equal(activeDuringMaintenance, 1);
  assert.equal(stagingCleanupAttempts, 0);
  assert.equal(uploaded.error, undefined);
  assert.match(uploaded.uploadId, /^[A-Za-z0-9_-]{24,}$/);
  assert.equal(fixture.integration.uploadLimiter.active, 0);
  assert.equal(stagingCleanupAttempts, 0);
});

test("upload setup failures after acquire always release the limiter slot", async (t) => {
  let failTempMkdir = false;
  const fixture = await createFixture(t, {
    mkdirSync(directoryPath, options) {
      if (failTempMkdir && path.basename(directoryPath) === "temp") {
        throw new Error("simulated mkdir failure");
      }
      fs.mkdirSync(directoryPath, options);
    },
  });
  failTempMkdir = true;
  const stream = createRawUploadStream("task-allowed", "audio/wav");
  stream.end(WAV_BYTES);

  await assert.rejects(
    fixture.integration.storeUpload(stream, "audio", "task-allowed"),
    (error) =>
      error?.status === 500 && error?.code === "MEDIA_UPLOAD_FAILED"
  );
  assert.equal(fixture.integration.uploadLimiter.active, 0);
});

test("recording item validates exact fields, references, task and upload ownership", async (t) => {
  const fixture = await createFixture(t);
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;

  const malformed = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);

  const unknown = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-1",
      referenceText: "参考",
      cookie: "must-not-pass",
    }),
  });
  assert.equal(unknown.status, 400);

  const empty = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-1",
      referenceText: "  ",
    }),
  });
  assert.equal(empty.status, 422);

  const forbidden = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-forbidden",
      sourceItemId: "source-1",
      referenceText: "参考",
    }),
  });
  assert.equal(forbidden.status, 403);

  const invalidTask = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: 123,
      sourceItemId: "source-1",
      referenceText: "参考",
    }),
  });
  assert.equal(invalidTask.status, 422);

  const audio = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "audio",
      "task-allowed",
      WAV_BYTES,
      "audio/wav"
    )
  );
  const mismatch = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-1",
      videoUploadId: audio.uploadId,
    }),
  });
  assert.equal(mismatch.status, 422);
});

test("item creation binds media, uses stable idempotency and recovers mapping after restart", async (t) => {
  const fixture = await createFixture(t);
  const audio = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "audio",
      "task-allowed",
      WAV_BYTES,
      "audio/wav"
    )
  );
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const payload = {
    recordingTaskId: "task-allowed",
    sourceItemId: "source-stable",
    referenceText: "  参考文字  ",
    audioUploadId: audio.uploadId,
  };

  const first = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const firstBody = await readJson(first);
  const second = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const secondBody = await readJson(second);

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(firstBody.item.itemId, secondBody.item.itemId);
  assert.equal(firstBody.syncToken, secondBody.syncToken);
  assert.equal(fixture.upstreamCalls.length, 1);

  const resultEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`;
  for (const syncToken of [firstBody.syncToken, secondBody.syncToken]) {
    const resultResponse = await fetch(resultEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken }),
    });
    assert.equal(resultResponse.status, 200);
  }

  const upstreamRequest = fixture.upstreamCalls[0];
  const expectedKey = crypto
    .createHash("sha256")
    .update(
      "bytedance-aidp/taizhou-helper" +
        "\n" +
        "task-allowed" +
        "\n" +
        "source-stable"
    )
    .digest("hex");
  assert.equal(upstreamRequest.options.headers["Idempotency-Key"], expectedKey);
  assert.equal(upstreamRequest.options.headers["X-API-Key"], "test-server-key");
  const upstreamBody = JSON.parse(upstreamRequest.options.body);
  assert.equal(upstreamBody.referenceText, "参考文字");
  assert.match(
    upstreamBody.referenceAudioUrl,
    /^https:\/\/annotation\.example\.test\/api\/public\/recording-media\/[A-Za-z0-9_-]{24,}$/
  );

  const stateText = fs.readFileSync(
    path.join(fixture.runtimeDir, "state.json"),
    "utf8"
  );
  assert.doesNotMatch(
    stateText,
    /参考文字|test-server-key|test-token-secret|Authorization|Cookie/
  );
  assert.match(stateText, /recording-item-1/);

  const recovered = createRecordingIntegration({
    configPath: fixture.configPath,
    runtimeDir: fixture.runtimeDir,
    fetchImpl: async () => {
      throw new Error("recovered mapping must not call upstream");
    },
    now: () => fixture.clock.value,
  });
  const replay = await recovered.createRecordingItem(payload);
  assert.equal(replay.replayed, true);
  assert.equal(replay.item.itemId, "recording-item-1");
  assert.equal(replay.syncToken, firstBody.syncToken);
  recovered.close();
});

test("same source item rejects a changed normalized request fingerprint", async (t) => {
  const fixture = await createFixture(t);
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const basePayload = {
    recordingTaskId: "task-allowed",
    sourceItemId: "source-fingerprint",
    referenceText: "参考一",
  };
  const first = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(basePayload),
  });
  assert.equal(first.status, 201);

  const changed = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      Object.assign({}, basePayload, { referenceText: "参考二" })
    ),
  });
  const changedBody = await readJson(changed);

  assert.equal(changed.status, 409);
  assert.equal(changedBody.code, "SOURCE_ITEM_CONTENT_CONFLICT");
  assert.equal(fixture.upstreamCalls.length, 1);
  const stateText = fs.readFileSync(
    path.join(fixture.runtimeDir, "state.json"),
    "utf8"
  );
  assert.doesNotMatch(stateText, /参考一|参考二/);
  assert.match(stateText, /requestFingerprint/);
});

test("concurrent identical source creation shares one upstream flight", async (t) => {
  let upstreamCreateCalls = 0;
  let releaseUpstream;
  const upstreamGate = new Promise((resolve) => {
    releaseUpstream = resolve;
  });
  const fixture = await createFixture(t, {
    fetchImpl: async (url, requestOptions) => {
      if ((requestOptions?.method || "GET") === "POST") {
        upstreamCreateCalls += 1;
        await upstreamGate;
        return jsonResponse(201, {
          itemId: "recording-concurrent-1",
          taskId: "task-allowed",
          itemCode: "T000001-0000099",
          status: "AVAILABLE",
          createdAt: "2026-07-24T01:00:00Z",
        });
      }
      throw new Error(`unexpected upstream call: ${url}`);
    },
  });
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-concurrent",
      referenceText: "并发参考",
    }),
  };

  const first = fetch(endpoint, requestOptions);
  const second = fetch(endpoint, requestOptions);
  assert.equal(
    await waitFor(() => upstreamCreateCalls > 0, 200),
    true
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  releaseUpstream();
  const [firstResponse, secondResponse] = await Promise.all([first, second]);

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(upstreamCreateCalls, 1);
  assert.deepEqual(await readJson(firstResponse), await readJson(secondResponse));
});

test("fresh uploads with identical bytes share a pending source flight and clean the duplicate", async (t) => {
  let upstreamCreateCalls = 0;
  let releaseUpstream;
  const upstreamGate = new Promise((resolve) => {
    releaseUpstream = resolve;
  });
  const fixture = await createFixture(t, {
    fetchImpl: async () => {
      upstreamCreateCalls += 1;
      await upstreamGate;
      return jsonResponse(201, {
        itemId: "recording-pending-digest",
        itemCode: "T000001-0000101",
        status: "AVAILABLE",
      });
    },
  });
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const firstUpload = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "audio",
      "task-allowed",
      WAV_BYTES,
      "audio/wav"
    )
  );
  const create = (uploadId) =>
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId: "source-pending-digest",
        referenceText: " 同一文字 ",
        audioUploadId: uploadId,
      }),
    });
  const first = create(firstUpload.uploadId);
  assert.equal(await waitFor(() => upstreamCreateCalls === 1, 200), true);

  const secondUpload = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "audio",
      "task-allowed",
      WAV_BYTES,
      "audio/wav"
    )
  );
  const second = create(secondUpload.uploadId);
  assert.equal(
    await waitFor(
      () =>
        fixture.integration.getSnapshot().uploads[secondUpload.uploadId] ===
        undefined,
      200
    ),
    true
  );
  releaseUpstream();
  const [firstResponse, secondResponse] = await Promise.all([first, second]);

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(upstreamCreateCalls, 1);
  assert.equal(
    fixture.integration.getSnapshot().uploads[secondUpload.uploadId],
    undefined
  );
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    1
  );
});

test("same media bytes survive fresh upload retries and reload-style success replay", async (t) => {
  let createAttempt = 0;
  const idempotencyKeys = [];
  const fixture = await createFixture(t, {
    fetchImpl: async (_url, requestOptions) => {
      createAttempt += 1;
      idempotencyKeys.push(requestOptions.headers["Idempotency-Key"]);
      if (createAttempt === 1) {
        throw new Error("temporary network failure");
      }
      return jsonResponse(201, {
        itemId: "recording-digest-retry",
        itemCode: "T000001-0000102",
        status: "AVAILABLE",
      });
    },
  });
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  async function uploadAndCreate(bytes) {
    const upload = await readJson(
      await uploadMedia(
        fixture.baseUrl,
        "audio",
        "task-allowed",
        bytes,
        "audio/wav"
      )
    );
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId: "source-digest-retry",
        referenceText: "  同一参考文字  ",
        audioUploadId: upload.uploadId,
      }),
    });
    return { response, uploadId: upload.uploadId };
  }

  const retryable = await uploadAndCreate(WAV_BYTES);
  assert.equal(retryable.response.status, 503);
  const recovered = await uploadAndCreate(WAV_BYTES);
  assert.equal(recovered.response.status, 201);
  const replayed = await uploadAndCreate(WAV_BYTES);
  assert.equal(replayed.response.status, 200);

  const changedBytes = Buffer.concat([WAV_BYTES, Buffer.from([1])]);
  const conflict = await uploadAndCreate(changedBytes);
  const conflictBody = await readJson(conflict.response);
  assert.equal(conflict.response.status, 409);
  assert.equal(conflictBody.code, "SOURCE_ITEM_CONTENT_CONFLICT");
  assert.equal(createAttempt, 2);
  assert.equal(idempotencyKeys[0], idempotencyKeys[1]);
  assert.deepEqual(
    Object.keys(fixture.integration.getSnapshot().uploads),
    []
  );
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    1
  );
  const stateText = fs.readFileSync(
    path.join(fixture.runtimeDir, "state.json"),
    "utf8"
  );
  assert.doesNotMatch(stateText, /同一参考文字|https?:\/\//);
});

test("JSON upstream timeout covers create and result response bodies and clears flights", async (t) => {
  let mode = "create-hang";
  let createCalls = 0;

  function delayedJson(requestOptions, body) {
    return new Response(
      new ReadableStream({
        start(controller) {
          const timer = setTimeout(() => {
            try {
              controller.enqueue(Buffer.from(JSON.stringify(body)));
              controller.close();
            } catch (error) {
              // The timeout path already closed the mock stream.
            }
          }, 150);
          requestOptions.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              controller.error(new Error("upstream body aborted"));
            },
            { once: true }
          );
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const fixture = await createFixture(t, {
    upstreamTimeoutMs: 30,
    fetchImpl: async (url, requestOptions) => {
      if ((requestOptions?.method || "GET") === "POST") {
        createCalls += 1;
        if (mode === "create-hang") {
          return delayedJson(requestOptions, {
            itemId: "recording-body-timeout",
            itemCode: "T000001-0000066",
            status: "AVAILABLE",
          });
        }
        return jsonResponse(201, {
          itemId: "recording-body-timeout",
          taskId: "task-allowed",
          itemCode: "T000001-0000066",
          status: "AVAILABLE",
          createdAt: "2026-07-24T01:00:00Z",
        });
      }
      if (mode === "query-hang") {
        return delayedJson(requestOptions, {
          itemId: "recording-body-timeout",
          itemCode: "T000001-0000066",
          status: "COMPLETED",
          audioAvailable: false,
        });
      }
      return jsonResponse(200, {
        itemId: "recording-body-timeout",
        itemCode: "T000001-0000066",
        status: "COMPLETED",
        updatedAt: "2026-07-24T02:00:00Z",
        text: "完成",
        audioAvailable: false,
      });
    },
  });
  const createEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const createOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-body-timeout",
      referenceText: "参考",
    }),
  };

  const timedOutCreate = await fetch(createEndpoint, createOptions);
  const timedOutCreateBody = await readJson(timedOutCreate);
  assert.equal(timedOutCreate.status, 503);
  assert.equal(timedOutCreateBody.code, "RECORDING_PLATFORM_UNAVAILABLE");
  assert.equal(
    Object.values(fixture.integration.getSnapshot().mappings)[0]?.status,
    "RETRYABLE"
  );

  mode = "create-success";
  const retriedCreate = await fetch(createEndpoint, createOptions);
  const created = await readJson(retriedCreate);
  assert.equal(retriedCreate.status, 201);
  assert.equal(createCalls, 2);

  mode = "query-hang";
  const resultEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`;
  const timedOutResult = await fetch(resultEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncToken: created.syncToken }),
  });
  const timedOutResultBody = await readJson(timedOutResult);
  assert.equal(timedOutResult.status, 503);
  assert.equal(timedOutResultBody.code, "RECORDING_PLATFORM_UNAVAILABLE");

  mode = "query-success";
  const retriedResult = await fetch(resultEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncToken: created.syncToken }),
  });
  assert.equal(retriedResult.status, 200);
});

test("create and result JSON upstream bodies enforce a strict size limit", async (t) => {
  let mode = "create-large";
  const fixture = await createFixture(t, {
    maxUpstreamJsonBytes: 256,
    fetchImpl: async (url, requestOptions) => {
      if ((requestOptions?.method || "GET") === "POST") {
        if (mode === "create-large") {
          return jsonResponse(201, {
            itemId: "recording-large-json",
            itemCode: "T000001-0000055",
            status: "AVAILABLE",
            padding: "x".repeat(512),
          });
        }
        return jsonResponse(201, {
          itemId: "recording-large-json",
          taskId: "task-allowed",
          itemCode: "T000001-0000055",
          status: "AVAILABLE",
          createdAt: "2026-07-24T01:00:00Z",
        });
      }
      if (mode === "query-large") {
        return jsonResponse(200, {
          itemId: "recording-large-json",
          itemCode: "T000001-0000055",
          status: "COMPLETED",
          audioAvailable: false,
          padding: "sensitive-upstream-data".repeat(32),
        });
      }
      throw new Error(`unexpected upstream call: ${url}`);
    },
  });
  const createEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;
  const createOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recordingTaskId: "task-allowed",
      sourceItemId: "source-large-json",
      referenceText: "参考",
    }),
  };

  const oversizedCreate = await fetch(createEndpoint, createOptions);
  const oversizedCreateBody = await readJson(oversizedCreate);
  assert.equal(oversizedCreate.status, 503);
  assert.equal(
    oversizedCreateBody.code,
    "RECORDING_PLATFORM_INVALID_RESPONSE"
  );
  assert.doesNotMatch(
    JSON.stringify(oversizedCreateBody),
    /sensitive-upstream-data|padding/
  );
  assert.equal(
    Object.values(fixture.integration.getSnapshot().mappings)[0]?.status,
    "RETRYABLE"
  );

  mode = "create-success";
  const retriedCreate = await fetch(createEndpoint, createOptions);
  const created = await readJson(retriedCreate);
  assert.equal(retriedCreate.status, 201);

  mode = "query-large";
  const oversizedResult = await fetch(
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken: created.syncToken }),
    }
  );
  const oversizedResultBody = await readJson(oversizedResult);
  assert.equal(oversizedResult.status, 503);
  assert.equal(
    oversizedResultBody.code,
    "RECORDING_PLATFORM_INVALID_RESPONSE"
  );
  assert.doesNotMatch(
    JSON.stringify(oversizedResultBody),
    /sensitive-upstream-data|padding/
  );
});

test("upstream deterministic 4xx cleans new media while network and 5xx keep retry state", async (t) => {
  let mode = "4xx";
  const fixture = await createFixture(t, {
    fetchImpl: async () => {
      if (mode === "4xx") {
        return jsonResponse(422, {
          code: "REFERENCE_TYPE_NOT_ENABLED<script>\n" + "X".repeat(100),
          message: "internal path C:\\private\\data test-server-key",
          requestId: "safe-request-id<script>\n" + "Y".repeat(200),
          details: { secret: "must-not-forward" },
        });
      }
      if (mode === "in-progress") {
        return jsonResponse(409, {
          code: "OPERATION_IN_PROGRESS",
          message: "still processing",
          requestId: "retry-request-id",
        });
      }
      if (mode === "5xx") {
        return jsonResponse(503, {
          code: "UPSTREAM_INTERNAL",
          message: "internal path C:\\private\\data",
        });
      }
      throw new Error("network with secret test-server-key");
    },
  });
  const endpoint = `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`;

  async function createWithFreshUpload(sourceItemId) {
    const upload = await readJson(
      await uploadMedia(
        fixture.baseUrl,
        "video",
        "task-allowed",
        MP4_BYTES,
        "video/mp4"
      )
    );
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId,
        videoUploadId: upload.uploadId,
      }),
    });
  }

  const deterministic = await createWithFreshUpload("source-4xx");
  const deterministicBody = await readJson(deterministic);
  assert.equal(deterministic.status, 422);
  assert.match(deterministicBody.upstream.code, /^[A-Za-z0-9_.:-]{1,64}$/);
  assert.match(
    deterministicBody.upstream.requestId,
    /^[A-Za-z0-9_.:-]{1,128}$/
  );
  assert.equal(deterministicBody.upstream.message, "录音平台拒绝了请求。");
  assert.equal(deterministicBody.upstream.code.length <= 64, true);
  assert.equal(deterministicBody.upstream.requestId.length <= 128, true);
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    0
  );

  mode = "in-progress";
  const inProgress = await createWithFreshUpload("source-in-progress");
  assert.equal(inProgress.status, 409);
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    1
  );

  mode = "5xx";
  const serverError = await createWithFreshUpload("source-5xx");
  assert.equal(serverError.status, 503);
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    2
  );

  mode = "network";
  const networkError = await createWithFreshUpload("source-network");
  const networkBody = await readJson(networkError);
  assert.equal(networkError.status, 503);
  assert.doesNotMatch(
    JSON.stringify(networkBody),
    /test-server-key|C:\\private|Authorization|Cookie/
  );
  assert.equal(
    Object.keys(fixture.integration.getSnapshot().media).length,
    3
  );
});

test("startup reconciliation preserves failed deletions, removes orphans and timer expires uploads", async (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-recording-recovery-"));
  const configPath = path.join(rootDir, "config.json");
  const runtimeDir = path.join(rootDir, "runtime");
  const tempDir = path.join(runtimeDir, "temp");
  const mediaDir = path.join(runtimeDir, "media");
  const nowValue = Date.parse("2026-07-24T00:00:00Z");
  let currentTime = nowValue;
  writeConfig(configPath);
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, "expired-clean.wav"), WAV_BYTES);
  fs.writeFileSync(path.join(tempDir, "expired-stuck.wav"), WAV_BYTES);
  fs.writeFileSync(path.join(tempDir, "crashed.uploading"), WAV_BYTES);
  const staleStagingTime = new Date(nowValue - 10_000);
  fs.utimesSync(
    path.join(tempDir, "crashed.uploading"),
    staleStagingTime,
    staleStagingTime
  );
  fs.writeFileSync(path.join(tempDir, "orphan.mp4"), MP4_BYTES);
  fs.writeFileSync(path.join(mediaDir, "orphan-media.mp4"), MP4_BYTES);
  fs.writeFileSync(path.join(mediaDir, "failed-cleanup.mp4"), MP4_BYTES);
  fs.writeFileSync(path.join(runtimeDir, "state.json.crash.tmp"), "partial");
  fs.writeFileSync(
    path.join(runtimeDir, "state.json"),
    JSON.stringify({
      version: 1,
      uploads: {
        clean: {
          uploadId: "clean",
          taskId: "task-allowed",
          kind: "audio",
          relativePath: "temp/expired-clean.wav",
          expiresAt: nowValue - 1,
        },
        stuck: {
          uploadId: "stuck",
          taskId: "task-allowed",
          kind: "audio",
          relativePath: "temp/expired-stuck.wav",
          expiresAt: nowValue - 1,
        },
      },
      mappings: {},
      media: {
        "failed-cleanup": {
          mediaId: "failed-cleanup",
          taskId: "task-allowed",
          kind: "video",
          relativePath: "media/failed-cleanup.mp4",
          cleanupPending: true,
          linked: false,
        },
      },
    })
  );

  let failedMediaRemovalAttempts = 0;
  const integration = createRecordingIntegration({
    configPath,
    runtimeDir,
    now: () => currentTime,
    uploadTtlMs: 30,
    uploadReadTimeoutMs: 30,
    maintenanceIntervalMs: 10,
    stagingCleanupSafetyMarginMs: 10,
    removeFileSync(filePath) {
      if (filePath.endsWith("expired-stuck.wav")) {
        throw new Error("simulated remove failure");
      }
      if (filePath.endsWith("failed-cleanup.mp4")) {
        failedMediaRemovalAttempts += 1;
        throw new Error("simulated media remove failure");
      }
      fs.rmSync(filePath, { force: true });
    },
  });
  t.after(() => {
    integration.close?.();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  assert.equal(integration.getSnapshot().uploads.clean, undefined);
  assert.ok(integration.getSnapshot().uploads.stuck);
  assert.equal(fs.existsSync(path.join(tempDir, "expired-clean.wav")), false);
  assert.equal(fs.existsSync(path.join(tempDir, "expired-stuck.wav")), true);
  assert.equal(fs.existsSync(path.join(tempDir, "crashed.uploading")), false);
  assert.equal(fs.existsSync(path.join(tempDir, "orphan.mp4")), false);
  assert.equal(fs.existsSync(path.join(mediaDir, "orphan-media.mp4")), false);
  assert.equal(failedMediaRemovalAttempts > 0, true);
  assert.ok(integration.getSnapshot().media["failed-cleanup"]);
  assert.equal(
    fs.existsSync(path.join(runtimeDir, "state.json.crash.tmp")),
    false
  );

  const liveStream = createRawUploadStream("task-allowed", "audio/wav");
  const liveUploadPromise = integration.storeUpload(
    liveStream,
    "audio",
    "task-allowed"
  );
  liveStream.end(WAV_BYTES);
  const liveUpload = await liveUploadPromise;
  currentTime += 31;
  assert.equal(
    await waitFor(
      () => !integration.getSnapshot().uploads[liveUpload.uploadId],
      200
    ),
    true
  );
});

for (const stateMode of ["missing", "corrupt"]) {
  test(`runtime with ${stateMode} state fails closed and preserves long-lived media`, async (t) => {
    const marker = "PRIVATE_MEDIA_MARKER";
    let retainedMediaPath;
    let statePath;
    const fixture = await createFixture(t, {
      maintenanceIntervalMs: 5,
      prepareRuntime({ runtimeDir }) {
        const mediaDir = path.join(runtimeDir, "media");
        fs.mkdirSync(mediaDir, { recursive: true });
        retainedMediaPath = path.join(mediaDir, "retained-media.wav");
        statePath = path.join(runtimeDir, "state.json");
        fs.writeFileSync(retainedMediaPath, marker);
        if (stateMode === "corrupt") {
          fs.writeFileSync(statePath, "{\"version\":");
        }
      },
    });

    const createResponse = await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingTaskId: "task-allowed",
          sourceItemId: `source-state-${stateMode}`,
          referenceText: "参考",
        }),
      }
    );
    const publicResponse = await fetch(
      `${fixture.baseUrl}/api/public/recording-media/retained-media`
    );
    const createBody = await readJson(createResponse);
    const publicBody = await readJson(publicResponse);

    assert.equal(createResponse.status, 503);
    assert.equal(publicResponse.status, 503);
    assert.equal(createBody.code, "RECORDING_INTEGRATION_STATE_UNAVAILABLE");
    assert.equal(publicBody.code, "RECORDING_INTEGRATION_STATE_UNAVAILABLE");
    const responseText = JSON.stringify([createBody, publicBody]);
    assert.equal(responseText.includes(marker), false);
    assert.equal(responseText.includes(fixture.rootDir), false);
    assert.equal(responseText.includes("retained-media"), false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(fs.existsSync(retainedMediaPath), true);
    assert.equal(fs.readFileSync(retainedMediaPath, "utf8"), marker);
    assert.equal(
      stateMode === "corrupt"
        ? fs.readFileSync(statePath, "utf8")
        : fs.existsSync(statePath),
      stateMode === "corrupt" ? "{\"version\":" : false
    );
  });
}

test("sync token protects result lookup and signs a short-lived audio proxy", async (t) => {
  const fixture = await createFixture(t, { audioTokenTtlMs: 1000 });
  const createResponse = await fetch(
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId: "source-result",
        referenceText: "参考",
      }),
    }
  );
  const created = await readJson(createResponse);
  const resultEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`;

  const invalid = await fetch(resultEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncToken: "invalid-token" }),
  });
  assert.equal(invalid.status, 401);

  const result = await fetch(resultEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncToken: created.syncToken }),
  });
  const resultBody = await readJson(result);
  assert.equal(result.status, 200);
  assert.equal(resultBody.text, "完成文本");
  assert.equal(resultBody.audioAvailable, true);
  assert.match(
    resultBody.audioUrl,
    /^\/api\/bytedance-aidp\/taizhou-helper\/recording-items\/audio\/[A-Za-z0-9_.-]+$/
  );

  const proxy = await fetch(fixture.baseUrl + resultBody.audioUrl, {
    headers: { Range: "bytes=0-14" },
  });
  assert.equal(proxy.status, 206);
  assert.equal(await proxy.text(), "protected-audio");
  assert.equal(proxy.headers.get("content-range"), "bytes 0-14/15");
  const proxyCall = fixture.upstreamCalls.at(-1);
  assert.equal(proxyCall.options.headers["X-API-Key"], "test-server-key");
  assert.equal(proxyCall.options.headers.Range, "bytes=0-14");

  fixture.clock.value += 1001;
  const expired = await fetch(fixture.baseUrl + resultBody.audioUrl);
  assert.equal(expired.status, 401);
});

test("removing a task from the allowlist revokes old sync and audio tokens", async (t) => {
  const fixture = await createFixture(t);
  const created = await readJson(
    await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingTaskId: "task-allowed",
          sourceItemId: "source-revoked",
          referenceText: "参考",
        }),
      }
    )
  );
  const resultEndpoint =
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`;
  const initialResult = await readJson(
    await fetch(resultEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncToken: created.syncToken }),
    })
  );
  const audioTokenPayload = JSON.parse(
    Buffer.from(
      initialResult.audioUrl.split("/").at(-1).split(".")[0],
      "base64url"
    ).toString("utf8")
  );
  assert.equal(audioTokenPayload.taskId, "task-allowed");

  writeConfig(fixture.configPath, { allowedTaskIds: ["task-other"] });
  const revokedResult = await fetch(resultEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncToken: created.syncToken }),
  });
  const revokedAudio = await fetch(fixture.baseUrl + initialResult.audioUrl);

  assert.equal(revokedResult.status, 403);
  assert.equal(revokedAudio.status, 403);
});

test("audio proxy preserves 416 range headers", async (t) => {
  const fixture = await createFixture(t, {
    fetchImpl: async (url, requestOptions) => {
      if ((requestOptions?.method || "GET") === "POST") {
        return jsonResponse(201, {
          itemId: "recording-range-1",
          taskId: "task-allowed",
          itemCode: "T000001-0000088",
          status: "AVAILABLE",
          createdAt: "2026-07-24T01:00:00Z",
        });
      }
      if (String(url).endsWith("/audio")) {
        return new Response(null, {
          status: 416,
          headers: {
            "content-range": "bytes */15",
            "accept-ranges": "bytes",
          },
        });
      }
      return jsonResponse(200, {
        itemId: "recording-range-1",
        itemCode: "T000001-0000088",
        status: "COMPLETED",
        updatedAt: "2026-07-24T02:00:00Z",
        text: "完成",
        audioAvailable: true,
      });
    },
  });
  const created = await readJson(
    await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingTaskId: "task-allowed",
          sourceItemId: "source-range",
          referenceText: "参考",
        }),
      }
    )
  );
  const result = await readJson(
    await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncToken: created.syncToken }),
      }
    )
  );
  const response = await fetch(fixture.baseUrl + result.audioUrl, {
    headers: { Range: "bytes=99-100" },
  });

  assert.equal(response.status, 416);
  assert.equal(response.headers.get("content-range"), "bytes */15");
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});

test("audio proxy aborts a hanging body on timeout and client close", async (t) => {
  let audioSignal = null;
  const fixture = await createFixture(t, {
    upstreamTimeoutMs: 30,
    fetchImpl: async (url, requestOptions) => {
      if ((requestOptions?.method || "GET") === "POST") {
        return jsonResponse(201, {
          itemId: "recording-hanging-1",
          taskId: "task-allowed",
          itemCode: "T000001-0000077",
          status: "AVAILABLE",
          createdAt: "2026-07-24T01:00:00Z",
        });
      }
      if (String(url).endsWith("/audio")) {
        audioSignal = requestOptions.signal;
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(Buffer.from("x"));
            },
          }),
          {
            status: 200,
            headers: { "content-type": "audio/wav" },
          }
        );
      }
      return jsonResponse(200, {
        itemId: "recording-hanging-1",
        itemCode: "T000001-0000077",
        status: "COMPLETED",
        updatedAt: "2026-07-24T02:00:00Z",
        text: "完成",
        audioAvailable: true,
      });
    },
  });
  const created = await readJson(
    await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingTaskId: "task-allowed",
          sourceItemId: "source-hanging",
          referenceText: "参考",
        }),
      }
    )
  );
  const result = await readJson(
    await fetch(
      `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items/result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncToken: created.syncToken }),
      }
    )
  );

  const controller = new AbortController();
  const proxyResponse = await fetch(fixture.baseUrl + result.audioUrl, {
    signal: controller.signal,
  });
  const bodyResult = await Promise.race([
    proxyResponse.arrayBuffer().then(
      () => "completed",
      () => "aborted"
    ),
    new Promise((resolve) => setTimeout(() => resolve("timed-out"), 200)),
  ]);
  controller.abort();

  assert.equal(bodyResult, "aborted");
  assert.equal(audioSignal?.aborted, true);

  audioSignal = null;
  await new Promise((resolve, reject) => {
    const request = http.get(fixture.baseUrl + result.audioUrl, (response) => {
      response.once("data", () => {
        response.destroy();
        resolve();
      });
    });
    request.on("error", (error) => {
      if (error.code === "ECONNRESET") {
        resolve();
      } else {
        reject(error);
      }
    });
  });
  assert.equal(await waitFor(() => audioSignal?.aborted === true, 100), true);
});

test("public bound media supports GET, HEAD and one Range without exposing paths or listing", async (t) => {
  const fixture = await createFixture(t);
  const uploaded = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "video",
      "task-allowed",
      MP4_BYTES,
      "video/mp4"
    )
  );
  await fetch(
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId: "source-public",
        videoUploadId: uploaded.uploadId,
      }),
    }
  );
  const mediaId = Object.keys(fixture.integration.getSnapshot().media)[0];
  const publicUrl = `${fixture.baseUrl}/api/public/recording-media/${mediaId}`;

  const full = await fetch(publicUrl);
  assert.equal(full.status, 200);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), MP4_BYTES);
  assert.equal(full.headers.get("accept-ranges"), "bytes");

  const head = await fetch(publicUrl, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(Number(head.headers.get("content-length")), MP4_BYTES.length);

  const ranged = await fetch(publicUrl, {
    headers: { Range: "bytes=4-11" },
  });
  assert.equal(ranged.status, 206);
  assert.deepEqual(
    Buffer.from(await ranged.arrayBuffer()),
    MP4_BYTES.subarray(4, 12)
  );
  assert.equal(
    ranged.headers.get("content-range"),
    `bytes 4-11/${MP4_BYTES.length}`
  );

  const multiple = await fetch(publicUrl, {
    headers: { Range: "bytes=0-1,4-5" },
  });
  assert.equal(multiple.status, 416);
  assert.equal(multiple.headers.get("access-control-allow-origin"), "*");

  const listing = await fetch(
    `${fixture.baseUrl}/api/public/recording-media`
  );
  assert.equal(listing.status, 404);
  assert.doesNotMatch(await listing.text(), /runtime|mediaId|[A-Z]:\\/);

  const guessed = await fetch(
    `${fixture.baseUrl}/api/public/recording-media/not-an-existing-id`
  );
  assert.equal(guessed.status, 404);
});

test("public media handles synchronous and streamed read failures safely", async (t) => {
  let readMode = "throw";
  const fixture = await createFixture(t, {
    createReadStream(filePath, options) {
      if (readMode === "throw") {
        throw new Error("simulated open failure");
      }
      const stream = new PassThrough();
      setImmediate(() => stream.destroy(new Error("simulated stream failure")));
      return stream;
    },
  });
  const uploaded = await readJson(
    await uploadMedia(
      fixture.baseUrl,
      "video",
      "task-allowed",
      MP4_BYTES,
      "video/mp4"
    )
  );
  await fetch(
    `${fixture.baseUrl}/api/bytedance-aidp/taizhou-helper/recording-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingTaskId: "task-allowed",
        sourceItemId: "source-public-read-error",
        videoUploadId: uploaded.uploadId,
      }),
    }
  );
  const mediaId = Object.keys(fixture.integration.getSnapshot().media)[0];
  const publicUrl = `${fixture.baseUrl}/api/public/recording-media/${mediaId}`;

  const openFailure = await fetch(publicUrl);
  const openFailureBody = await readJson(openFailure);
  assert.equal(openFailure.status, 500);
  assert.equal(openFailureBody.code, "PUBLIC_MEDIA_READ_FAILED");
  assert.equal(openFailure.headers.get("access-control-allow-origin"), "*");
  assert.doesNotMatch(
    JSON.stringify(openFailureBody),
    /simulated|runtime|[A-Z]:\\/
  );

  readMode = "stream-error";
  await assert.rejects(
    fetch(publicUrl).then((response) => response.arrayBuffer()),
    /terminated|fetch failed|socket/i
  );
});
