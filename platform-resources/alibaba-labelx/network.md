# Alibaba LabelX 通用网络请求（脱敏）

## 目录定位

本文件记录 Alibaba LabelX 在 ASR 转写和 ASR 快判中已确认共用的网络接口结构。项目专属字段、任务识别规则和统计取数策略仍维护在各脚本目录：

- `asr-transcription/network.md`
- `asr-judgement/network/`

## 采集范围

- 采集日期：2026-05-09
- 采集方式：Chrome DevTools MCP，已登录会话，人工授权后执行可逆操作。
- 采集页面：
  - 审核首页：`/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
  - 审核详情页：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 本轮样例为 `labelModel=single` 的 ASR 转写任务；快判已存在独立采集资料，公共接口形态一致时在本文件合并记录。

## 脱敏规则

- 不记录 cookie、SSO token、access token、authorization、完整 session。
- 不记录完整签名音频 URL。音频 URL 只记录字段路径、hostname、pathname 后缀和 query 参数名。
- 不记录完整用户隐私字段。
- 请求和响应示例只保留字段名、状态码、列表数量和业务含义。

## 详情页初始化请求

刷新详情页后，ASR 转写和快判详情页都会出现以下核心请求链。

### 1. 子任务数据

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- Query：
  - `page`
  - `pageSize`
  - `filterPassedVote`
  - `filter`
  - `_`
- 转写审核详情页实测：
  - `page=1`
  - `pageSize=10`
  - `filterPassedVote=false`
  - `filter={"questions":[],"dataStatus":"ALL","questionsQueryConditions":"AND"}`
- Response：
  - `code`
  - `success`
  - `data.id`
  - `data.type`
  - `data.taskId`
  - `data.batchId`
  - `data.status`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.taskName`
  - `data.size`
  - `data.template`
  - `data.templateConfig`
  - `data.dataList[]`
  - `data.dataResultHistory`
  - `data.rejectReason`
  - `data.labelModel`
  - `data.supportModify`
  - `data.taskType`
- `data.dataList[]` 常见字段：
  - `dataId`
  - `batchId`
  - `data`
  - `componentsResult`
  - `result`
  - `labelDate`
  - `operator`
  - `userId`
  - `status`
  - `batchKey`
  - `mistakeReason`
  - `hasMistake`
  - `voteResultList`
  - `passVote`
  - `type`
  - `isAllRequiredLabeled`
  - `mistakeId`
  - `pendingConfirm`
  - `checkUserId`
  - `reviewUserId`
  - `aoneWebIdeUrl`

### 2. 子任务摘要

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/summary`
- Query：
  - `_`
- Response：
  - `data.id`
  - `data.total`
  - `data.mistakeCount`

### 3. 子任务看板

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/board`
- Query：
  - `filterPassedVote`
  - `filter`
  - `_`
- Response：
  - `data.subTaskId`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.size`
  - `data.dataList[]`
- `data.dataList[]`：
  - `dataId`
  - `hasResult`
  - `hasMistake`

### 4. 任务基础信息

- Method：`GET`
- Path：`/api/v1/label/tasks/getLabelTaskInfo`
- Query：
  - `taskId`
  - `_`
- Response：
  - `data.id`
  - `data.name`
  - `data.type`
  - `data.bizType`
  - `data.status`
  - `data.createTime`
  - `data.dataset`
  - `data.template`
  - `data.processConfigVO`
- `data.processConfigVO` 常见字段：
  - `needLabelProcess`
  - `needCheckProcess`
  - `needReviewProcess`
  - `checkRate`
  - `labelAssignments`
  - `checkAssignments`
  - `reviewAssignments`
  - `adminAssignments`
  - `assignBatchType`
  - `assignBatchSize`
  - `assignBatchField`
  - `description`
  - `labelModel`
  - `voteNum`
  - `taskClaimNum`

## 首页列表请求

标注首页和审核首页共用 `tasks`、`subTasks`、`tasks/process` 三类接口，区别主要在 `type` / `subTaskType` 参数。

### 1. 任务列表

- Method：`GET`
- Path：`/api/v1/label/center/tasks`
- Query：
  - `subTaskType`：`label` 或 `check`
  - `keyword`
  - `appId`
  - `page`
  - `pageSize`
  - `_`
- Response：
  - `data.recordCount`
  - `data.data[]`
- `data.data[]` 字段：
  - `taskId`
  - `subTaskType`
  - `name`
  - `gmtCreate`
  - `total`
  - `left`
  - `labelModel`

### 2. 子任务列表

- Method：`GET`
- Path：`/api/v1/label/center/subTasks`
- Query：
  - `type`：`label` 或 `check`
  - `keyword`
  - `appId`
  - `finished`
  - `page`
  - `pageSize`
  - `_`
- Response：
  - `data.recordCount`
  - `data.data[]`
- `data.data[]` 字段：
  - `id`
  - `type`
  - `taskId`
  - `batchId`
  - `status`
  - `gmtCreate`
  - `gmtCommit`
  - `taskName`
  - `size`
  - `template`
  - `templateConfig`
  - `dataList`
  - `dataResultHistory`
  - `rejectReason`
  - `labelModel`
  - `supportModify`
  - `taskType`

### 3. 任务进度

- Method：`GET`
- Path：`/api/v1/label/center/tasks/process`
- Query：
  - `subTaskType`
  - `taskIds`
  - `_`
- Response：
  - `data[]`
- `data[]` 字段：
  - `taskId`
  - `subTaskType`
  - `name`
  - `gmtCreate`
  - `total`
  - `left`
  - `labelModel`

## 保存和审核订正请求

### 1. 保存当前题数据

- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- 触发：
  - 切换单选。
  - 编辑转写文本后失焦。
  - 审核详情页订正答案后自动保存。
- Request body：
  - `dataList`
  - `timestamp`
- 观察结论：
  - 当前平台保存体是单条 `dataList`，不是整包 50 条。
  - 保存成功后会刷新 `summary` 和 `board`。

### 2. 审核错误 / 订正状态

- Method：`POST`
- Path：`/api/v1/label/center/mistake`
- 触发：
  - 审核详情页切换有效性或订正状态。
- Request body：
  - `type`
  - `taskId`
  - `subTaskId`
  - `batchId`
  - `dataId`
  - `reason`
  - `confirmRangeType`
  - `fixStatus`
- 观察结论：
  - 转写审核详情页切换 `有效/无效/特殊` 会触发该接口，并随后触发 `subTask/{id}/data` 保存。

## 提交和自动领取

### 1. 提交当前子任务

- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/commit`
- 触发：详情页点击 `提交任务`。
- Request body：
  - `subTaskId`
- 本轮观察：
  - 返回 `200`。
  - 点击后返回审核首页。

### 2. 自动领取下一包

- Method：`POST`
- Path：
  - 标注：`/api/v1/label/center/{taskId}/label/fetch`
  - 审核：`/api/v1/label/center/{taskId}/check/fetch`
- 触发：详情页开启 `自动领取` 时，提交后由平台触发。
- 审核 Request body：
  - `taskId`
  - `type=check`
  - `autoFetch=true`
- 本轮观察：
  - 请求返回 `200`。
  - 未跳转到新详情页，最终回到审核首页。

## 音频请求

- Method：`GET`
- Path：`/oss-proxy-labelx/.../*.wav`
- Response status：常见 `206`
- 签名 query 参数名：
  - `Expires`
  - `OSSAccessKeyId`
  - `Signature`
- 安全要求：
  - 不记录完整 URL。
  - 不记录完整 query。
  - 可记录 hostname、pathname 后缀和是否签名。

## 供应商字段结论

本轮在以下响应中均未发现 `supplier`、`vendor`、`company`、`provider`、`供应商`、`厂商`、`公司` 字段：

- `tasks`
- `subTasks`
- `tasks/process`
- `subTask/{subTaskId}/data`
- `summary`
- `board`
- `getLabelTaskInfo`

当前可用供应商来源只能从任务名推断，例如：

- `棋燊-...`
- `希尔贝壳-...`

后续实现建议的供应商优先级：

1. `payload.supplier` / `payload.vendor`
2. `csvPatch["供应商"]`
3. `taskName` / `name` 前缀规则推断
4. `未识别供应商`

## 待补采

- 转写标注详情页 `missionType=label` 的保存、提交和自动领取链路。
- 转写详情页下拉 `提交并结束` 的真实请求。
- 转写详情页提交失败、必填校验阻断和保存失败响应。
- 转写详情页第 2 页及之后的分页请求。
- 转写详情页 `pageSize` 下拉切换后的真实请求。
- 转写详情页筛选条件变化时 `filter.questions` 的结构。
- 扩展加载并启用后的转写工具栏 DOM 与按钮事件。
- 快判页面在当前项目中的最新实时样例，用于对比历史快判资料是否仍完全适用。
