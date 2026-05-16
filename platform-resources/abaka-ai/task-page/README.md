# Abaka AI Task 页面平台资料

## 采集说明

- 采集时间：2026-05-16。
- 采集入口：`http://abao.fortidyndns.com:30473/login`，用户手动登录后进入 Task21。
- 采集方式：Google Chrome DevTools MCP + 只读 Console 结构脚本；未导出 HAR，未提交原始 JSON。
- 当前目标：`Task21`（项目号 `#HM_395_v2`，工具类型 `MMAT`）。
- 扩展只读 observer 文件：`extension/sites/abaka-ai/task-page/page-world/network-structure-observer.js`。
- 当前已打开页面中 `window.__ASCAbakaAiCapture` 未出现；本轮使用 DevTools 结构采集结果补档。

本目录只记录脱敏后的页面结构和接口结构，不记录账号、cookie、token、authorization、密码、完整资源 URL 或真实原始响应。

## 页面路由

| 页面 | URL 特征 | 说明 | 采集状态 |
| --- | --- | --- | --- |
| 登录页 | `/login` | 账号密码登录 + 验证码资源 | 已观察登录资源和登录后跳转；不记录登录 payload。 |
| 任务列表页 | `/data-task/v2` | Dynamic Projects 列表，含 Task21 行 | 已采集 DOM 和任务列表接口结构。 |
| Task21 详情页 | `/task-v2/data-item?taskId={taskId}` | 任务详情容器，含 Data/Analytics/Workflow/Members | 已采集。 |
| Task21 批次数据页 | `/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}` | Data 页批次/条目列表视图 | 已采集；当前批次条目为空。 |
| 具体条目页 | 待补 | 进入单条标注/查看页后的资源与表单结构 | 未采集，需后续有可查看条目后补。 |

## 接口清单

| 接口用途 | method | pathname 模式 | queryKeys | requestShape | responseShape | 列表字段 | 分页字段 | 触发方式 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户信息 | POST | `/api/auth-center/user/user-info` | 无 | `{}` | `{ code, data: { mfa, _id, username, platform, spaceRole, nickname, email, other, space, ... } }` | `data.space.users` | 无 | 登录后自然请求 | 响应含用户/成员字段，只记录结构。 |
| 空间存储配置 | POST | `/api/auth-center/space/storage` | 无 | `{}` | `{ code, data: { type, bucket, private, expiration, ak, sk, token, end_point, storageType } }` | 无 | 无 | 登录后自然请求 | `token` 必须脱敏。 |
| 权限模块树 | GET | `/api/permission/module-tree/space` | 无 | 无 | `{ code, data: [{ title, key, router, buttons }] }` | `data` | 无 | 登录后自然请求 | 菜单权限。 |
| 空间合约配置 | GET | `/api/contract/space` | 无 | 无 | `{ code, data: { current, tool, module, models, scripts, exportScripts, ... } }` | `data.tool`, `data.module` | `data.current` | 登录后自然请求 | 用于空间能力配置。 |
| 空间列表 | POST | `/api/auth-center/space/list` | 无 | `{ type, relation, name }` | `{ code, data: [{ users, name, ownerId, type, domainId, points, ... }] }` | `data`, `data[].users` | `data[].points.total/current` | 详情页自然请求 | 成员字段只记录结构。 |
| 消息列表 | GET | `/api/message/list` | 无 | 无 | `{ code, data: [] }` | `data` | 无 | 轮询 | 无业务动作。 |
| 任务列表 | POST | `/api/v2/task/get/task-list` | 无 | `{ pageNum, pageSize, taskStatus, search }` | `{ code, data: { total, data: [task] } }` | `data.data` | `data.total` | 任务列表页加载 | Task21 行来源。 |
| 任务基础列表 | POST | `/api/v2/task/get/task-basic-info-list` | 无 | `{ pageNum, pageSize, search, taskStatus }` | `{ code, data: { total, data: [taskBasic] } }` | `data.data` | `data.total` | 详情页加载 | 任务切换/基础信息辅助。 |
| 任务条目数量 | POST | `/api/v2/task/get/task-item-counts` | 无 | 待补 | 待补 | 待补 | 待补 | 任务列表页加载 | 已观察请求，结构待补。 |
| ID 权限列表 | POST | `/api/v2/task/get/id-list-permissions` | 无 | 待补 | 待补 | 待补 | 待补 | 任务列表页加载 | 已观察请求，结构待补。 |
| Task 详情 | POST | `/api/v2/task/get/task-info` | 无 | `{ taskId }` | `{ code, data: { _id, status, type, name, domainId, setting, agreement, createdAt, updatedAt } }` | `data.setting.labelConfig`, `data.setting.exportScripts` | 无 | 进入 Task21 | `setting.toolSetting.layout` 是后续标注区布局的重要来源。 |
| Workflow 详情 | POST | `/api/v2/workflow/get/workflow-info` | 无 | `{ taskId }` | `{ code, data: { taskId, name, nodes, stashNodes, packageMode, config, delNodes } }` | `data.nodes` | 无 | 进入 Task21 | `nodes[].setting.submit/move/skip` 只做结构记录。 |
| 任务权限 | POST | `/api/v2/task/get/permission` | 无 | `{ taskId }` | `{ code, data: { taskId, workflowId, nodes, taskRole } }` | `data.nodes` | 无 | 进入 Task21 | 决定用户可见操作。 |
| 协议状态 | POST | `/api/v2/task/check-agreement-status` | 无 | `{ taskId }` | `{ code, data: boolean }` | 无 | 无 | 进入 Task21 | 无主动操作。 |
| 搜索模板 | POST | `/api/v2/item/get-item-search-template-list` | 无 | `{ taskId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | 当前为空。 |
| 批次列表 | POST | `/api/v2/package/get-package-list` | 无 | `{ taskId, pageSize, pageNum, nodeId }` | `{ code, data: { data: [package], total } }` | `data.data` | `data.total` | Data 页加载 | package 含 `count/pushableCount/movePermission`。 |
| 批次筛选 | POST | `/api/v2//package/get-package-filter-list` | 无 | `{ taskId }` | `{ code, data: [{ _id, domainId, name }] }` | `data` | 无 | Data 页加载 | 实采路径有双斜杠。 |
| 导入轮次筛选 | POST | `/api/v2//import/get-import-filter-list` | 无 | `{ taskId, packageId }` | `{ code, data: [{ _id, name }] }` | `data` | 无 | Data 页加载 | 实采路径有双斜杠。 |
| 条目处理人 | POST | `/api/v2/item/get-item-handlers` | 无 | 待补 | 待补 | 待补 | 待补 | Data 页加载 | 结构待补。 |
| 节点操作人 | POST | `/api/v2/item/get-node-operator-info` | 无 | `{ taskId, nodeId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | 当前为空。 |
| Todo 条目列表 | POST | `/api/v2/item/get-item-todo-list-lite` | 无 | `{ taskId, pageNum, pageSize, search, packageIds, nodeId }` | `{ code, data: { total, data: [] } }` | `data.data` | `data.total` | Data 页加载/筛选 | 当前返回空列表。 |
| 静态资源 | GET | `/assets/{name}.{hash}.{ext}` | 无 | 无 | JS/CSS/SVG/PNG | 无 | 无 | 页面加载 | 只记录类型和后缀。 |
| 登录/验证码 | POST/GET | `/api/auth-center/auth/*`、第三方 captcha 域名 | 多种 | 不落档 | 不落档 | 无 | 无 | 用户手动登录 | 敏感链路，不记录账号密码或 token。 |

## 数据结构摘要

### task

- `task` 基础字段：`_id`、`sys_status`、`spaceId`、`userId`、`status`、`type`、`name`、`domainId`、`version`、`spaceIds`、`desc`、`agreement`、`createdAt`、`updatedAt`、`isCollected`。
- `Task21` 可公开识别字段：`name=Task21`、`domainId=HM_395_v2`、`type=MMAT`、`status=PROCESSING/In Progress`。
- 不记录真实人员 ID、空间 ID、access-token、cookie。

### task-info.setting

- `setting.labelConfig[]`：含 `label`、`drawType`、`color`、`attributes`、`fusionAttributes`、`key`。
- `setting.toolSetting.layout`：含 `board`、`pool`、`content`、`annotation`。
- 其他字段：`skipLimit`、`abandonLimit`、`checkRatio`、`preCheck`、`labelAlias`、`noStatistics`、`statisticsType`、`exportScripts`、`watermark`。
- `exportScripts[].url` 按 URL 类字段脱敏，只记录长度和 masked。

### workflow-info

- 顶层：`_id`、`spaceId`、`taskId`、`name`、`nodes`、`stashNodes`、`packageMode`、`type`、`config`、`delNodes`。
- `nodes[]`：含 `nextId/prevId`、`version`、`index`、`spaces`、`name`、`type`、`package`、`selfCheck`、`sampleRate`、`setting`、`location`、`_id`。
- `nodes[].setting`：含 `view`、`data`、`submit`、`move`、`skip`、`batchFlowCfg`。

### package

- `package` 字段：`_id`、`taskId`、`importId`、`status`、`domainId`、`limit`、`name`、`test`、`runtimeStatus`、`labelSpaceIds`、`nodeInfos`、`count`、`pushableCount`、`handleFlag`、`movePermission`。
- 当前 Task21 可见批次名：`批次_1`、`批次_2`。

### item todo list

- 请求：`taskId`、`pageNum`、`pageSize`、`search`、`packageIds`、`nodeId`。
- 响应：`data.total`、`data.data[]`。
- 当前实采批次返回空数组，单条 item 结构待补。

## 危险接口清单

本轮未主动调用以下类型接口；若后续自然出现，也只允许记录结构，不允许主动触发：

| 类型 | 已观察线索 | 风险 |
| --- | --- | --- |
| 领取 | 页面按钮 `Claim Label` | 可能改变任务领取状态。 |
| 保存 | workflow 节点结构含 `setting.submit` | 可能写入标注结果。 |
| 提交 | workflow 节点结构含 `setting.submit` | 可能提交或结束任务。 |
| 流转/移动 | workflow 节点结构含 `setting.move`，package 含 `movePermission` | 可能改变批次/条目状态。 |
| 跳过/废弃 | workflow 节点结构含 `setting.skip`，页面有 `Skipped/Dropped` 状态 | 可能改变条目状态。 |
| 跨页选择 | 页面文案 `Select All Across Pages` | 可能影响批量操作范围。 |

## 待补信息

- 进入具体条目页后的路由、DOM 区域和资源字段。
- `get-item-todo-list-lite` 返回非空时的 item 结构。
- `get-item-handlers`、`get-task-item-counts`、`id-list-permissions` 的脱敏 shape。
- 音频/图片/文件资源字段的 pathname 模式与文件扩展名。
- 查看类按钮与危险按钮的明确区分。
- 是否存在 iframe 或 shadow DOM 承载标注工具；本轮未发现可用业务 iframe/shadow DOM。
