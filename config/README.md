# 配置目录

- `package-crx-release.json`：单一公开发布流程的可提交配置。
- `aliyun-bailian-model-pricing.json`：模型价格配置。
- `env/`：后端与 AI 环境变量模板。
- `secrets/`：私钥与本地私有覆盖，已忽略，禁止提交。

## 后端地址

扩展 Options 只维护 `Server` 与 `Local` 两套根地址。默认值在 `extension/shared/constants.js` 中定义。
当前公开 Server 和发布下载基址统一使用 `https://annotation-script-center.xiangtianzhen.store`。

## 管理员鉴权

复制 `config/env/backend.env.example` 为忽略的 `config/env/backend.env`，填写：

- `ASC_ADMIN_PASSWORD_SHA256`
- `ASC_ADMIN_JWT_SECRET`

AI 日志下载可选择独立配置 `ASC_AI_CALL_LOG_DOWNLOAD_*`；未配置时复用管理员凭据。

## 打包

```powershell
node scripts/package-crx-release.js
```

命令不接受通道参数，只构建版本化 CRX/ZIP 与两份更新元数据。脚本不读取 `config/secrets/package-crx-release.local.json`。
