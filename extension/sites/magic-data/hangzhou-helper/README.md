# 杭州话脚本（Magic Data）

本目录是 Magic Data `#/asrmark` 与 `#/asrmarkCheck` 下“杭州话脚本”的前端入口。

## 脚本身份

- 脚本 ID：`magicDataHangzhouAssistant`
- 平台配置：`platforms.magicData.scripts.hangzhouHelper`
- 兼容镜像：`scriptCenter.projects.magicDataHangzhouAssistant`
- 当前为 `1.0.0` 正式脚本，固定在脚本中心显示。

## 文件

- `content.js`：入口编排与挂载控制。
- `assistant-panel.js`：右侧 AI 结果面板。
- `shortcuts-runtime.js`：快捷键运行时。
- `ai-review-client.js`：杭州话专属接口 client。

## 运行口径

- 页面支持：`#/asrmark`、`#/asrmarkCheck`
- 只有 `platforms.magicData.activeScriptId = magicDataHangzhouAssistant` 且脚本已启用时才真正挂载。
- 当前前端保留以下杭州话运行时能力：
  - 右侧 AI 面板
  - 行内填入
  - `显示 AI 原始输出`
  - `全部填入AI推荐`
  - 当前页临时全自动链路
- 说话人属性当前除 `性别 / 年龄` 外，已额外接入 `音频是否是纯方言` 判断，并在 AI 结果区与原生表单项旁显示建议。
- 共享能力继续复用 `../shared/` 下的平台识别、数据采集和页面桥接模块。

## AI 配置

- 使用统一的 `modelMode + recognitionStrategy + listenModel + compareModel + singleModel` 配置字段。
- 默认模型口径固定为：
  - `modelMode=two_stage`
  - `recognitionStrategy=direct_dialect`
  - `listenModel=qwen3.5-omni-flash`
  - `compareModel=qwen3.5-flash`
  - `enableThinking=false`
- 为兼容历史配置，仍保留 legacy 字段镜像，但杭州话不新增 legacy API 别名。
- 设置页会读取 `/api/magic-data/hangzhou-helper/ai/defaults`，并在后端不可用时回退本地默认值。
- `modelMode` 只接受 `two_stage / omni_single`，`recognitionStrategy` 只接受 `direct_dialect / mandarin_to_dialect`；旧值 `single / mandarin_bridge` 会在 storage 中迁移。
- 双模型与单模型选择会动态显示对应模型字段；thinking 固定关闭。
- 设置页提供两段 Prompt、完整生成参数和当前运行时支持的 22 个快捷键动作。

## 当前边界

- 当前已接入 `backend/lexicon/hangzhou-lexicon.json` 作为杭州话运行时主词表；若本地词表文件缺失或 JSON 解析失败，后端仍会回退到 `lexicon.status=missing`，前端继续可正常质检。
- 只允许用户主动点击按钮或快捷键触发 AI。
- 不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
- 例外授权：当前页临时全自动仅限 `#/asrmark`，且只走页面真实提交按钮。
