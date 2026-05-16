# Abaka AI Task 页面结构采集

## 平台定位

Abaka AI 是国外标准标注平台。本目录记录 Abaka AI Task 页面在浏览器中的路由、DOM、按钮、弹窗与 Network 结构，当前主目标为 `Task21`（项目号 `#HM_395_v2`，工具类型 `MMAT`）。`Task17-9 / Task17-8` 仅作为公共结构对比，不作为本轮主功能目标。

## 当前阶段

- 阶段：Task21 深度采集阶段。
- 范围：整理页面结构、接口结构、双语文案、same_font 主标注区和危险动作边界。
- 用户授权：本轮允许在 Abaka AI 测试账号、Task21 测试数据范围内做单条领取/标注/查看/放弃/跳过/送审类测试。
- 扩展边界：后续正式脚本仍默认不自动领取、不自动保存、不自动提交、不自动流转；危险动作必须保留人工确认层。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本、Network 面板结构观察。
- 页面内 `window.__ASCAbakaAiCapture` 在当前受控页面未出现，本轮以 DevTools 实采结构为准。

## 页面入口

| 页面 | URL 模式 | 说明 | 采集状态 | 备注 |
| --- | --- | --- | --- | --- |
| 登录页 | `/login` | 用户手动登录入口 | 已采集入口 | 不记录账号、密码、验证码、登录 payload。 |
| 动态任务列表页 | `/data-task/v2` | Dynamic Projects 列表 | 已采集 | Task21 行可通过项目号和名称定位。 |
| Task21 全部数据页 | `/task-v2/data-item?taskId={taskId}&vm=all&dm=all` | Data 页全部数据视图 | 已深度采集 | 支持状态 tab、筛选、单选/多选、角色按钮。 |
| Task21 批次页 | `/task-v2/data-item?taskId={taskId}&vm=batch&dm=all&batchId={batchId}` | Data 页批次视图 | 已采集 | 左侧批次列表含 `批次_1`、`批次_2`。 |
| Task21 标注角色页 | `/task-v2/data-item?taskId={taskId}&role={labelRoleId}` | 标注角色 Data 页 | 已采集 | 主按钮为 `领取标注 / Claim Label`。 |
| Task21 标注内审角色页 | `/task-v2/data-item?taskId={taskId}&role={reviewRoleId}` | 内审角色 Data 页 | 已采集 | 主按钮为 `领取审核 / Claim Review`，表格增加审核员字段。 |
| Task21 查看页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&viewMode=true&nodeId={nodeId}` | 只读查看页 | 已采集 | 资源、same_font、右侧条目列表可见。 |
| Task21 标注页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&nodeId={nodeId}` | 标注工作页 | 已采集 | 实测 same_font 选项、自动保存与放弃动作。 |
| Task17 对比页 | `/task-v2/data-item?taskId={task17Id}`、`/items?taskId={task17Id}&viewMode=true` | 公共结构对比 | 已查看采集 | 未做领取、放弃、跳过、送审。 |

## Task21 任务列表结构

任务列表表头和 Task21 行已由截图线索与页面实采共同确认：

| 字段 | Task21 示例 |
| --- | --- |
| 任务号 / Project ID | `#HM_395_v2` |
| 任务状态 / Project Status | `进行中 / In Progress` |
| 名称 / Name | `Task21` |
| 工具类型 / Tool Type | `MMAT` |
| 批次数 / Batch Count | 列存在，列表页显示批次数字段。 |
| 条目数 / Item Count | 列存在，列表页显示条目数字段。 |
| 所属团队 / Team | `abaka.ai` |
| 创建者 / Owner | `Anniejln` |
| 创建时间 / Created Time | `04-30-2026 22:01:33` |

识别建议：

- 优先用路由 `/data-task/v2` 和表头 `Project ID / Name / Tool Type` 确认任务列表。
- 目标行可用 `#HM_395_v2` 与 `Task21` 双条件定位。
- 不依赖 `data-v-*`、hash class 或图片资源 URL。

## Task21 数据条目页结构

| 区域 | 中文实采 | English 实采 | 定位建议 | 备注 |
| --- | --- | --- | --- | --- |
| 左侧主导航 | 数据条目、统计分析、工作流、成员配置 | Data、Analytics、Workflow、Members | 页面导航文本 + 当前路由 | 导航切换可能触发不同模块接口。 |
| 面包屑 | 数据任务 > 动态任务 > Task21 > 数据条目 | Annotation > Dynamic Projects > Task21 > Data | 文本层级 | Task21 是关键定位点。 |
| 筛选区 | 筛选；placeholder `条目号/文件名` | Filter；placeholder `Search by ID or filename...` | input placeholder | 不记录输入 value。 |
| 视图切换 | 全部数据、批次视图 | All、By Batch | 文本 + `vm` query | 批次视图增加批次侧栏。 |
| 批次侧栏 | 名称、批次_1、批次_2、计数 | Name、batch names、counts | `vm=batch` + checkbox 列表 | `批次_2` 实采为 1 条。 |
| 状态 Tab | 总览、待办项、已跳过、已放弃、标注 | Overview、Todo、Skipped、Dropped、Label | tab 文本 | 内审角色显示节点 `标注内审`。 |
| 表格区 | 条目号、帧数、无效帧数、导入轮次、所属批次、所在节点、标注状态、当前审核状态、标注员、标注团队、变更时间、数据来源 | Item ID、Frames、Invalid Frames、Import Round、Batch、Stage、Label Status、Review Status、Labeler、Label Team、Last Updated、Data Source | 表头文本；`data-col-key` 仅作辅助 | `data-col-key` 可见：`domainId`、`frames`、`invalidFrames`、`importRound`、`packageId`、`node`、`labelStatus`、`checkStatus` 等。 |
| 分页区 | 跨页全选、已选择0条目，0帧、10 / 页 | Select All Across Pages、Selected 0 entry, 0 frame、10 / Page | 底部文本 | 跨页全选属于批量风险动作。 |
| 角色切换 | 标注、标注内审 | Label、Review/Claim Review | `role` query + 右上按钮文案 | 内审表格增加审核员、审核团队列。 |
| 选择状态 | 选择单条后 `标注：1条`、`已选择1条目，0帧` | 选择后英文同类数量文案 | row checkbox + top action | 单选触发 `get-frame-count`。 |

Task21 当前单条实采字段：

- 条目号：`377264`
- 导入轮次：`导入任务_2`
- 所属批次：`批次_2`
- 所在节点：`标注`
- 标注状态：`标注中`
- 当前审核状态：`未审核`
- 标注员：`yh9`
- 标注团队：`QiMing`
- 变更时间：`2026-05-16 13:28`
- 数据来源：`原始数据`

这些值仅作为测试账号内的结构识别样例，不作为后续脚本硬编码依据。

## Task21 标注页结构

| 区域 | 实采结构 | 定位策略 | 备注 |
| --- | --- | --- | --- |
| 顶部/工作壳 | 页面标题 `Platform`，路由 `/items`，query keys 含 `version/taskId/vm/dm/role/itemId/selectIds/nodeId/viewMode` | URL route + query keys | query value 文档中均模式化。 |
| 资源区 | 多个 iframe 文本预览、三张 webp 图片、图片查看器按钮 | `iframe[srcdoc]`、`img`、按钮英文 aria/text | 资源 URL 只记录类型、长度、扩展名，禁止记录完整地址。 |
| 图片查看器 | Zoom In、Zoom Out、One to One、Reset、Previous、Play、Next、Rotate Left、Rotate Right、Flip Horizontal、Flip Vertical、Enter Full Screen | button 文案 | 工具按钮为英文，中文语言下仍保持英文。 |
| 主标注区 | `same_font` 单选/派生表单区域 | `label-container grid-item`、标题文本 `same_font`、邻近 radio 文本 | class 只能作候选，需配合文本和结构。 |
| 右侧条目列表 | 条目号 / Item ID、`HM_395_v2#377264`、条目数 / Items | 右侧栏文本 + 当前 item 标记 | 查看页可能显示 No Data 或 Items:0。 |
| 锁定/工作状态 | 锁定 / UnLock、解锁状态下支持对标签进行修改、暂停提示、计时器 | 顶部状态文本 | 长时间未工作会出现暂停提示。 |
| 操作区 | 暂存、放弃、跳过、送审；放弃后出现恢复 | 底部/右下操作文本 | 本轮测试了放弃，触发状态变更接口。 |
| 弹窗/Toast | `提示`、`没有更多数据，是否退出?`、`确认`；离开未保存页时有浏览器确认 | dialog/alert 文本 | 只记录文案和结构，不记录原始 payload。 |

## same_font 主标注结构

| 板块名称 | 控件类型 | 中文文案 | English 文案 | DOM 定位策略 | 是否触发 Network | 对应接口用途 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| same_font | radio/custom-radio | `true`、`false`、`unsure`、`error`、`same underlying font+artistic effect` | 同中文页，字段名和选项为英文 | 标题文本 `same_font` + `radio-container` + `radio-item custom-radio` | 选项点击本身未发现独立查询接口；随后页面自动触发保存 | `/api/v2/label/save-labels` | 点击 `true` 后派生更多字段。 |
| image_b_texts_removed | radio + rich text editor | `specify`、`true`、`null` | 同中文页 | same_font 后继字段块 + Monaco/textarea editor | 未单独触发接口 | 保存时并入 label payload | 文本编辑器 aria 含 `Editor content;Press Alt+F1...`。 |
| other_changes | radio + textarea | `specify`、`unsure`、`null` | 同中文页 | 后继字段块 + textarea | 未单独触发接口 | 保存时并入 label payload | 标注页可见，查看页禁用。 |

资源板块实采：

- `image_a`
- `image_b`
- `image_b_removed`
- 多个 `iframe[srcdoc]` 展示文本内容。
- 图片资源扩展名为 `.webp`，文档只记录 `{ masked: true, length, ext }`。

## 操作按钮结构

| 按钮 | 中文文案 | English 文案 | 所在页面 | 触发方式 | 是否危险操作 | 是否已测试 | Network 用途 | 后续脚本建议 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 查看 | 查看 | View | 数据条目页 | 进入 viewMode 查看页 | 低风险 | 已通过 URL 查看 | 查看页详情加载 | 可做入口辅助，但不要读取完整资源 URL。 |
| 领取标注 | 领取标注 | Claim Label | 标注角色数据页 | 顶部按钮 | 高风险 | 本轮未点击 | 领取/工作分配类接口待补 | 正式脚本必须人工确认。 |
| 领取审核 | 领取审核 | Claim Review | 内审角色数据页 | 顶部按钮 | 高风险 | 本轮未点击 | 审核领取类接口待补 | 正式脚本必须人工确认。 |
| 单选条目 | 勾选行 checkbox | row checkbox | 数据条目页 | 勾选单条 | 中风险 | 已测试 | `/api/v2/item/get-frame-count` | 只用于辅助展示选择数量。 |
| 多选/全选 | 跨页全选 | Select All Across Pages | 数据条目页底部 | 勾选批量范围 | 高风险 | 未测试跨页 | 可能影响批量动作 | 默认禁用自动跨页选择。 |
| 标注入口 | 标注：1条 | Label: 1 entry（推断） | 选择条目后顶部 | 点击进入标注页 | 高风险 | 未用按钮进入，使用 URL 进入 | 标注页加载接口 | 进入前提示用户确认。 |
| same_font 选项 | true/false/unsure/error | true/false/unsure/error | 标注页 | 点击选项 | 中风险 | 已测试 `true` | 后续自动触发 `save-labels` | 自动保存风险必须提示。 |
| 暂存 | 暂存 | Save/Stash（需补实采） | 标注页 | 底部按钮 | 高风险 | 未点击 | 预计 `save-labels` | 正式脚本不自动点击。 |
| 放弃 | 放弃 | Drop/Abandon（需补实采） | 标注页 | 底部按钮 | 高风险 | 已测试一次 | `/api/v2/item/abandon-item` | 仅测试账号内触发；正式脚本必须二次确认。 |
| 跳过 | 跳过 | Skip（需补实采） | 标注页 | 底部按钮 | 高风险 | 仅记录可见 | 跳过接口待补 | 正式脚本必须二次确认。 |
| 送审 | 送审 | Submit（需补实采） | 标注页 | 底部按钮 | 高风险 | 仅记录可见 | 送审/提交接口待补 | 正式脚本必须二次确认。 |
| 恢复 | 恢复 | Restore（需补实采） | 放弃后 | 恢复状态 | 高风险 | 仅记录可见 | 恢复接口待补 | 禁止自动触发。 |
| 切换语言 | 切换语言 | Switch Language | 用户菜单 | 用户菜单 -> language | 低风险 | 已测试中英切换 | 重新加载当前页面接口，无独立语言接口可确认 | 只用于人工切换，不作为脚本功能。 |
| 分页 | 页码、10 / 页 | page number、10 / Page | 数据条目页 | 页码/分页器 | 低风险 | 仅观察 | 列表查询 | 可作为只读翻页辅助。 |

## 多语言差异

| 简体中文 | English | 备注 |
| --- | --- | --- |
| 数据条目 | Data | 左侧主导航与任务详情页标签。 |
| 统计分析 | Analytics | 左侧导航。 |
| 工作流 | Workflow | 左侧导航。 |
| 成员配置 | Members | 左侧导航。 |
| 数据任务 | Annotation | 面包屑一级。 |
| 动态任务 | Dynamic Projects | 面包屑二级。 |
| 筛选 | Filter | 筛选区标题。 |
| 条目号/文件名 | Search by ID or filename... | 搜索框 placeholder。 |
| 查看 | View | 数据条目页按钮。 |
| 领取标注 | Claim Label | 标注角色按钮。 |
| 领取审核 | Claim Review | 内审角色按钮。 |
| 全部数据 | All | 视图切换。 |
| 批次视图 | By Batch | 视图切换。 |
| 总览 | Overview | 状态 tab。 |
| 待办项 | Todo | 状态 tab。 |
| 已跳过 | Skipped | 状态 tab。 |
| 已放弃 | Dropped | 状态 tab。 |
| 标注 | Label | 当前节点/角色。 |
| 条目号 | Item ID | 表头和右侧条目列表。 |
| 帧数 | Frames | 表头。 |
| 无效帧数 | Invalid Frames | 表头。 |
| 导入轮次 | Import Round | 表头。 |
| 所属批次 | Batch | 表头。 |
| 所在节点 | Stage | 表头。 |
| 标注状态 | Label Status | 表头。 |
| 当前审核状态 | Review Status | 表头。 |
| 标注员 | Labeler | 表头。 |
| 标注团队 | Label Team | 表头。 |
| 审核员 | Reviewer | 内审表头。 |
| 审核团队 | Review Team | 内审表头。 |
| 变更时间 | Last Updated | 表头。 |
| 数据来源 | Data Source | 表头。 |
| 暂无数据 | No Data | 空态。 |
| 跨页全选 | Select All Across Pages | 底部批量选择。 |
| 已选择0条目，0帧 | Selected 0 entry, 0 frame | 选择状态。 |
| 条目数 | Items | 右侧条目列表。 |
| 锁定 / 解锁 | Lock / UnLock | 标注页状态。 |
| 修改不允许/不支持 | Modification is not allowed | 锁定说明。 |
| 个人中心 | Profile | 用户菜单。 |
| 日间模式 | Light Mode | 用户菜单。 |
| 切换语言 | Switch Language | 用户菜单。 |
| 建议反馈 | Submit Feedback | 用户菜单。 |
| 退出账户 | Logout | 用户菜单。 |

后续脚本定位不能只依赖中文文案。推荐优先级：

1. URL route 与 query keys。
2. 表头文本、区域层级、输入框 placeholder。
3. `role`、`aria-label`、`data-col-key` 等稳定属性。
4. 中文/English 双语文案兜底。
5. 避免使用 `data-v-*`、打包 hash class、完整图片/音频/文件 URL。

## Task17 对比结论

Task17 仅做公共结构查看和对比：

- 相同点：
  - 列表路由仍为 `/task-v2/data-item`。
  - `/items` 工作页仍使用资源区 + 标注控件区 + 右侧条目列表 + 顶部锁定/计时结构。
  - Network 仍包含 `get-item-info`、`find-labels`、`find-issues`、`find-label-records`、`get-ai-check-result`、`find-invalidate-frame`、`sampling/get-frames-data` 等公共加载接口。
  - 资源 URL 仍来自外部对象存储域，必须只记录资源类型和 pathname 模式。
- 差异：
  - Task17 名称为 `TASK17-9`，项目号示例为 `HM_312_v2`，列表数量明显更大。
  - Task17 处于内审/Review 结构，列表按钮为 `Claim Review`，表格有 Reviewer/Review Team。
  - Task17 `/items` 示例一次带多个 `selectIds`，右侧条目列表显示多条 `HM_312_v2#{item}`。
  - Task17 主标注不是 Task21 的 same_font，而是图片二选一、skip、原因多选、其他原因 textarea。

Task17 不是本轮主功能目标；未做领取、送审、放弃、跳过等状态变更。

## Network 结构摘要

| 用途 | method | pathname 模式 | queryKeys | requestShape | responseShape | 列表字段 | 分页字段 | 触发方式 | 是否危险操作 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户信息 | POST | `/api/auth-center/user/user-info` | 无 | `{}` | `{ code, data: { mfa, username, platform, spaceRole, nickname, email, other, space, ... } }` | `data.space.users` | 无 | 登录后自然请求 | 否 | 用户/成员字段只记录结构。 |
| 权限菜单 | GET | `/api/permission/module-tree/space` | 无 | 无 | `{ code, data: [{ title, key, router, buttons }] }` | `data` | 无 | 登录后自然请求 | 否 | 菜单权限。 |
| 空间合约 | GET | `/api/contract/space` | 无 | 无 | `{ code, data: { current, tool, module, models, scripts, exportScripts } }` | `data.tool`, `data.module` | `data.current` | 登录后自然请求 | 否 | 空间能力配置。 |
| 空间存储 | POST | `/api/auth-center/space/storage` | 无 | `{}` | `{ code, data: { type, bucket, private, expiration, ak, sk, token, end_point, storageType } }` | 无 | 无 | 登录后自然请求 | 否 | `token/sk/ak` 必须脱敏。 |
| 空间列表 | POST | `/api/auth-center/space/list` | 无 | `{ type, relation, name }` | `{ code, data: [{ users, name, ownerId, type, domainId, points }] }` | `data`, `data[].users` | `data[].points.total/current` | 详情页加载 | 否 | 成员字段不落真实值。 |
| 消息轮询 | GET | `/api/message/list` | 无 | 无 | `{ code, data: [] }` | `data` | 无 | 周期轮询 | 否 | 与业务动作无关。 |
| 任务基础列表 | POST | `/api/v2/task/get/task-basic-info-list` | 无 | `{ pageNum, pageSize, search, taskStatus }` | `{ code, data: { total, data: [taskBasic] } }` | `data.data` | `data.total` | 任务/详情页加载 | 否 | 用于任务列表和任务切换。 |
| Task 详情 | POST | `/api/v2/task/get/task-info` | 无 | `{ taskId }` | `{ code, data: { status, type, name, domainId, setting, agreement, createdAt, updatedAt } }` | `data.setting.labelConfig`, `data.setting.exportScripts` | 无 | 进入任务和 /items | 否 | `setting.toolSetting.layout` 是布局来源。 |
| Workflow | POST | `/api/v2/workflow/get/workflow-info` | 无 | `{ taskId }` | `{ code, data: { taskId, nodes, stashNodes, packageMode, config, delNodes } }` | `data.nodes` | 无 | 进入任务和 /items | 否 | 节点中包含 submit/move/skip 配置。 |
| 任务权限 | POST | `/api/v2/task/get/permission` | 无 | `{ taskId }` | `{ code, data: { taskId, workflowId, nodes, taskRole } }` | `data.nodes` | 无 | 进入任务 | 否 | 决定可见角色和按钮。 |
| 协议状态 | POST | `/api/v2/task/check-agreement-status` | 无 | `{ taskId }` | `{ code, data: boolean }` | 无 | 无 | 进入任务和 /items | 否 | 页面加载自然请求。 |
| 搜索模板 | POST | `/api/v2/item/get-item-search-template-list` | 无 | `{ taskId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | 否 | 当前为空。 |
| 批次列表 | POST | `/api/v2/package/get-package-list` | 无 | `{ taskId, pageSize, pageNum, nodeId }` | `{ code, data: { data: [package], total } }` | `data.data` | `data.total` | 批次视图加载 | 否 | 用于批次侧栏。 |
| 批次筛选 | POST | `/api/v2//package/get-package-filter-list` | 无 | `{ taskId }` | `{ code, data: [{ _id, domainId, name }] }` | `data` | 无 | Data 页加载 | 否 | 实采路径含双斜杠。 |
| 导入筛选 | POST | `/api/v2//import/get-import-filter-list` | 无 | `{ taskId, packageId? }` | `{ code, data: [{ _id, name }] }` | `data` | 无 | Data 页加载 | 否 | 实采路径含双斜杠。 |
| 条目处理人 | POST | `/api/v2/item/get-item-handlers` | 无 | `{ taskId }` | `{ code, data: { labelers, checkers } }` | `data.labelers[].users`, `data.checkers[].users` | 无 | Data 页加载 | 否 | 成员信息只记录结构。 |
| 节点操作人 | POST | `/api/v2/item/get-node-operator-info` | 无 | `{ taskId, nodeId }` | `{ code, data: [] }` | `data` | 无 | Data 页加载 | 否 | 当前为空。 |
| 条目列表 | POST | `/api/v2/item/get-task-item-list-lite` 或 `/api/v2/item/get-item-list-lite` | 无 | `{ taskId, pageNum, pageSize, search, packageIds?, nodeId?, role? }` | `{ code, data: { total, data: [item] } }` | `data.data` | `data.total` | 全部/批次/角色页加载 | 否 | 路径随视图略有差异。 |
| 条目详情 | POST | `/api/v2/item/get-item-detail` | 无 | `{ taskId, itemId/nodeId... }` | `{ code, data: object }` | 视响应而定 | 无 | Data 页自然请求 | 否 | 只记录结构。 |
| 文件查找 | POST | `/api/v2/item/find-items-file` | 无 | `{ taskId, itemIds... }` | `{ code, data: [file] }` | `data` | 无 | Data 页自然请求 | 否 | 文件 URL 字段必须脱敏。 |
| 条目历史 | POST | `/api/v2/item/get-item-history` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | 否 | 查看/标注页公共接口。 |
| 查看权限 | POST | `/api/v2/item/get-view-item-permission` | 无 | `{ taskId, itemId/nodeId }` | `{ code, data: ... }` | 无 | 无 | viewMode 页加载 | 否 | Task21/Task17 查看页均出现。 |
| 操作权限 | POST | `/api/v2//item/check-operate-item-permission` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 无 | 无 | /items 加载 | 否 | 实采路径含双斜杠。 |
| 工作开始/锁定 | POST | `/api/v2/item/work` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 无 | 无 | 标注页加载 | state-change-test | 进入标注页自然触发工作状态。 |
| 标注数据 | POST | `/api/v2/label/find-labels` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [label] }` | `data` | 无 | /items 加载 | 否 | same_font 来源之一。 |
| 问题数据 | POST | `/api/v2/label/find-issues` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [issue] }` | `data` | 无 | /items 加载 | 否 | 问题/质检结构。 |
| 标注记录 | POST | `/api/v2/label/find-label-records` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: [record] }` | `data` | 无 | /items 加载 | 否 | 历史记录。 |
| AI 检查 | POST | `/api/v2/label/get-ai-check-result` | 无 | `{ taskId, itemId, nodeId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | 否 | AI 结果只记录结构。 |
| 无效帧 | POST | `/api/v2/item/find-invalidate-frame/` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | 否 | 路径尾部带 `/`。 |
| 抽帧数据 | POST | `/api/v2/item/sampling/get-frames-data` | 无 | `{ taskId, itemId }` | `{ code, data: ... }` | 视响应而定 | 无 | /items 加载 | 否 | 图片/帧相关结构。 |
| 右侧条目列表 | POST | `/api/v2/item/find-items-base-info` | 无 | `{ taskId, itemIds/selectIds }` | `{ code, data: [baseInfo] }` | `data` | 无 | /items 加载 | 否 | 右侧条目列表。 |
| 选择帧数 | POST | `/api/v2/item/get-frame-count` | 无 | `{ taskId, itemIds: [string] }` | `{ code, data: { validCount, invalidCount } }` | 无 | 无 | 数据页单选条目 | 否 | 单选后按钮变为 `标注：1条`。 |
| 自动保存 | POST | `/api/v2/label/save-labels` | 无 | `{ taskId, itemId, nodeId, labels/issues... }` | `{ code, data: ... }` | 视响应而定 | 无 | 点击 same_font 后自动触发 | state-change-test | 已在测试账号单条触发。 |
| 放弃条目 | POST | `/api/v2/item/abandon-item` | 无 | `{ taskId, itemId, nodeId, reason?/labels? }` | `{ code, data: ... }` | 无 | 无 | 点击 `放弃` | state-change-test | 已在测试账号单条触发，出现退出确认。 |
| 跳过条目 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 点击 `跳过` | danger-confirm | 仅记录按钮，未触发。 |
| 送审/提交 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 待补 | 点击 `送审` | danger-confirm | 仅记录按钮，未触发。 |
| 资源文件 | GET | 对象存储 pathname 模式 | 可能有签名 query | 无 | `.webp/.png/.svg` 等 | 无 | 无 | 资源加载 | resource | 只记录扩展名、资源类型和 masked。 |
| 语言切换 | 未发现独立接口 | 无 | 无 | 无 | 页面重新请求当前页数据 | 无 | 无 | 用户菜单切换 English | 否 | 语言切换后页面文案更新并重新加载同类接口。 |
| Task17 对比 | POST/GET | 同 Task21 公共接口族 | 同上 | 同上 | 同上 | 同上 | 同上 | 只读查看 | 否 | 不触发 Task17 状态变更。 |

## 选择器候选

- 路由：
  - 任务列表：`/data-task/v2`
  - 数据条目：`/task-v2/data-item`
  - 标注/查看：`/items`
- query keys：
  - Data 页：`taskId`、`vm`、`dm`、可选 `batchId`、`role`
  - /items：`version`、`taskId`、`vm`、`dm`、`role`、`itemId`、`selectIds`、`nodeId`、可选 `viewMode`
- 表格定位：
  - 表头文本中英双语。
  - `data-col-key` 可做辅助：`domainId`、`frames`、`invalidFrames`、`importRound`、`packageId`、`node`、`labelStatus`、`checkStatus`、`labeler`、`labelSpace`、`checker`、`checkSpace`、`operateTime`、`dataSource`。
- same_font：
  - 标题文本 `same_font`
  - 邻近 `.label-container`、`.l-title-text`、`.radio-container`、`.radio-item`
  - 选项文本 `true/false/unsure/error`
- 用户菜单：
  - 用户名/头像区域 -> Profile/个人中心、Switch Language/切换语言。
  - 语言项：English、简体中文、日本語。

## 安全边界

- 不保存账号密码。
- 不保存 cookie、token、authorization、验证码、签名、secret、credential。
- 不保存完整资源 URL、完整音频/图片/文件 URL、OSS/TOS URL。
- 不提交真实 JSON、HAR、截图、CSV、原始接口响应。
- 不默认自动领取、自动保存、自动提交、自动流转。
- 即使采集阶段用户允许测试按钮，正式脚本也必须保留人工确认和单条范围限制。

## 后续功能候选

| 功能候选 | 依赖的数据源 | 备注 |
| --- | --- | --- |
| 任务列表识别 | `/api/v2/task/get-task-basic-info-list`、任务列表 DOM | 识别 Task21 行和状态。 |
| Task21 当前条信息采集 | `/items` query、`find-items-base-info`、右侧条目列表 | 不记录资源 URL。 |
| same_font 结构化读取 | `find-labels`、DOM `same_font` 区域 | 需要区分查看/可编辑状态。 |
| 双语按钮定位 | DOM 文案映射 + route + role | 不依赖单一中文文案。 |
| 领取标注辅助 | `Claim Label/领取标注` 按钮、权限接口 | 必须人工确认，不自动领取。 |
| 查看/标注入口辅助 | row checkbox、`get-frame-count`、顶部按钮 | 只辅助打开，不批量操作。 |
| AI 辅助建议 | same_font 字段、资源类型、用户确认结果 | 不自动写入和提交。 |
| 快捷键辅助 | /items 操作区、锁定状态、弹窗状态 | 高风险动作需二次确认。 |
| 统计导出 | 列表接口分页、条目状态字段 | 只导出脱敏统计。 |
| 操作前确认层 | 放弃/跳过/送审/暂存按钮和接口 | 防止误触发状态变更。 |
