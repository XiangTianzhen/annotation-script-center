# 闽南语助手（Magic Data）

本目录是 Magic Data `#/asrmark` 下“闽南语助手”前端入口。

## 文件

- `content.js`：闽南语助手入口编排与挂载。
- `assistant-panel.js`：闽南语助手结果区（独立 DOM 命名空间）。
- `shortcuts-runtime.js`：闽南语助手快捷键运行时（独立存储 key）。
- `ai-review-client.js`：闽南语助手 AI 接口客户端（`/api/magic-data/minnan-helper/ai/review-current`）。

## AI 配置口径

- 前端行为与客家话助手对齐：只在 `#/asrmark` 挂载，用户主动点击按钮或快捷键才触发 AI。
- options 中闽南语助手 AI 配置走 DataBaker 风格：
  - `two_stage`：显示“听音模型 + 比较模型”
  - `omni_single`：只显示“AI 模型”
  - `recognition_convert`：显示“听音模型 + 比较模型（转换）”，链路为“先识别普通话，再按词表转换闽南语”
- `two_stage` 听音模型支持 `fun-asr` 或 Qwen Omni；`omni_single` 走 Qwen Omni 单模型。
- `recognition_convert` 支持 `fun-asr` / Qwen Omni 听音；中间产物会进入原始输出弹窗：
  - `recognizedMandarinText`
  - `convertedDialectText`
  - `lexiconMatches`
  - `conversionWarnings`
- 支持 Prompt override 与生成参数 override（留空时使用后端 defaults）。
- 闽南语助手 options 不提供并发数配置（DataBaker 并发配置保持独立）。

## 三项质检口径

- 闽南语助手默认执行“三项预测质检”：
  - 说话人书写（性别、年龄）
  - 闽南语内容（第一行）
  - 普通话文本（第二行）
- 基础信息不再新增左侧独立大卡片，避免空白占位；说话人建议直接插入平台原生“说话人属性”表单项。
- 右侧 AI 面板保留总结论与三项质检结果，不承载左侧大摘要框。
- 说话人属性采集优先读取 `annotateDetailInfo` 响应中的 `base_speak + mark_info[].speak_people`，DOM fallback 仅读取已选 radio（`.el-radio.is-checked` / `aria-checked=true`）。
- 不再通过文本包含“男/女/年龄段”推断当前选中值，避免误取。

## 行内推荐与填入

- AI 结果返回后，会在对应平台文本行下方插入极简行内推荐块：
  - 正确：仅显示 `正确`。
  - 需改：显示差异高亮建议文本 + `填入本行` 按钮（长文本降级为纯建议文本）。
- “填入本行”只写入当前行 `contenteditable` 文本框，并触发 `input/change`；不自动保存、不自动提交。
- 新增 `全部填入AI推荐`：仅在 AI 完成且存在“需修改项”时显示，自动填入性别/年龄/闽南语行/普通话行中的可改项，不自动保存/提交。
- 行内建议与说话人建议采用“按 task 幂等更新”，同任务内仅更新文本和按钮状态，避免 hover 期间反复销毁重建导致闪烁。

## 说话人建议插入

- 直接插入 `speaker-attributes` 表单：
  - 在 `label=性别` 的 `.el-form-item` 下追加建议块。
  - 在 `label=年龄` 的 `.el-form-item` 下追加建议块。
- 正确时显示 `AI建议：正确`，不显示按钮。
- 需改时显示 `AI建议：<建议值>`，并显示 `填入性别` / `填入年龄` 按钮；只点击真实 radio，不绕过 disabled。

## 原始输出查看

- 新增“显示 AI 原始输出”按钮，弹窗展示：
  - 后端返回的脱敏 raw 调试信息（如 `rawAiDebug/rawModelText/rawJson`）。
  - 当前面板使用的归一化结果（`normalizedResult`）。
- 弹窗提供复制按钮；内容会做脱敏处理，不显示完整签名 URL、token、cookie、authorization。

## 右侧折叠稳定性

- 右侧三块详情（说话人属性/闽南语内容/普通话文本）使用自定义折叠区，不依赖原生 `<details>`。
- 折叠状态按 `taskItemId + section` 维度记忆；刷新采集或 observer 回调后会恢复展开状态，避免“点击后自动收回”。
- 右侧“闽南语内容/普通话文本”详情新增原文与建议的差异对比视图（字符级 LCS，超过 500 字自动降级）。

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 与客家话助手并行规则

- 两个助手同时启用时，各自挂载独立结果区，不互相覆盖。
- 两个助手只共享平台采集能力，不共享面板 DOM、快捷键配置和面板高度 key。
