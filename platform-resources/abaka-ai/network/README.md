# Abaka AI Task 页面公共网络索引

## 目录定位

本目录维护 Task17、Task21 都可复用的 Abaka AI Task 页面网络资料。Task21 `same_font` 专属保存结构不放在这里，维护在 `../task21/network/08-label-save-labels.md`。

## 公共请求目录

| 目录 | 内容 |
| --- | --- |
| `task-page/` | Data 页、`/items` 初始化、领取、放弃、跳过、送审、语言、资源等公共请求。 |
| `common/` | 状态 Tab、Skipped / Dropped、Recovery、标注送审后状态、内审只读边界。 |

## 任务项目入口

- Task21：`../task21/README.md`
- Task17：`../task17/README.md`

## 维护规则

- Task17 和 Task21 都能复用的 endpoint 放在本目录。
- 任务字段、表单控件、专项标签结构放到具体任务目录。
- 请求体和响应体只写脱敏结构摘要，不记录完整响应、完整资源 URL、账号、cookie、token 或 authorization。
