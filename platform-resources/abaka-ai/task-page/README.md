# Abaka AI Task 页面资料

## 当前状态

- 主目标：Task21。
- 对比目标：Task17-9 / Task17-8，仅用于公共结构对比。
- 当前阶段：Task21 页面和接口结构已采集，待进入功能设计。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本、Network 面板结构观察。
- 当前不做自动化功能，不实现自动领取、自动保存、自动提交、自动流转。

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | Task 页面资料入口、当前状态、业务识别、资料导航。 |
| `network.md` | Task21 Network 概览和 `network/` 目录入口。 |
| `network/` | 按 LabelX 快判风格拆分的编号 Network 文档，每个动作或接口独立记录。 |
| `network/common/` | Task 页面公共状态能力：状态 Tab、Skipped / Dropped、恢复、标注送审成功、内审只读观察。 |
| `page-structure.md` | Task21 页面、DOM、same_font、选择器候选和 Task17 对比。 |
| `actions.md` | 领取、查看、标注、暂存、放弃、跳过、送审等动作风险边界。 |
| `i18n.md` | 简体中文与 English 文案映射、双语定位策略。 |

平台级通用网络请求维护在 `platform-resources/abaka-ai/network.md`。

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

## 页面入口

| 页面 | URL 模式 | 说明 |
| --- | --- | --- |
| 登录页 | `/login` | 用户手动登录入口。 |
| 动态任务列表页 | `/data-task/v2` | Dynamic Projects 列表，含 Task21 行。 |
| Task21 全部数据页 | `/task-v2/data-item?taskId={taskId}&vm=all&dm=all` | Data 页全部数据视图。 |
| Task21 批次页 | `/task-v2/data-item?taskId={taskId}&vm=batch&dm=all&batchId={batchId}` | 批次侧栏 + 条目列表。 |
| Task21 标注角色页 | `/task-v2/data-item?taskId={taskId}&role={labelRoleId}` | 标注节点，主按钮为领取标注。 |
| Task21 内审角色页 | `/task-v2/data-item?taskId={taskId}&role={reviewRoleId}` | 内审节点，主按钮为领取审核。 |
| Task21 查看页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&viewMode=true&nodeId={nodeId}` | 只读查看工作页。 |
| Task21 标注页 | `/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&nodeId={nodeId}` | 可编辑标注工作页。 |
| Task17 对比页 | `/task-v2/data-item?taskId={task17Id}`、`/items?taskId={task17Id}&viewMode=true` | 仅用于公共结构对比。 |

详细 DOM、same_font 和选择器策略见 `page-structure.md`。

## Network 入口

- 平台通用初始化、权限、任务和资源接口：`../network.md`
- Task21 Data 页、`/items` 查看页、标注页状态变更接口概览：`network.md`
- Task21 详细 Network 采集索引：`network/README.md`
- Task 页面公共状态流转：`network/common/README.md`
- 重点动作独立文档：
  - `network/08-label-save-labels.md`
  - `network/09-abandon-item.md`
  - `network/10-skip-item.md`
  - `network/11-submit-review.md`
  - `network/common/04-restore-skipped-item.md`
  - `network/common/05-restore-dropped-item.md`
  - `network/common/06-label-submit-success.md`
  - `network/common/07-review-role-no-submit.md`
  - `network/14-claim-label.md`
  - `network/15-claim-review.md`

README 不再维护完整接口大表，避免同一接口在多个文件中重复。

## 后续功能候选

- 任务列表识别。
- Task21 当前条信息采集。
- same_font 结构化读取。
- 双语按钮定位。
- 查看 / 标注入口辅助。
- AI 辅助建议。
- 快捷键辅助。
- 统计导出。
- 操作前确认层。

## 待补清单

- 领取标注 / 领取审核空池失败响应。
- Label Tab 专属请求。
- Dropped 恢复后准确目标状态。
- 内审 Reject / Label / Pass 流转接口，本轮边界禁止采集。
- 异常弹窗、保存失败提示、权限不足提示。
- 统计分析、工作流、成员配置页结构。
- 更多批次和更多条目状态下的字段差异。
