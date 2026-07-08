# 杭州话脚本（Magic Data）

本目录是 Magic Data `#/asrmark` 与 `#/asrmarkCheck` 下“杭州话脚本”的前端入口。

## 脚本身份

- 脚本 ID：`magicDataHangzhouAssistant`
- 平台配置：`platforms.magicData.scripts.hangzhouHelper`
- 兼容镜像：`scriptCenter.projects.magicDataHangzhouAssistant`
- 当前为隐藏 beta；需走现有 beta 解锁后才在脚本中心显示。

## 文件

- `content.js`：入口编排与挂载控制。
- `assistant-panel.js`：右侧 AI 结果面板。
- `shortcuts-runtime.js`：快捷键运行时。
- `ui-panel.js`：旧版兼容面板，当前主链路不挂载。
- `ai-review-client.js`：杭州话专属接口 client。

## 运行口径

- 页面支持：`#/asrmark`、`#/asrmarkCheck`
- 只有 `platforms.magicData.activeScriptId = magicDataHangzhouAssistant` 且脚本已启用时才真正挂载。
- 首版以前端行为复制客家话助手为主，保留：
  - 右侧 AI 面板
  - 行内填入
  - `显示 AI 原始输出`
  - `全部填入AI推荐`
  - 当前页临时全自动链路
- 共享能力继续复用 `../shared/` 下的平台识别、数据采集和页面桥接模块。

## AI 配置

- 使用统一的 `modelMode + recognitionStrategy + listenModel + compareModel + singleModel` 配置字段。
- 默认口径先与客家话助手保持一致：
  - `modelMode=two_stage`
  - `recognitionStrategy=direct_dialect`
  - `listenModel=qwen3.5-omni-flash`
  - `compareModel=qwen3.5-flash`
  - `enableThinking=false`
- 为兼容历史配置，仍保留 legacy 字段镜像，但杭州话不新增 legacy API 别名。

## 当前边界

- 本轮不接入实际杭州话词表；后端缺词表时会返回 `lexicon.status=missing`，前端仍可正常质检。
- 只允许用户主动点击按钮或快捷键触发 AI。
- 不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
- 例外授权：当前页临时全自动仅限 `#/asrmark`，且只走页面真实提交按钮。
