"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const {
  KEY_SLOT_IDS,
  createDashscopeKeySlotStore,
  getDashscopeCredentialAuthFailureMessage,
} = require(resolveRepo("platform-resources", "backend", "dashscope-key-slots.js"));
const { createRouter } = require(resolveRepo("platform-resources", "backend", "router.js"));
const {
  registerAdminAiKeySlotRoutes,
} = require(resolveRepo("platform-resources", "backend", "admin-ai-key-slots", "routes.js"));
const {
  createAdminSessionToken,
  createPasswordSha256,
} = require(resolveRepo("platform-resources", "backend", "admin-auth.js"));
const {
  clearRuntimeLogsForTest,
  configureRuntimeLogStoreForTest,
  listRuntimeLogs,
} = require(resolveRepo("platform-resources", "backend", "runtime-log-store.js"));

function createSecretsFixture(t, files = {}, options = {}) {
  const secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-dashscope-key-slots-"));
  t.after(() => fs.rmSync(secretsDir, { recursive: true, force: true }));
  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(secretsDir, fileName), content, "utf8");
  }
  return {
    secretsDir,
    store: createDashscopeKeySlotStore({ secretsDir, ...options }),
  };
}

function startRouter(t, router) {
  const server = http.createServer((request, response) => router.handle(request, response));
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      t.after(() => server.close());
      resolve("http://127.0.0.1:" + address.port);
    });
  });
}

function configureRuntimeLogsFixture(t) {
  const runtimeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-dashscope-key-slot-logs-"));
  configureRuntimeLogStoreForTest({ runtimeDataDir });
  t.after(() => {
    clearRuntimeLogsForTest();
    fs.rmSync(runtimeDataDir, { recursive: true, force: true });
  });
}

function withAdminAuth(t) {
  const previousPassword = process.env.ASC_ADMIN_PASSWORD_SHA256;
  const previousSecret = process.env.ASC_ADMIN_JWT_SECRET;
  const password = "test-admin-password";
  const jwtSecret = "test-admin-jwt-secret";
  process.env.ASC_ADMIN_PASSWORD_SHA256 = createPasswordSha256(password);
  process.env.ASC_ADMIN_JWT_SECRET = jwtSecret;
  t.after(() => {
    if (previousPassword === undefined) delete process.env.ASC_ADMIN_PASSWORD_SHA256;
    else process.env.ASC_ADMIN_PASSWORD_SHA256 = previousPassword;
    if (previousSecret === undefined) delete process.env.ASC_ADMIN_JWT_SECRET;
    else process.env.ASC_ADMIN_JWT_SECRET = previousSecret;
  });
  return createAdminSessionToken(
    { operatorName: "测试管理员" },
    { jwtSecret }
  ).token;
}

test("dashscope key slots default to key-1 and never expose a configured key", (t) => {
  const { store } = createSecretsFixture(t, {
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=test-key-one\n",
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=test-key-two\n",
  });

  const summary = store.getSummary();

  assert.deepEqual(KEY_SLOT_IDS, ["key-1", "key-2"]);
  assert.equal(summary.activeSlotId, "key-1");
  assert.deepEqual(summary.slots, [
    { id: "key-1", label: "密钥一", configured: true, active: true },
    { id: "key-2", label: "密钥二", configured: true, active: false },
  ]);
  assert.equal(summary.activeKeySource, "slot");
  assert.equal(JSON.stringify(summary).includes("test-key-one"), false);
  assert.equal(store.getActiveKey().apiKey, "test-key-one");
});

test("dashscope key slots fall back to the legacy key only when no slot is configured", (t) => {
  const { store } = createSecretsFixture(t, {}, { legacyApiKey: "legacy-test-key" });
  const resolution = store.getActiveKeyResolution();

  assert.deepEqual(resolution, {
    activeSlotId: "key-1",
    apiKey: "legacy-test-key",
    source: "legacy",
  });
  assert.deepEqual(store.getSummary(), {
    activeKeySource: "legacy",
    activeSlotId: "key-1",
    slots: [
      { id: "key-1", label: "密钥一", configured: false, active: true },
      { id: "key-2", label: "密钥二", configured: false, active: false },
    ],
  });
});

test("dashscope key slots prefer the selected slot and never fall back after slot migration begins", (t) => {
  const { store } = createSecretsFixture(t, {
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=test-key-two\n",
  }, { legacyApiKey: "legacy-test-key" });

  assert.deepEqual(store.getActiveKeyResolution(), {
    activeSlotId: "key-1",
    apiKey: "",
    source: "none",
  });
  assert.throws(
    () => store.getActiveKey(),
    (error) => error && error.code === "dashscope-key-slot-not-configured"
  );
});

test("dashscope credential failures name only the active source", () => {
  assert.equal(
    getDashscopeCredentialAuthFailureMessage({ activeSlotId: "key-2", apiKeySource: "slot" }),
    "当前密钥二鉴权失败，请在系统管理中检查对应密钥。"
  );
  assert.equal(
    getDashscopeCredentialAuthFailureMessage({ activeSlotId: "key-1", apiKeySource: "legacy" }),
    "当前旧密钥兼容配置鉴权失败，请迁移或检查旧配置。"
  );
  assert.equal(
    getDashscopeCredentialAuthFailureMessage({ activeSlotId: "key-1", apiKeySource: "none" }),
    "当前 AI 密钥未配置，请在系统管理中配置密钥一或密钥二。"
  );
});

test("dashscope key slot switch persists key-2 atomically", (t) => {
  const { secretsDir, store } = createSecretsFixture(t, {
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=test-key-one\n",
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=test-key-two\n",
  });

  const result = store.setActiveSlot("key-2");
  const persisted = JSON.parse(
    fs.readFileSync(path.join(secretsDir, "dashscope-active-key.json"), "utf8")
  );

  assert.equal(result.activeSlotId, "key-2");
  assert.deepEqual(persisted, { activeSlotId: "key-2" });
  assert.equal(store.getActiveKey().apiKey, "test-key-two");
  const reverted = store.setActiveSlot("key-1");
  assert.equal(reverted.activeSlotId, "key-1");
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(secretsDir, "dashscope-active-key.json"), "utf8")),
    { activeSlotId: "key-1" }
  );
  assert.deepEqual(
    fs.readdirSync(secretsDir).filter((fileName) => fileName.includes(".tmp-")),
    []
  );
});

test("dashscope key slots reject invalid state, unknown slots, and unconfigured targets", (t) => {
  const { secretsDir, store } = createSecretsFixture(t, {
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=test-key-one\n",
    "dashscope-key-2.env": "# intentionally empty\n",
  });

  assert.throws(
    () => store.setActiveSlot("key-3"),
    (error) => error && error.code === "dashscope-key-slot-invalid"
  );
  assert.throws(
    () => store.setActiveSlot("key-2"),
    (error) => error && error.code === "dashscope-key-slot-not-configured"
  );

  fs.writeFileSync(
    path.join(secretsDir, "dashscope-active-key.json"),
    "{\"activeSlotId\":\"key-3\"}",
    "utf8"
  );
  assert.throws(
    () => store.getSummary(),
    (error) => error && error.code === "dashscope-key-slot-state-invalid"
  );

  fs.writeFileSync(path.join(secretsDir, "dashscope-active-key.json"), "{invalid-json", "utf8");
  assert.throws(
    () => store.getSummary(),
    (error) => error && error.code === "dashscope-key-slot-state-invalid"
  );
});

test("all DashScope provider configs read the active slot for each new call", (t) => {
  const keySlotsPath = resolveRepo("platform-resources", "backend", "dashscope-key-slots.js");
  const aiConfigPath = resolveRepo("platform-resources", "backend", "ai", "config.js");
  const hangzhouClientPath = resolveRepo(
    "platform-resources",
    "magic-data",
    "hangzhou-helper",
    "backend",
    "ai-client-qwen.js"
  );
  const keySlotsModule = require(keySlotsPath);
  const originalResolver = keySlotsModule.getActiveDashscopeApiKey;
  const originalResolutionResolver = keySlotsModule.getActiveDashscopeKeyResolution;
  const originalAiConfigModule = require.cache[aiConfigPath];
  const originalHangzhouClientModule = require.cache[hangzhouClientPath];
  let activeResolution = {
    activeSlotId: "key-1",
    apiKey: "test-slot-key-one",
    source: "slot",
  };

  keySlotsModule.getActiveDashscopeApiKey = () => activeResolution.apiKey;
  keySlotsModule.getActiveDashscopeKeyResolution = () => activeResolution;
  delete require.cache[aiConfigPath];
  delete require.cache[hangzhouClientPath];
  t.after(() => {
    keySlotsModule.getActiveDashscopeApiKey = originalResolver;
    keySlotsModule.getActiveDashscopeKeyResolution = originalResolutionResolver;
    delete require.cache[aiConfigPath];
    delete require.cache[hangzhouClientPath];
    if (originalAiConfigModule) {
      require.cache[aiConfigPath] = originalAiConfigModule;
    }
    if (originalHangzhouClientModule) {
      require.cache[hangzhouClientPath] = originalHangzhouClientModule;
    }
  });

  const aiConfig = require(aiConfigPath);
  const hangzhouClient = require(hangzhouClientPath);
  const readProviderResolutions = () => [
    aiConfig.getQwenProviderConfig(),
    aiConfig.getQwenPythonConfig(),
    aiConfig.getFunAsrRestConfig(),
    aiConfig.getFunAsrPythonConfig(),
    hangzhouClient.getClientConfig(),
  ].map((config) => ({
    activeSlotId: config.activeSlotId,
    apiKey: config.apiKey,
    apiKeySource: config.apiKeySource,
  }));

  assert.deepEqual(readProviderResolutions(), Array(5).fill({
    activeSlotId: "key-1",
    apiKey: "test-slot-key-one",
    apiKeySource: "slot",
  }));
  activeResolution = {
    activeSlotId: "key-2",
    apiKey: "test-slot-key-two",
    source: "slot",
  };
  assert.deepEqual(readProviderResolutions(), Array(5).fill({
    activeSlotId: "key-2",
    apiKey: "test-slot-key-two",
    apiKeySource: "slot",
  }));
  activeResolution = {
    activeSlotId: "key-1",
    apiKey: "legacy-test-key",
    source: "legacy",
  };
  assert.deepEqual(readProviderResolutions(), Array(5).fill({
    activeSlotId: "key-1",
    apiKey: "legacy-test-key",
    apiKeySource: "legacy",
  }));
});

test("all five language Qwen paths keep the selected key after a 401", async (t) => {
  const aiConfigPath = resolveRepo("platform-resources", "backend", "ai", "config.js");
  const keySlotsPath = resolveRepo("platform-resources", "backend", "dashscope-key-slots.js");
  const sharedQwenPath = resolveRepo(
    "platform-resources",
    "backend",
    "ai",
    "providers",
    "qwen-openai-compatible.js"
  );
  const hangzhouClientPath = resolveRepo(
    "platform-resources",
    "magic-data",
    "hangzhou-helper",
    "backend",
    "ai-client-qwen.js"
  );
  const aiConfig = require(aiConfigPath);
  const keySlots = require(keySlotsPath);
  const originalSharedConfig = aiConfig.getQwenProviderConfig;
  const originalResolution = keySlots.getActiveDashscopeKeyResolution;
  const originalSharedQwen = require.cache[sharedQwenPath];
  const originalHangzhouClient = require.cache[hangzhouClientPath];
  const originalFetch = global.fetch;
  let requestCount = 0;
  const authorizationHeaders = [];
  const selectedResolution = {
    activeSlotId: "key-2",
    apiKey: "test-key-two",
    source: "slot",
  };

  aiConfig.getQwenProviderConfig = () => ({
    apiKey: selectedResolution.apiKey,
    activeSlotId: selectedResolution.activeSlotId,
    apiKeySource: selectedResolution.source,
    baseUrl: "https://dashscope.example.test/v1",
    timeoutMs: 60000,
    mockEnabled: false,
    omniModel: "qwen3.5-omni-flash",
    compareModel: "qwen3.5-flash",
  });
  keySlots.getActiveDashscopeKeyResolution = () => selectedResolution;
  global.fetch = async (_url, options) => {
    requestCount += 1;
    authorizationHeaders.push(options?.headers?.Authorization || "");
    return {
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Invalid API key provided"}}',
    };
  };
  delete require.cache[sharedQwenPath];
  delete require.cache[hangzhouClientPath];
  t.after(() => {
    aiConfig.getQwenProviderConfig = originalSharedConfig;
    keySlots.getActiveDashscopeKeyResolution = originalResolution;
    global.fetch = originalFetch;
    delete require.cache[sharedQwenPath];
    delete require.cache[hangzhouClientPath];
    if (originalSharedQwen) require.cache[sharedQwenPath] = originalSharedQwen;
    if (originalHangzhouClient) require.cache[hangzhouClientPath] = originalHangzhouClient;
  });

  const sharedQwen = require(sharedQwenPath);
  const hangzhouClient = require(hangzhouClientPath);
  const assertCredentialFailure = (error) =>
    error &&
    error.code === "dashscope-key-auth-failed" &&
    error.message === "当前密钥二鉴权失败，请在系统管理中检查对应密钥。";

  await assert.rejects(
    sharedQwen.requestChatCompletion({ model: "qwen3.5-flash", messages: [] }),
    assertCredentialFailure
  );
  await assert.rejects(
    hangzhouClient.requestCompare(
      { pageText: "页面文本", heardText: "听音文本" },
      { systemPrompt: "", userPrompt: "" },
      {}
    ),
    assertCredentialFailure
  );
  assert.equal(requestCount, 2);
  assert.deepEqual(authorizationHeaders, ["Bearer test-key-two", "Bearer test-key-two"]);
});

test("an unconfigured selected slot returns a safe 503 without sending a Qwen request", async (t) => {
  const aiConfigPath = resolveRepo("platform-resources", "backend", "ai", "config.js");
  const keySlotsPath = resolveRepo("platform-resources", "backend", "dashscope-key-slots.js");
  const sharedQwenPath = resolveRepo(
    "platform-resources",
    "backend",
    "ai",
    "providers",
    "qwen-openai-compatible.js"
  );
  const hangzhouClientPath = resolveRepo(
    "platform-resources",
    "magic-data",
    "hangzhou-helper",
    "backend",
    "ai-client-qwen.js"
  );
  const keySlots = require(keySlotsPath);
  const originalResolution = keySlots.getActiveDashscopeKeyResolution;
  const originalAiConfigModule = require.cache[aiConfigPath];
  const originalSharedQwen = require.cache[sharedQwenPath];
  const originalHangzhouClient = require.cache[hangzhouClientPath];
  const originalFetch = global.fetch;
  let requestCount = 0;

  keySlots.getActiveDashscopeKeyResolution = () => ({
    activeSlotId: "key-1",
    apiKey: "",
    source: "none",
  });
  global.fetch = async () => {
    requestCount += 1;
    throw new Error("AI 密钥未配置时不应发送 HTTP 请求");
  };
  delete require.cache[aiConfigPath];
  delete require.cache[sharedQwenPath];
  delete require.cache[hangzhouClientPath];
  t.after(() => {
    keySlots.getActiveDashscopeKeyResolution = originalResolution;
    global.fetch = originalFetch;
    delete require.cache[aiConfigPath];
    delete require.cache[sharedQwenPath];
    delete require.cache[hangzhouClientPath];
    if (originalAiConfigModule) require.cache[aiConfigPath] = originalAiConfigModule;
    if (originalSharedQwen) require.cache[sharedQwenPath] = originalSharedQwen;
    if (originalHangzhouClient) require.cache[hangzhouClientPath] = originalHangzhouClient;
  });

  const sharedQwen = require(sharedQwenPath);
  const hangzhouClient = require(hangzhouClientPath);
  const assertSafeMissingCredential = (error) =>
    error &&
    error.statusCode === 503 &&
    error.message === "当前 AI 密钥未配置，请在系统管理中配置密钥一或密钥二。";

  await assert.rejects(
    sharedQwen.requestChatCompletion({ model: "qwen3.5-flash", messages: [] }),
    assertSafeMissingCredential
  );
  await assert.rejects(
    hangzhouClient.requestCompare(
      { pageText: "页面文本", heardText: "听音文本" },
      { systemPrompt: "", userPrompt: "" },
      {}
    ),
    assertSafeMissingCredential
  );
  assert.equal(requestCount, 0);
});

test("admin AI key slot routes require an admin session and return only safe status", async (t) => {
  const { store } = createSecretsFixture(t, {
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=test-key-one\n",
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=test-key-two\n",
  });
  configureRuntimeLogsFixture(t);
  const token = withAdminAuth(t);
  const router = createRouter();
  registerAdminAiKeySlotRoutes(router, { store });
  const baseUrl = await startRouter(t, router);

  const anonymous = await fetch(baseUrl + "/api/admin/ai-key-slots");
  assert.equal(anonymous.status, 401);

  const before = await fetch(baseUrl + "/api/admin/ai-key-slots", {
    headers: { Authorization: "Bearer " + token },
  });
  const beforeBody = await before.json();
  assert.equal(before.status, 200);
  assert.equal(beforeBody.success, true);
  assert.equal(beforeBody.data.activeSlotId, "key-1");
  assert.equal(beforeBody.data.activeKeySource, "slot");
  assert.equal(JSON.stringify(beforeBody).includes("test-key-one"), false);

  const switched = await fetch(baseUrl + "/api/admin/ai-key-slots/active", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slotId: "key-2" }),
  });
  const switchedBody = await switched.json();
  assert.equal(switched.status, 200);
  assert.equal(switchedBody.data.activeSlotId, "key-2");
  assert.equal(switchedBody.data.activeKeySource, "slot");
  assert.equal(JSON.stringify(switchedBody).includes("test-key-two"), false);
  const runtimeLogs = listRuntimeLogs({ limit: 10 });
  assert.equal(JSON.stringify(runtimeLogs).includes("test-key-one"), false);
  assert.equal(JSON.stringify(runtimeLogs).includes("test-key-two"), false);
  assert.equal(runtimeLogs.some((entry) => entry.action === "switch"), true);
});
