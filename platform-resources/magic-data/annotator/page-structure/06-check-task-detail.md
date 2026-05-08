# 06 审核任务详情页（checkdata/taskDetail）

## URL / 路由

- URL 示例：`https://work.magicdatatech.com/#/checkdata/taskDetail?id=...&projectId=...&batchId=...&processNodeId=...&teamId=...&userId=...&formType=1&...`
- 路由：`#/checkdata/taskDetail`（已确认）

## 核心参数（已确认）

- `id, projectId, batchId, processNodeId, teamId, userId, taskType, formType`（其余统计类参数可选）

## 主容器与组件

- `#app`（已确认）
- 列表区组件推定 `el-table`（待补采）

## 主要区域

- 任务摘要区（来自 `userTaskDetail/detail`）
- 抽检记录列表区（来自 `sampling/samplingRecordPage`）
- 分页区（待补采）

## 关键按钮

- 进入审核单条页按钮（待补采）
- 抽检/导出相关按钮（待补采）

## 列表字段（由响应推断）

- `id, code, condition, itemCount, checkCount, status, statusName, ...`

## 风险提示

- 列表内可能包含影响状态的操作按钮，默认禁止自动触发。
