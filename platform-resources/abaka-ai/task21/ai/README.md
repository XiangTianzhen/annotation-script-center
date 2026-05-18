# Abaka AI Task21 AI 辅助分析（调试版）

## 目标

本目录沉淀 Task21 AI 分析方案、Prompt 模板和调试口径。  
AI 仅提供建议，不自动写入、不自动保存、不自动提交、不自动送审。

## 方案

- 默认：`two_stage`
  - 阶段一 `vision_extract`：视觉模型只提取事实（visual observations）。
  - 可选阶段 `ocr_extract`：OCR 模型提取图中文字线索（默认关闭）。
  - 阶段二 `reasoning_decide`：推理模型根据规则输出最终结果。
- 保留：`single_model`
  - 单模型直接完成图像理解 + 规则判断，便于快速对比。

## 前端与后端参数

Options（Abaka AI Task21 详情）“AI 调试”保存：

- `aiAnalysisMode`
- `aiVisionModel`
- `aiOcrEnabled`
- `aiOcrModel`
- `aiReasoningModel`
- `aiSingleModel`
- `aiEnableThinking`（默认 `false`）
- `aiRequestTimeoutMs`（默认 `120000`）

前端调用 `/api/abaka-ai/task21/ai/analyze` 时显式携带上述参数。  
前端不保存 API Key。

## thinking 策略

- 默认显式传：`enable_thinking=false`。
- 用户开启后显式传：`enable_thinking=true`。
- 默认不静默移除参数；若模型不支持会返回清晰错误。
- 仅当 `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK=true` 时允许移除参数回退。

## 调试输出

返回并展示：

- `analysisMode`
- `visionModel / ocrModel / reasoningModel / singleModel`
- `stages.vision / stages.ocr / stages.reasoning / stages.single`（模型、callMode、thinking、耗时、usage）
- `usage.total` 与兼容平铺 tokens
- `thinking.enableThinking / explicitDisableSent / fallbackUsed / paramName / paramLocation`
- `requestId`、`elapsedMs`
- 图片统计（`image_a/image_b/image_b_removed`）
- 价格估算

## 安全边界

- 不记录完整图片 URL、完整 dataUrl、token/cookie/authorization。
- 日志与 UI 仅展示脱敏摘要。
- 未配置 API Key 时可使用 mock 模式验证流程。

## 官方文档核对

- 涉及模型列表与 thinking 参数，先查 `docs/external-docs/aliyun-bailian.md` 索引中的官方入口。
- 当前实现参数名：`enable_thinking`，位置：请求体 root（OpenAI compatible Chat）。
