# 07 审核单条页（asrmarkCheck）网络摘要

## 页面

- URL 示例：`https://work.magicdatatech.com/#/asrmarkCheck?formType=1&id=...`

## 请求 1：抽检预览列表

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/sampling/asrPreview/{samplingRecordId}`
- query keys：无
- payload 字段：无
- response 顶层字段：`code,data,message`
- data 常见字段：`seq,speakerInfo,content,preContent,sampRecordId,taskBranchId,taskItemId,startTime,endTime`
- 用途推断：加载本次抽检记录下的句子预览列表
- 是否敏感操作：否（读）
- 自动化边界：可观察（文本仅脱敏引用）

## 请求 2：审核页标注配置

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/sampling/getLabelConf`
- query keys：`sampRecordId`
- response 顶层字段：`code,data,message,messageDetail`
- 用途推断：加载审核规则与字段约束
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 3：当前审核条目详情

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/sampling/taskInfo/{samplingRecordId}`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段（脱敏结构）：
  - `samplingRecordId,taskBranchId,taskItemId,data.path,data.mark_info,data.statistics,allTaskBranchList,currentPkgItemList,isSubmit,...`
- 用途推断：加载当前审核条目完整数据
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 4：审核页面项目信息

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/sampling/projectInfo/{samplingRecordId}`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`projectName,batchId,batchNo,nodeId,projectRate,closeButton,...`
- 用途推断：加载审核头部项目状态信息
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 5：批次用户配置

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/mtBatchUserCfg/{batchId}`
- response 顶层字段：`code,data,message,messageDetail`
- data 常见字段：`batchId,value`
- 用途推断：加载批次级审核配置
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 6：历史提交人

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/annotateTask/historySubmitter/{taskItemId}`
- response 顶层字段：`code,data,message`
- data 常见字段：`nodeName,nickName,groupName,submitTime`
- 用途推断：显示历史提交人/时间
- 是否敏感操作：否（读，含个人信息字段，文档只保留字段名）
- 自动化边界：可观察

## 请求 7：音频资源

- method：`GET`（media）
- hostname：`magicdatacloud.oss-cn-beijing.aliyuncs.com`
- pathname 模式：`/from_cloud/.../audio/*.wav`
- query keys：`Expires,OSSAccessKeyId,Signature`
- 用途推断：播放审核条目音频
- 是否敏感操作：否（读），但 URL 敏感
- 自动化边界：可观察；禁止保存完整 URL

## 备注

- 本页可能触发审核保存/提交/通过/驳回相关接口，本轮未触发。
