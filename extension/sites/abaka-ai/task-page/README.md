# Abaka AI Task 页面脚本

## 脚本定位

本目录是 Abaka AI Task 页面运行时代码，当前包含两类能力：

- MAIN world：`page-world/network-structure-observer.js`（只读脱敏结构采集）
- ISOLATED world：
  - 快捷键：`content.js`、`shortcuts.js`、`dom-actions.js`、`toast.js`
  - AI 分析：`pricing.js`、`data-collector.js`、`ai-client.js`、`ai-panel.js`

## 当前阶段

- 阶段：Task21 快捷键 + AI 分析调试版。
- 目标：
  - 快捷键辅助 `same_font` 与派生字段选择、暂存、送审按钮点击
  - AI 面板提供 same_font / image_b_texts_removed / other_changes / overall 四种分析
- 范围：
  - 快捷键仅 DOM 点击，不直接调用平台保存/提交/领取/流转接口
  - AI 只输出建议，不自动写入、不自动保存、不自动提交、不自动送审

## 快捷键动作（默认）

- `1`：`same_font=true`
- `2`：`same_font=false`
- `3`：`same_font=same underlying font+artistic effect`
- `4`：`image_b_texts_removed=specify`
- `5`：`other_changes=specify`
- `6`：点击页面真实“暂存 / Save / Stash”按钮
- `7`：点击页面真实“送审 / Submit / Submit Review”按钮

联动开关：`autoSelectSpecifyOnSameFontTrue=true`（默认开启）同时适用于：

- `same_font=true`
- `same_font=same underlying font+artistic effect`

联动为幂等“确保选中”：

- `specify` 未选中时才点击；
- `specify` 已选中时保持不变，不重复点击，避免取消。

## 运行时边界

- 快捷键仅在 `/items` 页面生效。
- 必须检测到 `same_font` 字段后才执行动作，避免 Task17 等页面误触发。
- 焦点在 `input`、`textarea`、`select`、`contenteditable`、编辑器节点时忽略快捷键。
- `4/5` 对应 `specify` 也为幂等选择：已选中时不会取消。
- `6/7` 仅点击页面真实按钮，不直接调用平台保存/送审接口。
- `7` 不自动确认二次弹窗，若出现确认弹窗需用户手动确认。
- `7` 在疑似标注内审环境会被阻止，避免误触发送审。
- `6/7` 在 `viewMode=true` 查看页不执行。
- 不自动提交、不自动保存、不自动领取、不自动放弃、不自动跳过、不自动送审。

## AI 面板（调试版）

- 面板入口：`/items` 页面字段标题右侧内联按钮。
- 按钮挂载：
  - `same_font` 标题右侧：`AI分析`、`整体分析`
  - `image_b_texts_removed` 标题右侧：`AI分析`
  - `other_changes` 标题右侧：`AI分析`
- 结果展示：
  - 每个字段使用自己的悬浮窗，锚定在对应 `.l-item` 附近
  - 支持关闭
  - 支持“查看原始 JSON（脱敏）”折叠展开
- 按钮可用性：
  - 检测不到对应板块则置灰，提示“未检测到该板块”。
  - `same_font=false/unsure` 时后两个按钮仍可用于调试分析，但会提示正式流程可跳过。
- AI 分析快捷键（默认）：
  - `Alt+1`：AI 分析 `same_font`
  - `Alt+2`：AI 分析 `image_b_texts_removed`
  - `Alt+3`：AI 分析 `other_changes`
  - `Alt+4`：AI 整体分析
- Options 新增“AI 调试”子板块：
  - 分析方案：`two_stage`（默认）/ `single_model`
  - 默认推荐：双模型 `qwen3.6-plus + qwen3.6-plus`
  - 单模型默认：`qwen3.6-plus`
  - 视觉模型（双模型阶段一）
    - 候选：`qwen3.6-plus`、`qwen3.6-flash`、`qwen3-vl-plus`、`qwen3-vl-flash`、`qwen3.5-plus`、`qwen3.5-flash`、`qwen-vl-max`、`qwen-vl-plus`
  - OCR 模型与 OCR 开关（默认关闭）
    - OCR 专用模型待文字提取官方文档进一步核对，默认不预置模型
  - 推理模型（双模型阶段二）
    - 候选：`qwen3.6-plus`、`qwen3.6-flash`、`qwen3.5-plus`、`qwen3.5-flash`
  - 单模型（single_model）
  - 启用思考（默认关闭）
  - 请求超时（默认 `120000ms`）
  - 前端不保存 API Key
- 调试输出：
  - `requestId`、模型名、耗时
  - `analysisMode`、`visionModel`、`reasoningModel`、`singleModel`
  - `ocrEnabled`、`ocrModel`
  - `enableThinking`、`thinkingParamName`、`thinkingParamLocation`、`explicitDisableSent`、`timeoutMs`
  - `stages.vision/ocr/reasoning/single` 模型、callMode、thinking 状态、耗时与 token
  - `input/output/total tokens` 与 usage 来源
  - 图片数量、字段列表、`mime/width/height/bytes`
  - 价格估算（same_font、image_b_texts_removed、other_changes、total）
  - 脱敏后的原始 JSON（折叠查看）
- 安全：
  - 不展示完整图片 URL、完整 dataUrl、token/cookie/authorization 等敏感字段。

## 数据采集策略（AI 调试）

- 优先：`POST /api/v2/item/get-item-info`（同源、`credentials: include`，不手动设置 token/cookie）。
- 回退：DOM 采集（`.content-title` + `.content-image-view img`）。
- 图片字段固定映射：
  - `image_a`
  - `image_b`
  - `image_b_removed`
- 日志/UI 只展示脱敏统计，不展示完整 URL 或完整 dataUrl/base64。

## Console 导出（只读采集）

```js
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.snapshot()
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.download()
```

## 安全边界

- 不记录账号密码、cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL。
- 不提交原始 HAR、JSON、截图、CSV 或完整响应。
- 默认显式传 `enable_thinking=false`；仅在 Options 手动开启时传 `enable_thinking=true`。
- 若模型不支持或能力未知，不会盲传 `enable_thinking`；调试信息会标记 `notApplicable`。
- 已确认支持 thinking 的模型会显式传 `enable_thinking`（默认 `false`）；仅当后端设置 `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK=true` 才允许失败后回退移除。
