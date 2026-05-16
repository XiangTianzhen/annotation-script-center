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
