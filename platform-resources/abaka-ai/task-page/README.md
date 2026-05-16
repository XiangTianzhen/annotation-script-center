# Abaka AI Task 页面平台资料

## 采集说明

- 采集时间：2026-05-16。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本、Network 面板结构观察。
- 采集账号：Abaka AI 测试账号，账号信息不记录。
- 主目标：`Task21`（`#HM_395_v2`，工具类型 `MMAT`）。
- 对比目标：`Task17-9 / Task17-8`，仅查看公共结构与差异。
- 用户授权：Task21 测试数据范围内允许单条领取/标注/查看/放弃/跳过/送审类测试；本轮实际触发 same_font 单选、自动保存和放弃。
- 产物边界：不提交原始 HAR、JSON、截图、CSV、完整接口响应、完整资源 URL、cookie、token、authorization、password、secret、signature。

## 页面路由

| 页面 | URL 模式 | 关键 query keys | 说明 | 采集状态 |
| --- | --- | --- | --- | --- |
| 登录页 | `/login` | 无 | 用户手动登录入口 | 已观察入口，不记录登录数据。 |
| 动态任务列表 | `/data-task/v2` | 分页/搜索由接口 body 承载 | Dynamic Projects 列表，Task21 行来源 | 已采集。 |
| Task21 全部数据 | `/task-v2/data-item` | `taskId`、`vm`、`dm` | 全部数据列表 | 已深度采集。 |
| Task21 批次页 | `/task-v2/data-item` | `taskId`、`vm=batch`、`dm`、`batchId` | 批次侧栏 + 条目列表 | 已采集。 |
| Task21 标注角色页 | `/task-v2/data-item` | `taskId`、`role={roleId}` | 标注节点列表，按钮为 Claim Label | 已采集。 |
| Task21 内审角色页 | `/task-v2/data-item` | `taskId`、`role={roleId}` | 内审节点列表，按钮为 Claim Review | 已采集。 |
| Task21 查看页 | `/items` | `version`、`taskId`、`vm`、`dm`、`role`、`itemId`、`selectIds`、`viewMode`、`nodeId` | 只读查看工作页 | 已采集。 |
| Task21 标注页 | `/items` | `version`、`taskId`、`vm`、`dm`、`role`、`itemId`、`selectIds`、`nodeId` | 可编辑标注工作页 | 已采集并单条测试。 |
| Task17 列表页 | `/task-v2/data-item` | `taskId`、`vm`、`dm` | 对比列表 | 已只读采集。 |
| Task17 查看页 | `/items` | `taskId`、多个 `selectIds`、`viewMode`、`nodeId` | 对比工作页 | 已只读采集。 |

ID 模式化规则：`{taskId}`、`{roleId}`、`{nodeId}`、`{batchId}`、`{itemId}`、`{selectId}`。

## 接口清单

| 接口用途 | method | pathname 模式 | queryKeys | requestShape | responseShape | 列表字段 | 分页字段 | 触发方式 | 危险等级 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户信息 | POST | `/api/auth-center/user/user-info` | 无 | `{}` | `{ code, data: { mfa, username, platform, spaceRole, nickname, email, other, space, ... } }` | `data.space.users` | 无 | 登录后自然请求 | safe-load | 响应含用户/成员结构，真实值不落档。 |
| 权限模块树 | GET | `/api/permission/module-tree/space` | 无 | 无 | `{ code, data: [{ title, key, router, buttons }] }` | `data` | 无 | 登录后自然请求 | safe-load | 菜单权限。 |
| 空间合约 | GET | `/api/contract/space` | 无 | 无 | `{ code, data: { current, tool, module, models, scripts, exportScripts } }` | `data.tool`, `data.module` | `data.current` | 登录后自然请求 | safe-load | 空间能力配置。 |
| 空间存储 | POST | `/api/auth-center/space/storage` | 无 | `{}` | `{ code, data: { type, bucket, private, expiration, ak, sk, token, end_point, storageType } }` | 无 | 无 | 登录后自然请求 | safe-load | `ak/sk/token` 必须脱敏。 |
| 空间列表 | POST | `/api/auth-center/space/list` | 无 | `{ type, relation, name }` | `{ code, data: [{ users, name, ownerId, type, domainId, points }] }` | `data`, `data[].users` | `data[].points.total/current` | 详情页加载 | safe-load | 成员字段只记录结构。 |
| 消息列表 | GET | `/api/message/list` | 无 | 无 | `{ code, data: [] }` | `data` | 无 | 周期轮询 | safe-load | 与业务动作无关。 |
| 任务基础列表 | POST | `/api/v2/task/get/task-basic-info-list` | 无 | `{ pageNum, pageSize, search, taskStatus }` | `{ code, data: { total, data: [taskBasic] } }` | `data.data` | `data.total` | 任务/详情页加载 | safe-load | Task21 行与任务切换来源。 |
| Task 详情 | POST | `/api/v2/task/get/task-info` | 无 | `{ taskId }` | `{ code, data: { status, type, name, domainId, setting, agreement, createdAt, updatedAt } }` | `data.setting.labelConfig`, `data.setting.exportScripts` | 无 | 进入任务和 /items | safe-load | `toolSetting.layout` 是页面布局来源。 |
| Workflow | POST | `/api/v2/workflow/get/workflow-info` | 无 | `{ taskId }` | `{ code, data: { taskId, nodes, stashNodes, packageMode, config, delNodes } }` | `data.nodes` | 无 | 进入任务和 /items | safe-load | 节点内包含 submit/move/skip 配置。 |
| 任务权限 | POST | `/api/v2/task/get/permission` | 无 | `{ taskId }` | `{ code, data: { taskId, workflowId, nodes, taskRole } }` | `data.nodes` | 无 | 进入任务 | safe-load | 决定按钮和角色可见性。 |
| 协议状态 | POST | `/api/v2/task/check-agreement-status` | 无 | `{ taskId }` | `{ code, data: boolean }` | 无 | 无 | 进入任务和 /items | safe-load | 页面加载自然请求。 |
| 搜索模板 | POST | `/api/v2/item/get-item-search-template-list` | 无 | `{ taskId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | safe-load | 当前为空。 |
| 批次列表 | POST | `/api/v2/package/get-package-list` | 无 | `{ taskId, pageSize, pageNum, nodeId }` | `{ code, data: { data: [package], total } }` | `data.data` | `data.total` | 批次视图加载 | safe-load | 批次侧栏。 |
| 批次筛选 | POST | `/api/v2//package/get-package-filter-list` | 无 | `{ taskId }` | `{ code, data: [{ _id, domainId, name }] }` | `data` | 无 | Data 页加载 | safe-load | 实采路径含双斜杠。 |
| 导入筛选 | POST | `/api/v2//import/get-import-filter-list` | 无 | `{ taskId, packageId? }` | `{ code, data: [{ _id, name }] }` | `data` | 无 | Data 页加载 | safe-load | 实采路径含双斜杠。 |
| 条目处理人 | POST | `/api/v2/item/get-item-handlers` | 无 | `{ taskId }` | `{ code, data: { labelers, checkers } }` | `data.labelers[].users`, `data.checkers[].users` | 无 | Data 页加载 | safe-load | 成员字段脱敏。 |
| 节点操作人 | POST | `/api/v2/item/get-node-operator-info` | 无 | `{ taskId, nodeId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | safe-load | 当前为空。 |
| 条目列表 | POST | `/api/v2/item/get-task-item-list-lite` 或 `/api/v2/item/get-item-list-lite` | 无 | `{ taskId, pageNum, pageSize, search, packageIds?, nodeId?, role? }` | `{ code, data: { total, data: [item] } }` | `data.data` | `data.total` | 全部/批次/角色页加载 | safe-load | 视图不同路径略有差异。 |
| 条目详情 | POST | `/api/v2/item/get-item-detail` | 无 | `{ taskId, itemId/nodeId... }` | `{ code, data: object }` | 视响应而定 | 无 | Data 页自然请求 | safe-load | 只记录结构。 |
| 文件查找 | POST | `/api/v2/item/find-items-file` | 无 | `{ taskId, itemIds... }` | `{ code, data: [file] }` | `data` | 无 | Data 页自然请求 | resource | URL/file 字段脱敏。 |
| 条目历史 | POST | `/api/v2/item/get-item-history` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | safe-load | 查看/标注页公共接口。 |
| 查看权限 | POST | `/api/v2/item/get-view-item-permission` | 无 | `{ taskId, itemId/nodeId }` | `{ code, data: ... }` | 无 | 无 | viewMode 页加载 | safe-load | 只读查看页出现。 |
| 操作权限 | POST | `/api/v2//item/check-operate-item-permission` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 无 | 无 | /items 加载 | safe-load | 实采路径含双斜杠。 |
| 工作状态 | POST | `/api/v2/item/work` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 无 | 无 | 标注页加载 | state-change-test | 进入标注页自然触发工作状态。 |
| 标注数据 | POST | `/api/v2/label/find-labels` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [label] }` | `data` | 无 | /items 加载 | safe-load | same_font 数据来源之一。 |
| 问题数据 | POST | `/api/v2/label/find-issues` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [issue] }` | `data` | 无 | /items 加载 | safe-load | 问题/质检结构。 |
| 标注记录 | POST | `/api/v2/label/find-label-records` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [record] }` | `data` | 无 | /items 加载 | safe-load | 历史记录。 |
| AI 检查 | POST | `/api/v2/label/get-ai-check-result` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | safe-load | AI 结果结构。 |
| 无效帧 | POST | `/api/v2/item/find-invalidate-frame/` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | safe-load | 路径尾部带 `/`。 |
| 抽帧数据 | POST | `/api/v2/item/sampling/get-frames-data` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | safe-load | 帧/图片辅助数据。 |
| 右侧条目列表 | POST | `/api/v2/item/find-items-base-info` | 无 | `{ taskId, itemIds/selectIds }` | `{ code, data: [baseInfo] }` | `data` | 无 | /items 加载 | safe-load | 多条 selectIds 时返回多条。 |
| 选择帧数 | POST | `/api/v2/item/get-frame-count` | 无 | `{ taskId, itemIds: [string] }` | `{ code, data: { validCount, invalidCount } }` | 无 | 无 | 数据页单选条目 | safe-load | 选择后按钮变为 `标注：1条`。 |
| 自动保存 | POST | `/api/v2/label/save-labels` | 无 | `{ taskId, itemId, nodeId, labels/issues... }` | `{ code, data: ... }` | 视响应而定 | 无 | 点击 same_font 后自动触发 | state-change-test | 已在测试账号单条触发。 |
| 放弃条目 | POST | `/api/v2/item/abandon-item` | 无 | `{ taskId, itemId, nodeId, reason?/labels? }` | `{ code, data: ... }` | 无 | 无 | 点击 `放弃` | state-change-test | 已在测试账号单条触发，出现退出确认。 |
| 跳过条目 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 点击 `跳过` | danger-confirm | 本轮仅记录按钮。 |
| 送审/提交 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 点击 `送审` | danger-confirm | 本轮仅记录按钮。 |
| 资源文件 | GET | 对象存储 pathname 模式 | 可能有签名 query | 无 | `.webp/.png/.svg` 等 | 无 | 无 | 资源加载 | resource | 只记录类型、长度、扩展名。 |
| 语言切换 | 未发现独立接口 | 无 | 无 | 无 | 重新请求当前页面数据 | 无 | 无 | 用户菜单切换 English | safe-load | 文案更新后同类接口重新加载。 |
| Task17 对比 | POST/GET | 同 Task21 公共接口族 | 同上 | 同上 | 同上 | 同上 | 同上 | 只读查看 | safe-load | 未触发状态变更。 |

## Task21 数据模型摘要

### task

- 识别字段：`taskId`、`domainId`、`name`、`type`、`status`、`version`、`spaceIds`、`agreement`。
- Task21 公开识别：`#HM_395_v2`、`Task21`、`MMAT`。
- 不记录真实用户 ID、空间 ID、token、cookie。

### batch

- 字段结构：`_id`、`taskId`、`importId`、`status`、`domainId`、`limit`、`name`、`test`、`runtimeStatus`、`labelSpaceIds`、`nodeInfos`、`count`、`pushableCount`、`handleFlag`、`movePermission`。
- 实采可见批次：`批次_1`、`批次_2`。

### item

- 列表字段：`domainId`、`frames`、`invalidFrames`、`importRound`、`packageId`、`node`、`labelStatus`、`checkStatus`、`labeler`、`labelSpace`、`checker`、`checkSpace`、`operateTime`、`dataSource`。
- 右侧条目列表：`Item ID/条目号`、项目号前缀、条目计数。
- `selectIds` 支持单个或多个 query key。

### node / role

- `role` query 决定标注/内审角色视图。
- `nodeId` query 决定当前工作节点。
- 标注角色显示 `标注 / Label`、`领取标注 / Claim Label`。
- 内审角色显示 `标注内审`、`领取审核 / Claim Review`，表格增加 `Reviewer/Review Team`。

### viewMode

- `viewMode=true` 为只读查看页。
- 无 `viewMode` 且有 `nodeId/itemId/selectIds` 时进入标注工作页，页面可触发 `work`、自动保存和操作按钮。

## same_font 数据结构摘要

Task21 的主标注区以 `same_font` 为核心：

- 资源字段：
  - `image_a`
  - `image_b`
  - `image_b_removed`
  - iframe 文本预览
  - 资源类型：`.webp` 图片与 `iframe[srcdoc]` 文本块，完整 URL 不落档。
- 主字段：
  - `same_font`
  - 控件类型：custom radio
  - 选项：`true`、`false`、`unsure`、`error`
  - 说明项：`same underlying font+artistic effect`
- 派生字段：
  - `image_b_texts_removed`
  - `other_changes`
  - 控件组合：radio / specify / rich text editor / textarea
- 行为：
  - 点击 `true` 后 same_font 下方展开派生字段。
  - 点击后未见独立查询接口，但页面随后触发 `/api/v2/label/save-labels`。
  - 查看页字段禁用或不可编辑；标注页可编辑但会自动保存。

## 角色与节点

| 类型 | URL/query 规则 | 页面变化 | 接口变化 |
| --- | --- | --- | --- |
| 标注 | `role={labelRoleId}`、`nodeId={labelNodeId}` | 节点为 `标注 / Label`，按钮为 `领取标注 / Claim Label` | 条目列表和权限接口带当前节点/角色上下文。 |
| 标注内审 | `role={reviewRoleId}`、`nodeId={reviewNodeId}` | 节点为 `标注内审`，按钮为 `领取审核 / Claim Review`，增加审核员列 | 条目列表返回审核字段，按钮语义转为审核领取。 |
| 查看 | `viewMode=true` | 不显示暂存/放弃/跳过/送审，字段不可编辑 | 增加 `get-view-item-permission`。 |
| 标注 | 无 `viewMode` | 显示暂存/放弃/跳过/送审，可能触发 `work` | 进入页自然触发 `work` 和操作权限接口。 |

ID 均按 `{taskId}`、`{roleId}`、`{nodeId}`、`{batchId}`、`{itemId}`、`{selectId}` 模式化记录。

## 领取 / 查看 / 标注 / 放弃 / 跳过 / 送审接口

| 动作 | 触发页面 | 按钮文案 | method | pathname 模式 | request shape | response shape | 是否弹窗 | 状态变化 | 后续自动化风险 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 领取标注 | Data 页标注角色 | 领取标注 / Claim Label | 待补 | 待补 | 待补 | 待补 | 待补 | 会领取任务 | 必须人工确认，默认不自动执行。 |
| 领取审核 | Data 页内审角色 | 领取审核 / Claim Review | 待补 | 待补 | 待补 | 待补 | 待补 | 会领取审核任务 | 必须人工确认。 |
| 查看 | Data 页或直接 URL | 查看 / View | POST | `/api/v2/item/get-view-item-permission` 等 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 否 | 不改变标注结果 | 可辅助打开，只读。 |
| 标注进入 | `/items` 标注页 | 标注：1条 / Label entry | POST | `/api/v2/item/work` | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 否 | 标记工作状态/锁定 | 进入本身可能改变工作状态，需提示。 |
| same_font 选择 | `/items` 标注页 | true/false/unsure/error | POST | `/api/v2/label/save-labels` | `{ taskId, itemId, nodeId, labels/issues... }` | `{ code, data: ... }` | 否 | 保存标注草稿/结果 | 不得自动选择或保存。 |
| 暂存 | `/items` 标注页 | 暂存 | 待补 | 预计 `/api/v2/label/save-labels` | 待补 | 待补 | 待补 | 保存 | 不得自动点击。 |
| 放弃 | `/items` 标注页 | 放弃 | POST | `/api/v2/item/abandon-item` | `{ taskId, itemId, nodeId, reason?/labels? }` | `{ code, data: ... }` | 出现退出确认 | 已在测试账号单条改变状态 | 正式脚本必须二次确认。 |
| 跳过 | `/items` 标注页 | 跳过 | 待补 | 待补 | 待补 | 待补 | 待补 | 会改变条目状态 | 本轮未触发。 |
| 送审 | `/items` 标注页 | 送审 | 待补 | 待补 | 待补 | 待补 | 待补 | 会提交/进入审核 | 本轮未触发。 |
| 恢复 | 放弃后 | 恢复 | 待补 | 待补 | 待补 | 待补 | 待补 | 可能恢复条目 | 本轮仅记录可见。 |

## 多语言资料

语言入口：用户菜单 `切换语言 / Switch Language`，语言项为 `English`、`简体中文`、`日本語`。

| 简体中文 | English |
| --- | --- |
| 数据条目 | Data |
| 统计分析 | Analytics |
| 工作流 | Workflow |
| 成员配置 | Members |
| 数据任务 | Annotation |
| 动态任务 | Dynamic Projects |
| 筛选 | Filter |
| 条目号/文件名 | Search by ID or filename... |
| 查看 | View |
| 领取标注 | Claim Label |
| 领取审核 | Claim Review |
| 全部数据 | All |
| 批次视图 | By Batch |
| 总览 | Overview |
| 待办项 | Todo |
| 已跳过 | Skipped |
| 已放弃 | Dropped |
| 标注 | Label |
| 条目号 | Item ID |
| 帧数 | Frames |
| 无效帧数 | Invalid Frames |
| 导入轮次 | Import Round |
| 所属批次 | Batch |
| 所在节点 | Stage |
| 标注状态 | Label Status |
| 当前审核状态 | Review Status |
| 标注员 | Labeler |
| 标注团队 | Label Team |
| 审核员 | Reviewer |
| 审核团队 | Review Team |
| 变更时间 | Last Updated |
| 数据来源 | Data Source |
| 暂无数据 | No Data |
| 跨页全选 | Select All Across Pages |
| 条目数 | Items |
| 个人中心 | Profile |
| 日间模式 | Light Mode |
| 切换语言 | Switch Language |
| 建议反馈 | Submit Feedback |
| 退出账户 | Logout |

语言切换未确认独立接口；切换后页面重新加载当前业务接口。后续定位应使用 URL、query keys、DOM 层级、表头和双语文案兜底。

## Task17 公共结构对比

相同结构：

- Data 页路径仍为 `/task-v2/data-item`。
- /items 页仍为资源区、标注控件区、右侧条目列表、锁定状态、计时器结构。
- 公共接口族一致：`get-item-info`、`find-labels`、`find-issues`、`find-label-records`、`get-ai-check-result`、`find-invalidate-frame`、`sampling/get-frames-data`、`find-items-base-info`。
- 资源接口仍为对象存储图片资源，完整 URL 必须脱敏。

差异：

- Task17 名称为 `TASK17-9`，项目号前缀为 `HM_312_v2`，Task21 为 `Task21 / HM_395_v2`。
- Task17 列表在内审角色，按钮为 `Claim Review`，表格有 Reviewer / Review Team。
- Task17 `/items` 示例携带多个 `selectIds`，右侧条目列表显示 10 条。
- Task17 主标注是图片二选一、skip、原因多选和其他原因 textarea；不是 Task21 的 same_font。
- Task17 未做任何状态变更测试。

## 待补信息

- 领取标注/领取审核接口结构。
- 跳过、送审、恢复接口结构和弹窗文案。
- 暂存按钮是否只调用 `save-labels` 或另有接口。
- 更多批次、更多条目状态下的列表字段差异。
- 失败/异常弹窗、保存失败提示、权限不足提示。
- 送审后的审核页面或回到列表的状态变化。
- 统计分析、工作流、成员配置页面的详细结构。
