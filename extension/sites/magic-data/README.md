# Magic Data ANNOTATOR 前端目录

Magic Data 平台前端运行时代码已拆分为“平台共享 + 助手脚本”结构。

## 目录结构

- `shared/`：同平台共享模块（页面识别、采集、network observer、通用面板核心、快捷键运行时、客家话 AI 客户端）。
- `hakka-helper/`：客家话助手入口（兼容旧脚本 ID：`magicDataAnnotatorAiReview`）。
- `minnan-helper/`：闽南语助手入口（新脚本 ID：`magicDataMinnanAssistant`，AI 配置按 DataBaker 风格支持 `two_stage/omni_single`）。

## 运行边界

- 平台：`https://work.magicdatatech.com/*`
- 目标页面：`#/asrmark`
- 两个助手都只允许用户主动点击或快捷键触发 AI。
- 不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 配置与入口

- options 首页统一后端地址，不在脚本详情页新增独立后端地址。
- 两个助手都可独立启用/禁用。
- popup 会在 Magic Data 页面展示当前可用助手列表。
- 两个助手共享后端地址入口，但配置互相独立；闽南语助手支持独立识别模式、模型和 Prompt 参数。
