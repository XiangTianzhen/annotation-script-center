# 公共 AI 模块

本目录为柳州、苏州、金华、杭州四脚本后端提供模型调用公共能力：

- `model-response-utils.js`：中文句末标点、usage 归一化和模型 JSON 解析。
- `model-dispatcher.js`：模型请求分发。
- `model-catalog.js`：模型目录。
- `model-pricing.js`：价格读取与人民币估算。
- `provider-queue.js`：按模型隔离的请求队列。
- `providers/`：Qwen 与 Fun-ASR provider。

脚本专属 Prompt、响应 schema、路由和 AI 日志仍放在各脚本的 `backend/` 内。
