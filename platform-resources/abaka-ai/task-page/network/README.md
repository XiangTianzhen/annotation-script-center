# Abaka AI Task21 网络采集索引

## 目录定位

本目录是 Abaka AI Task21 网络请求资料主维护位置。上一级 `task-page/network.md` 只保留概览和跳转入口；后续新增或修正请求结构时优先更新本目录。

## 当前阶段

本目录记录通过 Google Chrome DevTools MCP 采集到的 Task21 页面和动作请求结构。当前已覆盖：

- 页面初始化。
- Data 页列表和批次视图。
- 角色切换。
- 条目单选 / 多选。
- 查看页初始化。
- 标注页初始化。
- 工作锁定。
- same_font 手动暂存保存。
- 放弃。
- 跳过。
- 送审前端校验阻断。
- 领取标注。
- 领取审核。
- 资源文件加载。
- Task17 只读对比。

本轮未完整覆盖：

- 送审成功请求。
- 恢复已放弃 / 已跳过条目。
- 中文环境下重新测试所有按钮。
- 语言切换是否有独立接口。
- 统计分析、工作流、成员配置页专项接口。

## 来源页面

- Task21 全部数据页：`/task-v2/data-item?taskId={taskId}&vm=all&dm=all`
- Task21 批次页：`/task-v2/data-item?taskId={taskId}&vm=batch&dm=all&batchId={batchId}`
- Task21 标注页：`/items?version=latest&taskId={taskId}&itemId={itemId}&nodeId={nodeId}`
- Task21 查看页：`/items?version=latest&taskId={taskId}&itemId={itemId}&selectIds={selectId}&viewMode=true&nodeId={nodeId}`
- Task21 标注内审角色页：`/task-v2/data-item?taskId={taskId}&vm=all&dm=all&role={reviewRoleId}`
- Task17 对比页：`/task-v2/data-item?taskId={task17Id}&vm=all&dm=all`，只读对比。

## 用户同步操作步骤

1. 用户已授权在 Abaka AI 测试账号、Task21 测试数据内执行单条状态变更采集。
2. Agent 使用 DevTools MCP 打开已登录页面并确认当前处于 Task21。
3. 在 Data 页点击 `Claim Label`，采集领取标注和进入 `/items` 标注页链路。
4. 在标注页依次测试 same_font、派生字段、`Save`、`Drop`、`Skip`、`Submit`。
5. 回到 Data 页测试单选和多选 checkbox。
6. 打开内审角色页，点击 `Claim Review`，采集领取审核和进入内审 `/items` 链路。
7. 仅记录脱敏结构，不保存原始 HAR、JSON、截图、CSV、完整响应或完整资源 URL。

## 文件列表

| 文件 | 请求 / 行为 | 说明 |
| --- | --- | --- |
| `01-data-page-search-template.md` | `/api/v2/item/get-item-search-template-list` | Data 页筛选模板 |
| `02-data-page-package-list.md` | `/api/v2/package/get-package-list` 等 | 批次列表和筛选 |
| `03-data-page-item-list.md` | `/api/v2/item/get-task-item-list-lite` 等 | 条目列表 |
| `04-data-page-selection-frame-count.md` | `/api/v2/item/get-frame-count` | 单选 / 多选条目帧数 |
| `05-items-view-init.md` | 查看页初始化链 | 只读查看页 |
| `06-items-label-init.md` | 标注页初始化链 | 可编辑工作页 |
| `07-item-work-lock.md` | `/api/v2/item/work` | 工作开始 / 锁定 |
| `08-label-save-labels.md` | `/api/v2/label/save-labels` | same_font 和派生字段保存 |
| `09-abandon-item.md` | `/api/v2/item/abandon-item` | Drop / 放弃 |
| `10-skip-item.md` | `/api/v2/item/skip-item` | Skip / 跳过 |
| `11-submit-review.md` | 无新增请求 / 待补提交接口 | Submit / 送审 |
| `12-stash-save.md` | `/api/v2/label/save-labels` | Save / 暂存 |
| `13-restore-item.md` | 待补 | 恢复 |
| `14-claim-label.md` | `/api/v2/item/receive-item` | 领取标注 |
| `15-claim-review.md` | `/api/v2/item/receive-item` | 领取审核 |
| `16-language-switch.md` | 待补 | 语言切换 |
| `17-resource-files.md` | assets / object storage / captcha | 资源文件 |
| `pending-capture.md` | 待补 | 缺口清单 |
| `next-session-handoff.md` | 接续说明 | 下次采集上下文 |

## 初始化请求序列

Data 页常见加载顺序：

1. `POST /api/auth-center/user/user-info`
2. `POST /api/v2/task/get/task-info`
3. `POST /api/v2/workflow/get/workflow-info`
4. `POST /api/v2/task/get/permission`
5. `POST /api/v2/task/check-agreement-status`
6. `POST /api/v2/item/get-item-search-template-list`
7. `POST /api/v2//package/get-package-filter-list`
8. `POST /api/v2//import/get-import-filter-list`
9. `POST /api/v2/item/get-item-handlers`
10. `POST /api/v2/item/get-node-operator-info`
11. `POST /api/v2/item/get-task-item-list-lite`

`/items` 工作页常见加载顺序：

1. `POST /api/v2/item/get-item-history`
2. `POST /api/v2//item/check-operate-item-permission`
3. `POST /api/v2/item/get-item-info`
4. `POST /api/v2/item/work`
5. `POST /api/v2/label/find-labels`
6. `POST /api/v2/label/find-issues`
7. `POST /api/v2/label/find-label-records`
8. `POST /api/v2/label/get-ai-check-result`
9. `POST /api/v2/item/find-invalidate-frame/`
10. `POST /api/v2/item/sampling/get-frames-data`
11. `POST /api/v2/item/find-items-base-info`

## 状态变更请求链路

- `Claim Label` / `Claim Review`：`receive-item` -> `/items` 初始化 -> `work`。
- `Save`：`save-labels`，本轮未观察到页面跳转。
- `Drop`：空变更 `save-labels` -> `abandon-item` -> `receive-item` -> 下一条 `/items` 初始化。
- `Skip`：空变更 `save-labels` -> `skip-item` -> `receive-item` -> 下一条 `/items` 初始化。
- `Submit`：当前未填 same_font 时前端校验阻断，无新增业务请求。

## 脱敏规则

- 不记录完整 cookie、token、authorization、session、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL 或 base64 data URL。
- 不记录测试账号、人员姓名、客户原始文本内容。
- 所有真实 ID 统一写成 `{taskId}`、`{itemId}`、`{nodeId}`、`{roleId}`、`{selectId}` 或 `<REDACTED_*>`。
- 保存请求里如果包含标签内容，只保留字段名、枚举值和结构。

## Content Script 总体建议

- 默认只被动监听 XHR/fetch。
- 不主动调用保存、提交、领取、放弃、跳过、送审、恢复接口。
- 状态变更必须人工确认。
- AI 建议只辅助展示，不自动保存或提交。
- 对 `receive-item`、`work`、`save-labels`、`abandon-item`、`skip-item` 只记录脱敏结构和结果，不记录完整 payload。
