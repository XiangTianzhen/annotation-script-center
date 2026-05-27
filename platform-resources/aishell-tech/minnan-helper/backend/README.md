# Aishell Tech 闽南语助手后端

## 入口

- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`

## 说明

- 当前实现保持 Aishell 独立路由、独立脚本 ID、独立词表目录。
- 模型、Prompt 默认值、并发归一规则与推荐链路参考 `platform-resources/data-baker/round-one-quality/backend/`。
- v1 直接复用 DataBaker 已验证的推荐执行链，不额外引入异步 job、SSE 或 WebSocket。
- 返回结构固定为 `success/requestId/data`，便于扩展端按推荐文本型脚本统一处理。

## 安全边界

- 后端只返回推荐结果，不保存 Aishell 平台数据。
- 前端批量动作点击页面真实“保存”按钮，但不自动提交任务、不跨分包、不触发 `.check-area`。
