"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const credentialPath = resolveRepo("platform-resources", "backend", "dashscope-credential.js");

function createSecretsDir(t, files) {
  const secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-dashscope-credential-"));
  t.after(() => fs.rmSync(secretsDir, { recursive: true, force: true }));
  Object.entries(files || {}).forEach(([fileName, content]) => {
    fs.writeFileSync(path.join(secretsDir, fileName), content, "utf8");
  });
  return secretsDir;
}

test("DashScope credential reads only dashscope-key.env", (t) => {
  const previous = process.env.DASHSCOPE_API_KEY;
  process.env.DASHSCOPE_API_KEY = "environment-key-must-be-ignored";
  t.after(() => {
    if (previous === undefined) delete process.env.DASHSCOPE_API_KEY;
    else process.env.DASHSCOPE_API_KEY = previous;
  });
  const secretsDir = createSecretsDir(t, {
    "dashscope-key.env": "DASHSCOPE_API_KEY=single-test-key\n",
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=old-key-one\n",
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=old-key-two\n",
    "dashscope-active-key.json": "{\"activeSlotId\":\"key-2\"}\n",
  });
  const { createDashscopeCredentialStore } = require(credentialPath);
  const store = createDashscopeCredentialStore({ secretsDir });

  assert.deepEqual(store.getResolution(), {
    apiKey: "single-test-key",
    source: "file",
  });
  assert.equal(store.getApiKey(), "single-test-key");
});

test("missing or empty single credential fails safely without using legacy sources", (t) => {
  const previous = process.env.DASHSCOPE_API_KEY;
  process.env.DASHSCOPE_API_KEY = "environment-key-must-be-ignored";
  t.after(() => {
    if (previous === undefined) delete process.env.DASHSCOPE_API_KEY;
    else process.env.DASHSCOPE_API_KEY = previous;
  });
  const secretsDir = createSecretsDir(t, {
    "dashscope-key.env": "# intentionally empty\n",
    "dashscope-key-1.env": "DASHSCOPE_API_KEY=old-key-one\n",
    "dashscope-key-2.env": "DASHSCOPE_API_KEY=old-key-two\n",
  });
  const { createDashscopeCredentialStore } = require(credentialPath);
  const store = createDashscopeCredentialStore({ secretsDir });

  assert.deepEqual(store.getResolution(), { apiKey: "", source: "none" });
  assert.throws(
    () => store.getApiKey(),
    (error) =>
      error?.code === "dashscope-key-not-configured" &&
      error?.statusCode === 503 &&
      !String(error?.message || "").includes(secretsDir) &&
      !String(error?.message || "").includes("old-key")
  );
});

test("malformed single credential fails safely", (t) => {
  const secretsDir = createSecretsDir(t, {
    "dashscope-key.env": "DASHSCOPE_API_KEY\n",
  });
  const { createDashscopeCredentialStore } = require(credentialPath);
  const store = createDashscopeCredentialStore({ secretsDir });

  assert.deepEqual(store.getResolution(), { apiKey: "", source: "none" });
  assert.throws(
    () => store.getApiKey(),
    (error) => error?.code === "dashscope-key-not-configured" && error?.statusCode === 503
  );
});

test("all provider configs resolve the same single DashScope credential", (t) => {
  const credentialModule = require(credentialPath);
  const originalResolver = credentialModule.getDashscopeCredentialResolution;
  credentialModule.getDashscopeCredentialResolution = () => ({
    apiKey: "shared-single-key",
    source: "file",
  });
  const aiConfigPath = resolveRepo("platform-resources", "backend", "ai", "config.js");
  const hangzhouPath = resolveRepo(
    "platform-resources", "magic-data", "hangzhou-helper", "backend", "ai-client-qwen.js"
  );
  const originalAiConfig = require.cache[aiConfigPath];
  const originalHangzhou = require.cache[hangzhouPath];
  delete require.cache[aiConfigPath];
  delete require.cache[hangzhouPath];
  t.after(() => {
    credentialModule.getDashscopeCredentialResolution = originalResolver;
    delete require.cache[aiConfigPath];
    delete require.cache[hangzhouPath];
    if (originalAiConfig) require.cache[aiConfigPath] = originalAiConfig;
    if (originalHangzhou) require.cache[hangzhouPath] = originalHangzhou;
  });

  const aiConfig = require(aiConfigPath);
  const hangzhouClient = require(hangzhouPath);
  const configs = [
    aiConfig.getQwenProviderConfig(),
    aiConfig.getQwenPythonConfig(),
    aiConfig.getFunAsrRestConfig(),
    aiConfig.getFunAsrPythonConfig(),
    hangzhouClient.getClientConfig(),
  ];
  configs.forEach((config) => {
    assert.equal(config.apiKey, "shared-single-key");
    assert.equal(config.apiKeySource, "file");
    assert.equal(Object.hasOwn(config, "activeSlotId"), false);
  });
});

test("platform backend no longer exposes dual-key administration routes", async (t) => {
  const { createPlatformResourcesServer } = require(resolveRepo(
    "platform-resources", "backend", "app.js"
  ));
  const server = createPlatformResourcesServer();
  const baseUrl = await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve("http://127.0.0.1:" + server.address().port);
    });
  });
  t.after(() => server.close());

  const statusResponse = await fetch(baseUrl + "/api/admin/ai-key-slots");
  const switchResponse = await fetch(baseUrl + "/api/admin/ai-key-slots/active", {
    method: "POST",
  });
  const root = await (await fetch(baseUrl + "/")).json();

  assert.equal(statusResponse.status, 404);
  assert.equal(switchResponse.status, 404);
  assert.equal(root.projects.includes("admin/ai-key-slots"), false);
});
