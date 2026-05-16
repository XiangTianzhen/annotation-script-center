# Abaka AI Task21 页面结构

## 目录定位

本文只记录 Task21 相对 Abaka AI Task 页面公共结构的差异。公共页面壳、Data 页、状态 Tab、分页、角色切换、资源区和右侧条目列表见 `../page-structure.md`。

## Task21 业务识别

| 字段 | 样例 |
| --- | --- |
| 任务号 / Project ID | `#HM_395_v2` |
| 名称 / Name | `Task21` |
| 工具类型 / Tool Type | `MMAT` |
| 所属团队 / Team | `abaka.ai` |
| 创建者 / Owner | `Anniejln` |
| 创建时间 / Created Time | `04-30-2026 22:01:33` |

这些值只用于人工核对，不作为脚本唯一硬编码依据。

## same_font 主标注结构

| 字段 | 控件类型 | 文案 / 值 | DOM 定位策略 | Network |
| --- | --- | --- | --- | --- |
| `same_font` | custom radio | `true`、`false`、`unsure`、`error`、`same underlying font+artistic effect` | 标题 `same_font` + 后继 `radio-container` | `network/08-label-save-labels.md` |
| `image_b_texts_removed` | radio + rich text editor | `specify`、`true`、`null` | `same_font=true` 后出现的派生字段块 | `network/08-label-save-labels.md` |
| `other_changes` | radio + textarea | `specify`、`unsure`、`null` | 后继字段块 + textarea | `network/08-label-save-labels.md` |

Task21 快捷键联动（运行时）：

- `same_font=true` 或 `same_font=same underlying font+artistic effect` 快捷键命中后，默认会确保：
  - `image_b_texts_removed=specify`
  - `other_changes=specify`
- ensure 行为为幂等：`specify` 已选中时不会重复点击，不会被取消。
- 该联动仅通过页面 DOM 点击触发，不直接调用保存接口。
- 若页面后续触发 `save-labels`，属于平台自身监听点击后的行为。

Task21 按钮快捷键（运行时）：

- `6`：仅点击页面真实“暂存 / Save / Stash”按钮，不直接调用 `save-labels`。
- `7`：仅点击页面真实“送审 / Submit / Submit Review”按钮，不直接调用提交接口，也不自动确认二次弹窗。
- `7` 会在疑似标注内审环境下被阻止；`6/7` 在 `viewMode=true` 查看页不执行。

## 资源字段

- `image_a`
- `image_b`
- `image_b_removed`
- 多个 `iframe[srcdoc]` 文本预览

完整资源 URL 不记录；资源加载公共规则见 `../network/task-page/17-resource-files.md`。

## 后续脚本定位建议

- 先用 `/items` route 与 `taskId` 判断 Task21 工作页。
- 再用 `same_font` 标题确认专项标注区。
- 字段保存只监听 `/api/v2/label/save-labels`，不得主动写入。
