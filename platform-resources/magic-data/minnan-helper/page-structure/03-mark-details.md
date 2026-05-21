# 03 标注任务详情页（mark/details）

## URL / 路由

- URL 示例：`https://work.magicdatatech.com/#/mark/details?batchId=...&processNodeId=...&projectId=...&teamId=...&userId=...&projectType=AS`
- 路由：`#/mark/details`（通过真实导航确认）

## 核心 query 参数（已确认）

- `batchId`
- `processNodeId`
- `projectId`
- `teamId`
- `userId`
- `projectType`

## 主容器与组件

- `#app`（已确认）
- `el-table`、`el-pagination`（已确认：bundle 关键词）

## 主要区域

- 详情摘要区（来自 `userTaskDetail/detail`，已确认）
- 子任务/包列表区（来自 `getUserTaskDetailList`，已确认）
- 分页区（已确认存在）

## 关键按钮

- 进入单条标注页按钮（待补采 selector）
- 可能存在领取/流转相关按钮（待补采）

## 列表字段（由响应推断）

- `id, packageId, taskCount, checkResult, annotate, repair, edit, see, ...`

## 风险提示

- 若出现提交/流转类按钮，均按敏感动作处理。
