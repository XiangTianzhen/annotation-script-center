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

function createSecretsFixture(t, files = {}) {
  const secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-dashscope-key-slots-"));
  t.after(() => fs.rmSync(secretsDir, { recursive: true, force: true }));
  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(secretsDir, fileName), content, "utf8");
  }
  return {
    secretsDir,
    store: createDashscopeKeySlotStore({ secretsDir }),
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
  assert.equal(JSON.stringify(summary).includes("test-key-one"), false);
  assert.equal(store.getActiveKey().apiKey, "test-key-one");
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
  const originalAiConfigModule = require.cache[aiConfigPath];
  const originalHangzhouClientModule = require.cache[hangzhouClientPath];
  let activeKey = "test-slot-key-one";

  keySlotsModule.getActiveDashscopeApiKey = () => activeKey;
  delete require.cache[aiConfigPath];
  delete require.cache[hangzhouClientPath];
  t.after(() => {
    keySlotsModule.getActiveDashscopeApiKey = originalResolver;
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
  const readProviderKeys = () => [
    aiConfig.getQwenProviderConfig().apiKey,
    aiConfig.getQwenPythonConfig().apiKey,
    aiConfig.getFunAsrRestConfig().apiKey,
    aiConfig.getFunAsrPythonConfig().apiKey,
    hangzhouClient.getClientConfig().apiKey,
  ];

  assert.deepEqual(readProviderKeys(), Array(5).fill("test-slot-key-one"));
  activeKey = "test-slot-key-two";
  assert.deepEqual(readProviderKeys(), Array(5).fill("test-slot-key-two"));
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
  assert.equal(JSON.stringify(switchedBody).includes("test-key-two"), false);
  const runtimeLogs = listRuntimeLogs({ limit: 10 });
  assert.equal(JSON.stringify(runtimeLogs).includes("test-key-one"), false);
  assert.equal(JSON.stringify(runtimeLogs).includes("test-key-two"), false);
  assert.equal(runtimeLogs.some((entry) => entry.action === "switch"), true);
});
