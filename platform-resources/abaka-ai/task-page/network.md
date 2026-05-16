# Abaka AI Task21 网络请求概览（脱敏）

## 目录定位

本文件是 Task21 Network 入口和概要索引。详细请求已经按 LabelX 快判风格拆分到 `network/` 目录：

- `network/README.md`：Task21 网络采集索引。
- `network/01-data-page-search-template.md` 到 `network/17-resource-files.md`：按页面链路、动作和资源分类的独立记录。
- `network/pending-capture.md`：仍待补采的接口和异常路径。
- `network/next-session-handoff.md`：后续接续采集说明。

平台通用初始化、空间、权限和任务接口仍维护在 [../network.md](../network.md)。

## 采集范围

- 采集日期：2026-05-16。
- 采集方式：Google Chrome DevTools MCP、临时脱敏 XHR/fetch 监听器、Network 面板结构观察。
- 主页面：`/task-v2/data-item`、`/items`。
- 主目标：Task21。
- 对比目标：Task17-9 / Task17-8，只读对比，不做状态变更。

## 脱敏规则

- 不记录账号、密码、cookie、authorization、token、access_token、refresh_token、secret、signature、credential、session。
- 不记录完整图片、音频、文件、下载、对象存储、`src`、`href`、`url`、`path` 值。
- 真实 ID 使用 `{taskId}`、`{itemId}`、`{nodeId}`、`{selectId}`、`{roleId}`、`{batchId}` 或 `<REDACTED_*>`。
- 请求体和响应体只记录字段结构、字段类型、数组长度、状态码、业务 `code`、`success`、公开 Toast / 校验提示。
- 不提交原始 HAR、JSON、截图、CSV、完整响应体或完整资源 URL。

## 简短请求索引

| 类别 | 主要接口 | 详细文档 |
| --- | --- | --- |
| Data 页筛选模板 | `/api/v2/item/get-item-search-template-list` | `network/01-data-page-search-template.md` |
| 批次列表和筛选 | `/api/v2/package/get-package-list`、`/api/v2//package/get-package-filter-list` | `network/02-data-page-package-list.md` |
| 条目列表 | `/api/v2/item/get-task-item-list-lite`、`/api/v2/item/get-item-list-lite` | `network/03-data-page-item-list.md` |
| 条目选择帧数 | `/api/v2/item/get-frame-count` | `network/04-data-page-selection-frame-count.md` |
| 查看页初始化 | `get-view-item-permission`、`get-item-info`、`find-labels` 等 | `network/05-items-view-init.md` |
| 标注页初始化 | `check-operate-item-permission`、`get-item-info`、`find-labels` 等 | `network/06-items-label-init.md` |
| 工作锁定 | `/api/v2/item/work` | `network/07-item-work-lock.md` |
| 标签保存 / 暂存 | `/api/v2/label/save-labels` | `network/08-label-save-labels.md`、`network/12-stash-save.md` |
| 放弃 | `/api/v2/item/abandon-item` | `network/09-abandon-item.md` |
| 跳过 | `/api/v2/item/skip-item` | `network/10-skip-item.md` |
| 送审 / 提交 | 前端校验阻断，提交接口待补 | `network/11-submit-review.md` |
| 恢复 | 待补 | `network/13-restore-item.md` |
| 领取标注 | `/api/v2/item/receive-item` | `network/14-claim-label.md` |
| 领取审核 | `/api/v2/item/receive-item` | `network/15-claim-review.md` |
| 语言切换 | 本轮未确认独立接口 | `network/16-language-switch.md` |
| 资源文件 | 静态 assets、`.webp` 图片、captcha 图片 | `network/17-resource-files.md` |

## 状态变更边界

已确认会改变状态或任务占用的接口：

- `/api/v2/item/receive-item`
- `/api/v2/item/work`
- `/api/v2/label/save-labels`
- `/api/v2/item/abandon-item`
- `/api/v2/item/skip-item`

这些接口后续扩展只能被动监听。任何领取、保存、暂存、放弃、跳过、送审、恢复都必须人工确认，不能由 content script 静默触发。
