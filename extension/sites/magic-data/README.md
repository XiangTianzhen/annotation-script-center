# Magic Data ANNOTATOR 前端目录

Magic Data 平台前端运行时代码已拆分为“平台共享 + 助手脚本”结构。

## 目录结构

- `shared/`：同平台共享模块（页面识别、采集、network observer、共享 AI client 与 legacy 面板兼容模块）。
- `hakka-helper/`：客家话助手新版入口（兼容旧脚本 ID：`magicDataAnnotatorAiReview`）。
- `minnan-helper/`：闽南语助手入口（新脚本 ID：`magicDataMinnanAssistant`，AI 配置拆分为“模型方案 + 识别策略”）。

## 运行边界

- 平台：`https://work.magicdatatech.com/*`
- 目标页面：`#/asrmark`
- 两个助手都只允许用户主动点击或快捷键触发 AI。
- 不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 配置与入口

- options 首页统一后端地址，不在脚本详情页新增独立后端地址。
- 同平台两个助手互斥启用：同一时刻只允许一个助手处于启用状态；启用一个时会自动关闭另一个。
- popup 会在 Magic Data 页面展示当前唯一生效助手；若未启用则显示未启用状态。
- 两个助手共享后端地址入口，但配置互相独立；闽南语助手支持独立模型方案、识别策略、模型和 Prompt 参数。
- 客家话助手默认已按 50 条评测结论落地：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，thinking 默认关闭。
- 客家话助手前端已切换到与闽南语助手一致的新面板体系（行内建议、三块独立折叠、全部填入、原始输出、差异对比）。
- 闽南语助手当前目标是“三项预测质检”（说话人书写、闽南语内容、普通话文本），面板左侧展示基础信息，右侧展示 AI 质检结果。
