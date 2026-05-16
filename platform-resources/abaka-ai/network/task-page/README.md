# Abaka AI Task 页面公共网络采集索引

## 目录定位

本目录是 Abaka AI Task 页面公共网络请求资料的主维护位置，按 LabelX 快判 `network/` 的方式维护为单层编号文档。Task17、Task21 都能复用的 Data 页、`/items` 工作页、领取、暂存、放弃、跳过、送审、语言切换、资源加载、状态 Tab、Skipped / Dropped / Recovery 和内审只读边界都放在这里。

Task21 `same_font` 专项保存结构不放在本目录，维护在 `../../task21/network/08-label-save-labels.md`。

## 当前阶段

本目录记录通过 Google Chrome DevTools MCP 采集到的 Abaka AI Task 页面公共请求结构。当前阶段已覆盖：

- Data 页筛选模板、批次列表、条目列表。
- 单选、多选、跨页选择后的帧数统计。
- `/items` 查看页初始化。
- `/items` 标注页初始化。
- 工作开始 / 锁定。
- 暂存按钮保存链路。
- 放弃、跳过、送审前端校验和送审成功链路。
- 领取标注、领取审核，以及 Task17 领取审核空池失败响应。
- 语言切换观察。
- 静态 assets、captcha、对象存储图片等资源加载规则。
- Overview / Todo / Skipped / Dropped 状态 Tab。
- Skipped / Dropped 列表和恢复链路。
- 标注内审角色只读观察，不提交、不通过、不驳回。

当前仍未覆盖或不建议主动采集：

- Task21 标注节点下的领取标注空池失败响应。
- 内审 Reject / Label / Pass 流转接口，当前边界禁止采集。
- 批量恢复、批量送审、批量领取等跨页状态变更。
- 保存失败、提交失败、权限不足等异常路径。

## 来源页面

- Task21 Data 页：`/task-v2/data-item?taskId={taskId}&vm={all|batch}&dm={mode}`
- Task21 `/items` 标注页：`/items?taskId={taskId}&itemId={itemId}&nodeId={nodeId}`
- Task21 `/items` 查看页：`/items?taskId={taskId}&itemId={itemId}&viewMode=true&nodeId={nodeId}`
- Task21 内审角色页：`/task-v2/data-item?taskId={taskId}&role={reviewRoleId}`
- Task17 Data 页：`/task-v2/data-item?taskId={task17Id}&vm=all&dm=all`
- 采集方式：打开已登录测试账号页面，使用 DevTools Network 与临时脱敏 XHR/fetch 监听器。
- 操作限制：Task17 默认只读；本轮仅按用户授权点击一次 `领取审核` 捕获空池失败响应。

## 用户同步操作步骤

1. 用户提供 Task21 / Task17 页面 URL，并说明测试账号已登录。
2. 用户授权在 Task21 测试数据内做单条状态变更采集。
3. Agent 每测一个动作前清空 Network，只记录脱敏结构摘要。
4. Agent 测试 Task21 Data 页选择、领取、查看、标注、暂存、放弃、跳过、送审、恢复和语言切换。
5. Agent 对 Task17 仅测试 `领取审核` 空池失败响应；出现验证组件后停止。
6. Agent 不导出 HAR、JSON、截图、CSV、完整响应或完整资源 URL。

## 文件列表

| 文件 | 请求 / 行为 | 说明 |
| --- | --- | --- |
| `01-data-page-search-template.md` | `/api/v2/item/get-item-search-template-list` | Data 页筛选模板 |
| `02-data-page-package-list.md` | `/api/v2/package/get-package-list` 等 | 批次列表和筛选 |
| `03-data-page-item-list.md` | `/api/v2/item/get-task-item-list-lite` 等 | 条目列表 |
| `04-data-page-selection-frame-count.md` | `/api/v2/item/get-frame-count` | 单选 / 多选 / 跨页选择帧数 |
| `05-items-view-init.md` | 查看页初始化链 | 只读查看页 |
| `06-items-label-init.md` | 标注页初始化链 | 可编辑工作页 |
| `07-item-work-lock.md` | `/api/v2/item/work` | 工作开始 / 锁定 |
| `09-abandon-item.md` | `/api/v2/item/abandon-item` | Drop / 放弃 |
| `10-skip-item.md` | `/api/v2/item/skip-item` | Skip / 跳过 |
| `11-submit-review.md` | `/api/v2/item/submit-item` / 前端校验阻断 | Submit / 送审 |
| `12-stash-save.md` | `/api/v2/label/save-labels` | Save / 暂存按钮 |
| `13-restore-item.md` | `recover-item` / `receive-item` | 恢复入口概览 |
| `14-claim-label.md` | `/api/v2/item/receive-item` | 领取标注 |
| `15-claim-review.md` | `/api/v2/item/receive-item` | 领取审核 |
| `16-language-switch.md` | 语言切换观察 | 未观察到独立偏好保存接口 |
| `17-resource-files.md` | assets / object storage / captcha | 资源文件 |
| `18-status-tabs.md` | 状态 Tab | Overview / Todo / Skipped / Dropped |
| `19-skipped-list.md` | Skipped 列表 | 已跳过条目列表 |
| `20-dropped-list.md` | Dropped 列表 | 已放弃条目列表 |
| `21-restore-skipped-item.md` | Skipped 重新进入标注 | `receive-item` 重新领取 |
| `22-restore-dropped-item.md` | Dropped 恢复 | `recover-item` |
| `23-label-submit-success.md` | 标注权限送审成功 | `save-labels -> submit-item` |
| `24-review-role-no-submit.md` | 内审只读观察 | 禁止提交 / 通过 / 驳回 |
| `status-flows.md` | 状态流转索引 | 状态 Tab / Skipped / Dropped / Recovery 摘要 |
| `pending-capture.md` | 待补 | 缺口清单 |
| `next-session-handoff.md` | 接续说明 | 下次采集上下文 |

说明：编号 `08` 留给 Task21 专项 `save-labels` 结构，详见 `../../task21/network/08-label-save-labels.md`。

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
- `Save / 暂存`：`save-labels`，本轮未观察到页面跳转。
- `Drop / 放弃`：空变更 `save-labels` -> `abandon-item` -> `receive-item` -> 下一条 `/items` 初始化。
- `Skip / 跳过`：空变更 `save-labels` -> `skip-item` -> `receive-item` -> 下一条 `/items` 初始化。
- `Submit / 送审`：same_font 为空时前端校验阻断；same_font 最小有效值填写后触发 `save-labels -> submit-item`，成功后 Data 页显示 `Labeled / Pending Review`。
- `Dropped Recovery`：`Dropped` Tab 选中单条 -> `Recovery` -> 确认弹窗 -> `recover-item` -> 刷新 Dropped 列表。
- `Skipped` 重新进入标注：`Skipped` Tab 选中单条 -> `Label: 1` -> `receive-item` -> `/items` 标注页 -> `work`，未观察到独立 `recover-item`。
- `Review role`：仅观察列表、Tab 和 `View` 查看页初始化；未点击 `Review: 1`、`Pass`、`Reject`、`Label` 或提交类动作。

## 脱敏规则

- 不记录完整 cookie、token、authorization、session、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL 或 base64 data URL。
- 不记录测试账号、人员姓名、客户原始文本内容。
- 所有真实 ID 统一写成 `{taskId}`、`{itemId}`、`{nodeId}`、`{roleId}`、`{selectId}` 或 `<REDACTED_*>`。
- 请求体和响应体只保留字段名、类型、数组长度、状态枚举和结构路径。

## Content Script 总体建议

- 默认只被动监听 XHR/fetch。
- 不主动调用保存、提交、领取、放弃、跳过、送审、恢复接口。
- 状态变更必须人工确认。
- AI 建议只辅助展示，不自动保存或提交。
- 对 `receive-item`、`work`、`save-labels`、`abandon-item`、`skip-item`、`submit-item`、`recover-item` 只记录脱敏结构和结果，不记录完整 payload。
