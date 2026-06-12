# Config 目录说明

本目录统一承载扩展发布和后端运行相关配置，不再在各子目录单独维护 README。

## 当前文件与目录

- `package-crx-release.json`
  - 可提交的默认打包配置
- `aliyun-bailian-model-pricing.json`
  - 可提交的模型价格配置
- `env/`
  - `ai.env` / `backend.env`：本地或服务器运行时环境文件
  - `*.example`：可提交的示例文件
- `secrets/`
  - `annotation-script-center.pem`：CRX 企业发布私钥
  - `package-crx-release.local.json`：本地私有发布覆盖配置，不提交 Git

## 发布配置读取顺序

当前 `scripts/package-crx-release.js` 与 `scripts/sync-local-build-meta.js` 的读取顺序：

1. `config/package-crx-release.json`
2. `config/secrets/package-crx-release.local.json`
3. 环境变量
4. 命令行参数

## 推荐做法

- 把非敏感默认值放到 `config/package-crx-release.json`
  - 例如 `downloadBaseUrl`
  - 例如 `betaBackendBaseUrl`
- 把共享价格表放到 `config/aliyun-bailian-model-pricing.json`
- 把敏感值放到 `config/secrets/package-crx-release.local.json`
  - 例如 `betaUnlockPasswordSha256`

本地私有覆盖文件示例：

```json
{
  "betaUnlockPasswordSha256": "your_beta_unlock_password_sha256"
}
```

## 常用操作示例

### 1. 创建运行环境文件

在仓库根目录运行：

```powershell
Copy-Item config\env\backend.env.example config\env\backend.env
Copy-Item config\env\ai.env.example config\env\ai.env
```

### 2. 同步本地 beta build meta

开发者模式直接加载 `extension/` 时，如果希望本地 beta 入口能正常输入口令，需要先执行：

```powershell
node scripts/sync-local-build-meta.js
```

该命令会把本地 `config` 中的 beta 口令 hash 与 beta 后端地址写入：

- `extension/shared/build-meta.local.js`

这个文件已加入 `.gitignore`，只供本地开发使用；正式包与 beta ZIP 打包时会自动被安全 stub 覆盖，不会把本地私有 hash 带进发布产物。

### 3. 生成发布包

在仓库根目录运行：

```powershell
node scripts/package-crx-release.js
```

可选参数：

- 只生成 public：

```powershell
node scripts/package-crx-release.js --channel public
```

- 只生成 beta：

```powershell
node scripts/package-crx-release.js --channel beta
```

## 项目数据下载密码与 JWT Secret 配置

该组配置当前同时服务：

- 项目数据下载
- 系统管理后台会话
- AI 调用日志下载 fallback

项目数据下载与系统管理会话都不保存明文密码。后端仅校验 SHA256，并使用 JWT Secret 生成短期下载 token / 管理员会话 token。

### 操作步骤

#### 1. 创建真实配置文件

```powershell
Copy-Item config\env\backend.env.example config\env\backend.env
```

#### 2. 生成下载密码的 SHA256

```powershell
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "你的下载密码"
```

#### 3. 生成 JWT Secret

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### 4. 填入 `config/env/backend.env`

主推变量：

- `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`

兼容旧变量：

- `ASC_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_DATA_DOWNLOAD_JWT_SECRET`

AI 调用日志如需单独配置，也可以额外写：

- `ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256`
- `ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET`

示例：

```text
ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256=上一步生成的密码hash
ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET=上一步生成的随机字符串
```

#### 5. 重新启动后端

本地临时运行：

```powershell
node platform-resources\backend\server.js
```

PM2 更新：

```powershell
pm2 restart annotation-script-center --update-env
```

Linux / 服务器也同样是修改 `config/env/backend.env` 后再重启对应进程，不需要新增第二套后台密码配置。

## 私钥规则

- `annotation-script-center.pem` 必须长期保管并离线备份。
- 后续每个版本的 CRX 都必须使用同一个 `.pem` 打包。
- 如果私钥丢失并重新生成，扩展 `extension_id` 会变化，企业策略 `appid` 需要全部重配。
