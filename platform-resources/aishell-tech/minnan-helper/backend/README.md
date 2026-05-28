# Aishell Tech 闽南语助手后端

## 入口

- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`

## 说明

- 当前实现保持 Aishell 独立路由、独立脚本 ID、独立词表目录。
- 模型、Prompt 默认值、并发归一规则与推荐链路参考 `platform-resources/data-baker/round-one-quality/backend/`。
- 当前默认识别策略为 `mandarin_to_dialect`（普通话对照默认）：
  - 听音模型先把闽南语音频转成普通话文本。
  - 比较/转换模型再结合页面预测闽南语文本与字词表输出最终闽南语推荐。
- 同时支持 `direct_dialect`（直接听写闽南语）测试模式。
- v1 直接复用 DataBaker 已验证的推荐执行链，不额外引入异步 job、SSE 或 WebSocket。
- 返回结构固定为 `success/requestId/data`，便于扩展端按推荐文本型脚本统一处理。
- recommend 请求当前会接收并继续透传到 Aishell -> DataBaker 推荐请求：
  - `aiUsageOperatorName`：options 首页全局“AI 调用使用人”
  - `platformUserName`：Aishell 页面头像下拉自动提取的纯平台账号，例如 `ASmnbz001`
  - `platformUserId`：当前先保留空字符串占位
- 为兼容现有 DataBaker 推荐日志宽表，若前端未单独传 `annotatorName`，后端会把 `platformUserName` 作为 `annotatorName` fallback 传给 DataBaker 推荐链。
- `defaults/health` 会返回：
  - `modelModeOptions`
  - `recognitionStrategyOptions`
  - 当前策略对应的默认 `listenPrompt / comparePrompt`
  - `promptProfiles`（两种策略的默认 Prompt）

## 安全边界

- 后端只返回推荐结果，不保存 Aishell 平台数据。
- 前端批量动作点击页面真实“保存”按钮，但不自动提交任务、不跨分包、不触发 `.check-area`。
