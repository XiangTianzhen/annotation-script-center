# Abaka AI Task21 项目资料

## 当前状态

- 主目标：Task21。
- 专项结构：`same_font`、`image_b_texts_removed`、`other_changes`。
- 当前阶段：Task21 专项页面和接口结构已采集，待进入功能设计。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本、Network 面板结构观察。
- 当前不做自动化功能，不实现自动领取、自动保存、自动提交、自动流转。

公共 Task 页面能力已经上移到 `../` 根目录，包括 Data 页、状态 Tab、Skipped / Dropped / Recovery、领取、查看、语言切换、资源加载和动作边界。

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | Task21 项目入口、业务识别和资料导航。 |
| `network.md` | Task21 专项 Network 概览。 |
| `network/README.md` | Task21 专项网络索引。 |
| `network/08-label-save-labels.md` | Task21 same_font 与派生字段保存结构。 |
| `page-structure.md` | Task21 same_font 页面结构和选择器策略。 |

公共资料入口：

- 平台公共网络：`../network.md`
- Task 页面公共网络：`../network/README.md`
- Task 页面公共结构：`../page-structure.md`
- Task 页面公共动作边界：`../actions.md`
- Task 页面公共多语言：`../i18n.md`

## Task21 业务识别

| 字段 | 样例 |
| --- | --- |
| 任务号 / Project ID | `#HM_395_v2` |
| 名称 / Name | `Task21` |
| 工具类型 / Tool Type | `MMAT` |
| 所属团队 / Team | `abaka.ai` |
| 创建者 / Owner | `Anniejln` |
| 创建时间 / Created Time | `04-30-2026 22:01:33` |

这些值来自测试账号内的页面结构识别样例，用于人工核对和候选定位，不应作为后续脚本的唯一硬编码依据。

## Task21 页面入口

| 页面 | URL 模式 | 说明 |
| --- | --- | --- |
| Task21 全部数据页 | `/task-v2/data-item?taskId={taskId}&vm=all&dm=all` | Data 页全部数据视图，公共结构见 `../page-structure.md`。 |
| Task21 批次页 | `/task-v2/data-item?taskId={taskId}&vm=batch&dm=all&batchId={batchId}` | 批次侧栏 + 条目列表。 |
| Task21 标注角色页 | `/task-v2/data-item?taskId={taskId}&role={labelRoleId}` | 标注节点，主按钮为领取标注。 |
| Task21 内审角色页 | `/task-v2/data-item?taskId={taskId}&role={reviewRoleId}` | 内审节点，主按钮为领取审核。 |
| Task21 查看页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&viewMode=true&nodeId={nodeId}` | 只读查看工作页。 |
| Task21 标注页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&nodeId={nodeId}` | 可编辑 same_font 标注工作页。 |

详细公共 DOM 见 `../page-structure.md`，Task21 same_font 结构见 `page-structure.md`。

## Network 入口

- 平台通用初始化、权限、任务和资源接口：`../network.md`
- Data 页、`/items` 初始化、领取、状态流转、语言和资源接口：`../network/README.md`
- Task21 same_font 保存接口：`network.md`
- Task21 专项 Network 采集索引：`network/README.md`
- 重点专项文档：`network/08-label-save-labels.md`

## 后续功能候选

- Task21 当前条信息采集。
- same_font 结构化读取。
- 双语按钮定位。
- 查看 / 标注入口辅助。
- AI 辅助建议。
- 快捷键辅助。
- 统计导出。
- 操作前确认层。

## 待补清单

- 内审 Reject / Label / Pass 流转接口，本轮边界禁止采集。
- 异常弹窗、保存失败提示、权限不足提示。
- 更多 Task21 same_font 条目状态下的字段差异。
