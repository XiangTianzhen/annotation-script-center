# 04 标注单条页（asrmark）网络摘要

## 页面

- URL 示例：`https://work.magicdatatech.com/#/asrmark?taskItemId=...&formType=1&userId=...`

## 请求 1：标注配置

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/annotateTask/getLabelConf`
- query keys：`taskItemId`
- payload 字段：无
- response 顶层字段：`code,data,message,messageDetail`
- 用途推断：读取项目标注规则（如音频有效性、说话人属性、质检理由等）
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 2：单条标注详情

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/annotateTask/annotateDetailInfo/{taskItemId}`
- query keys：无
- payload 字段名：`taskItemId`
- response 顶层字段：`code,data,message`
- data 常见字段（脱敏结构）：
  - `taskItemId,taskBranchId,dataItemDTOList,data.path,data.mark_info,data.statistics,processNodeId,isSubmit,...`
- 用途推断：加载当前单条音频与文本标注数据
- ID 字段：`taskItemId,taskBranchId,processNodeId`
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 3：头部状态信息

- method：`POST`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/annotateTask/annotateHeaderInfo/{taskItemId}`
- query keys：无
- payload 字段名：`taskItemId`
- response 顶层字段：`code,data,message`
- data 常见字段：`projectName,batchNo,packageId,expirationTime,saveSuccessTime,annotateMode,isSubmit,...`
- 用途推断：加载顶部状态与剩余信息
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 4：音频资源

- method：`GET`（media）
- hostname：`magicdatacloud.oss-cn-beijing.aliyuncs.com`
- pathname 模式：`/from_cloud/.../audio/*.wav`
- query keys：`Expires,OSSAccessKeyId,Signature`
- 用途推断：播放当前条目音频
- 是否包含签名参数：是
- 是否敏感操作：否（读），但 URL 敏感
- 自动化边界：可观察；禁止文档保存完整 URL

## 敏感动作提醒

- 本页常见写接口（save/submit/pending/upOrDown/goBack）已识别但本轮未触发。
