# 03 标注任务详情页（mark/details）网络摘要

## 页面

- URL 示例：`https://work.magicdatatech.com/#/mark/details?...`

## 请求 1：详情列表

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/userTaskDetail/getUserTaskDetailList`
- query keys：无
- payload 字段名：
  - `projectId,batchId,processNodeId,teamId,formType,packageId,pageNum,pageSize,checkResult`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`total,pageSize,pages,pageNum,list`
- list 常见字段：`id,packageId,taskCount,checkResult,annotate,repair,edit,see,...`
- 用途推断：加载当前批次下的包/子任务列表
- ID 字段：`projectId,batchId,processNodeId,teamId`
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 2：详情头部信息

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/userTaskDetail/detail`
- query keys：无
- payload 字段名：`batchId,processNodeId,projectId,teamId,userId`
- response 顶层字段：`code,data,message`
- data 常见字段：`projectId,projectType,projectName,batchId,processNodeId,teamId,userId,nodeName,extend`
- 用途推断：加载页面顶部任务上下文信息
- 是否敏感操作：否（读）
- 自动化边界：可观察
