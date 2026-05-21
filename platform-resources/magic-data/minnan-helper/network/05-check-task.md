# 05 审核任务页（checkTask）网络摘要

## 页面

- URL：`https://work.magicdatatech.com/#/checkTask`

## 请求：审核任务列表

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/userTask/getUserTaskList`
- query keys：无
- payload 字段名：
  - `taskTypeEnum,pageNum,pageSize,projectCodeOrName,batchCode,batchStatus`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`total,pageSize,pages,pageNum,list`
- list 常见字段（脱敏结构）：
  - `id,userId,projectId,batchId,processNodeId,taskType,nodeName,sampling,samplingTemplate,...`
- 用途推断：加载“审核任务”列表
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 备注

- 领取审核/进入审核详情属于后续动作，本轮仅观察列表加载请求。
