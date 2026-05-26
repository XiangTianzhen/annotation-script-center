# 客家话助手（Magic Data）

本目录是 Magic Data `#/asrmark` 下“客家话助手”前端入口。

## 文件

- `content.js`：客家话助手入口编排与挂载。
- `ui-panel.js`：兼容旧面板实现（未默认挂载，保留以防回退）。

## 复用模块

客家话助手依赖 `../shared/`：

- `page-detector.js`
- `data-collector.js`
- `ai-review-client.js`（`/api/magic-data/hakka-helper/ai/review-current`）
- `assistant-panel-core.js`
- `shortcuts-runtime.js`

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

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
