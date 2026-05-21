# 05 审核任务页（checkTask）

## URL / 路由

- URL：`https://work.magicdatatech.com/#/checkTask`
- 路由：`#/checkTask`（已确认）

## 主容器与组件

- `#app`（已确认）
- `el-table`、`el-pagination`、`el-input`（已确认：bundle 关键词）

## 主要区域

- 搜索筛选区（待补采 selector）
- 审核任务表格区（已确认存在）
- 分页区（已确认存在）

## 关键按钮

- 详情/进入审核按钮（待补采）
- 可能存在领取审核按钮（待补采）

## 列表字段（由响应推断）

- `projectName, batchCode, taskType, unclaimedCount, processingCount, nodeName, sampling, ...`

## 风险提示

- 领取/开始审核会改变状态，默认禁止自动触发。
