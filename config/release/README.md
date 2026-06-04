# 打包配置目录

- `package-crx-release.json`：可提交的默认打包配置。
- `config/secrets/package-crx-release.local.json`：本地私有覆盖文件，不提交 Git。

当前 `scripts/package-crx-release.js` 的读取顺序：

1. `config/release/package-crx-release.json`
2. `config/secrets/package-crx-release.local.json`
3. 环境变量
4. 命令行参数

推荐做法：

- 把非敏感默认值放在 `config/release/package-crx-release.json`
  - 例如 `downloadBaseUrl`
  - 例如 `betaBackendBaseUrl`
- 把敏感值放在 `config/secrets/package-crx-release.local.json`
  - 例如 `betaUnlockPasswordSha256`

本地私有覆盖文件示例：

```json
{
  "betaUnlockPasswordSha256": "your_beta_unlock_password_sha256"
}
```
