# 02 标注任务页（mark/list）

## URL / 路由

- URL：`https://work.magicdatatech.com/#/mark/list`
- 路由：`#/mark/list`（已确认）

## 关键参数

- 页面筛选参数走请求体，不依赖固定 query（已确认）

## 主容器与组件

- `#app`（已确认）
- `el-table`（已确认：bundle 关键词）
- `el-pagination`（已确认：bundle 关键词）
- `el-input`（已确认：bundle 关键词）

## 主要区域

- 搜索筛选区（待补采 selector）
- 任务表格区（已确认存在）
- 分页区（已确认存在）

## 关键按钮

- 文案存在：`领取`、`开始`、`详情`、`标注`（已确认：bundle 关键词）
- 精确按钮选择器（待补采）

## 列表字段（由请求响应推断）

- `projectName, batchCode, batchStatus, totalCount, unclaimedCount, processingCount, nodeName, ...`

## 风险提示

- `领取/开始` 可能改变任务状态，后续自动化默认禁止。
