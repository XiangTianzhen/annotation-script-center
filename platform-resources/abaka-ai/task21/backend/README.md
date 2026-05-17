# Abaka AI Task21 后端 AI 调试说明

## 接口

- `GET /api/abaka-ai/task21/ai/health`
- `GET /api/abaka-ai/task21/ai/defaults`
- `POST /api/abaka-ai/task21/ai/analyze`

## AI 调试参数来源

前端请求可携带：

- `model` / `options.model` / `debugConfig.model`
- `enableThinking` / `options.enableThinking` / `debugConfig.enableThinking`
- `timeoutMs` / `options.timeoutMs` / `debugConfig.timeoutMs`

后端处理规则：

- `model` 仅在 `ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE=true` 且命中白名单时生效。
- 白名单来自 `ABAKA_TASK21_AI_ALLOWED_MODELS`（逗号分隔）。
- `enableThinking` 默认 `false`，并显式传给模型请求体参数 `enable_thinking=false`。
- `timeoutMs` 强制限制到 `1000~300000`。

## 环境变量

- `ABAKA_TASK21_AI_MOCK`
- `ABAKA_TASK21_AI_MODEL`
- `ABAKA_TASK21_AI_ALLOWED_MODELS`
- `ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
- `ABAKA_TASK21_AI_TIMEOUT_MS`
- `ABAKA_TASK21_AI_ENABLE_THINKING`（默认 `false`）

## 安全边界

- 不在前端保存 API Key。
- API Key 仅读取后端 `DASHSCOPE_API_KEY` 环境变量。
- 日志不输出 token/cookie/authorization/完整图片 URL/完整 dataUrl。
