# 配置目录

- `aliyun-bailian-model-pricing.json`：模型价格配置。
- `env/`：后端与 AI 环境变量模板。
- `secrets/`：本地私有配置目录，已忽略，禁止提交；当前 ZIP 打包流程不读取该目录。

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
node scripts/package-extension-zip.js
```

命令先构建 Options、清空旧 `dist`，再仅生成版本化 ZIP。当前流程不签名、不读取私钥，也不生成自动更新元数据。
