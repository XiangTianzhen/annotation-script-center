# 客家话助手（Magic Data）

本目录是 Magic Data `#/asrmark` 下“客家话助手”前端入口。

## 文件

- `content.js`：客家话助手入口编排与挂载。
- `assistant-panel.js`：客家话助手新版结果面板（与闽南语助手同能力，独立 DOM 命名空间）。
- `shortcuts-runtime.js`：客家话助手快捷键运行时（独立存储 key）。
- `ui-panel.js`：旧版兼容面板（legacy，当前主链路不再挂载）。

## 复用模块

客家话助手依赖 `../shared/`：

- `page-detector.js`
- `data-collector.js`
- `ai-review-client.js`（`/api/magic-data/hakka-helper/ai/review-current`）
- `assistant-panel-core.js`（legacy 兼容模块，当前客家话主链路不再使用）
- `shortcuts-runtime.js`（legacy 兼容模块，当前客家话主链路不再使用）

## 配置与快捷键

- 与闽南语助手统一使用“模型方案 + 识别策略”配置字段：
  - 模型方案：`two_stage` / `omni_single`
  - 识别策略：`direct_dialect` / `mandarin_to_dialect`
- 为兼容历史配置，仍保留 legacy `aiReviewRecognitionMode`（含 `recognition_convert`）映射。
- 快捷键动作已与闽南语助手统一到同一动作集合（含 `全部填入AI推荐`、`显示 AI 原始输出`、详情折叠切换等动作键）。
- 2026-05-25 客家话评测默认配置已落地：
  - `two_stage + direct_dialect`
  - 听音：`qwen3.5-omni-flash`
  - 比较：`qwen3.5-flash`
- `enable_thinking=false`
- 2026-05-26 Options 保存链路热修：
  - 客家话助手与闽南语助手统一走 Magic Data pipeline 字段联动（模型方案/识别策略/听音模型/比较模型/单模型）。
  - 保存时同时写入新字段与 legacy 字段（`aiReview*` + `listenModel/reviewModel`），并显式持久化模型选择值，避免刷新后回退显示。

## 前端交互（新版）

- 右侧按钮布局：主操作 `AI 质检当前条`、`全部填入AI推荐`；辅助操作 `刷新采集`、`重置高度`、`复制 AI 质检摘要`、`显示 AI 原始输出`。
- 已移除旧按钮：`填入第一行`、`填入第二行`、`忽略结果`。
- 三个详情块独立折叠：`说话人属性`、`客家话内容`、`普通话文本`，并按 `taskItemId + section` 记忆展开状态。
- 行内建议直接显示在两行文本下方；正确项仅显示“正确”，需改项显示建议文本 + `填入本行`。
- 说话人建议直接插入平台原生“说话人属性”表单项，正确项只显示 `AI建议：正确`。

## 2026-05-26 后端对齐说明

- 客家话助手前端新版面板依赖后端返回完整结构化字段：
  - `speakerCheck`
  - `dialectTextCheck`
  - `mandarinTextCheck`
  - `overall`
  - `recommendations`
  - `audioCheck`
- 客家话后端已按闽南语后端结构补齐上述字段，并保留 legacy `listen/comparison/verdict` 兼容字段。

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
