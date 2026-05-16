# Abaka AI Task21 网络请求（脱敏）

## 采集范围

- 采集日期：2026-05-16。
- 采集方式：Google Chrome DevTools MCP，读取页面已发生请求与只读 DOM 摘要。
- 主页面：`/data-task/v2`、`/task-v2/data-item`、`/items`。
- 主目标：Task21。
- 对比目标：Task17-9 / Task17-8，只读采集公共结构差异。

平台通用初始化、任务权限、空间与消息类接口见 [../network.md](../network.md)。本文件只记录 Task 页面和 Task21 same_font 相关请求结构。

## 脱敏规则

- 不记录账号、密码、cookie、authorization、token、access_token、refresh_token、secret、signature、credential、session。
- 不记录完整音频、图片、文件、下载、对象存储、`src`、`href`、`url`、`path` 值。
- 对资源字段只记录类型、是否脱敏、可能扩展名和字段结构。
- 请求与响应只记录字段名、类型、列表路径、分页路径和状态类公开文案，不提交完整 payload。
- Task21 业务识别信息可以用于测试账号内定位，但后续脚本不得硬编码真实 ID。

## Data 页请求链

### 1. 搜索模板

- Method：`POST`。
- Path：`/api/v2/item/get-item-search-template-list`。
- Query：无实采必要 query。
- Request：`taskId`、视图或节点上下文字段。
- Response：模板列表，包含筛选字段、字段类型、可选项结构。
- 触发方式：进入数据条目页后加载筛选区。
- 是否状态变更：否。
- 后续脚本策略：只读，可用于识别筛选区结构；不得保存筛选值。

### 2. 批次列表

- Method：`POST`。
- Path：`/api/v2/package/get-package-list`。
- Query：无实采必要 query。
- Request：`taskId`、分页或筛选字段。
- Response：`data` 下返回批次数组，批次对象包含批次名称、批次 ID、数量或状态类字段。
- 列表字段：`data` 或 `data.list`，以实测响应为准。
- 分页字段：待补。
- 触发方式：Task21 数据条目页、批次视图加载。
- 是否状态变更：否。
- 后续脚本策略：只读，批次 ID 必须模式化为 `{batchId}`。

### 3. 批次筛选

- Method：`POST`。
- Path：`/api/v2//package/get-package-filter-list`。
- Query：待补。
- Request：`taskId`、筛选上下文字段。
- Response：批次筛选候选列表。
- 触发方式：数据条目页筛选区初始化。
- 是否状态变更：否。
- 备注：实采路径包含双斜杠，文档保留观测事实。

### 4. 导入轮次筛选

- Method：`POST`。
- Path：`/api/v2//import/get-import-filter-list`。
- Query：待补。
- Request：`taskId`、筛选上下文字段。
- Response：导入轮次候选列表。
- 触发方式：数据条目页筛选区初始化。
- 是否状态变更：否。
- 备注：实采路径包含双斜杠，后续代码匹配时应兼容规范化路径。

### 5. 条目处理人

- Method：`POST`。
- Path：`/api/v2/item/get-item-handlers`。
- Query：待补。
- Request：`taskId`、节点或角色上下文字段。
- Response：处理人列表，包含用户 ID、显示名、团队或角色类字段。
- 触发方式：数据条目页筛选区或表格辅助数据加载。
- 是否状态变更：否。
- 安全备注：不记录测试账号以外的人员敏感值。

### 6. 节点操作人

- Method：`POST`。
- Path：`/api/v2/item/get-node-operator-info`。
- Query：待补。
- Request：`taskId`、`nodeId`、角色上下文字段。
- Response：节点操作人摘要，包含用户、节点、角色关系字段。
- 触发方式：数据条目页初始化或角色切换后加载。
- 是否状态变更：否。

### 7. 条目列表

- Method：`POST`。
- Path：`/api/v2/item/get-task-item-list-lite`、`/api/v2/item/get-item-list-lite`。
- Query：待补。
- Request：`taskId`、`batchId`、`role`、`nodeId`、分页字段、筛选字段、状态字段。
- Response：条目列表，包含条目号、帧数、无效帧数、导入轮次、所在节点、所属批次、标注状态、当前审核状态、标注员、标注团队、标注入口类字段。
- 列表字段：`data.list`、`data.records` 或同级列表字段，需以后续实测为准。
- 分页字段：`total`、`page`、`pageSize`、`current`、`pages` 类字段，需以后续实测为准。
- 触发方式：数据条目页加载、批次切换、角色切换、分页、搜索。
- 是否状态变更：否。
- 后续脚本策略：可用于任务列表识别和当前条目定位；不得记录客户原始内容。

### 8. 条目详情

- Method：`POST`。
- Path：`/api/v2/item/get-item-detail`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId` 或角色上下文字段。
- Response：单条条目摘要，包含条目、节点、状态、资源引用结构。
- 触发方式：数据条目页选中条目或进入 `/items` 前后。
- 是否状态变更：否。
- 安全备注：资源引用字段必须脱敏。

### 9. 文件查找

- Method：`POST`。
- Path：`/api/v2/item/find-items-file`。
- Query：待补。
- Request：`taskId`、`itemIds` 或 `selectIds`。
- Response：条目资源列表，包含图片、音频、文本或文件引用结构。
- 触发方式：数据条目页选择条目、查看页或标注页加载资源。
- 是否状态变更：否。
- 安全备注：只记录资源类型和字段结构，不记录完整资源地址。

### 10. 选择帧数

- Method：`POST`。
- Path：`/api/v2/item/get-frame-count`。
- Query：待补。
- Request：`taskId`、`itemIds` 或 `selectIds`。
- Response：选中条目的帧数统计。
- 触发方式：单选或多选条目后。
- 是否状态变更：否。
- 后续脚本策略：可用于识别选择数量和帧数反馈。

## /items 查看页请求链

### 查看权限

- Method：`POST`。
- Path：`/api/v2/item/get-view-item-permission`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、`viewMode`。
- Response：是否允许查看、是否锁定、可见操作权限结构。
- 触发方式：进入 `/items` 查看页。
- 是否状态变更：否。

### 条目历史

- Method：`POST`。
- Path：`/api/v2/item/get-item-history`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`。
- Response：历史节点、操作记录、状态变更摘要列表。
- 触发方式：查看页或标注页加载。
- 是否状态变更：否。

### 操作权限检查

- Method：`POST`。
- Path：`/api/v2//item/check-operate-item-permission`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、操作类型。
- Response：是否允许当前操作、原因或提示结构。
- 触发方式：进入 `/items` 页或点击操作前校验。
- 是否状态变更：否。
- 备注：实采路径包含双斜杠。

### 条目信息

- Method：`POST`。
- Path：`/api/v2/item/get-item-info`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、`selectIds`。
- Response：当前条目的基础信息、状态、资源引用与节点字段。
- 触发方式：查看页和标注页初始化。
- 是否状态变更：否。

### 标注数据

- Method：`POST`。
- Path：`/api/v2/label/find-labels`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、`selectIds`。
- Response：标签结果数组，Task21 same_font 相关字段位于标注数据结构中。
- 列表字段：待补。
- 触发方式：查看页和标注页初始化。
- 是否状态变更：否。
- 后续脚本策略：只读解析 same_font；不得写入真实标注内容。

### 问题数据

- Method：`POST`。
- Path：`/api/v2/label/find-issues`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`。
- Response：问题或质检意见列表。
- 触发方式：查看页和标注页初始化。
- 是否状态变更：否。

### 标注记录

- Method：`POST`。
- Path：`/api/v2/label/find-label-records`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`。
- Response：标注历史记录列表，包含操作人、时间、节点或版本字段。
- 触发方式：查看页和标注页初始化。
- 是否状态变更：否。

### AI 检查

- Method：`POST`。
- Path：`/api/v2/label/get-ai-check-result`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`。
- Response：AI 检查结果结构，可能包含状态、分数、规则或提示字段。
- 触发方式：查看页和标注页初始化或检查区域加载。
- 是否状态变更：否。
- 后续脚本策略：AI 结果只能作为辅助建议，不自动保存或提交。

### 无效帧

- Method：`POST`。
- Path：`/api/v2/item/find-invalidate-frame/`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`。
- Response：无效帧列表或统计字段。
- 触发方式：查看页和标注页初始化。
- 是否状态变更：否。

### 抽帧数据

- Method：`POST`。
- Path：`/api/v2/item/sampling/get-frames-data`。
- Query：待补。
- Request：`taskId`、`itemId`、抽帧或分页上下文字段。
- Response：帧列表、帧资源引用、帧索引和状态字段。
- 触发方式：查看页和标注页资源区加载。
- 是否状态变更：否。
- 安全备注：帧图片或文件地址必须脱敏。

### 右侧条目列表

- Method：`POST`。
- Path：`/api/v2/item/find-items-base-info`。
- Query：待补。
- Request：`taskId`、`selectIds`、当前 `itemId`。
- Response：右侧条目列表，包含条目 ID、序号、状态、当前选中标记。
- 列表字段：待补。
- 触发方式：进入 `/items` 查看页或标注页。
- 是否状态变更：否。

## /items 标注页状态变更请求

本节接口属于高风险或需确认动作。采集阶段只在测试账号和 Task21 测试数据范围内做最小操作记录；后续正式脚本不得默认自动触发。

### 工作开始 / 锁定

- Method：`POST`。
- Path：`/api/v2/item/work`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、`selectIds`、角色或工作状态字段。
- Response：锁定结果、当前工作状态、可操作权限或提示字段。
- 触发方式：进入标注页或开始工作状态。
- 是否状态变更：是。
- 后续脚本策略：禁止静默触发；如需辅助进入工作状态，必须人工确认。

### 自动保存

- Method：`POST`。
- Path：`/api/v2/label/save-labels`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、标签数组、same_font 字段或标签结果结构。
- Response：保存状态、标签版本、错误提示或校验字段。
- 触发方式：采集到 same_font 选项变化后可能触发自动保存。
- 是否状态变更：是。
- 后续脚本策略：正式功能不得自动写入；AI 建议只能填充到人工确认层。

### 放弃条目

- Method：`POST`。
- Path：`/api/v2/item/abandon-item`。
- Query：待补。
- Request：`taskId`、`itemId`、`nodeId`、`selectIds`、原因或状态字段。
- Response：操作结果、状态更新、Toast 或错误提示结构。
- 触发方式：点击放弃按钮并完成确认。
- 是否状态变更：是。
- 后续脚本策略：高风险动作，必须二次确认；不得批量自动触发。

### 跳过条目

- Method：待补。
- Path：待补。
- Query：待补。
- Request：待补。
- Response：待补。
- 触发方式：点击跳过按钮。
- 是否状态变更：是。
- 后续脚本策略：高风险动作，必须人工确认；本轮未确认接口结构，不得实现自动化。

### 送审 / 提交

- Method：待补。
- Path：待补。
- Query：待补。
- Request：待补。
- Response：待补。
- 触发方式：点击送审或提交按钮。
- 是否状态变更：是。
- 后续脚本策略：高风险动作，必须人工确认；本轮未确认接口结构，不得实现自动化。

### 暂存

- Method：待补。
- Path：待补。
- Query：待补。
- Request：待补。
- Response：待补。
- 触发方式：点击暂存按钮或页面自动暂存。
- 是否状态变更：是。
- 后续脚本策略：需先区分自动保存与人工暂存，不得推断为同一接口。

### 恢复

- Method：待补。
- Path：待补。
- Query：待补。
- Request：待补。
- Response：待补。
- 触发方式：恢复已放弃或已跳过条目。
- 是否状态变更：是。
- 后续脚本策略：必须单独确认弹窗、接口和可撤回范围。

## Task17 对比接口

Task17 与 Task21 共用 `/task-v2/data-item` 和 `/items` 页面外壳，公共接口模式包括任务信息、条目列表、查看权限、条目信息、标注数据、右侧条目列表、资源加载等。差异主要来自：

- `taskId`、`itemId`、`nodeId`、`selectIds` 值不同。
- 工具类型、任务名称、节点与角色配置不同。
- Task21 以 same_font 为主标注结构；Task17 只用于公共组件和路由结构对比。
- Task17 本轮不做领取、送审、放弃、跳过等状态变更测试。

## 待补接口

- 领取标注。
- 领取审核。
- 跳过条目。
- 送审 / 提交。
- 暂存按钮。
- 恢复已跳过或已放弃条目。
- 异常弹窗与失败响应结构。
- 统计分析、工作流、成员配置页专项接口。
