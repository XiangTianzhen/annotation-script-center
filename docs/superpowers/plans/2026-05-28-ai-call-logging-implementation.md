# AI Call Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有 AI 调用补齐统一的默认消耗日志，按脚本目录按天写 CSV，前端强制携带 `AI 调用使用人`、平台用户名和平台用户 ID。

**Architecture:** 前端先补一个共享 `ai-usage-meta` 助手，统一校验 `settings.meta.aiUsageOperatorName`，并把 `aiUsageOperatorName/platformUserName/platformUserId` 注入每次 AI 请求。后端新增 `platform-resources/backend/ai-call-log/` 共享核心，并在 `ai-framework` 路由层补统一校验和默认日志钩子；DataBaker 与 Aishell 的非标准链路单独复用同一核心。所有脚本只追加自己的扩展列，不再复用 DataBaker 旧的大宽表。

**Tech Stack:** Chrome MV3 extension（原生 JS）、Node.js、`node:test`、`platform-resources/backend/ai-framework/`、按脚本目录落盘 CSV。

---

## File Structure

### Shared Frontend

- Create: `extension/shared/ai-usage-meta.js`
- Create: `extension/shared/ai-usage-meta.test.js`
- Modify: `extension/manifest.json`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.js`
- Modify: `extension/shared/constants.js`
- Modify: `extension/shared/storage.js`

### Shared Backend

- Create: `platform-resources/backend/ai-call-log/schema.js`
- Create: `platform-resources/backend/ai-call-log/sanitizer.js`
- Create: `platform-resources/backend/ai-call-log/csv-writer.js`
- Create: `platform-resources/backend/ai-call-log/index.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/schema.test.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/sanitizer.test.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/csv-writer.test.js`
- Modify: `platform-resources/backend/ai-framework/contracts/normalized-request.js`
- Modify: `platform-resources/backend/ai-framework/core/create-ai-route.js`
- Modify: `platform-resources/backend/ai-framework/__tests__/ai-framework.test.js`

### Script Backends

- Modify: `platform-resources/data-baker/round-one-quality/ai/adapter.js`
- Modify: `platform-resources/data-baker/round-one-quality/ai/adapter.test.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/README.md`
- Modify: `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- Modify: `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
- Modify: `platform-resources/magic-data/hakka-helper/ai/adapter.js`
- Modify: `platform-resources/magic-data/hakka-helper/ai/adapter.test.js`
- Modify: `platform-resources/magic-data/minnan-helper/ai/adapter.js`
- Modify: `platform-resources/magic-data/minnan-helper/ai/adapter.test.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js`
- Modify: `platform-resources/abaka-ai/task21/ai/adapter.js`
- Modify: `platform-resources/abaka-ai/task21/ai/adapter.test.js`

### Script Frontends

- Modify: `extension/sites/data-baker/round-one-quality/ai-recommendation.js`
- Modify: `extension/sites/data-baker/round-one-quality/content.js`
- Modify: `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`
- Modify: `extension/sites/aishell-tech/minnan-helper/content.js`
- Modify: `extension/sites/magic-data/shared/ai-review-client.js`
- Modify: `extension/sites/magic-data/hakka-helper/content.js`
- Modify: `extension/sites/magic-data/minnan-helper/content.js`
- Modify: `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js`
- Modify: `extension/sites/alibaba-labelx/asr-transcription/content.js`
- Modify: `extension/sites/alibaba-labelx/asr-judgement/judgement-ai-suggestion.js`
- Modify: `extension/sites/alibaba-labelx/asr-judgement/content.js`
- Modify: `extension/sites/abaka-ai/task-page/ai-client.js`
- Modify: `extension/sites/abaka-ai/task-page/content.js`

### Documentation

- Modify: `platform-resources/backend/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/backend/README.md`
- Modify: `platform-resources/magic-data/hakka-helper/README.md`
- Modify: `platform-resources/magic-data/minnan-helper/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/README.md`
- Modify: `platform-resources/abaka-ai/task21/README.md`
- Modify: `platform-resources/aishell-tech/minnan-helper/README.md`
- Modify: `platform-resources/README.md`
- Modify: `docs/README.md`
- Modify: `docs/platforms/index.md`
- Modify: `log.md`

### Data Contract To Freeze

- Frontend request meta:

```json
{
  "aiUsageOperatorName": "张三",
  "platformUserName": "平台昵称",
  "platformUserId": "platform-user-123"
}
```

- Shared CSV common columns:

```js
[
  "createdAt",
  "requestId",
  "platformId",
  "scriptId",
  "success",
  "errorCode",
  "errorMessage",
  "durationMs",
  "promptTokens",
  "completionTokens",
  "totalTokens",
  "aiUsageOperatorName",
  "platformUserName",
  "platformUserId",
  "rawResponseJson",
  "rawErrorJson",
]
```

---

### Task 1: Shared Frontend AI Usage Meta Helper

**Files:**
- Create: `extension/shared/ai-usage-meta.js`
- Create: `extension/shared/ai-usage-meta.test.js`

- [ ] **Step 1: Write the failing test**

```js
"use strict";

const test = require("node:test");
const assert = require("assert");
const {
  normalizeAiUsageOperatorName,
  buildAiUsageRequestMeta,
  createMissingAiUsageOperatorError,
} = require("./ai-usage-meta");

test("normalizeAiUsageOperatorName trims and clamps the operator name", function () {
  assert.equal(normalizeAiUsageOperatorName("  张 三  "), "张 三");
  assert.equal(normalizeAiUsageOperatorName(""), "");
});

test("buildAiUsageRequestMeta keeps platform user fields optional", function () {
  assert.deepEqual(
    buildAiUsageRequestMeta({
      settings: { meta: { aiUsageOperatorName: "李四" } },
      platformUserName: "labelx-user",
      platformUserId: "",
    }),
    {
      aiUsageOperatorName: "李四",
      platformUserName: "labelx-user",
      platformUserId: "",
    }
  );
});

test("createMissingAiUsageOperatorError returns a stable code", function () {
  const error = createMissingAiUsageOperatorError();
  assert.equal(error.code, "missing-ai-usage-operator-name");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/shared/ai-usage-meta.test.js`
Expected: FAIL with `Cannot find module './ai-usage-meta'`.

- [ ] **Step 3: Write minimal implementation**

```js
"use strict";

function normalizeText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 80);
}

function normalizeAiUsageOperatorName(value) {
  return normalizeText(value, 40);
}

function buildAiUsageRequestMeta(input) {
  const source = input && typeof input === "object" ? input : {};
  const settings = source.settings && typeof source.settings === "object" ? source.settings : {};
  return {
    aiUsageOperatorName: normalizeAiUsageOperatorName(settings?.meta?.aiUsageOperatorName),
    platformUserName: normalizeText(source.platformUserName, 80),
    platformUserId: normalizeText(source.platformUserId, 120),
  };
}

function createMissingAiUsageOperatorError() {
  const error = new Error("请先在 options 首页填写 AI 调用使用人。");
  error.code = "missing-ai-usage-operator-name";
  return error;
}

const api = {
  normalizeAiUsageOperatorName,
  buildAiUsageRequestMeta,
  createMissingAiUsageOperatorError,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
if (typeof globalThis !== "undefined") {
  globalThis.ASREdgeAiUsageMeta = api;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --test extension/shared/ai-usage-meta.test.js
node --check extension/shared/ai-usage-meta.js
```

Expected: PASS and no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add extension/shared/ai-usage-meta.js extension/shared/ai-usage-meta.test.js
git commit -m "新增(ai-log): 增加前端 AI 使用人元数据助手"
```

### Task 2: Global Settings And Options UI

**Files:**
- Modify: `extension/shared/constants.js`
- Modify: `extension/shared/storage.js`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.js`
- Modify: `extension/manifest.json`

- [ ] **Step 1: Extend the test to cover settings patch generation**

```js
test("createAiUsageOperatorSettingsPatch writes the global operator field under meta", function () {
  assert.deepEqual(
    createAiUsageOperatorSettingsPatch("  王五  "),
    {
      meta: {
        aiUsageOperatorName: "王五",
      },
    }
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/shared/ai-usage-meta.test.js`
Expected: FAIL because `createAiUsageOperatorSettingsPatch` is not defined yet.

- [ ] **Step 3: Write minimal implementation**

```js
// extension/shared/constants.js
meta: {
  schemaVersion: SCHEMA_VERSION,
  backendEndpointMode: BACKEND_ENDPOINT_MODE_SERVER,
  aiUsageOperatorName: "",
  lastBootstrapReason: null,
  lastBootstrappedAt: null,
},
```

```js
// extension/shared/ai-usage-meta.js
function createAiUsageOperatorSettingsPatch(operatorName) {
  return {
    meta: {
      aiUsageOperatorName: normalizeAiUsageOperatorName(operatorName),
    },
  };
}
```

```html
<!-- extension/options/options.html -->
<label class="home-endpoint-field">
  <span>AI 调用使用人</span>
  <input id="home-ai-usage-operator" type="text" maxlength="40" placeholder="填写真实姓名" />
  <span class="home-endpoint-help">所有 AI 请求共用；未填写时不允许调用 AI。</span>
</label>
```

```js
// extension/options/options.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

function getAiUsageOperatorName(settings) {
  return aiUsageMeta.normalizeAiUsageOperatorName(settings?.meta?.aiUsageOperatorName);
}

async function persistAiUsageOperatorName(operatorName) {
  currentSettings = await storage.patchSettings(
    aiUsageMeta.createAiUsageOperatorSettingsPatch(operatorName)
  );
}

function renderHomeAiUsageOperator(settings) {
  const input = getElement("home-ai-usage-operator");
  if (input instanceof HTMLInputElement) {
    input.value = getAiUsageOperatorName(settings || {});
  }
}
```

```json
// extension/manifest.json
"js": [
  "shared/constants.js",
  "shared/storage.js",
  "shared/ai-usage-meta.js",
  "sites/data-baker/round-one-quality/data-api.js"
]
```

- [ ] **Step 4: Run validation**

Run:

```bash
node --test extension/shared/ai-usage-meta.test.js
node --check extension/shared/ai-usage-meta.js
node --check extension/options/options.js
node --check extension/shared/storage.js
```

Manual check in Chrome/Edge:

1. 打开扩展 `options` 首页。
2. 在“后端接口地址”首页卡片看到 `AI 调用使用人`。
3. 输入姓名、切换页面再回来，确认值仍存在。
4. 清空后保存，确认输入框回显为空。

Expected: automated checks PASS; options 首页能稳定保存并回显该字段。

- [ ] **Step 5: Commit**

```bash
git add extension/shared/ai-usage-meta.js extension/shared/constants.js extension/shared/storage.js extension/options/options.html extension/options/options.js extension/manifest.json
git commit -m "新增(ai-log): 增加全局 AI 调用使用人设置"
```

### Task 3: Wire DataBaker And Aishell Frontend Requests

**Files:**
- Modify: `extension/sites/data-baker/round-one-quality/ai-recommendation.js`
- Modify: `extension/sites/data-baker/round-one-quality/content.js`
- Modify: `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`
- Modify: `extension/sites/aishell-tech/minnan-helper/content.js`

- [ ] **Step 1: Write the failing test for missing operator handling**

```js
test("assertAiUsageOperatorConfigured throws the stable missing-operator error", function () {
  assert.throws(
    function () {
      assertAiUsageOperatorConfigured({ aiUsageOperatorName: "" });
    },
    function (error) {
      return error && error.code === "missing-ai-usage-operator-name";
    }
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/shared/ai-usage-meta.test.js`
Expected: FAIL because `assertAiUsageOperatorConfigured` is not defined yet.

- [ ] **Step 3: Write minimal implementation**

```js
// extension/shared/ai-usage-meta.js
function assertAiUsageOperatorConfigured(requestMeta) {
  if (!normalizeAiUsageOperatorName(requestMeta?.aiUsageOperatorName)) {
    throw createMissingAiUsageOperatorError();
  }
  return requestMeta;
}
```

```js
// extension/sites/data-baker/round-one-quality/ai-recommendation.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

function getPlatformUserMeta() {
  return {
    platformUserName: getAnnotatorName(),
    platformUserId: "",
  };
}

function createRequestBody(source) {
  const requestMeta = aiUsageMeta.buildAiUsageRequestMeta({
    settings: config.settings,
    platformUserName: getPlatformUserMeta().platformUserName,
    platformUserId: getPlatformUserMeta().platformUserId,
  });
  aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);
  return Object.assign(
    {
      collectId: String(source.collectId || ""),
      itemId: String(source.itemId || ""),
    },
    requestMeta
  );
}
```

```js
// extension/sites/aishell-tech/minnan-helper/ai-recommendation.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

function getPlatformUserMeta(source) {
  return {
    platformUserName: normalizeText(source.platformUserName || ""),
    platformUserId: normalizeText(source.platformUserId || ""),
  };
}

function createRequestBody(source) {
  const userMeta = getPlatformUserMeta(source);
  const requestMeta = aiUsageMeta.buildAiUsageRequestMeta({
    settings: runtimeSettings,
    platformUserName: userMeta.platformUserName,
    platformUserId: userMeta.platformUserId,
  });
  aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);
  return Object.assign({}, source, requestMeta);
}
```

```js
// extension/sites/data-baker/round-one-quality/content.js
const runtime = aiRecommendationModule.createRuntime({
  endpoint: config.aiRecommendEndpoint,
  timeoutMs: config.aiRecommendRequestTimeoutMs,
  settings: currentSettings,
});
```

- [ ] **Step 4: Run validation**

Run:

```bash
node --test extension/shared/ai-usage-meta.test.js
node --check extension/shared/ai-usage-meta.js
node --check extension/sites/data-baker/round-one-quality/ai-recommendation.js
node --check extension/sites/data-baker/round-one-quality/content.js
node --check extension/sites/aishell-tech/minnan-helper/ai-recommendation.js
node --check extension/sites/aishell-tech/minnan-helper/content.js
```

Manual browser checks:

1. 清空 `AI 调用使用人`，在 DataBaker 当前题点击 AI 推荐。
2. 确认前端直接提示“请先在 options 首页填写 AI 调用使用人”，Network 不发请求。
3. 填入姓名后重试，确认请求体出现 `aiUsageOperatorName/platformUserName/platformUserId`。
4. 在 Aishell 当前条重复上面两步，确认行为一致。

Expected: missing operator blocks the request; configured operator adds the three meta fields.

- [ ] **Step 5: Commit**

```bash
git add extension/shared/ai-usage-meta.js extension/sites/data-baker/round-one-quality/ai-recommendation.js extension/sites/data-baker/round-one-quality/content.js extension/sites/aishell-tech/minnan-helper/ai-recommendation.js extension/sites/aishell-tech/minnan-helper/content.js
git commit -m "新增(ai-log): 接入 DataBaker 与 Aishell 前端 AI 调用元数据"
```

### Task 4: Wire Magic Data, LabelX, And Task21 Frontend Requests

**Files:**
- Modify: `extension/sites/magic-data/shared/ai-review-client.js`
- Modify: `extension/sites/magic-data/hakka-helper/content.js`
- Modify: `extension/sites/magic-data/minnan-helper/content.js`
- Modify: `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js`
- Modify: `extension/sites/alibaba-labelx/asr-transcription/content.js`
- Modify: `extension/sites/alibaba-labelx/asr-judgement/judgement-ai-suggestion.js`
- Modify: `extension/sites/alibaba-labelx/asr-judgement/content.js`
- Modify: `extension/sites/abaka-ai/task-page/ai-client.js`
- Modify: `extension/sites/abaka-ai/task-page/content.js`

- [ ] **Step 1: Write the failing test for payload decoration**

```js
test("decorateAiRequestPayload merges request meta without dropping empty platform fields", function () {
  assert.deepEqual(
    decorateAiRequestPayload(
      { recordId: "row-1" },
      {
        aiUsageOperatorName: "赵六",
        platformUserName: "",
        platformUserId: "",
      }
    ),
    {
      recordId: "row-1",
      aiUsageOperatorName: "赵六",
      platformUserName: "",
      platformUserId: "",
    }
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/shared/ai-usage-meta.test.js`
Expected: FAIL because `decorateAiRequestPayload` is not defined yet.

- [ ] **Step 3: Write minimal implementation**

```js
// extension/shared/ai-usage-meta.js
function decorateAiRequestPayload(payload, requestMeta) {
  return Object.assign({}, payload || {}, {
    aiUsageOperatorName: normalizeAiUsageOperatorName(requestMeta?.aiUsageOperatorName),
    platformUserName: normalizeText(requestMeta?.platformUserName, 80),
    platformUserId: normalizeText(requestMeta?.platformUserId, 120),
  });
}
```

```js
// extension/sites/magic-data/shared/ai-review-client.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

async function reviewCurrent(payload, options) {
  const requestMeta = aiUsageMeta.buildAiUsageRequestMeta({
    settings: options.settings,
    platformUserName: options.platformUserName,
    platformUserId: options.platformUserId,
  });
  aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);
  const response = await fetch(backend.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiUsageMeta.decorateAiRequestPayload(payload, requestMeta)),
  });
}
```

```js
// extension/sites/alibaba-labelx/asr-transcription/content.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

const requestMeta = aiUsageMeta.buildAiUsageRequestMeta({
  settings: currentSettings,
  platformUserName: String(requestPayload.platformUserName || "").trim(),
  platformUserId: String(requestPayload.platformUserId || "").trim(),
});
aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);

return aiSuggestionClientApi.suggestCurrent(
  aiUsageMeta.decorateAiRequestPayload(requestPayload, requestMeta),
  {
    timeoutMs: Number(runtime.config?.aiSuggestionRequestTimeoutMs || 120000) || 120000,
  }
);
```

```js
// extension/sites/abaka-ai/task-page/ai-client.js
const aiUsageMeta = globalThis.ASREdgeAiUsageMeta || null;

function getPlatformUserMeta(source) {
  return {
    platformUserName: normalizeText(source.platformUserName || ""),
    platformUserId: normalizeText(source.platformUserId || ""),
  };
}

const requestMeta = aiUsageMeta.buildAiUsageRequestMeta({
  settings: config.settings,
  platformUserName: getPlatformUserMeta(source).platformUserName,
  platformUserId: getPlatformUserMeta(source).platformUserId,
});
aiUsageMeta.assertAiUsageOperatorConfigured(requestMeta);
```

- [ ] **Step 4: Run validation**

Run:

```bash
node --test extension/shared/ai-usage-meta.test.js
node --check extension/shared/ai-usage-meta.js
node --check extension/sites/magic-data/shared/ai-review-client.js
node --check extension/sites/magic-data/hakka-helper/content.js
node --check extension/sites/magic-data/minnan-helper/content.js
node --check extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js
node --check extension/sites/alibaba-labelx/asr-transcription/content.js
node --check extension/sites/alibaba-labelx/asr-judgement/judgement-ai-suggestion.js
node --check extension/sites/alibaba-labelx/asr-judgement/content.js
node --check extension/sites/abaka-ai/task-page/ai-client.js
node --check extension/sites/abaka-ai/task-page/content.js
```

Manual browser checks:

1. Magic Data 两个助手、LabelX 转写/快判、Task21 各自触发一次 AI。
2. 先验证未填 `AI 调用使用人` 时都不发请求。
3. 再验证填写后请求体都带 `aiUsageOperatorName`，用户名/用户 ID 获取失败时允许留空。

Expected: five frontends share one blocking rule and one request meta contract.

- [ ] **Step 5: Commit**

```bash
git add extension/shared/ai-usage-meta.js extension/sites/magic-data/shared/ai-review-client.js extension/sites/magic-data/hakka-helper/content.js extension/sites/magic-data/minnan-helper/content.js extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js extension/sites/alibaba-labelx/asr-transcription/content.js extension/sites/alibaba-labelx/asr-judgement/judgement-ai-suggestion.js extension/sites/alibaba-labelx/asr-judgement/content.js extension/sites/abaka-ai/task-page/ai-client.js extension/sites/abaka-ai/task-page/content.js
git commit -m "新增(ai-log): 接入 Magic Data LabelX Task21 前端 AI 调用元数据"
```

### Task 5: Shared Backend AI Call Log Core

**Files:**
- Create: `platform-resources/backend/ai-call-log/schema.js`
- Create: `platform-resources/backend/ai-call-log/sanitizer.js`
- Create: `platform-resources/backend/ai-call-log/csv-writer.js`
- Create: `platform-resources/backend/ai-call-log/index.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/schema.test.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/sanitizer.test.js`
- Create: `platform-resources/backend/ai-call-log/__tests__/csv-writer.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// schema.test.js
test("normalizeTokenColumns prefers prompt and completion tokens", function () {
  assert.deepEqual(
    normalizeTokenColumns({ promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    { promptTokens: 10, completionTokens: 5, totalTokens: "" }
  );
});

test("normalizeTokenColumns falls back to totalTokens only when split tokens are missing", function () {
  assert.deepEqual(
    normalizeTokenColumns({ totalTokens: 21 }),
    { promptTokens: "", completionTokens: "", totalTokens: 21 }
  );
});
```

```js
// sanitizer.test.js
test("sanitizeLogJson removes full authorization and signed urls", function () {
  const json = sanitizeLogJson({
    authorization: "Bearer secret-token",
    audioUrl: "https://oss.example.com/file.wav?Signature=abc",
  });
  assert.match(json, /authorization/);
  assert.doesNotMatch(json, /secret-token/);
  assert.doesNotMatch(json, /Signature=abc/);
});
```

```js
// csv-writer.test.js
test("appendDailyCsvRecord creates the daily file with a header once", function () {
  appendDailyCsvRecord({
    logDir: tempDir,
    dateKey: "2026-05-28",
    columns: ["createdAt", "requestId"],
    row: { createdAt: "2026-05-28T00:00:00.000Z", requestId: "req-1" },
  });
  const content = fs.readFileSync(path.join(tempDir, "ai-calls-2026-05-28.csv"), "utf8");
  assert.match(content, /createdAt,requestId/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test platform-resources/backend/ai-call-log/__tests__/schema.test.js
node --test platform-resources/backend/ai-call-log/__tests__/sanitizer.test.js
node --test platform-resources/backend/ai-call-log/__tests__/csv-writer.test.js
```

Expected: FAIL with `Cannot find module` errors.

- [ ] **Step 3: Write minimal implementation**

```js
// platform-resources/backend/ai-call-log/schema.js
"use strict";

const { sanitizeLogJson } = require("./sanitizer");

const COMMON_COLUMNS = [
  "createdAt",
  "requestId",
  "platformId",
  "scriptId",
  "success",
  "errorCode",
  "errorMessage",
  "durationMs",
  "promptTokens",
  "completionTokens",
  "totalTokens",
  "aiUsageOperatorName",
  "platformUserName",
  "platformUserId",
  "rawResponseJson",
  "rawErrorJson",
];

function normalizeTokenColumns(usage) {
  const source = usage && typeof usage === "object" ? usage : {};
  const promptTokens = Number(source.promptTokens || 0);
  const completionTokens = Number(source.completionTokens || 0);
  const totalTokens = Number(source.totalTokens || 0);
  if (promptTokens > 0 || completionTokens > 0) {
    return { promptTokens, completionTokens, totalTokens: "" };
  }
  if (totalTokens > 0) {
    return { promptTokens: "", completionTokens: "", totalTokens };
  }
  return { promptTokens: "", completionTokens: "", totalTokens: "" };
}

function buildCommonLogRow(input) {
  const source = input && typeof input === "object" ? input : {};
  const requestMeta =
    source.normalizedRequest && typeof source.normalizedRequest === "object"
      ? source.normalizedRequest.requestMeta || {}
      : {};
  const tokens = normalizeTokenColumns(source.execution?.usage || {});
  return {
    createdAt: new Date().toISOString(),
    requestId: String(source.normalizedRequest?.requestId || source.requestId || ""),
    platformId: String(source.platformId || ""),
    scriptId: String(source.scriptId || ""),
    success: source.error ? "false" : "true",
    errorCode: String(source.error?.code || ""),
    errorMessage: String(source.error?.message || "").slice(0, 240),
    durationMs: Number(source.execution?.timing?.totalDurationMs || source.durationMs || 0) || "",
    promptTokens: tokens.promptTokens,
    completionTokens: tokens.completionTokens,
    totalTokens: tokens.totalTokens,
    aiUsageOperatorName: String(requestMeta.aiUsageOperatorName || ""),
    platformUserName: String(requestMeta.platformUserName || ""),
    platformUserId: String(requestMeta.platformUserId || ""),
    rawResponseJson: source.error ? "" : sanitizeLogJson(source.execution?.projectResult || {}),
    rawErrorJson: source.error ? sanitizeLogJson(source.error || {}) : "",
  };
}

module.exports = {
  COMMON_COLUMNS,
  buildCommonLogRow,
  normalizeTokenColumns,
};
```

```js
// platform-resources/backend/ai-call-log/sanitizer.js
function sanitizeLogJson(value) {
  return JSON.stringify(value, function replacer(key, input) {
    const lowerKey = String(key || "").toLowerCase();
    if (lowerKey.indexOf("token") >= 0 || lowerKey.indexOf("authorization") >= 0) {
      return "[REDACTED]";
    }
    if (lowerKey.indexOf("url") >= 0) {
      return String(input || "").replace(/\?.*$/, "?[REDACTED]");
    }
    return input;
  }).slice(0, 6000);
}

module.exports = {
  sanitizeLogJson,
};
```

```js
// platform-resources/backend/ai-call-log/csv-writer.js
"use strict";

const fs = require("fs");
const path = require("path");

function escapeCsvCell(value) {
  return "\"" + String(value === undefined ? "" : value).replace(/\"/g, "\"\"") + "\"";
}

function toCsvLine(columns, row) {
  return (
    columns
      .map(function mapColumn(column) {
        return escapeCsvCell(row && Object.prototype.hasOwnProperty.call(row, column) ? row[column] : "");
      })
      .join(",") + "\n"
  );
}

function appendDailyCsvRecord(input) {
  const filePath = path.join(input.logDir, "ai-calls-" + input.dateKey + ".csv");
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, input.columns.join(",") + "\n", "utf8");
  }
  fs.appendFileSync(filePath, toCsvLine(input.columns, input.row), "utf8");
}

module.exports = {
  appendDailyCsvRecord,
};
```

```js
// platform-resources/backend/ai-call-log/index.js
"use strict";

const { COMMON_COLUMNS } = require("./schema");
const { buildCommonLogRow } = require("./schema");
const { appendDailyCsvRecord } = require("./csv-writer");

function appendScriptLog(input) {
  const columns = COMMON_COLUMNS.concat(Array.isArray(input.extraColumns) ? input.extraColumns : []);
  const commonRow = buildCommonLogRow(input);
  const dateKey = String(commonRow.createdAt || new Date().toISOString()).slice(0, 10);
  appendDailyCsvRecord({
    logDir: input.logDir,
    dateKey,
    columns,
    row: Object.assign({}, commonRow, input.extraRow),
  });
}

function appendAiCallLogSafe(input) {
  try {
    appendScriptLog(input);
  } catch (error) {
    console.warn("[ai-call-log] append failed", String(error?.message || error));
  }
}

module.exports = {
  appendScriptLog,
  appendAiCallLogSafe,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
node --test platform-resources/backend/ai-call-log/__tests__/schema.test.js
node --test platform-resources/backend/ai-call-log/__tests__/sanitizer.test.js
node --test platform-resources/backend/ai-call-log/__tests__/csv-writer.test.js
node --check platform-resources/backend/ai-call-log/schema.js
node --check platform-resources/backend/ai-call-log/sanitizer.js
node --check platform-resources/backend/ai-call-log/csv-writer.js
node --check platform-resources/backend/ai-call-log/index.js
```

Expected: PASS and no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add platform-resources/backend/ai-call-log
git commit -m "新增(backend): 增加共享 AI 调用日志核心"
```

### Task 6: Framework Request Meta Validation And Default Logging Hook

**Files:**
- Modify: `platform-resources/backend/ai-framework/contracts/normalized-request.js`
- Modify: `platform-resources/backend/ai-framework/core/create-ai-route.js`
- Modify: `platform-resources/backend/ai-framework/__tests__/ai-framework.test.js`

- [ ] **Step 1: Write the failing tests**

```js
test("createNormalizedRequest keeps requestMeta fields", function () {
  const normalized = createNormalizedRequest({
    requestId: "request-6",
    platform: "data-baker",
    scriptId: "round-one-quality",
    requestMeta: {
      aiUsageOperatorName: "张三",
      platformUserName: "operator-a",
      platformUserId: "uid-1",
    },
  });
  assert.deepEqual(normalized.requestMeta, {
    aiUsageOperatorName: "张三",
    platformUserName: "operator-a",
    platformUserId: "uid-1",
  });
});

test("createAiRoute returns 400 when aiUsageOperatorName is missing", async function () {
  const routeHandler = createAiRoute({
    platform: "magic-data",
    scriptId: "hakka-helper",
    normalizeInput() {
      return {
        input: { recordId: "row-1" },
        requestMeta: { aiUsageOperatorName: "", platformUserName: "", platformUserId: "" },
      };
    },
  });
  const request = createJsonRequest({ requestId: "request-7" });
  const response = createMockResponse();
  await routeHandler({ pathname: "/api/test", request, response });
  assert.equal(response.statusCode, 400);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test platform-resources/backend/ai-framework/__tests__/ai-framework.test.js`
Expected: FAIL because `requestMeta` is not preserved and missing operator is not rejected.

- [ ] **Step 3: Write minimal implementation**

```js
// normalized-request.js
function createNormalizedRequest(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    requestId: normalizeString(source.requestId) || createRequestId(),
    platform: normalizeString(source.platform),
    scriptId: normalizeString(source.scriptId),
    routeKey: normalizeString(source.routeKey),
    input: normalizePlainObject(source.input),
    projectOptions: normalizePlainObject(source.projectOptions),
    debugOptions: normalizePlainObject(source.debugOptions),
    requestMeta: normalizePlainObject(source.requestMeta),
    runtimeContext: normalizePlainObject(source.runtimeContext),
  };
}
```

```js
// create-ai-route.js
const { appendAiCallLogSafe } = require("../../ai-call-log");

function normalizeAdapterPayload(payload) {
  if (!isPlainObject(payload)) {
    return {
      input: {},
      projectOptions: {},
      debugOptions: {},
      requestMeta: {},
      runtimeContext: {},
    };
  }
  return {
    input: isPlainObject(payload.input) ? payload.input : payload,
    projectOptions: isPlainObject(payload.projectOptions) ? payload.projectOptions : {},
    debugOptions: isPlainObject(payload.debugOptions) ? payload.debugOptions : {},
    requestMeta: isPlainObject(payload.requestMeta) ? payload.requestMeta : {},
    runtimeContext: isPlainObject(payload.runtimeContext) ? payload.runtimeContext : {},
  };
}

function assertAiUsageOperatorName(requestMeta) {
  if (!normalizeString(requestMeta?.aiUsageOperatorName)) {
    throw createHttpError(400, "missing-ai-usage-operator-name", "请先填写 AI 调用使用人。");
  }
}

return async function handleAiRoute(routeContext) {
  const context = routeContext && typeof routeContext === "object" ? routeContext : {};
  const request = context.request;
  let parsedBody = {};
  let normalizedRequest = null;
  const rawBody = await readRequestBody(request, runtimeOptions.maxBodyBytes);
  parsedBody = JSON.parse(rawBody || "{}");

  const normalizedAdapterPayload = normalizeAdapterPayload(
    typeof source.normalizeInput === "function"
      ? await source.normalizeInput(parsedBody, context)
      : parsedBody
  );
  assertAiUsageOperatorName(normalizedAdapterPayload.requestMeta);
  normalizedRequest = createNormalizedRequest({
    requestId,
    platform: source.platform,
    scriptId: source.scriptId,
    routeKey: source.routeKey || context.pathname,
    input: normalizedAdapterPayload.input,
    projectOptions: normalizedAdapterPayload.projectOptions,
    debugOptions: normalizedAdapterPayload.debugOptions,
    requestMeta: normalizedAdapterPayload.requestMeta,
    runtimeContext: Object.assign({}, normalizedAdapterPayload.runtimeContext, { pathname: normalizeString(context.pathname) }),
  });
};
```

```js
// create-ai-route.js success/error hook
const logConfig =
  typeof source.createAiCallLogConfig === "function"
    ? await source.createAiCallLogConfig({
        normalizedRequest,
        execution,
        rawBody: parsedBody,
        routeContext: context,
        error: null,
      })
    : null;
if (logConfig) {
  appendAiCallLogSafe(logConfig);
}
```

```js
// create-ai-route.js catch branch
const errorLogConfig =
  typeof source.createAiCallLogConfig === "function"
    ? await source.createAiCallLogConfig({
        normalizedRequest,
        execution: null,
        rawBody: parsedBody,
        routeContext: context,
        error,
      })
    : null;
if (errorLogConfig) {
  appendAiCallLogSafe(errorLogConfig);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
node --test platform-resources/backend/ai-framework/__tests__/ai-framework.test.js
node --check platform-resources/backend/ai-framework/contracts/normalized-request.js
node --check platform-resources/backend/ai-framework/core/create-ai-route.js
```

Expected: PASS and `missing-ai-usage-operator-name` becomes a stable 400 path.

- [ ] **Step 5: Commit**

```bash
git add platform-resources/backend/ai-framework/contracts/normalized-request.js platform-resources/backend/ai-framework/core/create-ai-route.js platform-resources/backend/ai-framework/__tests__/ai-framework.test.js
git commit -m "优化(ai-framework): 增加 AI 调用元数据校验与日志钩子"
```

### Task 7: DataBaker And Aishell Backend Logging Migration

**Files:**
- Modify: `platform-resources/data-baker/round-one-quality/ai/adapter.js`
- Modify: `platform-resources/data-baker/round-one-quality/ai/adapter.test.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
- Modify: `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- Modify: `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// data-baker adapter.test.js
test("adapter exposes DataBaker ai call log config", async function () {
  const normalized = await adapter.normalizeInput({
    collectId: "c1",
    itemId: "i1",
    pageText: "测试",
    audioUrl: "https://example.com/a.wav",
    aiUsageOperatorName: "张三",
  });
  assert.equal(normalized.requestMeta.aiUsageOperatorName, "张三");
});
```

```js
// aishell ai-service.test.js
test("transformRecommendResult keeps usage and timing for ai call logging", async function () {
  const transformed = transformRecommendResult({
    requestId: "request-1",
    usage: { promptTokens: 12, completionTokens: 7 },
    timing: { totalDurationMs: 2100 },
  });
  assert.equal(transformed.usage.promptTokens, 12);
  assert.equal(transformed.timing.totalDurationMs, 2100);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test platform-resources/data-baker/round-one-quality/ai/adapter.test.js
node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js
```

Expected: FAIL because request meta and shared log shape are not wired yet.

- [ ] **Step 3: Write minimal implementation**

```js
// data-baker/round-one-quality/ai/adapter.js
createAiCallLogConfig(context) {
  return {
    logDir: path.join(__dirname, "..", "backend", "logs"),
    platformId: "dataBaker",
    scriptId: "dataBakerRoundOneQuality",
    normalizedRequest: context.normalizedRequest,
    execution: context.execution,
    error: context.error,
    extraColumns: ["collectId", "itemId", "textId", "sentenceNumber", "audioHostname", "listenModel", "compareModel", "recognitionMode"],
    extraRow: {
      collectId: context.normalizedRequest.input.collectId,
      itemId: context.normalizedRequest.input.itemId,
      textId: context.normalizedRequest.input.textId,
      sentenceNumber: context.normalizedRequest.input.sentenceNumber,
      audioHostname: context.execution?.projectResult?.audioHostname || "",
      listenModel: context.execution?.models?.listenModel || "",
      compareModel: context.execution?.models?.compareModel || "",
      recognitionMode: context.execution?.projectResult?.recognitionMode || "",
    },
  };
}
```

```js
// data-baker/round-one-quality/backend/ai-service.js
// 删除 appendJsonl(path.join(logDir, JSONL_FILE_NAME), sanitized)
// 与 appendCsv(path.join(logDir, CSV_FILE_NAME), sanitized) 默认写入；保留推荐主逻辑与 usage/timing/debug 产出。
return {
  requestId,
  usage: responseData.usage,
  timing: responseData.timing,
  debug: responseData.debug,
};
```

```js
// aishell-tech/minnan-helper/backend/ai-service.js
function appendAishellAiCallLog(input) {
  return aiCallLog.appendScriptLog({
    logDir: path.join(__dirname, "logs"),
    platformId: "aishellTech",
    scriptId: "aishellTechMinnanAssistant",
    normalizedRequest: input.normalizedRequest,
    execution: {
      projectResult: input.result.data,
      usage: input.result.usage,
      timing: input.result.timing,
    },
    extraColumns: ["taskId", "packageId", "markItemId", "listenModel", "compareModel"],
    extraRow: {
      taskId: input.request.taskId,
      packageId: input.request.packageId,
      markItemId: input.request.markItemId,
      listenModel: input.result.data?.listenModel || "",
      compareModel: input.result.data?.compareModel || "",
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
node --test platform-resources/data-baker/round-one-quality/ai/adapter.test.js
node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js
node --check platform-resources/data-baker/round-one-quality/ai/adapter.js
node --check platform-resources/data-baker/round-one-quality/backend/ai-service.js
node --check platform-resources/aishell-tech/minnan-helper/backend/ai-service.js
```

Expected: PASS; DataBaker no longer owns the legacy JSONL/CSV writer, and Aishell gets its own script log.

- [ ] **Step 5: Commit**

```bash
git add platform-resources/data-baker/round-one-quality/ai/adapter.js platform-resources/data-baker/round-one-quality/ai/adapter.test.js platform-resources/data-baker/round-one-quality/backend/ai-service.js platform-resources/aishell-tech/minnan-helper/backend/ai-service.js platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js
git commit -m "优化(ai-log): 接入 DataBaker 与 Aishell 后端日志"
```

### Task 8: Magic Data, LabelX, And Task21 Backend Logging Migration

**Files:**
- Modify: `platform-resources/magic-data/hakka-helper/ai/adapter.js`
- Modify: `platform-resources/magic-data/hakka-helper/ai/adapter.test.js`
- Modify: `platform-resources/magic-data/minnan-helper/ai/adapter.js`
- Modify: `platform-resources/magic-data/minnan-helper/ai/adapter.test.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js`
- Modify: `platform-resources/abaka-ai/task21/ai/adapter.js`
- Modify: `platform-resources/abaka-ai/task21/ai/adapter.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// magic-data/hakka-helper/ai/adapter.test.js
test("adapter returns requestMeta for ai call logging", async function () {
  const normalized = await adapter.normalizeInput({
    requestId: "request-8",
    aiUsageOperatorName: "张三",
    platformUserName: "magic-user",
    platformUserId: "mu-1",
  });
  assert.equal(normalized.requestMeta.aiUsageOperatorName, "张三");
});
```

```js
// abaka-ai/task21/ai/adapter.test.js
test("adapter exposes task21 log columns", async function () {
  const logConfig = adapter.createAiCallLogConfig({
    normalizedRequest: {
      input: { taskId: "t-1", fieldKey: "same_font" },
      requestMeta: { aiUsageOperatorName: "张三" },
    },
    execution: {
      models: { visionModel: "qwen3.6-plus", reasoningModel: "qwen3.6-plus" },
      usage: { promptTokens: 12, completionTokens: 9 },
    },
  });
  assert.equal(logConfig.extraRow.taskId, "t-1");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test platform-resources/magic-data/hakka-helper/ai/adapter.test.js
node --test platform-resources/magic-data/minnan-helper/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js
node --test platform-resources/abaka-ai/task21/ai/adapter.test.js
```

Expected: FAIL because adapters do not yet expose request meta and `createAiCallLogConfig`.

- [ ] **Step 3: Write minimal implementation**

```js
// adapter normalizeInput pattern
return {
  input: normalizedBody,
  projectOptions: projectOptions,
  requestMeta: {
    aiUsageOperatorName: normalizeText(body.aiUsageOperatorName),
    platformUserName: normalizeText(body.platformUserName),
    platformUserId: normalizeText(body.platformUserId),
  },
};
```

```js
// adapter createAiCallLogConfig pattern
createAiCallLogConfig(context) {
  return {
    logDir: path.join(__dirname, "..", "backend", "logs"),
    platformId: "alibabaLabelx",
    scriptId: "alibabaLabelxAsrJudgement",
    normalizedRequest: context.normalizedRequest,
    execution: context.execution,
    error: context.error,
    extraColumns: ["taskId", "subTaskId", "itemIndex", "listenModel", "compareModel"],
    extraRow: {
      taskId: context.normalizedRequest.input.taskId || "",
      subTaskId: context.normalizedRequest.input.subTaskId || "",
      itemIndex: context.normalizedRequest.input.itemIndex || "",
      listenModel: context.execution.models?.listenModel || "",
      compareModel: context.execution.models?.compareModel || "",
    },
  };
}
```

```js
// task21 specific
extraColumns: ["taskId", "fieldKey", "analysisMode", "singleModel", "visionModel", "reasoningModel"],
extraRow: {
  taskId: context.normalizedRequest.input.taskId || "",
  fieldKey: context.normalizedRequest.input.fieldKey || "",
  analysisMode: context.execution.projectResult?.analysisMode || "",
  singleModel: context.execution.models?.singleModel || "",
  visionModel: context.execution.models?.visionModel || "",
  reasoningModel: context.execution.models?.reasoningModel || "",
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
node --test platform-resources/magic-data/hakka-helper/ai/adapter.test.js
node --test platform-resources/magic-data/minnan-helper/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js
node --test platform-resources/abaka-ai/task21/ai/adapter.test.js
node --check platform-resources/magic-data/hakka-helper/ai/adapter.js
node --check platform-resources/magic-data/minnan-helper/ai/adapter.js
node --check platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js
node --check platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js
node --check platform-resources/abaka-ai/task21/ai/adapter.js
```

Expected: PASS and every framework-based adapter can provide per-script log columns.

- [ ] **Step 5: Commit**

```bash
git add platform-resources/magic-data/hakka-helper/ai/adapter.js platform-resources/magic-data/hakka-helper/ai/adapter.test.js platform-resources/magic-data/minnan-helper/ai/adapter.js platform-resources/magic-data/minnan-helper/ai/adapter.test.js platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js platform-resources/abaka-ai/task21/ai/adapter.js platform-resources/abaka-ai/task21/ai/adapter.test.js
git commit -m "优化(ai-log): 接入 Magic Data LabelX Task21 后端日志"
```

### Task 9: Documentation And Regression Sweep

**Files:**
- Modify: `platform-resources/backend/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/backend/README.md`
- Modify: `platform-resources/magic-data/hakka-helper/README.md`
- Modify: `platform-resources/magic-data/minnan-helper/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/README.md`
- Modify: `platform-resources/abaka-ai/task21/README.md`
- Modify: `platform-resources/aishell-tech/minnan-helper/README.md`
- Modify: `platform-resources/README.md`
- Modify: `docs/README.md`
- Modify: `docs/platforms/index.md`
- Modify: `log.md`

- [ ] **Step 1: Write the failing regression checklist**

```md
- [ ] 未填写 `AI 调用使用人` 时，DataBaker / Magic Data / LabelX / Task21 / Aishell 都不会发 AI 请求
- [ ] 填写后，请求体都包含 `aiUsageOperatorName/platformUserName/platformUserId`
- [ ] 每个脚本都生成 `backend/logs/ai-calls-YYYY-MM-DD.csv`
- [ ] CSV 公共列一致，扩展列只包含本脚本字段
- [ ] 成功和失败都能写日志
- [ ] `promptTokens/completionTokens` 优先，`totalTokens` 仅兜底
- [ ] 原始 JSON 已脱敏，不含 token / authorization / 完整签名 URL
```

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
node --test extension/shared/ai-usage-meta.test.js
node --test platform-resources/backend/ai-call-log/__tests__/schema.test.js
node --test platform-resources/backend/ai-call-log/__tests__/sanitizer.test.js
node --test platform-resources/backend/ai-call-log/__tests__/csv-writer.test.js
node --test platform-resources/backend/ai-framework/__tests__/ai-framework.test.js
node --test platform-resources/data-baker/round-one-quality/ai/adapter.test.js
node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js
node --test platform-resources/magic-data/hakka-helper/ai/adapter.test.js
node --test platform-resources/magic-data/minnan-helper/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js
node --test platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js
node --test platform-resources/abaka-ai/task21/ai/adapter.test.js
git diff --check
```

Expected: PASS, with only optional LF/CRLF warnings allowed.

- [ ] **Step 3: Update docs with final operator-name and CSV contract**

```md
- `settings.meta.aiUsageOperatorName` 为所有脚本共用必填字段
- 每个脚本默认写 `backend/logs/ai-calls-YYYY-MM-DD.csv`
- 公共列固定为 `createdAt/requestId/platformId/scriptId/success/errorCode/errorMessage/durationMs/promptTokens/completionTokens/totalTokens/aiUsageOperatorName/platformUserName/platformUserId/rawResponseJson/rawErrorJson`
- 项目默认不使用 mock；日志设计不记录 mock 公共列
```

- [ ] **Step 4: Commit**

```bash
git add platform-resources/backend/README.md platform-resources/data-baker/round-one-quality/README.md platform-resources/data-baker/round-one-quality/backend/README.md platform-resources/magic-data/hakka-helper/README.md platform-resources/magic-data/minnan-helper/README.md platform-resources/alibaba-labelx/asr-judgement/README.md platform-resources/alibaba-labelx/asr-transcription/README.md platform-resources/abaka-ai/task21/README.md platform-resources/aishell-tech/minnan-helper/README.md platform-resources/README.md docs/README.md docs/platforms/index.md log.md
git commit -m "文档(ai-log): 同步 AI 调用日志落地说明"
```

## Execution Notes

- 按本计划执行时，继续保持“一块一提交”，不要把前端、后端、文档和 Aishell 并行改动混在一个 commit。
- Aishell 当前有并行开发，执行 Task 3 和 Task 7 前先重新执行 `git status --short`，只暂存本任务实际修改文件。
- 不恢复 DataBaker 的旧 `recommend-calls.jsonl`；落地后只保留共享 CSV 方案。
- 真实浏览器验证必须在 Chrome 或 Edge 扩展环境中完成，不能拿 mock 结果替代。
