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

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
