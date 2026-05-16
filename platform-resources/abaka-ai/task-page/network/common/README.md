# Abaka AI Task 页面公共网络采集索引

## 目录定位

本目录维护 Abaka AI Task 页面公共状态能力，不限定于 Task21 的 `same_font` 标注字段。Skipped / Dropped / Recovery / 状态 Tab / 标注送审后的 Data 页状态变化都放在这里。

Task21 `same_font` 保存、派生字段和暂存仍维护在上级编号文档，例如 `../08-label-save-labels.md`。

## 当前覆盖

| 文件 | 能力 | 当前状态 |
| --- | --- | --- |
| `01-status-tabs.md` | Overview / Todo / Skipped / Dropped / Label 状态 Tab | 已采集 English 环境主要 Tab |
| `02-skipped-list.md` | Skipped 列表加载 | 已采集 |
| `03-dropped-list.md` | Dropped 列表加载 | 已采集 |
| `04-restore-skipped-item.md` | Skipped 条目恢复 / 重新进入标注 | 已采集，未发现独立 `recover-item` |
| `05-restore-dropped-item.md` | Dropped 条目恢复 | 已采集，确认 `recover-item` |
| `06-label-submit-success.md` | 标注权限送审成功 | 已采集 |
| `07-review-role-no-submit.md` | 标注内审角色只读观察 | 已采集，未提交 |

## 脱敏规则

- 不记录 cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL、base64 data URL。
- 不记录测试账号、人员姓名、客户原始文本内容。
- 所有真实 ID 使用 `{taskId}`、`{itemId}`、`{nodeId}`、`{roleId}`、`{selectId}`、`{batchId}` 或 `<REDACTED_*>`。
- 请求体和响应体只保留字段名、类型、数组长度、状态枚举和结构路径。

## Content Script 总体建议

- 可以被动监听这些接口并记录脱敏结构。
- 不主动调用 `receive-item`、`recover-item`、`save-labels`、`submit-item`。
- 状态变更必须由用户在平台页面人工确认。
- Skipped 重新进入标注、Dropped Recovery、Submit 都属于高风险动作，后续扩展不得静默执行。
