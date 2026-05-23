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
- 基础信息不再放在右侧 AI 面板内部，而是挂载到页面左侧“说话人属性”下方（独立 side info 区域）。
- 右侧 AI 面板只保留三项质检结果与操作按钮。
- 基础信息摘要不展示“预计金额”。
- 说话人属性采集优先读取 `annotateDetailInfo` 响应中的 `base_speak + mark_info[].speak_people`，DOM fallback 仅读取已选 radio（`.el-radio.is-checked` / `aria-checked=true`）。
- 不再通过文本包含“男/女/年龄段”推断当前选中值，避免误取。

## 行内推荐与填入

- AI 结果返回后，会在对应平台文本行下方插入行内推荐块：
  - 第一行（闽南语）显示闽南语推荐和“填入本行”按钮。
  - 第二行（普通话）显示普通话推荐和“填入本行”按钮。
- “填入本行”只写入当前行 `contenteditable` 文本框，并触发 `input/change`；不自动保存、不自动提交。
- 右侧面板不再提供“填入第一行 / 填入第二行”按钮。

## 原始输出查看

- 新增“显示 AI 原始输出”按钮，弹窗展示：
  - 后端返回的脱敏 raw 调试信息（如 `rawAiDebug/rawModelText/rawJson`）。
  - 当前面板使用的归一化结果（`normalizedResult`）。
- 弹窗提供复制按钮；内容会做脱敏处理，不显示完整签名 URL、token、cookie、authorization。

## 行为边界

- 只允许用户主动点击按钮或快捷键触发 AI。
- 只给建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 与客家话助手并行规则

- 两个助手同时启用时，各自挂载独立结果区，不互相覆盖。
- 两个助手只共享平台采集能力，不共享面板 DOM、快捷键配置和面板高度 key。
