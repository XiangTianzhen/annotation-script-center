# Abaka AI Task21 后端 AI 调试说明

## 接口

- `GET /api/abaka-ai/task21/ai/health`
- `GET /api/abaka-ai/task21/ai/defaults`
- `POST /api/abaka-ai/task21/ai/analyze`

## 分析方案

- `two_stage`（默认）：
  - 阶段一 `vision_extract`：视觉模型只提取事实（visual observations）。
  - 阶段二 `reasoning_decide`：推理模型按 Task21 规则输出最终建议。
- `single_model`（保留）：
  - 单模型一次完成图像理解与规则判断。

## 前端可传调试参数

请求体可通过 `options` 或 `debugConfig` 传入：

- `analysisMode`
- `visionModel`
- `reasoningModel`
- `singleModel`
- `enableThinking`
- `timeoutMs`

后端规则：

- `analysisMode` 仅允许 `two_stage | single_model`，默认 `two_stage`。
- `timeoutMs` 强制限制到 `1000~300000`。
- 模型 override 仅在 `ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE=true` 时生效，且必须命中对应白名单。
- `enableThinking` 默认 `false`，并显式发送 `enable_thinking=false`。

## thinking 参数策略

- 默认始终显式发送：`enable_thinking=false`。
- 用户开启后显式发送：`enable_thinking=true`。
- 如果模型/接口不支持该参数：
  - 默认直接返回清晰错误（不静默移除）。
  - 仅当 `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK=true` 时，才允许移除参数重试，并返回 `fallbackUsed=true`。

## 环境变量（Abaka Task21）

- `ABAKA_TASK21_AI_MOCK`
- `ABAKA_TASK21_AI_ANALYSIS_MODE`
- `ABAKA_TASK21_AI_VISION_MODEL`
- `ABAKA_TASK21_AI_REASONING_MODEL`
- `ABAKA_TASK21_AI_SINGLE_MODEL`
- `ABAKA_TASK21_AI_MODEL`（旧变量，singleModel 兼容回退）
- `ABAKA_TASK21_AI_ALLOWED_VISION_MODELS`
- `ABAKA_TASK21_AI_ALLOWED_REASONING_MODELS`
- `ABAKA_TASK21_AI_ALLOWED_SINGLE_MODELS`
- `ABAKA_TASK21_AI_TIMEOUT_MS`
- `ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
- `ABAKA_TASK21_AI_ENABLE_THINKING`
- `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK`

## 安全边界

- 前端不保存 API Key；后端只从 `DASHSCOPE_API_KEY` 读取。
- 不输出 token/cookie/authorization/完整图片 URL/完整 dataUrl。
- AI 仅输出建议，不自动写入、不自动保存、不自动提交。
