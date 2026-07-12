# New Domain Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前分支完整切换到新域名，保留自定义后端地址，准备可复现的 Nginx/PM2 部署流程并推送分支。

**Architecture:** 由扩展常量提供唯一公开 Server 默认值，storage schema 31 只迁移精确旧默认域名；manifest、发布脚本和后端下载中心共享相同的新 HTTPS 域名契约。服务器仍由 Node 监听回环地址，Nginx 负责 TLS、静态下载和 API 反向代理。

**Tech Stack:** Chrome Extension Manifest V3、Node.js、Vue/Vite、Node test、Vitest、Nginx、PM2。

## Global Constraints

- 不新增 Beta 通道、Beta 包或 Beta 设置。
- `extension/manifest.json` 版本保持 `1.0.0`。
- 不读取或提交 `config/secrets/`、真实密钥、证书、CRX 私钥。
- 管理员密码只写入被忽略的 `config/env/backend.env`，计划和提交不包含明文。
- 不直接操作服务器，不合并 `main`，不创建 tag。
- 验证通过后提交并推送当前分支。

---

### Task 1: 新域名与设置迁移契约

**Files:**
- Modify: `tests/extension/shared/v1-cutover-contract.test.js`
- Modify: `tests/extension/shared/storage.data-baker-cvpc.test.js`
- Modify: `extension/shared/constants.js`
- Modify: `extension/shared/storage.js`
- Modify: `extension/sites/bytedance-aidp/suzhou-helper/content.js`
- Modify: `extension/sites/bytedance-aidp/jinhua-helper/content.js`

**Interfaces:**
- Consumes: `ASREdgeConstants.DEFAULT_BACKEND_BASE_URLS` 和 storage `normalizeMeta(rawMeta)`。
- Produces: schema 31 设置；精确旧默认域名迁移；新域名运行时端点。

- [ ] **Step 1: 写失败测试**

  将常量预期改成 `https://annotation-script-center.xiangtianzhen.store` 和 schema `31`，新增用例：schema 30 且 Server 为旧域名时迁移到新域名；自定义 Server 地址不变。

- [ ] **Step 2: 验证测试先失败**

  Run: `npm run test:extension`

  Expected: 常量/schema/迁移断言失败。

- [ ] **Step 3: 最小实现**

  在 `constants.js` 设置 `SCHEMA_VERSION = 31` 和新默认域名；在 `storage.js` 仅当 `Number(source.schemaVersion) < 31` 且标准化 Server 精确等于旧域名时替换：

  ```js
  const LEGACY_SERVER_BASE_URL = "https://script.xiangtianzhen.store";
  const shouldMigrateLegacyServer = Number(source.schemaVersion) < 31
    && baseUrls.server === LEGACY_SERVER_BASE_URL;
  if (shouldMigrateLegacyServer) {
    baseUrls.server = constants.DEFAULT_BACKEND_BASE_URLS.server;
  }
  ```

  同步两个 AIDP content fallback。

- [ ] **Step 4: 验证定向测试通过**

  Run: `npm run test:extension`

  Expected: 全部 extension 测试通过。

### Task 2: 更新、下载与后端公开地址契约

**Files:**
- Modify: `tests/release/package-crx-build-profile.test.js`
- Modify: `tests/backend/admin-dashboard/overview.test.js`
- Modify: `tests/backend/admin-download-center/releases.test.js`
- Modify: `config/package-crx-release.json`
- Modify: `extension/manifest.json`
- Modify: `scripts/package-crx-release.js`
- Modify: `platform-resources/backend/admin-dashboard/overview.js`
- Modify: `platform-resources/backend/admin-download-center/releases.js`

**Interfaces:**
- Consumes: 新域名 HTTPS 下载基址。
- Produces: update XML、latest JSON、管理员下载中心和 manifest 使用一致 URL。

- [ ] **Step 1: 更新失败优先断言**

  将当前正式默认地址预期统一改为 `https://annotation-script-center.xiangtianzhen.store/downloads/`。

- [ ] **Step 2: 运行定向测试确认失败**

  Run: `npm run test:backend && npm run test:release`

  Expected: 旧 fallback 和发布默认值导致断言失败。

- [ ] **Step 3: 更新生产配置**

  更新 JSON、manifest、发布脚本和两个后端 fallback；保持文件名、版本号与单 public profile 不变。

- [ ] **Step 4: 验证定向测试通过**

  Run: `npm run test:backend && npm run test:release`

  Expected: 两组测试全部通过。

### Task 3: 本地私密配置与部署文档

**Files:**
- Modify (ignored, never stage): `config/env/backend.env`
- Modify: `README.md`
- Modify: `extension/README.md`
- Modify: `platform-resources/backend/README.md`
- Modify: `config/README.md`
- Modify: `log.md`
- Create: `docs/server-deployment.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: `platform-resources/backend/server.js`，端口 `127.0.0.1:3333`。
- Produces: 不含秘密的分支部署、PM2、Nginx、Certbot、回滚和验收命令。

- [ ] **Step 1: 写入本地管理员配置**

  使用 `apply_patch` 修改被忽略的 `config/env/backend.env` 中 `ASC_ADMIN_PASSWORD`；若文件缺失则从 `.example` 的非秘密结构创建。不得读取或输出完整文件内容。

- [ ] **Step 2: 编写部署文档**

  文档包含服务器检出当前分支、安装依赖、创建服务器私密 env、PM2 启动/保存、Nginx HTTP 到 HTTPS、`/downloads/`、`/api/`、Certbot、健康检查、日志与回滚。Nginx 不使用 `sub_filter`。

- [ ] **Step 3: 同步入口文档和历史总账**

  README 只记录当前入口与边界，迁移历史追加到 `log.md`。

- [ ] **Step 4: 安全检查**

  Run: `git status --short --ignored | Select-String 'config/env/backend.env'`

  Expected: 本地真实 env 显示为 ignored，普通 `git status --short` 不出现该文件。

### Task 4: 全量验证、提交与推送

**Files:**
- Verify: all modified tracked files

**Interfaces:**
- Consumes: Tasks 1-3 全部结果。
- Produces: 已验证且已推送的当前分支，不包含正式发布产物。

- [ ] **Step 1: 全量自动化验证**

  Run: `npm test`

  Expected: frontend、runtime、extension、backend、release 全部分区通过。

- [ ] **Step 2: 构建与静态检查**

  Run: `node scripts/build-options-app.js`

  Run: 对全部修改 JS 执行 `node --check`。

  Run: 解析 `extension/manifest.json`、确认引用文件存在并执行 `git diff --check`。

  Expected: 全部退出码为 0；Options 仅生成一份最终 CSS。

- [ ] **Step 3: 检查提交范围与敏感信息**

  只暂存任务相关 tracked 文件；确认不包含 `config/env/backend.env`、`config/secrets/`、证书和密钥。

- [ ] **Step 4: 提交**

  Run: `git commit -m "部署: 切换新域名测试环境"`

  Expected: 生成中文提交且工作区仅允许保留 ignored 本地 env。

- [ ] **Step 5: 推送当前分支**

  Run: `git push origin codex/options-vue-full-migration`

  Expected: 远端当前分支更新；不推送 main、不创建 tag。
