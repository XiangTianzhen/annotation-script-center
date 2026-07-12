# 统一后端

统一后端入口为 `platform-resources/backend/server.js`，默认只监听 `127.0.0.1:3333`。它负责组合四脚本 API、管理员能力、公共 AI、日志和 ZIP 下载中心。

## 主要文件

| 路径 | 职责 |
|---|---|
| `server.js` | 加载 env、创建应用并监听端口 |
| `app.js` | HTTP 应用、Router 和公共中间处理 |
| `registry.js` | 注册四脚本与管理员路由 |
| `config.js` | host、port 和后端配置归一化 |
| `env-loader.js` | 按固定顺序加载 ignored env 文件 |
| `ai/` | provider、模型目录、调度、队列、价格与响应工具 |
| `ai-framework/` | request/response 契约、route factory、pipeline 和 adapter registry |
| `security/` | 签名 token 与下载审计公共能力 |
| `runtime-log-store.js` | 脱敏运行日志和摘要 |

## 启动配置

复制环境模板并填写本地真实值：

```powershell
Copy-Item config/env/backend.env.example config/env/backend.env
Copy-Item config/env/ai.env.example config/env/ai.env
```

启动：

```powershell
node platform-resources/backend/server.js
```

默认地址：

```text
http://127.0.0.1:3333
```

管理员鉴权必须提供：

- `ASC_ADMIN_PASSWORD_SHA256`
- `ASC_ADMIN_JWT_SECRET`

AI 调用通常需要 `DASHSCOPE_API_KEY`。环境加载顺序和覆盖规则见 [config/README.md](../../config/README.md)。

## 四脚本路由

| 脚本 | Health / Defaults | 主要能力 |
|---|---|---|
| 柳州话 | `/api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`、`.../defaults` | AI 推荐、整音频分段预览 |
| 苏州话 | `/api/bytedance-aidp/suzhou-helper/ai/recommend/health`、`.../defaults` | AI 推荐、分段建议 |
| 金华话 | `/api/bytedance-aidp/jinhua-helper/ai/recommend/health`、`.../defaults` | AI 推荐、分段建议 |
| 杭州话 | `/api/magic-data/hangzhou-helper/ai/review-current/health`、`/api/magic-data/hangzhou-helper/ai/defaults` | 当前条 AI 质检 |

完整请求体、响应字段和写回边界由各脚本 README 维护，统一后端不复制脚本业务 schema。

## 管理员接口

- `/api/admin/session/*`：管理员会话解锁与状态。
- `/api/admin/dashboard/*`：后端运行概况与脱敏运行日志。
- `/api/admin/download-center/*`：读取公开 `/downloads/` 目录索引，只返回版本化 ZIP。
- `/api/admin/ai-call-log/*`：四脚本 AI 日志选项、申请下载和签名文件下载。

`GET /api/admin/ai-call-log/options` 固定返回柳州、苏州、金华、杭州四项。

下载中心通过 `ASC_DOWNLOAD_BASE_URL` 指定目录；服务器必须为对应 `/downloads/` 开启目录索引，并提供 `annotation-script-center-v<version>.zip`。

## 公共 AI 与日志

- `ai/model-dispatcher.js` 按模型目录选择 provider。
- `ai/provider-queue.js` 按具体模型隔离并发和容量。
- `ai/model-pricing.js` 读取 `config/aliyun-bailian-model-pricing.json`。
- `ai/model-response-utils.js` 统一 usage、JSON 文本解析和中文句末标点。
- AI 日志默认记录输入、输出、总 Token 和可用的人民币估算。
- 普通运行日志只保留 requestId、hostname、status、model、duration 和错误摘要。

后端默认请求超时为 `60000ms`。若模型长期超过该时间，应优化模型、Prompt 或任务拆分，不通过无限拉长代理超时解决。

## PM2 与 Nginx

PM2：

```bash
cd /var/www/annotation-script-center
pm2 start platform-resources/backend/server.js \
  --name annotation-script-center \
  --cwd /var/www/annotation-script-center \
  --time
pm2 save
```

Nginx 的 `/api/` 应代理到 `http://127.0.0.1:3333`；`/downloads/` 应 alias 到仓库 `dist/` 并开启目录索引。完整示例位于根 [README](../../README.md)。

## 健康检查

```bash
curl -fsS http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend/health
curl -fsS http://127.0.0.1:3333/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults
curl -fsS http://127.0.0.1:3333/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults
curl -fsS http://127.0.0.1:3333/api/magic-data/hangzhou-helper/ai/defaults
```

## 常见排查

- 无法连接：确认 PM2 进程、监听地址、Nginx upstream 和 Options 后端模式。
- `401/403`：确认管理员哈希、JWT 密钥和请求凭据是否一致。
- AI 请求失败：检查 DashScope Key、模型名、60 秒超时和 PM2 脱敏日志。
- 下载中心为空：确认 `dist/` 存在 ZIP、Nginx autoindex 已开启、`ASC_DOWNLOAD_BASE_URL` 可访问。
- 扩展提示网络失败：先直接访问 health/defaults，再检查 HTTPS 和浏览器 Network。

不要在排障输出中粘贴真实 env、authorization、完整签名 URL 或完整请求体。

## 验证

```powershell
npm run test:backend
node --check platform-resources/backend/server.js
node platform-resources/backend/server.js
```

长期测试位于根 `tests/backend/`，不得在后端生产目录新增测试文件。
