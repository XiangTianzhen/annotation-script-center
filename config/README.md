# 配置目录

`config/` 只保存可提交模板、公开模型价格和本机私密配置的目录约定。真实密钥、密码和服务端私有值不得进入 Git。

## 目录与文件

| 路径 | 是否提交 | 职责 |
|---|---:|---|
| `aliyun-bailian-model-pricing.json` | 是 | 模型价格与人民币估算数据源 |
| `env/backend.env.example` | 是 | 管理员会话与下载鉴权模板 |
| `env/ai.env.example` | 是 | 非密钥 AI runtime 模板 |
| `env/backend.env` | 否 | 本机/服务器管理员真实配置 |
| `env/backend.local.env` | 否 | 后端本地覆盖 |
| `env/ai.env` | 否 | 本机/服务器非密钥 AI 配置 |
| `env/ai.local.env` | 否 | AI 本地覆盖 |
| `secrets/dashscope-key-1.env` | 否 | 服务器密钥一，仅保存 `DASHSCOPE_API_KEY` |
| `secrets/dashscope-key-2.env` | 否 | 服务器密钥二，仅保存 `DASHSCOPE_API_KEY` |
| `secrets/dashscope-active-key.json` | 否 | 当前密钥槽位，仅保存 `activeSlotId` |
| `secrets/` | 否 | 本地私有文件；当前 ZIP 打包流程不读取该目录 |

## 环境加载顺序

统一后端启动时依次尝试读取：

1. `config/env/backend.env`
2. `config/env/backend.local.env`
3. `config/env/ai.env`
4. `config/env/ai.local.env`
5. `.env.local`
6. `ASC_ENV_FILE` 指向的可选附加文件

启动进程已经存在的系统环境变量优先级最高，不会被文件覆盖。文件之间按上述顺序加载，后加载文件中的同名键会覆盖前面文件的值，因此 `.local.env` 和 `ASC_ENV_FILE` 可作为本机最终覆盖层。

## 管理员鉴权

复制模板：

```powershell
Copy-Item config/env/backend.env.example config/env/backend.env
```

必须配置：

- `ASC_ADMIN_PASSWORD_SHA256`：管理员密码的 SHA-256 值。
- `ASC_ADMIN_JWT_SECRET`：随机、足够长的管理员会话签名密钥。

AI 日志下载可以通过 `ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256` 和 `ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET` 使用独立凭据；未配置时复用管理员凭据。

## AI 配置

复制模板：

```powershell
Copy-Item config/env/ai.env.example config/env/ai.env
```

当前维护的 provider 为 DashScope。真实密钥固定拆分到 `config/secrets/dashscope-key-1.env` 与 `config/secrets/dashscope-key-2.env`，每个文件仅填写一行 `DASHSCOPE_API_KEY=...`；当前选择写入 `config/secrets/dashscope-active-key.json`，内容为 `{ "activeSlotId": "key-1" }` 或 `key-2`。系统管理的服务器模式在管理员会话内切换槽位，扩展不会读取或显示密钥。

首次迁移时，可先将旧 `config/env/ai.env` 或进程环境中的 `DASHSCOPE_API_KEY` 填入密钥一文件，再为密钥二单独配置另一份有效凭据。仅当两个槽位均未配置时，后端才临时使用旧变量；一旦任一槽位存在，后续请求只使用当前选中的槽位，选中空槽位会被拒绝，不会自动切到旧变量或另一把密钥。两把密钥验证通过后可删除旧变量。PM2 运行用户必须可读取两份密钥文件并可写入状态 JSON，建议目录权限为仅该运行用户可访问。共享 job 超时、TTL、容量和轮询间隔仍保留代码默认值，只有确实需要偏离默认行为时，才在 `ai.env` 添加非密钥覆盖项。

价格估算统一读取 `aliyun-bailian-model-pricing.json`。缺少价格时页面显示“没有数据源”，CSV 金额列保持空白。

## 后端地址

扩展 Options 只维护：

- Server：`https://annotation-script-center.xiangtianzhen.store`
- Local：`http://127.0.0.1:3333`

管理员下载中心读取 `ASC_DOWNLOAD_BASE_URL`；未配置时使用公开域名下的 `/downloads/`。

## ZIP 打包

```powershell
node scripts/package-extension-zip.js
```

打包脚本构建 Options、清空旧 `dist`、压缩 `extension/`，并统一使用 ZIP 标准 `/` 包内路径。发布前会校验 `manifest.json` 及其全部引用脚本均已写入 ZIP，最终只保留版本化 ZIP。该流程不读取 `config/secrets/`。

## 安全检查

- `git status --short --ignored` 应将真实 env 和 `secrets/` 显示为 ignored。
- 不在命令输出、截图、日志或测试 fixture 中展示真实值。
- 服务器更新前备份 ignored 配置；不要通过 `git reset` 或覆盖复制清理服务器目录。
