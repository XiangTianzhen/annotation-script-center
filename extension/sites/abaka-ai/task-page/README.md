# Abaka AI Task 页面结构采集

## 平台定位

Abaka AI 是国外标准标注平台。本目录用于 Abaka AI Task 页面结构与 Network 结构的只读采集资料沉淀，当前目标项目为 `Task21`（项目号 `#HM_395_v2`），工具类型为 `MMAT`。

## 当前阶段

- 阶段：只读采集阶段。
- 目标：整理 Task21 的页面路由、DOM 区域、按钮、表格、筛选项和接口结构。
- 边界：不自动领取、不自动保存、不自动提交、不自动流转。
- 本轮采集方式：Google Chrome DevTools MCP；页面内扩展 snapshot 对象未在当前已打开页面出现，因此本轮以 DevTools DOM snapshot、只读 Console 结构脚本和 Network 结构观察结果为准。

## 页面入口

- 登录页：`/login`
- 任务列表页：`/data-task/v2`
- Task21 详情页：`/task-v2/data-item?taskId={taskId}`
- Task21 批次视图：`/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}`
- 具体条目页：待补。本轮 Task21 批次下列表显示 `No Data`，未进入单条标注页。

## 页面结构

| 页面 | URL 特征 | 主要区域 | 关键控件 | 备注 |
| --- | --- | --- | --- | --- |
| 登录页 | `/login` | 账号密码登录区、验证码资源区 | 账号输入框、密码输入框、登录按钮、验证码 | 用户手动登录；不读取账号密码。 |
| 任务列表页 | `/data-task/v2` | 顶部空间信息、左侧/顶部导航、Dynamic Projects 表格、分页 | 搜索框 `Project ID / Name / Owner`、项目行、分页 `10 / Page` | 页面标题为 `Platform`，根节点为 `#app`。 |
| Task21 详情页 | `/task-v2/data-item?taskId={taskId}` | 顶部任务导航、二级标签 `Data / Analytics / Workflow / Members`、面包屑、数据区 | `Data` 标签、任务名 `Task21` | 只记录路径模式，不记录真实 `taskId`。 |
| Task21 批次/条目页 | `/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}` | Filter 区、View 区、批次列表、状态 tabs、条目表格、底部分页/选择状态 | 搜索框、`Claim Label`、`All / By Batch`、批次复选框、`Overview / Todo / Skipped / Dropped / Label` | `Claim Label` 属危险动作，仅记录不点击。 |
| 单条标注页 | 待补 | 待补 | 待补 | 需有可查看条目后再采集；不得主动领取。 |

## Task21 列表结构

任务列表表头实采如下：

| 字段 | 实采说明 |
| --- | --- |
| Project ID | Task21 行显示 `#HM_395_v2`。 |
| Project Status | Task21 行显示状态为 `In Progress`。 |
| Name | Task21 行显示 `Task21`。 |
| Tool Type | Task21 行显示 `MMAT`。 |
| Batch Count | 表格有该列；Task21 当前列表可见值为占位符。 |
| Item Count | 表格有该列；Task21 当前列表可见值为占位符。 |
| Team | 表格有该列；不记录真实团队外的敏感扩展信息。 |
| Owner | 表格有该列；不落档真实人员值。 |
| Created Time | 表格有该列；不作为功能依赖。 |

页面识别策略：

- 优先匹配 `/data-task/v2`。
- 使用表头文本 `Project ID / Project Status / Name / Tool Type` 确认列表表格。
- 使用 `Project ID = #HM_395_v2` 或 `Name = Task21` 定位目标行。
- 不把 `data-v-*`、打包 hash class 或图片 URL 当成稳定选择器。

## Task21 详情结构

### 任务信息区

- 面包屑/标题区域：`Annotation -> Dynamic Projects -> Task21`。
- 二级导航：`Data`、`Analytics`、`Workflow`、`Members`。
- 详情接口返回 `data.setting`，包含 `labelConfig`、`toolSetting.layout`、`checkRatio`、`preCheck`、`exportScripts` 等结构。

### 条目列表区

- 筛选区：
  - 搜索框 placeholder：`Search by ID or filename…`
  - 批次筛选输入框 placeholder：`Name`
- 视图区：
  - `View`
  - `All`
  - `By Batch`
- 批次区：
  - 批次复选框
  - 批次名示例：`批次_1`、`批次_2`
  - 批次计数可见
- 状态 tabs：
  - `Overview`
  - `Todo`
  - `Skipped`
  - `Dropped`
  - `Label`
- 条目表头：
  - `Item ID`
  - `Frames`
  - `Invalid Frames`
  - `Import Round`
  - `Stage`
  - `Label Status`
  - `Review Status`
  - `Labeler`
  - `Label Team`
  - `Last Updated`
  - `Data Source`
- 当前实采：Task21 当前批次条目表显示 `No Data`。

### 标注区、资源区、操作区

- 标注区：待补。本轮未进入具体条目。
- 资源区：待补。详情页仅观察到页面图标资源；未采集到音频、图片、文件类业务资源。
- 操作区：
  - `Claim Label`：危险操作，未点击。
  - `Select All Across Pages`：选择类操作，未触发跨页选择。
  - 底部状态：`Selected 0 entry, 0 frame`。

## Network 结构

| 用途 | method | pathname 模式 | queryKeys | requestShape | responseShape | 分页字段 | 列表字段 | 是否危险操作 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户信息 | POST | `/api/auth-center/user/user-info` | 无 | `{}` | `{ code, data: { mfa, _id, username, platform, spaceRole, spaceId, space, ... } }` | 无 | `data.space.users` | 否 | 响应含人员与空间信息，文档只保留字段结构。 |
| 权限菜单 | GET | `/api/permission/module-tree/space` | 无 | 无 | `{ code, data: [{ title, key, router, buttons }] }` | 无 | `data` | 否 | 用于顶部/侧边菜单权限。 |
| 空间存储配置 | POST | `/api/auth-center/space/storage` | 无 | `{}` | `{ code, data: { type, bucket, private, expiration, ak, sk, token, end_point, storageType } }` | 无 | 无 | 否 | 含 token/storage 字段，必须脱敏；不落真实值。 |
| 空间列表 | POST | `/api/auth-center/space/list` | 无 | `{ type, relation, name }` | `{ code, data: [{ _id, users, name, ownerId, type, domainId, points, ... }] }` | `points.total/current` | `data`, `data[].users` | 否 | 响应包含大量成员信息，只记录结构。 |
| 消息列表 | GET | `/api/message/list` | 无 | 无 | `{ code, data: [] }` | 无 | `data` | 否 | 登录后轮询。 |
| 任务列表 | POST | `/api/v2/task/get/task-list` | 无 | `{ pageNum, pageSize, taskStatus, search }` | `{ code, data: { total, data: [task] } }` | `data.total` | `data.data` | 否 | Task21 行来自该接口。 |
| 任务基础列表 | POST | `/api/v2/task/get/task-basic-info-list` | 无 | `{ pageNum, pageSize, search, taskStatus }` | `{ code, data: { total, data: [taskBasic] } }` | `data.total` | `data.data` | 否 | 详情页顶部/切换任务辅助。 |
| 任务条目数量 | POST | `/api/v2/task/get/task-item-counts` | 无 | 待补 | 待补 | 待补 | 待补 | 否 | 列表页自然请求，需后续 snapshot 补齐结构。 |
| ID 权限列表 | POST | `/api/v2/task/get/id-list-permissions` | 无 | 待补 | 待补 | 待补 | 待补 | 否 | 列表页自然请求，需后续 snapshot 补齐结构。 |
| Task21 详情 | POST | `/api/v2/task/get/task-info` | 无 | `{ taskId }` | `{ code, data: { _id, status, type, name, domainId, setting, agreement, ... } }` | 无 | `data.setting.labelConfig`, `data.setting.exportScripts` | 否 | `taskId` 记录为 `{taskId}`。 |
| Workflow 详情 | POST | `/api/v2/workflow/get/workflow-info` | 无 | `{ taskId }` | `{ code, data: { _id, taskId, name, nodes, stashNodes, packageMode, config, delNodes, ... } }` | 无 | `data.nodes` | 否 | 节点内含 `setting.submit/move/skip`，只做结构分析。 |
| 任务权限 | POST | `/api/v2/task/get/permission` | 无 | `{ taskId }` | `{ code, data: { taskId, workflowId, nodes, taskRole } }` | 无 | `data.nodes` | 否 | 用于判断 Data/Workflow/操作权限。 |
| 协议状态 | POST | `/api/v2/task/check-agreement-status` | 无 | `{ taskId }` | `{ code, data: boolean }` | 无 | 无 | 否 | 进入任务时自然请求。 |
| 搜索模板 | POST | `/api/v2/item/get-item-search-template-list` | 无 | `{ taskId }` | `{ code, data: [] }` | 无 | `data` | 否 | 当前为空。 |
| 批次列表 | POST | `/api/v2/package/get-package-list` | 无 | `{ taskId, pageSize, pageNum, nodeId }` | `{ code, data: { data: [package], total } }` | `data.total` | `data.data` | 否 | package 结构含 `domainId/name/count/pushableCount/movePermission`。 |
| 批次筛选列表 | POST | `/api/v2//package/get-package-filter-list` | 无 | `{ taskId }` | `{ code, data: [{ _id, domainId, name }] }` | 无 | `data` | 否 | 注意路径中出现双斜杠。 |
| 导入轮次筛选 | POST | `/api/v2//import/get-import-filter-list` | 无 | `{ taskId, packageId }` | `{ code, data: [{ _id, name }] }` | 无 | `data` | 否 | 注意路径中出现双斜杠。 |
| 条目处理人 | POST | `/api/v2/item/get-item-handlers` | 无 | 待补 | 待补 | 待补 | 待补 | 否 | 详情页自然请求，后续补 shape。 |
| 节点操作人 | POST | `/api/v2/item/get-node-operator-info` | 无 | `{ taskId, nodeId }` | `{ code, data: [] }` | 无 | `data` | 否 | 当前为空。 |
| Todo 条目列表 | POST | `/api/v2/item/get-item-todo-list-lite` | 无 | `{ taskId, pageNum, pageSize, search, packageIds, nodeId }` | `{ code, data: { total, data: [] } }` | `data.total` | `data.data` | 否 | 当前批次返回空列表。 |
| 资源文件 | GET | `/assets/{name}.{hash}.{ext}` | 无 | 无 | 静态资源 | 无 | 无 | 否 | 只记录资源类型，禁止记录完整业务文件 URL。 |
| 登录/验证码 | POST/GET | `/api/auth-center/auth/*`、第三方 captcha 域名 | 多种 | 登录结构不落档 | 登录结构不落档 | 无 | 无 | 敏感 | 用户手动登录产生；不记录账号密码、token、cookie。 |

## 选择器候选

- 页面根：`#app`
- 列表页定位：
  - 路由：`/data-task/v2`
  - 表头文本：`Project ID`、`Project Status`、`Name`、`Tool Type`
  - 目标行：文本邻近 `#HM_395_v2` 与 `Task21`
- 详情页定位：
  - 路由：`/task-v2/data-item`
  - query keys：`taskId`、可选 `vm`、`batchId`
  - 标题/面包屑文本：`Task21`
  - 二级标签文本：`Data`、`Analytics`、`Workflow`、`Members`
- 条目表定位：
  - 表头文本：`Item ID`、`Frames`、`Invalid Frames`、`Label Status`、`Review Status`
  - 空态文本：`No Data`
- 稳定属性优先级：
  - `role=checkbox/button/img`
  - `aria-label`
  - input `placeholder`
  - 表头文本和面包屑文本
- 避免依赖：
  - `data-v-*`
  - 打包 hash class
  - `/assets/*.svg/png` 完整路径

## 安全边界

- 不读取、记录、复制、导出账号密码。
- 不读取或导出 cookie、localStorage、sessionStorage 中的敏感字段。
- 不提交真实采集 JSON、HAR、截图、CSV、原始接口响应。
- 不记录 `cookie`、`authorization`、`token`、`password`、`secret`、`signature`、完整 `audio/url/file/download/oss/src/href/path`。
- `Claim Label`、保存、提交、领取、流转、删除、确认类接口或按钮均视为危险操作，本阶段只记录结构，不主动触发。

## 后续功能候选

- 任务列表识别：需进一步确认列表接口字段与分页稳定性。
- 当前条信息采集：需有可查看条目后确认 `get-item-todo-list-lite` 非空结构和单条详情接口。
- 音频/图片资源识别：需进入具体条目页后确认资源字段路径与文件类型。
- AI 辅助建议：需确认标注数据结构、资源字段和人工填入边界。
- 快捷键辅助：需确认具体条目页按钮 DOM 和危险动作边界。
- 统计导出：需确认列表/详情数据源、分页字段与是否允许只读导出。
