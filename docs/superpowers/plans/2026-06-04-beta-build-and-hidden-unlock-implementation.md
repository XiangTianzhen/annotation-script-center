# Beta 构建与隐藏解锁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `v0.4.0` 增加正式包 / beta 包双构建、beta 隐藏交互 + 口令解锁、Lightwheel 的可见性过滤，以及系统管理中的 Beta 服务器选项。

**Architecture:** 先在共享层补一套“构建通道 + beta 解锁 + 平台可见性 + beta 后端模式”的纯函数，再让 `options`、`popup` 和运行时统一复用这套判断。打包阶段通过临时构建目录生成 `public` / `beta` 两类 CRX，beta 构建写入专用 build meta，public 构建过滤 beta host 权限。

**Tech Stack:** Chrome MV3 extension, vanilla JS, Node.js `node:test`, PowerShell packaging flow, unified `chrome.storage` settings schema.

---

### Task 1: 共享构建元信息与 beta 可见性核心

**Files:**
- Create: `extension/shared/build-meta.js`
- Create: `extension/shared/constants.release.test.js`
- Modify: `extension/shared/constants.js`
- Modify: `extension/shared/storage.js`

- [ ] **Step 1: Write the failing test for release channel, beta unlock, and backend mode normalization**

```javascript
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

function loadConstantsWithBuildMeta(buildMeta) {
  const modulePath = path.resolve(__dirname, "constants.js");
  delete require.cache[modulePath];
  globalThis.ASREdgeBuildMeta = buildMeta;
  const constants = require(modulePath);
  delete globalThis.ASREdgeBuildMeta;
  return constants;
}

test("public build never enables beta visibility or beta backend mode", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "public",
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const settings = {
    meta: {
      betaUnlocked: true,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
  };

  assert.equal(constants.RELEASE_CHANNEL, "public");
  assert.equal(constants.canUseBetaFeatures(settings), false);
  assert.equal(constants.getBackendEndpointModeFromSettings(settings), "server");
  assert.equal(constants.isPlatformVisible("lightwheel", settings), false);
});

test("beta build only exposes beta platform after unlock", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const lockedSettings = {
    meta: {
      betaUnlocked: false,
      backendEndpointMode: "server",
      betaBackendBaseUrl: "https://beta.example.test",
    },
  };
  const unlockedSettings = {
    meta: {
      betaUnlocked: true,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
    platforms: {
      lightwheel: {
        enabled: true,
        scripts: {
          viewPanel: {
            enabled: true,
          },
        },
      },
    },
  };

  assert.equal(constants.canUseBetaFeatures(lockedSettings), false);
  assert.equal(constants.isPlatformVisible("lightwheel", lockedSettings), false);
  assert.equal(constants.canUseBetaFeatures(unlockedSettings), true);
  assert.equal(constants.isPlatformVisible("lightwheel", unlockedSettings), true);
  assert.equal(constants.getBackendEndpointModeFromSettings(unlockedSettings), "beta");
  assert.equal(
    constants.buildBackendUrl("/api/example", unlockedSettings),
    "https://beta.example.test/api/example"
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/shared/constants.release.test.js`
Expected: FAIL because `constants.js` does not export the new beta helpers or build metadata handling yet.

- [ ] **Step 3: Write minimal shared implementation**

```javascript
// extension/shared/build-meta.js
(function () {
  globalThis.ASREdgeBuildMeta = {
    releaseChannel: "public",
    betaUnlockPasswordSha256: "",
    betaBackendBaseUrl: "",
  };
})();
```

```javascript
// extension/shared/constants.js
const RELEASE_CHANNEL_PUBLIC = "public";
const RELEASE_CHANNEL_BETA = "beta";
const BACKEND_ENDPOINT_MODE_BETA = "beta";
const buildMeta = globalThis.ASREdgeBuildMeta || {};

function normalizeReleaseChannel(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (text === RELEASE_CHANNEL_BETA) {
    return RELEASE_CHANNEL_BETA;
  }
  return fallback === RELEASE_CHANNEL_BETA ? RELEASE_CHANNEL_BETA : RELEASE_CHANNEL_PUBLIC;
}

function normalizeBetaBackendBaseUrl(value) {
  const text = String(value || "").trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(text) ? text : "";
}

const RELEASE_CHANNEL = normalizeReleaseChannel(buildMeta.releaseChannel, RELEASE_CHANNEL_PUBLIC);
const BETA_UNLOCK_PASSWORD_SHA256 = String(buildMeta.betaUnlockPasswordSha256 || "").trim().toLowerCase();
const DEFAULT_BETA_BACKEND_BASE_URL = normalizeBetaBackendBaseUrl(buildMeta.betaBackendBaseUrl);

function canUseBetaFeatures(settings) {
  return (
    RELEASE_CHANNEL === RELEASE_CHANNEL_BETA &&
    settings?.meta?.betaUnlocked === true
  );
}

function getBetaBackendBaseUrlFromSettings(settings) {
  return normalizeBetaBackendBaseUrl(settings?.meta?.betaBackendBaseUrl) || DEFAULT_BETA_BACKEND_BASE_URL;
}

function isPlatformVisible(platformId, settings) {
  const platform = PLATFORM_LIBRARY[String(platformId || "").trim()] || {};
  const visibility = String(platform.visibility || "public").trim().toLowerCase();
  return visibility !== "beta" || canUseBetaFeatures(settings);
}

function isScriptVisible(scriptId, settings) {
  const script = SCRIPT_LIBRARY[String(scriptId || "").trim()] || {};
  const visibility = String(script.visibility || "public").trim().toLowerCase();
  if (visibility === "beta" && !canUseBetaFeatures(settings)) {
    return false;
  }
  return isPlatformVisible(script.platformId, settings);
}
```

```javascript
// extension/shared/storage.js
meta: {
  schemaVersion: 21,
  backendEndpointMode: "server",
  betaUnlocked: false,
  betaUnlockedAt: null,
  betaBackendBaseUrl: "",
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test extension/shared/constants.release.test.js`
Expected: PASS with public build hiding `lightwheel` and beta build resolving beta endpoint only after unlock.

- [ ] **Step 5: Commit**

```bash
git add extension/shared/build-meta.js extension/shared/constants.js extension/shared/storage.js extension/shared/constants.release.test.js
git commit -m "新增(shared): 增加 beta 构建与可见性核心"
```

### Task 2: options 页面中的 beta 解锁、平台过滤与 Beta 服务器

**Files:**
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.js`
- Modify: `extension/options/options-workbench-state.js`
- Modify: `extension/options/options-workbench-state.test.js`

- [ ] **Step 1: Write the failing test for visible platform ordering and filtering**

```javascript
test("visible platform order excludes beta platform when locked", function () {
  const result = buildVisiblePlatformIds(
    ["alibabaLabelx", "lightwheel", "dataBaker"],
    {
      alibabaLabelx: { visibility: "public" },
      lightwheel: { visibility: "beta" },
      dataBaker: { visibility: "public" },
    },
    false
  );

  assert.deepEqual(result, ["alibabaLabelx", "dataBaker"]);
});

test("visible platform order includes beta platform after unlock", function () {
  const result = buildVisiblePlatformIds(
    ["alibabaLabelx", "lightwheel", "dataBaker"],
    {
      alibabaLabelx: { visibility: "public" },
      lightwheel: { visibility: "beta" },
      dataBaker: { visibility: "public" },
    },
    true
  );

  assert.deepEqual(result, ["alibabaLabelx", "lightwheel", "dataBaker"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test extension/options/options-workbench-state.test.js`
Expected: FAIL because `buildVisiblePlatformIds` does not exist yet.

- [ ] **Step 3: Write minimal workbench and options implementation**

```javascript
// extension/options/options-workbench-state.js
function buildVisiblePlatformIds(platformIds, platformLibrary, betaVisible) {
  return (Array.isArray(platformIds) ? platformIds : []).filter(function (platformId) {
    const platform = platformLibrary?.[platformId] || {};
    const visibility = normalizeText(platform.visibility || "public").toLowerCase();
    return visibility !== "beta" || betaVisible === true;
  });
}
```

```javascript
// extension/options/options.js
const releaseChannel = constants.RELEASE_CHANNEL || "public";
const canUseBetaFeatures =
  typeof constants.canUseBetaFeatures === "function"
    ? constants.canUseBetaFeatures
    : function () {
        return false;
      };

function getVisibleScriptIds(settings) {
  return Object.keys(scriptLibrary).filter(function (scriptId) {
    return constants.isScriptVisible
      ? constants.isScriptVisible(scriptId, settings || {})
      : true;
  });
}

function getVisiblePlatformIds(settings) {
  const orderedIds = getOrderedPlatformIds(settings);
  return buildVisiblePlatformIds(
    orderedIds,
    platformLibrary,
    canUseBetaFeatures(settings || {})
  );
}

function handleBetaUnlockRequest() {
  const password = globalThis.prompt("请输入 beta 口令");
  if (!password) {
    return;
  }
  // compare sha256(input) with constants.BETA_UNLOCK_PASSWORD_SHA256
}
```

```html
<!-- extension/options/options.html -->
<button id="workspace-beta-exit" class="ghost-button hidden" type="button">退出内测模式</button>
<input id="home-endpoint-beta-url" class="hidden" type="url" placeholder="https://beta.example.test" />
<button id="home-endpoint-beta" class="segment-button hidden" type="button">Beta 服务器</button>
```

- [ ] **Step 4: Run the targeted tests and syntax check**

Run:
- `node --test extension/options/options-workbench-state.test.js`
- `node --check extension/options/options.js`

Expected: PASS, and `options.js` parses with no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add extension/options/options.html extension/options/options.js extension/options/options-workbench-state.js extension/options/options-workbench-state.test.js
git commit -m "新增(options): 增加 beta 解锁与平台过滤"
```

### Task 3: popup 命中检测复用统一可见状态

**Files:**
- Modify: `extension/popup/popup.html`
- Modify: `extension/popup/popup.js`

- [ ] **Step 1: Write the failing test for popup detection rules**

```javascript
test("hidden beta platform is not detected in popup", function () {
  const context = getDetectedContext(
    "https://label-cloud.lightwheel.net/w/video3/index.html?access=1",
    {
      meta: {
        betaUnlocked: false,
      },
      platforms: {
        lightwheel: {
          enabled: true,
          scripts: {
            viewPanel: {
              enabled: true,
            },
          },
        },
      },
    }
  );

  assert.equal(context.platformId, null);
});
```

- [ ] **Step 2: Run the popup test and watch it fail**

Run: `node --test extension/popup/popup.test.js`
Expected: FAIL because popup currently exposes `lightwheel` based only on URL and enable state.

- [ ] **Step 3: Write minimal popup implementation**

```javascript
// extension/popup/popup.js
function isVisibleScriptEnabled(settings, scriptId) {
  return (
    (!constants.isScriptVisible || constants.isScriptVisible(scriptId, settings || {})) &&
    isScriptEnabled(settings || {}, scriptId)
  );
}

if (url.hostname === (constants.LIGHTWHEEL_PLATFORM || {}).host) {
  const visible = constants.isPlatformVisible
    ? constants.isPlatformVisible("lightwheel", settings || {})
    : true;
  if (!visible) {
    return {
      scriptId: null,
      platformId: null,
      statusText: "未触发",
      statusTone: "pending",
      title: "当前页面未命中已启用脚本",
      description: "当前页面没有可对外显示的已启用脚本。",
    };
  }
}
```

- [ ] **Step 4: Run popup test and syntax check**

Run:
- `node --test extension/popup/popup.test.js`
- `node --check extension/popup/popup.js`

Expected: PASS and popup script parses cleanly.

- [ ] **Step 5: Commit**

```bash
git add extension/popup/popup.html extension/popup/popup.js extension/popup/popup.test.js
git commit -m "修复(popup): 统一 beta 平台命中可见性"
```

### Task 4: 打包脚本与 beta 构建产物

**Files:**
- Create: `scripts/package-crx-build-profile.js`
- Create: `scripts/package-crx-build-profile.test.js`
- Modify: `scripts/package-crx-release.js`
- Modify: `extension/manifest.json`

- [ ] **Step 1: Write the failing test for build profiles**

```javascript
"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildReleaseProfile,
  buildManifestForChannel,
} = require("./package-crx-build-profile");

test("public profile keeps versioned public artifacts", function () {
  const profile = buildReleaseProfile("public", "0.4.0");
  assert.equal(profile.crxFilename, "annotation-script-center-v0.4.0.crx");
  assert.equal(profile.includeZip, true);
  assert.equal(profile.includeLatestJson, true);
});

test("beta profile emits single beta crx and no public metadata", function () {
  const profile = buildReleaseProfile("beta", "0.4.0");
  assert.equal(profile.crxFilename, "annotation-script-center-beta.crx");
  assert.equal(profile.includeZip, false);
  assert.equal(profile.includeLatestJson, false);
});
```

- [ ] **Step 2: Run the packaging helper test and confirm failure**

Run: `node --test scripts/package-crx-build-profile.test.js`
Expected: FAIL because build profile helper does not exist yet.

- [ ] **Step 3: Implement profile helper and temp build patching**

```javascript
// scripts/package-crx-build-profile.js
function buildReleaseProfile(channel, version) {
  if (channel === "beta") {
    return {
      channel: "beta",
      crxFilename: "annotation-script-center-beta.crx",
      includeZip: false,
      includeUpdateXml: false,
      includeLatestJson: false,
    };
  }
  return {
    channel: "public",
    crxFilename: `annotation-script-center-v${version}.crx`,
    includeZip: true,
    includeUpdateXml: true,
    includeLatestJson: true,
  };
}
```

```javascript
// scripts/package-crx-release.js
const channel = normalizeReleaseChannel(args.channel || process.env.ASC_RELEASE_CHANNEL);
const tempExtensionDir = createChannelScopedExtensionBuild({
  channel,
  betaUnlockPasswordSha256: process.env.ASC_BETA_UNLOCK_PASSWORD_SHA256 || "",
  betaBackendBaseUrl: process.env.ASC_BETA_BACKEND_BASE_URL || "",
});
const profile = buildReleaseProfile(channel, version);
```

- [ ] **Step 4: Run packaging helper tests and syntax check**

Run:
- `node --test scripts/package-crx-build-profile.test.js`
- `node --check scripts/package-crx-release.js`

Expected: PASS and package script parses cleanly.

- [ ] **Step 5: Commit**

```bash
git add scripts/package-crx-build-profile.js scripts/package-crx-build-profile.test.js scripts/package-crx-release.js extension/manifest.json
git commit -m "新增(release): 支持 public 与 beta 双构建打包"
```

### Task 5: 文档同步与整体验证

**Files:**
- Modify: `README.md`
- Modify: `extension/README.md`
- Modify: `log.md`

- [ ] **Step 1: Update documentation for beta package behavior**

```markdown
- `beta` 包只通过外部目录分发，不进入脚本下载中心。
- `beta` 包默认与正式版一致；完成隐藏交互并输入口令后，才显示 beta 平台与 Beta 服务器。
- `Lightwheel` 当前作为 beta 平台样板：未解锁或已禁用时，popup / 命中卡不再显示。
```

- [ ] **Step 2: Run the full verification set**

Run:
- `node --test extension/shared/constants.release.test.js extension/options/options-workbench-state.test.js extension/popup/popup.test.js scripts/package-crx-build-profile.test.js platform-resources/backend/admin-download-center/releases.test.js`
- `node --check extension/options/options.js`
- `node --check extension/popup/popup.js`
- `node --check scripts/package-crx-release.js`
- `node --check extension/shared/constants.js`
- `node --check extension/shared/storage.js`

Expected: all commands exit `0`.

- [ ] **Step 3: Commit**

```bash
git add README.md extension/README.md log.md
git commit -m "文档(beta): 同步 beta 构建与隐藏解锁说明"
```
