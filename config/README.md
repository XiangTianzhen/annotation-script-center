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

## 本地直加载 beta 口令同步

开发者模式直接加载 `extension/` 时，如果希望本地 beta 入口能正常输入口令，需要先执行：

```powershell
node scripts/sync-local-build-meta.js
```

该命令会把本地 `config` 中的 beta 口令 hash 与 beta 后端地址写入：

- `extension/shared/build-meta.local.js`

这个文件已加入 `.gitignore`，只供本地开发使用；正式包与 beta ZIP 打包时会自动被安全 stub 覆盖，不会把本地私有 hash 带进发布产物。

## 私钥规则

- `annotation-script-center.pem` 必须长期保管并离线备份。
- 后续每个版本的 CRX 都必须使用同一个 `.pem` 打包。
- 如果私钥丢失并重新生成，扩展 `extension_id` 会变化，企业策略 `appid` 需要全部重配。
