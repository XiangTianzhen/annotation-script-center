# 02 标注任务页（mark/list）网络摘要

## 页面

- URL：`https://work.magicdatatech.com/#/mark/list`

## 请求：任务列表

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/userTask/getUserTaskList`
- query keys：无
- payload 字段名：
  - `taskTypeEnum,pageNum,pageSize,projectCodeOrName,batchCode,batchStatus`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`total,pageSize,pages,pageNum,list`
- list 常见字段（脱敏结构）：
  - `id,userId,projectId,projectName,projectCode,batchId,batchCode,processNodeId,taskType,teamId,nodeName,annotate,detail,sampling,...`
- 用途推断：加载“标注任务”列表
- ID 字段：`userId/projectId/batchId/processNodeId/teamId`
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 备注

- 页面按钮可能触发领取/开始等写操作，但本轮未点击。
