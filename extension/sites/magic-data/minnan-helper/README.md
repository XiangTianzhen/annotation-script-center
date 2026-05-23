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
- `two_stage` 听音模型支持 `fun-asr` 或 Qwen Omni；`omni_single` 走 Qwen Omni 单模型。
- 支持 Prompt override 与生成参数 override（留空时使用后端 defaults）。

## 三项质检口径

- 闽南语助手默认执行“三项预测质检”：
  - 说话人书写（性别、年龄）
  - 闽南语内容（第一行）
  - 普通话文本（第二行）
- 面板左侧显示基础信息（当前条摘要、说话人属性、平台文本）；右侧显示 AI 三项质检结果与操作按钮。
- 说话人属性采集优先读取 `annotateDetailInfo` 响应中的 `base_speak + mark_info[].speak_people`，DOM fallback 仅读取已选 radio（`.el-radio.is-checked` / `aria-checked=true`）。
- 不再通过文本包含“男/女/年龄段”推断当前选中值，避免误取。

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 与客家话助手并行规则

- 两个助手同时启用时，各自挂载独立结果区，不互相覆盖。
- 两个助手只共享平台采集能力，不共享面板 DOM、快捷键配置和面板高度 key。
