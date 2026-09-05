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
| `secrets/dashscope-key.env` | 否 | 唯一的服务器 DashScope 密钥，仅保存 `DASHSCOPE_API_KEY` |
| `secrets/recording-platform-integration.json.example` | 是 | 录音平台服务器私密配置的脱敏模板 |
| `secrets/recording-platform-integration.json` | 否 | 录音平台地址、机器 Key、允许任务列表与签名密钥 |
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

当前维护的 provider 为 DashScope。真实密钥固定放在 `config/secrets/dashscope-key.env`，文件仅填写一行 `DASHSCOPE_API_KEY=...`。Qwen、Qwen Python、Fun-ASR REST、Fun-ASR Python 与杭州话 Qwen 客户端共用这一读取入口；文件缺失、空值或无法解析时安全返回 503，并且不会读取 `dashscope-key-1.env`、`dashscope-key-2.env`、`dashscope-active-key.json`、`config/env/ai.env` 或进程环境中的旧 `DASHSCOPE_API_KEY`。

服务器人工迁移顺序：先创建并验证 `dashscope-key.env`，确保 PM2 运行用户可读且目录仅该用户可访问；再部署代码、重启后端并实际确认 AI 调用成功；最后由服务器管理员自行删除两个旧 Key 文件、活动状态 JSON，以及 PM2/系统环境中的旧密钥变量。本仓库部署流程不会代替管理员删除或改写这些服务器私有文件。共享 job 超时、TTL、容量和轮询间隔仍保留代码默认值，只有确实需要偏离默认行为时，才在 `ai.env` 添加非密钥覆盖项。

价格估算统一读取 `aliyun-bailian-model-pricing.json`。缺少价格时页面显示“没有数据源”，CSV 金额列保持空白。

## 录音平台集成配置

复制脱敏模板：

```powershell
Copy-Item config/secrets/recording-platform-integration.json.example config/secrets/recording-platform-integration.json
```

本地私密文件必须填写：

- `baseUrl`：录音任务平台 HTTPS 根地址。
- `apiKey`：只供统一后端调用录音平台的机器 Key。
- `allowedTaskCodes`：允许台州话录音集成写入和查询的可见任务编号列表，例如 `T000001`。
- `tokenSecret`：至少 32 字符的随机签名密钥，只用于短时录音播放 URL。

`baseUrl` 生产环境必须使用 HTTPS；本地联调仅允许明文 `http://localhost`、`http://127.0.0.1` 或 IPv6 loopback，其他 HTTP 主机一律拒绝。缺少、格式无效或仍为空值时，录音集成写入与查询接口统一安全返回 `503 RECORDING_INTEGRATION_NOT_CONFIGURED`，不会输出配置路径或真实值。`allowedTaskCodes` 是当前专用端点唯一的触发授权，不要求管理员会话；因此知道允许任务编号的同源调用方仍可能触发导入，这是已正式接受的首期 allowlist-only 风险。浏览器不会接收 `apiKey` 或 `tokenSecret`，服务器也不得接收 AIDP Cookie、Authorization 或 Session。

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
