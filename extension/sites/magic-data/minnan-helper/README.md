# 闽南语助手（Magic Data）

本目录是 Magic Data `#/asrmark` 下“闽南语助手”前端入口。

## 文件

- `content.js`：闽南语助手入口编排与挂载。
- `assistant-panel.js`：闽南语助手结果区（独立 DOM 命名空间）。
- `shortcuts-runtime.js`：闽南语助手快捷键运行时（独立存储 key）。
- `ai-review-client.js`：闽南语助手 AI 接口客户端（`/api/magic-data/minnan-helper/ai/review-current`）。

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 与客家话助手并行规则

- 两个助手同时启用时，各自挂载独立结果区，不互相覆盖。
- 两个助手只共享平台采集能力，不共享面板 DOM、快捷键配置和面板高度 key。
