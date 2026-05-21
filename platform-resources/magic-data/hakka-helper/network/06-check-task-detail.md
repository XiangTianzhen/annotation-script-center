# 06 审核任务详情页（checkdata/taskDetail）网络摘要

## 页面

- URL 示例：`https://work.magicdatatech.com/#/checkdata/taskDetail?...`

## 请求 1：任务详情上下文

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/userTaskDetail/detail`
- query keys：无
- payload 字段名：`batchId,processNodeId,projectId,teamId,userId`
- response 顶层字段：`code,data,message`
- data 常见字段：`projectId,projectType,batchId,processNodeId,teamId,userId,nodeName,extend`
- 用途推断：加载审核任务头部信息
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 2：抽检记录分页

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/sampling/samplingRecordPage`
- query keys：无
- payload 字段名：`batchId,code,pageNum,pageSize,projectId,status,teamId,userId,processDefineNodeId`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`total,pageSize,pages,pageNum,list`
- list 常见字段：`id,code,condition,itemCount,checkCount,status,statusName,startTime,...`
- 用途推断：加载待审核/审核中记录列表
- ID 字段：`projectId,batchId,teamId,userId,processDefineNodeId`
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 备注

- 进入单条审核页按钮可能触发路由跳转，不直接写状态。
- 审核提交类请求在单条页识别，详见 `07-asrmark-check.md` 与 `08-sensitive-operations.md`。
