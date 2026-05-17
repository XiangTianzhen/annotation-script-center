# Abaka AI Task21 AI 辅助分析（调试版）

## 目录用途

本目录沉淀 Task21 AI 辅助分析规则、Prompt 模板与调试口径。

- 仅用于辅助判断。
- 不自动写入页面字段。
- 不自动保存、不自动提交、不自动送审。

## 功能边界

前端按钮（内联）：

- AI 分析 same_font
- AI 分析 image_b_texts_removed
- AI 分析 other_changes
- AI 整体分析

挂载位置：

- `same_font` 标题右侧：`AI分析`、`整体分析`
- `image_b_texts_removed` 标题右侧：`AI分析`
- `other_changes` 标题右侧：`AI分析`
- 结果显示在对应字段锚点悬浮窗，可关闭，可展开“原始 JSON（脱敏）”。

AI 快捷键（默认）：

- `Alt+1`：same_font
- `Alt+2`：image_b_texts_removed
- `Alt+3`：other_changes
- `Alt+4`：overall

后端接口：

- `GET /api/abaka-ai/task21/ai/health`
- `GET /api/abaka-ai/task21/ai/defaults`
- `POST /api/abaka-ai/task21/ai/analyze`

## 调试输出

每次分析返回并展示：

- `requestId`
- 模型名
- 耗时（ms）
- `inputTokens/outputTokens/totalTokens`
- `usage.source`（`provider | estimated | unavailable`）
- 图片统计（`image_a/image_b/image_b_removed`）
- 图片 `mime/width/height/bytes/sourceKind`
- 价格估算（same_font / image_b_texts_removed / other_changes / total）

## 价格规则来源

价格规则来自“雨滴Task21单价.xlsx”，已固化到前端：

- `extension/sites/abaka-ai/task-page/pricing.js`

实现说明：

- `15-20` 档位在代码按 `16-20` 处理，避免边界重叠。
- `other_changes=unsure` 按 1 词计费。
- same_font 分段为估算算法，UI 会显示 estimated。

## 安全与脱敏

- 不记录完整 `imageUrl`、对象存储 URL、完整 `dataUrl`。
- 不记录 cookie/token/authorization/password/secret/signature。
- 文档和日志仅保留结构化摘要，不落原始图片数据。

## Prompt 文档

- 主文档：`prompt.md`
- 版本：`abaka-task21-ai-v1`
