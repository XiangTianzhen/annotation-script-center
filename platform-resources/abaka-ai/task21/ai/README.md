# Abaka AI Task21 AI 辅助分析（Task21助手）

## 目标

本目录沉淀 Task21 AI 分析方案、Prompt 模板和调试口径。  
AI 仅提供建议，不自动写入、不自动保存、不自动提交、不自动送审。

## 规则版本与方案

- Prompt 规则版本：`abaka-task21-ai-v5-removed-text-multiset`（见 `prompt.md` 与 `backend/prompt.js`）。

- 默认：`two_stage`
  - 阶段一 `vision_extract`：视觉模型只提取事实（visual observations）。
  - 可选阶段 `ocr_extract`：OCR 模型提取图中文字线索（默认关闭）。
  - 阶段二 `reasoning_decide`：推理模型根据规则输出最终结果。
- 保留：`single_model`
  - 单模型直接完成图像理解 + 规则判断，便于快速对比。

当前默认模型：
- `aiVisionModel=qwen3.6-plus`
- `aiReasoningModel=qwen3.6-plus`
- `aiSingleModel=qwen3.6-plus`
- `aiOcrEnabled=false`
- `aiOcrModel=""`（OCR 专用模型待文字提取官方文档进一步核对）

候选模型（基于视觉理解官方文档与截图口径）：
- 视觉/单模型候选：`qwen3.6-plus`、`qwen3.6-flash`、`qwen3-vl-plus`、`qwen3-vl-flash`、`qwen3.5-plus`、`qwen3.5-flash`、`qwen-vl-max`、`qwen-vl-plus`
- 推理候选：`qwen3.6-plus`、`qwen3.6-flash`、`qwen3.5-plus`、`qwen3.5-flash`
- 以下旧名不再作为默认或候选：`qwen-vl-max-latest`、`qwen-vl-ocr-latest`、`qvq-plus-latest`

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

## 当前规则摘要

- `same_font` 支持：`true | false | unsure | error | same underlying font+artistic effect`。
- `image_b_texts_removed` 采用 T/B/R/D 多重集规则：
  - `D == T => true`
  - `D` 为空 => `null`
  - `D` 非空且 `D != T => specify`
- `image_b_texts_removed` 删除判断只比较 `image_b` 与 `image_b_removed`，`image_a` 不参与。
- `specify` 支持：`all instances of xxx / 1 instance of xxx / N instances of xxx`。
- `other_changes` 只比较 `image_b_removed` 与 `image_b`，建议英文短句（约 30 词以内）。

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
- 视觉理解优先核对：[https://help.aliyun.com/zh/model-studio/vision](https://help.aliyun.com/zh/model-studio/vision)
- 当前实现参数名：`enable_thinking`，位置：请求体 root（OpenAI compatible Chat）。
